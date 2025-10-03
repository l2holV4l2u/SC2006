import { BedDouble, Bath, Ruler, Calendar, Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Property } from "./mockData";
import { MapView } from "./mapView";

export function PropertyDetail({ curProp }: { curProp: Property }) {
  const ICON_SIZE = 32;
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Property Details Card */}
      <Card>
        <h2 className="text-lg font-semibold flex items-center">
          <Info className="h-5 w-5 mr-2 text-primary" /> Details
        </h2>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-2 text-gray-900">
          <div className="flex flex-col items-center gap-0.5">
            <BedDouble className="mb-1 text-primary" size={ICON_SIZE} />
            <div className="text-lg font-bold">{curProp.bedrooms}</div>
            <div className="text-gray-600">Beds</div>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <Bath className="mb-1 text-primary" size={ICON_SIZE} />
            <div className="text-lg font-bold">{curProp.bathrooms}</div>
            <div className="text-gray-600">Baths</div>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <Ruler className="mb-1 text-primary" size={ICON_SIZE} />
            <div className="text-lg font-bold">
              {curProp.sqft.toLocaleString()}
            </div>
            <div className="text-gray-600">Sqft</div>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <Calendar className="mb-1 text-primary" size={ICON_SIZE} />
            <div className="text-lg font-bold">1984</div>
            <div className="text-gray-600">Year Built</div>
          </div>
        </div>
        {/* Description */}
        <p className="text-gray-700 text-sm mb-3">
          Classic 1938 home in the coveted Hope Valley neighborhood, fully
          modernized for contemporary living. Enjoy expansive landscaped
          grounds, elegant hardscaping, a serene fountain, and a private patio
          perfect for entertaining. The interiors feature high ceilings,
          abundant natural light, and a seamless blend of vintage charm and
          modern amenities.
        </p>
        {/* Additional Mock Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-700 text-sm">
          <div>
            <span className="font-semibold">Garage:</span> 2 Car Spaces
          </div>
          <div>
            <span className="font-semibold">Lot Size:</span> 7,500 sqft
          </div>
          <div>
            <span className="font-semibold">Heating:</span> Central Heating
          </div>
          <div>
            <span className="font-semibold">Cooling:</span> Central Air
          </div>
          <div>
            <span className="font-semibold">HOA Fees:</span> $250/month
          </div>
          <div>
            <span className="font-semibold">Nearby Schools:</span> Hope Valley
            Elementary, Valley High School
          </div>
        </div>
      </Card>

      {/* Stat Bar for HDB Buyer Insights */}
      <MapView curProp={curProp} />
    </div>
  );
}
