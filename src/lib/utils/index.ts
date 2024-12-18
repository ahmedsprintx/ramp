import { createOpenAI } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import fspromises from "node:fs/promises";
// import path from "node:path";
// import fs from "node:fs";
import { CoreMessage } from "ai";

import { fineTunningAgents } from "./fine-tunning/fine-tunning";
import {
  AgentsType,
  FineTunningType,
  ObjectTypedName,
  SchemaTypedName,
  ToolTypedName,
} from "../types";

export function getModel(useSubModel = false, anthropicUse = false) {
  const openaiApiBase = process.env.OPENAI_API_BASE;
  const openaiApiKey = process.env.OPENAI_API_KEY;

  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

  if (anthropicApiKey && anthropicUse) {
    let anthropicApiModel =
      process.env.ANTHROPIC_API_MODEL || "Claude 3.5 Sonnet";

    if (useSubModel) {
      anthropicApiModel = process.env.ANTHROPIC_API_SUBMODEL || "Claude 3 Opus	";
    }

    return anthropic("claude-3-5-sonnet-20240620");
  }

  // Fallback to OpenAI instead
  let openaiApiModel = process.env.OPENAI_API_MODEL || "gpt-4o";

  if (useSubModel) {
    openaiApiModel = process.env.OPENAI_API_SUBMODEL || "gpt-4o-mini";
  }

  const openai = createOpenAI({
    baseURL: openaiApiBase, // optional base URL for proxies etc.
    apiKey: openaiApiKey, // optional API key, default to env property OPENAI_API_KEY
    organization: "", // optional organization
  });

  return openai.chat(openaiApiModel);
}

export function transformToolMessages(messages: CoreMessage[]): CoreMessage[] {
  return messages.map((message) =>
    message.role === "tool"
      ? {
          ...message,
          role: "assistant",
          content: JSON.stringify(message.content),
          type: "tool",
        }
      : message
  ) as CoreMessage[];
}

// export function getFineTunning(
//   type: FineTunningType,
//   agentName: AgentsType,
//   toolTypedName?: ToolTypedName | ObjectTypedName,
//   parameterTypedName?: SchemaTypedName
// ): string {
//   switch (type) {
//     case "assistant":
//       return fineTunningAgents[agentName]?.system || "";

//     case "tool":
//       return (
//         fineTunningAgents[agentName]?.tool?.[toolTypedName as ToolTypedName]
//           ?.description || ""
//       );

//     case "schema":
//       return (
//         fineTunningAgents[agentName]?.tool?.[toolTypedName as ToolTypedName]
//           ?.parameterSchema?.[parameterTypedName as SchemaTypedName] || ""
//       );

//     case "object":
//       return (
//         fineTunningAgents[agentName]?.objectResponseSchema?.[
//           toolTypedName as ObjectTypedName
//         ] || ""
//       );

//     default:
//       // This return statement should never be reached due to the union type constraint.
//       return "";
//   }
// }

export function generateUniqueFilename(extension: string): string {
  const timestamp = Date.now(); // Get the current timestamp
  const randomNum = Math.floor(Math.random() * 100); // Generate a random number between 0 and 99
  const uniqueFilename = `file_${timestamp}_${randomNum}`;

  return extension ? `${uniqueFilename}.${extension}` : uniqueFilename;
}

export async function storeFileLocally(
  data: Record<string, any>[]
): Promise<Buffer | undefined> {
  try {
    // const json2csvParser = new Parser();
    // const csv: string = json2csvParser.parse(data);

    const jsonData: string = JSON.stringify(data, null, 2);

    // const filename = generateUniqueFilename("json");

    // const uploadsDir = path.join(process.cwd(), "");
    // const filePath = path.join(uploadsDir, filename);

    // if (!fs.existsSync(uploadsDir)) {
    //   await fs.promises.mkdir(uploadsDir, { recursive: true });
    // }

    const fileBuffer: Buffer = Buffer.from(jsonData, "utf-8");

    // await fs.promises.writeFile(filePath, jsonData);

    return fileBuffer;
  } catch (err) {
    console.error("[File Storing issues]", err);
    return undefined;
  }
}

export async function deleteLocalFile(filePath: string) {
  try {
    await fspromises.unlink(filePath);
    console.log(["File deleted successfully"]);
  } catch (err) {
    console.error(`[Error deleting file:] ${err}`);
  }
}

function removeSpecificStructure(inputString: string) {
  // regular expression to match the entire structure
  const pattern = /{\s*"file_links":\s*"\[\[.*?\]\(.*?\)\]"\s*}/g;
  // replace matches with an empty string
  return inputString.replace(pattern, "");
}

function extractFileLinks(inputString: string) {
  const fileLinkMatch = inputString.match(/“file_links”:\s*“([^“]*)“/);
  if (fileLinkMatch) {
    console.log("File Links:", fileLinkMatch[0]);
    return fileLinkMatch[0];
  } else {
    console.log("File Links not found");
    return "";
  }
}
function extractGraphsContent(inputString: string) {
  const graphsMatch = inputString.match(/“graphs”:\s*(\[[\s\S]*?\]\s*\n)/);
  if (graphsMatch) {
    console.log("Graphs Content:", graphsMatch[1]);
    return graphsMatch[1];
  } else {
    console.log("Graphs Content not found");
    return "";
  }
}

export { removeSpecificStructure, extractFileLinks, extractGraphsContent };
