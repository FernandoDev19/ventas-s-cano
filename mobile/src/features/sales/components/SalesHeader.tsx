import Button from "@/src/shared/components/ui/Button";
import Input from "@/src/shared/components/ui/Input";
import { ScrollView, Text, View } from "react-native";

type StateType = {
    id: string;
    name: string;
}

type Props = {
    states: Partial<StateType>[];
    filter: string;
    setFilter: (filter: string) => void;
};

export default function SalesHeader({ states, filter, setFilter }: Props) {
    return (
        <View className="mb-2 gap-4">
            <Text className="text-2xl font-extrabold text-white">Menú</Text>

            <Input type="search" placeholder="Buscar productos..." />

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row justify-around gap-2.5 my-5">
                    {states &&
                        states.map((state) => (
                            <Button
                                key={state.name}
                                title={state.name}
                                onPress={() => setFilter(state.id!)}
                                color="filter"
                                active={filter === state.id}
                            />
                        ))}
                </View>
            </ScrollView>
        </View>
    );
}
