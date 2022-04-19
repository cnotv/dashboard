export const UNITS = ['', 'K', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y'];
export const FRACTIONAL = ['', 'm', 'u', 'n', 'p', 'f', 'a', 'z', 'y']; // milli micro nano pico femto

interface FormatOptions {
  addSuffix?: boolean,
  addSuffixSpace?: boolean,
  canRoundToZero?: boolean,
  firstSuffix?: string | null,
  increment?: number,
  maxExponent?: number,
  maxPrecision?: number,
  minExponent?: number,
  startingExponent?: number,
  suffix?: string,
}

interface ParseOptions {
  allowFractional?: boolean,
  increment?: number,
}

/**
 * Format number to given parameters and return string including pre/suffix
 * This includes conversion from bits/bytes
 * @param {*} inValue initial value
 * @param {*} param1 formatting options
 * @returns
 */
export function formatSi(inValue: number, {
  increment = 1000,
  addSuffix = true,
  addSuffixSpace = true,
  suffix = '',
  firstSuffix = null,
  startingExponent = 0,
  minExponent = 0,
  maxExponent = 99,
  maxPrecision = 2,
  canRoundToZero = true,
}: FormatOptions): string {
  let val = inValue;
  let exp = startingExponent;
  const divide = maxExponent >= 0;

  // TODO More to think about re: min > max
  if (divide) {
    while ( ( val >= increment && exp + 1 < UNITS.length && exp < maxExponent ) || exp < minExponent ) {
      val = val / increment;
      exp++;
    }
  } else {
    while ( ( val < increment && exp + 1 < FRACTIONAL.length && exp < (maxExponent * -1) ) || exp < (minExponent * -1) ) {
      val = val * increment;
      exp++;
    }
  }

  let out = '';

  if ( val < 10 && maxPrecision >= 1 ) {
    out = `${ Math.round(val * (10 ** maxPrecision) ) / (10 ** maxPrecision) }`;
  } else {
    out = `${ Math.round(val) }`;
  }

  if (out === '0' && !canRoundToZero && inValue !== 0) {
    const exponent = exponentNeeded(inValue, increment);

    return formatSi(inValue, {
      increment,
      addSuffix,
      suffix,
      firstSuffix,
      startingExponent,
      minExponent:    exponent,
      maxExponent:    exponent,
      maxPrecision,
      canRoundToZero: true,
    });
  }

  if ( addSuffix ) {
    if (addSuffixSpace) {
      out += ` `;
    }

    if ( exp === 0 && firstSuffix !== null) {
      out += `${ firstSuffix }`;
    } else {
      out += `${ divide ? UNITS[exp] : FRACTIONAL[exp] }${ suffix }` || '';
    }
  }

  return out;
}

export function exponentNeeded(val: number, increment = 1000): number {
  let exp = 0;

  while ( val >= increment ) {
    val = val / increment;
    exp++;
  }

  return exp;
}

/**
 * Convert string to integer in bits/bytes, formatting with given options
 * @param inValue Initial value
 * @param opt Parsing options
 * @returns
 */
export function parseSi(inValue: string, opt?: ParseOptions): number {
  opt = opt || {};
  let increment = opt.increment;
  const allowFractional = opt.allowFractional !== false;

  if ( !inValue || typeof inValue !== 'string' || !inValue.length ) {
    return NaN;
  }

  inValue = inValue.replace(/,/g, '');

  // eslint-disable-next-line prefer-const
  let [, valStr, unit, incStr] = inValue.match(/^([0-9.-]+)\s*([^0-9.-]?)([^0-9.-]?)/) as RegExpMatchArray;
  const val = parseFloat(valStr);

  if ( !unit ) {
    return val;
  }

  // micro "mu" symbol -> u
  if ( unit.charCodeAt(0) === 181 ) {
    unit = 'u';
  }

  const divide = FRACTIONAL.includes(unit);
  const multiply = UNITS.includes(unit.toUpperCase());

  if ( !increment ) {
    // Automatically handle 1 KB = 1000B, 1 KiB = 1024B if no increment set
    if ( (multiply || divide) && incStr === 'i' ) {
      increment = 1024;
    } else {
      increment = 1000;
    }
  }

  if ( divide && allowFractional ) {
    const exp = FRACTIONAL.indexOf(unit);

    return val / (increment ** exp);
  }

  if ( multiply ) {
    const exp = UNITS.indexOf(unit.toUpperCase());

    return val * (increment ** exp);
  }

  // Unrecognized unit character
  return val;
}

export const MEMORY_PARSE_RULES = {
  memory: {
    format: {
      addSuffix:        true,
      firstSuffix:      'B',
      increment:        1024,
      maxExponent:      99,
      maxPrecision:     2,
      minExponent:      0,
      startingExponent: 0,
      suffix:           'iB',
    }
  }
};

export function createMemoryFormat(n: number): FormatOptions {
  const exponent = exponentNeeded(n, MEMORY_PARSE_RULES.memory.format.increment);

  return {
    ...MEMORY_PARSE_RULES.memory.format,
    maxExponent: exponent,
    minExponent: exponent,
  };
}

function createMemoryUnits(n: number): string {
  const exponent = exponentNeeded(n, MEMORY_PARSE_RULES.memory.format.increment);

  return `${ UNITS[exponent] }${ MEMORY_PARSE_RULES.memory.format.suffix }`;
}

export function createMemoryValues(total: number, useful: boolean) {
  const parsedTotal = parseSi((total || '0').toString());
  const parsedUseful = parseSi((useful || '0').toString());
  const format = createMemoryFormat(parsedTotal);
  const formattedTotal = formatSi(parsedTotal, format);
  const formattedUseful = formatSi(parsedUseful, format);

  return {
    total:  Number.parseFloat(formattedTotal),
    useful: Number.parseFloat(formattedUseful),
    units:  createMemoryUnits(parsedTotal)
  };
}

export default {
  exponentNeeded,
  formatSi,
  parseSi,
};
