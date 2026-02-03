// @ts-nocheck

export function numberWithCommas(x) {
  if(typeof x === 'object') return bigNumberWithCommas(x);
  if(x < 1e11) {
    if((Math.floor(x * 10000) / 10000) % 1 !== 0) {
      return Math.floor(x).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + '.' + (Math.floor(Math.round((x % 1) * 10000) / 10)+'').padStart(3, 0).replace(/0+$/, '');
    }
    return Math.floor(x).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
  return `${Math.floor(x/(10**Math.floor(Math.log10(x)))*10000)/10000}e${Math.floor(Math.log10(x))}`;
}

const compactSuffixes = ["", "K", "M", "B", "T", "Q", "Qi", "Sx", "Sp", "Oc", "No", "Dc"];

function trimTrailingZeros(value) {
  return value.replace(/\.0+$|(\.[0-9]*[1-9])0+$/, "$1");
}

export function formatCompactNumber(x) {
  if(typeof x === 'object') return formatCompactBig(x);
  if(!Number.isFinite(x)) return "0";
  const abs = Math.abs(x);
  if(abs < 1000) {
    return numberWithCommas(x);
  }

  const suffixMap = [
    { value: 1e15, symbol: "Q" },
    { value: 1e12, symbol: "T" },
    { value: 1e9, symbol: "B" },
    { value: 1e6, symbol: "M" },
    { value: 1e3, symbol: "K" }
  ];

  const sign = x < 0 ? "-" : "";
  for(const { value, symbol } of suffixMap) {
    if(abs >= value) {
      const scaled = abs / value;
      const decimals = scaled >= 100 ? 0 : 1;
      return `${sign}${trimTrailingZeros(scaled.toFixed(decimals))}${symbol}`;
    }
  }

  return numberWithCommas(x);
}

export function formatCompactBig(num) {
  if(!num || !Number.isFinite(num[0]) || !Number.isFinite(num[1])) return "0";
  const sign = num[0] < 0 ? "-" : "";
  const absMantissa = Math.abs(num[0]);
  const exponent = num[1];

  if(exponent < 3) {
    const value = absMantissa * (10 ** exponent);
    return `${sign}${formatCompactNumber(value)}`;
  }

  const tier = Math.floor(exponent / 3);
  const suffix = compactSuffixes[tier] || `e${exponent}`;
  const scaled = absMantissa * (10 ** (exponent - tier * 3));
  const decimals = scaled >= 100 ? 0 : 1;
  const formatted = trimTrailingZeros(scaled.toFixed(decimals));
  return suffix.startsWith("e") ? `${sign}${formatted}${suffix}` : `${sign}${formatted}${suffix}`;
}

export function bigNumberWithCommas(num, whole = false) {
  if(num && num[1] > 11) {
    return `${Math.floor(num[0] * 10000) / 10000}e${num[1]}`;
  }

  const x = num[0] * (10 ** num[1]);
  if((Math.floor(x * 10000) / 10000) % 1 !== 0) {
    if(whole) {
      return Math.floor(x).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    return Math.floor(x).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + '.' + (Math.floor(Math.round((x % 1) * 10000) / 10)+'').padStart(3, 0).replace(/0+$/, '');
  }
  return Math.floor(x).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
