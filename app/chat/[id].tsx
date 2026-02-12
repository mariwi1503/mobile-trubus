import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, FlatList, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import { EXPERTS } from '../../data/experts';

// Mock messages
const MOCK_MESSAGES = [
    { id: '1', text: 'Halo, ada yang bisa saya bantu terkait tanaman Anda?', sender: 'expert', time: '10:00', type: 'text' },
    { id: '2', text: 'Selamat pagi dok, daun tanaman cabai saya menguning.', sender: 'user', time: '10:02', type: 'text' },
    { id: '3', text: 'Bisa difotokan bagian daun yang menguning?', sender: 'expert', time: '10:03', type: 'text' },
];

export default function ChatScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams(); // Order ID
    const { orders, user } = useApp();

    const order = orders.find(o => o.id === id);
    const expert = EXPERTS.find(e => e.id === order?.expertId);

    const [messages, setMessages] = useState(MOCK_MESSAGES);
    const [inputText, setInputText] = useState('');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const flatListRef = useRef<FlatList>(null);

    const [status, requestPermission] = ImagePicker.useMediaLibraryPermissions();

    const pickImage = async () => {
        if (!status?.granted) {
            const permission = await requestPermission();
            if (!permission.granted) {
                Alert.alert('Izin Ditolak', 'Mohon izinkan akses galeri untuk mengirim gambar.');
                return;
            }
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false,
            aspect: [4, 3],
            quality: 0.5,
        });

        if (!result.canceled) {
            setSelectedImage(result.assets[0].uri);
        }
    };

    const handleSend = () => {
        if (!inputText.trim() && !selectedImage) return;

        const newMsg = {
            id: Date.now().toString(),
            text: inputText,
            image: selectedImage,
            sender: 'user',
            time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            type: selectedImage ? 'image' : 'text',
        };

        setMessages([...messages, newMsg]);
        setInputText('');
        setSelectedImage(null);

        // Simulate expert reply
        setTimeout(() => {
            const reply = {
                id: (Date.now() + 1).toString(),
                text: 'Baik, saya akan cek fotonya nanti. Terima kasih.',
                sender: 'expert',
                time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
                type: 'text',
            };
            setMessages(prev => [...prev, reply]);
        }, 2000);
    };

    useEffect(() => {
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }, [messages]);

    if (!order || !expert) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                    </TouchableOpacity>
                </View>
                <View style={styles.center}>
                    <Text>Data konsultasi tidak ditemukan</Text>
                </View>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>

                <View style={styles.expertInfo}>
                    <View style={styles.avatarContainer}>
                        <Image source={{ uri: expert.image }} style={styles.avatar} />
                        <View style={[styles.onlineDot, { backgroundColor: expert.isOnline ? COLORS.success : COLORS.textLight }]} />
                    </View>
                    <View style={{ marginLeft: 8 }}>
                        <Text style={styles.expertName}>{expert.name}</Text>
                        <Text style={styles.expertStatus}>{expert.isOnline ? 'Online' : 'Offline'}</Text>
                    </View>
                </View>

                <TouchableOpacity style={styles.optionBtn}>
                    <Ionicons name="ellipsis-vertical" size={24} color={COLORS.text} />
                </TouchableOpacity>
            </View>

            {/* Messages */}
            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item: any) => item.id}
                contentContainerStyle={styles.messageList}
                renderItem={({ item }: { item: any }) => {
                    const isUser = item.sender === 'user';
                    return (
                        <View style={[styles.messageBubble, isUser ? styles.myMessage : styles.theirMessage]}>
                            {item.image && (
                                <Image source={{ uri: item.image }} style={styles.messageImage} resizeMode="cover" />
                            )}
                            {item.text ? (
                                <Text style={[styles.messageText, isUser ? styles.myMessageText : styles.theirMessageText]}>
                                    {item.text}
                                </Text>
                            ) : null}
                            <Text style={[styles.timeText, isUser ? styles.myTimeText : styles.theirTimeText]}>
                                {item.time}
                            </Text>
                        </View>
                    );
                }}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />

            {/* Input Area */}
            <View style={styles.inputContainer}>
                {selectedImage && (
                    <View style={styles.previewContainer}>
                        <Image source={{ uri: selectedImage }} style={styles.previewImage} />
                        <TouchableOpacity style={styles.removePreview} onPress={() => setSelectedImage(null)}>
                            <Ionicons name="close-circle" size={20} color={COLORS.accent} />
                        </TouchableOpacity>
                    </View>
                )}

                <View style={styles.inputRow}>
                    <TouchableOpacity style={styles.attachBtn} onPress={pickImage}>
                        <Ionicons name="add" size={24} color={COLORS.primary} />
                    </TouchableOpacity>
                    <TextInput
                        style={styles.input}
                        placeholder="Tulis pesan..."
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                    />
                    <TouchableOpacity
                        style={[styles.sendBtn, (!inputText.trim() && !selectedImage) && styles.sendBtnDisabled]}
                        onPress={handleSend}
                        disabled={!inputText.trim() && !selectedImage}
                    >
                        <Ionicons name="send" size={20} color={COLORS.white} />
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F5F5' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    header: {
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingTop: 50, paddingBottom: SPACING.md,
        backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.divider, ...SHADOWS.small, zIndex: 10
    },
    backBtn: { padding: 8, marginRight: 8 },
    expertInfo: { flex: 1, flexDirection: 'row', alignItems: 'center' },
    avatarContainer: { position: 'relative' },
    avatar: { width: 40, height: 40, borderRadius: 20 },
    onlineDot: { position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: 5, borderWidth: 1.5, borderColor: COLORS.white },
    expertName: { fontSize: 16, fontWeight: '700', color: COLORS.text },
    expertStatus: { fontSize: 12, color: COLORS.textSecondary },
    optionBtn: { padding: 8 },

    messageList: { padding: SPACING.lg, paddingBottom: 20 },
    messageBubble: { maxWidth: '80%', padding: 12, borderRadius: 16, marginBottom: 10 },
    myMessage: { alignSelf: 'flex-end', backgroundColor: COLORS.primary, borderBottomRightRadius: 2 },
    theirMessage: { alignSelf: 'flex-start', backgroundColor: COLORS.white, borderBottomLeftRadius: 2, ...SHADOWS.small },
    messageText: { fontSize: 15, lineHeight: 22 },
    myMessageText: { color: COLORS.white },
    theirMessageText: { color: COLORS.text },
    timeText: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
    myTimeText: { color: 'rgba(255,255,255,0.7)' },
    theirTimeText: { color: COLORS.textLight },

    inputContainer: {
        backgroundColor: COLORS.white,
        borderTopWidth: 1, borderTopColor: COLORS.divider, paddingBottom: 30
    },
    inputRow: {
        flexDirection: 'row', alignItems: 'center', padding: 10,
    },
    attachBtn: { padding: 10 },
    input: {
        flex: 1, backgroundColor: '#F5F5F5', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10,
        maxHeight: 100, fontSize: 15, marginHorizontal: 8
    },
    sendBtn: {
        width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary,
        alignItems: 'center', justifyContent: 'center'
    },
    sendBtnDisabled: { backgroundColor: COLORS.textLight },

    // Image Styles
    messageImage: { width: 200, height: 150, borderRadius: 8, marginBottom: 4 },
    previewContainer: { padding: 10, paddingBottom: 0, flexDirection: 'row', alignItems: 'center' },
    previewImage: { width: 60, height: 60, borderRadius: 8, marginRight: 10 },
    removePreview: { position: 'absolute', top: 0, left: 60, padding: 4 }
});
