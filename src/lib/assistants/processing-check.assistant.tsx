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
  isProcessingRequired: boolean;
  kindOfProcessing: string;
  error?: string;
};

type ProcessingAgent = {
  processingRequired: boolean;
  processingDetails: string;
};

export async function dataProcessingAgent(
  userQuery: string, // updated Messages
  uiStream: ReturnType<typeof createStreamableUI>,
  traceId: string,
  spanId: string
): Promise<ProcessedResponse> {
  let processingAgent: ProcessingAgent = {
    processingRequired: false,
    processingDetails: "",
  };
  let isError = false;
  let error: string | undefined;
  const streamComponent = (
    <Analyzer
      type={"Analyzing"}
      headTitle={"Checking If Data needs Processing......... "}
      details={{
        assistantType: "Data Processing Assistant",
        text: "By calling the appropriate tool, the system ensures efficiency, accuracy, and relevance in its responses, allowing the user to achieve their goal with minimal effort.",
      }}
    />
  );

  uiStream.update(streamComponent);

  const { prompt, compiledPrompt } = await getAssistantSystemPrompt(
    "dateProcessingAgent"
  );

  const dataProcessingAgentGen = langfuseNode.generation({
    name: `Data-Processing-Generation`,
    model: getModel(true).modelId,
    input: [{ role: MessageRole.SYSTEM, content: compiledPrompt }, userQuery],
    traceId: traceId,
    parentObservationId: spanId,
    prompt: prompt,
  });

  //First making an Agent that will identify if further Processing is Required and Generate A code
  try {
    const result = await generateObject({
      model: getModel(true),
      system: compiledPrompt,
      prompt: userQuery,
      schema: z.object({
        furtherProcessingNeeded: z
          .boolean()
          .describe(
            "Indicates whether additional processing is required for forecasting. If true, further processing is necessary; if false, no additional processing is needed."
          ),
        kind: z
          .string()
          .describe(
            "A detailed description of the type of processing required (e.g. forecasting) and how it can be achieved. Provide clear instructions on what kind of processing is needed without introducing new data or columns not explicitly mentioned in the assistant message."
          ),
      }),
    });

    processingAgent.processingRequired = result.object.furtherProcessingNeeded;
    processingAgent.processingDetails = result.object.kind;
    langfuseNode.score({
      name: `Data-Processing-Score`,
      traceId: traceId,
      observationId: dataProcessingAgentGen.id,
      value: 1,
      comment: "Data was successfully processed",
    });

    dataProcessingAgentGen.end({
      output: { role: MessageRole.ASSISTANT, content: result.object },
      usage: result?.usage,
    });

    return {
      isError,
      error,
      isProcessingRequired: processingAgent.processingRequired,
      kindOfProcessing: processingAgent.processingDetails,
    };
  } catch (error) {
    langfuseNode.score({
      name: `Data-Processing-Score`,
      traceId: traceId,
      observationId: dataProcessingAgentGen.id,
      value: 0,
      comment: "Data was not processed",
    });

    dataProcessingAgentGen.end({
      level: "ERROR",
      statusMessage: error as string,
    });
    return {
      error: "Error: " + error,
      isError: true,
      isProcessingRequired: processingAgent.processingRequired,
      kindOfProcessing: processingAgent.processingDetails,
    };
  }
}
