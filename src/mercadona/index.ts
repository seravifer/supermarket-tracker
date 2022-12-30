import axios from "axios";
import { Categories, Category } from "./types.js";
import pAll from "p-all";
import { NewProduct } from "../type.js";
import { checkNewProducts, checkPrices } from "../common.js";

const API = "https://tienda.mercadona.es/api";
const COMPANY = "mercadona";

export async function mercadona() {
  const products = await fetchAllProducts();
  await checkNewProducts(COMPANY, products);
  await checkPrices(COMPANY, products);
}

async function fetchAllProducts(): Promise<NewProduct[]> {
  const categories = await axios.get<Categories>(`${API}/categories/?lang=es`);
  const allCategories = categories.data.results.map((category) => {
    return () => fetchProducts(category.id);
  });
  const result = await pAll(allCategories, { concurrency: 6 });
  const products = result.flat();
  console.log(`Fetch ${products.length} products.`);
  return products;
}

async function fetchProducts(categoryId: number): Promise<NewProduct[]> {
  const response = await axios.get<Category>(`${API}/categories/${categoryId}/?lang=es`);
  const rawProducts = response.data.categories.flatMap((category) => {
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
    };
  });
}
