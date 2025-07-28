import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/hooks/use-toast";
import { useAuth, useUser } from "@clerk/clerk-react";
import { BACKEND_URL } from "@/config/env";
import { GraduationCap, Upload, Link, Image as ImageIcon, CheckCircle, AlertCircle } from "lucide-react";

interface ClassRoomDTO {
  class_room_id?: number;
  title: string;
  enrolled_student_count: number;
  class_image: string;
  mentor?: any;
}

export function CreateClassPage() {
  const [formData, setFormData] = useState({
    className: "",
    classImage: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { getToken } = useAuth();
  const { user, isLoaded } = useUser();

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
        classImage: "",
      }));
    }
  };

  const convertFileToBase64 = async (file: File): Promise<string> => {
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

  const validateUserPermissions = (): void => {
    if (!isLoaded) {
      throw new Error("Authentication is loading...");
    }
    
    if (!user) {
      throw new Error("You must be logged in to create classes");
    }
    
    const userRole = user.publicMetadata?.role;
    if (userRole !== 'admin') {
      throw new Error("You must be an admin to create classes");
    }
  };

  const getAuthToken = async (): Promise<string> => {
    console.log("=== CREATE CLASS TOKEN DEBUGGING ===");
    
    // Try template first
    let token = await getToken({ template: "skill-mentor-auth-frontend" });
    console.log("Token with template:", token ? "Token received" : "No token");
    console.log("Token with template length:", token?.length);
    if (token) {
      console.log("FULL TOKEN (with template):", token);
    }
    
    // Fallback to default token
    if (!token) {
      token = await getToken();
      console.log("Token without template:", token ? "Token received" : "No token");
      console.log("Token without template length:", token?.length);
      if (token) {
        console.log("FULL TOKEN (without template):", token);
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
      throw new Error("Authentication token not available");
    }
    
    return token;
  };

  const prepareRequestData = async (): Promise<ClassRoomDTO> => {
    let imageUrl = formData.classImage;

    // Handle file upload if selected
    if (selectedFile) {
      try {
        imageUrl = await convertFileToBase64(selectedFile);
      } catch (error) {
        console.error('Image upload failed:', error);
        toast({
          title: "Warning",
          description: "Failed to process image, creating class without image.",
        });
        imageUrl = "";
      }
    }

    // Prepare data matching backend DTO structure
    return {
      title: formData.className.trim(),
      enrolled_student_count: 0,
      class_image: imageUrl || "",
    };
  };

  const createClassroom = async (requestData: ClassRoomDTO, token: string): Promise<ClassRoomDTO> => {
    console.log("=== CREATE CLASS API REQUEST ===");
    console.log("Request URL:", `${BACKEND_URL}/academic/classroom`);
    console.log("Request method:", "POST");
    console.log("Request headers:", {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token.substring(0, 20)}...`, // Only show first 20 chars for security
      "Accept": "application/json",
    });
    console.log("FULL AUTHORIZATION TOKEN:", token);
    console.log("Request body:", JSON.stringify(requestData, null, 2));
    
    const response = await fetch(`${BACKEND_URL}/academic/classroom`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json",
      },
      body: JSON.stringify(requestData),
    });

    console.log("=== CREATE CLASS API RESPONSE ===");
    console.log("Response status:", response.status);
    console.log("Response headers:", Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      let errorMessage = `Server error: ${response.status}`;
      
      try {
        const errorText = await response.text();
        console.log("Error response body:", errorText);
        if (errorText) {
          errorMessage += ` - ${errorText}`;
        }
      } catch (e) {
        console.log("Could not read error response text");
      }

      console.error("Full error response details:", {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        headers: Object.fromEntries(response.headers.entries())
      });

      switch (response.status) {
        case 400:
          throw new Error("Invalid class data. Please check all required fields.");
        case 401:
          throw new Error("Authentication failed. Please log in again.");
        case 403:
          throw new Error("Access denied. You need admin privileges to create classes.");
        case 500:
          throw new Error("Server error. Please try again later.");
        default:
          throw new Error(errorMessage);
      }
    }

    const responseData = await response.json();
    console.log("Success response data:", responseData);
    return responseData;
  };

  const resetForm = (): void => {
    setFormData({
      className: "",
      classImage: "",
    });
    setSelectedFile(null);
    setImagePreview("");
    
    // Reset file input
    const fileInput = document.getElementById('imageFile') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate form input
      if (!formData.className.trim()) {
        throw new Error("Class name is required");
      }

      // Validate user permissions
      validateUserPermissions();

      // Get authentication token
      const token = await getAuthToken();

      // Prepare request data
      const requestData = await prepareRequestData();

      // Create classroom via API
      const responseData = await createClassroom(requestData, token);

      // Success handling
      toast({
        title: "Success",
        description: `Class "${responseData.title}" created successfully!`,
      });

      resetForm();

    } catch (error) {
      console.error("Error creating class:", error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Failed to create class. Please try again.";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div>
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create New Class</h1>
            <p className="text-sm text-gray-600">
              Add a new tutoring class to the platform
            </p>
          </div>
        </div>
      </div>

      {/* Main Form Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Class Information</h3>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Class Name Field */}
                <div>
                  <Label htmlFor="className" className="text-sm font-medium text-gray-700">
                    Class Name *
                  </Label>
                  <Input
                    id="className"
                    name="className"
                    type="text"
                    required
                    value={formData.className}
                    onChange={handleChange}
                    placeholder="e.g., A/L Biology, O/L Mathematics"
                    className="mt-2"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Enter a descriptive name for your tutoring class
                  </p>
                </div>

                {/* Image Upload Section */}
                <div>
                  <Label className="text-sm font-medium text-gray-700">Class Image</Label>
                  
                  {/* Upload Options */}
                  <div className="mt-2 space-y-4">
                    {/* File Upload Card */}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="mt-4">
                        <Label htmlFor="imageFile" className="cursor-pointer">
                          <span className="text-sm font-medium text-blue-600 hover:text-blue-500">
                            Upload a file
                          </span>
                          <input
                            id="imageFile"
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="sr-only"
                          />
                        </Label>
                        <p className="text-sm text-gray-500 mt-1">PNG, JPG, GIF up to 10MB</p>
                      </div>
                    </div>

                    {/* OR Divider */}
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300" />
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">OR</span>
                      </div>
                    </div>

                    {/* URL Input */}
                    <div>
                      <div className="flex rounded-md shadow-sm">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                          <Link className="h-4 w-4" />
                        </span>
                        <Input
                          id="classImage"
                          name="classImage"
                          type="url"
                          value={formData.classImage}
                          onChange={handleChange}
                          placeholder="https://example.com/image.jpg"
                          className="rounded-l-none"
                          disabled={!!selectedFile}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    disabled={isSubmitting}
                  >
                    Reset
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="bg-blue-500 hover:bg-blue-600">
                    {isSubmitting ? "Creating..." : "Create Class"}
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>

        {/* Preview Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Preview</h3>
              
              {/* Preview Content */}
              <div className="space-y-4">
                {/* Image Preview */}
                <div className="aspect-video bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center">
                  {(imagePreview || formData.classImage) ? (
                    <img
                      src={imagePreview || formData.classImage}
                      alt="Class preview"
                      className="w-full h-full object-cover rounded-lg"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="text-center">
                      <ImageIcon className="h-12 w-12 text-gray-400 mx-auto" />
                      <p className="mt-2 text-sm text-gray-500">No image selected</p>
                    </div>
                  )}
                </div>

                {/* Class Name Preview */}
                <div>
                  <Label className="text-sm font-medium text-gray-700">Class Name</Label>
                  <p className="mt-1 text-lg font-medium text-gray-900">
                    {formData.className || "Enter class name..."}
                  </p>
                </div>

                {/* Status Indicators */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    {formData.className ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-gray-400" />
                    )}
                    <span className={`text-sm ${formData.className ? 'text-green-600' : 'text-gray-500'}`}>
                      Class name {formData.className ? 'provided' : 'required'}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {(imagePreview || formData.classImage) ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-gray-400" />
                    )}
                    <span className={`text-sm ${(imagePreview || formData.classImage) ? 'text-green-600' : 'text-gray-500'}`}>
                      Image {(imagePreview || formData.classImage) ? 'provided' : 'optional'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Help Card */}
          <Card className="mt-6">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Guidelines</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Choose a descriptive and clear class name</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Upload a relevant image to attract students</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Image should be clear and high quality</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Class will be available immediately after creation</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}