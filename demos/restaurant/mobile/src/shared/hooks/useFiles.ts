import * as ImagePicker from "expo-image-picker";
import { documentDirectory, copyAsync } from 'expo-file-system/legacy';
import { Alert } from "react-native";

export const useFiles = () => {
  /**
   * Copia una imagen temporal al directorio permanente de la app
   * y retorna la ruta final guardada.
   */
  const _persistirImagen = async (uriTemporal: string, productoId?: string): Promise<string | null> => {
    const sufijo = productoId != null ? productoId : Date.now();
    const nombreArchivo = `producto_${sufijo}_${Date.now()}.jpg`;
    const rutaDestino = `${documentDirectory}${nombreArchivo}`;

    try {
      await copyAsync({ from: uriTemporal, to: rutaDestino });
      return rutaDestino;
    } catch (error) {
      console.error("No se pudo guardar la imagen:", error);
      return null;
    }
  };

  /**
   * Abre la CÁMARA, toma la foto y retorna la ruta permanente.
   * Si el usuario cancela o hay error, retorna null.
   */
  const tomarFotoDesdeCamara = async (productoId?: string): Promise<string | null> => {
    const permiso = await ImagePicker.requestCameraPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert("Permiso denegado", "Necesitamos acceso a la cámara para tomar fotos.");
      return null;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
    });

    if (result.canceled) return null;
    return _persistirImagen(result.assets[0].uri, productoId);
  };

  /**
   * Abre la GALERÍA, elige la imagen y retorna la ruta permanente.
   * Si el usuario cancela o hay error, retorna null.
   */
  const elegirImagenDeGaleria = async (productoId?: string): Promise<string | null> => {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert("Permiso denegado", "Necesitamos acceso a la galería para elegir imágenes.");
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
    });

    if (result.canceled) return null;
    return _persistirImagen(result.assets[0].uri, productoId);
  };

  /**
   * Muestra un diálogo para elegir entre Cámara o Galería.
   * Retorna la ruta permanente de la imagen seleccionada, o null si cancela.
   */
  const elegirImagenProducto = async (productoId?: string): Promise<string | null> => {
    return new Promise((resolve) => {
      Alert.alert(
        "Imagen del producto",
        "¿Cómo quieres agregar la imagen?",
        [
          {
            text: "Tomar foto",
            onPress: async () => resolve(await tomarFotoDesdeCamara(productoId)),
          },
          {
            text: "Elegir de galería",
            onPress: async () => resolve(await elegirImagenDeGaleria(productoId)),
          },
          {
            text: "Cancelar",
            style: "cancel",
            onPress: () => resolve(null),
          },
        ],
      );
    });
  };

  // Alias para retrocompatibilidad con el nombre original
  const tomarFotoProducto = async (productoId: string): Promise<string | null> => {
    return tomarFotoDesdeCamara(productoId);
  };

  return {
    tomarFotoProducto,
    tomarFotoDesdeCamara,
    elegirImagenDeGaleria,
    elegirImagenProducto,
  };
};
