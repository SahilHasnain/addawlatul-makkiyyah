import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Radii, Spacing } from '@/constants/theme';
import { getEntries, getVersions, type BookEntry, type BookVersion } from '@/data/book';
import { useTheme } from '@/hooks/use-theme';

export default function ContentsScreen() {
  const { version } = useLocalSearchParams<{ version: string }>();
  const db = useSQLiteContext();
  const theme = useTheme();
  const [edition, setEdition] = useState<BookVersion | null>(null);
  const [entries, setEntries] = useState<BookEntry[]>([]);

  useEffect(() => {
    let active = true;
    Promise.all([getVersions(db), getEntries(db, version ?? '')]).then(([allVersions, loadedEntries]) => {
      if (!active) return;
      setEdition(allVersions.find((item) => item.version_code === version) ?? null);
      setEntries(loadedEntries);
    }).catch(() => active && setEntries([]));
    return () => { active = false; };
  }, [db, version]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="small" themeColor="textSecondary">ADDAWLATUL MAKKIYYAH</ThemedText>
        <ThemedText style={styles.title}>{edition?.version_name ?? 'Contents'}</ThemedText>
        <ThemedText themeColor="textSecondary">{entries.length} sections</ThemedText>
        {entries.map((entry) => {
          const preview = entry.content.replace(/^#+\s*/gm, '').replace(/[>*_`]/g, '').replace(/\s+/g, ' ').trim();
          return (
            <Pressable key={entry.entry_id} onPress={() => router.push({ pathname: '/reader/[version]/[entryId]', params: { version: version ?? '', entryId: String(entry.entry_id) } })} style={({ pressed }) => [styles.row, { backgroundColor: theme.surface, borderColor: theme.border }, pressed && styles.pressed]}>
              <View style={[styles.number, { backgroundColor: theme.surfaceRaised }]}><ThemedText style={[styles.numberText, { color: theme.primary }]}>{String(entry.sequence_no).padStart(2, '0')}</ThemedText></View>
              <View style={styles.copy}><ThemedText type="small" themeColor="textSecondary">SECTION {entry.sequence_no}</ThemedText><ThemedText style={styles.rowTitle} numberOfLines={2}>{entry.title}</ThemedText><ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>{preview}</ThemedText></View>
              <ThemedText style={[styles.arrow, { color: theme.primary }]}>›</ThemedText>
            </Pressable>
          );
        })}
        {entries.length === 0 && <ThemedText themeColor="textSecondary">Loading the table of contents…</ThemedText>}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: Spacing.four, paddingBottom: Spacing.seven, gap: Spacing.three },
  title: { fontSize: 30, lineHeight: 38, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, padding: Spacing.three, borderRadius: Radii.medium, borderWidth: 1 },
  number: { width: 42, height: 42, borderRadius: Radii.small, alignItems: 'center', justifyContent: 'center' },
  numberText: { fontSize: 13, fontWeight: '700' },
  copy: { flex: 1, gap: Spacing.one },
  rowTitle: { fontSize: 16, lineHeight: 22, fontWeight: '700' },
  arrow: { fontSize: 28, lineHeight: 30 },
  pressed: { opacity: 0.72 },
});
