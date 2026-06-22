export interface Category {
  categoryId: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  image?: string;
  sortOrder: number;
  status: "active" | "inactive";
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryInput {
  name: string;
  slug?: string;
  description?: string;
  parentId?: string;
  image?: string;
  sortOrder?: number;
  status?: "active" | "inactive";
}
