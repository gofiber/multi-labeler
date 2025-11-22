interface MatcherRegexParams {
  regex?: string;
  text: string;
}

export function matcherRegex({ regex, text }: MatcherRegexParams): boolean {
  if (!regex) {
    return false;
  }

  return toRegExp(regex).test(text);
}

export function matcherRegexAny(regex: string, anyTexts: string[]): boolean {
  const re = toRegExp(regex);
  return !!anyTexts.find((text) => {
    return re.test(text);
  });
}

function toRegExp(regex: string): RegExp {
  if (regex.startsWith('/')) {
    const lastSlashIndex = regex.lastIndexOf('/');
    if (lastSlashIndex > 0) {
      const pattern = regex.slice(1, lastSlashIndex);
      const flags = regex.slice(lastSlashIndex + 1);

      try {
        return new RegExp(pattern, flags);
      } catch (e) {
        const error = e instanceof Error ? e : new Error(String(e));
        console.error(`Invalid regex ${regex}: ${error.message}`);
        // fall through to default construction below
      }
    }
  }

  try {
    return new RegExp(regex);
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e));
    console.error(`Invalid regex ${regex}: ${error.message}`);
    return new RegExp('(?!.*)');
  }
}
