import { Alert, Platform } from 'react-native';

interface ConfirmActionOptions {
  title: string;
  message: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
}

/**
 * Cross-platform confirmation for destructive actions (log out, delete).
 *
 * React Native's Alert.alert is unimplemented on web — it silently does
 * nothing, which is why "Log out" appeared dead in the browser build: the
 * dialog never appeared, so the confirm callback never ran. On web we fall
 * back to the browser's native confirm; on native we keep the RN dialog.
 */
export function confirmAction({
  title,
  message,
  confirmLabel,
  destructive = false,
  onConfirm,
}: ConfirmActionOptions): void {
  if (Platform.OS === 'web') {
    const webGlobal = globalThis as unknown as {
      confirm?: (text: string) => boolean;
    };
    if (typeof webGlobal.confirm === 'function') {
      if (webGlobal.confirm(`${title}\n\n${message}`)) onConfirm();
    } else {
      onConfirm();
    }
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    {
      text: confirmLabel,
      style: destructive ? 'destructive' : 'default',
      onPress: onConfirm,
    },
  ]);
}
