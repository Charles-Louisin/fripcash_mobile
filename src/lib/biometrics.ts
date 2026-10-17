import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

const KEY = 'fripcash.biometrics';

export async function readBiometricsEnabled() {
  return (await AsyncStorage.getItem(KEY)) === '1';
}

export async function enableBiometrics() {
  if (Platform.OS === 'web') {
    return 'unavailable' as const;
  }
  const [hardware, enrolled] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
  ]);
  if (!hardware || !enrolled) return 'unavailable' as const;
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Active Face ID ou ton empreinte pour FripCash',
    cancelLabel: 'Annuler',
    fallbackLabel: 'Code',
  });
  if (!result.success) return 'cancelled' as const;
  await AsyncStorage.setItem(KEY, '1');
  return 'enabled' as const;
}

export async function disableBiometrics() {
  await AsyncStorage.removeItem(KEY);
}
