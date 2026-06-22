import { z } from "zod";

// -- Password policy --
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128)
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

// -- Users --
export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  password: passwordSchema.optional(),
  accountType: z.enum(["individual", "business"]).optional(),
  companyName: z.string().max(200).optional(),
  taxId: z.string().max(50).optional(),
  phone: z.string().max(20).optional(),
  authProvider: z.enum(["email", "google", "apple"]).optional(),
  googleId: z.string().optional(),
  appleId: z.string().optional(),
});

export { passwordSchema };

export const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().max(20).optional(),
  companyName: z.string().max(200).optional(),
  taxId: z.string().max(50).optional(),
  preferredLanguage: z.enum(["en", "zh-CN"]).optional(),
});

// -- Addresses --
export const createAddressSchema = z.object({
  label: z.string().max(50).optional(),
  recipientName: z.string().min(1).max(100),
  phone: z.string().min(1).max(20),
  street1: z.string().min(1).max(200),
  street2: z.string().max(200).optional(),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(50),
  zipCode: z.string().min(1).max(20),
  country: z.string().max(2).optional(),
  isDefault: z.boolean().optional(),
});

// -- Products --
export const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().max(200).optional(),
  description: z.string().min(1),
  categoryId: z.string().min(1),
  basePrice: z.number().positive(),
  weight: z.number().nonnegative(),
  dimensions: z
    .object({
      length: z.number().positive(),
      width: z.number().positive(),
      height: z.number().positive(),
    })
    .optional(),
  images: z.array(z.string().url()).optional(),
  status: z.enum(["active", "draft", "archived"]).optional(),
  hasVariants: z.boolean().optional(),
  variantTypes: z
    .array(
      z.object({
        name: z.string().min(1),
        values: z.array(z.string().min(1)),
      })
    )
    .optional(),
  relatedProductIds: z.array(z.string()).optional(),
  seoTitle: z.string().max(70).optional(),
  seoDescription: z.string().max(160).optional(),
});

export const createVariantSchema = z.object({
  sku: z.string().min(1).max(50),
  attributes: z.record(z.string(), z.string()),
  price: z.number().positive(),
  stock: z.number().int().nonnegative(),
  weight: z.number().nonnegative(),
  image: z.string().url().optional(),
});

// -- Categories --
export const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  parentId: z.string().optional(),
  image: z.string().url().optional(),
  sortOrder: z.number().int().optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

// -- Orders --
export const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        variantId: z.string().optional(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1),
  shippingAddressId: z.string().min(1),
  billingAddressId: z.string().optional(),
  poNumber: z.string().max(50).optional(),
  notes: z.string().max(500).optional(),
});

// -- Reviews --
export const createReviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  title: z.string().min(1).max(200),
  comment: z.string().min(1).max(2000),
  images: z.array(z.string().url()).max(5).optional(),
});

// -- Returns --
export const createReturnSchema = z.object({
  orderId: z.string().min(1),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        variantId: z.string().optional(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1),
  reason: z.string().min(1).max(1000),
  images: z.array(z.string().url()).max(5).optional(),
});

// -- RFQ --
export const createRfqSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        variantId: z.string().optional(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1),
  message: z.string().max(2000).optional(),
});

// -- Pages --
export const createPageSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().max(200).optional(),
  content: z.string().min(1),
  type: z.enum(["legal", "faq", "custom"]),
  sortOrder: z.number().int().optional(),
  status: z.enum(["published", "draft"]).optional(),
  seoTitle: z.string().max(70).optional(),
  seoDescription: z.string().max(160).optional(),
});

// -- Shipping Zones --
export const createShippingZoneSchema = z.object({
  name: z.string().min(1).max(100),
  states: z.array(z.string().min(1)).min(1),
  rates: z
    .array(
      z.object({
        minWeight: z.number().nonnegative(),
        maxWeight: z.number().positive(),
        price: z.number().nonnegative(),
      })
    )
    .min(1),
});

// -- Contact --
export const contactSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(5000),
});
