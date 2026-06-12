import Input from "@/src/shared/components/ui/Input";
import { Pressable, ScrollView, Text, View } from "react-native";
import { CategoryType } from "../../categories/types/category.type";

type Props = {
  categories: Partial<CategoryType>[];
  filter: string;
  setFilter: (filter: string) => void;
  search: string;
  setSearch: (s: string) => void;
};

export default function MenuHeader({
  categories,
  filter,
  setFilter,
  search,
  setSearch,
}: Props) {
  return (
    <View className="mb-2 mt-4 gap-2">
      <Text className="text-2xl font-extrabold text-white">Menú</Text>

      <Input
        type="search"
        placeholder="Buscar productos..."
        value={search}
        onChangeText={setSearch}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
      >
        <View className="flex-row justify-around gap-2.5 my-5">
          {categories &&
            categories.map((category) => (
              <Pressable
                key={category.id}
                onPress={() => setFilter(category.id!)}
                className="px-4 py-2 rounded-full"
                style={{
                  backgroundColor:
                    filter === category.id ? "#ff5722" : "#1a1a1a",
                  borderWidth: 1,
                  borderColor: filter === category.id ? "#ff5722" : "#333",
                }}
              >
                <Text
                  className="text-sm font-semibold"
                  style={{ color: filter === category.id ? "#fff" : "#a3a3a3" }}
                >
                  {category.name}
                </Text>
              </Pressable>
            ))}
        </View>
      </ScrollView>
    </View>
  );
}
