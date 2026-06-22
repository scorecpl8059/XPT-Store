"use client";

import React from "react";
import { ProductForm } from "@/components/admin/ProductForm";

export default function NewProductPage() {
  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-ws-text">New Product</h1>
        <p className="text-sm text-ws-text-secondary mt-0.5">
          Add a new product to your catalog
        </p>
      </div>
      <ProductForm />
    </div>
  );
}
