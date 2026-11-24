// @theme-migrated
import React from "react";
import { ClientType } from "@/src/features/clients/types/client.type";
import Input from "@/src/shared/components/ui/Input";
import { priceFormat } from "@/src/shared/helpers/price-format.helper";
import {
  PaymentMethods,
  PaymentMethodsType,
} from "@/src/shared/types/payment-methods.type";
import { Ionicons } from "@expo/vector-icons";
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import ClientPicker from "@/src/features/clients/components/ClientPicker";
import { TableType } from "@/src/features/tables/services/tables.service";
import { C } from "@/src/core/theme/palette";

const QUICK_NOTES = ["Sin salsas", "Sin cebolla", "Extra salsa", "Bien cocido"];

const ORDER_TYPES = [
  { key: "comer_aqui", label: "Comer aquí", icon: "restaurant-outline" },
  { key: "para_llevar", label: "Para llevar", icon: "bag-handle-outline" },
  { key: "domicilio", label: "Domicilio", icon: "bicycle-outline" },
] as const;

const METHOD_LABEL: Record<string, string> = {
  [PaymentMethods.CASH]: "Efectivo",
  [PaymentMethods.CARD]: "Tarjeta",
  [PaymentMethods.NEQUI]: "Nequi",
};

const pill = (active: boolean) => ({
  flex: 1,
  alignItems: "center" as const,
  justifyContent: "center" as const,
  paddingVertical: 10,
  borderRadius: 12,
  gap: 4,
  backgroundColor: active ? "#ff572220" : C.sheet,
  borderWidth: 1.5,
  borderColor: active ? "#ff5722" : C.line,
});

const Section = ({
  title,
  icon,
  children,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  children: React.ReactNode;
}) => (
  <View
    style={{
      backgroundColor: C.card,
      borderRadius: 18,
      padding: 14,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: C.line,
    }}
  >
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 12,
      }}
    >
      <Ionicons name={icon} size={16} color="#ff5722" />
      <Text
        style={{
          color: C.soft,
          fontSize: 13,
          fontWeight: "800",
          textTransform: "uppercase",
          letterSpacing: 1,
        }}
      >
        {title}
      </Text>
    </View>
    {children}
  </View>
);

type Props = {
  setAmountDebt: (v: number) => void;
  setDebtDate: (v: Date) => void;
  setPaymentMethod: (v: PaymentMethodsType) => void;
  setIsDebt: (v: boolean) => void;
  setNote: (v: string) => void;
  setSelectedClientId: (v: string) => void;
  setShowDatePicker: (v: boolean) => void;
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
  setShowDatePicker,
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
      setNote(
        note
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s !== tag && s.length > 0)
          .join(", "),
      );
    } else {
      setNote(note.trim() ? `${note.trim()}, ${tag}` : tag);
    }
  };

  const numericCash = Number(cashReceived.replace(/[^0-9]/g, ""));
  const changeAmount = numericCash - totalPrecio;

  const quickBills = (() => {
    const higher = [20000, 50000, 100000].filter((b) => b > totalPrecio);
    if (higher.length === 0) {
      const next50k = Math.ceil(totalPrecio / 50000) * 50000;
      return next50k > totalPrecio ? [next50k] : [];
    }
    return higher.slice(0, 3);
  })();

  return (
    <View style={{ paddingTop: 4, paddingBottom: 8 }}>
      {/* ─── 1. TIPO DE PEDIDO ─── */}
      <Section title="Tipo de pedido" icon="restaurant-outline">
        <View style={{ flexDirection: "row", gap: 8 }}>
          {ORDER_TYPES.map((t) => {
            const active = orderType === t.key;
            return (
              <Pressable
                key={t.key}
                onPress={() => setOrderType(t.key)}
                style={pill(active)}
              >
                <Ionicons
                  name={t.icon}
                  size={18}
                  color={active ? "#ff5722" : C.soft}
                />
                <Text
                  style={{
                    color: active ? "#ff5722" : C.text,
                    fontSize: 14,
                    fontWeight: active ? "700" : "500",
                  }}
                >
                  {t.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {orderType === "domicilio" && (
          <View style={{ marginTop: 12 }}>
            <View
              style={{
                backgroundColor: C.sheet,
                borderRadius: 12,
                paddingHorizontal: 12,
                borderWidth: 1,
                borderColor: deliveryAddress.trim() ? "#ff5722" : C.line,
              }}
            >
              <TextInput
                placeholder="Dirección de entrega *  Ej: Calle 45 # 12-34"
                placeholderTextColor={C.muted}
                value={deliveryAddress}
                onChangeText={setDeliveryAddress}
                style={{ color: C.text, fontSize: 17, height: 44 }}
              />
            </View>
            {!deliveryAddress.trim() && (
              <Text style={{ color: C.dangerText, fontSize: 13, marginTop: 4 }}>
                * Obligatoria para despachar el domicilio.
              </Text>
            )}
          </View>
        )}

        {orderType === "comer_aqui" && (
          <View style={{ marginTop: 12 }}>
            <Text style={{ color: C.muted, fontSize: 13, marginBottom: 6 }}>
              Mesa (opcional)
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
              <Pressable
                onPress={() => setSelectedTableId(null)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 10,
                  backgroundColor:
                    selectedTableId === null ? "#ff572225" : C.sheet,
                  borderWidth: 1,
                  borderColor: selectedTableId === null ? "#ff5722" : C.line,
                }}
              >
                <Text
                  style={{
                    color: selectedTableId === null ? "#ff5722" : C.soft,
                    fontSize: 14,
                    fontWeight: "700",
                  }}
                >
                  Sin mesa
                </Text>
              </Pressable>
              {tables.map((t) => {
                const selected = selectedTableId === t.id;
                const ocupada = t.status === "ocupada";
                return (
                  <Pressable
                    key={t.id}
                    onPress={() => setSelectedTableId(selected ? null : t.id)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 10,
                      backgroundColor: selected
                        ? "#ff572225"
                        : ocupada
                          ? C.warnBg
                          : C.sheet,
                      borderWidth: 1,
                      borderColor: selected
                        ? "#ff5722"
                        : ocupada
                          ? C.warnLine
                          : C.line,
                    }}
                  >
                    <Text
                      style={{
                        color: selected ? "#ff5722" : ocupada ? C.warnText : C.text,
                        fontSize: 14,
                        fontWeight: selected ? "800" : "600",
                      }}
                    >
                      Mesa {t.number_mesa}
                      {ocupada ? " · ocupada" : ""}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}
      </Section>

      {/* ─── 2. CLIENTE Y NOTAS ─── */}
      <Section title="Cliente y notas" icon="person-outline">
        <ClientPicker
          setSelectedClientId={setSelectedClientId}
          selectedClientId={selectedClientId}
          clients={clients}
          onClientCreated={onClientCreated}
        />

        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 6,
            marginBottom: 8,
          }}
        >
          {QUICK_NOTES.map((tag) => {
            const selected = note.includes(tag);
            return (
              <Pressable
                key={tag}
                onPress={() => handleTagPress(tag)}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 8,
                  backgroundColor: selected ? "#ff572233" : C.sheet,
                  borderWidth: 1,
                  borderColor: selected ? "#ff5722" : C.line,
                }}
              >
                <Text
                  style={{
                    color: selected ? "#ff5722" : C.soft,
                    fontSize: 14,
                    fontWeight: selected ? "700" : "500",
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
          onChangeText={setNote}
          placeholder="Nota o comentarios especiales..."
          value={note}
        />
      </Section>

      {/* ─── 3. PAGO ─── */}
      <Section title="Pago" icon="wallet-outline">
        {/* Contado / Fiado */}
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
          <Pressable onPress={() => setIsDebt(false)} style={pill(!isDebt)}>
            <Text
              style={{ color: !isDebt ? "#ff5722" : C.soft, fontWeight: "700" }}
            >
              Contado
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              setIsDebt(true);
              setAmountDebt(totalPrecio);
            }}
            style={pill(isDebt)}
          >
            <Text
              style={{ color: isDebt ? "#ff5722" : C.soft, fontWeight: "700" }}
            >
              Fiado
            </Text>
          </Pressable>
        </View>

        {/* Método (solo contado) */}
        {!isDebt && (
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
            {Object.values(PaymentMethods).map((method) => {
              const active = paymentMethod === method;
              return (
                <Pressable
                  key={method}
                  onPress={() => setPaymentMethod(method)}
                  style={pill(active)}
                >
                  {method === PaymentMethods.NEQUI ? (
                    <Image
                      source={require("@/assets/icons/nequi.png")}
                      style={{ width: 22, height: 22 }}
                    />
                  ) : (
                    <Ionicons name={method} size={22} color={active ? "#ff5722" : C.text} />
                  )}
                  <Text
                    style={{
                      color: active ? "#ff5722" : C.soft,
                      fontSize: 14,
                      fontWeight: "600",
                    }}
                  >
                    {METHOD_LABEL[method]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Calculadora de cambio */}
        {!isDebt && paymentMethod === PaymentMethods.CASH && (
          <View
            style={{ backgroundColor: C.sheet, borderRadius: 14, padding: 12 }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <Text style={{ color: C.soft, fontSize: 14, fontWeight: "700" }}>
                ¿Con cuánto paga?
              </Text>
              {numericCash > 0 && (
                <Pressable onPress={() => setCashReceived("")} hitSlop={8}>
                  <Text style={{ color: C.muted, fontSize: 13 }}>Limpiar</Text>
                </Pressable>
              )}
            </View>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: C.card,
                borderRadius: 12,
                paddingHorizontal: 14,
                height: 48,
                borderWidth: 1,
                borderColor:
                  numericCash >= totalPrecio && numericCash > 0
                    ? "#10b981"
                    : C.line,
                marginBottom: 8,
              }}
            >
              <Text
                style={{
                  color: "#ff5722",
                  fontSize: 20,
                  fontWeight: "800",
                  marginRight: 8,
                }}
              >
                $
              </Text>
              <TextInput
                placeholder="0"
                placeholderTextColor={C.faint}
                keyboardType="numeric"
                value={cashReceived}
                onChangeText={setCashReceived}
                style={{
                  color: C.text,
                  fontSize: 20,
                  fontWeight: "700",
                  flex: 1,
                }}
              />
            </View>

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
              {[totalPrecio, ...quickBills].map((bill, i) => (
                <Pressable
                  key={bill}
                  onPress={() => setCashReceived(String(bill))}
                  style={{
                    backgroundColor:
                      numericCash === bill ? "#ff572233" : C.sheet,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: numericCash === bill ? "#ff5722" : C.line,
                  }}
                >
                  <Text
                    style={{
                      color: numericCash === bill ? "#ff5722" : C.text,
                      fontSize: 13,
                      fontWeight: "700",
                    }}
                  >
                    {i === 0
                      ? `Exacto ${priceFormat(bill)}`
                      : priceFormat(bill)}
                  </Text>
                </Pressable>
              ))}
            </View>

            {numericCash > 0 && (
              <View
                style={{
                  marginTop: 10,
                  padding: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  backgroundColor:
                    changeAmount >= 0 ? "#10b98115" : "#f59e0b15",
                  borderColor: changeAmount >= 0 ? "#10b981" : "#f59e0b",
                }}
              >
                <Text
                  style={{
                    color: C.soft,
                    fontSize: 13,
                    fontWeight: "700",
                    textTransform: "uppercase",
                  }}
                >
                  {changeAmount >= 0 ? "Cambio a devolver" : "Faltan"}
                </Text>
                <Text
                  style={{
                    fontSize: 22,
                    fontWeight: "900",
                    color: changeAmount >= 0 ? C.okText : C.warnText,
                  }}
                >
                  {priceFormat(Math.abs(changeAmount))}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Fiado */}
        {isDebt && (
          <View style={{ gap: 10 }}>
            {!selectedClientId && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  backgroundColor: "#f59e0b15",
                  borderWidth: 1,
                  borderColor: "#f59e0b44",
                  padding: 10,
                  borderRadius: 12,
                }}
              >
                <Ionicons name="warning-outline" size={16} color="#f59e0b" />
                <Text
                  style={{
                    color: C.warnText,
                    fontSize: 14,
                    fontWeight: "600",
                    flex: 1,
                  }}
                >
                  Asigna un cliente arriba para poder fiar.
                </Text>
              </View>
            )}

            <View>
              <Text style={{ color: C.muted, fontSize: 13, marginBottom: 6 }}>
                Monto que quedan debiendo
              </Text>
              <TextInput
                keyboardType="numeric"
                value={String(amountDebt)}
                onChangeText={(t) =>
                  setAmountDebt(Number(t.replace(/[^0-9]/g, "")))
                }
                style={{
                  backgroundColor: C.sheet,
                  borderWidth: 1,
                  borderColor: C.line,
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  height: 48,
                  color: C.text,
                  fontSize: 18,
                  fontWeight: "700",
                }}
              />
            </View>

            <View>
              <Text style={{ color: C.muted, fontSize: 13, marginBottom: 6 }}>
                Fecha límite de pago
              </Text>
              <Pressable
                onPress={() => setShowDatePicker(true)}
                style={{
                  height: 48,
                  backgroundColor: C.sheet,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: C.line,
                  paddingHorizontal: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Text
                  style={{ color: C.text, fontSize: 17, fontWeight: "700" }}
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
                  onChange={(_, selectedDate) => {
                    setShowDatePicker(Platform.OS === "ios");
                    if (selectedDate) setDebtDate(selectedDate);
                  }}
                />
              )}
            </View>
          </View>
        )}
      </Section>
    </View>
  );
}
