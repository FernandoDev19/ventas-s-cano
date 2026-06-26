import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/src/core/config/supabase";
import "@/src/global.css";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Completa los campos", "Email y contraseña son requeridos para entrar.");
      return;
    }

    setLoading(true);

    try {
      // 1. Iniciar sesión en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (authError) throw authError;

      if (authData.user) {
        // 2. Traer perfil del usuario (rol y nombre)
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role, name")
          .eq("id", authData.user.id)
          .single();

        if (profileError) {
          console.error("Error obteniendo perfil:", profileError);
          throw new Error("No se pudo obtener tu perfil");
        }

        // 3. Enrutamiento según rol
        Alert.alert("¡Bienvenido!", `Hola ${profile?.name || "Usuario"}`);

        // Descartar opciones: solo admin de mesas/ventas
        if (profile?.role === "admin" || profile?.role === "cashier") {
          router.replace("/(tabs)");
        } else if (profile?.role === "kitchen") {
          router.replace("/(tabs)/(sales)/sales?tab=Ordenes");
        } else {
          // Por defecto: menú
          router.replace("/(tabs)");
        }
      }
    } catch (error: any) {
      console.error("Login error:", error);
      Alert.alert(
        "Error al ingresar",
        error.message || "Credenciales incorrectas. Verifica tu email y contraseña."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: "#0f0f0f" }}
    >
      <View className="flex-1 bg-background justify-center px-6 py-8">
        <View style={{ width: "100%", maxWidth: 380, marginHorizontal: "auto", gap: 24 }}>
          {/* Logo y Branding */}
          <View style={{ alignItems: "center", marginBottom: 16 }}>
            <Image
              source={require("@/assets/images/logo.png")}
              style={{ width: 140, height: 50 }}
              resizeMode="contain"
            />
            <Text
              style={{
                color: "#ff5722",
                fontSize: 11,
                fontWeight: "700",
                textTransform: "uppercase",
                letterSpacing: 1.5,
                marginTop: 8,
              }}
            >
              Sistema de Administración
            </Text>
          </View>

          {/* Formulario */}
          <View style={{ gap: 16 }}>
            {/* Email Input */}
            <View style={{ gap: 8 }}>
              <Text
                style={{
                  color: "#737373",
                  fontSize: 11,
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                Correo Electrónico
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="admin@saborespress.com"
                placeholderTextColor="#555"
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!loading}
                style={{
                  width: "100%",
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: email ? "#ff5722" : "#2a2a2a",
                  backgroundColor: "#1a1a1a",
                  color: "#fff",
                  fontSize: 16,
                  fontWeight: "500",
                }}
              />
            </View>

            {/* Password Input */}
            <View style={{ gap: 8 }}>
              <Text
                style={{
                  color: "#737373",
                  fontSize: 11,
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                Contraseña
              </Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••••"
                placeholderTextColor="#555"
                secureTextEntry
                autoCapitalize="none"
                editable={!loading}
                style={{
                  width: "100%",
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: password ? "#ff5722" : "#2a2a2a",
                  backgroundColor: "#1a1a1a",
                  color: "#fff",
                  fontSize: 16,
                  fontWeight: "500",
                }}
              />
            </View>
          </View>

          {/* Botón Login */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading || !email || !password}
            style={{
              width: "100%",
              backgroundColor: "#ff5722",
              paddingVertical: 16,
              borderRadius: 12,
              alignItems: "center",
              justifyContent: "center",
              marginTop: 8,
              opacity: loading || !email || !password ? 0.6 : 1,
            }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text
                style={{
                  color: "#fff",
                  fontWeight: "800",
                  fontSize: 15,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Ingresar al Sistema
              </Text>
            )}
          </TouchableOpacity>

          {/* Footer Info */}
          <View
            style={{
              backgroundColor: "#1a1a1a",
              borderRadius: 12,
              borderLeftWidth: 3,
              borderLeftColor: "#ff5722",
              padding: 14,
              marginTop: 8,
            }}
          >
            <Text
              style={{
                color: "#a3a3a3",
                fontSize: 12,
                lineHeight: 18,
              }}
            >
              💡 Este es un acceso interno. Si no tienes credenciales, contacta al administrador.
            </Text>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}