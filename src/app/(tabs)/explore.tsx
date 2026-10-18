import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Radii, Spacing } from '@/constants/theme';
import { getEntries, getVersions, type BookEntry, type BookVersion } from '@/data/book';
import { useTheme } from '@/hooks/use-theme';

export default function BrowseScreen() {
  const db = useSQLiteContext();
  const theme = useTheme();
  const [versions, setVersions] = useState<BookVersion[]>([]);
  const [selectedCode, setSelectedCode] = useState('english');
  const [entries, setEntries] = useState<BookEntry[]>([]);
  const [loadedCode, setLoadedCode] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    let active = true;
    getVersions(db).then((result) => {
      if (active) setVersions(result);
    }).catch(() => active && setVersions([]));
    return () => { active = false; };
  }, [db]);

  useEffect(() => {
    let active = true;
    getEntries(db, selectedCode).then((result) => {
      if (active) {
        setEntries(result);
        setLoadedCode(selectedCode);
      }
    }).catch(() => {
      if (active) {
        setEntries([]);
        setLoadedCode(selectedCode);
      }
    });
    return () => { active = false; };
  }, [db, selectedCode]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return entries;
    return entries.filter((entry) => entry.title.toLocaleLowerCase().includes(normalized) || entry.content.toLocaleLowerCase().includes(normalized));
  }, [entries, query]);
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        <ThemedText type="small" themeColor="textSecondary">THE BOOK</ThemedText>
        <ThemedText style={styles.title}>Browse contents</ThemedText>
        <ThemedText themeColor="textSecondary">Choose an edition, then open a section.</ThemedText>
        <View style={styles.switcher}>
          {versions.map((version) => {
            const selected = selectedCode === version.version_code;
            return <Pressable key={version.version_id} onPress={() => setSelectedCode(version.version_code)} style={[styles.switchOption, { backgroundColor: selected ? theme.primary : theme.surface, borderColor: selected ? theme.primary : theme.border }]}><ThemedText style={{ color: selected ? theme.onPrimary : theme.text, fontWeight: '700' }}>{version.version_name}</ThemedText></Pressable>;
          })}
        </View>
        <TextInput
          accessibilityLabel="Search this edition"
          onChangeText={setQuery}
          placeholder="Search titles and text"
          placeholderTextColor={theme.textSecondary}
          returnKeyType="search"
          style={[styles.search, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
          value={query}
        />
        <ThemedText style={styles.resultHeading}>{query.trim() ? `${filtered.length} results` : `${filtered.length} sections`}</ThemedText>
        {loadedCode !== selectedCode ? <ThemedText themeColor="textSecondary">Loading contents…</ThemedText> : filtered.length === 0 ? <View style={[styles.empty, { backgroundColor: theme.surface, borderColor: theme.border }]}><ThemedText style={styles.emptyTitle}>No matching passages</ThemedText><ThemedText type="small" themeColor="textSecondary">Try another search or select the other edition.</ThemedText></View> : filtered.map((entry) => {
          const preview = entry.content.replace(/^#+\s*/gm, '').replace(/[>*_`]/g, '').replace(/\s+/g, ' ').trim();
          const label = `SECTION ${entry.sequence_no}`;
          return (
            <Pressable key={entry.entry_id} onPress={() => router.push({ pathname: '/reader/[version]/[entryId]', params: { version: selectedCode, entryId: String(entry.entry_id) } })} style={({ pressed }) => [styles.entryCard, { backgroundColor: theme.surface, borderColor: theme.border }, pressed && styles.pressed]}>
              <View style={[styles.entryNumber, { backgroundColor: theme.surfaceRaised }]}><ThemedText style={[styles.entryNumberText, { color: theme.primary }]}>{String(entry.sequence_no).padStart(2, '0')}</ThemedText></View>
              <View style={styles.entryBody}><ThemedText type="small" themeColor="textSecondary">{label}</ThemedText><ThemedText style={styles.entryTitle} numberOfLines={2}>{entry.title}</ThemedText><ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>{preview}</ThemedText></View>
              <ThemedText style={[styles.entryArrow, { color: theme.primary }]}>›</ThemedText>
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: Spacing.four, paddingBottom: Spacing.seven, gap: Spacing.three },
  title: { fontSize: 30, lineHeight: 38, fontWeight: '700' },
  switcher: { flexDirection: 'row', padding: Spacing.one, borderRadius: Radii.medium, gap: Spacing.one },
  switchOption: { flex: 1, minHeight: 44, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderRadius: Radii.small, paddingHorizontal: Spacing.two },
  search: { minHeight: 50, borderWidth: 1, borderRadius: Radii.medium, paddingHorizontal: Spacing.three, fontSize: 16 },
  resultHeading: { fontSize: 16, fontWeight: '700', marginTop: Spacing.one },
  entryCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, padding: Spacing.three, borderWidth: 1, borderRadius: Radii.medium },
  entryNumber: { width: 42, height: 42, borderRadius: Radii.small, justifyContent: 'center', alignItems: 'center' },
  entryNumberText: { fontSize: 13, fontWeight: '700' },
  entryBody: { flex: 1, gap: Spacing.one },
  entryTitle: { fontSize: 16, lineHeight: 22, fontWeight: '700' },
  entryArrow: { fontSize: 28, lineHeight: 30 },
  empty: { padding: Spacing.four, borderWidth: 1, borderRadius: Radii.medium, gap: Spacing.two },
  emptyTitle: { fontWeight: '700' },
  pressed: { opacity: 0.72 },
});
