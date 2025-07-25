import { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { 
  BookOpen, 
  UserPlus, 
  Calendar,
  Plus,
  Users,
  ClipboardList
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import CreateClassPage from "@/components/admin/CreateClassPage";
import CreateMentorPage from "@/components/admin/CreateMentorPage";
import ManageBookingsPage from "@/components/admin/ManageBookingsPage";


type AdminPage = 'overview' | 'create-class' | 'create-mentor' | 'manage-bookings';

export default function AdminDashboardPage() {
  const { user } = useUser();
  const [currentPage, setCurrentPage] = useState<AdminPage>('overview');

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'create-class':
        return <CreateClassPage onBack={() => setCurrentPage('overview')} />;
      case 'create-mentor':
        return <CreateMentorPage onBack={() => setCurrentPage('overview')} />;
      case 'manage-bookings':
        return <ManageBookingsPage onBack={() => setCurrentPage('overview')} />;
      default:
        return renderOverview();
    }
  };

  const renderOverview = () => (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Welcome back, {user?.firstName || 'Admin'}! Manage your tutoring platform.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">Active tutoring classes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Mentors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89</div>
            <p className="text-xs text-muted-foreground">Registered tutors</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">12</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>
      </div>

      {/* Admin Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Admin Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            onClick={() => setCurrentPage('create-class')}
            className="h-24 flex flex-col items-center justify-center space-y-2 bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-6 w-6" />
            <span className="font-medium">Create Class</span>
            <span className="text-xs opacity-90">Add new tutoring class</span>
          </Button>

          <Button
            onClick={() => setCurrentPage('create-mentor')}
            className="h-24 flex flex-col items-center justify-center space-y-2 bg-green-600 hover:bg-green-700"
          >
            <UserPlus className="h-6 w-6" />
            <span className="font-medium">Create Mentor</span>
            <span className="text-xs opacity-90">Add new tutor</span>
          </Button>

          <Button
            onClick={() => setCurrentPage('manage-bookings')}
            className="h-24 flex flex-col items-center justify-center space-y-2 bg-purple-600 hover:bg-purple-700"
          >
            <ClipboardList className="h-6 w-6" />
            <span className="font-medium">Manage Bookings</span>
            <span className="text-xs opacity-90">View and approve sessions</span>
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {renderCurrentPage()}
    </div>
  );
}