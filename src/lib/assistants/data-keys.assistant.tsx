import { CoreMessage, generateObject } from "ai";

import { getModel } from "@/lib/utils";
import { createStreamableUI } from "ai/rsc";
import Analyzer from "@/components/analyzer";
import { getAssistantSystemPrompt } from "../utils/prompt-management/get-prompt";
import { langfuseNode } from "../config/langfuse";
import { MessageRole } from "../types/messages-role.enum";
import { z } from "zod";

// Types for function returns
type ProcessedResponse = {
  isError: boolean;
  keysOfData: string;
  error?: string;
};

export async function dataKeysAssistant(
  messages: CoreMessage[], // updated Messages
  uiStream: ReturnType<typeof createStreamableUI>,
  traceId: string,
  spanId: string
): Promise<ProcessedResponse> {
  let keysOfData = "";
  let isError = false;
  let error: string | undefined;
  const streamComponent = (
    <Analyzer
      type={"Analyzing"}
      headTitle={"Validating Keys from data Schema......... "}
      details={{
        assistantType: "Data keys Assistant",
        text: "By calling the appropriate tool, the system ensures efficiency, accuracy, and relevance in its responses, allowing the user to achieve their goal with minimal effort.",
      }}
    />
  );

  uiStream.update(streamComponent);

  const { prompt, compiledPrompt } = await getAssistantSystemPrompt(
    "dataKeysAgent"
  );

  const dataKeysAgentGen = langfuseNode.generation({
    name: `Data-Keys-Generation`,
    model: getModel(true).modelId,
    input: [
      { role: MessageRole.SYSTEM, content: compiledPrompt },
      messages[messages.length - 1].content,
    ],
    traceId: traceId,
    parentObservationId: spanId,
    prompt: prompt,
  });

  //First making an Agent that will identify if further Processing is Required and Generate A code
  try {
    const result = await generateObject({
      model: getModel(true),
      system: compiledPrompt,
      messages: messages,
      schema: z.object({
        keys: z
          .string()
          .describe(
            "Get the comma separated keys from data in assistant message to used for the kind of Calculation"
          ),
      }),
    });
    keysOfData = result.object.keys;

    dataKeysAgentGen.end({
      output: { role: MessageRole.ASSISTANT, content: keysOfData },
      usage: result.usage,
    });

    return {
      isError,
      error,
      keysOfData,
    };
  } catch (error) {
    dataKeysAgentGen.end({
      output: { role: MessageRole.ASSISTANT, content: "Error: " + error },
      level: "ERROR",
      statusMessage: error as string,
    });
    return {
      error: "Error: " + error,
      isError: true,
      keysOfData,
    };
  }
}
