import "../../../global.css";
import { Ionicons } from "@expo/vector-icons";
import { Pressable } from "react-native";

type Props = {
    checked: boolean;
    onChange: (value: boolean) => void;
};

export default function Checkbox({ checked, onChange }: Props) {
    return (
        <Pressable
            onPress={() => onChange(!checked)}
            className="justify-center items-center active:opacity-70"
        >
            <Ionicons
                name={checked ? "checkmark-circle" : "ellipse-outline"}
                size={28}
                className={checked ? "text-primary" : "text-neutral-medium"}
            />
        </Pressable>
    );
}
