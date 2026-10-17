import { View } from 'react-native';

import { Screen, ScreenHeader, Txt } from '@/components/ui';
import { LEGAL_CHAPTERS } from '@/lib/legal-copy';
import { colors, fonts } from '@/theme';

export default function MentionsLegalesScreen() {
  return (
    <Screen>
      <ScreenHeader title="Mentions légales" />
      <Txt variant="body" color={colors.textMuted} style={{ marginBottom: 18 }}>
        Les mêmes informations que sur le site FripCash : conditions, confidentialité, sécurité, commissions, livraison, fonctionnement, éco-responsabilité et contact.
      </Txt>
      {LEGAL_CHAPTERS.map((chapter) => (
        <View key={chapter.title} style={{ marginBottom: 22 }}>
          <Txt variant="h2" style={{ marginBottom: 8 }}>
            {chapter.title}
          </Txt>
          {chapter.intro ? (
            <Txt variant="body" color={colors.textMuted} style={{ marginBottom: 6 }}>
              {chapter.intro}
            </Txt>
          ) : null}
          {chapter.updated ? (
            <Txt variant="caption" style={{ marginBottom: 10 }}>
              {chapter.updated}
            </Txt>
          ) : null}
          {chapter.blocks.map((block) => (
            <View key={block.title} style={{ marginTop: 12 }}>
              <Txt style={{ fontFamily: fonts.bold, fontSize: 15, color: colors.text, marginBottom: 4 }}>{block.title}</Txt>
              <Txt variant="body" color={colors.textMuted}>
                {block.body}
              </Txt>
            </View>
          ))}
        </View>
      ))}
    </Screen>
  );
}
