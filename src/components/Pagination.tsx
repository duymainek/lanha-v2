import React from 'react';
import { Button } from './Button';
import { Select } from './Select';
import { ChevronLeftIcon, ChevronRightIcon, ChevronDoubleLeftIcon, ChevronDoubleRightIcon } from './icons';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
  onItemsPerPageChange: (value: string | number) => void;
  totalItems: number;
  itemsPerPageOptions?: number[];
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  onItemsPerPageChange,
  totalItems,
  itemsPerPageOptions = [10, 25, 50, 100],
}) => {
  if (totalPages <= 0 && totalItems <= 0) return null; // Hide if no items or pages

  const handleItemsPerPageSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onItemsPerPageChange(Number(e.target.value));
  };
  
  const startItem = totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <nav className="flex items-center justify-between border-t border-border-color bg-card-bg px-4 py-3 sm:px-6 text-sm text-text-muted" aria-label="Pagination">
      <div className="flex-1 flex justify-start">
        {/* Placeholder for "X of Y row(s) selected." For now, show total items */}
        {totalItems > 0 ? (
          <p>
             {/* For future row selection: {selectedRowCount} of {totalItems} row(s) selected. */}
            Showing {startItem}-{endItem} of {totalItems} items
          </p>
        ) : (
          <p>No items</p>
        )}
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <span>Rows per page</span>
          <Select
            value={itemsPerPage}
            onChange={handleItemsPerPageSelect}
            options={itemsPerPageOptions.map(option => ({ value: option, label: String(option) }))}
            className="py-1.5 text-sm rounded-md border-gray-300 focus:ring-primary focus:border-primary"
          />
        </div>
        
        <span>
          Page {totalPages > 0 ? currentPage : 0} of {totalPages > 0 ? totalPages : 0}
        </span>

        <div className="flex items-center space-x-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1 || totalPages === 0}
            className="p-1.5 border-gray-300 hover:bg-gray-100"
            aria-label="First page"
          >
            <ChevronDoubleLeftIcon className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1 || totalPages === 0}
            className="p-1.5 border-gray-300 hover:bg-gray-100"
            aria-label="Previous page"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0}
            className="p-1.5 border-gray-300 hover:bg-gray-100"
            aria-label="Next page"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages || totalPages === 0}
            className="p-1.5 border-gray-300 hover:bg-gray-100"
            aria-label="Last page"
          >
            <ChevronDoubleRightIcon className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </nav>
  );
};