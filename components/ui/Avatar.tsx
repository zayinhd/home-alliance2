import {
    View,
    Text,
    Image,
} from "react-native";

interface Props {
    image?: string | null;
    username?: string;
    email?: string;
    size?: number;
}

export default function Avatar({
    image,
    username,
    email,
    size = 80,
}: Props) {
    const getInitials = () => {
        if (username) {
            return username
                .substring(0, 2)
                .toUpperCase();
        }

        if (email) {
            return email
                .substring(0, 2)
                .toUpperCase();
        }

        return "HA";
    };

    if (image) {
        return (
            <Image
                source={{
                    uri: image,
                }}
                style={{
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                }}
            />
        );
    }

    return (
        <View
            style={{
                width: size,
                height: size,
                borderRadius: size / 2,
            }}
            className="bg-primary items-center justify-center"
        >
            <Text className="text-white text-2xl font-Jost-Bold">
                {getInitials()}
            </Text>
        </View>
    );
}