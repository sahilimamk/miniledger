import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon } from './AppIcon';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { useTheme } from '../theme/useTheme';

interface ToastOptions {
  title: string;
  message?: string;
  /** 'error' gets a red badge, an alert icon, 5s on screen, tap to dismiss. */
  variant?: 'success' | 'error';
  symbol?: ComponentProps<typeof AppIcon>['symbol'];
  ionicon?: ComponentProps<typeof AppIcon>['ionicon'];
  /** Icon badge color; defaults to systemGreen (success) / systemRed (error). */
  color?: string;
}

interface ToastState extends ToastOptions {
  id: number;
}

const ToastContext = createContext<{ show: (options: ToastOptions) => void }>({
  show: () => undefined,
});

/** useToast().show({ title, message }) — a burnt-style toast, not an alert. */
export function useToast() {
  return useContext(ToastContext);
}

/**
 * Non-blocking feedback inspired by burnt (native iOS toasts): a pill drops
 * from the top with an icon badge, lingers, and leaves on its own. Success
 * gets ~2.6s; errors get 5s and a tap-to-dismiss. Destructive confirmations
 * still use Alert, which is supposed to block. The host renders above the
 * navigator, so a toast fired right before goBack() still lands on the
 * previous screen.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextId = useRef(1);

  const dismiss = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setToast(null);
  }, []);

  const show = useCallback((options: ToastOptions) => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ ...options, id: nextId.current++ });
    timer.current = setTimeout(() => setToast(null), options.variant === 'error' ? 5000 : 2600);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <ToastHost toast={toast} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

function ToastHost({
  toast,
  onDismiss,
}: {
  toast: ToastState | null;
  onDismiss: () => void;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [focused, setFocused] = useState(false);

  if (!toast) return null;
  const isError = toast.variant === 'error';
  const badge = toast.color ?? (isError ? colors.systemRed : colors.systemGreen);

  return (
    <View style={[styles.host, { top: insets.top + spacing.sm }]}>
      <Pressable
        onPress={onDismiss}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        accessibilityRole="button"
        accessibilityLabel={`${toast.title}. Tap to dismiss.`}
        style={[
          styles.pillPressable,
          focused && {
            outlineStyle: 'solid',
            outlineWidth: 2,
            outlineColor: colors.tintText,
            outlineOffset: 2,
          },
        ]}
      >
        <Animated.View
          key={toast.id}
          accessibilityLiveRegion="polite"
          entering={FadeInUp.springify().damping(17)}
          exiting={FadeOutUp}
          style={[
            styles.pill,
            {
              backgroundColor: colors.secondarySystemBackground,
              borderColor: isError ? colors.systemRed : colors.separator,
              shadowColor: colors.label,
            },
          ]}
        >
          <View style={[styles.badge, { backgroundColor: badge }]}>
            <AppIcon
              symbol={toast.symbol ?? (isError ? 'exclamationmark' : 'checkmark')}
              ionicon={toast.ionicon ?? (isError ? 'alert' : 'checkmark')}
              size={14}
              color={colors.onTint}
            />
          </View>
          <View style={styles.textWrap}>
            <Text style={[typography.headline, styles.title, { color: colors.label }]} numberOfLines={2}>
              {toast.title}
            </Text>
            {toast.message ? (
              <Text style={[typography.footnote, { color: colors.secondaryLabel }]} numberOfLines={2}>
                {toast.message}
              </Text>
            ) : null}
          </View>
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
    paddingHorizontal: spacing.lg,
  },
  pillPressable: {
    width: '100%',
    maxWidth: 420,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    width: '100%',
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 10,
  },
  badge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
    gap: 1,
  },
  title: {
    fontSize: 15,
  },
});
