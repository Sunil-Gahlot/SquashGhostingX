import { Language } from '../types';

export const LANGUAGE_OPTIONS: Array<{ label: string; value: Language }> = [
  { label: 'English (US)', value: 'en-US' },
  { label: 'English (UK)', value: 'en-GB' },
  { label: 'Spanish',      value: 'es'    },
  { label: 'French',       value: 'fr'    },
  { label: 'German',       value: 'de'    },
  { label: 'Italian',      value: 'it'    },
  { label: 'Portuguese',   value: 'pt'    },
  { label: 'Dutch',        value: 'nl'    },
  { label: 'Hindi',        value: 'hi'    },
  { label: 'Arabic',       value: 'ar'    },
  { label: 'Chinese',      value: 'zh'    },
  { label: 'Japanese',     value: 'ja'    },
  { label: 'Korean',       value: 'ko'    },
  { label: 'Hebrew',       value: 'he'    },
  { label: 'Swahili',      value: 'sw'    },
  { label: 'Quechua',      value: 'qu'    },
  { label: 'Hausa',        value: 'ha'    },
];

export function getLanguageLabel(lang: Language): string {
  return LANGUAGE_OPTIONS.find(l => l.value === lang)?.label ?? 'English (US)';
}
