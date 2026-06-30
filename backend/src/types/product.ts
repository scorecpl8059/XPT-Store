export interface VariantType {
  name: string; // e.g., "Color", "Size"
  values: string[]; // e.g., ["Red", "Blue"]
}

export interface Product {
  productId: string;
  name: string;
  slug: string;
  description: string; // Rich text HTML
  categoryId: string;
  basePrice: number;
  weight: number; // in lbs
  dimensions?: { length: number; width: number; height: number };
  images: string[]; // S3 URLs
  status: "active" | "draft" | "archived";
  hasVariants: boolean;
  variantTypes?: VariantType[];
  relatedProductIds: string[];
  seoTitle?: string;
  seoDescription?: string;
  averageRating: number;
  reviewCount: number;
  stock: number;
  totalSold: number;
  createdAt: string;
  updatedAt: string;
}

export interface Variant {
  productId: string;
  variantId: string;
  sku: string;
  attributes: Record<string, string>; // e.g., { color: "Red", size: "M" }
  price: number;
  stock: number;
  reservedStock: number;
  weight: number;
  image?: string;
  status: "active" | "inactive";
}

export interface CreateProductInput {
  name: string;
  slug?: string;
  description: string;
  categoryId: string;
  basePrice: number;
  weight: number;
  dimensions?: { length: number; width: number; height: number };
  images?: string[];
  status?: "active" | "draft" | "archived";
  hasVariants?: boolean;
  variantTypes?: VariantType[];
  relatedProductIds?: string[];
  stock?: number;
  seoTitle?: string;
  seoDescription?: string;
}

export interface CreateVariantInput {
  sku: string;
  attributes: Record<string, string>;
  price: number;
  stock: number;
  weight: number;
  image?: string;
}
