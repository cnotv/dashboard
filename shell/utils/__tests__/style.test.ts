import {
  BLANK_IMAGE,
  StateColor,
  isHigherAlert,
  isTruncated,
  stateColorCssVar,
} from '@shell/utils/style';

describe('stateColorCssVar', () => {
  it.each([
    ['success', 'var(--success)'],
    ['warning', 'var(--warning)'],
    ['error', 'var(--error)'],
    ['info', 'var(--info)'],
    ['disabled', 'var(--disabled)'],
  ] as [StateColor, string][])('returns css var for %s', (color, expected) => {
    expect(stateColorCssVar(color)).toBe(expected);
  });
});

describe('isHigherAlert', () => {
  it.each([
    ['error', 'warning', true],
    ['error', 'success', true],
    ['error', 'info', true],
    ['warning', 'success', true],
    ['warning', 'info', true],
    ['success', 'info', true],
    ['warning', 'error', false],
    ['success', 'error', false],
    ['info', 'error', false],
    ['success', 'warning', false],
    ['info', 'warning', false],
    ['info', 'success', false],
    ['error', 'error', false],
    ['warning', 'warning', false],
    ['info', 'info', false],
    ['disabled', 'info', false],
    ['disabled', 'error', false],
    ['info', 'disabled', true],
    ['error', 'disabled', true],
  ] as [StateColor, StateColor, boolean][])('%s vs %s → %s', (a, b, expected) => {
    expect(isHigherAlert(a, b)).toBe(expected);
  });
});

describe('isTruncated', () => {
  it('returns false when element is null', () => {
    expect(isTruncated(null)).toBe(false);
  });

  it.each([
    {
      desc: 'false when text fits within element bounds',
      el:   {
        scrollWidth: 100, clientWidth: 200, scrollHeight: 20, clientHeight: 20
      },
      expected: false,
    },
    {
      desc: 'true when text is horizontally truncated',
      el:   {
        scrollWidth: 300, clientWidth: 200, scrollHeight: 20, clientHeight: 20
      },
      expected: true,
    },
    {
      desc: 'true when text is vertically truncated',
      el:   {
        scrollWidth: 100, clientWidth: 100, scrollHeight: 50, clientHeight: 40
      },
      expected: true,
    },
    {
      desc: 'false for single-pixel vertical overflow (1px tolerance)',
      el:   {
        scrollWidth: 100, clientWidth: 100, scrollHeight: 21, clientHeight: 20
      },
      expected: false,
    },
    {
      desc: 'true for 2+ pixel vertical overflow',
      el:   {
        scrollWidth: 100, clientWidth: 100, scrollHeight: 22, clientHeight: 20
      },
      expected: true,
    },
  ])('returns $desc', ({ el, expected }) => {
    expect(isTruncated(el as HTMLElement)).toBe(expected);
  });
});

describe('blank image constant', () => {
  it('is a valid base64 data URI', () => {
    expect(BLANK_IMAGE).toMatch(/^data:image\//);
    expect(BLANK_IMAGE).toContain('base64,');
  });
});
