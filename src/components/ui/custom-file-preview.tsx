import React from "react";
import { Download } from "lucide-react";

interface CustomFilePreviewProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

const CustomFilePreview: React.FC<CustomFilePreviewProps> = ({
  href,
  children,
  className = "",
  ...props
}) => {
  return (
    <a
      href={href}
      className={`w-[326px] h-[71px] mt-2 mb-2 flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors duration-200 font-medium ${className}`}
      target='_blank'
      rel='noopener noreferrer'
      {...props}
    >
      <Download size={18} />
      <div className='flex flex-col items-start ml-[20px]'>
        <span className='text-sm mb-2'>{children}</span>
        <span className='text-xs text-zinc-400'>Click to Download File</span>
      </div>
    </a>
  );
};

export default CustomFilePreview;
