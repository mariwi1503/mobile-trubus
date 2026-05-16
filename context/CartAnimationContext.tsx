import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Easing,
  Image,
  ImageSourcePropType,
  StyleSheet,
  View,
} from 'react-native';
import { COLORS, SHADOWS } from '../constants/theme';

type MeasurableNode = {
  measureInWindow?: (
    callback: (x: number, y: number, width: number, height: number) => void,
  ) => void;
};

type CartTargetRegistration = {
  node: MeasurableNode | null;
  onImpact?: () => void;
};

type MeasuredRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type FlightTarget = {
  x: number;
  y: number;
  size: number;
};

type FlightState = {
  imageSource: ImageSourcePropType;
  start: FlightTarget;
  target: FlightTarget;
};

type CartAnimationPayload = {
  sourceNode: MeasurableNode | null;
  imageSource: ImageSourcePropType;
  targetKey?: string;
};

type CartAnimationContextType = {
  setCartTarget: (key: string, node: MeasurableNode | null, onImpact?: () => void) => void;
  animateToCart: (payload: CartAnimationPayload) => Promise<boolean>;
};

const CartAnimationContext = createContext<CartAnimationContextType | undefined>(undefined);

const DEFAULT_TARGET_KEY = 'default';
const FLIGHT_DURATION = 760;
const LANDING_DURATION = 280;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function measureNode(node: MeasurableNode | null): Promise<MeasuredRect | null> {
  return new Promise((resolve) => {
    if (!node?.measureInWindow) {
      resolve(null);
      return;
    }

    requestAnimationFrame(() => {
      node.measureInWindow?.((x, y, width, height) => {
        if (!width || !height) {
          resolve(null);
          return;
        }

        resolve({ x, y, width, height });
      });
    });
  });
}

export function CartAnimationProvider({ children }: { children: ReactNode }) {
  const targetsRef = useRef(new Map<string, CartTargetRegistration>());
  const flightProgress = useRef(new Animated.Value(0)).current;
  const landingProgress = useRef(new Animated.Value(0)).current;
  const [flight, setFlight] = useState<FlightState | null>(null);
  const [landingTarget, setLandingTarget] = useState<FlightTarget | null>(null);

  const setCartTarget = useCallback((key: string, node: MeasurableNode | null, onImpact?: () => void) => {
    if (!node) {
      targetsRef.current.delete(key);
      return;
    }

    targetsRef.current.set(key, { node, onImpact });
  }, []);

  const animateToCart = useCallback(async ({
    sourceNode,
    imageSource,
    targetKey = DEFAULT_TARGET_KEY,
  }: CartAnimationPayload) => {
    const targetRegistration = targetsRef.current.get(targetKey);
    const targetNode = targetRegistration?.node ?? null;
    const [sourceRect, targetRect] = await Promise.all([
      measureNode(sourceNode),
      measureNode(targetNode),
    ]);

    if (!sourceRect || !targetRect) {
      return false;
    }

    const startSize = clamp(
      Math.min(sourceRect.width, sourceRect.height, 78),
      46,
      78,
    );
    const targetSize = clamp(
      Math.min(targetRect.width, targetRect.height) * 0.44,
      16,
      22,
    );

    const nextFlight: FlightState = {
      imageSource,
      start: {
        x: sourceRect.x + (sourceRect.width - startSize) / 2,
        y: sourceRect.y + (sourceRect.height - startSize) / 2,
        size: startSize,
      },
      target: {
        x: targetRect.x + (targetRect.width - targetSize) / 2,
        y: targetRect.y + (targetRect.height - targetSize) / 2,
        size: targetSize,
      },
    };

    setFlight(nextFlight);
    flightProgress.stopAnimation();
    flightProgress.setValue(0);

    return new Promise<boolean>((resolve) => {
      requestAnimationFrame(() => {
        Animated.timing(flightProgress, {
          toValue: 1,
          duration: FLIGHT_DURATION,
          easing: Easing.bezier(0.2, 0.78, 0.18, 1),
          useNativeDriver: true,
        }).start(({ finished }) => {
          setFlight(null);

          if (finished) {
            targetRegistration?.onImpact?.();
            setLandingTarget(nextFlight.target);
            landingProgress.stopAnimation();
            landingProgress.setValue(0);
            Animated.timing(landingProgress, {
              toValue: 1,
              duration: LANDING_DURATION,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }).start(() => {
              setLandingTarget(null);
            });
          }

          resolve(finished);
        });
      });
    });
  }, [flightProgress, landingProgress]);

  const value = useMemo(() => ({
    setCartTarget,
    animateToCart,
  }), [animateToCart, setCartTarget]);

  const translateX = flight
    ? flightProgress.interpolate({
        inputRange: [0, 0.72, 1],
        outputRange: [
          flight.start.x,
          flight.start.x + (flight.target.x - flight.start.x) * 0.58,
          flight.target.x,
        ],
      })
    : 0;

  const translateY = flight
    ? flightProgress.interpolate({
        inputRange: [0, 0.38, 1],
        outputRange: [
          flight.start.y,
          Math.min(flight.start.y, flight.target.y) - 42,
          flight.target.y,
        ],
      })
    : 0;

  const scale = flight
    ? flightProgress.interpolate({
        inputRange: [0, 0.72, 1],
        outputRange: [1, 0.72, flight.target.size / flight.start.size],
      })
    : 1;

  const rotate = flight
    ? flightProgress.interpolate({
        inputRange: [0, 0.55, 1],
        outputRange: ['0deg', '-11deg', '0deg'],
      })
    : '0deg';

  const opacity = flight
    ? flightProgress.interpolate({
        inputRange: [0, 0.88, 1],
        outputRange: [1, 1, 0.18],
      })
    : 0;

  return (
    <CartAnimationContext.Provider value={value}>
      <View style={styles.container}>
        {children}

        <View pointerEvents="none" style={styles.overlay}>
          {flight ? (
            <Animated.View
              style={[
                styles.flightCard,
                {
                  width: flight.start.size,
                  height: flight.start.size,
                  opacity,
                  transform: [
                    { translateX },
                    { translateY },
                    { scale },
                    { rotate },
                  ],
                },
              ]}
            >
              <Image source={flight.imageSource} style={styles.flightImage} />
            </Animated.View>
          ) : null}

          {landingTarget ? (
            <Animated.View
              style={[
                styles.landingPulse,
                {
                  width: landingTarget.size * 2.6,
                  height: landingTarget.size * 2.6,
                  borderRadius: landingTarget.size * 1.3,
                  left: landingTarget.x - landingTarget.size * 0.8,
                  top: landingTarget.y - landingTarget.size * 0.8,
                  opacity: landingProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.36, 0],
                  }),
                  transform: [
                    {
                      scale: landingProgress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.42, 1.7],
                      }),
                    },
                  ],
                },
              ]}
            />
          ) : null}
        </View>
      </View>
    </CartAnimationContext.Provider>
  );
}

export function useCartAnimation() {
  const context = useContext(CartAnimationContext);

  if (!context) {
    throw new Error('useCartAnimation must be used within a CartAnimationProvider');
  }

  return context;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
  flightCard: {
    position: 'absolute',
    overflow: 'hidden',
    borderRadius: 18,
    backgroundColor: COLORS.white,
    ...SHADOWS.large,
  },
  flightImage: {
    width: '100%',
    height: '100%',
  },
  landingPulse: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(76, 175, 80, 0.12)',
  },
});
