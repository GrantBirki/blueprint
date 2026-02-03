// @ts-nocheck

import { state } from "./state";
import { hands, handColors } from "./data";
import { Hand, normalizeBig } from "./breakdown";
import { numberWithCommas, bigNumberWithCommas } from "./format";
import { redrawPlayfieldHTML } from "./main";

const THREADS = navigator.hardwareConcurrency;
const MAX_JOKER_PERMUTATIONS = 200000;
const MAX_JOKER_SAMPLES = 50000;

const threads = [];

let taskID = Math.random();
let tasks = 0;

let bestScore;

const bestPlayScoreDiv = document.getElementById('bestPlayScore');
const bestPlayNameDiv = document.getElementById('bestPlayName');
const scoreChipsDiv = document.getElementById('scoreChips');
const scoreMultDiv = document.getElementById('scoreMult');
const breakdownDiv = document.getElementById('Breakdown');
const chipIcon = '<span class="chipIcon"></span>';
let breakdownHTML = '';

function permutations(inputArr) {
  var results = [];

  function permute(arr, memo) {
    var cur, memo = memo || [];

    for (let i = 0; i < arr.length; i++) {
      cur = arr.splice(i, 1);
      if (arr.length === 0) {
        results.push(memo.concat(cur));
      }
      permute(arr.slice(), memo.concat(cur));
      arr.splice(i, 0, cur[0]);
    }

    return results;
  }

  return permute(inputArr);
}

function getEdition(modifiers) {
  if(modifiers.foil) return 1;
  if(modifiers.holographic) return 2;
  if(modifiers.polychrome) return 3;
  //if(modifiers.negative) return 4;
  return 0;
}

function getEnhancement(modifiers) {
  if(modifiers.increment) return 1;
  if(modifiers.mult) return 2;
  if(modifiers.wild) return 3;
  if(modifiers.glass) return 4;
  if(modifiers.steel) return 5;
  if(modifiers.stone) return 6;
  if(modifiers.gold) return 7;
  if(modifiers.chance) return 8;
  return 0;
}

let breakdownHand = new Hand();

function terminateThreads() {
  for(let i = 0; i < threads.length; i++) {
    threads[i].terminate();
  }

  const jokerKeys = optimizePass === "cards" ? state.bestJokers : Object.keys(state.playfieldJokers);
  jokerKeysForTask = jokerKeys.slice();

  const minimizeMode = state.optimizeMode === 1;
  const payload = {
    cards: Object.keys(state.playfieldCards).map((a, index) => {
      return [
        state.playfieldCards[a].type[1],
        state.playfieldCards[a].type[0],
        getEdition(state.playfieldCards[a].modifiers),
        getEnhancement(state.playfieldCards[a].modifiers),
        state.playfieldCards[a].modifiers.double ? 2 : 0,
        0, // extra chips
        state.playfieldCards[a].modifiers.disabled,
        index
      ];
    }),
    hands: hands.map(a => {
      return [
        a.level,
        a.planets,
        a.played,
        a.playedThisRound
      ];
    }),
    TheFlint: state.theFlint,
    TheEye: state.theEye,
    PlasmaDeck: state.plasmaDeck,
    Observatory: state.observatory,
    taskID,
    optimizeCards: passOptimizeCards,
    minimize: minimizeMode,
    optimizeMode: state.optimizeMode,
    bestHand: state.bestHand.map(a => {
      return Object.keys(state.playfieldCards).indexOf(a);
    }),
    jokers: jokerKeys.map((a, index) => {
      return [
        state.playfieldJokers[a].type[0] * 10 + state.playfieldJokers[a].type[1],
        state.playfieldJokers[a].value,
        getEdition(state.playfieldJokers[a].modifiers),
        state.playfieldJokers[a].modifiers.disabled,
        state.playfieldJokers[a].sell,
        index
      ];
    })
  };

  breakdownHand.TheFlint = state.theFlint;
  breakdownHand.TheEye = state.theEye;
  breakdownHand.PlasmaDeck = state.plasmaDeck;
  breakdownHand.Observatory = state.observatory;
  breakdownHand.hands = hands.map(hand => ([
    hand.level,
    hand.planets,
    hand.played,
    hand.playedThisRound
  ]));

  for(let i = 0; i < THREADS; i++) {
    threads[i] = new Worker(new URL('../worker/worker.ts', import.meta.url), { type: 'module' });
    threads[i].onmessage = workerMessage;
    threads[i].postMessage(['start', {...payload, workerID: i}]);
  }
}

let tmpBestJokers;
let tmpBestCards;
let tmpBestCardsInHand;
let tmpBestHighHand;
let tmpBestLowHand;
let tmpTypeOfHand;
let tmpBestID;
let tmpCompiledValues;

let tmpMeanScore;
let tmpMedianScore;
let optimizePass = null;
let optimizeBoth = false;
let passOptimizeJokers = false;
let passOptimizeCards = false;
let jokerKeysForTask = [];

function workerMessage(msg) {
  if(msg.data[0] === taskID) {
    tasks--;
    // id, bestScore, state.bestJokers, bestCards, high, low
    if(!bestScore) {
      bestScore = msg.data[1];
      tmpBestJokers = msg.data[2];
      tmpBestCards = msg.data[3];
      tmpBestCardsInHand = msg.data[4];
      tmpBestHighHand = msg.data[5];
      tmpBestLowHand = msg.data[6];
      tmpTypeOfHand = msg.data[7];
      tmpMeanScore = msg.data[8];
      tmpMedianScore = msg.data[9];
      tmpBestID = msg.data[10];
      tmpCompiledValues = msg.data[11];
    }
    if(state.minimize) {
      if(msg.data[1][1] < bestScore[1] || (msg.data[1][1] === bestScore[1] && msg.data[1][0] < bestScore[0])) {
        bestScore = msg.data[1];
        tmpBestJokers = msg.data[2];
        tmpBestCards = msg.data[3];
        tmpBestCardsInHand = msg.data[4];
        tmpBestHighHand = msg.data[5];
        tmpBestLowHand = msg.data[6];
        tmpTypeOfHand = msg.data[7];
        tmpMeanScore = msg.data[8];
        tmpMedianScore = msg.data[9];
        tmpBestID = msg.data[10];
        tmpCompiledValues = msg.data[11];
      }
      else if(msg.data[6][1] < tmpBestLowHand[1] || (msg.data[6][1] === tmpBestLowHand[1] && msg.data[6][0] < tmpBestLowHand[0])) {
        bestScore = msg.data[1];
        tmpBestJokers = msg.data[2];
        tmpBestCards = msg.data[3];
        tmpBestCardsInHand = msg.data[4];
        tmpBestHighHand = msg.data[5];
        tmpBestLowHand = msg.data[6];
        tmpTypeOfHand = msg.data[7];
        tmpMeanScore = msg.data[8];
        tmpMedianScore = msg.data[9];
        tmpBestID = msg.data[10];
        tmpCompiledValues = msg.data[11];
      }
      else if(msg.data[1][1] === bestScore[1] && msg.data[1][0] === bestScore[0] && msg.data[10] < tmpBestID) {
        bestScore = msg.data[1];
        tmpBestJokers = msg.data[2];
        tmpBestCards = msg.data[3];
        tmpBestCardsInHand = msg.data[4];
        tmpBestHighHand = msg.data[5];
        tmpBestLowHand = msg.data[6];
        tmpTypeOfHand = msg.data[7];
        tmpMeanScore = msg.data[8];
        tmpMedianScore = msg.data[9];
        tmpBestID = msg.data[10];
        tmpCompiledValues = msg.data[11];
      }
    }
    else {
      if(msg.data[1][1] > bestScore[1] || (msg.data[1][1] === bestScore[1] && msg.data[1][0] > bestScore[0])) {
        bestScore = msg.data[1];
        tmpBestJokers = msg.data[2];
        tmpBestCards = msg.data[3];
        tmpBestCardsInHand = msg.data[4];
        tmpBestHighHand = msg.data[5];
        tmpBestLowHand = msg.data[6];
        tmpTypeOfHand = msg.data[7];
        tmpMeanScore = msg.data[8];
        tmpMedianScore = msg.data[9];
        tmpBestID = msg.data[10];
        tmpCompiledValues = msg.data[11];
      }
      else if(msg.data[5][1] > tmpBestHighHand[1] || (msg.data[5][1] === tmpBestHighHand[1] && msg.data[5][0] > tmpBestHighHand[0])) {
        bestScore = msg.data[1];
        tmpBestJokers = msg.data[2];
        tmpBestCards = msg.data[3];
        tmpBestCardsInHand = msg.data[4];
        tmpBestHighHand = msg.data[5];
        tmpBestLowHand = msg.data[6];
        tmpTypeOfHand = msg.data[7];
        tmpMeanScore = msg.data[8];
        tmpMedianScore = msg.data[9];
        tmpBestID = msg.data[10];
        tmpCompiledValues = msg.data[11];
      }
      else if(msg.data[1][1] === bestScore[1] && msg.data[1][0] === bestScore[0] && msg.data[10] < tmpBestID) {
        bestScore = msg.data[1];
        tmpBestJokers = msg.data[2];
        tmpBestCards = msg.data[3];
        tmpBestCardsInHand = msg.data[4];
        tmpBestHighHand = msg.data[5];
        tmpBestLowHand = msg.data[6];
        tmpTypeOfHand = msg.data[7];
        tmpMeanScore = msg.data[8];
        tmpMedianScore = msg.data[9];
        tmpBestID = msg.data[10];
        tmpCompiledValues = msg.data[11];
      }
    }
    if(tasks === 0) {
      state.bestJokers = tmpBestJokers.map(a => {
        return jokerKeysForTask[a[5]];
      });
      state.bestHand = tmpBestCards.map(a => {
        return Object.keys(state.playfieldCards)[a[7]];
      });
      state.lastTypeOfHand = tmpTypeOfHand;
      state.lastCompiledValues = tmpCompiledValues;

      if(optimizeBoth && optimizePass === "jokers") {
        calculator("cards");
        return;
      }

      optimizePass = null;
      optimizeBoth = false;

      if(tmpBestHighHand[0] === tmpBestLowHand[0] && tmpBestHighHand[1] === tmpBestLowHand[1]) {
        bestPlayScoreDiv.innerHTML = chipIcon + bigNumberWithCommas(tmpBestHighHand, true);
        bestPlayNameDiv.innerHTML = hands[tmpTypeOfHand].name + `<span class="nameLvl" style="color: ${hands[tmpTypeOfHand].level === 1 ? handColors[0] : handColors[((Math.ceil(Math.abs(hands[tmpTypeOfHand].level)/6)*6+hands[tmpTypeOfHand].level+4)%6)+1]}"> lvl.${hands[tmpTypeOfHand].level}</span>`;
        scoreChipsDiv.innerText = numberWithCommas(tmpBestLowHand[2]);
        scoreMultDiv.innerText = bigNumberWithCommas(tmpBestLowHand[3]);
      }
      else {
        bestPlayScoreDiv.innerHTML = bigNumberWithCommas(tmpBestLowHand, true) + ' &lt;' + chipIcon + '&lt; ' + bigNumberWithCommas(tmpBestHighHand, true);
        bestPlayScoreDiv.innerHTML += `<br><span class="EV">Long-term EV</span> ${bigNumberWithCommas(tmpMeanScore, true)}<br><span class="EV">Short-term EV</span> ${bigNumberWithCommas(tmpMedianScore, true)}<br>`;
        bestPlayNameDiv.innerHTML = hands[tmpTypeOfHand].name + `<span class="nameLvl" style="color: ${hands[tmpTypeOfHand].level === 1 ? handColors[0] : handColors[((Math.ceil(Math.abs(hands[tmpTypeOfHand].level)/6)*6+hands[tmpTypeOfHand].level+4)%6)+1]}"> lvl.${hands[tmpTypeOfHand].level}</span>`;
        scoreChipsDiv.innerText = '>' + numberWithCommas(tmpBestLowHand[2]);
        scoreMultDiv.innerText = '>' + bigNumberWithCommas(tmpBestLowHand[3]);
      }

      redrawPlayfieldHTML();

      document.body.style.cursor = '';

      breakdownHand.jokers = tmpBestJokers;
      breakdownHand.cards = tmpBestCards;
      breakdownHand.cardsInHand = tmpBestCardsInHand;
      breakdownHand.compileAll();
      breakdownHand.simulateWorstHand();
      updateBreakdown(breakdownHand.breakdown.map(a => {
        return {
          ...a,
          cards: a.cards.map(b => b[7] === undefined ? Object.keys(state.playfieldJokers)[b[5]] : Object.keys(state.playfieldCards)[b[7]])
        }
      }));
    }
  }
}

function updateBreakdown(breakdown) {
  breakdownHTML = '';
  let previousChips = 0;
  let previousMult = [0, 0];
  for(let line of breakdown) {
    let breakdownScore = '<div class="levelStat" style="visibility: hidden;"><span id="scoreChips" class="levelStatB"></span>X<span id="scoreMult" class="levelStatR"></span></div>';
    let breakdownCards = '';
    for(let id of line.cards) {
      if(id[0] === 'j') {
        breakdownCards += `<div class='tooltip'><div class="playfieldCard jokerCard${state.playfieldJokers[id].string}></div>` +
        `</div>`;
      }
      else {
        breakdownCards += `<div class="tooltip"><div class="playfieldCard${state.playfieldCards[id].string}></div>` +
        `</div>`;
      }
    }
    if(breakdownCards === '') {
      breakdownCards = '<div class="tooltip"></div>';
    }
    if(line.chips !== previousChips || line.mult[0] !== previousMult[0] || line.mult[1] !== previousMult[1]) {
      breakdownScore = `<div class="levelStat">` +
        `<span id="scoreChips" class="levelStatB">${numberWithCommas(line.chips)}</span>X` +
        `<span id="scoreMult" class="levelStatR">${bigNumberWithCommas(normalizeBig(line.mult))}</span>` +
        `</div>`;
        previousChips = line.chips;
        previousMult = line.mult;
    }
    breakdownHTML += `<div class="breakdownLine"${line.hasOwnProperty('newCard') ? ' style="background-color: #fffa"' : (line.hasOwnProperty('retrigger') ? ' style="background-color: #fcc"' : ((line.hasOwnProperty('modifier') && line.modifier) ? ' style="background-color: #cdf"' : ''))}><div>` +
      breakdownCards +
      `</div><span>` +
      line.description +
      `</span>` +
      breakdownScore +
      `</div>`;
  }

  breakdownDiv.innerHTML = breakdownHTML;
}

function factorial(n) {
  let ans = 1;
  for(let i = 2; i <= n; i++) {
    ans *= i;
    if(ans > Number.MAX_SAFE_INTEGER) {
      return Number.MAX_SAFE_INTEGER;
    }
  }
  return ans;
}

function calculator(nextPass = null) {
  document.body.style.cursor = 'wait';

  if(nextPass) {
    optimizeBoth = true;
    optimizePass = nextPass;
  }
  else {
    optimizeBoth = state.optimizeJokers && state.optimizeCards;
    optimizePass = optimizeBoth ? "jokers" : "final";
  }

  passOptimizeJokers = state.optimizeJokers && optimizePass !== "cards";
  passOptimizeCards = state.optimizeCards && optimizePass !== "jokers";

  tmpBestCards = [];
  tmpBestHighHand = [0, 0, 0, 0, 0];
  tmpBestLowHand = [0, 0, 0, 0, 0];
  tmpTypeOfHand = 11;
  bestScore = false;

  taskID = Math.random();
  let possibleHands = [];
  let chosen = [];
  tmpBestJokers = [];

  tasks = 0;

  terminateThreads();

  if(Object.keys(state.playfieldJokers).length === 0) {
    threads[0].postMessage(['once']);
    tasks = 1;
  }
  else if(!passOptimizeJokers) {
    threads[0].postMessage(['dontOptimizeJokers']);
    tasks = 1;
  }
  else {
    const jokerCount = Object.keys(state.playfieldJokers).length;
    const possibleJokers = factorial(jokerCount);

    if(possibleJokers <= MAX_JOKER_PERMUTATIONS) {
      let tasksPerThread = Math.ceil(possibleJokers / THREADS);

      for(let i = 0; i < THREADS; i++) {
        threads[i].postMessage(['optimizeJokers', i * tasksPerThread, (i + 1) * tasksPerThread]);
        tasks++;
        if((i + 1) * tasksPerThread >= possibleJokers) {
          break;
        }
      }
    }
    else {
      const stride = Math.max(1, Math.ceil(possibleJokers / MAX_JOKER_SAMPLES));
      const step = stride * THREADS;

      for(let i = 0; i < THREADS; i++) {
        const start = i * stride;
        if(start >= possibleJokers) {
          break;
        }
        threads[i].postMessage(['optimizeJokersSample', start, possibleJokers, step]);
        tasks++;
      }
    }
  }

  state.bestJokers = Object.keys(state.playfieldJokers);
}

export { calculator };
