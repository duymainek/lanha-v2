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
import LandingPage from "./page/landing";
import SearchInvoicePage from "./page/search-invoice";
import InvoiceCreatePage from "./app/page/invoice-create";
import InvoiceDetailPage from "./app/page/invoice-detail";
import InvoiceEditPage from "./app/page/invoice-edit";
import ContractTemplatesPage from "./app/page/contract-templates";
import CreateContractTemplatePage from "./app/page/contract-templates/create";
import EditContractTemplatePage from "./app/page/contract-templates/edit/[id]";
import CreateContractPage from "./app/page/contracts/create";
import ContractsPage from "./app/page/contracts";
import ContractPreviewPage from "./app/page/contracts/preview/[id]";
import ContractEditPage from "./app/page/contracts/edit/[id]";
import ContractSignPage from "./page/contract-sign/[token]";

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/buildings" element={<BuildingsPage />} />
      <Route path="/expenses" element={<ExpensesPage />} />
      <Route path="/invoices" element={<InvoicesPage />} />
      <Route path="/notifications" element={<NotificationsPage />} />
      <Route path="/rooms" element={<RoomsPage />} />
      <Route path="/rooms/:roomId" element={<RoomDetailPage />} />
      <Route path="/tenants" element={<TenantsPage />} />
      <Route path="/setting" element={<SettingPage />} />
      <Route path="/search-invoice" element={<SearchInvoicePage />} />
      <Route path="/invoice-create" element={<InvoiceCreatePage />} />
      <Route path="/invoice/:id" element={<InvoiceDetailPage />} />
      <Route path="/invoice-edit/:id" element={<InvoiceEditPage />} />
      <Route path="/contract-templates" element={<ContractTemplatesPage />} />
      <Route path="/contract-templates/create" element={<CreateContractTemplatePage />} />
      <Route path="/contract-templates/edit/:id" element={<EditContractTemplatePage />} />
      <Route path="/contracts" element={<ContractsPage />} />
      <Route path="/contracts/create" element={<CreateContractPage />} />
      <Route path="/contracts/preview/:id" element={<ContractPreviewPage />} />
      <Route path="/contracts/edit/:id" element={<ContractEditPage />} />
      <Route path="/contract-sign/:token" element={<ContractSignPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
} 