import { useUser } from "@clerk/clerk-react";
import { useEffect } from "react";
import { useNavigate } from "react-router";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  requiredRole = "admin", 
  redirectTo = "/dashboard" 
}: ProtectedRouteProps) {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoaded) {
      if (!user) {
        // User not authenticated, redirect to sign-in
        navigate("/login");
        return;
      }

      if (requiredRole && user?.publicMetadata?.role !== requiredRole) {
        // User doesn't have required role, redirect
        navigate(redirectTo);
        return;
      }
    }
  }, [isLoaded, user, requiredRole, redirectTo, navigate]);

  // Show loading while checking authentication
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Don't render children if user doesn't have access
  if (!user || (requiredRole && user?.publicMetadata?.role !== requiredRole)) {
    return null;
  }

  return <>{children}</>;
}
