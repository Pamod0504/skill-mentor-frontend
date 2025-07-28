import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { CalendarDays } from "lucide-react";
import { StatusPill } from "@/components/StatusPill";
import { FullSession } from "@/lib/types";
import { useNavigate } from "react-router";
import { BACKEND_URL } from "@/config/env";

export default function DashboardPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const [courses, setCourses] = useState<FullSession[]>([]);
  const router = useNavigate();
  const { getToken } = useAuth();
  const { user } = useUser();

  // Check if user is admin and redirect to admin dashboard
  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      if (user.publicMetadata?.role === 'admin') {
        router('/admin');
        return;
      }
    }
  }, [isLoaded, isSignedIn, user, router]);

  useEffect(() => {
    async function createOrFetchUser() {
      if (!user) return;

      console.log("=== DASHBOARD TOKEN DEBUGGING ===");
      console.log("User info:", {
        userId: user.id,
        email: user.primaryEmailAddress?.emailAddress,
        firstName: user.firstName,
        lastName: user.lastName,
        publicMetadata: user.publicMetadata,
        role: user.publicMetadata?.role
      });

      // Try different token approaches
      let token = await getToken();
      console.log("Token without template:", token ? "Token received" : "No token");
      console.log("Token without template length:", token?.length);
      if (token) {
        console.log("FULL TOKEN (without template):", token);
      }
      
      if (!token) {
        token = await getToken({ template: "skill-mentor-auth-frontend" });
        console.log("Token with template:", token ? "Token received" : "No token");
        console.log("Token with template length:", token?.length);
        if (token) {
          console.log("FULL TOKEN (with template):", token);
        }
      }
      
      // If still no token, try alternatives
      if (!token) {
        console.log("Trying alternative token approaches...");
        try {
          token = await getToken({ template: "default" });
          console.log("Token with 'default' template:", token ? "Token received" : "No token");
          if (token) {
            console.log("FULL TOKEN (with default template):", token);
          }
        } catch (e) {
          console.log("Default template failed:", e);
        }
      }

      // Decode JWT payload for debugging
      if (token) {
        try {
          const parts = token.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]));
            console.log("JWT payload:", {
              sub: payload.sub,
              iss: payload.iss,
              aud: payload.aud,
              exp: payload.exp,
              iat: payload.iat,
              role: payload.role,
              permissions: payload.permissions,
              customClaims: Object.keys(payload).filter(key => 
                !['sub', 'iss', 'aud', 'exp', 'iat', 'nbf', 'jti'].includes(key)
              )
            });
            console.log("Token expiration:", new Date(payload.exp * 1000));
            console.log("Token issued at:", new Date(payload.iat * 1000));
          }
        } catch (e) {
          console.error("Failed to decode JWT:", e);
        }
      }

      if (!token) {
        console.error("No authentication token available");
        return;
      }

      // Prepare a payload that matches with the  backend endpoint requirements
      const userPayload = {
        clerk_student_id: user.id,
        first_name: user.firstName,
        last_name: user.lastName,
        email: user.primaryEmailAddress?.emailAddress,
        phone_number: "-",
        address: "-",
        age: 20,
      };

      console.log("Creating/fetching student with payload:", userPayload);
      console.log("Backend URL:", `${BACKEND_URL}/academic/student`);
      console.log("FULL TOKEN being used for API call:", token);
      console.log("Request headers:", {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token.substring(0, 20)}...` // Only show first 20 chars for security
      });

      try {
        // Perform API call to create/fetch user in backend
        const createdUser = await fetch(`${BACKEND_URL}/academic/student`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(userPayload),
        });

        console.log("Student creation response status:", createdUser.status);
        console.log("Student creation response headers:", Object.fromEntries(createdUser.headers.entries()));

        if (!createdUser.ok) {
          const errorText = await createdUser.text();
          console.error("Student creation error response:", errorText);
          console.error("Full student creation response details:", {
            status: createdUser.status,
            statusText: createdUser.statusText,
            url: createdUser.url,
            headers: Object.fromEntries(createdUser.headers.entries())
          });
          throw new Error(`Failed to create/fetch user: ${createdUser.status} - ${errorText}`);
        }

        // Logging the details to the console
        const userData = await createdUser.json();
        console.log("User ID:", user.id);
        console.log("FULL USER TOKEN:", token);
        console.log("User created/fetched successfully:", userData);
      } catch (error) {
        console.error("Error creating/fetching user:", error);
      }
    }

    if (isLoaded && isSignedIn) {
      createOrFetchUser();
    }
  }, [isLoaded, isSignedIn]);

  useEffect(() => {
    async function fetchSessions() {
      if (!user) return;

      console.log("=== FETCHING SESSIONS ===");
      
      // Try different token approaches for sessions
      let token = await getToken();
      console.log("Sessions - Token without template:", token ? "Token received" : "No token");
      
      if (!token) {
        token = await getToken({ template: "skill-mentor-auth-frontend" });
        console.log("Sessions - Token with template:", token ? "Token received" : "No token");
      }
      
      if (!token) {
        console.error("No token available for fetching sessions");
        return;
      }

      console.log("Fetching sessions for user:", user.id);
      console.log("Sessions API URL:", `${BACKEND_URL}/academic/session/student/${user.id}`);
      console.log("FULL TOKEN being used for sessions fetch:", token);

      try {
        const response = await fetch(
          `${BACKEND_URL}/academic/session/student/${user.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        console.log("Sessions fetch response status:", response.status);
        console.log("Sessions fetch response headers:", Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Sessions fetch error response:", errorText);
          console.error("Full sessions fetch response details:", {
            status: response.status,
            statusText: response.statusText,
            url: response.url,
            headers: Object.fromEntries(response.headers.entries())
          });
          throw new Error(`Failed to fetch user sessions: ${response.status} - ${errorText}`);
        }

        const data: FullSession[] = await response.json();
        console.log("Sessions fetched successfully:", data);
        console.log("Number of sessions:", data.length);
        setCourses(data);
      } catch (error) {
        console.error("Error fetching sessions:", error);
      }
    }

    if (isLoaded && isSignedIn) {
      fetchSessions();
    }
  }, [isLoaded, isSignedIn]);

  if (!isLoaded) {
    return (
      <div className="container py-10">
        <div className="flex items-center justify-center">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    );
  }
  if (!isSignedIn) {
    router("/login");
  }

  if (!courses.length) {
    return (
      <div className="container py-10">
        <h1 className="text-3xl font-bold tracking-tight mb-6">My Courses</h1>
        <p className="text-muted-foreground">No courses enrolled yet.</p>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold tracking-tight mb-6">My Courses</h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <div
            key={course.session_id}
            className="rounded-2xl p-6 relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600"
          >
            {/* Status Pill */}
            <div className="absolute top-4 right-4">
              <StatusPill status={course.session_status} />
            </div>

            {/* Profile Image */}
            <div className="size-24 rounded-full bg-white/10 mb-4 relative">
              {course.mentor.mentor_image ? (
                <img
                  src={course.mentor.mentor_image}
                  alt={course.mentor.first_name}
                  className="w-full h-full object-cover object-top rounded-full"
                />
              ) : (
                <span className="text-2xl font-semibold">
                  {course.mentor.first_name.charAt(0)}
                </span>
              )}
            </div>

            {/* Course Info */}
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-white">
                {course.topic}
              </h2>
              <p className="text-blue-100/80">
                Mentor:{" "}
                {course.mentor.first_name + " " + course.mentor.last_name}
              </p>
              <div className="flex items-center text-blue-100/80 text-sm mt-2">
                <CalendarDays className="mr-2 h-4 w-4" />
                Next Session: {new Date(course.start_time).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
