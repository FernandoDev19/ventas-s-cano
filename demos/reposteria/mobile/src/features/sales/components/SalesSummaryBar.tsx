import { SaleType } from "../types/sale.type";
import { Pressable, ScrollView, Text, View } from "react-native";

type FilterId = "all" | "paid" | "debt";

type FilterItem = {
    id: FilterId;
    label: string;
};

const FILTERS: FilterItem[] = [
    { id: "all", label: "Todas" },
    { id: "paid", label: "Pagadas" },
    { id: "debt", label: "Fiadas" },
];

type Props = {
    filter: FilterId;
    setFilter: (f: FilterId) => void;
    sales: SaleType[];
};

function formatAmount(amount: number): string {
    return `$${amount.toLocaleString("es-CO")}`;
}

export default function SalesSummaryBar({ filter, setFilter, sales }: Props) {
    const totalDay = sales.reduce((sum, s) => sum + s.total, 0);
    const totalPaid = sales.filter((s) => !s.is_debt).reduce((sum, s) => sum + s.total, 0);
    const totalDebt = sales.filter((s) => s.is_debt).reduce((sum, s) => sum + (s.debt_amount ?? 0), 0);

    return (
        <View className="px-4 mb-4">
            {/* Summary cards row */}
            <View className="flex-row gap-3 mb-4">
                {/* Total del dia */}
                <View
                    className="flex-1 p-3 rounded-xl"
                    style={{ backgroundColor: "#ff5722" }}
                >
                    <Text className="text-white text-[10px] font-semibold uppercase tracking-wider opacity-80">
                        Total hoy
                    </Text>
                    <Text className="text-white text-lg font-extrabold mt-0.5">
                        {formatAmount(totalDay)}
                    </Text>
                </View>

                {/* Pagado */}
                <View
                    className="flex-1 p-3 rounded-xl"
                    style={{ backgroundColor: "#22c55e22", borderWidth: 1, borderColor: "#22c55e44" }}
                >
                    <Text className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#22c55e" }}>
                        Cobrado
                    </Text>
                    <Text className="text-lg font-extrabold mt-0.5" style={{ color: "#22c55e" }}>
                        {formatAmount(totalPaid)}
                    </Text>
                </View>

                {/* Fiado */}
                <View
                    className="flex-1 p-3 rounded-xl"
                    style={{ backgroundColor: "#f59e0b22", borderWidth: 1, borderColor: "#f59e0b44" }}
                >
                    <Text className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#f59e0b" }}>
                        Por cobrar
                    </Text>
                    <Text className="text-lg font-extrabold mt-0.5" style={{ color: "#f59e0b" }}>
                        {formatAmount(totalDebt)}
                    </Text>
                </View>
            </View>

            {/* Filter chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2">
                    {FILTERS.map((f) => {
                        const isActive = filter === f.id;
                        return (
                            <Pressable
                                key={f.id}
                                onPress={() => setFilter(f.id)}
                                className="px-4 py-2 rounded-full"
                                style={{
                                    backgroundColor: isActive ? "#ff5722" : "#1a1a1a",
                                    borderWidth: 1,
                                    borderColor: isActive ? "#ff5722" : "#333",
                                }}
                            >
                                <Text
                                    className="text-sm font-semibold"
                                    style={{ color: isActive ? "#fff" : "#a3a3a3" }}
                                >
                                    {f.label}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>
            </ScrollView>
        </View>
    );
}

export type { FilterId };
