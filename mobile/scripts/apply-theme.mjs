#!/usr/bin/env node
/**
 * apply-theme.mjs — migra colores fijos (hex / clases NativeWind) a modo claro/oscuro
 * y sube el tamaño de fuente. Uso:
 *   node scripts/apply-theme.mjs [carpeta=src] [--dry] [--no-fonts] [--import=../theme/palette]
 * Es idempotente: los archivos migrados llevan la marca "@theme-migrated" y se saltan.
 */
import fs from "node:fs";
import path from "node:path";
import { parse } from "@babel/parser";
import traverseMod from "@babel/traverse";
const traverse = traverseMod.default ?? traverseMod;

const args = process.argv.slice(2);
const flags = Object.fromEntries(args.filter((a) => a.startsWith("--")).map((a) => { const [k, v] = a.slice(2).split("="); return [k, v ?? true]; }));
const root = args.find((a) => !a.startsWith("--")) ?? "src";
const IMPORT = flags.import || "@/src/core/theme/palette";
const DRY = !!flags.dry;
const FONTS = !flags["no-fonts"];
const MARK = "// @theme-migrated";

// Archivos que se adaptan a mano (vienen en el kit) o que no deben tocarse
const SKIP = [/core\/theme\//, /app\/_layout\.tsx$/, /\(tabs\)\/_layout\.tsx$/, /\(more\)\/more\.tsx$/];

const HEX = {
  "0f0f0f": "bg", "141414": "sheet", "1a1a1a": "card", "2a2a2a": "line", "333333": "line2",
  "a3a3a3": "soft", "737373": "muted", "555555": "faint",
  "2a0a0a": "dangerBg", "5a1a1a": "dangerLine", "2b1c17": "warnBg", "7c2d12": "warnLine",
  "f87171": "dangerText", "fbbf24": "warnText", "34d399": "okText",
};
const WHITE = new Set(["ffffff"]);
const norm = (h) => { h = h.slice(1).toLowerCase(); return h.length === 3 ? h.split("").map((x) => x + x).join("") : h; };
const isHex = (s) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(s);
const lum = (h) => { const n = parseInt(h, 16); return (0.2126 * (n >> 16) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255; };

// ---------- clases NativeWind: [claro, oscuro-original] ----------
const CLS = {
  "bg-background": "bg-[#f2f2f4]",
  "bg-[#0f0f0f]": "bg-[#f2f2f4]",
  "bg-[#141414]": "bg-white",
  "bg-[#1a1a1a]": "bg-white",
  "bg-neutral-900": "bg-white",
  "bg-neutral-950": "bg-[#f2f2f4]",
  "bg-[#2a2a2a]": "bg-neutral-200",
  "bg-neutral-800": "bg-neutral-200",
  "bg-neutral-700": "bg-neutral-300",
  "border-neutral-800": "border-neutral-200",
  "border-neutral-700": "border-neutral-300",
  "border-[#2a2a2a]": "border-neutral-200",
  "border-[#1a1a1a]": "border-neutral-200",
  "text-neutral-400": "text-neutral-600",
  "text-neutral-300": "text-neutral-700",
  "text-neutral-200": "text-neutral-800",
  "text-white": "text-neutral-900",
  "text-[#a3a3a3]": "text-neutral-600",
};
const FONT_CLS = { "text-xs": "text-sm", "text-sm": "text-base", "text-base": "text-lg", "text-lg": "text-xl", "text-xl": "text-2xl" };
const NEUTRAL_BG = /^bg-(background|white|black|transparent|neutral-\d+|\[#(0f0f0f|141414|1a1a1a|2a2a2a|262626|f2f2f4|fff|ffffff)\])$/;
const tokensOf = (s) => s.match(/[\w:\-\[\]#\/.%!]+/g) || [];
const hasAccentBg = (text) => tokensOf(text).some((t) => {
  const b = t.split(":").pop();
  return b.startsWith("bg-") && !NEUTRAL_BG.test(b) && !b.includes("/");
}) || /backgroundColor:\s*["'`]#(?!fff|0f0f0f|141414|1a1a1a|2a2a2a)/i.test(text);

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (!["node_modules", ".git", "android", "ios"].includes(e.name)) walk(p, out); }
    else if (/\.(tsx|ts)$/.test(e.name) && !e.name.endsWith(".d.ts")) out.push(p);
  }
  return out;
}

const report = [];
const totals = { files: 0, colors: 0, classes: 0, fonts: 0, lazy: 0 };

function processFile(file) {
  const src = fs.readFileSync(file, "utf8");
  if (src.includes(MARK)) return;
  const rel = file.split(path.sep).join("/");
  if (SKIP.some((r) => r.test(rel))) return;
  let ast;
  try {
    ast = parse(src, { sourceType: "module", plugins: file.endsWith(".tsx") ? ["typescript", "jsx"] : ["typescript"] });
  } catch (e) { report.push(`${rel}: no se pudo parsear (${e.message}) — revisar a mano`); return; }

  const edits = []; // {s,e,t}
  const lineOf = (n) => n.loc.start.line;
  const note = (n, msg) => report.push(`${rel}:${lineOf(n)}  ${msg}`);
  let usesC = false, usesLazy = false, did = 0;
  const lazyTargets = new Set();

  const jsxAncestorsAccent = (p) => {
    let el = p.findParent((x) => x.isJSXElement());
    for (let i = 0; el && i < 4; i++) {
      const open = el.node.openingElement;
      const txt = open.attributes.filter((a) => a.type === "JSXAttribute" && /^(className|style)$/.test(a.name.name))
        .map((a) => src.slice(a.start, a.end)).join(" ");
      if (hasAccentBg(txt)) return true;
      if (tokensOf(txt).some((t) => NEUTRAL_BG.test(t.split(":").pop()) && t.includes("bg-") && !/transparent|black/.test(t))) return false;
      el = el.findParent((x) => x.isJSXElement());
    }
    return false;
  };

  const inFunction = (p) => !!p.getFunctionParent();

  const replaceColor = (p, token) => {
    const n = p.node;
    const isAttr = p.parent.type === "JSXAttribute";
    if (!inFunction(p)) {
      const top = p.findParent((x) => x.parentPath && x.parentPath.isProgram());
      const decl = top && (top.isVariableDeclaration() ? top.node.declarations : top.node.declaration?.declarations);
      const d = decl && decl.find((q) => q.init && q.init.start <= n.start && q.init.end >= n.end);
      if (!d || !["ObjectExpression", "CallExpression"].includes(d.init.type)) {
        note(n, `color ${src.slice(n.start, n.end)} a nivel de módulo: no se tocó (quedaría congelado). Conviértelo en función o usa C.${token} dentro del componente`);
        return;
      }
      lazyTargets.add(d);
    }
    edits.push({ s: n.start, e: n.end, t: isAttr ? `{C.${token}}` : `C.${token}` });
    usesC = true; totals.colors++; did++;
  };

  const handleWhite = (p, value) => {
    const n = p.node;
    let key = null;
    if (p.parent.type === "ObjectProperty" && p.parent.value === n) key = p.parent.key.name ?? p.parent.key.value;
    else if (p.parent.type === "JSXAttribute") key = p.parent.name.name;
    else return;
    if (!["color", "tintColor", "iconColor", "textColor"].includes(key)) return;
    if (p.parent.type === "ObjectProperty") {
      const obj = p.parentPath.parent;
      const bg = obj.properties.find((q) => q.key && (q.key.name === "backgroundColor") );
      if (bg) {
        if (bg.value.type === "StringLiteral") { if (!(isHex(bg.value.value) && HEX[norm(bg.value.value)])) return; }
        else return; // fondo dinámico: no sabemos
      }
      const holder = p.parentPath.parentPath.parent;
      const hk = holder?.type === "ObjectProperty" ? (holder.key.name ?? holder.key.value) : "";
      if (/btn|button|chip|pill|badge|primary|cta|accent|danger|save|confirm|fab/i.test(String(hk))) { note(n, `"${value}" conservado en '${hk}' (parece texto sobre color de acento)`); return; }
    }
    if (jsxAncestorsAccent(p)) return;
    replaceColor(p, "text");
  };

  const parentIsClassAttr = (p) => {
    const a = p.findParent((x) => x.isJSXAttribute());
    return a && /(^|[a-z])ClassName$|^className$/i.test(a.node.name.name || "") ? a : null;
  };

  const rewriteClasses = (body, offset, node, ancestorAccentFn, whole) => {
    // body: texto del literal; devuelve nuevo texto
    const accentHere = hasAccentBg(whole);
    let acc = null;
    return body.replace(/[\w:\-\[\]#\/.%!]+/g, (tok) => {
      if (tok.startsWith("dark:")) return tok;
      const idx = tok.lastIndexOf(":");
      const pre = idx >= 0 ? tok.slice(0, idx + 1) : "";
      let base = idx >= 0 ? tok.slice(idx + 1) : tok;
      let out = tok;
      if (CLS[base]) {
        if (base === "text-white") {
          if (accentHere) return tok;
          if (acc === null) acc = ancestorAccentFn();
          if (acc) return tok;
        }
        const light = pre + CLS[base];
        out = `${light} dark:${pre}${base}`;
        totals.classes++; did++;
        base = CLS[base]; // evita bump de fuente sobre el token de color
      }
      if (FONTS) {
        const t2 = pre + (FONT_CLS[base] ?? null);
        if (FONT_CLS[base] && out === tok) { totals.fonts++; did++; return t2; }
        const m = /^text-\[(\d+)px\]$/.exec(base);
        if (m && out === tok) { const v = +m[1]; if (v < 20) { totals.fonts++; did++; return `${pre}text-[${v + 2}px]`; } }
      }
      return out;
    });
  };

  const handleClassString = (p, start, end, rawBody, ancestorFn, whole) => {
    const nb = rewriteClasses(rawBody, start, p.node, ancestorFn, whole);
    if (nb !== rawBody) edits.push({ s: start, e: end, t: nb });
  };

  const looksLikeClasses = (s) => {
    const t = s.trim().split(/\s+/);
    return t.length >= 1 && t.every((x) => /^[\w:\-\[\]#\/.%!]+$/.test(x)) && t.some((x) => /^(\w+:)*(bg|text|border)-/.test(x));
  };

  traverse(ast, {
    // ---- fuentes y colores en objetos de estilo ----
    ObjectProperty(p) {
      if (!FONTS) return;
      const k = p.node.key.name ?? p.node.key.value;
      const v = p.node.value;
      if (k === "fontSize" && v.type === "NumericLiteral" && v.value < 24) {
        const nv = v.value <= 11 ? v.value + 2 : v.value + 2;
        edits.push({ s: v.start, e: v.end, t: String(nv) }); totals.fonts++; did++;
      }
    },
    StringLiteral(p) {
      const n = p.node, v = n.value;
      const parent = p.parent;
      if (parent.type === "ImportDeclaration" || parent.type === "ExportNamedDeclaration" || parent.type === "ExportAllDeclaration") return;
      if ((parent.type === "ObjectProperty" || parent.type === "ObjectMethod") && parent.key === n) return;
      if (parent.type === "TSLiteralType" || parent.type === "TSEnumMember") return;
      // 1) clases en className
      const cAttr = parentIsClassAttr(p);
      if (cAttr) {
        const whole = src.slice(cAttr.node.start, cAttr.node.end);
        handleClassString(p, n.start + 1, n.end - 1, src.slice(n.start + 1, n.end - 1), () => jsxAncestorsAccent(p), whole);
        return;
      }
      if (p.findParent((x) => x.isJSXAttribute()) && parent.type === "JSXAttribute" && !/^(color|tintColor|iconColor|placeholderTextColor|selectionColor|thumbColor|backgroundColor|borderColor)$/.test(parent.name.name)) return;
      // 2) colores hex
      if (isHex(v)) {
        const h = norm(v);
        if (WHITE.has(h) || h === "fff") return handleWhite(p, v);
        if (HEX[h]) return replaceColor(p, HEX[h]);
        if (lum(h) < 0.2 && h !== "000000") note(n, `color oscuro sin mapear ${v}`);
        return;
      }
      if (v === "white") return handleWhite(p, v);
      if (/rgba?\(\s*255\s*,\s*255\s*,\s*255/.test(v) || /^#ffffff[0-9a-f]{2}$/i.test(v)) { note(n, `blanco translúcido "${v}" — revisar en modo claro`); return; }
      // 3) clases fuera de JSX (variants, helpers)
      if (v.includes(" ") || /^(bg|text|border)-/.test(v)) {
        if (looksLikeClasses(v)) handleClassString(p, n.start + 1, n.end - 1, v, () => false, v);
      }
    },
    TemplateElement(p) {
      const a = parentIsClassAttr(p);
      if (!a) return;
      const whole = src.slice(a.node.start, a.node.end);
      handleClassString(p, p.node.start, p.node.end, src.slice(p.node.start, p.node.end), () => jsxAncestorsAccent(p), whole);
    },
    JSXAttribute(p) {
      // color=... con valores no-string no se tocan
    },
  });

  // ---- envolver objetos a nivel de módulo con lazy() ----
  for (const d of lazyTargets) {
    if (!d || !d.init) continue;
    const init = d.init;
    const ok = init.type === "ObjectExpression" || init.type === "CallExpression" || init.type === "ArrayExpression";
    if (!ok) { report.push(`${rel}:${lineOf(d)}  constante de módulo con colores (${init.type}) — convertir a función a mano`); continue; }
    if (init.type === "ArrayExpression") { report.push(`${rel}:${lineOf(d)}  array de módulo con colores — convertir a función a mano`); continue; }
    edits.push({ s: init.start, e: init.start, t: "lazy(() => (" });
    edits.push({ s: init.end, e: init.end, t: "))" });
    usesLazy = true; totals.lazy++;
  }

  if (!did) return;
  // ordenar de atrás hacia delante
  edits.sort((a, b) => b.s - a.s || b.e - a.e);
  let out = src;
  for (const ed of edits) out = out.slice(0, ed.s) + ed.t + out.slice(ed.e);

  const names = [usesC && "C", usesLazy && "lazy"].filter(Boolean);
  const alreadyImported = names.length && new RegExp(`from\\s+["']${IMPORT.replace(/[/.]/g, "\\$&")}["']`).test(out);
  let header = MARK + "\n";
  if (names.length && !alreadyImported) {
    const imports = [...ast.program.body].filter((x) => x.type === "ImportDeclaration");
    const line = `import { ${names.join(", ")} } from "${IMPORT}";\n`;
    if (imports.length) {
      const last = imports[imports.length - 1];
      // posición en el texto ya editado: los imports están antes de cualquier edición salvo casos raros
      const pos = last.end + edits.filter((e) => e.e <= last.end).reduce((a, e) => a + (e.t.length - (e.e - e.s)), 0);
      out = out.slice(0, pos) + "\n" + line.trimEnd() + out.slice(pos);
      out = header + out;
    } else out = header + line + out;
  } else out = header + out;

  totals.files++;
  if (!DRY) fs.writeFileSync(file, out);
  console.log(`${DRY ? "[dry] " : ""}✔ ${rel}`);
}

for (const f of walk(root)) processFile(f);

const text = [
  `# Reporte de migración de tema`, ``,
  `Archivos: ${totals.files} · colores: ${totals.colors} · clases: ${totals.classes} · fuentes: ${totals.fonts} · objetos lazy: ${totals.lazy}`, ``,
  `## Revisar a mano`, ``, ...(report.length ? report.map((r) => `- ${r}`) : ["- (nada)"]), ``,
].join("\n");
if (!DRY && totals.files > 0) fs.writeFileSync("theme-report.md", text);
console.log("\n" + text);
