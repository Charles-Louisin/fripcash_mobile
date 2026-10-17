import Constants from 'expo-constants';
import { View } from 'react-native';

import { Card, Screen, ScreenHeader, Txt } from '@/components/ui';
import { colors } from '@/theme';

const version = Constants.expoConfig?.version ?? '1.0.0';

export default function AProposScreen() {
  return (
    <Screen>
      <ScreenHeader title="À propos" />
      <Card>
        <Txt variant="h2">FripCash</Txt>
        <Txt variant="body" color={colors.textMuted} style={{ marginTop: 10 }}>
          FripCash est née en Guinée d’une idée simple : permettre à chacun de donner une seconde vie à ses articles, tout en gagnant de l’argent. La plateforme connecte vendeurs et acheteurs dans un espace sécurisé et convivial.
        </Txt>
      </Card>
      <View style={{ height: 12 }} />
      <Card>
        <Txt variant="h3">Le but</Txt>
        <Txt variant="body" color={colors.textMuted} style={{ marginTop: 8 }}>
          Rendre la mode et les articles du quotidien accessibles, avec un paiement protégé et une livraison fiable, en Guinée.
        </Txt>
      </Card>
      <View style={{ height: 12 }} />
      <Card>
        <Txt variant="h3">Fondateurs</Txt>
        <Txt variant="body" style={{ marginTop: 8 }}>
          {'TOUNKARA Leontine\nADAMA'}
        </Txt>
      </Card>
      <View style={{ height: 12 }} />
      <Card>
        <Txt variant="h3">Développé par</Txt>
        <Txt variant="body" style={{ marginTop: 8 }}>
          MBOKO CODE
        </Txt>
      </Card>
      <View style={{ height: 12 }} />
      <Card>
        <Txt variant="h3">Version</Txt>
        <Txt variant="body" color={colors.textMuted} style={{ marginTop: 8 }}>
          {version}
        </Txt>
      </Card>
    </Screen>
  );
}
