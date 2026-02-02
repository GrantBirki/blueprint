import {
  editionBinary,
  modifiersBinary,
  intToBinary,
  signed16,
  bitsToBase64,
  base64ToBits,
  toUrlSafe,
  fromUrlSafe
} from "../src/logic/handUrl.ts";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || "Assertion failed");
  }
}

function assertEquals(actual, expected, message) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    throw new Error(
      `${message || "Expected equality"}\nExpected: ${expectedJson}\nActual: ${actualJson}`
    );
  }
}

Deno.test("editionBinary prioritizes modifier flags", () => {
  assertEquals(editionBinary({}), [0]);
  assertEquals(editionBinary({ foil: true, polychrome: true }), [1, 0, 0]);
  assertEquals(editionBinary({ holographic: true }), [1, 1, 0]);
  assertEquals(editionBinary({ polychrome: true }), [1, 0, 1]);
  assertEquals(editionBinary({ disabled: true }), [1, 1, 1]);
});

Deno.test("modifiersBinary encodes modifier flags with double=false", () => {
  assertEquals(modifiersBinary({ chance: true }), [1, 0, 0, 0]);
  assertEquals(modifiersBinary({ glass: true }), [0, 1, 0, 0]);
  assertEquals(modifiersBinary({ increment: true }), [1, 1, 0, 0]);
  assertEquals(modifiersBinary({ mult: true }), [0, 0, 1, 0]);
  assertEquals(modifiersBinary({ steel: true }), [1, 0, 1, 0]);
  assertEquals(modifiersBinary({ stone: true }), [0, 1, 1, 0]);
  assertEquals(modifiersBinary({ wild: true }), [1, 1, 1, 0]);
  assertEquals(modifiersBinary({}), [0, 0, 0, 0]);
});

Deno.test("modifiersBinary encodes double flag and honors first match", () => {
  assertEquals(modifiersBinary({ chance: true, glass: true, double: true }), [1, 0, 0, 1]);
  assertEquals(modifiersBinary({ glass: true, double: true }), [0, 1, 0, 1]);
  assertEquals(modifiersBinary({ double: true }), [0, 0, 0, 1]);
});

Deno.test("intToBinary produces least-significant-first arrays", () => {
  assertEquals(intToBinary(5, 4), [1, 0, 1, 0]);
  assertEquals(intToBinary(0, 3), [0, 0, 0]);
});

Deno.test("signed16 encodes sign and magnitude", () => {
  assertEquals(signed16(3), [0, ...intToBinary(3, 15)]);
  assertEquals(signed16(-3), [1, ...intToBinary(3, 15)]);
});

Deno.test("bitsToBase64 and base64ToBits roundtrip", () => {
  const bits = [1, 0, 1, 0, 1, 1, 0, 0, 1, 1, 1];
  const encoded = bitsToBase64(bits);
  const decoded = base64ToBits(encoded);

  assertEquals(decoded.slice(0, bits.length), bits);
  assert(decoded.length % 8 === 0, "decoded length should be byte-aligned");
});

Deno.test("url-safe helpers swap +/ and -_", () => {
  const original = "ab+/cd";
  const safe = toUrlSafe(original);
  assertEquals(safe, "ab-_cd");
  assertEquals(fromUrlSafe(safe), original);
  assertEquals(fromUrlSafe(original), original);
});
