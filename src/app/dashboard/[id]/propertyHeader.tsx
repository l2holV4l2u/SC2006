"use client";

import Image from "next/image";
import { MapPin } from "lucide-react";
import { Property } from "./mockData";

export function PropertyHeader({ curProp }: { curProp: Property }) {
  return (
    <>
      {/* Header */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {curProp.address}
          </h1>
          <div className="flex items-center text-gray-600 text-sm">
            <MapPin className="h-4 w-4 mr-2" />
            <span>Durham, NC 27707 • 23 days on market</span>
          </div>
        </div>

        <div className="flex flex-col items-start md:items-end justify-center mt-4 md:mt-0">
          <div className="text-3xl font-bold text-gray-900">
            ${curProp.price.toLocaleString()}
          </div>
          <div className="text-sm text-gray-500">Est. Mortgage $2,345/mo</div>
        </div>
      </div>

      {/* Property Image */}
      <div className="grid grid-cols-3 grid-rows-2 gap-4">
        {/* Left big image */}
        <div className="col-span-2 row-span-2">
          <Image
            src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c"
            alt="Property 2"
            width={400}
            height={290}
            className="object-cover w-full h-full rounded-2xl"
            unoptimized
          />
        </div>

        {/* Top right image */}
        <div className="row-span-1">
          <Image
            src="https://images.unsplash.com/photo-1599423300746-b62533397364"
            alt="Property 1"
            width={800}
            height={600}
            className="object-cover w-full h-full rounded-2xl"
            unoptimized
          />
        </div>

        {/* Bottom right image */}
        <div className="row-span-1">
          <Image
            src="https://images.unsplash.com/photo-1572120360610-d971b9d7767c"
            alt="Property 3"
            width={400}
            height={290}
            className="object-cover w-full h-full rounded-2xl"
            unoptimized
          />
        </div>
      </div>
    </>
  );
}
