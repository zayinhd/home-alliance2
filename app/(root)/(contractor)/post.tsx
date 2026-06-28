import { useState } from "react";

import { View, Text, Alert, TouchableOpacity } from "react-native";

import { router } from "expo-router";

import Input from "@/components/ui/Input";

import Button from "@/components/ui/Button";

import { useAuth } from "@/hooks/useAuth";

import { createPost } from "@/services/post.service";

export default function ContractorPostScreen() {
    const { user } = useAuth();

    const [title, setTitle] = useState("");

    const [description, setDescription] = useState("");

    const [loading, setLoading] = useState(false);

    const handleCreatePost = async () => {
        try {
            if (!user) return;

            setLoading(true);

            await createPost({
                service_provider_id: user.id,
                title,
                description,
                status: "published",
            });

            Alert.alert("Success", "Post published successfully");

            setTitle("");
            setDescription("");
        } catch (error: any) {
            Alert.alert("Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveDraft = async () => {
        try {
            if (!user) return;

            setLoading(true);

            await createPost({
                service_provider_id: user.id,
                title,
                description,
                status: "draft",
            });

            Alert.alert("Draft Saved", "Your draft has been saved");

            setTitle("");
            setDescription("");
        } catch (error: any) {
            Alert.alert("Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-white px-6 pt-16">
            <View className="flex-row items-center justify-between mb-8">
                <Text className="text-3xl font-Jost-Bold">Create Post</Text>

                <TouchableOpacity
                    onPress={() => router.push("/(root)/(contractor)/my-posts")}
                >
                    <Text className="text-primary font-Jost-Bold">
                        My Posts
                    </Text>
                </TouchableOpacity>
            </View>

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

            <View className="gap-4 mt-4">
                <Button
                    title="Publish Post"
                    onPress={handleCreatePost}
                    loading={loading}
                />

                <TouchableOpacity
                    onPress={handleSaveDraft}
                    className="border border-primary py-4 rounded-2xl items-center"
                >
                    <Text className="text-primary font-Jost-Bold text-base">
                        Save Draft
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
