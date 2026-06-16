import { useState, useRef } from "react";
import {
  Modal,
  Pressable,
  Text,
  View,
  Alert,
  ActivityIndicator,
  Share,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import QRCode from "react-native-qrcode-svg";
import * as Sharing from "expo-sharing";
import * as Print from "expo-print";
import * as Clipboard from "expo-clipboard";
import { Directory, File, Paths } from "expo-file-system";

type Props = {
  visible: boolean;
  onClose: () => void;
};

const MENU_URL = "https://menu-sabor-espress.netlify.app/";

export default function ShareMenuQRModal({ visible, onClose }: Props) {
  const qrRef = useRef<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `🍽️ ¡Conoce nuestro menú! Escanea el código QR:\n\n${MENU_URL}`,
        url: MENU_URL, // iOS
        title: "Menú - Sabor Espress",
      });
    } catch (error) {
      console.error(error);
    }
  };
  const handleShareViaWhatsApp = async () => {
    if (!qrRef.current) {
      Alert.alert("Error", "El código QR aún no está listo.");
      return;
    }

    try {
      setIsGenerating(true);

      // 1. Obtener los datos Base64 del componente QR
      qrRef.current.toDataURL(async (dataURL: string) => {
        try {
          // 2. Instanciar la carpeta temporal usando la nueva clase Paths
          const cacheDir = new Directory(Paths.cache);

          // 3. Crear una referencia al archivo destino (dentro de la carpeta cache)
          const qrFile = new File(cacheDir, "QR_Sabor_Espress.png");

          // 4. Escribir los datos binarios directamente usando el nuevo método del archivo
          // Indicamos que los datos provienen de un formato base64
          qrFile.write(dataURL, { encoding: "base64" });

          // 5. Compartir usando el URI nativo que expone el objeto File (.uri)
          await Sharing.shareAsync(qrFile.uri, {
            mimeType: "image/png",
            dialogTitle: "Compartir QR del Menú por WhatsApp",
          });
        } catch (error) {
          console.error("Error al guardar con la nueva API:", error);
          await Clipboard.setStringAsync(MENU_URL);
          Alert.alert(
            "Enlace copiado",
            "No se pudo generar la imagen. ¡Enlace copiado!",
          );
        } finally {
          setIsGenerating(false);
        }
      });
    } catch (error) {
      console.error(error);
      setIsGenerating(false);
      Alert.alert("Error", "Hubo un problema al procesar el código QR.");
    }
  };

  const handlePrintQR = async () => {
    if (!qrRef.current) {
      Alert.alert("Error", "El código QR aún no está listo.");
      return;
    }

    try {
      setIsGenerating(true);

      qrRef.current.toDataURL(async (dataURL: string) => {
        const html = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8"/>
            <style>
              body { 
                margin: 0; 
                padding: 40px;
                text-align: center;
                font-family: Arial, sans-serif;
                background: white;
              }
              h1 {
                color: #ff5722;
                margin: 0 0 20px 0;
                font-size: 28px;
              }
              p {
                color: #666;
                margin: 10px 0;
                font-size: 14px;
              }
              .qr-container {
                margin: 30px 0;
                padding: 20px;
                border: 2px solid #ff5722;
                border-radius: 10px;
                display: inline-block;
              }
              .url {
                font-size: 16px;
                color: #ff5722;
                font-weight: bold;
                margin-top: 20px;
              }
            </style>
          </head>
          <body>
            <h1>🍽️ Sabor Espress</h1>
            <p>Escanea el código QR para ver nuestro menú completo</p>
            
            <div class="qr-container">
              <img src="data:image/png;base64,${dataURL}" 
                   style="width: 250px; height: 250px;" alt="QR Code" />
            </div>
            
            <p class="url">${MENU_URL}</p>
            <p style="font-size: 12px; margin-top: 40px; color: #999;">
              O visítanos en línea para conocer todos nuestros platos
            </p>
          </body>
          </html>
        `;

        try {
          await Print.printAsync({ html });
        } catch (error) {
          Alert.alert("Error", "No se pudo imprimir el código QR");
          console.error(error);
        } finally {
          setIsGenerating(false);
        }
      });
    } catch (error) {
      Alert.alert("Error", "No se pudo imprimir el código QR");
      console.error(error);
      setIsGenerating(false);
    }
  };

  const handleCopyLink = async () => {
    await Clipboard.setStringAsync(MENU_URL);
    Alert.alert("✅ Copiado", "El enlace del menú se copió al portapapeles");
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.6)",
          justifyContent: "flex-end",
        }}
      >
        <ScrollView
          style={{
            backgroundColor: "#141414",
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            padding: 24,
            paddingBottom: 40,
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 24,
            }}
          >
            <View>
              <Text
                style={{
                  color: "#ff5722",
                  fontSize: 11,
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                Compartir Menú
              </Text>
              <Text
                style={{
                  color: "#fff",
                  fontSize: 20,
                  fontWeight: "800",
                  marginTop: 4,
                }}
              >
                QR del Menú Digital
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              style={{
                backgroundColor: "#2a2a2a",
                borderRadius: 20,
                padding: 8,
              }}
            >
              <Ionicons name="close" size={20} color="#fff" />
            </Pressable>
          </View>

          {/* QR Code Container */}
          <View
            style={{
              alignItems: "center",
              marginBottom: 24,
              padding: 20,
              backgroundColor: "#1a1a1a",
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "#2a2a2a",
            }}
          >
            <Text
              style={{
                color: "#737373",
                fontSize: 12,
                marginBottom: 16,
                fontWeight: "600",
              }}
            >
              Código QR del Menú
            </Text>

            {/* ✅ QR Code */}
            <View
              style={{
                padding: 20,
                backgroundColor: "#fff",
                borderRadius: 12,
                marginBottom: 16,
              }}
            >
              <QRCode
                value={MENU_URL}
                size={220}
                color="#ff5722"
                backgroundColor="#fff"
                logo={require("@/assets/images/icon.png")}
                logoSize={50}
                getRef={(c) => (qrRef.current = c)}
              />
            </View>

            {/* URL Text */}
            <Text
              style={{
                color: "#a3a3a3",
                fontSize: 11,
                textAlign: "center",
                marginBottom: 12,
              }}
            >
              Escanea este código o visita:
            </Text>
            <Text
              style={{
                color: "#ff5722",
                fontSize: 12,
                fontWeight: "700",
                textAlign: "center",
              }}
            >
              {MENU_URL}
            </Text>
          </View>

          {/* Botones de Acción */}
          <View style={{ gap: 10, marginBottom: 24 }}>
            {/* Compartir por WhatsApp */}
            <Pressable
              onPress={handleShareViaWhatsApp}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                padding: 14,
                backgroundColor: "#25D366",
                borderRadius: 14,
                justifyContent: "center",
              }}
            >
              <Ionicons name="logo-whatsapp" size={20} color="#fff" />
              <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}>
                Compartir por WhatsApp
              </Text>
            </Pressable>

            {/* Compartir genérico */}
            <Pressable
              onPress={handleShare}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                padding: 14,
                backgroundColor: "#ff5722",
                borderRadius: 14,
                justifyContent: "center",
              }}
            >
              <Ionicons name="share-social" size={20} color="#fff" />
              <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}>
                Compartir Menú
              </Text>
            </Pressable>

            {/* Imprimir QR */}
            <Pressable
              onPress={handlePrintQR}
              disabled={isGenerating}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                padding: 14,
                backgroundColor: "#1a1a1a",
                borderRadius: 14,
                borderWidth: 1,
                borderColor: "#2a2a2a",
                justifyContent: "center",
                opacity: isGenerating ? 0.6 : 1,
              }}
            >
              {isGenerating ? (
                <ActivityIndicator size="small" color="#ff5722" />
              ) : (
                <Ionicons name="print" size={20} color="#ff5722" />
              )}
              <Text
                style={{ color: "#ff5722", fontSize: 15, fontWeight: "700" }}
              >
                {isGenerating ? "Generando..." : "Imprimir QR"}
              </Text>
            </Pressable>

            {/* Copiar enlace */}
            <Pressable
              onPress={handleCopyLink}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                padding: 14,
                backgroundColor: "#1a1a1a",
                borderRadius: 14,
                borderWidth: 1,
                borderColor: "#2a2a2a",
                justifyContent: "center",
              }}
            >
              <Ionicons name="copy" size={20} color="#a3a3a3" />
              <Text
                style={{ color: "#a3a3a3", fontSize: 15, fontWeight: "700" }}
              >
                Copiar Enlace
              </Text>
            </Pressable>
          </View>

          {/* Info */}
          <View
            style={{
              backgroundColor: "#1a1a1a",
              borderRadius: 12,
              padding: 12,
              borderLeftWidth: 3,
              borderLeftColor: "#ff5722",
              marginBottom: 60,
            }}
          >
            <Text style={{ color: "#a3a3a3", fontSize: 12, lineHeight: 18 }}>
              ℹ️ Comparte el código QR o el enlace directo para que tus clientes
              accedan al menú digital desde sus teléfonos.
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
