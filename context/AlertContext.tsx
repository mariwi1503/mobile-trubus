import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface AlertButton {
    text: string;
    style?: 'default' | 'cancel' | 'destructive';
    onPress?: () => void;
}

interface AlertContextType {
    showAlert: (title: string, message: string, buttons?: AlertButton[]) => void;
    hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType>({} as AlertContextType);
export const useAlert = () => useContext(AlertContext);

const CustomAlert = ({
    visible,
    title,
    message,
    buttons,
    onClose
}: {
    visible: boolean;
    title: string;
    message: string;
    buttons: AlertButton[];
    onClose: () => void;
}) => {
    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                <View style={styles.alertBox}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="information-circle" size={32} color={COLORS.primary} />
                    </View>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.message}>{message}</Text>
                    <View style={styles.buttonContainer}>
                        {buttons.map((btn, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.button,
                                    btn.style === 'cancel' && styles.cancelButton,
                                    btn.style === 'destructive' && styles.destructiveButton,
                                    // If only one button, make it full width if desired, or just let flex handle it
                                ]}
                                onPress={() => {
                                    onClose();
                                    if (btn.onPress) btn.onPress();
                                }}
                            >
                                <Text style={[
                                    styles.buttonText,
                                    btn.style === 'cancel' && styles.cancelText,
                                    btn.style === 'destructive' && styles.destructiveText
                                ]}>
                                    {btn.text}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export const AlertProvider = ({ children }: { children: ReactNode }) => {
    const [visible, setVisible] = useState(false);
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [buttons, setButtons] = useState<AlertButton[]>([]);

    const showAlert = useCallback((title: string, message: string, buttons: AlertButton[] = [{ text: 'OK' }]) => {
        setTitle(title);
        setMessage(message);
        setButtons(buttons);
        setVisible(true);
    }, []);

    const hideAlert = useCallback(() => {
        setVisible(false);
    }, []);

    return (
        <AlertContext.Provider value={{ showAlert, hideAlert }}>
            {children}
            <CustomAlert
                visible={visible}
                title={title}
                message={message}
                buttons={buttons}
                onClose={hideAlert}
            />
        </AlertContext.Provider>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.lg,
    },
    alertBox: {
        width: '100%',
        maxWidth: 320,
        backgroundColor: COLORS.white,
        borderRadius: RADIUS.xl,
        padding: SPACING.xl,
        alignItems: 'center',
        ...SHADOWS.medium,
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: COLORS.primaryBg,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
        textAlign: 'center',
        marginBottom: 8,
    },
    message: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: SPACING.xl,
        lineHeight: 20,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
        width: '100%',
        flexWrap: 'wrap',
    },
    button: {
        flex: 1,
        minWidth: 100,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: RADIUS.md,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        backgroundColor: COLORS.background,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    destructiveButton: {
        backgroundColor: '#FFEBEE',
    },
    buttonText: {
        color: COLORS.white,
        fontWeight: '700',
        fontSize: 14,
    },
    cancelText: {
        color: COLORS.text,
    },
    destructiveText: {
        color: COLORS.accent,
    },
});
