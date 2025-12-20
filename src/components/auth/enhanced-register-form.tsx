"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Church, MapPin, Mail, User as UserIcon, Lock, Eye, EyeOff } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";
import { SearchableSelect, type SearchableSelectOption } from "@/components/ui/searchable-select";
import {
  getDenominationOptions,
  getBranchesForDenomination,
  getBranchById,
  getDenominationById,
} from "@/data/denominations";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  denomination: z.string().min(1, "Please select a denomination"),
  branch: z.string().min(1, "Please select a branch"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export function EnhancedRegisterForm(): React.JSX.Element {
  const router = useRouter();
  const registerMutation = useMutation(api.auth.registerWithDenomination);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      denomination: "",
      branch: "",
    },
  });

  const selectedDenomination = watch("denomination");
  const selectedBranch = watch("branch");

  // Get branch options based on selected denomination
  const branchOptions = React.useMemo((): SearchableSelectOption[] => {
    if (!selectedDenomination) return [];
    const branches = getBranchesForDenomination(selectedDenomination);
    return branches.map((branch) => ({
      value: branch.id,
      label: `${branch.name}`,
    }));
  }, [selectedDenomination]);

  // Get pastor details for selected branch
  const pastorDetails = React.useMemo(() => {
    if (!selectedBranch) return null;
    const branch = getBranchById(selectedBranch);
    if (!branch) return null;
    return {
      pastor: branch.pastor,
      pastorEmail: branch.pastorEmail,
      location: branch.location,
    };
  }, [selectedBranch]);

  // Get denomination name
  const denominationName = React.useMemo(() => {
    if (!selectedDenomination) return "";
    const denom = getDenominationById(selectedDenomination);
    return denom?.name || "";
  }, [selectedDenomination]);

  // Get branch name
  const branchName = React.useMemo(() => {
    if (!selectedBranch) return "";
    const branch = getBranchById(selectedBranch);
    return branch?.name || "";
  }, [selectedBranch]);

  const onSubmit = async (data: RegisterFormData): Promise<void> => {
    setIsLoading(true);
    setError("");

    try {
      const branch = getBranchById(data.branch);
      if (!branch) {
        throw new Error("Invalid branch selection");
      }

      await registerMutation({
        email: data.email,
        password: data.password,
        name: data.name,
        denomination: data.denomination,
        denominationName: denominationName,
        branch: data.branch,
        branchName: branchName,
        branchLocation: branch.location,
        pastor: branch.pastor,
        pastorEmail: branch.pastorEmail,
      });

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
            <Church className="w-8 h-8 text-green-500" />
          </div>
          <CardTitle className="text-2xl font-bold">Registration Successful!</CardTitle>
          <CardDescription>
            Your account has been created and is pending approval
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription className="text-center">
              Your account is pending approval from an admin or pastor. An email will be sent to you once your account is approved and you can create your professional profile.
            </AlertDescription>
          </Alert>
          <div className="space-y-2 pt-4">
            <Button
              onClick={() => router.push("/login")}
              className="w-full"
            >
              Go to Login
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
        <CardDescription>
          Join the UD professional directory
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  className="pl-10"
                  {...register("name")}
                  disabled={isLoading}
                />
              </div>
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  className="pl-10"
                  {...register("email")}
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
            </div>
           

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    {...register("password")}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    {...register("confirmPassword")}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Church Information */}
             
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Church className="w-5 h-5" />
              Church Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
              <Label htmlFor="denomination">Denomination</Label>
              <Controller
                name="denomination"
                control={control}
                render={({ field }) => (
                  <SearchableSelect
                    options={getDenominationOptions()}
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                    placeholder="Select your denomination..."
                    searchPlaceholder="Search denominations..."
                    emptyText="No denomination found."
                    disabled={isLoading}
                  />
                )}
              />
              {errors.denomination && (
                <p className="text-sm text-destructive">{errors.denomination.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="branch">Branch</Label>
              <Controller
                name="branch"
                control={control}
                render={({ field }) => (
                  <SearchableSelect
                    options={branchOptions}
                      value={field.value ?? ""}
                    onValueChange={field.onChange}
                    placeholder={selectedDenomination ? "Select your branch..." : "Select denomination first"}
                    searchPlaceholder="Search branches..."
                    emptyText="No branch found."
                    disabled={isLoading || !selectedDenomination}
                  />
                )}
              />
              {errors.branch && (
                <p className="text-sm text-destructive">{errors.branch.message}</p>
              )}
            </div> 
             </div>
           

            {/* Auto-populated Pastor Details */}
            {pastorDetails && (
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
                <p className="text-sm font-medium text-muted-foreground">
                  Branch Details (Auto-assigned)
                </p>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Location:</span>
                    <span className="font-medium">{pastorDetails.location}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <UserIcon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Pastor:</span>
                    <span className="font-medium">{pastorDetails.pastor}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-medium">{pastorDetails.pastorEmail}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 mt-3">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              "Create Account"
            )}
          </Button>

          <p className="text-sm text-center text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Sign in here
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
