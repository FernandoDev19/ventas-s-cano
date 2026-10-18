import React, { useEffect, useState } from "react";
import {
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PrinterService, PrintCommand } from "../../services/printer.service";

export default function VirtualPrinterModal() {
  const [visible, setVisible] = useState(false);
  const [target, setTarget] = useState<"caja" | "cocina">("caja");
  const [commands, setCommands] = useState<PrintCommand[]>([]);

  useEffect(() => {
    // Suscribirse a los eventos de impresión
    const unsubscribe = PrinterService.subscribe((tgt, cmds) => {
      setTarget(tgt);
      setCommands(cmds);
      setVisible(true);
    });

    return () => unsubscribe();
  }, []);

  if (!visible) return null;

  const handleClose = () => {
    setVisible(false);
  };

  // Convertir los comandos ESC/POS a elementos de UI de React Native
  const renderReceiptContent = () => {
    return commands.map((cmd, idx) => {
      switch (cmd.type) {
        case "text": {
          const textStyle: any = [styles.receiptText];

          // Alineación
          if (cmd.align === "center") textStyle.push(styles.textCenter);
          if (cmd.align === "right") textStyle.push(styles.textRight);

          // Negrita
          if (cmd.bold) textStyle.push(styles.textBold);

          // Tamaño de fuente
          if (cmd.size === "large") {
            textStyle.push(styles.textLarge);
          } else if (cmd.size === "title") {
            textStyle.push(styles.textTitle);
          }

          return (
            <Text key={idx} style={textStyle}>
              {cmd.text || " "}
            </Text>
          );
        }
        case "line":
          return (
            <Text key={idx} style={[styles.receiptText, styles.dividerLine]}>
              --------------------------------
            </Text>
          );
        case "feed": {
          const feeds = [];
          const count = cmd.lines || 1;
          for (let i = 0; i < count; i++) {
            feeds.push(<View key={`${idx}-${i}`} style={styles.feedSpace} />);
          }
          return feeds;
        }
        case "cut":
          return (
            <View key={idx} style={styles.cutLineContainer}>
              <View style={styles.cutLine} />
              <View className="bg-neutral-100 px-2 py-0.5 rounded flex-row items-center">
                <Ionicons name="cut-outline" size={12} color="#888" />
                <Text style={styles.cutText}>CORTE DE PAPEL</Text>
              </View>
              <View style={styles.cutLine} />
            </View>
          );
        default:
          return null;
      }
    });
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View className="flex-row items-center gap-2">
              <View
                className={`w-3 h-3 rounded-full ${
                  target === "caja" ? "bg-orange-500" : "bg-emerald-500"
                }`}
              />
              <Text style={styles.headerTitle}>
                Impresora Virtual: {target.toUpperCase()}
              </Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          {/* Subtitle / Info */}
          <View className="bg-neutral-800 px-4 py-2 border-b border-neutral-700 flex-row justify-between items-center">
            <Text className="text-neutral-400 text-xs font-semibold">
              Simulación de Tirilla Térmica (58mm)
            </Text>
            <Text className="text-neutral-500 text-[10px]">ESC/POS Mode</Text>
          </View>

          {/* Ticket Body / Paper Roll */}
          <ScrollView
            style={styles.paperScroll}
            contentContainerStyle={styles.paperContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.ticketPaper}>
              {/* Jagged border at top */}
              <View style={styles.jaggedBorder} />

              <View style={styles.receiptContainer}>
                {renderReceiptContent()}
              </View>

              {/* Jagged border at bottom */}
              <View style={styles.jaggedBorderBottom} />
            </View>
          </ScrollView>

          {/* Actions Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={handleClose}
              style={[
                styles.actionBtn,
                {
                  backgroundColor:
                    target === "caja" ? "#ff5722" : "#059669",
                },
              ]}
              className="flex-row items-center justify-center gap-2"
            >
              <Ionicons name="checkmark-circle-outline" size={20} color="white" />
              <Text className="text-white font-bold text-sm">
                Retirar Ticket (Listo)
              </Text>
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
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container: {
    width: "100%",
    maxWidth: 360,
    height: "80%",
    backgroundColor: "#171717",
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#262626",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#171717",
    borderBottomWidth: 1,
    borderColor: "#262626",
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  closeBtn: {
    padding: 4,
  },
  paperScroll: {
    flex: 1,
    backgroundColor: "#121212",
  },
  paperContent: {
    padding: 16,
    alignItems: "center",
  },
  ticketPaper: {
    width: 280,
    backgroundColor: "#fbfaf7", // Papel térmico crema/hueso
    borderRadius: 2,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  receiptContainer: {
    paddingVertical: 20,
    paddingHorizontal: 14,
  },
  receiptText: {
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
    fontSize: 12,
    color: "#1c1917", // Negro piedra
    lineHeight: 16,
  },
  textCenter: {
    textAlign: "center",
  },
  textRight: {
    textAlign: "right",
  },
  textBold: {
    fontWeight: "bold",
  },
  textLarge: {
    fontSize: 15,
    lineHeight: 20,
  },
  textTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "900",
    marginVertical: 4,
  },
  dividerLine: {
    color: "#78716c",
    marginVertical: 6,
  },
  feedSpace: {
    height: 12,
  },
  cutLineContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 12,
  },
  cutLine: {
    flex: 1,
    height: 1,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  cutText: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#94a3b8",
    marginLeft: 4,
    letterSpacing: 1,
  },
  jaggedBorder: {
    height: 6,
    width: "100%",
    backgroundColor: "#fbfaf7",
    borderTopWidth: 2,
    borderStyle: "dashed",
    borderColor: "#e7e5e4",
  },
  jaggedBorderBottom: {
    height: 6,
    width: "100%",
    backgroundColor: "#fbfaf7",
    borderBottomWidth: 2,
    borderStyle: "dashed",
    borderColor: "#e7e5e4",
  },
  footer: {
    padding: 16,
    backgroundColor: "#171717",
    borderTopWidth: 1,
    borderColor: "#262626",
  },
  actionBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
});
