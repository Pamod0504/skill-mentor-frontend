import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/hooks/use-toast";
import { useAuth, useUser } from "@clerk/clerk-react";
import { BACKEND_URL } from "@/config/env";

interface Class {
  class_room_id: number;
  title: string;
}

export function CreateMentorPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    address: "",
    email: "",
    title: "",
    sessionFee: "",
    profession: "",
    subject: "",
    phoneNumber: "",
    qualification: "",
    mentorImage: "",
    selectedClasses: [] as number[],
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [classes, setClasses] = useState<Class[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { getToken } = useAuth();
  const { user, isLoaded } = useUser();

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const token = await getToken({ template: "skill-mentor-auth-frontend" });
      if (!token) return;

      const response = await fetch(`${BACKEND_URL}/academic/classroom`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setClasses(data);
      }
    } catch (error) {
      console.error("Failed to fetch classes:", error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      // Clear the URL input if a file is selected
      setFormData(prev => ({
        ...prev,
        mentorImage: "",
      }));
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    // Convert to base64 for demo purposes
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result as string;
        resolve(base64String);
      };
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate user authentication
      if (!isLoaded) {
        throw new Error("User authentication is loading...");
      }
      
      if (!user) {
        throw new Error("User not authenticated");
      }
      
      console.log("User info:", {
        userId: user.id,
        email: user.primaryEmailAddress?.emailAddress,
        publicMetadata: user.publicMetadata,
        role: user.publicMetadata?.role
      });

      // Check if user has admin role
      const userRole = user.publicMetadata?.role;
      console.log("Checking user role:", {
        userRole,
        publicMetadata: user.publicMetadata,
        isAdmin: userRole === 'admin'
      });
      
      if (userRole !== 'admin') {
        console.warn("User role is not admin:", userRole);
        throw new Error("You must have admin privileges to create mentors. Please contact an administrator.");
      }

      // Validate required fields
      if (!formData.firstName.trim()) {
        throw new Error("First name is required");
      }
      if (!formData.lastName.trim()) {
        throw new Error("Last name is required");
      }
      if (!formData.email.trim()) {
        throw new Error("Email is required");
      }
      if (!formData.phoneNumber.trim()) {
        throw new Error("Phone number is required");
      }
      if (!formData.address.trim()) {
        throw new Error("Address is required");
      }
      if (!formData.title.trim()) {
        throw new Error("Title is required");
      }
      if (!formData.sessionFee || isNaN(parseFloat(formData.sessionFee))) {
        throw new Error("Valid session fee is required");
      }
      if (!formData.profession.trim()) {
        throw new Error("Profession is required");
      }
      if (!formData.subject.trim()) {
        throw new Error("Subject is required");
      }
      if (!formData.qualification.trim()) {
        throw new Error("Qualification is required");
      }
      if (formData.selectedClasses.length === 0) {
        throw new Error("At least one class must be selected");
      }

      // Try different token approaches like in CreateClassPage
      let token = await getToken();
      console.log("Token without template:", token ? "Token received" : "No token");
      
      if (!token) {
        token = await getToken({ template: "skill-mentor-auth-frontend" });
        console.log("Token with template:", token ? "Token received" : "No token");
      }
      
      // If still no token, try other approaches
      if (!token) {
        console.log("Trying alternative token approaches...");
        try {
          token = await getToken({ template: "default" });
          console.log("Token with 'default' template:", token ? "Token received" : "No token");
        } catch (e) {
          console.log("Default template failed:", e);
        }
      }
      
      console.log("Final token length:", token?.length);
      
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
          }
        } catch (e) {
          console.error("Failed to decode JWT:", e);
        }
      }
      
      if (!token) {
        throw new Error("No authentication token available");
      }

      // Test authentication by trying to fetch existing mentors first
      console.log("Testing authentication with GET request...");
      try {
        const testResponse = await fetch(`${BACKEND_URL}/academic/mentor`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log("GET test response status:", testResponse.status);
        if (testResponse.ok) {
          const testData = await testResponse.json();
          console.log("GET test successful, existing mentors:", testData.length);
        } else {
          const errorText = await testResponse.text();
          console.error("GET test failed:", testResponse.status, errorText);
          if (testResponse.status === 403) {
            console.error("GET request also returns 403 - authentication issue confirmed");
          }
        }
      } catch (error) {
        console.error("GET test error:", error);
      }

      let imageUrl = formData.mentorImage;

      // If a file is selected, upload it first
      if (selectedFile) {
        try {
          imageUrl = await uploadImage(selectedFile);
        } catch (error) {
          console.error('Image upload failed:', error);
          toast({
            title: "Warning",
            description: "Failed to process image, but mentor will be created without image.",
          });
          imageUrl = ""; // Continue without image
        }
      }

      // Ensure we have an image URL (required by DTO)
      if (!imageUrl) {
        imageUrl = ""; // Set empty string as default since DTO requires non-null
      }

      // Create mentors for each selected class (since DTO expects one class_room_id per mentor)
      const createdMentors = [];
      
      for (const classId of formData.selectedClasses) {
        const mentorData = {
          clerk_mentor_id: user.id, // Changed from clerk_id to clerk_mentor_id
          first_name: formData.firstName,
          last_name: formData.lastName,
          address: formData.address,
          email: formData.email,
          title: formData.title,
          session_fee: parseFloat(formData.sessionFee),
          profession: formData.profession,
          subject: formData.subject,
          phone_number: formData.phoneNumber,
          qualification: formData.qualification,
          mentor_image: imageUrl,
          class_room_id: classId, // Include class_room_id as required by DTO
        };

        console.log("Creating mentor with data:", mentorData);
        console.log("Backend URL:", `${BACKEND_URL}/academic/mentor`);

        const mentorResponse = await fetch(`${BACKEND_URL}/academic/mentor`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(mentorData),
        });

        console.log("Mentor creation response status:", mentorResponse.status);
        console.log("Mentor creation response headers:", Object.fromEntries(mentorResponse.headers.entries()));

        if (!mentorResponse.ok) {
          let errorText;
          try {
            // Try to get error message from response body
            const contentType = mentorResponse.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              const errorData = await mentorResponse.json();
              errorText = errorData.message || errorData.error || JSON.stringify(errorData);
            } else {
              errorText = await mentorResponse.text();
            }
          } catch (e) {
            errorText = `HTTP ${mentorResponse.status} - ${mentorResponse.statusText}`;
          }
          console.error("Mentor creation error response:", errorText);
          console.error("Full mentor creation response details:", {
            status: mentorResponse.status,
            statusText: mentorResponse.statusText,
            url: mentorResponse.url,
            headers: Object.fromEntries(mentorResponse.headers.entries())
          });
          throw new Error(`Failed to create mentor for class ${classId}: ${mentorResponse.status} - ${errorText}`);
        }

        const mentor = await mentorResponse.json();
        console.log("Mentor created successfully:", mentor);
        createdMentors.push(mentor);
      }

      toast({
        title: "Success",
        description: `Mentor created successfully for ${createdMentors.length} class(es)!`,
      });

      // Reset form
      setFormData({
        firstName: "",
        lastName: "",
        address: "",
        email: "",
        title: "",
        sessionFee: "",
        profession: "",
        subject: "",
        phoneNumber: "",
        qualification: "",
        mentorImage: "",
        selectedClasses: [],
      });
      setSelectedFile(null);
      setImagePreview("");
    } catch (error) {
      console.error("Error creating mentor:", error);
      
      // More specific error messages
      let errorMessage = "Failed to create mentor. Please try again.";
      
      if (error instanceof Error) {
        if (error.message.includes("403")) {
          errorMessage = "Authentication failed. Please log in again.";
        } else if (error.message.includes("401")) {
          errorMessage = "Unauthorized. Please check your permissions.";
        } else if (error.message.includes("400")) {
          errorMessage = "Invalid data provided. Please check all fields.";
        } else if (error.message.includes("500")) {
          errorMessage = "Server error. Please try again later.";
        } else if (error.message.includes("Failed to fetch")) {
          errorMessage = "Network error. Please check your connection.";
        } else if (error.message.includes("required") || error.message.includes("Valid")) {
          errorMessage = error.message; // Show validation errors directly
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleClassSelection = (classId: number) => {
    setFormData(prev => ({
      ...prev,
      selectedClasses: prev.selectedClasses.includes(classId)
        ? prev.selectedClasses.filter(id => id !== classId)
        : [...prev.selectedClasses, classId],
    }));
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Create New Mentor</h1>
        <p className="mt-2 text-sm text-gray-600">
          Add a new mentor and assign them to classes.
        </p>
      </div>

      <Card className="max-w-4xl">
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="phoneNumber">Phone Number *</Label>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  required
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  name="title"
                  type="text"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., Mr., Ms., Dr."
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="sessionFee">Session Fee (USD) *</Label>
                <Input
                  id="sessionFee"
                  name="sessionFee"
                  type="number"
                  step="0.01"
                  required
                  value={formData.sessionFee}
                  onChange={handleChange}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="profession">Profession *</Label>
                <Input
                  id="profession"
                  name="profession"
                  type="text"
                  required
                  value={formData.profession}
                  onChange={handleChange}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="qualification">Qualification *</Label>
                <Input
                  id="qualification"
                  name="qualification"
                  type="text"
                  required
                  value={formData.qualification}
                  onChange={handleChange}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                name="address"
                type="text"
                required
                value={formData.address}
                onChange={handleChange}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="subject">Subject/Bio *</Label>
              <textarea
                id="subject"
                name="subject"
                required
                value={formData.subject}
                onChange={handleChange}
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Describe the mentor's expertise and background..."
              />
            </div>

            <div>
              <Label htmlFor="mentorImage">Mentor Image</Label>
              <div className="mt-1 space-y-4">
                {/* File Upload Option */}
                <div>
                  <Label htmlFor="mentorImageFile" className="text-sm font-medium text-gray-700">
                    Upload Image from Device
                  </Label>
                  <input
                    id="mentorImageFile"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="mt-1 block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-medium
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100"
                  />
                </div>

                {/* OR Divider */}
                <div className="flex items-center">
                  <div className="flex-grow border-t border-gray-300"></div>
                  <span className="flex-shrink mx-4 text-gray-400 text-sm">OR</span>
                  <div className="flex-grow border-t border-gray-300"></div>
                </div>

                {/* URL Input Option */}
                <div>
                  <Label htmlFor="mentorImageUrl" className="text-sm font-medium text-gray-700">
                    Image URL
                  </Label>
                  <Input
                    id="mentorImageUrl"
                    name="mentorImage"
                    type="url"
                    value={formData.mentorImage}
                    onChange={handleChange}
                    placeholder="https://example.com/image.jpg"
                    className="mt-1"
                    disabled={!!selectedFile}
                  />
                </div>

                {/* Image Preview */}
                {(imagePreview || formData.mentorImage) && (
                  <div className="mt-4">
                    <Label className="text-sm font-medium text-gray-700">Preview</Label>
                    <div className="mt-2 border rounded-lg p-4 bg-gray-50">
                      <img
                        src={imagePreview || formData.mentorImage}
                        alt="Mentor preview"
                        className="max-w-full h-48 object-cover rounded-md mx-auto"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Upload an image from your device 
              </p>
            </div>

            <div>
              <Label>Assign to Classes *</Label>
              <div className="mt-2 space-y-2">
                {classes.map((cls) => (
                  <label key={cls.class_room_id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.selectedClasses.includes(cls.class_room_id)}
                      onChange={() => handleClassSelection(cls.class_room_id)}
                      className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-sm text-gray-900">{cls.title}</span>
                  </label>
                ))}
              </div>
              {classes.length === 0 && (
                <p className="text-sm text-gray-500 mt-2">
                  No classes available. Create classes first before adding mentors.
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setFormData({
                    firstName: "",
                    lastName: "",
                    address: "",
                    email: "",
                    title: "",
                    sessionFee: "",
                    profession: "",
                    subject: "",
                    phoneNumber: "",
                    qualification: "",
                    mentorImage: "",
                    selectedClasses: [],
                  });
                  setSelectedFile(null);
                  setImagePreview("");
                  // Reset file input
                  const fileInput = document.getElementById('mentorImageFile') as HTMLInputElement;
                  if (fileInput) fileInput.value = '';
                }}
              >
                Reset
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Mentor"}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
