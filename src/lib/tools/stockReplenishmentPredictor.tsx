import axios from "axios";
import { ToolProps } from "@/lib/types";
import { tool } from "ai";
import { createStreamableValue } from "ai/rsc";
import z from "zod";
import ENDPOINTS from "../constants/path";

export const getStockReplenishmentPredictor = ({
  uiStream,
  fullResponse,
  company_url,
}: ToolProps) => {
  return tool({
    description: `Forecasts replenishment needs based on current stock and order history.`,
    parameters: z.object({
      customer_name: z
        .string()
        .optional()
        .describe("Filter results by the customer's name"),
      limit: z
        .number()
        .int()
        .optional()
        .describe("Limit the number of results returned"),
      warehouse: z
        .string()
        .optional()
        .describe("Filter results by the warehouse name"),
      warehouse_sku: z
        .string()
        .optional()
        .describe("Filter results by the warehouse SKU"),
    }),
    execute: async (query: any) => {
      let hasError = false;
      const streamResults = createStreamableValue<string>();

      let searchResult;

      if (company_url) {
        fullResponse = `${"User Company Not Found"} for "${query}".`;
        uiStream.update(null);
        streamResults.done();
        return searchResult;
      }

      try {
        const { format = "json", q = "", ...rest } = query;

        const response = await axios.get(
          `${ENDPOINTS.STOCK_REPLENISHMENT}.${format}`,
          {
            headers: {
              Authorization: process.env.TINYBIRD_3PL_TOKEN,
            },
            params: {
              q,
              company_url: company_url,
              ...rest,
            },
          }
        );
        if (response.statusText === "OK") {
          searchResult = response.data;
        } else {
          console.error("ERROR IN API CALLING", response.statusText);
          hasError = true;
        }
      } catch (error) {
        console.error("ERROR IN API CALLING", error);
        hasError = true;
      }

      if (hasError) {
        fullResponse = `An error occurred while searching for "${query}.`;
        uiStream.update(null);
        streamResults.done();
        return searchResult;
      }

      streamResults.done(JSON.stringify(searchResult));

      return searchResult;
    },
  });
};
