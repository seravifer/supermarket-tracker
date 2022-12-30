import axios from "axios";
import { Products } from "./types.js";
import { v4 as uuid } from "uuid";
import { uniqBy } from "lodash-es";
import { db } from "../db.js";
import { NewProduct } from "../type.js";
import pAll from "p-all";

const CONSUM_API = "https://tienda.consum.es/api/rest/V1.0";

async function main() {
  const products = await fetchAllProducts();
  await checkNewProducts(products);
  await checkPrices(products);
}

async function fetchAllProducts(): Promise<NewProduct[]> {
  const { data } = await axios.get<Products>(
    `${CONSUM_API}/catalog/product?limit=100&offset=0&showRecommendations=false`
  );
  const totalProducts = data.totalCount;
  const offsets = Array.from(Array(Math.ceil(totalProducts / 100)).keys());
  const allProducts = offsets.map((offset) => {
    return () => fetchProducts(offset * 100);
  });
  const result = await pAll(allProducts, { concurrency: 10 });
  const products = result.flat() as NewProduct[];
  console.log(`Fetch ${products.length} products.`);
  return products;
}

async function fetchProducts(offset: number): Promise<NewProduct[]> {
  const { data } = await axios.get<Products>(
    `${CONSUM_API}/catalog/product?limit=100&offset=${offset}&showRecommendations=false`
  );
  return data.products.map((product) => {
    return {
      companyId: String(product.id),
      company: "consum",
      name: product.productData.brand.name + " " + product.productData.name,
      bulkPrice: product.priceData.prices[0].value.centAmount,
      price: product.priceData.prices[0].value.centUnitAmount,
      iva: product.priceData.taxPercentage,
    };
  });
}

async function checkNewProducts(products: NewProduct[]): Promise<void> {
  const allProducts = await db.product.findMany({ where: { company: "consum" } });
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

async function checkPrices(products: NewProduct[]): Promise<void> {
  const allProducts = await db.product.findMany({ where: { company: "consum" } });
  const productsToUpdate = products
    .filter((product) => {
      const dbProduct = allProducts.find((dbProduct) => dbProduct.companyId === product.companyId);
      if (!dbProduct) return false;
      return (
        dbProduct.price !== product.price || dbProduct.bulkPrice !== product.bulkPrice || dbProduct.iva !== product.iva
      );
    })
    .map((product) => {
      const dbProduct = allProducts.find((dbProduct) => dbProduct.companyId === product.companyId);
      return {
        ...product,
        id: dbProduct!.id,
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

export const consum = () =>
  main()
    .then(async () => {
      await db.$disconnect();
    })
    .catch(async (e) => {
      console.error(e);
      await db.$disconnect();
      process.exit(1);
    });
