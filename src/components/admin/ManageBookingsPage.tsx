import { useState, useEffect } from "react";
import { ArrowLeft, Calendar, Clock, User, BookOpen, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/hooks/use-toast";

interface SessionBooking {
  id: string;
  classId: string;
  className: string;
  studentId: string;
  studentName: string;
  mentorId: string;
  mentorName: string;
  sessionDate: string;
  duration: number;
  status: "PENDING" | "ACCEPTED" | "COMPLETED" | "CANCELLED";
  createdAt: string;
}

interface ManageBookingsPageProps {
  onBack: () => void;
}

export default function ManageBookingsPage({ onBack }: ManageBookingsPageProps) {
  const [bookings, setBookings] = useState<SessionBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingBooking, setUpdatingBooking] = useState<string | null>(null);
  const { toast } = useToast();

  // Load bookings data
  useEffect(() => {
    const loadBookings = async () => {
      try {
        // Simulate API call - In real app, fetch from your backend
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockBookings: SessionBooking[] = [
          {
            id: "1",
            classId: "1",
            className: "A/L Biology",
            studentId: "s1",
            studentName: "Sarah Johnson",
            mentorId: "m1",
            mentorName: "Dr. Amara Perera",
            sessionDate: "2025-01-28T14:00:00Z",
            duration: 60,
            status: "PENDING",
            createdAt: "2025-01-25T10:30:00Z"
          },
          {
            id: "2",
            classId: "2",
            className: "A/L Chemistry",
            studentId: "s2",
            studentName: "Michael Chen",
            mentorId: "m2",
            mentorName: "Prof. Nimal Silva",
            sessionDate: "2025-01-29T16:00:00Z",
            duration: 90,
            status: "ACCEPTED",
            createdAt: "2025-01-24T15:20:00Z"
          },
          {
            id: "3",
            classId: "1",
            className: "A/L Biology",
            studentId: "s3",
            studentName: "Emily Davis",
            mentorId: "m1",
            mentorName: "Dr. Amara Perera",
            sessionDate: "2025-01-26T10:00:00Z",
            duration: 60,
            status: "COMPLETED",
            createdAt: "2025-01-23T09:15:00Z"
          },
          {
            id: "4",
            classId: "3",
            className: "O/L Mathematics",
            studentId: "s4",
            studentName: "David Wilson",
            mentorId: "m3",
            mentorName: "Ms. Ruwan Fernando",
            sessionDate: "2025-01-30T11:00:00Z",
            duration: 75,
            status: "PENDING",
            createdAt: "2025-01-25T14:45:00Z"
          },
          {
            id: "5",
            classId: "2",
            className: "A/L Chemistry",
            studentId: "s5",
            studentName: "Lisa Anderson",
            mentorId: "m2",
            mentorName: "Prof. Nimal Silva",
            sessionDate: "2025-01-27T13:00:00Z",
            duration: 60,
            status: "ACCEPTED",
            createdAt: "2025-01-24T11:30:00Z"
          }
        ];
        
        setBookings(mockBookings);
        setLoading(false);
      } catch (error) {
        console.error('Failed to load bookings:', error);
        setLoading(false);
      }
    };

    loadBookings();
  }, []);

  // Update booking status
  const updateBookingStatus = async (bookingId: string, newStatus: SessionBooking['status']) => {
    setUpdatingBooking(bookingId);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Update local state
      setBookings(prev => 
        prev.map(booking => 
          booking.id === bookingId 
            ? { ...booking, status: newStatus }
            : booking
        )
      );

      const booking = bookings.find(b => b.id === bookingId);
      const statusText = newStatus === "ACCEPTED" ? "approved" : "completed";
      
      toast({
        title: "Success!",
        description: `Session for ${booking?.studentName} has been ${statusText}.`,
      });

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update booking status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdatingBooking(null);
    }
  };

  // Format date and time
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      })
    };
  };

  // Get status badge styling
  const getStatusBadge = (status: SessionBooking['status']) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ACCEPTED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Calendar className="h-8 w-8 text-purple-600" />
          Manage Bookings
        </h1>
        <p className="text-gray-600 mt-2">
          View and manage all session bookings from students.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {bookings.filter(b => b.status === 'PENDING').length}
              </div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {bookings.filter(b => b.status === 'ACCEPTED').length}
              </div>
              <div className="text-sm text-gray-600">Accepted</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {bookings.filter(b => b.status === 'COMPLETED').length}
              </div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {bookings.length}
              </div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Session Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No bookings found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Class</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Student</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Mentor</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Session Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Duration</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => {
                    const { date, time } = formatDateTime(booking.sessionDate);
                    return (
                      <tr key={booking.id} className="border-b hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-blue-600" />
                            <span className="font-medium">{booking.className}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-600" />
                            <span>{booking.studentName}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-gray-700">{booking.mentorName}</span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="space-y-1">
                            <div className="font-medium">{date}</div>
                            <div className="text-sm text-gray-600 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {time}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-gray-700">{booking.duration} min</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadge(booking.status)}`}>
                            {booking.status}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex gap-2">
                            {booking.status === 'PENDING' && (
                              <Button
                                size="sm"
                                onClick={() => updateBookingStatus(booking.id, 'ACCEPTED')}
                                disabled={updatingBooking === booking.id}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                {updatingBooking === booking.id ? (
                                  "..."
                                ) : (
                                  <>
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Approve
                                  </>
                                )}
                              </Button>
                            )}
                            {booking.status === 'ACCEPTED' && (
                              <Button
                                size="sm"
                                onClick={() => updateBookingStatus(booking.id, 'COMPLETED')}
                                disabled={updatingBooking === booking.id}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                {updatingBooking === booking.id ? (
                                  "..."
                                ) : (
                                  <>
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Complete
                                  </>
                                )}
                              </Button>
                            )}
                            {booking.status === 'COMPLETED' && (
                              <span className="text-sm text-green-600 font-medium">
                                ✓ Completed
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
