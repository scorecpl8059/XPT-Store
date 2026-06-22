export interface ShippingRate {
  minWeight: number;
  maxWeight: number;
  price: number;
}

export interface ShippingZone {
  zoneId: string;
  name: string;
  states: string[];
  rates: ShippingRate[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateShippingZoneInput {
  name: string;
  states: string[];
  rates: ShippingRate[];
}
