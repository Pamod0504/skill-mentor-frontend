import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/hooks/use-toast";
import { BACKEND_URL } from "@/config/env";
import { GraduationCap, Upload, Image as ImageIcon } from "lucide-react";
import { useAuth } from "@clerk/clerk-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const classroomFormSchema = z.object({
  name: z.string().min(3, "Class name must be at least 3 characters."),
  image: z.any()
    .refine((files) => files?.length == 1, 'Image is required.')
    .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
    .refine(
      (files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      '.jpg, .jpeg, .png and .webp files are accepted.'
    )
});

type ClassroomFormData = z.infer<typeof classroomFormSchema>;

export function CreateClassPage() {
  const { toast } = useToast();
  const { getToken } = useAuth();
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, watch } = useForm<ClassroomFormData>({
    resolver: zodResolver(classroomFormSchema)
  });

  const imageFile = watch("image");
  const selectedImageName = imageFile && imageFile.length > 0 ? imageFile[0].name : null;

  // API function to upload file
  const uploadFile = async (file: File) => {
    let token = await getToken({ template: "skill-mentor-auth-frontend" });
    if (!token) {
      token = await getToken();
    }
    if (!token) {
      token = await getToken({ template: "default" });
    }
    if (!token) {
      throw new Error("No authentication token available");
    }

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${BACKEND_URL}/files/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${response.status} - ${errorText}`);
    }

    return response.json();
  };

  // API function to create classroom
  const createClassroom = async (classroomData: { name: string; imageUrl: string }) => {
    let token = await getToken({ template: "skill-mentor-auth-frontend" });
    if (!token) {
      token = await getToken();
    }
    if (!token) {
      token = await getToken({ template: "default" });
    }
    if (!token) {
      throw new Error("No authentication token available");
    }

    const requestBody = {
      title: classroomData.name,
      enrolled_student_count: 0,
      image_url: classroomData.imageUrl,
    };

    console.log("Request URL:", `${BACKEND_URL}/academic/classroom`);
    console.log("Request body:", requestBody);
    console.log("Authorization token:", token ? "Token available" : "No token");

    const response = await fetch(`${BACKEND_URL}/academic/classroom`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    });

    console.log("Response status:", response.status);
    console.log("Response headers:", Object.fromEntries(response.headers));

    if (!response.ok) {
      let errorText;
      try {
        errorText = await response.text();
        console.log("Error response text:", errorText);
      } catch (e) {
        errorText = `Unable to read error response`;
      }
      throw new Error(`Create classroom failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    console.log("Classroom creation successful:", result);
    return result;
  };

  const onSubmit = async (formData: ClassroomFormData) => {
    try {
      console.log("Starting form submission...");
      
      const file = formData.image[0];
      console.log("File to upload:", file);
      
      const fileResponse = await uploadFile(file);
      console.log("Upload response:", fileResponse);
      
      // Handle different response structures
      const imageUrl = fileResponse.url || fileResponse.data?.url || fileResponse.fileUrl;
      console.log("Image URL:", imageUrl);
      
      if (!imageUrl) {
        throw new Error("Upload successful but no image URL returned");
      }

      const classroomData = {
        name: formData.name,
        imageUrl: imageUrl,
      };
      
      console.log("Creating classroom with data:", classroomData);
      
      const result = await createClassroom(classroomData);
      console.log("Classroom creation result:", result);
      
      toast({ title: "Success", description: "Classroom created successfully." });
      reset();
    } catch (error: any) {
      console.error("Error in form submission:", error);
      const errorMessage = error.message || "Failed to create classroom.";
      toast({ 
        title: "Error", 
        description: errorMessage, 
        variant: "destructive" 
      });
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create New Class</h1>
            <p className="text-sm text-gray-600">Add a new tutoring class to the platform</p>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Class Information</h3>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                    Class Name *
                  </Label>
                  <Input
                    id="name"
                    {...register("name")}
                    type="text"
                    placeholder="e.g., A/L Biology, O/L Mathematics"
                    className="mt-2"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                  <p className="mt-1 text-sm text-gray-500">Enter a descriptive name for your tutoring class</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">Class Image *</Label>
                  <div className="mt-2 space-y-4">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="mt-4">
                        <Label htmlFor="image" className="cursor-pointer">
                          <span className="text-sm font-medium text-blue-600 hover:text-blue-500">Upload a file</span>
                          <input 
                            id="image" 
                            {...register("image")}
                            type="file" 
                            accept="image/jpeg,image/jpg,image/png,image/webp" 
                            className="sr-only" 
                          />
                        </Label>
                        <p className="text-sm text-gray-500 mt-1">PNG, JPG, WEBP up to 5MB</p>
                        {selectedImageName && (
                          <p className="text-sm text-blue-600 mt-1">Selected: {selectedImageName}</p>
                        )}
                      </div>
                    </div>
                    {errors.image && (
                      <p className="text-sm text-red-600">{String(errors.image.message)}</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                  <Button type="button" variant="outline" onClick={() => reset()} disabled={isSubmitting}>
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

        <div className="lg:col-span-1">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Preview</h3>
              <div className="space-y-4">
                <div className="aspect-video bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center">
                  {imageFile && imageFile.length > 0 ? (
                    <img
                      src={URL.createObjectURL(imageFile[0])}
                      alt="Class preview"
                      className="w-full h-full object-cover rounded-lg"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="text-center">
                      <ImageIcon className="h-12 w-12 text-gray-400 mx-auto" />
                      <p className="mt-2 text-sm text-gray-500">No image selected</p>
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">Class Name</Label>
                  <p className="mt-1 text-lg font-medium text-gray-900">{watch("name") || "Enter class name..."}</p>
                </div>
              </div>
            </div>
          </Card>

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
