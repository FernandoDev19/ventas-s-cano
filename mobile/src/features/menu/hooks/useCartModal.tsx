import {
  OrderItem,
  originalPriceOf,
  unitPriceOf,
} from "@/src/core/context/OrderContext";
import { Alert } from "react-native";
import { RecipesService } from "../../recipes/services/recipes.service";
import { SalesService } from "../../sales/services/sales.service";
import { SaleType } from "../../sales/types/sale.type";
import { ClientsService } from "../../clients/services/clients.service";
import { useEffect, useState } from "react";
import { PaymentMethodsType } from "@/src/shared/types/payment-methods.type";
import { ClientType } from "../../clients/types/client.type";
import { useContextOrder } from "@/src/shared/hooks/useContextOrder";
import { ProductsService } from "../../inventory/services/products.service";
import { PrinterService } from "@/src/shared/services/printer.service";
import { OrdersService } from "../../orders/services/orders.service";
import { SyncService } from "@/src/shared/services/sync.service";
import { TablesService, TableType } from "../../tables/services/tables.service";
import {
  buildInvoiceMessage,
  sendInvoiceViaWhatsApp,
} from "@/src/shared/helpers/whatsapp.helper";

export const useCartModal = (onSaleCreated: () => void) => {
  const {
    order,
    addToOrder,
    addRecipeToOrder,
    removeFromOrder,
    clearOrder,
    setItemPrice,
  } = useContextOrder();

  const totalItems = order.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrecio = order.reduce(
    (sum, item) => sum + unitPriceOf(item) * item.quantity,
    0,
  );

  const [clients, setClients] = useState<ClientType[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const [tables, setTables] = useState<TableType[]>([]);
  const [orderType, setOrderType] = useState<
    "comer_aqui" | "para_llevar" | "domicilio"
  >("comer_aqui");
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState<string>("");
  const [cashReceived, setCashReceived] = useState<string>("");

  const [isDebt, setIsDebt] = useState(false);
  const [note, setNote] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [amountDebt, setAmountDebt] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethodsType>("cash");
  const [debtDate, setDebtDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  const refreshClients = () => {
    ClientsService.getAll().then(setClients);
  };

  const [priceTarget, setPriceTarget] = useState<OrderItem | null>(null);
  const handleApplyPrice = (price: number | null) => {
    if (!priceTarget) return;
    const id =
      priceTarget.type === "product"
        ? priceTarget.product.id
        : priceTarget.recipe.id!;
    setItemPrice(
      id,
      priceTarget.type,
      price === originalPriceOf(priceTarget) ? null : price,
    );
    setPriceTarget(null);
  };

  useEffect(() => {
    if (modalVisible) {
      refreshClients();
      TablesService.getAll()
        .then(setTables)
        .catch(() => {});
      setAmountDebt(totalPrecio);
    }
  }, [modalVisible, totalPrecio]);

  const buildSale = (): SaleType => {
    const noteParts: string[] = [];

    if (orderType === "domicilio") {
      noteParts.push(`🛵 Domi: ${deliveryAddress.trim() || "Sin dirección"}`);
    } else if (orderType === "comer_aqui") {
      if (selectedTableId) {
        const mesa = tables.find((t) => t.id === selectedTableId);
        noteParts.push(`🍽️ Mesa ${mesa ? mesa.number_mesa : selectedTableId}`);
      } else {
        noteParts.push("🍽️ Comer aquí");
      }
    } else if (orderType === "para_llevar") {
      noteParts.push("🛍️ Para llevar");
    }

    if (note.trim()) {
      noteParts.push(note.trim());
    }

    const cleanCash = cashReceived.replace(/[^0-9]/g, "");
    if (paymentMethod === "cash" && cleanCash) {
      const numCash = Number(cleanCash);
      if (numCash >= totalPrecio) {
        noteParts.push(
          `(Paga: $${numCash.toLocaleString("es-CO")} - Cambio: $${(numCash - totalPrecio).toLocaleString("es-CO")})`,
        );
      }
    }

    return {
      total: totalPrecio,
      note: noteParts.join(" | "),
      is_debt: isDebt,
      debt_amount: isDebt ? (amountDebt > 0 ? amountDebt : totalPrecio) : 0,
      debt_date: isDebt ? debtDate.toISOString().split("T")[0] : null,
      payment_method: paymentMethod,
      client_id: selectedClientId,
    };
  };

  const handleCheckout = async (saleParam: SaleType, order: OrderItem[]) => {
    if (isSubmitting) return;

    if (!order || order.length === 0) {
      Alert.alert(
        "Orden vacía",
        "Agrega al menos un producto antes de continuar.",
      );
      return;
    }

    if (orderType === "domicilio" && !deliveryAddress.trim()) {
      Alert.alert(
        "Dirección requerida",
        "Por favor escribe la dirección de entrega para el domicilio.",
      );
      return;
    }

    // Siempre tomar client_id del estado del hook (no del parámetro snapshot)
    // para evitar problemas de closure stale o timing en React Native
    const sale: SaleType = { ...saleParam, client_id: selectedClientId };

    if (sale.is_debt && !sale.client_id) {
      Alert.alert(
        "Cliente requerido",
        "Debes asignar un cliente para poder registrar una venta fiada.",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const productItems = order.filter((i) => i.type === "product");
      const recipeItems = order.filter((i) => i.type === "recipe");

      // PRODUCTOS: Guardar en sale_products normalmente
      const productsToSave = productItems
        .map((o) => {
          if (o.type !== "product") return null as any;
          return {
            product_id: o.product.id,
            quantity: o.quantity,
            price: unitPriceOf(o),
          };
        })
        .filter(Boolean);

      // RECETAS: Se guardarán en sale_recipes
      const recipesToSave = recipeItems
        .map((o) => {
          if (o.type !== "recipe") return null as any;
          return {
            recipe_id: o.recipe.id,
            quantity: o.quantity,
            price: unitPriceOf(o),
          };
        })
        .filter(Boolean);

      // 1. Crear la venta local en SQLite (Paso obligatorio inicial)
      const createdSale = await SalesService.createSale(
        sale,
        productsToSave,
        recipesToSave,
      );

      // ⚙️ FUNCIÓN CENTRAL: Ejecuta todo el cierre de la venta (Impresión, stock, limpiar UI)
      const finalizarFlujoVenta = async ({
        printKitchen,
      }: {
        printKitchen: boolean;
      }) => {
        // 🖨️ Impresión (sin bloquear UI)
        // try {
        //   const cajaConfig = await PrinterService.getConfig("caja");
        //   if (cajaConfig.enabled) {
        //     const displayItems = order.map((item) => ({
        //       quantity: item.quantity,
        //       name:
        //         item.type === "product" ? item.product.name : item.recipe.name,
        //       price:
        //         item.type === "product"
        //           ? item.product.price
        //           : item.recipe.selling_price,
        //     }));

        //     let clientName = "";
        //     if (sale.client_id) {
        //       const clientObj = clients.find((c) => c.id === sale.client_id);
        //       if (clientObj) clientName = clientObj.name;
        //     }

        //     const printerSaleObj = {
        //       ...createdSale,
        //       client_name: clientName,
        //       payment_method: sale.payment_method,
        //       note: sale.note,
        //     };

        //     const ticketCmds = PrinterService.generateCajaTicket(
        //       printerSaleObj,
        //       displayItems,
        //     );
        //     await PrinterService.print("caja", ticketCmds);
        //   }

        // } catch (printErr) {
        //   console.error("Error al mandar a imprimir desde checkout:", printErr);
        // }

        if (printKitchen) {
          try {
            const cocinaConfig = await PrinterService.getConfig("cocina");
            if (cocinaConfig.enabled) {
              const comandaItems = order.map((item) => ({
                quantity: item.quantity,
                name:
                  item.type === "product"
                    ? item.product.name
                    : item.recipe.name,
              }));

              let clientName = "";
              if (sale.client_id) {
                const clientObj = clients.find((c) => c.id === sale.client_id);
                if (clientObj) clientName = clientObj.name;
              }

              const mesaObj = selectedTableId
                ? tables.find((t) => t.id === selectedTableId)
                : null;
              const comandaObj = {
                id: createdSale.id,
                delivery_type:
                  orderType === "domicilio" ? "domicilio" : "local",
                delivery_address:
                  orderType === "domicilio" ? deliveryAddress.trim() : "",
                customer_name:
                  clientName ||
                  (orderType === "comer_aqui" && mesaObj
                    ? `Mesa ${mesaObj.number_mesa}`
                    : "Caja Local"),
                note: sale.note,
              };

              const kitchenCmds = PrinterService.generateCocinaComanda(
                comandaObj,
                comandaItems,
              );
              await PrinterService.print("cocina", kitchenCmds);
            }
          } catch (printErr) {
            console.error("Error imprimiendo comanda:", printErr);
          }
        }

        // Deducir stock de ingredientes de las recetas
        for (const item of recipeItems) {
          if (item.type !== "recipe") continue;
          await RecipesService.deductStock(item.recipe.id!, item.quantity);
        }

        onSaleCreated();

        // Verificar stock bajo (en paralelo para no bloquear)
        const lowStockAlerts: string[] = [];
        await Promise.all([
          ...productItems.map(async (item) => {
            if (item.type !== "product") return;
            const prod = await ProductsService.getProductById(item.product.id);
            if (prod && prod.stock <= 10) {
              lowStockAlerts.push(`${prod.name} (Quedan: ${prod.stock})`);
            }
          }),
          ...recipeItems.map(async (item) => {
            if (item.type !== "recipe") return;
            const low = await RecipesService.checkLowStock(item.recipe.id!);
            for (const l of low) {
              lowStockAlerts.push(`${l.name} (Quedan: ${l.stock})`);
            }
          }),
        ]);

        // ✅ Limpiar carrito y cerrar modal ANTES de cualquier alert
        setIsSubmitting(false);
        clearOrder();
        setIsDebt(false);
        setAmountDebt(0);
        setNote("");
        setOrderType("comer_aqui");
        setSelectedTableId(null);
        setDeliveryAddress("");
        setCashReceived("");
        setPaymentMethod("cash");
        setModalVisible(false);
        setSelectedClientId(null);
        setDebtDate(() => {
          const d = new Date();
          d.setDate(d.getDate() + 7);
          return d;
        });

        // Sincronizar en segundo plano
        SyncService.run().catch((e) =>
          console.warn("Error sync tras crear venta:", e),
        );

        // ─── Post-cierre: alertas informativas ────────────────
        // 1. Stock bajo (si hay)
        if (lowStockAlerts.length > 0) {
          Alert.alert(
            "⚠️ Stock Bajo",
            lowStockAlerts.map((a) => `• ${a}`).join("\n"),
          );
        }

        // 2. WhatsApp solo si hay cliente con teléfono
        if (sale.client_id) {
          const clientObj = clients.find((c) => c.id === sale.client_id);
          if (clientObj?.phone?.trim()) {
            const invoiceItems = order.map((item) => ({
              name:
                item.type === "product" ? item.product.name : item.recipe.name,
              quantity: item.quantity,
              price: unitPriceOf(item),
            }));

            const msg = buildInvoiceMessage({
              customerName: clientObj.name,
              items: invoiceItems,
              total: totalPrecio,
              paymentMethod: sale.payment_method,
              note: sale.note,
            });

            Alert.alert(
              "📱 Enviar factura",
              `¿Enviar por WhatsApp a ${clientObj.phone}?`,
              [
                { text: "No, gracias", style: "cancel" },
                {
                  text: "Enviar 📤",
                  onPress: () => sendInvoiceViaWhatsApp(clientObj.phone!, msg),
                },
              ],
            );
          }
        }
      };

      // 🚀 ENVÍO A SUPABASE (KDS)
      const enviarAlKDS = async () => {
        try {
          let nombreCliente = "Caja Local";
          let telefonoCliente = "";

          if (selectedClientId) {
            const clientObj = clients.find((c) => c.id === selectedClientId);
            if (clientObj) {
              nombreCliente = clientObj.name;
              telefonoCliente = clientObj.phone || "";
            }
          }

          const mesaObj = selectedTableId
            ? tables.find((t) => t.id === selectedTableId)
            : null;
          const orderId = await OrdersService.createOrderFromMobile({
            client_id: selectedClientId || null,
            customer_name: nombreCliente,
            customer_phone: telefonoCliente,
            delivery_address:
              orderType === "domicilio" ? deliveryAddress.trim() : "",
            table_id:
              orderType === "comer_aqui"
                ? (mesaObj?.number_mesa ?? selectedTableId)
                : null,
            total_price: totalPrecio,
            comments: sale.note || "Pedido desde App Móvil",
            status: "accepted",
            delivery_type:
              orderType === "domicilio"
                ? "domicilio"
                : orderType === "para_llevar"
                  ? "para_llevar"
                  : "local",
            order_items: order.map((item) => ({
              quantity: item.quantity,
              price_at_time: unitPriceOf(item),
              product_id: item.type === "product" ? item.product.id : null,
              recipe_id: item.type === "recipe" ? item.recipe.id : null,
            })),
          });

          if (orderId && createdSale.id) {
            await SalesService.linkToOrder(createdSale.id, orderId);
          }

          if (orderType === "comer_aqui" && selectedTableId) {
            TablesService.occupy(selectedTableId).catch(() => {});
          }

          await finalizarFlujoVenta({ printKitchen: true });
        } catch (orderErr) {
          console.error("Error enviando la comanda digital al KDS:", orderErr);
          // Finalizar de todas formas (la venta ya está guardada local)
          await finalizarFlujoVenta({ printKitchen: true });
          Alert.alert(
            "⚠️ Aviso KDS",
            "La venta se registró, pero no se pudo enviar la comanda a cocina.",
          );
        }
      };

      // 🍳 Preguntar si se manda a cocina
      Alert.alert(
        "¿Enviar a Cocina? 🍳",
        "¿Este pedido requiere preparación en cocina?",
        [
          {
            text: "No, entrega directa",
            style: "cancel",
            onPress: () => finalizarFlujoVenta({ printKitchen: false }),
          },
          {
            text: "Sí, mandar a cocina 🔥",
            onPress: () => enviarAlKDS(),
          },
        ],
        { cancelable: false },
      );
    } catch (error: any) {
      setIsSubmitting(false);
      console.error(error);
      Alert.alert(
        "Error",
        `El pedido no ha podido ser creado, detalles: \n${error?.message}`,
      );
    }
  };

  const getItemLabel = (item: OrderItem) => {
    if (item.type === "product") return item.product.name;
    return `🍽 ${item.recipe.name}`;
  };

  const getItemImage = (item: OrderItem) => {
    if (item.type === "product") return item.product.image_url;
    return item.recipe.image_url;
  };

  const getItemPrice = (item: OrderItem) => unitPriceOf(item) * item.quantity;

  const handleIncrement = (item: OrderItem) => {
    if (item.type === "product") addToOrder(item.product);
    else addRecipeToOrder(item.recipe);
  };

  const handleDecrement = (item: OrderItem) => {
    if (item.type === "product") removeFromOrder(item.product.id, "product");
    else removeFromOrder(item.recipe.id!, "recipe");
  };

  return {
    buildSale,
    setPaymentMethod,
    setShowDatePicker,
    handleCheckout,
    getItemImage,
    getItemLabel,
    getItemPrice,
    handleIncrement,
    handleDecrement,
    setModalVisible,
    setDebtDate,
    setSelectedClientId,
    setIsDebt,
    setAmountDebt,
    setNote,
    clients,
    refreshClients,
    totalPrecio,
    totalItems,
    showDatePicker,
    modalVisible,
    order,
    selectedClientId,
    isDebt,
    debtDate,
    amountDebt,
    paymentMethod,
    note,
    isSubmitting,
    clearOrder,
    orderType,
    setOrderType,
    tables,
    selectedTableId,
    setSelectedTableId,
    deliveryAddress,
    setDeliveryAddress,
    cashReceived,
    setCashReceived,
    priceTarget,
    setPriceTarget,
    handleApplyPrice,
  };
};
