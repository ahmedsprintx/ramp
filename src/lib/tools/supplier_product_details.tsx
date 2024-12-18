import axios from "axios";
import { ToolProps } from "@/lib/types";
import { tool } from "ai";
import { createStreamableValue } from "ai/rsc";
import z from "zod";
import ENDPOINTS from "../constants/path";

export const get_supplier_product_details = ({
    uiStream,
    fullResponse,
    integration,
}: ToolProps) => {
    return tool({
        description: `Retrieves comprehensive supplier and product information, including:
    - Product details associated with suppliers
    - Supplier cost and quantity information
    - Geographic origin of products
    
    Supports filtering by:
    - Supplier ID or name
    - Product details
    - Geographic location`,
        parameters: z.object({
            supplier_id: z
                .string()
                .optional()
                .describe("Filter by specific supplier ID"),
            supplier_name: z
                .string()
                .optional()
                .describe("Filter by supplier name"),
            product_id: z
                .string()
                .optional()
                .describe("Filter by specific product ID"),
            product_name: z
                .string()
                .optional()
                .describe("Filter by product name"),
            origin_country: z
                .string()
                .optional()
                .describe("Filter by country of origin"),
            origin_state: z
                .string()
                .optional()
                .describe("Filter by state of origin"),
        }),
        execute: async (query: any) => {
            let hasError = false;
            const streamResults = createStreamableValue<string>();

            let searchResult: any;

            if (!integration?.company_url) {
                fullResponse = `${"User Company Not Found"} for "${query}".`;
                uiStream.update(null);
                streamResults.done();
                return searchResult;
            }

            try {
                const { format = "json", q = "", ...rest } = query;

                const response = await axios.get(
                    `${ENDPOINTS.SUPPLIER_DETAILS}.${format}`,
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

                    // Add summary analytics
                    if (searchResult && Array.isArray(searchResult)) {
                        const supplierAnalytics = {
                            total_products: searchResult.length,
                            total_quantity: searchResult.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0),
                            average_unit_cost: calculateAverageCost(searchResult),
                            unique_suppliers: Array.from(new Set(searchResult.map((item: any) => item.supplier_name))),
                            geographic_distribution: analyzeGeographicDistribution(searchResult)
                        };

                        searchResult = {
                            raw_data: searchResult,
                            supplier_analytics: supplierAnalytics
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
                fullResponse = `An error occurred while retrieving supplier product details "${query}".`;
                uiStream.update(null);
                streamResults.done();
                return searchResult;
            }

            streamResults.done(JSON.stringify(searchResult));

            return searchResult;
        },
    });
};

// Helper function to calculate average unit cost
function calculateAverageCost(products: any[]): number {
    if (products.length === 0) return 0;
    const totalCost = products.reduce((sum: number, product: any) => sum + (product.unit_cost || 0), 0);
    return Number((totalCost / products.length).toFixed(2));
}

// Helper function to analyze geographic distribution
function analyzeGeographicDistribution(products: any[]): { countries: Record<string, number>; states: Record<string, number> } {
    const countryCounts: Record<string, number> = products.reduce((acc: Record<string, number>, product: any) => {
        acc[product.origin_country] = (acc[product.origin_country] || 0) + 1;
        return acc;
    }, {});

    const stateCounts: Record<string, number> = products.reduce((acc: Record<string, number>, product: any) => {
        acc[product.origin_state] = (acc[product.origin_state] || 0) + 1;
        return acc;
    }, {});

    return {
        countries: countryCounts,
        states: stateCounts
    };
}

