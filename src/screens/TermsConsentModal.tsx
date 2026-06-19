import React, { useRef, useState } from 'react';
import {
  Modal, View, Text, ScrollView, TouchableOpacity,
  StyleSheet, NativeScrollEvent, NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useProfileStore } from '../stores/profileStore';
import { Colors } from '../constants/colors';
import { FontSize, FontWeight, Spacing, BorderRadius } from '../constants/layout';

const TERMS_VERSION = '1.0';
const EFFECTIVE_DATE = 'June 2025';

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    body: `By downloading, installing, or using SquashGhostingX ("the App"), you agree to be legally bound by these Terms and Conditions ("Terms"). If you do not agree, you must not use the App.\n\nThese Terms constitute a binding agreement between you and the developer of SquashGhostingX. Use of the App confirms your full and unconditional acceptance.`,
  },
  {
    title: '2. Physical Activity & Assumption of Risk',
    body: `THE APP PROVIDES PHYSICAL TRAINING GUIDANCE. PHYSICAL EXERCISE INVOLVES INHERENT RISKS INCLUDING, BUT NOT LIMITED TO, PHYSICAL INJURY, MUSCLE STRAIN, JOINT DAMAGE, CARDIOVASCULAR EVENTS, AND DEATH.\n\nYOU EXPRESSLY ACKNOWLEDGE AND ASSUME ALL RISKS — KNOWN AND UNKNOWN — ASSOCIATED WITH PARTICIPATION IN SQUASH TRAINING, COURT MOVEMENT, OR ANY PHYSICAL ACTIVITY GUIDED, SUGGESTED, OR FACILITATED BY THIS APP.\n\nBefore beginning any training program you should consult a qualified medical professional. If at any time during training you experience pain, dizziness, shortness of breath, or discomfort, you must stop immediately and seek medical attention.`,
  },
  {
    title: '3. No Medical Advice',
    body: `The App does not provide medical advice, diagnosis, or treatment. All content — including drill instructions, timing, voice cues, and training recommendations — is for general fitness guidance only and is not a substitute for professional medical advice.\n\nYou are solely responsible for determining whether any exercise, drill, or training programme is appropriate for your physical condition, fitness level, and health status.`,
  },
  {
    title: '4. Limitation of Liability',
    body: `TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW:\n\n(a) THE DEVELOPER, ITS AFFILIATES, OFFICERS, AGENTS, AND CONTRIBUTORS SHALL NOT BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, PUNITIVE, OR EXEMPLARY DAMAGES ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE APP, INCLUDING BUT NOT LIMITED TO PERSONAL INJURY, DEATH, PROPERTY DAMAGE, DATA LOSS, OR ECONOMIC LOSS.\n\n(b) THE DEVELOPER EXPRESSLY DISCLAIMS ALL LIABILITY FOR ANY INJURY OR ACCIDENT OCCURRING DURING TRAINING SESSIONS GUIDED BY THIS APP, WHETHER ON COURT, AT HOME, OR IN ANY OTHER LOCATION.\n\n(c) THE DEVELOPER IS NOT LIABLE FOR EQUIPMENT FAILURE, COURT CONDITIONS, UNSAFE TRAINING ENVIRONMENTS, OR ANY FACTORS OUTSIDE THE APP ITSELF.\n\nYOUR SOLE REMEDY FOR DISSATISFACTION WITH THE APP IS TO STOP USING IT.`,
  },
  {
    title: '5. Indemnification',
    body: `You agree to defend, indemnify, and hold harmless the developer and its affiliates from and against any claims, liabilities, damages, losses, costs, and expenses (including reasonable legal fees) arising out of or in any way connected with: (a) your use of the App; (b) your violation of these Terms; (c) any physical injury, accident, or harm sustained by you or any third party during or as a result of training activities facilitated by the App.`,
  },
  {
    title: '6. Fitness & Eligibility',
    body: `By using the App you represent and warrant that:\n\n• You are at least 13 years of age. If you are under 18, you have obtained parental or guardian consent.\n• You are physically capable of participating in the exercise activities the App describes.\n• You have no medical condition, injury, or physical limitation that would make such activities dangerous without prior medical clearance.\n• You will use appropriate safety equipment and train in a safe environment.\n• You will not use the App while impaired by alcohol, medication, or any other substance.`,
  },
  {
    title: '7. No Warranties',
    body: `THE APP IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, ACCURACY, OR NON-INFRINGEMENT.\n\nThe developer does not warrant that the App will be error-free, uninterrupted, or free of viruses or harmful components. Training times, voice cues, and interval calculations are approximations and may not be suitable for all users or all skill levels.`,
  },
  {
    title: '8. Privacy & Data',
    body: `SquashGhostingX stores all data — including your profile, session history, and settings — locally on your device. No personal data is collected, transmitted, or shared with any third party. The App does not require an internet connection to function.\n\nIf you create an account, your credentials are stored securely on-device using your device's secure storage. The developer has no access to your account or data.`,
  },
  {
    title: '9. Intellectual Property',
    body: `All content within the App, including but not limited to training algorithms, drill designs, audio cues, graphics, and the GhostingEngine technology, is the intellectual property of the developer and is protected by applicable copyright and intellectual property laws. You may not copy, modify, distribute, or reverse-engineer any part of the App.`,
  },
  {
    title: '10. Changes to Terms',
    body: `The developer reserves the right to update these Terms at any time. Continued use of the App after any changes constitutes acceptance of the revised Terms. The effective date at the top of this document indicates when the Terms were last updated.`,
  },
  {
    title: '11. Governing Law',
    body: `These Terms shall be governed by and construed in accordance with applicable law. Any disputes arising under these Terms shall be resolved through binding arbitration or in the courts of competent jurisdiction, as determined by the developer.`,
  },
];

export default function TermsConsentModal({ viewOnly, onClose }: { viewOnly?: boolean; onClose?: () => void } = {}) {
  const hasAcceptedTerms = useProfileStore((s) => s.hasAcceptedTerms);
  const acceptTerms      = useProfileStore((s) => s.acceptTerms);

  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  function handleScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    const isBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 40;
    if (isBottom) setScrolledToBottom(true);
  }

  if (!viewOnly && hasAcceptedTerms) return null;

  return (
    <Modal visible={viewOnly ? true : !hasAcceptedTerms} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={s.safe}>

        <View style={s.header}>
          <View style={s.logoRow}>
            <Ionicons name="shield-checkmark" size={24} color={Colors.brand} />
            <Text style={s.appName}>SquashGhostingX</Text>
          </View>
          <Text style={s.title}>Terms & Conditions</Text>
          <Text style={s.subtitle}>Please read and accept before continuing</Text>
          <Text style={s.version}>Version {TERMS_VERSION} · Effective {EFFECTIVE_DATE}</Text>
        </View>

        <View style={s.scrollHint}>
          <Ionicons name="arrow-down-circle-outline" size={14} color={Colors.textMuted} />
          <Text style={s.scrollHintText}>Scroll to read all terms before accepting</Text>
        </View>

        <ScrollView
          ref={scrollRef}
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          onScroll={handleScroll}
          scrollEventThrottle={100}
          showsVerticalScrollIndicator
        >
          <View style={s.warning}>
            <Ionicons name="warning" size={18} color="#E8A838" />
            <Text style={s.warningText}>
              This App involves physical activity. Read the full terms carefully, especially sections 2–5 regarding assumption of risk and liability.
            </Text>
          </View>

          {SECTIONS.map((sec) => (
            <View key={sec.title} style={s.section}>
              <Text style={s.sectionTitle}>{sec.title}</Text>
              <Text style={s.sectionBody}>{sec.body}</Text>
            </View>
          ))}

          <View style={s.checkboxArea}>
            <Ionicons name="checkmark-circle" size={16} color={Colors.brand} />
            <Text style={s.checkboxText}>
              By tapping "I Agree" below you confirm that you have read and understood these Terms, that you are physically fit to participate in the described activities, and that you accept full responsibility for any injury, accident, or loss arising from your use of this App.
            </Text>
          </View>
        </ScrollView>

        <View style={s.footer}>
          {viewOnly ? (
            <TouchableOpacity style={s.agreeBtn} onPress={onClose} activeOpacity={0.85}>
              <Ionicons name="close-circle-outline" size={18} color={Colors.textPrimary} />
              <Text style={s.agreeBtnText}>Close</Text>
            </TouchableOpacity>
          ) : (
            <>
              {!scrolledToBottom && (
                <Text style={s.scrollPrompt}>↓ Scroll down to read all terms</Text>
              )}
              <TouchableOpacity
                style={[s.agreeBtn, !scrolledToBottom && s.agreeBtnDisabled]}
                onPress={scrolledToBottom ? acceptTerms : () => {
                  scrollRef.current?.scrollToEnd({ animated: true });
                }}
                activeOpacity={0.85}
              >
                <Ionicons
                  name={scrolledToBottom ? 'checkmark-circle' : 'arrow-down-circle-outline'}
                  size={18}
                  color={Colors.textPrimary}
                />
                <Text style={s.agreeBtnText}>
                  {scrolledToBottom ? 'I Agree — Continue' : 'Scroll to Bottom First'}
                </Text>
              </TouchableOpacity>
              <Text style={s.declineNote}>
                You must accept these Terms to use SquashGhostingX. If you do not agree, please uninstall the App.
              </Text>
            </>
          )}
        </View>

      </SafeAreaView>
    </Modal>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },

  header: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.sm },
  appName: { fontSize: FontSize.body, fontWeight: FontWeight.bold, color: Colors.brand },
  title:   { fontSize: FontSize.sectionHeader, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  subtitle:{ fontSize: FontSize.label, color: Colors.textSecondary, marginTop: 2 },
  version: { fontSize: FontSize.caption, color: Colors.textMuted, marginTop: 4 },

  scrollHint: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: Spacing.base, paddingVertical: 6,
    backgroundColor: Colors.surfaceElevated,
  },
  scrollHintText: { fontSize: FontSize.caption, color: Colors.textMuted },

  scroll:        { flex: 1 },
  scrollContent: { padding: Spacing.base, gap: Spacing.md, paddingBottom: Spacing.xxl },

  warning: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    backgroundColor: 'rgba(232,168,56,0.12)',
    borderWidth: 1, borderColor: 'rgba(232,168,56,0.35)',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  warningText: { flex: 1, fontSize: FontSize.label, color: '#E8A838', lineHeight: 20 },

  section: { gap: 6 },
  sectionTitle: {
    fontSize: FontSize.label, fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  sectionBody: {
    fontSize: FontSize.caption, color: Colors.textSecondary, lineHeight: 20,
  },

  checkboxArea: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    backgroundColor: `${Colors.brand}12`,
    borderWidth: 1, borderColor: `${Colors.brand}40`,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginTop: Spacing.sm,
  },
  checkboxText: { flex: 1, fontSize: FontSize.caption, color: Colors.textSecondary, lineHeight: 20 },

  footer: {
    padding: Spacing.base,
    borderTopWidth: 1, borderTopColor: Colors.border,
    gap: Spacing.sm,
    backgroundColor: Colors.background,
  },
  scrollPrompt: {
    textAlign: 'center', fontSize: FontSize.caption, color: Colors.textMuted,
  },
  agreeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.brand,
    height: 52, borderRadius: BorderRadius.full,
  },
  agreeBtnDisabled: { backgroundColor: Colors.surfaceElevated },
  agreeBtnText: { fontSize: FontSize.body, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  declineNote: {
    textAlign: 'center', fontSize: FontSize.micro, color: Colors.textMuted, lineHeight: 16,
  },
});
