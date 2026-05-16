export interface Store {
  id: string;
  name: string;
  address: string;
  city: string;
  province: string;
  district: string;
  subDistrict: string;
  postalCode: string;
  latitude?: number;
  longitude?: number;
  isOnlineOrderSupported: boolean;
  createdAt: string;
  updatedAt: string;
}
