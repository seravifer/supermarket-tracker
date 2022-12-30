import { v4 as uuid } from "uuid";
import { uniqBy } from "lodash-es";
import { db } from "./db.js";
import { NewProduct } from "./type.js";

export async function checkNewProducts(company: string, products: NewProduct[]): Promise<void> {
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
      };
    }),
  });
  console.log(`Added ${newProducts.length} new products.`);
}

export async function checkPrices(company: string, products: NewProduct[]): Promise<void> {
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
