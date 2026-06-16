import { OrderItem } from "@/src/core/context/OrderContext";
import { Alert } from "react-native";
import { RecipesService } from "../../recipes/services/recipes.service";
import { SalesService } from "../../sales/services/sales.service";
import { SaleType } from "../../sales/types/sale.type";
import { ClientsService } from "../../clients/services/clients.service";
import { useEffect, useState } from "react";
import { PaymentMethodsType } from "@/src/shared/types/payment-methods.type";
import { ClientType } from "../../clients/types/client.type";
import { useContextOrder } from "@/src/shared/hooks/useContextOrder";
import { ProductsService } from "../../inventory/services/products.service";

export const useCartModal = (onSaleCreated: () => void) => {
  const { order, addToOrder, addRecipeToOrder, removeFromOrder, clearOrder } =
    useContextOrder();

  const totalItems = order.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrecio = order.reduce((sum, item) => {
    if (item.type === "product")
      return sum + item.product.price * item.quantity;
    if (item.type === "recipe")
      return sum + item.recipe.selling_price * item.quantity;
    return sum;
  }, 0);

  const [clients, setClients] = useState<ClientType[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const [isDebt, setIsDebt] = useState(false);
  const [note, setNote] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [amountDebt, setAmountDebt] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethodsType>("cash");
  const [debtDate, setDebtDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (modalVisible) {
      ClientsService.getAll().then(setClients);
      setAmountDebt(totalPrecio);
    }
  }, [modalVisible, totalPrecio]);

  const buildSale = (): SaleType => ({
    total: totalPrecio,
    note,
    is_debt: isDebt,
    debt_amount: isDebt ? (amountDebt > 0 ? amountDebt : totalPrecio) : 0,
    debt_date: isDebt ? debtDate.toISOString().split("T")[0] : null,
    payment_method: paymentMethod,
    client_id: isDebt ? selectedClientId : null,
  });

  const handleCheckout = async (sale: SaleType, order: OrderItem[]) => {
    try {
      const productItems = order.filter((i) => i.type === "product");
      const recipeItems = order.filter((i) => i.type === "recipe");

      // PRODUCTOS: Guardar en sale_products normalmente
      const productsToSave = productItems
        .map((o) => {
          if (o.type !== "product") return null as any;
          return {
            product_id: o.product.id,
            quantity: o.quantity,
            price: o.product.price * o.quantity,
          };
        })
        .filter(Boolean);

      // RECETAS: Se guardarán en sale_recipes (no en sale_products)
      const recipesToSave = recipeItems
        .map((o) => {
          if (o.type !== "recipe") return null as any;
          return {
            recipe_id: o.recipe.id,
            quantity: o.quantity,
            price: o.recipe.selling_price * o.quantity,
          };
        })
        .filter(Boolean);

      // Crear la venta y pasar ambas listas
      await SalesService.createSale(sale, productsToSave, recipesToSave);

      // Deducir stock de ingredientes de las recetas
      for (const item of recipeItems) {
        if (item.type !== "recipe") continue;
        await RecipesService.deductStock(item.recipe.id!, item.quantity);
      }

      onSaleCreated();

      // Verificar stock bajo de productos
      const lowStockAlerts: string[] = [];
      for (const item of productItems) {
        if (item.type !== "product") continue;
        const prod = await ProductsService.getProductById(item.product.id);
        if (prod && prod.stock <= 10) {
          lowStockAlerts.push(`${prod.name} (Quedan: ${prod.stock})`);
        }
      }

      // Verificar stock bajo de ingredientes de recetas
      for (const item of recipeItems) {
        if (item.type !== "recipe") continue;
        const low = await RecipesService.checkLowStock(item.recipe.id!);
        for (const l of low) {
          lowStockAlerts.push(`${l.name} (Quedan: ${l.stock})`);
        }
      }

      clearOrder();
      setIsDebt(false);
      setAmountDebt(0);
      setNote("");
      setModalVisible(false);
      setSelectedClientId(null);
      setDebtDate(() => {
        const d = new Date();
        d.setDate(d.getDate() + 7);
        return d;
      });

      if (lowStockAlerts.length > 0) {
        Alert.alert(
          "¡Pedido creado correctamente!",
          `⚠️ ¡Alerta de Stock Bajo!\nLos siguientes productos tienen stock bajo:\n\n${lowStockAlerts.map((a) => `• ${a}`).join("\n")}`,
        );
      } else {
        Alert.alert("¡Pedido creado correctamente!");
      }
    } catch (error: any) {
      console.error(error);
      Alert.alert(
        "Error",
        `El pedido no ha podido ser creado, detalles: \n${error?.message}`,
      );
    }
  };
  const getItemLabel = (item: OrderItem) => {
    if (item.type === "product") return item.product.name;
    return `🍽 ${item.recipe.name}`;
  };

  const getItemImage = (item: OrderItem) => {
    if (item.type === "product") return item.product.image_url;
    return item.recipe.image_url;
  };

  const getItemPrice = (item: OrderItem) => {
    if (item.type === "product") return item.product.price * item.quantity;
    return item.recipe.selling_price * item.quantity;
  };

  const handleIncrement = (item: OrderItem) => {
    if (item.type === "product") addToOrder(item.product);
    else addRecipeToOrder(item.recipe);
  };

  const handleDecrement = (item: OrderItem) => {
    if (item.type === "product") removeFromOrder(item.product.id, "product");
    else removeFromOrder(item.recipe.id!, "recipe");
  };

  return {
    buildSale,
    setPaymentMethod,
    setShowDatePicker,
    handleCheckout,
    getItemImage,
    getItemLabel,
    getItemPrice,
    handleIncrement,
    handleDecrement,
    setModalVisible,
    setDebtDate,
    setSelectedClientId,
    setIsDebt,
    setAmountDebt,
    setNote,
    clients,
    totalPrecio,
    totalItems,
    showDatePicker,
    modalVisible,
    order,
    selectedClientId,
    isDebt,
    debtDate,
    amountDebt,
    paymentMethod,
    note,
  };
};
