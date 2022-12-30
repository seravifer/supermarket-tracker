import { Product } from "@prisma/client";

export type NewProduct = Omit<Product, "id" | "createdAt" | "updatedAt">;
