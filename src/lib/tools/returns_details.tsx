"use-sever";

import axios from "axios";
import { ToolProps } from "@/lib/types";
import { tool } from "ai";

import { createStreamableValue } from "ai/rsc";
import z from "zod";
import ENDPOINTS from "../constants/path";

export const returns_details = ({
  uiStream,
  fullResponse,
  integration,
}: ToolProps) => {
  return tool({
    description: `This tool Fetches product return data. This tool provide two modes of operations
     Default Mode: Aggregates product return data for broader performance insights.
     Details Mode: Offers granular, product-specific return details for in-depth analysis.
     Mode selector; use "details" for detailed product-return  details info. Omit this parameter for a summary.
     in Details Mode for item-level specifics like sku, warehouse_id, and shipment dates, or in Summary Mode for aggregated totals per return_id with return and restock quantities. Supports filters for status, carrier, and date ranges.`,
    parameters: z.object({
      carrier: z
        .string()
        .optional()
        .describe(
          "Filters data by the carrier responsible for shipping the order. Used in conjunction with data=details."
        ),
      data: z
        .enum(["details"])
        .optional()
        .describe(
          'Mode selector; use "details" for detailed return info, omit for summary mode.'
        ),
      max_returned_date: z
        .string()
        .date()
        .optional()
        .describe(
          "Filters data by the maximum returned date within the specified date range. Format: YYYY-MM-DD. Used in conjunction with data=details."
        ),
      max_shipped_date: z
        .string()
        .date()
        .optional()
        .describe(
          "Filters data by the maximum shipped date within the specified date range. Format: YYYY-MM-DD. Used in conjunction with data=details."
        ),
      min_returned_date: z
        .string()
        .date()
        .optional()
        .describe(
          "Filters data by the minimum returned date within the specified date range. Format: YYYY-MM-DD. Used in conjunction with data=details."
        ),
      min_shipped_date: z
        .string()
        .date()
        .optional()
        .describe(
          "Filters data by the minimum shipped date within the specified date range. Format: YYYY-MM-DD. Used in conjunction with data=details."
        ),
      order_id: z
        .string()
        .optional()
        .describe("Filters data by the unique identifier of the order."),
      return_id: z
        .string()
        .optional()
        .describe("Filters data by the unique identifier of the return."),
      return_initialized_date: z
        .string()
        .date()
        .optional()
        .describe(
          "Filters data by the date when the return process was initialized. Format: YYYY-MM-DD."
        ),
      returned_date: z
        .string()
        .date()
        .optional()
        .describe(
          "Filters data by the specific date when the item was returned. Format: YYYY-MM-DD. Used in conjunction with data=details."
        ),
      shipped_date: z
        .string()
        .date()
        .optional()
        .describe(
          "Filters data by the specific date when the item was shipped. Format: YYYY-MM-DD. Used in conjunction with data=details."
        ),
      sku: z
        .string()
        .optional()
        .describe(
          "Filters data by the SKU (Stock Keeping Unit) of the product. Used in conjunction with data=details."
        ),
      status: z
        .enum(["open", "returned", "shipped", "pending"])
        .optional()
        .describe(
          "Filters data by the status of the return or shipment, such as 'pending', 'shipped', 'returned'."
        ),
      tracking_number: z
        .string()
        .optional()
        .describe(
          "Filters data by the shipment's tracking number. Used in conjunction with data=details."
        ),
      warehouse_id: z
        .string()
        .optional()
        .describe(
          "Filters data by the unique identifier of the warehouse. Used in conjunction with data=details."
        ),
      brand_name: z
        .string()
        .optional()
        .describe(
          "Specifies the field according to brand name and filter out the data according to brand"
        ),
      brand_domain: z
        .string()
        .optional()
        .describe(
          "Specifies the field according to brand domain (e.g. brand.com, brand.net) and filter out the data according to brand"
        ),
    }),
    execute: async (query: any) => {
      let hasError = false;
      const streamResults = createStreamableValue<string>();

      let searchResult;

      if (!integration?.company_url) {
        fullResponse = `${"user Company Not Found"} for "${query}.`;
        uiStream.update(null);
        streamResults.done();
        return searchResult;
      }

      try {
        const { format = "json", q = "", ...rest } = query;

        const response = await axios.get(
          `${ENDPOINTS.RETURNS_DETAILS}.${format}`,
          {
            headers: {
              Authorization: process.env.TINYBIRD_3PL_TOKEN,
            },
            params: {
              q,
              // company_url: rest.company_url ? rest.company_url : company_url,
              company_url: integration?.company_url
                ? integration?.company_url
                : "",
              ...(integration?.brandId
                ? { brand_id: integration.brandId }
                : {}),
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
