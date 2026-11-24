// @theme-migrated
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, View } from "react-native";
import ShareMenuQRModal from "./qr-code/ShareMenuQRModal";
import QuickExpenseModal from "@/src/features/expenses/components/QuickExpenseModal";
import { useUserRole } from "@/src/shared/hooks/useUserRole";
import { C } from "@/src/core/theme/palette";

/** Reemplaza <QrCode /> en MenuScreen: gasto rápido + QR del menú. */
export default function QuickActions() {
  const [showQR, setShowQR] = useState(false);
  const [showExpense, setShowExpense] = useState(false);
  const { role } = useUserRole();

  const Btn = ({
    icon,
    onPress,
    bg,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
    bg: string;
  }) => (
    <Pressable
      onPress={onPress}
      style={{
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: bg,
        alignItems: "center",
        justifyContent: "center",
        elevation: 6,
      }}
    >
      <Ionicons name={icon} size={22} color={C.text} />
    </Pressable>
  );

  return (
    <>
      <View
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          zIndex: 50,
          flexDirection: "row",
          gap: 10,
        }}
      >
        {role !== "kitchen" && (
          <Btn
            icon="cash-outline"
            bg="#ef4444"
            onPress={() => setShowExpense(true)}
          />
        )}
        <Btn icon="qr-code" bg="#ff5722" onPress={() => setShowQR(true)} />
      </View>

      <QuickExpenseModal
        visible={showExpense}
        onClose={() => setShowExpense(false)}
      />
      <ShareMenuQRModal visible={showQR} onClose={() => setShowQR(false)} />
    </>
  );
}
