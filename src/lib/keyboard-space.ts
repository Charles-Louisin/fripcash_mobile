import { useEffect, useState } from 'react';
import { Dimensions, Keyboard, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  return useKeyboardState().space;
}

/**
 * Espace sous la zone d'écriture d'un chat : au-dessus de la barre système quand
 * le clavier est fermé, collé au clavier quand il est ouvert.
 */
export function useComposerSpace(gap = 14) {
  const insets = useSafeAreaInsets();
  const { space, open } = useKeyboardState();
  return open ? space + 6 : insets.bottom + gap;
}

function useKeyboardState() {
  const [space, setSpace] = useState(0);
  const [open, setOpen] = useState(false);

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
        setOpen(overlap > 0);
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
      setOpen(true);
      const before = Dimensions.get('window').height;
      const reported = event.endCoordinates?.height ?? 0;
      setTimeout(() => {
        const shrunk = Math.max(0, before - Dimensions.get('window').height);
        setSpace(Math.max(0, Math.round(reported - shrunk)));
      }, 40);
    });
    const hide = Keyboard.addListener(hideName, () => {
      setSpace(0);
      setOpen(false);
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return { space, open };
}
