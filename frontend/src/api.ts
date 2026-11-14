import type { Category, Dashboard, Movement, Product, Supplier } from "./types";

const API = (import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1").replace(/\/$/, "");

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      message = body.detail || message;
    } catch { /* response was not JSON */ }
    throw new Error(message);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const api = {
  dashboard: () => request<Dashboard>("/dashboard/summary"),
  products: (search = "") => request<Product[]>(`/products${search ? `?search=${encodeURIComponent(search)}` : ""}`),
  createProduct: (data: Partial<Product>) => request<Product>("/products", { method: "POST", body: JSON.stringify(data) }),
  updateProduct: (id: number, data: Partial<Product>) => request<Product>(`/products/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  suppliers: () => request<Supplier[]>("/suppliers"),
  createSupplier: (data: Partial<Supplier>) => request<Supplier>("/suppliers", { method: "POST", body: JSON.stringify(data) }),
  categories: () => request<Category[]>("/categories"),
  createCategory: (data: { name: string }) => request<Category>("/categories", { method: "POST", body: JSON.stringify(data) }),
  receipt: (data: unknown) => request("/stock/receipts", { method: "POST", body: JSON.stringify(data) }),
  issue: (data: unknown) => request("/stock/issues", { method: "POST", body: JSON.stringify(data) }),
  movements: () => request<Movement[]>("/stock/movements"),
};
