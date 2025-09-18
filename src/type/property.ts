export type Property = {
  id: number;
  title: string;
  imageUrl: string;
  town: string;
  flatType: string;
  price: number;
  size: number;
  bedrooms: number;
  bathrooms: number;
  carpark?: boolean;
  floor: string;
  builtYear: number;
  views: number;
  agent: {
    name: string;
    phone: string;
    avatar: string;
  };
};
