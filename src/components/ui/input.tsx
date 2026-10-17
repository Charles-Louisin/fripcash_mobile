import Ionicons from '@expo/vector-icons/Ionicons';
import { useState, type ComponentProps } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps, type StyleProp, type ViewStyle } from 'react-native';

import { colors, fonts, radius } from '@/theme';

import { Txt } from './text';

type Props = TextInputProps & {
  label?: string;
  hint?: string;
  error?: string | null;
  icon?: ComponentProps<typeof Ionicons>['name'];
  prefix?: string;
  containerStyle?: StyleProp<ViewStyle>;
};

export function Input({ label, hint, error, icon, prefix, secureTextEntry, multiline, containerStyle, style, ...rest }: Props) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(!!secureTextEntry);
  return (
    <View style={[styles.wrap, containerStyle]}>
      {label ? (
        <Txt variant="label" style={styles.label}>
          {label}
        </Txt>
      ) : null}
      <View
        style={[
          styles.field,
          multiline && styles.multiline,
          focused && styles.focused,
          !!error && styles.errored,
        ]}>
        {icon ? <Ionicons name={icon} size={18} color={colors.textMuted} /> : null}
        {prefix ? <Txt variant="bodyStrong" color={colors.textMuted}>{prefix}</Txt> : null}
        <TextInput
          placeholderTextColor={colors.textSubtle}
          {...rest}
          multiline={multiline}
          secureTextEntry={hidden}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          style={[styles.input, multiline && { minHeight: 88, textAlignVertical: 'top' }, style]}
        />
        {secureTextEntry ? (
          <Pressable hitSlop={8} onPress={() => setHidden((h) => !h)} accessibilityLabel="Afficher le mot de passe">
            <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={19} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Txt variant="caption" color={colors.error}>
          {error}
        </Txt>
      ) : hint ? (
        <Txt variant="caption">{hint}</Txt>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { marginLeft: 2 },
  field: {
    minHeight: 50,
    borderRadius: radius.md,
    borderWidth: 1.2,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  multiline: { alignItems: 'flex-start', paddingVertical: 10 },
  focused: { borderColor: colors.primary },
  errored: { borderColor: colors.error },
  input: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.text,
    paddingVertical: 10,
  },
});
