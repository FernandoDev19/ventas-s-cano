import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";
import {
    FlatList,
    Modal,
    Platform,
    Pressable,
    Text,
    TextInput,
    useColorScheme,
    View,
} from "react-native";
import "../../../global.css";

type Props = {
    placeholder: string;
    type?: "text" | "search" | "select" | "date" | "number";
    value?: string | number | Date;
    onChangeText?: (text: string) => void;
    onChangeDate?: (date: Date) => void;
    options?: string[]; // Para el tipo select
};

export default function Input({
    placeholder,
    type = "text",
    value,
    onChangeText,
    onChangeDate,
    options,
}: Props) {
    const colorScheme = useColorScheme() ?? "light";
    const [showModal, setShowModal] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);

    const onDateChange = (event: any, selectedDate?: Date) => {
        // En Android, cerramos el picker inmediatamente
        setShowDatePicker(Platform.OS === "ios");

        if (selectedDate) {
            onChangeDate?.(selectedDate);
        }
    };

    // Renderizado especial para Select y Date (no son TextInput directos)
    if (type === "select" || type === "date") {
        const displayValue =
            value instanceof Date ? value.toLocaleDateString() : value;
        return (
            <>
                <Pressable
                    className={`h-16 bg-white shadow-lg rounded-lg px-4 flex-row items-center gap-2`}
                    onPress={() =>
                        type === "select"
                            ? setShowModal(true)
                            : setShowDatePicker(true)
                    }
                >
                    <Text
                        className={`flex-1 text-xl font-bold text-text-base-${colorScheme}`}
                    >
                        {displayValue || placeholder}
                    </Text>
                    <Ionicons
                        name={type === "select" ? "chevron-down" : "calendar"}
                        size={20}
                    // color={theme.textMuted}
                    />
                </Pressable>

                {showDatePicker && (
                    <DateTimePicker
                        value={value instanceof Date ? value : new Date()}
                        mode="date"
                        onChange={onDateChange}
                    />
                )}

                {/* Modal para el Selector */}
                {type === "select" && (
                    <Modal
                        visible={showModal}
                        transparent
                        animationType="slide"
                    >
                        <View className="flex-1 justify-center items-center bg-black/50">
                            <View
                                className={`bg-white rounded-lg p-5 w-4/5 max-h-3/5`}
                            >
                                <Text className="text-xl font-bold mb-3 text-center">
                                    {placeholder}
                                </Text>
                                <FlatList
                                    data={options}
                                    keyExtractor={(item) => item}
                                    renderItem={({ item }) => (
                                        <Pressable
                                            className="p-4 border-b border-gray-300 items-center"
                                            onPress={() => {
                                                onChangeText?.(item);
                                                setShowModal(false);
                                            }}
                                        >
                                            <Text className="text-lg font-semibold">
                                                {item.toUpperCase()}
                                            </Text>
                                        </Pressable>
                                    )}
                                />
                                <Pressable
                                    onPress={() => setShowModal(false)}
                                    className="mt-5 bg-blue-600 p-4 rounded-lg items-center"
                                >
                                    <Text
                                        style={{
                                            color: "white",
                                            fontWeight: "bold",
                                        }}
                                    >
                                        Cerrar
                                    </Text>
                                </Pressable>
                            </View>
                        </View>
                    </Modal>
                )}
            </>
        );
    }

    return (
        <View
            className={`h-16 bg-neutral-800 shadow-md rounded-lg px-4 flex-row items-center gap-4`}
        >
            {type === "search" && (
                <Ionicons name="search" size={20} color="white" />
            )}
            <TextInput
                className="flex-1 text-xl font-bold focus-visible:outline-none text-white"
                placeholder={placeholder}
                placeholderTextColor="#cfd8dc"
                value={value as string}
                onChangeText={onChangeText}
            />
        </View>
    );
}
