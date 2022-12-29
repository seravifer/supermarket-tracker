import axios from "axios";

async function main() {
  const response = await axios.get("https://tienda.mercadona.es/api/categories/?lang=es&wh=vlc1");
  // console.log(response.data);
  await getProducts(response.data.results[0].id);
}

async function getProducts(categoryId: string) {
  const response = await axios.get(`https://tienda.mercadona.es/api/categories/${categoryId}/?lang=es&wh=vlc1`);
  const map = response.data.categories.flatMap((category: any) => {
    return category.products;
  });
  console.log(map);
}

main();
