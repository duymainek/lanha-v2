import React from 'react';
import { Building } from '../data/types';

/**
 * Tabbar filter buildings (UI kiểu switch bo tròn, height gọn)
 * @param {Object} props
 * @param {Building[]} props.buildings - Danh sách building
 * @param {string} props.selectedBuildingId - ID building đang chọn ('' là All)
 * @param {(id: string) => void} props.onSelect - Callback khi chọn tab
 * @param {string} [props.className] - Custom className
 */
export const BuildingTabBar: React.FC<{
  buildings: Building[];
  selectedBuildingId: string;
  onSelect: (id: string) => void;
  className?: string;
}> = ({ buildings, selectedBuildingId, onSelect, className }) => {
  return (
    <div className={`flex bg-slate-50 rounded-full p-1 h-10 items-center ${className || ''}`} style={{ minHeight: 40, height: 40 }}>
      <button
        className={`h-8 px-5 rounded-full font-medium text-base transition flex items-center ${
          selectedBuildingId === ''
            ? 'bg-white text-gray-900 shadow'
            : 'bg-transparent text-gray-500 hover:text-gray-700 border-none shadow-none'
        }`}
        style={{ lineHeight: 1, minHeight: 32 }}
        onClick={() => onSelect('')}
      >
        All
      </button>
      {buildings.map((b) => (
        <button
          key={b.id}
          className={`h-8 px-5 rounded-full font-medium text-base transition flex items-center ml-1 ${
            selectedBuildingId === b.id
              ? 'bg-white text-gray-900 shadow'
              : 'bg-transparent text-gray-500 hover:text-gray-700 border-none shadow-none'
          }`}
          style={{ lineHeight: 1, minHeight: 32 }}
          onClick={() => onSelect(b.id)}
        >
          {b.name}
        </button>
      ))}
    </div>
  );
}; 