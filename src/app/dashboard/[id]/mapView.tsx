import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Map } from "lucide-react";
import { Property } from "./mockData";
import { Card } from "@/components/ui/card";

export function MapView({ curProp }: { curProp: Property }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current) {
      const map = L.map(mapRef.current, {
        zoomControl: false, // remove default zoom controls for cleaner look
        scrollWheelZoom: true,
      }).setView([curProp.lat!, curProp.lng!], 15);

      // Modern tile layer (Carto Voyager) for clean aesthetic
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 20,
        }
      ).addTo(map);

      // Current property marker with custom icon
      const markerIcon = L.divIcon({
        html: `<div style="background-color:#2563EB;width:16px;height:16px;border-radius:50%;border:2px solid white;"></div>`,
        className: "",
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

      L.marker([curProp.lat!, curProp.lng!], { icon: markerIcon })
        .addTo(map)
        .bindPopup("<b>Current Property</b>");

      mapInstanceRef.current = map;
    }
  }, [curProp]);

  return (
    <Card>
      <h2 className="text-lg font-semibold flex items-center">
        <Map className="h-5 w-5 mr-2 text-primary" /> Location
      </h2>
      <div
        ref={mapRef}
        className="w-full h-96 rounded-xl shadow-md border border-gray-200"
      ></div>
    </Card>
  );
}
