import axios from "axios";
import { Category } from "./types.js";
import pAll from "p-all";
import { db } from "../db.js";
import { NewProduct } from "../type.js";
import { checkNewProducts, checkPrices } from "../common.js";

const API = "https://www.carrefour.es/cloud-api/plp-food-papi/v1";
const COMPANY = "carrefour";

const CATEGORIES = [
  "/supermercado/productos-frescos/cat20002",
  "/supermercado/la-despensa/cat20001",
  "/supermercado/bebidas/cat20003",
  "/supermercado/limpieza-y-hogar/cat20005",
  "/supermercado/perfumeria-e-higiene/cat20004",
  "/supermercado/bebe/cat20006",
  "/supermercado/mascotas/cat20007",
  "/supermercado/parafarmacia/cat20008",
];

export async function carrefour() {
  const products = await fetchAllProducts();
  await checkNewProducts(COMPANY, products);
  await checkPrices(COMPANY, products);
}

async function fetchAllProducts(): Promise<NewProduct[]> {
  const allProducts = await pAll(
    CATEGORIES.map((category) => {
      return () => fetchCategories(category);
    }),
    { concurrency: 3 }
  );
  const products = allProducts.flat();
  console.log(`Fetch ${products.length} products.`);
  return products;
}

async function fetchCategories(categoryId: string): Promise<NewProduct[]> {
  const { data } = await axios.get<Category>(`${API}${categoryId}/c`);
  const allProducts = data.child_links.items
    .filter((item) => {
      return item.id !== "catofertas";
    })
    .map((item) => {
      return () => fetchCategory(item.url);
    });
  const result = await pAll(allProducts, { concurrency: 6 });
  const products = result.flat();
  console.log(`Fetch ${products.length} products from "${categoryId}".`);
  return products;
}

async function fetchCategory(categoryId: string): Promise<NewProduct[]> {
  const { data } = await axios.get<Category>(`${API}${categoryId}`);
  const totalProducts = data.results.pagination.total_results;
  const offsets = Array.from(Array(Math.ceil(totalProducts / 24)).keys());
  const allProducts = offsets.map((offset) => {
    return () => fetchProducts(categoryId, offset * 24);
  });
  const result = await pAll(allProducts, { concurrency: 6 });
  const products = result.flat();
  console.log(`Fetch ${products.length} products from "${categoryId}".`);
  return products;
}

async function fetchProducts(categoryId: string, offset: number): Promise<NewProduct[]> {
  const { data } = await axios.get<Category>(`${API}${categoryId}?offset=${offset}`);
  if (!data.results) {
    return [];
  }
  return data.results.items
    .filter((product) => {
      // Wrong data
      return product.name;
    })
    .map((product) => {
      return {
        companyId: product.product_id,
        company: COMPANY,
        name: product.name,
        bulkPrice: parseFloat(product.price_per_unit.replace(" €", "")),
        price: parseFloat(product.price.replace(" €", "")),
        iva: 0,
      };
    });
}
