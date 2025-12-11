"use client";

import * as React from "react";
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
      description: "Connect and Partner with verified professional in the UD and Lay World Movement",
      image: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1200&h=600&fit=crop",
      gradient: "from-blue-500/20 to-purple-500/20",
    },
    {
      title: "Pastor-Approved Profiles",
      description: "Every professional is reviewed by church leadership for your peace of mind",
      image: "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=1200&h=600&fit=crop",
      gradient: "from-purple-500/20 to-pink-500/20",
    },
    {
      title: "Real-Time Communication",
      description: "Message professionals instantly with our built-in messaging system",
      image: "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=1200&h=600&fit=crop",
      gradient: "from-green-500/20 to-emerald-500/20",
    },
    {
      title: "Verified & Trustworthy",
      description: "Email, phone, and background check verification badges for added security",
      image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1200&h=600&fit=crop",
      gradient: "from-amber-500/20 to-orange-500/20",
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
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="w-full h-full object-cover"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-br ${slide.gradient} backdrop-blur-sm`} />
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
