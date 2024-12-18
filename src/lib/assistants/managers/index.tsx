import { createStreamableUI } from "ai/rsc";
import { CoreMessage, tool, ToolCallPart, ToolResultPart } from "ai";

import { managerAssistant } from "./3pl-managers";
import { z } from "zod";

interface AssistantTypes {
  uiStream: ReturnType<typeof createStreamableUI>;
  messages: CoreMessage[];
  integration: any;
}

interface StreamTextResult {
  fullStream: AsyncIterable<{
    type: string;
    textDelta?: string;
    result?: any;
    error?: string;
  }>;
  [key: string]: any;
}

export interface ManagerResponse {
  result: StreamTextResult | null;
  fullResponse: string;
  hasError: boolean;
  toolResponses: ToolResultPart[];
  finishReason: string;
}
export interface ManagerKindResponse {
  isError: boolean;
  error: any;
  toolResponses: ToolResultPart[];
  toolCalls: ToolCallPart[];
  toolsUsed?: string[];
  managerResponse?: CoreMessage[];
}

export const getDesiredManagerTools = (
  uiStream: ReturnType<typeof createStreamableUI>,
  company_url: string,
  traceId?: string,
  spanId?: string
) => {
  const tools = {
    customerFacingAgent: tool({
      description: "Provides insights to brands served by the 3PL.",
      parameters: z.object({
        instructions: z.string(),
      }),
      execute: async ({ instructions }) => {
        return await managerAssistant(
          "customerFacingAgent",
          uiStream,
          instructions,
          company_url,
          "traceId",
          "1"
        );
      },
    }),
    orderAgent: tool({
      description:
        "Analyzes order delays, optimizes carrier performance, and provides order fulfillment insights.",
      parameters: z.object({
        instructions: z.string(),
      }),
      execute: async ({ instructions }) => {
        return await managerAssistant(
          "orderAgent",
          uiStream,
          instructions,
          company_url,
          "traceId",
          "1"
        );
      },
    }),
    inventoryAgent: tool({
      description:
        "Forecasts stock replenishment needs and alerts on low inventory levels.",
      parameters: z.object({
        instructions: z.string(),
      }),
      execute: async ({ instructions }) => {
        return await managerAssistant(
          "inventoryAgent",
          uiStream,
          instructions,
          company_url,
          "traceId",
          "1"
        );
      },
    }),
    productAgent: tool({
      description:
        "Detects underperforming SKUs, optimizes pricing, and suggests bundling opportunities.",
      parameters: z.object({
        instructions: z.string(),
      }),
      execute: async ({ instructions }) => {
        return await managerAssistant(
          "productAgent",
          uiStream,
          instructions,
          company_url,
          "traceId",
          "1"
        );
      },
    }),
    inBoundShipmentAgent: tool({
      description:
        "Provides insights into warehouse performance, inbound shipments, and exception management.",
      parameters: z.object({
        instructions: z.string(),
      }),
      execute: async ({ instructions }) => {
        return await managerAssistant(
          "inBoundShipmentAgent",
          uiStream,
          instructions,
          company_url,
          "traceId",
          "1"
        );
      },
    }),
  };
  return tools;
};
