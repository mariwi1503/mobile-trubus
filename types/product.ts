export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  bg: string;
}

export interface Product {
  id: string;
  slug: string;
  code: string;
  name: string;
  description: string;
  price: number;
  uom: string;
  image: string;
  thumbnailImage: string;
  originalImage: string;
  sold: number;
  rating: number;
  stock: number;
  category: string;
  categoryId: string;
  categorySlug: string;
  weight: number;
  store: string;
  createdAt?: string;
  updatedAt?: string;
}
