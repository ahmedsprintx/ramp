import { X } from 'lucide-react';
import React from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
}

const GraphModal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" style={{ zIndex: 9998 }}>
            <div className="bg-white rounded-lg p-4 relative" style={{ width: '60vw', height: '63vh', zIndex: 9999 }}>
                <div className='w-full flex justify-end items-center'>
                    <X onClick={onClose} className="h-[16px] w-[16px] object-cover rounded-lg cursor-pointer text-black self-end" />
                </div>
                {children}
            </div>
        </div>
    );
};

export default GraphModal;