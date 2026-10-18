import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, View } from "react-native";
import ShareMenuQRModal from "./ShareMenuQRModal";

const QrCode = () => {
  const [showQRModal, setShowQRModal] = useState(false);
  return (
    <>
      {/* Float action button */}
      <View
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          zIndex: 50,
        }}
      >
        <Pressable
          onPress={() => setShowQRModal(true)}
          style={{
            width: 50,
            height: 50,
            borderRadius: 25,
            backgroundColor: "#ff5722",
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#ff5722",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 6,
          }}
        >
          <Ionicons name="qr-code" size={24} color="#fff" />
        </Pressable>
      </View>

      <ShareMenuQRModal
        visible={showQRModal}
        onClose={() => setShowQRModal(false)}
      />
    </>
  );
};

export default QrCode;
