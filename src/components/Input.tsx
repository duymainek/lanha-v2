import React, { ReactNode } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  Icon?: (props: React.SVGProps<SVGSVGElement>) => ReactNode;
}
export const Input: React.FC<InputProps> = ({ label, id, error, Icon, className, ...props }) => {
  const baseClasses = "block w-full border rounded-md py-2 px-3 sm:text-sm";
  const iconPadding = Icon ? 'pl-10' : '';
  
  const errorClasses = error 
    ? 'border-red-500 text-red-900 placeholder-red-700 focus:outline-none focus:ring-red-500 focus:border-red-500' 
    : 'border-border-color focus:outline-none focus:ring-primary focus:border-primary';

  return (
    <div className="w-full">
      {label && <label htmlFor={id} className="block text-sm font-medium text-text-main mb-1">{label}</label>}
      <div className="relative rounded-md">
        {Icon && <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center"><Icon className="h-5 w-5 text-gray-400" aria-hidden="true" /></div>}
        <input
          id={id}
          className={`${baseClasses} ${iconPadding} ${errorClasses} ${className || ''}`}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};