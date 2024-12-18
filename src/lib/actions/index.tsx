"use server";

import { CoreMessage, generateId, ToolResultPart } from "ai";
import {
  createAI,
  createStreamableUI,
  createStreamableValue,
  getAIState,
  getMutableAIState,
  StreamableValue,
} from "ai/rsc";
import { v4 as uuid } from "uuid";
import { Chat, AIMessage } from "@/lib/types";
import { saveChat } from "@/lib/chat";
import {
  InquiryAssistant,
  WriterAssistant,
  analysisAssistant,
  fileProcessingAgent,
  fileProgrammer,
} from "@/lib/assistants";
import { ErrorCard } from "@/components/error-card";
import { cookies } from "next/headers";
import { UserMessage } from "@/components/user-message";
import { BotMessage } from "@/components/bot-message";
import { langfuseNode } from "@/lib/config/langfuse";
import { User } from "@propelauth/nextjs/client";
import { createLocalFileAndUploadToS3 } from "../utils/s3/upload-file";
import { MessageRole } from "../types/messages-role.enum";

function limitToolData(messages: any) {
  return messages?.map((message: any) => {
    if (message.role === MessageRole.TOOL) {
      message.content = Array.isArray(message?.content)
        ? message.content.map((contentItem: any) => {
            if (
              contentItem.type === MessageRole.TOOL_RESULT &&
              contentItem?.result?.data
            ) {
              if (
                Array.isArray(contentItem?.result?.data) &&
                contentItem.result.data.length > 100
              ) {
                contentItem.result.data = contentItem.result.data.slice(0, 100);
              }
            }
            return contentItem;
          })
        : typeof message?.content === "string"
        ? message?.content
        : [];
    }
    return message;
  });
}

async function onSubmitMessage(
  userMessageId: string,
  user: User,
  accessToken: string,
  formData?: FormData,
  company_url?: string,
  orgType?: string,
  retryMessages?: AIMessage[],
  isEdited?: boolean
) {
  "use server";

  // const integration = { company_url: "heftlogistics_Packiyo", brandId: "" }; //Structure for Company_url =
  // const orgType = "3pl"; // 3pl or brand

  const aiState = getMutableAIState<typeof AI>();
  const uiStream = createStreamableUI();
  const isGenerating = createStreamableValue(true);
  let traceId = "";
  let spanId = "";
  let tags: string[] = [];

  const aiMessages = [...(retryMessages ?? aiState.get().messages)];

  const messages: CoreMessage[] = aiMessages.map((message) => {
    const { role, content } = message;
    return { role, content } as CoreMessage;
  });

  const groupId = generateId();

  const chatId = aiState.get().chatId || uuid();

  const userInput = formData?.get("input") as string;
  const content = formData
    ? JSON.stringify(Object.fromEntries(formData))
    : null;
  const type = formData?.has("input") ? "input" : "inquiry";

  const trace = langfuseNode.trace({
    name: "chat_interaction",
    input: formData?.get("input") as string,
    userId: user.email,
    sessionId: accessToken,
    metadata: {
      id: groupId,
      email: user.email,
    },
  });

  traceId = trace.id;

  if (content) {
    aiState.update({
      ...aiState.get(),
      chatId: chatId,
      messages: [
        ...(isEdited
          ? aiState.get().messages.slice(0, -2)
          : aiState.get().messages),
        {
          id: userMessageId,
          role: MessageRole.USER,
          content,
          type,
        },
      ],
    });
    messages.push({
      role: MessageRole.USER,
      content,
    });

    await flushLangfuseWithRetry();
  }

  async function processUserQuery() {
    const streamText = createStreamableValue<string>();
    let answer = "";
    let toolOutputs: ToolResultPart[] = [];
    let errorOccurred = false;
    let errorDetails;

    const inquirySpan = langfuseNode.span({
      name: "inquiry-agent-function",
      startTime: new Date(),
      input: { chatHistory: { messages }, orgType: { orgType } },
      traceId: traceId,
    });

    //Inquiry Assistant
    const { isError, error, toolResponses } = await InquiryAssistant(
      messages,
      uiStream,
      company_url || "",
      orgType,
      traceId
    );
    let processedToolData: any;

    errorOccurred = isError;
    errorDetails = `from InquiryAssistant ${error}`;
    toolOutputs = toolResponses;

    if (toolOutputs?.length) {
      const context = messages;
      const analysisSpan = trace.span({
        name: "get-desired-manager",
        input: {
          messages: { context },
          toolOutputs,
        },
        metadata: {
          company_url,
        },
      });

      spanId = analysisSpan.id;

      const { text, json, isError, error } = await analysisAssistant(
        userInput,
        toolOutputs,
        uiStream,
        context,
        spanId,
        traceId
      );

      if (json && !Array.isArray(processedToolData) && !isError) {
        processedToolData = Object.values(json);
      }
      console.log(text, json);
      // const modifiedSummary = removeSpecificStructure(text || "");
      // const fileLinks = extractFileLinks(text || "");
      // const graphs = extractGraphsContent(text || "");
      // console.log({ modifiedSummary, fileLinks, graphs });

      const toolID = uuid();
      messages.push({
        role: MessageRole.ASSISTANT,
        content: [
          {
            type: "tool-call",
            toolCallId: toolID,
            toolName: "answer-analysis-agent",
            args: {},
          },
        ],
      });
      messages.push({
        role: MessageRole.TOOL,
        content: [
          {
            type: "tool-result",
            toolCallId: toolID,
            toolName: "answer-analysis-agent",
            result: text ? text : "",
          },
        ],
      });
    }

    let isFileRequired;
    let kindOfFile;

    const lastTenMessages = messages.slice(-10);
    if (!errorOccurred && processedToolData?.length) {
      console.log("File Check Agent");
      const limitedMessages = limitToolData(lastTenMessages);

      const fileProcessingSpan = trace.span({
        name: "File-Check-Agent",
        input: {
          role: MessageRole.USER,
          content: limitedMessages,
          processedToolData,
        },
      });
      spanId = fileProcessingSpan.id;

      const {
        isError,
        error,
        isFileDownloadRequired,
        kindOfFile: _kindOfFile,
      } = await fileProcessingAgent(userInput, uiStream, traceId, spanId);

      isFileRequired = isFileDownloadRequired;
      kindOfFile = _kindOfFile;
      errorOccurred = isError;
      errorDetails = `from fileProcessingAgent : ${error}`;

      if (errorOccurred) {
        fileProcessingSpan.end({
          output: error,
          level: "ERROR",
        });
      } else {
        fileProcessingSpan.end({
          output: {
            role: MessageRole.ASSISTANT,
            content: kindOfFile,
            isFileRequired,
          },
        });
      }
      console.log({ isError, error, isFileDownloadRequired, kindOfFile });
    }

    // file-Programmer Assistant
    if (
      isFileRequired &&
      kindOfFile &&
      processedToolData.length > 0 &&
      !errorOccurred
    ) {
      const toolResultData = processedToolData;
      const modifiedMessages = [...messages];
      const limitedMessages = limitToolData(modifiedMessages);
      const fileProgrammerSpan = trace.span({
        name: "file-programmer",
        input: { limitedMessages, kindOfFile, toolResultData },
      });
      spanId = fileProgrammerSpan.id;

      const { isError, s3_link, error } = await fileProgrammer(
        limitedMessages,
        kindOfFile,
        uiStream,
        toolResultData,
        traceId,
        spanId,
        //@ts-ignore
        user?.properties?.metadata?.orgId
      );

      errorOccurred = isError;
      errorDetails = `from fileProgrammer ${error}`;

      if (!errorOccurred) {
        fileProgrammerSpan.end({
          output: s3_link,
        });
      } else {
        fileProgrammerSpan.end({
          output: error,
          level: "ERROR",
        });
      }

      console.log({ isError, s3_link, error });

      const toolCallId = uuid();

      messages.push({
        role: MessageRole.ASSISTANT,
        content: [
          {
            args: {},
            type: "tool-call",
            toolName: "generateFile",
            toolCallId: toolCallId,
          },
        ],
      });

      messages.push({
        role: MessageRole.TOOL,
        content: [
          {
            type: "tool-result",
            toolCallId: toolCallId,
            toolName: "generateFile",
            result: s3_link
              ? s3_link
              : "There is no Link Generated by Programmer Assistant ",
            isError: errorOccurred,
          },
        ],
      });
    }

    let s3_links: any[] = [];
    let MAX_LIMIT = 200;

    const isProcessedDataArray = Array.isArray(processedToolData);
    console.log({ isProcessedDataArray });
    // Check if any child array in processedToolData has a length greater than 10
    if (isProcessedDataArray) {
      const hasLargeArray = processedToolData.some((childArray: any) => {
        console.log(childArray.length);
        return parseInt(childArray.length) > MAX_LIMIT;
      });
      console.log({ hasLargeArray });

      if (hasLargeArray) {
        // Iterate over processedToolData using a for...of loop
        for (let i = 0; i < processedToolData.length; i++) {
          const data = processedToolData[i];
          try {
            if ((data || Array.isArray(data)) && data.length > 0) {
              const fileName = `/${
                //@ts-ignore
                user?.properties?.metadata?.orgId
              }/data_tables/data_${uuid()}.json`;
              const s3_link = await createLocalFileAndUploadToS3(
                data,
                fileName
              ); // Upload to S3
              s3_links.push(s3_link); // Collect the S3 link
            }
          } catch (error) {
            console.error("Error creating file and uploading to S3:", error);
            errorOccurred = true;
            errorDetails = "Failed to create and upload file to S3";
            break; // Exit the loop if an error occurs
          }
        }

        if (s3_links.length > 0) {
          const toolID = uuid();

          messages.push({
            role: "assistant",
            content: [
              {
                args: {},
                type: "tool-call",
                toolName: "custom-table",
                toolCallId: toolID,
              },
            ],
          });

          messages.push({
            role: "tool",
            content: [
              {
                type: "tool-result",
                toolCallId: toolID,
                toolName: "custom-table",
                result:
                  s3_links.length > 0 ? `${s3_links}` : "There are no Links",
                isError: errorOccurred,
              },
            ],
          });
        }
      } else {
        const toolID = uuid();

        messages.push({
          role: "assistant",
          content: [
            {
              args: {},
              type: "tool-call",
              toolName: "processed_data",
              toolCallId: toolID,
            },
          ],
        });

        messages.push({
          role: "tool",
          content: [
            {
              type: "tool-result",
              toolCallId: toolID,
              toolName: "processed_data",
              result: JSON.stringify(processedToolData),
              isError: errorOccurred,
            },
          ],
        });
      }
    }

    //Writer Assistant
    if (!errorOccurred) {
      const limitedMessages = limitToolData(messages);

      const writerSpan = trace.span({
        name: "writer-agent",
        input: { limitedMessages },
      });
      spanId = writerSpan.id;

      const { response, hasError } = await WriterAssistant(
        uiStream,
        limitedMessages,
        traceId,
        spanId
      );

      answer = response;
      errorOccurred = hasError;

      if (errorOccurred) {
        writerSpan.end({
          output: error,
          level: "ERROR",
        });
      } else {
        writerSpan.end({
          output: response,
        });
      }
    }

    if (!errorOccurred) {
      streamText.done();
      aiState.update({
        ...aiState.get(),
        messages: [
          ...aiState.get().messages,
          {
            //will change to group
            id: generateId(),
            role: MessageRole.ASSISTANT,
            content: answer,
            type: "answer",
          },
        ],
      });
      trace.update({
        output: answer,
        tags: ["success", ...tags],
      });
    } else {
      aiState.update(aiState.get());
      streamText.done();
      uiStream.update(
        <ErrorCard
          errorMessage={
            answer ||
            errorDetails ||
            "An error occurred while Generating your Response. Please try again."
          }
        />
      );
      trace.update({
        output:
          answer || errorDetails || "An error occurred. Please try again.",
        tags: ["error", ...tags],
      });
    }

    aiState.done(aiState.get());
    isGenerating.done(false);
    uiStream.done();
  }

  processUserQuery();

  return {
    id: generateId(),
    isGenerating: isGenerating.value,
    component: uiStream.value,
  };
}

async function flushLangfuseWithRetry(maxRetries = 3, delay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await langfuseNode.flush();
      console.log("Langfuse data flushed successfully");
      return;
    } catch (error) {
      console.error(`Error flushing Langfuse data (attempt ${i + 1}):`, error);
      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  console.error(`Failed to flush Langfuse data after ${maxRetries} attempts`);
}

export type AIState = {
  messages: AIMessage[];
  chatId: string;
  isSharePage?: boolean;
  orgType?: string;
};

export type UIState = {
  id: string;
  component: React.ReactNode;
  isGenerating?: StreamableValue<boolean>;
}[];

const initialAIState: AIState = {
  chatId: generateId(),
  messages: [],
};

const initialUIState: UIState = [];

export const AI = createAI<AIState, UIState>({
  actions: {
    onSubmitMessage,
  },
  initialUIState,
  initialAIState,
  onGetUIState: async () => {
    "use server";

    const aiState = getAIState();
    if (aiState) {
      const uiState = getUIStateFromAIState(aiState as Chat);
      return uiState;
    } else {
      return;
    }
  },
  onSetAIState: async ({ state, done }) => {
    "use server";
    const { chatId, messages, orgType } = state;
    const cookieUserId = cookies()
      .getAll()
      ?.find((cookie) => cookie?.name === "userID");

    const createdAt = new Date();
    const userId = `${cookieUserId?.value}`;
    const path = `/chat/${chatId}`;
    const title =
      messages.length > 0
        ? JSON.parse(messages[0]?.content)?.input?.substring(0, 100) ||
          "Untitled"
        : "Untitled";

    const updatedMessages: AIMessage[] = [
      ...messages,
      {
        id: generateId(),
        role: "assistant",
        content: `end`,
        type: "end",
      },
    ];

    const chat: Chat = {
      id: chatId,
      createdAt,
      userId,
      path,
      title,
      orgType: orgType || "3pl",
      messages: updatedMessages,
    };
    if (cookieUserId) {
      await saveChat(chat, `${cookieUserId?.value}`);
    }
  },
});

export const getUIStateFromAIState = (aiState: Chat) => {
  const chatId = aiState.chatId;
  const isSharePage = aiState.isSharePage;
  return aiState.messages
    .map((message, index) => {
      const { role, content, id, type, name } = message;
      if (
        !type ||
        type === "end" ||
        (isSharePage && type === "related") ||
        (isSharePage && type === "followup")
      )
        return null;

      switch (role) {
        case "user":
          switch (type) {
            case "input":
            case "input_related":
              const json = JSON.parse(content);
              const value = type === "input" ? json.input : json.related_query;
              return {
                id,
                component: (
                  <UserMessage message={value} chatId={chatId} messageId={id} />
                ),
              };
          }
        case "assistant":
          const answer = createStreamableValue();
          answer.done(content);
          switch (type) {
            case "answer":
              return {
                id,
                component: <BotMessage content={content} />,
              };
          }
        default:
          return {
            id,
            component: null,
          };
      }
    })
    .filter((message) => message !== null) as UIState;
};
