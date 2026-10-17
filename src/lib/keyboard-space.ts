import { useEffect, useState } from 'react';
import { Dimensions, Keyboard, Platform } from 'react-native';

type Viewport = {
  height: number;
  offsetTop: number;
  addEventListener: (type: string, listener: () => void) => void;
  removeEventListener: (type: string, listener: () => void) => void;
};

/**
 * Hauteur à réserver sous l'écran pour que le clavier ne recouvre pas le champ.
 * Si la fenêtre a déjà rétréci (Android resize), on n'ajoute que le reste.
 */
export function useKeyboardSpace() {
  const [space, setSpace] = useState(0);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const host = globalThis as {
        visualViewport?: Viewport;
        innerHeight?: number;
        document?: { activeElement?: { scrollIntoView?: (opts: { block: 'center'; inline: 'nearest' }) => void } | null };
        addEventListener: (type: string, listener: () => void) => void;
        removeEventListener: (type: string, listener: () => void) => void;
      };
      const view = host.visualViewport;
      if (!view) return undefined;
      const update = () => {
        const overlap = Math.max(0, Math.round((host.innerHeight ?? 0) - view.height - view.offsetTop));
        setSpace(overlap);
      };
      view.addEventListener('resize', update);
      view.addEventListener('scroll', update);
      const focus = () => {
        requestAnimationFrame(() => {
          host.document?.activeElement?.scrollIntoView?.({ block: 'center', inline: 'nearest' });
        });
      };
      host.addEventListener('focusin', focus);
      return () => {
        view.removeEventListener('resize', update);
        view.removeEventListener('scroll', update);
        host.removeEventListener('focusin', focus);
      };
    }

    const showName = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideName = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showName, (event) => {
      const before = Dimensions.get('window').height;
      const reported = event.endCoordinates?.height ?? 0;
      setTimeout(() => {
        const shrunk = Math.max(0, before - Dimensions.get('window').height);
        setSpace(Math.max(0, Math.round(reported - shrunk)));
      }, 40);
    });
    const hide = Keyboard.addListener(hideName, () => setSpace(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return space;
}
