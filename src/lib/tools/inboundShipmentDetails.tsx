import axios from "axios";
import { ToolProps } from "@/lib/types";
import { tool } from "ai";
import { createStreamableValue } from "ai/rsc";
import z from "zod";
import ENDPOINTS from "../constants/path";

export const getInboundShipmentDetails = ({
  uiStream,
  fullResponse,
  company_url,
}: ToolProps) => {
  return tool({
    description: `Tracks inbound shipments and statuses`,
    parameters: z.object({
      customer_name: z
        .string()
        .optional()
        .describe("Filter results by the customer's name"),
      delivery_date_end: z
        .string()
        .optional()
        .describe(
          "Filter results by the end date of the delivery date range. Must follow this Format: YYYY-MM-DD."
        ),
      delivery_date_start: z
        .string()
        .optional()
        .describe(
          "Filter results by the start date of the delivery date range. Must follow this Format: YYYY-MM-DD."
        ),
      expected_delivery_date_end: z
        .string()
        .optional()
        .describe(
          "Filter results by the end date of the expected delivery date range. Must follow this Format: YYYY-MM-DD."
        ),
      expected_delivery_date_start: z
        .string()
        .optional()
        .describe(
          "Filter results by the start date of the expected delivery date range. Must follow this Format: YYYY-MM-DD."
        ),
      limit: z
        .number()
        .int()
        .optional()
        .describe("Limit the number of results returned"),
      receipt_number: z
        .string()
        .optional()
        .describe("Filter results by the receipt number"),
      ship_from_city: z
        .string()
        .optional()
        .describe(
          "Filter results by the city from which the shipment originated"
        ),
      ship_from_state_province: z
        .string()
        .optional()
        .describe(
          "Filter results by the state or province from which the shipment originated"
        ),
      status: z
        .string()
        .optional()
        .describe("Filter results by the Status of Shipment"),
      warehouse: z
        .string()
        .optional()
        .describe("Filter results by the warehouse name"),
    }),
    execute: async (query: any) => {
      let hasError = false;
      const streamResults = createStreamableValue<string>();

      let searchResult;

      if (company_url) {
        fullResponse = `${"User Company Not Found"} for "${query}".`;
        uiStream.update(null);
        streamResults.done();
        return searchResult;
      }

      try {
        const { format = "json", q = "", ...rest } = query;

        const response = await axios.get(
          `${ENDPOINTS.INBOUND_SHIPMENT_DETAILS}.${format}`,
          {
            headers: {
              Authorization: process.env.TINYBIRD_3PL_TOKEN,
            },
            params: {
              q,
              company_url: company_url,
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
