"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Search,
  BarChart3,
  MapPin,
  Calendar,
  Filter,
  Zap,
} from "lucide-react";
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

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/60 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/60 rounded-full mt-2 animate-pulse"></div>
          </div>
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

      {/* Quick Search Section - Now separate from hero */}
      <div className="bg-gradient-to-br from-background to-muted py-16">
        <div className="container mx-auto px-4">
          <Card className="max-w-5xl mx-auto shadow-2xl">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center justify-center gap-3 text-3xl">
                <Search className="h-8 w-8 text-primary" />
                Quick Property Search
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Town/Area
                  </label>
                  <Input placeholder="e.g. Tampines, Jurong" className="h-12" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Flat Type
                  </label>
                  <Input placeholder="e.g. 4-Room, 5-Room" className="h-12" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Price Range (SGD)
                  </label>
                  <Input placeholder="e.g. 300k - 500k" className="h-12" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Year Range
                  </label>
                  <Input placeholder="e.g. 2020 - 2024" className="h-12" />
                </div>
              </div>
              <div className="flex gap-4 justify-center">
                <Button size="lg" className="px-12 py-4 text-lg">
                  <Search className="h-5 w-5 mr-3" />
                  Search Properties
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="px-8 py-4 text-lg"
                >
                  <Filter className="h-5 w-5 mr-2" />
                  Advanced Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Content Sections */}
      <div className="container mx-auto px-4 py-16 space-y-16">
        {/* Key Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="shadow-lg hover:shadow-xl transition-all">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <TrendingUp className="h-6 w-6 text-primary" />
                Price Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6 text-lg leading-relaxed">
                Real-time price trends, median values, and price-per-sqm
                analysis across different HDB towns and flat types.
              </p>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Historical Data</Badge>
                <Badge variant="outline">Market Trends</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-all">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <BarChart3 className="h-6 w-6 text-primary" />
                Interactive Charts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6 text-lg leading-relaxed">
                Visualize pricing data with interactive trendlines, scatter
                plots, and comparative analysis charts.
              </p>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Trendlines</Badge>
                <Badge variant="outline">Comparisons</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-all">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <MapPin className="h-6 w-6 text-primary" />
                Location Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6 text-lg leading-relaxed">
                Detailed breakdown by town, street, and block level with
                proximity-based pricing analysis.
              </p>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Town Analysis</Badge>
                <Badge variant="outline">Block Level</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Market Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <Calendar className="h-6 w-6 text-primary" />
                Latest Market Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center p-6 bg-muted rounded-xl">
                  <div className="text-3xl font-bold text-primary">1,247</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Transactions This Month
                  </div>
                </div>
                <div className="text-center p-6 bg-muted rounded-xl">
                  <div className="text-3xl font-bold text-primary">$485k</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Median Price
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center p-6 bg-muted rounded-xl">
                  <div className="text-3xl font-bold text-primary">+2.3%</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Price Growth (YoY)
                  </div>
                </div>
                <div className="text-center p-6 bg-muted rounded-xl">
                  <div className="text-3xl font-bold text-primary">26</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Active Towns
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <Zap className="h-6 w-6 text-primary" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full justify-start h-14">
                <TrendingUp className="h-5 w-5 mr-3" />
                View Price Trends by Town
              </Button>
              <Button variant="outline" className="w-full justify-start h-14">
                <BarChart3 className="h-5 w-5 mr-3" />
                Compare Flat Types
              </Button>
              <Button variant="outline" className="w-full justify-start h-14">
                <MapPin className="h-5 w-5 mr-3" />
                Explore by Location
              </Button>
              <Button variant="outline" className="w-full justify-start h-14">
                <Calendar className="h-5 w-5 mr-3" />
                Monthly Market Report
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Popular Searches */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl">Popular Searches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {[
                "Tampines 4-Room",
                "Jurong West 5-Room",
                "Bishan 3-Room",
                "Woodlands Executive",
                "Sengkang 4-Room",
                "Punggol 5-Room",
                "Ang Mo Kio 3-Room",
                "Bedok 4-Room",
              ].map((search) => (
                <Badge
                  key={search}
                  variant="secondary"
                  className="cursor-pointer hover:bg-accent transition-colors px-4 py-2"
                >
                  {search}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
