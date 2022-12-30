export interface Brand {
  id: string;
  name: string;
}

export interface Language {
  lang: string;
  values: string[];
}

export interface Attribute {
  code: string;
  languages: Language[];
}

export interface ProductData {
  name: string;
  brand: Brand;
  url: string;
  imageURL: string;
  description: string;
  seo: string;
  attributes: Attribute[];
  format: string;
  novelty: boolean;
  featured: boolean;
  containAllergensIntolernacies: boolean;
  availability: string;
}

export interface Medium {
  url: string;
  order: number;
  type: string;
}

export interface Value {
  centAmount: number;
  centUnitAmount: number;
}

export interface Price {
  id: string;
  value: Value;
}

export interface PriceData {
  prices: Price[];
  taxPercentage: number;
  priceUnitType: string;
  unitPriceUnitType: string;
  minimumUnit: number;
  maximumUnit: number;
  intervalUnit: number;
}

export interface PurchaseData {
  allowComments: boolean;
}

export interface Category {
  id: number;
  name: string;
  type: number;
}

export interface Product {
  id: number;
  productType: number;
  code: string;
  ean: string;
  productData: ProductData;
  media: Medium[];
  priceData: PriceData;
  purchaseData: PurchaseData;
  categories: Category[];
  offers: any[];
  coupons: any[];
}

export interface Products {
  totalCount: number;
  hasMore: boolean;
  products: Product[];
}
