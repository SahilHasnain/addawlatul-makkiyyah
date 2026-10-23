import { Link } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const sections = [
  {
    title: 'Information we collect',
    body: 'Addawlatul Makkiyyah does not ask you to create an account and does not collect personal information such as your name, email address, or phone number. The book text is included with the app. Your reading position (edition, section, and scroll position) is saved on your device so you can continue where you left off.',
  },
  {
    title: 'How information is used',
    body: 'The saved reading position is used only to provide the continue-reading feature. It is stored locally on your device and is not sent to us. Removing the app or clearing its app data removes this saved position.',
  },
  {
    title: 'Sharing and third parties',
    body: 'We do not sell, share, or transmit your reading progress or personal information. The app does not include advertising, analytics, or third-party account services.',
  },
  {
    title: 'Permissions and children',
    body: 'The app does not require access to contacts, location, camera, or microphone. Because the app does not collect personal information, it is suitable for general audiences, including children, with ordinary parental guidance.',
  },
  {
    title: 'Changes and contact',
    body: 'If the app’s data practices change, this policy will be updated here. For privacy questions, please contact the app publisher through the contact details on the app’s store listing.',
  },
];

export default function PrivacyPolicyScreen() {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Link href={'/' as never} style={[styles.back, { color: theme.primary }]}>‹  Back to library</Link>
        <View style={[styles.eyebrow, { backgroundColor: theme.surface }]}>
          <ThemedText type="small" themeColor="textSecondary">YOUR PRIVACY MATTERS</ThemedText>
        </View>
        <ThemedText style={styles.title}>Privacy policy</ThemedText>
        <ThemedText themeColor="textSecondary">Addawlatul Makkiyyah · Effective October 23, 2026</ThemedText>
        <ThemedText style={styles.intro}>Your reading stays yours. Addawlatul Makkiyyah is designed to work without an account or sending your reading activity to a server.</ThemedText>
        {sections.map((section, index) => (
          <View key={section.title} style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <ThemedText type="small" style={[styles.number, { color: theme.primary }]}>0{index + 1}</ThemedText>
            <ThemedText style={styles.heading}>{section.title}</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.body}>{section.body}</ThemedText>
          </View>
        ))}
        <ThemedText type="small" themeColor="textSecondary" style={styles.footer}>This policy applies to the Addawlatul Makkiyyah mobile app and its privacy-policy website.</ThemedText>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: Spacing.four, paddingBottom: Spacing.seven, gap: Spacing.three },
  back: { fontSize: 15, fontWeight: '600', marginBottom: Spacing.two },
  eyebrow: { alignSelf: 'flex-start', borderRadius: Radii.pill, paddingHorizontal: Spacing.three, paddingVertical: Spacing.one },
  title: { fontSize: 36, lineHeight: 44, fontWeight: '700', marginTop: Spacing.one },
  intro: { fontSize: 17, lineHeight: 26, marginVertical: Spacing.two },
  section: { borderRadius: Radii.large, borderWidth: 1, padding: Spacing.four, gap: Spacing.one },
  number: { fontWeight: '700', letterSpacing: 1 },
  heading: { fontSize: 19, fontWeight: '700' },
  body: { fontSize: 15, lineHeight: 23 },
  footer: { lineHeight: 20, marginTop: Spacing.two },
});
