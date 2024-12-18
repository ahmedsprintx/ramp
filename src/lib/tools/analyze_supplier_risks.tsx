import axios from "axios";
import { ToolProps } from "@/lib/types";
import { tool } from "ai";
import { createStreamableValue } from "ai/rsc";
import z from "zod";
import ENDPOINTS from "../constants/path";

export const analyze_supplier_risks = ({
  uiStream,
  fullResponse,
  integration,
}: ToolProps) => {
  return tool({
    description: `Comprehensive supplier risk analysis tool that:
    - Identifies exception patterns and trends
    - Tracks late arrivals and quantity mismatches
    - Provides risk scoring for suppliers
    
    Supports filtering by:
    - Supplier name
    - Exception status
    - Date ranges
    - Warehouse and brand details`,
    parameters: z.object({
      supplier: z
        .string()
        .optional()
        .describe("Filter results by specific supplier name"),
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
      min_expected_arrival_date: z
        .string()
        .optional()
        .describe("Minimum expected arrival date for filtering exceptions"),
      max_expected_arrival_date: z
        .string()
        .optional()
        .describe("Maximum expected arrival date for filtering exceptions"),
      warehouse_id: z
        .string()
        .optional()
        .describe("Filter by specific warehouse ID"),
      data: z
        .enum(["details"])
        .optional()
        .describe('Use "details" for comprehensive exception information'),
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
          `${ENDPOINTS.INBOUND_EXCEPTION}.${format}`,
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

          // Add risk analysis metrics
          if (searchResult && Array.isArray(searchResult)) {
            const riskAnalysis = {
              total_exceptions: searchResult.length,
              exception_breakdown: searchResult.reduce((acc: Record<string, number>, exception: any) => {
                acc[exception.exception_status] =
                  (acc[exception.exception_status] || 0) + 1;
                return acc;
              }, {}),
              suppliers_with_exceptions: Array.from(new Set(searchResult.map((e: any) => e.supplier))),
              risk_score_calculation: calculateRiskScore(searchResult)
            };

            searchResult = {
              raw_data: searchResult,
              risk_analysis: riskAnalysis
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
        fullResponse = `An error occurred while analyzing supplier risks "${query}".`;
        uiStream.update(null);
        streamResults.done();
        return searchResult;
      }

      streamResults.done(JSON.stringify(searchResult));

      return searchResult;
    },
  });
};

// Helper function to calculate supplier risk score
function calculateRiskScore(exceptions: any[]): number {
  if (exceptions.length === 0) return 0;

  const exceptionWeights: Record<string, number> = {
    'Late Arrival': 0.5,
    'Quantity Mismatch': 0.4,
    'Late Arrival & Quantity Mismatch': 0.7
  };

  const riskScores = exceptions.map(exception =>
    exceptionWeights[exception.exception_status] || 0.1
  );

  const averageRiskScore =
    riskScores.reduce((sum, score) => sum + score, 0) / exceptions.length;

  // Scale risk score to 0-100
  return Math.min(Math.round(averageRiskScore * 100), 100);
}

