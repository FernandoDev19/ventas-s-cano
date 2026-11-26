import { useEffect, useMemo, useRef, useState } from "react";
import { OrderPro } from "../types/order.type";
import { ORDER_STATUS_TAB, OrderStatusTabType } from "../types/status-tab.type";
import { OrdersService } from "../services/orders.service";
import { Alert, DeviceEventEmitter } from "react-native";
import { useChangeOrderStatus } from "./useChangeOrderStatus";
import { PrinterService } from "@/src/shared/services/printer.service";
import {
  buildOrderAcceptedMessage,
  getOrderPaymentPreference,
  sendInvoiceViaWhatsApp,
} from "@/src/shared/helpers/whatsapp.helper";
import { useSettings } from "@/src/core/context/SettingsContext";

export const useOrders = (role?: "admin" | "kitchen" | "cashier") => {
  const { nequiPaymentInfo } = useSettings();
  const [orders, setOrders] = useState<OrderPro[]>([]);
  const userRole = role || "cashier";
  const [activeTab, setActiveTab] = useState<OrderStatusTabType>("pending");
  const [loading, setLoading] = useState(false);

  const activeTabRef = useRef(activeTab);

  // useEffect
  useEffect(() => {
    if (userRole === "kitchen") {
      setActiveTab((prev) => (prev === "pending" ? "accepted" : prev));
    }
  }, [userRole]);

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  useEffect(() => {
    cargarOrdenes(activeTab);

    // ?
    const sub = DeviceEventEmitter.addListener("NUEVO_PEDIDO_DESDE_WEB", () => {
      cargarOrdenes(activeTabRef.current);
    });

    return () => sub.remove();
  }, [activeTab, userRole]);

  // useMemo
  const orderStatusTab = useMemo(() => {
    if (userRole === "kitchen") {
      return ["accepted", "preparing"];
    }
    return Object.values(ORDER_STATUS_TAB);
  }, [userRole]);

  // Functions
  const cargarOrdenes = async (status: OrderStatusTabType) => {
    setLoading(true);
    const data = await OrdersService.getOrdersByStatus(status);
    setOrders(data);
    setLoading(false);
  };

  const handlePrintCashierTicket = async (orden: OrderPro) => {
    try {
      const cajaConfig = await PrinterService.getConfig("caja");
      if (!cajaConfig.enabled) {
        Alert.alert("Aviso", "La impresora de caja está desactivada.");
        return false;
      }

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
      return true;
    } catch (error) {
      Alert.alert(
        "Error de Impresión",
        "No se pudo imprimir en caja: " + (error as Error).message,
      );
      return false;
    }
  };
  
  const { handleCambiarEstado } = useChangeOrderStatus({
    cargarOrdenes,
    activeTab,
    userRole,
    setLoading,
    handlePrintCashierTicket,
  });

  const abrirWhatsAppCliente = (
    telefono: string,
    nombre: string,
    orden?: OrderPro,
  ) => {
    const paymentPreference = getOrderPaymentPreference(orden?.comments);
    if (
      orden?.status === "accepted" &&
      paymentPreference === "nequi" &&
      !nequiPaymentInfo.trim()
    ) {
      Alert.alert(
        "Faltan datos de Nequi",
        "Configura la llave o el enlace al QR en Más > Datos de pago Nequi antes de avisar al cliente.",
      );
      return;
    }

    const mensaje =
      orden?.status === "accepted"
        ? buildOrderAcceptedMessage({
            customerName: nombre,
            orderId: orden.id,
            total: orden.total_price,
            nequiPaymentInfo:
              paymentPreference === "nequi"
                ? nequiPaymentInfo.trim()
                : undefined,
          })
        : `¡Hola ${nombre}! Te hablamos de Sabor Espress. Tu pedido fue recibido...`;
    void sendInvoiceViaWhatsApp(telefono, mensaje);
  };

  return {
    orders,
    loading,
    setActiveTab,
    activeTab,
    orderStatusTab,
    userRole,
    handleCambiarEstado,
    abrirWhatsAppCliente,
    handlePrintCashierTicket,
    cargarOrdenes,
  };
};
