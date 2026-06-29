// Multilingual voice strings for session TTS calls.
// Shot names (straight drive, crosscourt drop, etc.) stay in English —
// they are squash technical terms used universally across all coaching cultures.
// Position labels, recovery cues, and coaching phrases are fully localised.

import { Language } from '../types';
import { Position } from '../types';
import { HAND_MIRROR } from './positions';

// ─── Position voice labels ────────────────────────────────────────────────────

const POSITION_LABELS: Record<Language, Record<Position, string>> = {
  'en-US': {
    T: 'the T', FL: 'Front Left', FR: 'Front Right',
    ML: 'Mid Left', MR: 'Mid Right', BL: 'Back Left', BR: 'Back Right',
    FMCL: 'Front Mid Left', FMCR: 'Front Mid Right',
    BMCL: 'Back Mid Left', BMCR: 'Back Mid Right',
  },
  'en-GB': {
    T: 'the T', FL: 'Front Left', FR: 'Front Right',
    ML: 'Mid Left', MR: 'Mid Right', BL: 'Back Left', BR: 'Back Right',
    FMCL: 'Front Mid Left', FMCR: 'Front Mid Right',
    BMCL: 'Back Mid Left', BMCR: 'Back Mid Right',
  },
  es: {
    T: 'la T', FL: 'Delantero Izquierdo', FR: 'Delantero Derecho',
    ML: 'Centro Izquierdo', MR: 'Centro Derecho',
    BL: 'Trasero Izquierdo', BR: 'Trasero Derecho',
    FMCL: 'Delantero Centro Izquierdo', FMCR: 'Delantero Centro Derecho',
    BMCL: 'Trasero Centro Izquierdo', BMCR: 'Trasero Centro Derecho',
  },
  fr: {
    T: 'le T', FL: 'Avant Gauche', FR: 'Avant Droit',
    ML: 'Milieu Gauche', MR: 'Milieu Droit',
    BL: 'Arrière Gauche', BR: 'Arrière Droit',
    FMCL: 'Avant Centre Gauche', FMCR: 'Avant Centre Droit',
    BMCL: 'Arrière Centre Gauche', BMCR: 'Arrière Centre Droit',
  },
  de: {
    T: 'das T', FL: 'Vorne Links', FR: 'Vorne Rechts',
    ML: 'Mitte Links', MR: 'Mitte Rechts',
    BL: 'Hinten Links', BR: 'Hinten Rechts',
    FMCL: 'Vorne Mitte Links', FMCR: 'Vorne Mitte Rechts',
    BMCL: 'Hinten Mitte Links', BMCR: 'Hinten Mitte Rechts',
  },
  it: {
    T: 'la T', FL: 'Anteriore Sinistro', FR: 'Anteriore Destro',
    ML: 'Centro Sinistro', MR: 'Centro Destro',
    BL: 'Posteriore Sinistro', BR: 'Posteriore Destro',
    FMCL: 'Anteriore Centro Sinistro', FMCR: 'Anteriore Centro Destro',
    BMCL: 'Posteriore Centro Sinistro', BMCR: 'Posteriore Centro Destro',
  },
  pt: {
    T: 'o T', FL: 'Frente Esquerda', FR: 'Frente Direita',
    ML: 'Meio Esquerda', MR: 'Meio Direita',
    BL: 'Fundo Esquerda', BR: 'Fundo Direita',
    FMCL: 'Frente Centro Esquerda', FMCR: 'Frente Centro Direita',
    BMCL: 'Fundo Centro Esquerda', BMCR: 'Fundo Centro Direita',
  },
  nl: {
    T: 'de T', FL: 'Voor Links', FR: 'Voor Rechts',
    ML: 'Midden Links', MR: 'Midden Rechts',
    BL: 'Achter Links', BR: 'Achter Rechts',
    FMCL: 'Voor Midden Links', FMCR: 'Voor Midden Rechts',
    BMCL: 'Achter Midden Links', BMCR: 'Achter Midden Rechts',
  },
  hi: {
    T: 'टी पर', FL: 'आगे बाईं', FR: 'आगे दाईं',
    ML: 'बीच बाईं', MR: 'बीच दाईं',
    BL: 'पीछे बाईं', BR: 'पीछे दाईं',
    FMCL: 'आगे बीच बाईं', FMCR: 'आगे बीच दाईं',
    BMCL: 'पीछे बीच बाईं', BMCR: 'पीछे बीच दाईं',
  },
  ar: {
    T: 'إلى التي', FL: 'أمام يسار', FR: 'أمام يمين',
    ML: 'وسط يسار', MR: 'وسط يمين',
    BL: 'خلف يسار', BR: 'خلف يمين',
    FMCL: 'أمام وسط يسار', FMCR: 'أمام وسط يمين',
    BMCL: 'خلف وسط يسار', BMCR: 'خلف وسط يمين',
  },
  zh: {
    T: 'T位', FL: '前左', FR: '前右',
    ML: '中左', MR: '中右',
    BL: '后左', BR: '后右',
    FMCL: '前中左', FMCR: '前中右',
    BMCL: '后中左', BMCR: '后中右',
  },
  ja: {
    T: 'Tポジション', FL: '前左', FR: '前右',
    ML: '中央左', MR: '中央右',
    BL: '後ろ左', BR: '後ろ右',
    FMCL: '前中左', FMCR: '前中右',
    BMCL: '後中左', BMCR: '後中右',
  },
  ko: {
    T: 'T위치', FL: '앞 왼쪽', FR: '앞 오른쪽',
    ML: '중간 왼쪽', MR: '중간 오른쪽',
    BL: '뒤 왼쪽', BR: '뒤 오른쪽',
    FMCL: '앞중간 왼쪽', FMCR: '앞중간 오른쪽',
    BMCL: '뒤중간 왼쪽', BMCR: '뒤중간 오른쪽',
  },
  he: {
    T: 'ה-T', FL: 'קדמי שמאל', FR: 'קדמי ימין',
    ML: 'אמצע שמאל', MR: 'אמצע ימין',
    BL: 'אחורי שמאל', BR: 'אחורי ימין',
    FMCL: 'קדמי אמצע שמאל', FMCR: 'קדמי אמצע ימין',
    BMCL: 'אחורי אמצע שמאל', BMCR: 'אחורי אמצע ימין',
  },
  sw: {
    T: 'kwenye T', FL: 'Mbele Kushoto', FR: 'Mbele Kulia',
    ML: 'Kati Kushoto', MR: 'Kati Kulia',
    BL: 'Nyuma Kushoto', BR: 'Nyuma Kulia',
    FMCL: 'Mbele Kati Kushoto', FMCR: 'Mbele Kati Kulia',
    BMCL: 'Nyuma Kati Kushoto', BMCR: 'Nyuma Kati Kulia',
  },
  // Quechua and Hausa TTS engines are not available on iOS/Android —
  // fall back to English so the voice call remains intelligible.
  qu: {
    T: 'the T', FL: 'Front Left', FR: 'Front Right',
    ML: 'Mid Left', MR: 'Mid Right', BL: 'Back Left', BR: 'Back Right',
    FMCL: 'Front Mid Left', FMCR: 'Front Mid Right',
    BMCL: 'Back Mid Left', BMCR: 'Back Mid Right',
  },
  ha: {
    T: 'the T', FL: 'Front Left', FR: 'Front Right',
    ML: 'Mid Left', MR: 'Mid Right', BL: 'Back Left', BR: 'Back Right',
    FMCL: 'Front Mid Left', FMCR: 'Front Mid Right',
    BMCL: 'Back Mid Left', BMCR: 'Back Mid Right',
  },
};

// ─── Recovery cues ────────────────────────────────────────────────────────────

const RECOVERY_CUES: Record<Language, string[]> = {
  'en-US': ['Back to T!', 'Recover to T!', 'Back to the T!', 'Return to T!', 'T position!', 'And T!'],
  'en-GB': ['Back to T!', 'Recover to T!', 'Back to the T!', 'Return to T!', 'T position!', 'And T!'],
  es:      ['¡A la T!', '¡Recupera la T!', '¡Vuelve a la T!', '¡Retorna a la T!', '¡Posición T!', '¡Y a la T!'],
  fr:      ['Au T!', 'Récupère le T!', 'Retour au T!', 'Reviens au T!', 'Position T!', 'Et le T!'],
  de:      ['Zurück zum T!', 'Erhol dich am T!', 'Zurück ans T!', 'Rückkehr zum T!', 'T-Position!', 'Und T!'],
  it:      ['Alla T!', 'Recupera la T!', 'Ritorna alla T!', 'Torna alla T!', 'Posizione T!', 'E la T!'],
  pt:      ['Para o T!', 'Recupera o T!', 'Volta ao T!', 'Retorna ao T!', 'Posição T!', 'E o T!'],
  nl:      ['Terug naar T!', 'Herstel naar T!', 'Terug naar de T!', 'T positie!', 'En de T!', 'Terug!'],
  hi:      ['टी पर वापस!', 'टी पर लौटो!', 'वापस टी पर!', 'टी!', 'टी पोजीशन!', 'और टी!'],
  ar:      ['عود إلى التي!', 'ارجع للتي!', 'إلى التي!', 'التي!', 'موقع التي!', 'وللتي!'],
  zh:      ['回到T位!', '回T!', 'T位置!', '恢复T位!', 'T!', '回T位!'],
  ja:      ['Tに戻れ!', 'Tポジション!', 'T位置!', 'Tへ戻れ!', 'T!', 'そしてT!'],
  ko:      ['T로 돌아가!', 'T 회복!', 'T 위치로!', 'T로!', 'T 포지션!', '그리고 T!'],
  he:      ['חזור לT!', 'שחזר את הT!', 'לT!', 'חזרה לT!', 'עמדת T!', 'ולT!'],
  sw:      ['Rudi T!', 'Rejea T!', 'Kurudi T!', 'Nafasi ya T!', 'T!', 'Na T!'],
  qu:      ['Back to T!', 'Recover to T!', 'Back to the T!', 'Return to T!', 'T position!', 'And T!'],
  ha:      ['Back to T!', 'Recover to T!', 'Back to the T!', 'Return to T!', 'T position!', 'And T!'],
};

// ─── Coaching phrases ─────────────────────────────────────────────────────────

const COACHING_PHRASES: Record<Language, string[]> = {
  'en-US': [
    'Great work, keep going', 'Stay focused, push through', 'Good movement, keep the pace',
    "You're doing great", 'Stay low and fast', 'Excellent work, keep it up',
    'Push harder, you can do it', 'Nice footwork, stay sharp', 'Keep your energy up', 'Almost there, stay strong',
  ],
  'en-GB': [
    'Great work, keep going', 'Stay focused, push through', 'Good movement, keep the pace',
    "You're doing great", 'Stay low and fast', 'Excellent work, keep it up',
    'Push harder, you can do it', 'Nice footwork, stay sharp', 'Keep your energy up', 'Almost there, stay strong',
  ],
  es: [
    'Muy bien, sigue así', 'Concéntrate, sigue adelante', 'Buen movimiento, mantén el ritmo',
    'Lo estás haciendo genial', 'Agáchate y rápido', 'Excelente trabajo, continúa',
    'Más fuerte, puedes hacerlo', 'Buen juego de piernas', 'Mantén la energía', 'Ya casi, sigue fuerte',
  ],
  fr: [
    'Très bien, continue', 'Reste concentré', 'Bon mouvement, garde le rythme',
    'Tu te débrouilles très bien', 'Reste bas et rapide', 'Excellent travail, continue',
    'Plus fort, tu peux le faire', 'Bon jeu de jambes', 'Garde ton énergie', 'Presque là, reste fort',
  ],
  de: [
    'Gute Arbeit, weiter so', 'Konzentriert bleiben', 'Gute Bewegung, halte das Tempo',
    'Du machst das toll', 'Tief bleiben und schnell', 'Ausgezeichnete Arbeit, weiter',
    'Mehr Druck, du schaffst es', 'Gute Beinarbeit', 'Energie halten', 'Fast da, stark bleiben',
  ],
  it: [
    'Ottimo lavoro, continua', 'Rimani concentrato', 'Buon movimento, mantieni il ritmo',
    'Stai andando benissimo', 'Basso e veloce', 'Lavoro eccellente, continua',
    "Dai più forza, ce la fai", 'Ottimo lavoro di gambe', "Mantieni l'energia", 'Quasi in fondo, tieni duro',
  ],
  pt: [
    'Muito bem, continue', 'Mantenha o foco', 'Bom movimento, mantenha o ritmo',
    'Você está indo muito bem', 'Baixo e rápido', 'Excelente trabalho, continue',
    'Mais força, você consegue', 'Boa movimentação', 'Mantenha a energia', 'Quase lá, seja forte',
  ],
  nl: [
    'Goed werk, doorgaan', 'Gefocust blijven', 'Goede beweging, houd het tempo',
    'Je doet het geweldig', 'Laag en snel', 'Uitstekend werk, doorgaan',
    'Meer kracht, je kunt het', 'Goed beenwerk', 'Houd energie vast', 'Bijna klaar, sterk blijven',
  ],
  hi: [
    'बहुत अच्छा, जारी रखो', 'ध्यान रखो, आगे बढ़ो', 'अच्छी चाल, रफ़्तार बनाए रखो',
    'तुम बहुत अच्छे कर रहे हो', 'नीचे और तेज़', 'शानदार काम, जारी रखो',
    'और ज़ोर लगाओ, तुम कर सकते हो', 'अच्छा पैरों का काम', 'ऊर्जा बनाए रखो', 'लगभग हो गया, मजबूत रहो',
  ],
  ar: [
    'عمل رائع، استمر', 'ابقَ مركزاً', 'حركة جيدة، حافظ على الإيقاع',
    'أنت تؤدي بشكل رائع', 'ابقَ منخفضاً وسريعاً', 'عمل ممتاز، استمر',
    'ادفع أكثر، تستطيع', 'خطوات قدم جيدة', 'حافظ على طاقتك', 'تقريباً، ابقَ قوياً',
  ],
  zh: [
    '非常好，继续', '保持专注', '动作不错，保持节奏',
    '你做得很好', '保持低姿态和速度', '出色的工作，继续',
    '加油，你能做到', '步法很好', '保持能量', '快了，坚持住',
  ],
  ja: [
    'よくできた、続けろ', '集中しろ', 'いい動き、ペースを保て',
    '素晴らしい', '低く速く', 'すばらしい、続けろ',
    'もっと頑張れ、できるぞ', 'いいフットワーク', 'エネルギーを保て', 'もうすぐだ、頑張れ',
  ],
  ko: [
    '잘하고 있어, 계속해', '집중해', '좋은 움직임, 페이스를 유지해',
    '정말 잘하고 있어', '낮게 빠르게', '훌륭한 작업, 계속해',
    '더 힘내, 할 수 있어', '좋은 풋워크', '에너지 유지', '거의 다 왔어, 강하게',
  ],
  he: [
    'עבודה מצוינת', 'תישאר ממוקד', 'תנועה טובה, שמור על הקצב',
    'אתה עושה מצוין', 'נמוך ומהיר', 'עבודה מעולה, המשך',
    'דחף חזק יותר, אתה יכול', 'עבודת רגליים טובה', 'שמור על האנרגיה', 'כמעט שם, תישאר חזק',
  ],
  sw: [
    'Kazi nzuri, endelea', 'Kaa makini', 'Harakati nzuri, dumisha kasi',
    'Unafanya vizuri sana', 'Kaa chini na haraka', 'Kazi bora, endelea',
    'Jaribu zaidi, unaweza', 'Miguu mizuri', 'Hifadhi nguvu', 'Karibu mwisho, kuwa imara',
  ],
  qu: [
    'Great work, keep going', 'Stay focused, push through', 'Good movement, keep the pace',
    "You're doing great", 'Stay low and fast', 'Excellent work, keep it up',
    'Push harder, you can do it', 'Nice footwork, stay sharp', 'Keep your energy up', 'Almost there, stay strong',
  ],
  ha: [
    'Great work, keep going', 'Stay focused, push through', 'Good movement, keep the pace',
    "You're doing great", 'Stay low and fast', 'Excellent work, keep it up',
    'Push harder, you can do it', 'Nice footwork, stay sharp', 'Keep your energy up', 'Almost there, stay strong',
  ],
};

// ─── T-position shot prefix ("From the T, <shot>") ───────────────────────────

const FROM_T_PREFIX: Record<Language, string> = {
  'en-US': 'From the T', 'en-GB': 'From the T',
  es: 'Desde la T', fr: 'Depuis le T', de: 'Von der T',
  it: 'Dalla T',    pt: 'Da T',        nl: 'Van de T',
  hi: 'टी से',      ar: 'من التي',     zh: '从T位',
  ja: 'Tから',       ko: 'T에서',       he: 'מה-T',
  sw: 'Kutoka T',   qu: 'From the T',  ha: 'From the T',
};

// ─── Rest / set break cues ───────────────────────────────────────────────────

const REST_CUES: Record<Language, string> = {
  'en-US': 'Rest', 'en-GB': 'Rest',
  es: 'Descanso', fr: 'Repos',     de: 'Pause',
  it: 'Pausa',    pt: 'Descanso',  nl: 'Rust',
  hi: 'आराम',     ar: 'راحة',      zh: '休息',
  ja: '休憩',      ko: '휴식',      he: 'מנוחה',
  sw: 'Pumzika',  qu: 'Rest',      ha: 'Rest',
};

const GO_CUES: Record<Language, string> = {
  'en-US': 'Go!', 'en-GB': 'Go!',
  es: '¡Vamos!',  fr: 'Allez!',   de: 'Los!',
  it: 'Via!',     pt: 'Vai!',     nl: 'Gaan!',
  hi: 'जाओ!',     ar: 'انطلق!',   zh: '开始!',
  ja: 'ゴー!',     ko: '가!',      he: 'קדימה!',
  sw: 'Nenda!',   qu: 'Go!',      ha: 'Go!',
};

// ─── Completion speech ────────────────────────────────────────────────────────

type CompletionTemplate = (repCount: number) => string;
const COMPLETION_TEMPLATES: Record<Language, CompletionTemplate> = {
  'en-US': (n) => `Back to T. Session complete. ${n} movements. Well done.`,
  'en-GB': (n) => `Back to T. Session complete. ${n} movements. Well done.`,
  es:  (n) => `Vuelve a la T. Sesión completa. ${n} movimientos. ¡Muy bien!`,
  fr:  (n) => `Retour au T. Séance terminée. ${n} mouvements. Bravo!`,
  de:  (n) => `Zurück zum T. Einheit abgeschlossen. ${n} Bewegungen. Gut gemacht!`,
  it:  (n) => `Alla T. Sessione completata. ${n} movimenti. Ottimo lavoro!`,
  pt:  (n) => `Para o T. Sessão completa. ${n} movimentos. Muito bem!`,
  nl:  (n) => `Terug naar T. Sessie voltooid. ${n} bewegingen. Goed gedaan!`,
  hi:  (n) => `टी पर वापस। सत्र पूरा। ${n} मूवमेंट। बहुत अच्छा!`,
  ar:  (n) => `عود إلى التي. انتهت الجلسة. ${n} حركة. أحسنت!`,
  zh:  (n) => `回到T位。训练完成。${n}次动作。干得好!`,
  ja:  (n) => `Tに戻れ。セッション完了。${n}回の動き。よくできた!`,
  ko:  (n) => `T로 돌아가. 세션 완료. ${n}번 동작. 잘했어!`,
  he:  (n) => `חזור ל-T. האימון הסתיים. ${n} תנועות. כל הכבוד!`,
  sw:  (n) => `Rudi T. Kipindi kimekamilika. Harakati ${n}. Kazi nzuri!`,
  qu:  (n) => `Back to T. Session complete. ${n} movements. Well done.`,
  ha:  (n) => `Back to T. Session complete. ${n} movements. Well done.`,
};

// ─── Session start cue ───────────────────────────────────────────────────────

const START_CUES: Record<Language, string> = {
  'en-US': 'Move to the T',
  'en-GB': 'Move to the T',
  es:      'Muévete a la T',
  fr:      'Allez au T',
  de:      'Geh zum T',
  it:      'Vai alla T',
  pt:      'Vá para o T',
  nl:      'Ga naar de T',
  hi:      'टी पर जाओ',
  ar:      'انتقل إلى التي',
  zh:      '移动到T位',
  ja:      'Tポジションへ',
  ko:      'T위치로 이동',
  he:      'עבור ל-T',
  sw:      'Nenda kwenye T',
  qu:      'Move to the T',
  ha:      'Move to the T',
};

// ─── Public API ───────────────────────────────────────────────────────────────

/** Returns the localised TTS label for a court position, mirrored for left-handed players. */
export function getPositionVoiceLabel(pos: Position, hand: 'left' | 'right', language: Language): string {
  const map = POSITION_LABELS[language] ?? POSITION_LABELS['en-US'];
  const effective = hand === 'left' ? HAND_MIRROR[pos] : pos;
  return map[effective] ?? POSITION_LABELS['en-US'][effective];
}

/** Returns a rotating recovery cue in the given language. */
export function getRecoveryCueI18n(callIndex: number, language: Language): string {
  const cues = RECOVERY_CUES[language] ?? RECOVERY_CUES['en-US'];
  return cues[callIndex % cues.length];
}

/** Returns a rotating coaching phrase in the given language. */
export function getCoachingPhraseI18n(callIndex: number, language: Language): string {
  const phrases = COACHING_PHRASES[language] ?? COACHING_PHRASES['en-US'];
  return phrases[callIndex % phrases.length];
}

/** Returns the session start cue ("Move to the T") in the given language. */
export function getStartCue(language: Language): string {
  return START_CUES[language] ?? START_CUES['en-US'];
}

/** Returns the "From the T" prefix for shot-based T-position calls. */
export function getFromTPrefix(language: Language): string {
  return FROM_T_PREFIX[language] ?? FROM_T_PREFIX['en-US'];
}

/** Returns the rest-start cue ("Rest") in the given language. */
export function getRestCue(language: Language): string {
  return REST_CUES[language] ?? REST_CUES['en-US'];
}

/** Returns the rest-end cue ("Go!") in the given language. */
export function getGoCue(language: Language): string {
  return GO_CUES[language] ?? GO_CUES['en-US'];
}

/** Returns the completion speech with rep count in the given language. */
export function getCompletionSpeech(repCount: number, language: Language): string {
  const tmpl = COMPLETION_TEMPLATES[language] ?? COMPLETION_TEMPLATES['en-US'];
  return tmpl(repCount);
}

// ─── "Next:" UI prefix (shown in active and rest views) ──────────────────────

const NEXT_LABEL: Record<Language, string> = {
  'en-US': 'Next', 'en-GB': 'Next',
  es: 'Siguiente', fr: 'Suivant', de: 'Weiter',
  it: 'Prossimo',  pt: 'Próximo', nl: 'Volgende',
  hi: 'अगला',      ar: 'التالي',  zh: '下一个',
  ja: '次',         ko: '다음',    he: 'הבא',
  sw: 'Inayofuata', qu: 'Next',   ha: 'Next',
};

/** Returns the "Next" label prefix for the next-position hint UI. */
export function getNextLabel(language: Language): string {
  return NEXT_LABEL[language] ?? NEXT_LABEL['en-US'];
}

// ─── "Prepare for next set" UI label (shown in rest view when no next pos) ───

const PREPARE_NEXT_SET: Record<Language, string> = {
  'en-US': 'Prepare for next set', 'en-GB': 'Prepare for next set',
  es: 'Prepárate para el próximo set',
  fr: 'Prépare le prochain set',
  de: 'Bereite dich für das nächste Set vor',
  it: 'Preparati per il prossimo set',
  pt: 'Prepare-se para o próximo set',
  nl: 'Bereid je voor op de volgende set',
  hi: 'अगले सेट के लिए तैयार हो',
  ar: 'استعد للمجموعة التالية',
  zh: '准备下一组',
  ja: '次のセットの準備をしろ',
  ko: '다음 세트 준비해',
  he: 'התכונן לסט הבא',
  sw: 'Jiandae kwa seti inayofuata',
  qu: 'Prepare for next set',
  ha: 'Prepare for next set',
};

/** Returns the "Prepare for next set" label in the given language. */
export function getPrepareForNextSetLabel(language: Language): string {
  return PREPARE_NEXT_SET[language] ?? PREPARE_NEXT_SET['en-US'];
}

// ─── Home screen hero headlines ───────────────────────────────────────────────

const HERO_HEADLINES_I18N: Record<Language, readonly [string, string, string, string, string, string, string, string]> = {
  'en-US': ['Ready to\nDominate the Court?', 'Push Your\nLimits Today.', 'Every Move\nMatters.', 'Outwork.\nOutmove. Win.', 'Champions Train\nEvery Day.', 'Your Best Game\nStarts Here.', 'No Limits.\nFull Court.', 'Consistency\nBuilds Champions.'],
  'en-GB': ['Ready to\nDominate the Court?', 'Push Your\nLimits Today.', 'Every Move\nMatters.', 'Outwork.\nOutmove. Win.', 'Champions Train\nEvery Day.', 'Your Best Game\nStarts Here.', 'No Limits.\nFull Court.', 'Consistency\nBuilds Champions.'],
  es: ['¿Listo para\nDominar la Pista?', 'Supera tus\nLímites Hoy.', 'Cada Movimiento\nImporta.', 'Trabaja Más.\nMuévete Más. Gana.', 'Los Campeones\nEntre nan Cada Día.', 'Tu Mejor Juego\nEmpieza Aquí.', 'Sin Límites.\nPista Completa.', 'La Constancia\nCrea Campeones.'],
  fr: ['Prêt à\nDominer le Court?', 'Dépasse tes\nLimites Aujourd\'hui.', 'Chaque Mouvement\nCompte.', 'Travaille Plus.\nBouge Plus. Gagne.', 'Les Champions\nS\'Entraînent Chaque Jour.', 'Ton Meilleur Jeu\nCommence Ici.', 'Sans Limites.\nTout le Court.', 'La Régularité\nForge les Champions.'],
  de: ['Bereit das\nCourt zu Dominieren?', 'Überwinde deine\nGrenzen Heute.', 'Jede Bewegung\nZählt.', 'Mehr Arbeit.\nMehr Bewegung. Sieg.', 'Champions Trainieren\nJeden Tag.', 'Dein Bestes Spiel\nBeginnt Hier.', 'Keine Grenzen.\nGanzer Court.', 'Konsequenz\nFormt Champions.'],
  it: ['Pronto a\nDominare il Campo?', 'Supera i tuoi\nLimiti Oggi.', 'Ogni Movimento\nConta.', 'Lavora di Più.\nMuoviti di Più. Vinci.', 'I Campioni\nSi Allenano Ogni Giorno.', 'Il Tuo Miglior\nGioco Inizia Qui.', 'Nessun Limite.\nCampo Completo.', 'La Costanza\nCrea Campioni.'],
  pt: ['Pronto para\nDominar a Quadra?', 'Supere seus\nLimites Hoje.', 'Cada Movimento\nImporta.', 'Trabalhe Mais.\nMova-se Mais. Vença.', 'Campeões Treinam\nTodo Dia.', 'Seu Melhor Jogo\nComeça Aqui.', 'Sem Limites.\nQuadra Completa.', 'Consistência\nCria Campeões.'],
  nl: ['Klaar om het\nCourt te Domineren?', 'Overschrijd je\nGrenzen Vandaag.', 'Elke Beweging\nTelt.', 'Harder Werken.\nMeer Bewegen. Winnen.', 'Kampioenen Trainen\nElke Dag.', 'Jouw Beste Spel\nBeginnt Hier.', 'Geen Grenzen.\nVol Court.', 'Consistentie\nMaakt Kampioenen.'],
  hi: ['कोर्ट पर राज\nकरने के लिए तैयार?', 'आज अपनी\nसीमाएं तोड़ो।', 'हर मूव\nमायने रखता है।', 'ज़्यादा मेहनत।\nज़्यादा मूव। जीत।', 'चैंपियन हर रोज़\nट्रेनिंग करते हैं।', 'तुम्हारा सबसे अच्छा\nखेल यहाँ शुरू होता है।', 'कोई सीमा नहीं।\nपूरा कोर्ट।', 'निरंतरता\nचैंपियन बनाती है।'],
  ar: ['هل أنت مستعد\nللهيمنة على الملعب؟', 'تجاوز\nحدودك اليوم.', 'كل حركة\nلها أهمية.', 'اعمل أكثر.\nتحرك أكثر. انتصر.', 'الأبطال يتدربون\nكل يوم.', 'أفضل لعبتك\nتبدأ هنا.', 'بلا حدود.\nالملعب كامل.', 'الثبات\nيصنع الأبطال.'],
  zh: ['准备好\n主宰球场了吗？', '今天突破\n你的极限。', '每一步\n都至关重要。', '付出更多。\n移动更多。赢。', '冠军每天\n都在训练。', '你最好的比赛\n从这里开始。', '没有极限。\n全场覆盖。', '坚持不懈\n铸就冠军。'],
  ja: ['コートを\n支配する準備はできてるか？', '今日、限界を\n超えろ。', 'すべての動きが\n重要だ。', '必死に働け。\nもっと動け。勝て。', 'チャンピオンは\n毎日トレーニングする。', '最高のゲームは\nここから始まる。', '限界なし。\nフルコート。', '継続が\nチャンピオンを作る。'],
  ko: ['코트를\n지배할 준비됐나?', '오늘 한계를\n뛰어넘어라.', '모든 움직임이\n중요하다.', '더 열심히.\n더 많이 움직여. 이겨라.', '챔피언은\n매일 훈련한다.', '최고의 게임은\n여기서 시작된다.', '한계 없이.\n풀 코트.', '꾸준함이\n챔피언을 만든다.'],
  he: ['מוכן\nלשלוט במגרש?', 'תדחוף את\nהגבולות שלך היום.', 'כל תנועה\nחשובה.', 'עבוד יותר.\nזוז יותר. נצח.', 'אלופים\nמתאמנים כל יום.', 'המשחק הטוב ביותר\nשלך מתחיל כאן.', 'ללא גבולות.\nמגרש מלא.', 'עקביות\nבונה אלופים.'],
  sw: ['Uko Tayari\nKutawala Uwanja?', 'Vuka Mipaka\nyako Leo.', 'Kila Hatua\nInamaanisha.', 'Fanya Zaidi.\nHamia Zaidi. Shinda.', 'Mabingwa Wanafunza\nKila Siku.', 'Mchezo Wako Bora\nUnaanza Hapa.', 'Bila Mipaka.\nUwanja Kamili.', 'Uthabiti\nHujenga Mabingwa.'],
  qu: ['Ready to\nDominate the Court?', 'Push Your\nLimits Today.', 'Every Move\nMatters.', 'Outwork.\nOutmove. Win.', 'Champions Train\nEvery Day.', 'Your Best Game\nStarts Here.', 'No Limits.\nFull Court.', 'Consistency\nBuilds Champions.'],
  ha: ['Ready to\nDominate the Court?', 'Push Your\nLimits Today.', 'Every Move\nMatters.', 'Outwork.\nOutmove. Win.', 'Champions Train\nEvery Day.', 'Your Best Game\nStarts Here.', 'No Limits.\nFull Court.', 'Consistency\nBuilds Champions.'],
};

/** Returns the 8 rotating home-screen hero headlines in the given language. */
export function getHeroHeadlines(language: Language): readonly string[] {
  return HERO_HEADLINES_I18N[language] ?? HERO_HEADLINES_I18N['en-US'];
}

// ─── Routines screen empty-state strings ─────────────────────────────────────

const COMING_SOON_LABEL: Record<Language, string> = {
  'en-US': 'Coming Soon', 'en-GB': 'Coming Soon',
  es: 'Próximamente', fr: 'Bientôt', de: 'Demnächst',
  it: 'Prossimamente', pt: 'Em Breve', nl: 'Binnenkort',
  hi: 'जल्द आ रहा है', ar: 'قريباً', zh: '即将推出',
  ja: '近日公開', ko: '곧 출시', he: 'בקרוב',
  sw: 'Inakuja Hivi Karibuni', qu: 'Coming Soon', ha: 'Coming Soon',
};

const PROGRAMS_IN_DEV_LABEL: Record<Language, string> = {
  'en-US': 'Pro-level programs are in development', 'en-GB': 'Pro-level programs are in development',
  es: 'Los programas Pro están en desarrollo', fr: 'Les programmes Pro sont en développement',
  de: 'Pro-Programme sind in Entwicklung', it: 'I programmi Pro sono in sviluppo',
  pt: 'Programas Pro estão em desenvolvimento', nl: 'Pro-programma\'s zijn in ontwikkeling',
  hi: 'प्रो-लेवल प्रोग्राम विकास में हैं', ar: 'برامج المستوى الاحترافي قيد التطوير',
  zh: '专业级课程正在开发中', ja: 'プロレベルのプログラムを開発中',
  ko: '프로 레벨 프로그램 개발 중', he: 'תוכניות ברמת פרו בפיתוח',
  sw: 'Programu za Kiwango cha Pro zinaendelezwa',
  qu: 'Pro-level programs are in development', ha: 'Pro-level programs are in development',
};

export function getComingSoonLabel(language: Language): string {
  return COMING_SOON_LABEL[language] ?? COMING_SOON_LABEL['en-US'];
}

export function getProgramsInDevLabel(language: Language): string {
  return PROGRAMS_IN_DEV_LABEL[language] ?? PROGRAMS_IN_DEV_LABEL['en-US'];
}
