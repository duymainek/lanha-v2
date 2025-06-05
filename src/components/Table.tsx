import React, { ReactNode } from 'react';
import { Spinner } from './Spinner';
import { ArrowUpIcon, ArrowDownIcon, ArrowsUpDownIcon } from './icons';

export interface TableColumn<T> {
  header: string;
  accessor: keyof T | ((item: T) => ReactNode);
  render?: (item: T) => ReactNode;
  className?: string;
  sortable?: boolean; // Can this column be sorted?
  sortKey?: keyof T;  // The actual key in T to sort by. If 'sortable' is true and this is undefined,
                     // 'accessor' will be used if it's a 'keyof T'.
}

interface TableProps<T extends { id: string | number }> {
  columns: TableColumn<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  sortConfig?: { key: keyof T | null; direction: 'ascending' | 'descending' } | null;
  onSortRequest?: (sortKey: keyof T) => void;
}

export function Table<T extends { id: string | number }> ({ 
  columns, 
  data, 
  isLoading, 
  emptyMessage = "No data available.", 
  onRowClick,
  sortConfig,
  onSortRequest
}: TableProps<T>) {
  return (
    <div className="overflow-x-auto bg-card-bg rounded-lg border border-border-color">
      <table className="min-w-full divide-y divide-border-color">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((col, index) => {
              const effectiveSortKey = col.sortKey || ( (typeof col.accessor === 'string' || typeof col.accessor === 'number' || typeof col.accessor === 'symbol') ? col.accessor as keyof T : undefined);
              const isSortable = col.sortable && effectiveSortKey && onSortRequest;
              
              return (
                <th 
                  key={index} 
                  scope="col" 
                  className={`px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider ${col.className || ''} ${isSortable ? 'cursor-pointer hover:bg-slate-100' : ''}`}
                  onClick={isSortable ? () => onSortRequest(effectiveSortKey) : undefined}
                  aria-sort={isSortable && sortConfig && sortConfig.key === effectiveSortKey ? sortConfig.direction : 'none'}
                >
                  <div className="flex items-center">
                    {col.header}
                    {isSortable && (
                      <span className="ml-1.5">
                        {sortConfig && sortConfig.key === effectiveSortKey ? (
                          sortConfig.direction === 'ascending' ? <ArrowUpIcon className="h-3.5 w-3.5" /> : <ArrowDownIcon className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowsUpDownIcon className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-500" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="bg-card-bg divide-y divide-border-color">
          {isLoading ? (
            <tr>
              <td colSpan={columns.length} className="text-center py-10">
                <div className="flex justify-center items-center">
                  <Spinner size="md" />
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr><td colSpan={columns.length} className="text-center py-10 text-text-muted">{emptyMessage}</td></tr>
          ) : (
            data.map((item) => (
              <tr key={item.id} onClick={() => onRowClick && onRowClick(item)} className={`${onRowClick ? 'cursor-pointer hover:bg-slate-50' : ''}`}>
                {columns.map((col, index) => (
                  <td key={index} className={`px-6 py-4 whitespace-nowrap text-sm text-text-main ${col.className || ''}`}>
                    {col.render 
                      ? col.render(item) 
                      : typeof col.accessor === 'function' 
                        ? col.accessor(item) 
                        : String(item[col.accessor as keyof T] ?? '')} 
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}