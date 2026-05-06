import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import { useAuth } from "./contexts/AuthContext";
import DashboardPage from "./pages/DashboardPage";
import ContactsPage from "./pages/ContactsPage";
import ContactFormPage from "./pages/ContactFormPage";
import ContactDetailPage from "./pages/ContactDetailPage";
import RequirementsPage from "./pages/RequirementsPage";
import RequirementFormPage from "./pages/RequirementFormPage";
import PropertiesPage from "./pages/PropertiesPage";
import PropertyFormPage from "./pages/PropertyFormPage";
import PropertyDetailPage from "./pages/PropertyDetailPage";
import FollowUpsPage from "./pages/FollowUpsPage";
import ViewingsPage from "./pages/ViewingsPage";
import ReportsPage from "./pages/ReportsPage";
import BackupExportPage from "./pages/BackupExportPage";
import LoginPage from "./pages/LoginPage";

function FullPageLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600 dark:bg-slate-950 dark:text-slate-200">
      <div className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm shadow dark:border-slate-800 dark:bg-slate-900">
        Loading...
      </div>
    </div>
  );
}

function NotFoundPage() {
  return (
    <div className="card">
      <h2 className="text-lg font-semibold">Page not found</h2>
      <p className="text-sm text-slate-500">The page you are looking for does not exist.</p>
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <FullPageLoading />;
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />

      <Route path="/" element={user ? <AppLayout /> : <Navigate to="/login" replace />}>
        <Route index element={<DashboardPage />} />
        <Route path="contacts" element={<ContactsPage />} />
        <Route path="contacts/new" element={<ContactFormPage />} />
        <Route path="contacts/:id" element={<ContactDetailPage />} />
        <Route path="contacts/:id/edit" element={<ContactFormPage />} />
        <Route path="requirements" element={<RequirementsPage />} />
        <Route path="requirements/new" element={<RequirementFormPage />} />
        <Route path="requirements/:id/edit" element={<RequirementFormPage />} />
        <Route path="properties" element={<PropertiesPage />} />
        <Route path="properties/new" element={<PropertyFormPage />} />
        <Route path="properties/:id" element={<PropertyDetailPage />} />
        <Route path="properties/:id/edit" element={<PropertyFormPage />} />
        <Route path="follow-ups" element={<FollowUpsPage />} />
        <Route path="viewings" element={<ViewingsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="backup-export" element={<BackupExportPage />} />
        <Route path="404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Route>

      <Route path="*" element={<Navigate to={user ? "/" : "/login"} replace />} />
    </Routes>
  );
}
