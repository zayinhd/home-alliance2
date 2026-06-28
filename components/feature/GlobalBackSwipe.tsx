import { ReactNode } from "react";

import { StyleSheet, View } from "react-native";

import { useRouter } from "expo-router";

import { Gesture, GestureDetector } from "react-native-gesture-handler";

import { runOnJS } from "react-native-reanimated";

type GlobalBackSwipeProps = {
    children: ReactNode;
};

export default function GlobalBackSwipe({ children }: GlobalBackSwipeProps) {
    const router = useRouter();

    const handleBack = () => {
        router.back();
    };

    const swipeGesture = Gesture.Pan()
        .activeOffsetX([20, 9999])
        .failOffsetY([-30, 30])
        .onEnd((event) => {
            if (event.translationX < 80 || event.velocityX < 250) {
                return;
            }

            runOnJS(handleBack)();
        });

    return (
        <View style={styles.container}>
            {children}

            <GestureDetector gesture={swipeGesture}>
                <View style={styles.edgeSwipeZone} />
            </GestureDetector>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    edgeSwipeZone: {
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        width: 24,
        zIndex: 999,
    },
});
