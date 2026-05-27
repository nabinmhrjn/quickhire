import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider, useAuth } from "@/context/AuthContext";

import Landing from "@/pages/Landing";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";

import DashboardLayout from "@/pages/dashboard/DashboardLayout";
import ClientDashboard from "@/pages/dashboard/client/ClientDashboard";
import ClientJobs from "@/pages/dashboard/client/ClientJobs";
import ClientJobDetail from "@/pages/dashboard/client/ClientJobDetail";
import PostJob from "@/pages/dashboard/client/PostJob";
import EditJob from "@/pages/dashboard/client/EditJob";
import WorkerDashboard from "@/pages/dashboard/worker/WorkerDashboard";
import BrowseJobs from "@/pages/dashboard/worker/BrowseJobs";
import WorkerJobDetail from "@/pages/dashboard/worker/WorkerJobDetail";
import MyApplications from "@/pages/dashboard/worker/MyApplications";
import Notifications from "@/pages/dashboard/Notifications";

import EditProfile from "@/pages/profile/EditProfile";
import UserProfile from "@/pages/profile/UserProfile";


function ClientGuard() {
  const { activeRole } = useAuth();
  if (activeRole === "WORKER") return <Navigate to="/worker" replace />;
  return <Outlet />;
}

function WorkerGuard() {
  const { activeRole } = useAuth();
  if (activeRole === "CLIENT") return <Navigate to="/client" replace />;
  return <Outlet />;
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<DashboardLayout />}>
            {/* Client */}
            <Route element={<ClientGuard />}>
              <Route path="/client" element={<ClientDashboard />} />
              <Route path="/client/jobs" element={<ClientJobs />} />
              <Route path="/client/jobs/new" element={<PostJob />} />
              <Route path="/client/jobs/:jobId" element={<ClientJobDetail />} />
              <Route path="/client/jobs/:jobId/edit" element={<EditJob />} />
            </Route>

            {/* Worker */}
            <Route element={<WorkerGuard />}>
              <Route path="/worker" element={<WorkerDashboard />} />
              <Route path="/worker/jobs" element={<BrowseJobs />} />
              <Route path="/worker/jobs/:jobId" element={<WorkerJobDetail />} />
              <Route path="/worker/applications" element={<MyApplications />} />
            </Route>

            {/* Shared */}
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/profile" element={<EditProfile />} />
            <Route path="/profile/:userId" element={<UserProfile />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </ThemeProvider>
  );
}
