import React, { useState } from "react";
import PromptModal from "./prompt-modal";
import { useActions, useUIState } from "ai/rsc";
import { AI } from "@/lib/actions";
import { generateId } from "ai";
import { UserMessage } from "../user-message";
import { useAuthInfo } from "@propelauth/react";
import { useChatContext } from "@/lib/context/agent.context";

export type ApiPrompts = {
  [key: string]: string[];
};

const ThreePLPrompts: ApiPrompts = {
  ts_product_details_api: [
    "Give me a list of all products along with their total quantities.",
  ],

  ts_warehouse_inventory_details_api: [
    "List open return items with rates over 15% ",
  ],
  ts_returns_details_api: ["What orders need attention?"],
  ts_order_details_api: ["Perform an inventory health check"],
  ts_sku_velocity_api: [
    "Flag inbound shipments with high-priority items that have quantity mismatches",
  ],
  ts_product_details_api_detailed: [
    "Compare August’s daily order volume with the estimated daily average order volume of September and flag any deviations above 15%.",
  ],
};

const PromptBoxes: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [, setMessages] = useUIState<typeof AI>();
  const { onSubmitMessage } = useActions();
  const { user, accessToken } = useAuthInfo();
  const { currentOrgType, currentIntegration } = useChatContext();

  async function handleQuerySubmit(query: string, formData?: FormData) {
    const userMessageId = generateId();
    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: userMessageId,
        role: "user",
        content: query,
        component: <UserMessage message={query} messageId={userMessageId} />,
      },
    ]);

    const data = formData || new FormData();
    if (!formData) {
      data.append("input", query);
    }
    const responseMessage = await onSubmitMessage(
      userMessageId,
      user,
      accessToken,
      data,
      currentIntegration || {},
      currentOrgType || "3pl"
    );
    setMessages((currentMessages) => [...currentMessages, responseMessage]);
  }

  const handleClick = async (prompt: string) => {
    await handleQuerySubmit(prompt);
  };

  const openModal = () => {
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  return (
    <div className='h-full w-full flex justify-center items-center'>
      <div className='flex flex-col items-center'>
        <div className='prompt-boxes grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4'>
          {Object.keys(ThreePLPrompts)
            .slice(0, 6)
            .map((api, index) => (
              <div
                key={index}
                onClick={() => handleClick(ThreePLPrompts[api][0])}
                className='group box border bg-white dark:bg-transparent border-black dark:border-white p-4 rounded-lg shadow-md hover:bg-gray-200 dark:hover:bg-gray-100 transition duration-300 ease-in-out cursor-pointer'
              >
                <p className='text-sm font-medium text-black dark:text-white group-hover:text-gray-700'>
                  {ThreePLPrompts[api][0]}
                </p>
              </div>
            ))}
        </div>
        <div className='text-start pl-4 mt-4' onClick={openModal}>
          <p className='text-xs underline cursor-pointer'>View More</p>
        </div>
        <PromptModal
          isOpen={showModal}
          onClose={closeModal}
          onClick={handleClick}
          orgType={currentOrgType ? currentOrgType : "3pl"}
        />
      </div>
    </div>
  );
};

export default PromptBoxes;
