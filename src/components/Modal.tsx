import * as React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  className
}) => {
  if (!isOpen) return null;

  const sizeClasses: { [key: string]: string } = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md',
    lg: 'sm:max-w-lg',
    xl: 'sm:max-w-xl',
  };

  const modalClass = className
    ? `inline-block align-bottom bg-card-bg rounded-lg text-left overflow-hidden transform transition-all sm:my-8 sm:align-middle w-full border border-border-color ${className}`
    : `inline-block align-bottom bg-card-bg rounded-lg text-left overflow-hidden transform transition-all sm:my-8 sm:align-middle w-full border border-border-color ${sizeClasses[size]}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900 bg-opacity-75 transition-opacity" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div className={modalClass}>
          <div className="bg-card-bg px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-text-main" id="modal-title">{title}</h3>
                <div className="mt-4">
                  {children}
                </div>
              </div>
            </div>
          </div>
          {footer && (
            <div className="bg-slate-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-border-color">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};