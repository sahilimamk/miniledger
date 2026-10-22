import AsyncStorage from '@react-native-async-storage/async-storage';

import type { User } from '../api/types';

const TOKEN_KEY = 'miniledger.token';
const USER_KEY = 'miniledger.user';

export interface StoredSession {
  token: string;
  user: User;
}

/** Persists the session so the user stays signed in across app launches. */
export async function saveSession(token: string, user: User): Promise<void> {
  await AsyncStorage.multiSet([
    [TOKEN_KEY, token],
    [USER_KEY, JSON.stringify(user)],
  ]);
}

export async function loadSession(): Promise<StoredSession | null> {
  const [[, token], [, userJson]] = await AsyncStorage.multiGet([TOKEN_KEY, USER_KEY]);
  if (!token || !userJson) {
    return null;
  }
  try {
    const user = JSON.parse(userJson) as User;
    if (typeof user.id !== 'string' || typeof user.phone !== 'string') {
      return null;
    }
    return { token, user };
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
}
