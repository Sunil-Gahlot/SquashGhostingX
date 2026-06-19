import React, { useEffect, useRef, useState } from 'react';
import { Animated, View, StyleSheet, ViewStyle, Image as RNImage } from 'react-native';
import Svg, {
  Circle, G, Line, Rect,
} from 'react-native-svg';
import { Position, CourtSystem, CourtMode } from '../../types';
import { POSITION_INFO, POSITIONS_6PT, POSITIONS_10PT } from '../../constants/positions';
import { Colors } from '../../constants/colors';

// ─── Wooden-court palette — US Squash spec visual upgrade ───────────────────
// Light blonde maple/beech — matches professional broadcast court look.
// All red lines unified to single value (#CC1500) at consistent 5px stroke.
const WOODEN_PALETTE = {
  surround:    '#0E0B06',   // near-black warm surround
  floorBase:   '#DFBD78',   // base fill — prevents any gap bleed-through between planks
  floorA:      '#EED592',   // primary plank — light warm maple
  floorB:      '#E6CA84',   // standard plank — slightly deeper
  floorC:      '#F3DC9E',   // highlight plank — natural bright variation
  grainLine:   'rgba(145,92,18,0.048)',  // subtle cross-grain within planks
  jointLine:   'rgba(155,98,20,0.28)',   // staggered plank-end joints
  boundary:    '#CC1500',   // WSF/US Squash red — 2" line (5px at 100px/m)
  courtLine:   '#CC1500',   // all court markings — identical vivid red
};

// ─── Player pose images ────────────────────────────────────────────────────
const POSES = {
  male: {
    T_right:  require('../../../assets/Right Man hand Man plyer T postion.png'),
    T_left:   require('../../../assets/Left hand Man plyer T postion.png'),
    forehand: require('../../../assets/Right Man hand plyer forhand postion.png'),
    backhand: require('../../../assets/Right hand Man plyer Backhand postion.png'),
  },
  female: {
    T_right:  require('../../../assets/Right WoMan hand Man plyer T postion.png'),
    T_left:   require('../../../assets/Left hand WoMan plyer T postion.png'),
    forehand: require('../../../assets/Right WomMan hand plyer forhand postion.png'),
    backhand: require('../../../assets/Right hand WoMan plyer Backhand postion.png'),
  },
};

// Right-side court positions (FR, MR, BR and 10pt equivalents)
const RIGHT_SIDE: Position[] = ['FR', 'MR', 'BR', 'FMCR', 'BMCR'];

// ─── Layout constants ──────────────────────────────────────────────────────
const VB_W = 640;
const VB_H = 975;
const SHORT_LINE_Y  = 426;
const HALF_COURT_X  = 320;
const SERVICE_BOX_W = 160;
const SERVICE_BOX_H = 160;
const PULSE_R = 44;

// Inner court geometry — shared by both glass and wooden court.
// CIX/CIY=8 matches the original position coordinate mapping (toSvgX/toSvgY).
// Boundary rect center is at (5,5) with strokeWidth=6 → outer edge at (2,2), inner at (8,8)=CIX/CIY.
// Shrinking strokeWidth from 8→6 (not moving CIX) keeps court lines in sync with player positions.
const CIX = 8;               // court inner left/right edge — MUST match position coordinate system
const CIY = 8;               // court inner top/bottom edge
const CIW = VB_W - 16;      // inner court width  (624)
const CIH = VB_H - 16;      // inner court height (959)
const PLANK_W       = 18;   // ~18cm planks — slightly narrower for realistic maple count
const JOINT_SPACING = 120;  // joint every ~1.2m — more natural plank-end grain frequency
const GRAIN_SPACING =  38;  // subtle cross-grain line every ~38cm
const NUM_PLANKS    = Math.ceil(CIW / PLANK_W) + 1;
const NUM_JOINTS    = Math.ceil(CIH / JOINT_SPACING);
const NUM_GRAINS    = Math.ceil(CIH / GRAIN_SPACING);


function toSvgX(x: number) { return (x + 3.20) * 100; }
function toSvgY(z: number) { return z * 100; }

// Returns SVG coordinates in data space for a position
function dataCoords(pos: Position): { cx: number; cy: number } {
  return {
    cx: toSvgX(POSITION_INFO[pos].x),
    cy: toSvgY(POSITION_INFO[pos].z),
  };
}

// Returns the visual (on-screen) SVG coordinates accounting for the mirror transform.
// For left-handed players the court is mirrored, so FL appears on the right visually.
// Images are rendered outside the mirror group, so we calculate visual position manually.
function visualCoords(pos: Position, dominantHand: 'left' | 'right'): { vx: number; vy: number } {
  const { cx, cy } = dataCoords(pos);
  return {
    vx: dominantHand === 'left' ? VB_W - cx : cx,
    vy: cy,
  };
}

function getPoseSource(
  pos: Position,
  gender: string | null | undefined,
  dominantHand: 'left' | 'right',
) {
  const set = gender === 'female' ? POSES.female : POSES.male;
  if (pos === 'T') return dominantHand === 'left' ? set.T_left : set.T_right;
  // Forehand when dominant hand side matches position side:
  //   Right-handed at right-side (FR/MR/BR) → forehand
  //   Left-handed  at left-side  (FL/ML/BL) → forehand (court is mirrored, so visual is correct)
  const isRightSide = RIGHT_SIDE.includes(pos);
  const isForehand  = (dominantHand === 'right') === isRightSide;
  return isForehand ? set.forehand : set.backhand;
}

// Pose image dimensions in SVG viewport units (images are portrait, ~3:4 ratio).
// Active poses render at ~90px wide on a typical phone — clearly visible on court.
function poseDims(pos: Position, isActive: boolean): { w: number; h: number } {
  if (pos === 'T') return { w: 190, h: 253 };
  const is10pt = !POSITIONS_6PT.includes(pos as any);
  if (isActive) return is10pt ? { w: 167, h: 222 } : { w: 184, h: 245 };
  return is10pt ? { w: 121, h: 161 } : { w: 138, h: 184 };
}

// ─── Themes ────────────────────────────────────────────────────────────────
// GLASS MODE — GhostingX stadium style.
//   Floor: ocean-blue midnight surface (lighter than before, clearly visible)
//   Zones: front-court gets a blue tint, back-court gets an orange tint
//   Center: radial spotlight approximation centered on the T — concentric
//           blue-tinted circles create a subtle "arena lighting" depth effect
//   Lines: brand-orange glowing boundary and court markings
const GLASS_THEME = {
  surround:     '#020812',                    // near-black navy out-of-bounds
  courtSurface: '#0C1C2E',                    // ocean-blue floor (lighter, vibrant)
  frontZone:    'rgba(10,132,255,0.09)',       // front court: visible blue zone
  backZone:     'rgba(255,107,53,0.08)',       // back court: visible orange zone
  // Radial spotlight — 5 concentric circles centred at T (HALF_COURT_X, SHORT_LINE_Y)
  // Combined they approximate a radial gradient, making the centre court brighter
  spotR1:  460, spotC1: 'rgba(25,75,130,0.08)',
  spotR2:  300, spotC2: 'rgba(25,75,130,0.10)',
  spotR3:  190, spotC3: 'rgba(40,95,165,0.10)',
  spotR4:  110, spotC4: 'rgba(50,110,185,0.12)',
  spotR5:   55, spotC5: 'rgba(60,125,200,0.14)',
  gridLine:     'rgba(255,255,255,0.044)',     // faint training grid (slightly visible)
  glowOuter:    'rgba(255,107,53,0.10)',       // outermost boundary halo
  glowInner:    'rgba(255,107,53,0.24)',       // sharper inner glow
  boundary:     '#FF6B35',                    // brand-orange boundary
  courtLine:    '#FF6B35',                    // orange court lines
  tin:          '#FF6B35',                    // orange tin strip
  arrowColor:   Colors.active,
  pulseColor:   Colors.activePulse,
};

const WOODEN_THEME = {
  arrowColor: Colors.brand,
  pulseColor: Colors.brand,
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ─── Component ─────────────────────────────────────────────────────────────

interface CourtCanvasProps {
  activePosition: Position | null;
  nextPosition?:  Position | null;
  courtSystem:    CourtSystem;
  dominantHand:   'left' | 'right';
  gender?:        string | null;
  courtMode?:     CourtMode;
  style?:         ViewStyle;
}

export default function CourtCanvas({
  activePosition,
  nextPosition,
  courtSystem,
  dominantHand,
  gender,
  courtMode = 'wooden',
  style,
}: CourtCanvasProps) {

  const isWooden = courtMode === 'wooden';

  // ── Container pixel dimensions (resolved via onLayout) ───────────────────
  // Percentage top/left on absolute children don't resolve when the parent's
  // height comes from aspectRatio. We capture actual pixel dims instead.
  const [cw, setCw] = useState(0);
  const [ch, setCh] = useState(0);

  // ── Pulse animation ─────────────────────────────────────────────────────
  const pulse     = useRef(new Animated.Value(0)).current;
  const pulseLast = useRef<Position | null>(null);

  useEffect(() => {
    if (activePosition && activePosition !== pulseLast.current) {
      pulseLast.current = activePosition;
      pulse.setValue(0);
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1, duration: 550, useNativeDriver: false }),
          Animated.timing(pulse, { toValue: 0, duration: 550, useNativeDriver: false }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
    if (!activePosition) pulse.setValue(0);
    return undefined;
  }, [activePosition]);

  const pulseR       = pulse.interpolate({ inputRange: [0, 1], outputRange: [PULSE_R, PULSE_R + 20] });
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.70, 0.04] });

  // SVG mirror transform for left-handed players
  const mirror = dominantHand === 'left' ? `scale(-1,1) translate(-${VB_W},0)` : undefined;

  const T = isWooden ? WOODEN_THEME : GLASS_THEME;

  // ── Pose image layer (React Native Images, NOT SvgImage) ──────────────────
  // SvgImage from react-native-svg does not reliably load local require() assets.
  // Instead we render RN <Image> components absolutely positioned inside the View,
  // using percentage coordinates that match the SVG viewBox proportionally.
  //
  // Coordinate mapping: SVG pos (vx, vy) in 0–640 / 0–975 space →
  //   left  = ((vx - w/2) / VB_W) * 100 %
  //   top   = ((vy - h/2) / VB_H) * 100 %
  //   width = (w  / VB_W) * 100 %
  //   height= (h  / VB_H) * 100 %
  //
  // Flow: T pose (full) → position pose (full) → recovery cue → T pose (full) → …
  //   • activePosition === null  → player at T: show T pose at full opacity
  //   • activePosition !== null  → player has moved: show movement pose only
  // Keys change with position so React replaces instantly (no cross-fade/morph).

  // Converts SVG viewport coordinates → absolute pixel style for RN Image.
  // Uses cw/ch from onLayout so positions are always pixel-accurate.
  function poseStyle(vx: number, vy: number, w: number, h: number, opacity: number) {
    if (!cw || !ch) return { display: 'none' as const };
    const pw = (w / VB_W) * cw;
    const ph = (h / VB_H) * ch;
    return {
      position: 'absolute' as const,
      left:    (vx / VB_W) * cw - pw / 2,
      top:     (vy / VB_H) * ch - ph / 2,
      width:   pw,
      height:  ph,
      opacity,
    };
  }

  const poseLayer = (
    <>
      {/* T pose — shown when idle at T (null) OR when T is explicitly called as a position */}
      {(activePosition === null || activePosition === 'T') && (() => {
        const src = getPoseSource('T', gender, dominantHand);
        const { vx, vy } = visualCoords('T', dominantHand);
        const { w, h } = poseDims('T', true);
        return (
          <RNImage
            key="pose-t"
            source={src}
            style={poseStyle(vx, vy, w, h, 1)}
            resizeMode="contain"
          />
        );
      })()}

      {/* Active position pose — instant key-swap ensures no morph animation */}
      {activePosition && activePosition !== 'T' && (() => {
        const src = getPoseSource(activePosition, gender, dominantHand);
        const { vx, vy } = visualCoords(activePosition, dominantHand);
        const { w, h } = poseDims(activePosition, true);
        return (
          <RNImage
            key={String(activePosition)}
            source={src}
            style={poseStyle(vx, vy, w, h, 1)}
            resizeMode="contain"
          />
        );
      })()}
    </>
  );

  // Pulse ring stays in SVG (it's a vector circle, not an image)
  const pulseRingSvg = activePosition && activePosition !== 'T' ? (() => {
    const { vx, vy } = visualCoords(activePosition, dominantHand);
    return (
      <AnimatedCircle
        cx={vx} cy={vy}
        r={pulseR as any}
        fill="none"
        stroke={T.pulseColor}
        strokeWidth="4"
        opacity={pulseOpacity as any}
      />
    );
  })() : null;

  // Next-position preview: shown only between moves (activePosition === null = player at T).
  // Hiding during active movement prevents a "second instruction" from appearing at the
  // next target position while the player is still executing the current one.
  const posIndicatorsSvg = (
    <>
      {activePosition === null && nextPosition && nextPosition !== 'T' && (() => {
        const { vx, vy } = visualCoords(nextPosition, dominantHand);
        return (
          <Circle cx={vx} cy={vy} r={14} fill="none"
            stroke={T.arrowColor} strokeWidth="3" opacity={0.40} />
        );
      })()}
    </>
  );

  // ─── WOODEN COURT RENDER ────────────────────────────────────────────────
  // Pure SVG warm-wood court — no PNG, no artifacts, WSF-accurate line positions.
  if (isWooden) {

    return (
      <View style={[styles.container, style]} onLayout={(e) => { setCw(e.nativeEvent.layout.width); setCh(e.nativeEvent.layout.height); }}>
        <Svg viewBox={`0 0 ${VB_W} ${VB_H}`} width="100%" height="100%">
          {/* ── Out-of-bounds dark surround ── */}
          <Rect x="0" y="0" width={VB_W} height={VB_H} fill={WOODEN_PALETTE.surround} />

          {/* ── Base floor fill — prevents gap bleed-through between planks ── */}
          <Rect x={CIX} y={CIY} width={CIW} height={CIH} fill={WOODEN_PALETTE.floorBase} />

          {/* ── Wood planks — 3-colour rotation for natural maple variation ── */}
          {Array.from({ length: NUM_PLANKS }, (_, i) => {
            const px = CIX + i * PLANK_W;
            if (px >= CIX + CIW) return null;
            const pw = Math.min(PLANK_W, CIX + CIW - px);
            const PLANK_COLOURS = [WOODEN_PALETTE.floorA, WOODEN_PALETTE.floorB, WOODEN_PALETTE.floorC];
            return (
              <Rect key={`p${i}`}
                x={px} y={CIY} width={pw} height={CIH}
                fill={PLANK_COLOURS[i % 3]}
              />
            );
          })}

          {/* ── Subtle cross-grain lines — simulate natural wood grain within planks ── */}
          {Array.from({ length: NUM_GRAINS }, (_, i) => {
            const y = CIY + i * GRAIN_SPACING + ((i * 11) % 22);
            if (y >= CIY + CIH) return null;
            return (
              <Line key={`gr${i}`}
                x1={CIX + 1} y1={y} x2={CIX + CIW - 1} y2={y}
                stroke={WOODEN_PALETTE.grainLine} strokeWidth="0.6"
              />
            );
          })}

          {/* ── Staggered plank-end joints — natural court board seaming ── */}
          {Array.from({ length: NUM_JOINTS }, (_, i) => {
            const y = CIY + (i + 1) * JOINT_SPACING;
            if (y >= CIY + CIH) return null;
            const staggerGroups = [0, PLANK_W * 4, PLANK_W * 2, PLANK_W * 6, PLANK_W * 1];
            const offset = staggerGroups[i % staggerGroups.length];
            return (
              <Line key={`j${i}`}
                x1={CIX + offset} y1={y} x2={CIX + CIW} y2={y}
                stroke={WOODEN_PALETTE.jointLine} strokeWidth="1.0" opacity={0.60}
              />
            );
          })}

          <G transform={mirror}>
            {/* ── Court boundary — 5px WSF red (2" spec), centred on court edge ── */}
            <Rect x={CIX} y={CIY} width={CIW} height={CIH}
              fill="none" stroke={WOODEN_PALETTE.boundary} strokeWidth="6" />

            {/* ── Short line — 4.26m from front wall (US Squash / WSF standard) ── */}
            <Line x1={CIX} y1={SHORT_LINE_Y} x2={CIX + CIW} y2={SHORT_LINE_Y}
              stroke={WOODEN_PALETTE.courtLine} strokeWidth="5" />

            {/* ── Half-court line — short line to back wall ── */}
            <Line x1={HALF_COURT_X} y1={SHORT_LINE_Y} x2={HALF_COURT_X} y2={CIY + CIH}
              stroke={WOODEN_PALETTE.courtLine} strokeWidth="5" />

            {/* ── Service boxes — 1.6m × 1.6m in back corners, uniform 5px line ── */}
            <Rect x={CIX} y={SHORT_LINE_Y} width={SERVICE_BOX_W} height={SERVICE_BOX_H}
              fill="none" stroke={WOODEN_PALETTE.courtLine} strokeWidth="5" />
            <Rect x={CIX + CIW - SERVICE_BOX_W} y={SHORT_LINE_Y} width={SERVICE_BOX_W} height={SERVICE_BOX_H}
              fill="none" stroke={WOODEN_PALETTE.courtLine} strokeWidth="5" />

          </G>

          {/* Next-position preview indicator (outside mirror group) */}
          {posIndicatorsSvg}
        </Svg>

        {/* Player pose images — RN Images absolutely positioned over SVG */}
        {poseLayer}
      </View>
    );
  }

  // ─── GLASS COURT RENDER — GhostingX dark/neon mode ─────────────────────
  // Completely distinct from the wooden court:
  //   • Very dark navy surface (no planks)
  //   • Front/back zone colour tints
  //   • Faint training grid background
  //   • Glowing brand-orange boundary and court lines
  //   • Glowing T-junction dot at the intersection
  const HT = GLASS_THEME;
  const gridStepY = CIH / 10;
  const gridStepX = CIW / 5;
  return (
    <View style={[styles.container, style]} onLayout={(e) => { setCw(e.nativeEvent.layout.width); setCh(e.nativeEvent.layout.height); }}>
      <Svg viewBox={`0 0 ${VB_W} ${VB_H}`} width="100%" height="100%">

        {/* ── Out-of-bounds surround ── */}
        <Rect x="0" y="0" width={VB_W} height={VB_H} fill={HT.surround} />

        {/* ── Court surface ── */}
        <Rect x={CIX} y={CIY} width={CIW} height={CIH} fill={HT.courtSurface} />

        {/* ── Zone tints: front (blue) above short line, back (orange) below ── */}
        <Rect x={CIX} y={CIY} width={CIW} height={SHORT_LINE_Y - CIY}
          fill={HT.frontZone} />
        <Rect x={CIX} y={SHORT_LINE_Y} width={CIW} height={CIY + CIH - SHORT_LINE_Y}
          fill={HT.backZone} />

        {/* ── Radial spotlight centred on the T — approximates arena lighting ── */}
        <Circle cx={HALF_COURT_X} cy={SHORT_LINE_Y} r={HT.spotR1} fill={HT.spotC1} />
        <Circle cx={HALF_COURT_X} cy={SHORT_LINE_Y} r={HT.spotR2} fill={HT.spotC2} />
        <Circle cx={HALF_COURT_X} cy={SHORT_LINE_Y} r={HT.spotR3} fill={HT.spotC3} />
        <Circle cx={HALF_COURT_X} cy={SHORT_LINE_Y} r={HT.spotR4} fill={HT.spotC4} />
        <Circle cx={HALF_COURT_X} cy={SHORT_LINE_Y} r={HT.spotR5} fill={HT.spotC5} />

        {/* ── Faint training grid ── */}
        {Array.from({ length: 9 }, (_, i) => (
          <Line key={`hgy${i}`}
            x1={CIX} y1={CIY + (i + 1) * gridStepY}
            x2={CIX + CIW} y2={CIY + (i + 1) * gridStepY}
            stroke={HT.gridLine} strokeWidth="1.5"
          />
        ))}
        {Array.from({ length: 4 }, (_, i) => (
          <Line key={`hgx${i}`}
            x1={CIX + (i + 1) * gridStepX} y1={CIY}
            x2={CIX + (i + 1) * gridStepX} y2={CIY + CIH}
            stroke={HT.gridLine} strokeWidth="1.5"
          />
        ))}

        <G transform={mirror}>
          {/* ── Glowing boundary — centered on court edge (CIX/CIY): glow radiates inward+outward ── */}
          <Rect x={CIX} y={CIY} width={CIW} height={CIH}
            fill="none" stroke={HT.glowOuter} strokeWidth="18" />
          <Rect x={CIX} y={CIY} width={CIW} height={CIH}
            fill="none" stroke={HT.glowInner} strokeWidth="8" />
          <Rect x={CIX} y={CIY} width={CIW} height={CIH}
            fill="none" stroke={HT.boundary} strokeWidth="3" />

          {/* ── Tin strip: bright bar across the front wall ── */}
          <Rect x={CIX} y={CIY} width={CIW} height={13}
            fill={HT.tin} opacity={0.9} />

          {/* ── Short line ── */}
          <Line x1={CIX} y1={SHORT_LINE_Y} x2={CIX + CIW} y2={SHORT_LINE_Y}
            stroke={HT.courtLine} strokeWidth="4" />

          {/* ── Half-court line ── */}
          <Line x1={HALF_COURT_X} y1={SHORT_LINE_Y} x2={HALF_COURT_X} y2={CIY + CIH}
            stroke={HT.courtLine} strokeWidth="4" />

          {/* ── Service boxes ── */}
          <Rect x={CIX} y={SHORT_LINE_Y} width={SERVICE_BOX_W} height={SERVICE_BOX_H}
            fill="rgba(255,107,53,0.04)" stroke={HT.courtLine} strokeWidth="3" />
          <Rect x={CIX + CIW - SERVICE_BOX_W} y={SHORT_LINE_Y} width={SERVICE_BOX_W} height={SERVICE_BOX_H}
            fill="rgba(255,107,53,0.04)" stroke={HT.courtLine} strokeWidth="3" />

          {/* ── T-junction glowing dot ── */}
          <Circle cx={HALF_COURT_X} cy={SHORT_LINE_Y} r={22}
            fill="rgba(255,107,53,0.18)" />
          <Circle cx={HALF_COURT_X} cy={SHORT_LINE_Y} r={10}
            fill={HT.boundary} />
        </G>

        {/* Pulse ring (SVG circle, outside mirror group) */}
        {pulseRingSvg}
      </Svg>

      {/* Player pose images — RN Images absolutely positioned over SVG */}
      {poseLayer}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});
