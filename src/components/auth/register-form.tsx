"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, User, Mail, Phone, Lock, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";

const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    phone: z.string().optional(),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterForm(): React.JSX.Element {
  const { register: registerUser } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData): Promise<void> => {
    setIsLoading(true);
    setError("");
    try {
      await registerUser(data.email, data.password, data.name, data.phone);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  const InputWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="relative w-full">{children}</div>
  );

  const LeftIcon: React.FC<{ icon: React.ReactNode }> = ({ icon }) => (
    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-transform duration-150 ease-in-out group-focus-within:scale-110 group-focus-within:text-primary">
      {icon}
    </div>
  );

  const RightIconButton: React.FC<{ onClick: () => void; icon: React.ReactNode }> = ({
    onClick,
    icon,
  }) => (
    <button
      type="button"
      onClick={onClick}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary hover:scale-110 transition-transform duration-150 ease-in-out"
    >
      {icon}
    </button>
  );

  const InputFieldWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="relative group w-full">{children}</div>
  );

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
        <CardDescription>Join the church professional directory</CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <InputFieldWrapper>
              <LeftIcon icon={<User className="w-4 h-4" />} />
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                {...register("name")}
                className="pl-10"
                disabled={isLoading}
              />
            </InputFieldWrapper>
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <InputFieldWrapper>
              <LeftIcon icon={<Mail className="w-4 h-4" />} />
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                {...register("email")}
                className="pl-10"
                disabled={isLoading}
              />
            </InputFieldWrapper>
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone (Optional)</Label>
            <InputFieldWrapper>
              <LeftIcon icon={<Phone className="w-4 h-4" />} />
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 000-0000"
                {...register("phone")}
                className="pl-10"
                disabled={isLoading}
              />
            </InputFieldWrapper>
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <InputFieldWrapper>
              <LeftIcon icon={<Lock className="w-4 h-4" />} />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                {...register("password")}
                className="pl-10 pr-10"
                disabled={isLoading}
              />
              <RightIconButton
                onClick={() => setShowPassword((prev) => !prev)}
                icon={showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              />
            </InputFieldWrapper>
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <InputFieldWrapper>
              <LeftIcon icon={<Lock className="w-4 h-4" />} />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                {...register("confirmPassword")}
                className="pl-10 pr-10"
                disabled={isLoading}
              />
              <RightIconButton
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                icon={showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              />
            </InputFieldWrapper>
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
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
