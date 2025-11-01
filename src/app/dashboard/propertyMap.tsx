"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useSetAtom } from "jotai";
import { filtersAtom } from "@/lib/propertyAtom";
import { towns } from "@/lib/const";
import type { Property } from "@/type";

interface TownStats {
  avgPrice: number;
  count: number;
  avgArea: number;
  trend: Array<{ date: string; avgPrice: number }>;
}

declare global {
  interface Window {
    L: any;
  }
}

export function PropertyMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const geoJsonLayerRef = useRef<any>(null);
  const hoverInfoRef = useRef<HTMLDivElement>(null);
  const [townData, setTownData] = useState<Record<string, TownStats>>({});
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("Initializing map...");
  const setFilters = useSetAtom(filtersAtom);
  const statsRef = useRef<Record<string, TownStats>>({});

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js";
    script.async = true;
    script.onload = () => {
      initializeMap();
    };
    document.body.appendChild(script);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
    };
  }, []);

  const getHeatmapColor = (
    price: number,
    minPrice: number,
    maxPrice: number
  ) => {
    const normalized = (price - minPrice) / (maxPrice - minPrice);

    if (normalized < 0.25) {
      const t = normalized / 0.25;
      return `rgb(${Math.round(34 + (245 - 34) * t)}, ${Math.round(
        197 + (200 - 197) * t
      )}, ${Math.round(94 + (66 - 94) * t)})`;
    } else if (normalized < 0.5) {
      const t = (normalized - 0.25) / 0.25;
      return `rgb(${Math.round(245 + (251 - 245) * t)}, ${Math.round(
        200 + (191 - 200) * t
      )}, ${Math.round(66 + (36 - 66) * t)})`;
    } else if (normalized < 0.75) {
      const t = (normalized - 0.5) / 0.25;
      return `rgb(${Math.round(251 + (249 - 251) * t)}, ${Math.round(
        191 + (115 - 191) * t
      )}, ${Math.round(36 + (22 - 36) * t)})`;
    } else {
      const t = (normalized - 0.75) / 0.25;
      return `rgb(${Math.round(249 + (239 - 249) * t)}, ${Math.round(
        115 + (68 - 115) * t
      )}, ${Math.round(22 + (68 - 22) * t)})`;
    }
  };

  const getBorderGradientColors = (
    price: number,
    minPrice: number,
    maxPrice: number
  ) => {
    const baseColor = getHeatmapColor(price, minPrice, maxPrice);
    const match = baseColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (!match) return [baseColor, baseColor];

    const [_, r, g, b] = match.map(Number);

    const lighter = `rgb(${Math.min(r + 40, 255)}, ${Math.min(
      g + 40,
      255
    )}, ${Math.min(b + 40, 255)})`;
    const darker = `rgb(${Math.max(r - 40, 0)}, ${Math.max(
      g - 40,
      0
    )}, ${Math.max(b - 40, 0)})`;

    return [lighter, darker];
  };

  const normalizeTownName = (name: string) => {
    return name.toLowerCase().trim().replace(/\s+/g, " ");
  };

  const matchTownName = (planningArea: string): string => {
    const normalized = planningArea.trim();
    const exactMatch = towns.find(
      (town) => town.toLowerCase() === normalized.toLowerCase()
    );
    if (exactMatch) return exactMatch;

    // Map GeoJSON planning areas to your town names
    const variations: Record<string, string> = {
      kallang: "Kallang/Whampoa",
      "downtown core": "Central Area",
      museum: "Central Area",
      newton: "Central Area",
      orchard: "Central Area",
      outram: "Central Area",
      "river valley": "Central Area",
      rochor: "Central Area",
      "singapore river": "Central Area",
      tanglin: "Central Area",
      novena: "Central Area",
      "marina south": "Central Area",
      "marina east": "Central Area",
      "straits view": "Central Area",
    };

    const lowerNormalized = normalized.toLowerCase();
    if (variations[lowerNormalized]) {
      return variations[lowerNormalized];
    }

    return planningArea;
  };

  const fetchTownData = async () => {
    setLoadingMessage("Loading property data...");
    try {
      const res = await fetch("/api/dataset?all=true");
      const data = await res.json();
      const properties: Property[] = data.data || [];
      const stats: Record<string, TownStats> = {};

      properties.forEach((prop) => {
        // Map the town name from property data to match GeoJSON areas
        let townName = prop.town;

        // Handle special cases where property data uses combined names
        if (
          townName.toLowerCase().includes("kallang") ||
          townName.toLowerCase().includes("whampoa")
        ) {
          townName = "KALLANG"; // Match GeoJSON format
        } else if (townName.toLowerCase() === "central area") {
          // Keep as "CENTRAL AREA" - we'll aggregate all central planning areas to this
          townName = "CENTRAL AREA";
        }

        const town = normalizeTownName(townName);

        if (!stats[town]) {
          stats[town] = {
            avgPrice: 0,
            count: 0,
            avgArea: 0,
            trend: [],
          };
        }

        stats[town].count++;
        stats[town].avgPrice += prop.price;
        stats[town].avgArea += prop.floor_area_sqm;

        prop.trend.forEach((t) => {
          const existing = stats[town].trend.find((tr) => tr.date === t.date);
          if (existing) {
            existing.avgPrice = (existing.avgPrice + t.avgPrice) / 2;
          } else {
            stats[town].trend.push({ date: t.date, avgPrice: t.avgPrice });
          }
        });
      });

      Object.keys(stats).forEach((town) => {
        stats[town].avgPrice = stats[town].avgPrice / stats[town].count;
        stats[town].avgArea = stats[town].avgArea / stats[town].count;
        stats[town].trend.sort((a, b) => a.date.localeCompare(b.date));
      });

      // Now aggregate central area stats to all central planning areas
      const centralStats = stats[normalizeTownName("CENTRAL AREA")];
      if (centralStats) {
        const centralAreas = [
          "downtown core",
          "museum",
          "newton",
          "orchard",
          "outram",
          "river valley",
          "rochor",
          "singapore river",
          "tanglin",
          "novena",
          "marina south",
          "marina east",
          "straits view",
        ];

        centralAreas.forEach((area) => {
          const normalized = normalizeTownName(area);
          stats[normalized] = { ...centralStats };
        });
      }

      return stats;
    } catch (error) {
      console.error("Error fetching town data:", error);
      return {};
    }
  };

  const fetchBoundaries = async () => {
    setLoadingMessage("Loading Singapore planning areas...");
    try {
      const res = await fetch("/towns.geojson");
      const geoJsonData = await res.json();

      // Aggregate central area features (same as before)
      const centralAreaNames = [
        "DOWNTOWN CORE",
        "MUSEUM",
        "NEWTON",
        "ORCHARD",
        "OUTRAM",
        "RIVER VALLEY",
        "ROCHOR",
        "SINGAPORE RIVER",
        "TANGLIN",
        "NOVENA",
        "MARINA SOUTH",
        "MARINA EAST",
        "STRAITS VIEW",
      ];

      const centralFeatures: any[] = [];
      const otherFeatures: any[] = [];

      geoJsonData.features.forEach((feature: any) => {
        const planningArea = extractPlanningArea(feature);
        if (centralAreaNames.includes(planningArea.toUpperCase())) {
          centralFeatures.push(feature);
        } else {
          otherFeatures.push(feature);
        }
      });

      if (centralFeatures.length > 0) {
        const mergedGeometry = {
          type: "MultiPolygon",
          coordinates: [] as any[],
        };

        centralFeatures.forEach((feature: any) => {
          if (feature.geometry.type === "Polygon") {
            mergedGeometry.coordinates.push(feature.geometry.coordinates);
          } else if (feature.geometry.type === "MultiPolygon") {
            mergedGeometry.coordinates.push(...feature.geometry.coordinates);
          }
        });

        const mergedFeature = {
          type: "Feature",
          properties: {
            Name: "Central Area",
            PLN_AREA_N: "Central Area",
            Description: "<th>PLN_AREA_N</th><td>Central Area</td>",
          },
          geometry: mergedGeometry,
        };

        otherFeatures.push(mergedFeature);
      }

      return {
        type: "FeatureCollection",
        features: otherFeatures,
      };
    } catch (error) {
      console.error("Error fetching boundaries:", error);
      return null;
    }
  };

  const extractPlanningArea = (feature: any) => {
    const description = feature.properties.Description || "";
    const match = description.match(/<th>PLN_AREA_N<\/th>\s*<td>([^<]+)<\/td>/);
    const areaName = match
      ? match[1]
      : feature.properties.PLN_AREA_N || feature.properties.Name;

    return areaName;
  };

  const updateHoverInfo = (
    planningArea: string | null,
    townStats: TownStats | null
  ) => {
    if (!hoverInfoRef.current) return;

    if (!planningArea || !townStats) {
      hoverInfoRef.current.style.display = "none";
      return;
    }

    const trend = townStats.trend;
    let changePercent = 0;
    let timeframeText = "";

    if (trend.length >= 2) {
      const first = trend[0].avgPrice;
      const last = trend[trend.length - 1].avgPrice;
      changePercent = ((last - first) / first) * 100;

      // Format timeframe
      const firstDate = new Date(trend[0].date);
      const lastDate = new Date(trend[trend.length - 1].date);
      const formatDate = (date: Date) => {
        return date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
        });
      };
      timeframeText = `${formatDate(firstDate)} - ${formatDate(lastDate)}`;
    }

    const trendBars = trend
      .slice(-8)
      .map((point, i) => {
        const max = Math.max(...trend.map((t) => t.avgPrice));
        const height = (point.avgPrice / max) * 100;
        return `<div class="flex-1 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t transition-all hover:from-blue-600 hover:to-blue-500" style="height: ${height}%" title="${
          point.date
        }: $${point.avgPrice.toLocaleString()}"></div>`;
      })
      .join("");

    hoverInfoRef.current.innerHTML = `
      <div class="space-y-4">
        <div class="flex items-start justify-between">
          <div>
            <h3 class="font-semibold text-lg text-gray-900">${planningArea}</h3>
            <p class="text-sm text-gray-500">${
              townStats.count
            } property types</p>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1">
            <p class="text-xs text-gray-500 font-medium">Avg Price</p>
            <p class="text-xl font-bold text-gray-900">$${(
              townStats.avgPrice / 1000
            ).toFixed(0)}k</p>
            <p class="text-xs text-gray-600 font-medium">${
              changePercent > 0 ? "+" : ""
            }${changePercent.toFixed(1)}%</p>
          </div>

          <div class="space-y-1">
            <p class="text-xs text-gray-500 font-medium">Avg Area</p>
            <p class="text-xl font-bold text-gray-900">${townStats.avgArea.toFixed(
              0
            )} m²</p>
          </div>
        </div>

        <div class="pt-3 border-t border-gray-100">
          <div class="flex items-center justify-between mb-2">
            <p class="text-xs text-gray-500 font-medium">Price Trend</p>
            <p class="text-xs text-gray-400">${timeframeText}</p>
          </div>
          <div class="flex items-end gap-1 h-16">
            ${trendBars}
          </div>
        </div>

        <p class="text-xs text-gray-400 italic text-center pt-2 border-t border-gray-100">
          Click to filter by this town
        </p>
      </div>
    `;
    hoverInfoRef.current.style.display = "block";
  };

  const initializeMap = async () => {
    if (!mapRef.current || mapInstanceRef.current || !window.L) return;

    const L = window.L;

    const map = L.map(mapRef.current, {
      zoomControl: true,
      attributionControl: false,
    }).setView([1.3521, 103.8198], 11);

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      {
        maxZoom: 19,
      }
    ).addTo(map);

    mapInstanceRef.current = map;

    const [stats, boundaries] = await Promise.all([
      fetchTownData(),
      fetchBoundaries(),
    ]);

    if (!boundaries || Object.keys(stats).length === 0) {
      setLoading(false);
      return;
    }

    setTownData(stats);
    statsRef.current = stats;
    setLoadingMessage("Rendering heatmap...");

    const prices = Object.values(stats).map((s) => s.avgPrice);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    let matchedCount = 0;

    map.createPane("gradientBorders");
    map.getPane("gradientBorders").style.zIndex = 650;

    geoJsonLayerRef.current = L.geoJSON(boundaries, {
      pane: "gradientBorders",
      style: (feature: any) => {
        const planningArea = extractPlanningArea(feature);
        const townKey = normalizeTownName(planningArea);
        const townStats = stats[townKey];

        if (!townStats) {
          return {
            fillColor: "#e5e7eb",
            weight: 2,
            opacity: 1,
            color: "#d1d5db",
            fillOpacity: 0.3,
          };
        }

        matchedCount++;
        const heatmapColor = getHeatmapColor(
          townStats.avgPrice,
          minPrice,
          maxPrice
        );
        const [lighter, darker] = getBorderGradientColors(
          townStats.avgPrice,
          minPrice,
          maxPrice
        );

        return {
          fillColor: heatmapColor,
          weight: 3,
          opacity: 1,
          color: lighter,
          fillOpacity: 0.75,
        };
      },
      onEachFeature: (feature: any, layer: any) => {
        const planningArea = extractPlanningArea(feature);
        const townKey = normalizeTownName(planningArea);
        const townStats = stats[townKey];

        layer.on("mouseover", function (e: any) {
          const layer = e.target;

          if (townStats) {
            const [lighter, darker] = getBorderGradientColors(
              townStats.avgPrice,
              minPrice,
              maxPrice
            );

            layer.setStyle({
              weight: 5,
              fillOpacity: 0.9,
              color: darker,
            });
          } else {
            layer.setStyle({
              weight: 4,
              fillOpacity: 0.5,
            });
          }

          layer.bringToFront();
          updateHoverInfo(planningArea, townStats);
        });

        layer.on("mouseout", function (e: any) {
          const layer = e.target;

          if (townStats) {
            const [lighter, darker] = getBorderGradientColors(
              townStats.avgPrice,
              minPrice,
              maxPrice
            );
            layer.setStyle({
              weight: 3,
              fillOpacity: 0.75,
              color: lighter,
            });
          } else {
            layer.setStyle({
              weight: 2,
              fillOpacity: 0.3,
            });
          }

          updateHoverInfo(null, null);
        });

        layer.on("click", function () {
          if (townStats) {
            const matchedTown = matchTownName(planningArea);
            setFilters((prev: any) => ({ ...prev, town: matchedTown }));
          }
        });
      },
    }).addTo(map);
    setLoading(false);
  };

  return (
    <div className="relative h-[600px]">
      <div ref={mapRef} className="w-full h-full rounded-xl" />

      {!loading && Object.keys(townData).length > 0 && (
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-4 z-[1000]">
          <p className="text-xs font-semibold text-gray-700 mb-2">
            Average Price
          </p>
          <div className="flex items-center gap-2">
            <div className="flex flex-col gap-1">
              <div className="w-32 h-4 rounded-full bg-gradient-to-r from-[rgb(34,197,94)] via-[rgb(245,200,66)] via-[rgb(251,191,36)] via-[rgb(249,115,22)] to-[rgb(239,68,68)]" />
              <div className="flex justify-between text-[10px] text-gray-600 font-medium">
                <span>
                  $
                  {Math.min(
                    ...Object.values(townData).map((s) => s.avgPrice / 1000)
                  ).toFixed(0)}
                  k
                </span>
                <span>
                  $
                  {Math.max(
                    ...Object.values(townData).map((s) => s.avgPrice / 1000)
                  ).toFixed(0)}
                  k
                </span>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-gray-500 mt-2 italic">
            Area shading = avg property price
          </p>
        </div>
      )}

      <div
        ref={hoverInfoRef}
        className="absolute top-4 right-4 w-80 bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-200 p-5 z-[1000]"
        style={{ display: "none" }}
      />

      {loading && (
        <div className="rounded-xl absolute inset-0 flex flex-col items-center justify-center z-[1000] bg-gradient-to-b from-blue-50 to-white/90 backdrop-blur-sm animate-in fade-in duration-300">
          <Card className="flex flex-col items-center gap-3 px-6 py-5 shadow-md border border-blue-100 bg-white/90 rounded-2xl">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            <p className="text-sm text-gray-700 font-medium tracking-wide">
              {loadingMessage}
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}
