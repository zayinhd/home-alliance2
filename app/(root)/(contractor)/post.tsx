import { useState } from "react";

import {
    View,
    Text,
    Alert,
} from "react-native";

import Input from "@/components/ui/Input";

import Button from "@/components/ui/Button";

export default function ContractorPostScreen() {
    const [title, setTitle] =
        useState("");

    const [description, setDescription] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    const handleCreatePost = async () => {
        try {
            setLoading(true);

            Alert.alert(
                "Success",
                "Post created successfully"
            );

            setTitle("");
            setDescription("");
        } catch (error: any) {
            Alert.alert(
                "Error",
                error.message
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-white px-6 pt-16">
            <Text className="text-3xl font-Jost-Bold mb-8">
                Create Post
            </Text>

            <Input
                label="Title"
                placeholder="Enter title"
                value={title}
                onChangeText={setTitle}
            />

            <Input
                label="Description"
                placeholder="Enter description"
                multiline
                numberOfLines={5}
                value={description}
                onChangeText={setDescription}
            />

            <Button
                title="Publish Post"
                onPress={handleCreatePost}
                loading={loading}
            />
        </View>
    );
}