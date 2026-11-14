import type {
  Category,
  CategoryInput,
  Dashboard,
  Movement,
  Product,
  ProductInput,
  Supplier,
  SupplierInput,
} from "./types";

const API = (
  import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"
).replace(/\/$/, "");

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;

    try {
      const body = await response.json();

      if (typeof body.detail === "string") {
        message = body.detail;
      } else if (Array.isArray(body.detail)) {
        message = body.detail
          .map((item: { msg?: string }) => item.msg || "Validation error")
          .join(", ");
      }
    } catch {
      // The response was not JSON.
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

function searchQuery(search: string): string {
  const trimmed = search.trim();

  return trimmed
    ? `?search=${encodeURIComponent(trimmed)}`
    : "";
}

export const api = {
  dashboard: () => request<Dashboard>("/dashboard/summary"),

  // Products
  products: (search = "") =>
    request<Product[]>(`/products${searchQuery(search)}`),

  createProduct: (data: ProductInput) =>
    request<Product>("/products", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateProduct: (id: number, data: Partial<ProductInput>) =>
    request<Product>(`/products/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteProduct: (id: number) =>
    request<void>(`/products/${id}`, {
      method: "DELETE",
    }),

  // Categories
  categories: (search = "") =>
    request<Category[]>(`/categories${searchQuery(search)}`),

  createCategory: (data: CategoryInput) =>
    request<Category>("/categories", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateCategory: (id: number, data: CategoryInput) =>
    request<Category>(`/categories/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteCategory: (id: number) =>
    request<void>(`/categories/${id}`, {
      method: "DELETE",
    }),

  // Suppliers
  suppliers: (search = "") =>
    request<Supplier[]>(`/suppliers${searchQuery(search)}`),

  createSupplier: (data: SupplierInput) =>
    request<Supplier>("/suppliers", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateSupplier: (id: number, data: SupplierInput) =>
    request<Supplier>(`/suppliers/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteSupplier: (id: number) =>
    request<void>(`/suppliers/${id}`, {
      method: "DELETE",
    }),

  // Stock
  receipt: (data: unknown) =>
    request("/stock/receipts", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  issue: (data: unknown) =>
    request("/stock/issues", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  movements: (search = "") =>
    request<Movement[]>(`/stock/movements${searchQuery(search)}`),
};