import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Building2, Calendar, GraduationCap } from "lucide-react";
import type { MentorClass } from "@/lib/types";
import { SchedulingModal } from "@/components/SchedulingModel";
import { SignupDialog } from "@/components/SignUpDialog";
import { cn } from "@/lib/utils";
import { useAuth } from "@clerk/clerk-react";

export function MentorCard({ mentorClass }: { mentorClass: MentorClass }) {
  const [isSchedulingModalOpen, setIsSchedulingModalOpen] = useState(false);
  const [isSignupDialogOpen, setIsSignupDialogOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const { isSignedIn } = useAuth();

  // Check if mentor exists and has required properties
  if (!mentorClass?.mentor) {
    return null;
  }

  // Debug logging for images
  console.log("MentorCard - Image URLs:", {
    mentorName: `${mentorClass.mentor.first_name} ${mentorClass.mentor.last_name}`,
    classTitle: mentorClass.title,
    mentorImage: mentorClass.mentor.mentor_image,
    classImage: mentorClass.image_url,
    mentorImageExists: !!mentorClass.mentor.mentor_image,
    classImageExists: !!mentorClass.image_url,
  });

  // Test image accessibility
  if (mentorClass.mentor.mentor_image) {
    console.log("Testing mentor image accessibility:", mentorClass.mentor.mentor_image);
  }
  if (mentorClass.image_url) {
    console.log("Testing class image accessibility:", mentorClass.image_url);
  }

  // Use a simple threshold to decide if the bio is long enough
  const bioTooLong = (mentorClass.mentor.subject?.length || 0) > 200;

  const handleSchedule = () => {
    if (!isSignedIn) {
      setIsSignupDialogOpen(true);
      return;
    }
    setIsSchedulingModalOpen(true);
  };

  return (
    <>
      <Card className="flex flex-col h-full">
        <div className="p-6 flex-1 flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-xl">{mentorClass.title}</h3>
              {/* <div className="flex items-center space-x-2">
                <ThumbsUp className="size-6" />
                <p className="text-sm text-muted-foreground">
                  {mentorClass.enrolled_student_count} enrolled students
                </p>
              </div> */}
              <div className="flex items-center space-x-2">
                {mentorClass.mentor.mentor_image ? (
                  <img
                    src={mentorClass.mentor.mentor_image}
                    alt={`${mentorClass.mentor.first_name} ${mentorClass.mentor.last_name}`}
                    className="w-8 h-8 object-cover rounded-full border"
                    onError={(e) => {
                      console.log("Mentor image failed to load:", mentorClass.mentor.mentor_image);
                      e.currentTarget.style.display = 'none';
                      const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                    onLoad={() => {
                      console.log("Mentor image loaded successfully:", mentorClass.mentor.mentor_image);
                    }}
                  />
                ) : null}
                <div 
                  className="w-8 h-8 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center text-xs font-semibold text-gray-700 border"
                  style={{ display: mentorClass.mentor.mentor_image ? 'none' : 'flex' }}
                >
                  {mentorClass.mentor.first_name.charAt(0)}{mentorClass.mentor.last_name.charAt(0)}
                </div>
                <span className="text-sm">
                  {mentorClass.mentor.first_name + " " + mentorClass.mentor.last_name}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Building2 className="size-6" />
                <span>{mentorClass.mentor.profession}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Calendar className="size-6" />
                <span>{mentorClass.mentor.qualification}</span>
              </div>
            </div>
            <div className="w-36">
              <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden flex items-center justify-center border">
                {mentorClass.image_url ? (
                  <img
                    src={mentorClass.image_url}
                    alt={mentorClass.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.log("Class image failed to load:", mentorClass.image_url);
                      e.currentTarget.style.display = 'none';
                      const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                    onLoad={() => {
                      console.log("Class image loaded successfully:", mentorClass.image_url);
                    }}
                  />
                ) : null}
                <div 
                  className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center"
                  style={{ display: mentorClass.image_url ? 'none' : 'flex' }}
                >
                  <span className="text-2xl font-semibold text-blue-700">
                    {mentorClass.title.charAt(0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-4 flex-grow">
            <div>
              <p
                className={cn(
                  "text-sm transition-all duration-300 ease-in-out",
                  !isExpanded && bioTooLong ? "line-clamp-3" : ""
                )}
              >
                {mentorClass.mentor.subject}
              </p>
              {bioTooLong && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-primary text-sm font-medium mt-1 hover:underline"
                >
                  {isExpanded ? "See less" : "See more"}
                </button>
              )}
            </div>
          </div>

          <div className="mt-auto">
            <h4 className="font-medium mb-2">Highlights</h4>
            <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-3 rounded-md flex flex-col gap-4">
              <div className="flex items-center space-x-2">
                <GraduationCap className="w-4 h-4" />
                <span className="text-sm">
                  {mentorClass.enrolled_student_count} Enrollments
                </span>
              </div>

              {/* {mentor.isCertified && (
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-sm">Certified Teacher</span>
                </div>
              )} */}
            </div>
          </div>
        </div>

        <div className="p-6 pt-0">
          <Button
            onClick={handleSchedule}
            className="w-full bg-black text-white hover:bg-black/90"
          >
            Schedule a session
          </Button>
        </div>
      </Card>

      <SignupDialog
        isOpen={isSignupDialogOpen}
        onClose={() => setIsSignupDialogOpen(false)}
      />

      <SchedulingModal
        isOpen={isSchedulingModalOpen}
        onClose={() => setIsSchedulingModalOpen(false)}
        mentorClass={mentorClass}
      />
    </>
  );
}
