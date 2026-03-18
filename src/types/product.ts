export interface Product {
  id: number;
  name: string;
  sku: string;
  baseUnitId: number;
  shelfLifeDays: number;
  minStockLevel: number;
  imageUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CatalogResponse {
  items: Product[];
  meta: {
    totalItems: number;
    itemCount: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}
