import "../../../global.css";
import { Pressable, Text } from "react-native";

type Props = {
    title?: string;
    children?: React.ReactNode;
    onPress: () => void;
    disabled?: boolean;
    color?:
        | "primary"
        | "secondary"
        | "inverted"
        | "outline"
        | "danger"
        | "filter";
    circle?: boolean;
    active?: boolean;
    className?: string;
};

export default function Button({
    title,
    children,
    onPress,
    disabled = false,
    color = "primary",
    circle = false,
    active = false,
    className = ""
}: Props) {
    const baseStyles = circle
        ? "w-20 h-20 rounded-full absolute bottom-5 right-7 items-center justify-center shadow-xl"
        : "py-3.5 px-6 rounded-2xl items-center justify-center";

    const colorStyles = {
        primary: "bg-primary active:bg-primary-light",
        secondary: "bg-secondary-light active:bg-secondary",
        inverted: "bg-neutral-light active:opacity-80",
        outline:
            "bg-transparent border border-neutral-light active:bg-neutral-light",
        danger: "bg-danger active:bg-danger-light",
        filter: `${active ? "bg-primary" : "bg-neutral-800 border border-primary"} !rounded-full w-max`,
    };

    return (
        <Pressable
            onPress={onPress}
            disabled={disabled}
            className={`${baseStyles} ${colorStyles[color]} ${disabled ? "opacity-50" : ""} ${className}`}
        >
            {({ pressed }) => {
                const isWhiteText =
                    pressed ||
                    active ||
                    ["primary", "inverted", "danger"].includes(color);

                return (
                    <Text
                        className={`text-xl font-black text-center text-nowrap ${
                            isWhiteText
                                ? "text-white"
                                : "text-primary opacity-70"
                        }`}
                    >
                        {children || title || ""}
                    </Text>
                );
            }}
        </Pressable>
    );
}
