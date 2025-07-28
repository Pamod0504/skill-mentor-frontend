import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/hooks/use-toast";
import { StatusPill } from "@/components/StatusPill";
import { SessionStatus } from "@/lib/types";
import { useAuth } from "@clerk/clerk-react";
import { BACKEND_URL } from "@/config/env";

interface Booking {
  session_id: number;
  class_name?: string;
  student_name?: string;
  mentor_name?: string;
  session_date: string;
  session_duration?: number;
  status?: SessionStatus | string | null;
  // Additional fields that might come from backend
  topic?: string;
  start_time?: string;
  end_time?: string;
  session_status?: SessionStatus | string;
  student?: {
    first_name?: string;
    last_name?: string;
    email?: string;
  };
  mentor?: {
    first_name?: string;
    last_name?: string;
    title?: string;
  };
  class_room?: {
    title?: string;
    class_image?: string;
  };
}

export function ManageBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | SessionStatus>('all');
  const { toast } = useToast();
  const { getToken } = useAuth();

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    // Filter bookings based on status filter
    if (statusFilter === 'all') {
      setFilteredBookings(bookings);
    } else {
      setFilteredBookings(bookings.filter(booking => 
        normalizeStatus(booking.status) === statusFilter
      ));
    }
  }, [bookings, statusFilter]);

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      const token = await getToken({ template: "skill-mentor-auth-frontend" });
      if (!token) return;

      console.log("Fetching sessions from:", `${BACKEND_URL}/academic/session`);
      
      const response = await fetch(`${BACKEND_URL}/academic/session`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      console.log("Sessions fetch response:", response.status);
      
      if (response.ok) {
        const rawData = await response.json();
        console.log("Raw session data:", rawData);
        
        // Process the data to match our interface
        const processedData = rawData.map((session: any) => ({
          session_id: session.session_id,
          class_name: session.class_room?.title || session.class_name || 'Unknown Class',
          student_name: session.student 
            ? `${session.student.first_name || ''} ${session.student.last_name || ''}`.trim()
            : session.student_name || 'Unknown Student',
          mentor_name: session.mentor
            ? `${session.mentor.title || ''} ${session.mentor.first_name || ''} ${session.mentor.last_name || ''}`.trim()
            : session.mentor_name || 'Unknown Mentor',
          session_date: session.start_time || session.session_date || new Date().toISOString(),
          session_duration: session.session_duration || 
            (session.start_time && session.end_time 
              ? Math.round((new Date(session.end_time).getTime() - new Date(session.start_time).getTime()) / (1000 * 60 * 60))
              : 1),
          status: session.session_status || session.status || SessionStatus.PENDING,
          topic: session.topic,
          start_time: session.start_time,
          end_time: session.end_time,
        }));
        
        console.log("Processed session data:", processedData);
        setBookings(processedData);
      } else {
        const errorText = await response.text();
        console.error("Failed to fetch sessions:", response.status, errorText);
        throw new Error(`Failed to fetch sessions: ${response.status}`);
      }
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
      toast({
        title: "Error",
        description: "Failed to fetch bookings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const normalizeStatus = (status: any): SessionStatus | null => {
    if (!status) return null;
    if (typeof status === 'string') {
      const upperStatus = status.toUpperCase();
      if (upperStatus === 'PENDING') return SessionStatus.PENDING;
      if (upperStatus === 'ACCEPTED') return SessionStatus.ACCEPTED;
      if (upperStatus === 'COMPLETED') return SessionStatus.COMPLETED;
    }
    return status;
  };

  const updateBookingStatus = async (bookingId: number, newStatus: SessionStatus.ACCEPTED | SessionStatus.COMPLETED) => {
    try {
      const token = await getToken({ template: "skill-mentor-auth-frontend" });
      if (!token) return;

      const response = await fetch(`${BACKEND_URL}/academic/session/${bookingId}?sessionStatus=${newStatus}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setBookings(prev => 
          prev.map(booking => 
            booking.session_id === bookingId 
              ? { ...booking, status: newStatus }
              : booking
          )
        );
        
        toast({
          title: "Success",
          description: `Booking ${newStatus.toLowerCase()} successfully!`,
        });
      } else {
        throw new Error("Failed to update booking status");
      }
    } catch (error) {
      console.error("Error updating booking status:", error);
      toast({
        title: "Error",
        description: "Failed to update booking status",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="max-w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Manage Bookings</h1>
        <p className="mt-2 text-sm text-gray-600">
          Review and manage all session bookings from students.
        </p>
      </div>

      {/* Status Filter */}
      <div className="mb-6">
        <div className="flex space-x-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              statusFilter === 'all'
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            All ({bookings.length})
          </button>
          <button
            onClick={() => setStatusFilter(SessionStatus.PENDING)}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              statusFilter === SessionStatus.PENDING
                ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Pending ({bookings.filter(b => normalizeStatus(b.status) === SessionStatus.PENDING).length})
          </button>
          <button
            onClick={() => setStatusFilter(SessionStatus.ACCEPTED)}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              statusFilter === SessionStatus.ACCEPTED
                ? 'bg-green-100 text-green-700 border border-green-200'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Accepted ({bookings.filter(b => normalizeStatus(b.status) === SessionStatus.ACCEPTED).length})
          </button>
          <button
            onClick={() => setStatusFilter(SessionStatus.COMPLETED)}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              statusFilter === SessionStatus.COMPLETED
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Completed ({bookings.filter(b => normalizeStatus(b.status) === SessionStatus.COMPLETED).length})
          </button>
        </div>
      </div>

      <Card className="w-full min-h-screen">
        <div className="px-6 py-8 sm:px-8 sm:py-10">
          {filteredBookings.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">
                {statusFilter === 'all' ? 'No bookings found.' : `No ${statusFilter.toLowerCase()} bookings found.`}
              </p>
            </div>
          ) : (
            <div className="w-full">
              <table className="w-full table-auto border-collapse">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                      Session ID
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                      Class
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                      Student
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                      Mentor
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                      Session Date
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                      Duration
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                      Status
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {filteredBookings.map((booking) => (
                    <tr key={booking.session_id} className="hover:bg-gray-50 border-b border-gray-200">
                      <td className="px-4 py-6 text-sm font-medium text-gray-900">
                        #{booking.session_id}
                      </td>
                      <td className="px-4 py-6 text-sm font-medium text-gray-900">
                        <div className="max-w-xs">
                          {booking.class_name}
                          {booking.topic && (
                            <div className="text-xs text-gray-500 mt-1">
                              Topic: {booking.topic}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-6 text-sm text-gray-500">
                        <div className="max-w-xs">{booking.student_name}</div>
                      </td>
                      <td className="px-4 py-6 text-sm text-gray-500">
                        <div className="max-w-xs">{booking.mentor_name}</div>
                      </td>
                      <td className="px-4 py-6 text-sm text-gray-500">
                        <div className="max-w-xs">{formatDate(booking.session_date)}</div>
                      </td>
                      <td className="px-4 py-6 text-sm text-gray-500">
                        {booking.session_duration} hours
                      </td>
                      <td className="px-4 py-6">
                        <StatusPill status={booking.status} />
                      </td>
                      <td className="px-4 py-6 text-sm font-medium">
                        <div className="flex flex-col sm:flex-row gap-2">
                          {normalizeStatus(booking.status) === SessionStatus.PENDING && (
                            <Button
                              size="sm"
                              onClick={() => updateBookingStatus(booking.session_id, SessionStatus.ACCEPTED)}
                              className="bg-green-600 hover:bg-green-700 whitespace-nowrap"
                            >
                              Approve
                            </Button>
                          )}
                          {normalizeStatus(booking.status) === SessionStatus.ACCEPTED && (
                            <Button
                              size="sm"
                              onClick={() => updateBookingStatus(booking.session_id, SessionStatus.COMPLETED)}
                              className="bg-blue-600 hover:bg-blue-700 whitespace-nowrap"
                            >
                              Complete
                            </Button>
                          )}
                          {normalizeStatus(booking.status) === SessionStatus.COMPLETED && (
                            <span className="text-gray-400 text-sm">Completed</span>
                          )}
                          {!normalizeStatus(booking.status) && (
                            <span className="text-gray-400 text-sm">Status Unknown</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
