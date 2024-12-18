"use-sever";

import axios from "axios";
import { ToolProps } from "@/lib/types";
import { tool } from "ai";

import { createStreamableValue } from "ai/rsc";
import z from "zod";
import ENDPOINTS from "../constants/path";

export const inbound_shipments_details = ({
  uiStream,
  fullResponse,
  integration,
}: ToolProps) => {
  return tool({
    description: `This retrieves inbound shipment either details or summaries for a specified company.This tool has two modes of operation:
    Default Mode: Aggregates inbound shipment either details or summaries for a specified company data for broader performance insights.
    Details Mode: Offers granular, order-specific inbound shipment either details or summaries for a specified company details for in-depth analysis.
    Mode selector; use "details" for detailed inbound shipment info. Omit this parameter for a summary.
    It supports filtering shipments by criteria such as shipment ID, warehouse customer ID, supplier, status, and expected arrival dates. The tool is designed for agents that handle inventory optimization, supplier performance, and procurement by providing shipment data essential for tracking inbound logistics and maintaining inventory flow.`,
    parameters: z.object({
      data: z
        .enum(["details"])
        .optional()
        .describe(
          "Provides specific details of a shipment. If user query does not specify then no details will be shown."
        ),
      inventory_item_id: z
        .string()
        .optional()
        .describe(
          'Filters data by the specific inventory item ID. Used with the "details" parameter.'
        ),
      max_expected_arrival_date: z
        .string()
        .date()
        .optional()
        .describe(
          "Filters data by the maximum expected arrival date for the item in the specified date range. Format: YYYY-MM-DD."
        ),
      min_expected_arrival_date: z
        .string()
        .date()
        .optional()
        .describe(
          "Filters data by the minimum expected arrival date for the item in the specified date range. Format: YYYY-MM-DD."
        ),
      purchase_order_number: z
        .string()
        .optional()
        .describe("Filters data by the specific purchase order number."),
      receipt_id: z
        .string()
        .optional()
        .describe(
          'Filters data by the unique identifier of the receipt. Used with the "details" parameter.'
        ),
      ship_from_country: z
        .string()
        .optional()
        .describe(
          'Filters data by the country from which the item is shipped. Used with the "details" parameter.'
        ),
      shipment_id: z
        .string()
        .optional()
        .describe("Filters data by the unique identifier of the shipment."),
      sku: z
        .string()
        .optional()
        .describe(
          'Filters data by the SKU (Stock Keeping Unit) of the item. Used with the "details" parameter.'
        ),
      status: z
        .enum([
          "open",
          "in-transit",
          "receiving",
          "received",
          "cancelled",
          "other",
        ])
        .optional()
        .describe(
          "Filters data by the status of the shipment, such as 'in transit', 'received', or 'delayed'."
        ),
      supplier: z
        .string()
        .optional()
        .describe("Filters data by the supplier's name."),
      tracking_number: z
        .string()
        .optional()
        .describe(
          "Filters data by the shipment's tracking number. Used with the 'details' parameter."
        ),
      warehouse_customer_id: z
        .string()
        .optional()
        .describe(
          "Filters data by the unique identifier of the warehouse customer."
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
          `${ENDPOINTS.INBOUND_SHIPMENTS}.${format}`,
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
