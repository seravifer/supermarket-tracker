export interface Category {
  results: Results;
  child_links: ChildLinks;
}

export interface Results {
  items: Item[];
  pagination: Pagination;
  sort_options: SortOption[];
  total_results: number;
}

export interface Item {
  app_price: string;
  app_price_per_unit: string;
  catalog: Catalog;
  document_type: Catalog;
  images: Images;
  measure_unit: MeasureUnit;
  name: string;
  price: string;
  price_per_unit: string;
  product_id: string;
  sell_pack_unit: number;
  sku_id: string;
  units_in_stock: number;
  url: string;
  app_strikethrough_price?: string;
  app_strikethrough_price_per_unit?: string;
  strikethrough_price?: string;
  strikethrough_price_per_unit?: string;
}

export enum Catalog {
  Food = "food",
}

export interface Images {
  desktop: string;
  mobile: string;
}

export enum MeasureUnit {
  L = "l",
}

export interface Pagination {
  offset: number;
  page_size: number;
  total_results: number;
}

export interface SortOption {
  selected?: boolean;
  text: string;
  url: string;
}

export interface ChildLinks {
  items: Item[];
}

export interface Item {
  display_name: string;
  id: string;
  image_url: string;
  url: string;
}
