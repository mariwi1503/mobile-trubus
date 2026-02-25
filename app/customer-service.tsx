import React from 'react';
import { useRouter } from 'expo-router';
import CSChatWidget from '../components/CSChatWidget';

export default function CustomerServiceScreen() {
    const router = useRouter();

    return (
        <CSChatWidget onClose={() => router.back()} />
    );
}
