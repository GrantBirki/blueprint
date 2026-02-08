import { bigNumberWithCommas, numberWithCommas, formatBalatroScore } from "../src/runtime/format.ts";

function assertEquals(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(
      `${message || "Expected equality"}\nExpected: ${expected}\nActual: ${actual}`
    );
  }
}

Deno.test("numberWithCommas formats integer values", () => {
  assertEquals(numberWithCommas(1234567), "1,234,567");
});

Deno.test("numberWithCommas formats fractional values", () => {
  assertEquals(numberWithCommas(1234.56789), "1,234.567");
});

Deno.test("numberWithCommas formats large values using exponent", () => {
  assertEquals(numberWithCommas(1234500000000), "1.2345e12");
});

Deno.test("numberWithCommas delegates to bigNumberWithCommas for objects", () => {
  assertEquals(numberWithCommas([1.23456, 12]), "1.2345e12");
});

Deno.test("bigNumberWithCommas handles exponent form", () => {
  assertEquals(bigNumberWithCommas([1.23456, 12]), "1.2345e12");
});

Deno.test("bigNumberWithCommas respects whole flag for fractional values", () => {
  assertEquals(bigNumberWithCommas([1234.56789, 0], true), "1,234");
  assertEquals(bigNumberWithCommas([1234.56789, 0]), "1,234.567");
});

Deno.test("bigNumberWithCommas formats whole numbers without decimals", () => {
  assertEquals(bigNumberWithCommas([1000, 0]), "1,000");
});

Deno.test("formatBalatroScore keeps comma formatting below threshold", () => {
  assertEquals(formatBalatroScore(9999999999), "9,999,999,999");
});

Deno.test("formatBalatroScore switches to Balatro-style scientific notation at threshold", () => {
  assertEquals(formatBalatroScore(22649545200), "2.265e10");
});

Deno.test("formatBalatroScore supports custom scientific precision", () => {
  assertEquals(formatBalatroScore(22649545200, 10, 6), "2.264955e10");
});

Deno.test("formatBalatroScore supports big number tuples", () => {
  assertEquals(formatBalatroScore([4.8, 87]), "4.800e87");
});

Deno.test("formatBalatroScore normalizes rounded mantissas that cross 10", () => {
  assertEquals(formatBalatroScore([9.99995, 12]), "1.000e13");
});

Deno.test("formatBalatroScore normalizes oversized and undersized mantissas", () => {
  assertEquals(formatBalatroScore([120, 2]), "12,000");
  assertEquals(formatBalatroScore([0.048, 89]), "4.800e87");
});

Deno.test("formatBalatroScore handles zero-like and invalid inputs", () => {
  assertEquals(formatBalatroScore([0, 12]), "0");
  assertEquals(formatBalatroScore(null), "0");
  assertEquals(formatBalatroScore(Infinity), "0");
});
