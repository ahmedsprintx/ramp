"use-sever";

import axios from "axios";
import { ToolProps } from "@/lib/types";
import { tool } from "ai";

import { createStreamableValue } from "ai/rsc";
import z from "zod";
import ENDPOINTS from "../constants/path";

export const sku_velocity = ({
  uiStream,
  fullResponse,
  integration,
}: ToolProps) => {
  return tool({
    description: `The tool provides modes of operation:
    Default Mode: Aggregates SKU velocity data for broader performance insights.
    Details Mode: Offers granular, order-specific SKU velocity details for in-depth analysis.
    Mode selector; use "details" for detailed SKU velocity info. Omit this parameter for a summary.'
    It supports comprehensive filtering options, including data, SKU ID, order ID, warehouse ID, order status, shipping dates, and more.
    These parameters enable precise data retrieval tailored to user requirements.`,
    parameters: z.object({
      data: z
        .enum(["details"])
        .optional()
        .describe(
          'Mode selector; use "details" for detailed SKU velocity info. Omit this parameter for a summary.'
        ),
      is_picked: z
        .boolean()
        .optional()
        .describe("Indicates if the SKU has been picked for an order."),
      min_order_date: z
        .string()
        .date()
        .optional()
        .describe(
          "Filters data by the minimum order date in the range specified by the user. E.g get me data from last 6 months.it value would be current date - 6 months. Format: YYYY-MM-DD."
        ),
      max_order_date: z
        .string()
        .date()
        .optional()
        .describe(
          "Filters data by the maximum order date in the range specified by the user. E.g get me data from last 6 months.it value would be current date. Format: YYYY-MM-DD."
        ),
      min_shipped_date: z
        .string()
        .date()
        .optional()
        .describe(
          "Filters data by the minimum shipped date in the range specified by the user.e.g get me data from last 6 months.it value would be current date - 6 months. Format: YYYY-MM-DD."
        ),
      max_shipped_date: z
        .string()
        .date()
        .optional()
        .describe(
          "Filters data by the maximum shipped date in the range specified by the user.E.g get me data from last 6 months.it value would be current date. Format: YYYY-MM-DD."
        ),
      order_date: z
        .string()
        .date()
        .optional()
        .describe(
          "Filters data by the specific order date. Format: YYYY-MM-DD."
        ),
      order_id: z
        .string()
        .optional()
        .describe(
          "Filters data by the unique identifier of the order. Used in conjunction with data=details."
        ),
      order_status: z
        .enum(["open", "fulfilled", "cancelled"])
        .optional()
        .describe(
          "Filters data by the status of the order, such as 'open', 'fulfilled', 'cancelled', etc. Used in conjunction with data=details."
        ),
      ship_to_city: z
        .string()
        .optional()
        .describe(
          "Filters data by the city to which the order is being shipped. Used in conjunction with data=details."
        ),
      ship_to_country: z
        .string()
        .optional()
        .describe(
          "Filters data by the country to which the order is being shipped. Used in conjunction with data=details."
        ),
      ship_to_state: z
        .string()
        .optional()
        .describe(
          "Filters data by the state to which the order is being shipped. Used in conjunction with data=details."
        ),
      shipped_date: z
        .string()
        .optional()
        .describe(
          "Filters data by the date the order was shipped. Format: YYYY-MM-DD."
        ),
      shipping_method: z
        .string()
        .optional()
        .describe(
          "Filters data by the shipping method used. Used in conjunction with data=details."
        ),
      sku_id: z
        .string()
        .optional()
        .describe("Filters data by the SKU (Stock Keeping Unit) identifier."),
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
          `${ENDPOINTS.SKU_VELOCITY}.${format}`,
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
        console.log("Request Url", response.config.params);
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
