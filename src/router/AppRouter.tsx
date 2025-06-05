import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { Layout } from '../layout/Layout';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { TenantManagementPage } from '../pages/TenantManagementPage';
import { BuildingManagementPage } from '../pages/BuildingManagementPage';
import { RoomManagementPage } from '../pages/RoomManagementPage';
import { InvoiceManagementPage } from '../pages/InvoiceManagementPage';
import { NotificationManagementPage } from '../pages/NotificationManagementPage';
import { SettingsPage } from '../pages/SettingsPage';
import { RoomDetailPage } from '../pages/RoomDetailPage';
import { ExpensesPage } from '../pages/ExpensesPage';

const AppRouter: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/tenants" element={<TenantManagementPage />} />
          <Route path="/buildings" element={<BuildingManagementPage />} />
          <Route path="/rooms" element={<RoomManagementPage />} />
          <Route path="/rooms/:roomId" element={<RoomDetailPage />} />
          <Route path="/invoices" element={<InvoiceManagementPage />} />
          <Route path="/notifications" element={<NotificationManagementPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/expenses" element={<ExpensesPage />} />
          <Route path="*" element={<Navigate to="/" replace />} /> 
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRouter;