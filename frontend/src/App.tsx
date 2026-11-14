import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Boxes,
  ChartNoAxesCombined,
  LayoutDashboard,
  Package,
  Search,
  Truck,
  Plus,
  RefreshCw,
  Menu,
  X,
  History,
  Layers3,
  Pencil,
  Trash2,
} from "lucide-react";

import { api } from "./api";

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

type Page =
  | "Dashboard"
  | "Products"
  | "Categories"
  | "Suppliers"
  | "Stock Receipts"
  | "Stock Issues"
  | "Transactions";

const nav: { name: Page; icon: typeof Package }[] = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Products", icon: Package },
  { name: "Categories", icon: Layers3 },
  { name: "Suppliers", icon: Truck },
  { name: "Stock Receipts", icon: ArrowDownToLine },
  { name: "Stock Issues", icon: ArrowUpFromLine },
  { name: "Transactions", icon: History },
];

const emptyProductForm = (): ProductInput => ({
  sku: "",
  name: "",
  description: "",
  category_id: null,
  unit_price: 0,
  minimum_stock: 5,
});

const emptyCategoryForm = (): CategoryInput => ({
  name: "",
  description: "",
});

const emptySupplierForm = (): SupplierInput => ({
  name: "",
  email: "",
  phone: "",
  address: "",
});

export default function App() {
  const [page, setPage] = useState<Page>("Dashboard");

  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);

  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [mobileOpen, setMobileOpen] = useState(false);

  async function load() {
    setBusy(true);
    setError("");

    try {
      const [d, p, s, c, m] = await Promise.all([
      api.dashboard(),
      api.products(page === "Products" ? search : ""),
      api.suppliers(page === "Suppliers" ? search : ""),
      api.categories(page === "Categories" ? search : ""),
      api.movements(page === "Transactions" ? search : ""),
    ]);

      setDashboard(d);
      setProducts(p);
      setSuppliers(s);
      setCategories(c);
      setMovements(m);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Unable to load data. Check the API."
      );
    } finally {
      setBusy(false);
    }
  }

  // Reload the relevant lists when the global search changes.
  useEffect(() => {
  void load();
}, [search, page]);

  // Automatically dismiss success notifications.
  useEffect(() => {
    if (!notice) return;

    const timer = window.setTimeout(() => {
      setNotice("");
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [notice]);

  async function action(
    fn: () => Promise<unknown>,
    message: string
  ) {
    setError("");
    setNotice("");

    try {
      await fn();

      setNotice(message);

      await load();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Operation failed."
      );
    }
  }

  function navigate(nextPage: Page) {
    setPage(nextPage);
    setMobileOpen(false);

    // A notification from the previous page should not appear here.
    setNotice("");
    setError("");
    setSearch("");
  }

  const pageTitle =
    page === "Dashboard" ? "Inventory overview" : page;

  const low = dashboard?.low_stock_products ?? [];

  const showSearch = [
    "Products",
    "Categories",
    "Suppliers",
    "Transactions",
  ].includes(page);

  const searchPlaceholder: Record<string, string> = {
    Products: "Search products by name, SKU or description...",
    Categories: "Search categories...",
    Suppliers: "Search suppliers by name, email or phone...",
    Transactions: "Search transactions by product, reference or notes...",
  };

  return (
    <div className="shell">
      {/* SIDEBAR */}
      <aside
        className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}
      >
        <div className="brand">
          <span className="brand-mark">
            <Boxes size={23} />
          </span>

          <span>
            Bin<span>Flow</span>
          </span>
        </div>

        <p className="brand-caption">
          Inventory & Purchase
          <br />
          Management
        </p>

        <nav>
          {nav.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.name}
                className={`nav-item ${
                  page === item.name ? "active" : ""
                }`}
                onClick={() => navigate(item.name)}
              >
                <Icon size={18} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-note">
          <ChartNoAxesCombined />
          <b>
            Efficient inventory.
            <br />
            Smarter business.
          </b>
        </div>

        <div className="profile">
          <div className="avatar">BF</div>

          <div>
            <b>BinFlow Admin</b>
            <small>Workspace</small>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main">
        <header className="topbar">
          <button
            className="mobile-menu icon-button"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X /> : <Menu />}
          </button>

          <div className="global-search">
            <Search size={17} />

            <input
              aria-label="Search current page"
              placeholder={
                showSearch
                  ? searchPlaceholder[page]
                  : "Search is available on Products, Categories, Suppliers and Transactions"
              }
              value={search}
              disabled={!showSearch}
              onChange={(e) => setSearch(e.target.value)}
            />

            {search && showSearch && (
              <button
                className="search-clear"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                type="button"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <button
            className="icon-button"
            title="Refresh"
            onClick={() => void load()}
          >
            <RefreshCw size={18} />
          </button>

          <div className="avatar avatar-small">JD</div>
        </header>

        <section className="content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">BINFLOW / WORKSPACE</div>

              <h1>{pageTitle}</h1>

              <p>
                Manage your inventory, track purchases and keep your
                stock in check.
              </p>
            </div>

            <div className="date-pill">
              <Activity size={16} />
              Live inventory
            </div>
          </div>

          {/* ERROR NOTIFICATION */}
          {error && (
            <div className="alert error" role="alert">
              <AlertTriangle size={17} />
              <span>{error}</span>

              <button
                className="alert-close"
                onClick={() => setError("")}
                aria-label="Dismiss error"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* SUCCESS NOTIFICATION */}
          {notice && (
            <div className="alert success" role="status">
              <span>{notice}</span>

              <button
                className="alert-close"
                onClick={() => setNotice("")}
                aria-label="Dismiss notification"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {busy && (
            <div className="loading">Updating inventory…</div>
          )}

          {page === "Dashboard" && (
            <DashboardPage
              data={dashboard}
              low={low}
              movements={dashboard?.recent_movements ?? []}
              go={navigate}
            />
          )}

          {page === "Products" && (
            <ProductsPage
              products={products}
              categories={categories}
              onCreate={(data) =>
                action(
                  () => api.createProduct(data),
                  "Product created successfully."
                )
              }
              onUpdate={(id, data) =>
                action(
                  () => api.updateProduct(id, data),
                  "Product updated successfully."
                )
              }
              onDelete={(id) =>
                action(
                  () => api.deleteProduct(id),
                  "Product deactivated successfully."
                )
              }
            />
          )}

          {page === "Categories" && (
            <CategoriesPage
              categories={categories}
              onCreate={(data) =>
                action(
                  () => api.createCategory(data),
                  "Category created successfully."
                )
              }
              onUpdate={(id, data) =>
                action(
                  () => api.updateCategory(id, data),
                  "Category updated successfully."
                )
              }
              onDelete={(id) =>
                action(
                  () => api.deleteCategory(id),
                  "Category deleted successfully."
                )
              }
            />
          )}

          {page === "Suppliers" && (
            <SuppliersPage
              suppliers={suppliers}
              onCreate={(data) =>
                action(
                  () => api.createSupplier(data),
                  "Supplier created successfully."
                )
              }
              onUpdate={(id, data) =>
                action(
                  () => api.updateSupplier(id, data),
                  "Supplier updated successfully."
                )
              }
              onDelete={(id) =>
                action(
                  () => api.deleteSupplier(id),
                  "Supplier deleted successfully."
                )
              }
            />
          )}

          {page === "Stock Receipts" && (
            <StockForm
              mode="receipt"
              products={products}
              suppliers={suppliers}
              onSubmit={(data) =>
                action(
                  () => api.receipt(data),
                  "Stock receipt recorded successfully."
                )
              }
            />
          )}

          {page === "Stock Issues" && (
            <StockForm
              mode="issue"
              products={products}
              suppliers={suppliers}
              onSubmit={(data) =>
                action(
                  () => api.issue(data),
                  "Stock issue recorded successfully."
                )
              }
            />
          )}

          {page === "Transactions" && (
            <TransactionsPage
              movements={movements}
              products={products}
            />
          )}
        </section>
      </main>
    </div>
  );
}


// =========================================================
// DASHBOARD
// =========================================================

function DashboardPage({
  data,
  low,
  movements,
  go,
}: {
  data: Dashboard | null;
  low: Product[];
  movements: Dashboard["recent_movements"];
  go: (page: Page) => void;
}) {
  const cards = [
    {
      label: "Total products",
      value: data?.total_products ?? "—",
      icon: Package,
      tone: "blue",
    },
    {
      label: "Total suppliers",
      value: data?.total_suppliers ?? "—",
      icon: Truck,
      tone: "green",
    },
    {
      label: "Stock receipts",
      value: data?.receipt_count ?? "—",
      icon: ArrowDownToLine,
      tone: "purple",
    },
    {
      label: "Stock issues",
      value: data?.issue_count ?? "—",
      icon: ArrowUpFromLine,
      tone: "orange",
    },
  ];

  return (
    <>
      <div className="metric-grid">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              className={`metric-card ${card.tone}`}
              key={card.label}
            >
              <div className="metric-icon">
                <Icon />
              </div>

              <div>
                <small>{card.label}</small>
                <strong>{card.value}</strong>
              </div>
            </div>
          );
        })}
      </div>

      <div className="dashboard-grid">
        <section className="panel stock-panel">
          <div className="panel-heading">
            <h2>
              <ChartNoAxesCombined />
              Stock snapshot
            </h2>

            <button
              className="text-button"
              onClick={() => go("Products")}
            >
              View products →
            </button>
          </div>

          <div className="stock-number">
            {data?.total_units ?? 0}
            <small>total units in stock</small>
          </div>

          <div className="stock-track">
            <span
              style={{
                width: `${
                  Math.min(
                    100,
                    (data?.total_products ?? 0)
                      ? 100 -
                        ((data?.low_stock_count ?? 0) /
                          (data?.total_products ?? 1)) *
                          100
                      : 0
                  )
                }%`,
              }}
            />
          </div>

          <div className="stock-foot">
            <span>
              <i className="dot green-dot" />
              Healthy products
            </span>

            <b>
              {Math.max(
                0,
                (data?.total_products ?? 0) -
                  (data?.low_stock_count ?? 0)
              )}
            </b>

            <span>
              <i className="dot red-dot" />
              Low stock
            </span>

            <b>{data?.low_stock_count ?? 0}</b>
          </div>
        </section>

        <section className="panel low-panel">
          <div className="panel-heading">
            <h2>
              <AlertTriangle />
              Low stock alerts
            </h2>

            <span className="count-badge">{low.length}</span>
          </div>

          {low.length === 0 ? (
            <p className="empty">
              No low-stock products. Nice work!
            </p>
          ) : (
            low.slice(0, 5).map((product) => (
              <div className="alert-row" key={product.id}>
                <div className="product-symbol">
                  <Package />
                </div>

                <div className="grow">
                  <b>{product.name}</b>
                  <small>
                    {product.sku} · Minimum {product.minimum_stock}
                  </small>
                </div>

                <strong className="danger-text">
                  {product.current_stock} left
                </strong>
              </div>
            ))
          )}
        </section>
      </div>

      <section className="panel">
        <div className="panel-heading">
          <h2>
            <History />
            Recent transactions
          </h2>

          <button
            className="text-button"
            onClick={() => go("Transactions")}
          >
            View all →
          </button>
        </div>

        <MovementRows rows={movements} />
      </section>
    </>
  );
}


// =========================================================
// PRODUCTS
// =========================================================

function ProductsPage({
  products,
  categories,
  onCreate,
  onUpdate,
  onDelete,
}: {
  products: Product[];
  categories: Category[];
  onCreate: (data: ProductInput) => Promise<void>;
  onUpdate: (id: number, data: Partial<ProductInput>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ProductInput>(emptyProductForm());

  function startCreate() {
    setEditingId(null);
    setForm(emptyProductForm());
    setOpen(true);
  }

  function startEdit(product: Product) {
    setEditingId(product.id);

    setForm({
      sku: product.sku,
      name: product.name,
      description: product.description ?? "",
      category_id: product.category_id ?? null,
      unit_price: Number(product.unit_price),
      minimum_stock: product.minimum_stock,
    });

    setOpen(true);
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const data: ProductInput = {
      ...form,
      sku: form.sku.trim(),
      name: form.name.trim(),
      description: form.description?.trim() || null,
      category_id: form.category_id
        ? Number(form.category_id)
        : null,
      unit_price: Number(form.unit_price),
      minimum_stock: Number(form.minimum_stock),
    };

    if (editingId !== null) {
      await onUpdate(editingId, data);
    } else {
      await onCreate(data);
    }

    setOpen(false);
    setEditingId(null);
    setForm(emptyProductForm());
  }

  async function remove(product: Product) {
    const confirmed = window.confirm(
      `Deactivate "${product.name}"?\n\nThe product will no longer appear in the active product list. Its stock movement history will be preserved.`
    );

    if (confirmed) {
      await onDelete(product.id);
    }
  }

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>
            <Package />
            Product catalogue
          </h2>

          <p className="subtext">
            {products.length} active products
          </p>
        </div>

        <button className="primary-button" onClick={startCreate}>
          <Plus size={16} />
          Add product
        </button>
      </div>

      {open && (
        <form className="form-grid" onSubmit={submit}>
          <h3 className="form-title">
            {editingId !== null ? "Edit product" : "Add new product"}
          </h3>

          <label>
            SKU
            <input
              required
              value={form.sku}
              onChange={(e) =>
                setForm({ ...form, sku: e.target.value })
              }
              placeholder="Enter SKU"
            />
          </label>

          <label>
            Product name
            <input
              required
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
              placeholder="Enter product name"
            />
          </label>

          <label>
            Category
            <select
              value={form.category_id ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  category_id: e.target.value
                    ? Number(e.target.value)
                    : null,
                })
              }
            >
              <option value="">No category</option>

              {categories.map((category) => (
                <option value={category.id} key={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Unit price (₹)
            <input
              type="number"
              min="0"
              step="0.01"
              required
              value={form.unit_price}
              onChange={(e) =>
                setForm({
                  ...form,
                  unit_price: Number(e.target.value),
                })
              }
            />
          </label>

          <label>
            Minimum stock
            <input
              type="number"
              min="0"
              required
              value={form.minimum_stock}
              onChange={(e) =>
                setForm({
                  ...form,
                  minimum_stock: Number(e.target.value),
                })
              }
            />
          </label>

          <label className="full-width">
            Description
            <textarea
              rows={3}
              value={form.description ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  description: e.target.value,
                })
              }
              placeholder="Enter product description"
            />
          </label>

          <div className="form-actions full-width">
            <button type="submit" className="primary-button">
              {editingId !== null ? "Update product" : "Save product"}
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                setOpen(false);
                setEditingId(null);
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Current stock</th>
              <th>Minimum</th>
              <th>Unit price</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>
                  <b>{product.name}</b>
                </td>

                <td className="muted">{product.sku}</td>

                <td>{product.current_stock}</td>

                <td>{product.minimum_stock}</td>

                <td>
                  ₹
                  {Number(product.unit_price).toLocaleString("en-IN")}
                </td>

                <td>
                  <span
                    className={`status ${
                      product.current_stock <= product.minimum_stock
                        ? "low"
                        : "healthy"
                    }`}
                  >
                    {product.current_stock <= product.minimum_stock
                      ? "Low stock"
                      : "In stock"}
                  </span>
                </td>

                <td>
                  <div className="action-buttons">
                    <button
                      className="small-button"
                      onClick={() => startEdit(product)}
                      title="Edit product"
                    >
                      <Pencil size={14} />
                      Edit
                    </button>

                    <button
                      className="small-button danger-button"
                      onClick={() => void remove(product)}
                      title="Deactivate product"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {products.length === 0 && (
          <p className="empty">
            No products found. Add your first product.
          </p>
        )}
      </div>
    </section>
  );
}


// =========================================================
// CATEGORIES
// =========================================================

function CategoriesPage({
  categories,
  onCreate,
  onUpdate,
  onDelete,
}: {
  categories: Category[];
  onCreate: (data: CategoryInput) => Promise<void>;
  onUpdate: (id: number, data: CategoryInput) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] =
    useState<CategoryInput>(emptyCategoryForm());

  function startEdit(category: Category) {
    setEditingId(category.id);

    setForm({
      name: category.name,
      description: category.description ?? "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyCategoryForm());
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const data: CategoryInput = {
      name: form.name.trim(),
      description: form.description?.trim() || null,
    };

    if (editingId !== null) {
      await onUpdate(editingId, data);
    } else {
      await onCreate(data);
    }

    cancelEdit();
  }

  async function remove(category: Category) {
    const confirmed = window.confirm(
      `Delete category "${category.name}"?\n\nProducts in this category will become uncategorized.`
    );

    if (confirmed) {
      await onDelete(category.id);
    }
  }

  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>
          <Layers3 />
          Categories
        </h2>

        <span className="count-badge">{categories.length}</span>
      </div>

      <form className="form-grid" onSubmit={submit}>
        <h3 className="form-title full-width">
          {editingId !== null ? "Edit category" : "Add category"}
        </h3>

        <label>
          Category name
          <input
            required
            placeholder="Category name"
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
          />
        </label>

        <label>
          Description
          <input
            placeholder="Category description"
            value={form.description ?? ""}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
          />
        </label>

        <div className="form-actions full-width">
          <button className="primary-button" type="submit">
            {editingId !== null ? "Update category" : "Add category"}
          </button>

          {editingId !== null && (
            <button
              type="button"
              className="secondary-button"
              onClick={cancelEdit}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="simple-list">
        {categories.map((category) => (
          <div key={category.id} className="managed-list-row">
            <div className="managed-list-info">
              <b>{category.name}</b>

              <small>
                {category.description || `Category #${category.id}`}
              </small>
            </div>

            <div className="action-buttons">
              <button
                className="small-button"
                onClick={() => startEdit(category)}
              >
                <Pencil size={14} />
                Edit
              </button>

              <button
                className="small-button danger-button"
                onClick={() => void remove(category)}
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          </div>
        ))}

        {categories.length === 0 && (
          <p className="empty">No categories found.</p>
        )}
      </div>
    </section>
  );
}


// =========================================================
// SUPPLIERS
// =========================================================

function SuppliersPage({
  suppliers,
  onCreate,
  onUpdate,
  onDelete,
}: {
  suppliers: Supplier[];
  onCreate: (data: SupplierInput) => Promise<void>;
  onUpdate: (id: number, data: SupplierInput) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] =
    useState<SupplierInput>(emptySupplierForm());

  function startEdit(supplier: Supplier) {
    setEditingId(supplier.id);

    setForm({
      name: supplier.name,
      email: supplier.email ?? "",
      phone: supplier.phone ?? "",
      address: supplier.address ?? "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptySupplierForm());
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const data: SupplierInput = {
      name: form.name.trim(),
      email: form.email?.trim() || null,
      phone: form.phone?.trim() || null,
      address: form.address?.trim() || null,
    };

    if (editingId !== null) {
      await onUpdate(editingId, data);
    } else {
      await onCreate(data);
    }

    cancelEdit();
  }

  async function remove(supplier: Supplier) {
    const confirmed = window.confirm(
      `Delete supplier "${supplier.name}"?\n\nA supplier with linked purchase receipts cannot be deleted.`
    );

    if (confirmed) {
      await onDelete(supplier.id);
    }
  }

  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>
          <Truck />
          Supplier directory
        </h2>

        <span className="count-badge">{suppliers.length}</span>
      </div>

      <form className="form-grid" onSubmit={submit}>
        <h3 className="form-title full-width">
          {editingId !== null ? "Edit supplier" : "Add supplier"}
        </h3>

        <label>
          Supplier name
          <input
            required
            placeholder="Supplier name"
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
          />
        </label>

        <label>
          Email
          <input
            type="email"
            placeholder="Email address"
            value={form.email ?? ""}
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
          />
        </label>

        <label>
          Phone
          <input
            placeholder="Phone number"
            value={form.phone ?? ""}
            onChange={(e) =>
              setForm({ ...form, phone: e.target.value })
            }
          />
        </label>

        <label>
          Address
          <input
            placeholder="Supplier address"
            value={form.address ?? ""}
            onChange={(e) =>
              setForm({ ...form, address: e.target.value })
            }
          />
        </label>

        <div className="form-actions full-width">
          <button className="primary-button" type="submit">
            {editingId !== null ? "Update supplier" : "Add supplier"}
          </button>

          {editingId !== null && (
            <button
              type="button"
              className="secondary-button"
              onClick={cancelEdit}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="simple-list">
        {suppliers.map((supplier) => (
          <div key={supplier.id} className="managed-list-row">
            <div className="managed-list-info">
              <b>{supplier.name}</b>

              <small>
                {supplier.email || "No email"} ·{" "}
                {supplier.phone || "No phone"}
              </small>

              {supplier.address && (
                <small>{supplier.address}</small>
              )}
            </div>

            <div className="action-buttons">
              <button
                className="small-button"
                onClick={() => startEdit(supplier)}
              >
                <Pencil size={14} />
                Edit
              </button>

              <button
                className="small-button danger-button"
                onClick={() => void remove(supplier)}
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          </div>
        ))}

        {suppliers.length === 0 && (
          <p className="empty">No suppliers found.</p>
        )}
      </div>
    </section>
  );
}


// =========================================================
// STOCK RECEIPTS AND ISSUES
// =========================================================

function StockForm({
  mode,
  products,
  suppliers,
  onSubmit,
}: {
  mode: "receipt" | "issue";
  products: Product[];
  suppliers: Supplier[];
  onSubmit: (data: unknown) => Promise<void>;
}) {
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");

  const [supplierId, setSupplierId] = useState("");
  const [reference, setReference] = useState("");

  const [cost, setCost] = useState("0");
  const [notes, setNotes] = useState("");

  const receipt = mode === "receipt";

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const item = {
      product_id: Number(productId),
      quantity: Number(quantity),
      ...(receipt ? { unit_cost: Number(cost) } : {}),
    };

    const data = receipt
      ? {
          supplier_id: Number(supplierId),
          reference_number: reference.trim(),
          notes,
          items: [item],
        }
      : {
          notes,
          items: [item],
        };

    await onSubmit(data);

    setProductId("");
    setQuantity("1");
    setSupplierId("");
    setReference("");
    setCost("0");
    setNotes("");
  }

  return (
    <section className="panel form-panel">
      <div className="panel-heading">
        <h2>
          {receipt ? <ArrowDownToLine /> : <ArrowUpFromLine />}
          {receipt ? "Receive stock" : "Issue stock"}
        </h2>
      </div>

      <p className="subtext">
        {receipt
          ? "Record incoming inventory from a supplier."
          : "Record outgoing inventory. The API rejects issues above available stock."}
      </p>

      <form className="form-grid" onSubmit={submit}>
        {receipt && (
          <>
            <label>
              Supplier
              <select
                required
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
              >
                <option value="">Select supplier</option>

                {suppliers.map((supplier) => (
                  <option
                    key={supplier.id}
                    value={supplier.id}
                  >
                    {supplier.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Receipt reference
              <input
                required
                placeholder="e.g. GRN-001"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </label>
          </>
        )}

        <label>
          Product
          <select
            required
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
          >
            <option value="">Select product</option>

            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} — available: {product.current_stock}
              </option>
            ))}
          </select>
        </label>

        <label>
          Quantity
          <input
            required
            type="number"
            min="1"
            step="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </label>

        {receipt && (
          <label>
            Unit cost
            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
            />
          </label>
        )}

        <label>
          Notes
          <input
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>

        <button className="primary-button" type="submit">
          {receipt ? "Confirm receipt" : "Confirm issue"}
        </button>
      </form>
    </section>
  );
}


// =========================================================
// TRANSACTIONS
// =========================================================

function TransactionsPage({
  movements,
  products,
}: {
  movements: Movement[];
  products: Product[];
}) {
  const names = useMemo(
    () => new Map(products.map((product) => [product.id, product.name])),
    [products]
  );

  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>
          <History />
          Stock movement history
        </h2>

        <span className="count-badge">{movements.length}</span>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Movement</th>
              <th>Quantity</th>
              <th>Reference</th>
              <th>Notes</th>
              <th>Date</th>
            </tr>
          </thead>

          <tbody>
            {movements.map((movement) => (
              <tr key={movement.id}>
                <td>
                  {names.get(movement.product_id) ??
                    `Product #${movement.product_id}`}
                </td>

                <td>
                  <span
                    className={`status ${
                      movement.movement_type === "RECEIPT"
                        ? "healthy"
                        : "low"
                    }`}
                  >
                    {movement.movement_type}
                  </span>
                </td>

                <td>
                  {movement.movement_type === "ISSUE" ? "−" : "+"}
                  {movement.quantity}
                </td>

                <td>
                  {movement.reference_type ?? "Manual issue"}
                  {movement.reference_id
                    ? ` #${movement.reference_id}`
                    : ""}
                </td>

                <td>{movement.notes || "—"}</td>

                <td>
                  {new Date(movement.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {movements.length === 0 && (
        <p className="empty">No stock movements found.</p>
      )}
    </section>
  );
}


// =========================================================
// DASHBOARD MOVEMENT ROWS
// =========================================================

function MovementRows({
  rows,
}: {
  rows: Dashboard["recent_movements"];
}) {
  return (
    <div className="movement-list">
      {rows.map((movement) => (
        <div className="movement-row" key={movement.id}>
          <div
            className={`movement-icon ${
              movement.movement_type === "RECEIPT" ? "in" : "out"
            }`}
          >
            {movement.movement_type === "RECEIPT" ? (
              <ArrowDownToLine />
            ) : (
              <ArrowUpFromLine />
            )}
          </div>

          <div className="grow">
            <b>
              {movement.movement_type === "RECEIPT"
                ? "Stock receipt"
                : "Stock issue"}
            </b>

            <small>{movement.product_name}</small>
          </div>

          <span className="muted">
            {new Date(movement.created_at).toLocaleDateString()}
          </span>

          <strong
            className={
              movement.movement_type === "RECEIPT"
                ? "green-text"
                : "danger-text"
            }
          >
            {movement.movement_type === "RECEIPT" ? "+" : "−"}
            {movement.quantity}
          </strong>
        </div>
      ))}
    </div>
  );
}