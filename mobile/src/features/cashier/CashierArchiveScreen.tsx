import { useCashier } from "@/src/features/cashier/hooks/useCashier";
import { priceFormat } from "@/src/shared/helpers/price-format.helper";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  FlatList,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import OpenShiftModal from "./components/OpenShiftModal";
import CashMovementModal from "./components/CashMovementModal";

type CalculatedTotals = Awaited<
  ReturnType<
    typeof import("./services/cashier.service").CashierService.calculateShiftTotals
  >
>;

export default function CashierArchiveScreen() {
  const {
    currentShift,
    movements,
    isLoading,
    openShift,
    addMovement,
    closeShift,
    calculateTotals,
  } = useCashier();

  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [totals, setTotals] = useState<CalculatedTotals | null>(null);
  const [actualAmount, setActualAmount] = useState("");
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (currentShift && currentShift.status === "open") {
      calculateTotals().then(setTotals);
    }
  }, [currentShift, movements, calculateTotals]);

  const handleCloseShift = async () => {
    const parsed = parseFloat(actualAmount.replace(/,/g, ""));
    if (!parsed || parsed < 0) {
      Alert.alert("Monto inválido", "Ingresa el monto real de caja");
      return;
    }

    setIsClosing(true);
    try {
      await closeShift(parsed);
      setActualAmount("");
      setShowCloseModal(false);
      Alert.alert(
        "Turno Cerrado",
        `Diferencia: ${priceFormat(parsed - (totals?.expectedTotal || 0))}`,
      );
    } finally {
      setIsClosing(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#ff5722" />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#0f0f0f" }}>
      <View style={{ padding: 16 }}>
        {/* Estado del Turno */}
        {currentShift && currentShift.status === "open" ? (
          <>
            {/* Info del Turno */}
            <View
              style={{
                backgroundColor: "#1a1a1a",
                borderRadius: 16,
                padding: 16,
                marginBottom: 16,
                borderLeftWidth: 4,
                borderLeftColor: "#22c55e",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <Text
                  style={{
                    color: "#22c55e",
                    fontSize: 12,
                    fontWeight: "700",
                    textTransform: "uppercase",
                  }}
                >
                  ● Turno Abierto
                </Text>
                <Text style={{ color: "#a3a3a3", fontSize: 12 }}>
                  {new Date(currentShift.opening_date).toLocaleDateString(
                    "es-CO",
                  )}{" "}
                  {currentShift.opening_time}
                </Text>
              </View>

              <Text
                style={{
                  color: "#737373",
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  marginBottom: 4,
                }}
              >
                Base de Caja
              </Text>
              <Text
                style={{
                  color: "#fff",
                  fontSize: 28,
                  fontWeight: "900",
                  marginBottom: 16,
                }}
              >
                {priceFormat(currentShift.opening_balance)}
              </Text>

              {/* Totales */}
              {totals && (
                <View
                  style={{
                    marginBottom: 16,
                    paddingBottom: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: "#2a2a2a",
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      marginBottom: 8,
                    }}
                  >
                    <Text style={{ color: "#737373", fontSize: 12 }}>
                      Ventas (contado):
                    </Text>
                    <Text style={{ color: "#fff", fontWeight: "600" }}>
                      {priceFormat(totals.salesTotal)}
                    </Text>
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      marginBottom: 8,
                    }}
                  >
                    <Text style={{ color: "#737373", fontSize: 12 }}>
                      Movimientos netos:
                    </Text>
                    <Text
                      style={{
                        color: totals.movementsNet >= 0 ? "#22c55e" : "#ef4444",
                        fontWeight: "600",
                      }}
                    >
                      {totals.movementsNet >= 0 ? "+" : "-"}
                      {priceFormat(Math.abs(totals.movementsNet))}
                    </Text>
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      paddingTop: 8,
                      borderTopWidth: 1,
                      borderTopColor: "#2a2a2a",
                    }}
                  >
                    <Text
                      style={{
                        color: "#a3a3a3",
                        fontSize: 13,
                        fontWeight: "700",
                      }}
                    >
                      Esperado:
                    </Text>
                    <Text
                      style={{
                        color: "#ff5722",
                        fontSize: 16,
                        fontWeight: "900",
                      }}
                    >
                      {priceFormat(totals.expectedTotal)}
                    </Text>
                  </View>
                </View>
              )}

              {/* Botones */}
              <View style={{ flexDirection: "row", gap: 10 }}>
                <Pressable
                  onPress={() => setShowMovementModal(true)}
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    backgroundColor: "#ff572222",
                    paddingVertical: 10,
                    borderRadius: 10,
                  }}
                >
                  <Ionicons name="swap-vertical" size={16} color="#ff5722" />
                  <Text
                    style={{
                      color: "#ff5722",
                      fontWeight: "700",
                      fontSize: 12,
                    }}
                  >
                    Movimiento
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setShowCloseModal(true)}
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    backgroundColor: "#ef4444",
                    paddingVertical: 10,
                    borderRadius: 10,
                  }}
                >
                  <Ionicons name="lock-closed-outline" size={16} color="#fff" />
                  <Text
                    style={{ color: "#fff", fontWeight: "700", fontSize: 12 }}
                  >
                    Cerrar
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Movimientos */}
            {movements.length > 0 && (
              <View
                style={{
                  backgroundColor: "#1a1a1a",
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 16,
                }}
              >
                <Text
                  style={{ color: "#fff", fontWeight: "800", marginBottom: 12 }}
                >
                  Movimientos ({movements.length})
                </Text>
                <FlatList
                  data={movements}
                  keyExtractor={(m) => m.id}
                  scrollEnabled={false}
                  renderItem={({ item }) => (
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        paddingVertical: 8,
                        borderBottomWidth: 1,
                        borderBottomColor: "#2a2a2a",
                      }}
                    >
                      <View>
                        <Text
                          style={{
                            color: "#fff",
                            fontWeight: "600",
                            fontSize: 13,
                          }}
                        >
                          {item.description}
                        </Text>
                        <Text
                          style={{
                            color: "#737373",
                            fontSize: 11,
                            marginTop: 2,
                          }}
                        >
                          {new Date(item.created_at).toLocaleTimeString(
                            "es-CO",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </Text>
                      </View>
                      <Text
                        style={{
                          fontWeight: "700",
                          color: item.type === "entry" ? "#22c55e" : "#ef4444",
                        }}
                      >
                        {item.type === "entry" ? "+" : "-"}
                        {priceFormat(item.amount)}
                      </Text>
                    </View>
                  )}
                />
              </View>
            )}
          </>
        ) : (
          <Pressable
            onPress={() => setShowOpenModal(true)}
            style={{
              backgroundColor: "#1a1a1a",
              borderRadius: 16,
              padding: 24,
              alignItems: "center",
              borderWidth: 2,
              borderColor: "#2a2a2a",
              borderStyle: "dashed",
            }}
          >
            <Ionicons
              name="wallet-outline"
              size={36}
              color="#ff5722"
              style={{ marginBottom: 12 }}
            />
            <Text
              style={{
                color: "#fff",
                fontSize: 16,
                fontWeight: "700",
                marginBottom: 4,
              }}
            >
              No hay turno abierto
            </Text>
            <Text
              style={{ color: "#737373", fontSize: 12, textAlign: "center" }}
            >
              Toca aquí para abrir un nuevo turno
            </Text>
          </Pressable>
        )}
      </View>

      {/* Modales */}
      <OpenShiftModal
        visible={showOpenModal}
        onClose={() => setShowOpenModal(false)}
        onOpen={openShift}
      />

      <CashMovementModal
        visible={showMovementModal}
        onClose={() => setShowMovementModal(false)}
        onAdd={addMovement}
      />

      {/* Modal Cierre */}
      {showCloseModal && (
        <View
          style={{
            ...StyleSheet,
            backgroundColor: "rgba(0,0,0,0.6)",
            justifyContent: "center",
            alignItems: "center",
            padding: 24,
          }}
        >
          <View
            style={{
              backgroundColor: "#141414",
              borderRadius: 24,
              padding: 24,
              width: "100%",
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontSize: 20,
                fontWeight: "800",
                marginBottom: 16,
              }}
            >
              Cerrar Turno
            </Text>

            <Text
              style={{
                color: "#737373",
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: 1,
                marginBottom: 6,
              }}
            >
              Monto Real en Caja
            </Text>
            <View
              style={{
                backgroundColor: "#1a1a1a",
                borderRadius: 12,
                paddingHorizontal: 14,
                marginBottom: 24,
                borderWidth: 1,
                borderColor: "#2a2a2a",
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: "#ff5722",
                  fontSize: 16,
                  fontWeight: "800",
                  marginRight: 4,
                }}
              >
                $
              </Text>
              <TextInput
                placeholder="0"
                placeholderTextColor="#555"
                value={actualAmount}
                onChangeText={setActualAmount}
                keyboardType="numeric"
                style={{ color: "#fff", fontSize: 16, flex: 1, height: 46 }}
              />
            </View>

            <View style={{ flexDirection: "row", gap: 12 }}>
              <Pressable
                onPress={() => {
                  setShowCloseModal(false);
                  setActualAmount("");
                }}
                disabled={isClosing}
                style={{
                  flex: 1,
                  backgroundColor: "#2a2a2a",
                  paddingVertical: 14,
                  borderRadius: 12,
                  alignItems: "center",
                  opacity: isClosing ? 0.5 : 1,
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>
                  Cancelar
                </Text>
              </Pressable>
              <Pressable
                onPress={handleCloseShift}
                disabled={isClosing}
                style={{
                  flex: 1,
                  backgroundColor: "#ff5722",
                  paddingVertical: 14,
                  borderRadius: 12,
                  alignItems: "center",
                  opacity: isClosing ? 0.5 : 1,
                }}
              >
                {isClosing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: "#fff", fontWeight: "800" }}>
                    Cerrar
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}