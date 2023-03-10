import { http } from "../http.js";
import { Products } from "./types.js";
import { FetchProduct } from "../type.js";
import pAll from "p-all";
import { checkNewProducts, checkPrices } from "../common.js";

const API = "https://tienda.consum.es/api/rest/V1.0";
const COMPANY = "consum";

export async function consum() {
  console.log("Start consum bot");
  const products = await fetchAllProducts();
  await checkNewProducts(COMPANY, products);
  await checkPrices(COMPANY, products);
}

async function fetchAllProducts(): Promise<FetchProduct[]> {
  const { data } = await http.get<Products>(`${API}/catalog/product?limit=100&offset=0&showRecommendations=false`);
  const totalProducts = data.totalCount;
  const offsets = Array.from(Array(Math.ceil(totalProducts / 100)).keys());
  const allProducts = offsets.map((offset) => {
    return () => fetchProducts(offset * 100);
  });
  const result = await pAll(allProducts, { concurrency: 10 });
  const products = result.flat() as FetchProduct[];
  console.log(`Fetch ${products.length} products.`);
  return products;
}

async function fetchProducts(offset: number): Promise<FetchProduct[]> {
  const { data } = await http.get<Products>(
    `${API}/catalog/product?limit=100&offset=${offset}&showRecommendations=false`
  );
  return data.products.map((product) => {
    return {
      companyId: String(product.id),
      company: COMPANY,
      name: product.productData.brand.name + " " + product.productData.name,
      bulkPrice: product.priceData.prices[0].value.centAmount,
      price: product.priceData.prices[0].value.centUnitAmount,
      iva: product.priceData.taxPercentage,
      raw: product as any,
    };
  });
}
