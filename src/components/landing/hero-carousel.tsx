"use client";

import * as React from "react";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeroCarousel(): React.JSX.Element {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, duration: 20 },
    [Autoplay({ delay: 4000, stopOnInteraction: false })]
  );

  const [selectedIndex, setSelectedIndex] = React.useState(0);

  const scrollPrev = React.useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = React.useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = React.useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  React.useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  const slides = [
    {
      title: "Find Trusted Professionals",
      description: "Connect with verified UD Professionals offering professional services",
      image: "/images/photo1.png",
      gradient: "from-blue-500/20 to-purple-500/20",
    },
    {
      title: "Pastor-Approved Profiles",
      description: "Every professional is reviewed by pastor or admin for your peace of mind",
      image: "/images/photo2.png",
      gradient: "from-purple-500/20 to-pink-500/20",
    },
    {
      title: "Real-Time Communication",
      description: "Message professionals instantly with our built-in messaging system",
      image: "/images/photo3.png",
      gradient: "from-green-500/20 to-emerald-500/20",
    },
    {
      title: "Verified & Trustworthy",
      description: "Email, phone, and background check verification badges for added security",
      image: "/images/photo4.png",
      gradient: "from-amber-500/20 to-orange-500/20",
    },
    {
      title: "Community Building",
      description: "Strengthen connections within the UD Professional Directory through professional networking",
      image: "/images/photo5.png",
      gradient: "from-rose-500/20 to-red-500/20",
    },
    {
      title: "Career Opportunities",
      description: "Discover and share job opportunities within the Directory",
      image: "/images/photo6.png",
      gradient: "from-indigo-500/20 to-blue-500/20",
    },
    {
      title: "Growing Together",
      description: "Join a thriving network of professionals dedicated to serving one another",
      image: "/images/photo7.png",
      gradient: "from-cyan-500/20 to-teal-500/20",
    },
  ];

  return (
    <div className="relative w-full max-w-5xl mx-auto">
      <div className="overflow-hidden rounded-2xl shadow-2xl" ref={emblaRef}>
        <div className="flex">
          {slides.map((slide, index) => (
            <div key={index} className="flex-[0_0_100%] min-w-0 relative">
              <div className="relative h-[400px] md:h-[500px]">
                {/* Background Image */}
                <motion.div
                  initial={{ scale: 1.2, opacity: 0 }}
                  animate={{ scale: 1, opacity: selectedIndex === index ? 1 : 0 }}
                  transition={{ duration: 0.7 }}
                  className="absolute inset-0"
                >
                  <Image
                    src={slide.image}
                    alt={slide.title}
                    fill
                    className="object-contain bg-black"
                    priority={index === 0}
                  />
                  <div className={`absolute inset-0 bg-gradient-to-br ${slide.gradient}`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                </motion.div>

                {/* Content */}
                <div className="relative h-full flex items-end p-8 md:p-12">
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: selectedIndex === index ? 1 : 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="text-white space-y-4 max-w-2xl"
                  >
                    <h3 className="text-3xl md:text-5xl font-bold">
                      {slide.title}
                    </h3>
                    <p className="text-lg md:text-xl text-white/90">
                      {slide.description}
                    </p>
                  </motion.div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      <Button
        variant="outline"
        size="icon"
        onClick={scrollPrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm hover:bg-white z-10 shadow-lg"
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={scrollNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm hover:bg-white z-10 shadow-lg"
      >
        <ChevronRight className="h-6 w-6" />
      </Button>

      {/* Dots Indicator */}
      <div className="flex justify-center gap-2 mt-6">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => emblaApi?.scrollTo(index)}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === selectedIndex
                ? "w-8 bg-primary"
                : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
