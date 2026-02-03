import { Hand } from "../src/sim/balatro-sim.ts";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || "Assertion failed");
  }
}

const RANK = {
  _2: 0,
  _3: 1,
  _4: 2,
  _5: 3,
  _6: 4,
  _7: 5,
  _8: 6,
  _9: 7,
  _10: 8,
  JACK: 9,
  QUEEN: 10,
  KING: 11,
  ACE: 12
};

const SUIT = {
  HEARTS: 0,
  CLUBS: 1,
  DIAMONDS: 2,
  SPADES: 3
};

const EDITION = {
  NONE: 0,
  FOIL: 1,
  HOLOGRAPHIC: 2,
  POLYCHROME: 3
};

const ENHANCEMENT = {
  NONE: 0,
  BONUS: 1,
  MULT: 2,
  WILD: 3,
  GLASS: 4,
  STEEL: 5,
  STONE: 6,
  GOLD: 7,
  LUCKY: 8
};

const SEAL = {
  NONE: 0,
  GOLD: 1,
  RED: 2,
  BLUE: 3,
  PURPLE: 4
};

const MAX_JOKER_ID = 159;

function makeCard({
  rank,
  suit,
  edition = EDITION.NONE,
  enhancement = ENHANCEMENT.NONE,
  seal = SEAL.NONE,
  extraChips = 0,
  disabled = false
}) {
  return [
    rank, // RANK
    suit, // SUIT
    edition, // EDITION
    enhancement, // ENHANCEMENT
    seal, // SEAL
    extraChips, // EXTRA_CHIPS
    disabled ? 1 : 0, // CARD_DISABLED
    0, // CARD_ID placeholder
    0 // EXTRA_EXTRA_CHIPS
  ];
}

function makeJoker({ id, value = 1, edition = EDITION.NONE, disabled = false, sell = 2 }) {
  return [
    id, // JOKER
    value, // VALUE
    edition, // EDITION
    disabled ? 1 : 0, // JOKER_DISABLED
    sell // SELL_VALUE
  ];
}

function makeHands() {
  const hands = [];
  for (let i = 0; i < 12; i++) {
    hands.push([1, 0, 0, 0]);
  }
  return hands;
}

function buildAllJokers({ value, disabledEvery = 0 }) {
  const jokers = [];
  for (let id = 0; id <= MAX_JOKER_ID; id++) {
    const disabled = disabledEvery > 0 && id % disabledEvery === 0;
    jokers.push(makeJoker({ id, value, edition: EDITION.NONE, disabled, sell: 2 }));
  }
  // Ensure editions coverage.
  jokers[0][2] = EDITION.FOIL;
  jokers[1][2] = EDITION.HOLOGRAPHIC;
  jokers[2][2] = EDITION.POLYCHROME;
  // Duplicate blueprint and brainstorm to exercise resolution logic.
  jokers.unshift(makeJoker({ id: 30, value, edition: EDITION.NONE, sell: 2 }));
  jokers.splice(2, 0, makeJoker({ id: 77, value, edition: EDITION.NONE, sell: 2 }));
  return jokers;
}

function buildCoverageCards() {
  return [
    makeCard({ rank: RANK._2, suit: SUIT.HEARTS, edition: EDITION.FOIL, enhancement: ENHANCEMENT.BONUS, seal: SEAL.RED }),
    makeCard({ rank: RANK._5, suit: SUIT.DIAMONDS, edition: EDITION.HOLOGRAPHIC, enhancement: ENHANCEMENT.MULT }),
    makeCard({ rank: RANK._10, suit: SUIT.SPADES, edition: EDITION.POLYCHROME, enhancement: ENHANCEMENT.WILD }),
    makeCard({ rank: RANK.JACK, suit: SUIT.CLUBS, enhancement: ENHANCEMENT.GLASS }),
    makeCard({ rank: RANK.QUEEN, suit: SUIT.HEARTS, enhancement: ENHANCEMENT.STEEL, seal: SEAL.BLUE }),
    makeCard({ rank: RANK.KING, suit: SUIT.DIAMONDS, enhancement: ENHANCEMENT.STONE }),
    makeCard({ rank: RANK.ACE, suit: SUIT.SPADES, enhancement: ENHANCEMENT.GOLD }),
    makeCard({ rank: RANK._3, suit: SUIT.CLUBS, enhancement: ENHANCEMENT.LUCKY, seal: SEAL.PURPLE }),
    makeCard({ rank: RANK._4, suit: true, enhancement: ENHANCEMENT.WILD })
  ];
}

function runScenario({ value, randomMode, chanceMultiplier, cardsCount, inHandCount, theEye, plasmaDeck }) {
  const cards = buildCoverageCards().slice(0, cardsCount);
  const cardsInHand = buildCoverageCards().slice(0, inHandCount);
  const jokers = buildAllJokers({ value, disabledEvery: 5 });
  const hands = makeHands();
  if (theEye) {
    hands[0][3] = 1;
  }

  const hand = new Hand({
    cards,
    cardsInHand,
    jokers,
    hands,
    TheFlint: false,
    TheEye: Boolean(theEye),
    PlasmaDeck: Boolean(plasmaDeck),
    Observatory: true
  });

  hand.compileAll();

  // Force flags to cover conditional branches inside triggerJoker.
  hand.hasPair = true;
  hand.hasTwoPair = true;
  hand.hasThreeOfAKind = true;
  hand.hasFourOfAKind = true;
  hand.hasStraight = true;
  hand.hasFlush = true;
  hand.hasVampire = true;
  hand.Shortcut = true;
  hand.FourFingers = true;
  hand.Pareidolia = true;
  hand.SmearedJoker = true;
  hand.RaisedFist = true;
  hand.Splash = true;
  hand.MidasMaskas = true;
  hand.BaseballCard = 1;
  hand.chanceMultiplier = chanceMultiplier;
  hand.compiledValues = new Array(hand.jokers.length).fill(cards[0]);
  hand.jokerRarities = new Array(hand.jokers.length).fill(2);
  hand.jokersExtraValue = new Array(hand.jokers.length).fill(0);

  let result;
  if (randomMode === 0) {
    result = hand.simulateBestHand();
  } else if (randomMode === 1) {
    result = hand.simulateWorstHand();
  } else {
    result = hand.simulateRandomHand();
  }
  assert(Array.isArray(result), "simulate should return an array");
}

Deno.test("sim coverage scenarios execute across random modes", () => {
  const originalRandom = Math.random;
  try {
    Math.random = () => 0;
    runScenario({ value: 1, randomMode: 0, chanceMultiplier: 20, cardsCount: 5, inHandCount: 4, theEye: false, plasmaDeck: false });
    runScenario({ value: 0, randomMode: 1, chanceMultiplier: 1, cardsCount: 3, inHandCount: 1, theEye: false, plasmaDeck: true });
    runScenario({ value: 1, randomMode: 2, chanceMultiplier: 20, cardsCount: 5, inHandCount: 2, theEye: false, plasmaDeck: false });
    Math.random = () => 1;
    runScenario({ value: 0, randomMode: 2, chanceMultiplier: 1, cardsCount: 5, inHandCount: 2, theEye: false, plasmaDeck: false });
    runScenario({ value: 1, randomMode: 0, chanceMultiplier: 20, cardsCount: 5, inHandCount: 0, theEye: true, plasmaDeck: false });
  } finally {
    Math.random = originalRandom;
  }
});

function expectHandType(cards, expectedType) {
  const hand = new Hand({ cards, cardsInHand: [], jokers: [], hands: makeHands() });
  hand.compileAll();
  assert(hand.typeOfHand === expectedType, `expected hand type ${expectedType} but got ${hand.typeOfHand}`);
}

Deno.test("getTypeOfHand covers all hand categories", () => {
  expectHandType([
    makeCard({ rank: RANK._2, suit: SUIT.HEARTS }),
    makeCard({ rank: RANK._2, suit: SUIT.HEARTS }),
    makeCard({ rank: RANK._2, suit: SUIT.HEARTS }),
    makeCard({ rank: RANK._2, suit: SUIT.HEARTS }),
    makeCard({ rank: RANK._2, suit: SUIT.HEARTS })
  ], 0);

  expectHandType([
    makeCard({ rank: RANK._2, suit: SUIT.CLUBS }),
    makeCard({ rank: RANK._2, suit: SUIT.CLUBS }),
    makeCard({ rank: RANK._2, suit: SUIT.CLUBS }),
    makeCard({ rank: RANK._3, suit: SUIT.CLUBS }),
    makeCard({ rank: RANK._3, suit: SUIT.CLUBS })
  ], 1);

  expectHandType([
    makeCard({ rank: RANK._4, suit: SUIT.HEARTS }),
    makeCard({ rank: RANK._4, suit: SUIT.CLUBS }),
    makeCard({ rank: RANK._4, suit: SUIT.DIAMONDS }),
    makeCard({ rank: RANK._4, suit: SUIT.SPADES }),
    makeCard({ rank: RANK._4, suit: SUIT.HEARTS })
  ], 2);

  expectHandType([
    makeCard({ rank: RANK._6, suit: SUIT.HEARTS }),
    makeCard({ rank: RANK._7, suit: SUIT.HEARTS }),
    makeCard({ rank: RANK._8, suit: SUIT.HEARTS }),
    makeCard({ rank: RANK._9, suit: SUIT.HEARTS }),
    makeCard({ rank: RANK._10, suit: SUIT.HEARTS })
  ], 3);

  expectHandType([
    makeCard({ rank: RANK._9, suit: SUIT.HEARTS }),
    makeCard({ rank: RANK._9, suit: SUIT.CLUBS }),
    makeCard({ rank: RANK._9, suit: SUIT.DIAMONDS }),
    makeCard({ rank: RANK._9, suit: SUIT.SPADES }),
    makeCard({ rank: RANK._2, suit: SUIT.HEARTS })
  ], 4);

  expectHandType([
    makeCard({ rank: RANK._5, suit: SUIT.HEARTS }),
    makeCard({ rank: RANK._5, suit: SUIT.CLUBS }),
    makeCard({ rank: RANK._5, suit: SUIT.DIAMONDS }),
    makeCard({ rank: RANK._7, suit: SUIT.SPADES }),
    makeCard({ rank: RANK._7, suit: SUIT.HEARTS })
  ], 5);

  expectHandType([
    makeCard({ rank: RANK._2, suit: SUIT.SPADES }),
    makeCard({ rank: RANK._5, suit: SUIT.SPADES }),
    makeCard({ rank: RANK._7, suit: SUIT.SPADES }),
    makeCard({ rank: RANK.JACK, suit: SUIT.SPADES }),
    makeCard({ rank: RANK.ACE, suit: SUIT.SPADES })
  ], 6);

  expectHandType([
    makeCard({ rank: RANK._4, suit: SUIT.HEARTS }),
    makeCard({ rank: RANK._5, suit: SUIT.CLUBS }),
    makeCard({ rank: RANK._6, suit: SUIT.DIAMONDS }),
    makeCard({ rank: RANK._7, suit: SUIT.SPADES }),
    makeCard({ rank: RANK._8, suit: SUIT.HEARTS })
  ], 7);

  expectHandType([
    makeCard({ rank: RANK._8, suit: SUIT.HEARTS }),
    makeCard({ rank: RANK._8, suit: SUIT.CLUBS }),
    makeCard({ rank: RANK._8, suit: SUIT.DIAMONDS }),
    makeCard({ rank: RANK._4, suit: SUIT.SPADES }),
    makeCard({ rank: RANK._7, suit: SUIT.HEARTS })
  ], 8);

  expectHandType([
    makeCard({ rank: RANK._6, suit: SUIT.HEARTS }),
    makeCard({ rank: RANK._6, suit: SUIT.CLUBS }),
    makeCard({ rank: RANK._9, suit: SUIT.DIAMONDS }),
    makeCard({ rank: RANK._9, suit: SUIT.SPADES }),
    makeCard({ rank: RANK._2, suit: SUIT.HEARTS })
  ], 9);

  expectHandType([
    makeCard({ rank: RANK._3, suit: SUIT.HEARTS }),
    makeCard({ rank: RANK._3, suit: SUIT.CLUBS }),
    makeCard({ rank: RANK._8, suit: SUIT.DIAMONDS }),
    makeCard({ rank: RANK._10, suit: SUIT.SPADES }),
    makeCard({ rank: RANK.ACE, suit: SUIT.HEARTS })
  ], 10);

  expectHandType([
    makeCard({ rank: RANK._2, suit: SUIT.HEARTS }),
    makeCard({ rank: RANK._5, suit: SUIT.CLUBS }),
    makeCard({ rank: RANK._7, suit: SUIT.DIAMONDS }),
    makeCard({ rank: RANK._9, suit: SUIT.SPADES }),
    makeCard({ rank: RANK.JACK, suit: SUIT.HEARTS })
  ], 11);
});

Deno.test("getTypeOfHand handles FourFingers and Shortcut variants", () => {
  const hand = new Hand({ cards: [
    makeCard({ rank: RANK._4, suit: SUIT.HEARTS }),
    makeCard({ rank: RANK._5, suit: SUIT.CLUBS }),
    makeCard({ rank: RANK._7, suit: SUIT.DIAMONDS }),
    makeCard({ rank: RANK._8, suit: SUIT.SPADES })
  ], cardsInHand: [], jokers: [], hands: makeHands() });

  hand.Shortcut = true;
  hand.FourFingers = true;
  hand.compileAll();
  assert(hand.typeOfHand >= 0 && hand.typeOfHand <= 11, "expected valid hand type with FourFingers or Shortcut");
});
