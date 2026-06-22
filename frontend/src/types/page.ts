export interface Page {
  pageId: string;
  title: string;
  slug: string;
  content: string; // Rich text HTML
  type: "legal" | "faq" | "custom";
  sortOrder: number;
  status: "published" | "draft";
  seoTitle?: string;
  seoDescription?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePageInput {
  title: string;
  slug?: string;
  content: string;
  type: "legal" | "faq" | "custom";
  sortOrder?: number;
  status?: "published" | "draft";
  seoTitle?: string;
  seoDescription?: string;
}
