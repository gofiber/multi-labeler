import { Config } from '../config';
import { GitHub } from '@actions/github/lib/utils';
import * as github from '@actions/github';
import { Minimatch } from 'minimatch';

/**
 * Type-safe FileMatcher for convenience.
 */
interface FileMatcher {
  label: string;
  any: string[];
  all: string[];
  count?: FileCountMatcher;
}

interface FileCountMatcher {
  lte?: number;
  gte?: number;
  eq?: number;
  neq?: number;
}

/**
 * Get a type-safe FileMatcher
 */
function getMatchers(config: Config): FileMatcher[] {
  return config
    .labels!.filter((value) => {
      if (Array.isArray(value.matcher?.files)) {
        return value.matcher?.files.length;
      }

      return value.matcher?.files;
    })
    .map(({ label, matcher }) => {
      const files = matcher!.files!;
      if (typeof files === 'string') {
        return {
          label,
          any: [files],
          all: [],
        };
      }

      if (Array.isArray(files)) {
        return {
          label,
          any: files,
          all: [],
        };
      }

      return {
        label,
        any: files.any || [],
        all: files.all || [],
        count: {
          lte: files.count?.lte,
          gte: files.count?.gte,
          eq: files.count?.eq,
          neq: files.count?.neq,
        },
      };
    })
    .filter(({ any, all, count }) => {
      const hasCount =
        count !== undefined &&
        (count.lte !== undefined || count.gte !== undefined || count.eq !== undefined || count.neq !== undefined);

      return any.length || all.length || hasCount;
    });
}

async function getFiles(client: InstanceType<typeof GitHub>, pr_number: number): Promise<string[]> {
  const responses = await client.paginate(
    client.rest.pulls.listFiles.endpoint.merge({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      pull_number: pr_number,
    }),
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return responses.map((c: any) => c.filename);
}

/**
 * if globs is empty = matched
 * if globs is not empty, any files must match
 */
function toMatchers(globs: string[]): Minimatch[] {
  return globs.map((g) => new Minimatch(g));
}

function anyMatch(files: string[], matchers: Minimatch[]): boolean {
  if (!matchers.length) {
    return true;
  }

  for (const matcher of matchers) {
    for (const file of files) {
      if (matcher.match(file)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * if globs is empty = matched
 * if globs is not empty, each glob must match at least one file
 */
function allMatch(files: string[], matchers: Minimatch[]): boolean {
  if (!matchers.length) {
    return true;
  }

  return matchers.every((matcher) => files.some((file) => matcher.match(file)));
}

function matchedFiles(files: string[], matchers: Minimatch[]): string[] {
  if (!matchers.length) {
    return [];
  }

  return files.filter((file) => matchers.some((matcher) => matcher.match(file)));
}

/**
 * if count not available, return true
 * else all count pattern must match,
 * ignored if any are undefined
 */
function countMatch(files: string[], count?: FileCountMatcher): boolean {
  if (!count) {
    return true;
  }

  return (
    (count?.eq === undefined || count.eq === files.length) &&
    (count?.neq === undefined || count.neq !== files.length) &&
    (count?.lte === undefined || count.lte >= files.length) &&
    (count?.gte === undefined || count.gte <= files.length)
  );
}

export default async function match(client: InstanceType<typeof GitHub>, config: Config): Promise<string[]> {
  const pr_number = github.context.payload.pull_request?.number;

  if (!pr_number) {
    return [];
  }

  const matchers = getMatchers(config);

  if (!matchers.length) {
    return [];
  }

  const files = await getFiles(client, pr_number);

  return matchers
    .filter((matcher) => {
      const anyMatchers = toMatchers(matcher.any);
      const allMatchers = toMatchers(matcher.all);

      if (!allMatch(files, allMatchers) || !anyMatch(files, anyMatchers)) {
        return false;
      }

      const scopedFiles = (() => {
        if (!anyMatchers.length && !allMatchers.length) {
          return files;
        }

        const matched = new Set([...matchedFiles(files, anyMatchers), ...matchedFiles(files, allMatchers)]);
        return files.filter((file) => matched.has(file));
      })();

      return countMatch(scopedFiles, matcher.count);
    })
    .map((value) => value.label);
}
