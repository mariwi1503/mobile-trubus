import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  GestureResponderEvent,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

type ButtonStatus = 'idle' | 'success';
type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface AddToCartButtonProps {
  label: string;
  successLabel?: string;
  idleIcon: IconName;
  successIcon?: IconName;
  iconSize?: number;
  activeOpacity?: number;
  containerStyle?: StyleProp<ViewStyle>;
  successContainerStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  successTextStyle?: StyleProp<TextStyle>;
  onAdd: () => Promise<boolean> | boolean;
  onSuccess?: () => void | Promise<void>;
  onPressStart?: (event: GestureResponderEvent) => void;
  disableSuccessFeedback?: boolean;
}

const SUCCESS_RESET_DELAY = 1600;

export default function AddToCartButton({
  label,
  successLabel = 'Ditambahkan',
  idleIcon,
  successIcon = 'checkmark-circle',
  iconSize = 16,
  activeOpacity = 0.92,
  containerStyle,
  successContainerStyle,
  textStyle,
  successTextStyle,
  onAdd,
  onSuccess,
  onPressStart,
  disableSuccessFeedback = false,
}: AddToCartButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<ButtonStatus>('idle');

  const clearResetTimer = useCallback(() => {
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => {
    clearResetTimer();
  }, [clearResetTimer]);

  useEffect(() => {
    if (status !== 'success') {
      shimmerAnim.setValue(0);
      return;
    }

    const animation = Animated.sequence([
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.timing(shimmerAnim, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      }),
    ]);

    animation.start();

    return () => {
      animation.stop();
    };
  }, [shimmerAnim, status]);

  const animateSuccess = useCallback(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1.06,
        useNativeDriver: true,
        speed: 20,
        bounciness: 10,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 18,
        bounciness: 8,
      }),
    ]).start();
  }, [scaleAnim]);

  const scheduleReset = useCallback(() => {
    clearResetTimer();
    resetTimerRef.current = setTimeout(() => {
      setStatus('idle');
    }, SUCCESS_RESET_DELAY);
  }, [clearResetTimer]);

  const handlePress = useCallback(async (event: GestureResponderEvent) => {
    onPressStart?.(event);

    if (isSubmitting) {
      return;
    }

    clearResetTimer();
    setIsSubmitting(true);

    try {
      const isAdded = await onAdd();

      if (!isAdded) {
        setStatus('idle');
        return;
      }

      if (disableSuccessFeedback) {
        await onSuccess?.();
        setStatus('idle');
        return;
      }

      setStatus('success');
      animateSuccess();
      scheduleReset();
      onSuccess?.();
    } catch {
      setStatus('idle');
    } finally {
      setIsSubmitting(false);
    }
  }, [animateSuccess, clearResetTimer, disableSuccessFeedback, isSubmitting, onAdd, onPressStart, onSuccess, scheduleReset]);

  const isSuccess = status === 'success';
  const currentIcon = isSuccess ? successIcon : idleIcon;
  const currentLabel = isSuccess ? successLabel : label;
  const containerStyles = [styles.button, containerStyle, isSuccess && styles.buttonSuccess, isSuccess && successContainerStyle];
  const labelStyles = [styles.label, textStyle, isSuccess && styles.labelSuccess, isSuccess && successTextStyle];

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        activeOpacity={activeOpacity}
        style={containerStyles}
        onPress={handlePress}
        disabled={isSubmitting}
      >
        <Ionicons name={currentIcon} size={iconSize} color={COLORS.white} />
        <Text style={labelStyles}>{currentLabel}</Text>
        {isSuccess && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.successGlow,
              {
                opacity: shimmerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.22],
                }),
                transform: [
                  {
                    translateX: shimmerAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-48, 48],
                    }),
                  },
                ],
              },
            ]}
          />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSuccess: {
    backgroundColor: '#2E7D32',
  },
  label: {
    color: COLORS.white,
    marginLeft: 6,
  },
  labelSuccess: {
    color: COLORS.white,
  },
  successGlow: {
    position: 'absolute',
    top: -10,
    bottom: -10,
    width: 36,
    backgroundColor: COLORS.white,
    borderRadius: 20,
  },
});
