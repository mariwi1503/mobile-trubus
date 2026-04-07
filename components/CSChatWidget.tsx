import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';
import { useApp } from '../context/AppContext';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'cs';
    timestamp: Date;
}

export default function CSChatWidget({ onClose, isOverlay = false }: { onClose: () => void, isOverlay?: boolean }) {
    const { user } = useApp();
    const insets = useSafeAreaInsets();
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: `Halo ${user?.name ? user.name.split(' ')[0] : 'Kak'}! Selamat datang di Layanan Pelanggan Toko Trubus. Ada yang bisa kami bantu hari ini?`,
            sender: 'cs',
            timestamp: new Date(),
        }
    ]);
    const [inputText, setInputText] = useState('');
    const flatListRef = useRef<FlatList>(null);

    const sendMessage = () => {
        if (!inputText.trim()) return;

        const newMessage: Message = {
            id: Date.now().toString(),
            text: inputText.trim(),
            sender: 'user',
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, newMessage]);
        setInputText('');

        setTimeout(() => {
            const autoReply: Message = {
                id: (Date.now() + 1).toString(),
                text: 'Terima kasih atas pesan Anda. Tim kami akan segera merespons pertanyaan Anda dalam waktu dekat.',
                sender: 'cs',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, autoReply]);
        }, 1500);
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <View style={[styles.container, isOverlay && styles.overlayContainer]}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View style={[styles.header, !isOverlay && { paddingTop: Math.max(insets.top, 48) }]}>
                    <TouchableOpacity style={styles.backBtn} onPress={onClose}>
                        <Ionicons name={isOverlay ? "close" : "arrow-back"} size={24} color={COLORS.text} />
                    </TouchableOpacity>
                    <View style={styles.headerInfo}>
                        <Text style={styles.headerTitle}>Customer Service</Text>
                        <View style={styles.statusRow}>
                            <View style={styles.statusDot} />
                            <Text style={styles.statusText}>Online</Text>
                        </View>
                    </View>
                    <View style={styles.headerRight} />
                </View>

                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.chatContainer}
                    keyboardShouldPersistTaps="handled"
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                    onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
                    renderItem={({ item }) => {
                        const isUser = item.sender === 'user';
                        return (
                            <View style={[styles.messageWrapper, isUser ? styles.messageWrapperUser : styles.messageWrapperCS]}>
                                {!isUser && (
                                    <View style={styles.csAvatar}>
                                        <Ionicons name="headset" size={16} color={COLORS.primary} />
                                    </View>
                                )}
                                <View style={[styles.messageBubble, isUser ? styles.messageBubbleUser : styles.messageBubbleCS]}>
                                    <Text style={[styles.messageText, isUser ? styles.messageTextUser : styles.messageTextCS]}>
                                        {item.text}
                                    </Text>
                                    <Text style={[styles.messageTime, isUser ? styles.messageTimeUser : styles.messageTimeCS]}>
                                        {formatTime(item.timestamp)}
                                    </Text>
                                </View>
                            </View>
                        );
                    }}
                />

                <View style={[styles.inputContainer, { paddingBottom: isOverlay ? SPACING.md : Math.max(insets.bottom, SPACING.md) }]}>
                    <View style={styles.inputRow}>
                        <TextInput
                            style={styles.input}
                            placeholder="Ketik pesan disini..."
                            placeholderTextColor={COLORS.textLight}
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                            maxLength={500}
                        />
                        <TouchableOpacity
                            style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
                            onPress={sendMessage}
                            disabled={!inputText.trim()}
                        >
                            <Ionicons name="send" size={20} color={COLORS.white} />
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    overlayContainer: {
        borderRadius: RADIUS.md,
        overflow: 'hidden',
        ...SHADOWS.medium,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.white,
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.divider,
        ...SHADOWS.small,
    },
    backBtn: {
        padding: SPACING.xs,
    },
    headerInfo: {
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.text,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
        gap: 4,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#4CAF50',
    },
    statusText: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    headerRight: {
        width: 32,
    },
    chatContainer: {
        padding: SPACING.md,
        paddingBottom: SPACING.xl,
        gap: SPACING.md,
    },
    messageWrapper: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginBottom: SPACING.sm,
        maxWidth: '85%',
    },
    messageWrapperUser: {
        alignSelf: 'flex-end',
    },
    messageWrapperCS: {
        alignSelf: 'flex-start',
    },
    csAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: COLORS.primaryBg,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    messageBubble: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 16,
        maxWidth: '100%',
    },
    messageBubbleUser: {
        backgroundColor: COLORS.primary,
        borderBottomRightRadius: 4,
    },
    messageBubbleCS: {
        backgroundColor: COLORS.white,
        borderBottomLeftRadius: 4,
        ...SHADOWS.small,
    },
    messageText: {
        fontSize: 14,
        lineHeight: 20,
    },
    messageTextUser: {
        color: COLORS.white,
    },
    messageTextCS: {
        color: COLORS.text,
    },
    messageTime: {
        fontSize: 10,
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    messageTimeUser: {
        color: 'rgba(255, 255, 255, 0.7)',
    },
    messageTimeCS: {
        color: COLORS.textLight,
    },
    inputContainer: {
        backgroundColor: COLORS.white,
        paddingHorizontal: SPACING.md,
        paddingTop: SPACING.sm,
        borderTopWidth: 1,
        borderTopColor: COLORS.divider,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: SPACING.sm,
    },
    input: {
        flex: 1,
        backgroundColor: COLORS.background,
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingTop: 10,
        paddingBottom: 10,
        fontSize: 14,
        color: COLORS.text,
        maxHeight: 100,
        minHeight: 40,
    },
    sendBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendBtnDisabled: {
        backgroundColor: COLORS.divider,
    },
});
