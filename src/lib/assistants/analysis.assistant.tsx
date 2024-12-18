import OpenAI from "openai";
const openai = new OpenAI();
import { createStreamableUI } from "ai/rsc";
import { CoreMessage, ToolResultPart } from "ai";
import { langfuseNode } from "../config/langfuse";
import { MessageRole } from "../types/messages-role.enum";
import Papa from "papaparse";

type AnalysisAgentType = {
  isError: boolean;
  error?: string;
  text?: string;
  json?: any;
};
export async function analysisAssistant(
  userMessage: string,
  toolData: ToolResultPart[],
  uiStream: ReturnType<typeof createStreamableUI>,
  context: CoreMessage[],
  spanId: string,
  traceId: string
): Promise<AnalysisAgentType> {
  const analysisGen = langfuseNode.generation({
    name: `Analysis Agent Generation`,
    input: [{ role: MessageRole.SYSTEM }, context],
    traceId: traceId,
    parentObservationId: spanId,
  });

  const transformedToolData = transformToolDataToCSV(toolData);
  const files = [];
  let hasAnyData = false;

  try {
    for (const [toolName, csvContent] of Object.entries(transformedToolData)) {
      // Get headers even if there's no data
      const headers = csvContent.split("\n")[0];

      // Check if there are any data rows (more than just headers)
      const hasDataRows = csvContent.split("\n").length > 1;
      if (hasDataRows) {
        hasAnyData = true;
      }

      // Use headers only if no data rows exist
      const finalContent = csvContent.trim() || headers;

      console.log(`Processing ${toolName}:`, {
        hasData: hasDataRows,
        headers,
        content: finalContent,
      });

      const blob = new Blob([finalContent], {
        type: "text/csv; charset=utf-8",
      });

      const file = await openai.files.create({
        file: new File([blob], `${toolName}_data.csv`, { type: "text/csv" }),
        purpose: "assistants",
      });

      files.push({
        toolName,
        fileId: file.id,
      });

      analysisGen.event({
        name: `file Stream to openai - ${toolName}`,
        output: file,
        level: "DEFAULT",
      });
    }
  } catch (error) {
    console.error("Error creating files:", error);
    return { isError: true, error: "Error creating files" };
  }

  // Check if we have any valid data to analyze
  if (!hasAnyData) {
    console.log("No analysis required - all results were empty");
    return {
      isError: false,
      text: "No analysis required - all results were empty",
    };
  }

  // If we have some data, proceed with analysis
  const thread = await openai.beta.threads.create();

  analysisGen.event({
    name: "thread Made on",
    output: thread,
    level: "DEFAULT",
  });

  // Send context messages
  const contextMessages = transformContextToJson(context);
  const messagesWithoutLast = contextMessages.slice(0, -1);
  for (const msg of messagesWithoutLast) {
    await openai.beta.threads.messages.create(thread.id, {
      role: msg.role as "user" | "assistant",
      content: JSON.stringify(msg.content),
    });
  }

  // Create message with all file attachments
  const message = await openai.beta.threads.messages.create(thread.id, {
    role: "user",
    content: userMessage,
    attachments: files.map((file) => ({
      file_id: file.fileId,
      tools: [{ type: "code_interpreter" }],
    })),
  });

  const run = openai.beta.threads.runs
    .stream(thread.id, {
      assistant_id: "asst_hJfzTMCPjKQVFuf1ExnOGJmb",
      tool_choice: "required",
    })
    .on("textCreated", (text) => console.log("\nassistant > "))
    .on("textDelta", (textDelta, snapshot) =>
      console.log(textDelta.value ?? "")
    )
    .on("toolCallCreated", (toolCall) =>
      console.log(`\nassistant > ${toolCall.type}\n\n`)
    )
    .on("toolCallDelta", (toolCallDelta, snapshot) => {
      if (toolCallDelta.type === "code_interpreter") {
        if (toolCallDelta.code_interpreter?.input) {
          console.log(toolCallDelta.code_interpreter.input);
        }
        if (toolCallDelta.code_interpreter?.outputs) {
          console.log("\noutput >\n");
          toolCallDelta.code_interpreter.outputs.forEach((output) => {
            if (output.type === "logs") {
              console.log(`\n${output.logs}\n`);
            }
          });
        }
      }
    });

  const finalMessages = await run.finalMessages();
  analysisGen.event({
    name: "finalMessages",
    output: finalMessages,
    level: "DEFAULT",
  });

  const length = finalMessages.length;
  const lastMessage = finalMessages[length - 1];

  // Clean up files
  try {
    await Promise.all(files.map((file) => openai.files.del(file.fileId)));
  } catch (error) {
    console.error("Error deleting files:", error);
  }
  console.log({
    annotations: lastMessage.content[0],
  });

  if (lastMessage.content[0].type === "text") {
    let processedToolResponse = {};

    try {
      // Ensure the structure we expect exists
      const annotations = lastMessage?.content?.[0]?.text?.annotations;
      if (!annotations?.length) {
        // If no annotations are found, set processedToolResponse to empty and return early
        processedToolResponse = {};
        return { isError: false };
      }

      // 1. Fetch files using their file IDs
      const fileFetchPromises = annotations.map((annotation) => {
        //@ts-ignore
        const fileId = annotation?.file_path?.file_id;
        if (!fileId) {
          console.warn("Annotation missing file_id:", annotation);
          return Promise.resolve(null); // Resolve to null if no file_id
        }
        return openai.files.content(fileId).catch((err) => {
          console.error("Error fetching file content:", err);
          return null;
        });
      });

      const fileContents = await Promise.all(fileFetchPromises);

      // 2. Convert the fetched file streams to text
      const textPromises = fileContents.map((fileStream, idx) => {
        if (!fileStream) {
          console.warn(`Skipping file at index ${idx}, no content available`);
          return Promise.resolve(null);
        }
        return fileStream.text().catch((err) => {
          console.error("Error converting file stream to text:", err);
          return null;
        });
      });
      const filesText = await Promise.all(textPromises);

      // 3. Parse CSV data into JSON using Papa.parse
      const parsedDataPromises = filesText.map((csvData, idx) => {
        if (!csvData) {
          console.warn(
            `Skipping parsing for file at index ${idx}, no text content`
          );
          return Promise.resolve(null);
        }
        try {
          const parsed = Papa.parse(csvData, {
            header: true,
            skipEmptyLines: true,
          });
          return Promise.resolve(parsed.data);
        } catch (err) {
          console.error("Error parsing CSV data:", err);
          return Promise.resolve(null);
        }
      });

      const parsedJSONData = await Promise.all(parsedDataPromises);

      // 4. Construct the processedToolResponse object by mapping each filename to its parsed data
      processedToolResponse = annotations.reduce((acc, annotation, index) => {
        const filename = annotation?.text?.split("/")?.pop() || `file_${index}`;
        //@ts-ignore
        acc[filename] = parsedJSONData[index] || [];
        return acc;
      }, {});
      // Optional: If you want to delete the files after processing
      await Promise.all(
        annotations.map((annotation) => {
          //@ts-ignore
          const fileId = annotation?.file_path?.file_id;
          if (fileId) {
            return openai.files.del(fileId);
          }
          return null;
        })
      );
    } catch (error) {
      console.error("An error occurred while processing tool response:", error);
      processedToolResponse = {};
    }

    analysisGen.end({
      name: `${lastMessage.content[0].type} Generated By analysis Agent`,
      output: [
        {
          role: MessageRole.ASSISTANT,
          content: {
            text: lastMessage.content[0].text?.value,
            json: processedToolResponse,
          },
        },
      ],
      statusMessage: "Success",
    });

    return {
      isError: false,
      text: lastMessage.content[0].text?.value,
      json: processedToolResponse,
    };
  }

  // if (lastMessage.content[0].type === "image_url") {
  //   analysisGen.end({
  //     name: `${lastMessage.content[0].type} Generated By analysis Agent`,
  //     output: [
  //       {
  //         role: MessageRole.ASSISTANT,
  //         content: lastMessage.content[0].image_url.url,
  //       },
  //     ],
  //     statusMessage: "Success",
  //   });
  //   return {
  //     isError: false,
  //     text: lastMessage.content[0].image_url.url,
  //   };
  // }

  // if (lastMessage.content[0].type === "image_file") {
  //   analysisGen.end({
  //     name: `${lastMessage.content[0].type} Generated By analysis Agent`,
  //     output: [
  //       {
  //         role: MessageRole.ASSISTANT,
  //         content: lastMessage.content[0].image_file.file_id,
  //       },
  //     ],
  //     statusMessage: "Success",
  //   });
  //   return {
  //     isError: false,
  //     text: lastMessage.content[0].image_url.url,
  //   };
  // }

  return {
    isError: false,
  };
}

function transformContextToJson(context: CoreMessage[]) {
  const jsonData = context
    .filter(
      (message) =>
        message.role === "assistant" ||
        message.role === "user" ||
        message.role === "tool"
    )
    .map((message) => ({
      role: message.role === "tool" ? "assistant" : message.role,
      content: message.content,
    }));
  return jsonData;
}

export function transformToolDataToCSV(toolData: ToolResultPart[]) {
  const csvData: Record<string, string> = {};

  toolData.forEach((tool, index) => {
    // Add index to toolName to make it unique
    const toolName = `${tool.toolName || "unnamed_tool"}_${index + 1}`;
    const data =
      (tool?.result as { data: unknown })?.data || tool?.result || tool;

    // If we have an array with at least one object, use its keys as headers
    if (
      Array.isArray(data) &&
      data.length > 0 &&
      typeof data[0] === "object" &&
      data[0] !== null
    ) {
      const headers = Object.keys(data[0]);
      const csvRows = [headers.join(",")];

      // Add data rows if they exist
      data.forEach((row) => {
        const values = headers.map((header) => {
          const value = (row as any)[header];
          return formatCSVValue(value);
        });
        csvRows.push(values.join(","));
      });

      csvData[toolName] = csvRows.join("\n");
    }
    // If we have an empty array but know the expected structure from meta
    else if (
      tool?.result &&
      typeof tool.result === "object" &&
      "meta" in tool.result &&
      Array.isArray(tool.result.meta) &&
      tool.result.meta.length > 0
    ) {
      const headers = tool.result.meta.map((m: { name: string }) => m.name);
      csvData[toolName] = headers.join(",");
    }
  });

  return csvData;
}

/**
 * Formats a value for CSV output, handling different data types
 * @param value Value to format
 * @returns Formatted string for CSV
 */
function formatCSVValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    // Escape quotes and wrap in quotes if needed
    const escaped = value.replace(/"/g, '""');
    return /[,"\n\r]/.test(value) ? `"${escaped}"` : escaped;
  }

  return String(value);
}
