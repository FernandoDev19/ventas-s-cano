import { useEffect, useState } from "react";
import { OrderPro } from "../types/order.type";
import { OrderStatusTabType } from "../types/status-tab.type";
import { OrdersService } from "../services/orders.service";
import { Alert, Linking, DeviceEventEmitter } from "react-native";
import { SalesService } from "../../sales/services/sales.service";
import { PrinterService } from "@/src/shared/services/printer.service";
import { OrderCardKDS } from "../components/OrderCardKDS";

export const useOrders = () => {
  const [orders, setOrders] = useState<OrderPro[]>([]);
  const [activeTab, setActiveTab] = useState<OrderStatusTabType>("pending");
  const [loading, setLoading] = useState(false);

  const cargarOrdenes = async (status: OrderStatusTabType) => {
    setLoading(true);
    const data = await OrdersService.getOrdersByStatus(status);
    setOrders(data);
    setLoading(false);
  };

  useEffect(() => {
    cargarOrdenes(activeTab);

    const sub = DeviceEventEmitter.addListener("NUEVO_PEDIDO_DESDE_WEB", () => {
      cargarOrdenes(activeTab);
    });

    return () => sub.remove();
  }, [activeTab]);

  const handleCambiarEstado = async (
    orden: OrderPro,
    nuevoEstado: "accepted" | "ready" | "delivered" | "cancelled",
  ) => {
    try {
      if (nuevoEstado === "accepted") {
        Alert.alert(
          "Método de Pago",
          "¿Cómo se registrará el ingreso de este pedido de la web?",
          [
            {
              text: "💵 Efectivo",
              onPress: () => handleAcceptOrder(orden, "efectivo"),
            },
            {
              text: "📱 Transferencia",
              onPress: () => handleAcceptOrder(orden, "transferencia"),
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
                handleAcceptOrder(orden, "deuda");
              },
            },
            { text: "Cancelar", style: "cancel" },
          ],
        );
      } else if (nuevoEstado === "cancelled") {
        Alert.alert(
          "Rechazar Pedido",
          "¿Quieres avisarle al cliente por WhatsApp el motivo del rechazo?",
          [
            {
              text: "Sí, avisar y rechazar",
              onPress: async () => {
                await OrdersService.updateOrderStatus(orden.id, "cancelled");
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
                await OrdersService.updateOrderStatus(orden.id, "cancelled");
                cargarOrdenes(activeTab);
              },
            },
            { text: "Cancelar", style: "cancel" },
          ],
        );
      } else if (nuevoEstado === "ready") {
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
      } else {
        // Maneja 'ready' y 'delivered' de golpe
        await OrdersService.updateOrderStatus(orden.id, nuevoEstado);
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

  const handleAcceptOrder = async (
    orden: OrderPro,
    tipoPago: "efectivo" | "transferencia" | "deuda",
  ) => {
    try {
      setLoading(true);
      await SalesService.crearVentaDesdeOrdenWeb(orden, tipoPago);
      await OrdersService.updateOrderStatus(orden.id, "accepted");

      try {
        // const cajaConfig = await PrinterService.getConfig("caja");
        // if (cajaConfig.enabled) {
        //   const displayItems = orden.order_items.map((item) => ({
        //     quantity: item.quantity,
        //     name: item.products?.name || item.recipes?.name || "Producto",
        //     price: item.price_at_time,
        //   }));

        //   const printerSaleObj = {
        //     id: orden.id,
        //     total: orden.total_price,
        //     is_debt: tipoPago === "deuda",
        //     debt_amount: tipoPago === "deuda" ? orden.total_price : 0,
        //     payment_method: tipoPago,
        //     client_name: orden.customer_name,
        //     note: orden.comments,
        //     created_at: new Date(),
        //   };

        //   const ticketCmds = PrinterService.generateCajaTicket(
        //     printerSaleObj,
        //     displayItems,
        //   );
        //   await PrinterService.print("caja", ticketCmds);
        // }

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

  const handleReadyWithoutPrint = async (orden: OrderPro) => {
    try {
      await OrdersService.updateOrderStatus(orden.id, "ready");

      Alert.alert(
        "Pedido listo",
        "El pedido fue marcado como listo para entregar.",
      );

      cargarOrdenes(activeTab);
    } catch (error) {
      Alert.alert(
        "Error",
        "No se pudo actualizar el estado: " + (error as Error).message,
      );
    }
  };

  const handleReadyWithPrint = async (orden: OrderPro) => {
    try {
      await OrdersService.updateOrderStatus(orden.id, "ready");

      const cajaConfig = await PrinterService.getConfig("caja");

      if (cajaConfig.enabled) {
        const displayItems = orden.order_items.map((item) => ({
          quantity: item.quantity,
          name: item.products?.name || item.recipes?.name || "Producto",
          price: item.price_at_time,
        }));

        const printerSaleObj = {
          id: orden.id,
          total: orden.total_price,
          client_name: orden.customer_name,
          note: orden.comments,
          created_at: new Date(),
        };

        const ticketCmds = PrinterService.generateCajaTicket(
          printerSaleObj,
          displayItems,
        );

        await PrinterService.print("caja", ticketCmds);
      }

      Alert.alert(
        "Pedido listo",
        "El pedido fue marcado como listo y la cuenta fue impresa.",
      );

      cargarOrdenes(activeTab);
    } catch (error) {
      Alert.alert(
        "Error",
        "No se pudo completar la operación: " + (error as Error).message,
      );
    }
  };

  const abrirWhatsAppCliente = (telefono: string, nombre: string) => {
    const mensaje = `¡Hola ${nombre}! Te hablamos de Sabor Espress. Tu pedido fue recibido...`;
    const url = `https://wa.me/57${telefono}?text=${encodeURIComponent(mensaje)}`;
    Linking.openURL(url).catch(() =>
      Alert.alert("Error", "No se pudo abrir WhatsApp."),
    );
  };

  const renderOrderItem = ({ item }: { item: OrderPro }) => (
    <OrderCardKDS
      item={item}
      onAccionEstado={(nuevoEstado) =>
        handleCambiarEstado(item, nuevoEstado as any)
      }
      onChatCliente={() =>
        abrirWhatsAppCliente(item.customer_phone, item.customer_name)
      }
    />
  );

  return {
    orders,
    loading,
    renderOrderItem,
    setActiveTab,
    activeTab,
  };
};
