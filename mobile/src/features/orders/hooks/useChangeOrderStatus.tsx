import { Alert, Linking } from "react-native";
import { OrderPro } from "../types/order.type";
import { PrinterService } from "@/src/shared/services/printer.service";
import { OrdersService } from "../services/orders.service";
import { SalesService } from "../../sales/services/sales.service";
import {
  buildInvoiceMessage,
  sendInvoiceViaWhatsApp,
} from "@/src/shared/helpers/whatsapp.helper";
import { OrderStatusTabType } from "../types/status-tab.type";
import { TablesService } from "../../tables/services/tables.service";

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
  const updateOrderStatus = async (
    orderId: string,
    status: string,
    kStatus?: "pending" | "ready" | "unseen",
    cStatus?: "pending" | "accepted" | "rejected",
  ) => {
    await OrdersService.updateOrderStatus(orderId, status, kStatus, cStatus);
  };

  const ofrecerFacturaWhatsApp = (orden: OrderPro) => {
    if (!orden.customer_phone) return;
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
    Alert.alert(
      "¿Enviar factura por WhatsApp? 📱",
      `Se enviará la factura a ${orden.customer_phone}`,
      [
        { text: "No, gracias", style: "cancel" },
        {
          text: "Sí, enviar 📤",
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
    try {
      const handleAccept = async (
        tipoPago: "efectivo" | "transferencia" | "deuda",
      ) => {
        setLoading(true);
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

        Alert.alert(
          "¡Pedido Aceptado!",
          "Pasó a la cocina e ingresó a las finanzas locales.",
        );
        cargarOrdenes(activeTab);
      };

      Alert.alert(
        "Método de Pago",
        "¿Cómo se registrará el ingreso de este pedido de la web?",
        [
          { text: "💵 Efectivo", onPress: () => handleAccept("efectivo") },
          {
            text: "📱 Transferencia",
            onPress: () => handleAccept("transferencia"),
          },
          {
            text: "📝 Fiar (Deuda)",
            onPress: () => {
              if (!orden.client_id) {
                Alert.alert(
                  "Aviso",
                  "Esta orden no tiene un cliente enlazado.",
                );
                return;
              }
              handleAccept("deuda");
            },
          },
          { text: "Cancelar", style: "cancel" },
        ],
      );
    } catch (error) {
      Alert.alert(
        "Error crítico",
        "No se pudo sincronizar con la base de datos local. \n" +
          (error as Error).message,
      );
    } finally {
      setLoading(false);
    }
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
    }

    if (userRole === "admin") {
      Alert.alert(
        "¿Despachar Pedido? 🍔",
        "¿El plato ya está listo para salir al cliente?",
        [
          {
            text: "Sí, entregar e imprimir cuenta",
            onPress: async () => {
              // Actualizamos el estado de la orden a LISTO y el del KDS a READY en un solo tiro
              await updateOrderStatus(orden.id, "ready", "ready");
              await handlePrintCashierTicket(orden);
              cargarOrdenes(activeTab);
              ofrecerFacturaWhatsApp(orden);
            },
          },
          {
            text: "Solo marcar como Listo (Sin imprimir)",
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
    const handleReadyWithoutPrint = async (orden: OrderPro) => {
      try {
        await updateOrderStatus(orden.id, "delivered");

        if (orden.delivery_type === "mesa" && orden.table_id) {
          await TablesService.release(orden.table_id);
        }

        cargarOrdenes(activeTab);
        ofrecerFacturaWhatsApp(orden);
      } catch {
        Alert.alert("Error", "No se pudo actualizar el estado.");
      }
    };

    const handleReadyWithPrint = async (orden: OrderPro) => {
      try {
        await updateOrderStatus(orden.id, "delivered");
        await handlePrintCashierTicket(orden);
        cargarOrdenes(activeTab);
        ofrecerFacturaWhatsApp(orden);
      } catch {
        Alert.alert("Error", "No se pudo completar la operación.");
      }
    };

    await updateOrderStatus(orden.id, "delivered");

    Alert.alert(
      "¿Listo para servir?",
      "¿Deseas imprimir la cuenta en la caja ahora?",
      [
        {
          text: "No, después",
          onPress: () => handleReadyWithoutPrint(orden),
        },
        {
          text: "Sí, imprimir cuenta",
          onPress: () => handleReadyWithPrint(orden),
        },
        { text: "Cancelar", style: "cancel" },
      ],
    );

    cargarOrdenes(activeTab);
  };

  const handleCancelled = async (orden: OrderPro) => {
    Alert.alert(
      "Rechazar Pedido",
      "¿Quieres avisarle al cliente por WhatsApp el motivo del rechazo?",
      [
        {
          text: "Sí, avisar y rechazar",
          onPress: async () => {
            await updateOrderStatus(
              orden.id,
              "cancelled",
              undefined,
              "rejected",
            );
            await revertirVentaSiExiste(orden.id);

            const mensaje = `¡Hola ${orden.customer_name}! Te hablamos de Sabor Espress. Lamentablemente no pudimos aceptar tu pedido en este momento...`;
            const url = `https://wa.me/57${orden.customer_phone}?text=${encodeURIComponent(mensaje)}`;
            await Linking.openURL(url).catch(() =>
              console.log("No se pudo abrir WhatsApp"),
            );
            cargarOrdenes(activeTab);
          },
        },
        {
          text: "Solo rechazar",
          onPress: async () => {
            await updateOrderStatus(
              orden.id,
              "cancelled",
              undefined,
              "rejected",
            );
            await revertirVentaSiExiste(orden.id);
            cargarOrdenes(activeTab);
          },
        },
        { text: "Cancelar", style: "cancel" },
      ],
    );
  };

  return {
    handleCambiarEstado,
    handleAcceptOrder,
    handlePrintCashierTicket,
  };
};
