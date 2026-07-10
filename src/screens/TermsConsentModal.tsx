import React, { useRef, useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, NativeScrollEvent, NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FullScreenModal } from '../components/FullScreenModal';
import { Ionicons } from '@expo/vector-icons';

import { useProfileStore } from '../stores/profileStore';
import { Colors } from '../constants/colors';
import { FontSize, FontWeight, Spacing, BorderRadius } from '../constants/layout';

const TERMS_VERSION = '1.1';
const EFFECTIVE_DATE = 'June 2026';

const SECTIONS = [
  {
    title: '⚠️  IMPORTANT — READ BEFORE USING',
    body: `THIS APP INVOLVES VIGOROUS PHYSICAL EXERCISE. SQUASH COURT MOVEMENT PLACES SIGNIFICANT DEMANDS ON YOUR CARDIOVASCULAR SYSTEM, JOINTS, MUSCLES, AND CONNECTIVE TISSUE.\n\nDO NOT USE THIS APP IF YOU HAVE ANY KNOWN HEART CONDITION, UNCONTROLLED HIGH BLOOD PRESSURE, RECENT SURGERY OR INJURY, JOINT OR MUSCULOSKELETAL CONDITION, OR ANY HEALTH CONDITION THAT A DOCTOR HAS ADVISED COULD BE WORSENED BY INTENSE PHYSICAL ACTIVITY.\n\nIF YOU ARE UNSURE WHETHER YOU ARE PHYSICALLY READY FOR THIS TYPE OF TRAINING, CONSULT A QUALIFIED MEDICAL PROFESSIONAL BEFORE USING THE APP.\n\nBy continuing past this screen you confirm that you have read this warning and voluntarily choose to proceed.`,
  },
  {
    title: '1. Acceptance of Terms',
    body: `By downloading, installing, or using Squash GhostingX ("the App"), you agree to be legally bound by these Terms and Conditions ("Terms"). If you do not agree, you must not use the App.\n\nThese Terms constitute a legally binding agreement between you and the developer of Squash GhostingX. Use of the App confirms your full and unconditional acceptance of every provision below.`,
  },
  {
    title: '2. Assumption of Risk — Physical Injury',
    body: `YOU VOLUNTARILY ASSUME ALL RISKS — KNOWN AND UNKNOWN — OF PHYSICAL INJURY ARISING FROM USING THIS APP.\n\nSquash training involves explosive lateral movement, rapid changes of direction, sudden stopping, reaching, lunging, and sustained cardiovascular effort. These movements carry the inherent risk of, among other things:\n\n• Muscle tears, strains, and sprains\n• Ligament and tendon damage (including ACL, Achilles, and rotator cuff injuries)\n• Stress fractures and bone injuries\n• Joint injuries including knee, ankle, hip, shoulder, and elbow\n• Cardiovascular events including cardiac arrest\n• Heat stroke or dehydration\n• Slipping, falling, or collision on court\n• Death\n\nYOU EXPRESSLY WAIVE ANY CLAIM AGAINST THE DEVELOPER FOR ANY SUCH INJURY OR HARM, WHETHER CAUSED BY THE APP'S INSTRUCTIONS, THE PACE OR INTENSITY OF DRILLS, VOICE COMMANDS, OR ANY OTHER ASPECT OF THE APP'S FUNCTIONALITY.\n\nIf at any time during training you experience pain, dizziness, shortness of breath, chest tightness, nausea, or any unusual discomfort, STOP IMMEDIATELY and seek medical attention.`,
  },
  {
    title: '3. No Medical Advice',
    body: `The App does not provide medical advice, diagnosis, or treatment of any kind. All content — including drill instructions, timing, intensity levels, voice cues, pace settings, and training recommendations — is provided for general fitness guidance only and is expressly NOT a substitute for professional medical advice, diagnosis, or treatment.\n\nYou are solely and entirely responsible for determining whether any exercise, drill, intensity level, or training programme within this App is appropriate for your current physical condition, fitness level, age, and health status. When in doubt, consult a doctor.`,
  },
  {
    title: '4. Limitation of Liability',
    body: `TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, THE DEVELOPER, ITS AFFILIATES, OFFICERS, EMPLOYEES, AGENTS, AND CONTRIBUTORS ("THE DEVELOPER PARTIES") SHALL NOT BE LIABLE FOR ANY CLAIM, DAMAGE, OR LOSS OF ANY NATURE WHATSOEVER ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF OR INABILITY TO USE THE APP, INCLUDING BUT NOT LIMITED TO:\n\n(a) PERSONAL INJURY, ILLNESS, DISABILITY, OR DEATH;\n(b) PROPERTY DAMAGE;\n(c) ECONOMIC LOSS, LOSS OF INCOME, OR CONSEQUENTIAL DAMAGES;\n(d) PSYCHOLOGICAL OR EMOTIONAL HARM;\n(e) DATA LOSS OR CORRUPTION.\n\nTHIS LIMITATION APPLIES WHETHER THE CLAIM IS BASED IN CONTRACT, TORT (INCLUDING NEGLIGENCE), STRICT LIABILITY, STATUTE, OR ANY OTHER LEGAL THEORY, AND WHETHER OR NOT THE DEVELOPER PARTIES HAD BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.\n\nTHE DEVELOPER EXPRESSLY DISCLAIMS ALL LIABILITY FOR ANY INJURY OR ACCIDENT OCCURRING DURING, BEFORE, OR AFTER A TRAINING SESSION GUIDED, PROMPTED, OR INITIATED BY THIS APP, REGARDLESS OF WHERE THE TRAINING TAKES PLACE.\n\nYOUR USE OF THIS APP IS ENTIRELY AT YOUR OWN RISK. YOUR SOLE REMEDY FOR ANY DISSATISFACTION IS TO STOP USING THE APP.`,
  },
  {
    title: '5. Release of Claims',
    body: `BY USING THIS APP, YOU IRREVOCABLY RELEASE, WAIVE, AND FOREVER DISCHARGE THE DEVELOPER PARTIES FROM ANY AND ALL CLAIMS, DEMANDS, ACTIONS, CAUSES OF ACTION, SUITS, DAMAGES, LOSSES, COSTS, AND LIABILITIES OF EVERY KIND AND NATURE — WHETHER KNOWN OR UNKNOWN, FORESEEN OR UNFORESEEN — ARISING OUT OF OR RELATED TO YOUR USE OF THE APP OR ANY PHYSICAL ACTIVITY UNDERTAKEN IN CONNECTION WITH IT.\n\nYOU ACKNOWLEDGE THAT THIS RELEASE COVERS CLAIMS ARISING FROM THE NEGLIGENCE OF THE DEVELOPER PARTIES, AND THAT YOU HAVE HAD THE OPPORTUNITY TO REVIEW THIS RELEASE WITH LEGAL COUNSEL IF YOU WISHED TO DO SO.`,
  },
  {
    title: '6. Indemnification',
    body: `You agree to defend, indemnify, and hold harmless the Developer Parties from and against any and all claims, liabilities, damages, losses, costs, and expenses (including reasonable legal fees) arising out of or in any way connected with: (a) your use of or access to the App; (b) your violation of these Terms; (c) any physical injury, accident, illness, or death sustained by you or any third party during or as a result of physical activities facilitated, prompted, or guided by the App; (d) any misrepresentation you make regarding your fitness or health status.`,
  },
  {
    title: '7. Fitness Eligibility & Declarations',
    body: `By using the App you represent, warrant, and declare that:\n\n• You are at least 13 years of age. If under 18, a parent or legal guardian has reviewed and consented to these Terms on your behalf.\n• You are in adequate physical condition to safely participate in the vigorous exercise activities described and guided by this App.\n• You have no medical condition, recent surgery, injury, or physical limitation that would make intensive squash movement training unsafe without explicit medical clearance.\n• You have either obtained that medical clearance or you independently and freely accept all associated health risks.\n• You will train in a safe environment, wearing appropriate footwear, on a suitable court surface.\n• You will not use the App while impaired by alcohol, recreational drugs, prescription medication that affects coordination or consciousness, or any other substance.\n• You will stop training immediately if you experience pain, dizziness, difficulty breathing, chest pain, or any warning sign of injury or medical emergency.`,
  },
  {
    title: '8. No Warranties',
    body: `THE APP IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, ACCURACY, RELIABILITY, OR NON-INFRINGEMENT.\n\nThe developer does not warrant that drill instructions, movement timing, voice cues, or intensity calculations are suitable for any particular user, fitness level, or health condition. All training guidance is approximate and generalised.`,
  },
  {
    title: '9. Privacy & Data',
    body: `Squash GhostingX stores all data — including your profile, session history, and settings — locally on your device only. No personal data is collected, transmitted, or shared with any third party. The App does not require an internet connection to function.\n\nIf you create an account, credentials are stored securely on-device using your device's native secure storage. The developer has no access to your account or personal data.`,
  },
  {
    title: '10. Intellectual Property',
    body: `All content within the App — including training algorithms, ghosting patterns, drill designs, audio cues, graphics, and the GhostingEngine technology — is the intellectual property of the developer and is protected by applicable copyright and intellectual property laws. You may not copy, modify, distribute, sublicense, or reverse-engineer any part of the App.`,
  },
  {
    title: '11. Changes to Terms',
    body: `The developer reserves the right to update these Terms at any time. When material changes are made, users will be required to review and re-accept the updated Terms before continuing to use the App. The version number and effective date at the top of this document indicate when the Terms were last updated.`,
  },
  {
    title: '12. Governing Law',
    body: `These Terms shall be governed by and construed in accordance with applicable law. Any dispute, controversy, or claim arising out of or relating to these Terms, or the breach, termination, or invalidity thereof, shall be resolved exclusively through binding arbitration as set out in Section 13 below.`,
  },
  {
    title: '13. Binding Arbitration & Class Action Waiver',
    body: `ARBITRATION: ANY DISPUTE, CLAIM, OR CONTROVERSY ARISING OUT OF OR RELATING TO THESE TERMS OR YOUR USE OF THE APP SHALL BE RESOLVED EXCLUSIVELY THROUGH FINAL AND BINDING INDIVIDUAL ARBITRATION. YOU AND THE DEVELOPER EACH EXPRESSLY WAIVE THE RIGHT TO A JURY TRIAL AND THE RIGHT TO LITIGATE ANY SUCH CLAIM IN COURT.\n\nCLASS ACTION WAIVER: YOU AND THE DEVELOPER AGREE THAT EACH MAY ONLY BRING CLAIMS AGAINST THE OTHER IN AN INDIVIDUAL CAPACITY. YOU MAY NOT BRING ANY CLAIM AS A PLAINTIFF OR CLASS MEMBER IN ANY CLASS, CONSOLIDATED, REPRESENTATIVE, PRIVATE ATTORNEY-GENERAL, OR MULTI-PLAINTIFF ACTION OR PROCEEDING. THE ARBITRATOR HAS NO POWER TO CONSOLIDATE MORE THAN ONE PERSON'S CLAIMS.\n\nArbitration shall be conducted by a recognised arbitration provider under its applicable rules. The arbitrator's decision shall be final and binding and may be entered as a judgment in any court of competent jurisdiction. Where applicable law prohibits waiver of jury trial or class actions, the broadest waiver permitted by law shall apply.`,
  },
  {
    title: '14. Maximum Damages Cap',
    body: `IN THE EVENT THAT ANY COURT, ARBITRATOR, OR OTHER TRIBUNAL DETERMINES THAT THE DEVELOPER IS LIABLE TO YOU DESPITE THE LIMITATIONS SET OUT IN THESE TERMS, THE DEVELOPER'S TOTAL AGGREGATE LIABILITY TO YOU FOR ALL CLAIMS SHALL NOT EXCEED THE TOTAL AMOUNT YOU PAID TO OBTAIN THE APP IN THE TWELVE (12) MONTHS IMMEDIATELY PRECEDING THE CLAIM.\n\nSINCE THE APP IS PROVIDED FREE OF CHARGE, THIS MEANS THE DEVELOPER'S MAXIMUM TOTAL LIABILITY IS ZERO DOLLARS ($0.00) / ZERO POUNDS (£0.00) / ZERO OF ANY APPLICABLE CURRENCY. THIS CAP APPLIES TO ALL CLAIMS IN THE AGGREGATE, NOT PER INCIDENT.`,
  },
  {
    title: '15. Equipment, Venue & Third-Party Factors',
    body: `The developer is not responsible for, and expressly disclaims all liability arising from:\n\n• The condition, safety, or suitability of any squash court, court surface, flooring, walls, or ceiling\n• The condition or suitability of any racket, ball, protective eyewear, footwear, or other equipment\n• Lighting conditions, temperature, humidity, or other environmental factors at any training venue\n• Actions or omissions of any venue operator, coach, trainer, or other third party\n• Collision with other players, spectators, court fixtures, or any object on or near the court\n\nYou are solely responsible for inspecting your training environment and equipment before use and for training only in conditions that are safe and appropriate.`,
  },
  {
    title: '16. General Provisions',
    body: `Severability: If any provision of these Terms is found by a court or arbitrator to be invalid, illegal, or unenforceable, that provision shall be modified to the minimum extent necessary to make it enforceable. All remaining provisions shall continue in full force and effect. The invalidity of one provision shall not affect the validity of any other.\n\nEntire Agreement: These Terms constitute the entire agreement between you and the developer regarding your use of the App and supersede all prior negotiations, representations, warranties, and understandings of any kind.\n\nNo Waiver: The developer's failure to enforce any right or provision of these Terms on any occasion shall not constitute a waiver of that right or provision on any future occasion. No waiver shall be effective unless made in writing by the developer.\n\nForce Majeure: The developer shall not be liable for any failure, delay, or degradation in performance of the App resulting from any cause beyond its reasonable control, including acts of God, government actions, natural disasters, pandemics, power failures, or telecommunications outages.\n\nAssignment: The developer may assign its rights and obligations under these Terms to any affiliate, successor, or acquirer. You may not assign your rights under these Terms without the developer's prior written consent.\n\nNo Third-Party Beneficiaries: These Terms are for the sole and exclusive benefit of you and the developer. Nothing in these Terms shall create or confer any right or remedy upon any third party.\n\nSurvival: Sections 3 (Assumption of Risk), 4 (Limitation of Liability), 5 (Release of Claims), 6 (Indemnification), 13 (Arbitration), 14 (Damages Cap), and this Section 16 shall survive any termination or expiry of these Terms.`,
  },
];

const PRIVACY_SECTION = SECTIONS.find((s) => s.title.startsWith('9.'))!;

export default function TermsConsentModal({
  viewOnly,
  privacyOnly,
  onClose,
}: {
  viewOnly?: boolean;
  privacyOnly?: boolean;
  onClose?: () => void;
} = {}) {
  const hasAcceptedTerms = useProfileStore((s) => s.hasAcceptedTerms);
  const acceptTerms      = useProfileStore((s) => s.acceptTerms);

  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  // Reset scroll state each time the modal becomes visible (e.g. after account deletion).
  useEffect(() => {
    if (!hasAcceptedTerms && !viewOnly && !privacyOnly) {
      setScrolledToBottom(false);
    }
  }, [hasAcceptedTerms, viewOnly, privacyOnly]);

  function handleScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    // Only unlock if content is tall enough to actually require scrolling (>120px overflow).
    const requiresScroll = contentSize.height > layoutMeasurement.height + 120;
    const isBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 40;
    if (!requiresScroll || isBottom) setScrolledToBottom(true);
  }

  // Privacy-only view: a standalone modal showing only the Privacy & Data section.
  if (privacyOnly) {
    return (
      <FullScreenModal visible animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
        <SafeAreaView style={s.safe}>
          <View style={s.header}>
            <View style={s.logoRow}>
              <Ionicons name="lock-closed" size={24} color={Colors.brand} />
              <Text style={s.appName}>Squash GhostingX</Text>
            </View>
            <Text style={s.title}>Privacy Policy</Text>
            <Text style={s.subtitle}>How your data is stored and protected</Text>
            <Text style={s.version}>Effective {EFFECTIVE_DATE}</Text>
          </View>
          <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator>
            <View style={s.section}>
              <Text style={s.sectionTitle}>{PRIVACY_SECTION.title}</Text>
              <Text style={s.sectionBody}>{PRIVACY_SECTION.body}</Text>
            </View>
            <View style={[s.section, { marginTop: Spacing.sm }]}>
              <Text style={s.sectionTitle}>Data Stored On-Device</Text>
              <Text style={s.sectionBody}>
                {'• Session history (date, duration, reps, difficulty)\n• Movement recordings (anonymised position sequences)\n• Personal bests\n• Profile name, date of birth, and gender (encrypted via device Keychain/Keystore)\n• App settings and preferences\n\nNone of this data ever leaves your device. Deleting the app removes all data permanently.'}
              </Text>
            </View>
          </ScrollView>
          <View style={s.footer}>
            <TouchableOpacity style={s.agreeBtn} onPress={onClose} activeOpacity={0.85}>
              <Ionicons name="close-circle-outline" size={18} color={Colors.textPrimary} />
              <Text style={s.agreeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </FullScreenModal>
    );
  }

  // Always keep this component mounted — control visibility via the `visible` prop only.
  // Returning null here would unmount the Modal, causing it to silently fail to re-appear
  // after hasAcceptedTerms goes false→true→false (e.g. account deletion flow).
  const isVisible = viewOnly ? true : !hasAcceptedTerms;

  return (
    <FullScreenModal visible={isVisible} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => {}}>
      <SafeAreaView style={s.safe}>

        <View style={s.header}>
          <View style={s.logoRow}>
            <Ionicons name="shield-checkmark" size={24} color={Colors.brand} />
            <Text style={s.appName}>Squash GhostingX</Text>
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
            <Ionicons name="warning" size={20} color="#E8A838" />
            <Text style={s.warningText}>
              {'This App involves vigorous physical exercise. Read all sections carefully — especially Section 2 (Assumption of Risk) and Sections 4–5 (Limitation of Liability and Release of Claims). You cannot make a legal claim for injury after accepting these Terms.'}
            </Text>
          </View>

          {SECTIONS.map((sec) => (
            <View key={sec.title} style={s.section}>
              <Text style={s.sectionTitle}>{sec.title}</Text>
              <Text style={s.sectionBody}>{sec.body}</Text>
            </View>
          ))}

          <View style={s.checkboxArea}>
            <Ionicons name="checkmark-circle" size={18} color={Colors.brand} />
            <Text style={s.checkboxText}>
              {'By tapping "I Agree & Continue" below I confirm that:\n\n• I have read and fully understood all Terms above\n• I am physically fit and medically cleared (or independently accept all health risks) for vigorous squash training\n• I voluntarily assume ALL risks of physical injury, including serious injury or death\n• I irrevocably waive any right to make a legal claim against the developer for any injury, illness, or loss arising from my use of this App\n• I am at least 13 years of age, or have parental/guardian consent'}
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
                  {scrolledToBottom ? 'I Agree & Continue' : 'Scroll to Bottom First'}
                </Text>
              </TouchableOpacity>
              <Text style={s.declineNote}>
                You must accept these Terms to use Squash GhostingX. If you do not agree, please uninstall the App.
              </Text>
            </>
          )}
        </View>

      </SafeAreaView>
    </FullScreenModal>
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
