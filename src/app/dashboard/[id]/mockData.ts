export interface Property {
  id: string | number;
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  type: string;
  listingDate: string;
  lat?: number;
  lng?: number;
}

export interface PriceHistoryData {
  month: string;
  currentProperty: number;
  marketAverage: number;
}

export interface MockData {
  currentProperty: Property;
  similarProperties: Property[];
  priceHistory: PriceHistoryData[];
}

export const generateMockData = (propertyId: string): MockData => {
  const basePrice = 450000 + Math.random() * 200000;
  const currentProperty: Property = {
    id: propertyId,
    address: "123 Main Street, Downtown",
    price: basePrice,
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1200,
    type: "Condo",
    listingDate: "2024-01-15",
    lat: 40.7128,
    lng: -74.006,
  };

  const similarProperties: Property[] = Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    address: `${100 + i * 10} Street`,
    price: basePrice + (Math.random() - 0.5) * 150000,
    bedrooms: [2, 3, 4][Math.floor(Math.random() * 3)],
    bathrooms: [1, 2, 2.5, 3][Math.floor(Math.random() * 4)],
    sqft: 900 + Math.random() * 800,
    type: "Condo",
    listingDate: `2024-0${1 + Math.floor(Math.random() * 9)}-15`,
    lat: 40.7128 + (Math.random() - 0.5) * 0.02,
    lng: -74.006 + (Math.random() - 0.5) * 0.02,
  }));

  const priceHistory: PriceHistoryData[] = Array.from(
    { length: 12 },
    (_, i) => ({
      month: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ][i],
      currentProperty: basePrice + Math.sin(i * 0.5) * 20000,
      marketAverage: basePrice * 0.95 + Math.sin(i * 0.3) * 15000,
    })
  );

  return { currentProperty, similarProperties, priceHistory };
};
