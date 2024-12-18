const BASE_URL = "https://api.us-east.aws.tinybird.co/v0/pipes";

const ENDPOINTS = {
  ORDER_VOLUME: `${BASE_URL}/ts_order_volume_summary_api`,
  INVENTORY_HEALTH: `${BASE_URL}/ts_inventory_health_check_api`,
  LABOR_SHIFT: `${BASE_URL}/ts_labor_shift_recommendations_api`,
  INBOUND_EXCEPTION: `${BASE_URL}/ts_inbound_exception_api`,
  DUPLICATE_TRACKING: `${BASE_URL}/ts_orders_duplicate_tracking_api`,
  ORDER_DETAILS: `${BASE_URL}/ts_order_details_api`,
  RETURNS_DETAILS: `${BASE_URL}/ts_returns_details_api`,
  ORDER_DEADLINE: `${BASE_URL}/ts_order_deadline_tracking_api`,
  PRODUCT_DETAILS: `${BASE_URL}/ts_product_details_api`,
  WAREHOUSE_INVENTORY: `${BASE_URL}/ts_warehouse_inventory_details_api`,
  SKU_VELOCITY: `${BASE_URL}/ts_sku_velocity_api`,
  INBOUND_SHIPMENTS: `${BASE_URL}/ts_inbound_shipments_details_api`,
  INVENTORY_HEALTH_CHECK: `${BASE_URL}/ts_inventory_health_check_api`,
  LABOR_SHIFT_RECOMMENDATIONS: `${BASE_URL}/ts_labor_shift_recommendations`,
  GET_ALL_BRANDS: `${BASE_URL}/ts_get_all_brands`,
  SUPPLIER_DETAILS: `${BASE_URL}/ts_supplier_products`,
};

export default ENDPOINTS;
