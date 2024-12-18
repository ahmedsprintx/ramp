"use client";
import { useState } from "react";
import "../../app/globals.css";
import Image from "next/image";
import { ChevronDown } from "lucide-react";

interface BaseSelectProps {
  selectedValue: string;
  onSelect: (e: any) => void;
  label: string;
  options: any;
  height?: string;
  width?: string;
}
const BaseSelect = ({
  selectedValue,
  onSelect,
  options = [],
  label,
  height,
  width,
}: BaseSelectProps) => {
  const [openMenu, setOpenMenu] = useState(false);

  return (
    <div
      className={`flex items-center justify-between relative cursor-pointer gap-[5px] bg-primaryLight dark:bg-primaryDark z-[100] px-[10px] py-[5px] rounded-[5px] ${
        width ? `min-w-[${width}]` : "min-w-[100px]"
      } border-[0.5px] border-textPrimaryLight dark:border-textPrimaryDark`}
      onClick={() => setOpenMenu(!openMenu)}
    >
      <span className='text-[14px] font-poppins font-normal'>{label}</span>
      <ChevronDown className='h-[16px] w-[16px] text-black dark:text-white' />
      {openMenu && (
        <div
          className={`absolute w-[${
            width ? width : "100px"
          }]] top-10 right-0 p-[5px] rounded-[5px] shadow-custom-white bg-white dark:bg-black`}
        >
          {options.map((ele: any) => (
            <div
              key={ele?.company_url || ""}
              className={
                "flex justify-start items-center p-[10px] rounded-[5px]"
              }
              style={{
                background:
                  selectedValue === ele?.company_url || "" ? "#6329D6" : "",
              }}
              onClick={() => onSelect(ele || {})}
            >
              <span
                className='text-[12px] font-normal font-poppins'
                style={{
                  color:
                    selectedValue === ele?.company_url || "" ? "white" : "",
                }}
              >
                {ele?.company_url || ""}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BaseSelect;
