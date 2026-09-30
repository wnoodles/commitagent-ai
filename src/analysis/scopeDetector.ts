const GENERIC_DIRS = new Set([
  'src', 'app', 'apps', 'packages', 'views', 'view', 'pages', 'page', 'components',
  'component', 'api', 'apis', 'services', 'service', 'lib', 'libs', 'test', 'tests'
]);

function withoutExtension(file: string): string {
  return file.replace(/\.[^.]+$/, '');
}

export function detectScopes(paths: string[]): string[] {
  const counts = new Map<string, number>();
  for (const filePath of paths) {
    const parts = filePath.split('/').filter(Boolean);
    const candidates = parts.slice(0, -1).filter(part => !GENERIC_DIRS.has(part.toLowerCase()));
    const scope = candidates[0] ?? withoutExtension(parts.at(-1) ?? '');
    if (scope && !/^(index|main|readme|package)$/i.test(scope)) {
      counts.set(scope, (counts.get(scope) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 3)
    .map(([scope]) => scope);
}
