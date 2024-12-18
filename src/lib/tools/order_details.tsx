"use-sever";

import axios from "axios";
import { ToolProps } from "@/lib/types";
import { tool } from "ai";

import { createStreamableValue } from "ai/rsc";
import z from "zod";
import ENDPOINTS from "../constants/path";

export const order_details = ({
  uiStream,
  fullResponse,
  integration,
}: ToolProps) => {
  return tool({
    description: `This tool Fetches order data with options for mode.This tool has three modes of operation:
    Default Mode: Aggregates order Details a short overview of the order or orders data for broader performance insights.
    Details Mode: Offers granular, order-specific Details which includes customer info details for in-depth analysis.
    Shipments Mode: Offers granular, order-specific details which includes shipment details and carrier info for in-depth analysis.
    Mode selector: use "details" for detailed order-specific detail info. use "shipments" for detailed order-shipment-specific detail info. Omit this parameter for a summary.
    using filters like order_id, status, channel, order_date, and ship_to_country.`,
    parameters: z.object({
      carrier: z
        .string()
        .optional()
        .describe(
          "Filters data by the carrier responsible for shipping the order. Used in conjunction with data=shipments."
        ),
      channel: z
        .string()
        .optional()
        .describe(
          "Filters data by the sales channel through which the order was placed."
        ),

      data: z
        .enum(["details", "shipments"])
        .optional()
        .describe(
          "Provides additional data relevant to the order. data=details provides more details about the order, data=shipments provides shipment information about the order. Omit this parameter for a summary."
        ),
      max_created_date: z
        .string()
        .date()
        .optional()
        .describe(
          "Filters data by the maximum creation date in the specified date range. Format: YYYY-MM-DD."
        ),
      min_created_date: z
        .string()
        .date()
        .optional()
        .describe(
          "Filters data by the minimum creation date in the specified date range. Format: YYYY-MM-DD."
        ),
      order_id: z
        .string()
        .optional()
        .describe("Filters data by the unique identifier of the order."),
      order_number: z
        .string()
        .optional()
        .describe(
          "Filters data by the order number, typically an external or user-facing identifier."
        ),
      order_type: z
        .string()
        .optional()
        .describe(
          "Filters data by the type of order, such as 'standard', 'express', etc."
        ),
      package_id: z
        .string()
        .optional()
        .describe(
          "Filters data by the unique identifier of the package within an order. Used in conjunction with data=shipments."
        ),
      product_id: z
        .string()
        .optional()
        .describe("Filters data by the unique identifier of the product."),
      ship_to_country: z
        .string()
        .optional()
        .describe("Filters data by the destination country for the shipment."),
      shipment_id: z
        .string()
        .optional()
        .describe(
          "Filters data by the unique identifier of the shipment. Used in conjunction with data=shipments."
        ),
      sku: z
        .string()
        .optional()
        .describe(
          "Filters data by the SKU (Stock Keeping Unit) of the product. Used in conjunction with data=details."
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
          "Filters data by the status of the order, such as 'pending', 'shipped', or 'delivered'."
        ),
      warehouse_customer_id: z
        .string()
        .optional()
        .describe(
          "Filters data by the unique identifier of the warehouse customer."
        ),
      package_sku: z
        .string()
        .optional()
        .describe(
          "Filters data by the SKU within shipment packages. Used in conjunction with data=shipments."
        ),
      scac: z
        .string()
        .optional()
        .describe(
          "Filters data by the SCAC (Standard Carrier Alpha Code) for identifying the carrier. Used in conjunction with data=shipments."
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
          `${ENDPOINTS.ORDER_DETAILS}.${format}`,
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
