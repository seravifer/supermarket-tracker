import { http } from "../http.js";
import { Categories, Category } from "./types.js";
import pSeries from "p-series";
import { FetchProduct } from "../type.js";
import randUserAgent from "rand-user-agent";
import { checkNewProducts, checkPrices } from "../common.js";

const API = "https://tienda.mercadona.es/api";
const COMPANY = "mercadona";

export async function mercadona() {
  console.log("Start mercadona bot");
  const products = await fetchAllProducts();
  await checkNewProducts(COMPANY, products);
  await checkPrices(COMPANY, products);
}

async function fetchAllProducts(): Promise<FetchProduct[]> {
  const { data } = await http.get<Categories>(`${API}/categories/?lang=es`);
  const categories = data.results
    .flatMap((category) => {
      return category.categories;
    })
    .map((category) => {
      return () => fetchProducts(category.id);
    });
  const result = await pSeries(categories);
  const products = result.flat();
  console.log(`Fetch ${products.length} products.`);
  return products;
}

async function fetchProducts(categoryId: number): Promise<FetchProduct[]> {
  await wait(500);
  const { data } = await http.get<Category>(`${API}/categories/${categoryId}/?lang=es`, {
    headers: { "User-Agent": randUserAgent("desktop") },
  });
  const rawProducts = data.categories.flatMap((category) => {
    return category.products;
  });
  return rawProducts.map((product) => {
    return {
      companyId: product.id,
      company: COMPANY,
      name: product.display_name,
      bulkPrice: parseFloat(product.price_instructions.bulk_price),
      price: parseFloat(product.price_instructions.unit_price),
      iva: product.price_instructions.iva,
      raw: product as any,
    };
  });
}

const wait = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
