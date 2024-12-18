"use-sever";

import axios from "axios";
import { ToolProps } from "@/lib/types";
import { tool } from "ai";

import { createStreamableValue } from "ai/rsc";
import z from "zod";
import { date } from "yup";
import ENDPOINTS from "../constants/path";

export const orders_duplicate_tracking = ({
  uiStream,
  fullResponse,
  integration = "",
}: ToolProps) => {
  return tool({
    description: `Fetches data on duplicate tracking numbers across orders, with options for aggregation by time intervals (day, week, month, quarter, or year) or raw results. Filters include order_date range, order_id, shipment_id, package_id, carrier, shipping_cost, and weight.`,
    parameters: z.object({
      carrier: z
        .string()
        .optional()
        .describe(
          "Filters data by the carrier responsible for shipping the order."
        ),

      date_trunc_type: z
        .enum(["day", "week", "month", "quarter", "year"])
        .optional()
        .describe(
          "Defines the level of date truncation for aggregating data, e.g., by day, week, month, quarter, or year."
        ),
      max_order_date: z
        .string()
        .date()
        .optional()
        .describe(
          "Filters data by the maximum order date within the specified date range. Format: YYYY-MM-DD."
        ),
      max_shipping_cost: z
        .number()
        .optional()
        .describe(
          "Filters data by the maximum shipping cost for an order in the specified range."
        ),
      max_weight: z
        .number()
        .optional()
        .describe(
          "Filters data by the maximum weight of a package in the specified range."
        ),
      min_order_date: z
        .string()
        .date()
        .optional()
        .describe(
          "Filters data by the minimum order date within the specified date range. Format: YYYY-MM-DD."
        ),
      min_shipping_cost: z
        .number()
        .optional()
        .describe(
          "Filters data by the minimum shipping cost for an order in the specified range."
        ),
      min_weight: z
        .number()
        .optional()
        .describe(
          "Filters data by the minimum weight of a package in the specified range."
        ),
      order_id: z
        .string()
        .optional()
        .describe("Filters data by the unique identifier of the order."),
      package_id: z
        .string()
        .optional()
        .describe(
          "Filters data by the unique identifier of the package within an order."
        ),
      shipment_id: z
        .string()
        .optional()
        .describe("Filters data by the unique identifier of the shipment."),
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
          `${ENDPOINTS.DUPLICATE_TRACKING}.${format}`,
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
