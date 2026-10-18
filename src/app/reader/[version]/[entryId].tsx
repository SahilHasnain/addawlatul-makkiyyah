import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Fonts, Radii, Spacing } from '@/constants/theme';
import { getEntries, getEntry, type BookEntry } from '@/data/book';
import { getReadingProgress, queueReadingProgress, saveReadingProgress } from '@/data/reading-progress';
import { useTheme } from '@/hooks/use-theme';

function cleanInlineMarkdown(text: string) {
  return text.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').replace(/`(.*?)`/g, '$1').trim();
}

function ReaderParagraph({ text, size }: { text: string; size: number }) {
  const theme = useTheme();
  const isArabic = /[\u0600-\u06FF]/.test(text) && !/[A-Za-z]{3,}/.test(text);
  return <ThemedText style={[styles.paragraph, { color: theme.text, fontFamily: Fonts.serif, fontSize: size, lineHeight: size * 1.8, textAlign: isArabic ? 'right' : 'left', writingDirection: isArabic ? 'rtl' : 'ltr' }]}>{cleanInlineMarkdown(text)}</ThemedText>;
}

export default function ReaderScreen() {
  const { version, entryId } = useLocalSearchParams<{ version: string; entryId: string }>();
  const db = useSQLiteContext();
  const theme = useTheme();
  const [entry, setEntry] = useState<BookEntry | null>(null);
  const [entries, setEntries] = useState<BookEntry[]>([]);
  const [fontSize, setFontSize] = useState(18);
  const [readProgress, setReadProgress] = useState<{ entryId: number; value: number } | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const contentHeightRef = useRef(0);
  const viewportHeightRef = useRef(0);
  const restoreFractionRef = useRef<number | null>(null);

  useEffect(() => {
    let active = true;
    const id = Number(entryId);
    Promise.all([getEntry(db, version ?? '', id), getEntries(db, version ?? ''), getReadingProgress()]).then(([loadedEntry, loadedEntries, saved]) => {
      if (!active) return;
      const resumeFraction = saved?.editionKey === version && saved.entryId === id ? saved.scrollFraction : 0;
      contentHeightRef.current = 0;
      viewportHeightRef.current = 0;
      restoreFractionRef.current = resumeFraction;
      setReadProgress({ entryId: id, value: resumeFraction });
      void saveReadingProgress({ editionKey: version ?? '', entryId: id, scrollFraction: resumeFraction });
      setEntry(loadedEntry);
      setEntries(loadedEntries);
    }).catch(() => active && setEntry(null));
    return () => { active = false; };
  }, [db, entryId, version]);

  const index = entries.findIndex((item) => item.entry_id === entry?.entry_id);
  const previous = index > 0 ? entries[index - 1] : null;
  const next = index >= 0 ? entries[index + 1] : null;
  const openEntry = (item: BookEntry) => router.replace({ pathname: '/reader/[version]/[entryId]', params: { version: version ?? '', entryId: String(item.entry_id) } });
  const updateReadingProgress = (event: NativeSyntheticEvent<NativeScrollEvent>, persist = false) => {
    if (!entry) return;
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const maxOffset = contentSize.height - layoutMeasurement.height;
    const value = maxOffset <= 0 ? 1 : Math.min(1, Math.max(0, contentOffset.y / maxOffset));
    setReadProgress({ entryId: entry.entry_id, value });
    const progress = { editionKey: version ?? '', entryId: entry.entry_id, scrollFraction: value };
    if (persist) void saveReadingProgress(progress);
    else queueReadingProgress(progress);
  };
  const restoreScrollPosition = (currentEntryId: number) => {
    const fraction = restoreFractionRef.current;
    if (fraction === null || contentHeightRef.current <= 0 || viewportHeightRef.current <= 0) return;
    const maxOffset = Math.max(0, contentHeightRef.current - viewportHeightRef.current);
    scrollRef.current?.scrollTo({ y: maxOffset * fraction, animated: false });
    restoreFractionRef.current = null;
    setReadProgress({ entryId: currentEntryId, value: fraction });
  };
  const visibleProgress = readProgress && readProgress.entryId === entry?.entry_id ? readProgress.value : 0;
  const content = (entry?.content ?? '').split(/\r?\n/);
  const blocks: { kind: 'paragraph' | 'heading' | 'quote'; text: string; level?: number }[] = [];
  let paragraph: string[] = [];
  const flushParagraph = () => {
    const value = paragraph.join(' ').trim();
    if (value) blocks.push({ kind: 'paragraph', text: value });
    paragraph = [];
  };
  for (const rawLine of content) {
    const line = rawLine.trim();
    if (!line) { flushParagraph(); continue; }
    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) { flushParagraph(); blocks.push({ kind: 'heading', text: cleanInlineMarkdown(heading[2]), level: heading[1].length }); continue; }
    if (line.startsWith('>')) { flushParagraph(); blocks.push({ kind: 'quote', text: line.replace(/^>\s?/, '') }); continue; }
    paragraph.push(line);
  }
  flushParagraph();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <View style={styles.toolbar}>
        <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={[styles.toolbarButton, { backgroundColor: theme.surface }]}><ThemedText style={{ color: theme.primary, fontSize: 22 }}>‹</ThemedText></Pressable>
        <View style={styles.toolbarTitle}><ThemedText type="small" themeColor="textSecondary">{version === 'english' ? 'ENGLISH EDITION' : 'ROMAN URDU EDITION'}</ThemedText><ThemedText numberOfLines={1} style={styles.toolbarHeading}>{entry?.title ?? 'Reading'}</ThemedText></View>
        <View style={[styles.fontControls, { backgroundColor: theme.surface }]}><Pressable accessibilityLabel="Decrease text size" onPress={() => setFontSize((size) => Math.max(15, size - 1))} style={styles.fontButton}><ThemedText style={{ color: theme.textSecondary }}>A−</ThemedText></Pressable><Pressable accessibilityLabel="Increase text size" onPress={() => setFontSize((size) => Math.min(25, size + 1))} style={styles.fontButton}><ThemedText style={{ color: theme.primary }}>A+</ThemedText></Pressable></View>
      </View>
      {entry && <View style={[styles.progressTrack, { backgroundColor: theme.surfaceRaised }]} accessibilityLabel="Section reading progress" accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(visibleProgress * 100) }}><View style={[styles.progressFill, { backgroundColor: theme.primary, width: `${visibleProgress * 100}%` }]} /></View>}
      {entry ? <ScrollView
        key={entry.entry_id}
        ref={scrollRef}
        onLayout={(event) => { viewportHeightRef.current = event.nativeEvent.layout.height; restoreScrollPosition(entry.entry_id); }}
        onContentSizeChange={(_width, height) => { contentHeightRef.current = height; restoreScrollPosition(entry.entry_id); }}
        onScroll={(event) => updateReadingProgress(event)}
        onScrollEndDrag={(event) => updateReadingProgress(event, true)}
        onMomentumScrollEnd={(event) => updateReadingProgress(event, true)}
        scrollEventThrottle={80}
        contentContainerStyle={styles.article}>
        <View style={[styles.articleHeader, { borderBottomColor: theme.border }]}><ThemedText type="small" themeColor="textSecondary">SECTION {entry.sequence_no}</ThemedText><ThemedText style={[styles.articleTitle, { fontFamily: Fonts.serif }]}>{entry.title}</ThemedText></View>
        {blocks.map((block, blockIndex) => block.kind === 'heading' ? <ThemedText key={blockIndex} style={[styles.contentHeading, { color: theme.text, fontFamily: Fonts.serif, fontSize: block.level === 1 ? 24 : block.level === 2 ? 21 : 18 }]}>{block.text}</ThemedText> : block.kind === 'quote' ? <View key={blockIndex} style={[styles.quote, { borderLeftColor: theme.accent, backgroundColor: theme.surface }]}><ReaderParagraph text={block.text} size={fontSize} /></View> : <ReaderParagraph key={blockIndex} text={block.text} size={fontSize} />)}
        <View style={styles.navigation}>
          <Pressable disabled={!previous} onPress={() => previous && openEntry(previous)} style={[styles.navButton, { backgroundColor: theme.surface, borderColor: theme.border }, !previous && styles.disabled]}><ThemedText type="small" themeColor="textSecondary">PREVIOUS</ThemedText><ThemedText style={{ color: theme.text }} numberOfLines={1}>{previous?.title ?? 'Beginning'}</ThemedText></Pressable>
          <Pressable disabled={!next} onPress={() => next && openEntry(next)} style={[styles.navButton, styles.nextButton, { backgroundColor: theme.primary, borderColor: theme.primary }, !next && styles.disabled]}><ThemedText type="small" style={{ color: theme.onPrimary }}>NEXT</ThemedText><ThemedText style={{ color: theme.onPrimary, fontWeight: '700' }} numberOfLines={1}>{next?.title ?? 'End of edition'}</ThemedText></Pressable>
        </View>
      </ScrollView> : <View style={styles.loading}><ThemedText themeColor="textSecondary">Loading this passage…</ThemedText></View>}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  toolbar: { minHeight: 68, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  toolbarButton: { width: 42, height: 42, borderRadius: Radii.pill, alignItems: 'center', justifyContent: 'center' },
  toolbarTitle: { flex: 1, gap: Spacing.half },
  toolbarHeading: { fontSize: 15, fontWeight: '700' },
  fontControls: { flexDirection: 'row', borderRadius: Radii.pill, padding: Spacing.half },
  fontButton: { minWidth: 40, minHeight: 36, alignItems: 'center', justifyContent: 'center' },
  progressTrack: { height: 3, width: '100%', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: Radii.pill },
  article: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: Spacing.four, paddingTop: Spacing.three, paddingBottom: Spacing.seven },
  articleHeader: { paddingBottom: Spacing.four, marginBottom: Spacing.four, borderBottomWidth: 1, gap: Spacing.two },
  articleTitle: { fontSize: 28, lineHeight: 36, fontWeight: '700' },
  contentHeading: { fontWeight: '700', lineHeight: 30, marginTop: Spacing.four, marginBottom: Spacing.two },
  paragraph: { marginBottom: Spacing.three },
  quote: { borderLeftWidth: 3, borderRadius: Radii.small, padding: Spacing.three, marginBottom: Spacing.three },
  navigation: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.five },
  navButton: { flex: 1, minHeight: 64, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderWidth: 1, borderRadius: Radii.medium, justifyContent: 'center', gap: Spacing.one },
  nextButton: { alignItems: 'flex-end' },
  disabled: { opacity: 0.45 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
