import { ChangedFile, RawChanges } from './changeCollector';

export interface SanitizeOptions {
  maxDiffChars: number;
  maxFileDiffChars: number;
  excludePatterns: string[];
  redactSensitiveContent: boolean;
}

export interface SanitizedChanges {
  source: RawChanges['source'];
  diff: string;
  files: Array<ChangedFile & { diffIncluded: boolean }>;
  truncated: boolean;
  redacted: boolean;
}

const DEFAULT_EXCLUDES = [
  'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock', '*.map',
  'dist/**', 'build/**', 'coverage/**', 'vendor/**'
];

const SENSITIVE_PATHS = [
  /^\.env(?:\.|$)/i, /(?:^|\/)\.env(?:\.|$)/i, /\.pem$/i, /\.key$/i,
  /\.p12$/i, /\.pfx$/i, /secret/i, /credential/i
];

function globToRegExp(glob: string): RegExp {
  const escaped = glob
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '::DOUBLE_STAR::')
    .replace(/\*/g, '[^/]*')
    .replace(/::DOUBLE_STAR::/g, '.*')
    .replace(/\?/g, '.');
  return new RegExp(`(^|/)${escaped}$`, 'i');
}

function diffPath(block: string): string {
  const header = block.match(/^diff --git a\/(.+?) b\/(.+)$/m);
  return (header?.[2] ?? '').trim();
}

function redactSecrets(text: string): { text: string; changed: boolean } {
  let changed = false;
  const replacements: Array<[RegExp, string]> = [
    [/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g, '[REDACTED PRIVATE KEY]'],
    [/\b(?:sk|pk)-[A-Za-z0-9_-]{16,}\b/g, '[REDACTED API KEY]'],
    [/(Authorization:\s*Bearer\s+)[^\s"']+/gi, '$1[REDACTED]'],
    [/((?:api[_-]?key|token|password|secret)\s*[:=]\s*["']?)[^\s"']{8,}/gi, '$1[REDACTED]']
  ];
  let result = text;
  for (const [pattern, replacement] of replacements) {
    const next = result.replace(pattern, replacement);
    changed ||= next !== result;
    result = next;
  }
  return { text: result, changed };
}

function truncateBlock(block: string, limit: number): string {
  if (block.length <= limit) {
    return block;
  }
  const marker = '\n[diff truncated]\n';
  const side = Math.max(200, Math.floor((limit - marker.length) / 2));
  return block.slice(0, side) + marker + block.slice(-side);
}

export function sanitizeChanges(raw: RawChanges, options: SanitizeOptions): SanitizedChanges {
  const excludeMatchers = [...DEFAULT_EXCLUDES, ...options.excludePatterns].map(globToRegExp);
  const blocks = raw.diff.split(/(?=^diff --git )/m).filter(Boolean);
  let truncated = false;
  let redacted = false;
  const includedPaths = new Set<string>();
  const output: string[] = [];

  for (const originalBlock of blocks) {
    const filePath = diffPath(originalBlock);
    const excluded = excludeMatchers.some(pattern => pattern.test(filePath));
    const sensitive = SENSITIVE_PATHS.some(pattern => pattern.test(filePath));
    if (excluded || sensitive) {
      output.push(`diff --git a/${filePath} b/${filePath}\n[diff body omitted: ${sensitive ? 'sensitive file' : 'excluded file'}]`);
      redacted ||= sensitive;
      continue;
    }

    let block = originalBlock;
    if (options.redactSensitiveContent) {
      const result = redactSecrets(block);
      block = result.text;
      redacted ||= result.changed;
    }
    const limited = truncateBlock(block, options.maxFileDiffChars);
    truncated ||= limited.length !== block.length;
    output.push(limited);
    if (filePath) {
      includedPaths.add(filePath);
    }
  }

  let diff = output.join('\n');
  if (diff.length > options.maxDiffChars) {
    diff = diff.slice(0, options.maxDiffChars) + '\n[total diff truncated]';
    truncated = true;
  }

  return {
    source: raw.source,
    diff,
    files: raw.files.map(file => ({ ...file, diffIncluded: includedPaths.has(file.path) })),
    truncated,
    redacted
  };
}
