"use-sever";

import axios from "axios";
import { ToolProps } from "@/lib/types";
import { tool } from "ai";

import { createStreamableValue } from "ai/rsc";
import z from "zod";
import ENDPOINTS from "../constants/path";

export const order_volume_summary = ({
  uiStream,
  fullResponse,
  integration = "",
}: ToolProps) => {
  return tool({
    description: `Retrieves a summary of order volume data with options for aggregation by time intervals, including day, week, month, quarter, or year. Omitting the date_trunc_type parameter will return all orders with no aggregation within the date range if specified.`,
    parameters: z.object({
      date_trunc_type: z
        .enum(["day", "week", "month", "quarter", "year"])
        .optional()
        .describe(
          "Defines the level of date truncation for aggregating data, e.g., by day, week, month, quarter, or year. Omitting this parameter will return all orders with no aggregation."
        ),
      max_order_date: z
        .string()
        .date()
        .optional()
        .describe(
          "Filters data by the maximum order date within the specified date range. Format: YYYY-MM-DD."
        ),
      max_total_line_items: z
        .number()
        .optional()
        .describe(
          "Filters data by the maximum total number of line items in an order within the specified range."
        ),
      max_total_packages: z
        .number()
        .optional()
        .describe(
          "Filters data by the maximum total number of packages in an order within the specified range."
        ),
      max_total_price: z
        .number()
        .optional()
        .describe(
          "Filters data by the maximum total price of an order within the specified range."
        ),
      max_total_quantity: z
        .string()
        .optional()
        .describe(
          "Filters data by the maximum total quantity of items in an order within the specified range."
        ),
      max_total_shipments: z
        .string()
        .optional()
        .describe(
          "Filters data by the maximum total number of shipments in an order within the specified range."
        ),
      max_total_shipping_cost: z
        .number()
        .optional()
        .describe(
          "Filters data by the maximum total shipping cost of an order within the specified range."
        ),
      min_order_date: z
        .string()
        .date()
        .optional()
        .describe(
          "Filters data by the minimum order date within the specified date range. Format: YYYY-MM-DD."
        ),
      min_total_line_items: z
        .number()
        .optional()
        .describe(
          "Filters data by the minimum total number of line items in an order within the specified range."
        ),
      min_total_packages: z
        .number()
        .optional()
        .describe(
          "Filters data by the minimum total number of packages in an order within the specified range."
        ),
      min_total_price: z
        .number()
        .optional()
        .describe(
          "Filters data by the minimum total price of an order within the specified range."
        ),
      min_total_quantity: z
        .number()
        .optional()
        .describe(
          "Filters data by the minimum total quantity of items in an order within the specified range."
        ),
      min_total_shipments: z
        .number()
        .optional()
        .describe(
          "Filters data by the minimum total number of shipments in an order within the specified range."
        ),
      min_total_shipping_cost: z
        .number()
        .optional()
        .describe(
          "Filters data by the minimum total shipping cost of an order within the specified range."
        ),
      order_id: z
        .string()
        .optional()
        .describe("Filters data by the unique identifier of the order."),
      status: z
        .enum(["open", "fulfilled", "cancelled"])
        .optional()
        .describe(
          "Filters data by the status of the order, such as 'open', 'confirmed', 'fulfilled'"
        ),
      warehouse_id: z
        .string()
        .optional()
        .describe("Filters data by the unique identifier of the warehouse."),
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
          `${ENDPOINTS.ORDER_VOLUME}.${format}`,
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
