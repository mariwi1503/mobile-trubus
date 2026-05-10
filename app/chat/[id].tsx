import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, Image, TouchableOpacity, TextInput,
    KeyboardAvoidingView, Platform, FlatList, Modal, Pressable,
    StatusBar, Dimensions
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import { useAlert } from '../../context/AlertContext';
import { EXPERTS } from '../../data/experts';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
const { width } = Dimensions.get('window');

const MOCK_MESSAGES = [
    { id: '1', text: 'Halo, ada yang bisa saya bantu terkait tanaman Anda?', sender: 'expert', time: '10:00', type: 'text' },
    { id: '2', text: 'Selamat pagi dok, daun tanaman cabai saya menguning.', sender: 'user', time: '10:02', type: 'text' },
    { id: '3', text: 'Bisa difotokan bagian daun yang menguning?', sender: 'expert', time: '10:03', type: 'text' },
];

export default function ChatScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const { orders } = useApp();
    const { showAlert } = useAlert();
    const insets = useSafeAreaInsets();

    const order = orders.find(o => o.id === id);
    const expert = EXPERTS.find(e => e.id === order?.expertId);
    const expertDisplayName = order?.expertName || expert?.name || 'Ahli';
    const expertDisplayImage = order?.expertImage || expert?.image || 'https://ui-avatars.com/api/?name=Ahli';
    const expertIsOnline = expert?.isOnline ?? true;

    const [messages, setMessages] = useState(MOCK_MESSAGES);
    const [inputText, setInputText] = useState('');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isAttachModalVisible, setAttachModalVisible] = useState(false);
    const [viewImage, setViewImage] = useState<string | null>(null);

    const flatListRef = useRef<FlatList>(null);
    const [status, requestPermission] = ImagePicker.useMediaLibraryPermissions();
    const [cameraStatus, requestCameraPermission] = ImagePicker.useCameraPermissions();

    const pickImage = async (useCamera: boolean) => {
        setAttachModalVisible(false);
        let result;

        try {
            if (useCamera) {
                const permission = await requestCameraPermission();
                if (!permission.granted) {
                    showAlert('Izin Ditolak', 'Akses kamera diperlukan.');
                    return;
                }
                result = await ImagePicker.launchCameraAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    quality: 0.7,
                });
            } else {
                const permission = await requestPermission();
                if (!permission.granted) {
                    showAlert('Izin Ditolak', 'Akses galeri diperlukan.');
                    return;
                }
                result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    quality: 0.7,
                });
            }

            if (!result.canceled) {
                setSelectedImage(result.assets[0].uri);
            }
        } catch (error) {
            showAlert('Error', 'Gagal mengambil gambar');
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

        setTimeout(() => {
            const reply = {
                id: (Date.now() + 1).toString(),
                text: 'Baik, saya akan segera memeriksa laporannya.',
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

    if (!order) return null;

    return (
        <KeyboardAvoidingView
            style={[styles.container, { paddingBottom: insets.bottom }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>

                <View style={styles.expertInfo}>
                    <View style={styles.avatarContainer}>
                        <Image source={{ uri: expertDisplayImage }} style={styles.avatar} />
                        <View style={[styles.onlineDot, { backgroundColor: expertIsOnline ? COLORS.success : COLORS.textLight }]} />
                    </View>
                    <View style={{ marginLeft: 10 }}>
                        <Text style={styles.expertName}>{expertDisplayName}</Text>
                        <Text style={styles.expertStatus}>{expertIsOnline ? 'Online' : 'Offline'}</Text>
                    </View>
                </View>
            </View>

            {/* Chat List */}
            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.messageList}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => {
                    const isUser = item.sender === 'user';
                    return (
                        <View style={[styles.messageBubble, isUser ? styles.myMessage : styles.theirMessage]}>
                            {item.image && (
                                <TouchableOpacity
                                    activeOpacity={0.9}
                                    onPress={() => setViewImage(item.image)}
                                    style={styles.imageWrapper}
                                >
                                    <Image source={{ uri: item.image }} style={styles.messageImage} />
                                </TouchableOpacity>
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
            />

            {/* Input Area */}
            <View style={styles.inputContainer}>
                {selectedImage && (
                    <View style={styles.previewContainer}>
                        <Image source={{ uri: selectedImage }} style={styles.previewImage} />
                        <TouchableOpacity style={styles.removePreview} onPress={() => setSelectedImage(null)}>
                            <Ionicons name="close-circle" size={24} color={COLORS.accent} />
                        </TouchableOpacity>
                    </View>
                )}

                <View style={styles.inputRow}>
                    <TouchableOpacity style={styles.attachBtn} onPress={() => setAttachModalVisible(true)}>
                        <Ionicons name="add-circle-outline" size={28} color={COLORS.primary} />
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
                        <Ionicons name="send" size={18} color={COLORS.white} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Modal Attachment (Bottom Sheet style) */}
            <Modal
                transparent
                visible={isAttachModalVisible}
                animationType="fade"
                onRequestClose={() => setAttachModalVisible(false)}
            >
                <Pressable style={styles.modalOverlay} onPress={() => setAttachModalVisible(false)}>
                    <View style={styles.attachmentSheet}>
                        <View style={styles.sheetHandle} />
                        <Text style={styles.modalTitle}>Kirim Media</Text>
                        <View style={styles.attachmentOptions}>
                            <TouchableOpacity style={styles.attachOptionBtn} onPress={() => pickImage(true)}>
                                <View style={[styles.iconCircle, { backgroundColor: '#E8F5E9' }]}>
                                    <Ionicons name="camera" size={30} color={COLORS.primary} />
                                </View>
                                <Text style={styles.attachText}>Kamera</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.attachOptionBtn} onPress={() => pickImage(false)}>
                                <View style={[styles.iconCircle, { backgroundColor: '#E3F2FD' }]}>
                                    <Ionicons name="images" size={30} color={COLORS.info} />
                                </View>
                                <Text style={styles.attachText}>Galeri</Text>
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity style={styles.cancelBtn} onPress={() => setAttachModalVisible(false)}>
                            <Text style={styles.cancelBtnText}>Batal</Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Modal>

            {/* Modal Image Full Screen Preview */}
            <Modal
                visible={!!viewImage}
                transparent={false}
                animationType="fade" // Diubah dari "zoom" ke "fade"
                onRequestClose={() => setViewImage(null)}
            >
                <View style={styles.fullImageContainer}>
                    <StatusBar barStyle="light-content" />
                    <TouchableOpacity
                        style={styles.closeFullImage}
                        onPress={() => setViewImage(null)}
                    >
                        <Ionicons name="close" size={32} color={COLORS.white} />
                    </TouchableOpacity>

                    {viewImage && (
                        <Image
                            source={{ uri: viewImage }}
                            style={styles.fullImage}
                            resizeMode="contain"
                        />
                    )}
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: SPACING.md, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: SPACING.md,
        backgroundColor: COLORS.white, ...SHADOWS.small, zIndex: 10
    },
    backBtn: { padding: 8 },
    expertInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 4 },
    avatarContainer: { position: 'relative' },
    avatar: { width: 42, height: 42, borderRadius: 21 },
    onlineDot: {
        position: 'absolute', bottom: 0, right: 0, width: 12, height: 12,
        borderRadius: 6, borderWidth: 2, borderColor: COLORS.white
    },
    expertName: { fontSize: 16, fontWeight: '700', color: COLORS.text },
    expertStatus: { fontSize: 12, color: COLORS.textSecondary },

    messageList: { padding: SPACING.lg },
    messageBubble: {
        maxWidth: '80%', padding: 10, borderRadius: RADIUS.md, marginBottom: 12,
        ...SHADOWS.small
    },
    myMessage: { alignSelf: 'flex-end', backgroundColor: COLORS.primary, borderBottomRightRadius: 2 },
    theirMessage: { alignSelf: 'flex-start', backgroundColor: COLORS.white, borderBottomLeftRadius: 2 },
    messageText: { fontSize: 15, lineHeight: 20 },
    myMessageText: { color: COLORS.white },
    theirMessageText: { color: COLORS.text },
    timeText: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
    myTimeText: { color: 'rgba(255,255,255,0.7)' },
    theirTimeText: { color: COLORS.textLight },

    imageWrapper: { marginBottom: 4 },
    messageImage: { width: width * 0.6, height: 180, borderRadius: RADIUS.md },

    inputContainer: { backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.divider, paddingBottom: Platform.OS === 'ios' ? 30 : 15 },
    inputRow: { flexDirection: 'row', alignItems: 'center', padding: SPACING.sm },
    attachBtn: { paddingHorizontal: 8 },
    input: {
        flex: 1, backgroundColor: '#F0F2F5', borderRadius: 22, paddingHorizontal: 16,
        paddingVertical: 10, maxHeight: 100, fontSize: 15, marginHorizontal: 8
    },
    sendBtn: {
        width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary,
        alignItems: 'center', justifyContent: 'center'
    },
    sendBtnDisabled: { backgroundColor: COLORS.textLight },

    previewContainer: { padding: 12, flexDirection: 'row' },
    previewImage: { width: 70, height: 70, borderRadius: RADIUS.sm },
    removePreview: { position: 'absolute', top: 5, left: 75 },

    // ATTACHMENT MODAL
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    attachmentSheet: {
        backgroundColor: COLORS.white, borderTopLeftRadius: RADIUS.xxl, borderTopRightRadius: RADIUS.xxl,
        padding: SPACING.xl, paddingBottom: Platform.OS === 'ios' ? 40 : 20
    },
    sheetHandle: { width: 40, height: 5, backgroundColor: COLORS.divider, borderRadius: 3, alignSelf: 'center', marginBottom: 15 },
    modalTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 25 },
    attachmentOptions: { flexDirection: 'row', justifyContent: 'space-evenly', marginBottom: 20 },
    attachOptionBtn: { alignItems: 'center' },
    iconCircle: { width: 65, height: 65, borderRadius: 35, alignItems: 'center', justifyContent: 'center', marginBottom: 10, ...SHADOWS.small },
    attachText: { fontWeight: '500', color: COLORS.textSecondary },
    cancelBtn: { padding: 15, alignItems: 'center', backgroundColor: COLORS.background, borderRadius: RADIUS.md, marginTop: 10 },
    cancelBtnText: { color: COLORS.text, fontWeight: '600' },

    // FULL SCREEN PREVIEW
    fullImageContainer: { flex: 1, backgroundColor: COLORS.black, justifyContent: 'center' },
    closeFullImage: { position: 'absolute', top: 50, right: 20, zIndex: 20, padding: 10 },
    fullImage: { width: '100%', height: '100%' }
});
