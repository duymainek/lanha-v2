import { Routes, Route, Navigate } from "react-router-dom";
import DashboardPage from "./app/page/dashboard";
import BuildingsPage from "./app/page/buildings";
import ExpensesPage from "./app/page/expenses";
import InvoicesPage from "./app/page/invoices";
import NotificationsPage from "./app/page/notifications";
import RoomsPage from "./app/page/rooms";
import RoomDetailPage from "./app/page/rooms/[roomId]";
import TenantsPage from "./app/page/tenants";
import SettingPage from "./app/page/setting";
import LoginPage from "./page/login";

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/buildings" element={<BuildingsPage />} />
      <Route path="/expenses" element={<ExpensesPage />} />
      <Route path="/invoices" element={<InvoicesPage />} />
      <Route path="/notifications" element={<NotificationsPage />} />
      <Route path="/rooms" element={<RoomsPage />} />
      <Route path="/rooms/:roomId" element={<RoomDetailPage />} />
      <Route path="/tenants" element={<TenantsPage />} />
      <Route path="/setting" element={<SettingPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
} 