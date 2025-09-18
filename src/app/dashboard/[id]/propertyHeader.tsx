import React from "react";
import { MapPin, TrendingUp, TrendingDown, Home, Calendar } from "lucide-react";
import { Property } from "./mockData";

interface PropertyHeaderProps {
  currentProperty: Property;
  priceVsMarket: string;
}

export function PropertyHeader({
  currentProperty,
  priceVsMarket,
}: PropertyHeaderProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Price Analysis
          </h1>
          <div className="flex items-center text-gray-600 mb-2">
            <MapPin className="h-4 w-4 mr-2" />
            <span>{currentProperty.address}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold">
            ${currentProperty.price.toLocaleString()}
          </div>
          <div
            className={`flex items-center text-sm ${
              Number(priceVsMarket) > 0 ? "text-red-600" : "text-green-600"
            }`}
          >
            {Number(priceVsMarket) > 0 ? (
              <TrendingUp className="h-4 w-4 mr-1" />
            ) : (
              <TrendingDown className="h-4 w-4 mr-1" />
            )}
            {Math.abs(Number(priceVsMarket))}% vs market avg
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 text-sm">
        <div className="flex items-center">
          <Home className="h-4 w-4 mr-2 text-gray-400" />
          <span>
            {currentProperty.bedrooms} bed, {currentProperty.bathrooms} bath
          </span>
        </div>
        <div>
          <span className="font-medium">
            {currentProperty.sqft.toLocaleString()} sqft
          </span>
        </div>
        <div>
          <span className="font-medium">{currentProperty.type}</span>
        </div>
        <div className="flex items-center">
          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
          <span>Listed {currentProperty.listingDate}</span>
        </div>
      </div>
    </div>
  );
}
