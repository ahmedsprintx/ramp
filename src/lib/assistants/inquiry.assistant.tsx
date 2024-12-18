import { CoreMessage, generateObject, generateText, tool } from "ai";
import { createStreamableUI } from "ai/rsc";
import { z } from "zod";

import { getModel } from "@/lib/utils";
import { langfuseNode } from "@/lib/config/langfuse";
import Analyzer from "@/components/analyzer";
import { MessageRole } from "../types/messages-role.enum";
// import { getDesiredManager } from "./managers";
import { managerAssistant } from "./managers/3pl-managers";

export async function InquiryAssistant(
  messages: CoreMessage[], // updated Messages
  uiStream: ReturnType<typeof createStreamableUI>, // updated Messages
  integration: any,
  orgType?: string,
  traceId?: string
) {
  let error: string | undefined;
  let isError: boolean = false;

  let toolResponses: any = [];

  const streamComponent = (
    <Analyzer
      type={"Analyzing"}
      headTitle={"Analyzing User Query......."}
      details={{
        assistantType: "Inquiry Assistant",
        text: "The system is in the process of evaluating the user’s input to determine the exact nature of the request. This step involves parsing the query, identifying key phrases, and understanding the context to generate an appropriate response or action",
      }}
    />
  );
  uiStream.update(streamComponent);

  const inquirySpan = langfuseNode.span({
    name: "inquiry-agent-function",
    startTime: new Date(),
    input: { chatHistory: { messages }, orgType: { orgType } },
    traceId: traceId,
  });
  langfuseNode.flush();
  //Geting the Prompt for inquiryAssistant
  const prompt = await langfuseNode.getPrompt("inquiryAgent");
  const compiledPrompt = prompt.compile({});

  const inquiryGeneration = inquirySpan.generation({
    name: "inquiry-generation",
    input: [
      { role: MessageRole.SYSTEM, content: compiledPrompt },
      {
        role: MessageRole.USER,
        content: messages[messages.length - 1].content,
      },
    ],
    model: getModel().modelId,
    prompt: prompt,
  });

  try {
    const result = await generateText({
      model: getModel(),
      system: compiledPrompt,
      messages,
      toolChoice: "required",
      temperature: 0.5,
      tools: {
        inventoryOptimizationAgent: tool({
          description:
            "This tool is used to get the inventory optimization agent answer",
          parameters: z.object({
            instructions: z.string(),
          }),
          execute: async ({ instructions }) => {
            return await managerAssistant(
              "inventoryOptimizationAgent",
              uiStream,
              instructions,
              integration,
              "traceId",
              "1"
            );
          },
        }),
        orderFulfillmentAgent: tool({
          description:
            "This tool is used to get the order fulfillment agent answer",
          parameters: z.object({
            instructions: z.string(),
          }),
          execute: async ({ instructions }) => {
            return await managerAssistant(
              "orderFulfillmentAgent",
              uiStream,
              instructions,
              integration,
              "traceId",
              "1"
            );
          },
        }),
        demandForecastingAgent: tool({
          description:
            "This tool is used to get the demand forecasting agent answer",
          parameters: z.object({
            instructions: z.string(),
          }),
          execute: async ({ instructions }) => {
            return await managerAssistant(
              "demandForecastingAgent",
              uiStream,
              instructions,
              integration,
              "traceId",
              "1"
            );
          },
        }),
        // supplierPerformanceAgent: tool({
        //   description:
        //     "This tool is used to get the supplier performance agent answer",
        //   parameters: z.object({
        //     instructions: z.string(),
        //   }),
        //   execute: async ({ instructions }) => {
        //     return await managerAssistant(
        //       "supplierPerformanceAgent",
        //       uiStream,
        //       instructions,
        //       integration,
        //       "traceId",
        //       "1"
        //     );
        //   },
        // }),
        routeOptimizationAgent: tool({
          description:
            "This tool is used to get the route optimization agent answer",
          parameters: z.object({
            instructions: z.string(),
          }),
          execute: async ({ instructions }) => {
            return await managerAssistant(
              "routeOptimizationAgent",
              uiStream,
              instructions,
              integration,
              "traceId",
              "1"
            );
          },
        }),
        procurementAgent: tool({
          description: "This tool is used to get the procurement agent answer",
          parameters: z.object({
            instructions: z.string(),
          }),
          execute: async ({ instructions }) => {
            return await managerAssistant(
              "procurementAgent",
              uiStream,
              instructions,
              integration,
              "traceId",
              "1"
            );
          },
        }),
        carrierPerformanceAgent: tool({
          description:
            "This tool is used to get the carrier performance agent answer",
          parameters: z.object({
            instructions: z.string(),
          }),
          execute: async ({ instructions }) => {
            return await managerAssistant(
              "carrierPerformanceAgent",
              uiStream,
              instructions,
              integration,
              "traceId",
              "1"
            );
          },
        }),
        returnsManagementAgent: tool({
          description:
            "This tool is used to get the returns management agent answer",
          parameters: z.object({
            instructions: z.string(),
          }),
          execute: async ({ instructions }) => {
            return await managerAssistant(
              "returnsManagementAgent",
              uiStream,
              instructions,
              integration,
              "traceId",
              "1"
            );
          },
        }),
        billingAndFinancialAnalysisAgent: tool({
          description:
            "This tool is used to get the billing and financial analysis agent answer",
          parameters: z.object({
            instructions: z.string(),
          }),
          execute: async ({ instructions }) => {
            return await managerAssistant(
              "billingAndFinancialAnalysisAgent",
              uiStream,
              instructions,
              integration,
              "traceId",
              "1"
            );
          },
        }),
        operationsSupervisorAgent: tool({
          description:
            "This tool is used to get the operations supervisor agent answer",
          parameters: z.object({
            instructions: z.string(),
          }),
          execute: async ({ instructions }) => {
            return await managerAssistant(
              "operationsSupervisorAgent",
              uiStream,
              instructions,
              integration,
              "traceId",
              "1"
            );
          },
        }),
        customerServiceSupervisorAgent: tool({
          description:
            "This tool is used to get the customer service supervisor agent answer",
          parameters: z.object({
            instructions: z.string(),
          }),
          execute: async ({ instructions }) => {
            return await managerAssistant(
              "customerServiceSupervisorAgent",
              uiStream,
              instructions,
              integration,
              "traceId",
              "1"
            );
          },
        }),
        customerServiceAgent: tool({
          description:
            "This tool is used to get the customer service agent answer",
          parameters: z.object({
            instructions: z.string(),
          }),
          execute: async ({ instructions }) => {
            return await managerAssistant(
              "customerServiceAgent",
              uiStream,
              instructions,
              integration,
              "traceId",
              "1"
            );
          },
        }),
        supplierAgent: tool({
          description:
            "This tool is used to get the supplier agent answer",
          parameters: z.object({
            instructions: z.string(),
          }),
          execute: async ({ instructions }) => {
            return await managerAssistant(
              "supplierAgent",
              uiStream,
              instructions,
              integration,
              "traceId",
              "1"
            );
          },
        }),
      },
    });

    if (result?.toolResults?.length) {
      const toolContents = result.toolResults
        .map((toolResult) => toolResult.result?.toolResponses)
        .flat();

      console.log("Tool Contents =======>>>", { toolContents });
      toolResponses = toolContents;
      return { isError: false, error: "", toolResponses: toolResponses };
    }
  } catch (error) {
    console.log(error);
    return { isError: true, error: error, toolResponses: [] };
  }

  return { isError: false, error: "", toolResponses: toolResponses };
}
