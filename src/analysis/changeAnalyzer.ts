import { SanitizedChanges } from '../git/diffSanitizer';
import { detectScopes } from './scopeDetector';
import { CommitType, detectTypeHints } from './typeHints';

export interface ChangeSummary {
  source: SanitizedChanges['source'];
  files: SanitizedChanges['files'];
  additions: number;
  deletions: number;
  possibleScopes: string[];
  possibleTypes: CommitType[];
  truncated: boolean;
  redacted: boolean;
}

export function analyzeChanges(changes: SanitizedChanges): ChangeSummary {
  let additions = 0;
  let deletions = 0;
  for (const line of changes.diff.split('\n')) {
    if (line.startsWith('+') && !line.startsWith('+++')) additions += 1;
    if (line.startsWith('-') && !line.startsWith('---')) deletions += 1;
  }
  const paths = [...new Set(changes.files.map(file => file.path))];
  return {
    source: changes.source,
    files: changes.files,
    additions,
    deletions,
    possibleScopes: detectScopes(paths),
    possibleTypes: detectTypeHints(paths),
    truncated: changes.truncated,
    redacted: changes.redacted
  };
}
