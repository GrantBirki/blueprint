import {
  bigNumberWithCommas,
  numberWithCommas,
  formatCompactNumber,
  formatCompactBig
} from "../src/runtime/format.ts";

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

Deno.test("formatCompactNumber uses suffixes for large values", () => {
  assertEquals(formatCompactNumber(5107400000000), "5.1T");
  assertEquals(formatCompactNumber(1500), "1.5K");
});

Deno.test("formatCompactBig formats big number arrays", () => {
  assertEquals(formatCompactBig([5.1074, 12]), "5.1T");
  assertEquals(formatCompactBig([1.23, 6]), "1.2M");
});
