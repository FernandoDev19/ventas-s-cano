import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SalesService } from "../services/sales.service";
import { SaleType } from "../types/sale.type";
import { Ionicons } from "@expo/vector-icons";
import { priceFormat } from "@/src/shared/helpers/price-format.helper";

type SaleDetailModalProps = {
  visible: boolean;
  saleId: number | null;
  onClose: () => void;
  onUpdated: () => void;
};

type FullSaleType = SaleType & {
  products: {
    id: number;
    product_id: number;
    product_name: string;
    product_image?: string;
    quantity: number;
    price: number;
  }[];
};

export default function SaleDetailModal({
  visible,
  saleId,
  onClose,
  onUpdated,
}: SaleDetailModalProps) {
  const [sale, setSale] = useState<FullSaleType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (visible && saleId) {
      loadSaleDetails();
    } else {
      setSale(null);
    }
  }, [visible, saleId]);

  const loadSaleDetails = async () => {
    if (!saleId) return;
    setIsLoading(true);
    try {
      const data = await SalesService.getSaleById(saleId);
      if (data) {
        setSale(data as FullSaleType);
      } else {
        Alert.alert("Error", "No se encontró el detalle de esta venta.");
        onClose();
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "No se pudo cargar el detalle de la venta.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!saleId) return;
    Alert.alert(
      "Cobrar venta",
      "¿Seguro que quieres marcar esta venta como pagada?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Cobrar",
          onPress: async () => {
            setIsPaying(true);
            try {
              await SalesService.markSaleAsPaid(saleId);
              onUpdated();
              onClose();
            } catch (err) {
              Alert.alert("Error", "No se pudo actualizar la venta.");
            } finally {
              setIsPaying(false);
            }
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    if (!saleId || !sale) return;
    Alert.alert(
      "Eliminar venta",
      `¿Seguro que deseas eliminar esta venta? El stock de los productos vendidos se devolverá al inventario.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            try {
              await SalesService.deleteSale(saleId);
              onUpdated();
              onClose();
            } catch (err) {
              Alert.alert("Error", "No se pudo eliminar la venta.");
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.6)",
          justifyContent: "flex-end",
        }}
      >
        <View
          style={{
            backgroundColor: "#141414",
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            padding: 24,
            maxHeight: "85%",
            paddingBottom: 40,
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <View>
              <Text
                style={{
                  color: "#ff5722",
                  fontSize: 11,
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                Detalle de Venta
              </Text>
              <Text style={{ color: "#fff", fontSize: 20, fontWeight: "800" }}>
                {saleId ? `#${String(saleId).padStart(3, "0")}` : ""}
              </Text>
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {sale && (
                <Pressable
                  onPress={handleDelete}
                  disabled={isDeleting}
                  style={{
                    backgroundColor: "#2a0a0a",
                    borderRadius: 20,
                    padding: 10,
                    borderWidth: 1,
                    borderColor: "#5a1a1a",
                  }}
                >
                  {isDeleting ? (
                    <ActivityIndicator size="small" color="#ef4444" />
                  ) : (
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                  )}
                </Pressable>
              )}
              <Pressable
                onPress={onClose}
                style={{
                  backgroundColor: "#2a2a2a",
                  borderRadius: 20,
                  padding: 10,
                }}
              >
                <Ionicons name="close" size={20} color="#fff" />
              </Pressable>
            </View>
          </View>

          {isLoading ? (
            <View style={{ paddingVertical: 60, alignItems: "center" }}>
              <ActivityIndicator size="large" color="#ff5722" />
              <Text style={{ color: "#737373", marginTop: 12, fontSize: 13 }}>
                Cargando productos...
              </Text>
            </View>
          ) : sale ? (
            <ScrollView showsVerticalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {/* Info General */}
              <View
                style={{
                  backgroundColor: "#1a1a1a",
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: "#2a2a2a",
                  marginBottom: 16,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 10,
                  }}
                >
                  <Text style={{ color: "#737373", fontSize: 12 }}>Estado</Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 10,
                      backgroundColor: sale.is_debt ? "#f59e0b22" : "#22c55e22",
                    }}
                  >
                    <View
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: sale.is_debt ? "#f59e0b" : "#22c55e",
                      }}
                    />
                    <Text
                      style={{
                        color: sale.is_debt ? "#f59e0b" : "#22c55e",
                        fontSize: 11,
                        fontWeight: "700",
                      }}
                    >
                      {sale.is_debt ? "FIADO" : "PAGADO"}
                    </Text>
                  </View>
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 10,
                  }}
                >
                  <Text style={{ color: "#737373", fontSize: 12 }}>Fecha</Text>
                  <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600" }}>
                    {sale.created_at
                      ? new Date(sale.created_at).toLocaleDateString("es-CO", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })
                      : ""}
                  </Text>
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 10,
                  }}
                >
                  <Text style={{ color: "#737373", fontSize: 12 }}>Hora</Text>
                  <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600" }}>
                    {sale.created_at
                      ? new Date(sale.created_at).toLocaleTimeString("es-CO", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        })
                      : ""}
                  </Text>
                </View>

                {sale.is_debt && sale.debt_date && (
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      marginTop: 4,
                      paddingTop: 8,
                      borderTopWidth: 1,
                      borderTopColor: "#2a2a2a",
                    }}
                  >
                    <Text style={{ color: "#f59e0b", fontSize: 12 }}>Vence</Text>
                    <Text style={{ color: "#f59e0b", fontSize: 13, fontWeight: "700" }}>
                      {new Date(sale.debt_date).toLocaleDateString("es-CO", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </Text>
                  </View>
                )}
              </View>

              {/* Lista de productos */}
              <Text
                style={{
                  color: "#737373",
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  marginBottom: 8,
                }}
              >
                Productos Vendidos
              </Text>

              <View style={{ gap: 8, marginBottom: 16 }}>
                {sale.products?.map((item) => (
                  <View
                    key={item.id}
                    style={{
                      flexDirection: "row",
                      backgroundColor: "#1a1a1a",
                      borderRadius: 14,
                      padding: 10,
                      borderWidth: 1,
                      borderColor: "#2a2a2a",
                      alignItems: "center",
                    }}
                  >
                    <Image
                      source={
                        item.product_image
                          ? { uri: item.product_image }
                          : require("@/assets/images/default-food.png")
                      }
                      style={{ width: 44, height: 44, borderRadius: 8, marginRight: 10 }}
                      resizeMode="cover"
                    />
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text
                        style={{ color: "#fff", fontSize: 14, fontWeight: "600" }}
                        numberOfLines={1}
                      >
                        {item.product_name}
                      </Text>
                      <Text style={{ color: "#737373", fontSize: 11, marginTop: 2 }}>
                        {item.quantity} x {priceFormat(item.price)}
                      </Text>
                    </View>
                    <Text style={{ color: "#fff", fontSize: 14, fontWeight: "700" }}>
                      {priceFormat(item.quantity * item.price)}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Nota */}
              <Text
                style={{
                  color: "#737373",
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  marginBottom: 8,
                }}
              >
                Nota
              </Text>
              <View
                style={{
                  backgroundColor: "#1a1a1a",
                  borderRadius: 14,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: "#2a2a2a",
                  marginBottom: 20,
                }}
              >
                <Text style={{ color: sale.note ? "#fff" : "#555", fontSize: 13, fontStyle: sale.note ? "normal" : "italic" }}>
                  {sale.note || "Sin nota descriptiva"}
                </Text>
              </View>

              {/* Totales */}
              <View
                style={{
                  backgroundColor: "#1a1a1a",
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: "#2a2a2a",
                  marginBottom: 24,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "#a3a3a3", fontSize: 14, fontWeight: "600" }}>Total Venta</Text>
                  <Text style={{ color: "#fff", fontSize: 22, fontWeight: "800" }}>
                    {priceFormat(sale.total)}
                  </Text>
                </View>

                {sale.is_debt && (sale.debt_amount ?? 0) > 0 && (
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginTop: 8,
                      paddingTop: 8,
                      borderTopWidth: 1,
                      borderTopColor: "#2a2a2a",
                    }}
                  >
                    <Text style={{ color: "#f59e0b", fontSize: 13, fontWeight: "600" }}>Saldo Pendiente</Text>
                    <Text style={{ color: "#f59e0b", fontSize: 18, fontWeight: "800" }}>
                      {priceFormat(sale.debt_amount ?? 0)}
                    </Text>
                  </View>
                )}
              </View>

              {/* Botón Cobrar si es deuda */}
              {sale.is_debt && (
                <Pressable
                  onPress={handleMarkAsPaid}
                  disabled={isPaying}
                  style={{
                    backgroundColor: "#ff5722",
                    paddingVertical: 16,
                    borderRadius: 16,
                    alignItems: "center",
                    flexDirection: "row",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  {isPaying ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                      <Text style={{ color: "#fff", fontSize: 16, fontWeight: "800" }}>
                        Marcar como Pagado (Cobrar)
                      </Text>
                    </>
                  )}
                </Pressable>
              )}
            </ScrollView>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}
