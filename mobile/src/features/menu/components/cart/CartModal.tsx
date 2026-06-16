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
    note,
    paymentMethod,
    isDebt,
    debtDate,
    amountDebt,
    showDatePicker,
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
              />

              <CartProductsList
                order={order}
                getItemImage={getItemImage}
                getItemLabel={getItemLabel}
                getItemPrice={getItemPrice}
                handleDecrement={handleDecrement}
                handleIncrement={handleIncrement}
              />

              <CartFooter
                totalPrecio={totalPrecio}
                setShowDatePicker={setShowDatePicker}
                handleCheckout={handleCheckout}
                setSelectedClientId={setSelectedClientId}
                buildSale={buildSale}
                order={order}
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
                showDatePicker={showDatePicker}
                selectedClientId={selectedClientId}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
};

export default CartModal;
