import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";
import { OrderItemDetail, OrderPro } from "../types/order.type";
import { OrdersService } from "../services/orders.service";
import { SalesService } from "../../sales/services/sales.service";

type StatusTab = "pending" | "accepted" | "completed";

interface Props {
  onChangeTab: (tab: "Ventas" | "Ordenes") => void;
  activeGTab: "Ventas" | "Ordenes";
}

export default function OrdersScreen({ onChangeTab, activeGTab }: Props) {
  const [orders, setOrders] = useState<OrderPro[]>([]);
  const [activeTab, setActiveTab] = useState<StatusTab>("pending");
  const [loading, setLoading] = useState(false);

  const cargarOrdenes = async (status: StatusTab) => {
    setLoading(true);
    const data = await OrdersService.getOrdersByStatus(status);
    setOrders(data);
    setLoading(false);
  };

  useEffect(() => {
    cargarOrdenes(activeTab);
  }, [activeTab]);

  const handleCambiarEstado = async (
    orden: OrderPro,
    nuevoEstado: "accepted" | "rejected" | "completed",
  ) => {
    try {
      if (nuevoEstado === "accepted") {
        Alert.alert(
          "Método de Pago",
          "¿Cómo se registrará el ingreso de este pedido de la web?",
          [
            {
              text: "💵 Efectivo",
              onPress: () => procesarAceptacionLocal(orden, "efectivo"),
            },
            {
              text: "📱 Transferencia",
              onPress: () => procesarAceptacionLocal(orden, "transferencia"),
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
                procesarAceptacionLocal(orden, "deuda");
              },
            },
            { text: "Cancelar", style: "cancel" },
          ],
        );
      } else if (nuevoEstado === "rejected") {
        Alert.alert(
          "Rechazar Pedido",
          "¿Quieres avisarle al cliente por WhatsApp el motivo del rechazo?",
          [
            {
              text: "Sí, avisar y rechazar",
              onPress: async () => {
                await OrdersService.updateOrderStatus(orden.id, "rejected");
                // Le mandas un mensaje personalizado o genérico
                const mensaje = `¡Hola ${orden.customer_name}! Te hablamos de Sabor Espress. Lamentablemente no pudimos aceptar tu pedido en este momento porque [escribe el motivo aquí]. ¡Esperamos atenderte en una próxima ocasión!`;
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
                await OrdersService.updateOrderStatus(orden.id, "rejected");
                cargarOrdenes(activeTab);
              },
            },
            { text: "Cancelar", style: "cancel" },
          ],
        );
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

  const procesarAceptacionLocal = async (
    orden: OrderPro,
    tipoPago: "efectivo" | "transferencia" | "deuda",
  ) => {
    try {
      setLoading(true);
      await SalesService.crearVentaDesdeOrdenWeb(orden, tipoPago);
      await OrdersService.updateOrderStatus(orden.id, "accepted");
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

  const abrirWhatsAppCliente = (telefono: string, nombre: string) => {
    const mensaje = `¡Hola ${nombre}! Te hablamos de Sabor Espress. Tu pedido fue recibido...`;
    const url = `https://wa.me/57${telefono}?text=${encodeURIComponent(mensaje)}`;
    Linking.openURL(url).catch(() =>
      Alert.alert("Error", "No se pudo abrir WhatsApp."),
    );
  };

  const renderOrderItem = ({ item }: { item: OrderPro }) => (
    <View className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-neutral-100">
      {/* Header Tarjeta */}
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-lg font-bold text-neutral-800">
          {item.customer_name}
        </Text>
        <Text className="bg-orange-100 text-orange-700 px-2 py-1 rounded-md text-xs font-black tracking-wider uppercase">
          {item.delivery_type}
        </Text>
      </View>

      {/* Info Cliente */}
      <TouchableOpacity
        onPress={() =>
          abrirWhatsAppCliente(item.customer_phone, item.customer_name)
        }
      >
        <Text className="text-emerald-600 font-semibold mb-1">
          📞 {item.customer_phone} (Chatear)
        </Text>
      </TouchableOpacity>

      {item.delivery_address && (
        <Text className="text-neutral-600 text-sm mb-1">
          📍 {item.delivery_address}
        </Text>
      )}

      {item.comments && (
        <Text className="text-neutral-400 text-sm italic mb-2">
          💬 &quot;{item.comments}&quot;
        </Text>
      )}

      <View className="h-[1px] bg-neutral-100 my-2" />

      {/* Items del Pedido */}
      {item.order_items.map((detail: OrderItemDetail) => (
        <Text key={detail.id} className="text-sm text-neutral-700 mb-1">
          • <Text className="font-bold">{detail.quantity}x</Text>{" "}
          {detail.products?.name || detail.recipes?.name}
          <Text className="text-neutral-400 text-xs">
            {" "}
            (${Number(detail.price_at_time).toLocaleString("es-CO")})
          </Text>
        </Text>
      ))}

      <View className="h-[1px] bg-neutral-100 my-2" />

      {/* Footer / Acciones */}
      <View className="mt-1 flex-row justify-between items-center">
        <View>
          <Text className="text-xs text-neutral-400 uppercase font-bold">
            Total
          </Text>
          <Text className="text-lg font-black text-orange-600">
            ${Number(item.total_price).toLocaleString("es-CO")}
          </Text>
        </View>

        {item.status === "pending" && (
          <View className="flex-row gap-2">
            <TouchableOpacity
              className="bg-red-500 px-3 py-2 rounded-lg"
              onPress={() => handleCambiarEstado(item, "rejected")}
            >
              <Text className="text-white font-bold text-xs">Rechazar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-emerald-600 px-4 py-2 rounded-lg"
              onPress={() => handleCambiarEstado(item, "accepted")}
            >
              <Text className="text-white font-bold text-xs">Aceptar</Text>
            </TouchableOpacity>
          </View>
        )}

        {item.status === "accepted" && (
          <TouchableOpacity
            className="bg-orange-500 px-4 py-2 rounded-lg"
            onPress={() => handleCambiarEstado(item, "completed")}
          >
            <Text className="text-white font-bold text-xs">
              Entregar pedido
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row bg-background border-b border-neutral-800">
        {(["Ventas", "Ordenes"] as ("Ventas" | "Ordenes")[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            className={`flex-1 py-4 items-center border-b-2 ${
              activeGTab === tab ? "border-orange-500" : "border-transparent"
            }`}
            onPress={() => onChangeTab(tab)}
          >
            <Text
              className={`font-bold text-xs uppercase tracking-wider ${
                activeGTab === tab ? "text-orange-600" : "text-neutral-400"
              }`}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {/* Tabs Superiores */}
      <View className="flex-row bg-background border-b border-neutral-800">
        {(["pending", "accepted", "completed"] as StatusTab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            className={`flex-1 py-4 items-center border-b-2 ${
              activeTab === tab ? "border-orange-500" : "border-transparent"
            }`}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              className={`font-bold text-xs uppercase tracking-wider ${
                activeTab === tab ? "text-orange-600" : "text-neutral-400"
              }`}
            >
              {tab === "pending"
                ? "Pendientes"
                : tab === "accepted"
                  ? "En cocina"
                  : "Entregados"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Lista Principal */}
      {loading ? (
        <ActivityIndicator size="large" color="#ff5722" className="mt-8" />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrderItem}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <Text className="text-center text-neutral-400 mt-12 text-sm">
              No hay pedidos en esta sección por ahora. 🍕
            </Text>
          }
        />
      )}
    </View>
  );
}
