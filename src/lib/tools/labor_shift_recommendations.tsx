"use-sever";

import axios from "axios";
import { ToolProps } from "@/lib/types";
import { tool } from "ai";

import { createStreamableValue } from "ai/rsc";
import z from "zod";
import ENDPOINTS from "../constants/path";

export const labor_shift_recommendations = ({
  uiStream,
  fullResponse,
  integration = "",
}: ToolProps) => {
  return tool({
    description: `This tool provides labor shift recommendations based on aggregated data from multiple sources on order volume and inbound shipment counts across different warehouses. It generates labor demand classifications for efficient staffing based on customizable filters such as warehouse ID, and date range. Ideal for analyzing labor demand levels and optimizing staffing across warehouse locations.`,
    parameters: z.object({
      end_date: z
        .string()
        .optional()
        .describe(
          "Filters data up to the specified end date within a date range. Format: YYYY-MM-DD."
        ),
      start_date: z
        .string()
        .optional()
        .describe(
          "Filters data from the specified start date within a date range. Format: YYYY-MM-DD."
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
          `${ENDPOINTS.LABOR_SHIFT_RECOMMENDATIONS}.${format}`,
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
