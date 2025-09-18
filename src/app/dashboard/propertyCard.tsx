import { Card, CardContent } from "@/components/ui/card";
import { Property } from "@/type/property";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bed, Car, Eye, Heart, MapPin, Phone, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAtom } from "jotai";
import { favAtom } from "@/lib/propertyAtom";
import Link from "next/link";

export function PropertyCard({ prop }: { prop: Property }) {
  const [fav, setFav] = useAtom(favAtom);

  const toggleFavorite = (id: number) => {
    const newFav = new Set(fav);
    if (newFav.has(id)) {
      newFav.delete(id);
    } else {
      newFav.add(id);
    }
    setFav(newFav);
  };

  return (
    <Link href={`/dashboard/${prop.id}`}>
      <Card
        key={prop.id}
        className="group hover:shadow-xl transition-all duration-300 overflow-hidden border-0 shadow-md py-0"
      >
        <div className="relative">
          <div className="relative h-48 overflow-hidden">
            <img
              src={prop.imageUrl}
              alt={prop.title}
              className="w-full h-full group-hover:scale-110 transition-transform duration-300"
            />

            {/* Overlay badges */}
            <div className="absolute top-3 left-3">
              <Badge className="bg-gradient-to-br from-primary-400 to-primary-600 text-xs font-medium">
                {prop.flatType}
              </Badge>
            </div>

            <div className="absolute top-3 right-3 flex space-x-2">
              <Button
                size="sm"
                variant="ghost"
                className={`p-1.5 rounded-full ${
                  fav.has(prop.id)
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : "text-white hover:backdrop-blur-sm bg-white/40 backdrop-blur-lg border border-white/30"
                }`}
                onClick={() => toggleFavorite(prop.id)}
              >
                <Heart
                  className={`h-4 w-4 ${
                    fav.has(prop.id) ? "fill-current" : ""
                  }`}
                />
              </Button>
            </div>

            {/* Price overlay */}
            <div className="absolute bottom-3 left-3">
              <Badge className="bg-black/80 text-white text-sm font-semibold px-3 py-1">
                ${prop.price.toLocaleString()}
              </Badge>
            </div>
          </div>

          <CardContent className="p-4 space-y-3">
            <div>
              <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-2">
                {prop.title}
              </h3>
              <div className="flex items-center text-gray-500 text-xs mb-3">
                <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                <span className="truncate">{prop.town}</span>
              </div>
            </div>

            {/* Property specs */}
            <div className="flex items-center justify-between text-xs text-gray-600 py-2 bg-gray-50 rounded-md px-3">
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <Bed className="mr-1" size={12} />
                  <span>{prop.bedrooms}</span>
                </div>
                <div className="flex items-center">
                  <Square className="mr-1" size={12} />
                  <span>{prop.size}m²</span>
                </div>
                {prop.carpark && (
                  <div className="flex items-center">
                    <Car className="mr-1" size={12} />
                    <span>P</span>
                  </div>
                )}
              </div>
              <Badge variant="outline" className="text-xs">
                Floor {prop.floor}
              </Badge>
            </div>

            <Separator />

            {/* Agent info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={prop.agent.avatar} alt={prop.agent.name} />
                  <AvatarFallback className="text-xs">
                    {prop.agent.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-xs font-medium text-gray-900">
                    {prop.agent.name}
                  </div>
                  <div className="text-xs text-gray-500">Agent</div>
                </div>
              </div>
            </div>
          </CardContent>
        </div>
      </Card>
    </Link>
  );
}
