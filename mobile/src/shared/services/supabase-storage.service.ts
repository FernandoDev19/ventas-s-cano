import { supabase } from "@/src/core/config/supabase";
import { File } from "expo-file-system";

export const SupabaseStorageService = {
  /**
   * Sube una imagen al bucket de product-images usando la API de SDK 54
   * @param imageUri - URI local de la imagen (ej: file://...)
   * @param fileName - Nombre del archivo (ej: producto_123.jpg)
   * @returns URL pública de la imagen o null si falla
   */
  uploadProductImage: async (
    imageUri: string,
    fileName: string
  ): Promise<string | null> => {
    try {
      // 1. Instanciar el archivo usando el nuevo constructor orientado a objetos
      const imageFile = new File(imageUri);

      // 2. Validar si el archivo existe físicamente antes de procesar
      if (!imageFile.exists) {
        console.error("El archivo local no existe en la ruta provista.");
        return null;
      }

      // 3. Leer el contenido directamente en un ArrayBuffer (u Uint8Array) de forma eficiente
      const arrayBuffer = await imageFile.arrayBuffer();
      const byteArray = new Uint8Array(arrayBuffer);

      // 4. Subir a Supabase Storage
      const { data, error } = await supabase.storage
        .from("product-images")
        .upload(fileName, byteArray, {
          cacheControl: "3600",
          upsert: false, 
          contentType: "image/jpeg",
        });

      if (error) {
        console.error("Error al subir imagen a Supabase:", error.message);
        return null;
      }

      // 5. Construir URL pública
      const { data: publicUrlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(fileName);

      return publicUrlData.publicUrl;
    } catch (err) {
      console.error("Error procesando imagen:", err);
      return null;
    }
  },

  /**
   * Elimina una imagen del bucket
   * @param fileName - Nombre del archivo a eliminar
   */
  deleteProductImage: async (fileName: string): Promise<boolean> => {
    try {
      const { error } = await supabase.storage
        .from("product-images")
        .remove([fileName]);

      if (error) {
        console.error("Error al eliminar imagen:", error.message);
        return false;
      }

      return true;
    } catch (err) {
      console.error("Error eliminando imagen:", err);
      return false;
    }
  },

  /**
   * Extrae el nombre del archivo de una URL pública
   */
  extractFileNameFromUrl: (publicUrl: string): string | null => {
    try {
      const url = new URL(publicUrl);
      const parts = url.pathname.split("/");
      return parts[parts.length - 1]; 
    } catch {
      return null;
    }
  },
};
