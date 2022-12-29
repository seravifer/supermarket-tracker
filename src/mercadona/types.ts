export interface Badges {
  is_water: boolean;
  requires_age_check: boolean;
}

export interface Category2 {
  id: number;
  name: string;
  level: number;
  order: number;
}

export interface PriceInstructions {
  iva: number;
  is_new: boolean;
  is_pack: boolean;
  pack_size?: number;
  unit_name: string;
  unit_size: number;
  bulk_price: string;
  unit_price: string;
  approx_size: boolean;
  size_format: string;
  total_units?: number;
  unit_selector: boolean;
  bunch_selector: boolean;
  drained_weight?: any;
  selling_method: number;
  price_decreased: boolean;
  reference_price: string;
  min_bunch_amount: number;
  reference_format: string;
  increment_bunch_amount: number;
}

export interface Product {
  id: string;
  slug: string;
  limit: number;
  badges: Badges;
  packaging: string;
  published: boolean;
  share_url: string;
  thumbnail: string;
  categories: Category2[];
  display_name: string;
  price_instructions: PriceInstructions;
}

export interface SubCategory {
  id: number;
  name: string;
  order: number;
  layout: number;
  products: Product[];
  published: boolean;
  is_extended: boolean;
}

export interface Category {
  id: number;
  name: string;
  order: number;
  layout: number;
  published: boolean;
  categories: SubCategory[];
  is_extended: boolean;
}

export interface Categories {
  next?: any;
  count: number;
  results: {
    id: number;
    name: string;
    order: number;
    layout: number;
    published: boolean;
    categories: {
      id: number;
      name: string;
      order: number;
      layout: number;
      published: boolean;
      is_extended: boolean;
    }[];
    is_extended: boolean;
  }[];
  previous?: any;
}
