// ─── Position System ──────────────────────────────────────────────────────────

export type Position =
  | 'FL' | 'FR'           // Front Left / Right
  | 'ML' | 'MR'           // Mid Left / Right
  | 'BL' | 'BR'           // Back Left / Right
  | 'FMCL' | 'FMCR'      // Front Mid Court Left / Right  (10pt only)
  | 'BMCL' | 'BMCR'      // Back Mid Court Left / Right   (10pt only)
  | 'T';                  // T-Position — recovery hub

export type CourtSystem = '6pt' | '10pt';
export type CourtMode = 'glass' | 'wooden';
export type Zone = 'front' | 'mid' | 'back';

// ─── Session Configuration ────────────────────────────────────────────────────

export type CoverageMode = 'full' | 'front' | 'back' | 'forehand' | 'backhand';
export type PatternType = 'fixed' | 'random' | 'shot-based' | 'match-sim';
export type Tempo = 'slow' | 'natural' | 'explosive';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced' | 'elite' | 'pro';
export type DrillType = 'movement' | 'shot-based' | 'match-sim' | 'custom';
export type VoiceMode = 'voice+visual' | 'voice-only' | 'visual-only' | 'beep';
export type ShotGroup = 'drives' | 'lengths' | 'drops' | 'kills' | 'lobs' | 'boasts' | 'volleys' | 'deception' | 'mixed';
export type RestMode = 'auto' | 'manual' | 'none';

export type PacePreset = 'slow' | 'normal' | 'fast';

export interface PaceAdjustment {
  preset: PacePreset;
  fineSteps: number;  // -5 to +5; 0 = at preset level; positive = slower, negative = faster
}

export interface SessionConfig {
  drillType: DrillType;
  courtSystem: CourtSystem;
  coverage: CoverageMode;
  patternType: PatternType;
  tempo: Tempo;
  difficulty: Difficulty;
  duration: number;        // total session minutes (5–45)
  restMode: RestMode;
  restSeconds: number;     // manual rest duration per set
  voiceMode: VoiceMode;
  shotGroups: ShotGroup[];
  dominantHand: DominantHand;
  voiceGender: VoiceGender;
  language: Language;
  paceAdjustment?: PaceAdjustment;  // pre-session pace setting; undefined = use Normal preset
}

// ─── Active Session Runtime ───────────────────────────────────────────────────

export type SessionState =
  | 'idle'
  | 'countdown'
  | 'active'
  | 'rest'
  | 'paused'
  | 'complete'
  | 'abandoned';

export interface ActiveSession {
  sessionId: string;
  state: SessionState;
  config: SessionConfig;
  currentPosition: Position | null;
  nextPosition: Position | null;
  currentShot: string | null;
  nextShot?: string | null;
  repCount: number;
  setIndex: number;           // which rest-period cycle we're on
  moveIndex: number;          // move within current set
  workSecsRemaining: number;
  restSecsRemaining: number;
  countdownValue: number;     // 3 → 2 → 1
  totalMovementsPlanned: number;
  startedAt: number;          // Date.now() timestamp
  elapsedSeconds: number;
  livePaceStep: number;       // 0–6: index into PACE_STEPS_MS; 3 = Normal
}

export interface SessionCheckpoint {
  sessionId: string;
  config: SessionConfig;
  setIndex: number;
  moveIndex: number;
  movementsCompleted: number;
  elapsedSeconds: number;
  savedAt: string;            // ISO timestamp
}

// ─── Saved Session Record (SQLite) ────────────────────────────────────────────

export interface SessionRecord {
  id: string;
  drillType: DrillType;
  courtSystem: CourtSystem;
  tempo: Tempo;
  difficulty: Difficulty;
  durationSeconds: number;
  movementsTotal: number;
  movementsPlanned: number;
  completionPct: number;
  intensityScore: number;
  zoneFrontPct: number;
  zoneMidPct: number;
  zoneBackPct: number;
  startedAt: string;
  endedAt: string;
  synced: boolean;
}

export interface MovementRecord {
  sessionId: string;
  position: Position;
  shot: string | null;
  timestampOffsetMs: number;
  setIndex: number;
}

// ─── User Profile ─────────────────────────────────────────────────────────────

export type DominantHand = 'left' | 'right';
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'elite' | 'pro';
export type VoiceGender = 'male' | 'female';
export type VoiceStyle = 'calm' | 'friendly' | 'energetic' | 'professional';
export type TrainingGoal = 'fitness' | 'footwork' | 'match-prep' | 'speed' | 'agility';
export type Language = 'en-US' | 'en-GB' | 'es' | 'fr' | 'de' | 'hi' | 'ar' | 'zh' | 'ja' | 'ko' | 'it' | 'nl' | 'pt' | 'he' | 'sw' | 'qu' | 'ha';

export interface UserProfile {
  id: string;
  name: string;
  age: number | null;
  dobDay: string;
  dobMonth: string;
  dobYear: string;
  gender: string | null;
  photoUri: string | null;
  dominantHand: DominantHand;
  skillLevel: SkillLevel;
  trainingGoal: TrainingGoal;
  voiceGender: VoiceGender;
  voiceStyle: VoiceStyle;
  language: Language;
  isGuest: boolean;
  createdAt: string;
}

// ─── Programs ─────────────────────────────────────────────────────────────────

export interface Program {
  id: string;
  name: string;
  description: string;
  level: SkillLevel | 'custom' | 'all';
  config: SessionConfig;
  isBuiltin: boolean;
  estimatedMinutes: number;
  tags: string[];
}

// ─── Progress & Analytics ─────────────────────────────────────────────────────

export interface ZoneDistribution {
  front: number;    // 0-100 percentage
  mid: number;
  back: number;
}

export interface PersonalBest {
  drillType: DrillType;
  metric: 'movements' | 'completion' | 'intensity';
  value: number;
  sessionId: string;
  achievedAt: string;
}

export interface WeeklyActivity {
  date: string;     // ISO date string
  movements: number;
  intensity: number;
}

export interface ProgressStats {
  totalSessions: number;
  totalMovements: number;
  totalMinutes: number;
  currentStreak: number;
  longestStreak: number;
  weeklyActivity: WeeklyActivity[];
  zoneDistribution: ZoneDistribution;
  personalBests: PersonalBest[];
  lastSessionAt: string | null;
}

// ─── Shot System ──────────────────────────────────────────────────────────────

export type ShotWeight = 'primary' | 'secondary' | 'advanced';

export interface ShotEntry {
  name: string;
  voiceText: string;       // spoken in the voice call
  weight: ShotWeight;
  groups: ShotGroup[];
}

// ─── Position Info ────────────────────────────────────────────────────────────

export interface PositionInfo {
  code: Position;
  label: string;           // full spoken label e.g. "Front Left"
  shortLabel: string;      // display label e.g. "FL"
  zone: Zone;
  x: number;               // meters from court center (negative = left)
  z: number;               // meters from front wall
  courtSystems: CourtSystem[];
}

// ─── Navigation ───────────────────────────────────────────────────────────────

export type RootTabParamList = {
  Train: undefined;
  Routines: undefined;
  Progress: undefined;
  Library: undefined;
  Settings: undefined;
};
