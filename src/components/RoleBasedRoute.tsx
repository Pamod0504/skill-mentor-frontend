import { useUser } from "@clerk/clerk-react";
import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router";

interface RoleBasedRouteProps {
  children: ReactNode;
  requiredRole: string;
  redirectTo?: string;
}

export function RoleBasedRoute({ 
  children, 
  requiredRole, 
  redirectTo = "/dashboard" 
}: RoleBasedRouteProps) {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoaded) return; // Wait for user data to load

    if (!user) {
      navigate("/login");
      return;
    }

    // Check user role from Clerk's public metadata
    const userRole = user.publicMetadata?.role as string;
    
    if (userRole !== requiredRole) {
      navigate(redirectTo);
      return;
    }
  }, [user, isLoaded, requiredRole, redirectTo, navigate]);

  // Show loading state while checking authentication
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show loading state while user data is being fetched
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Authenticating...</p>
        </div>
      </div>
    );
  }

  const userRole = user.publicMetadata?.role as string;
  
  // If user doesn't have the required role, show unauthorized message
  if (userRole !== requiredRole) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access this page.</p>
          <p className="text-sm text-gray-500 mt-2">Redirecting...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
