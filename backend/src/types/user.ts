export interface User {
  userId: string;
  email: string;
  name: string;
  passwordHash?: string;
  role: "customer" | "admin";
  accountType: "individual" | "business";
  companyName?: string;
  taxId?: string;
  phone?: string;
  avatar?: string;
  authProvider: "email" | "google" | "apple";
  googleId?: string;
  appleId?: string;
  totpSecret?: string; // 2FA secret (admin only)
  totpEnabled: boolean;
  preferredLanguage: "en" | "zh-CN";
  status: "active" | "suspended";
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  userId: string;
  addressId: string;
  label?: string;
  recipientName: string;
  phone: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

export interface CreateUserInput {
  email: string;
  name: string;
  password?: string;
  accountType?: "individual" | "business";
  companyName?: string;
  taxId?: string;
  phone?: string;
  authProvider?: "email" | "google" | "apple";
  googleId?: string;
  appleId?: string;
}

export interface CreateAddressInput {
  label?: string;
  recipientName: string;
  phone: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
  isDefault?: boolean;
}
