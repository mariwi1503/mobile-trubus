export interface Address {
  id: string;
  label: string;
  recipient: string;
  phone: string;
  address: string;
  additional?: string;
  city: string;
  province: string;
  district: string;
  subDistrict: string;
  postalCode: string;
  isDefault: boolean;
  provinceRajaOngkirId?: number;
  cityRajaOngkirId?: number;
  districtRajaOngkirId?: number;
  subDistrictRajaOngkirId?: number;
}
