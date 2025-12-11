"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Church,
  Users,
  Shield,
  MessageCircle,
  CheckCircle,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Search,
  Bell,
  Verified,
} from "lucide-react";
import { HeroCarousel } from "./hero-carousel";

const MotionCard = motion(Card);

export function LandingPage(): React.JSX.Element {
  const router = useRouter();

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 },
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const features = [
    {
      icon: Users,
      title: "Professional Directory",
      description: "Browse verified professionals from your church community with detailed profiles",
      color: "text-blue-500",
      bgColor: "from-blue-500/10 to-cyan-500/10",
    },
    {
      icon: Shield,
      title: "Pastor Approved",
      description: "All profiles reviewed and approved by church leadership for trust and safety",
      color: "text-purple-500",
      bgColor: "from-purple-500/10 to-pink-500/10",
    },
    {
      icon: MessageCircle,
      title: "Real-Time Messaging",
      description: "Connect instantly with professionals via in-app messaging with typing indicators",
      color: "text-green-500",
      bgColor: "from-green-500/10 to-emerald-500/10",
    },
    {
      icon: Search,
      title: "Advanced Search",
      description: "Search by country, profession, location or different categories",
      color: "text-amber-500",
      bgColor: "from-amber-500/10 to-orange-500/10",
    },
  ];

 

  const stats = [
  
    { value: "200+", label: "Professionals" },
    { value: "1000+", label: "Connections Made" },
    { value: "98%", label: "Satisfaction Rate" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background overflow-hidden">
      {/* Hero Section */}
      <motion.section
        initial="initial"
        animate="animate"
        variants={staggerContainer}
        className="relative overflow-hidden pt-16 pb-24 px-4"
      >
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

        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div variants={fadeInUp} className="text-center space-y-6">
            {/* Badge */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="inline-block"
            >
              <Badge
                variant="outline"
                className="px-4 py-2 text-sm font-medium border-primary/50 bg-primary/5 backdrop-blur-sm"
              >
                <Sparkles className="w-4 h-4 mr-2 inline" />
                UD Professionals Directory
              </Badge>
            </motion.div>

            {/* Hero Heading */}
            <motion.h1
              variants={fadeInUp}
              className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight"
            >
              Connect And Partner With{" "}
              <span className="bg-gradient-to-r from-primary via-purple-500 to-primary bg-clip-text text-transparent animate-gradient">
                Trusted Professionals In The UD
              </span>
              <br />
              and Lay World Movement
            </motion.h1>

            {/* Subheading */}
            <motion.p
              variants={fadeInUp}
              className="text-lg md:text-2xl text-muted-foreground max-w-3xl mx-auto"
            >
              This directory connects pastors confirmed, skilled professionals in our church across many countries for working, business and partnership opportunities.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4"
            >
              <Button
                size="lg"
                onClick={() => router.push("/register")}
                className="text-lg px-8 py-6 group shadow-lg hover:shadow-xl transition-shadow"
              >
                Register As A UD Professional
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => router.push("/login")}
                className="text-lg px-8 py-6 backdrop-blur-sm"
              >
                Login
              </Button>
            </motion.div>

            {/* Hero Carousel */}
            <motion.div
              variants={fadeInUp}
              className="pt-12"
            >
              <HeroCarousel />
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin: "-100px" }}
        variants={staggerContainer}
        className="py-20 px-4"
      >
        <div className="max-w-6xl mx-auto">
          <motion.div variants={fadeInUp} className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              Features
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why UD Professionals Directory?
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              Everything you need to find and connect with trusted professionals in the UD
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            className="grid md:grid-cols-2 gap-6 mb-12"
          >
            {features.map((feature, index) => (
              <MotionCard
                key={index}
                variants={fadeInUp}
                whileHover={{ scale: 1.02, y: -5 }}
                className="border-2 hover:border-primary/50 transition-all duration-300 cursor-pointer bg-card/50 backdrop-blur-sm"
              >
                <CardContent className="pt-6 space-y-4">
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                    className="inline-block"
                  >
                    <div
                      className={`w-16 h-16 rounded-full bg-gradient-to-br ${feature.bgColor} flex items-center justify-center ${feature.color}`}
                    >
                      <feature.icon className="w-8 h-8" />
                    </div>
                  </motion.div>
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </MotionCard>
            ))}
          </motion.div>

         
        </div>
      </motion.section>

      {/* Stats Section */}
      <motion.section
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        variants={staggerContainer}
        className="py-20 px-4 bg-muted/30 backdrop-blur-sm"
      >
        <div className="max-w-6xl mx-auto">
          <motion.div variants={fadeInUp} className="text-center mb-12">
            <Badge variant="outline" className="mb-4">
              Our Impact
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold">
              Trusted by Churches Everywhere
            </h2>
          </motion.div>

          <motion.div
            variants={fadeInUp}
            className="grid grid-cols-2 md:grid-cols-3 gap-8"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover={{ scale: 1.1 }}
                className="text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{
                    type: "spring",
                    stiffness: 200,
                    delay: index * 0.1,
                  }}
                  className="text-3xl md:text-5xl font-bold text-primary mb-2"
                >
                  {stat.value}
                </motion.div>
                <div className="text-sm md:text-base text-muted-foreground font-medium">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* How It Works Section */}
      <motion.section
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        variants={staggerContainer}
        className="py-20 px-4"
      >
        <div className="max-w-6xl mx-auto">
          <motion.div variants={fadeInUp} className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              How It Works
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Get Started in 3 Simple Steps
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Create Profile",
                description:
                  "Sign up and create your professional profile with your skills and services",
              },
              {
                step: "2",
                title: "Get Approved",
                description:
                  "Your church pastor reviews and approves your profile for the directory",
              },
              {
                step: "3",
                title: "Start Connecting",
                description:
                  "Browse professionals, send messages, and build trusted connections",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="relative"
              >
                <div className="text-center space-y-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.2 }}
                    className="w-16 h-16 rounded-full bg-primary text-primary-foreground font-bold text-2xl flex items-center justify-center mx-auto shadow-lg"
                  >
                    {item.step}
                  </motion.div>
                  <h3 className="text-xl font-semibold">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
                {index < 2 && (
                  <motion.div
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 }}
                    className="hidden md:block absolute top-8 left-1/2 w-full h-0.5 bg-gradient-to-r from-primary to-transparent"
                  />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Final CTA Section */}
      <motion.section
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        variants={fadeInUp}
        className="py-24 px-4 bg-gradient-to-r from-primary/5 via-purple-500/5 to-primary/5"
      >
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
          >
            <Church className="w-16 h-16 mx-auto text-primary mb-4" />
          </motion.div>
          <h2 className="text-3xl md:text-5xl font-bold">Ready to Connect?</h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Join hundreds of professionals in finding and connecting to other trusted professionals in
            the UD. Register As A UD Professional in minutes.
          </p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              size="lg"
              onClick={() => router.push("/register")}
              className="text-lg px-12 py-7 group shadow-xl"
            >
              Register As A UD Professional
              <TrendingUp className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        </div>
      </motion.section>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="border-t py-12 px-4 bg-card/50 backdrop-blur-sm"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-4">
            <div className="flex justify-center items-center gap-2">
              <Church className="w-6 h-6 text-primary" />
              <span className="text-lg font-semibold">Church Connect Pro</span>
            </div>
            <p className="text-muted-foreground">
              Connecting communities with trust and faith.
            </p>
            <p className="text-sm text-muted-foreground">
              © 2024 Church Connect Pro. All rights reserved.
            </p>
          </div>
        </div>
      </motion.footer>
    </div>
  );
}
