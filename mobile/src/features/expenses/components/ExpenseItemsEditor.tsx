// @theme-migrated
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Image, Pressable, Switch, Text, TextInput, View } from "react-native";
import SheetModal from "@/src/shared/components/ui/SheetModal";
import { priceFormat } from "@/src/shared/helpers/price-format.helper";
import { ProductType } from "@/src/features/inventory/types/product.type";
import { ExpenseItemType } from "../types/expense.type";
import { C } from "@/src/core/theme/palette";

export type ExpenseRow = {
  key: string;
  product_id: string | null;
  name: string;
  qty: string;
  cost: string;
  add_to_stock: boolean;
};

const toQty = (s: string) => parseFloat(s.replace(",", ".")) || 0;
const toMoney = (s: string) => Number(s.replace(/[^0-9]/g, "")) || 0;
const newKey = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export const rowsTotal = (rows: ExpenseRow[]) =>
  rows.reduce((sum, r) => sum + toQty(r.qty) * toMoney(r.cost), 0);

export const rowsToItems = (rows: ExpenseRow[]): ExpenseItemType[] =>
  rows
    .filter((r) => r.name.trim() && toQty(r.qty) > 0)
    .map((r) => ({
      product_id: r.product_id,
      name: r.name.trim(),
      quantity: toQty(r.qty),
      unit_cost: toMoney(r.cost),
      add_to_stock: r.add_to_stock && !!r.product_id,
    }));

type Props = {
  rows: ExpenseRow[];
  onChange: (rows: ExpenseRow[]) => void;
  products: ProductType[];
  allowProducts: boolean; // false en inversión: solo ítems libres
};

export default function ExpenseItemsEditor({
  rows,
  onChange,
  products,
  allowProducts,
}: Props) {
  const [showPicker, setShowPicker] = useState(false);
  const [search, setSearch] = useState("");

  const patch = (key: string, p: Partial<ExpenseRow>) =>
    onChange(rows.map((r) => (r.key === key ? { ...r, ...p } : r)));

  const addProduct = (prod: ProductType) => {
    const existing = rows.find((r) => r.product_id === prod.id);
    if (existing) {
      patch(existing.key, { qty: String(toQty(existing.qty) + 1) });
    } else {
      onChange([
        ...rows,
        {
          key: newKey(),
          product_id: prod.id,
          name: prod.name,
          qty: "1",
          cost: "",
          add_to_stock: true,
        },
      ]);
    }
    setShowPicker(false);
    setSearch("");
  };

  const addFree = () =>
    onChange([
      ...rows,
      {
        key: newKey(),
        product_id: null,
        name: "",
        qty: "1",
        cost: "",
        add_to_stock: false,
      },
    ]);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  const smallInput = {
    backgroundColor: C.bg,
    color: C.text,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 38,
    fontSize: 16,
    borderWidth: 1,
    borderColor: C.line,
  } as const;

  return (
    <View style={{ marginBottom: 16 }}>
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
            color: C.muted,
            fontSize: 13,
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          Productos / ítems de la compra
        </Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {allowProducts && (
            <Pressable
              onPress={() => setShowPicker(true)}
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
              <Ionicons name="cube-outline" size={13} color="#ff5722" />
              <Text
                style={{ color: "#ff5722", fontSize: 14, fontWeight: "700" }}
              >
                Producto
              </Text>
            </Pressable>
          )}
          <Pressable
            onPress={addFree}
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
            <Ionicons name="add" size={14} color="#ff5722" />
            <Text style={{ color: "#ff5722", fontSize: 14, fontWeight: "700" }}>
              Ítem libre
            </Text>
          </Pressable>
        </View>
      </View>

      {rows.length === 0 ? (
        <View
          style={{
            backgroundColor: C.card,
            borderRadius: 14,
            padding: 18,
            alignItems: "center",
            borderWidth: 1,
            borderColor: C.line,
            borderStyle: "dashed",
          }}
        >
          <Ionicons name="basket-outline" size={26} color="#444" />
          <Text
            style={{
              color: C.faint,
              fontSize: 14,
              marginTop: 6,
              textAlign: "center",
            }}
          >
            Opcional. Agrega lo que compraste para llevar el detalle
            {allowProducts ? " y sumarlo al inventario." : "."}
          </Text>
        </View>
      ) : (
        <View style={{ gap: 8 }}>
          {rows.map((r) => {
            const sub = toQty(r.qty) * toMoney(r.cost);
            return (
              <View
                key={r.key}
                style={{
                  backgroundColor: C.card,
                  borderRadius: 14,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: C.line,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 8,
                  }}
                >
                  {r.product_id ? (
                    <Text
                      style={{
                        color: C.text,
                        fontWeight: "700",
                        fontSize: 16,
                        flex: 1,
                      }}
                      numberOfLines={1}
                    >
                      {r.name}
                    </Text>
                  ) : (
                    <TextInput
                      value={r.name}
                      onChangeText={(t) => patch(r.key, { name: t })}
                      placeholder="Ej. Freidora, gas, bolsas..."
                      placeholderTextColor={C.faint}
                      style={[smallInput, { flex: 1 }]}
                    />
                  )}
                  <Pressable
                    onPress={() =>
                      onChange(rows.filter((x) => x.key !== r.key))
                    }
                    hitSlop={8}
                  >
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                  </Pressable>
                </View>

                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  <TextInput
                    value={r.qty}
                    onChangeText={(t) => patch(r.key, { qty: t })}
                    keyboardType="decimal-pad"
                    placeholder="Cant."
                    placeholderTextColor={C.faint}
                    style={[smallInput, { width: 70, textAlign: "center" }]}
                  />
                  <Text style={{ color: C.muted }}>×</Text>
                  <View
                    style={[
                      smallInput,
                      {
                        flex: 1,
                        flexDirection: "row",
                        alignItems: "center",
                        paddingHorizontal: 8,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: "#ff5722",
                        fontWeight: "800",
                        marginRight: 4,
                      }}
                    >
                      $
                    </Text>
                    <TextInput
                      value={r.cost}
                      onChangeText={(t) => patch(r.key, { cost: t })}
                      keyboardType="numeric"
                      placeholder="Costo unit."
                      placeholderTextColor={C.faint}
                      style={{ flex: 1, color: C.text, fontSize: 16 }}
                    />
                  </View>
                  <Text
                    style={{
                      color: C.text,
                      fontWeight: "800",
                      minWidth: 70,
                      textAlign: "right",
                    }}
                  >
                    {priceFormat(sub)}
                  </Text>
                </View>

                {r.product_id && (
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginTop: 10,
                    }}
                  >
                    <Text style={{ color: C.soft, fontSize: 14 }}>
                      Sumar al inventario
                    </Text>
                    <Switch
                      value={r.add_to_stock}
                      onValueChange={(v) => patch(r.key, { add_to_stock: v })}
                      trackColor={{ false: C.line, true: "#ff572233" }}
                      thumbColor={r.add_to_stock ? "#ff5722" : C.soft}
                    />
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}

      <SheetModal
        visible={showPicker}
        onClose={() => setShowPicker(false)}
        title="Seleccionar producto"
      >
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar producto..."
          placeholderTextColor={C.faint}
          style={{
            backgroundColor: C.card,
            color: C.text,
            borderRadius: 12,
            paddingHorizontal: 14,
            height: 46,
            borderWidth: 1,
            borderColor: C.line,
            marginBottom: 12,
          }}
        />
        <View style={{ gap: 8, paddingBottom: 16 }}>
          {filtered.map((p) => {
            const inList = rows.some((r) => r.product_id === p.id);
            return (
              <Pressable
                key={p.id}
                onPress={() => addProduct(p)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  padding: 12,
                  borderRadius: 12,
                  backgroundColor: C.card,
                  borderWidth: 1,
                  borderColor: inList ? "#ff5722" : C.line,
                }}
              >
                <Image
                  source={
                    p.image_url
                      ? { uri: p.image_url }
                      : require("@/assets/images/default-food.png")
                  }
                  style={{ width: 40, height: 40, borderRadius: 8 }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: C.text, fontWeight: "600" }}>
                    {p.name}
                  </Text>
                  <Text style={{ color: C.muted, fontSize: 14 }}>
                    Stock actual: {p.stock}
                  </Text>
                </View>
                {inList && (
                  <Ionicons name="checkmark-circle" size={20} color="#ff5722" />
                )}
              </Pressable>
            );
          })}
          {filtered.length === 0 && (
            <Text
              style={{ color: C.faint, textAlign: "center", marginTop: 16 }}
            >
              Sin resultados
            </Text>
          )}
        </View>
      </SheetModal>
    </View>
  );
}
