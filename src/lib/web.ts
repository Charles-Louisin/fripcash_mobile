import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

export const WEB_ORIGIN = (process.env.EXPO_PUBLIC_WEB_URL || 'https://fripcash.com').replace(/\/$/, '');

export function appLink(path: string) {
  return Linking.createURL(path.replace(/^\//, ''));
}

export function openLegal(path: string) {
  return WebBrowser.openBrowserAsync(`${WEB_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`, {
    presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
  });
}
