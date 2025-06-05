import React, { ReactNode } from 'react';

interface BadgeProps {
  colorClass: string;
  children: ReactNode;
}
export const Badge: React.FC<BadgeProps> = ({ colorClass, children }) => {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {children}
    </span>
  );
};

/**
 * Hiển thị badge trạng thái phòng (Room Status)
 * @param {Object} props
 * @param {string} props.status - Trạng thái phòng: 'occupied', 'comming_soon', 'available'
 * @returns {JSX.Element}
 */
export const RoomStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  let colorClass = 'bg-gray-100 text-gray-700';
  let label = status;
  switch (status) {
    case 'occupied':
      colorClass = 'bg-red-100 text-red-700';
      label = 'Occupied';
      break;
    case 'coming_soon':
      colorClass = 'bg-yellow-100 text-yellow-700';
      label = 'Coming Soon';
      break;
    case 'available':
      colorClass = 'bg-green-100 text-green-700';
      label = 'Available';
      break;
    default:
      label = status;
  }
  return (
    <Badge colorClass={colorClass}>{label}</Badge>
  );
};