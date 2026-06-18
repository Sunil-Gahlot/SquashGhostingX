import { Program, SessionConfig, SkillLevel } from '../types';

// Default values overridden at session start from UserProfile
const base: Pick<SessionConfig, 'dominantHand' | 'voiceGender' | 'language' | 'restMode' | 'restSeconds'> = {
  dominantHand: 'right',
  voiceGender: 'female',
  language: 'en-US',
  restMode: 'auto',
  restSeconds: 0,
};

export const BUILTIN_PROGRAMS: Program[] = [
  // ─── Beginner ─────────────────────────────────────────────────────────────
  {
    id: 'warm-up',
    name: 'Warm Up',
    description: 'Easy 5-min movement to prepare your body and mind.',
    level: 'beginner', estimatedMinutes: 5, isBuiltin: true,
    tags: ['warm-up', 'beginner'],
    config: { ...base, drillType: 'movement', courtSystem: '6pt', coverage: 'full', patternType: 'fixed', tempo: 'slow', difficulty: 'beginner', duration: 5, voiceMode: 'voice+visual', shotGroups: ['mixed'] },
  },
  {
    id: 'first-steps',
    name: 'First Steps',
    description: 'Front corners (FL & FR) at a forgiving pace. Learn your first two positions.',
    level: 'beginner', estimatedMinutes: 8, isBuiltin: true,
    tags: ['beginner', 'footwork'],
    config: { ...base, drillType: 'movement', courtSystem: '6pt', coverage: 'front', patternType: 'fixed', tempo: 'slow', difficulty: 'beginner', duration: 8, voiceMode: 'voice+visual', shotGroups: ['mixed'] },
  },
  {
    id: 'finding-the-t',
    name: 'Finding the T',
    description: 'All 6 positions. Focus on T recovery every rep.',
    level: 'beginner', estimatedMinutes: 10, isBuiltin: true,
    tags: ['beginner', 'footwork'],
    config: { ...base, drillType: 'movement', courtSystem: '6pt', coverage: 'full', patternType: 'random', tempo: 'slow', difficulty: 'beginner', duration: 10, voiceMode: 'voice+visual', shotGroups: ['mixed'] },
  },
  {
    id: 'steady-pace',
    name: 'Steady Pace',
    description: '6-point random ghosting at a comfortable natural tempo.',
    level: 'beginner', estimatedMinutes: 12, isBuiltin: true,
    tags: ['beginner', 'cardio'],
    config: { ...base, drillType: 'movement', courtSystem: '6pt', coverage: 'full', patternType: 'random', tempo: 'natural', difficulty: 'beginner', duration: 12, voiceMode: 'voice+visual', shotGroups: ['mixed'] },
  },

  // ─── Intermediate ─────────────────────────────────────────────────────────
  {
    id: 'court-coverage',
    name: 'Court Coverage',
    description: 'Continuous 6-point ghosting at match pace.',
    level: 'intermediate', estimatedMinutes: 15, isBuiltin: true,
    tags: ['intermediate', 'fitness', 'footwork'],
    config: { ...base, drillType: 'movement', courtSystem: '6pt', coverage: 'full', patternType: 'random', tempo: 'natural', difficulty: 'intermediate', duration: 15, voiceMode: 'voice+visual', shotGroups: ['mixed'] },
  },
  {
    id: 'drop-and-drive',
    name: 'Drop & Drive',
    description: 'Shot-based drill: drops from front, drives from back.',
    level: 'intermediate', estimatedMinutes: 12, isBuiltin: true,
    tags: ['intermediate', 'shot-based', 'tactics'],
    config: { ...base, drillType: 'shot-based', courtSystem: '6pt', coverage: 'full', patternType: 'shot-based', tempo: 'natural', difficulty: 'intermediate', duration: 12, voiceMode: 'voice+visual', shotGroups: ['drops', 'drives'] },
  },
  {
    id: 'cross-court-pattern',
    name: 'Cross Court Pattern',
    description: 'Fixed sequence across all 6 positions. Build consistency and court range.',
    level: 'intermediate', estimatedMinutes: 12, isBuiltin: true,
    tags: ['intermediate', 'pattern', 'diagonal'],
    config: { ...base, drillType: 'movement', courtSystem: '6pt', coverage: 'full', patternType: 'fixed', tempo: 'natural', difficulty: 'intermediate', duration: 12, voiceMode: 'voice+visual', shotGroups: ['mixed'] },
  },
  {
    id: 'front-court-focus',
    name: 'Front Court Focus',
    description: 'Front and mid positions only. Fast feet, low body.',
    level: 'intermediate', estimatedMinutes: 10, isBuiltin: true,
    tags: ['intermediate', 'front-court'],
    config: { ...base, drillType: 'movement', courtSystem: '6pt', coverage: 'front', patternType: 'random', tempo: 'natural', difficulty: 'intermediate', duration: 10, voiceMode: 'voice+visual', shotGroups: ['mixed'] },
  },
  {
    id: 'back-court-power',
    name: 'Back Court Power',
    description: 'Back and mid positions. Build leg strength and drive length.',
    level: 'intermediate', estimatedMinutes: 10, isBuiltin: true,
    tags: ['intermediate', 'back-court', 'strength'],
    config: { ...base, drillType: 'movement', courtSystem: '6pt', coverage: 'back', patternType: 'random', tempo: 'natural', difficulty: 'intermediate', duration: 10, voiceMode: 'voice+visual', shotGroups: ['mixed'] },
  },

  // ─── Advanced ─────────────────────────────────────────────────────────────
  {
    id: 'ghost-master',
    name: 'Ghost Master',
    description: '10-point court, explosive tempo. Maximum court coverage.',
    level: 'advanced', estimatedMinutes: 20, isBuiltin: true,
    tags: ['advanced', '10pt', 'explosive'],
    config: { ...base, drillType: 'movement', courtSystem: '10pt', coverage: 'full', patternType: 'random', tempo: 'explosive', difficulty: 'advanced', duration: 20, voiceMode: 'voice+visual', shotGroups: ['mixed'] },
  },
  {
    id: 'full-court-shots',
    name: 'Full Court Shot Drill',
    description: 'All positions, full shot library. Think and move.',
    level: 'advanced', estimatedMinutes: 15, isBuiltin: true,
    tags: ['advanced', 'shot-based'],
    config: { ...base, drillType: 'shot-based', courtSystem: '6pt', coverage: 'full', patternType: 'shot-based', tempo: 'natural', difficulty: 'advanced', duration: 15, voiceMode: 'voice+visual', shotGroups: ['mixed'] },
  },
  {
    id: 'psa-speed',
    name: 'PSA Speed',
    description: '6-point at pro tempo. Race the clock.',
    level: 'advanced', estimatedMinutes: 15, isBuiltin: true,
    tags: ['advanced', 'speed', 'explosive'],
    config: { ...base, drillType: 'movement', courtSystem: '6pt', coverage: 'full', patternType: 'random', tempo: 'explosive', difficulty: 'advanced', duration: 15, voiceMode: 'voice+visual', shotGroups: ['mixed'] },
  },

  // ─── Pro ──────────────────────────────────────────────────────────────────
  {
    id: 'full-court-blitz',
    name: 'Full Court Blitz',
    description: '10-point court at maximum explosive pace. Every corner, zero rest between reps.',
    level: 'pro', estimatedMinutes: 25, isBuiltin: true,
    tags: ['pro', '10pt', 'explosive', 'endurance'],
    config: { ...base, drillType: 'movement', courtSystem: '10pt', coverage: 'full', patternType: 'random', tempo: 'explosive', difficulty: 'pro', duration: 25, voiceMode: 'voice+visual', shotGroups: ['mixed'] },
  },
  {
    id: 'psa-match-sim',
    name: 'PSA Match Sim',
    description: 'Rally-length sequences on a 10-point court simulating pro match conditions.',
    level: 'pro', estimatedMinutes: 25, isBuiltin: true,
    tags: ['pro', 'match-sim', '10pt', 'tactical'],
    config: { ...base, drillType: 'match-sim', courtSystem: '10pt', coverage: 'full', patternType: 'match-sim', tempo: 'natural', difficulty: 'pro', duration: 25, voiceMode: 'voice+visual', shotGroups: ['mixed'] },
  },
  {
    id: 'precision-and-power',
    name: 'Precision & Power',
    description: 'Explosive shot-based drill across all 10 positions. Think fast, move faster.',
    level: 'pro', estimatedMinutes: 20, isBuiltin: true,
    tags: ['pro', 'shot-based', '10pt', 'explosive'],
    config: { ...base, drillType: 'shot-based', courtSystem: '10pt', coverage: 'full', patternType: 'shot-based', tempo: 'explosive', difficulty: 'pro', duration: 20, voiceMode: 'voice+visual', shotGroups: ['mixed'] },
  },
  {
    id: 'maximum-intensity',
    name: 'Maximum Intensity',
    description: '30 minutes continuous at explosive pace. No mercy — pure sustained output.',
    level: 'pro', estimatedMinutes: 30, isBuiltin: true,
    tags: ['pro', 'explosive', 'endurance', 'no-rest'],
    config: { ...base, drillType: 'movement', courtSystem: '6pt', coverage: 'full', patternType: 'random', tempo: 'explosive', difficulty: 'pro', duration: 30, restMode: 'none', restSeconds: 0, voiceMode: 'voice+visual', shotGroups: ['mixed'] },
  },
  {
    id: 'total-court-mastery',
    name: 'Total Court Mastery',
    description: 'Full 10-point court with complete shot library at explosive tempo. The ultimate test.',
    level: 'pro', estimatedMinutes: 30, isBuiltin: true,
    tags: ['pro', 'shot-based', '10pt', 'explosive', 'mastery'],
    config: { ...base, drillType: 'shot-based', courtSystem: '10pt', coverage: 'full', patternType: 'shot-based', tempo: 'explosive', difficulty: 'pro', duration: 30, voiceMode: 'voice+visual', shotGroups: ['mixed'] },
  },

  // ─── Elite ────────────────────────────────────────────────────────────────
  {
    id: 'match-simulation',
    name: 'Match Simulation',
    description: 'Rally-like 10-point sequences. Pressure and unpredictability.',
    level: 'elite', estimatedMinutes: 20, isBuiltin: true,
    tags: ['elite', 'match-sim', '10pt'],
    config: { ...base, drillType: 'match-sim', courtSystem: '10pt', coverage: 'full', patternType: 'match-sim', tempo: 'natural', difficulty: 'elite', duration: 20, voiceMode: 'voice+visual', shotGroups: ['mixed'] },
  },
  {
    id: 'no-rest',
    name: 'No Rest',
    description: '5 minutes continuous. No rest. Pure endurance.',
    level: 'elite', estimatedMinutes: 5, isBuiltin: true,
    tags: ['elite', 'endurance', 'no-rest'],
    config: { ...base, drillType: 'movement', courtSystem: '6pt', coverage: 'full', patternType: 'random', tempo: 'natural', difficulty: 'elite', duration: 5, restMode: 'none', restSeconds: 0, voiceMode: 'voice+visual', shotGroups: ['mixed'] },
  },
  {
    id: 'cool-down',
    name: 'Cool Down',
    description: 'Slow-paced movement to recover after hard training.',
    level: 'beginner', estimatedMinutes: 5, isBuiltin: true,
    tags: ['cool-down', 'recovery'],
    config: { ...base, drillType: 'movement', courtSystem: '6pt', coverage: 'full', patternType: 'fixed', tempo: 'slow', difficulty: 'beginner', duration: 5, voiceMode: 'voice+visual', shotGroups: ['mixed'] },
  },
];

export function getProgramsByLevel(level: string): Program[] {
  return BUILTIN_PROGRAMS.filter((p) => p.level === level);
}

export function getProgramById(id: string): Program | undefined {
  return BUILTIN_PROGRAMS.find((p) => p.id === id);
}

/**
 * Returns the best drill for today based on:
 * 1. Zone weakness (back/front underworked) — needs ≥5 sessions of data
 * 2. Variety (avoids repeating the last drill type)
 * 3. Skill-level match as a fallback
 */
export function getSuggestedDrill(
  zoneDistribution: { front: number; mid: number; back: number },
  totalSessions: number,
  lastDrillType: string | null,
  skillLevel: SkillLevel,
): { program: Program; reason: string } {
  if (totalSessions >= 5) {
    if (zoneDistribution.back < 25) {
      const drill = (skillLevel === 'advanced' || skillLevel === 'elite' || skillLevel === 'pro')
        ? getProgramById('ghost-master')
        : getProgramById('back-court-power');
      if (drill) return { program: drill, reason: 'Your back court needs work' };
    }
    if (zoneDistribution.front < 25) {
      const drill = getProgramById('front-court-focus');
      if (drill) return { program: drill, reason: 'Strengthen your front court' };
    }
  }

  const levelPrograms = BUILTIN_PROGRAMS.filter((p) => p.level === skillLevel);
  const varied = levelPrograms.filter((p) => p.config.drillType !== lastDrillType);
  const pool = varied.length > 0 ? varied : levelPrograms;

  if (pool.length > 0) {
    const pick = pool[Math.floor(Math.random() * pool.length)];
    return { program: pick, reason: totalSessions === 0 ? 'Start here' : 'Matched to your level' };
  }

  return {
    program: BUILTIN_PROGRAMS.find((p) => p.id === 'court-coverage') ?? BUILTIN_PROGRAMS[0],
    reason: 'Your daily ghosting session',
  };
}
