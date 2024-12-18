import { ToolProps } from "../types";

import { getBrandSpecificOrderInsightsTool } from "./brandSpecificOrderInsightsTool";
import { getDelayedOrders } from "./delayedOrders";
import { getInboundShipmentDetails } from "./inboundShipmentDetails";
import { getStockReplenishmentPredictor } from "./stockReplenishmentPredictor";
import { getUnderPerformingSKUAnalyzer } from "./underPerformingSKUAnalyzer";

export const getCustomerFacingAgentTools = ({
  uiStream,
  fullResponse,
  company_url,
}: ToolProps) => {
  const tools: any = {
    brandSpecificOrderInsights: getBrandSpecificOrderInsightsTool({
      uiStream,
      fullResponse,
      company_url,
    }),
    //TODO:
    // SKU_Price_Optimization
  };
  return tools;
};

export const getOrderAgentTools = ({
  uiStream,
  fullResponse,
  company_url,
}: ToolProps) => {
  const tools: any = {
    delayedOrders: getDelayedOrders({ uiStream, fullResponse, company_url }),
  };
  return tools;
};
export const getInventoryAgentTools = ({
  uiStream,
  fullResponse,
  company_url,
}: ToolProps) => {
  const tools: any = {
    stockReplenishmentPredictor: getStockReplenishmentPredictor({
      uiStream,
      fullResponse,
      company_url,
    }),
  };
  return tools;
};
export const getProductAgentTools = ({
  uiStream,
  fullResponse,
  company_url,
}: ToolProps) => {
  const tools: any = {
    underPerformingSKUAnalyzer: getUnderPerformingSKUAnalyzer({
      uiStream,
      fullResponse,
      company_url,
    }),
  };
  return tools;
};
export const getInboundShipmentTools = ({
  uiStream,
  fullResponse,
  company_url,
}: ToolProps) => {
  const tools: any = {
    inboundShipmentDetails: getInboundShipmentDetails({
      uiStream,
      fullResponse,
      company_url,
    }),
  };
  return tools;
};

export const getTools = (
  name: string,
  { uiStream, fullResponse, company_url }: ToolProps
) => {
  switch (name) {
    //ramp
    case "customerFacingAgent":
      return getCustomerFacingAgentTools({
        uiStream,
        fullResponse,
        company_url,
      });
    case "orderAgent":
      return getOrderAgentTools({
        uiStream,
        fullResponse,
        company_url,
      });
    case "inventoryAgent":
      return getInventoryAgentTools({
        uiStream,
        fullResponse,
        company_url,
      });
    case "productAgent":
      return getProductAgentTools({
        uiStream,
        fullResponse,
        company_url,
      });
    case "inBoundShipmentAgent":
      return getInboundShipmentTools({
        uiStream,
        fullResponse,
        company_url,
      });

    default:
      throw new Error(`Agent ${name} not found.`);
  }
};
