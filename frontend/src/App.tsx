import { useEffect, useMemo, useState } from "react";
import {
  Activity, AlertTriangle, ArrowDownToLine, ArrowUpFromLine, Boxes,
  ChartNoAxesCombined, LayoutDashboard, Package, Search, Truck, Plus,
  RefreshCw, Menu, X, History, Layers3
} from "lucide-react";
import { api } from "./api";
import type { Category, Dashboard, Movement, Product, Supplier } from "./types";

type Page = "Dashboard" | "Products" | "Suppliers" | "Stock Receipts" | "Stock Issues" | "Transactions" | "Categories";
const nav: { name: Page; icon: typeof Package }[] = [
  { name: "Dashboard", icon: LayoutDashboard }, { name: "Products", icon: Package },
  { name: "Categories", icon: Layers3 }, { name: "Suppliers", icon: Truck },
  { name: "Stock Receipts", icon: ArrowDownToLine }, { name: "Stock Issues", icon: ArrowUpFromLine },
  { name: "Transactions", icon: History },
];

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
    setBusy(true); setError("");
    try {
      const [d, p, s, c, m] = await Promise.all([
        api.dashboard(), api.products(search), api.suppliers(), api.categories(), api.movements()
      ]);
      setDashboard(d); setProducts(p); setSuppliers(s); setCategories(c); setMovements(m);
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to load data. Check the API."); }
    finally { setBusy(false); }
  }
  useEffect(() => { void load(); }, [search]);
  async function action(fn: () => Promise<unknown>, message: string) {
    setError(""); setNotice("");
    try { await fn(); setNotice(message); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Operation failed"); }
  }

  const pageTitle = page === "Dashboard" ? "Inventory overview" : page;
  const low = dashboard?.low_stock_products ?? [];

  return <div className="shell">
    <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
      <div className="brand"><span className="brand-mark"><Boxes size={23}/></span><span>Bin<span>Flow</span></span></div>
      <p className="brand-caption">Inventory & Purchase<br/>Management</p>
      <nav>{nav.map(item => {
        const Icon = item.icon;
        return <button key={item.name} className={`nav-item ${page === item.name ? "active" : ""}`}
          onClick={() => { setPage(item.name); setMobileOpen(false); }}>
          <Icon size={18}/><span>{item.name}</span>
        </button>;
      })}</nav>
      <div className="sidebar-note"><ChartNoAxesCombined/><b>Efficient inventory.<br/>Smarter business.</b></div>
      <div className="profile"><div className="avatar">BF</div><div><b>BinFlow Admin</b><small>Workspace</small></div></div>
    </aside>

    <main className="main">
      <header className="topbar">
        <button className="mobile-menu icon-button" onClick={() => setMobileOpen(!mobileOpen)}>{mobileOpen ? <X/> : <Menu/>}</button>
        <div className="global-search"><Search size={17}/><input aria-label="Search products" placeholder="Search products by name or SKU..." value={search} onChange={e => setSearch(e.target.value)}/></div>
        <button className="icon-button" title="Refresh" onClick={() => void load()}><RefreshCw size={18}/></button>
        <div className="avatar avatar-small">JD</div>
      </header>

      <section className="content">
        <div className="page-heading">
          <div><div className="eyebrow">BINFlow / WORKSPACE</div><h1>{pageTitle}</h1><p>Manage your inventory, track purchases and keep your stock in check.</p></div>
          <div className="date-pill"><Activity size={16}/> Live inventory</div>
        </div>
        {error && <div className="alert error"><AlertTriangle size={17}/>{error}</div>}
        {notice && <div className="alert success">{notice}</div>}
        {busy && <div className="loading">Updating inventory…</div>}

        {page === "Dashboard" && <DashboardPage data={dashboard} low={low} movements={dashboard?.recent_movements ?? []} go={setPage}/>}
        {page === "Products" && <ProductsPage products={products} categories={categories} onCreate={data => action(() => api.createProduct(data), "Product created successfully.")} onUpdate={(id,data) => action(() => api.updateProduct(id,data), "Product updated.")}/>}
        {page === "Categories" && <CategoriesPage categories={categories} onCreate={data => action(() => api.createCategory(data), "Category created.")}/>}
        {page === "Suppliers" && <SuppliersPage suppliers={suppliers} onCreate={data => action(() => api.createSupplier(data), "Supplier created.")}/>}
        {page === "Stock Receipts" && <StockForm mode="receipt" products={products} suppliers={suppliers} onSubmit={data => action(() => api.receipt(data), "Stock receipt recorded.")}/>}
        {page === "Stock Issues" && <StockForm mode="issue" products={products} suppliers={suppliers} onSubmit={data => action(() => api.issue(data), "Stock issue recorded.")}/>}
        {page === "Transactions" && <TransactionsPage movements={movements} products={products}/>}
      </section>
    </main>
  </div>;
}

function DashboardPage({ data, low, movements, go }: { data: Dashboard | null; low: Product[]; movements: Dashboard["recent_movements"]; go: (p: Page) => void }) {
  const cards = [
    { label: "Total products", value: data?.total_products ?? "—", icon: Package, tone: "blue" },
    { label: "Total suppliers", value: data?.total_suppliers ?? "—", icon: Truck, tone: "green" },
    { label: "Stock receipts", value: data?.receipt_count ?? "—", icon: ArrowDownToLine, tone: "purple" },
    { label: "Stock issues", value: data?.issue_count ?? "—", icon: ArrowUpFromLine, tone: "orange" },
  ];
  return <>
    <div className="metric-grid">{cards.map(c => { const Icon = c.icon; return <div className={`metric-card ${c.tone}`} key={c.label}><div className="metric-icon"><Icon/></div><div><small>{c.label}</small><strong>{c.value}</strong></div></div>; })}</div>
    <div className="dashboard-grid">
      <section className="panel stock-panel"><div className="panel-heading"><h2><ChartNoAxesCombined/> Stock snapshot</h2><button className="text-button" onClick={() => go("Products")}>View products →</button></div>
        <div className="stock-number">{data?.total_units ?? 0}<small>total units in stock</small></div>
        <div className="stock-track"><span style={{width: `${Math.min(100, (data?.total_products ?? 0) ? 100 - (data?.low_stock_count ?? 0) / (data?.total_products ?? 1) * 100 : 0)}%`}}/></div>
        <div className="stock-foot"><span><i className="dot green-dot"/> Healthy products</span><b>{Math.max(0,(data?.total_products ?? 0)-(data?.low_stock_count ?? 0))}</b><span><i className="dot red-dot"/> Low stock</span><b>{data?.low_stock_count ?? 0}</b></div>
      </section>
      <section className="panel low-panel"><div className="panel-heading"><h2><AlertTriangle/> Low stock alerts</h2><span className="count-badge">{low.length}</span></div>
        {low.length === 0 ? <p className="empty">No low-stock products. Nice work!</p> : low.slice(0,5).map(p => <div className="alert-row" key={p.id}><div className="product-symbol"><Package/></div><div className="grow"><b>{p.name}</b><small>{p.sku} · Minimum {p.minimum_stock}</small></div><strong className="danger-text">{p.current_stock} left</strong></div>)}
      </section>
    </div>
    <section className="panel"><div className="panel-heading"><h2><History/> Recent transactions</h2><button className="text-button" onClick={() => go("Transactions")}>View all →</button></div>
      <MovementRows rows={movements}/>
    </section>
  </>;
}

function ProductsPage({ products, categories, onCreate, onUpdate }: { products: Product[]; categories: Category[]; onCreate: (d: Partial<Product>) => void; onUpdate: (id: number,d: Partial<Product>) => void }) {
  const [open,setOpen] = useState(false);
  const [form,setForm] = useState({sku:"",name:"",category_id:"",unit_price:"0",minimum_stock:"5"});
  return <section className="panel">
    <div className="panel-heading"><div><h2><Package/> Product catalogue</h2><p className="subtext">{products.length} active products</p></div><button className="primary-button" onClick={() => setOpen(!open)}><Plus size={16}/> Add product</button></div>
    {open && <form className="form-grid" onSubmit={e => {e.preventDefault(); onCreate({...form,category_id:form.category_id ? Number(form.category_id):null,unit_price:Number(form.unit_price),minimum_stock:Number(form.minimum_stock)}); setOpen(false);}}>
      <input required placeholder="SKU" value={form.sku} onChange={e=>setForm({...form,sku:e.target.value})}/>
      <input required placeholder="Product name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
      <select value={form.category_id} onChange={e=>setForm({...form,category_id:e.target.value})}><option value="">No category</option>{categories.map(c=><option value={c.id} key={c.id}>{c.name}</option>)}</select>
      <input type="number" min="0" step="0.01" placeholder="Unit price" value={form.unit_price} onChange={e=>setForm({...form,unit_price:e.target.value})}/>
      <input type="number" min="0" placeholder="Minimum stock" value={form.minimum_stock} onChange={e=>setForm({...form,minimum_stock:e.target.value})}/>
      <button className="primary-button">Save product</button>
    </form>}
    <div className="table-wrap"><table><thead><tr><th>Product</th><th>SKU</th><th>Current stock</th><th>Minimum</th><th>Unit price</th><th>Status</th><th>Action</th></tr></thead><tbody>
      {products.map(p=><tr key={p.id}><td><b>{p.name}</b></td><td className="muted">{p.sku}</td><td>{p.current_stock}</td><td>{p.minimum_stock}</td><td>₹{Number(p.unit_price).toLocaleString("en-IN")}</td><td><span className={`status ${p.current_stock <= p.minimum_stock ? "low":"healthy"}`}>{p.current_stock <= p.minimum_stock ? "Low stock":"In stock"}</span></td><td><button className="small-button" onClick={()=>{const n=prompt("New product name",p.name); if(n?.trim()) onUpdate(p.id,{name:n.trim()});}}>Edit</button></td></tr>)}
    </tbody></table>{products.length===0 && <p className="empty">No products found. Add your first product.</p>}</div>
  </section>;
}

function CategoriesPage({ categories,onCreate }: {categories:Category[];onCreate:(d:{name:string})=>void}) {
  const [name,setName]=useState("");
  return <section className="panel"><div className="panel-heading"><h2><Layers3/> Categories</h2></div><form className="inline-form" onSubmit={e=>{e.preventDefault();if(name.trim())onCreate({name:name.trim()});setName("");}}><input required placeholder="New category name" value={name} onChange={e=>setName(e.target.value)}/><button className="primary-button"><Plus size={16}/> Add category</button></form><div className="simple-list">{categories.map(c=><div key={c.id}><span>{c.name}</span><small>Category #{c.id}</small></div>)}</div></section>;
}

function SuppliersPage({ suppliers,onCreate }: {suppliers:Supplier[];onCreate:(d:Partial<Supplier>)=>void}) {
  const [form,setForm]=useState({name:"",email:"",phone:"",address:""});
  return <section className="panel"><div className="panel-heading"><h2><Truck/> Supplier directory</h2><span className="count-badge">{suppliers.length}</span></div><form className="form-grid" onSubmit={e=>{e.preventDefault();onCreate(form);setForm({name:"",email:"",phone:"",address:""});}}><input required placeholder="Supplier name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/><input type="email" placeholder="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/><input placeholder="Phone" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/><input placeholder="Address" value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/><button className="primary-button">Add supplier</button></form><div className="simple-list">{suppliers.map(s=><div key={s.id}><span><b>{s.name}</b><small>{s.email || "No email"} · {s.phone || "No phone"}</small></span><small>#{s.id}</small></div>)}</div></section>;
}

function StockForm({ mode,products,suppliers,onSubmit }: {mode:"receipt"|"issue";products:Product[];suppliers:Supplier[];onSubmit:(d:unknown)=>void}) {
  const [productId,setProductId]=useState(""); const [quantity,setQuantity]=useState("1");
  const [supplierId,setSupplierId]=useState(""); const [reference,setReference]=useState(""); const [cost,setCost]=useState("0"); const [notes,setNotes]=useState("");
  const receipt=mode==="receipt";
  return <section className="panel form-panel"><div className="panel-heading"><h2>{receipt?<ArrowDownToLine/>:<ArrowUpFromLine/>}{receipt?" Receive stock":" Issue stock"}</h2></div>
    <p className="subtext">{receipt?"Record incoming inventory from a supplier.":"Record outgoing inventory. The API rejects issues above available stock."}</p>
    <form className="form-grid" onSubmit={e=>{e.preventDefault();const item={product_id:Number(productId),quantity:Number(quantity),...(receipt?{unit_cost:Number(cost)}:{})};onSubmit(receipt?{supplier_id:Number(supplierId),reference_number:reference,notes,items:[item]}:{notes,items:[item]});}}>
      {receipt && <><select required value={supplierId} onChange={e=>setSupplierId(e.target.value)}><option value="">Select supplier</option>{suppliers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select><input required placeholder="Receipt reference (e.g. GRN-001)" value={reference} onChange={e=>setReference(e.target.value)}/></>}
      <select required value={productId} onChange={e=>setProductId(e.target.value)}><option value="">Select product</option>{products.map(p=><option key={p.id} value={p.id}>{p.name} — available: {p.current_stock}</option>)}</select>
      <input required type="number" min="1" step="1" value={quantity} onChange={e=>setQuantity(e.target.value)} placeholder="Quantity"/>
      {receipt && <input required type="number" min="0" step="0.01" value={cost} onChange={e=>setCost(e.target.value)} placeholder="Unit cost"/>}
      <input placeholder="Notes (optional)" value={notes} onChange={e=>setNotes(e.target.value)}/>
      <button className="primary-button">{receipt?"Confirm receipt":"Confirm issue"}</button>
    </form>
  </section>;
}

function TransactionsPage({movements,products}:{movements:Movement[];products:Product[]}) {
  const names=useMemo(()=>new Map(products.map(p=>[p.id,p.name])),[products]);
  return <section className="panel"><div className="panel-heading"><h2><History/> Stock movement history</h2><span className="count-badge">{movements.length}</span></div><table><thead><tr><th>Product</th><th>Movement</th><th>Quantity</th><th>Reference</th><th>Date</th></tr></thead><tbody>{movements.map(m=><tr key={m.id}><td>{names.get(m.product_id) ?? `Product #${m.product_id}`}</td><td><span className={`status ${m.movement_type==="RECEIPT"?"healthy":"low"}`}>{m.movement_type}</span></td><td>{m.movement_type==="ISSUE"?"−":"+"}{m.quantity}</td><td>{m.reference_type ?? "Manual issue"}</td><td>{new Date(m.created_at).toLocaleString()}</td></tr>)}</tbody></table>{movements.length===0&&<p className="empty">No stock movements recorded yet.</p>}</section>;
}

function MovementRows({rows}:{rows:Dashboard["recent_movements"]}) {
  return <div className="movement-list">{rows.map(m=><div className="movement-row" key={m.id}><div className={`movement-icon ${m.movement_type==="RECEIPT"?"in":"out"}`}>{m.movement_type==="RECEIPT"?<ArrowDownToLine/>:<ArrowUpFromLine/>}</div><div className="grow"><b>{m.movement_type==="RECEIPT"?"Stock receipt":"Stock issue"}</b><small>{m.product_name}</small></div><span className="muted">{new Date(m.created_at).toLocaleDateString()}</span><strong className={m.movement_type==="RECEIPT"?"green-text":"danger-text"}>{m.movement_type==="RECEIPT"?"+":"−"}{m.quantity}</strong></div>)}</div>;
}
