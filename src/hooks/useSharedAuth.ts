import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';

// Shared token state
let sharedToken: string | null = null;
let tokenExpiry: number | null = null;
let tokenListeners: Set<() => void> = new Set();

export const useSharedAuth = () => {
  const { getToken } = useAuth();
  const [token, setToken] = useState<string | null>(sharedToken);
  const [isLoading, setIsLoading] = useState(false);

  // Subscribe to token updates
  useEffect(() => {
    const listener = () => setToken(sharedToken);
    tokenListeners.add(listener);
    
    return () => {
      tokenListeners.delete(listener);
    };
  }, []);

  const notifyListeners = useCallback(() => {
    tokenListeners.forEach(listener => listener());
  }, []);

  const isTokenValid = useCallback((token: string | null): boolean => {
    if (!token || !tokenExpiry) return false;
    
    // Check if token expires in next 5 minutes (300 seconds)
    const now = Math.floor(Date.now() / 1000);
    return tokenExpiry > (now + 300);
  }, []);

  const getSharedToken = useCallback(async (): Promise<string> => {
    console.log("=== SHARED TOKEN DEBUG ===");
    
    // Return cached token if still valid
    if (sharedToken && isTokenValid(sharedToken)) {
      console.log("Using cached token");
      return sharedToken;
    }

    console.log("Fetching new token...");
    setIsLoading(true);

    try {
      // Try multiple token retrieval methods
      let newToken = await getToken({ template: "skill-mentor-auth-frontend" });
      
      if (!newToken) {
        throw new Error("Authentication token not available");
      }

      // Decode token to get expiry
      try {
        const payload = JSON.parse(atob(newToken.split('.')[1]));
        console.log("New token payload:", payload);
        console.log("Role in token:", payload.role);
        
        tokenExpiry = payload.exp;
        const expiryDate = new Date(payload.exp * 1000);
        console.log("Token expires at:", expiryDate);
        console.log("Token is valid:", isTokenValid(newToken));
      } catch (e) {
        console.error("Could not decode token:", e);
      }

      // Cache the token
      sharedToken = newToken;
      setToken(newToken);
      notifyListeners();

      console.log("Token cached successfully");
      console.log("=== END SHARED TOKEN DEBUG ===");
      
      return newToken;
    } catch (error) {
      console.error("Failed to get token:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [getToken, isTokenValid, notifyListeners]);

  const clearToken = useCallback(() => {
    console.log("Clearing shared token");
    sharedToken = null;
    tokenExpiry = null;
    setToken(null);
    notifyListeners();
  }, [notifyListeners]);

  return {
    token,
    isLoading,
    getSharedToken,
    clearToken,
    isTokenValid: isTokenValid(token)
  };
};
