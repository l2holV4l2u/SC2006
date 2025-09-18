import React from "react";
import { DollarSign } from "lucide-react";
import { Property } from "./mockData";

interface StatsSidebarProps {
  currentProperty: Property;
  avgPrice: number;
  similarProperties: Property[];
}

export function StatsSidebar({
  currentProperty,
  avgPrice,
  similarProperties,
}: StatsSidebarProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <DollarSign className="h-5 w-5 mr-2 text-green-600" /> Market
          Statistics
        </h3>
        <div className="space-y-4">
          <div>
            <div className="text-sm text-gray-600">Average Price</div>
            <div className="text-xl font-bold">
              ${avgPrice.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Price per Sqft</div>
            <div className="text-xl font-bold">
              ${(currentProperty.price / currentProperty.sqft).toFixed(0)}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Similar Properties</div>
            <div className="text-xl font-bold">{similarProperties.length}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
