"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import React, { useState } from "react";

interface MessageBarProps {
  type: string;
  text: string;
  assistant: string;
}

const MessageBar: React.FC<MessageBarProps> = ({ type, text, assistant }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleAccordion = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className='w-full'>
      {/* Accordion Header */}
      <div
        onClick={toggleAccordion}
        className='text-sm cursor-pointer flex justify-between align-center w-max  text-[#7d7d7d] hover:text-black'
      >
        <div className='container-accordion'>
          <p className='accordion-header-text'>{type}</p>
        </div>

        <span>
          {isOpen ? (
            <ChevronUp color='#7d7d7d' />
          ) : (
            <ChevronDown color='#7d7d7d' />
          )}
        </span>
      </div>

      {/* Accordion Content */}
      {isOpen && (
        <div className='w-11/12 p-2 bg-[#E5E5E5] rounded-md text-sm'>
          <p>Working Assistant : {assistant}</p>
          <span>Details: {text}</span>
        </div>
      )}
    </div>
  );
};

export default MessageBar;
