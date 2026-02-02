// @ts-nocheck

import { state } from "./state";
import { hands } from "./data";
import { jokerPrice } from "./cards";
import {
  editionBinary,
  modifiersBinary,
  intToBinary,
  signed16,
  bitsToBase64,
  base64ToBits,
  toUrlSafe,
  fromUrlSafe
} from "../logic/handUrl";

export interface HandUrlDependencies {
  addJoker: (i: number, j: number, sell?: number | false) => void;
  addCard: (i: number, j: number) => void;
  setModifierString: () => void;
  incrementLevel: (inc: number, handIndex: number) => void;
  incrementPlanet: (inc: number, handIndex: number) => void;
  redrawPlayfield: () => void;
  toggleJoker: () => void;
  toggleCard: () => void;
  toggleTheFlint: () => void;
  togglePlasma: () => void;
  toggleObservatory: () => void;
  handLevels: HTMLElement;
}

export function compileHand(): void {
  const binary: number[] = [];

  // number of jokers - 16 bits
  binary.push(...intToBinary(Object.keys(state.playfieldJokers).length, 16));

  for (let i = 0; i < state.bestJokers.length; i++) {
    const joker = state.playfieldJokers[state.bestJokers[i]];
    if (!joker) continue;
    // type[0] - 4 bits
    binary.push(...intToBinary(joker.type[0], 4));
    // type[1] - 4 bits
    binary.push(...intToBinary(joker.type[1], 4));

    // edition? - 1 bit
    // edition - 2 bits
    binary.push(...editionBinary(joker.modifiers));

    // non-zero value? - 1 bit
    if (joker.value === 0) {
      binary.push(0);
    } else {
      binary.push(1);
      // value - 16 bits
      binary.push(...signed16(joker.value));
    }

    // non-expected sell value? - 1 bit
    const expectedSell = Math.floor(
      (jokerPrice[joker.type[0]][joker.type[1]] +
        (joker.modifiers.foil || joker.modifiers.holographic || joker.modifiers.polychrome ? 1 : 0)) /
        2
    );
    if (joker.sell === expectedSell) {
      binary.push(0);
    } else {
      binary.push(1);
      // value - 16 bits
      binary.push(...intToBinary(joker.sell, 16));
    }
  }

  // number of cards - 16 bits
  binary.push(...intToBinary(Object.keys(state.playfieldCards).length, 16));
  // number of cards in hand - 3 bits
  binary.push(...intToBinary(state.bestHand.length, 3));

  for (let i = 0; i < state.bestHand.length; i++) {
    const card = state.playfieldCards[state.bestHand[i]];
    if (!card) continue;
    // suit - 2 bits
    binary.push(...intToBinary(card.type[0], 2));
    // value - 4 bits
    binary.push(...intToBinary(card.type[1], 4));

    // edition? - 1 bit
    // edition - 2 bits
    binary.push(...editionBinary(card.modifiers));

    // modifier - 4 bits
    binary.push(...modifiersBinary(card.modifiers));
  }

  for (const id in state.playfieldCards) {
    if (state.bestHand.indexOf(id) >= 0) continue;
    const card = state.playfieldCards[id];

    // suit - 2 bits
    binary.push(...intToBinary(card.type[0], 2));
    // value - 4 bits
    binary.push(...intToBinary(card.type[1], 4));

    // edition? - 1 bit
    // edition - 2 bits
    binary.push(...editionBinary(card.modifiers));

    // modifier - 4 bits
    binary.push(...modifiersBinary(card.modifiers));
  }

  binary.push(state.theFlint ? 1 : 0);
  binary.push(state.plasmaDeck ? 1 : 0);

  for (let i = 0; i < hands.length; i++) {
    if (hands[i].level === 1) {
      binary.push(0);
    } else {
      binary.push(1);
      binary.push(...intToBinary(hands[i].level, 16));
    }
  }

  binary.push(state.observatory ? 1 : 0);

  if (state.observatory) {
    for (let i = 0; i < hands.length; i++) {
      if (hands[i].planets > 0) {
        binary.push(1);
        binary.push(...intToBinary(hands[i].planets, 16));
      } else {
        binary.push(0);
      }
    }
  }

  // hand counts (for supernova/obelisk/card sharp) - 1 bit
  let nonZeroedHand = false;
  for (let i = 0; i < hands.length; i++) {
    if (hands[i].playedThisRound || hands[i].played) {
      nonZeroedHand = true;
    }
  }
  if (nonZeroedHand) {
    binary.push(1);
    for (let i = 0; i < hands.length; i++) {
      binary.push(hands[i].playedThisRound ? 1 : 0);

      binary.push(hands[i].played ? 1 : 0);
      if (hands[i].played) {
        binary.push(...intToBinary(hands[i].played, 16));
      }
    }
  } else {
    binary.push(0);
  }

  // remove trailing 0s
  while (binary.length > 0 && binary[binary.length - 1] === 0) {
    binary.pop();
  }

  // set URL
  if (binary.length === 0) {
    history.replaceState(null, null, "?");
  } else {
    const queryParams = new URLSearchParams(window.location.search);
    queryParams.set("h", toUrlSafe(bitsToBase64(binary)));
    history.replaceState(null, null, "?" + queryParams.toString());
  }
}

let atBit = 0;

function nextBits(bits: number, binary: number[]): number[] {
  const ans: number[] = [];
  for (let i = 0; i < bits; i++) {
    if (atBit >= binary.length) {
      ans.push(0);
    } else {
      ans.push(binary[atBit++]);
    }
  }
  return ans;
}

function intFromBits(bits: number, binary: number[]): number {
  const subBits = nextBits(bits, binary);
  let ans = 0;
  for (let i = 0; i < bits; i++) {
    if (subBits[i]) ans += 1 << i;
  }
  return ans;
}

function parseOldHand(bits: number[], deps: HandUrlDependencies): void {
  if (bits.length === 0) {
    return;
  }
  atBit = 0;

  if (state.optimizeJokers) deps.toggleJoker();
  if (state.optimizeCards) deps.toggleCard();

  // number of jokers - 16 bits
  const numberOfJokers = intFromBits(16, bits);

  for (let i = 0; i < numberOfJokers; i++) {
    const type = [intFromBits(4, bits), intFromBits(4, bits)];

    state.jmodifiers.foil = false;
    state.jmodifiers.holographic = false;
    state.jmodifiers.polychrome = false;
    state.jmodifiers.disabled = false;

    if (intFromBits(1, bits)) {
      switch (intFromBits(2, bits)) {
        case 0:
          state.jmodifiers.foil = true;
          break;
        case 1:
          state.jmodifiers.holographic = true;
          break;
        case 2:
          state.jmodifiers.polychrome = true;
          break;
        case 3:
          state.jmodifiers.disabled = true;
          break;
      }
    }

    state.jokerValue = 0;
    if (intFromBits(1, bits)) {
      const sign = intFromBits(1, bits) ? -1 : 1;
      state.jokerValue = sign * intFromBits(15, bits);
    }

    deps.addJoker(type[0], type[1]);
  }

  state.jmodifiers.foil = false;
  state.jmodifiers.holographic = false;
  state.jmodifiers.polychrome = false;
  state.jmodifiers.disabled = false;
  state.jokerValue = 0;

  // number of cards - 16 bits
  const numberOfCards = intFromBits(16, bits);

  // number of cards in hand - 3 bits
  const numberOfCardsInHand = intFromBits(3, bits);

  for (let i = 0; i < numberOfCards; i++) {
    const type = [intFromBits(2, bits), intFromBits(4, bits)];

    state.modifiers.foil = false;
    state.modifiers.holographic = false;
    state.modifiers.polychrome = false;
    state.modifiers.disabled = false;

    state.modifiers.stone = false;
    state.modifiers.increment = false;
    state.modifiers.mult = false;
    state.modifiers.wild = false;
    state.modifiers.chance = false;
    state.modifiers.glass = false;
    state.modifiers.steel = false;

    if (intFromBits(1, bits)) {
      switch (intFromBits(2, bits)) {
        case 0:
          state.modifiers.foil = true;
          break;
        case 1:
          state.modifiers.holographic = true;
          break;
        case 2:
          state.modifiers.polychrome = true;
          break;
        case 3:
          state.modifiers.disabled = true;
          break;
      }
    }

    switch (intFromBits(3, bits)) {
      case 1:
        state.modifiers.chance = true;
        break;
      case 2:
        state.modifiers.glass = true;
        break;
      case 3:
        state.modifiers.increment = true;
        break;
      case 4:
        state.modifiers.mult = true;
        break;
      case 5:
        state.modifiers.steel = true;
        break;
      case 6:
        state.modifiers.stone = true;
        break;
      case 7:
        state.modifiers.wild = true;
        break;
    }

    state.modifiers.double = intFromBits(1, bits) ? true : false;

    deps.setModifierString();

    deps.addCard(type[0], type[1]);

    if (i < numberOfCardsInHand) {
      const keys = Object.keys(state.playfieldCards);
      state.bestHand.push(keys[keys.length - 1]);
    }
  }

  state.modifiers.foil = false;
  state.modifiers.holographic = false;
  state.modifiers.polychrome = false;
  state.modifiers.disabled = false;

  state.modifiers.stone = false;
  state.modifiers.increment = false;
  state.modifiers.mult = false;
  state.modifiers.wild = false;
  state.modifiers.chance = false;
  state.modifiers.glass = false;
  state.modifiers.steel = false;

  state.modifiers.double = false;

  if (state.theFlint !== Boolean(intFromBits(1, bits))) {
    deps.toggleTheFlint();
  }

  if (state.plasmaDeck !== Boolean(intFromBits(1, bits))) {
    deps.togglePlasma();
  }

  for (let i = 0; i < hands.length; i++) {
    if (intFromBits(1, bits) === 1) {
      hands[i].level = intFromBits(16, bits) + 1;
      deps.incrementLevel(-1, i);
    }
  }

  if (state.observatory !== Boolean(intFromBits(1, bits))) {
    deps.toggleObservatory();
  }

  if (state.observatory) {
    for (let i = 0; i < hands.length; i++) {
      if (intFromBits(1, bits) === 1) {
        hands[i].planets = intFromBits(16, bits) + 1;
        deps.incrementPlanet(-1, i);
      }
    }
  }

  deps.redrawPlayfield();
}

function parseHand(bits: number[], deps: HandUrlDependencies): void {
  if (bits.length === 0) {
    return;
  }
  atBit = 0;

  if (state.optimizeJokers) deps.toggleJoker();
  if (state.optimizeCards) deps.toggleCard();

  // number of jokers - 16 bits
  const numberOfJokers = intFromBits(16, bits);

  for (let i = 0; i < numberOfJokers; i++) {
    const type = [intFromBits(4, bits), intFromBits(4, bits)];

    state.jmodifiers.foil = false;
    state.jmodifiers.holographic = false;
    state.jmodifiers.polychrome = false;
    state.jmodifiers.disabled = false;

    if (intFromBits(1, bits)) {
      switch (intFromBits(2, bits)) {
        case 0:
          state.jmodifiers.foil = true;
          break;
        case 1:
          state.jmodifiers.holographic = true;
          break;
        case 2:
          state.jmodifiers.polychrome = true;
          break;
        case 3:
          state.jmodifiers.disabled = true;
          break;
      }
    }

    state.jokerValue = 0;
    if (intFromBits(1, bits)) {
      const sign = intFromBits(1, bits) ? -1 : 1;
      state.jokerValue = sign * intFromBits(15, bits);
    }

    if (intFromBits(1, bits)) {
      deps.addJoker(type[0], type[1], intFromBits(16, bits));
    } else {
      deps.addJoker(type[0], type[1]);
    }
  }

  state.jmodifiers.foil = false;
  state.jmodifiers.holographic = false;
  state.jmodifiers.polychrome = false;
  state.jmodifiers.disabled = false;
  state.jokerValue = 0;

  // number of cards - 16 bits
  const numberOfCards = intFromBits(16, bits);

  // number of cards in hand - 3 bits
  const numberOfCardsInHand = intFromBits(3, bits);

  for (let i = 0; i < numberOfCards; i++) {
    const type = [(intFromBits(2, bits) + 1) % 4, intFromBits(4, bits)];

    state.modifiers.foil = false;
    state.modifiers.holographic = false;
    state.modifiers.polychrome = false;
    state.modifiers.disabled = false;

    state.modifiers.stone = false;
    state.modifiers.increment = false;
    state.modifiers.mult = false;
    state.modifiers.wild = false;
    state.modifiers.chance = false;
    state.modifiers.glass = false;
    state.modifiers.steel = false;

    if (intFromBits(1, bits)) {
      switch (intFromBits(2, bits)) {
        case 0:
          state.modifiers.foil = true;
          break;
        case 1:
          state.modifiers.holographic = true;
          break;
        case 2:
          state.modifiers.polychrome = true;
          break;
        case 3:
          state.modifiers.disabled = true;
          break;
      }
    }

    switch (intFromBits(3, bits)) {
      case 1:
        state.modifiers.chance = true;
        break;
      case 2:
        state.modifiers.glass = true;
        break;
      case 3:
        state.modifiers.increment = true;
        break;
      case 4:
        state.modifiers.mult = true;
        break;
      case 5:
        state.modifiers.steel = true;
        break;
      case 6:
        state.modifiers.stone = true;
        break;
      case 7:
        state.modifiers.wild = true;
        break;
    }

    state.modifiers.double = intFromBits(1, bits) ? true : false;

    deps.setModifierString();

    deps.addCard(type[0], type[1]);

    if (i < numberOfCardsInHand) {
      const keys = Object.keys(state.playfieldCards);
      state.bestHand.push(keys[keys.length - 1]);
    }
  }

  state.modifiers.foil = false;
  state.modifiers.holographic = false;
  state.modifiers.polychrome = false;
  state.modifiers.disabled = false;

  state.modifiers.stone = false;
  state.modifiers.increment = false;
  state.modifiers.mult = false;
  state.modifiers.wild = false;
  state.modifiers.chance = false;
  state.modifiers.glass = false;
  state.modifiers.steel = false;

  state.modifiers.double = false;

  deps.setModifierString();

  if (state.theFlint !== Boolean(intFromBits(1, bits))) {
    deps.toggleTheFlint();
  }

  if (state.plasmaDeck !== Boolean(intFromBits(1, bits))) {
    deps.togglePlasma();
  }

  for (let i = 0; i < hands.length; i++) {
    if (intFromBits(1, bits) === 1) {
      hands[i].level = intFromBits(16, bits) + 1;
      deps.incrementLevel(-1, i);
    }
  }

  if (state.observatory !== Boolean(intFromBits(1, bits))) {
    deps.toggleObservatory();
  }

  if (state.observatory) {
    for (let i = 0; i < hands.length; i++) {
      if (intFromBits(1, bits) === 1) {
        hands[i].planets = intFromBits(16, bits) + 1;
        deps.incrementPlanet(-1, i);
      }
    }
  }

  // hand counts (for supernova/obelisk/card sharp) - 1 bit
  if (intFromBits(1, bits)) {
    for (let i = 0; i < hands.length; i++) {
      hands[i].playedThisRound = intFromBits(1, bits);
      if (hands[i].playedThisRound) {
        deps.handLevels.children[i].children[0].innerText = "X";
      } else {
        deps.handLevels.children[i].children[0].innerHTML = "&nbsp;";
      }
      if (intFromBits(1, bits)) {
        hands[i].played = intFromBits(16, bits);
        deps.handLevels.children[i].children[1].children[0].innerText = String(hands[i].played);
      }
    }
  }

  deps.redrawPlayfield();
}

export function initHandUrl(deps: HandUrlDependencies): void {
  new URL(window.location.href).searchParams.forEach((value, key) => {
    if (key === "hand") {
      parseOldHand(base64ToBits(fromUrlSafe(value)), deps);
    } else if (key === "h") {
      parseHand(base64ToBits(fromUrlSafe(value)), deps);
    }
  });
}
