/**
 * Cliente "Supabase" en memoria/local para DEMOS.
 * Implementa solo lo que usa este proyecto: auth, from().select/insert/update/upsert/delete
 * (con relaciones embebidas), channel() realtime y storage.
 * Persiste en `storage` (AsyncStorage en móvil, localStorage en web).
 */
type Row = Record<string, any>;
type DB = Record<string, Row[]>;

export type MockStorage = {
  getItem(k: string): Promise<string | null> | string | null;
  setItem(k: string, v: string): Promise<void> | void;
  removeItem?(k: string): Promise<void> | void;
};

export type MockUser = { id: string; email: string; password: string };

type Opts = {
  seed: DB;
  users: MockUser[];
  storage?: MockStorage;
  key?: string;
};

const uuid = () =>
  (globalThis as any).crypto?.randomUUID?.() ??
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });

const singular = (n: string) =>
  n.endsWith("ies") ? n.slice(0, -3) + "y" : n.replace(/s$/, "");

const looseEq = (a: any, b: any) => {
  if (typeof a === "boolean" || typeof b === "boolean")
    return Boolean(a) === Boolean(b) && a !== null && b !== null;
  if (a === b) return true;
  if (a == null || b == null) return false;
  return String(a) === String(b);
};

// ── select parser: "a, b(c, d(e)), *" ──────────────────────────
type Sel = { star: boolean; cols: string[]; rels: { name: string; sub: Sel }[] };

function splitTop(s: string): string[] {
  const out: string[] = [];
  let depth = 0, cur = "";
  for (const ch of s) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) { out.push(cur); cur = ""; } else cur += ch;
  }
  if (cur.trim()) out.push(cur);
  return out;
}

function parseSelect(str: string): Sel {
  const sel: Sel = { star: false, cols: [], rels: [] };
  for (const raw of splitTop(str || "*")) {
    const part = raw.trim();
    if (!part) continue;
    if (part === "*") { sel.star = true; continue; }
    const i = part.indexOf("(");
    if (i === -1) { sel.cols.push(part); continue; }
    const name = part.slice(0, i).trim().replace(/!.*$/, "");
    sel.rels.push({ name, sub: parseSelect(part.slice(i + 1, part.lastIndexOf(")"))) });
  }
  if (!sel.cols.length && !sel.rels.length) sel.star = true;
  return sel;
}

type Filter = (r: Row) => boolean;

export function createMockSupabase({ seed, users, storage, key = "mock-supabase" }: Opts) {
  let db: DB = {};
  let session: any = null;
  const files: Record<string, string> = {};
  const listeners = new Set<{ table: string; event: string; cb: (p: any) => void }>();
  const authListeners = new Set<(e: string, s: any) => void>();

  const ready = (async () => {
    try {
      const raw = storage ? await storage.getItem(key) : null;
      db = raw ? JSON.parse(raw) : JSON.parse(JSON.stringify(seed));
      const s = storage ? await storage.getItem(key + ":session") : null;
      session = s ? JSON.parse(s) : null;
    } catch {
      db = JSON.parse(JSON.stringify(seed));
    }
  })();

  const persist = async () => {
    try { await storage?.setItem(key, JSON.stringify(db)); } catch {}
  };

  const emit = (table: string, eventType: string, newRow: Row | null, oldRow: Row | null) => {
    for (const l of listeners) {
      if (l.table === table && (l.event === "*" || l.event === eventType)) {
        try {
          l.cb({ schema: "public", table, eventType, new: newRow ?? {}, old: oldRow ?? {} });
        } catch (e) { console.error("[mock] listener error", e); }
      }
    }
  };

  const project = (table: string, row: Row, sel: Sel): Row => {
    const out: Row = sel.star ? { ...row } : {};
    for (const c of sel.cols) out[c] = row[c];
    for (const { name, sub } of sel.rels) {
      const fk = `${singular(name)}_id`;
      if (fk in row || (row[fk] === undefined && name in (db ?? {}) && !(db[name] ?? []).some((r) => `${singular(table)}_id` in r))) {
        // many-to-one (row.product_id -> products)
        const target = (db[name] ?? []).find((r) => looseEq(r.id, row[fk]));
        out[name] = target ? project(name, target, sub) : null;
      } else {
        const back = `${singular(table)}_id`;
        out[name] = (db[name] ?? []).filter((r) => looseEq(r[back], row.id)).map((r) => project(name, r, sub));
      }
    }
    return out;
  };

  class Query implements PromiseLike<any> {
    private op: "select" | "insert" | "update" | "upsert" | "delete" = "select";
    private payload: any = null;
    private filters: Filter[] = [];
    private orderBy: { col: string; asc: boolean } | null = null;
    private selStr: string | null = "*";
    private returning = false;
    private mode: "many" | "single" | "maybe" = "many";
    private lim: number | null = null;

    private table: string;
    constructor(table: string) { this.table = table; }

    select(str = "*") {
      if (this.op === "select") this.selStr = str;
      else { this.returning = true; this.selStr = str; }
      return this;
    }
    insert(p: any) { this.op = "insert"; this.payload = p; this.selStr = null; return this; }
    update(p: any) { this.op = "update"; this.payload = p; this.selStr = null; return this; }
    upsert(p: any) { this.op = "upsert"; this.payload = p; this.selStr = null; return this; }
    delete() { this.op = "delete"; this.selStr = null; return this; }

    eq(c: string, v: any) { this.filters.push((r) => looseEq(r[c], v)); return this; }
    neq(c: string, v: any) { this.filters.push((r) => !looseEq(r[c], v)); return this; }
    in(c: string, vs: any[]) { this.filters.push((r) => vs.some((v) => looseEq(r[c], v))); return this; }
    is(c: string, v: any) { this.filters.push((r) => (v === null ? r[c] == null : r[c] === v)); return this; }
    gte(c: string, v: any) { this.filters.push((r) => r[c] >= v); return this; }
    lte(c: string, v: any) { this.filters.push((r) => r[c] <= v); return this; }
    ilike(c: string, v: string) {
      const re = new RegExp("^" + v.replace(/%/g, ".*") + "$", "i");
      this.filters.push((r) => re.test(String(r[c] ?? "")));
      return this;
    }
    order(col: string, o?: { ascending?: boolean }) { this.orderBy = { col, asc: o?.ascending !== false }; return this; }
    limit(n: number) { this.lim = n; return this; }
    single() { this.mode = "single"; return this; }
    maybeSingle() { this.mode = "maybe"; return this; }

    then<T1 = any, T2 = never>(res?: any, rej?: any): Promise<T1 | T2> {
      return this.exec().then(res, rej);
    }

    private async exec() {
      await ready;
      const rows = (db[this.table] ??= []);
      const match = () => rows.filter((r) => this.filters.every((f) => f(r)));
      let result: Row[] = [];
      const now = new Date().toISOString();

      if (this.op === "insert") {
        const arr = Array.isArray(this.payload) ? this.payload : [this.payload];
        for (const item of arr) {
          const row = { id: uuid(), created_at: now, ...item };
          rows.push(row);
          result.push(row);
          emit(this.table, "INSERT", row, null);
        }
        await persist();
      } else if (this.op === "upsert") {
        const arr = Array.isArray(this.payload) ? this.payload : [this.payload];
        for (const item of arr) {
          const idx = item.id != null ? rows.findIndex((r) => looseEq(r.id, item.id)) : -1;
          if (idx >= 0) {
            const old = rows[idx];
            rows[idx] = { ...old, ...item };
            result.push(rows[idx]);
            emit(this.table, "UPDATE", rows[idx], old);
          } else {
            const row = { id: uuid(), created_at: now, ...item };
            rows.push(row);
            result.push(row);
            emit(this.table, "INSERT", row, null);
          }
        }
        await persist();
      } else if (this.op === "update") {
        for (const r of match()) {
          const old = { ...r };
          Object.assign(r, this.payload);
          result.push(r);
          emit(this.table, "UPDATE", r, old);
        }
        await persist();
      } else if (this.op === "delete") {
        const del = match();
        db[this.table] = rows.filter((r) => !del.includes(r));
        del.forEach((r) => emit(this.table, "DELETE", null, r));
        result = del;
        await persist();
      } else {
        result = match();
      }

      if (this.orderBy) {
        const { col, asc } = this.orderBy;
        result = [...result].sort((a, b) =>
          a[col] === b[col] ? 0 : (a[col] > b[col] ? 1 : -1) * (asc ? 1 : -1));
      }
      if (this.lim != null) result = result.slice(0, this.lim);

      const wantData = this.op === "select" || this.returning;
      if (!wantData) return { data: null, error: null };

      const sel = parseSelect(this.selStr ?? "*");
      const data = result.map((r) => project(this.table, r, sel));

      if (this.mode === "many") return { data, error: null };
      if (data.length === 0)
        return this.mode === "maybe"
          ? { data: null, error: null }
          : { data: null, error: { code: "PGRST116", message: "No rows found" } };
      return { data: data[0], error: null };
    }
  }

  const setSession = async (s: any, event: string) => {
    session = s;
    try {
      if (s) await storage?.setItem(key + ":session", JSON.stringify(s));
      else await (storage?.removeItem?.(key + ":session") ?? storage?.setItem(key + ":session", ""));
    } catch {}
    authListeners.forEach((cb) => cb(event, s));
  };

  const toUser = (u: MockUser) => ({ id: u.id, email: u.email, aud: "authenticated" });

  return {
    isMock: true as const,
    from: (table: string) => new Query(table),

    auth: {
      async signInWithPassword({ email, password }: { email: string; password: string }) {
        await ready;
        const u = users.find((x) => x.email === email && x.password === password);
        if (!u) return { data: { user: null, session: null }, error: { message: "Credenciales inválidas (demo)" } };
        const s = { access_token: "demo", user: toUser(u) };
        await setSession(s, "SIGNED_IN");
        return { data: { user: s.user, session: s }, error: null };
      },
      async getSession() { await ready; return { data: { session }, error: null }; },
      async getUser() { await ready; return { data: { user: session?.user ?? null }, error: null }; },
      async signOut() { await ready; await setSession(null, "SIGNED_OUT"); return { error: null }; },
      onAuthStateChange(cb: (e: string, s: any) => void) {
        authListeners.add(cb);
        return { data: { subscription: { unsubscribe: () => authListeners.delete(cb) } } };
      },
    },

    channel(_name: string) {
      const mine: { table: string; event: string; cb: (p: any) => void }[] = [];
      const ch: any = {
        _mine: mine,
        on(_type: string, filter: { event?: string; table?: string }, cb: (p: any) => void) {
          mine.push({ table: filter.table ?? "*", event: filter.event ?? "*", cb });
          return ch;
        },
        subscribe(cb?: (status: string) => void) {
          mine.forEach((l) => listeners.add(l));
          setTimeout(() => cb?.("SUBSCRIBED"), 0);
          return ch;
        },
      };
      return ch;
    },
    removeChannel(ch: any) { (ch?._mine ?? []).forEach((l: any) => listeners.delete(l)); return Promise.resolve("ok"); },

    storage: {
      from: (_bucket: string) => ({
        async upload(name: string, bytes: Uint8Array | ArrayBuffer | Blob) {
          if (bytes instanceof Uint8Array || bytes instanceof ArrayBuffer) {
            const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
            let bin = "";
            for (let i = 0; i < u8.length; i += 0x8000) bin += String.fromCharCode(...u8.subarray(i, i + 0x8000));
            files[name] = `data:image/jpeg;base64,${btoa(bin)}`;
          }
          return { data: { path: name }, error: null };
        },
        getPublicUrl: (name: string) => ({
          data: { publicUrl: files[name] ?? `https://placehold.co/400x300?text=${encodeURIComponent(name)}` },
        }),
        async remove(names: string[]) { names.forEach((n) => delete files[n]); return { data: [], error: null }; },
      }),
    },

    /** Restaura los datos de ejemplo (útil para reiniciar la demo). */
    async __reset() {
      await ready;
      db = JSON.parse(JSON.stringify(seed));
      await persist();
    },
  };
}