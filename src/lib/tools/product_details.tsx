"use-sever";

import axios from "axios";
import { ToolProps } from "@/lib/types";
import { tool } from "ai";

import { createStreamableValue } from "ai/rsc";
import z from "zod";
import ENDPOINTS from "../constants/path";

export const product_details = ({
  uiStream,
  fullResponse,
  integration,
}: ToolProps) => {
  return tool({
    description: `This tool Fetches detailed or summarized product data (stock levels) based on the latest records. The tool provides modes of operation:
     Default Mode: Aggregates product data (stock levels) for broader performance insights.
     Details Mode: Offers granular, product-specific details for in-depth analysis.
     Mode selector; use "details" for detailed product details info. Omit this parameter for a summary.
     Includes attributes for product, inventory, and supplier details, with filters like product_id, sku, is_kit, active, supplier_name, country_of_origin, and unit_quantity. Aggregates inventory quantities in summary mode.`,
    parameters: z.object({
      active: z
        .boolean()
        .optional()
        .describe(
          "Filters data by the product's active status in the inventory. true or false"
        ),
      country_of_origin: z
        .string()
        .optional()
        .describe("Filters data by the country of origin for the product."),
      data: z
        .enum(["details"])
        .optional()
        .describe(
          'Mode selector; use "details" for detailed product info, omit for summary mode.'
        ),
      harmonized_code: z
        .string()
        .optional()
        .describe("Filters data by the harmonized code for the product."),
      inventory_item_id: z
        .string()
        .optional()
        .describe(
          "Filters data by the specific inventory item ID. Used in conjunction with data=details."
        ),
      is_kit: z
        .boolean()
        .optional()
        .describe(
          "Filters data by whether the product is part of a kit. true or false"
        ),
      max_created_date: z
        .string()
        .date()
        .optional()
        .describe(
          "Filters products by the maximum creation date. This argument will be the first date in the date range the user requested. Must be in the format YYYY-MM-DD."
        ),
      max_unit_quantity: z
        .string()
        .optional()
        .describe(
          "Filters data by the maximum unit quantity in stock. Used in conjunction with data=details."
        ),
      min_created_date: z
        .string()
        .date()
        .optional()
        .describe(
          "Filters products by the minimum creation date. This argument will be the first date in the date range the user requested. Must be in the format YYYY-MM-DD."
        ),
      min_unit_quantity: z
        .string()
        .optional()
        .describe(
          "Filters data by the minimum unit quantity in stock. Used in conjunction with data=details."
        ),
      product_id: z
        .string()
        .optional()
        .describe("Filters data by the unique product ID."),
      sku: z
        .string()
        .optional()
        .describe("Filters data by the SKU (Stock Keeping Unit)."),
      supplier_name: z
        .string()
        .optional()
        .describe(
          "Filters data by the supplier's name. Used in conjunction with data=details."
        ),
      warehouse_customer_id: z
        .string()
        .optional()
        .describe("Filters data by the warehouse customer ID."),
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
          `${ENDPOINTS.PRODUCT_DETAILS}.${format}`,
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
