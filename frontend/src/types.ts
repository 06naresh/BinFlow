export type Product = {
  id: number;
  sku: string;
  name: string;
  description?: string | null;
  category_id?: number | null;
  unit_price: number;
  minimum_stock: number;
  current_stock: number;
  is_active: boolean;
  created_at: string;
};

export type Supplier = {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  created_at: string;
};

export type Category = {
  id: number;
  name: string;
  description?: string | null;
};

export type Movement = {
  id: number;
  product_id: number;
  movement_type: string;
  quantity: number;
  reference_type?: string | null;
  reference_id?: number | null;
  notes?: string | null;
  created_at: string;
};

export type Dashboard = {
  total_products: number;
  total_suppliers: number;
  low_stock_count: number;
  total_units: number;
  receipt_count: number;
  issue_count: number;
  low_stock_products: Product[];
  recent_movements: Array<{
    id: number;
    product_name: string;
    movement_type: string;
    quantity: number;
    created_at: string;
  }>;
};

export type ProductInput = {
  sku: string;
  name: string;
  description: string | null;
  category_id: number | null;
  unit_price: number;
  minimum_stock: number;
};

export type CategoryInput = {
  name: string;
  description: string | null;
};

export type SupplierInput = {
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
};