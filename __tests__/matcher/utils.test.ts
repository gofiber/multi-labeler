import { matcherRegex, matcherRegexAny } from '../../src/matcher/utils';

it('should always fail', function () {
  expect(matcherRegex({ regex: undefined, text: 'abc' })).toBeFalsy();
});

it('supports slash-delimited regex strings with flags', function () {
  expect(matcherRegex({ regex: '/(bug|fix)/i', text: 'BUG: something broke' })).toBeTruthy();
});

it('supports multiple flags on slash-delimited regex strings', function () {
  expect(matcherRegex({ regex: '/(bug)/gi', text: 'Spotted a BUG today' })).toBeTruthy();
});

it('supports multiline anchors via regex flags', function () {
  expect(matcherRegex({ regex: '/^bug/m', text: 'changelog\nbug fix listed' })).toBeTruthy();
});

it('supports plain regex strings without slashes', function () {
  expect(matcherRegex({ regex: 'bug', text: 'BUG: something broke' })).toBeFalsy();
});

it('uses slash-delimited regex for matcherRegexAny', function () {
  expect(matcherRegexAny('/(bug|fix)/i', ['Refactor', 'BUG: test failure'])).toBeTruthy();
});

it('logs invalid slash-delimited regex and still matches via fallback', function () {
  const errorMock = jest.spyOn(console, 'error').mockImplementation(() => {});

  try {
    expect(matcherRegex({ regex: '/foo/uubar', text: '/foo/uubar' })).toBeTruthy();
    expect(errorMock).toHaveBeenCalledTimes(1);
    expect(errorMock.mock.calls[0][0]).toContain('Invalid regex /foo/uubar');
  } finally {
    errorMock.mockRestore();
  }
});

it('logs invalid plain regex and returns a safe non-matching regex', function () {
  const errorMock = jest.spyOn(console, 'error').mockImplementation(() => {});

  try {
    expect(matcherRegex({ regex: '(', text: 'still safe' })).toBeFalsy();
    expect(errorMock).toHaveBeenCalledTimes(1);
    expect(errorMock.mock.calls[0][0]).toContain('Invalid regex (');
  } finally {
    errorMock.mockRestore();
  }
});
