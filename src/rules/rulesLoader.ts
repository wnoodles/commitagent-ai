import * as vscode from 'vscode';
import { DEFAULT_COMMIT_RULES } from './defaultRules';

const FALLBACK_CANDIDATES = [
  '.commitagent-rules/commit-style.md',
  '.commitagentrc.md',
  '.commitagentrc.json',
  '.aicommitrc.md'
];

async function readIfExists(uri: vscode.Uri): Promise<string | undefined> {
  try {
    const bytes = await vscode.workspace.fs.readFile(uri);
    if (bytes.byteLength > 64 * 1024) {
      return undefined;
    }
    const text = Buffer.from(bytes).toString('utf8').trim();
    return text || undefined;
  } catch {
    return undefined;
  }
}

export async function loadCommitRules(rootUri: vscode.Uri, configuredPath: string): Promise<{ content: string; source: string }> {
  const candidates = [...new Set([configuredPath, ...FALLBACK_CANDIDATES].filter(Boolean))];
  for (const candidate of candidates) {
    if (candidate.includes('..') || candidate.startsWith('/') || /^[A-Za-z]:[\\/]/.test(candidate)) {
      continue;
    }
    const uri = vscode.Uri.joinPath(rootUri, ...candidate.replace(/\\/g, '/').split('/'));
    const content = await readIfExists(uri);
    if (content) {
      return { content, source: candidate };
    }
  }
  return { content: DEFAULT_COMMIT_RULES, source: 'built-in defaults' };
}
