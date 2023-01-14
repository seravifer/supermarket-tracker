import { Product } from "@prisma/client";

export type FetchProduct = Omit<Product, "id" | "createdAt" | "updatedAt"> & {
  raw: any | null;
};
