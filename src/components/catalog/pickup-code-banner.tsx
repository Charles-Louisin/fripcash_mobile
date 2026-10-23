import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { Txt } from '@/components/ui';
import { fonts, radius } from '@/theme';

export function PickupCodeBanner() {
  return (
    <View style={styles.banner}>
      <View style={styles.iconWrap}>
        <Ionicons name="storefront-outline" size={22} color="#1F5C45" />
      </View>
      <View style={styles.copy}>
        <Txt style={styles.title}>Retrait par code</Txt>
        <View style={styles.sep} />
        <Txt style={styles.text}>
          Après le paiement, vous recevez un code. Présentez ce code au boutiquier pour retirer votre commande.
        </Txt>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 14,
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: '#E4F3EC',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  title: { fontFamily: fonts.bold, fontSize: 15, color: '#1F5C45' },
  sep: { width: 1, height: 16, backgroundColor: 'rgba(31,92,69,0.25)' },
  text: {
    flex: 1,
    minWidth: 160,
    fontFamily: fonts.medium,
    fontSize: 12.5,
    lineHeight: 17,
    color: '#2A6B52',
  },
});
