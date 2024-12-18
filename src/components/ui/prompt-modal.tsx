import { FC, useCallback, useEffect, useMemo, useRef } from "react";
import "../../app/globals.css";
import { X } from "lucide-react";

interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClick: (prompt: string) => void;
  orgType?: string;
}

export type ApiPrompts = {
  [key: string]: string[];
};

// const ThreePLAllPrompts: ApiPrompts = {
//   "Product Detail Manager": [
//     "Give me a list of all products along with their total quantities.",
//     "Fetch a list of products grouped by their inventory item ID and specific quantities.",
//     "Show me the details of all products, including their suppliers and inventory item IDs.",
//     "Give me the orders of this year which are active.",
//     "Give me the products of August.",
//   ],
//   "Inventory Detail Manager": [
//     "Provide a list of all active products along with their total inventory count.",
//     "Get me a list of products that are kits and their corresponding quantities.",
//     "Show me all products with their country of origin United States and stock levels.",
//     "Give me a list of all products.",
//   ],
//   "Order Detail Manager": [
//     "Provide a summary of all warehouse locations and their total product quantities.",
//     "List all warehouse locations by country, along with their total quantities of products.",
//     "List all the different order channels I have.",
//     "Show me the orders with multiple packages.",
//     "Give me a list of orders of this year.",
//     "Give me a list of orders of last year.",
//   ],
//   // "SKU Velocity Manager": [
//   //     "Give me a list of SKUs along with their total velocity.",
//   //     "Fetch the top 10 SKUs with the highest velocity.",
//   //     "Show me the total velocity for SKU sku_12.",
//   //     "List all SKUs sorted by their velocity from highest to lowest.",
//   //     "Show me detailed velocity information for SKU sku_12 including order and shipment dates.",
//   //     "Fetch a list of SKUs shipped from warehouse_id_1 along with their velocity and shipment status. ",
//   //     "Give me a detailed summary of SKUs that were shipped using shipping_method_id_1 and their velocity.",
//   //     "Fetch the SKUs with total velocity for orders shipped after August 1st, 2024. ",
//   //     "Show me the SKUs with total velocity for orders shipped to Chasehaven. ",
//   //     "Show me all SKUs with velocity for orders placed between July 1st and July 31st, 2024. ",
//   //     "List SKUs that were shipped after July 24th, 2024, and their velocity. ",
//   //     "Fetch SKUs with velocity for orders placed in 2024 and shipped from warehouse_id_1. ",
//   //     "Create a bar chart comparing the total SKU velocity for different shipping methods. ",
//   //     "Show me a bar chart of SKUs with the highest total velocity. ",
//   //     "Using a bar chart, display the total SKU velocity grouped by shipping city. ",
//   //     "Display a line graph showing the SKU velocity over time for all orders shipped in 2024. "
//   // ],
//   // "Returns Detail Manager": [
//   //     "Give me a summary of all returns along with their total quantities and statuses.",
//   //     "Fetch the details of all returns along with their tracking numbers and carriers.",
//   //     "Show me the total quantity returned and restocked for each return.",
//   //     "List all open returns along with their tracking numbers.",
//   //     "Fetch all returns processed through UPS with their tracking numbers.",
//   //     "List the top 5 returns by total quantity returned. ",
//   //     "Fetch all returns from warehouse_id_1 with their total quantities returned and restocked. ",
//   //     "Show me the detailed return data for return_id_1, including SKUs and quantities. ",
//   //     "Which SKUs were returned in return_id_1 along with their quantities. ",
//   //     "Give me a detailed breakdown of returns that were shipped after July 1st, 2024. ",
//   //     "Show me all returns that were initialized in the month of July 2024. ",
//   //     "Provide a summary of all returns, including tracking numbers, processed within the last 30 days. ",
//   //     "Show me a bar chart of the total quantity returned for each return status.",
//   //     "Display a line graph of return quantities over time, grouped by returned dates. ",
//   //     "Create a bar chart comparing the total quantity restocked for each warehouse. ",
//   //     "Using a bar chart, display the total quantities returned grouped by carrier. "
//   // ]
// };

const prompts = [
  "Identify items with return rates exceeding 15% regardless of status and recommend alternatives.",
  "Compare August’s order volume with the average order volume of September and flag any deviations above 15%.",
  "List open return items with rates over 15% ",
  "Identify items in the bottom 10% for turnover and suggest clearance or discounting.",
  "Flag inbound shipments with high-priority items that have quantity mismatches.",
  "What orders need attention?",
  "Perform an inventory health check",
];

const PromptModal: FC<PromptModalProps> = ({
  isOpen,
  onClose,
  onClick,
  orgType,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, handleClickOutside]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-60 transition-opacity duration-300 ease-in-out w-screen h-screen'>
      <div
        ref={modalRef}
        className='bg-primaryLight dark:bg-primaryDark p-[20px] rounded-[10px] shadow-custom-white max-w-[400px] w-full transition-transform transform scale-95 ease-out duration-300 flex flex-col gap-[15px] animate-zoom-in max-h-[90vh] overflow-y-hidden'
      >
        <div className='w-full flex justify-end items-center'>
          <X
            onClick={() => onClose()}
            className='h-[16px] w-[16px] object-cover rounded-lg cursor-pointer text-black dark:text-white'
          />
        </div>
        <div className='overflow-y-scroll no-scrollbar '>
          <div className='mb-4'>
            <p className='text-[16px] font-semibold mb-1 text-black dark:text-white'>
              Prompts
            </p>
          </div>
          {prompts.map((item) => (
            <div key={item} className='mb-4'>
              <div
                className=' border bg-white dark:bg-transparent  border-black dark:border-white rounded-lg shadow-md hover:bg-gray-200 hover:text-black dark:hover:bg-gray-100 text-[12px] my-4 p-[10px] cursor-pointer'
                key={item}
                onClick={() => onClick(item)}
              >
                {item}
              </div>
            </div>
          ))}

          {/* {Object.keys(ThreePLAllPrompts).map((api) => (
            <div key={api} className='mb-4'>
              <p className='text-[16px] font-semibold mb-1 text-black dark:text-white'>
                {api}
              </p>
              <div>
                {ThreePLAllPrompts[api].map((prompt, index) => (
                  <div
                    className=' border bg-white dark:bg-transparent  border-black dark:border-white rounded-lg shadow-md hover:bg-gray-200 hover:text-black dark:hover:bg-gray-100 text-[12px] my-4 p-[10px] cursor-pointer'
                    key={index}
                    onClick={() => onClick(prompt)}
                  >
                    {prompt}
                  </div>
                ))}
              </div>
            </div>
          ))} */}
        </div>
      </div>
    </div>
  );
};

export default PromptModal;
