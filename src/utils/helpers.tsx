import React from 'react';
import { RoomStatus, InvoiceStatus, ContractStatus } from '../data/types';
// Removed RecentActivity import as ACTIVITY_ICONS is removed
// import { CheckCircleIcon, ExclamationTriangleIcon, UsersIcon } from '../components/icons';


export const getStatusColor = (status: RoomStatus | InvoiceStatus | ContractStatus): string => {
  switch (status) {
    case RoomStatus.Rented:
    case InvoiceStatus.Paid:
    case ContractStatus.Active:
      return 'bg-green-100 text-green-700';
    case RoomStatus.Vacant:
    case InvoiceStatus.Pending:
    case ContractStatus.Pending:
      return 'bg-yellow-100 text-yellow-700';
    case RoomStatus.Maintenance:
    case InvoiceStatus.Overdue:
      return 'bg-red-100 text-red-700';
    case RoomStatus.DepositPaid:
      return 'bg-blue-100 text-blue-700';
    case ContractStatus.Expired:
      return 'bg-slate-100 text-slate-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

export const getStatusDotColor = (status: RoomStatus | InvoiceStatus | ContractStatus): string => {
  switch (status) {
    case RoomStatus.Rented:
    case InvoiceStatus.Paid:
    case ContractStatus.Active:
      return 'bg-green-500';
    case RoomStatus.Vacant:
    case InvoiceStatus.Pending:
    case ContractStatus.Pending:
      return 'bg-yellow-500';
    case RoomStatus.Maintenance:
    case InvoiceStatus.Overdue:
      return 'bg-red-500';
    case RoomStatus.DepositPaid:
      return 'bg-blue-500';
    case ContractStatus.Expired:
      return 'bg-slate-500';
    default:
      return 'bg-gray-500';
  }
};

// ACTIVITY_ICONS is removed as "Recent Activities" section is removed from dashboard
// export const ACTIVITY_ICONS: Record<RecentActivity['type'], (props: React.SVGProps<SVGSVGElement>) => React.ReactNode> = {
//     payment: CheckCircleIcon,
//     maintenance: ExclamationTriangleIcon,
//     new_tenant: UsersIcon,
// };

export const getInitials = (name?: string) => {
  if (!name) return '';
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
};
