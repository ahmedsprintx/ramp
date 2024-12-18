import { createStreamableUI } from "ai/rsc";

export type SearchResults = {
  // images: string[]
  results: SearchResultItem[];
  // query: string
};

export type ExaSearchResults = {
  results: ExaSearchResultItem[];
};

export type SerperSearchResults = {
  searchParameters: {
    q: string;
    type: string;
    engine: string;
  };
  videos: SerperSearchResultItem[];
};

export type SearchResultItem = {
  title: string;
  url: string;
  content: string;
};

export type ExaSearchResultItem = {
  score: number;
  title: string;
  id: string;
  url: string;
  publishedDate: Date;
  author: string;
};

export type SerperSearchResultItem = {
  title: string;
  link: string;
  snippet: string;
  imageUrl: string;
  duration: string;
  source: string;
  channel: string;
  date: string;
  position: number;
};

export interface Chat extends Record<string, any> {
  id: string;
  title: string;
  createdAt: Date;
  userId: string;
  path: string;
  messages: AIMessage[];
  sharePath?: string;
  isFavourite?: boolean;
  orgType?: string;
}

export type AIMessage = {
  role: "user" | "assistant" | "system" | "function" | "data" | "tool";
  content: string;
  id: string;
  name?: string;
  type?:
    | "answer"
    | "related"
    | "skip"
    | "inquiry"
    | "input"
    | "input_related"
    | "tool"
    | "followup"
    | "end";
};

export type FineTunningType = "assistant" | "tool" | "schema" | "object";

export type AgentsType =
  | "dataProcessingAgent"
  | "dataKeysAssistant"
  | "programmer"
  | "fileProcessingAssistant"
  | "fileProgrammer"
  | "writer"
  | "operationsSupervisorAgent"
  | "customerServiceSupervisorAgent"
  | "inventoryOptimizationAgent"
  | "orderFulfillmentAgent"
  | "customerServiceAgent"
  | "returnsManagementAgent"
  | "billingAndFinancialAnalysisAgent"
  | "demandForecastingAgent"
  | "supplierPerformanceAgent"
  | "routeOptimizationAgent"
  | "procurementAgent"
  | "supplierAgent"
  | "carrierPerformanceAgent";

export type ToolTypedName =
  //orderManager
  | "orderDeadlineTracking"
  | "orderAggregatedOverview"
  | "orderDetailedOverview"
  | "orderDetailsAnalysis"
  | "orderAggregatedSkuVelocity"
  | "orderDetailedSkuVelocity"
  | "orderSummaryStatistic"
  //inventoryManager
  | "inventoryProductOverviewTool"
  | "inventoryProductDetailTool"
  | "inventoryOverviewTool"
  | "inventoryDetailedOverviewTool"
  | "inventoryHealthCheck"
  //shipmentManager
  | "orderShipmentDetailedOverview"
  | "inboundShipmentAggregatedOverview"
  | "inboundShipmentDetailedOverview";

export type SchemaTypedName =
  | "date_trunc_type"
  | "channel"
  | "customer_id"
  | "max_shipping_deadline"
  | "min_shipping_deadline"
  | "order_id"
  | "reference_id"
  | "shipping_deadline"
  | "status"
  | "carrier"
  | "max_created_date"
  | "min_created_date"
  | "order_number"
  | "order_type"
  | "package_id"
  | "product_id"
  | "scac"
  | "ship_to_country"
  | "shipment_id"
  | "warehouse_customer_id"
  // Newly added fields
  | "is_picked"
  | "max_order_date"
  | "max_shipped_date"
  | "min_order_date"
  | "min_shipped_date"
  | "order_date"
  | "order_status"
  | "ship_to_city"
  | "ship_to_state"
  | "shipped_date"
  | "shipping_method"
  | "sku_id"
  | "warehouse_id"
  | "max_total_line_items"
  | "max_total_packages"
  | "max_total_price"
  | "max_total_quantity"
  | "max_total_shipments"
  | "max_total_shipping_cost"
  | "min_order_date"
  | "min_total_line_items"
  | "min_total_packages"
  | "min_total_price"
  | "min_total_quantity"
  | "min_total_shipments"
  | "min_total_shipping_cost"
  | "city"
  | "country"
  | "data"
  | "inventory_id"
  | "location_id"
  | "name"
  | "snapshot_date"
  | "state"
  | "warehouse_code"
  | "warehouse_id"
  | "active"
  | "country_of_origin"
  | "data"
  | "harmonized_code"
  | "inventory_item_id"
  | "is_kit"
  | "max_created_date"
  | "max_unit_quantity"
  | "min_created_date"
  | "min_unit_quantity"
  | "product_id"
  | "sku"
  | "supplier_name"
  | "warehouse_customer_id"
  | "max_committed_quantity"
  | "max_onhand_quantity"
  | "max_unfulfillable_quantity"
  | "min_committed_quantity"
  | "min_onhand_quantity"
  | "min_unfulfillable_quantity"
  | "product_sku"
  | "max_expected_arrival_date"
  | "min_expected_arrival_date"
  | "note"
  | "purchase_order_number"
  | "receipt_id"
  | "ship_from_country"
  | "supplier"
  | "tracking_number";

export type ObjectTypedName =
  | "furtherProcessingNeeded"
  | "kind"
  | "isFileDownloadRequired"
  | "kindOfFile"
  | "code"
  | "packages"
  | "keys"
  | "manager";

export interface ToolProps {
  uiStream: ReturnType<typeof createStreamableUI>;
  fullResponse: string;
  integration: any;
}
