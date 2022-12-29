import axios from "axios";
import { Product } from "@prisma/client";
import { Categories, Category } from "./types";
import { v4 as uuid } from "uuid";
import pAll from "p-all";
import { uniqBy } from "lodash-es";
import { db } from "../db";

const MERCADONA_API = "https://tienda.mercadona.es/api";

async function main() {
  const products = await fetchAllProducts();
  await checkNewProducts(products);
  await checkPrices(products);
}

async function fetchAllProducts() {
  const categories = await axios.get<Categories>(`${MERCADONA_API}/categories/?lang=es`);
  const allCategories = categories.data.results.map((category) => {
    return () => fetchProducts(category.id);
  });
  const result = await pAll(allCategories, { concurrency: 6 });
  const products = result.flat() as Product[];
  console.log(`Fetch ${products.length} products.`);
  return products;
}

async function fetchProducts(categoryId: number) {
  const response = await axios.get<Category>(`${MERCADONA_API}/categories/${categoryId}/?lang=es`);
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
  const allProducts = await db.product.findMany();
  const newProducts = uniqBy(products, "companyId")
    .filter((product) => {
      return !allProducts.find((dbProduct) => dbProduct.companyId === product.companyId);
    })
    .map((product) => {
      return {
        ...product,
        id: uuid(),
      };
    });
  await db.product.createMany({ data: newProducts });
  await db.history.createMany({
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
  const allProducts = await db.product.findMany();
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
  await db.$transaction(
    productsToUpdate.map((product) => {
      return db.product.update({
        where: { id: product.id },
        data: {
          price: product.price,
          bulkPrice: product.bulkPrice,
          iva: product.iva,
        },
      });
    })
  );
  await db.history.createMany({
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
    await db.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
