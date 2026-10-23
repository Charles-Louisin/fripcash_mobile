import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Sheet, Txt } from '@/components/ui';
import { useZones } from '@/hooks/queries';
import { colors, radius } from '@/theme';

export type SelectOption = { value: string; label: string; hint?: string };

export function SelectField({
  label,
  placeholder = 'Choisir',
  value,
  options,
  onChange,
  error,
}: {
  label?: string;
  placeholder?: string;
  value?: string | null;
  options: SelectOption[];
  onChange: (value: string) => void;
  error?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  return (
    <View style={{ gap: 6 }}>
      {label ? <Txt variant="label">{label}</Txt> : null}
      <Pressable
        onPress={() => setOpen(true)}
        style={[styles.field, !!error && { borderColor: colors.error }]}
        accessibilityRole="button">
        <Txt variant="body" color={selected ? colors.text : colors.textSubtle} style={{ flex: 1 }} numberOfLines={1}>
          {selected?.label ?? placeholder}
        </Txt>
        <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
      </Pressable>
      {error ? (
        <Txt variant="caption" color={colors.error}>
          {error}
        </Txt>
      ) : null}
      <Sheet visible={open} onClose={() => setOpen(false)} title={label ?? placeholder}>
        <View style={{ gap: 6 }}>
          {options.map((o) => {
            const active = o.value === value;
            return (
              <Pressable
                key={o.value}
                onPress={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                style={[styles.option, active && styles.optionActive]}>
                <View style={{ flex: 1 }}>
                  <Txt variant="bodyStrong" color={active ? colors.primaryDark : colors.text}>
                    {o.label}
                  </Txt>
                  {o.hint ? <Txt variant="caption">{o.hint}</Txt> : null}
                </View>
                {active ? <Ionicons name="checkmark-circle" size={20} color={colors.primary} /> : null}
              </Pressable>
            );
          })}
          {!options.length ? <Txt variant="caption">Aucune option disponible.</Txt> : null}
        </View>
      </Sheet>
    </View>
  );
}

export function ZoneSelect({
  value,
  onChange,
  label = 'Zone',
  error,
}: {
  value?: string | null;
  onChange: (id: string) => void;
  label?: string;
  error?: string | null;
}) {
  const { data: zones = [] } = useZones();
  return (
    <SelectField
      label={label}
      placeholder="Choisis ta zone"
      value={value}
      onChange={onChange}
      error={error}
      options={zones.map((z) => ({ value: z.id, label: z.nameFr }))}
    />
  );
}

const styles = StyleSheet.create({
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
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  optionActive: { borderColor: colors.primary, backgroundColor: colors.secondary },
});
