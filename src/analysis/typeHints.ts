export type CommitType = 'feat' | 'fix' | 'docs' | 'style' | 'refactor' | 'perf' | 'test' | 'build' | 'ci' | 'chore' | 'revert' | 'init' | 'release';

export function detectTypeHints(paths: string[]): CommitType[] {
  if (paths.length === 0) {
    return ['chore'];
  }
  const all = (pattern: RegExp) => paths.every(path => pattern.test(path));
  const any = (pattern: RegExp) => paths.some(path => pattern.test(path));

  if (all(/(^|\/)(docs?\/|readme(?:\.|$)|.*\.md$)/i)) return ['docs'];
  if (all(/(?:\.(?:test|spec)\.|\/tests?\/)/i)) return ['test'];
  if (all(/(^|\/)\.github\/workflows\/|(?:^|\/)(?:gitlab-ci|jenkinsfile)/i)) return ['ci'];
  if (any(/(?:^|\/)(package\.json|pom\.xml|build\.gradle|vite\.config|webpack\.config|rollup\.config|tsconfig\.json)/i)) {
    return ['build', 'chore'];
  }
  return ['feat', 'fix', 'refactor'];
}
