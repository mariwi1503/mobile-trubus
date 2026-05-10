import type { CartItem } from '../context/AppContext';

export interface PackagingProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  weight: number;
  store: string;
  description: string;
}

export const PACKAGING_PRODUCTS: PackagingProduct[] = [
  {
    id: 'pkg_wood_crate',
    name: 'Packaging Kayu',
    price: 35000,
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=300&h=300&fit=crop',
    weight: 1200,
    store: 'Gudang Packaging Trubus',
    description: 'Packing kayu untuk produk rentan benturan selama pengiriman.',
  },
  {
    id: 'pkg_extra_wrapper',
    name: 'Extra Wrapper',
    price: 12000,
    image: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?w=300&h=300&fit=crop',
    weight: 250,
    store: 'Gudang Packaging Trubus',
    description: 'Tambahan bubble wrap dan pelindung lapis ganda untuk produk sensitif.',
  },
];

export const PRODUCT_PACKAGING_RULES: Record<string, string> = {
  p2: 'pkg_wood_crate',
  p4: 'pkg_wood_crate',
  p11: 'pkg_wood_crate',
  p8: 'pkg_extra_wrapper',
  p15: 'pkg_extra_wrapper',
};

export const getPackagingProductById = (packagingId: string) =>
  PACKAGING_PRODUCTS.find((item) => item.id === packagingId);

export const getRequiredPackagingByProductId = (productId: string) => {
  const packagingId = PRODUCT_PACKAGING_RULES[productId];
  return packagingId ? getPackagingProductById(packagingId) : undefined;
};

export const isPackagingProduct = (productId: string) =>
  PACKAGING_PRODUCTS.some((item) => item.id === productId);

export const getMissingPackagingForCart = (_cart: CartItem[]) => [];
