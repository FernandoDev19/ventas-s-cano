import React, { useEffect, useState } from "react";
import {
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Switch,
  StyleSheet,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PrinterService, PrinterConfig } from "../../services/printer.service";

interface PrinterSettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function PrinterSettingsModal({
  visible,
  onClose,
}: PrinterSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<"caja" | "cocina">("caja");

  // State for Cashier (Caja) Printer
  const [cajaConfig, setCajaConfig] = useState<PrinterConfig>({
    enabled: true,
    type: "mock",
    address: "",
    port: 9100,
  });

  // State for Kitchen (Cocina) Printer
  const [cocinaConfig, setCocinaConfig] = useState<PrinterConfig>({
    enabled: true,
    type: "mock",
    address: "",
    port: 9100,
  });

  useEffect(() => {
    if (visible) {
      loadConfigs();
    }
  }, [visible]);

  const loadConfigs = async () => {
    const caja = await PrinterService.getConfig("caja");
    const cocina = await PrinterService.getConfig("cocina");
    setCajaConfig(caja);
    setCocinaConfig(cocina);
  };

  const handleSave = async () => {
    await PrinterService.saveConfig("caja", cajaConfig);
    await PrinterService.saveConfig("cocina", cocinaConfig);
    Alert.alert("¡Éxito!", "Configuración de impresoras guardada correctamente.");
    onClose();
  };

  const handleTestPrint = async () => {
    const config = activeTab === "caja" ? cajaConfig : cocinaConfig;
    if (!config.enabled) {
      Alert.alert("Aviso", "Habilita la impresora antes de realizar una prueba.");
      return;
    }

    const testCmds = [
      PrinterService.text("TICKET DE PRUEBA", "center", true, "large"),
      PrinterService.text(`FastPOS - Impresora ${activeTab.toUpperCase()}`, "center", true),
      PrinterService.line(),
      PrinterService.text(`Tipo de Conexión: ${config.type.toUpperCase()}`),
      PrinterService.text(`Destino: ${config.type === "wifi" ? `${config.address}:${config.port}` : "Simulador Local"}`),
      PrinterService.text(`Fecha/Hora: ${new Date().toLocaleString("es-CO")}`),
      PrinterService.line(),
      PrinterService.text("Si puedes leer esto, tu configuracion de impresion esta activa y funcionando.", "center"),
      PrinterService.line(),
      PrinterService.text("¡Todo Listo! 🍕🍟🥤", "center", true),
      PrinterService.feed(3),
      PrinterService.cut(),
    ];

    // Ejecutar impresión
    // Temporariamente aplicamos la config actual para la prueba antes de guardarla de forma permanente
    const oldConfig = await PrinterService.getConfig(activeTab);
    await PrinterService.saveConfig(activeTab, config);
    await PrinterService.print(activeTab, testCmds);
    await PrinterService.saveConfig(activeTab, oldConfig); // restaurar
  };

  const updateConfig = (
    target: "caja" | "cocina",
    key: keyof PrinterConfig,
    value: any
  ) => {
    if (target === "caja") {
      setCajaConfig((prev) => ({ ...prev, [key]: value }));
    } else {
      setCocinaConfig((prev) => ({ ...prev, [key]: value }));
    }
  };

  const currentConfig = activeTab === "caja" ? cajaConfig : cocinaConfig;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View className="flex-row items-center gap-2">
              <Ionicons name="print" size={24} color="#ff5722" />
              <Text className="text-white font-bold text-lg">
                Configuración de Impresoras
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#a3a3a3" />
            </TouchableOpacity>
          </View>

          {/* Selector de Impresora (Tabs) */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              onPress={() => setActiveTab("caja")}
              style={[
                styles.tab,
                activeTab === "caja" && styles.activeTab,
              ]}
            >
              <Ionicons
                name="wallet-outline"
                size={18}
                color={activeTab === "caja" ? "#ff5722" : "#a3a3a3"}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === "caja" && styles.activeTabText,
                ]}
              >
                Caja (Cliente)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab("cocina")}
              style={[
                styles.tab,
                activeTab === "cocina" && styles.activeTab,
              ]}
            >
              <Ionicons
                name="restaurant-outline"
                size={18}
                color={activeTab === "cocina" ? "#ff5722" : "#a3a3a3"}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === "cocina" && styles.activeTabText,
                ]}
              >
                Cocina (Comandas)
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form / Scroll Container */}
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Toggle Habilitada */}
            <View style={styles.card} className="flex-row justify-between items-center mb-6">
              <View>
                <Text className="text-white font-bold text-base">
                  Habilitar Impresora
                </Text>
                <Text className="text-neutral-400 text-xs mt-0.5">
                  Permitir impresión automática
                </Text>
              </View>
              <Switch
                value={currentConfig.enabled}
                onValueChange={(val) => updateConfig(activeTab, "enabled", val)}
                trackColor={{ false: "#262626", true: "#ff5722" }}
                thumbColor={currentConfig.enabled ? "#ffffff" : "#737373"}
              />
            </View>

            {currentConfig.enabled && (
              <>
                {/* Tipo de Conexión */}
                <Text className="text-neutral-400 font-semibold text-xs uppercase tracking-wider mb-2">
                  Tipo de Conexión
                </Text>
                <View style={styles.connTypesContainer}>
                  {([
                    { id: "mock", label: "Virtual", icon: "laptop" },
                    { id: "wifi", label: "Red/WiFi", icon: "wifi" },
                    { id: "bluetooth", label: "Bluetooth", icon: "bluetooth" },
                    { id: "usb", label: "USB", icon: "settings" },
                  ] as const).map((type) => (
                    <TouchableOpacity
                      key={type.id}
                      onPress={() => updateConfig(activeTab, "type", type.id)}
                      style={[
                        styles.connTypeBtn,
                        currentConfig.type === type.id && styles.connTypeBtnActive,
                      ]}
                    >
                      <Ionicons
                        name={type.icon}
                        size={20}
                        color={currentConfig.type === type.id ? "#ffffff" : "#a3a3a3"}
                      />
                      <Text
                        style={[
                          styles.connTypeLabel,
                          currentConfig.type === type.id && styles.connTypeLabelActive,
                        ]}
                      >
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Campos Específicos por Tipo */}
                <View className="mt-6">
                  {currentConfig.type === "wifi" && (
                    <View className="gap-4">
                      <View>
                        <Text className="text-neutral-400 font-medium text-xs mb-1.5">
                          Dirección IP de la Impresora
                        </Text>
                        <TextInput
                          style={styles.input}
                          value={currentConfig.address}
                          onChangeText={(val) => updateConfig(activeTab, "address", val)}
                          placeholder="Ej: 192.168.1.100"
                          placeholderTextColor="#525252"
                          keyboardType="numeric"
                        />
                      </View>
                      <View>
                        <Text className="text-neutral-400 font-medium text-xs mb-1.5">
                          Puerto TCP
                        </Text>
                        <TextInput
                          style={styles.input}
                          value={String(currentConfig.port)}
                          onChangeText={(val) => updateConfig(activeTab, "port", parseInt(val) || 0)}
                          placeholder="Ej: 9100"
                          placeholderTextColor="#525252"
                          keyboardType="numeric"
                        />
                      </View>
                    </View>
                  )}

                  {currentConfig.type === "bluetooth" && (
                    <View>
                      <Text className="text-neutral-400 font-medium text-xs mb-1.5">
                        Nombre o Dirección MAC del Dispositivo
                      </Text>
                      <TextInput
                        style={styles.input}
                        value={currentConfig.address}
                        onChangeText={(val) => updateConfig(activeTab, "address", val)}
                        placeholder="Ej: InnerPrinter o 00:11:22:33:44:55"
                        placeholderTextColor="#525252"
                      />
                      <Text className="text-neutral-500 text-xs mt-1.5 leading-4">
                        Asegúrate de emparejar el dispositivo bluetooth desde la configuración de tu teléfono antes de imprimir.
                      </Text>
                    </View>
                  )}

                  {currentConfig.type === "usb" && (
                    <View>
                      <Text className="text-neutral-400 font-medium text-xs mb-1.5">
                        Ruta o Identificador de Puerto USB
                      </Text>
                      <TextInput
                        style={styles.input}
                        value={currentConfig.address}
                        onChangeText={(val) => updateConfig(activeTab, "address", val)}
                        placeholder="Ej: /dev/usb/lp0"
                        placeholderTextColor="#525252"
                      />
                    </View>
                  )}

                  {currentConfig.type === "mock" && (
                    <View className="bg-neutral-800/40 p-4 rounded-xl border border-neutral-800">
                      <Text className="text-neutral-300 font-semibold text-sm mb-1">
                        Impresora de Simulación Habilitada
                      </Text>
                      <Text className="text-neutral-400 text-xs leading-4">
                        El ticket se generará como comandos ESC/POS estándar y se renderizará de forma visual dentro del visor retro-térmico de la app.
                      </Text>
                    </View>
                  )}
                </View>

                {/* Botón de Impresión de Prueba */}
                <TouchableOpacity
                  onPress={handleTestPrint}
                  style={styles.testBtn}
                  className="mt-8 flex-row items-center justify-center gap-2"
                >
                  <Ionicons name="sparkles-outline" size={18} color="#ff5722" />
                  <Text className="text-primary font-bold text-sm">
                    Imprimir Ticket de Prueba
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.actionBtn, styles.cancelBtn]}
            >
              <Text className="text-neutral-400 font-semibold">Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSave}
              style={[styles.actionBtn, styles.saveBtn]}
            >
              <Text className="text-white font-bold">Guardar Cambios</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#0d0d0d",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: "85%",
    borderTopWidth: 1,
    borderColor: "#1f1f1f",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  closeBtn: {
    padding: 4,
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 24,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderColor: "#171717",
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderColor: "transparent",
  },
  activeTab: {
    borderColor: "#ff5722",
  },
  tabText: {
    color: "#737373",
    fontWeight: "bold",
    fontSize: 14,
  },
  activeTabText: {
    color: "#ff5722",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  card: {
    backgroundColor: "#171717",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#262626",
  },
  connTypesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  connTypeBtn: {
    width: "48%",
    backgroundColor: "#171717",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignItems: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: "#262626",
  },
  connTypeBtnActive: {
    backgroundColor: "#ff5722",
    borderColor: "#ff5722",
  },
  connTypeLabel: {
    color: "#a3a3a3",
    fontSize: 12,
    fontWeight: "bold",
  },
  connTypeLabelActive: {
    color: "#ffffff",
  },
  input: {
    backgroundColor: "#171717",
    color: "#ffffff",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#262626",
  },
  testBtn: {
    borderWidth: 1.5,
    borderColor: "#ff5722",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    flexDirection: "row",
    padding: 24,
    gap: 12,
    borderTopWidth: 1,
    borderColor: "#171717",
    backgroundColor: "#0d0d0d",
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtn: {
    backgroundColor: "#171717",
  },
  saveBtn: {
    backgroundColor: "#ff5722",
  },
});
