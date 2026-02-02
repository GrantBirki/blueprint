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
