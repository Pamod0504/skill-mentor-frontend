import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeft, Upload, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/hooks/use-toast";

interface CreateClassPageProps {
  onBack: () => void;
}

const createClassSchema = z.object({
  name: z.string().min(1, "Class name is required").min(3, "Class name must be at least 3 characters"),
  image: z.instanceof(FileList).optional(),
});

type CreateClassFormData = z.infer<typeof createClassSchema>;

export default function CreateClassPage({ onBack }: CreateClassPageProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateClassFormData>({
    resolver: zodResolver(createClassSchema),
  });

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

  const onSubmit = async (data: CreateClassFormData) => {
    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real app, you would:
      // 1. Upload the image to cloud storage (AWS S3, Cloudinary, etc.)
      // 2. Send the form data to your backend API
      // 3. Store the class information in your database
      
      console.log("Creating class:", {
        name: data.name,
        image: data.image?.[0],
        imagePreview
      });

      toast({
        title: "Success!",
        description: `Class "${data.name}" has been created successfully.`,
      });

      // Reset form
      reset();
      setImagePreview(null);
      
      // Optionally go back to overview
      // onBack();
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create class. Please try again.",
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
          <BookOpen className="h-8 w-8 text-blue-600" />
          Create New Class
        </h1>
        <p className="text-gray-600 mt-2">
          Add a new tutoring class to your platform.
        </p>
      </div>

      {/* Form */}
      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Class Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Class Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Class Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., A/L Biology, Mathematics Grade 10"
                  {...register("name")}
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>

              {/* Class Image */}
              <div className="space-y-2">
                <Label htmlFor="image">Class Image</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 relative">
                  {imagePreview ? (
                    <div className="space-y-4">
                      <img
                        src={imagePreview}
                        alt="Class preview"
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
                {errors.image && (
                  <p className="text-sm text-red-500">{errors.image.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isSubmitting ? "Creating..." : "Create Class"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="bg-red-600 hover:bg-red-700"
                  onClick={() => {
                    reset();
                    setImagePreview(null);
                  }}
                  disabled={isSubmitting}
                >
                  Reset Form
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
