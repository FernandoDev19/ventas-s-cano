import { CategoriesService } from "@/src/features/categories/services/categories.service";
import { CategoryType } from "@/src/features/categories/types/category.type";
import ExpensesService from "@/src/features/expenses/services/expense.service";
import { ExpenseType } from "@/src/features/expenses/types/expense.type";
import Button from "@/src/shared/components/ui/Button";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    Pressable,
    RefreshControl,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import ExpenseDetailModal from "./ExpenseDetailModal";

const EXPENSE_ICONS: Record<string, any> = {
    "Pollos": "fast-food-outline",
    "Cerdo & Picadas": "nutrition-outline",
    "Embutidos (Buti/Chorizo)": "restaurant-outline",
    "Bebidas": "water-outline",
    "Cervezas / Alcohol": "beer-outline",
};

function getIcon(categoryName: string): any {
    return EXPENSE_ICONS[categoryName] ?? "pricetag-outline";
}

function formatAmount(amount: number): string {
    return `$${amount.toLocaleString("es-CO")}`;
}

function formatDate(date: Date | string): string {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return "Hoy";
    if (d.toDateString() === yesterday.toDateString()) return "Ayer";
    return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short" });
}

function formatDateTime(date: Date | string): string {
    const d = new Date(date);
    return `${formatDate(date)}, ${d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", hour12: true })}`;
}

// ───────────────────────── Modal crear gasto ─────────────────────────
type CreateExpenseModalProps = {
    visible: boolean;
    categories: CategoryType[];
    onClose: () => void;
    onCreated: () => void;
};

function CreateExpenseModal({ visible, categories, onClose, onCreated }: CreateExpenseModalProps) {
    const [description, setDescription] = useState("");
    const [amount, setAmount] = useState("");
    const [categoryId, setCategoryId] = useState<number | null>(null);
    const [notes, setNotes] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const reset = () => {
        setDescription("");
        setAmount("");
        setCategoryId(null);
        setNotes("");
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    const handleSave = async () => {
        if (!description.trim()) {
            Alert.alert("Falta descripción", "Por favor ingresa una descripción.");
            return;
        }
        const parsedAmount = parseFloat(amount.replace(/,/g, ""));
        if (!parsedAmount || parsedAmount <= 0) {
            Alert.alert("Monto inválido", "Por favor ingresa un monto mayor a 0.");
            return;
        }
        if (!categoryId) {
            Alert.alert("Falta categoría", "Por favor selecciona una categoría.");
            return;
        }

        setIsSaving(true);
        try {
            await ExpensesService.createExpense({
                description: description.trim(),
                amount: parsedAmount,
                category_id: categoryId,
                date: new Date(),
                notes: notes.trim(),
            });
            reset();
            onCreated();
        } catch (err) {
            Alert.alert("Error", "No se pudo guardar el gasto.");
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
            <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }}>
                <View style={{ backgroundColor: "#141414", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 }}>
                    {/* Header */}
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                        <Text style={{ color: "#fff", fontSize: 20, fontWeight: "800" }}>Nuevo Gasto</Text>
                        <Pressable onPress={handleClose} style={{ backgroundColor: "#2a2a2a", borderRadius: 20, padding: 8 }}>
                            <Ionicons name="close" size={20} color="#fff" />
                        </Pressable>
                    </View>

                    {/* Descripción */}
                    <Text style={{ color: "#737373", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Descripción</Text>
                    <View style={{ backgroundColor: "#1a1a1a", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 4, marginBottom: 16, borderWidth: 1, borderColor: "#2a2a2a" }}>
                        <TextInput
                            placeholder="Ej. Compra de pollos"
                            placeholderTextColor="#555"
                            value={description}
                            onChangeText={setDescription}
                            style={{ color: "#fff", fontSize: 16, height: 46 }}
                        />
                    </View>

                    {/* Monto */}
                    <Text style={{ color: "#737373", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Monto</Text>
                    <View style={{ backgroundColor: "#1a1a1a", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 4, marginBottom: 16, borderWidth: 1, borderColor: "#2a2a2a", flexDirection: "row", alignItems: "center" }}>
                        <Text style={{ color: "#ff5722", fontSize: 18, fontWeight: "800", marginRight: 6 }}>$</Text>
                        <TextInput
                            placeholder="0"
                            placeholderTextColor="#555"
                            value={amount}
                            onChangeText={setAmount}
                            keyboardType="numeric"
                            style={{ color: "#fff", fontSize: 16, flex: 1, height: 46 }}
                        />
                    </View>

                    {/* Categoría */}
                    <Text style={{ color: "#737373", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Categoría</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                        <View style={{ flexDirection: "row", gap: 8 }}>
                            {categories.map((cat) => {
                                const isActive = categoryId === cat.id;
                                return (
                                    <Pressable
                                        key={cat.id}
                                        onPress={() => setCategoryId(cat.id)}
                                        style={{
                                            flexDirection: "row", alignItems: "center", gap: 6,
                                            paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
                                            backgroundColor: isActive ? "#ff5722" : "#1a1a1a",
                                            borderWidth: 1, borderColor: isActive ? "#ff5722" : "#333",
                                        }}
                                    >
                                        <Ionicons name={getIcon(cat.name)} size={13} color={isActive ? "#fff" : "#a3a3a3"} />
                                        <Text style={{ color: isActive ? "#fff" : "#a3a3a3", fontSize: 13, fontWeight: "600" }}>
                                            {cat.name.split(" ")[0]}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                    </ScrollView>

                    {/* Notas (opcional) */}
                    <Text style={{ color: "#737373", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Notas <Text style={{ color: "#444" }}>(opcional)</Text></Text>
                    <View style={{ backgroundColor: "#1a1a1a", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 4, marginBottom: 24, borderWidth: 1, borderColor: "#2a2a2a" }}>
                        <TextInput
                            placeholder="Ej. Proveedor, factura..."
                            placeholderTextColor="#555"
                            value={notes}
                            onChangeText={setNotes}
                            style={{ color: "#fff", fontSize: 15, height: 46 }}
                        />
                    </View>

                    {/* Botón guardar */}
                    <Pressable
                        onPress={handleSave}
                        disabled={isSaving}
                        style={{ backgroundColor: "#ff5722", paddingVertical: 16, borderRadius: 16, alignItems: "center", opacity: isSaving ? 0.7 : 1 }}
                    >
                        {isSaving
                            ? <ActivityIndicator color="#fff" />
                            : <Text style={{ color: "#fff", fontSize: 17, fontWeight: "800" }}>Guardar Gasto</Text>
                        }
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
}

// ───────────────────────── Pantalla principal ─────────────────────────
export default function ExpensesScreen() {
    const [expenses, setExpenses] = useState<ExpenseType[]>([]);
    const [categories, setCategories] = useState<CategoryType[]>([]);
    const [totalMonth, setTotalMonth] = useState(0);
    const [byCategory, setByCategory] = useState<{ category: string; total: number }[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState<ExpenseType | null>(null);

    const loadData = useCallback(async (silent = false) => {
        if (!silent) setIsLoading(true);
        try {
            const [expensesData, catsData, total, byCat] = await Promise.all([
                ExpensesService.getAllExpenses(),
                CategoriesService.getAll(),
                ExpensesService.getTotalExpenses(),
                ExpensesService.getTotalByCategory(),
            ]);
            setExpenses(expensesData);
            setCategories(catsData);
            setTotalMonth(total);
            setByCategory(byCat);
        } catch (err) {
            console.error("Error loading expenses:", err);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const onRefresh = useCallback(() => {
        setIsRefreshing(true);
        loadData(true);
    }, [loadData]);

    const handleDelete = useCallback((expense: ExpenseType) => {
        Alert.alert(
            "Eliminar gasto",
            `¿Seguro que quieres eliminar "${expense.description}"?`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Eliminar",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await ExpensesService.deleteExpense(expense.id);
                            setExpenses(prev => prev.filter(e => e.id !== expense.id));
                            setTotalMonth(prev => prev - expense.amount);
                        } catch {
                            Alert.alert("Error", "No se pudo eliminar el gasto.");
                        }
                    },
                },
            ]
        );
    }, []);

    const filteredExpenses = selectedCategory === null
        ? expenses
        : expenses.filter(e => e.category_id === selectedCategory);

    if (isLoading) {
        return (
            <View className="flex-1 items-center justify-center" style={{ backgroundColor: "#0f0f0f" }}>
                <ActivityIndicator size="large" color="#ff5722" />
                <Text className="text-neutral-500 mt-3 text-sm">Cargando gastos...</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-background">
            <FlatList
                data={filteredExpenses}
                keyExtractor={(item) => String(item.id)}
                refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#ff5722" />
                }
                ListHeaderComponent={
                    <View className="pt-4">
                        {/* Header */}
                        <View className="px-4 mb-4">
                            <Text className="text-2xl font-extrabold text-white">Gastos</Text>
                            <Text className="text-neutral-500 text-sm">
                                {expenses.length} registro{expenses.length !== 1 ? "s" : ""}
                            </Text>
                        </View>

                        {/* Total card */}
                        <View
                            className="mx-4 mb-4 p-5 rounded-2xl"
                            style={{
                                backgroundColor: "#1a1a1a",
                                borderLeftWidth: 4,
                                borderLeftColor: "#ff5722",
                            }}
                        >
                            <Text className="text-neutral-500 text-xs uppercase tracking-widest mb-1">
                                Total Gastos
                            </Text>
                            <View className="flex-row items-end gap-3">
                                <Text className="text-4xl font-extrabold text-white">
                                    {formatAmount(totalMonth)}
                                </Text>
                            </View>

                            {/* By category mini breakdown */}
                            {byCategory.length > 0 && (
                                <View className="mt-3 pt-3" style={{ borderTopWidth: 1, borderTopColor: "#2a2a2a" }}>
                                    {byCategory.slice(0, 3).map((item) => (
                                        <View key={item.category} className="flex-row justify-between mb-1">
                                            <Text className="text-neutral-500 text-xs">{item.category}</Text>
                                            <Text className="text-neutral-300 text-xs font-semibold">
                                                -{formatAmount(item.total)}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>

                        {/* Category filter */}
                        <View className="mb-4">
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
                                <Pressable
                                    onPress={() => setSelectedCategory(null)}
                                    className="flex-row items-center gap-1.5 px-4 py-2 rounded-full"
                                    style={{
                                        backgroundColor: selectedCategory === null ? "#ff5722" : "#1a1a1a",
                                        borderWidth: 1,
                                        borderColor: selectedCategory === null ? "#ff5722" : "#333",
                                    }}
                                >
                                    <Ionicons name="grid-outline" size={13} color={selectedCategory === null ? "#fff" : "#a3a3a3"} />
                                    <Text className="text-sm font-semibold" style={{ color: selectedCategory === null ? "#fff" : "#a3a3a3" }}>
                                        Todos
                                    </Text>
                                </Pressable>
                                {categories.map((cat) => {
                                    const isActive = selectedCategory === cat.id;
                                    return (
                                        <Pressable
                                            key={cat.id}
                                            onPress={() => setSelectedCategory(isActive ? null : cat.id)}
                                            className="flex-row items-center gap-1.5 px-4 py-2 rounded-full"
                                            style={{
                                                backgroundColor: isActive ? "#ff5722" : "#1a1a1a",
                                                borderWidth: 1,
                                                borderColor: isActive ? "#ff5722" : "#333",
                                            }}
                                        >
                                            <Ionicons name={getIcon(cat.name)} size={13} color={isActive ? "#fff" : "#a3a3a3"} />
                                            <Text className="text-sm font-semibold" style={{ color: isActive ? "#fff" : "#a3a3a3" }}>
                                                {cat.name.split(" ")[0]}
                                            </Text>
                                        </Pressable>
                                    );
                                })}
                            </ScrollView>
                        </View>

                        {/* Section label */}
                        <View className="px-4 mb-3 flex-row items-center gap-2">
                            <Text className="text-white font-bold text-base">Gastos Recientes</Text>
                            <View className="h-px flex-1" style={{ backgroundColor: "#2a2a2a" }} />
                        </View>
                    </View>
                }
                renderItem={({ item }) => {
                    const cat = categories.find(c => c.id === item.category_id);
                    return (
                        <Pressable
                            onPress={() => setSelectedExpense(item)}
                            onLongPress={() => handleDelete(item)}
                            className="mx-4 mb-3 p-4 rounded-2xl flex-row items-center gap-3 active:opacity-85"
                            style={{ backgroundColor: "#1a1a1a" }}
                        >
                            {/* Icon */}
                            <View
                                className="w-11 h-11 rounded-xl items-center justify-center"
                                style={{ backgroundColor: "#ff572222" }}
                            >
                                <Ionicons name={getIcon(cat?.name ?? "")} size={22} color="#ff5722" />
                            </View>

                            {/* Info */}
                            <View className="flex-1">
                                <Text className="text-white font-semibold text-sm" numberOfLines={1}>
                                    {item.description}
                                </Text>
                                <Text className="text-neutral-500 text-xs mt-0.5">
                                    {formatDateTime(item.date)}
                                    {cat ? ` • ${cat.name.split(" ")[0]}` : ""}
                                </Text>
                            </View>

                            {/* Amount */}
                            <Text className="text-base font-extrabold" style={{ color: "#ff5722" }}>
                                -{formatAmount(item.amount)}
                            </Text>
                        </Pressable>
                    );
                }}
                ListEmptyComponent={
                    <View className="items-center justify-center py-20 px-8">
                        <View className="w-20 h-20 rounded-full items-center justify-center mb-4" style={{ backgroundColor: "#1a1a1a" }}>
                            <Ionicons name="wallet-outline" size={36} color="#444" />
                        </View>
                        <Text className="text-white font-bold text-lg text-center mb-1">Sin gastos</Text>
                        <Text className="text-neutral-500 text-sm text-center">
                            No hay gastos registrados{selectedCategory !== null ? " en esta categoría" : ""}
                        </Text>
                    </View>
                }
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
            />

            <Button
                onPress={() => setShowCreate(true)}
                circle
            >
                <Ionicons name="add" size={28} color="#fff" />
            </Button>

            <CreateExpenseModal
                visible={showCreate}
                categories={categories}
                onClose={() => setShowCreate(false)}
                onCreated={() => {
                    setShowCreate(false);
                    loadData(true);
                }}
            />

            <ExpenseDetailModal
                visible={selectedExpense !== null}
                expense={selectedExpense}
                category={categories.find(c => c.id === selectedExpense?.category_id) ?? null}
                onClose={() => setSelectedExpense(null)}
                onDeleted={() => loadData(true)}
            />
        </View>
    );
}