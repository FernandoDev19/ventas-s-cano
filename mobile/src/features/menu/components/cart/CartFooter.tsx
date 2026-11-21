import { ClientType } from "@/src/features/clients/types/client.type";
import Button from "@/src/shared/components/ui/Button";
import Input from "@/src/shared/components/ui/Input";
import { priceFormat } from "@/src/shared/helpers/price-format.helper";
import {
  PaymentMethods,
  PaymentMethodsType,
} from "@/src/shared/types/payment-methods.type";
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { OrderItem } from "@/src/core/context/OrderContext";
import { SaleType } from "@/src/features/sales/types/sale.type";
import ClientPicker from "@/src/features/clients/components/ClientPicker";
import { TableType } from "@/src/features/tables/services/tables.service";

const QUICK_NOTES = ["Para llevar", "Comer aquí", "Sin salsas", "Domicilio"];

type Props = {
  setAmountDebt: (v: number) => void;
  setDebtDate: (v: Date) => void;
  setPaymentMethod: (v: PaymentMethodsType) => void;
  setIsDebt: (v: boolean) => void;
  setNote: (v: string) => void;
  setSelectedClientId: (v: string) => void;
  buildSale: () => SaleType;
  setShowDatePicker: (v: boolean) => void;
  handleCheckout: (sale: SaleType, order: OrderItem[]) => void;
  selectedClientId: string | null;
  clients: ClientType[];
  onClientCreated?: () => void;
  note: string;
  paymentMethod: PaymentMethodsType;
  isDebt: boolean;
  debtDate: Date;
  amountDebt: number;
  showDatePicker: boolean;
  totalPrecio: number;
  order: OrderItem[];
  isSubmitting?: boolean;
  orderType: "comer_aqui" | "para_llevar" | "domicilio";
  setOrderType: (type: "comer_aqui" | "para_llevar" | "domicilio") => void;
  tables: TableType[];
  selectedTableId: number | null;
  setSelectedTableId: (id: number | null) => void;
  deliveryAddress: string;
  setDeliveryAddress: (address: string) => void;
  cashReceived: string;
  setCashReceived: (val: string) => void;
};

export default function CartFooter({
  setAmountDebt,
  setDebtDate,
  setPaymentMethod,
  setIsDebt,
  setNote,
  setSelectedClientId,
  buildSale,
  setShowDatePicker,
  handleCheckout,
  selectedClientId,
  clients,
  onClientCreated,
  note,
  paymentMethod,
  isDebt,
  debtDate,
  amountDebt,
  showDatePicker,
  totalPrecio,
  order,
  isSubmitting,
  orderType,
  setOrderType,
  tables,
  selectedTableId,
  setSelectedTableId,
  deliveryAddress,
  setDeliveryAddress,
  cashReceived,
  setCashReceived,
}: Props) {
  const handleTagPress = (tag: string) => {
    if (note.includes(tag)) {
      const clean = note
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s !== tag && s.length > 0)
        .join(", ");
      setNote(clean);
    } else {
      setNote(note.trim() ? `${note.trim()}, ${tag}` : tag);
    }
  };

  const numericCash = Number(cashReceived.replace(/[^0-9]/g, ""));
  const changeAmount = numericCash > 0 ? numericCash - totalPrecio : 0;

  // Atajos rápidos para billetes de efectivo sugeridos
  const getQuickBills = () => {
    const defaultBills = [20000, 50000, 100000];
    const higher = defaultBills.filter((b) => b > totalPrecio);
    if (higher.length === 0) {
      const next50k = Math.ceil(totalPrecio / 50000) * 50000;
      return next50k > totalPrecio ? [next50k] : [];
    }
    return higher.slice(0, 3);
  };

  return (
    <View className="border-t border-neutral-800 pt-4 pb-10">
      {/* ─── 1. MODALIDAD DE CONSUMO / ENTREGA ─── */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{ color: "#a3a3a3", fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
          Tipo de pedido
        </Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {[
            { key: "comer_aqui", label: "Comer aquí", icon: "restaurant-outline" },
            { key: "para_llevar", label: "Para llevar", icon: "bag-handle-outline" },
            { key: "domicilio", label: "Domicilio", icon: "bicycle-outline" },
          ].map((item) => {
            const isSelected = orderType === item.key;
            return (
              <Pressable
                key={item.key}
                onPress={() => setOrderType(item.key as any)}
                style={{
                  flex: 1,
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: 10,
                  borderRadius: 14,
                  backgroundColor: isSelected ? "#ff572220" : "#262626",
                  borderWidth: 1.5,
                  borderColor: isSelected ? "#ff5722" : "#3f3f46",
                  gap: 4,
                }}
              >
                <Ionicons
                  name={item.icon as any}
                  size={18}
                  color={isSelected ? "#ff5722" : "#a3a3a3"}
                />
                <Text
                  style={{
                    color: isSelected ? "#fff" : "#a3a3a3",
                    fontSize: 12,
                    fontWeight: isSelected ? "700" : "500",
                  }}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* ─── 2. SI ES DOMICILIO: PEDIR DIRECCIÓN ─── */}
      {orderType === "domicilio" && (
        <View style={{ marginBottom: 16, backgroundColor: "#1e1e1e", borderRadius: 16, padding: 14, borderWidth: 1, borderColor: "#ff572250" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <Ionicons name="location-outline" size={16} color="#ff5722" />
            <Text style={{ color: "#ff5722", fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 }}>
              Dirección de entrega *
            </Text>
          </View>
          <View
            style={{
              backgroundColor: "#141414",
              borderRadius: 12,
              paddingHorizontal: 12,
              borderWidth: 1,
              borderColor: deliveryAddress.trim() ? "#ff5722" : "#3f3f46",
            }}
          >
            <TextInput
              placeholder="Ej: Calle 45 # 12-34, Apto 201"
              placeholderTextColor="#666"
              value={deliveryAddress}
              onChangeText={setDeliveryAddress}
              style={{ color: "#fff", fontSize: 15, height: 44 }}
            />
          </View>
          {!deliveryAddress.trim() && (
            <Text style={{ color: "#f87171", fontSize: 11, marginTop: 4 }}>
              * La dirección es obligatoria para despachar el domicilio.
            </Text>
          )}
        </View>
      )}

      {/* ─── 3. SI ES COMER AQUÍ: SELECCIONAR MESA (Permite seguir si están ocupadas) ─── */}
      {orderType === "comer_aqui" && (
        <View style={{ marginBottom: 16, backgroundColor: "#1e1e1e", borderRadius: 16, padding: 14, borderWidth: 1, borderColor: "#3f3f46" }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Ionicons name="wine-outline" size={16} color="#ff5722" />
              <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 }}>
                Mesa asignada (opcional)
              </Text>
            </View>
            <Text style={{ color: selectedTableId ? "#ff5722" : "#737373", fontSize: 11, fontWeight: "600" }}>
              {selectedTableId ? `Mesa ${tables.find((t) => t.id === selectedTableId)?.number_mesa ?? selectedTableId}` : "Sin mesa"}
            </Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
            <Pressable
              onPress={() => setSelectedTableId(null)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 10,
                backgroundColor: selectedTableId === null ? "#ff572225" : "#262626",
                borderWidth: 1,
                borderColor: selectedTableId === null ? "#ff5722" : "#3f3f46",
              }}
            >
              <Text style={{ color: selectedTableId === null ? "#ff5722" : "#a3a3a3", fontSize: 12, fontWeight: selectedTableId === null ? "700" : "500" }}>
                Sin mesa
              </Text>
            </Pressable>

            {tables.map((t) => {
              const isSelected = selectedTableId === t.id;
              const isOcupada = t.status === "ocupada";
              return (
                <Pressable
                  key={t.id}
                  onPress={() => setSelectedTableId(isSelected ? null : t.id)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 10,
                    backgroundColor: isSelected ? "#ff572225" : isOcupada ? "#2b1c17" : "#262626",
                    borderWidth: 1,
                    borderColor: isSelected ? "#ff5722" : isOcupada ? "#7c2d12" : "#3f3f46",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Text style={{ color: isSelected ? "#fff" : isOcupada ? "#ea580c" : "#fff", fontSize: 12, fontWeight: isSelected ? "800" : "600" }}>
                    Mesa {t.number_mesa}
                  </Text>
                  {isOcupada && (
                    <Text style={{ color: isSelected ? "#ffedd5" : "#fdba74", fontSize: 10 }}>
                      (Ocupada)
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* ─── 4. ASIGNAR CLIENTE ─── */}
      <ClientPicker
        setSelectedClientId={setSelectedClientId}
        selectedClientId={selectedClientId}
        clients={clients}
        onClientCreated={onClientCreated}
      />

      {/* ─── 5. NOTA CON ETIQUETAS RÁPIDAS ─── */}
      <View className="mb-4">
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
          {QUICK_NOTES.map((tag) => {
            const isSelected = note.includes(tag);
            return (
              <Pressable
                key={tag}
                onPress={() => handleTagPress(tag)}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 8,
                  backgroundColor: isSelected ? "#ff572233" : "#262626",
                  borderWidth: 1,
                  borderColor: isSelected ? "#ff5722" : "#3f3f46",
                }}
              >
                <Text
                  style={{
                    color: isSelected ? "#ff5722" : "#a3a3a3",
                    fontSize: 12,
                    fontWeight: isSelected ? "700" : "500",
                  }}
                >
                  {tag}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Input
          type="text"
          onChangeText={(text) => setNote(text)}
          placeholder="Nota o comentarios especiales..."
          value={note}
        />
      </View>

      {/* ─── 6. MÉTODOS DE PAGO ─── */}
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
                  source={require("@/assets/icons/nequi.png")}
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

      {/* ─── 7. CALCULADORA DE CAMBIO / VUELTO (EFECTIVO) ─── */}
      {paymentMethod === PaymentMethods.CASH && !isDebt && (
        <View style={{ backgroundColor: "#1e1e1e", borderRadius: 16, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: "#3f3f46" }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Ionicons name="cash-outline" size={16} color="#ff5722" />
              <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 }}>
                ¿Con cuánto paga el cliente?
              </Text>
            </View>
            {numericCash > 0 && (
              <Pressable onPress={() => setCashReceived("")} hitSlop={8}>
                <Text style={{ color: "#737373", fontSize: 11 }}>Limpiar</Text>
              </Pressable>
            )}
          </View>

          {/* Input de monto recibido */}
          <View
            style={{
              backgroundColor: "#141414",
              borderRadius: 12,
              paddingHorizontal: 14,
              flexDirection: "row",
              alignItems: "center",
              borderWidth: 1,
              borderColor: numericCash >= totalPrecio ? "#10b981" : "#3f3f46",
              height: 48,
              marginBottom: 8,
            }}
          >
            <Text style={{ color: "#ff5722", fontSize: 18, fontWeight: "800", marginRight: 8 }}>
              $
            </Text>
            <TextInput
              placeholder="0"
              placeholderTextColor="#555"
              keyboardType="numeric"
              value={cashReceived}
              onChangeText={setCashReceived}
              style={{ color: "#fff", fontSize: 18, fontWeight: "700", flex: 1 }}
            />
          </View>

          {/* Atajos rápidos de billetes sugeridos */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 4 }}>
            <Pressable
              onPress={() => setCashReceived(String(totalPrecio))}
              style={{
                backgroundColor: numericCash === totalPrecio ? "#ff572233" : "#262626",
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: numericCash === totalPrecio ? "#ff5722" : "#3f3f46",
              }}
            >
              <Text style={{ color: numericCash === totalPrecio ? "#ff5722" : "#a3a3a3", fontSize: 11, fontWeight: "700" }}>
                Exacto ({priceFormat(totalPrecio)})
              </Text>
            </Pressable>

            {getQuickBills().map((bill) => (
              <Pressable
                key={bill}
                onPress={() => setCashReceived(String(bill))}
                style={{
                  backgroundColor: numericCash === bill ? "#ff572233" : "#262626",
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: numericCash === bill ? "#ff5722" : "#3f3f46",
                }}
              >
                <Text style={{ color: numericCash === bill ? "#ff5722" : "#a3a3a3", fontSize: 11, fontWeight: "700" }}>
                  {priceFormat(bill)}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Resultado de cambio */}
          {numericCash > 0 && (
            numericCash >= totalPrecio ? (
              <View
                style={{
                  backgroundColor: "#10b98115",
                  borderColor: "#10b981",
                  borderWidth: 1,
                  borderRadius: 12,
                  padding: 12,
                  marginTop: 8,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <View>
                  <Text style={{ color: "#a3a3a3", fontSize: 11, fontWeight: "700", textTransform: "uppercase" }}>
                    Cambio a devolver:
                  </Text>
                  <Text style={{ color: "#34d399", fontSize: 22, fontWeight: "900" }}>
                    {priceFormat(changeAmount)}
                  </Text>
                </View>
                <Ionicons name="checkmark-circle" size={26} color="#10b981" />
              </View>
            ) : (
              <View
                style={{
                  backgroundColor: "#f59e0b15",
                  borderColor: "#f59e0b",
                  borderWidth: 1,
                  borderRadius: 12,
                  padding: 12,
                  marginTop: 8,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <View>
                  <Text style={{ color: "#a3a3a3", fontSize: 11, fontWeight: "700", textTransform: "uppercase" }}>
                    Faltan para completar:
                  </Text>
                  <Text style={{ color: "#fbbf24", fontSize: 18, fontWeight: "800" }}>
                    {priceFormat(totalPrecio - numericCash)}
                  </Text>
                </View>
                <Ionicons name="alert-circle-outline" size={24} color="#f59e0b" />
              </View>
            )
          )}
        </View>
      )}

      {/* ─── 8. CONTADO / FIADO ─── */}
      <View className="flex-row items-center gap-6 mb-2">
        <Pressable
          onPress={() => setIsDebt(false)}
          className={`flex-1 flex-row items-center justify-center p-3 rounded-xl border ${!isDebt ? "border-primary bg-primary/10" : "border-neutral-700"} active:opacity-70`}
        >
          <Text className={`font-semibold ${!isDebt ? "text-primary" : "text-white"}`}>
            Contado
          </Text>
        </Pressable>
        <Pressable
          onPress={() => {
            setIsDebt(true);
            setAmountDebt(totalPrecio);
          }}
          className={`flex-1 flex-row items-center justify-center p-3 rounded-xl border ${isDebt ? "border-primary bg-primary/10" : "border-neutral-700"} active:opacity-70`}
        >
          <Text className={`font-semibold ${isDebt ? "text-primary" : "text-white"}`}>
            Fiado
          </Text>
        </Pressable>
      </View>

      {/* Aviso si fiado pero sin cliente */}
      {isDebt && !selectedClientId && (
        <View className="flex-row items-center gap-1.5 mb-3 bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-xl">
          <Ionicons name="warning-outline" size={16} color="#f59e0b" />
          <Text className="text-amber-400 text-xs font-semibold flex-1">
            Debes asignar un cliente arriba para poder fiar esta venta.
          </Text>
        </View>
      )}

      {/* Deuda */}
      {isDebt && (
        <View style={{ gap: 12, marginBottom: 16, marginTop: 4 }}>
          <Input
            type="number"
            placeholder="Monto que quedan debiendo"
            value={String(amountDebt)}
            onChangeText={(text) => {
              setAmountDebt(Number(text));
            }}
          />

          <View>
            <Text
              style={{
                color: "#a3a3a3",
                fontSize: 13,
                fontWeight: "600",
                marginBottom: 6,
              }}
            >
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
              <Text
                style={{
                  color: "#fff",
                  fontSize: 15,
                  fontWeight: "700",
                }}
              >
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

      {/* ─── 9. TOTAL Y CONFIRMAR ─── */}
      <View className="flex-row justify-between items-center my-4">
        <Text className="text-gray-400 text-lg font-medium">
          Total de la orden
        </Text>
        <Text className="text-white text-3xl font-black">
          {priceFormat(totalPrecio)}
        </Text>
      </View>

      <Pressable
        onPress={() => handleCheckout(buildSale(), order)}
        disabled={isSubmitting}
        className={`bg-primary py-4 rounded-2xl items-center justify-center active:opacity-90 shadow-xl ${isSubmitting ? "opacity-60" : ""}`}
      >
        {isSubmitting ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white text-xl font-black">Confirmar Pedido</Text>
        )}
      </Pressable>
    </View>
  );
}
