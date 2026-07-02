import { useEffect, useMemo, useRef, useState } from "react";
import { OrderPro } from "../types/order.type";
import { ORDER_STATUS_TAB, OrderStatusTabType } from "../types/status-tab.type";
import { OrdersService } from "../services/orders.service";
import { Alert, Linking, DeviceEventEmitter } from "react-native";
import { SalesService } from "../../sales/services/sales.service";
import { PrinterService } from "@/src/shared/services/printer.service";
import { OrderCardKDS } from "../components/OrderCardKDS";
import { supabase } from "@/src/core/config/supabase";
import { Audio } from "expo-av";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import { buildInvoiceMessage, sendInvoiceViaWhatsApp } from "@/src/shared/helpers/whatsapp.helper";

export const useOrders = (role?: "admin" | "kitchen" | "cashier") => {
  const [orders, setOrders] = useState<OrderPro[]>([]);
  const userRole = role || "cashier";
  const [activeTab, setActiveTab] = useState<OrderStatusTabType>(
    userRole === "kitchen" ? "accepted" : "pending",
  );
  const [loading, setLoading] = useState(false);

  const activeTabRef = useRef(activeTab);
  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  const orderStatusTab = useMemo(() => {
    if (userRole === "kitchen") {
      return ["accepted", "preparing"];
    }
    return Object.values(ORDER_STATUS_TAB);
  }, [userRole]);

  const cargarOrdenes = async (status: OrderStatusTabType) => {
    setLoading(true);
    const data = await OrdersService.getOrdersByStatus(status);
    setOrders(data);
    setLoading(false);
  };

  async function reproducirSonidAlerta() {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require("@/assets/sounds/alerta-notificacion.mp3"),
      );

      await sound.playAsync();

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (error) {
      console.error("Error al reproducir el sonido de alerta:", error);
    }
  }

  useEffect(() => {
    // ID único para que cada dispositivo mantenga su canal limpio sin pisarse
    const connectionId = Math.random().toString(36).substring(7);
    console.log(
      `🔌 Conectando canal Realtime [pedidos-${connectionId}] para el rol: ${userRole}`,
    );

    const channel = supabase
      .channel(`pedidos-global-${connectionId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        async (payload) => {
          console.log("⚡ EVENTO RECIBIDO EN REALTIME:", payload.eventType);
          const tabActual = activeTabRef.current;

          // 📥 CASO 1: Pedido nuevo en la Web -> Le suena a Caja/Admin siempre para asegurar el tiro
          if (payload.eventType === "INSERT" && userRole !== "kitchen") {
            console.log("📢 NUEVO PEDIDO WEB DETECTADO EN CAJA");
            cargarOrdenes(tabActual);
            await reproducirSonidAlerta();
            Alert.alert(
              "¡PEDIDO NUEVO!",
              `Llegó un pedido de ${payload.new.customer_name}.`,
            );
          }

          // 🍳 CASO 2: Caja aceptó el pedido -> Solo Cocina en pestaña accepted/preparing
          if (
            payload.eventType === "UPDATE" &&
            userRole === "kitchen" &&
            payload.new.kitchen_status === "pending" &&
            payload.old.kitchen_status !== "pending"
          ) {
            console.log("🍳 NUEVA COMANDA EN COCINA");
            await cargarOrdenes(tabActual);
            await reproducirSonidAlerta();
            Alert.alert(
              "¡NUEVA COMANDA! 🍳",
              `Preparar pedido para: ${payload.new.customer_name}`,
            );
          }

          // 🔔 CASO 3: Cocina terminó el plato -> Alerta de vuelta a Caja/Admin
          if (
            payload.eventType === "UPDATE" &&
            userRole !== "kitchen" &&
            payload.new.kitchen_status === "ready" &&
            payload.old.kitchen_status !== "ready"
          ) {
            console.log("🔔 PEDIDO LISTO PARA DESPACHAR");
            cargarOrdenes(tabActual);
            await reproducirSonidAlerta();
            Alert.alert(
              "¡Pedido Listo! 🧑‍🍳",
              `El pedido de ${payload.new.customer_name} ya está listo.`,
            );
          }

          // Para cualquier otro cambio de estado, refrescamos la pestaña actual
          if (payload.eventType === "UPDATE") {
            cargarOrdenes(tabActual);
          }
        },
      );

    // ◄ AJUSTE CLAVE: Escuchamos el estado de la suscripción para pillar si Supabase conecta
    channel.subscribe((status) => {
      console.log(`📡 ESTADO DEL CANAL [pedidos-${connectionId}]:`, status);
      if (status === "CHANNEL_ERROR") {
        console.error(
          "❌ Error de conexión en Realtime. Revisa las políticas o el SQL de Supabase.",
        );
      }
    });

    return () => {
      console.log(`🔌 Desconectando canal Realtime [pedidos-${connectionId}]`);
      supabase.removeChannel(channel);
    };
  }, [userRole]);

  useEffect(() => {
    // Forzamos a que cargue la pestaña que corresponde según el rol actual
    const pestañaReal = userRole === "kitchen" ? "accepted" : activeTab;

    cargarOrdenes(pestañaReal);

    const sub = DeviceEventEmitter.addListener("NUEVO_PEDIDO_DESDE_WEB", () => {
      // Usamos activeTabRef para asegurarnos de traer lo que el usuario está viendo en vivo
      cargarOrdenes(activeTabRef.current);
    });

    return () => sub.remove();
  }, [activeTab, userRole]);

  const handleCambiarEstado = async (
    orden: OrderPro,
    nuevoEstado: "accepted" | "preparing" | "ready" | "delivered" | "cancelled",
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
      } else if (nuevoEstado === "preparing") {
        await OrdersService.updateOrderStatus(orden.id, "preparing");
        Alert.alert("¡Preparando!", "El pedido ahora está en preparación.");
        cargarOrdenes(activeTab);
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
        if (userRole === "kitchen") {
          await OrdersService.updateOrderStatus(orden.id, "ready", "ready");
          Alert.alert(
            "¡Plato Listo!",
            "Se notificó a la caja que el pedido está preparado.",
          );
          cargarOrdenes(activeTab);
        } else {
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
        }
      } else {
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
      await OrdersService.updateOrderStatus(orden.id, "accepted", "pending");

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
      ]
    );
  };

  const handleReadyWithoutPrint = async (orden: OrderPro) => {
    try {
      await OrdersService.updateOrderStatus(orden.id, "ready");
      cargarOrdenes(activeTab);
      ofrecerFacturaWhatsApp(orden);
      Alert.alert(
        "Pedido listo",
        "El pedido fue marcado como listo para entregar.",
      );
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
          note: orden.comments || undefined,
          created_at: new Date(),
          table_id: orden.table_id,
        };

        const ticketCmds = PrinterService.generateCajaTicket(
          printerSaleObj,
          displayItems,
        );
        await PrinterService.print("caja", ticketCmds);
      }

      cargarOrdenes(activeTab);
      ofrecerFacturaWhatsApp(orden);
      Alert.alert(
        "Pedido listo",
        "El pedido fue marcado como listo y la cuenta fue impresa.",
      );
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
    orderStatusTab,
    userRole,
  };
};
