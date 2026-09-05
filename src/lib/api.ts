const BASE = "/api";

async function request(path: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  const res = await fetch(`${BASE}${path}`, { ...options, headers, credentials: "include" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Request failed");
  }
  return res.json();
}

export const api = {
  // Auth
  login: (username: string, password: string) => {
    const form = new FormData();
    form.append("username", username);
    form.append("password", password);
    return fetch(`${BASE}/auth/token`, { method: "POST", body: form, credentials: "include" }).then(async (r) => {
      if (!r.ok) {
        const e = await r.json().catch(() => ({ detail: r.statusText }));
        throw new Error(e.detail || "Login failed");
      }
      return r.json();
    });
  },
  register: (data: { username: string; email: string; full_name?: string; password: string }) =>
    request("/auth/register", { method: "POST", body: JSON.stringify(data) }),
  logout: () => request("/auth/logout", { method: "POST" }),
  me: () => request("/auth/me"),

  // Dashboard
  stats: () => request("/dashboard/stats"),

  // Suppliers
  suppliers: () => request("/suppliers/"),
  createSupplier: (data: unknown) => request("/suppliers/", { method: "POST", body: JSON.stringify(data) }),
  updateSupplier: (id: number, data: unknown) => request(`/suppliers/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteSupplier: (id: number) => request(`/suppliers/${id}`, { method: "DELETE" }),

  // Products
  products: () => request("/products/"),
  createProduct: (data: unknown) => request("/products/", { method: "POST", body: JSON.stringify(data) }),
  updateProduct: (id: number, data: unknown) => request(`/products/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteProduct: (id: number) => request(`/products/${id}`, { method: "DELETE" }),

  // Warehouses
  warehouses: () => request("/warehouses/"),
  createWarehouse: (data: unknown) => request("/warehouses/", { method: "POST", body: JSON.stringify(data) }),
  updateWarehouse: (id: number, data: unknown) => request(`/warehouses/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteWarehouse: (id: number) => request(`/warehouses/${id}`, { method: "DELETE" }),

  // Stock
  stock: () => request("/stock/"),
  createStock: (data: unknown) => request("/stock/", { method: "POST", body: JSON.stringify(data) }),
  updateStock: (id: number, data: unknown) => request(`/stock/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteStock: (id: number) => request(`/stock/${id}`, { method: "DELETE" }),

  // Shipments
  shipments: () => request("/shipments/"),
  createShipment: (data: unknown) => request("/shipments/", { method: "POST", body: JSON.stringify(data) }),
  updateShipment: (id: number, data: unknown) => request(`/shipments/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteShipment: (id: number) => request(`/shipments/${id}`, { method: "DELETE" }),

  // Orders
  orders: () => request("/orders/"),
  createOrder: (data: unknown) => request("/orders/", { method: "POST", body: JSON.stringify(data) }),
  updateOrder: (id: number, data: unknown) => request(`/orders/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteOrder: (id: number) => request(`/orders/${id}`, { method: "DELETE" }),

  // Disruptions
  disruptions: () => request("/disruptions/"),
  analyzeDisruption: (raw_text: string) =>
    request("/disruptions/analyze", { method: "POST", body: JSON.stringify({ raw_text }) }),
  deleteDisruption: (id: number) => request(`/disruptions/${id}`, { method: "DELETE" }),

  // Users (admin)
  users: () => request("/users/"),
  createUser: (data: unknown) => request("/users/", { method: "POST", body: JSON.stringify(data) }),
  updateUser: (id: number, data: unknown) => request(`/users/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteUser: (id: number) => request(`/users/${id}`, { method: "DELETE" }),
};
