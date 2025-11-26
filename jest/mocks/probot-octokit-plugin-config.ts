import fs from 'fs';
import * as yaml from 'js-yaml';

export async function composeConfigGet(
  _client: unknown,
  options: { path: string },
): Promise<{ config: Record<string, unknown> | null }> {
  if (options?.path) {
    const content = fs.readFileSync(options.path, 'utf8');
    return { config: (yaml.load(content) as Record<string, unknown>) ?? null };
  }
  return { config: null };
}
