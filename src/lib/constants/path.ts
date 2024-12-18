const BASE_URL = "https://api.us-east.aws.tinybird.co/v0/pipes";

const ENDPOINTS = {
  ORDER_DETAILS: `${BASE_URL}/order_details`,
  DELAYED_ORDERS: `${BASE_URL}/delayed_orders`,
  STOCK_REPLENISHMENT: `${BASE_URL}/low_stock_inventory`,
  MOST_ORDERED_SKU: `${BASE_URL}/most_ordered_skus`,
  INBOUND_SHIPMENT_DETAILS: `${BASE_URL}/inbound_shipment_details`,
};

export default ENDPOINTS;
