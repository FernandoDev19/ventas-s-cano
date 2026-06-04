import { OrderItem } from "@/src/core/context/OrderContext";
import Button from "@/src/shared/components/ui/Button";
import Input from "@/src/shared/components/ui/Input";
import { priceFormat } from "@/src/shared/helpers/price-format.helper";
import { useOrder } from "@/src/shared/hooks/useOrder";
import {
  PaymentMethods,
  PaymentMethodsType,
} from "@/src/shared/types/payment-methods.type";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  Text,
  View,
} from "react-native";
import { SalesService } from "../../sales/services/sales.service";
import { SaleType } from "../../sales/types/sale.type";

type Props = {
  onSaleCreated: () => void;
}

const CartModal = ({ onSaleCreated }: Props) => {
  const { order, addToOrder, removeFromOrder, clearOrder } = useOrder();

  const totalItems = order.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrecio = order.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );

  const [amountDebt, setAmountDebt] = useState<number>(totalPrecio);
  const [isDebt, setIsDebt] = useState(false);
  const [note, setNote] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethodsType>("cash");


  if (totalItems === 0) return null;

  const buildSale = (): SaleType => ({
    total: totalPrecio,
    note,
    is_debt: isDebt,
    debt_amount: isDebt ? (amountDebt > 0 ? amountDebt : totalPrecio) : 0,
    debt_date: isDebt ? new Date().toISOString().split("T")[0] : null,
    created_at: new Date().toISOString().split("T")[0],
  });

  const handleCheckout = async (sale: SaleType, order: OrderItem[]) => {
    try {
      const productsToSave = order.map(o => ({
        product_id: o.product.id,
        quantity: o.quantity,
        price: o.product.price * o.quantity,
      }));

      await SalesService.createSale(sale, productsToSave);

      onSaleCreated();

      clearOrder();
      setIsDebt(false);
      setAmountDebt(0);
      setNote("");
      setModalVisible(false);

      Alert.alert("¡Pedido creado correctamente!");
    } catch (error: any) {
      console.error(error);
      Alert.alert(
        "Error",
        `El pedido no ha podido ser creado, detalles: \n${error?.message}`
      );
    }
  };
  return (
    <>
      <Button
        circle={true}
        color="primary"
        onPress={() => setModalVisible(true)}
      >
        <View className="flex-row items-center">
          <Ionicons name="cart" size={24} color="white" />
          <Text className="text-xs absolute -top-4 -right-4 w-4 h-4 rounded-full bg-white text-black text-center m-0 p-0">
            {totalItems}
          </Text>
        </View>
      </Button>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 bg-black/60 justify-end">
          {/* Contenedor del carrito que sube */}
          <View className="bg-neutral-900 rounded-t-[32px] h-[92%] px-6 pt-6 shadow-2xl border-t border-neutral-800">
            <View className="flex-row items-center justify-between mb-6">
              <View className="flex-row items-center gap-2">
                <Text className="text-2xl font-black text-white">Mi Orden</Text>
                <Text className="text-primary font-bold text-lg">
                  ({totalItems})
                </Text>
              </View>

              <Pressable
                onPress={() => setModalVisible(false)}
                className="p-2 bg-neutral-800 rounded-full active:opacity-70"
              >
                <Ionicons name="close" size={24} color="white" />
              </Pressable>
            </View>

            <FlatList
              data={order}
              keyExtractor={(item) => item.product.id.toString()}
              contentContainerStyle={{ gap: 16, paddingBottom: 24 }}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <View className="flex-row bg-neutral-800 p-4 rounded-2xl items-center justify-between">
                  <View className="flex-row items-center flex-1 mr-4">
                    <Image
                      source={
                        item.product.image_url
                          ? { uri: item.product.image_url }
                          : require("@/assets/images/default-food.png")
                      }
                      className="w-14 h-14 rounded-xl bg-neutral-700 mr-3"
                      resizeMode="cover"
                    />
                    <View className="flex-1">
                      <Text
                        className="text-white font-bold text-base"
                        numberOfLines={1}
                      >
                        {item.product.name}
                      </Text>
                      <Text className="text-primary font-bold mt-0.5">
                        {priceFormat(item.product.price * item.quantity)}
                      </Text>
                    </View>
                  </View>

                  {/* Controles de unidades */}
                  <View className="flex-row items-center bg-neutral-900 rounded-xl p-1 gap-2.5">
                    <Pressable
                      onPress={() => removeFromOrder(item.product.id)}
                      className="p-1 active:opacity-60"
                    >
                      <Ionicons
                        name="remove-circle-outline"
                        size={24}
                        color="white"
                      />
                    </Pressable>
                    <Text className="text-white font-black text-sm min-w-[14px] text-center">
                      {item.quantity}
                    </Text>
                    <Pressable
                      onPress={() => addToOrder(item.product)}
                      className="p-1 active:opacity-60"
                    >
                      <Ionicons
                        name="add-circle-outline"
                        size={24}
                        color="white"
                      />
                    </Pressable>
                  </View>
                </View>
              )}
            />

            {/* Footer fijo con total y acción */}
            <View className="border-t border-neutral-800 pt-4 pb-10">
              {/* Nota o nombre del cliente */}
              <View className="mb-4">
                <Input
                  type="text"
                  onChangeText={(text) => setNote(text)}
                  placeholder="Nota o nombre del cliente"
                  value={note}
                />
              </View>

              {/* Contenedor para los métodos de pago */}
              <View className="flex-row justify-between gap-3 mb-4">
                {Object.values(PaymentMethods).map((method) => (
                  <Button
                    key={method}
                    color="filter"
                    active={paymentMethod === method}
                    onPress={() => setPaymentMethod(method)}
                    className="!rounded-xl flex-1"
                  >
                    <View className="flex-col items-center justify-center gap-1 w-full">
                      {method === PaymentMethods.NEQUI ? (
                        <Image
                          source={require("../../../../assets/icons/nequi.png")}
                          style={{ width: 22, height: 22 }}
                        />
                      ) : (
                        <Ionicons
                          name={method}
                          size={22}
                          color="white"
                        />
                      )}
                      <Text className="text-white text-xs font-medium">
                        {method === PaymentMethods.CASH
                          ? "Efectivo"
                          : method === PaymentMethods.NEQUI
                            ? "Nequi"
                            : "Tarjeta"}
                      </Text>
                    </View>
                  </Button>
                ))}
              </View>

              {/* Is Debt buttons */}
              <View className="flex-row items-center gap-6 mb-4">
                <Pressable
                  onPress={() => setIsDebt(false)}
                  className={`flex-1 flex-row items-center p-3 rounded-xl border ${!isDebt ? 'border-primary' : 'border-neutral-700'} active:opacity-70`}
                >
                  <Text className="text-white font-semibold">Contado</Text>
                </Pressable>
                <Pressable
                  onPress={() => setIsDebt(true)}
                  className={`flex-1 flex-row items-center p-3 rounded-xl border ${isDebt ? 'border-primary' : 'border-neutral-700'} active:opacity-70`}
                >
                  <Text className="text-white font-semibold">Fiado</Text>
                </Pressable>
              </View>

              {/* Input de deuda solo si es fiado */}
              {isDebt && (
                <View className="mb-4">
                  <Input
                    type="number"
                    placeholder="Monto que quedan debiendo"
                    value={String(amountDebt || totalPrecio)}
                    onChangeText={(text) => {
                      if (typeof Number(text) != "number") {
                        Alert.alert("Error", "Este campo solo admite numeros");
                        return;
                      }

                      setAmountDebt(Number(text))
                    }}
                  />
                </View>
              )}

              {/* Contenedor para el total y el botón de confirmar */}
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-gray-400 text-lg font-medium">
                  Total de la orden
                </Text>
                <Text className="text-white text-3xl font-black">
                  {priceFormat(totalPrecio)}
                </Text>
              </View>

              <Pressable
                onPress={() => handleCheckout(buildSale(), order)}
                className="bg-primary py-4 rounded-2xl items-center justify-center active:opacity-90 shadow-xl"
              >
                <Text className="text-white text-xl font-black">
                  Confirmar Pedido
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default CartModal;
