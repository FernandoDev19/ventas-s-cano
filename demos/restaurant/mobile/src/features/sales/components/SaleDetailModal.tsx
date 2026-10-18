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
import { RecipesService } from "@/src/features/recipes/services/recipes.service";
import { RecipeType } from "@/src/features/recipes/types/recipe.type";
import { ClientsService } from "@/src/features/clients/services/clients.service";
import { ClientType } from "@/src/features/clients/types/client.type";
import ReasonDialog from "./ReasonDialog";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Clipboard from "expo-clipboard";
import { PrinterService } from "@/src/shared/services/printer.service";
import {
  buildInvoiceMessage,
  sendInvoiceViaWhatsApp,
} from "@/src/shared/helpers/whatsapp.helper";

type SaleDetailModalProps = {
  visible: boolean;
  saleId: string | null;
  onClose: () => void;
  onUpdated: () => void;
};

type EditableItem = {
  item_id: string; // product_id o recipe_id
  item_name: string;
  item_image?: string;
  quantity: number;
  price: number; // precio por unidad
  is_recipe: boolean;
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

  // Edit Mode
  const [isEditing, setIsEditing] = useState(false);
  const [editedItems, setEditedItems] = useState<EditableItem[]>([]);
  const [editedNote, setEditedNote] = useState("");
  const [editedIsDebt, setEditedIsDebt] = useState(false);
  const [editedDebtAmount, setEditedDebtAmount] = useState(0);

  // Selector: "products" | "recipes" | null
  const [selectorMode, setSelectorMode] = useState<
    "products" | "recipes" | null
  >(null);
  const [allProducts, setAllProducts] = useState<ProductType[]>([]);
  const [allRecipes, setAllRecipes] = useState<RecipeType[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Client
  const [clients, setClients] = useState<ClientType[]>([]);
  const [editedClientId, setEditedClientId] = useState<string | null>(null);
  const [showClientPicker, setShowClientPicker] = useState(false);

  // Date
  const [editedDebtDate, setEditedDebtDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Reason Dialog
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
              Alert.alert("Error", "No se pudo actualizar la venta.");
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

    // Mapear productos y recetas al tipo unificado EditableItem
    const mappedProducts: EditableItem[] = sale.products.map((p) => ({
      item_id: p.product_id,
      item_name: p.product_name,
      item_image: p.product_image,
      quantity: p.quantity,
      price: p.price, // precio total del item (quantity * unitPrice)
      is_recipe: false,
    }));

    const mappedRecipes: EditableItem[] = sale.recipes.map((r) => ({
      item_id: r.recipe_id,
      item_name: r.recipe_name,
      item_image: r.recipe_image,
      quantity: r.quantity,
      price: r.price, // precio total del item
      is_recipe: true,
    }));

    setEditedItems([...mappedProducts, ...mappedRecipes]);
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

    // Precargar datos para selectores
    try {
      const [prods, recs, clientList] = await Promise.all([
        ProductsService.getProducts(),
        RecipesService.getAll(),
        ClientsService.getAll(),
      ]);
      setAllProducts(prods);
      setAllRecipes(recs);
      setClients(clientList);
    } catch (err) {
      console.error("Error cargando datos para edición:", err);
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditedItems([]);
    setEditedNote("");
    setEditedClientId(null);
  };

  // ─── Agregar producto al carrito de edición ───────────────
  const handleAddProduct = (product: ProductType) => {
    setEditedItems((prev) => {
      const existing = prev.find(
        (p) => p.item_id === product.id && !p.is_recipe,
      );
      if (existing) {
        return prev.map((p) =>
          p.item_id === product.id && !p.is_recipe
            ? { ...p, quantity: p.quantity + 1 }
            : p,
        );
      }
      return [
        ...prev,
        {
          item_id: product.id,
          item_name: product.name,
          item_image: product.image_url,
          quantity: 1,
          price: product.price, // precio unitario
          is_recipe: false,
        },
      ];
    });
    setSelectorMode(null);
  };

  // ─── Agregar receta al carrito de edición ────────────────
  const handleAddRecipe = (recipe: RecipeType) => {
    setEditedItems((prev) => {
      const existing = prev.find((p) => p.item_id === recipe.id && p.is_recipe);
      if (existing) {
        return prev.map((p) =>
          p.item_id === recipe.id && p.is_recipe
            ? { ...p, quantity: p.quantity + 1 }
            : p,
        );
      }
      return [
        ...prev,
        {
          item_id: recipe.id!,
          item_name: recipe.name,
          item_image: recipe.image_url,
          quantity: 1,
          price: recipe.selling_price, // precio unitario
          is_recipe: true,
        },
      ];
    });
    setSelectorMode(null);
  };

  const updateItemQty = (
    item_id: string,
    is_recipe: boolean,
    delta: number,
  ) => {
    setEditedItems((prev) =>
      prev
        .map((p) =>
          p.item_id === item_id && p.is_recipe === is_recipe
            ? { ...p, quantity: p.quantity + delta }
            : p,
        )
        .filter((p) => p.quantity > 0),
    );
  };

  const removeItem = (item_id: string, is_recipe: boolean) => {
    setEditedItems((prev) =>
      prev.filter((p) => !(p.item_id === item_id && p.is_recipe === is_recipe)),
    );
  };

  // Total calculado: precio unitario × cantidad
  const editedTotal = editedItems.reduce(
    (sum, p) => sum + p.price * p.quantity,
    0,
  );

  useEffect(() => {
    if (editedDebtAmount > editedTotal) setEditedDebtAmount(editedTotal);
  }, [editedTotal, editedDebtAmount]);

  const handleSave = () => {
    if (editedItems.length === 0) {
      Alert.alert("Error", "Debe haber al menos un ítem en la venta.");
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
        // ✅ Separar correctamente productos y recetas
        const editedPureProducts = editedItems
          .filter((p) => !p.is_recipe)
          .map((p) => ({
            product_id: p.item_id,
            quantity: p.quantity,
            price: p.price, // precio unitario → SalesService lo guarda como unit price
          }));

        const editedPureRecipes = editedItems
          .filter((p) => p.is_recipe)
          .map((p) => ({
            recipe_id: p.item_id,
            quantity: p.quantity,
            price: p.price, // precio unitario
          }));

        await SalesService.updateSale(saleId!, {
          total: editedTotal,
          note: editedNote,
          is_debt: editedIsDebt,
          debt_amount: editedIsDebt ? editedDebtAmount : 0,
          debt_date: editedIsDebt
            ? editedDebtDate.toISOString().split("T")[0]
            : null,
          products: editedPureProducts,
          recipes: editedPureRecipes,
          client_id: editedClientId,
          edit_reason: reason,
        });

        const lowStockAlerts: string[] = [];
        for (const item of editedPureProducts) {
          const prod = await ProductsService.getProductById(item.product_id);
          if (prod && prod.stock <= 10) {
            lowStockAlerts.push(`${prod.name} (Quedan: ${prod.stock})`);
          }
        }

        setIsEditing(false);
        onUpdated();
        await loadSaleDetails();

        Alert.alert(
          "Éxito",
          lowStockAlerts.length > 0
            ? `Venta modificada.\n\n⚠️ Stock bajo:\n${lowStockAlerts.map((a) => `• ${a}`).join("\n")}`
            : "Venta modificada correctamente.",
        );
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
        Alert.alert("Error", "No se pudo anular la venta.");
      } finally {
        setIsDeleting(false);
      }
    }
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
      const ok = await PrinterService.print(
        "caja",
        PrinterService.generateCajaTicket(printerSaleObj, displayItems),
      );
      if (ok) Alert.alert("¡Enviado!", "Ticket enviado a la caja.");
    } catch (err) {
      Alert.alert("Error", "No se pudo generar el ticket.");
    }
  };

  if (!visible) return null;

  // ─── Selector unificado (productos o recetas) ─────────────────────────────
  const SelectorModal = () => {
    const isProductMode = selectorMode === "products";
    const data = isProductMode
      ? allProducts.filter((p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()),
        )
      : allRecipes.filter((r) =>
          r.name.toLowerCase().includes(searchQuery.toLowerCase()),
        );

    return (
      <Modal
        visible={selectorMode !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectorMode(null)}
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
            {/* Header con tabs */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Pressable
                  onPress={() => {
                    setSelectorMode("products");
                    setSearchQuery("");
                  }}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 20,
                    backgroundColor: isProductMode ? "#ff5722" : "#2a2a2a",
                  }}
                >
                  <Text
                    style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}
                  >
                    Productos
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setSelectorMode("recipes");
                    setSearchQuery("");
                  }}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 20,
                    backgroundColor: !isProductMode ? "#ff5722" : "#2a2a2a",
                  }}
                >
                  <Text
                    style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}
                  >
                    🍽 Recetas
                  </Text>
                </Pressable>
              </View>
              <Pressable
                onPress={() => setSelectorMode(null)}
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
                placeholder={
                  isProductMode ? "Buscar producto..." : "Buscar receta..."
                }
                placeholderTextColor="#555"
                style={{
                  flex: 1,
                  color: "#fff",
                  fontSize: 14,
                  paddingVertical: 10,
                }}
              />
            </View>

            <FlatList<ProductType | RecipeType>
              data={data}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => {
                const isProduct = isProductMode;
                const prod = item as ProductType;
                const rec = item as RecipeType;
                const name = isProduct ? prod.name : rec.name;
                const image = isProduct ? prod.image_url : rec.image_url;
                const price = isProduct ? prod.price : rec.selling_price;
                const stock = isProduct ? prod.stock : null;

                // Marcar si ya está en el carrito
                const inCart = editedItems.find(
                  (e) => e.item_id === item.id && e.is_recipe === !isProduct,
                );

                return (
                  <Pressable
                    onPress={() =>
                      isProduct ? handleAddProduct(prod) : handleAddRecipe(rec)
                    }
                    style={{
                      padding: 12,
                      borderRadius: 14,
                      marginBottom: 8,
                      backgroundColor: "#1a1a1a",
                      borderWidth: 1,
                      borderColor: inCart ? "#ff5722" : "#2a2a2a",
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <Image
                      source={
                        image
                          ? { uri: image }
                          : require("@/assets/images/default-food.png")
                      }
                      style={{ width: 40, height: 40, borderRadius: 8 }}
                      resizeMode="cover"
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          color: "#fff",
                          fontWeight: "600",
                          fontSize: 14,
                        }}
                      >
                        {name}
                      </Text>
                      <Text
                        style={{ color: "#737373", fontSize: 12, marginTop: 2 }}
                      >
                        {priceFormat(price)}
                        {stock !== null ? ` · Stock: ${stock}` : ""}
                      </Text>
                    </View>
                    {inCart ? (
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Text
                          style={{
                            color: "#ff5722",
                            fontWeight: "800",
                            fontSize: 13,
                          }}
                        >
                          ×{inCart.quantity}
                        </Text>
                        <Ionicons name="add-circle" size={24} color="#ff5722" />
                      </View>
                    ) : (
                      <Ionicons
                        name="add-circle-outline"
                        size={24}
                        color="#737373"
                      />
                    )}
                  </Pressable>
                );
              }}
              ListEmptyComponent={
                <Text
                  style={{ color: "#555", textAlign: "center", marginTop: 20 }}
                >
                  No se encontraron {isProductMode ? "productos" : "recetas"}
                </Text>
              }
            />
          </View>
        </View>
      </Modal>
    );
  };

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
              <TouchableOpacity
                onPress={async () => {
                  await Clipboard.setStringAsync(saleId || "");
                  Alert.alert("¡Copiado!", "ID copiado al portapapeles");
                }}
              >
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
                Cargando...
              </Text>
            </View>
          ) : sale ? (
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ marginBottom: 12 }}
            >
              {isEditing ? (
                <>
                  {/* ── EDIT MODE ── */}
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
                      Productos y Recetas
                    </Text>
                    {/* Botones para abrir selector */}
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      <Pressable
                        onPress={() => {
                          setSearchQuery("");
                          setSelectorMode("products");
                        }}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 4,
                          backgroundColor: "#ff572222",
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          borderRadius: 10,
                        }}
                      >
                        <Ionicons
                          name="cube-outline"
                          size={13}
                          color="#ff5722"
                        />
                        <Text
                          style={{
                            color: "#ff5722",
                            fontSize: 12,
                            fontWeight: "700",
                          }}
                        >
                          Producto
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => {
                          setSearchQuery("");
                          setSelectorMode("recipes");
                        }}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 4,
                          backgroundColor: "#ff572222",
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          borderRadius: 10,
                        }}
                      >
                        <Ionicons
                          name="restaurant-outline"
                          size={13}
                          color="#ff5722"
                        />
                        <Text
                          style={{
                            color: "#ff5722",
                            fontSize: 12,
                            fontWeight: "700",
                          }}
                        >
                          Receta
                        </Text>
                      </Pressable>
                    </View>
                  </View>

                  {/* Lista unificada de ítems editables */}
                  <View style={{ gap: 8, marginBottom: 16 }}>
                    {editedItems.map((item) => (
                      <View
                        key={`${item.is_recipe ? "r" : "p"}-${item.item_id}`}
                        style={{
                          flexDirection: "row",
                          backgroundColor: "#1a1a1a",
                          borderRadius: 14,
                          padding: 10,
                          borderWidth: 1,
                          borderColor: item.is_recipe ? "#ff572244" : "#2a2a2a",
                          alignItems: "center",
                        }}
                      >
                        <Image
                          source={
                            item.item_image
                              ? { uri: item.item_image }
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
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            {item.is_recipe && (
                              <View
                                style={{
                                  backgroundColor: "#ff572222",
                                  borderRadius: 4,
                                  paddingHorizontal: 5,
                                  paddingVertical: 1,
                                }}
                              >
                                <Text
                                  style={{
                                    color: "#ff5722",
                                    fontSize: 9,
                                    fontWeight: "800",
                                  }}
                                >
                                  RECETA
                                </Text>
                              </View>
                            )}
                            <Text
                              style={{
                                color: "#fff",
                                fontSize: 14,
                                fontWeight: "600",
                                flex: 1,
                              }}
                              numberOfLines={1}
                            >
                              {item.item_name}
                            </Text>
                          </View>
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
                        {/* Controles de cantidad */}
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
                              updateItemQty(item.item_id, item.is_recipe, -1)
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
                              updateItemQty(item.item_id, item.is_recipe, 1)
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
                        <Pressable
                          onPress={() =>
                            removeItem(item.item_id, item.is_recipe)
                          }
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
                    {editedItems.length === 0 && (
                      <View
                        style={{
                          backgroundColor: "#1a1a1a",
                          borderRadius: 14,
                          padding: 20,
                          alignItems: "center",
                          borderWidth: 1,
                          borderColor: "#2a2a2a",
                          borderStyle: "dashed",
                        }}
                      >
                        <Ionicons
                          name="basket-outline"
                          size={28}
                          color="#444"
                        />
                        <Text
                          style={{ color: "#555", fontSize: 12, marginTop: 8 }}
                        >
                          Sin ítems. Agrega productos o recetas.
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Tipo de Pago */}
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
                    {[
                      { label: "Contado", value: false },
                      { label: "Fiado", value: true },
                    ].map((opt) => (
                      <Pressable
                        key={opt.label}
                        onPress={() => {
                          setEditedIsDebt(opt.value);
                          if (!opt.value) setEditedDebtAmount(0);
                          else setEditedDebtAmount(editedTotal);
                        }}
                        style={{
                          flex: 1,
                          paddingVertical: 12,
                          borderRadius: 12,
                          alignItems: "center",
                          backgroundColor:
                            editedIsDebt === opt.value
                              ? "#ff572222"
                              : "#1a1a1a",
                          borderWidth: 1,
                          borderColor:
                            editedIsDebt === opt.value ? "#ff5722" : "#2a2a2a",
                        }}
                      >
                        <Text
                          style={{
                            color:
                              editedIsDebt === opt.value ? "#fff" : "#737373",
                            fontWeight: "700",
                            fontSize: 13,
                          }}
                        >
                          {opt.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  {editedIsDebt && (
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
                          marginBottom: 16,
                        }}
                      />
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
                          marginBottom: 16,
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
                          onChange={(_, date) => {
                            setShowDatePicker(Platform.OS === "ios");
                            if (date) setEditedDebtDate(date);
                          }}
                        />
                      )}
                    </>
                  )}

                  {/* Cliente */}
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
                      marginBottom: 16,
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
                  {/* ── VIEW MODE ── */}
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
                            { day: "2-digit", month: "short", year: "numeric" },
                          )}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Productos */}
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

                  {/* Recetas */}
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
                            Marcar como Pagado
                          </Text>
                        </>
                      )}
                    </Pressable>
                  )}

                  {sale.status !== "cancelled" && (
                    <>
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
                          Reimprimir Ticket
                        </Text>
                      </Pressable>

                      <Pressable
                        onPress={async () => {
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
                          const msg = buildInvoiceMessage({
                            customerName:
                              sale.client?.name || "Cliente General",
                            items: displayItems,
                            total: sale.total,
                            paymentMethod: sale.payment_method,
                            note: sale.note,
                          });
                          const clientPhone = (sale.client as any)?.phone || "";
                          Alert.alert(
                            "Compartir por WhatsApp 📱",
                            clientPhone
                              ? `¿Enviar factura al ${clientPhone}?`
                              : "Sin número asociado, ¿compartir genérico?",
                            [
                              { text: "Cancelar", style: "cancel" },
                              {
                                text: clientPhone
                                  ? "Sí, enviar 📤"
                                  : "Compartir 📤",
                                onPress: () =>
                                  sendInvoiceViaWhatsApp(clientPhone, msg),
                              },
                            ],
                          );
                        }}
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
                          borderColor: "#25D366",
                        }}
                      >
                        <Ionicons
                          name="logo-whatsapp"
                          size={20}
                          color="#25D366"
                        />
                        <Text
                          style={{
                            color: "#25D366",
                            fontSize: 16,
                            fontWeight: "800",
                          }}
                        >
                          Compartir por WhatsApp
                        </Text>
                      </Pressable>
                    </>
                  )}
                </>
              )}
            </ScrollView>
          ) : null}
        </View>
      </View>

      {/* Modal selector unificado (productos / recetas) */}
      <SelectorModal />

      {/* Modal selector de clientes */}
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
              <Text style={{ color: "#fff", fontSize: 18, fontWeight: "800" }}>
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
                  style={{ color: "#555", textAlign: "center", marginTop: 20 }}
                >
                  No hay clientes registrados
                </Text>
              }
            />
          </View>
        </View>
      </Modal>

      <ReasonDialog
        visible={showReasonDialog}
        title={
          reasonType === "edit"
            ? "Justificar Modificación"
            : "Confirmar Anulación"
        }
        description={
          reasonType === "edit"
            ? "Ingresa el motivo del cambio."
            : "¿Seguro que deseas anular esta venta? El stock se devolverá al inventario."
        }
        confirmText={reasonType === "edit" ? "Guardar" : "Anular Venta"}
        onClose={() => setShowReasonDialog(false)}
        onConfirm={handleConfirmReason}
      />
    </Modal>
  );
}
