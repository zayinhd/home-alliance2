import { useEffect, useMemo, useRef } from "react";

import {
    Animated,
    KeyboardAvoidingView,
    Modal,
    PanResponder,
    Platform,
    Pressable,
    View,
} from "react-native";

interface PullableModalProps {
    visible: boolean;
    onClose: () => void;
    children: React.ReactNode;
}

export default function PullableModal({
    visible,
    onClose,
    children,
}: PullableModalProps) {
    const translateY = useRef(new Animated.Value(500)).current;

    const closeWithAnimation = () => {
        Animated.timing(translateY, {
            toValue: 500,
            duration: 180,
            useNativeDriver: true,
        }).start(() => {
            onClose();
            translateY.setValue(500);
        });
    };

    useEffect(() => {
        if (visible) {
            translateY.setValue(500);

            Animated.spring(translateY, {
                toValue: 0,
                useNativeDriver: true,
                damping: 18,
                stiffness: 180,
                mass: 0.9,
            }).start();
        }
    }, [visible, translateY]);

    const panResponder = useMemo(
        () =>
            PanResponder.create({
                onStartShouldSetPanResponder: () => true,
                onMoveShouldSetPanResponder: (_, gesture) =>
                    Math.abs(gesture.dy) > 6,
                onPanResponderMove: (_, gesture) => {
                    if (gesture.dy > 0) {
                        translateY.setValue(gesture.dy);
                    }
                },
                onPanResponderRelease: (_, gesture) => {
                    const shouldClose = gesture.dy > 120 || gesture.vy > 1.2;

                    if (shouldClose) {
                        closeWithAnimation();
                        return;
                    }

                    Animated.spring(translateY, {
                        toValue: 0,
                        useNativeDriver: true,
                        damping: 18,
                        stiffness: 180,
                        mass: 0.9,
                    }).start();
                },
            }),
        [translateY],
    );

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                className="flex-1"
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={24}
            >
                <View className="flex-1 justify-end bg-black/40">
                    <Pressable className="flex-1" onPress={closeWithAnimation} />

                    <Animated.View
                        style={{ transform: [{ translateY }] }}
                        className="bg-white rounded-t-3xl p-5 max-h-[85%]"
                    >
                        <View
                            {...panResponder.panHandlers}
                            className="items-center pb-3"
                        >
                            <View className="w-12 h-1.5 rounded-full bg-gray-300" />
                        </View>

                        {children}
                    </Animated.View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}
