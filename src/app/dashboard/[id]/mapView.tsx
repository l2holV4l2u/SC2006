import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Map } from "lucide-react";
import { Property } from "./mockData";

interface MapViewProps {
  currentProperty: Property;
  similarProperties: Property[];
}

export function MapView({ currentProperty, similarProperties }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current) {
      const map = L.map(mapRef.current).setView(
        [currentProperty.lat!, currentProperty.lng!],
        14
      );
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>',
      }).addTo(map);

      // Current property marker
      L.marker([currentProperty.lat!, currentProperty.lng!])
        .addTo(map)
        .bindPopup("Current Property");

      // Similar properties
      similarProperties.forEach((p) => {
        if (p.lat && p.lng) {
          L.marker([p.lat, p.lng]).addTo(map).bindPopup(p.address);
        }
      });

      mapInstanceRef.current = map;
    }
  }, [currentProperty, similarProperties]);

  return (
    <>
      <h2 className="text-lg font-semibold mb-4 flex items-center">
        <Map className="h-5 w-5 mr-2" /> Property Locations
      </h2>
      <div ref={mapRef} className="w-full h-96 rounded-lg"></div>
    </>
  );
}
