import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/hooks/use-toast";
import { useUser } from "@clerk/clerk-react";
import { BACKEND_URL } from "@/config/env";
import { useAuth } from "@clerk/clerk-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const mentorFormSchema = z.object({
  clerkMentorId: z.string().min(1, "Clerk Mentor ID is required."),
  firstName: z.string().min(2, "First name must be at least 2 characters."),
  lastName: z.string().min(2, "Last name must be at least 2 characters."),
  address: z.string().min(5, "Address must be at least 5 characters."),
  email: z.string().email("Please provide a valid email address."),
  title: z.string().min(1, "Title is required."),
  sessionFee: z.string().min(1, "Session fee is required.").refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    "Session fee must be a valid positive number."
  ),
  profession: z.string().min(2, "Profession must be at least 2 characters."),
  subject: z.string().min(10, "Subject/Bio must be at least 10 characters."),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 characters."),
  qualification: z.string().min(5, "Qualification must be at least 5 characters."),
  image: z.any()
    .refine((files) => !files || files.length === 0 || files.length === 1, 'Invalid file selection.')
    .refine((files) => !files || files.length === 0 || files[0]?.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
    .refine(
      (files) => !files || files.length === 0 || ACCEPTED_IMAGE_TYPES.includes(files[0]?.type),
      '.jpg, .jpeg, .png and .webp files are accepted.'
    )
    .optional(),
  selectedClasses: z.array(z.number()).min(1, "At least one class must be selected.")
});

type MentorFormData = z.infer<typeof mentorFormSchema>;

interface Class {
  class_room_id: number;
  title: string;
}

export function CreateMentorPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const { toast } = useToast();
  const { getToken } = useAuth();
  const { user, isLoaded } = useUser();
  
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, watch, control } = useForm<MentorFormData>({
    resolver: zodResolver(mentorFormSchema),
    defaultValues: {
      selectedClasses: []
    }
  });

  const imageFile = watch("image");
  const selectedImageName = imageFile && imageFile.length > 0 ? imageFile[0].name : null;

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      let token = await getToken({ template: "skill-mentor-auth-frontend" });
      if (!token) {
        token = await getToken();
      }
      if (!token) {
        token = await getToken({ template: "default" });
      }
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

  // API function to create mentor
  const createMentor = async (mentorData: {
    clerkMentorId: string;
    firstName: string;
    lastName: string;
    address: string;
    email: string;
    title: string;
    sessionFee: number;
    profession: string;
    subject: string;
    phoneNumber: string;
    qualification: string;
    imageUrl: string;
    classId: number;
  }) => {
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
      clerk_mentor_id: mentorData.clerkMentorId,
      first_name: mentorData.firstName,
      last_name: mentorData.lastName,
      address: mentorData.address,
      email: mentorData.email,
      title: mentorData.title,
      session_fee: mentorData.sessionFee,
      profession: mentorData.profession,
      subject: mentorData.subject,
      phone_number: mentorData.phoneNumber,
      qualification: mentorData.qualification,
      mentor_image: mentorData.imageUrl,
      class_room_id: mentorData.classId,
    };

    console.log("Creating mentor with data:", requestBody);

    const response = await fetch(`${BACKEND_URL}/academic/mentor`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Create mentor failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  };

  const onSubmit = async (formData: MentorFormData) => {
    try {
      console.log("Starting mentor form submission...");
      
      // Validate user authentication
      if (!isLoaded) {
        throw new Error("User authentication is loading...");
      }
      
      if (!user) {
        throw new Error("User not authenticated");
      }
      
      // Check if user has admin role
      const userRole = user.publicMetadata?.role;
      console.log("Checking user role:", userRole);
      
      if (userRole !== 'ADMIN') {
        throw new Error("You must have admin privileges to create mentors. Please contact an administrator.");
      }

      let imageUrl = "";

      // Upload image if provided
      if (formData.image && formData.image.length > 0) {
        const file = formData.image[0];
        console.log("Uploading image:", file);
        const fileResponse = await uploadFile(file);
        imageUrl = fileResponse.url || fileResponse.data?.url || fileResponse.fileUrl || "";
        console.log("Image uploaded, URL:", imageUrl);
      }

      // Create mentors for each selected class
      const createdMentors = [];
      
      for (const classId of formData.selectedClasses) {
        const mentorData = {
          clerkMentorId: formData.clerkMentorId,
          firstName: formData.firstName,
          lastName: formData.lastName,
          address: formData.address,
          email: formData.email,
          title: formData.title,
          sessionFee: parseFloat(formData.sessionFee),
          profession: formData.profession,
          subject: formData.subject,
          phoneNumber: formData.phoneNumber,
          qualification: formData.qualification,
          imageUrl: imageUrl,
          classId: classId,
        };

        console.log("Creating mentor for class:", classId);
        const result = await createMentor(mentorData);
        createdMentors.push(result);
      }

      // Show success message
      const mentorName = `${formData.firstName} ${formData.lastName}`;
      const classNames = formData.selectedClasses.map(classId => {
        const foundClass = classes.find(c => c.class_room_id === classId);
        return foundClass ? foundClass.title : `Class ${classId}`;
      }).join(", ");

      // Browser alert for success
      alert("Mentor created successfully!");

      toast({
        title: "🎉 Mentor Created Successfully!",
        description: `${mentorName} has been successfully created and assigned to: ${classNames}`,
      });

      console.log("✅ Mentor creation completed successfully");
      reset();
    } catch (error: any) {
      console.error("Error creating mentor:", error);
      const errorMessage = error.message || "Failed to create mentor.";
      toast({ 
        title: "Error", 
        description: errorMessage, 
        variant: "destructive" 
      });
    }
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
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Label htmlFor="clerkMentorId">Clerk Mentor ID *</Label>
              <Input
                id="clerkMentorId"
                {...register("clerkMentorId")}
                type="text"
                placeholder="Enter the Clerk user ID for this mentor"
                className="mt-1"
              />
              {errors.clerkMentorId && (
                <p className="mt-1 text-sm text-red-600">{errors.clerkMentorId.message}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                The Clerk user ID that will be associated with this mentor
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  {...register("firstName")}
                  type="text"
                  className="mt-1"
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  {...register("lastName")}
                  type="text"
                  className="mt-1"
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  {...register("email")}
                  type="email"
                  className="mt-1"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="phoneNumber">Phone Number *</Label>
                <Input
                  id="phoneNumber"
                  {...register("phoneNumber")}
                  type="tel"
                  className="mt-1"
                />
                {errors.phoneNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.phoneNumber.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  {...register("title")}
                  type="text"
                  placeholder="e.g., Mr., Ms., Dr."
                  className="mt-1"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="sessionFee">Session Fee (USD) *</Label>
                <Input
                  id="sessionFee"
                  {...register("sessionFee")}
                  type="number"
                  step="0.01"
                  className="mt-1"
                />
                {errors.sessionFee && (
                  <p className="mt-1 text-sm text-red-600">{errors.sessionFee.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="profession">Profession *</Label>
                <Input
                  id="profession"
                  {...register("profession")}
                  type="text"
                  className="mt-1"
                />
                {errors.profession && (
                  <p className="mt-1 text-sm text-red-600">{errors.profession.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="qualification">Qualification *</Label>
                <Input
                  id="qualification"
                  {...register("qualification")}
                  type="text"
                  className="mt-1"
                />
                {errors.qualification && (
                  <p className="mt-1 text-sm text-red-600">{errors.qualification.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                {...register("address")}
                type="text"
                className="mt-1"
              />
              {errors.address && (
                <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="subject">Subject/Bio *</Label>
              <textarea
                id="subject"
                {...register("subject")}
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Describe the mentor's expertise and background..."
              />
              {errors.subject && (
                <p className="mt-1 text-sm text-red-600">{errors.subject.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="image">Mentor Image</Label>
              <div className="mt-1 space-y-4">
                <div>
                  <Label htmlFor="image" className="text-sm font-medium text-gray-700">
                    Upload Image from Device
                  </Label>
                  <input
                    id="image"
                    {...register("image")}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    className="mt-1 block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-medium
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100"
                  />
                  {selectedImageName && (
                    <p className="text-sm text-blue-600 mt-1">Selected: {selectedImageName}</p>
                  )}
                </div>

                {/* Image Preview */}
                {imageFile && imageFile.length > 0 && (
                  <div className="mt-4">
                    <Label className="text-sm font-medium text-gray-700">Preview</Label>
                    <div className="mt-2 border rounded-lg p-4 bg-gray-50">
                      <img
                        src={URL.createObjectURL(imageFile[0])}
                        alt="Mentor preview"
                        className="max-w-full h-48 object-cover rounded-md mx-auto"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                )}
                {errors.image && (
                  <p className="text-sm text-red-600">{String(errors.image.message)}</p>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Upload an image from your device (JPG, PNG, WEBP up to 5MB)
              </p>
            </div>

            <div>
              <Label>Assign to Classes *</Label>
              <Controller
                name="selectedClasses"
                control={control}
                render={({ field }) => (
                  <div className="mt-2 space-y-2">
                    {classes.map((cls) => (
                      <label key={cls.class_room_id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={field.value.includes(cls.class_room_id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              field.onChange([...field.value, cls.class_room_id]);
                            } else {
                              field.onChange(field.value.filter((id: number) => id !== cls.class_room_id));
                            }
                          }}
                          className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        <span className="ml-2 text-sm text-gray-900">{cls.title}</span>
                      </label>
                    ))}
                  </div>
                )}
              />
              {errors.selectedClasses && (
                <p className="mt-1 text-sm text-red-600">{errors.selectedClasses.message}</p>
              )}
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
                onClick={() => reset()}
                disabled={isSubmitting}
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
