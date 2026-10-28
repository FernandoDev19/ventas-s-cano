/**
 * DATOS DE LA DEMO — un solo archivo para adaptar el sistema a otro negocio.
 * Cambia BUSINESS, categorías, productos, combos y usuarios; el resto (mock, seeds) se arma solo.
 * Archivo puro (sin imports de RN) → se puede copiar tal cual a menu-web/src/lib/demo-data.ts.
 */
export const BUSINESS = {
  name: "Sabor Express",
  tagline: "Comida rápida",
  currency: "COP",
  locale: "es-CO",
};

export const DEMO_USERS = [
  { id: "demo-admin", email: "admin@demo.com", password: "demo1234", name: "Admin Demo", role: "admin" },
  { id: "demo-cashier", email: "caja@demo.com", password: "demo1234", name: "Cajero Demo", role: "cashier" },
  { id: "demo-kitchen", email: "cocina@demo.com", password: "demo1234", name: "Cocina Demo", role: "kitchen" },
];

type P = { name: string; price: number; stock: number; img?: string };
const img = (t: string) => `https://placehold.co/400x300/1a1a1a/ff5722?text=${encodeURIComponent(t)}`;

export const CATALOG: { category: string; products: P[]; recipes?: { name: string; description: string; price: number; uses: [string, number][] }[] }[] = [
  {
    category: "Pollos",
    products: [
      { name: "Pollo Entero", price: 42000, stock: 20 },
      { name: "Pollo 1/2", price: 22000, stock: 30 },
      { name: "Pollo 1/4", price: 12000, stock: 40 },
    ],
    recipes: [
      { name: "Combo Familiar", description: "1 pollo entero + 2 gaseosas 1.5L", price: 55000, uses: [["Pollo Entero", 1], ["Gaseosa 1.5L", 2]] },
    ],
  },
  {
    category: "Acompañantes",
    products: [
      { name: "Papas Fritas", price: 6000, stock: 50 },
      { name: "Arepa con Queso", price: 4000, stock: 40 },
    ],
  },
  {
    category: "Bebidas",
    products: [
      { name: "Gaseosa 1.5L", price: 7000, stock: 36 },
      { name: "Jugo Natural", price: 5000, stock: 25 },
      { name: "Cerveza", price: 4500, stock: 60 },
    ],
  },
];

const slug = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
export const ids = {
  category: (n: string) => `demo-cat-${slug(n)}`,
  product: (n: string) => `demo-prod-${slug(n)}`,
  recipe: (n: string) => `demo-rec-${slug(n)}`,
};

/** Contenido inicial del "backend en la nube" simulado. */
export function buildDemoCloudSeed(tableCount = 8) {
  const now = new Date().toISOString();
  const db: Record<string, any[]> = {
    categories: [], products: [], recipes: [], recipe_ingredients: [], clients: [], tables: [],
    cashier_shifts: [], cash_movements: [], sales: [], sale_products: [], sale_recipes: [],
    expenses: [], orders: [], order_items: [], push_tokens: [],
    profiles: DEMO_USERS.map(({ id, name, role }) => ({ id, name, role })),
  };

  for (const c of CATALOG) {
    const category_id = ids.category(c.category);
    db.categories.push({ id: category_id, name: c.category, updated_at: now, deleted_at: null });
    for (const p of c.products)
      db.products.push({
        id: ids.product(p.name), image_url: p.img ?? img(p.name), name: p.name, price: p.price,
        stock: p.stock, category_id, is_visible_menu: true, updated_at: now, deleted_at: null,
      });
    for (const r of c.recipes ?? []) {
      const rid = ids.recipe(r.name);
      db.recipes.push({
        id: rid, name: r.name, description: r.description, image_url: img(r.name),
        selling_price: r.price, category_id, updated_at: now, deleted_at: null,
      });
      r.uses.forEach(([prod, quantity], i) =>
        db.recipe_ingredients.push({
          id: `${rid}-ing-${i}`, recipe_id: rid, product_id: ids.product(prod), quantity, updated_at: now, deleted_at: null,
        }));
    }
  }

  db.clients.push(
    { id: "demo-client-1", name: "Don Carlos", phone: "3001112233", notes: "Cliente frecuente", updated_at: now, deleted_at: null },
    { id: "demo-client-2", name: "María Pérez", phone: "3014445566", notes: "", updated_at: now, deleted_at: null },
  );

  for (let n = 1; n <= tableCount; n++)
    db.tables.push({ id: n, number_mesa: n, status: "libre", created_at: now, updated_at: now, deleted_at: null });

  return db;
}