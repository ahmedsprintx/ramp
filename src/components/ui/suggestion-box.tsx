import { FC, useEffect, useRef, useState, useCallback } from 'react';
import "../../app/globals.css";
import Fuse from 'fuse.js';

interface PromptSuggestionBoxProps {
    isOpen: boolean;
    onClose: () => void;
    onClick: (prompt: string) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
}

export type ApiPrompts = {
    [key: string]: string[];
};

const ThreePLAllPrompts: ApiPrompts = {
    "Product Detail Manager": [
        "Give me a list of all products along with their total quantities.",
        "Fetch a list of products grouped by their inventory item ID and specific quantities.",
        "Show me the details of all products, including their suppliers and inventory item IDs.",
        "Provide a list of all active products along with their total inventory count.",
        "Get me a list of products that are kits and their corresponding quantities.",
        "Show me all products with their country of origin United states and stock levels. ",
        "List all products from the USA with inventory counts greater than 10. ",
        "Give me a breakdown of products with their supplier details and unit quantities. ",
        " Show me products added after a 2023-01-01, along with their inventory and supplier details. ",
        "Show me a list of products, including their SKUs and total stock counts. ",
        "List all products with their SKUs, GTIN, and harmonized codes. ",
        "Get me products with multiple SKUs and the total stock count for each variant. ",
        "How many products were added in this year",
        " Show me a bar chart of the total product quantities by United States",
        "Using a line graph, display the number of products added over time daily for this year. "
    ],
    "Inventory Detail Manager": [
        "List the warehouses I have in the United States along with their locations.",
        "Show me the total quantity of products in each warehouse.",
        "Show me the total quantity of products in each warehouse location.",
        "Provide a summary of all warehouse locations and their total product quantities.",
        "List all warehouse locations by country, along with their total quantities of products.",
        "Give me a breakdown of total on-hand, committed, and unsellable products for each warehouse.",
        "Show me products in each warehouse that have been marked unfulfillable and their quantities.",
        "List all products by warehouse with their on-hand, committed, and awaiting quantities.",
        "List warehouses with the highest total on-hand quantities and the amount of unsellable stock.",
        "List all of my inventory in warehouse_id_0.",
        "List all of my inventory in warehouse_id_0 and location_id_0.",
        "Using a bar chart, show me the total quantity of inventory by warehouses/warehouse locations."
    ],
    "Order Detail Manager": [
        "Give me a summary of all orders including their total price and status.",
        "Show me the details of orders with exceptions in the order status.",
        "Provide the total price and discount for all confirmed orders.",
        "Show me a breakdown of all orders along with their shipping costs and taxes.",
        "Fetch a list of all orders along with their shipping country and total product counts. ",
        "List all orders along with their order numbers, channels, and total shipments. ",
        "Which products are being shipped in order_id_72 along with their counts and prices? ",
        "Which warehouse is order_id_72 being shipped from? Can I also have its shipment ID? ",
        "Can I have the tracking numbers and tracking URLs of the shipment for order_id_72? ",
        "Which carrier is order_id_72 using for shipment? ",
        "List all the different order channels I have. ",
        "Can I know the status of all orders that have shipped as their shipment status?",
        "Show me all orders along with their shipment tracking numbers and carrier information. ",
        "List all orders with their associated shipments and the number of packages in each. ",
        "Show me the orders with multiple packages. ",
        "How many packages does the order_id_72 have in its shipment? ",
        " Using a bar chart, show me the total order quantities grouped by order status picked. ",
        "Display a line graph showing the total value of orders over time, grouped by date. ",
        "Can you make me a bar chart for all orders that were shipped, carrier-wise? ",
        "I need a graph of all the orders grouped by the order channels in the year 2024. ",

    ],

};


const fuzzySimilarityCheck = (targetString: string, array: string[]): string[] => {
    const options = {
        includeScore: true,
        shouldSort: true,
        threshold: 0.5,
        caseSensitive: false,
    };

    const fuse = new Fuse(array, options);
    const result = fuse.search(targetString).map(item => item.item);

    const exactMatches = array.filter(item => item.toLowerCase() === targetString.toLowerCase());
    return exactMatches.length > 0 ? exactMatches : result;
};

const highlightMatch = (text: string, query: string) => {
    const regex = new RegExp(`(${query})`, 'gi'); 
    const parts = text.split(regex);  
    return (
        <span>
            {parts.map((part, index) =>
                part.toLowerCase() === query.toLowerCase() ? (
                    <mark key={index} className="bg-yellow-300">{part}</mark>
                ) : (
                    <span key={index}>{part}</span>
                )
            )}
        </span>
    );
};


const PromptSuggestionBox: FC<PromptSuggestionBoxProps> = ({ isOpen, onClose, onClick, searchQuery, setSearchQuery }) => {
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const modalRef = useRef<HTMLDivElement>(null);

    const handleClickOutside = useCallback((event: MouseEvent) => {
        if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
            onClose();
        }
    }, [onClose]);

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, handleClickOutside]);

    useEffect(() => {
        if (searchQuery.length > 0) {
            const allPrompts = Object.values(ThreePLAllPrompts).flat();
            const filteredSuggestions = fuzzySimilarityCheck(searchQuery, allPrompts);
            setSuggestions(filteredSuggestions);
        } else {
            setSuggestions([]);
        }
    }, [searchQuery]);

    if (!isOpen) return null;

    return (
        <div ref={modalRef} className=" w-full">
            {suggestions.length > 0 && (
                <div
                    className={`
                            z-50 bg-white dark:bg-primaryDark  p-[5px] 
                            max-w-[780px] w-full max-h-[22rem] 
                            rounded-[5px] 
                            transition-all duration-300 ease-in-out no-scrollbar shadow-custom-white `}
                >
                    <div className="w-full overflow-y-auto max-h-72 newScrollbar">
                        {suggestions.map((suggestion, index) => {
                            const isHighlighted = suggestion.toLowerCase().includes(searchQuery.toLowerCase());

                            return (
                                <>
                                    {isHighlighted ? (
                                        <div
                                            key={index}
                                            className={` max-w-[780px] w-full  p-[10px] mb-2 rounded-[5px] cursor-pointer transition-all duration-300 ease-in-out 
                                        text-[12px] text-black dark:text-white hover:bg-[#ED3735] no-scrollbar `}
                                            onClick={() => {
                                                onClick(suggestion);
                                                setSearchQuery('');
                                            }}
                                        >
                                            {highlightMatch(suggestion, searchQuery)}
                                        </div>
                                    ) : <></>}
                                </>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PromptSuggestionBox;
