"use-sever";

import axios from "axios";
import { ToolProps } from "@/lib/types";
import { tool } from "ai";

import { createStreamableValue } from "ai/rsc";
import z from "zod";
import ENDPOINTS from "../constants/path";

export const inbound_exception = ({
  uiStream,
  fullResponse,
  integration,
}: ToolProps) => {
  return tool({
    description: `This tool retrieves and filters inbound shipment exceptions,This tool has two modes of operation:
    Default Mode: Aggregates inbound shipment exceptions, providing insights on shipment delays, quantity mismatches, and other exceptions across specified parameters data for broader performance insights.
    Details Mode: Offers granular, order-specific inbound shipment exceptions details for in-depth analysis.
    Mode selector; use "details" for detailed inbound shipment exceptions info. Omit this parameter for a summary.
    It tracks and resolves shipment issues by querying shipment records with options to view details or filter by various parameters.`,
    parameters: z.object({
      data: z
        .enum(["details"])
        .optional()
        .describe(
          "Gets the specific details of the shipment. If user query does not specify then no details will be shown."
        ),
      exception_status: z
        .enum([
          "Late Arrival",
          "Quantity Mismatch",
          "Late Arrival & Quantity Mismatch",
        ])
        .optional()
        .describe(
          "Filters data by the exception status of the shipment, such as 'delayed', 'damaged', etc. Used with the 'details' parameter."
        ),
      limit: z
        .number()
        .optional()
        .describe("Limits the number of results returned by the query."),
      max_arrived_date: z
        .string()
        .date()
        .optional()
        .describe(
          "Filters data by the maximum arrival date within the specified date range. Format: YYYY-MM-DD."
        ),
      max_expected_arrival_date: z
        .string()
        .date()
        .optional()
        .describe(
          "Filters data by the maximum expected arrival date within the specified date range. Format: YYYY-MM-DD."
        ),
      min_arrived_date: z
        .string()
        .date()
        .optional()
        .describe(
          "Filters data by the minimum arrival date within the specified date range. Format: YYYY-MM-DD."
        ),
      min_expected_arrival_date: z
        .string()
        .date()
        .optional()
        .describe(
          "Filters data by the minimum expected arrival date within the specified date range. Format: YYYY-MM-DD."
        ),
      order_by: z
        .enum([
          "shipment_id",
          "purchase_order_number",
          "expected_arrival_date",
          "arrived_date",
          "exception_status",
          "status",
          "warehouse_id",
        ])
        .optional()
        .describe(
          "Specifies the field by which the results should be ordered, such as 'arrival_date', 'expected_arrival_date', etc."
        ),
      shipment_id: z
        .string()
        .optional()
        .describe("Filters data by the unique identifier of the shipment."),
      sku: z
        .string()
        .optional()
        .describe(
          "Filters data by the SKU (Stock Keeping Unit) of the product."
        ),
      sort_order: z
        .enum(["ASC", "DESC"])
        .optional()
        .describe(
          "Specifies the sort order of the results, either ascending ('asc') or descending ('desc')."
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
          "Filters data by the status of the shipment, such as 'in transit', 'delivered', 'returned'."
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
          `${ENDPOINTS.INBOUND_EXCEPTION}.${format}`,
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
