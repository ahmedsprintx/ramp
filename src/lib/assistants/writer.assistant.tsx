import { createStreamableUI, createStreamableValue } from "ai/rsc";
import { CoreMessage, streamText } from "ai";
import StreamComponent from "@/components/stream-component";
import { getModel } from "@/lib/utils";

import { langfuseNode } from "@/lib/config/langfuse";
import { getAssistantSystemPrompt } from "../utils/prompt-management/get-prompt";
import { MessageRole } from "../types/messages-role.enum";

export async function WriterAssistant(
  uiStream: ReturnType<typeof createStreamableUI>,
  messages: CoreMessage[],
  traceId: string,
  spanId: string
) {
  let fullResponse = "";
  let hasError = false;
  const streamableAnswer = createStreamableValue<string>("");
  const answerSection = <StreamComponent result={streamableAnswer.value} />;
  uiStream.update(answerSection);

  const { prompt, compiledPrompt } = await getAssistantSystemPrompt(
    "writerAgent"
  );

  function cleanMessageArray(messages: any[]) {
    // Check if array is empty
    if (messages.length === 0) return messages;

    // Check if last message is from assistant
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role === MessageRole.ASSISTANT) {
      return messages.slice(0, -1);
    }

    return messages;
  }

  const cleanedMessages = cleanMessageArray(messages);

  const writerGeneration = langfuseNode.generation({
    name: "writer-assistant",
    parentObservationId: spanId,
    input: { messages: { messages } },
    model: getModel().modelId,
    startTime: new Date(),
    traceId: traceId,
    prompt: prompt,
  });
  try {
    const { textStream } = streamText({
      model: getModel(),
      system:
        compiledPrompt +
        `If the response requires a table or visual representation, display it first, followed by any other textual information in a clear and concise format. Don't Include the links from Sandboxes in response. Use the structure of graph in the Context of messages, to display graphs.`,
      messages: messages,
      presencePenalty: 1,
      onFinish: (event) => {
        fullResponse = event.text;
        writerGeneration.end({
          output: { fullResponse },
          usage: event.usage,
        });
        streamableAnswer.done(event.text);
      },
    });

    for await (const text of textStream) {
      if (text) {
        fullResponse += text;
        streamableAnswer.update(fullResponse);
      }
    }
  } catch (err) {
    hasError = true;
    console.log(err);
    fullResponse = "Error: Unknown Error Occurred in Writer assistant";
    streamableAnswer.update(fullResponse);
  }

  return { response: fullResponse, hasError };
}
