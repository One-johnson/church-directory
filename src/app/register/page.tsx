"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { EnhancedRegisterForm } from "@/components/auth/enhanced-register-form";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, ArrowLeft, Church, Users, Shield, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function RegisterPage(): React.JSX.Element {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  React.useEffect(() => {
    if (!isLoading && user) {
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 },
  };

  const features = [
    { icon: Users, text: "Join verified professionals" },
    { icon: Shield, text: "Pastor-approved profiles" },
    { icon: Sparkles, text: "Real-time messaging" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background overflow-x-hidden relative">
      {/* Animated Background Elements */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 90, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl"
      />
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          rotate: [0, -90, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"
      />

      <main className="relative z-10 min-h-screen w-full flex items-center justify-center p-4">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Side - Branding */}
          <motion.div
            initial="initial"
            animate="animate"
            variants={{
              animate: {
                transition: {
                  staggerChildren: 0.1,
                },
              },
            }}
            className="hidden lg:block space-y-8"
          >
            <motion.div variants={fadeInUp}>
              <Button
                variant="ghost"
                onClick={() => router.push("/")}
                className="mb-6"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>

              <Badge
                variant="outline"
                className="mb-4 px-4 py-2 text-sm font-medium border-primary/50 bg-primary/5 backdrop-blur-sm"
              >
                <Sparkles className="w-4 h-4 mr-2 inline" />
                UD Professionals Directory
              </Badge>

              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                Welcome to the UD{" "}
                <span className="bg-gradient-to-r from-primary via-purple-500 to-primary bg-clip-text text-transparent animate-gradient">
                  Professionals Directory
                </span>
              </h1>

              <p className="text-xl text-muted-foreground mb-8">
                Create your professional profile and connect with other trusted UD Professionals.
              </p>
            </motion.div>

            <motion.div variants={fadeInUp} className="space-y-4">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  whileHover={{ x: 5 }}
                  className="flex items-center gap-3 p-4 rounded-lg border bg-card/50 backdrop-blur-sm"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="font-medium">{feature.text}</span>
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              variants={fadeInUp}
              className="flex items-center gap-2 text-muted-foreground"
            >
              <Church className="w-5 h-5" />
              <span className="text-sm">Trusted by Professionals in the UDLWM</span>
            </motion.div>
          </motion.div>

          {/* Right Side - Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full"
          >
            <div className="lg:hidden mb-6">
              <Button
                variant="ghost"
                onClick={() => router.push("/")}
                className="mb-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-card/80 backdrop-blur-sm border-2 rounded-2xl p-8 shadow-2xl"
            >
              <div className="text-center lg:text-left mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.4 }}
                  className="inline-block mb-4"
                >
                  <Church className="w-12 h-12 text-primary" />
                </motion.div>
                <h2 className="text-3xl font-bold tracking-tight mb-2">
                  Create Your Account
                </h2>
                <p className="text-muted-foreground">
                  Join our community of trusted professionals
                </p>
              </div>

              <EnhancedRegisterForm />

            
            </motion.div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
