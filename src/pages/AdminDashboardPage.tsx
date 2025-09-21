import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { LayoutDashboard, GraduationCap, Users, Calendar } from "lucide-react";
import { BACKEND_URL } from "@/config/env";
import { useAuth, useUser } from "@clerk/clerk-react";


interface AdminStats {
  totalClasses: number;
  totalMentors: number;
  totalSessions: number;
  pendingBookings: number;
  acceptedSessions: number;
  completedSessions: number;
}

export function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats>({
    totalClasses: 0,
    totalMentors: 0,
    totalSessions: 0,
    pendingBookings: 0,
    acceptedSessions: 0,
    completedSessions: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    try {
      let token = await getToken({ template: "skill-mentor-auth-frontend" });
      if (!token) {
        token = await getToken();
        console.log("token:", token);
      }
    
      if (!token) {
        console.error("No authentication token available");
        setIsLoading(false);
        return;
      }
      
      const headers = {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      };
      // Fetch classes count
      const classesResponse = await fetch(`${BACKEND_URL}/academic/classroom`, { headers });
      const classesData = classesResponse.ok ? await classesResponse.json() : [];
      // Fetch mentors count
      const mentorsResponse = await fetch(`${BACKEND_URL}/academic/mentor`, { headers });
      const mentorsData = mentorsResponse.ok ? await mentorsResponse.json() : [];
      // Fetch sessions for bookings stats
      const sessionsResponse = await fetch(`${BACKEND_URL}/academic/session`, { headers });
      const sessionsData = sessionsResponse.ok ? await sessionsResponse.json() : [];
      setStats({
        totalClasses: classesData.length,
        totalMentors: mentorsData.length,
        totalSessions: sessionsData.length,
        pendingBookings: sessionsData.filter((s: any) => s.session_status === 'PENDING').length,
        acceptedSessions: sessionsData.filter((s: any) => s.session_status === 'ACCEPTED').length,
        completedSessions: sessionsData.filter((s: any) => s.session_status === 'COMPLETED').length,
      });
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      console.error("Failed to fetch admin stats:", error);
    }
  };
  const statsArray = [
    {
      name: "Total Classes",
      value: stats.totalClasses.toString(),
      icon: GraduationCap,
      color: "bg-blue-500",
    },
    {
      name: "Total Mentors",
      value: stats.totalMentors.toString(),
      icon: Users,
      color: "bg-green-500",
    },
    {
      name: "Total Sessions",
      value: stats.totalSessions.toString(),
      icon: LayoutDashboard,
      color: "bg-indigo-500",
    },
    {
      name: "Pending Bookings",
      value: stats.pendingBookings.toString(),
      icon: Calendar,
      color: "bg-yellow-500",
    },
    {
      name: "Accepted Sessions",
      value: stats.acceptedSessions.toString(),
      icon: Calendar,
      color: "bg-green-600",
    },
    {
      name: "Completed Sessions",
      value: stats.completedSessions.toString(),
      icon: LayoutDashboard,
      color: "bg-purple-500",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="mt-2 text-sm text-gray-600">
          Welcome to the admin dashboard. Here's an overview of your platform.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-6 lg:grid-cols-4 xl:grid-cols-4">
        {statsArray.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.name} className="relative overflow-hidden">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 ${stat.color} rounded-md flex items-center justify-center`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {stat.name}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {isLoading ? "..." : stat.value}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <p className="text-sm text-gray-600">New mentor "John Doe" was added</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <p className="text-sm text-gray-600">Class "A/L Mathematics" was created</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <p className="text-sm text-gray-600">5 new bookings pending approval</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="font-medium text-gray-900">Create New Class</div>
                <div className="text-sm text-gray-500">Add a new tutoring class</div>
              </button>
              <button className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="font-medium text-gray-900">Add New Mentor</div>
                <div className="text-sm text-gray-500">Register a new mentor</div>
              </button>
              <button className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="font-medium text-gray-900">Review Bookings</div>
                <div className="text-sm text-gray-500">Manage pending bookings</div>
              </button>
            </div>
          </div>
        </Card>

      
      </div>
    </div>
  );
}
