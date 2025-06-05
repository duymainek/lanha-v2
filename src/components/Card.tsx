import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  actions?: ReactNode;
}
export const Card: React.FC<CardProps> = ({ children, className, title, actions }) => {
  return (
    <div className={`bg-card-bg rounded-lg border border-border-color ${className || ''}`}>
      {(title || actions) && (
        <div className="px-4 py-5 sm:px-6 border-b border-border-color flex justify-between items-center">
          {title && <h3 className="text-lg leading-6 font-medium text-text-main">{title}</h3>}
          {actions && <div className="ml-4 flex-shrink-0">{actions}</div>}
        </div>
      )}
      <div className="p-4 sm:p-6">
        {children}
      </div>
    </div>
  );
};