export interface EditionModifiers {
  foil?: boolean;
  holographic?: boolean;
  polychrome?: boolean;
  disabled?: boolean;
}

export interface CardModifiers extends EditionModifiers {
  double?: boolean;
  chance?: boolean;
  glass?: boolean;
  increment?: boolean;
  mult?: boolean;
  steel?: boolean;
  stone?: boolean;
  wild?: boolean;
}

export function editionBinary(modifiers: EditionModifiers): number[] {
  if (modifiers.foil || modifiers.holographic || modifiers.polychrome || modifiers.disabled) {
    if (modifiers.foil) {
      return [1, 0, 0];
    }
    if (modifiers.holographic) {
      return [1, 1, 0];
    }
    if (modifiers.polychrome) {
      return [1, 0, 1];
    }
    return [1, 1, 1];
  }
  return [0];
}

export function modifiersBinary(modifiers: CardModifiers): number[] {
  const double = modifiers.double ? 1 : 0;

  if (modifiers.chance) {
    return [1, 0, 0, double];
  }
  if (modifiers.glass) {
    return [0, 1, 0, double];
  }
  if (modifiers.increment) {
    return [1, 1, 0, double];
  }
  if (modifiers.mult) {
    return [0, 0, 1, double];
  }
  if (modifiers.steel) {
    return [1, 0, 1, double];
  }
  if (modifiers.stone) {
    return [0, 1, 1, double];
  }
  if (modifiers.wild) {
    return [1, 1, 1, double];
  }

  return [0, 0, 0, double];
}

export function intToBinary(num: number, bits: number): number[] {
  const value: number[] = [];
  for (let i = 0; i < bits; i++) {
    value.push(num & (1 << i) ? 1 : 0);
  }
  return value;
}

export function signed16(num: number): number[] {
  return [num < 0 ? 1 : 0, ...intToBinary(Math.abs(num), 15)];
}

export function bitsToBase64(bitsArray: number[]): string {
  const binaryString = bitsArray.join("");
  const paddedBinaryString = binaryString.padEnd(
    Math.ceil(binaryString.length / 8) * 8,
    "0"
  );

  const bytes: number[] = [];
  for (let i = 0; i < paddedBinaryString.length; i += 8) {
    bytes.push(parseInt(paddedBinaryString.substr(i, 8), 2));
  }

  const base64String = btoa(String.fromCharCode.apply(null, bytes));
  return base64String.replace(/=/g, "");
}

export function base64ToBits(base64String: string): number[] {
  const binaryString = atob(base64String);
  const bits: number[] = [];

  for (let i = 0; i < binaryString.length; i++) {
    const byte = binaryString
      .charCodeAt(i)
      .toString(2)
      .padStart(8, "0")
      .split("")
      .map((value) => Number(value));
    bits.push(...byte);
  }

  return bits;
}

export function toUrlSafe(str: string): string {
  return str.replace(/\+/g, "-").replace(/\//g, "_");
}

export function fromUrlSafe(str: string): string {
  if (str.indexOf("/") > 0 || str.indexOf("+") > 0) {
    return str;
  }
  return str.replace(/_/g, "/").replace(/-/g, "+");
}
