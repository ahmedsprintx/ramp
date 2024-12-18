import axios from "axios";
import { ToolProps } from "@/lib/types";
import { tool } from "ai";
import { createStreamableValue } from "ai/rsc";
import z from "zod";
import ENDPOINTS from "../constants/path";

export const get_supplier_performance = ({
    uiStream,
    fullResponse,
    integration,
}: ToolProps) => {
    return tool({
        description: `Analyzes supplier performance by retrieving detailed shipment information.
    Provides insights into:
    - Shipment statuses and on-time delivery rates
    - Shipment volumes and trends
    - Performance metrics across different suppliers
    
    Supports filtering by:
    - Supplier name
    - Date ranges
    - Shipment status
    - Warehouse and brand details`,
        parameters: z.object({
            supplier: z
                .string()
                .optional()
                .describe("Filter results by specific supplier name"),
            status: z
                .string()
                .optional()
                .describe("Filter by shipment status (e.g., Delivered, In Transit, Pending)"),
            min_expected_arrival_date: z
                .string()
                .optional()
                .describe("Minimum expected arrival date for filtering shipments"),
            max_expected_arrival_date: z
                .string()
                .optional()
                .describe("Maximum expected arrival date for filtering shipments"),
            warehouse_customer_id: z
                .string()
                .optional()
                .describe("Filter by specific warehouse customer ID"),
            brand_id: z
                .string()
                .optional()
                .describe("Filter by brand ID"),
            brand_name: z
                .string()
                .optional()
                .describe("Filter by brand name"),
            data: z
                .enum(["details"])
                .optional()
                .describe('Use "details" for comprehensive shipment information'),
        }),
        execute: async (query: any) => {
            let hasError = false;
            const streamResults = createStreamableValue<string>();

            let searchResult;

            if (!integration?.company_url) {
                fullResponse = `${"User Company Not Found"} for "${query}".`;
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

                    // Optional: Add some basic performance analysis
                    if (searchResult && Array.isArray(searchResult)) {
                        const performanceMetrics = {
                            total_shipments: searchResult.length,
                            shipments_by_status: searchResult.reduce((acc, shipment) => {
                                acc[shipment.status] = (acc[shipment.status] || 0) + 1;
                                return acc;
                            }, {}),
                            suppliers: Array.from(new Set(searchResult.map(s => s.supplier)))
                        };
                        searchResult = {
                            raw_data: searchResult,
                            performance_metrics: performanceMetrics
                        };
                    }
                } else {
                    console.error("ERROR IN API CALLING", response.statusText);
                    hasError = true;
                }
            } catch (error) {
                console.error("ERROR IN API CALLING", error);
                hasError = true;
            }

            if (hasError) {
                fullResponse = `An error occurred while searching for supplier performance "${query}".`;
                uiStream.update(null);
                streamResults.done();
                return searchResult;
            }

            streamResults.done(JSON.stringify(searchResult));

            return searchResult;
        },
    });
};