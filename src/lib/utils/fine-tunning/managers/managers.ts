const manager3PLAssistant = {
  inventoryManager: `This advanced system handles a wide range of inventory management queries. When processing a query, follow these steps:
  1. Analyze the query to determine its focus and level of detail required:
     - Is it about overall warehouse inventory?
     - Is it about detailed inventory status?
     - Is it about general product information?
     - Is it about specific product details?
  2. Based on the analysis, select the appropriate tool:
     - For high-level warehouse queries:
     - For detailed inventory status:
     - For general product information:
     - For specific product details
     - For granular, warehouse-specific product tracking
  3. If the query is complex and spans multiple areas:
     - Use multiple tools in combination
     - Start with the most relevant tool based on the primary focus of the query
     - Supplement with data from other tools as needed
  4. For ambiguous queries:
     - If the user requests more detail, then use the corresponding detailed tool
  5. Always prioritize detailed tools over overview tools when specific information is requested
  6. If no specific parameters are provided, use the most appropriate tool based on the query's context and fetch comprehensive data
  Remember to provide insights on inventory optimization, identify potential issues, highlight patterns or trends, and offer predictive analytics when relevant.
  Ensure that the response is tailored to the specific query, providing precise and actionable inventory insights.`,
  orderManager: `This intelligent system manages a wide range of order-related queries. Follow these steps when processing a query:
  1. Analyze the query to understand the specific request:
     - Is the query related to order deadlines or shipping details?
     - Does it focus on high-level order summaries or detailed order information?
     - Is the query centered on SKU performance or velocity data?
  3. If the query spans multiple categories:
     - Start with the tool most relevant to the primary focus of the query
     - Combine data from additional tools if necessary to cover all aspects of the query
  4. Handle ambiguous queries by: `,
  shipmentManager: `This intelligent system manages a wide range of order shipment-related queries using specialized tools designed to handle for order shipment and  both inbound and outbound shipments. Follow these steps when processing a query:
  1. Analyze the query to understand the specific shipment request:
     - Is the query focused on shipments such as tracking, carrier information, or shipment status?
     - Is it focused on high-level inbound shipment summaries or detailed inbound shipment information like item quantities, receipts, or expected vs. received status?
     - Does the user need to know about specific shipment costs, carrier performance, or inventory details tied to shipments?
  3. If the query spans multiple shipment categories:
     - Start with the tool most relevant to the primary focus of the query, whether it's inbound or outbound. 
`,
};

type AvailableManagers = {
  [key: string]: string;
};

function getAvailableMangers(agent?: string) {
  console.log(agent);
  switch (agent) {
    case "3PL":
      return manager3PLAssistant;
    default:
      return manager3PLAssistant;
  }
}

export const getAvailableMangersDescriptions = (agent?: string) => {
  const availableManagers: any = getAvailableMangers(agent);
  const managerKeys = Object.keys(availableManagers) as Array<
    keyof AvailableManagers
  >;

  // Construct a description string for all available managers
  const managerDescriptions = managerKeys
    .map((key) => `${key}: ${availableManagers[key]}`)
    .join("\n");

  return { managerDescriptions, managerKeys };
};
