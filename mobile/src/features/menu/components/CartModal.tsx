import { OrderItem } from "@/src/core/context/OrderContext";
import Button from "@/src/shared/components/ui/Button";
import Input from "@/src/shared/components/ui/Input";
import { priceFormat } from "@/src/shared/helpers/price-format.helper";
import { useOrder } from "@/src/shared/hooks/useOrder";
import {
  PaymentMethods,
  PaymentMethodsType,
} from "@/src/shared/types/payment-methods.type";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { SalesService } from "../../sales/services/sales.service";
import { SaleType } from "../../sales/types/sale.type";
import { ClientType } from "../../clients/types/client.type";
import { ClientsService } from "../../clients/services/clients.service";
import { ProductsService } from "../../products/services/products.service";
import { RecipesService } from "../../recipes/services/recipes.service";
import DateTimePicker from "@react-native-community/datetimepicker";

type Props = {
  onSaleCreated: () => void;
};

const CartModal = ({ onSaleCreated }: Props) => {
  const { order, addToOrder, addRecipeToOrder, removeFromOrder, clearOrder } = useOrder();

  const totalItems = order.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrecio = order.reduce((sum, item) => {
    if (item.type === "product") return sum + item.product.price * item.quantity;
    if (item.type === "recipe") return sum + item.recipe.selling_price * item.quantity;
    return sum;
  }, 0);

  const [clients, setClients] = useState<ClientType[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [showClientPicker, setShowClientPicker] = useState(false);

  const [isDebt, setIsDebt] = useState(false);
  const [note, setNote] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [amountDebt, setAmountDebt] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodsType>("cash");
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

  if (totalItems === 0) return null;

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
      // Build sale_products from order (recipes contribute via a proxy product approach,
      // we record the recipe's selling_price as if it were a single line item with product_id = 0)
      // Instead: we record each recipe as a special sale line, using product_id from first ingredient OR placeholder
      // Better approach: store recipe items as sale_products with a "recipe sale product" approach.
      // We create a flat list for the sale: recipe lines use product_id of the recipe id (negative) – but since
      // sale_products requires a valid product_id FK, we simply record them as a sum without product detail.
      // The simplest correct approach: 
      //  - For products: normal flow
      //  - For recipes: deduct stock via RecipesService.deductStock, don't add to sale_products

      const productItems = order.filter((i) => i.type === "product");
      const recipeItems = order.filter((i) => i.type === "recipe");

      const productsToSave = productItems.map((o) => {
        if (o.type !== "product") return null as any;
        return {
          product_id: o.product.id,
          quantity: o.quantity,
          price: o.product.price * o.quantity,
        };
      }).filter(Boolean);

      await SalesService.createSale(sale, productsToSave);

      // Deduct stock for recipe ingredients
      for (const item of recipeItems) {
        if (item.type !== "recipe") continue;
        await RecipesService.deductStock(item.recipe.id!, item.quantity);
      }

      onSaleCreated();

      // Check low stock: products
      const lowStockAlerts: string[] = [];
      for (const item of productItems) {
        if (item.type !== "product") continue;
        const prod = await ProductsService.getProductById(item.product.id);
        if (prod && prod.stock <= 10) {
          lowStockAlerts.push(`${prod.name} (Quedan: ${prod.stock})`);
        }
      }
      // Check low stock: recipe ingredients
      for (const item of recipeItems) {
        if (item.type !== "recipe") continue;
        const low = await RecipesService.checkLowStock(item.recipe.id!);
        for (const l of low) {
          lowStockAlerts.push(`${l.name} (Quedan: ${l.stock})`);
        }
      }

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

      if (lowStockAlerts.length > 0) {
        Alert.alert(
          "¡Pedido creado correctamente!",
          `⚠️ ¡Alerta de Stock Bajo!\nLos siguientes productos tienen stock bajo:\n\n${lowStockAlerts.map(a => `• ${a}`).join("\n")}`
        );
      } else {
        Alert.alert("¡Pedido creado correctamente!");
      }
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

  return (
    <>
      <Button
        circle={true}
        color="primary"
        onPress={() => setModalVisible(true)}
      >
        <View className="flex-row items-center">
          <Ionicons name="cart" size={24} color="white" />
          <Text className="text-xs absolute -top-4 -right-4 w-4 h-4 rounded-full bg-white text-black text-center m-0 p-0">
            {totalItems}
          </Text>
        </View>
      </Button>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View className="flex-1 bg-black/60 justify-end">
            {/* Contenedor del carrito que sube */}
            <View className="bg-neutral-900 rounded-t-[32px] h-[92%] px-6 pt-6 shadow-2xl border-t border-neutral-800">
              <View className="flex-row items-center justify-between mb-6">
                <View className="flex-row items-center gap-2">
                  <Text className="text-2xl font-black text-white">
                    Mi Orden
                  </Text>
                  <Text className="text-primary font-bold text-lg">
                    ({totalItems})
                  </Text>
                </View>

                <Pressable
                  onPress={() => setModalVisible(false)}
                  className="p-2 bg-neutral-800 rounded-full active:opacity-70"
                >
                  <Ionicons name="close" size={24} color="white" />
                </Pressable>
              </View>

              <FlatList
                data={order}
                keyExtractor={(item, idx) =>
                  item.type === "product"
                    ? `p-${item.product.id}`
                    : `r-${item.recipe.id}-${idx}`
                }
                contentContainerStyle={{ gap: 16, paddingBottom: 24 }}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <View className="flex-row bg-neutral-800 p-4 rounded-2xl items-center justify-between">
                    <View className="flex-row items-center flex-1 mr-4">
                      <Image
                        source={
                          getItemImage(item)
                            ? { uri: getItemImage(item) }
                            : require("@/assets/images/default-food.png")
                        }
                        className="w-14 h-14 rounded-xl bg-neutral-700 mr-3"
                        resizeMode="cover"
                      />
                      <View className="flex-1">
                        <View className="flex-row items-center gap-1 flex-1">
                          {item.type === "recipe" && (
                            <View style={{
                              backgroundColor: "#ff572220",
                              borderRadius: 4,
                              paddingHorizontal: 5,
                              paddingVertical: 2,
                              marginRight: 4,
                            }}>
                              <Text style={{ color: "#ff5722", fontSize: 9, fontWeight: "800" }}>RECETA</Text>
                            </View>
                          )}
                          <Text
                            className="text-white font-bold text-base flex-1"
                            numberOfLines={1}
                          >
                            {getItemLabel(item)}
                          </Text>
                        </View>
                        <Text className="text-primary font-bold mt-0.5">
                          {priceFormat(getItemPrice(item))}
                        </Text>
                      </View>
                    </View>

                    {/* Controles de unidades */}
                    <View className="flex-row items-center bg-neutral-900 rounded-xl p-1 gap-2.5">
                      <Pressable
                        onPress={() => handleDecrement(item)}
                        className="p-1 active:opacity-60"
                      >
                        <Ionicons
                          name="remove-circle-outline"
                          size={24}
                          color="white"
                        />
                      </Pressable>
                      <Text className="text-white font-black text-sm min-w-[14px] text-center">
                        {item.quantity}
                      </Text>
                      <Pressable
                        onPress={() => handleIncrement(item)}
                        className="p-1 active:opacity-60"
                      >
                        <Ionicons
                          name="add-circle-outline"
                          size={24}
                          color="white"
                        />
                      </Pressable>
                    </View>
                  </View>
                )}
              />

              {/* Footer fijo con total y acción */}
              <View className="border-t border-neutral-800 pt-4 pb-10">
                <View className="mb-4">
                  <Pressable
                    onPress={() => setShowClientPicker(true)}
                    className="h-16 bg-neutral-800 shadow-lg rounded-lg px-4 flex-row items-center gap-2"
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Ionicons
                        name="person-outline"
                        size={18}
                        color={selectedClientId ? "#ff5722" : "#737373"}
                      />
                      <Text style={{ color: selectedClientId ? "#fff" : "#737373", fontSize: 15 }}>
                        {selectedClientId
                          ? clients.find((c) => c.id === selectedClientId)?.name
                          : "Asignar cliente (opcional)"}
                      </Text>
                    </View>
                    <Ionicons name="chevron-down" size={16} color="#555" />
                  </Pressable>
                </View>

                {/* Nota */}
                <View className="mb-4">
                  <Input
                    type="text"
                    onChangeText={(text) => setNote(text)}
                    placeholder="Nota"
                    value={note}
                  />
                </View>

                {/* Métodos de pago */}
                <View className="flex-row justify-between gap-3 mb-4">
                  {Object.values(PaymentMethods).map((method) => (
                    <Button
                      key={method}
                      color="filter"
                      active={paymentMethod === method}
                      onPress={() => setPaymentMethod(method)}
                      className="!rounded-xl flex-1"
                    >
                      <View className="flex-col items-center justify-center gap-1 w-full">
                        {method === PaymentMethods.NEQUI ? (
                          <Image
                            source={require("../../../../assets/icons/nequi.png")}
                            style={{ width: 22, height: 22 }}
                          />
                        ) : (
                          <Ionicons name={method} size={22} color="white" />
                        )}
                        <Text className="text-white text-xs font-medium">
                          {method === PaymentMethods.CASH
                            ? "Efectivo"
                            : method === PaymentMethods.NEQUI
                              ? "Nequi"
                              : "Tarjeta"}
                        </Text>
                      </View>
                    </Button>
                  ))}
                </View>

                {/* Contado / Fiado */}
                <View className="flex-row items-center gap-6 mb-4">
                  <Pressable
                    onPress={() => setIsDebt(false)}
                    className={`flex-1 flex-row items-center p-3 rounded-xl border ${!isDebt ? "border-primary" : "border-neutral-700"} active:opacity-70`}
                  >
                    <Text className="text-white font-semibold">Contado</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      setIsDebt(true);
                      setAmountDebt(totalPrecio);
                    }}
                    className={`flex-1 flex-row items-center p-3 rounded-xl border ${isDebt ? "border-primary" : "border-neutral-700"} active:opacity-70`}
                  >
                    <Text className="text-white font-semibold">Fiado</Text>
                  </Pressable>
                </View>

                {/* Deuda */}
                {isDebt && (
                  <View style={{ gap: 12, marginBottom: 16 }}>
                    <Input
                      type="number"
                      placeholder="Monto que quedan debiendo"
                      value={String(amountDebt)}
                      onChangeText={(text) => {
                        setAmountDebt(Number(text));
                      }}
                    />

                    <View>
                      <Text style={{ color: "#a3a3a3", fontSize: 13, fontWeight: "600", marginBottom: 6 }}>
                        Fecha Límite de Pago
                      </Text>
                      <Pressable
                        onPress={() => setShowDatePicker(true)}
                        style={{
                          height: 56,
                          backgroundColor: "#262626",
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: "#3f3f46",
                          paddingHorizontal: 16,
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}>
                          {debtDate.toLocaleDateString("es-CO", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </Text>
                        <Ionicons name="calendar-outline" size={20} color="#ff5722" />
                      </Pressable>
                      {showDatePicker && (
                        <DateTimePicker
                          value={debtDate}
                          mode="date"
                          minimumDate={new Date()}
                          onChange={(event, selectedDate) => {
                            setShowDatePicker(Platform.OS === "ios");
                            if (selectedDate) {
                              setDebtDate(selectedDate);
                            }
                          }}
                        />
                      )}
                    </View>
                  </View>
                )}

                {/* Client picker modal */}
                <Modal visible={showClientPicker} transparent animationType="slide">
                  <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }}>
                    <View style={{
                      backgroundColor: "#141414",
                      borderTopLeftRadius: 28,
                      borderTopRightRadius: 28,
                      padding: 24,
                      maxHeight: "60%",
                      paddingBottom: 40,
                    }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                        <Text style={{ color: "#fff", fontSize: 18, fontWeight: "800" }}>Seleccionar Cliente</Text>
                        <Pressable
                          onPress={() => setShowClientPicker(false)}
                          style={{ backgroundColor: "#2a2a2a", borderRadius: 20, padding: 8 }}
                        >
                          <Ionicons name="close" size={18} color="#fff" />
                        </Pressable>
                      </View>
                      <FlatList
                        data={clients}
                        keyExtractor={(c) => String(c.id)}
                        renderItem={({ item }) => (
                          <Pressable
                            onPress={() => { setSelectedClientId(item.id); setShowClientPicker(false); }}
                            style={{
                              padding: 14,
                              borderRadius: 12,
                              marginBottom: 8,
                              backgroundColor: selectedClientId === item.id ? "#ff572222" : "#1a1a1a",
                              borderWidth: 1,
                              borderColor: selectedClientId === item.id ? "#ff5722" : "#2a2a2a",
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 10,
                            }}
                          >
                            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#ff572233", alignItems: "center", justifyContent: "center" }}>
                              <Text style={{ color: "#ff5722", fontWeight: "800" }}>{item.name[0].toUpperCase()}</Text>
                            </View>
                            <View>
                              <Text style={{ color: "#fff", fontWeight: "600" }}>{item.name}</Text>
                              {item.phone && <Text style={{ color: "#737373", fontSize: 12 }}>{item.phone}</Text>}
                            </View>
                          </Pressable>
                        )}
                        ListEmptyComponent={
                          <Text style={{ color: "#555", textAlign: "center", marginTop: 20 }}>
                            No hay clientes registrados
                          </Text>
                        }
                      />
                    </View>
                  </View>
                </Modal>

                {/* Total y confirmar */}
                <View className="flex-row justify-between items-center mb-6">
                  <Text className="text-gray-400 text-lg font-medium">
                    Total de la orden
                  </Text>
                  <Text className="text-white text-3xl font-black">
                    {priceFormat(totalPrecio)}
                  </Text>
                </View>

                <Pressable
                  onPress={() => handleCheckout(buildSale(), order)}
                  className="bg-primary py-4 rounded-2xl items-center justify-center active:opacity-90 shadow-xl"
                >
                  <Text className="text-white text-xl font-black">
                    Confirmar Pedido
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
};

export default CartModal;
