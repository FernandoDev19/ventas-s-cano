import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
  TextInput,
  FlatList,
  Platform,
  TouchableOpacity,
} from "react-native";
import { SalesService } from "../services/sales.service";
import { SaleType } from "../types/sale.type";
import { Ionicons } from "@expo/vector-icons";
import { priceFormat } from "@/src/shared/helpers/price-format.helper";
import { ProductsService } from "@/src/features/inventory/services/products.service";
import { ProductType } from "@/src/features/inventory/types/product.type";
import { ContactType } from "@/src/features/contacts/types/contact.type";
import ReasonDialog from "./ReasonDialog";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Clipboard from "expo-clipboard";
import { PrinterService } from "@/src/shared/services/printer.service";
import { ContactsService } from "../../contacts/services/contact.service";

type SaleDetailModalProps = {
  visible: boolean;
  saleId: string | null;
  onClose: () => void;
  onUpdated: () => void;
};

type FullSaleType = SaleType & {
  products: {
    id: string;
    product_id: string;
    product_name: string;
    product_image?: string;
    quantity: number;
    price: number;
  }[];
  recipes: {
    id: string;
    recipe_id: string;
    recipe_name: string;
    recipe_image?: string;
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

  // Edit Mode States
  const [isEditing, setIsEditing] = useState(false);
  const [editedProducts, setEditedProducts] = useState<any[]>([]);
  const [editedNote, setEditedNote] = useState("");
  const [editedIsDebt, setEditedIsDebt] = useState(false);
  const [editedDebtAmount, setEditedDebtAmount] = useState(0);

  // Product Selector States
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [allProducts, setAllProducts] = useState<ProductType[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Client Selector States
  const [clients, setClients] = useState<ContactType[]>([]);
  const [editedClientId, setEditedClientId] = useState<string | null>(null);
  const [showClientPicker, setShowClientPicker] = useState(false);

  // Date Picker States
  const [editedDebtDate, setEditedDebtDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Reason Dialog States
  const [showReasonDialog, setShowReasonDialog] = useState(false);
  const [reasonType, setReasonType] = useState<"edit" | "cancel">("edit");

  const loadSaleDetails = useCallback(async () => {
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
  }, [saleId, onClose]);

  useEffect(() => {
    if (visible && saleId) {
      loadSaleDetails();
    } else {
      setSale(null);
      setIsEditing(false);
    }
  }, [visible, saleId, loadSaleDetails]);

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
              Alert.alert("Error", "No se pudo actualizar la venta.\n" + err);
            } finally {
              setIsPaying(false);
            }
          },
        },
      ],
    );
  };

  const startEditing = async () => {
    if (!sale) return;
    setEditedProducts(
      sale.products.map((p) => ({
        product_id: p.product_id,
        product_name: p.product_name,
        product_image: p.product_image,
        quantity: p.quantity,
        price: p.price,
      })),
    );
    setEditedNote(sale.note || "");
    setEditedIsDebt(sale.is_debt || false);
    setEditedDebtAmount(sale.debt_amount || 0);
    setEditedClientId(sale.client_id || null);
    setEditedDebtDate(
      sale.debt_date
        ? new Date(sale.debt_date)
        : (() => {
            const d = new Date();
            d.setDate(d.getDate() + 7);
            return d;
          })(),
    );
    setIsEditing(true);

    try {
      const prods = await ProductsService.getProducts();
      setAllProducts(prods);
    } catch (err) {
      console.error("Error loading products for editor:", err);
    }

    try {
      const clientList = await ContactsService.getClients();
      setClients(clientList);
    } catch (err) {
      console.error("Error loading clients for editor:", err);
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditedProducts([]);
    setEditedNote("");
    setEditedClientId(null);
  };

  const handleAddProduct = (product: ProductType) => {
    setEditedProducts((prev) => {
      const existing = prev.find((p) => p.product_id === product.id);
      if (existing) {
        return prev.map((p) =>
          p.product_id === product.id ? { ...p, quantity: p.quantity + 1 } : p,
        );
      } else {
        return [
          ...prev,
          {
            product_id: product.id,
            product_name: product.name,
            product_image: product.image_url,
            quantity: 1,
            price: product.price,
          },
        ];
      }
    });
    setShowProductSelector(false);
  };

  const updateProductQuantity = (productId: number, delta: number) => {
    setEditedProducts((prev) =>
      prev
        .map((p) => {
          if (p.product_id === productId) {
            const newQty = p.quantity + delta;
            return { ...p, quantity: newQty };
          }
          return p;
        })
        .filter((p) => p.quantity > 0),
    );
  };

  const removeProduct = (productId: number) => {
    setEditedProducts((prev) => prev.filter((p) => p.product_id !== productId));
  };

  const editedTotal = editedProducts.reduce(
    (sum, p) => sum + p.quantity * p.price,
    0,
  );

  // Clamp debt amount to edited total
  useEffect(() => {
    if (editedDebtAmount > editedTotal) {
      setEditedDebtAmount(editedTotal);
    }
  }, [editedTotal, editedDebtAmount]);

  const handleSave = () => {
    if (editedProducts.length === 0) {
      Alert.alert("Error", "Debe haber al menos un producto en la venta.");
      return;
    }
    setReasonType("edit");
    setShowReasonDialog(true);
  };

  const handleDeletePress = () => {
    setReasonType("cancel");
    setShowReasonDialog(true);
  };

  const handleConfirmReason = async (reason: string) => {
    setShowReasonDialog(false);
    if (reasonType === "edit") {
      setIsLoading(true);
      try {
        await SalesService.updateSale(saleId!, {
          total: editedTotal,
          note: editedNote,
          is_debt: editedIsDebt,
          debt_amount: editedIsDebt ? editedDebtAmount : 0,
          debt_date: editedIsDebt
            ? editedDebtDate.toISOString().split("T")[0]
            : null,
          products: editedProducts,
          client_id: editedClientId,
          edit_reason: reason,
        });

        // Check for low stock products
        const lowStockAlerts: string[] = [];
        for (const item of editedProducts) {
          const prod = await ProductsService.getProductById(item.product_id);
          if (prod && prod.stock <= 10) {
            lowStockAlerts.push(`${prod.name} (Quedan: ${prod.stock})`);
          }
        }

        setIsEditing(false);
        onUpdated();
        await loadSaleDetails();

        if (lowStockAlerts.length > 0) {
          Alert.alert(
            "Éxito",
            `Venta modificada correctamente.\n\n⚠️ ¡Alerta de Stock Bajo!\nLos siguientes productos tienen stock bajo:\n\n${lowStockAlerts.map((a) => `• ${a}`).join("\n")}`,
          );
        } else {
          Alert.alert("Éxito", "Venta modificada correctamente.");
        }
      } catch (err) {
        console.error(err);
        Alert.alert("Error", "No se pudo modificar la venta.");
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsDeleting(true);
      try {
        await SalesService.deleteSale(saleId!, reason);
        onUpdated();
        onClose();
        Alert.alert("Éxito", "Venta anulada correctamente.");
      } catch (err) {
        console.error(err);
        Alert.alert("Error", "No se pudo anular la venta.");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert("¡Copiado!", "El texto se ha guardado en el portapapeles");
  };

  const handleReprintTicket = async () => {
    if (!sale) return;
    try {
      const displayItems = [
        ...sale.products.map((p) => ({
          quantity: p.quantity,
          name: p.product_name,
          price: p.price,
        })),
        ...sale.recipes.map((r) => ({
          quantity: r.quantity,
          name: r.recipe_name,
          price: r.price,
        })),
      ];

      const printerSaleObj = {
        id: sale.id,
        total: sale.total,
        is_debt: sale.is_debt,
        debt_amount: sale.debt_amount,
        debt_date: sale.debt_date
          ? new Date(sale.debt_date).toISOString().split("T")[0]
          : null,
        payment_method: sale.payment_method,
        client_name: sale.client?.name || "",
        note: sale.note,
        created_at: sale.created_at,
      };

      const ticketCmds = PrinterService.generateCajaTicket(
        printerSaleObj,
        displayItems,
      );
      const ok = await PrinterService.print("caja", ticketCmds);
      if (ok) {
        Alert.alert("¡Enviado!", "Comandos de impresión enviados a la caja.");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "No se pudo generar o enviar el ticket.");
    }
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
                {isEditing ? "Modificando Venta" : "Detalle de Venta"}
              </Text>
              <TouchableOpacity onPress={() => copyToClipboard(saleId || "")}>
                <Text
                  style={{ color: "#fff", fontSize: 20, fontWeight: "800" }}
                >
                  {saleId ? `#${String(saleId).slice(0, 8)}...` : ""}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {sale && !isEditing && sale.status !== "cancelled" && (
                <>
                  <Pressable
                    onPress={startEditing}
                    style={{
                      backgroundColor: "#1a1a1a",
                      borderRadius: 20,
                      padding: 10,
                      borderWidth: 1,
                      borderColor: "#3a3a3a",
                    }}
                  >
                    <Ionicons name="create-outline" size={18} color="#ff5722" />
                  </Pressable>
                  <Pressable
                    onPress={handleDeletePress}
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
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color="#ef4444"
                      />
                    )}
                  </Pressable>
                </>
              )}
              <Pressable
                onPress={isEditing ? cancelEditing : onClose}
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
                Cargando datos de la venta...
              </Text>
            </View>
          ) : sale ? (
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ marginBottom: 12 }}
            >
              {isEditing ? (
                <>
                  {/* EDIT MODE */}
                  {/* Lista de productos editados */}
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 10,
                    }}
                  >
                    <Text
                      style={{
                        color: "#737373",
                        fontSize: 11,
                        textTransform: "uppercase",
                        letterSpacing: 1,
                      }}
                    >
                      Editar Productos
                    </Text>
                    <Pressable
                      onPress={() => {
                        setSearchQuery("");
                        setShowProductSelector(true);
                      }}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                        backgroundColor: "#ff572222",
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 10,
                      }}
                    >
                      <Ionicons name="add" size={14} color="#ff5722" />
                      <Text
                        style={{
                          color: "#ff5722",
                          fontSize: 12,
                          fontWeight: "700",
                        }}
                      >
                        Agregar
                      </Text>
                    </Pressable>
                  </View>

                  <View style={{ gap: 8, marginBottom: 16 }}>
                    {editedProducts.map((item) => (
                      <View
                        key={item.product_id}
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
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 8,
                            marginRight: 10,
                          }}
                          resizeMode="cover"
                        />
                        <View style={{ flex: 1, marginRight: 8 }}>
                          <Text
                            style={{
                              color: "#fff",
                              fontSize: 14,
                              fontWeight: "600",
                            }}
                            numberOfLines={1}
                          >
                            {item.product_name}
                          </Text>
                          <Text
                            style={{
                              color: "#737373",
                              fontSize: 11,
                              marginTop: 2,
                            }}
                          >
                            {priceFormat(item.price)} c/u
                          </Text>
                        </View>

                        {/* Controles de Cantidad */}
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            backgroundColor: "#0f0f0f",
                            borderRadius: 10,
                            padding: 4,
                            gap: 10,
                            marginRight: 8,
                          }}
                        >
                          <Pressable
                            onPress={() =>
                              updateProductQuantity(item.product_id, -1)
                            }
                            style={{ padding: 2 }}
                          >
                            <Ionicons
                              name="remove-circle-outline"
                              size={20}
                              color="#fff"
                            />
                          </Pressable>
                          <Text
                            style={{
                              color: "#fff",
                              fontWeight: "800",
                              fontSize: 13,
                              minWidth: 16,
                              textAlign: "center",
                            }}
                          >
                            {item.quantity}
                          </Text>
                          <Pressable
                            onPress={() =>
                              updateProductQuantity(item.product_id, 1)
                            }
                            style={{ padding: 2 }}
                          >
                            <Ionicons
                              name="add-circle-outline"
                              size={20}
                              color="#fff"
                            />
                          </Pressable>
                        </View>

                        {/* Quitar Producto */}
                        <Pressable
                          onPress={() => removeProduct(item.product_id)}
                          style={{ padding: 6 }}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={16}
                            color="#ef4444"
                          />
                        </Pressable>
                      </View>
                    ))}
                  </View>

                  {/* Tipo de Pago / Deuda */}
                  <Text
                    style={{
                      color: "#737373",
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: 1,
                      marginBottom: 8,
                    }}
                  >
                    Tipo de Pago
                  </Text>
                  <View
                    style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}
                  >
                    <Pressable
                      onPress={() => {
                        setEditedIsDebt(false);
                        setEditedDebtAmount(0);
                      }}
                      style={{
                        flex: 1,
                        paddingVertical: 12,
                        borderRadius: 12,
                        alignItems: "center",
                        backgroundColor: !editedIsDebt
                          ? "#ff572222"
                          : "#1a1a1a",
                        borderWidth: 1,
                        borderColor: !editedIsDebt ? "#ff5722" : "#2a2a2a",
                      }}
                    >
                      <Text
                        style={{
                          color: !editedIsDebt ? "#fff" : "#737373",
                          fontWeight: "700",
                          fontSize: 13,
                        }}
                      >
                        Contado
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        setEditedIsDebt(true);
                        setEditedDebtAmount(editedTotal);
                      }}
                      style={{
                        flex: 1,
                        paddingVertical: 12,
                        borderRadius: 12,
                        alignItems: "center",
                        backgroundColor: editedIsDebt ? "#ff572222" : "#1a1a1a",
                        borderWidth: 1,
                        borderColor: editedIsDebt ? "#ff5722" : "#2a2a2a",
                      }}
                    >
                      <Text
                        style={{
                          color: editedIsDebt ? "#fff" : "#737373",
                          fontWeight: "700",
                          fontSize: 13,
                        }}
                      >
                        Fiado
                      </Text>
                    </Pressable>
                  </View>

                  {/* Monto de Deuda si es fiado */}
                  {editedIsDebt && (
                    <View style={{ marginBottom: 16 }}>
                      <Text
                        style={{
                          color: "#737373",
                          fontSize: 11,
                          textTransform: "uppercase",
                          letterSpacing: 1,
                          marginBottom: 8,
                        }}
                      >
                        Saldo Pendiente (Máx: {priceFormat(editedTotal)})
                      </Text>
                      <TextInput
                        keyboardType="numeric"
                        value={String(editedDebtAmount)}
                        onChangeText={(text) => {
                          const val = Number(text.replace(/[^0-9]/g, ""));
                          setEditedDebtAmount(
                            val > editedTotal ? editedTotal : val,
                          );
                        }}
                        style={{
                          backgroundColor: "#1a1a1a",
                          borderColor: "#2a2a2a",
                          borderWidth: 1,
                          borderRadius: 12,
                          padding: 12,
                          color: "#fff",
                          fontSize: 14,
                        }}
                      />
                    </View>
                  )}

                  {/* Fecha de Pago si es fiado */}
                  {editedIsDebt && (
                    <View style={{ marginBottom: 16 }}>
                      <Text
                        style={{
                          color: "#737373",
                          fontSize: 11,
                          textTransform: "uppercase",
                          letterSpacing: 1,
                          marginBottom: 8,
                        }}
                      >
                        Fecha Límite de Pago
                      </Text>
                      <Pressable
                        onPress={() => setShowDatePicker(true)}
                        style={{
                          height: 56,
                          backgroundColor: "#1a1a1a",
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: "#2a2a2a",
                          paddingHorizontal: 16,
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <Text
                          style={{
                            color: "#fff",
                            fontSize: 14,
                            fontWeight: "700",
                          }}
                        >
                          {editedDebtDate.toLocaleDateString("es-CO", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </Text>
                        <Ionicons
                          name="calendar-outline"
                          size={20}
                          color="#ff5722"
                        />
                      </Pressable>
                      {showDatePicker && (
                        <DateTimePicker
                          value={editedDebtDate}
                          mode="date"
                          minimumDate={new Date()}
                          onChange={(event, selectedDate) => {
                            setShowDatePicker(Platform.OS === "ios");
                            if (selectedDate) {
                              setEditedDebtDate(selectedDate);
                            }
                          }}
                        />
                      )}
                    </View>
                  )}

                  {/* Asignar Cliente (opcional) */}
                  <View style={{ marginBottom: 16 }}>
                    <Text
                      style={{
                        color: "#737373",
                        fontSize: 11,
                        textTransform: "uppercase",
                        letterSpacing: 1,
                        marginBottom: 8,
                      }}
                    >
                      Cliente (Opcional)
                    </Text>
                    <Pressable
                      onPress={() => setShowClientPicker(true)}
                      style={{
                        height: 56,
                        backgroundColor: "#1a1a1a",
                        borderRadius: 14,
                        borderWidth: 1,
                        borderColor: "#2a2a2a",
                        paddingHorizontal: 16,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <Ionicons
                          name="person-outline"
                          size={18}
                          color={editedClientId ? "#ff5722" : "#737373"}
                        />
                        <Text
                          style={{
                            color: editedClientId ? "#fff" : "#737373",
                            fontSize: 14,
                          }}
                        >
                          {editedClientId
                            ? clients.find((c) => c.id === editedClientId)?.name
                            : "Asignar cliente"}
                        </Text>
                      </View>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        {editedClientId && (
                          <Pressable
                            hitSlop={8}
                            onPress={() => setEditedClientId(null)}
                            style={{ padding: 4 }}
                          >
                            <Ionicons
                              name="close-circle"
                              size={16}
                              color="#737373"
                            />
                          </Pressable>
                        )}
                        <Ionicons name="chevron-down" size={16} color="#555" />
                      </View>
                    </Pressable>
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
                  <TextInput
                    value={editedNote}
                    onChangeText={setEditedNote}
                    placeholder="Nota descriptiva..."
                    placeholderTextColor="#555"
                    multiline
                    numberOfLines={3}
                    style={{
                      backgroundColor: "#1a1a1a",
                      borderColor: "#2a2a2a",
                      borderWidth: 1,
                      borderRadius: 14,
                      padding: 12,
                      color: "#fff",
                      fontSize: 14,
                      minHeight: 60,
                      textAlignVertical: "top",
                      marginBottom: 20,
                    }}
                  />

                  {/* Total */}
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
                      <Text
                        style={{
                          color: "#a3a3a3",
                          fontSize: 14,
                          fontWeight: "600",
                        }}
                      >
                        Total Venta
                      </Text>
                      <Text
                        style={{
                          color: "#fff",
                          fontSize: 22,
                          fontWeight: "800",
                        }}
                      >
                        {priceFormat(editedTotal)}
                      </Text>
                    </View>
                  </View>

                  {/* Actions */}
                  <View style={{ flexDirection: "row", gap: 12 }}>
                    <Pressable
                      onPress={cancelEditing}
                      style={{
                        flex: 1,
                        backgroundColor: "#2a2a2a",
                        paddingVertical: 16,
                        borderRadius: 16,
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          color: "#fff",
                          fontSize: 15,
                          fontWeight: "700",
                        }}
                      >
                        Cancelar
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={handleSave}
                      style={{
                        flex: 1,
                        backgroundColor: "#ff5722",
                        paddingVertical: 16,
                        borderRadius: 16,
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          color: "#fff",
                          fontSize: 15,
                          fontWeight: "800",
                        }}
                      >
                        Guardar Cambios
                      </Text>
                    </Pressable>
                  </View>
                </>
              ) : (
                <>
                  {/* VIEW MODE */}
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
                    {sale.client && (
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          marginBottom: 10,
                          paddingBottom: 10,
                          borderBottomWidth: 1,
                          borderBottomColor: "#2a2a2a",
                        }}
                      >
                        <Text style={{ color: "#737373", fontSize: 12 }}>
                          Cliente
                        </Text>
                        <Text
                          style={{
                            color: "#fff",
                            fontSize: 13,
                            fontWeight: "700",
                          }}
                        >
                          {sale.client.name}
                        </Text>
                      </View>
                    )}

                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        marginBottom: 10,
                      }}
                    >
                      <Text style={{ color: "#737373", fontSize: 12 }}>
                        Estado
                      </Text>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 4,
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 10,
                          backgroundColor:
                            sale.status === "cancelled"
                              ? "#ef444422"
                              : sale.is_debt
                                ? "#f59e0b22"
                                : "#22c55e22",
                        }}
                      >
                        <View
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor:
                              sale.status === "cancelled"
                                ? "#ef4444"
                                : sale.is_debt
                                  ? "#f59e0b"
                                  : "#22c55e",
                          }}
                        />
                        <Text
                          style={{
                            color:
                              sale.status === "cancelled"
                                ? "#ef4444"
                                : sale.is_debt
                                  ? "#f59e0b"
                                  : "#22c55e",
                            fontSize: 11,
                            fontWeight: "700",
                          }}
                        >
                          {sale.status === "cancelled"
                            ? "ANULADO"
                            : sale.is_debt
                              ? "FIADO"
                              : "PAGADO"}
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
                      <Text style={{ color: "#737373", fontSize: 12 }}>
                        Fecha
                      </Text>
                      <Text
                        style={{
                          color: "#fff",
                          fontSize: 13,
                          fontWeight: "600",
                        }}
                      >
                        {sale.created_at
                          ? new Date(sale.created_at).toLocaleDateString(
                              "es-CO",
                              {
                                day: "2-digit",
                                month: "long",
                                year: "numeric",
                              },
                            )
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
                      <Text style={{ color: "#737373", fontSize: 12 }}>
                        Hora
                      </Text>
                      <Text
                        style={{
                          color: "#fff",
                          fontSize: 13,
                          fontWeight: "600",
                        }}
                      >
                        {sale.created_at
                          ? new Date(sale.created_at).toLocaleTimeString(
                              "es-CO",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: false,
                              },
                            )
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
                        <Text style={{ color: "#f59e0b", fontSize: 12 }}>
                          Vence
                        </Text>
                        <Text
                          style={{
                            color: "#f59e0b",
                            fontSize: 13,
                            fontWeight: "700",
                          }}
                        >
                          {new Date(sale.debt_date).toLocaleDateString(
                            "es-CO",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            },
                          )}
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
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 8,
                            marginRight: 10,
                          }}
                          resizeMode="cover"
                        />
                        <View style={{ flex: 1, marginRight: 8 }}>
                          <Text
                            style={{
                              color: "#fff",
                              fontSize: 14,
                              fontWeight: "600",
                            }}
                            numberOfLines={1}
                          >
                            {item.product_name}
                          </Text>
                          <Text
                            style={{
                              color: "#737373",
                              fontSize: 11,
                              marginTop: 2,
                            }}
                          >
                            {item.quantity} x {priceFormat(item.price)}
                          </Text>
                        </View>
                        <Text
                          style={{
                            color: "#fff",
                            fontSize: 14,
                            fontWeight: "700",
                          }}
                        >
                          {priceFormat(item.quantity * item.price)}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* ✅ RECETAS VENDIDAS */}
                  {sale.recipes && sale.recipes.length > 0 && (
                    <>
                      <Text
                        style={{
                          color: "#737373",
                          fontSize: 11,
                          textTransform: "uppercase",
                          letterSpacing: 1,
                          marginBottom: 8,
                        }}
                      >
                        Recetas Vendidas
                      </Text>

                      <View style={{ gap: 8, marginBottom: 16 }}>
                        {sale.recipes.map((item) => (
                          <View
                            key={item.id}
                            style={{
                              flexDirection: "row",
                              backgroundColor: "#1a1a1a",
                              borderRadius: 14,
                              padding: 10,
                              borderWidth: 1,
                              borderColor: "#ff572244",
                              alignItems: "center",
                            }}
                          >
                            <Image
                              source={
                                item.recipe_image
                                  ? { uri: item.recipe_image }
                                  : require("@/assets/images/default-food.png")
                              }
                              style={{
                                width: 44,
                                height: 44,
                                borderRadius: 8,
                                marginRight: 10,
                              }}
                              resizeMode="cover"
                            />
                            <View style={{ flex: 1, marginRight: 8 }}>
                              <Text
                                style={{
                                  color: "#fff",
                                  fontSize: 14,
                                  fontWeight: "600",
                                }}
                                numberOfLines={1}
                              >
                                {item.recipe_name}
                              </Text>
                              <Text
                                style={{
                                  color: "#737373",
                                  fontSize: 11,
                                  marginTop: 2,
                                }}
                              >
                                {item.quantity}x{" "}
                                {priceFormat(item.price / item.quantity)}
                              </Text>
                            </View>
                            <Text
                              style={{
                                color: "#ff5722",
                                fontSize: 14,
                                fontWeight: "700",
                              }}
                            >
                              {priceFormat(item.price)}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </>
                  )}

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
                    <Text
                      style={{
                        color: sale.note ? "#fff" : "#555",
                        fontSize: 13,
                        fontStyle: sale.note ? "normal" : "italic",
                      }}
                    >
                      {sale.note || "Sin nota descriptiva"}
                    </Text>
                  </View>

                  {/* Motivos de Edición o Cancelación */}
                  {sale.edit_reason && (
                    <>
                      <Text
                        style={{
                          color: "#737373",
                          fontSize: 11,
                          textTransform: "uppercase",
                          letterSpacing: 1,
                          marginBottom: 8,
                        }}
                      >
                        Motivo de Modificación
                      </Text>
                      <View
                        style={{
                          backgroundColor: "#1a1a1a",
                          borderRadius: 14,
                          padding: 14,
                          borderWidth: 1,
                          borderColor: "#ff572244",
                          marginBottom: 20,
                        }}
                      >
                        <Text style={{ color: "#ff5722", fontSize: 13 }}>
                          {sale.edit_reason}
                        </Text>
                      </View>
                    </>
                  )}

                  {sale.status === "cancelled" && sale.cancel_reason && (
                    <>
                      <Text
                        style={{
                          color: "#737373",
                          fontSize: 11,
                          textTransform: "uppercase",
                          letterSpacing: 1,
                          marginBottom: 8,
                        }}
                      >
                        Motivo de Anulación
                      </Text>
                      <View
                        style={{
                          backgroundColor: "#2a0a0a",
                          borderRadius: 14,
                          padding: 14,
                          borderWidth: 1,
                          borderColor: "#ef444444",
                          marginBottom: 20,
                        }}
                      >
                        <Text
                          style={{
                            color: "#ef4444",
                            fontSize: 13,
                            fontWeight: "600",
                          }}
                        >
                          {sale.cancel_reason}
                        </Text>
                      </View>
                    </>
                  )}

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
                      <Text
                        style={{
                          color: "#a3a3a3",
                          fontSize: 14,
                          fontWeight: "600",
                        }}
                      >
                        Total Venta
                      </Text>
                      <Text
                        style={{
                          color: "#fff",
                          fontSize: 22,
                          fontWeight: "800",
                        }}
                      >
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
                        <Text
                          style={{
                            color: "#f59e0b",
                            fontSize: 13,
                            fontWeight: "600",
                          }}
                        >
                          Saldo Pendiente
                        </Text>
                        <Text
                          style={{
                            color: "#f59e0b",
                            fontSize: 18,
                            fontWeight: "800",
                          }}
                        >
                          {priceFormat(sale.debt_amount ?? 0)}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Botón Cobrar si es deuda y está activa */}
                  {sale.is_debt && sale.status !== "cancelled" && (
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
                          <Ionicons
                            name="checkmark-circle-outline"
                            size={20}
                            color="#fff"
                          />
                          <Text
                            style={{
                              color: "#fff",
                              fontSize: 16,
                              fontWeight: "800",
                            }}
                          >
                            Marcar como Pagado (Cobrar)
                          </Text>
                        </>
                      )}
                    </Pressable>
                  )}

                  {/* Botón Reimprimir Ticket */}
                  {sale.status !== "cancelled" && (
                    <Pressable
                      onPress={handleReprintTicket}
                      style={{
                        backgroundColor: "#1a1a1a",
                        paddingVertical: 16,
                        borderRadius: 16,
                        alignItems: "center",
                        flexDirection: "row",
                        justifyContent: "center",
                        gap: 8,
                        marginTop: 12,
                        borderWidth: 1.5,
                        borderColor: "#ff5722",
                      }}
                    >
                      <Ionicons
                        name="print-outline"
                        size={20}
                        color="#ff5722"
                      />
                      <Text
                        style={{
                          color: "#ff5722",
                          fontSize: 16,
                          fontWeight: "800",
                        }}
                      >
                        Reimprimir Ticket de Venta
                      </Text>
                    </Pressable>
                  )}
                </>
              )}
            </ScrollView>
          ) : null}
        </View>
      </View>

      {/* Selector de Productos */}
      <Modal
        visible={showProductSelector}
        transparent
        animationType="slide"
        onRequestClose={() => setShowProductSelector(false)}
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
              maxHeight: "70%",
              paddingBottom: 40,
            }}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 18, fontWeight: "800" }}>
                Seleccionar Producto
              </Text>
              <Pressable
                onPress={() => setShowProductSelector(false)}
                style={{
                  backgroundColor: "#2a2a2a",
                  borderRadius: 20,
                  padding: 8,
                }}
              >
                <Ionicons name="close" size={18} color="#fff" />
              </Pressable>
            </View>

            {/* Buscador */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#1a1a1a",
                borderRadius: 12,
                paddingHorizontal: 12,
                borderWidth: 1,
                borderColor: "#2a2a2a",
                marginBottom: 16,
              }}
            >
              <Ionicons
                name="search-outline"
                size={18}
                color="#737373"
                style={{ marginRight: 8 }}
              />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Buscar por nombre..."
                placeholderTextColor="#555"
                style={{
                  flex: 1,
                  color: "#fff",
                  fontSize: 14,
                  paddingVertical: 10,
                }}
              />
            </View>

            {/* Listado de Productos */}
            <FlatList
              data={allProducts.filter((p) =>
                p.name.toLowerCase().includes(searchQuery.toLowerCase()),
              )}
              keyExtractor={(p) => String(p.id)}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => handleAddProduct(item)}
                  style={{
                    padding: 12,
                    borderRadius: 14,
                    marginBottom: 8,
                    backgroundColor: "#1a1a1a",
                    borderWidth: 1,
                    borderColor: "#2a2a2a",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <Image
                    source={
                      item.image_url
                        ? { uri: item.image_url }
                        : require("@/assets/images/default-food.png")
                    }
                    style={{ width: 40, height: 40, borderRadius: 8 }}
                    resizeMode="cover"
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{ color: "#fff", fontWeight: "600", fontSize: 14 }}
                    >
                      {item.name}
                    </Text>
                    <Text
                      style={{ color: "#737373", fontSize: 12, marginTop: 2 }}
                    >
                      Stock: {item.stock} | {priceFormat(item.price)}
                    </Text>
                  </View>
                  <Ionicons name="add-circle" size={24} color="#ff5722" />
                </Pressable>
              )}
              ListEmptyComponent={
                <Text
                  style={{
                    color: "#555",
                    textAlign: "center",
                    marginTop: 20,
                  }}
                >
                  No se encontraron productos
                </Text>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Selector de Clientes */}
      <Modal
        visible={showClientPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowClientPicker(false)}
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
              maxHeight: "60%",
              paddingBottom: 40,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  fontSize: 18,
                  fontWeight: "800",
                }}
              >
                Seleccionar Cliente
              </Text>
              <Pressable
                onPress={() => setShowClientPicker(false)}
                style={{
                  backgroundColor: "#2a2a2a",
                  borderRadius: 20,
                  padding: 8,
                }}
              >
                <Ionicons name="close" size={18} color="#fff" />
              </Pressable>
            </View>
            <FlatList
              data={clients}
              keyExtractor={(c) => String(c.id)}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    setEditedClientId(item.id!);
                    setShowClientPicker(false);
                  }}
                  style={{
                    padding: 14,
                    borderRadius: 12,
                    marginBottom: 8,
                    backgroundColor:
                      editedClientId === item.id ? "#ff572222" : "#1a1a1a",
                    borderWidth: 1,
                    borderColor:
                      editedClientId === item.id ? "#ff5722" : "#2a2a2a",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: "#ff572233",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ color: "#ff5722", fontWeight: "800" }}>
                      {item.name[0].toUpperCase()}
                    </Text>
                  </View>
                  <View>
                    <Text style={{ color: "#fff", fontWeight: "600" }}>
                      {item.name}
                    </Text>
                    {item.phone && (
                      <Text style={{ color: "#737373", fontSize: 12 }}>
                        {item.phone}
                      </Text>
                    )}
                  </View>
                </Pressable>
              )}
              ListEmptyComponent={
                <Text
                  style={{
                    color: "#555",
                    textAlign: "center",
                    marginTop: 20,
                  }}
                >
                  No hay clientes registrados
                </Text>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Reason Dialog */}
      <ReasonDialog
        visible={showReasonDialog}
        title={
          reasonType === "edit"
            ? "Justificar Modificación"
            : "Confirmar Anulación"
        }
        description={
          reasonType === "edit"
            ? "Por favor, ingresa el motivo del cambio en los productos o datos de la venta."
            : "¿Seguro que deseas anular esta venta? El stock de los productos vendidos se devolverá al inventario."
        }
        confirmText={reasonType === "edit" ? "Guardar" : "Anular Venta"}
        onClose={() => setShowReasonDialog(false)}
        onConfirm={handleConfirmReason}
      />
    </Modal>
  );
}
