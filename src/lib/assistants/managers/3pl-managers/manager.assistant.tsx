import { CoreMessage, generateText, ToolCallPart, ToolResultPart } from "ai";
import { createStreamableUI } from "ai/rsc";
import { langfuseNode } from "@/lib/config/langfuse";

import { getModel } from "@/lib/utils";
import { ManagerKindResponse } from "..";

import { getTools } from "@/lib/tools";
import { AgentsType } from "@/lib/types";
import { z } from "zod";
import Analyzer from "@/components/analyzer";
import { getManagerSystemPrompt } from "@/lib/utils/prompt-management/get-prompt";
import { MessageRole } from "@/lib/types/messages-role.enum";

export async function managerAssistant(
  manager: AgentsType,
  uiStream: ReturnType<typeof createStreamableUI>,
  instructions: string,
  company_url: string,
  traceId: string,
  spanId: string
): Promise<ManagerKindResponse> {
  let fullResponse = "";
  let hasError = false;
  let toolsUsed: string[] = [];
  let managerResponse: CoreMessage[] = [];
  let roundTrips = 0;

  const streamComponent = (
    <Analyzer
      type={"Analyzing"}
      headTitle={"Making accurate tool call......... "}
      details={{
        assistantType: "Manager Assistant",
        text: "By calling the appropriate tool, the system ensures efficiency, accuracy, and relevance in its responses, allowing the user to achieve their goal with minimal effort.",
      }}
    />
  );

  console.log("manager =========================", manager);
  uiStream.update(streamComponent);

  const { prompt, compiledPrompt } = await getManagerSystemPrompt(manager);

  const managerGen = langfuseNode.generation({
    name: `${manager} Generation`,
    model: getModel(true).modelId,
    input: [
      { role: MessageRole.SYSTEM, content: compiledPrompt },
      {
        role: "user",
        content: instructions,
      },
    ],
    traceId: traceId,
    parentObservationId: spanId,
    prompt: prompt,
  });

  try {
    if (
      [
        "customerFacingAgent",
        "orderAgent",
        "inventoryAgent",
        "productAgent",
        "inBoundShipmentAgent",
      ].includes(manager)
    ) {
      roundTrips = 2;
    }

    const result: any = await generateText({
      model: getModel(true),
      system:
        compiledPrompt +
        "\n\n" +
        "Be aware of followup questions that require the same data",
      prompt: instructions,
      tools: getTools(manager, {
        uiStream,
        fullResponse,
        company_url: company_url,
      }),
      toolChoice: "required",
      frequencyPenalty: -1,
      // maxToolRoundtrips: roundTrips,
      maxRetries: 2,
    }).catch((err) => {
      hasError = true;
      fullResponse = "Error: " + err.message;
      managerGen.end({
        output: fullResponse,
        level: "ERROR",
        statusMessage: err.message,
      });
    });

    if (!result) {
      managerGen.end({
        output: fullResponse,
        level: "ERROR",
        statusMessage: "No result",
      });
      return {
        error: fullResponse,
        isError: true,
        toolResponses: [],
        toolCalls: [],
      };
    }
    let toolCalls: ToolCallPart[] = [];
    let toolResponses: ToolResultPart[] = [];
    const normalizedToolResponses = result.toolResults.map(
      (response: ToolResultPart) => ({
        ...response,
        result: response.result === undefined ? { data: [] } : response.result,
      })
    );
    toolCalls = result.toolCalls;
    //toolResponses = result.toolResults;
    toolsUsed = toolResponses.map((tool) => tool.toolName);
    managerResponse = result.responseMessages;

    managerGen.end({
      output: [
        { role: MessageRole.ASSISTANT, content: result?.text },
        { toolResponses: normalizedToolResponses, toolCalls: toolCalls },
      ],
      statusMessage: "Success",
      usage: result?.usage,
      metadata: {
        "Tools Used": toolsUsed,
      },
    });

    return {
      error: ``,
      isError: false,
      toolResponses: normalizedToolResponses,
      toolCalls,
      toolsUsed,
      managerResponse,
    };
  } catch (error) {
    console.error(error);
    managerGen.end({
      output: fullResponse,
      level: "ERROR",
      statusMessage: error as string,
    });
    return {
      error: "Error: " + error,
      isError: true,
      toolResponses: [],
      toolCalls: [],
    };
  }
}
