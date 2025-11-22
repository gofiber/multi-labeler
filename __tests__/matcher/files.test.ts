import match from '../../src/matcher/files';
import * as github from '@actions/github';
import { Config } from '../../src/config';
import { GitHub } from '@actions/github/lib/utils';

async function getMatchedLabels(config: Config): Promise<string[]> {
  const client = {
    rest: {
      pulls: {
        listFiles: {
          endpoint: {
            // @ts-ignore
            merge(params) {
              return { pull_number: params.pull_number };
            },
          },
        },
      },
    },
    // @ts-ignore
    paginate(params): Promise<any[]> {
      // @ts-ignore
      return Promise.resolve(files[params.pull_number]);
    },
  } as unknown as InstanceType<typeof GitHub>;

  return match(client, config);
}

const basic: Config = {
  version: 'v1',
  labels: [
    {
      label: 'security',
      matcher: {
        files: ['security/**', 'setup/**.xml'],
      },
    },
    {
      label: 'app',
      matcher: {
        files: 'app/**',
      },
    },
    {
      label: 'labeler',
      matcher: {
        files: '.github/labeler.yml',
      },
    },
  ],
};

const complex: Config = {
  version: 'v1',
  labels: [
    {
      label: 'all-app',
      matcher: {
        files: {
          all: ['app/**'],
        },
      },
    },
    {
      label: 'any-app',
      matcher: {
        files: {
          any: ['app/**'],
        },
      },
    },
    {
      label: 'none-app',
      matcher: {
        files: {
          all: ['!app/**'],
        },
      },
    },
    {
      label: 'all-any',
      matcher: {
        files: {
          any: ['security/**', 'setup/**'],
          all: ['!app/**'],
          count: {},
        },
      },
    },
    {
      label: 'S',
      matcher: {
        files: {
          count: {
            eq: 1,
          },
        },
      },
    },
    {
      label: 'NEQ1',
      matcher: {
        files: {
          count: {
            neq: 1,
          },
        },
      },
    },
    {
      label: 'M',
      matcher: {
        files: {
          count: {
            gte: 2,
            lte: 5,
          },
        },
      },
    },
    {
      label: 'L',
      matcher: {
        files: {
          count: {
            gte: 6,
          },
        },
      },
    },
    {
      label: 'mixed-1',
      matcher: {
        files: {
          any: ['app/**'],
          all: ['!setup/**'],
          count: {
            gte: 2,
            lte: 4,
          },
        },
      },
    },
    {
      label: 'invalid-1',
      matcher: {
        files: {
          any: ['app/**'],
          all: ['!setup/**'],
          count: {
            eq: 1,
            neq: 1,
            gte: 1,
            lte: 1,
          },
        },
      },
    },
    {
      label: 'invalid-2',
      matcher: {
        files: {
          any: [],
          all: [],
          count: {
            eq: 1,
            neq: 1,
            gte: 1,
            lte: 1,
          },
        },
      },
    },
    {
      label: 'invalid-3',
      matcher: {
        files: {
          any: [],
          all: ['!setup/**'],
          count: {
            eq: 1,
            neq: 1,
            gte: 1,
            lte: 1,
          },
        },
      },
    },
    {
      label: 'invalid-4',
      matcher: {
        files: {
          all: ['!setup/**'],
          count: {
            eq: 1,
            neq: 1,
            gte: 1,
            lte: 1,
          },
        },
      },
    },
    {
      label: 'invalid-5',
      matcher: {
        files: {
          any: ['!setup/**'],
          all: [],
          count: {
            eq: 1,
            neq: 1,
            gte: 1,
            lte: 1,
          },
        },
      },
    },
    {
      label: 'invalid-6',
      matcher: {
        files: {
          any: ['!setup/**'],
          count: {
            eq: 1,
            neq: 1,
            gte: 1,
            lte: 1,
          },
        },
      },
    },
  ],
};

const files = {
  1: [
    {
      filename: '.github/labeler.yml',
    },
    {
      filename: 'app/main.js',
    },
    {
      filename: 'security/main.js',
    },
    {
      filename: 'security/abc/abc.js',
    },
    {
      filename: 'setup/abc/abc.xml',
    },
    {
      filename: 'setup/abc/abc.js',
    },
  ],
  2: [
    {
      filename: '.github/labeler.yml',
    },
  ],
  3: [
    {
      filename: 'app/main.js',
    },
    {
      filename: 'setup/abc/abc.js',
    },
    {
      filename: 'test/abc/abc.js',
    },
  ],
  4: [
    {
      filename: 'security/main.js',
    },
  ],
  5: [
    {
      filename: 'security/abc/abc.js',
    },
  ],
  6: [
    {
      filename: 'setup/abc/abc.xml',
    },
  ],
  7: [
    {
      filename: 'setup/abc/abc.js',
    },
    {
      filename: '1/abc/abc.js',
    },
    {
      filename: '3/abc/abc.js',
    },
  ],
  8: [{ filename: 'app/1.js' }, { filename: 'app/2.js' }, { filename: 'app/3.js' }],
  9: [{ filename: 'src/index.ts' }, { filename: 'docs/readme.md' }],
  10: [{ filename: 'lib/index.ts' }],
  11: [{ filename: 'app/feature.ts' }, { filename: 'docs/readme.md' }],
  12: [{ filename: 'app/feature.ts' }, { filename: 'app/helpers.ts' }, { filename: 'docs/readme.md' }],
  13: [{ filename: 'src/index.ts' }, { filename: 'docs/readme.md' }],
  14: [{ filename: 'lib/a.ts' }, { filename: 'lib/b.ts' }, { filename: 'misc/test.ts' }],
  15: [],
  16: [{ filename: 'docs/readme.md' }],
};

describe('basic', () => {
  beforeEach(() => {
    // Mock github context
    jest.spyOn(github.context, 'repo', 'get').mockImplementation(() => {
      return {
        owner: 'owner-name',
        repo: 'repo-name',
      };
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('payload empty should be empty', async function () {
    github.context.payload = {};
    expect(await getMatchedLabels(basic)).toEqual([]);
  });

  it('1 should have security/app/labeler', async function () {
    github.context.payload = {
      pull_request: {
        number: 1,
      },
    };
    const labels = await getMatchedLabels(basic);
    expect(labels).toEqual(['security', 'app', 'labeler']);
  });

  it('2 should have labeler', async function () {
    github.context.payload = {
      pull_request: {
        number: 2,
      },
    };
    const labels = await getMatchedLabels(basic);
    expect(labels).toEqual(['labeler']);
  });

  it('3 should have app', async function () {
    github.context.payload = {
      pull_request: {
        number: 3,
      },
    };
    const labels = await getMatchedLabels(basic);
    expect(labels).toEqual(['app']);
  });

  it('4 should have security', async function () {
    github.context.payload = {
      pull_request: {
        number: 4,
      },
    };
    const labels = await getMatchedLabels(basic);
    expect(labels).toEqual(['security']);
  });

  it('5 should have security', async function () {
    github.context.payload = {
      pull_request: {
        number: 5,
      },
    };
    const labels = await getMatchedLabels(basic);
    expect(labels).toEqual(['security']);
  });

  it('6 should be empty', async function () {
    github.context.payload = {
      pull_request: {
        number: 6,
      },
    };
    const labels = await getMatchedLabels(basic);
    expect(labels).toEqual([]);
  });

  it('7 should be empty', async function () {
    github.context.payload = {
      pull_request: {
        number: 7,
      },
    };
    const labels = await getMatchedLabels(basic);
    expect(labels).toEqual([]);
  });
});

describe('complex', () => {
  beforeEach(() => {
    // Mock github context
    jest.spyOn(github.context, 'repo', 'get').mockImplementation(() => {
      return {
        owner: 'owner-name',
        repo: 'repo-name',
      };
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('1 should have complex labels', async function () {
    github.context.payload = {
      pull_request: {
        number: 1,
      },
    };
    const labels = await getMatchedLabels(complex);
    expect(labels).toEqual(['all-app', 'any-app', 'none-app', 'all-any', 'NEQ1', 'L', 'mixed-1']);
  });

  it('2 should have complex labels', async function () {
    github.context.payload = {
      pull_request: {
        number: 2,
      },
    };
    const labels = await getMatchedLabels(complex);
    expect(labels).toEqual(['none-app', 'S']);
  });

  it('3 should have complex labels', async function () {
    github.context.payload = {
      pull_request: {
        number: 3,
      },
    };
    const labels = await getMatchedLabels(complex);
    expect(labels).toEqual(['all-app', 'any-app', 'none-app', 'all-any', 'NEQ1', 'M', 'mixed-1']);
  });

  it('4 should have complex labels', async function () {
    github.context.payload = {
      pull_request: {
        number: 4,
      },
    };
    const labels = await getMatchedLabels(complex);
    expect(labels).toEqual(['none-app', 'all-any', 'S']);
  });

  it('5 should have complex labels', async function () {
    github.context.payload = {
      pull_request: {
        number: 5,
      },
    };
    const labels = await getMatchedLabels(complex);
    expect(labels).toEqual(['none-app', 'all-any', 'S']);
  });

  it('6 should have complex labels', async function () {
    github.context.payload = {
      pull_request: {
        number: 6,
      },
    };
    const labels = await getMatchedLabels(complex);
    expect(labels).toEqual(['none-app', 'all-any', 'S']);
  });

  it('7 should have complex labels', async function () {
    github.context.payload = {
      pull_request: {
        number: 7,
      },
    };
    const labels = await getMatchedLabels(complex);
    expect(labels).toEqual(['none-app', 'all-any', 'NEQ1', 'M']);
  });

  it('8 should have complex labels', async function () {
    github.context.payload = {
      pull_request: {
        number: 8,
      },
    };
    const labels = await getMatchedLabels(complex);
    expect(labels).toEqual(['all-app', 'any-app', 'NEQ1', 'M', 'mixed-1']);
  });
});

describe('all matcher behavior', () => {
  const globsConfig: Config = {
    version: 'v1',
    labels: [
      {
        label: 'src-only',
        matcher: {
          files: {
            all: ['src/**'],
          },
        },
      },
    ],
  };

  beforeEach(() => {
    jest.spyOn(github.context, 'repo', 'get').mockImplementation(() => {
      return {
        owner: 'owner-name',
        repo: 'repo-name',
      };
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('matches when each glob is satisfied by at least one file', async function () {
    github.context.payload = {
      pull_request: {
        number: 9,
      },
    };

    const labels = await getMatchedLabels(globsConfig);
    expect(labels).toEqual(['src-only']);
  });

  it('does not match when glob does not match any files', async function () {
    github.context.payload = {
      pull_request: {
        number: 10,
      },
    };

    const labels = await getMatchedLabels(globsConfig);
    expect(labels).toEqual([]);
  });
});

describe('count matcher scoping', () => {
  const scopedCountConfig: Config = {
    version: 'v1',
    labels: [
      {
        label: 'app-lte-1',
        matcher: {
          files: {
            any: ['app/**'],
            count: { lte: 1 },
          },
        },
      },
      {
        label: 'app-eq-1',
        matcher: {
          files: {
            any: ['app/**'],
            count: { eq: 1 },
          },
        },
      },
      {
        label: 'src-eq-1',
        matcher: {
          files: {
            all: ['src/**'],
            count: { eq: 1 },
          },
        },
      },
      {
        label: 'lib-eq-2',
        matcher: {
          files: {
            any: ['lib/**'],
            all: ['lib/**'],
            count: { eq: 2 },
          },
        },
      },
    ],
  };

  beforeEach(() => {
    jest.spyOn(github.context, 'repo', 'get').mockImplementation(() => {
      return {
        owner: 'owner-name',
        repo: 'repo-name',
      };
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('counts only files matching the any globs', async function () {
    github.context.payload = {
      pull_request: {
        number: 11,
      },
    };

    const labels = await getMatchedLabels(scopedCountConfig);
    expect(labels).toEqual(['app-lte-1', 'app-eq-1']);
  });

  it('ignores unrelated files when evaluating counts', async function () {
    github.context.payload = {
      pull_request: {
        number: 12,
      },
    };

    const labels = await getMatchedLabels(scopedCountConfig);
    expect(labels).toEqual([]);
  });

  it('uses files matching all globs for counts', async function () {
    github.context.payload = {
      pull_request: {
        number: 13,
      },
    };

    const labels = await getMatchedLabels(scopedCountConfig);
    expect(labels).toEqual(['src-eq-1']);
  });

  it('reuses glob-matched files for count checks', async function () {
    github.context.payload = {
      pull_request: {
        number: 14,
      },
    };

    const labels = await getMatchedLabels(scopedCountConfig);
    expect(labels).toEqual(['lib-eq-2']);
  });
});

describe('zero count handling', () => {
  const zeroCountConfig: Config = {
    version: 'v1',
    labels: [
      {
        label: 'no-files-eq',
        matcher: {
          files: {
            count: { eq: 0 },
          },
        },
      },
      {
        label: 'no-files-lte',
        matcher: {
          files: {
            count: { lte: 0 },
          },
        },
      },
    ],
  };

  beforeEach(() => {
    jest.spyOn(github.context, 'repo', 'get').mockImplementation(() => {
      return {
        owner: 'owner-name',
        repo: 'repo-name',
      };
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('applies labels when no files are present', async function () {
    github.context.payload = {
      pull_request: {
        number: 15,
      },
    };

    const labels = await getMatchedLabels(zeroCountConfig);
    expect(labels).toEqual(['no-files-eq', 'no-files-lte']);
  });

  it('does not apply labels when files exceed zero thresholds', async function () {
    github.context.payload = {
      pull_request: {
        number: 16,
      },
    };

    const labels = await getMatchedLabels(zeroCountConfig);
    expect(labels).toEqual([]);
  });
});
