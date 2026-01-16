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
                <View style={styles.botIconWrapper}>
                    <View style={styles.botIcon}>
                        <Ionicons name="sparkles" size={14} color="#6366f1" />
                    </View>
                </View>
            )}
            <View
                style={[
                    styles.messageBubble,
                    item.sender === "user" ? styles.userBubble : styles.botBubble,
                    styles.shadow,
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
                <Text style={[
                    styles.timestamp,
                    item.sender === "user" ? styles.userTimestamp : styles.botTimestamp
                ]}>
                    {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={[styles.header, styles.shadow]}>
                <View style={styles.headerTop}>
                    <View style={styles.headerLeft}>
                        <View style={styles.assistantAvatar}>
                            <Ionicons name="sparkles" size={20} color="#fff" />
                            <View style={styles.onlineStatus} />
                        </View>
                        <View>
                            <Text style={styles.headerTitle}>ETUNI Asistan</Text>
                            <Text style={styles.headerStatus}>Şu an çevrimiçi</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.headerAction}>
                        <Ionicons name="ellipsis-horizontal" size={20} color="#64748b" />
                    </TouchableOpacity>
                </View>
            </View>

            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.messagesList}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
                ListFooterComponent={isLoading ? (
                    <View style={styles.typingIndicator}>
                        <ActivityIndicator size="small" color="#6366f1" />
                        <Text style={styles.typingText}>Asistan düşünüyor...</Text>
                    </View>
                ) : null}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
            >
                <View style={styles.inputWrapper}>
                    <View style={[styles.inputContainer, styles.shadow]}>
                        <TextInput
                            style={styles.input}
                            placeholder="Mesajınızı buraya yazın..."
                            placeholderTextColor="#94a3b8"
                            value={inputText}
                            onChangeText={setInputText}
                            onSubmitEditing={sendMessage}
                            returnKeyType="send"
                            multiline
                            maxLength={500}
                        />
                        <TouchableOpacity
                            style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
                            onPress={sendMessage}
                            disabled={isLoading || !inputText.trim()}
                        >
                            {isLoading ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Ionicons name="send" size={18} color="#fff" />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f1f5f9",
    },
    shadow: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    header: {
        backgroundColor: "#fff",
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#f1f5f9",
        zIndex: 10,
    },
    headerTop: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    headerLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    assistantAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#6366f1",
        justifyContent: "center",
        alignItems: "center",
        position: 'relative',
    },
    onlineStatus: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: "#22c55e",
        borderWidth: 2,
        borderColor: "#fff",
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#0f172a",
    },
    headerStatus: {
        fontSize: 12,
        color: "#22c55e",
        fontWeight: "500",
    },
    headerAction: {
        padding: 8,
    },
    messagesList: {
        padding: 16,
        paddingBottom: 24,
    },
    messageContainer: {
        marginBottom: 16,
        flexDirection: "row",
        alignItems: "flex-end",
    },
    userMessage: {
        justifyContent: "flex-end",
    },
    botMessage: {
        justifyContent: "flex-start",
    },
    botIconWrapper: {
        marginRight: 8,
    },
    botIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: "#e0e7ff",
        justifyContent: "center",
        alignItems: "center",
    },
    messageBubble: {
        maxWidth: "80%",
        padding: 14,
        borderRadius: 20,
    },
    userBubble: {
        backgroundColor: "#6366f1", // Deep indigo
        borderBottomRightRadius: 4,
    },
    botBubble: {
        backgroundColor: "#ffffff",
        borderBottomLeftRadius: 4,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 22,
    },
    userText: {
        color: "#ffffff",
        fontWeight: '400',
    },
    botText: {
        color: "#334155",
        fontWeight: '400',
    },
    timestamp: {
        fontSize: 10,
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    userTimestamp: {
        color: "rgba(255,255,255,0.7)",
    },
    botTimestamp: {
        color: "#94a3b8",
    },
    typingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginTop: -8,
        marginBottom: 16,
        gap: 8,
    },
    typingText: {
        fontSize: 13,
        color: "#64748b",
        fontStyle: 'italic',
    },
    inputWrapper: {
        backgroundColor: "#f1f5f9",
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: Platform.OS === "ios" ? 80 : 85, // SIGNIFICANTLY INCREASED to clear tab bar
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        borderRadius: 28,
        paddingHorizontal: 6,
        paddingVertical: 6,
    },
    input: {
        flex: 1,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 15,
        color: "#1e293b",
        maxHeight: 100,
    },
    sendButton: {
        backgroundColor: "#6366f1",
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
    },
    sendButtonDisabled: {
        backgroundColor: "#cbd5e1",
    },
});
