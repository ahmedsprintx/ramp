import { FC, useCallback, useEffect, useRef } from 'react';
import '../../app/globals.css'

interface DeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onDelete: () => Promise<void>;
    isDeleting: boolean;
    title: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
}

const DeleteModal: FC<DeleteModalProps> = ({
    isOpen,
    onClose,
    onDelete,
    isDeleting,
    title,
    description = 'Are you sure?',
    confirmText = 'Delete',
    cancelText = 'Cancel',
}) => {
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
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    if (!isOpen) return null;
    return (

        <div className="fixed inset-0 z-50  flex items-center justify-center bg-gray-900 bg-opacity-60 transition-opacity duration-300 ease-in-out w-screen h-screen">
            <div ref={modalRef} className="max-w-[400px] w-full p-[20px] bg-primaryLight dark:bg-primaryDark rounded-[10px] shadow-custom-white transition-transform transform scale-95 ease-out duration-300 flex flex-col gap-[15px] animate-zoom-in">
                <h2 className="font-poppins text-[16px] font-bold text-textPrimaryLight dark:text-textPrimaryDark">{title}</h2>
                <p className="font-poppins text-[16px] font-normal text-textPrimaryLight dark:text-textPrimaryDark">{description}</p>
                <div className="w-full flex justify-evenly items-center gap-x-[10px]">
                    <button
                        onClick={onClose}
                        className="font-poppins min-w-fit l py-[10px] px-[30px] text-textPrimaryLight dark:text-textPrimaryDark border border-textPrimaryLight dark:border-textPrimaryDark rounded-[38px]  transition-all ease-in-out"
                    >
                        {cancelText}
                    </button>
                    <button
                        disabled={isDeleting}
                        onClick={async () => {
                            await onDelete();
                            onClose();
                        }}
                        className="font-poppins w-full py-[10px] px-[30px] text-white  border border-primaryRed rounded-[38px] bg-primaryRed transition-all ease-in-out"
                    >
                        {isDeleting ? 'Processing...' : confirmText}
                    </button>

                </div>
            </div>
        </div>

    );
};

export default DeleteModal;
