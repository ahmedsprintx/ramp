import { ToolProps } from "../types";
import { get_supplier_product_details } from "./supplier_product_details";
import { inbound_exception } from "./inbound_exception";
import { inbound_shipments_details } from "./inbound_shipments_details";
import { inventory_health_check } from "./inventory_health_check";
import { labor_shift_recommendations } from "./labor_shift_recommendations";
import { order_deadline_tracking } from "./order_deadline_tracking";
import { order_details } from "./order_details";
import { order_volume_summary } from "./order_volume_summary";
import { orders_duplicate_tracking } from "./orders_duplicate_tracking";
import { product_details } from "./product_details";
import { analyze_supplier_risks } from "./analyze_supplier_risks";
import { returns_details } from "./returns_details";
import { sku_velocity } from "./sku_velocity";
import { get_supplier_performance } from "./supplier_perforamance";
import { warehouse_inventory_details } from "./warehouse_inventory_details";

export const getInventoryOptimizationTools = ({
  uiStream,
  fullResponse,
  integration,
}: ToolProps) => {
  const tools: any = {
    get_sales_data: order_details({ uiStream, fullResponse, integration }),
    get_product_details: product_details({
      uiStream,
      fullResponse,
      integration,
    }),
    get_warehouse_inventory_levels: warehouse_inventory_details({
      uiStream,
      fullResponse,
      integration,
    }),
    inventory_health_details: inventory_health_check({
      uiStream,
      fullResponse,
      integration,
    }),
    get_sku_velocity: sku_velocity({ uiStream, fullResponse, integration }),
    get_inbound_shipments_details: inbound_shipments_details({
      uiStream,
      fullResponse,
      integration,
    }),
  };
  return tools;
};
export const getOrderFulfillmentTools = ({
  uiStream,
  fullResponse,
  integration,
}: ToolProps) => {
  const tools: any = {
    get_order_details: order_details({ uiStream, fullResponse, integration }),
    get_orders_near_deadline: order_deadline_tracking({
      uiStream,
      fullResponse,
      integration,
    }),
    get_warehouse_inventory_levels: warehouse_inventory_details({
      uiStream,
      fullResponse,
      integration,
    }),
    get_labor_shift_recommendations: labor_shift_recommendations({
      uiStream,
      fullResponse,
      integration,
    }),
    get_duplicate_orders: orders_duplicate_tracking({
      uiStream,
      fullResponse,
      integration,
    }),
  };
  return tools;
};
export const getReturnManagementTools = ({
  uiStream,
  fullResponse,
  integration,
}: ToolProps) => {
  const tools: any = {
    get_returns_details: returns_details({
      uiStream,
      fullResponse,
      integration,
    }),
    get_product_details: product_details({
      uiStream,
      fullResponse,
      integration,
    }),
    get_warehouse_inventory_levels: warehouse_inventory_details({
      uiStream,
      fullResponse,
      integration,
    }),
  };
  return tools;
};
export const getOperationsSupervisorTools = ({
  uiStream,
  fullResponse,
  integration,
}: ToolProps) => {
  const tools: any = {
    get_order_volume_summary: order_volume_summary({
      uiStream,
      fullResponse,
      integration,
    }),
    get_inventory_health: inventory_health_check({
      uiStream,
      fullResponse,
      integration,
    }),
    get_labor_shift_recommendations: labor_shift_recommendations({
      uiStream,
      fullResponse,
      integration,
    }),
    get_inbound_exceptions: inbound_exception({
      uiStream,
      fullResponse,
      integration,
    }),
    get_duplicate_orders: orders_duplicate_tracking({
      uiStream,
      fullResponse,
      integration,
    }),
  };

  return tools;
};
export const getCustomerServiceSupervisorTools = ({
  uiStream,
  fullResponse,
  integration,
}: ToolProps) => {
  const tools: any = {
    get_order_details: order_details({ uiStream, fullResponse, integration }),
    get_returns_details: returns_details({
      uiStream,
      fullResponse,
      integration,
    }),
    get_orders_near_deadline: order_deadline_tracking({
      uiStream,
      fullResponse,
      integration,
    }),
    get_duplicate_orders: orders_duplicate_tracking({
      uiStream,
      fullResponse,
      integration,
    }),
  };

  return tools;
};
export const getCustomerServiceTools = ({
  uiStream,
  fullResponse,
  integration,
}: ToolProps) => {
  const tools: any = {
    get_order_details: order_details({ uiStream, fullResponse, integration }),
    get_returns_details: returns_details({
      uiStream,
      fullResponse,
      integration,
    }),
    get_orders_near_deadline: order_deadline_tracking({
      uiStream,
      fullResponse,
      integration,
    }),
    get_duplicate_orders: orders_duplicate_tracking({
      uiStream,
      fullResponse,
      integration,
    }),
    get_warehouse_inventory_total_levels: warehouse_inventory_details({
      uiStream,
      fullResponse,
      integration,
    }),
    get_top_selling_products: sku_velocity({
      uiStream,
      fullResponse,
      integration,
    }),
    get_product_details: product_details({
      uiStream,
      fullResponse,
      integration,
    }),
    get_inventory_health: inventory_health_check({
      uiStream,
      fullResponse,
      integration,
    }),
    get_sales_data: sku_velocity({ uiStream, fullResponse, integration }),
    get_orders: order_volume_summary({
      uiStream,
      fullResponse,
      integration,
    }),
  };

  return tools;
};
export const getBillingAndFinancialAnalysisTools = ({
  uiStream,
  fullResponse,
  integration,
}: ToolProps) => {
  const tools: any = {
    get_order_volume_summary: order_volume_summary({
      uiStream,
      fullResponse,
      integration,
    }),
    get_returns_details: returns_details({
      uiStream,
      fullResponse,
      integration,
    }),
    get_duplicate_orders: orders_duplicate_tracking({
      uiStream,
      fullResponse,
      integration,
    }),
  };

  return tools;
};
export const getDemandForecastingTools = ({
  uiStream,
  fullResponse,
  integration,
}: ToolProps) => {
  const tools: any = {
    get_orders: order_details({ uiStream, fullResponse, integration }),
    // get_sku_velocity: sku_velocity({ uiStream, fullResponse, integration }),

    // get_order_volume_summary: order_volume_summary({
    //   uiStream,
    //   fullResponse,
    //   integration,
    // }),
  };

  return tools;
};

// export const getSupplierPerformanceTools = ({
//   uiStream,
//   fullResponse,
//   integration,
// }: ToolProps) => {
//   const tools: any = {
//     get_inbound_shipments_details: inbound_shipments_details({
//       uiStream,
//       fullResponse,
//       integration,
//     }),
//     get_inbound_exceptions: inbound_exception({
//       uiStream,
//       fullResponse,
//       integration,
//     }),
//   };

//   return tools;
// };
export const getRouteOptimizationTools = ({
  uiStream,
  fullResponse,
  integration,
}: ToolProps) => {
  const tools: any = {
    get_order_details: order_details({ uiStream, fullResponse, integration }),

    get_duplicate_orders: orders_duplicate_tracking({
      uiStream,
      fullResponse,
      integration,
    }),
  };

  return tools;
};
export const getProcurementTools = ({
  uiStream,
  fullResponse,
  integration,
}: ToolProps) => {
  const tools: any = {
    get_inbound_shipments_details: inbound_shipments_details({
      uiStream,
      fullResponse,
      integration,
    }),
    product_details: product_details({ uiStream, fullResponse, integration }),

    get_inbound_exceptions: inbound_exception({
      uiStream,
      fullResponse,
      integration,
    }),
  };

  return tools;
};
export const getCarrierPerformanceTools = ({
  uiStream,
  fullResponse,
  integration,
}: ToolProps) => {
  const tools: any = {
    get_order_details: order_details({ uiStream, fullResponse, integration }),
    get_duplicate_orders: orders_duplicate_tracking({
      uiStream,
      fullResponse,
      integration,
    }),
    get_sku_velocity: sku_velocity({ uiStream, fullResponse, integration }),
  };

  return tools;
};

export const getSupplierAgentTools = ({
  uiStream,
  fullResponse,
  integration,
}: ToolProps) => {
  const tools: any = {
    get_supplier_performance: get_supplier_performance({
      uiStream,
      fullResponse,
      integration,
    }),
    analyze_supplier_risks: analyze_supplier_risks({
      uiStream,
      fullResponse,
      integration,
    }),
    get_supplier_product_details: get_supplier_product_details({
      uiStream,
      fullResponse,
      integration,
    }),
  };
  return tools;
};

export const getTools = (
  name: string,
  { uiStream, fullResponse, integration }: ToolProps
) => {
  switch (name) {
    //3pl
    case "inventoryOptimizationAgent":
      return getInventoryOptimizationTools({
        uiStream,
        fullResponse,
        integration,
      });
    case "orderFulfillmentAgent":
      return getOrderFulfillmentTools({
        uiStream,
        fullResponse,
        integration,
      });
    case "returnsManagementAgent":
      return getReturnManagementTools({
        uiStream,
        fullResponse,
        integration,
      });
    case "operationsSupervisorAgent":
      return getOperationsSupervisorTools({
        uiStream,
        fullResponse,
        integration,
      });
    case "customerServiceSupervisorAgent":
      return getCustomerServiceSupervisorTools({
        uiStream,
        fullResponse,
        integration,
      });
    case "customerServiceAgent":
      return getCustomerServiceTools({
        uiStream,
        fullResponse,
        integration,
      });
    case "billingAndFinancialAnalysisAgent":
      return getBillingAndFinancialAnalysisTools({
        uiStream,
        fullResponse,
        integration,
      });
    case "demandForecastingAgent":
      return getDemandForecastingTools({
        uiStream,
        fullResponse,
        integration,
      });
    // case "supplierPerformanceAgent":
    //   return getSupplierPerformanceTools({
    //     uiStream,
    //     fullResponse,
    //     integration,
    //   });
    case "routeOptimizationAgent":
      return getRouteOptimizationTools({
        uiStream,
        fullResponse,
        integration,
      });
    case "procurementAgent":
      return getProcurementTools({
        uiStream,
        fullResponse,
        integration,
      });
    case "carrierPerformanceAgent":
      return getCarrierPerformanceTools({
        uiStream,
        fullResponse,
        integration,
      });
    case "supplierAgent":
      return getSupplierAgentTools({
        uiStream,
        fullResponse,
        integration,
      });

    default:
      throw new Error(`Agent ${name} not found.`);
  }
};
