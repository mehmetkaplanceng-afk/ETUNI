import React, { useState, useRef, useEffect } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { authFetch } from "../../api/authFetch";

type Message = {
    id: string;
    text: string;
    sender: "user" | "bot";
    timestamp: Date;
};

export default function ChatScreen() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "welcome",
            text: "Merhaba! Ben ETUNI Asistan 🤖\n\nEtkinlikler hakkında sorular sorabilir, platform hakkında bilgi alabilirsiniz.",
            sender: "bot",
            timestamp: new Date(),
        },
    ]);
    const [inputText, setInputText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    const sendMessage = async () => {
        if (!inputText.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            text: inputText.trim(),
            sender: "user",
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInputText("");
        setIsLoading(true);

        try {
            const res = await authFetch("/api/chat/ask", {
                method: "POST",
                body: JSON.stringify({ query: userMessage.text }),
            });

            let botResponse = "Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.";

            if (res.ok) {
                const json = await res.json();
                if (json.data?.response) {
                    botResponse = json.data.response;
                }
            } else {
                botResponse = "Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin.";
            }

            const botMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: botResponse,
                sender: "bot",
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, botMessage]);
        } catch (error) {
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: "Bir hata oluştu. Lütfen tekrar deneyin.",
                sender: "bot",
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Scroll to bottom when new messages arrive
        setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
    }, [messages]);

    const renderMessage = ({ item }: { item: Message }) => (
        <View
            style={[
                styles.messageContainer,
                item.sender === "user" ? styles.userMessage : styles.botMessage,
            ]}
        >
            {item.sender === "bot" && (
                <View style={styles.botIcon}>
                    <Ionicons name="sparkles" size={16} color="#4f46e5" />
                </View>
            )}
            <View
                style={[
                    styles.messageBubble,
                    item.sender === "user" ? styles.userBubble : styles.botBubble,
                ]}
            >
                <Text
                    style={[
                        styles.messageText,
                        item.sender === "user" ? styles.userText : styles.botText,
                    ]}
                >
                    {item.text}
                </Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <Ionicons name="sparkles" size={24} color="#4f46e5" />
                    <Text style={styles.headerTitle}>ETUNI Asistan</Text>
                </View>
                <Text style={styles.headerSubtitle}>Yapay Zeka Destekli</Text>
            </View>

            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.messagesList}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
            >
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Bir soru sorun..."
                        placeholderTextColor="#94a3b8"
                        value={inputText}
                        onChangeText={setInputText}
                        onSubmitEditing={sendMessage}
                        returnKeyType="send"
                        multiline
                        maxLength={500}
                    />
                    <TouchableOpacity
                        style={[styles.sendButton, isLoading && styles.sendButtonDisabled]}
                        onPress={sendMessage}
                        disabled={isLoading || !inputText.trim()}
                    >
                        {isLoading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Ionicons name="send" size={20} color="#fff" />
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f8fafc",
    },
    header: {
        backgroundColor: "#fff",
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#e2e8f0",
    },
    headerContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: "800",
        color: "#1e293b",
    },
    headerSubtitle: {
        fontSize: 12,
        color: "#64748b",
        marginTop: 2,
        marginLeft: 32,
    },
    messagesList: {
        padding: 16,
        paddingBottom: 20,
    },
    messageContainer: {
        marginBottom: 12,
        flexDirection: "row",
        alignItems: "flex-end",
    },
    userMessage: {
        justifyContent: "flex-end",
    },
    botMessage: {
        justifyContent: "flex-start",
    },
    botIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: "#e0e7ff",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 8,
    },
    messageBubble: {
        maxWidth: "75%",
        padding: 12,
        borderRadius: 16,
    },
    userBubble: {
        backgroundColor: "#4f46e5",
        borderBottomRightRadius: 4,
    },
    botBubble: {
        backgroundColor: "#fff",
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: "#e2e8f0",
    },
    messageText: {
        fontSize: 15,
        lineHeight: 22,
    },
    userText: {
        color: "#fff",
    },
    botText: {
        color: "#334155",
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "flex-end",
        padding: 12,
        paddingBottom: Platform.OS === "ios" ? 12 : 25, // Added padding for tab bar
        backgroundColor: "#fff",
        borderTopWidth: 1,
        borderTopColor: "#e2e8f0",
        gap: 8,
    },
    input: {
        flex: 1,
        backgroundColor: "#f1f5f9",
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 16,
        color: "#334155",
        maxHeight: 100,
    },
    sendButton: {
        backgroundColor: "#4f46e5",
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: "center",
        alignItems: "center",
    },
    sendButtonDisabled: {
        opacity: 0.6,
    },
});
