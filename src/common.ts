import { v4 as uuid } from "uuid";
import { chunk, uniqBy } from "lodash-es";
import { db } from "./db.js";
import { FetchProduct } from "./type.js";

export async function checkNewProducts(company: string, products: FetchProduct[]): Promise<void> {
  const allProducts = await db.product.findMany({ where: { company } });
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
        raw: product.raw,
      };
    }),
  });
  console.log(`Added ${newProducts.length} new products.`);
}

export async function checkPrices(company: string, products: FetchProduct[]): Promise<void> {
  const allProducts = await db.product.findMany({ where: { company } });
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
  const chunks = chunk(productsToUpdate, 500);
  for (const chunk of chunks) {
    await db.$transaction([
      ...chunk.map((product) => {
        return db.product.update({
          where: { id: product.id },
          data: {
            price: product.price,
            bulkPrice: product.bulkPrice,
            iva: product.iva,
            raw: product.raw,
          },
        });
      }),
      db.history.createMany({
        data: chunk.map((product) => {
          return {
            productId: product.id,
            price: product.price,
            bulkPrice: product.bulkPrice,
            iva: product.iva,
            raw: product.raw,
          };
        }),
      }),
    ]);
    console.log(`Updated chunk ${chunk.length} products.`);
  }
  console.log(`Updated ${productsToUpdate.length} products.`);
}
