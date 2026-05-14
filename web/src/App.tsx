import { Routes, Route, Navigate } from "react-router-dom";
import { AdminRoute } from "@/components/layout/AdminRoute";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { Layout } from "@/components/layout/Layout";
import { LoginPage } from "@/pages/auth/LoginPage";
import { RegisterPage } from "@/pages/auth/RegisterPage";
import { UsersPage } from "@/pages/admin/UsersPage";
import { DashboardPage } from "@/pages/dashboard/DashboardPage";
import { MatchesPage } from "@/pages/matches/MatchesPage";
import { LogMatchPage } from "@/pages/match/LogMatchPage";
import { LocationsPage } from "@/pages/locations/LocationsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/matches" element={<MatchesPage />} />
          <Route path="/matches/new" element={<LogMatchPage />} />
          <Route path="/locations" element={<LocationsPage />} />
          <Route element={<AdminRoute />}>
            <Route path="/admin/users" element={<UsersPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
