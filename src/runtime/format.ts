// @ts-nocheck

function withThousandsSeparators(value) {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function numberWithCommas(x) {
  if(typeof x === 'object') return bigNumberWithCommas(x);
  if(x < 1e11) {
    if((Math.floor(x * 10000) / 10000) % 1 !== 0) {
      return withThousandsSeparators(Math.floor(x)) + '.' + (Math.floor(Math.round((x % 1) * 10000) / 10)+'').padStart(3, 0).replace(/0+$/, '');
    }
    return withThousandsSeparators(Math.floor(x));
  }
  return `${Math.floor(x/(10**Math.floor(Math.log10(x)))*10000)/10000}e${Math.floor(Math.log10(x))}`;
}

export function bigNumberWithCommas(num, whole = false) {
  if(num && num[1] > 11) {
    return `${Math.floor(num[0] * 10000) / 10000}e${num[1]}`;
  }

  const x = num[0] * (10 ** num[1]);
  if((Math.floor(x * 10000) / 10000) % 1 !== 0) {
    if(whole) {
      return withThousandsSeparators(Math.floor(x));
    }
    return withThousandsSeparators(Math.floor(x)) + '.' + (Math.floor(Math.round((x % 1) * 10000) / 10)+'').padStart(3, 0).replace(/0+$/, '');
  }
  return withThousandsSeparators(Math.floor(x));
}

function normalizedMantissaExponent(value) {
  let mantissa = value[0];
  let exponent = value[1];

  if(!Number.isFinite(mantissa) || !Number.isFinite(exponent) || mantissa === 0) {
    return [0, 0];
  }

  while(Math.abs(mantissa) >= 10) {
    mantissa /= 10;
    exponent += 1;
  }

  while(Math.abs(mantissa) < 1) {
    mantissa *= 10;
    exponent -= 1;
  }

  return [mantissa, exponent];
}

export function formatBalatroScore(value, scientificThresholdExponent = 10, scientificPrecision = 3) {
  if(!value) return '0';

  let mantissa = 0;
  let exponent = 0;
  const precision = Math.max(0, scientificPrecision);

  if(typeof value === 'object') {
    [mantissa, exponent] = normalizedMantissaExponent(value);
  }
  else if(Number.isFinite(value)) {
    exponent = Math.floor(Math.log10(Math.abs(value)));
    mantissa = value / (10 ** exponent);
  }
  else {
    return '0';
  }

  if(exponent < scientificThresholdExponent) {
    const wholeValue = Math.trunc(mantissa * (10 ** exponent));
    return withThousandsSeparators(wholeValue);
  }

  let roundedMantissa = Number(mantissa.toFixed(precision));
  let roundedExponent = exponent;

  if(Math.abs(roundedMantissa) >= 10) {
    roundedMantissa /= 10;
    roundedExponent += 1;
  }

  return `${roundedMantissa.toFixed(precision)}e${roundedExponent}`;
}
