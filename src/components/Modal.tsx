import React from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export const Modal: React.FC<ModalProps> = React.memo(
  ({ isOpen, onClose, children, className = "" }) => {
    if (!isOpen) return null;

    return (
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 ${className}`}
        onClick={onClose}
      >
        <div
          className="bg-gray-800 text-white p-4 sm:p-6 rounded-xl shadow-2xl border border-gray-700 max-w-sm w-full"
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    );
  },
);

Modal.displayName = "Modal";
