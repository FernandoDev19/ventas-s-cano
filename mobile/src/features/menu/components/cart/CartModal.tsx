import Button from "@/src/shared/components/ui/Button";
import { Ionicons } from "@expo/vector-icons";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  View,
} from "react-native";
import { useCartModal } from "../../hooks/useCartModal";
import CartHeader from "./CartHeader";
import CartProductsList from "./CartProductsList";
import CartFooter from "./CartFooter";
import CartCheckoutBar from "./CartCheckoutBar";

type Props = {
  onSaleCreated: () => void;
};

const CartModal = ({ onSaleCreated }: Props) => {
  const {
    handleCheckout,
    setModalVisible,
    handleDecrement,
    handleIncrement,
    getItemLabel,
    getItemImage,
    getItemPrice,
    setPaymentMethod,
    setDebtDate,
    setShowDatePicker,
    setSelectedClientId,
    setIsDebt,
    setAmountDebt,
    setNote,
    buildSale,
    totalPrecio,
    modalVisible,
    totalItems,
    order,
    selectedClientId,
    clients,
    refreshClients,
    note,
    paymentMethod,
    isDebt,
    debtDate,
    amountDebt,
    showDatePicker,
    isSubmitting,
    clearOrder,
    orderType,
    setOrderType,
    tables,
    selectedTableId,
    setSelectedTableId,
    deliveryAddress,
    setDeliveryAddress,
    cashReceived,
    setCashReceived,
  } = useCartModal(onSaleCreated);

  if (totalItems === 0) return null;

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
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View className="flex-1 bg-black/60 justify-end">
            <View className="bg-neutral-900 rounded-t-[32px] h-[92%] px-6 pt-6 shadow-2xl border-t border-neutral-800">
              <CartHeader
                setModalVisible={setModalVisible}
                totalItems={totalItems}
                onClearOrder={clearOrder}
              />

                       <CartProductsList
                order={order}
                getItemImage={getItemImage}
                getItemLabel={getItemLabel}
                getItemPrice={getItemPrice}
                handleDecrement={handleDecrement}
                handleIncrement={handleIncrement}
                ListFooterComponent={
                  <CartFooter
                    totalPrecio={totalPrecio}
                    setShowDatePicker={setShowDatePicker}
                    setSelectedClientId={setSelectedClientId}
                    paymentMethod={paymentMethod}
                    setPaymentMethod={setPaymentMethod}
                    isDebt={isDebt}
                    setIsDebt={setIsDebt}
                    note={note}
                    setNote={setNote}
                    debtDate={debtDate}
                    setDebtDate={setDebtDate}
                    amountDebt={amountDebt}
                    setAmountDebt={setAmountDebt}
                    clients={clients}
                    onClientCreated={refreshClients}
                    showDatePicker={showDatePicker}
                    selectedClientId={selectedClientId}
                    orderType={orderType}
                    setOrderType={setOrderType}
                    tables={tables}
                    selectedTableId={selectedTableId}
                    setSelectedTableId={setSelectedTableId}
                    deliveryAddress={deliveryAddress}
                    setDeliveryAddress={setDeliveryAddress}
                    cashReceived={cashReceived}
                    setCashReceived={setCashReceived}
                  />
                }
              />

              <CartCheckoutBar
                total={totalPrecio}
                itemsCount={totalItems}
                isSubmitting={isSubmitting}
                summary={[
                  orderType === "domicilio"
                    ? "Domicilio"
                    : orderType === "para_llevar"
                      ? "Para llevar"
                      : selectedTableId
                        ? `Mesa ${tables.find((t) => t.id === selectedTableId)?.number_mesa ?? selectedTableId}`
                        : "Comer aquí",
                  isDebt
                    ? "Fiado"
                    : paymentMethod === "cash"
                      ? "Efectivo"
                      : paymentMethod === "card"
                        ? "Tarjeta"
                        : "Nequi",
                ].join(" · ")}
                onConfirm={() => handleCheckout(buildSale(), order)}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
};

export default CartModal;
