import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

serve(async (req: Request) => {
  try {
    // 1. Conectarse a tu base de datos con permisos de Administrador (Service Role)
    const supabaseAdmin = createClient(
      Deno.env.get("EXPO_PUBLIC_SUPABASE_URL") ?? "",
      Deno.env.get("EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 2. Recibir la data del Webhook (El pedido que se acaba de insertar)
    const { record } = await req.json();
    
    const clienteNombre = record.customer_name;
    const totalPedido = Number(record.total_price).toLocaleString("es-CO");

    // 3. JUGADA MAESTRA: Buscar todos los tokens de teléfonos registrados
    const { data: tokensData, error: dbError } = await supabaseAdmin
      .from("push_tokens")
      .select("token");

    if (dbError || !tokensData || tokensData.length === 0) {
      console.log("⚠️ No hay tokens registrados en la tabla 'push_tokens'.");
      return new Response(JSON.stringify({ message: "Sin tokens" }), { status: 200 });
    }

    // Extraer los strings de los tokens en un array
    const expoTokens = tokensData.map((t: { token: string }) => t.token);

    // 4. Armar el paquete que entiende el servidor de Expo
    const mensajePush = {
      to: expoTokens,
      sound: "default",
      title: "🔥 ¡PEDIDO NUEVO EN LA WEB! 🔥",
      body: `El cliente ${clienteNombre} mandó un pedido por $${totalPedido}. ¡Ponte las pilas!`,
      data: { orderId: record.id }, // Para que si abren la notificación, la app sepa qué orden buscar
    };

    // 5. Mandar el corrientazo a Expo
    const response = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(mensajePush),
    });

    const resultado = await response.json();
    console.log("✅ Notificación enviada a Expo:", resultado);

    return new Response(JSON.stringify({ success: true }), { 
      status: 200, 
      headers: { "Content-Type": "application/json" } 
    });

  } catch (error) {
    console.error("Chicharrón enviando la push notification:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 });
  }
})