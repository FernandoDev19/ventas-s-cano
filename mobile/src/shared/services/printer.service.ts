import AsyncStorage from "@react-native-async-storage/async-storage";

export interface PrintCommand {
  type: "text" | "line" | "cut" | "feed";
  text?: string;
  align?: "left" | "center" | "right";
  bold?: boolean;
  size?: "normal" | "large" | "title";
  lines?: number;
}

export interface PrinterConfig {
  enabled: boolean;
  type: "mock" | "wifi" | "bluetooth" | "usb";
  address: string; // IP para wifi, MAC para bluetooth, puerto para usb
  port: number; // para wifi (default 9100)
}

const STORAGE_KEYS = {
  caja: "fastpos:printer:caja",
  cocina: "fastpos:printer:cocina",
};

const DEFAULT_CONFIGS: Record<"caja" | "cocina", PrinterConfig> = {
  caja: {
    enabled: true,
    type: "mock",
    address: "192.168.1.100",
    port: 9100,
  },
  cocina: {
    enabled: true,
    type: "mock",
    address: "192.168.1.101",
    port: 9100,
  },
};

type PrintListener = (target: "caja" | "cocina", commands: PrintCommand[]) => void;
const printListeners = new Set<PrintListener>();

export const PrinterService = {
  // ─── CONFIGURATION MANAGEMENT ───────────────────────────
  async getConfig(target: "caja" | "cocina"): Promise<PrinterConfig> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS[target]);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error(`Error al cargar config de impresora ${target}:`, e);
    }
    return DEFAULT_CONFIGS[target];
  },

  async saveConfig(target: "caja" | "cocina", config: PrinterConfig): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS[target], JSON.stringify(config));
    } catch (e) {
      console.error(`Error al guardar config de impresora ${target}:`, e);
    }
  },

  // ─── VIRTUAL PRINTER LISTENER ───────────────────────────
  subscribe(listener: PrintListener) {
    printListeners.add(listener);
    return () => {
      printListeners.delete(listener);
    };
  },

  notifyVirtualPrint(target: "caja" | "cocina", commands: PrintCommand[]) {
    printListeners.forEach((l) => l(target, commands));
  },

  // ─── PRINT EXECUTION ───────────────────────────────────
  async print(target: "caja" | "cocina", commands: PrintCommand[]): Promise<boolean> {
    const config = await this.getConfig(target);
    if (!config.enabled) {
      console.log(`[Printer] Impresora ${target} desactivada.`);
      return false;
    }

    console.log(`[Printer] Imprimiendo en ${target} (${config.type})`);

    if (config.type === "mock") {
      this.notifyVirtualPrint(target, commands);
      return true;
    }

    if (config.type === "wifi") {
      // Simular intento de socket
      console.log(`[Printer] Enviando comandos a red: ${config.address}:${config.port}`);
      // En una compilación real con react-native-tcp-socket se usaría:
      // const socket = TcpSocket.createConnection({ port: config.port, host: config.address });
      // socket.write(this.buildRawEscPos(commands));
      this.notifyVirtualPrint(target, commands);
      return true;
    }

    // Bluetooth / USB se simulan o delegan en consola y modal para testing
    console.log(`[Printer] Impresión física no configurada para ${config.type}. Redirigiendo a virtual.`);
    this.notifyVirtualPrint(target, commands);
    return true;
  },

  // ─── COMMAND CONSTRUCTORS ──────────────────────────────
  text(text: string, align: "left" | "center" | "right" = "left", bold = false, size: "normal" | "large" | "title" = "normal"): PrintCommand {
    return { type: "text", text, align, bold, size };
  },

  line(): PrintCommand {
    return { type: "line" };
  },

  feed(lines = 1): PrintCommand {
    return { type: "feed", lines };
  },

  cut(): PrintCommand {
    return { type: "cut" };
  },

  // ─── TICKET GENERATORS ─────────────────────────────────
  generateCajaTicket(sale: any, items: any[]): PrintCommand[] {
    const cmds: PrintCommand[] = [];
    
    // Header
    cmds.push(this.text("SABOR EXPRESS", "center", true, "title"));
    cmds.push(this.text("Comida Rápida y Deliciosa", "center", false, "normal"));
    cmds.push(this.text("Nit: 123456789-0", "center", false, "normal"));
    cmds.push(this.text("Calle Falsa 123, Localidad", "center", false, "normal"));
    cmds.push(this.line());

    // Info de la Venta
    const dateStr = sale.created_at ? new Date(sale.created_at).toLocaleString("es-CO") : new Date().toLocaleString("es-CO");
    cmds.push(this.text(`Ticket: #${String(sale.id || "NUEVO").padStart(6, "0")}`));
    cmds.push(this.text(`Fecha: ${dateStr}`));
    if (sale.client_name || sale.client_id) {
      cmds.push(this.text(`Cliente: ${sale.client_name || "Cliente Registrado"}`));
    }
    cmds.push(this.text(`Pago: ${sale.payment_method === "cash" ? "Efectivo 💵" : sale.payment_method === "transfer" ? "Transferencia 📱" : "Fiado (Deuda) 📝"}`));
    cmds.push(this.line());

    // Detalle de Items
    cmds.push(this.text("CANT  PRODUCTO             TOTAL", "left", true));
    cmds.push(this.line());

    items.forEach((item) => {
      const qtyStr = String(item.quantity).padEnd(5, " ");
      const nameStr = (item.name || item.product?.name || item.recipe?.name || "Producto").substring(0, 19).padEnd(20, " ");
      const totalItem = Number(item.price || (item.product?.price || item.recipe?.selling_price || 0) * item.quantity);
      const totalStr = `$${totalItem.toLocaleString("es-CO")}`.padStart(7, " ");
      cmds.push(this.text(`${qtyStr}${nameStr}${totalStr}`));
    });

    cmds.push(this.line());

    // Totales
    cmds.push(this.text(`TOTAL: $${Number(sale.total).toLocaleString("es-CO")}`, "right", true, "large"));

    if (sale.is_debt) {
      cmds.push(this.text(`Deuda pendiente: $${Number(sale.debt_amount || sale.total).toLocaleString("es-CO")}`, "right", true));
      if (sale.debt_date) {
        cmds.push(this.text(`Fecha límite: ${sale.debt_date}`, "right"));
      }
    }
    
    if (sale.note) {
      cmds.push(this.line());
      cmds.push(this.text("Nota:", "left", true));
      cmds.push(this.text(sale.note));
    }

    cmds.push(this.line());
    cmds.push(this.text("¡Gracias por tu compra!", "center", true));
    cmds.push(this.text("Vuelve pronto 🍕🍔", "center"));
    cmds.push(this.feed(3));
    cmds.push(this.cut());

    return cmds;
  },

  generateCocinaComanda(order: any, items: any[]): PrintCommand[] {
    const cmds: PrintCommand[] = [];

    // Header de cocina
    cmds.push(this.text("=== COMANDA KITCHEN ===", "center", true, "large"));
    
    const idStr = order.id ? `#${String(order.id).substring(0, 6)}` : "MESA / LOCAL";
    cmds.push(this.text(`Pedido: ${idStr}`, "center", true, "large"));
    cmds.push(this.text(`Tipo: ${order.delivery_type === "domicilio" ? "DOMICILIO 🛵" : "MESA / LOCAL 🍽"}`, "center", true, "large"));
    
    cmds.push(this.line());
    const dateStr = new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
    cmds.push(this.text(`Hora: ${dateStr}`, "left", true));
    cmds.push(this.text(`Cliente: ${order.customer_name || "Mesa"}`));
    if (order.customer_phone) {
      cmds.push(this.text(`Tel: ${order.customer_phone}`));
    }
    if (order.delivery_address) {
      cmds.push(this.text(`Dirección: ${order.delivery_address}`));
    }
    cmds.push(this.line());

    // Ítems a preparar (Platos / Recetas y productos)
    cmds.push(this.text("CANT   PRODUCTO / PLATO", "left", true, "large"));
    cmds.push(this.line());

    items.forEach((item) => {
      const qtyStr = `${item.quantity}x`.padEnd(6, " ");
      const name = item.name || item.products?.name || item.recipes?.name || item.product?.name || item.recipe?.name || "Producto";
      cmds.push(this.text(`${qtyStr}${name}`, "left", true, "large"));
    });

    if (order.comments || order.note) {
      cmds.push(this.line());
      cmds.push(this.text("OBSERVACIONES:", "left", true));
      cmds.push(this.text(order.comments || order.note || "", "left", false, "normal"));
    }

    cmds.push(this.line());
    cmds.push(this.feed(3));
    cmds.push(this.cut());

    return cmds;
  },

  // ─── CONVERT COMMAND TO RAW ESC/POS BYTES ──────────────
  buildRawEscPos(commands: PrintCommand[]): Uint8Array {
    const buffer: number[] = [];
    
    // ESC/POS Commands
    const ESC = 0x1B;
    const GS = 0x1D;

    // Initialize: ESC @
    buffer.push(ESC, 0x40);

    commands.forEach((cmd) => {
      switch (cmd.type) {
        case "text": {
          if (!cmd.text) break;
          // Align: ESC a n (0=left, 1=center, 2=right)
          const alignVal = cmd.align === "center" ? 1 : cmd.align === "right" ? 2 : 0;
          buffer.push(ESC, 0x61, alignVal);

          // Bold: ESC E n (1=bold, 0=normal)
          buffer.push(ESC, 0x45, cmd.bold ? 1 : 0);

          // Size: GS ! n
          // Normal: 0x00, Large (Double width/height): 0x11, Title: 0x22
          let sizeVal = 0x00;
          if (cmd.size === "large") sizeVal = 0x11;
          if (cmd.size === "title") sizeVal = 0x22;
          buffer.push(GS, 0x21, sizeVal);

          // Escribir texto codificado (ASCII sencillo / Latin1 para tildes si es soportado)
          for (let i = 0; i < cmd.text.length; i++) {
            const code = cmd.text.charCodeAt(i);
            // Reemplazos simples de caracteres no ASCII
            if (code > 127) {
              // Reemplazar tildes comunes
              const char = cmd.text[i];
              const map: Record<string, number> = {
                á: 0xA0, é: 0x82, í: 0xA1, ó: 0xA2, ú: 0xA3,
                Á: 0x41, É: 0x45, Í: 0x49, Ó: 0x4F, Ú: 0x55,
                ñ: 0xA4, Ñ: 0xA5,
              };
              buffer.push(map[char] || 0x3F); // 0x3F = '?'
            } else {
              buffer.push(code);
            }
          }
          // New line
          buffer.push(10); // LF
          break;
        }
        case "line": {
          // ESC a 0 (left)
          buffer.push(ESC, 0x61, 0);
          buffer.push(ESC, 0x45, 0); // normal
          buffer.push(GS, 0x21, 0); // normal size
          const lineStr = "-".repeat(32); // Para papel de 58mm (aprox 32 chars)
          for (let i = 0; i < lineStr.length; i++) {
            buffer.push(lineStr.charCodeAt(i));
          }
          buffer.push(10); // LF
          break;
        }
        case "feed": {
          const lines = cmd.lines || 1;
          for (let i = 0; i < lines; i++) {
            buffer.push(10);
          }
          break;
        }
        case "cut": {
          // Paper cut: GS V 66 0
          buffer.push(GS, 0x56, 66, 0);
          break;
        }
      }
    });

    return new Uint8Array(buffer);
  },
};
