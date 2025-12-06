"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ImageUpload } from "./image-upload";
import type { Id } from "../../../convex/_generated/dataModel";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  skills: z.string().min(5, "Please describe your skills"),
  profession: z.string().min(2, "Profession is required"),
  category: z.string().min(1, "Please select a category"),
  experience: z.string().min(10, "Please describe your experience"),
  servicesOffered: z.string().min(10, "Please describe services offered"),
  location: z.string().min(2, "Location is required"),
  profilePicture: z.string().optional(),
  country: z.string().min(2, "Country is required"),
  church: z.string().optional(),
  denomination: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  userId: Id<"users">;
  profileId?: Id<"profiles">;
  defaultValues?: Partial<ProfileFormData>;
  onSuccess?: () => void;
}

const categories = [
  "Technology & IT",
  "Construction & Trades",
  "Healthcare & Medical",
  "Education & Training",
  "Business & Finance",
  "Creative & Design",
  "Legal & Consulting",
  "Hospitality & Food Service",
  "Transportation & Logistics",
  "Other",
];

export function ProfileForm({ userId, profileId, defaultValues, onSuccess }: ProfileFormProps): React.JSX.Element {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const createProfile = useMutation(api.profiles.createProfile);
  const updateProfile = useMutation(api.profiles.updateProfile);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: defaultValues || {
      category: "",
      profilePicture: "",
    },
  });

  const category = watch("category");
  const profilePicture = watch("profilePicture");

  const onSubmit = async (data: ProfileFormData): Promise<void> => {
    setIsLoading(true);
    setError("");

    try {
      if (profileId) {
        await updateProfile({
          profileId,
          ...data,
        });
        toast.success("Profile updated successfully! Waiting for approval.");
      } else {
        await createProfile({
          userId,
          ...data,
        });
        toast.success("Profile submitted for approval!");
      }
      onSuccess?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to save profile";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label>Profile Picture</Label>
        <ImageUpload
          value={profilePicture}
          onChange={(url) => setValue("profilePicture", url)}
          disabled={isLoading}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            placeholder="John Doe"
            {...register("name")}
            disabled={isLoading}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="profession">Profession/Title</Label>
          <Input
            id="profession"
            placeholder="e.g., Software Engineer"
            {...register("profession")}
            disabled={isLoading}
          />
          {errors.profession && (
            <p className="text-sm text-destructive">{errors.profession.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Professional Category</Label>
        <Select
          value={category}
          onValueChange={(value) => setValue("category", value)}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.category && (
          <p className="text-sm text-destructive">{errors.category.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="skills">Skills</Label>
        <Textarea
          id="skills"
          placeholder="List your key skills and expertise..."
          {...register("skills")}
          disabled={isLoading}
          rows={3}
        />
        {errors.skills && (
          <p className="text-sm text-destructive">{errors.skills.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="experience">Work Experience</Label>
        <Textarea
          id="experience"
          placeholder="Describe your relevant work experience..."
          {...register("experience")}
          disabled={isLoading}
          rows={4}
        />
        {errors.experience && (
          <p className="text-sm text-destructive">{errors.experience.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="servicesOffered">Services Offered</Label>
        <Textarea
          id="servicesOffered"
          placeholder="What services can you provide to the church community?"
          {...register("servicesOffered")}
          disabled={isLoading}
          rows={4}
        />
        {errors.servicesOffered && (
          <p className="text-sm text-destructive">{errors.servicesOffered.message}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="location">Location/Branch</Label>
          <Input
            id="location"
            placeholder="e.g., Downtown Campus"
            {...register("location")}
            disabled={isLoading}
          />
          {errors.location && (
            <p className="text-sm text-destructive">{errors.location.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="country">Country/Region</Label>
          <Input
            id="country"
            placeholder="e.g., United States"
            {...register("country")}
            disabled={isLoading}
          />
          {errors.country && (
            <p className="text-sm text-destructive">{errors.country.message}</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="church">Church Name (Optional)</Label>
          <Input
            id="church"
            placeholder="e.g., Grace Community Church"
            {...register("church")}
            disabled={isLoading}
          />
          {errors.church && (
            <p className="text-sm text-destructive">{errors.church.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="denomination">Denomination (Optional)</Label>
          <Input
            id="denomination"
            placeholder="e.g., Baptist, Methodist, etc."
            {...register("denomination")}
            disabled={isLoading}
          />
          {errors.denomination && (
            <p className="text-sm text-destructive">{errors.denomination.message}</p>
          )}
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          profileId ? "Update Profile" : "Submit Profile"
        )}
      </Button>
    </form>
  );
}
