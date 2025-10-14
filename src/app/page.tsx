"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Navbar } from "@/components/custom/navbar";

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const hdbImages = ["/hdb-slide1.png", "/hdb-slide2.png", "/hdb-slide3.png"];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % hdbImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [hdbImages.length]);

  return (
    <div className="min-h-screen">
      <Navbar />
      {/* Hero Section with Slideshow Background */}
      <div className="relative min-h-screen flex flex-col justify-center items-center text-center">
        {/* Background Slideshow */}
        <div className="absolute inset-0 overflow-hidden">
          {hdbImages.map((image: string, index: number) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentSlide ? "opacity-100" : "opacity-0"
              }`}
            >
              <Image
                src={image}
                alt={`HDB Building ${index + 1}`}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80" />
            </div>
          ))}
        </div>

        {/* Slide Indicators */}
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
          {hdbImages.map((_: string, index: number) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentSlide ? "bg-white" : "bg-white/40"
              }`}
            />
          ))}
        </div>

        {/* Hero Content */}
        <div className="relative z-10 px-4 space-y-8">
          <div className="space-y-6">
            <div className="flex items-center justify-center mb-8">
              <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-primary-400 to-primary-foreground bg-clip-text text-transparent drop-shadow-2xl pb-4">
                HDB Resale Pricing Viewer
              </h1>
            </div>

            <p className="text-2xl text-primary-foreground/90 max-w-4xl mx-auto leading-relaxed drop-shadow-lg -mt-4">
              Discover real-time HDB resale prices, analyze market trends, and
              make informed housing decisions with comprehensive data insights.
            </p>

            <div className="flex items-center justify-center gap-3 mt-8">
              <Badge className="bg-primary/20 backdrop-blur-sm border border-primary/30 text-primary-foreground px-4 py-2 text-lg">
                Live Data
              </Badge>
              <Badge className="bg-primary/20 backdrop-blur-sm border border-primary/30 text-primary-foreground px-4 py-2 text-lg">
                Singapore HDB
              </Badge>
              <Badge className="bg-primary/20 backdrop-blur-sm border border-primary/30 text-primary-foreground px-4 py-2 text-lg">
                Market Analytics
              </Badge>
            </div>

            <div className="flex justify-center mt-10">
              <Button size="lg" variant="highlight">
                Explore Now
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
