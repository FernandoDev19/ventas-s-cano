import { Alert, Linking } from "react-native";
import { OrderPro } from "../types/order.type";
import { PrinterService } from "@/src/shared/services/printer.service";
import { OrdersService } from "../services/orders.service";
import { SalesService } from "../../sales/services/sales.service";
import {
  buildOrderAcceptedMessage,
  buildInvoiceMessage,
  getOrderPaymentPreference,
  sendInvoiceViaWhatsApp,
} from "@/src/shared/helpers/whatsapp.helper";
import { OrderStatusTabType } from "../types/status-tab.type";
import { TablesService } from "../../tables/services/tables.service";
import { useSettings } from "@/src/core/context/SettingsContext";

interface UseChangeOrderStatusProps {
  cargarOrdenes: (tab: OrderStatusTabType) => void;
  activeTab: OrderStatusTabType;
  userRole: string;
  setLoading: (loading: boolean) => void;
  handlePrintCashierTicket: (orden: OrderPro) => void;
}

export const useChangeOrderStatus = ({
  cargarOrdenes,
  activeTab,
  userRole,
  setLoading,
  handlePrintCashierTicket,
}: UseChangeOrderStatusProps) => {
  const { nequiPaymentInfo } = useSettings();

  const updateOrderStatus = async (
    orderId: string,
    status: string,
    kStatus?: "pending" | "ready" | "unseen",
    cStatus?: "pending" | "accepted" | "rejected",
  ) => {
    await OrdersService.updateOrderStatus(orderId, status, kStatus, cStatus);
  };

  const ofrecerFacturaWhatsApp = (orden: OrderPro) => {
    const invoiceItems = orden.order_items.map((item) => ({
      name: item.products?.name || item.recipes?.name || "Producto",
      quantity: item.quantity,
      price: item.price_at_time,
    }));
    const msg = buildInvoiceMessage({
      customerName: orden.customer_name,
      items: invoiceItems,
      total: orden.total_price,
    });

    const tieneTelefono = !!orden.customer_phone?.trim();

    Alert.alert(
      "¿Enviar factura por WhatsApp? 📱",
      tieneTelefono
        ? `Se enviará la factura a ${orden.customer_phone}`
        : "El pedido no cuenta con número telefónico registrado.",
      [
        { text: "No, gracias", style: "cancel" },
        {
          text: tieneTelefono ? "Sí, enviar 📤" : "Compartir por WhatsApp 📤",
          onPress: () => sendInvoiceViaWhatsApp(orden.customer_phone, msg),
        },
      ],
    );
  };

  const revertirVentaSiExiste = async (orderId: string) => {
    try {
      const reverted = await SalesService.cancelBySourceOrderId(
        orderId,
        "Orden cancelada desde KDS/Cocina",
      );
      if (reverted) {
        console.log(
          `↩️ Venta local revertida y stock restaurado para orden ${orderId}`,
        );
      }
    } catch (err) {
      console.error(
        "Error revirtiendo venta enlazada a la orden cancelada:",
        err,
      );
    }
  };

  /* *******************[ CHANGE ORDER STATUS ]********************** */

  const handleCambiarEstado = async (
    orden: OrderPro,
    nuevoEstado: "accepted" | "preparing" | "ready" | "delivered" | "cancelled",
  ) => {
    try {
      switch (nuevoEstado) {
        case "accepted":
          await handleAcceptOrder(orden);
          break;
        case "preparing":
          await handlePreparingOrder(orden);
          break;
        case "cancelled":
          await handleCancelled(orden);
          break;
        case "ready":
          await handleReady(orden);
          break;
        case "delivered":
          await handleDelivered(orden);
          break;
        default:
          await updateOrderStatus(orden.id, nuevoEstado);
          Alert.alert("¡Éxito!", `Pedido marcado como ${nuevoEstado}.`);
          cargarOrdenes(activeTab);
      }
    } catch (error) {
      Alert.alert(
        "Error",
        "No se pudo cambiar el estado: " + (error as Error).message,
      );
    }
  };

  const handleAcceptOrder = async (orden: OrderPro) => {
    const handleAccept = async (
      tipoPago: "efectivo" | "transferencia" | "deuda",
    ) => {
      setLoading(true);
      try {
        await SalesService.crearVentaDesdeOrdenWeb(orden, tipoPago);
        await updateOrderStatus(orden.id, "accepted", "pending", "accepted");

        try {
          const cocinaConfig = await PrinterService.getConfig("cocina");
          if (cocinaConfig.enabled) {
            const comandaItems = orden.order_items.map((item) => ({
              quantity: item.quantity,
              name: item.products?.name || item.recipes?.name || "Producto",
            }));

            const comandaObj = {
              id: orden.id,
              delivery_type: orden.delivery_type,
              customer_name: orden.table_id
                ? `MESA ${orden.table_id} - ${orden.customer_name}`
                : orden.customer_name,
              customer_phone: orden.customer_phone,
              delivery_address: orden.delivery_address,
              comments: orden.comments,
            };

            const kitchenCmds = PrinterService.generateCocinaComanda(
              comandaObj,
              comandaItems,
            );
            await PrinterService.print("cocina", kitchenCmds);
          }
        } catch (printErr) {
          console.error("Error al imprimir orden aceptada:", printErr);
        }

        cargarOrdenes(activeTab);

        const paymentPreference = getOrderPaymentPreference(orden.comments);
        if (paymentPreference === "nequi" && !nequiPaymentInfo.trim()) {
          Alert.alert(
            "Pedido aceptado",
            "Falta configurar la llave Nequi o el enlace al QR. Configúralo en Más > Datos de pago Nequi para incluirlo en WhatsApp.",
          );
          return;
        }

        if (!orden.customer_phone?.trim()) {
          Alert.alert(
            "Pedido aceptado",
            "El cliente no tiene teléfono registrado; no se pudo preparar el mensaje de WhatsApp.",
          );
          return;
        }

        const message = buildOrderAcceptedMessage({
          customerName: orden.customer_name,
          orderId: orden.id,
          total: orden.total_price,
          nequiPaymentInfo:
            paymentPreference === "nequi" ? nequiPaymentInfo.trim() : undefined,
        });
        await sendInvoiceViaWhatsApp(orden.customer_phone, message);
      } catch (error) {
        Alert.alert(
          "Error crítico",
          "No se pudo aceptar el pedido: " +
            (error instanceof Error ? error.message : String(error)),
        );
      } finally {
        setLoading(false);
      }
    };

    Alert.alert(
      "Método de Pago",
      "¿Cómo se registrará el ingreso de este pedido de la web?",
      [
        { text: "💵 Efectivo", onPress: () => void handleAccept("efectivo") },
        {
          text: "📱 Transferencia",
          onPress: () => void handleAccept("transferencia"),
        },
        {
          text: "📝 Fiar (Deuda)",
          onPress: () => {
            if (!orden.client_id) {
              Alert.alert("Aviso", "Esta orden no tiene un cliente enlazado.");
              return;
            }
            void handleAccept("deuda");
          },
        },
        { text: "Cancelar", style: "cancel" },
      ],
    );
  };

  const handlePreparingOrder = async (orden: OrderPro) => {
    await updateOrderStatus(orden.id, "preparing");
    Alert.alert("¡Preparando!", "El pedido ahora está en preparación.");
    cargarOrdenes(activeTab);
  };

  const handleReady = async (orden: OrderPro) => {
    if (userRole === "kitchen") {
      await updateOrderStatus(orden.id, "ready", "ready");
      Alert.alert(
        "¡Plato Listo!",
        "Se notificó a la caja que el pedido está preparado.",
      );
      cargarOrdenes(activeTab);
      return;
    }

    if (userRole === "admin") {
      // Textos dinámicos según tipo de entrega (Fix 5)
      const esMesa = orden.delivery_type === "mesa";
      const accionLabel = esMesa ? "Servir a la Mesa 🍽️" : "Despachar Domicilio 🛵";

      Alert.alert(
        accionLabel,
        esMesa
          ? "¿El plato ya está listo para servir en la mesa?"
          : "¿El pedido ya está listo para despachar al domicilio?",
        [
          {
            // Fix 3: entrega → estado "delivered" + liberar mesa
            text: "Sí, entregar",
            onPress: async () => {
              await updateOrderStatus(orden.id, "delivered", "ready");
              if (esMesa && orden.table_id) {
                await TablesService.release(orden.table_id);
              }
              // await handlePrintCashierTicket(orden);
              cargarOrdenes(activeTab);
              ofrecerFacturaWhatsApp(orden);
            },
          },
          {
            // Fix 3: solo marcar → estado "ready"
            text: "Solo marcar como listo",
            onPress: async () => {
              await updateOrderStatus(orden.id, "ready", "ready");
              cargarOrdenes(activeTab);
              ofrecerFacturaWhatsApp(orden);
            },
          },
          { text: "Cancelar", style: "cancel" },
        ],
      );
    }
  };

const handleDelivered = async (orden: OrderPro) => {
  await updateOrderStatus(orden.id, "delivered");
  if (orden.delivery_type === "mesa" && orden.table_id) {
    await TablesService.release(orden.table_id);
  }
  cargarOrdenes(activeTab);
  ofrecerFacturaWhatsApp(orden);   // si también te molesta, hazlo botón
};

  const handleCancelled = async (orden: OrderPro) => {
    const tienePhone = !!orden.customer_phone?.trim();

    // Fix 4: construir los botones condicionalmente
    const buttons: any[] = [];

    if (tienePhone) {
      buttons.push({
        text: "Sí, avisar y rechazar por WhatsApp",
        onPress: async () => {
          await updateOrderStatus(orden.id, "cancelled", undefined, "rejected");
          await revertirVentaSiExiste(orden.id);
          const mensaje = `¡Hola ${orden.customer_name}! Te hablamos de Sabor Espress. Lamentablemente no pudimos aceptar tu pedido en este momento...`;
          const url = `https://wa.me/57${orden.customer_phone}?text=${encodeURIComponent(mensaje)}`;
          await Linking.openURL(url).catch(() =>
            console.log("No se pudo abrir WhatsApp"),
          );
          cargarOrdenes(activeTab);
        },
      });
    }

    buttons.push({
      text: "Solo rechazar",
      onPress: async () => {
        await updateOrderStatus(orden.id, "cancelled", undefined, "rejected");
        await revertirVentaSiExiste(orden.id);
        cargarOrdenes(activeTab);
      },
    });

    buttons.push({ text: "Cancelar", style: "cancel" });

    Alert.alert(
      "Rechazar Pedido",
      tienePhone
        ? "¿Quieres avisarle al cliente por WhatsApp el motivo del rechazo?"
        : "¿Confirmas el rechazo de este pedido?",
      buttons,
    );
  };

  return {
    handleCambiarEstado,
    handleAcceptOrder,
    handlePrintCashierTicket,
  };
};
