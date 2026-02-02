import { Hand } from "../src/sim/balatro-sim.ts";
import { bigNumberWithCommas, numberWithCommas } from "../src/runtime/format.ts";

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

function getEdition(modifiers) {
  if (modifiers.foil) return 1;
  if (modifiers.holographic) return 2;
  if (modifiers.polychrome) return 3;
  if (modifiers.disabled) return 4;
  return 0;
}

function getEnhancement(modifiers) {
  if (modifiers.increment) return 1;
  if (modifiers.mult) return 2;
  if (modifiers.wild) return 3;
  if (modifiers.glass) return 4;
  if (modifiers.steel) return 5;
  if (modifiers.stone) return 6;
  if (modifiers.gold) return 7;
  if (modifiers.chance) return 8;
  return 0;
}

function buildHandFromDeck(deck) {
  const cardIds = [...deck.cards.selected, ...deck.cards.inHand];
  const selectedCards = deck.cards.selected.map((id, index) => {
    const card = deck.cards.all[id];
    return [
      card.type[1],
      card.type[0],
      getEdition(card.modifiers),
      getEnhancement(card.modifiers),
      card.modifiers.double ? 2 : 0,
      0,
      card.modifiers.disabled ? 1 : 0,
      index
    ];
  });
  const cardsInHand = deck.cards.inHand.map((id, index) => {
    const card = deck.cards.all[id];
    return [
      card.type[1],
      card.type[0],
      getEdition(card.modifiers),
      getEnhancement(card.modifiers),
      card.modifiers.double ? 2 : 0,
      0,
      card.modifiers.disabled ? 1 : 0,
      deck.cards.selected.length + index
    ];
  });

  const jokers = deck.jokers.order.map((id, index) => {
    const joker = deck.jokers.all[id];
    return [
      joker.type[0] * 10 + joker.type[1],
      joker.value,
      getEdition(joker.modifiers),
      joker.modifiers.disabled ? 1 : 0,
      joker.sell,
      index
    ];
  });

  const hands = deck.hands.map(hand => [
    hand.level,
    hand.planets,
    hand.played,
    hand.playedThisRound
  ]);

  const hand = new Hand({
    cards: selectedCards,
    cardsInHand,
    jokers,
    hands,
    TheFlint: deck.settings.theFlint,
    TheEye: deck.settings.theEye,
    PlasmaDeck: deck.settings.plasmaDeck,
    Observatory: deck.settings.observatory
  });
  hand.compileAll();
  const result = hand.simulateBestHand();

  return {
    score: [result[0], result[1]],
    scoreChips: result[2],
    scoreMult: result[3],
    bestPlayName: `${deck.hands[hand.typeOfHand].name} lvl.${hands[hand.typeOfHand][0]}`
  };
}

function compareBig(a, b) {
  if (a[1] !== b[1]) {
    return a[1] - b[1];
  }
  if (a[0] === b[0]) return 0;
  return a[0] > b[0] ? 1 : -1;
}

const baseDeck = {
  version: 1,
  generatedAt: "2026-02-02T06:27:54.452Z",
  score: {
    bestPlayName: "Flush Five lvl.1",
    bestPlayScore: "1.8015e22",
    scoreChips: "2,030",
    scoreMult: "8.8744e18"
  },
  settings: {
    optimizeJokers: false,
    optimizeCards: false,
    minimize: false,
    optimizeMode: 0,
    theFlint: false,
    theEye: false,
    plasmaDeck: false,
    observatory: false,
    highContrast: false
  },
  hands: [
    { name: "Flush Five", level: 1, planets: 0, played: 0, playedThisRound: 0, chips: 160, mult: 16 },
    { name: "Flush House", level: 1, planets: 0, played: 0, playedThisRound: 0, chips: 140, mult: 14 },
    { name: "Five of a Kind", level: 1, planets: 0, played: 0, playedThisRound: 0, chips: 120, mult: 12 },
    { name: "Straight Flush", level: 1, planets: 0, played: 0, playedThisRound: 0, chips: 100, mult: 8 },
    { name: "Four of a Kind", level: 1, planets: 0, played: 0, playedThisRound: 0, chips: 60, mult: 7 },
    { name: "Full House", level: 1, planets: 0, played: 0, playedThisRound: 0, chips: 40, mult: 4 },
    { name: "Flush", level: 1, planets: 0, played: 0, playedThisRound: 0, chips: 35, mult: 4 },
    { name: "Straight", level: 1, planets: 0, played: 0, playedThisRound: 0, chips: 30, mult: 4 },
    { name: "Three of a Kind", level: 1, planets: 0, played: 0, playedThisRound: 0, chips: 30, mult: 3 },
    { name: "Two Pair", level: 1, planets: 0, played: 0, playedThisRound: 0, chips: 20, mult: 2 },
    { name: "Pair", level: 1, planets: 0, played: 0, playedThisRound: 0, chips: 10, mult: 2 },
    { name: "High Card", level: 1, planets: 0, played: 0, playedThisRound: 0, chips: 5, mult: 1 }
  ],
  jokers: {
    order: [
      "j6913031530975358",
      "j5633926182770844",
      "j5676466010515827",
      "j7812001321512467",
      "j6458598473782247",
      "j057815239530625506",
      "j4333118968387024",
      "j6709370576208346",
      "j5829862823597429",
      "j6067334248449808",
      "j11678898920862701",
      "j6628876898556855",
      "j9474286512662428",
      "j34385500723387297"
    ],
    all: {
      j6913031530975358: { type: [8, 1], modifiers: { foil: false, holographic: false, polychrome: false, disabled: false }, value: 0, sell: 3 },
      j5633926182770844: { type: [3, 0], modifiers: { foil: false, holographic: false, polychrome: false, disabled: false }, value: 0, sell: 5 },
      j5676466010515827: { type: [4, 5], modifiers: { foil: false, holographic: false, polychrome: false, disabled: false }, value: 0, sell: 4 },
      j7812001321512467: { type: [1, 4], modifiers: { foil: false, holographic: false, polychrome: false, disabled: false }, value: 0, sell: 2 },
      j6458598473782247: { type: [1, 3], modifiers: { foil: false, holographic: false, polychrome: false, disabled: false }, value: 0, sell: 3 },
      j057815239530625506: { type: [13, 2], modifiers: { foil: false, holographic: false, polychrome: false, disabled: false }, value: 0, sell: 2 },
      j4333118968387024: { type: [13, 2], modifiers: { foil: false, holographic: false, polychrome: false, disabled: false }, value: 0, sell: 2 },
      j6709370576208346: { type: [0, 2], modifiers: { foil: false, holographic: false, polychrome: false, disabled: false }, value: 0, sell: 1 },
      j5829862823597429: { type: [13, 2], modifiers: { foil: false, holographic: false, polychrome: false, disabled: false }, value: 0, sell: 2 },
      j6067334248449808: { type: [13, 2], modifiers: { foil: false, holographic: false, polychrome: false, disabled: false }, value: 0, sell: 2 },
      j11678898920862701: { type: [6, 9], modifiers: { foil: false, holographic: false, polychrome: false, disabled: false }, value: 0, sell: 2 },
      j6628876898556855: { type: [13, 2], modifiers: { foil: false, holographic: false, polychrome: false, disabled: false }, value: 0, sell: 2 },
      j9474286512662428: { type: [13, 2], modifiers: { foil: false, holographic: false, polychrome: false, disabled: false }, value: 0, sell: 2 },
      j34385500723387297: { type: [7, 7], modifiers: { foil: false, holographic: false, polychrome: false, disabled: false }, value: 0, sell: 5 }
    }
  },
  cards: {
    selected: [
      "1140010000001001",
      "1140010000001001#",
      "1140010000001001##",
      "1140010000001001###",
      "1140010000001001####"
    ],
    inHand: [],
    all: {
      "1140010000001001": {
        type: [3, 11],
        modifiers: {
          foil: false,
          holographic: false,
          polychrome: true,
          disabled: false,
          stone: false,
          increment: false,
          mult: false,
          wild: false,
          chance: false,
          glass: true,
          steel: false,
          gold: false,
          double: true
        }
      },
      "1140010000001001#": {
        type: [3, 11],
        modifiers: {
          foil: false,
          holographic: false,
          polychrome: true,
          disabled: false,
          stone: false,
          increment: false,
          mult: false,
          wild: false,
          chance: false,
          glass: true,
          steel: false,
          gold: false,
          double: true
        }
      },
      "1140010000001001##": {
        type: [3, 11],
        modifiers: {
          foil: false,
          holographic: false,
          polychrome: true,
          disabled: false,
          stone: false,
          increment: false,
          mult: false,
          wild: false,
          chance: false,
          glass: true,
          steel: false,
          gold: false,
          double: true
        }
      },
      "1140010000001001###": {
        type: [3, 11],
        modifiers: {
          foil: false,
          holographic: false,
          polychrome: true,
          disabled: false,
          stone: false,
          increment: false,
          mult: false,
          wild: false,
          chance: false,
          glass: true,
          steel: false,
          gold: false,
          double: true
        }
      },
      "1140010000001001####": {
        type: [3, 11],
        modifiers: {
          foil: false,
          holographic: false,
          polychrome: true,
          disabled: false,
          stone: false,
          increment: false,
          mult: false,
          wild: false,
          chance: false,
          glass: true,
          steel: false,
          gold: false,
          double: true
        }
      }
    }
  },
  lastTypeOfHand: 0,
  lastCompiledValues: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  editor: {
    cardCount: 1,
    jokerCount: 1,
    jokerValue: 0,
    modifiers: {
      foil: false,
      holographic: false,
      polychrome: false,
      disabled: false,
      stone: false,
      increment: false,
      mult: false,
      wild: false,
      chance: false,
      glass: false,
      steel: false,
      gold: false,
      double: false
    },
    jokerModifiers: {
      foil: false,
      holographic: false,
      polychrome: false,
      disabled: false
    }
  }
};

const optimizedDeck = {
  ...baseDeck,
  generatedAt: "2026-02-02T06:29:02.428Z",
  score: {
    bestPlayName: "Flush Five lvl.1",
    bestPlayScore: "8.5625e30",
    scoreChips: "1,420",
    scoreMult: "6.0299e27"
  },
  settings: {
    ...baseDeck.settings,
    optimizeJokers: true
  },
  jokers: {
    ...baseDeck.jokers,
    order: [
      "j5633926182770844",
      "j11678898920862701",
      "j6913031530975358",
      "j7812001321512467",
      "j34385500723387297",
      "j4333118968387024",
      "j9474286512662428",
      "j6458598473782247",
      "j6709370576208346",
      "j5829862823597429",
      "j5676466010515827",
      "j057815239530625506",
      "j6067334248449808",
      "j6628876898556855"
    ]
  }
};

Deno.test("joker optimization regression deck matches baseline score", () => {
  const result = buildHandFromDeck(baseDeck);
  const scoreStr = bigNumberWithCommas(result.score, true);
  const chipsStr = numberWithCommas(result.scoreChips);
  const multStr = bigNumberWithCommas(result.scoreMult);

  assertEquals(result.bestPlayName, baseDeck.score.bestPlayName, "best play name should match baseline");
  assertEquals(scoreStr, baseDeck.score.bestPlayScore, "baseline best play score should match");
  assertEquals(chipsStr, baseDeck.score.scoreChips, "baseline chips should match");
  assertEquals(multStr, baseDeck.score.scoreMult, "baseline mult should match");
});

Deno.test("joker optimization regression deck matches optimized score", () => {
  const result = buildHandFromDeck(optimizedDeck);
  const scoreStr = bigNumberWithCommas(result.score, true);
  const chipsStr = numberWithCommas(result.scoreChips);
  const multStr = bigNumberWithCommas(result.scoreMult);

  assertEquals(result.bestPlayName, optimizedDeck.score.bestPlayName, "best play name should match optimized");
  assertEquals(scoreStr, optimizedDeck.score.bestPlayScore, "optimized best play score should match");
  assertEquals(chipsStr, optimizedDeck.score.scoreChips, "optimized chips should match");
  assertEquals(multStr, optimizedDeck.score.scoreMult, "optimized mult should match");
});

Deno.test("joker optimized order beats baseline order", () => {
  const baseline = buildHandFromDeck(baseDeck);
  const optimized = buildHandFromDeck(optimizedDeck);
  assert(compareBig(optimized.score, baseline.score) > 0, "optimized score should exceed baseline score");
});
