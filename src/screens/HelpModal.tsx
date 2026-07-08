import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal,
} from 'react-native';
import Svg, { Rect, Line, Circle, Text as SvgText, G, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '../constants/colors';
import { FontSize, FontWeight, Spacing, BorderRadius } from '../constants/layout';

// ─── Small reusable pieces ────────────────────────────────────────────────────

function Bullet({ text }: { text: string }) {
  return (
    <View style={s.bullet}>
      <View style={s.bulletDot} />
      <Text style={s.bulletText}>{text}</Text>
    </View>
  );
}

// ─── Glass Court Diagram ─────────────────────────────────────────────────────
const VB_W = 320;
const VB_H = 496;
const CL   = 20;   // court left x in SVG units
const CT   = 24;   // court top y in SVG units
const CW   = 280;  // court width in SVG units  (= real 6.4 m)
const CH   = 448;  // court height in SVG units (= real 9.75 m)
function sX(x: number) { return CL + ((x + 3.2) / 6.4) * CW; }
function sY(z: number) { return CT + (z / 9.75) * CH; }
const SHORT_Y   = sY(4.26);
const SERVICE_Y = sY(4.26 + 1.6);
const HALF_X    = sX(0);
type ZoneName = 'front' | 'mid' | 'back';
const ZC: Record<ZoneName, string> = { front: '#FF6B35', mid: '#0A84FF', back: '#34C759' };
type PosItem = { code: string; label: string; sx: number; sy: number; z: ZoneName };

const POS6: PosItem[] = [
  { code: 'FL',  label: 'Front Left',  sx: sX(-2.2), sy: sY(1.0), z: 'front' },
  { code: 'FR',  label: 'Front Right', sx: sX( 2.2), sy: sY(1.0), z: 'front' },
  { code: 'ML',  label: 'Mid Left',    sx: sX(-2.0), sy: sY(4.6), z: 'mid'   },
  { code: 'MR',  label: 'Mid Right',   sx: sX( 2.0), sy: sY(4.6), z: 'mid'   },
  { code: 'BL',  label: 'Back Left',   sx: sX(-2.2), sy: sY(8.5), z: 'back'  },
  { code: 'BR',  label: 'Back Right',  sx: sX( 2.2), sy: sY(8.5), z: 'back'  },
];

const POS10: PosItem[] = [
  { code: 'FL',  label: 'Front Left',  sx: sX(-2.2), sy: sY(1.0), z: 'front' },
  { code: 'FR',  label: 'Front Right', sx: sX( 2.2), sy: sY(1.0), z: 'front' },
  { code: 'FML', label: 'Front Mid L', sx: sX(-2.0), sy: sY(2.8), z: 'front' },
  { code: 'FMR', label: 'Front Mid R', sx: sX( 2.0), sy: sY(2.8), z: 'front' },
  { code: 'ML',  label: 'Mid Left',    sx: sX(-2.0), sy: sY(4.6), z: 'mid'   },
  { code: 'MR',  label: 'Mid Right',   sx: sX( 2.0), sy: sY(4.6), z: 'mid'   },
  { code: 'BML', label: 'Back Mid L',  sx: sX(-2.0), sy: sY(6.5), z: 'back'  },
  { code: 'BMR', label: 'Back Mid R',  sx: sX( 2.0), sy: sY(6.5), z: 'back'  },
  { code: 'BL',  label: 'Back Left',   sx: sX(-2.2), sy: sY(8.5), z: 'back'  },
  { code: 'BR',  label: 'Back Right',  sx: sX( 2.2), sy: sY(8.5), z: 'back'  },
];

function GlassCourtDiagram({ system }: { system: '6pt' | '10pt' }) {
  const positions = system === '10pt' ? POS10 : POS6;
  const R = 15;
  const pairs: [PosItem, PosItem | null][] = [];
  for (let i = 0; i < positions.length; i += 2) pairs.push([positions[i], positions[i + 1] ?? null]);

  return (
    <View>
      <View style={cs.svgWrap}>
        <Svg viewBox={`0 0 ${VB_W} ${VB_H}`} width="100%" height="100%">
          <Defs>
            <SvgGradient id="cg" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0"   stopColor="#071828" stopOpacity="1" />
              <Stop offset="0.5" stopColor="#050F1C" stopOpacity="1" />
              <Stop offset="1"   stopColor="#030A14" stopOpacity="1" />
            </SvgGradient>
          </Defs>

          {/* Outer background */}
          <Rect x={0} y={0} width={VB_W} height={VB_H} fill="#020810" />

          {/* Glass court floor */}
          <Rect x={CL} y={CT} width={CW} height={CH} fill="url(#cg)" />

          {/* Subtle zone tints */}
          <Rect x={CL} y={CT}       width={CW} height={sY(2.2) - CT}      fill="rgba(255,107,53,0.06)" />
          <Rect x={CL} y={sY(2.2)}  width={CW} height={sY(7.0) - sY(2.2)} fill="rgba(10,132,255,0.04)" />
          <Rect x={CL} y={sY(7.0)}  width={CW} height={CT + CH - sY(7.0)} fill="rgba(52,199,89,0.06)"  />

          {/* Court outer boundary */}
          <Rect x={CL} y={CT} width={CW} height={CH}
            fill="none" stroke="rgba(180,220,255,0.9)" strokeWidth={2.5} />

          {/* Short line (full width) */}
          <Line x1={CL} y1={SHORT_Y} x2={CL + CW} y2={SHORT_Y}
            stroke="rgba(180,220,255,0.75)" strokeWidth={1.5} />

          {/* Half-court line: short line to back wall */}
          <Line x1={HALF_X} y1={SHORT_Y} x2={HALF_X} y2={CT + CH}
            stroke="rgba(180,220,255,0.6)" strokeWidth={1.5} />

          {/* Service box end line */}
          <Line x1={CL} y1={SERVICE_Y} x2={CL + CW} y2={SERVICE_Y}
            stroke="rgba(180,220,255,0.35)" strokeWidth={1} />

          {/* Service box inner verticals */}
          <Line x1={CL + CW * 0.25} y1={SHORT_Y} x2={CL + CW * 0.25} y2={SERVICE_Y}
            stroke="rgba(180,220,255,0.25)" strokeWidth={1} />
          <Line x1={CL + CW * 0.75} y1={SHORT_Y} x2={CL + CW * 0.75} y2={SERVICE_Y}
            stroke="rgba(180,220,255,0.25)" strokeWidth={1} />

          {/* Front wall / back wall labels */}
          <SvgText x={VB_W / 2} y={16} textAnchor="middle"
            fill="rgba(180,220,255,0.5)" fontSize={8} fontWeight="bold" letterSpacing={2}>
            {'▲  FRONT WALL  ▲'}
          </SvgText>
          <SvgText x={VB_W / 2} y={VB_H - 6} textAnchor="middle"
            fill="rgba(180,220,255,0.5)" fontSize={8} fontWeight="bold" letterSpacing={2}>
            {'▼  BACK WALL  ▼'}
          </SvgText>

          {/* T junction marker */}
          <Circle cx={HALF_X} cy={SHORT_Y} r={12}
            fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.7)" strokeWidth={1.5} />
          <SvgText x={HALF_X} y={SHORT_Y + 4} textAnchor="middle"
            fill="white" fontSize={9} fontWeight="bold">T</SvgText>

          {/* Position circles */}
          {positions.map((p) => {
            const color = ZC[p.z];
            return (
              <G key={p.code}>
                {/* Soft outer glow */}
                <Circle cx={p.sx} cy={p.sy} r={R + 6} fill={`${color}0C`} />
                {/* Main circle */}
                <Circle cx={p.sx} cy={p.sy} r={R}
                  fill={`${color}22`} stroke={color} strokeWidth={2} />
                {/* Position code */}
                <SvgText x={p.sx} y={p.sy + (system === '10pt' ? 3 : 4)}
                  textAnchor="middle" fill="white"
                  fontSize={system === '10pt' ? 8 : 9} fontWeight="bold">
                  {p.code}
                </SvgText>
              </G>
            );
          })}
        </Svg>
      </View>

      {/* Position legend */}
      <View style={cs.legend}>
        {pairs.map(([left, right], i) => (
          <View key={i} style={cs.legendRow}>
            <View style={cs.legendItem}>
              <View style={[cs.legendDot, { backgroundColor: ZC[left.z] }]} />
              <Text style={[cs.legendCode, { color: ZC[left.z] }]}>{left.code}</Text>
              <Text style={cs.legendLabel}>{left.label}</Text>
            </View>
            {right ? (
              <View style={cs.legendItem}>
                <View style={[cs.legendDot, { backgroundColor: ZC[right.z] }]} />
                <Text style={[cs.legendCode, { color: ZC[right.z] }]}>{right.code}</Text>
                <Text style={cs.legendLabel}>{right.label}</Text>
              </View>
            ) : (
              <View style={cs.legendItem} />
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

const cs = StyleSheet.create({
  svgWrap: {
    width: '100%',
    aspectRatio: VB_W / VB_H,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(180,220,255,0.15)',
  },
  legend: {
    marginTop: Spacing.sm,
    gap: 4,
  },
  legendRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  legendItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  legendDot: {
    width: 7, height: 7, borderRadius: 4,
    flexShrink: 0,
  },
  legendCode: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.bold,
    minWidth: 30,
    flexShrink: 0,
  },
  legendLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    flex: 1,
  },
});

// ─── Section types ────────────────────────────────────────────────────────────

type SectionDef = {
  id: string;
  icon: string;
  iconColor: string;
  title: string;
  render: () => React.ReactNode;
};

// ─── Main component ───────────────────────────────────────────────────────────

export default function HelpModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [open, setOpen] = useState<Set<string>>(new Set(['getting-started']));
  const [courtTab, setCourtTab] = useState<'6pt' | '10pt'>('6pt');

  function toggle(id: string) {
    setOpen(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const sections: SectionDef[] = [
    {
      id: 'getting-started',
      icon: 'rocket-outline',
      iconColor: Colors.brand,
      title: 'Getting Started',
      render: () => (
        <View style={s.body}>
          <Text style={s.para}>
            Squash GhostingX coaches squash ghosting drills with real-time voice calls and court
            visuals. No opponent needed — just a squash court or any open space.
          </Text>
          <View style={s.twoCol}>
            <View style={s.actionCard}>
              <Text style={[s.actionTitle, { color: Colors.primary }]}>⚡ Quick Start</Text>
              <Text style={s.actionDesc}>
                One tap — starts immediately using your last session's settings.
              </Text>
            </View>
            <View style={s.actionCard}>
              <Text style={[s.actionTitle, { color: Colors.brand }]}>＋ New Session</Text>
              <Text style={s.actionDesc}>
                Opens the full setup flow to choose court, difficulty and duration.
              </Text>
            </View>
          </View>
          <Bullet text="Stand at the T (the T-junction centre line) when you begin." />
          <Bullet text="When the voice calls a position — sprint there, play a phantom shot, return to T." />
          <Bullet text="Repeat until your session timer ends." />
          <Text style={s.tip}>💡 Tap Repeat on the Last Session card to instantly replay your last drill.</Text>
        </View>
      ),
    },
    {
      id: 'court-systems',
      icon: 'grid-outline',
      iconColor: Colors.accentProgress,
      title: 'Court Systems',
      render: () => (
        <View style={s.body}>
          <View style={s.twoCol}>
            <View style={[s.systemCard, { borderColor: `${Colors.brand}50` }]}>
              <Text style={[s.systemNum, { color: Colors.brand }]}>6</Text>
              <Text style={s.systemTitle}>6-Point</Text>
              <Text style={s.systemDesc}>
                Classic ghosting. Front, Mid and Back on both sides. Ideal for all levels.
              </Text>
            </View>
            <View style={[s.systemCard, { borderColor: `${Colors.accentProgress}50` }]}>
              <Text style={[s.systemNum, { color: Colors.accentProgress }]}>10</Text>
              <Text style={s.systemTitle}>10-Point</Text>
              <Text style={s.systemDesc}>
                Adds Front-Mid and Back-Mid positions for finer movement coverage.
              </Text>
            </View>
          </View>
          <Text style={s.tip}>💡 Change the court system in Settings or the New Session setup flow.</Text>
        </View>
      ),
    },
    {
      id: 'positions',
      icon: 'map-outline',
      iconColor: Colors.accentLibrary,
      title: 'Court Positions',
      render: () => (
        <View style={s.body}>
          <Text style={s.para}>
            All positions assume a right-handed player facing the front wall. Left-handed?
            The app automatically mirrors every call for you.
          </Text>
          <View style={s.courtTabRow}>
            {(['6pt', '10pt'] as const).map(tab => (
              <TouchableOpacity
                key={tab}
                style={[s.courtTabBtn, courtTab === tab && s.courtTabActive]}
                onPress={() => setCourtTab(tab)}
              >
                <Text style={[s.courtTabTxt, courtTab === tab && s.courtTabTxtActive]}>
                  {tab === '6pt' ? '6-Point' : '10-Point'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <GlassCourtDiagram system={courtTab} />
          <Text style={s.tip}>💡 The T (centre mark) is your home base. Always return there after each position.</Text>
        </View>
      ),
    },
    {
      id: 'settings',
      icon: 'settings-outline',
      iconColor: Colors.warning,
      title: 'Session Settings',
      render: () => (
        <View style={s.body}>
          <Text style={s.sectionLabel}>DIFFICULTY</Text>
          <Text style={s.para}>Controls call speed and reps per set. Higher = shorter interval between calls.</Text>
          {[
            { name: 'Beginner',     desc: '~12 s per rep. Learning the movement pattern.',    color: Colors.levelBeginner },
            { name: 'Intermediate', desc: '~10 s per rep. Regular club player pace.',         color: Colors.levelIntermediate },
            { name: 'Advanced',     desc: '~8 s per rep. Competitive club level.',            color: Colors.levelAdvanced },
            { name: 'Elite',        desc: '~6.5 s per rep. Tournament intensity.',            color: Colors.levelElite },
            { name: 'Pro',          desc: '~5.2 s per rep. Maximum physical demand.',        color: Colors.levelPro },
          ].map(({ name, desc, color }) => (
            <View key={name} style={s.levelRow}>
              <View style={[s.levelDot, { backgroundColor: color }]} />
              <View style={{ flex: 1 }}>
                <Text style={[s.levelName, { color }]}>{name}</Text>
                <Text style={s.levelDesc}>{desc}</Text>
              </View>
            </View>
          ))}

          <Text style={[s.sectionLabel, { marginTop: Spacing.md }]}>TEMPO</Text>
          <Bullet text="Slow — extra recovery time between calls." />
          <Bullet text="Natural — balanced rhythm, the recommended starting point." />
          <Bullet text="Explosive — maximum pace for the chosen difficulty." />

          <Text style={[s.sectionLabel, { marginTop: Spacing.md }]}>MOVEMENT PACE</Text>
          <Text style={s.para}>
            Adds an extra pause at T between calls. Brisk is fastest; Recovery adds 3 extra seconds.
            Use Recovery or Measured while building fitness, Brisk when match-fit.
          </Text>

          <Text style={[s.sectionLabel, { marginTop: Spacing.md }]}>DURATION</Text>
          <Text style={s.para}>
            Session length in minutes. The app auto-inserts rest breaks between sets — actual
            moving time will be roughly 60–70% of this number.
          </Text>
        </View>
      ),
    },
    {
      id: 'during',
      icon: 'play-circle-outline',
      iconColor: Colors.primary,
      title: 'During a Session',
      render: () => (
        <View style={s.body}>
          <Bullet text="A 3-second countdown fires before each set begins." />
          <Bullet text="Voice calls the next position — e.g. 'Front Left'." />
          <Bullet text="Sprint to that corner, play your phantom shot." />
          <Bullet text="'Recover to T!' cue fires — run back to the T-line." />
          <Bullet text="Wait for the next call and repeat." />

          <Text style={[s.sectionLabel, { marginTop: Spacing.md }]}>LIVE PACE CONTROL</Text>
          <Text style={s.para}>
            Use the +/− buttons on the session screen to speed up or slow down on the fly.
            7 steps from Recovery (+3 s) to Turbo (−3 s). Your choice resets each session.
          </Text>

          <Text style={[s.sectionLabel, { marginTop: Spacing.md }]}>AUTO REST BREAKS</Text>
          <Text style={s.para}>
            After each set, an automatic rest break fires. Duration scales with your
            difficulty — harder difficulties take shorter breaks. A countdown plays before
            the next set begins.
          </Text>

          <Text style={[s.sectionLabel, { marginTop: Spacing.md }]}>SHOT CALLS</Text>
          <Text style={s.para}>
            Mid-movement the app calls a shot type (e.g. "Drive!", "Boast!"). This trains
            decision-making alongside footwork. Can be disabled in drill config.
          </Text>
        </View>
      ),
    },
    {
      id: 'score',
      icon: 'bar-chart-outline',
      iconColor: Colors.accentProgress,
      title: 'Understanding Your Score',
      render: () => (
        <View style={s.body}>
          <Text style={s.para}>
            Your Intensity Score (0–100) reflects overall session quality based on difficulty,
            tempo, and completion percentage.
          </Text>
          <View style={s.scoreRow}>
            <View style={[s.scoreChip, { borderColor: '#00E676', backgroundColor: '#00E67615' }]}>
              <Text style={[s.scoreVal, { color: '#00E676' }]}>70+</Text>
              <Text style={s.scoreLbl}>Excellent</Text>
            </View>
            <View style={[s.scoreChip, { borderColor: '#FF9F0A', backgroundColor: '#FF9F0A15' }]}>
              <Text style={[s.scoreVal, { color: '#FF9F0A' }]}>40–69</Text>
              <Text style={s.scoreLbl}>Good</Text>
            </View>
            <View style={[s.scoreChip, { borderColor: '#FF453A', backgroundColor: '#FF453A15' }]}>
              <Text style={[s.scoreVal, { color: '#FF453A' }]}>&lt; 40</Text>
              <Text style={s.scoreLbl}>Building</Text>
            </View>
          </View>
          <Bullet text="Reps — total position calls you completed in the session." />
          <Bullet text="Done % — how much of your target duration you finished." />
          <Bullet text="Mins — total active session time." />
          <Text style={s.tip}>
            💡 The Home Screen Last Session card shows a color-coded border and score badge — green, amber, or red — so you see session quality at a glance.
          </Text>
        </View>
      ),
    },
    {
      id: 'faq',
      icon: 'help-circle-outline',
      iconColor: Colors.textMuted,
      title: 'FAQ',
      render: () => (
        <View style={s.body}>
          {[
            {
              q: 'Do I need an internet connection?',
              a: 'No. Squash GhostingX is fully offline. All data stays on your device.',
            },
            {
              q: 'Can I train without sound?',
              a: 'Yes. Turn off Voice Instructions in Settings and follow the court highlight visuals only.',
            },
            {
              q: 'The voice seems slightly out of sync with the screen?',
              a: 'The app pre-fires voice ~150 ms early to compensate for iOS/Android TTS startup latency, so they should feel aligned. If it still feels off, try Speech Rate 1.0× in Settings.',
            },
            {
              q: 'What does Left-Handed mode do?',
              a: 'Mirrors all position calls Left ↔ Right so "Front Right" becomes your forehand corner. Set in Settings → Profile.',
            },
            {
              q: 'Can I train without a real squash court?',
              a: 'Yes. Any open space roughly court-sized works. Mark out the T with tape if needed.',
            },
            {
              q: 'How do I replay my last session?',
              a: 'Tap Repeat on the Last Session card on the Home Screen. It starts immediately with the same settings.',
            },
            {
              q: 'Where is my training data stored?',
              a: 'Entirely on your device. Nothing is sent to any server. Deleting the app removes all data.',
            },
          ].map(({ q, a }) => (
            <View key={q} style={s.faqItem}>
              <Text style={s.faqQ}>{q}</Text>
              <Text style={s.faqA}>{a}</Text>
            </View>
          ))}
        </View>
      ),
    },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaProvider>
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <View style={s.headerIcon}>
              <Ionicons name="book-outline" size={18} color={Colors.brand} />
            </View>
            <View>
              <Text style={s.headerTitle}>Help & Guide</Text>
              <Text style={s.headerSub}>Squash GhostingX</Text>
            </View>
          </View>
          <TouchableOpacity
            style={s.closeBtn}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="close" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
        >
          {sections.map((sec) => {
            const isOpen = open.has(sec.id);
            return (
              <View key={sec.id} style={s.accordion}>
                <TouchableOpacity
                  style={s.accHeader}
                  onPress={() => toggle(sec.id)}
                  activeOpacity={0.75}
                >
                  <View style={[s.accIcon, { backgroundColor: `${sec.iconColor}18` }]}>
                    <Ionicons name={sec.icon as any} size={18} color={sec.iconColor} />
                  </View>
                  <Text style={s.accTitle}>{sec.title}</Text>
                  <Ionicons
                    name={isOpen ? 'chevron-up' : 'chevron-down'}
                    size={15}
                    color={Colors.textMuted}
                  />
                </TouchableOpacity>
                {isOpen && sec.render()}
              </View>
            );
          })}

          <View style={s.footer}>
            <Text style={s.footerText}>Squash GhostingX · Help Guide</Text>
            <Text style={s.footerSub}>Questions? squash.ghostingx@gmail.com</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  headerLeft:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  headerIcon:  {
    width: 36, height: 36, borderRadius: BorderRadius.sm,
    backgroundColor: Colors.brandMuted, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: FontSize.label, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  headerSub:   { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  closeBtn:    {
    width: 34, height: 34, borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center', justifyContent: 'center',
  },

  scroll: { padding: Spacing.base, gap: Spacing.sm, paddingBottom: Spacing.xxl },

  accordion: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1, borderColor: Colors.border,
    overflow: 'hidden',
  },
  accHeader: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
  },
  accIcon:  {
    width: 36, height: 36, borderRadius: BorderRadius.sm,
    alignItems: 'center', justifyContent: 'center',
  },
  accTitle: { flex: 1, fontSize: FontSize.label, fontWeight: FontWeight.semiBold, color: Colors.textPrimary },

  body: {
    paddingHorizontal: Spacing.base, paddingBottom: Spacing.base,
    paddingTop: Spacing.md,
    borderTopWidth: 1, borderTopColor: Colors.border,
    gap: Spacing.sm,
  },
  para:         { fontSize: FontSize.caption, color: Colors.textSecondary, lineHeight: 18 },
  sectionLabel: { fontSize: 10, fontWeight: FontWeight.bold, color: Colors.textMuted, letterSpacing: 0.8 },
  tip:          { fontSize: FontSize.caption, color: Colors.textMuted, lineHeight: 18 },

  twoCol: { flexDirection: 'row', gap: Spacing.sm },

  actionCard: {
    flex: 1, backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, gap: 4,
  },
  actionTitle: { fontSize: FontSize.caption, fontWeight: FontWeight.bold },
  actionDesc:  { fontSize: 11, color: Colors.textMuted, lineHeight: 15 },

  systemCard: {
    flex: 1, backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.md, borderWidth: 1.5,
    padding: Spacing.md, alignItems: 'center', gap: 4,
  },
  systemNum:   { fontSize: 36, fontWeight: FontWeight.black, lineHeight: 40 },
  systemTitle: { fontSize: FontSize.caption, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  systemDesc:  { fontSize: 11, color: Colors.textMuted, textAlign: 'center', lineHeight: 15 },

  bullet: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  bulletDot: {
    width: 5, height: 5, borderRadius: 3,
    backgroundColor: Colors.brand, marginTop: 7, flexShrink: 0,
  },
  bulletText: { flex: 1, fontSize: FontSize.caption, color: Colors.textSecondary, lineHeight: 18 },

  courtTabRow: { flexDirection: 'row', gap: Spacing.sm },
  courtTabBtn: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.surfaceElevated,
  },
  courtTabActive:    { backgroundColor: Colors.brandMuted, borderColor: Colors.brand },
  courtTabTxt:       { fontSize: FontSize.caption, fontWeight: FontWeight.medium, color: Colors.textMuted },
  courtTabTxtActive: { color: Colors.brand },

  levelRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, paddingVertical: 2 },
  levelDot:  { width: 8, height: 8, borderRadius: 4, marginTop: 5, flexShrink: 0 },
  levelName: { fontSize: FontSize.caption, fontWeight: FontWeight.semiBold, marginBottom: 1 },
  levelDesc: { fontSize: 11, color: Colors.textMuted },

  scoreRow:  { flexDirection: 'row', gap: Spacing.sm },
  scoreChip: {
    flex: 1, borderRadius: BorderRadius.md, borderWidth: 1.5,
    paddingVertical: Spacing.sm, alignItems: 'center', gap: 2,
  },
  scoreVal: { fontSize: FontSize.label, fontWeight: FontWeight.bold },
  scoreLbl: { fontSize: 10, color: Colors.textMuted },

  faqItem: {
    backgroundColor: Colors.surfaceElevated, borderRadius: BorderRadius.md,
    padding: Spacing.md, gap: Spacing.xs,
  },
  faqQ: { fontSize: FontSize.caption, fontWeight: FontWeight.semiBold, color: Colors.textPrimary },
  faqA: { fontSize: 11, color: Colors.textMuted, lineHeight: 16 },

  footer:     { alignItems: 'center', paddingVertical: Spacing.xl, gap: 4 },
  footerText: { fontSize: FontSize.caption, color: Colors.textMuted, fontWeight: FontWeight.medium },
  footerSub:  { fontSize: 11, color: Colors.textDisabled },
});
