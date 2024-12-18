import { FC, useCallback, useEffect, useRef, useState } from "react";
import "../../app/globals.css";
import { useOrganizationContext } from "@/lib/context/organisation.context";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatId: string;
  onShare: (chatId: string) => Promise<void>;
  sharePath?: string;
}

const ShareModal: FC<ShareModalProps> = ({
  isOpen,
  onClose,
  chatId,
  onShare,
  sharePath,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  const { orgSettingData } = useOrganizationContext();
  const [isLoading, setIsLoading] = useState(false);

  const handleShareClick = async () => {
    setIsLoading(true);
    await onShare(chatId);
    setIsLoading(false);
  };

  const handleCopy = () => {
    if (sharePath) {
      navigator.clipboard.writeText(sharePath);
      alert("URL copied to clipboard!");
    }
  };

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
        className='bg-primaryLight dark:bg-primaryDark p-[20px] rounded-[10px] shadow-custom-white max-w-[400px] w-full transition-transform transform scale-95 ease-out duration-300 flex flex-col gap-[15px] animate-zoom-in'
      >
        <h2 className='font-poppins text-[16px] font-bold text-textPrimaryLight dark:text-textPrimaryDark '>
          Share Chat
        </h2>

        {isLoading ? (
          <div className='flex justify-center'>
            <div className='w-8 h-8 border-4 border-t-4 border-gray-300 border-t-blue-500 rounded-full animate-spin'></div>
          </div>
        ) : sharePath ? (
          <>
            <p className='font-poppins text-[16px] text-textPrimaryLight dark:text-textPrimaryDark font-normal '>
              Here’s the URL to share this chat:
            </p>
            <div className='font-poppins bg-textPrimaryDark py-[10px] px-[20px] rounded-[10px] text-sm text-gray-800 break-all '>
              {sharePath}
            </div>
          </>
        ) : (
          <p className='font-poppins text-sm text-textPrimaryLight dark:text-textPrimaryDark '>
            This chat hasn’t been shared yet. Would you like to generate a
            shareable link?
          </p>
        )}
        <div className='w-full flex justify-evenly items-center gap-x-[10px]'>
          <button
            onClick={onClose}
            className='font-poppins min-w-fit l py-[10px] px-[30px] text-textPrimaryLight dark:text-textPrimaryDark border border-textPrimaryLight dark:border-textPrimaryDark rounded-[38px]  transition-all ease-in-out'
          >
            Close
          </button>
          {sharePath ? (
            <button
              onClick={handleCopy}
              style={{ backgroundColor: orgSettingData?.orgColor || "#6329D6" }}
              className={`font-poppins w-full py-[10px] px-[30px] text-white rounded-[38px]  transition-all ease-in-out`}
            >
              Copy URL
            </button>
          ) : (
            <button
              onClick={handleShareClick}
              style={{ backgroundColor: orgSettingData?.orgColor || "#6329D6" }}
              className={`font-poppins w-full py-[10px] px-[30px] text-white  rounded-[38px]  transition-all ease-in-out`}
            >
              Generate Link
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
