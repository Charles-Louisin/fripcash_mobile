import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Switch, View } from 'react-native';

import { SelectField } from '@/components/select-field';
import { Button, ConfirmDialog, Input, Loading, Screen, ScreenHeader, toast, Txt } from '@/components/ui';
import { qk, useCategories, useListing } from '@/hooks/queries';
import { useAccountType } from '@/hooks/use-account-type';
import {
  attachListingMedia,
  createListing,
  deleteListing,
  deleteListingMedia,
  errorMessage,
  mediaUrl,
  pickImages,
  updateListing,
  uploadPickedImage,
  type Listing,
  type ListingDestination,
  type ListingInput,
} from '@/lib/api';
import { UNIVERSES } from '@/lib/domain';
import { colors, radius } from '@/theme';
import { useQueryClient } from '@tanstack/react-query';

type Photo = { url: string; publicId: string; mimeType?: string; mediaId?: string };

function initialPhotos(listing?: Listing): Photo[] {
  return [...(listing?.media ?? [])]
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((m) => ({
      url: mediaUrl(m.url) || mediaUrl(m.storageKey) || '',
      publicId: m.storageKey,
      mimeType: m.mimeType,
      mediaId: m.id,
    }))
    .filter((p) => !!p.url);
}

export default function EditArticleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'nouveau';
  const existing = useListing(isNew ? undefined : id);
  if (!isNew && existing.isLoading) {
    return (
      <Screen scroll={false}>
        <ScreenHeader title="Modifier" />
        <Loading />
      </Screen>
    );
  }
  return <ArticleForm id={id} isNew={isNew} initial={existing.data} />;
}

function ArticleForm({ id, isNew, initial }: { id: string; isNew: boolean; initial?: Listing }) {
  const cats = useCategories();
  const { type, me } = useAccountType();
  const client = useQueryClient();
  const destination = (
    isNew
      ? (me?.seller?.listingDestination ?? UNIVERSES.find((u) => u.title === type.destination)?.destination ?? 'SECONDE_MAIN')
      : (initial?.destination ?? 'SECONDE_MAIN')
  ) as ListingDestination;
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [price, setPrice] = useState(initial ? String(initial.netPriceGnf || initial.priceGnf) : '');
  const [qty, setQty] = useState(initial ? String(initial.quantity) : '1');
  const [picked, setPicked] = useState<{ parent: string; sub: string } | null>(null);
  const [condition, setCondition] = useState(initial?.conditionNote ?? '');
  const [negotiable, setNegotiable] = useState(!!initial?.negotiable);
  const [promo, setPromo] = useState(!!initial?.discountEnabled);
  const [compare, setCompare] = useState(initial?.compareAtPriceGnf ? String(initial.compareAtPriceGnf) : '');
  const [images, setImages] = useState<Photo[]>(() => initialPhotos(initial));
  const [uploading, setUploading] = useState(false);
  const [replacing, setReplacing] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const allCats = cats.data ?? [];
  const selection = useMemo(() => {
    if (picked) return picked;
    const current = initial?.categoryId;
    const cat = allCats.find((c) => c.id === current);
    if (!cat) return { parent: '', sub: '' };
    if (cat.parentId) return { parent: cat.parentId, sub: cat.id };
    return { parent: cat.id, sub: '' };
  }, [picked, allCats, initial?.categoryId]);
  const parentId = selection.parent;
  const subId = selection.sub;
  const parents = allCats.filter((c) => !c.parentId);
  const children = allCats.filter((c) => c.parentId === parentId);

  const attach = async (photo: Photo): Promise<Photo> => {
    if (isNew) return photo;
    const saved = (await attachListingMedia(id, {
      url: photo.url,
      publicId: photo.publicId,
      mimeType: photo.mimeType,
    })) as { id?: string };
    return { ...photo, mediaId: saved?.id };
  };

  const detach = async (photo: Photo) => {
    if (!isNew && photo.mediaId) await deleteListingMedia(id, photo.mediaId);
  };

  const replacePhoto = async (current: Photo) => {
    if (uploading || replacing) return;
    try {
      const assets = await pickImages();
      const asset = assets[0];
      if (!asset) return;
      setReplacing(current.url);
      const uploaded = await uploadPickedImage(asset, 'listings');
      const next = await attach({ url: uploaded.url, publicId: uploaded.publicId, mimeType: uploaded.mimeType });
      await detach(current);
      setImages((prev) => prev.map((item) => (item.url === current.url ? next : item)));
      if (!isNew) client.invalidateQueries({ queryKey: qk.listing(id) });
      toast.success('Photo remplacée.');
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setReplacing(null);
    }
  };

  const removePhoto = async (photo: Photo) => {
    if (uploading || replacing) return;
    try {
      setReplacing(photo.url);
      await detach(photo);
      setImages((prev) => prev.filter((item) => item.url !== photo.url));
      if (!isNew) client.invalidateQueries({ queryKey: qk.listing(id) });
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setReplacing(null);
    }
  };

  const addPhotos = async () => {
    if (uploading || replacing) return;
    try {
      const assets = await pickImages({ multiple: true });
      if (!assets.length) return;
      setUploading(true);
      const uploaded: Photo[] = [];
      for (const a of assets) {
        const u = await uploadPickedImage(a, 'listings');
        uploaded.push(await attach({ url: u.url, publicId: u.publicId, mimeType: u.mimeType }));
      }
      setImages((prev) => [...prev, ...uploaded]);
      if (!isNew) client.invalidateQueries({ queryKey: qk.listing(id) });
      toast.success(uploaded.length > 1 ? `${uploaded.length} photos ajoutées.` : 'Photo ajoutée.');
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    const net = Number(price.replace(/\s/g, ''));
    const quantity = Number(qty) || 1;
    if (!title.trim() || !net) {
      toast.error('Titre et prix sont requis.');
      return;
    }
    const body: ListingInput = {
      title: title.trim(),
      description: description.trim() || undefined,
      netPriceGnf: net,
      quantity,
      destination,
      categoryId: (subId || parentId) || undefined,
      conditionNote: condition || undefined,
      negotiable,
      discountEnabled: promo,
      compareAtPriceGnf: promo ? Number(compare.replace(/\s/g, '')) || null : null,
    };
    setLoading(true);
    try {
      if (isNew) {
        const created = await createListing(body);
        for (const [index, photo] of images.entries()) {
          await attachListingMedia(created.id, {
            url: photo.url,
            publicId: photo.publicId,
            mimeType: photo.mimeType,
            sortOrder: index,
          });
        }
        toast.success('Article publié');
        router.replace('/vendeur/articles');
      } else {
        await updateListing(id, body);
        toast.success('Article mis à jour');
        client.invalidateQueries({ queryKey: qk.listing(id) });
        router.back();
      }
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen keyboard>
      <ScreenHeader title={isNew ? 'Nouvel article' : 'Modifier'} />
      <View style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {images.map((photo) => (
            <View key={photo.url}>
              <Pressable onPress={() => replacePhoto(photo)} accessibilityLabel="Changer la photo">
                <Image source={{ uri: photo.url }} style={{ width: 72, height: 72, borderRadius: radius.md }} />
                {replacing === photo.url ? (
                  <View
                    style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      bottom: 0,
                      left: 0,
                      borderRadius: radius.md,
                      backgroundColor: 'rgba(43,23,20,0.45)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <ActivityIndicator color={colors.white} />
                  </View>
                ) : null}
              </Pressable>
              <Pressable
                onPress={() => removePhoto(photo)}
                accessibilityLabel="Supprimer la photo"
                style={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: colors.white,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Ionicons name="trash" size={13} color={colors.error} />
              </Pressable>
            </View>
          ))}
          <Pressable
            onPress={addPhotos}
            disabled={uploading}
            accessibilityLabel="Ajouter une photo"
            style={{
              width: 72,
              height: 72,
              borderRadius: radius.md,
              backgroundColor: colors.secondary,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            {uploading ? <ActivityIndicator color={colors.primary} /> : <Ionicons name="image-outline" size={22} color={colors.primary} />}
          </Pressable>
        </View>
        <Input label="Titre" value={title} onChangeText={setTitle} />
        <Input label="Description" value={description} onChangeText={setDescription} multiline />
        <Input label="Prix net (GNF)" value={price} onChangeText={setPrice} keyboardType="numeric" />
        <Input label="Quantité" value={qty} onChangeText={setQty} keyboardType="numeric" />
        <SelectField
          label="Catégorie"
          value={parentId}
          onChange={(id) => setPicked({ parent: id, sub: '' })}
          options={parents.map((c) => ({ value: c.id, label: c.nameFr }))}
        />
        {parentId && children.length ? (
          <SelectField
            label="Sous-catégorie"
            value={subId}
            placeholder="Choisir une sous-catégorie"
            onChange={(id) => setPicked({ parent: parentId, sub: id })}
            options={children.map((c) => ({ value: c.id, label: c.nameFr }))}
          />
        ) : null}
        <Input label="État / note" value={condition} onChangeText={setCondition} />
        <View style={{ gap: 22, marginTop: 14, marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 }}>
            <Txt variant="label">Négociable</Txt>
            <Switch value={negotiable} onValueChange={setNegotiable} trackColor={{ true: colors.primary }} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 }}>
            <Txt variant="label">Promotion</Txt>
            <Switch value={promo} onValueChange={setPromo} trackColor={{ true: colors.primary }} />
          </View>
        </View>
        {promo ? <Input label="Prix barré (GNF)" value={compare} onChangeText={setCompare} keyboardType="numeric" /> : null}
        <Button title={isNew ? 'Publier' : 'Enregistrer'} onPress={save} loading={loading} full style={{ marginTop: 18 }} />
        {!isNew ? (
          <Button title="Supprimer" variant="danger" onPress={() => setConfirmDel(true)} full />
        ) : null}
      </View>
      <ConfirmDialog
        visible={confirmDel}
        onClose={() => setConfirmDel(false)}
        title="Supprimer cet article ?"
        tone="danger"
        confirmLabel="Supprimer"
        onConfirm={async () => {
          try {
            await deleteListing(id);
            toast.success('Article supprimé');
            router.replace('/vendeur/articles');
          } catch (e) {
            toast.error(errorMessage(e));
          }
        }}
      />
    </Screen>
  );
}
