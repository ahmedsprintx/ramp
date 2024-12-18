"use-sever";

import axios from "axios";
import { ToolProps } from "@/lib/types";
import { tool } from "ai";

import { createStreamableValue } from "ai/rsc";
import z from "zod";
import ENDPOINTS from "../constants/path";

export const warehouse_inventory_details = ({
  uiStream,
  fullResponse,
  integration,
}: ToolProps) => {
  return tool({
    description: `this tool Fetches detailed inventory data for each warehouse. This tool provide two modes of operations
     Default Mode: Aggregates inventory view with location totals and distinct products data for broader performance insights.
     Inventory Mode: Offers granular, inventory-specific,showing quantities by status (on-hand, committed, sellable, unfulfillable) per location details for in-depth analysis.
     Mode selector; use "details" for detailed product-return  details info. Omit this parameter for a summary.'
     Filters include warehouse_id, warehouse_name, warehouse_code, warehouse_location_id, and inventory_id.`,
    parameters: z.object({
      warehouse_city: z
        .string()
        .optional()
        .describe(
          "Filters data by the city associated with the warehouse location."
        ),
      warehouse_country: z
        .string()
        .optional()
        .describe(
          "Filters data by the country where the warehouse is located."
        ),
      data: z
        .enum(["inventory"])
        .optional()
        .describe(
          'Mode selector; use "inventory" for detailed inventory data, omit for summary view.'
        ),
      inventory_id: z
        .string()
        .optional()
        .describe("Filters data by the specific inventory item ID."),
      warehouse_name: z
        .string()
        .optional()
        .describe("Filters data by the name of the warehouse."),
      warehouse_state: z
        .string()
        .optional()
        .describe("Filters data by the state where the warehouse is located."),
      warehouse_code: z
        .string()
        .optional()
        .describe("Filters data by the specific warehouse code."),
      warehouse_id: z
        .string()
        .optional()
        .describe("Filters data by the unique identifier of the warehouse."),
      warehouse_location_id: z
        .string()
        .optional()
        .describe(
          "Filters data by the specific location ID within the warehouse."
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
          `${ENDPOINTS.WAREHOUSE_INVENTORY}.${format}`,
          {
            headers: {
              Authorization: process.env.TINYBIRD_3PL_TOKEN,
            },
            params: {
              q,
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
