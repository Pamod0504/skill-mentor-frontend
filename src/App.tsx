import { BrowserRouter, Routes, Route } from "react-router";
import Layout from "@/components/Layout";
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import PaymentPage from "@/pages/PaymentPage";
import PostLoginRedirect from "@/pages/PostLoginRedirect";
import { AdminLayout } from "@/components/AdminLayout";
import { AdminDashboardPage } from "@/pages/AdminDashboardPage";
import { CreateMentorPage } from "@/pages/CreateMentorPage";
import { ManageBookingsPage } from "@/pages/ManageBookingsPage";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import { CreateClassPage } from "./pages/CreateClassPage";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public and Student Routes */}
        <Route path="/" element={<Layout><HomePage /></Layout>} />
        <Route path="/login" element={<Layout><LoginPage /></Layout>} />
        <Route path="/post-login" element={<PostLoginRedirect />} />
        <Route
          path="/dashboard"
          element={
            <Layout>
              <SignedIn>
                <DashboardPage />
              </SignedIn>
              <SignedOut>
                <LoginPage />
              </SignedOut>
            </Layout>
          }
        />
        <Route
          path="/payment/:sessionId"
          element={
            <Layout>
              <SignedIn>
                <PaymentPage />
              </SignedIn>
              <SignedOut>
                <LoginPage />
              </SignedOut>
            </Layout>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="ADMIN" redirectTo="/dashboard">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="classes" element={<CreateClassPage />} />
          <Route path="mentors" element={<CreateMentorPage />} />
          <Route path="bookings" element={<ManageBookingsPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Layout><LoginPage /></Layout>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
