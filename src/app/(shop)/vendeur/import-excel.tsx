import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, Card, Screen, ScreenHeader, toast, Txt } from '@/components/ui';
import { useAccountType } from '@/hooks/use-account-type';
import { errorMessage, importListingsFile, uriToBase64, type ExcelImportResult } from '@/lib/api';
import { colors } from '@/theme';
import { useQueryClient } from '@tanstack/react-query';

const COLUMNS = [
  { name: 'Titre', note: 'obligatoire' },
  { name: 'Prix', note: 'prix net en GNF, obligatoire' },
  { name: 'Quantité', note: '1 par défaut' },
  { name: 'Description', note: 'facultatif' },
  { name: 'Catégorie', note: 'nom exact d’une catégorie FripCash' },
  { name: 'État', note: 'facultatif' },
  { name: 'Négociable', note: 'oui / non' },
  { name: 'Image', note: 'lien https d’une photo' },
];

export default function ImportExcelScreen() {
  const { type } = useAccountType();
  const client = useQueryClient();
  const [fileName, setFileName] = useState<string | null>(null);
  const [result, setResult] = useState<ExcelImportResult | null>(null);
  const [busy, setBusy] = useState(false);

  const pick = async () => {
    const res = await DocumentPicker.getDocumentAsync({
      type: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv', 'text/comma-separated-values'],
      copyToCacheDirectory: true,
    });
    if (res.canceled || !res.assets[0]) return;
    const asset = res.assets[0];
    const lower = asset.name.toLowerCase();
    if (!lower.endsWith('.xlsx') && !lower.endsWith('.csv')) {
      toast.error('Utilise un fichier .xlsx ou .csv.');
      return;
    }
    setBusy(true);
    setResult(null);
    try {
      const base64 = await uriToBase64(asset.uri);
      const out = await importListingsFile({ base64, filename: asset.name });
      setFileName(asset.name);
      setResult(out);
      client.invalidateQueries({ queryKey: ['listings'] });
      if (out.created) toast.success(`${out.created} article${out.created > 1 ? 's' : ''} publié${out.created > 1 ? 's' : ''}`);
      else toast.error('Aucun article importé.');
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <ScreenHeader title="Import Excel" />
      {!type.excelImport ? (
        <Card>
          <Txt variant="body">L’import Excel est disponible après validation de ta boutique.</Txt>
        </Card>
      ) : (
        <View style={{ gap: 14 }}>
          <Txt variant="body" color={colors.textMuted}>
            Publie plusieurs articles d’un coup avec un fichier .xlsx ou .csv (200 lignes maximum). La première ligne
            contient les noms de colonnes :
          </Txt>
          <Card style={{ gap: 6 }}>
            {COLUMNS.map((c) => (
              <Txt key={c.name} variant="caption">
                <Txt variant="label">{c.name}</Txt> · {c.note}
              </Txt>
            ))}
          </Card>
          <Button title="Choisir un fichier" onPress={pick} loading={busy} full />
          {fileName && result ? (
            <Card style={{ gap: 6 }}>
              <Txt variant="label">{fileName}</Txt>
              <Txt variant="body">
                {result.created} publié{result.created > 1 ? 's' : ''} · {result.skipped} ignoré
                {result.skipped > 1 ? 's' : ''}
              </Txt>
              {result.errors.map((err) => (
                <Txt key={`${err.row}-${err.message}`} variant="caption" color={colors.error}>
                  Ligne {err.row} : {err.message}
                </Txt>
              ))}
              {result.created ? (
                <Button title="Voir mes articles" variant="secondary" onPress={() => router.push('/vendeur/articles')} />
              ) : null}
            </Card>
          ) : null}
        </View>
      )}
    </Screen>
  );
}
