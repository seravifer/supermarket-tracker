import axios from "axios";
import { PrismaClient, Product } from "@prisma/client";
import { Categories, Category } from "./types";
import { v4 as uuid } from "uuid";
import pAll from "p-all";

const prisma = new PrismaClient();

async function main() {
  const products = await fetchAllProducts();
  await checkNewProducts(products);
  await checkPrices(products);
}

async function fetchAllProducts() {
  const categories = await axios.get<Categories>("https://tienda.mercadona.es/api/categories/?lang=es");
  const allCategories = categories.data.results.map((category) => {
    return () => fetchProducts(category.id);
  });
  const result = await pAll(allCategories, { concurrency: 6 });
  const products = result.flat() as Product[];
  console.log(`Fetch ${products.length} products.`);
  return products;
}

async function fetchProducts(categoryId: number) {
  const response = await axios.get<Category>(`https://tienda.mercadona.es/api/categories/${categoryId}/?lang=es`);
  const rawProducts = response.data.categories.flatMap((category) => {
    return category.products;
  });
  return rawProducts.map((product) => {
    return {
      companyId: product.id,
      name: product.display_name,
      bulkPrice: parseFloat(product.price_instructions.bulk_price),
      price: parseFloat(product.price_instructions.unit_price),
      iva: product.price_instructions.iva,
    };
  });
}

async function checkNewProducts(products: Product[]) {
  const allProducts = await prisma.product.findMany();
  const newProducts = products
    .filter((product) => {
      return !allProducts.find((dbProduct) => dbProduct.companyId === product.companyId);
    })
    .map((product) => {
      return {
        ...product,
        id: uuid(),
      };
    });
  await prisma.product.createMany({ data: newProducts });
  await prisma.history.createMany({
    data: newProducts.map((product) => {
      return {
        productId: product.id,
        price: product.price,
        bulkPrice: product.bulkPrice,
        iva: product.iva,
      };
    }),
  });
  console.log(`Added ${newProducts.length} new products.`);
}

async function checkPrices(products: Product[]) {
  const allProducts = await prisma.product.findMany();
  const productsToUpdate = products
    .filter((product) => {
      const dbProduct = allProducts.find((dbProduct) => dbProduct.companyId === product.companyId);
      if (!dbProduct) {
        return false;
      }
      return (
        dbProduct.price !== product.price || dbProduct.bulkPrice !== product.bulkPrice || dbProduct.iva !== product.iva
      );
    })
    .map((product) => {
      const dbProduct = allProducts.find((dbProduct) => dbProduct.companyId === product.companyId);
      if (!dbProduct) {
        return product;
      }
      return {
        ...product,
        id: dbProduct.id,
      };
    });
  console.log(`Found ${productsToUpdate.length} products to update.`);
  await prisma.$transaction(
    productsToUpdate.map((product) => {
      return prisma.product.update({
        where: { id: product.id },
        data: {
          price: product.price,
          bulkPrice: product.bulkPrice,
          iva: product.iva,
        },
      });
    })
  );
  await prisma.history.createMany({
    data: productsToUpdate.map((product) => {
      return {
        productId: product.id,
        price: product.price,
        bulkPrice: product.bulkPrice,
        iva: product.iva,
      };
    }),
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
