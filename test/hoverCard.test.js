import { transforms, hoverCard, noHoverCard } from "../src/runtime/hoverCard.ts";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || "Assertion failed");
  }
}

function assertEquals(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(
      `${message || "Expected equality"}\nExpected: ${expected}\nActual: ${actual}`
    );
  }
}

function makeElement({ x, y, width, height, scale }) {
  return {
    style: { transform: "preset" },
    dataset: scale !== undefined ? { scale } : {},
    getBoundingClientRect() {
      return { x, y, width, height };
    }
  };
}

Deno.test("transforms returns centered transform when width is zero", () => {
  const el = makeElement({ x: 0, y: 0, width: 0, height: 10 });
  const result = transforms(10, 20, el);

  assertEquals(el.style.transform, "", "transforms resets element transform");
  assertEquals(
    result,
    "translate(35.5px) perspective(94px) rotateX(-3deg) rotateY(-5.1deg) translate(-35.5px)"
  );
});

Deno.test("transforms uses scale 2 and width-based calculations", () => {
  const el = makeElement({ x: 10, y: 5, width: 40, height: 20, scale: "2" });
  const result = transforms(50, 25, el);

  assertEquals(result, "perspective(94px) rotateX(-1deg) rotateY(2deg)");
});

Deno.test("hoverCard applies transform to target", () => {
  const el = makeElement({ x: 10, y: 5, width: 40, height: 20, scale: "2" });

  hoverCard({ clientX: 50, clientY: 25, target: el });

  assertEquals(el.style.transform, "perspective(94px) rotateX(-1deg) rotateY(2deg)");
});

Deno.test("noHoverCard clears transform", () => {
  const el = makeElement({ x: 0, y: 0, width: 20, height: 10 });
  el.style.transform = "existing";

  noHoverCard({ target: el });

  assertEquals(el.style.transform, "");
});
