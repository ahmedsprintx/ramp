import axios from "axios";
import { ToolProps } from "@/lib/types";
import { tool } from "ai";
import { createStreamableValue } from "ai/rsc";
import z from "zod";
import ENDPOINTS from "../constants/path";

export const getBrandSpecificOrderInsightsTool = ({
  uiStream,
  fullResponse,
  company_url,
}: ToolProps) => {
  return tool({
    description: `Fetches brand-specific order details, including fulfillment status and order quantities.`,
    parameters: z.object({
      carrier_name: z
        .string()
        .optional()
        .describe("Filter results by specific carrier name"),
      // company_url: z
      //   .string()
      //   .optional()
      //   .describe("Filter results by the company URL"),
      customer_name: z
        .string()
        .optional()
        .describe("Filter results by the customer's name"),
      limit: z
        .number()
        .int()
        .optional()
        .describe("Limit the number of results returned"),
      max_order_date: z
        .string()
        .optional()
        .describe(
          "Maximum order date for filtering results. Must follow this Format: YYYY-MM-DD."
        ),
      min_order_date: z
        .string()
        .optional()
        .describe(
          "Minimum order date for filtering results. Must follow this Format: YYYY-MM-DD."
        ),
      order_date: z
        .string()
        .optional()
        .describe("Specific order date to filter results"),
      order_number: z
        .string()
        .optional()
        .describe("Filter by specific order number"),
      status: z
        .enum([
          "Shipped",
          "Cancelled",
          "Staged",
          "Allocated",
          "Picked",
          "Packed",
          "Open",
        ])
        .optional()
        .describe("Filter results by the order status"),
      warehouse: z
        .string()
        .optional()
        .describe("Filter results by the warehouse name"),
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
          `${ENDPOINTS.ORDER_DETAILS}.${format}`,
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
