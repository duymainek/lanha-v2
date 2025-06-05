import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string | number; label: string }>;
}
export const Select: React.FC<SelectProps> = ({ label, id, error, options, className, ...props }) => {
  const baseClasses = "block w-full border rounded-md py-2 px-3 sm:text-sm";
  const errorClasses = error
    ? 'border-red-500 text-red-900 focus:outline-none focus:ring-red-500 focus:border-red-500'
    : 'border-border-color focus:outline-none focus:ring-primary focus:border-primary';

  return (
    <div className="w-full">
      {label && <label htmlFor={id} className="block text-sm font-medium text-text-main mb-1">{label}</label>}
      <select
        id={id}
        className={`${baseClasses} ${errorClasses} ${className || ''}`}
        {...props}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};