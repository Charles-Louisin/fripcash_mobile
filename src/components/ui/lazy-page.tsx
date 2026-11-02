import type { ComponentProps, ComponentType, ReactNode } from 'react';
import { Suspense, lazy, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { colors, radius } from '@/theme';

import { Skeleton } from './states';

export type SkeletonKind = 'home' | 'list' | 'product' | 'chat' | 'form' | 'profile';

export function PageSkeleton({ kind = 'list' }: { kind?: SkeletonKind }) {
  if (kind === 'home') {
    return (
      <View style={styles.pad}>
        <Skeleton height={48} radius={radius.pill} />
        <Skeleton height={210} radius={radius.xl} style={{ marginTop: 16 }} />
        <View style={styles.row}>
          <Skeleton width="48%" height={118} radius={radius.lg} />
          <Skeleton width="48%" height={118} radius={radius.lg} />
        </View>
        <View style={[styles.row, { marginTop: 12 }]}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} width={148} height={200} radius={radius.lg} />
          ))}
        </View>
      </View>
    );
  }
  if (kind === 'product') {
    return (
      <View>
        <Skeleton height={320} radius={0} />
        <View style={styles.pad}>
          <Skeleton width="40%" height={18} />
          <Skeleton width="80%" height={28} style={{ marginTop: 10 }} />
          <Skeleton width="50%" height={24} style={{ marginTop: 10 }} />
          <Skeleton height={90} radius={radius.lg} style={{ marginTop: 16 }} />
        </View>
      </View>
    );
  }
  if (kind === 'chat') {
    return (
      <View style={styles.pad}>
        <Skeleton height={72} radius={radius.lg} />
        <Skeleton width="70%" height={56} radius={16} style={{ marginTop: 18, alignSelf: 'flex-start' }} />
        <Skeleton width="60%" height={56} radius={16} style={{ marginTop: 10, alignSelf: 'flex-end' }} />
        <Skeleton height={120} radius={radius.xl} style={{ marginTop: 16 }} />
      </View>
    );
  }
  if (kind === 'form') {
    return (
      <View style={styles.pad}>
        <Skeleton height={50} radius={radius.md} />
        <Skeleton height={50} radius={radius.md} style={{ marginTop: 12 }} />
        <Skeleton height={50} radius={radius.md} style={{ marginTop: 12 }} />
        <Skeleton height={56} radius={radius.pill} style={{ marginTop: 20 }} />
      </View>
    );
  }
  if (kind === 'profile') {
    return (
      <View style={[styles.pad, { alignItems: 'center' }]}>
        <Skeleton width={88} height={88} radius={44} />
        <Skeleton width="50%" height={22} style={{ marginTop: 12 }} />
        <Skeleton height={160} radius={radius.lg} style={{ marginTop: 20, alignSelf: 'stretch' }} />
      </View>
    );
  }
  return (
    <View style={styles.pad}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Skeleton key={i} height={88} radius={radius.lg} style={{ marginBottom: 10 }} />
      ))}
    </View>
  );
}

export function LazyMount({
  children,
  fallback,
  kind = 'list',
}: {
  children: ReactNode;
  fallback?: ReactNode;
  kind?: SkeletonKind;
}) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const handle = requestIdleCallback(() => setReady(true));
    return () => cancelIdleCallback(handle);
  }, []);
  if (!ready) return <>{fallback ?? <PageSkeleton kind={kind} />}</>;
  return (
    <Animated.View entering={FadeIn.duration(240)} style={{ flex: 1 }}>
      {children}
    </Animated.View>
  );
}

export function lazyPage<T extends ComponentType<any>>(
  loader: () => Promise<{ default: T }>,
  kind: SkeletonKind = 'list'
) {
  const Comp = lazy(loader);
  return function LazyRoute(props: ComponentProps<T>) {
    return (
      <Suspense fallback={<PageSkeleton kind={kind} />}>
        <Comp {...props} />
      </Suspense>
    );
  };
}

const styles = StyleSheet.create({
  pad: { flex: 1, padding: 16, backgroundColor: colors.background },
  row: { flexDirection: 'row', gap: 10, marginTop: 16 },
});
