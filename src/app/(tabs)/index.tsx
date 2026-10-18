import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Colors, Radii, Spacing } from '@/constants/theme';
import { getBook, getEntries, getEntry, getVersions, type Book, type BookVersion } from '@/data/book';
import { getReadingProgress } from '@/data/reading-progress';
import { useTheme } from '@/hooks/use-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function LibraryScreen() {
  const db = useSQLiteContext();
  const theme = useTheme();
  const scheme = useColorScheme();
  const palette = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const [book, setBook] = useState<Book | null>(null);
  const [versions, setVersions] = useState<BookVersion[]>([]);
  const [resumeTarget, setResumeTarget] = useState<{ versionCode: string; entryId: number; versionName: string; title: string } | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadLibrary() {
      try {
        const [loadedBook, loadedVersions] = await Promise.all([getBook(db), getVersions(db)]);
        if (!active) return;
        setBook(loadedBook);
        setVersions(loadedVersions);
        const saved = await getReadingProgress();
        if (!saved || !active) return;
        const savedVersion = loadedVersions.find((item) => item.version_code === saved.editionKey);
        if (!savedVersion) return;
        const savedEntry = await getEntry(db, saved.editionKey, saved.entryId);
        if (active && savedEntry) setResumeTarget({ versionCode: saved.editionKey, entryId: saved.entryId, versionName: savedVersion.version_name, title: savedEntry.title });
      } catch {
        if (active) setError(true);
      }
    }
    void loadLibrary();
    return () => { active = false; };
  }, [db]);

  const continueReading = async () => {
    if (resumeTarget) {
      router.push({ pathname: '/reader/[version]/[entryId]', params: { version: resumeTarget.versionCode, entryId: String(resumeTarget.entryId) } });
      return;
    }
    const firstVersion = versions.find((item) => item.version_code === 'english') ?? versions[0];
    if (!firstVersion) return;
    const firstEntry = (await getEntries(db, firstVersion.version_code))[0];
    if (firstEntry) router.push({ pathname: '/reader/[version]/[entryId]', params: { version: firstVersion.version_code, entryId: String(firstEntry.entry_id) } });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topline}>
          <View>
            <ThemedText type="small" themeColor="textSecondary">YOUR READING LIBRARY</ThemedText>
            <ThemedText style={styles.greeting}>Assalamu alaikum</ThemedText>
          </View>
          <View style={[styles.profile, { backgroundColor: palette.surfaceRaised }]}>
            <ThemedText style={{ color: palette.primary, fontWeight: '700' }}>ا</ThemedText>
          </View>
        </View>

        <View style={[styles.featureCard, { backgroundColor: palette.surfaceRaised, borderColor: palette.border }]}>
          <View style={styles.bookMark}><ThemedText style={[styles.bookMarkText, { color: palette.primary }]}>BOOK OF THE DAY</ThemedText></View>
          <ThemedText style={styles.bookTitle}>{book?.title ?? 'Addawlatul Makkiyyah'}</ThemedText>
          <ThemedText themeColor="textSecondary">{book?.author ?? 'Imam Ahmad Raza Khan'}</ThemedText>
          <View style={styles.bookMeta}>
            <ThemedText type="small" themeColor="textSecondary">2 language editions</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">·</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">Read at your pace</ThemedText>
          </View>
          <Pressable accessibilityRole="button" disabled={versions.length === 0} onPress={() => void continueReading()} style={({ pressed }) => [styles.continueButton, { backgroundColor: palette.primary }, pressed && styles.pressed, versions.length === 0 && styles.disabled]}>
            <ThemedText style={[styles.continueButtonText, { color: palette.onPrimary }]}>{resumeTarget ? 'Continue reading' : 'Start reading'}</ThemedText>
            <ThemedText style={[styles.continueArrow, { color: palette.onPrimary }]}>›</ThemedText>
          </Pressable>
          <View style={[styles.ornament, { borderColor: palette.border }]}><ThemedText style={[styles.ornamentText, { color: palette.primary }]}>۞</ThemedText></View>
        </View>
        {resumeTarget && <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>Last read · {resumeTarget.versionName} · {resumeTarget.title}</ThemedText>}

        <View style={styles.sectionHeading}>
          <View><ThemedText type="subtitle" style={styles.sectionTitle}>Choose an edition</ThemedText><ThemedText type="small" themeColor="textSecondary">Continue with the text that feels right.</ThemedText></View>
        </View>

        {error ? <ThemedText themeColor="error">The book could not be opened. Please restart the app.</ThemedText> : versions.length === 0 ? (
          <ThemedText themeColor="textSecondary">Preparing your library…</ThemedText>
        ) : versions.map((version) => {
          const roman = version.version_code === 'roman-urdu';
          return (
            <Pressable
              accessibilityRole="button"
              key={version.version_id}
              onPress={() => router.push({ pathname: '/contents/[version]', params: { version: version.version_code } })}
              style={({ pressed }) => [styles.editionCard, { backgroundColor: palette.surface, borderColor: palette.border }, pressed && styles.pressed]}>
              <View style={[styles.editionIcon, { backgroundColor: palette.surfaceRaised }]}><ThemedText style={[styles.editionIconText, { color: palette.primary }]}>{roman ? 'ع' : 'En'}</ThemedText></View>
              <View style={styles.editionInfo}>
                <View style={styles.editionTitleRow}><ThemedText style={styles.editionTitle}>{version.version_name}</ThemedText></View>
                <ThemedText type="small" themeColor="textSecondary">{roman ? 'Original Roman Urdu text' : 'English translation'} · {version.entry_count} sections</ThemedText>
              </View>
              <ThemedText style={[styles.arrow, { color: palette.primary }]}>›</ThemedText>
            </Pressable>
          );
        })}

        <View style={[styles.note, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <ThemedText style={[styles.noteIcon, { color: palette.primary }]}>✦</ThemedText>
          <View style={styles.noteCopy}><ThemedText style={styles.noteTitle}>A little about this book</ThemedText><ThemedText type="small" themeColor="textSecondary">Explore the writings of Imam Ahmad Raza Khan with a calm, focused reading experience.</ThemedText></View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: Spacing.four, paddingTop: Spacing.three, paddingBottom: Spacing.seven, gap: Spacing.three },
  topline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.one },
  greeting: { fontSize: 26, lineHeight: 34, fontWeight: '700', marginTop: Spacing.half },
  profile: { width: 42, height: 42, borderRadius: Radii.pill, justifyContent: 'center', alignItems: 'center' },
  featureCard: { minHeight: 232, borderRadius: Radii.large, borderWidth: 1, overflow: 'hidden', padding: Spacing.four, justifyContent: 'center', gap: Spacing.one },
  bookMark: { marginBottom: Spacing.two },
  bookMarkText: { fontSize: 11, letterSpacing: 1.4, fontWeight: '700' },
  bookTitle: { fontSize: 30, lineHeight: 38, fontWeight: '700', maxWidth: '80%' },
  bookMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginTop: Spacing.one },
  continueButton: { minHeight: 44, maxWidth: '72%', borderRadius: Radii.pill, paddingHorizontal: Spacing.three, marginTop: Spacing.two, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.three },
  continueButtonText: { fontSize: 14, fontWeight: '700' },
  continueArrow: { fontSize: 22, lineHeight: 24 },
  ornament: { position: 'absolute', right: 24, top: 44, width: 108, height: 132, borderRadius: 60, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  ornamentText: { fontSize: 64, opacity: 0.55 },
  sectionHeading: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: Spacing.two },
  sectionTitle: { fontSize: 21, lineHeight: 28, fontWeight: '700' },
  editionCard: { minHeight: 84, borderRadius: Radii.medium, borderWidth: 1, padding: Spacing.three, flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  editionIcon: { width: 48, height: 48, borderRadius: Radii.small, justifyContent: 'center', alignItems: 'center' },
  editionIconText: { fontSize: 20, fontWeight: '700' },
  editionInfo: { flex: 1, gap: Spacing.one },
  editionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  editionTitle: { fontSize: 16, fontWeight: '700', flexShrink: 1 },
  arrow: { fontSize: 30, lineHeight: 32 },
  note: { flexDirection: 'row', gap: Spacing.three, padding: Spacing.three, borderWidth: 1, borderRadius: Radii.medium, marginTop: Spacing.one },
  noteIcon: { fontSize: 21 },
  noteCopy: { flex: 1, gap: Spacing.one },
  noteTitle: { fontWeight: '700' },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.55 },
});
