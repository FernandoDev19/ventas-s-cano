import { OrderItem } from "@/src/core/context/OrderContext";
import { Alert, Linking } from "react-native";
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
import { buildInvoiceMessage, sendInvoiceViaWhatsApp } from "@/src/shared/helpers/whatsapp.helper";

export const useCartModal = (onSaleCreated: () => void) => {
  const { order, addToOrder, addRecipeToOrder, removeFromOrder, clearOrder } =
    useContextOrder();

  const totalItems = order.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrecio = order.reduce((sum, item) => {
    if (item.type === "product")
      return sum + item.product.price * item.quantity;
    if (item.type === "recipe")
      return sum + item.recipe.selling_price * item.quantity;
    return sum;
  }, 0);

  const [clients, setClients] = useState<ClientType[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const [isDebt, setIsDebt] = useState(false);
  const [note, setNote] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [amountDebt, setAmountDebt] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethodsType>("cash");
  const [debtDate, setDebtDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (modalVisible) {
      ClientsService.getAll().then(setClients);
      setAmountDebt(totalPrecio);
    }
  }, [modalVisible, totalPrecio]);

  const buildSale = (): SaleType => ({
    total: totalPrecio,
    note,
    is_debt: isDebt,
    debt_amount: isDebt ? (amountDebt > 0 ? amountDebt : totalPrecio) : 0,
    debt_date: isDebt ? debtDate.toISOString().split("T")[0] : null,
    payment_method: paymentMethod,
    client_id: isDebt ? selectedClientId : null,
  });


  const handleCheckout = async (sale: SaleType, order: OrderItem[]) => {
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
            price: o.product.price * o.quantity,
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
            price: o.recipe.selling_price * o.quantity,
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
      const finalizarFlujoVenta = async () => {
        // 🖨️ TUS IMPRESORAS INTACTAS
        try {
          const cajaConfig = await PrinterService.getConfig("caja");
          if (cajaConfig.enabled) {
            const displayItems = order.map((item) => ({
              quantity: item.quantity,
              name:
                item.type === "product" ? item.product.name : item.recipe.name,
              price:
                item.type === "product"
                  ? item.product.price
                  : item.recipe.selling_price,
            }));

            let clientName = "";
            if (sale.is_debt && sale.client_id) {
              const clientObj = clients.find((c) => c.id === sale.client_id);
              if (clientObj) clientName = clientObj.name;
            }

            const printerSaleObj = {
              ...createdSale,
              client_name: clientName,
              payment_method: sale.payment_method,
              note: sale.note,
            };

            const ticketCmds = PrinterService.generateCajaTicket(
              printerSaleObj,
              displayItems,
            );
            await PrinterService.print("caja", ticketCmds);
          }

          const cocinaConfig = await PrinterService.getConfig("cocina");
          if (cocinaConfig.enabled) {
            const comandaItems = order.map((item) => ({
              quantity: item.quantity,
              name:
                item.type === "product" ? item.product.name : item.recipe.name,
            }));

            let clientName = "";
            if (sale.is_debt && sale.client_id) {
              const clientObj = clients.find((c) => c.id === sale.client_id);
              if (clientObj) clientName = clientObj.name;
            }

            const comandaObj = {
              id: createdSale.id,
              delivery_type: "local",
              customer_name: clientName || "Caja Local",
              note: sale.note,
            };

            const kitchenCmds = PrinterService.generateCocinaComanda(
              comandaObj,
              comandaItems,
            );
            await PrinterService.print("cocina", kitchenCmds);
          }
        } catch (printErr) {
          console.error("Error al mandar a imprimir desde checkout:", printErr);
        }

        // Deducir stock de ingredientes de las recetas
        for (const item of recipeItems) {
          if (item.type !== "recipe") continue;
          await RecipesService.deductStock(item.recipe.id!, item.quantity);
        }

        onSaleCreated();

        // Verificar stock bajo
        const lowStockAlerts: string[] = [];
        for (const item of productItems) {
          if (item.type !== "product") continue;
          const prod = await ProductsService.getProductById(item.product.id);
          if (prod && prod.stock <= 10) {
            lowStockAlerts.push(`${prod.name} (Quedan: ${prod.stock})`);
          }
        }

        for (const item of recipeItems) {
          if (item.type !== "recipe") continue;
          const low = await RecipesService.checkLowStock(item.recipe.id!);
          for (const l of low) {
            lowStockAlerts.push(`${l.name} (Quedan: ${l.stock})`);
          }
        }

        // Limpiar el estado del carrito
        clearOrder();
        setIsDebt(false);
        setAmountDebt(0);
        setNote("");
        setModalVisible(false);
        setSelectedClientId(null);
        setDebtDate(() => {
          const d = new Date();
          d.setDate(d.getDate() + 7);
          return d;
        });

        // ─── WhatsApp ───────────────────────────────────────
        // Obtener el teléfono del cliente si existe
        let clientPhone = "";
        let clientName = "";
        if (sale.client_id) {
          const clientObj = clients.find((c) => c.id === sale.client_id);
          if (clientObj) {
            clientPhone = clientObj.phone || "";
            clientName = clientObj.name;
          }
        }

        if (clientPhone) {
          const invoiceItems = order.map((item) => ({
            name: item.type === "product" ? item.product.name : item.recipe.name,
            quantity: item.quantity,
            price:
              item.type === "product"
                ? item.product.price
                : item.recipe.selling_price,
          }));

          const msg = buildInvoiceMessage({
            customerName: clientName,
            items: invoiceItems,
            total: totalPrecio,
            paymentMethod: sale.payment_method,
            note: sale.note,
          });

          Alert.alert(
            "¿Enviar factura por WhatsApp? 📱",
            `Se enviará la factura a ${clientPhone}`,
            [
              { text: "No, gracias", style: "cancel" },
              {
                text: "Sí, enviar 📤",
                onPress: () => sendInvoiceViaWhatsApp(clientPhone, msg),
              },
            ]
          );
        }
        // ────────────────────────────────────────────────────

        // Alerta final de éxito o advertencia de inventario
        if (lowStockAlerts.length > 0) {
          Alert.alert(
            "¡Venta Completada!",
            `⚠️ ¡Alerta de Stock Bajo!\nLos siguientes productos tienen stock bajo:\n\n${lowStockAlerts.map((a) => `• ${a}`).join("\n")}`,
          );
        } else {
          Alert.alert("¡Venta registrada con éxito!");
        }
      };

      // 🚀 ENVÍO A SUPABASE (KDS)
      const enviarAlKDS = async () => {
        try {
          let nombreCliente = "Caja Local";
          if (sale.client_id) {
            const clientObj = clients.find((c) => c.id === sale.client_id);
            if (clientObj) nombreCliente = clientObj.name;
          }

          let telefonoCliente = "";
          if (sale.client_id) {
            const clientObj = clients.find((c) => c.id === sale.client_id);
            if (clientObj && clientObj.phone) telefonoCliente = clientObj.phone;
          }

          await OrdersService.createOrderFromMobile({
            customer_name: nombreCliente,
            customer_phone: telefonoCliente,
            total_price: totalPrecio,
            comments: sale.note || "Pedido desde App Móvil",
            status: "accepted",
            delivery_type: "local",
            order_items: order.map((item) => ({
              quantity: item.quantity,
              price_at_time:
                item.type === "product"
                  ? item.product.price
                  : item.recipe.selling_price,
              product_id: item.type === "product" ? item.product.id : null,
              recipe_id: item.type === "recipe" ? item.recipe.id : null,
            })),
          });

          // Cuando Supabase responde melo, cerramos el flujo completo
          await finalizarFlujoVenta();
        } catch (orderErr) {
          console.error("Error enviando la comanda digital al KDS:", orderErr);
          Alert.alert(
            "Error KDS",
            "La venta se guardó local, pero no se pudo avisar a la cocina. ¿Continuar con el cierre?",
            [{ text: "Forzar Cierre", onPress: () => finalizarFlujoVenta() }],
          );
        }
      };

      // 🛑 EL DISPARADOR CRONOLÓGICO: Primero la pregunta en pantalla
      Alert.alert(
        "¿Enviar a Cocina? 🍳",
        "¿Este pedido requiere preparación en la cocina o es entrega directa?",
        [
          {
            text: "No, entrega directa ❌",
            style: "cancel",
            onPress: () => finalizarFlujoVenta(), // Cierra de una e imprime
          },
          {
            text: "Sí, mandar a cocina 🔥",
            onPress: () => enviarAlKDS(), // Envía a Supabase y luego cierra
          },
        ],
        { cancelable: false },
      );
    } catch (error: any) {
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

  const getItemPrice = (item: OrderItem) => {
    if (item.type === "product") return item.product.price * item.quantity;
    return item.recipe.selling_price * item.quantity;
  };

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
  };
};
