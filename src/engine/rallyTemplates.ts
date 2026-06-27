import { Position } from '../types';

// ─── Rally Template Library ───────────────────────────────────────────────────
// 200+ realistic match-rally templates for match-simulation ghosting.
// Each template is a sequence of { position, shot } pairs that together
// represent a realistic squash rally pattern a player would encounter in a match.
//
// Shot names match positionShotMatrix.ts voiceText values exactly.
// Templates are categorised by rally type for balanced selection.

export type RallyCategory =
  | 'drive-drop'      // Length drive → front-court drop exchanges
  | 'boast-drive'     // Boast from back corner → drive recovery
  | 'length'          // Back-court length grinding
  | 'volley'          // Volley interception patterns
  | 'front-court'     // Front-court tight exchange
  | 'pressure'        // Multi-shot pressure sequences
  | 'defensive'       // Lob / retrieve patterns
  | 'match-sim'       // Mixed realistic rally patterns
  | 'extended'        // 10-point court patterns

export interface RallyStep {
  position: Position;
  shot: string | null;
}

export interface RallyTemplate {
  name: string;
  category: RallyCategory;
  steps: RallyStep[];
  requires10pt?: boolean;
  minDifficulty?: 'intermediate' | 'advanced' | 'elite';
}

// Shorthand builder
function R(position: Position, shot: string | null): RallyStep {
  return { position, shot };
}

export const RALLY_TEMPLATES: RallyTemplate[] = [

  // ══════════════════════════════════════════════════════════════════════════
  // DRIVE-DROP RALLIES (30)
  // ══════════════════════════════════════════════════════════════════════════

  { name: 'DD-01', category: 'drive-drop', steps: [R('BR','straight drive'),    R('FR','straight drop'),    R('BL','straight drive'),    R('FL','straight drop')] },
  { name: 'DD-02', category: 'drive-drop', steps: [R('BL','straight drive'),    R('FL','straight drop'),    R('BR','straight drive'),    R('FR','straight drop')] },
  { name: 'DD-03', category: 'drive-drop', steps: [R('BR','crosscourt drive'),  R('FL','straight drop'),    R('BL','crosscourt drive'),  R('FR','straight drop')] },
  { name: 'DD-04', category: 'drive-drop', steps: [R('BL','crosscourt drive'),  R('FR','straight drop'),    R('BR','crosscourt drive'),  R('FL','straight drop')] },
  { name: 'DD-05', category: 'drive-drop', steps: [R('BR','straight drive'),    R('FR','crosscourt drop'),  R('BL','crosscourt drive'),  R('FL','straight drop')] },
  { name: 'DD-06', category: 'drive-drop', steps: [R('BR','hard length'),       R('FR','straight drop'),    R('BL','hard length'),       R('FL','straight drop')] },
  { name: 'DD-07', category: 'drive-drop', steps: [R('BR','straight drive'),    R('FR','straight drop'),    R('BR','straight drive'),    R('FL','straight drop')] },
  { name: 'DD-08', category: 'drive-drop', steps: [R('BR','straight drive'),    R('FL','crosscourt drop'),  R('BR','straight drive'),    R('FL','straight drop')] },
  { name: 'DD-09', category: 'drive-drop', steps: [R('BR','straight drive'),    R('MR','straight drive'),   R('BL','straight drive'),    R('FL','straight drop')] },
  { name: 'DD-10', category: 'drive-drop', steps: [R('BR','hard length'),       R('FR','counter drop'),     R('BL','hard length'),       R('FL','counter drop')] },
  { name: 'DD-11', category: 'drive-drop', steps: [R('BR','straight drive'),    R('FR','straight drop'),    R('MR','straight drive'),    R('FL','straight drop')] },
  { name: 'DD-12', category: 'drive-drop', steps: [R('BL','hard length'),       R('FL','straight drop'),    R('BR','hard length'),       R('FR','straight drop')] },
  { name: 'DD-13', category: 'drive-drop', steps: [R('BR','crosscourt drive'),  R('FL','straight drop'),    R('MR','crosscourt drive'),  R('FR','straight drop')] },
  { name: 'DD-14', category: 'drive-drop', steps: [R('BR','hard length'),       R('MR','straight drop'),    R('BL','hard length'),       R('ML','straight drop')] },
  { name: 'DD-15', category: 'drive-drop', steps: [R('BR','straight drive'),    R('FR','straight kill'),    R('BL','straight drive'),    R('FL','straight kill')] },
  { name: 'DD-16', category: 'drive-drop', steps: [R('BR','straight drive'),    R('FR','straight drop'),    R('BL','straight drive'),    R('FR','straight drop')] },
  { name: 'DD-17', category: 'drive-drop', steps: [R('BL','straight drive'),    R('FL','straight drop'),    R('BR','straight drive'),    R('FL','crosscourt drop')] },
  { name: 'DD-18', category: 'drive-drop', steps: [R('BR','crosscourt drive'),  R('FL','crosscourt drop'),  R('BL','crosscourt drive'),  R('FR','crosscourt drop')] },
  { name: 'DD-19', category: 'drive-drop', steps: [R('MR','straight drive'),    R('FL','straight drop'),    R('ML','straight drive'),    R('FR','straight drop')] },
  { name: 'DD-20', category: 'drive-drop', steps: [R('BR','straight drive'),    R('FR','straight drop'),    R('T', 'volley drive'),      R('BL','straight drive')] },
  { name: 'DD-21', category: 'drive-drop', steps: [R('BL','straight drive'),    R('FL','straight drop'),    R('T', 'volley drop'),       R('BR','straight drive')] },
  { name: 'DD-22', category: 'drive-drop', steps: [R('BR','hard length'),       R('FR','counter drop'),     R('ML','straight drive'),    R('FL','straight drop')] },
  { name: 'DD-23', category: 'drive-drop', steps: [R('BL','hard length'),       R('FL','counter drop'),     R('MR','straight drive'),    R('FR','straight drop')] },
  { name: 'DD-24', category: 'drive-drop', steps: [R('BR','straight drive'),    R('MR','straight drive'),   R('FR','straight drop'),     R('BL','crosscourt drive')] },
  { name: 'DD-25', category: 'drive-drop', steps: [R('BL','straight drive'),    R('ML','straight drive'),   R('FL','straight drop'),     R('BR','crosscourt drive')] },
  { name: 'DD-26', category: 'drive-drop', steps: [R('BR','straight drive'),    R('FR','straight drop'),    R('BR','straight drive'),    R('FR','straight drop')] },
  { name: 'DD-27', category: 'drive-drop', steps: [R('BL','straight drive'),    R('FL','straight drop'),    R('BL','straight drive'),    R('FL','straight drop')] },
  { name: 'DD-28', category: 'drive-drop', steps: [R('BR','hard length'),       R('FR','straight drop'),    R('ML','crosscourt drive'),  R('FR','crosscourt drop')] },
  { name: 'DD-29', category: 'drive-drop', steps: [R('BL','hard length'),       R('FL','straight drop'),    R('MR','crosscourt drive'),  R('FL','crosscourt drop')] },
  { name: 'DD-30', category: 'drive-drop', steps: [R('MR','hard length'),       R('BL','straight drive'),   R('ML','hard length'),       R('BR','straight drive')] },

  // ══════════════════════════════════════════════════════════════════════════
  // BOAST-DRIVE RALLIES (25)
  // ══════════════════════════════════════════════════════════════════════════

  { name: 'BD-01', category: 'boast-drive', steps: [R('BL','defensive boast'),  R('FR','straight drive'),    R('BR','defensive boast'),  R('FL','straight drive')] },
  { name: 'BD-02', category: 'boast-drive', steps: [R('BR','defensive boast'),  R('FL','straight drive'),    R('BL','defensive boast'),  R('FR','straight drive')] },
  { name: 'BD-03', category: 'boast-drive', steps: [R('BL','defensive boast'),  R('FR','straight drop'),     R('BR','defensive boast'),  R('FL','straight drop')] },
  { name: 'BD-04', category: 'boast-drive', steps: [R('BR','defensive boast'),  R('FL','straight drop'),     R('BL','defensive boast'),  R('FR','straight drop')] },
  { name: 'BD-05', category: 'boast-drive', steps: [R('BL','attacking boast'),  R('FR','straight drive'),    R('BR','attacking boast'),  R('FL','straight drive')] },
  { name: 'BD-06', category: 'boast-drive', steps: [R('BL','defensive boast'),  R('FR','crosscourt drive'),  R('BL','straight drive'),   R('FR','straight drop')] },
  { name: 'BD-07', category: 'boast-drive', steps: [R('BR','defensive boast'),  R('FL','crosscourt drive'),  R('BR','straight drive'),   R('FL','straight drop')] },
  { name: 'BD-08', category: 'boast-drive', steps: [R('BL','defensive boast'),  R('FR','straight drive'),    R('BL','straight drive'),   R('FL','straight drop')] },
  { name: 'BD-09', category: 'boast-drive', steps: [R('BR','defensive boast'),  R('FL','straight drive'),    R('BR','straight drive'),   R('FR','straight drop')] },
  { name: 'BD-10', category: 'boast-drive', steps: [R('ML','attacking boast'),  R('FR','straight drive'),    R('BL','defensive boast'),  R('FR','straight drive')] },
  { name: 'BD-11', category: 'boast-drive', steps: [R('MR','attacking boast'),  R('FL','straight drive'),    R('BR','defensive boast'),  R('FL','straight drive')] },
  { name: 'BD-12', category: 'boast-drive', steps: [R('BL','defensive boast'),  R('FR','straight drive'),    R('ML','crosscourt drive'),  R('BR','defensive boast')] },
  { name: 'BD-13', category: 'boast-drive', steps: [R('BR','defensive boast'),  R('FL','straight drive'),    R('MR','crosscourt drive'),  R('BL','defensive boast')] },
  { name: 'BD-14', category: 'boast-drive', steps: [R('BL','defensive boast'),  R('MR','straight drive'),    R('BL','attacking boast'),  R('FL','straight drive')] },
  { name: 'BD-15', category: 'boast-drive', steps: [R('BR','defensive boast'),  R('ML','straight drive'),    R('BR','attacking boast'),  R('FR','straight drive')] },
  { name: 'BD-16', category: 'boast-drive', steps: [R('BL','defensive boast'),  R('FR','volley drive'),      R('BL','straight drive'),   R('FL','straight drop')] },
  { name: 'BD-17', category: 'boast-drive', steps: [R('BR','defensive boast'),  R('FL','volley drive'),      R('BR','straight drive'),   R('FR','straight drop')] },
  { name: 'BD-18', category: 'boast-drive', steps: [R('BL','defensive boast'),  R('FR','straight drive'),    R('BL','defensive boast'),  R('FR','straight drive')] },
  { name: 'BD-19', category: 'boast-drive', steps: [R('BL','defensive boast'),  R('FR','straight drop'),     R('ML','straight drive'),   R('BR','defensive boast')] },
  { name: 'BD-20', category: 'boast-drive', steps: [R('BR','defensive boast'),  R('FL','straight drop'),     R('MR','straight drive'),   R('BL','defensive boast')] },
  { name: 'BD-21', category: 'boast-drive', steps: [R('BL','working length'),   R('FR','straight drive'),    R('BR','defensive boast'),  R('FL','straight drop')] },
  { name: 'BD-22', category: 'boast-drive', steps: [R('BR','working length'),   R('FL','straight drive'),    R('BL','defensive boast'),  R('FR','straight drop')] },
  { name: 'BD-23', category: 'boast-drive', steps: [R('BL','defensive boast'),  R('FR','straight drive'),    R('T', 'volley drive'),     R('BL','defensive boast')] },
  { name: 'BD-24', category: 'boast-drive', steps: [R('BR','defensive boast'),  R('FL','straight drive'),    R('T', 'volley drive'),     R('BR','defensive boast')] },
  { name: 'BD-25', category: 'boast-drive', steps: [R('BL','defensive boast'),  R('FR','straight drop'),     R('T', 'volley drop'),      R('BR','defensive boast')] },

  // ══════════════════════════════════════════════════════════════════════════
  // LENGTH RALLIES (20)
  // ══════════════════════════════════════════════════════════════════════════

  { name: 'LN-01', category: 'length', steps: [R('BR','straight drive'),   R('BL','straight drive'),   R('BR','hard length'),      R('BL','hard length')] },
  { name: 'LN-02', category: 'length', steps: [R('BL','straight drive'),   R('BR','straight drive'),   R('BL','hard length'),      R('BR','hard length')] },
  { name: 'LN-03', category: 'length', steps: [R('BR','hard length'),      R('BL','hard length'),      R('MR','straight drive'),   R('ML','straight drive')] },
  { name: 'LN-04', category: 'length', steps: [R('MR','straight drive'),   R('ML','straight drive'),   R('BR','hard length'),      R('BL','hard length')] },
  { name: 'LN-05', category: 'length', steps: [R('BR','crosscourt drive'), R('BL','crosscourt drive'), R('BR','straight drive'),   R('BL','straight drive')] },
  { name: 'LN-06', category: 'length', steps: [R('BR','straight drive'),   R('MR','straight drive'),   R('BL','straight drive'),   R('ML','straight drive')] },
  { name: 'LN-07', category: 'length', steps: [R('BL','hard length'),      R('BR','hard length'),      R('FL','straight drop'),    R('FR','straight drop')] },
  { name: 'LN-08', category: 'length', steps: [R('BR','hard length'),      R('BL','crosscourt drive'), R('BR','crosscourt drive'), R('BL','hard length')] },
  { name: 'LN-09', category: 'length', steps: [R('MR','crosscourt drive'), R('BL','hard length'),      R('ML','crosscourt drive'), R('BR','hard length')] },
  { name: 'LN-10', category: 'length', steps: [R('BR','straight drive'),   R('BL','straight drive'),   R('FR','straight drop'),    R('FL','straight drop')] },
  { name: 'LN-11', category: 'length', steps: [R('BR','working length'),   R('BL','working length'),   R('MR','straight drive'),   R('ML','straight drive')] },
  { name: 'LN-12', category: 'length', steps: [R('MR','hard length'),      R('ML','hard length'),      R('BR','crosscourt drive'), R('BL','crosscourt drive')] },
  { name: 'LN-13', category: 'length', steps: [R('BR','straight drive'),   R('T', 'volley drive'),     R('BL','straight drive'),   R('T', 'volley drive')] },
  { name: 'LN-14', category: 'length', steps: [R('BL','straight drive'),   R('T', 'volley drive'),     R('BR','straight drive'),   R('T', 'volley drive')] },
  { name: 'LN-15', category: 'length', steps: [R('BR','hard length'),      R('FR','straight drop'),    R('ML','crosscourt drive'), R('BR','hard length')] },
  { name: 'LN-16', category: 'length', steps: [R('BL','hard length'),      R('FL','straight drop'),    R('MR','crosscourt drive'), R('BL','hard length')] },
  { name: 'LN-17', category: 'length', steps: [R('MR','straight drive'),   R('BL','straight drive'),   R('ML','crosscourt drive'), R('BR','straight drive')] },
  { name: 'LN-18', category: 'length', steps: [R('ML','straight drive'),   R('BR','straight drive'),   R('MR','crosscourt drive'), R('BL','straight drive')] },
  { name: 'LN-19', category: 'length', steps: [R('BR','straight drive'),   R('FR','straight drop'),    R('BR','crosscourt drive'), R('FL','straight drop')] },
  { name: 'LN-20', category: 'length', steps: [R('BL','straight drive'),   R('FL','straight drop'),    R('BL','crosscourt drive'), R('FR','straight drop')] },

  // ══════════════════════════════════════════════════════════════════════════
  // VOLLEY RALLIES (20)
  // ══════════════════════════════════════════════════════════════════════════

  { name: 'VL-01', category: 'volley', steps: [R('T', 'volley drive'),     R('BR','hard length'),       R('T', 'volley drive'),     R('BL','hard length')] },
  { name: 'VL-02', category: 'volley', steps: [R('T', 'volley drop'),      R('FL','straight drive'),    R('T', 'volley drop'),      R('FR','straight drive')] },
  { name: 'VL-03', category: 'volley', steps: [R('T', 'volley drive'),     R('BL','straight drive'),    R('T', 'volley drop'),      R('FR','straight drop')] },
  { name: 'VL-04', category: 'volley', steps: [R('MR','volley drive'),     R('BL','straight drive'),    R('ML','volley drive'),     R('BR','straight drive')], minDifficulty: 'intermediate' },
  { name: 'VL-05', category: 'volley', steps: [R('T', 'volley drive'),     R('BR','hard length'),       R('T', 'volley drop'),      R('FL','straight drive')] },
  { name: 'VL-06', category: 'volley', steps: [R('T', 'volley drive'),     R('BL','defensive boast'),   R('T', 'volley crosscourt'), R('BR','hard length')] },
  { name: 'VL-07', category: 'volley', steps: [R('T', 'volley drive'),     R('BL','straight drive'),    R('T', 'volley crosscourt'), R('BR','straight drive')] },
  { name: 'VL-08', category: 'volley', steps: [R('T', 'volley drop'),      R('MR','straight drive'),    R('T', 'volley drive'),     R('ML','straight drive')] },
  { name: 'VL-09', category: 'volley', steps: [R('ML','volley drop'),      R('MR','straight drive'),    R('MR','volley drop'),      R('ML','straight drive')], minDifficulty: 'intermediate' },
  { name: 'VL-10', category: 'volley', steps: [R('T', 'volley drive'),     R('BR','straight drive'),    R('FR','straight drop'),    R('T', 'volley drive')] },
  { name: 'VL-11', category: 'volley', steps: [R('T', 'volley drive'),     R('BR','defensive boast'),   R('FL','straight drive'),   R('T', 'volley drop')] },
  { name: 'VL-12', category: 'volley', steps: [R('MR','volley drive'),     R('BL','straight drive'),    R('ML','volley drop'),      R('BR','straight drive')], minDifficulty: 'intermediate' },
  { name: 'VL-13', category: 'volley', steps: [R('T', 'volley kill'),      R('FL','straight drive'),    R('T', 'volley drop'),      R('FR','straight drive')], minDifficulty: 'advanced' },
  { name: 'VL-14', category: 'volley', steps: [R('T', 'volley drive'),     R('BR','hard length'),       R('T', 'volley crosscourt'), R('BL','hard length')] },
  { name: 'VL-15', category: 'volley', steps: [R('T', 'volley drop'),      R('BR','straight drive'),    R('T', 'volley drop'),      R('BL','straight drive')] },
  { name: 'VL-16', category: 'volley', steps: [R('T', 'volley drive'),     R('BR','straight drive'),    R('T', 'volley drop'),      R('FL','straight drive')] },
  { name: 'VL-17', category: 'volley', steps: [R('T', 'volley drive'),     R('BL','straight drive'),    R('FR','straight drop'),    R('T', 'volley crosscourt')] },
  { name: 'VL-18', category: 'volley', steps: [R('MR','volley drive'),     R('BL','hard length'),       R('ML','volley drive'),     R('BR','hard length')], minDifficulty: 'intermediate' },
  { name: 'VL-19', category: 'volley', steps: [R('T', 'volley drive'),     R('BR','hard length'),       R('ML','volley drive'),     R('BR','straight drive')] },
  { name: 'VL-20', category: 'volley', steps: [R('T', 'volley crosscourt'), R('BL','straight drive'),   R('T', 'volley drive'),     R('BR','crosscourt drive')] },

  // ══════════════════════════════════════════════════════════════════════════
  // FRONT-COURT RALLIES (15)
  // ══════════════════════════════════════════════════════════════════════════

  { name: 'FC-01', category: 'front-court', steps: [R('FL','straight drop'),   R('FR','crosscourt drop'),  R('FL','counter drop'),     R('FR','straight drop')] },
  { name: 'FC-02', category: 'front-court', steps: [R('FR','straight drop'),   R('FL','crosscourt drop'),  R('FR','counter drop'),     R('FL','straight drop')] },
  { name: 'FC-03', category: 'front-court', steps: [R('FL','straight drop'),   R('MR','straight drive'),   R('FR','straight drop'),    R('ML','straight drive')] },
  { name: 'FC-04', category: 'front-court', steps: [R('FR','straight drop'),   R('ML','straight drive'),   R('FL','straight drop'),    R('MR','straight drive')] },
  { name: 'FC-05', category: 'front-court', steps: [R('FL','straight drop'),   R('FR','straight drop'),    R('BR','straight drive'),   R('FL','straight drop')] },
  { name: 'FC-06', category: 'front-court', steps: [R('FR','straight kill'),   R('FL','straight drop'),    R('FR','counter drop'),     R('FL','straight kill')] },
  { name: 'FC-07', category: 'front-court', steps: [R('FL','straight kill'),   R('FR','straight drop'),    R('FL','counter drop'),     R('FR','straight kill')] },
  { name: 'FC-08', category: 'front-court', steps: [R('FL','straight drop'),   R('FR','straight drop'),    R('FL','crosscourt drop'),  R('FR','crosscourt drop')] },
  { name: 'FC-09', category: 'pressure',    steps: [R('MR','straight drop'),   R('ML','straight drive'),   R('ML','straight drop'),    R('MR','straight drive')] },
  { name: 'FC-10', category: 'front-court', steps: [R('FL','attacking boast'), R('MR','straight drive'),   R('FR','attacking boast'),  R('ML','straight drive')] },
  { name: 'FC-11', category: 'front-court', steps: [R('FL','straight drop'),   R('T', 'volley drop'),      R('FR','straight drop'),    R('T', 'volley drive')] },
  { name: 'FC-12', category: 'front-court', steps: [R('FR','straight drop'),   R('T', 'volley drive'),     R('BL','straight drive'),   R('FL','straight drop')] },
  { name: 'FC-13', category: 'front-court', steps: [R('FL','crosscourt drop'), R('BR','straight drive'),   R('FR','crosscourt drop'),  R('BL','straight drive')] },
  { name: 'FC-14', category: 'front-court', steps: [R('FL','straight kill'),   R('MR','crosscourt drive'), R('FR','straight kill'),    R('ML','crosscourt drive')], minDifficulty: 'advanced' },
  { name: 'FC-15', category: 'pressure',    steps: [R('ML','straight drop'),   R('MR','straight drive'),   R('ML','crosscourt drive'), R('BR','straight drive')] },

  // ══════════════════════════════════════════════════════════════════════════
  // PRESSURE RALLIES (20)
  // ══════════════════════════════════════════════════════════════════════════

  { name: 'PR-01', category: 'pressure', minDifficulty: 'intermediate', steps: [R('BR','straight drive'), R('FR','straight drop'), R('BL','straight drive'), R('FL','straight drop'), R('T','volley drive'),  R('BR','straight drive')] },
  { name: 'PR-02', category: 'pressure', minDifficulty: 'intermediate', steps: [R('BL','straight drive'), R('FL','straight drop'), R('BR','straight drive'), R('FR','straight drop'), R('T','volley drop'),   R('BL','straight drive')] },
  { name: 'PR-03', category: 'pressure', minDifficulty: 'intermediate', steps: [R('BR','crosscourt drive'), R('FL','straight drop'), R('BR','straight drive'), R('FL','crosscourt drop'), R('BR','hard length'), R('FR','straight drop')] },
  { name: 'PR-04', category: 'pressure', minDifficulty: 'intermediate', steps: [R('BL','crosscourt drive'), R('FR','straight drop'), R('BL','straight drive'), R('FR','crosscourt drop'), R('BL','hard length'), R('FL','straight drop')] },
  { name: 'PR-05', category: 'pressure', minDifficulty: 'intermediate', steps: [R('BR','straight drive'), R('FR','straight drop'), R('BR','hard length'), R('FL','crosscourt drop'), R('MR','straight drive'), R('BL','defensive boast')] },
  { name: 'PR-06', category: 'pressure', minDifficulty: 'intermediate', steps: [R('BL','straight drive'), R('FL','straight drop'), R('BL','hard length'), R('FR','crosscourt drop'), R('ML','straight drive'), R('BR','defensive boast')] },
  { name: 'PR-07', category: 'pressure', minDifficulty: 'advanced', steps: [R('BR','hard length'), R('FR','straight drop'), R('BL','hard length'), R('FL','straight drop'), R('BR','crosscourt drive'), R('FL','crosscourt drop')] },
  { name: 'PR-08', category: 'pressure', minDifficulty: 'intermediate', steps: [R('T','volley drive'), R('BL','defensive boast'), R('FR','straight drive'), R('BL','straight drive'), R('FL','straight drop'), R('T','volley drive')] },
  { name: 'PR-09', category: 'pressure', minDifficulty: 'intermediate', steps: [R('T','volley drop'), R('BR','straight drive'), R('FL','straight drop'), R('BR','hard length'), R('T','volley drive'), R('BL','straight drive')] },
  { name: 'PR-10', category: 'pressure', minDifficulty: 'advanced', steps: [R('BR','straight drive'), R('T','volley drive'), R('BL','defensive boast'), R('FR','straight drive'), R('T','volley drop'), R('FL','straight drive')] },
  { name: 'PR-11', category: 'pressure', minDifficulty: 'intermediate', steps: [R('BL','defensive boast'), R('MR','straight drive'), R('FL','straight drop'), R('MR','hard length'), R('BL','defensive boast'), R('FR','straight drive')] },
  { name: 'PR-12', category: 'pressure', minDifficulty: 'intermediate', steps: [R('BR','defensive boast'), R('ML','straight drive'), R('FR','straight drop'), R('ML','hard length'), R('BR','defensive boast'), R('FL','straight drive')] },
  { name: 'PR-13', category: 'pressure', minDifficulty: 'advanced', steps: [R('BR','straight drive'), R('FR','counter drop'), R('BR','crosscourt drive'), R('FL','straight drop'), R('MR','straight drive'), R('BL','hard length')] },
  { name: 'PR-14', category: 'pressure', minDifficulty: 'advanced', steps: [R('BL','straight drive'), R('FL','counter drop'), R('BL','crosscourt drive'), R('FR','straight drop'), R('ML','straight drive'), R('BR','hard length')] },
  { name: 'PR-15', category: 'pressure', minDifficulty: 'advanced', steps: [R('BR','straight drive'), R('FR','straight drop'), R('ML','crosscourt drive'), R('FR','crosscourt drop'), R('BR','hard length'), R('FL','straight drop')] },
  { name: 'PR-16', category: 'pressure', minDifficulty: 'advanced', steps: [R('BL','straight drive'), R('FL','straight drop'), R('MR','crosscourt drive'), R('FL','crosscourt drop'), R('BL','hard length'), R('FR','straight drop')] },
  { name: 'PR-17', category: 'pressure', minDifficulty: 'intermediate', steps: [R('BR','straight drive'), R('FR','straight drop'), R('BL','hard length'), R('FL','straight drop'), R('T','volley drive'), R('BR','crosscourt drive')] },
  { name: 'PR-18', category: 'pressure', minDifficulty: 'intermediate', steps: [R('BL','hard length'), R('FL','straight drop'), R('BR','hard length'), R('FR','straight drop'), R('T','volley drop'), R('BL','crosscourt drive')] },
  { name: 'PR-19', category: 'pressure', minDifficulty: 'advanced', steps: [R('T','volley crosscourt'), R('BR','defensive boast'), R('FL','straight drop'), R('T','volley drive'), R('BL','hard length'), R('FR','straight drop')] },
  { name: 'PR-20', category: 'pressure', minDifficulty: 'advanced', steps: [R('T','volley drive'), R('BR','straight drive'), R('FR','straight drop'), R('T','volley drop'), R('FL','straight drive'), R('BL','hard length')] },

  // ══════════════════════════════════════════════════════════════════════════
  // DEFENSIVE / RETRIEVAL RALLIES (20)
  // ══════════════════════════════════════════════════════════════════════════

  { name: 'DF-01', category: 'defensive', steps: [R('BR','defensive lob'),   R('FL','straight drop'),    R('BL','defensive lob'),    R('FR','straight drop')] },
  { name: 'DF-02', category: 'defensive', steps: [R('BL','defensive lob'),   R('FR','straight drop'),    R('BR','defensive lob'),    R('FL','straight drop')] },
  { name: 'DF-03', category: 'defensive', steps: [R('BR','defensive lob'),   R('FL','crosscourt drop'),  R('BR','straight drive'),   R('FL','straight drop')] },
  { name: 'DF-04', category: 'defensive', steps: [R('BL','defensive lob'),   R('FR','crosscourt drop'),  R('BL','straight drive'),   R('FR','straight drop')] },
  { name: 'DF-05', category: 'defensive', steps: [R('BR','defensive boast'), R('FL','straight drive'),   R('BR','defensive lob'),    R('FL','straight drop')] },
  { name: 'DF-06', category: 'defensive', steps: [R('BL','defensive boast'), R('FR','straight drive'),   R('BL','defensive lob'),    R('FR','straight drop')] },
  { name: 'DF-07', category: 'defensive', steps: [R('BR','straight drive'),  R('FR','straight lob'),     R('BL','straight drive'),   R('FL','straight lob')] },
  { name: 'DF-08', category: 'defensive', steps: [R('BL','straight drive'),  R('FL','straight lob'),     R('BR','straight drive'),   R('FR','straight lob')] },
  { name: 'DF-09', category: 'defensive', steps: [R('BR','defensive lob'),   R('MR','straight drive'),   R('BL','defensive lob'),    R('ML','straight drive')] },
  { name: 'DF-10', category: 'defensive', steps: [R('BL','defensive lob'),   R('ML','straight drive'),   R('BR','defensive lob'),    R('MR','straight drive')] },
  { name: 'DF-11', category: 'defensive', steps: [R('BR','defensive lob'),   R('FL','straight drop'),    R('T', 'volley drive'),     R('BL','defensive lob')] },
  { name: 'DF-12', category: 'defensive', steps: [R('BL','defensive lob'),   R('FR','straight drop'),    R('T', 'volley drive'),     R('BR','defensive lob')] },
  { name: 'DF-13', category: 'defensive', steps: [R('BR','defensive boast'), R('FL','straight lob'),     R('BR','straight drive'),   R('FR','straight drop')] },
  { name: 'DF-14', category: 'defensive', steps: [R('BL','defensive boast'), R('FR','straight lob'),     R('BL','straight drive'),   R('FL','straight drop')] },
  { name: 'DF-15', category: 'defensive', steps: [R('BR','defensive lob'),   R('FL','straight drop'),    R('BR','defensive boast'),  R('FR','straight drive')] },
  { name: 'DF-16', category: 'defensive', steps: [R('BL','defensive lob'),   R('FR','straight drop'),    R('BL','defensive boast'),  R('FL','straight drive')] },
  { name: 'DF-17', category: 'defensive', steps: [R('MR','straight drive'),  R('BL','defensive boast'),  R('FR','straight drop'),    R('BR','defensive lob')] },
  { name: 'DF-18', category: 'defensive', steps: [R('ML','straight drive'),  R('BR','defensive boast'),  R('FL','straight drop'),    R('BL','defensive lob')] },
  { name: 'DF-19', category: 'defensive', steps: [R('BR','defensive lob'),   R('FL','straight drop'),    R('MR','crosscourt drive'), R('BL','defensive lob'), R('FR','straight drop')] },
  { name: 'DF-20', category: 'defensive', steps: [R('BL','defensive lob'),   R('FR','straight drop'),    R('ML','crosscourt drive'), R('BR','defensive lob'), R('FL','straight drop')] },

  // ══════════════════════════════════════════════════════════════════════════
  // MATCH SIMULATION RALLIES (35)
  // ══════════════════════════════════════════════════════════════════════════

  { name: 'MS-01', category: 'match-sim', minDifficulty: 'intermediate', steps: [R('BR','straight drive'), R('FR','straight drop'), R('BL','crosscourt drive'), R('FL','straight drop'), R('MR','volley drive'), R('BL','straight drive')] },
  { name: 'MS-02', category: 'match-sim', minDifficulty: 'intermediate', steps: [R('BL','straight drive'), R('FL','straight drop'), R('BR','crosscourt drive'), R('FR','straight drop'), R('ML','volley drive'), R('BR','straight drive')] },
  { name: 'MS-03', category: 'match-sim', minDifficulty: 'advanced', steps: [R('BR','hard length'), R('FR','counter drop'), R('T','volley drive'), R('BL','hard length'), R('FL','straight drop'), R('T','volley drop')] },
  { name: 'MS-04', category: 'match-sim', minDifficulty: 'advanced', steps: [R('BL','hard length'), R('FL','counter drop'), R('T','volley drive'), R('BR','hard length'), R('FR','straight drop'), R('T','volley drop')] },
  { name: 'MS-05', category: 'match-sim', minDifficulty: 'advanced', steps: [R('BR','crosscourt drive'), R('FL','straight drop'), R('T','volley crosscourt'), R('BR','hard length'), R('T','volley drop'), R('FL','straight drive')] },
  { name: 'MS-06', category: 'match-sim', minDifficulty: 'intermediate', steps: [R('BL','defensive boast'), R('MR','straight drive'), R('FR','straight drop'), R('ML','straight drive'), R('BL','defensive boast'), R('FR','straight drop')] },
  { name: 'MS-07', category: 'match-sim', minDifficulty: 'intermediate', steps: [R('BR','defensive boast'), R('ML','straight drive'), R('FL','straight drop'), R('MR','straight drive'), R('BR','defensive boast'), R('FL','straight drop')] },
  { name: 'MS-08', category: 'match-sim', minDifficulty: 'advanced', steps: [R('T','volley drive'), R('BL','defensive boast'), R('FR','straight drop'), R('ML','straight drive'), R('BR','straight drive'), R('T','volley drop')] },
  { name: 'MS-09', category: 'match-sim', minDifficulty: 'advanced', steps: [R('T','volley drop'), R('BR','straight drive'), R('FL','straight drop'), R('T','volley drive'), R('BL','hard length'), R('FR','straight drop')] },
  { name: 'MS-10', category: 'match-sim', minDifficulty: 'advanced', steps: [R('BR','straight drive'), R('FR','straight drop'), R('BR','crosscourt drive'), R('FL','straight drop'), R('MR','crosscourt drive'), R('BL','defensive boast')] },
  { name: 'MS-11', category: 'match-sim', minDifficulty: 'advanced', steps: [R('BL','straight drive'), R('FL','straight drop'), R('BL','crosscourt drive'), R('FR','straight drop'), R('ML','crosscourt drive'), R('BR','defensive boast')] },
  { name: 'MS-12', category: 'match-sim', minDifficulty: 'advanced', steps: [R('BR','hard length'), R('T','volley drive'), R('FL','straight drop'), R('MR','straight drive'), R('BL','defensive boast'), R('FR','straight drive')] },
  { name: 'MS-13', category: 'match-sim', minDifficulty: 'advanced', steps: [R('BL','hard length'), R('T','volley drive'), R('FR','straight drop'), R('ML','straight drive'), R('BR','defensive boast'), R('FL','straight drive')] },
  { name: 'MS-14', category: 'match-sim', minDifficulty: 'intermediate', steps: [R('MR','crosscourt drive'), R('BL','defensive boast'), R('FR','straight drive'), R('ML','crosscourt drive'), R('BR','defensive boast'), R('FL','straight drive')] },
  { name: 'MS-15', category: 'match-sim', minDifficulty: 'intermediate', steps: [R('ML','crosscourt drive'), R('BR','defensive boast'), R('FL','straight drive'), R('MR','crosscourt drive'), R('BL','defensive boast'), R('FR','straight drive')] },
  { name: 'MS-16', category: 'match-sim', minDifficulty: 'advanced', steps: [R('BR','straight drive'), R('FL','crosscourt drop'), R('MR','straight drive'), R('BL','defensive boast'), R('T','volley drive'), R('FL','straight drop')] },
  { name: 'MS-17', category: 'match-sim', minDifficulty: 'advanced', steps: [R('BL','straight drive'), R('FR','crosscourt drop'), R('ML','straight drive'), R('BR','defensive boast'), R('T','volley drive'), R('FR','straight drop')] },
  { name: 'MS-18', category: 'match-sim', minDifficulty: 'advanced', steps: [R('BR','hard length'), R('FR','straight drop'), R('T','volley drive'), R('BL','hard length'), R('FL','straight drop'), R('T','volley drop'), R('BR','straight drive')] },
  { name: 'MS-19', category: 'match-sim', minDifficulty: 'advanced', steps: [R('BL','hard length'), R('FL','straight drop'), R('T','volley drive'), R('BR','hard length'), R('FR','straight drop'), R('T','volley drop'), R('BL','straight drive')] },
  { name: 'MS-20', category: 'match-sim', minDifficulty: 'advanced', steps: [R('T','volley drive'), R('BL','straight drive'), R('FL','straight drop'), R('T','volley crosscourt'), R('BR','hard length'), R('FR','straight drop')] },
  { name: 'MS-21', category: 'match-sim', minDifficulty: 'advanced', steps: [R('T','volley drop'), R('BR','defensive boast'), R('FL','straight drive'), R('BL','straight drive'), R('T','volley drive'), R('BR','hard length')] },
  { name: 'MS-22', category: 'match-sim', minDifficulty: 'advanced', steps: [R('BR','straight drive'), R('FR','straight drop'), R('BR','hard length'), R('T','volley drop'), R('FL','straight drive'), R('BL','defensive boast')] },
  { name: 'MS-23', category: 'match-sim', minDifficulty: 'advanced', steps: [R('BL','straight drive'), R('FL','straight drop'), R('BL','hard length'), R('T','volley drop'), R('FR','straight drive'), R('BR','defensive boast')] },
  { name: 'MS-24', category: 'match-sim', minDifficulty: 'elite', steps: [R('BR','crosscourt drive'), R('FL','straight drop'), R('BR','straight drive'), R('T','volley drive'), R('BL','defensive boast'), R('FR','straight drop'), R('ML','straight drive')] },
  { name: 'MS-25', category: 'match-sim', minDifficulty: 'elite', steps: [R('BL','crosscourt drive'), R('FR','straight drop'), R('BL','straight drive'), R('T','volley drive'), R('BR','defensive boast'), R('FL','straight drop'), R('MR','straight drive')] },
  { name: 'MS-26', category: 'match-sim', minDifficulty: 'intermediate', steps: [R('BR','straight drive'), R('MR','straight drive'), R('FR','straight drop'), R('ML','crosscourt drive'), R('BR','defensive boast'), R('FL','straight drive')] },
  { name: 'MS-27', category: 'match-sim', minDifficulty: 'intermediate', steps: [R('BL','straight drive'), R('ML','straight drive'), R('FL','straight drop'), R('MR','crosscourt drive'), R('BL','defensive boast'), R('FR','straight drive')] },
  { name: 'MS-28', category: 'match-sim', minDifficulty: 'intermediate', steps: [R('BR','straight drive'), R('FR','straight drop'), R('ML','crosscourt drive'), R('BR','straight drive'), R('FL','straight drop'), R('MR','straight drive')] },
  { name: 'MS-29', category: 'match-sim', minDifficulty: 'advanced', steps: [R('T','volley drive'), R('BR','defensive boast'), R('FL','straight drive'), R('T','volley drop'), R('MR','straight drive'), R('BL','hard length')] },
  { name: 'MS-30', category: 'match-sim', minDifficulty: 'advanced', steps: [R('T','volley drop'), R('BL','straight drive'), R('T','volley drive'), R('BR','straight drive'), R('FL','crosscourt drop'), R('T','volley crosscourt')] },
  { name: 'MS-31', category: 'match-sim', minDifficulty: 'intermediate', steps: [R('BR','hard length'), R('FR','straight drop'), R('BL','crosscourt drive'), R('FL','crosscourt drop'), R('MR','straight drive'), R('BL','straight drive')] },
  { name: 'MS-32', category: 'match-sim', minDifficulty: 'intermediate', steps: [R('BL','hard length'), R('FL','straight drop'), R('BR','crosscourt drive'), R('FR','crosscourt drop'), R('ML','straight drive'), R('BR','straight drive')] },
  { name: 'MS-33', category: 'match-sim', minDifficulty: 'advanced', steps: [R('MR','crosscourt drive'), R('BL','hard length'), R('FL','straight drop'), R('MR','straight drive'), R('BR','defensive boast'), R('T','volley drive')] },
  { name: 'MS-34', category: 'match-sim', minDifficulty: 'advanced', steps: [R('ML','crosscourt drive'), R('BR','hard length'), R('FR','straight drop'), R('ML','straight drive'), R('BL','defensive boast'), R('T','volley drive')] },
  { name: 'MS-35', category: 'match-sim', minDifficulty: 'elite', steps: [R('BR','hard length'), R('T','volley crosscourt'), R('BL','straight drive'), R('T','volley drop'), R('FR','straight drive'), R('ML','crosscourt drive'), R('BR','defensive boast')] },

  // ══════════════════════════════════════════════════════════════════════════
  // 10-POINT EXTENDED RALLIES (15)
  // ══════════════════════════════════════════════════════════════════════════

  { name: 'TP-01', category: 'extended', requires10pt: true, minDifficulty: 'intermediate', steps: [R('BMCR','straight drive'), R('FMCL','volley drop'), R('BMCL','straight drive'), R('FMCR','volley drop')] },
  { name: 'TP-02', category: 'extended', requires10pt: true, minDifficulty: 'intermediate', steps: [R('FMCR','volley drive'), R('BL','straight drive'), R('FMCL','volley drive'), R('BR','straight drive')] },
  { name: 'TP-03', category: 'extended', requires10pt: true, minDifficulty: 'intermediate', steps: [R('FL','straight drop'), R('BMCR','straight drive'), R('FMCL','volley drive'), R('BR','hard length')] },
  { name: 'TP-04', category: 'extended', requires10pt: true, minDifficulty: 'intermediate', steps: [R('FR','straight drop'), R('BMCL','straight drive'), R('FMCR','volley drive'), R('BL','hard length')] },
  { name: 'TP-05', category: 'extended', requires10pt: true, minDifficulty: 'advanced', steps: [R('BR','straight drive'), R('FMCL','volley drop'), R('BMCR','straight drive'), R('FMCR','volley drive'), R('BL','straight drive')] },
  { name: 'TP-06', category: 'extended', requires10pt: true, minDifficulty: 'advanced', steps: [R('BL','straight drive'), R('FMCR','volley drop'), R('BMCL','straight drive'), R('FMCL','volley drive'), R('BR','straight drive')] },
  { name: 'TP-07', category: 'extended', requires10pt: true, minDifficulty: 'advanced', steps: [R('FMCR','volley drive'), R('BMCL','hard length'), R('FMCL','volley drop'), R('BMCR','straight drive'), R('FL','straight drop')] },
  { name: 'TP-08', category: 'extended', requires10pt: true, minDifficulty: 'advanced', steps: [R('FMCL','volley drive'), R('BMCR','hard length'), R('FMCR','volley drop'), R('BMCL','straight drive'), R('FR','straight drop')] },
  { name: 'TP-09', category: 'extended', requires10pt: true, minDifficulty: 'advanced', steps: [R('BR','straight drive'), R('FL','straight drop'), R('BMCL','crosscourt drive'), R('FMCR','volley drive'), R('BL','hard length')] },
  { name: 'TP-10', category: 'extended', requires10pt: true, minDifficulty: 'advanced', steps: [R('BL','straight drive'), R('FR','straight drop'), R('BMCR','crosscourt drive'), R('FMCL','volley drive'), R('BR','hard length')] },
  { name: 'TP-11', category: 'extended', requires10pt: true, minDifficulty: 'elite', steps: [R('BMCR','straight drive'), R('FMCL','volley kill'), R('BL','hard length'), R('FMCR','volley drop'), R('BMCL','straight drive')] },
  { name: 'TP-12', category: 'extended', requires10pt: true, minDifficulty: 'elite', steps: [R('BMCL','straight drive'), R('FMCR','volley kill'), R('BR','hard length'), R('FMCL','volley drop'), R('BMCR','straight drive')] },
  { name: 'TP-13', category: 'extended', requires10pt: true, minDifficulty: 'advanced', steps: [R('T','volley drive'), R('BMCL','straight drive'), R('FMCR','volley drive'), R('BMCR','straight drive'), R('FMCL','volley drop')] },
  { name: 'TP-14', category: 'extended', requires10pt: true, minDifficulty: 'advanced', steps: [R('FMCL','volley drop'), R('BMCR','hard length'), R('FL','straight drop'), R('BMCL','straight drive'), R('FMCR','volley drive')] },
  { name: 'TP-15', category: 'extended', requires10pt: true, minDifficulty: 'advanced', steps: [R('BR','straight drive'), R('FL','straight drop'), R('FMCR','volley drive'), R('BL','hard length'), R('FMCL','volley drop'), R('BR','straight drive')] },
];

// ─── Template Selection Helpers ───────────────────────────────────────────────

const DIFFICULTY_ORDER = ['beginner','intermediate','advanced','elite','pro'];

function difficultyIndex(d: string): number {
  return DIFFICULTY_ORDER.indexOf(d);
}

/**
 * Returns templates appropriate for the given difficulty and court system.
 */
export function getTemplatesForDifficulty(
  difficulty: string,
  is10pt: boolean,
): RallyTemplate[] {
  const dIdx = difficultyIndex(difficulty);
  return RALLY_TEMPLATES.filter(t => {
    if (!is10pt && t.requires10pt) return false;
    if (is10pt && t.requires10pt) return true;
    if (is10pt) return true;
    if (!t.minDifficulty) return true;
    return dIdx >= difficultyIndex(t.minDifficulty);
  });
}

/**
 * Pick the next rally template with anti-repeat logic.
 * Ensures variety across sets by avoiding recently used templates.
 */
export function pickNextTemplate(
  difficulty: string,
  is10pt: boolean,
  recentTemplateNames: string[],
): RallyTemplate {
  const available = getTemplatesForDifficulty(difficulty, is10pt);
  const cooldown  = Math.min(recentTemplateNames.length, Math.floor(available.length * 0.35));
  const recent    = new Set(recentTemplateNames.slice(-cooldown));

  const pool   = available.filter(t => !recent.has(t.name));
  const source = pool.length > 0 ? pool : available;

  return source[Math.floor(Math.random() * source.length)];
}
