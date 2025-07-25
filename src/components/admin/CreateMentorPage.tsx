import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeft, Upload, UserPlus, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/hooks/use-toast";


interface TutoringClass {
  id: string;
  name: string;
  imageUrl: string;
  createdAt: string;
}

interface CreateMentorPageProps {
  onBack: () => void;
}

const createMentorSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  address: z.string().min(1, "Address is required"),
  email: z.string().email("Please enter a valid email address"),
  title: z.string().min(1, "Title is required"),
  sessionFee: z.number().min(0, "Session fee must be 0 or greater"),
  profession: z.string().min(1, "Profession is required"),
  bio: z.string().min(10, "Bio must be at least 10 characters"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  qualification: z.string().min(1, "Qualification is required"),
  image: z.instanceof(FileList).optional(),
  assignedClasses: z.array(z.string()).min(1, "Please select at least one class"),
});

type CreateMentorFormData = z.infer<typeof createMentorSchema>;

export default function CreateMentorPage({ onBack }: CreateMentorPageProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [availableClasses, setAvailableClasses] = useState<TutoringClass[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<CreateMentorFormData>({
    resolver: zodResolver(createMentorSchema),
    defaultValues: {
      sessionFee: 0,
      assignedClasses: [],
    },
  });

  // Load available classes
  useEffect(() => {
    // In a real app, fetch from your API
    const mockClasses: TutoringClass[] = [
      { id: "1", name: "A/L Biology", imageUrl: "", createdAt: "2025-01-25" },
      { id: "2", name: "A/L Chemistry", imageUrl: "", createdAt: "2025-01-25" },
      { id: "3", name: "A/L Physics", imageUrl: "", createdAt: "2025-01-25" },
      { id: "4", name: "O/L Mathematics", imageUrl: "", createdAt: "2025-01-25" },
      { id: "5", name: "O/L Science", imageUrl: "", createdAt: "2025-01-25" },
      { id: "6", name: "Grade 10 English", imageUrl: "", createdAt: "2025-01-25" },
    ];
    setAvailableClasses(mockClasses);
  }, []);

  // Handle image preview
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  // Handle class selection
  const handleClassSelection = (classId: string) => {
    const newSelectedClasses = selectedClasses.includes(classId)
      ? selectedClasses.filter(id => id !== classId)
      : [...selectedClasses, classId];
    
    setSelectedClasses(newSelectedClasses);
    setValue("assignedClasses", newSelectedClasses);
  };

  const onSubmit = async (data: CreateMentorFormData) => {
    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In a real app, you would:
      // 1. Upload the image to cloud storage
      // 2. Send the mentor data to your backend API
      // 3. Store the mentor information in your database
      
      console.log("Creating mentor:", {
        ...data,
        image: data.image?.[0],
        imagePreview,
        assignedClasses: selectedClasses
      });

      toast({
        title: "Success!",
        description: `Mentor "${data.firstName} ${data.lastName}" has been created successfully.`,
      });

      // Reset form
      reset();
      setImagePreview(null);
      setSelectedClasses([]);
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create mentor. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <UserPlus className="h-8 w-8 text-green-600" />
          Create New Mentor
        </h1>
        <p className="text-gray-600 mt-2">
          Add a new tutor to your platform and assign them to classes.
        </p>
      </div>

      {/* Form */}
      <div className="max-w-4xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    placeholder="Enter first name"
                    {...register("firstName")}
                    className={errors.firstName ? "border-red-500" : ""}
                  />
                  {errors.firstName && (
                    <p className="text-sm text-red-500">{errors.firstName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    placeholder="Enter last name"
                    {...register("lastName")}
                    className={errors.lastName ? "border-red-500" : ""}
                  />
                  {errors.lastName && (
                    <p className="text-sm text-red-500">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  placeholder="Enter full address"
                  {...register("address")}
                  className={errors.address ? "border-red-500" : ""}
                />
                {errors.address && (
                  <p className="text-sm text-red-500">{errors.address.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter email address"
                    {...register("email")}
                    className={errors.email ? "border-red-500" : ""}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    placeholder="Enter phone number"
                    {...register("phoneNumber")}
                    className={errors.phoneNumber ? "border-red-500" : ""}
                  />
                  {errors.phoneNumber && (
                    <p className="text-sm text-red-500">{errors.phoneNumber.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Professional Information */}
          <Card>
            <CardHeader>
              <CardTitle>Professional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Senior Biology Teacher"
                    {...register("title")}
                    className={errors.title ? "border-red-500" : ""}
                  />
                  {errors.title && (
                    <p className="text-sm text-red-500">{errors.title.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sessionFee">Session Fee (LKR)</Label>
                  <Input
                    id="sessionFee"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    {...register("sessionFee", { valueAsNumber: true })}
                    className={errors.sessionFee ? "border-red-500" : ""}
                  />
                  {errors.sessionFee && (
                    <p className="text-sm text-red-500">{errors.sessionFee.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="profession">Profession</Label>
                <Input
                  id="profession"
                  placeholder="e.g., Teacher, Professor, Industry Expert"
                  {...register("profession")}
                  className={errors.profession ? "border-red-500" : ""}
                />
                {errors.profession && (
                  <p className="text-sm text-red-500">{errors.profession.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="qualification">Qualification</Label>
                <Input
                  id="qualification"
                  placeholder="e.g., BSc Biology, MSc Chemistry"
                  {...register("qualification")}
                  className={errors.qualification ? "border-red-500" : ""}
                />
                {errors.qualification && (
                  <p className="text-sm text-red-500">{errors.qualification.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio / Subject Description</Label>
                <textarea
                  id="bio"
                  rows={4}
                  placeholder="Describe the mentor's expertise, teaching style, and subject knowledge..."
                  {...register("bio")}
                  className={`flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.bio ? "border-red-500" : ""}`}
                />
                {errors.bio && (
                  <p className="text-sm text-red-500">{errors.bio.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Profile Image */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Image</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="image">Mentor Image</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 relative">
                  {imagePreview ? (
                    <div className="space-y-4">
                      <img
                        src={imagePreview}
                        alt="Mentor preview"
                        className="max-h-48 mx-auto rounded-lg"
                      />
                      <div className="text-center">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setImagePreview(null);
                            const input = document.getElementById("image") as HTMLInputElement;
                            if (input) input.value = "";
                          }}
                        >
                          Remove Image
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <div className="text-sm text-gray-600 mb-2">
                        Click to upload or drag and drop
                      </div>
                      <div className="text-xs text-gray-500">
                        PNG, JPG, GIF up to 10MB
                      </div>
                      <Label
                        htmlFor="image"
                        className="absolute inset-0 cursor-pointer"
                      />
                    </div>
                  )}
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    {...register("image")}
                    onChange={(e) => {
                      register("image").onChange(e);
                      handleImageChange(e);
                    }}
                    className="hidden"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Class Assignment */}
          <Card>
            <CardHeader>
              <CardTitle>Class Assignment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Label>Select Classes to Assign</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {availableClasses.map((cls) => (
                    <div
                      key={cls.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedClasses.includes(cls.id)
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => handleClassSelection(cls.id)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{cls.name}</span>
                        {selectedClasses.includes(cls.id) && (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {errors.assignedClasses && (
                  <p className="text-sm text-red-500">{errors.assignedClasses.message}</p>
                )}
                {selectedClasses.length > 0 && (
                  <div className="text-sm text-gray-600">
                    Selected {selectedClasses.length} class{selectedClasses.length !== 1 ? 'es' : ''}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? "Creating..." : "Create Mentor"}
            </Button>
            <Button
              type="button"
              variant="outline"
               className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                reset();
                setImagePreview(null);
                setSelectedClasses([]);
              }}
              disabled={isSubmitting}
            >
              Reset Form
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
