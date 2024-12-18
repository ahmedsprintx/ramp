import { createStreamableUI } from "ai/rsc";
import { CoreMessage, ToolCallPart, ToolResultPart } from "ai";

import { managerAssistant } from "./3pl-managers";

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

// export const getDesiredManager = async (
//   businessType: string,
//   manager: string,
//   { uiStream, messages, integration }: AssistantTypes,
//   traceId: string,
//   spanId: string
// ): Promise<ManagerKindResponse> => {
//   switch (businessType) {
//     //3PL Assistants Managers
//     case "3pl":
//       switch (manager) {
//         //3PL Assistants Managers
//         case "operationsSupervisorAgent":
//         case "customerServiceSupervisorAgent":
//         case "inventoryOptimizationAgent":
//         case "orderFulfillmentAgent":
//         case "customerServiceAgent":
//         case "returnsManagementAgent":
//         case "billingAndFinancialAnalysisAgent":
//         case "demandForecastingAgent":
//         case "supplierPerformanceAgent":
//         case "routeOptimizationAgent":
//         case "procurementAgent":
//         case "carrierPerformanceAgent":
//           return await managerAssistant(
//             manager,
//             uiStream,
//             messages,
//             integration,
//             traceId,
//             spanId
//           );

//         //Any Other Agents Managers
//         default:
//           return {
//             error: `\nThere is no Manager Found with for the Related Query`,
//             isError: true,
//             toolResponses: [],
//             toolCalls: [],
//             managerResponse: [],
//           };
//       }

//     default:
//       return await managerAssistant(
//         "customerServiceAgent",
//         uiStream,
//         messages,
//         integration,
//         traceId,
//         spanId
//       );
//   }
// };
