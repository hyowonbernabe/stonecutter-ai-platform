// ---------------------------------------------------------------------------
// Prohibited terms — disease/condition names (whole-word, case-insensitive)
// ---------------------------------------------------------------------------

const DISEASE_TERMS = [
  'cancer', 'tumor', 'carcinoma', 'diabetes', 'diabetic', 'blood sugar disease',
  'heart disease', 'cardiovascular disease', 'heart attack',
  "alzheimer's", 'dementia', 'depression', 'anxiety disorder', 'clinical depression',
  'arthritis', 'rheumatoid arthritis', 'osteoporosis',
  'high blood pressure', 'hypertension', 'high cholesterol', 'hypercholesterolemia',
  'IBS', "Crohn's disease", 'ulcerative colitis', 'insomnia',
  'ADHD', 'ADD', 'autism', "Parkinson's disease", 'multiple sclerosis',
  'lupus', 'fibromyalgia', 'eczema', 'psoriasis', 'dermatitis',
  'UTI', 'urinary tract infection', 'kidney disease', 'liver disease',
  'hip dysplasia', 'canine cancer', 'feline leukemia',
  'parvovirus', 'kennel cough', 'mange', 'seizures', 'epilepsy',
];

// ---------------------------------------------------------------------------
// Prohibited verbs (whole-word, case-insensitive)
// ---------------------------------------------------------------------------

const PROHIBITED_VERBS = [
  'treats', 'treat', 'treatment',
  'cures', 'cure',
  'prevents', 'prevent', 'prevention',
  'heals', 'heal', 'healing',
  'eliminates', 'fights', 'kills',
  'diagnoses', 'diagnose',
  'reverses', 'repairs',
];

// ---------------------------------------------------------------------------
// Approved alternatives lookup
// ---------------------------------------------------------------------------

const ALTERNATIVES: Record<string, string> = {
  // Disease terms -> structure/function language
  'joint pain': 'Supports joint comfort and flexibility',
  'arthritis': 'Supports joint comfort and flexibility',
  'rheumatoid arthritis': 'Supports joint comfort and flexibility',
  'hip dysplasia': 'Supports hip and joint mobility',
  'acne': 'Promotes clear, healthy-looking skin',
  'eczema': 'Supports healthy skin',
  'psoriasis': 'Supports healthy skin',
  'dermatitis': 'Supports healthy skin',
  'heart disease': 'Supports cardiovascular health',
  'cardiovascular disease': 'Supports cardiovascular health',
  'heart attack': 'Supports cardiovascular health',
  'diabetes': 'Supports healthy blood sugar levels already in the normal range',
  'diabetic': 'Supports healthy blood sugar levels already in the normal range',
  'blood sugar disease': 'Supports healthy blood sugar levels already in the normal range',
  'depression': 'Supports a positive mood',
  'clinical depression': 'Supports a positive mood',
  'anxiety disorder': 'Supports a calm, relaxed state',
  'insomnia': 'Supports restful sleep',
  'hair loss': 'Supports healthy hair growth',
  // Verb-based alternatives
  'treats': 'Supports',
  'treat': 'Support',
  'treatment': 'Support',
  'cures': 'Supports',
  'cure': 'Support',
  'prevents': 'Supports',
  'prevent': 'Support',
  'prevention': 'Support',
  'heals': 'Supports',
  'heal': 'Support',
  'healing': 'Supporting',
  'eliminates': 'Supports reduction of',
  'fights': 'Supports',
  'kills': 'Helps manage',
  'diagnoses': 'Identifies',
  'diagnose': 'Identify',
  'reverses': 'Supports',
  'repairs': 'Supports',
};

const DEFAULT_SUGGESTION =
  'Consider using structure/function language instead of disease claims';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ComplianceViolation {
  term: string;
  context: string;
  suggestion: string;
}

export interface CheckComplianceResult {
  violations: ComplianceViolation[];
  isCompliant: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a word-boundary regex for a term. Handles terms with apostrophes
 * and multi-word phrases.
 */
function termToRegex(term: string): RegExp {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'gi');
}

/**
 * Extract the surrounding sentence for a match position.
 * A sentence boundary is the nearest period (or start/end of string).
 */
function extractSentence(text: string, matchStart: number, matchEnd: number): string {
  // Find the start of the sentence (look backwards for '. ' or start of string)
  let sentenceStart = 0;
  for (let i = matchStart - 1; i >= 0; i--) {
    if (text[i] === '.' && (i + 1 >= text.length || text[i + 1] === ' ' || text[i + 1] === '\n')) {
      sentenceStart = i + 1;
      break;
    }
  }

  // Find the end of the sentence (look forwards for '.' or end of string)
  let sentenceEnd = text.length;
  for (let i = matchEnd; i < text.length; i++) {
    if (text[i] === '.') {
      sentenceEnd = i + 1;
      break;
    }
  }

  return text.slice(sentenceStart, sentenceEnd).trim();
}

// ---------------------------------------------------------------------------
// Tool
// ---------------------------------------------------------------------------

/**
 * Check text for compliance violations against Amazon's restricted language
 * policy. Scans for prohibited disease/condition terms and action verbs,
 * returning violations with context and approved alternatives.
 */
export function checkComplianceTool(text: string): CheckComplianceResult {
  const violations: ComplianceViolation[] = [];
  const allTerms = [...DISEASE_TERMS, ...PROHIBITED_VERBS];

  for (const term of allTerms) {
    const regex = termToRegex(term);
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      const matchedText = match[0];
      const context = extractSentence(text, match.index, match.index + matchedText.length);
      const suggestion = ALTERNATIVES[matchedText.toLowerCase()] ?? DEFAULT_SUGGESTION;

      violations.push({ term: matchedText, context, suggestion });
    }
  }

  return {
    violations,
    isCompliant: violations.length === 0,
  };
}
