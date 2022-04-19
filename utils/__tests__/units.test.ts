import { formatSi } from '~/utils/units';

describe('fx: formatSi', () => {
  it.each([
    {
      value:       10,
      expectation: '10',
      options:     {
        increment:   1,
        maxExponent: 2,
        minExponent: 2,
      }
    },
    {
      value:       10,
      expectation: '5',
      options:     {
        increment:   2,
        maxExponent: 1,
        minExponent: 1,
      }
    },
    {
      value:       10,
      expectation: '2.5',
      options:     {
        increment:   2,
        maxExponent: 2,
        minExponent: 2,
      }
    },
  ])('should parse value based on incremental and exponential values', ({ value, expectation, options }) => {
    const result = formatSi(value, {
      addSuffix: false,
      ...options
    });

    expect(result).toBe(expectation);
  });

  it('should add suffix', () => {
    const value = 10;
    const suffix = 'anything';
    const expectation = `${ value } ${ suffix }`;

    const result = formatSi(value, {
      addSuffix: true,
      suffix
    });

    expect(result).toBe(expectation);
  });
});
