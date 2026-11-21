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
  Text,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { OrderItem } from "@/src/core/context/OrderContext";
import { SaleType } from "@/src/features/sales/types/sale.type";
import ClientPicker from "@/src/features/clients/components/ClientPicker";

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

  return (
    <View className="border-t border-neutral-800 pt-4 pb-10">
      <ClientPicker
        setSelectedClientId={setSelectedClientId}
        selectedClientId={selectedClientId}
        clients={clients}
        onClientCreated={onClientCreated}
      />

      {/* Nota con etiquetas rápidas */}
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

      {/* Contado / Fiado */}
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

      {/* Total y confirmar */}
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
