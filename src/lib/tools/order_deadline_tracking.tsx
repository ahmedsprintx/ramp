"use-sever";

import axios from "axios";
import { ToolProps } from "@/lib/types";
import { tool } from "ai";

import { createStreamableValue } from "ai/rsc";
import z from "zod";
import ENDPOINTS from "../constants/path";

export const order_deadline_tracking = ({
  uiStream,
  fullResponse,
  integration,
}: ToolProps) => {
  return tool({
    description: `Fetches open orders with upcoming deadlines, using filters like order_id, shipping_deadline range, customer_id, reference_id, channel, and status`,
    parameters: z.object({
      channel: z
        .string()
        .optional()
        .describe(
          "Filters data by the sales channel through which the order was placed"
        ),

      customer_id: z
        .string()
        .optional()
        .describe("Filters data by the unique identifier of the customer."),
      max_shipping_deadline: z
        .string()
        .date()
        .optional()
        .describe(
          "Filters data by the maximum shipping deadline in the specified date range. Format: YYYY-MM-DD."
        ),
      min_shipping_deadline: z
        .string()
        .date()
        .optional()
        .describe(
          "Filters data by the minimum shipping deadline in the specified date range. Format: YYYY-MM-DD."
        ),
      order_id: z
        .string()
        .optional()
        .describe("Filters data by the unique identifier of the order."),
      reference_id: z
        .string()
        .optional()
        .describe(
          "Filters data by the reference ID, which is an external or user-assigned identifier."
        ),
      shipping_deadline: z
        .string()
        .date()
        .optional()
        .describe(
          "Filters data by the specific shipping deadline for the order. Format: YYYY-MM-DD."
        ),
      status: z
        .enum([
          "open",
          "in-transit",
          "receiving",
          "received",
          "cancelled",
          "fulfilled",
          "other",
        ])
        .optional()
        .describe(
          "Filters data by the status of the order, such as 'open', 'confirmed', 'processing', 'shipped', etc."
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
          `${ENDPOINTS.ORDER_DEADLINE}.${format}`,
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
