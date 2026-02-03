// @ts-nocheck

import { state } from "./state";
import { hands, handColors } from "./data";
import {
  jokerPrice,
  jokerTexts,
  rankNames,
  suitNames,
  rarityNames,
  endc,
  multc,
  prodc,
  chipc,
  numc,
  moneyc,
  probc,
  shadowc,
  diamondc,
  heartc,
  spadec,
  clubc,
  diamondsc,
  heartsc,
  spadesc,
  clubsc,
  spectralc,
  planetc,
  tarotc,
  celestialc,
  negativec,
  commonc,
  roomc
} from "./cards";
import { numberWithCommas } from "./format";
import { cardValues, QUEEN } from "./breakdown";
import { calculator } from "./manageWorkers";
import { compileHand } from "./hand-url";

const menuBtns = [
  document.getElementById('JokersBtn'),
  document.getElementById('CardsBtn'),
  document.getElementById('HandsBtn'),
  document.getElementById('BreakdownBtn'),
  document.getElementById('ModifyJokerBtn'),
];

const tabs = [
  document.getElementById('Jokers'),
  document.getElementById('Cards'),
  document.getElementById('Hands'),
  document.getElementById('Breakdown'),
  document.getElementById('ModifyJoker'),
];

for(let i = 0; i < menuBtns.length; i++) {
  menuBtns[i].addEventListener('click', changeTab(i));
  tabs[i].style.display = "none";
}

let modifyingJokerValTxt = document.getElementById('modValue');
let modifyingJokerValueDiv = document.getElementById('modifyJokerValue');
let modifyingJokerValDiv = document.getElementById('modifyJokerVal');
let modifyingJokerSellValDiv = document.getElementById('modifyJokerSellVal');
let modifyJokerDiv = document.getElementById('modifyJoker');
let highContrastDiv = document.getElementById('highContrastBtn');

function changeTab(tab) {
  return () => {
    state.revertToTab = tab === 4 ? state.revertToTab : tab;
    for(let i = 0; i < menuBtns.length; i++) {
      menuBtns[i].classList.remove('active');
      tabs[i].style.display = "none";
    }
    menuBtns[tab].classList.add('active');
    tabs[tab].style.display = "block";

    state.modifyingJoker = false;
  }
}

changeTab(0)();

const handLevels = document.getElementById('hands');
const consumables = document.getElementById('consumables');
const toggleJokerDiv = document.getElementById('toggleJokerBtn');
const toggleCardDiv = document.getElementById('toggleCardBtn');
const optimizeMaxDiv = document.getElementById('toggleOptimizeMaxBtn');
const optimizeMinDiv = document.getElementById('toggleOptimizeMinBtn');
const toggleTheFlintDiv = document.getElementById('toggleTheFintBtn');
const toggleTheEyeDiv = document.getElementById('toggleTheEyeBtn');
const togglePlasmaDiv = document.getElementById('togglePlasmaBtn');
const toggleObservatoryDiv = document.getElementById('toggleObservatoryBtn');
const settingsModal = document.getElementById('settingsModal');
const optimizeJokersIndicator = document.getElementById('optimizeJokersIndicator');
const optimizeCardsIndicator = document.getElementById('optimizeCardsIndicator');
const copyJsonStatus = document.getElementById('copyJsonStatus');
const spectralToggles = document.getElementById('spectralToggles');
const spectralCount = document.getElementById('spectralCount');
const settingsCloseButton = settingsModal ? settingsModal.querySelector('.settingsClose') : null;

const spectralCards = [
  { id: 'ankh', label: 'Ankh' },
  { id: 'hex', label: 'Hex' },
  { id: 'ectoplasm', label: 'Ectoplasm' },
  { id: 'immolate', label: 'Immolate' },
  { id: 'cryptid', label: 'Cryptid' },
  { id: 'ouija', label: 'Ouija' },
  { id: 'soul', label: 'The Soul' },
  { id: 'blackHole', label: 'Black Hole' }
];

function updateSpectralUI() {
  if(!spectralToggles || !spectralCount) return;
  let enabled = 0;
  for(const item of spectralCards) {
    if(state.spectral[item.id]) enabled++;
    const button = spectralToggles.querySelector(`[data-spectral="${item.id}"]`);
    if(button) {
      button.classList.toggle('is-active', !!state.spectral[item.id]);
    }
  }
  spectralCount.innerText = `${enabled}/${spectralCards.length}`;
}

function toggleSpectral(id) {
  if(!state.spectral || !(id in state.spectral)) return;
  state.spectral[id] = !state.spectral[id];
  updateSpectralUI();
}

if(spectralToggles) {
  spectralToggles.innerHTML = spectralCards
    .map((item) => `<button type="button" class="spectralToggle" data-spectral="${item.id}" onclick="toggleSpectral('${item.id}')">${item.label}</button>`)
    .join('');
  updateSpectralUI();
}

updateOptimizeModeUI();

function incrementLevel(inc, handIndex) {
  const hand = hands[handIndex];
  const div = document.getElementById(hand.id);
  hand.level += inc;
  if(hand.level < 0) hand.level = 0;
  hand.mult = Math.max(1, hand.s_mult + (hand.level-1) * hand.l_mult);
  hand.chips = Math.max(0, hand.s_chips + (hand.level-1) * hand.l_chips);
  div.children[2].innerText = 'lvl.'+hand.level;
  div.children[2].style.backgroundColor = hand.level === 1 ? handColors[0] : handColors[((Math.ceil(Math.abs(hand.level)/6)*6+hand.level+4)%6)+1];
  div.children[4].children[0].innerText = numberWithCommas(hand.chips);
  div.children[4].children[1].innerText = numberWithCommas(hand.mult);

  redrawPlayfield();
}

function incrementPlanet(inc, handIndex) {
  const hand = hands[handIndex];
  const div = document.getElementById('planets-' + hand.id);
  hand.planets += inc;
  if(hand.planets < 0 || inc === 0) hand.planets = 0;
  div.children[3].innerText = hand.planets;

  redrawPlayfield();
}

function setPlanet(handIndex) {
  const hand = hands[handIndex];
  const div = document.getElementById('planets-' + hand.id);
  let willBlur = false;

  if(div.children[3].innerText.indexOf('\n') >= 0) {
    div.children[3].innerText = div.children[3].innerText.replace(/[\r\n]/g, '');
    willBlur = true;
  }
  if(1 * div.children[3].innerText > 0) {
    hand.planets = Math.round(1 * div.children[3].innerText);
  }
  else {
    hand.planets = 0;
  }

  if(willBlur) div.children[3].blur();

  redrawPlayfield();
}

function setLevel(handIndex) {
  const hand = hands[handIndex];
  const div = document.getElementById(hand.id);
  let willBlur = false;

  if(div.children[2].innerText.indexOf('\n') >= 0) {
    div.children[2].innerText = div.children[2].innerText.replace(/[\r\n]/g, '');
    willBlur = true;
  }
  if(1 * div.children[2].innerText > 0) {
    hand.level = Math.round(1 * div.children[2].innerText);
  }
  else {
    hand.level = 0;
  }

  hand.mult = Math.max(1, hand.s_mult + (hand.level-1) * hand.l_mult);
  hand.chips = Math.max(0, hand.s_chips + (hand.level-1) * hand.l_chips);
  div.children[2].style.backgroundColor = hand.level === 1 ? handColors[0] : handColors[((Math.ceil(Math.abs(hand.level)/6)*6+hand.level+4)%6)+1];
  div.children[4].children[0].innerText = numberWithCommas(hand.chips);
  div.children[4].children[1].innerText = numberWithCommas(hand.mult);

  if(willBlur) div.children[2].blur();

  redrawPlayfield();
}

function setPlayed(handIndex) {
  const hand = hands[handIndex];
  const div = document.getElementById(hand.id);
  let willBlur = false;

  if(div.children[1].children[0].innerText.indexOf('\n') >= 0) {
    div.children[1].children[0].innerText = div.children[1].children[0].innerText.replace(/[\r\n]/g, '');
    willBlur = true;
  }

  if(1 * div.children[1].children[0].innerText > 0) {
    hand.played = Math.round(1 * div.children[1].children[0].innerText);
  }
  else {
    hand.played = 0;
  }

  if(willBlur) div.children[1].children[0].blur();

  redrawPlayfield();
}

function removeLvlText (handIndex) {
  const hand = hands[handIndex];
  const div = document.getElementById(hand.id);
  div.children[2].innerText = hand.level;

  selectAll(div.children[2])
}

function selectAll(div) {
  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(div);
  selection.removeAllRanges();
  selection.addRange(range);
}

function addLvlText(handIndex) {
  const hand = hands[handIndex];
  const div = document.getElementById(hand.id);
  div.children[2].innerText = 'lvl.'+hand.level;
}

function updateOptimizeModeUI() {
  if(optimizeMaxDiv) {
    optimizeMaxDiv.innerText = state.optimizeMode === 0 ? 'X' : '\u00a0';
  }
  if(optimizeMinDiv) {
    optimizeMinDiv.innerText = state.optimizeMode === 1 ? 'X' : '\u00a0';
  }
}

function setOptimizeMode(mode) {
  state.optimizeMode = mode;
  state.minimize = mode === 1;
  updateOptimizeModeUI();
  redrawPlayfield();
}

function markJokersDirty() {
  if(state.optimizeJokersSnapshot) {
    state.optimizeJokersDirty = true;
  }
}

function markCardsDirty() {
  if(state.optimizeCardsSnapshot) {
    state.optimizeCardsDirty = true;
  }
}

function toggleJoker() {
  const wasEnabled = state.optimizeJokers;
  state.optimizeJokers = !state.optimizeJokers;
  if(!wasEnabled && state.optimizeJokers) {
    state.optimizeJokersSnapshot = state.bestJokers.slice();
    state.optimizeJokersDirty = false;
  }
  if(wasEnabled && !state.optimizeJokers && state.optimizeJokersSnapshot && !state.optimizeJokersDirty) {
    state.bestJokers = state.optimizeJokersSnapshot.slice();
  }
  if(!state.optimizeJokers) {
    state.optimizeJokersSnapshot = null;
  }
  redrawPlayfield();

  if(state.optimizeJokers) {
    toggleJokerDiv.innerText = 'X';
  }
  else {
    toggleJokerDiv.innerHTML = '&nbsp;';
  }
  updateOptimizeIndicators();
}

function toggleCard() {
  const wasEnabled = state.optimizeCards;
  state.optimizeCards = !state.optimizeCards;
  if(!wasEnabled && state.optimizeCards) {
    state.optimizeCardsSnapshot = state.bestHand.slice();
    state.optimizeCardsDirty = false;
  }
  if(wasEnabled && !state.optimizeCards && state.optimizeCardsSnapshot && !state.optimizeCardsDirty) {
    state.bestHand = state.optimizeCardsSnapshot.slice();
  }
  if(!state.optimizeCards) {
    state.optimizeCardsSnapshot = null;
  }
  redrawPlayfield();

  if(state.optimizeCards) {
    toggleCardDiv.innerText = 'X';
  }
  else {
    toggleCardDiv.innerHTML = '&nbsp;';
  }
  updateOptimizeIndicators();
}

function togglePlasma() {
  state.plasmaDeck = !state.plasmaDeck;
  redrawPlayfield();

  if(state.plasmaDeck) {
    togglePlasmaDiv.innerText = 'X';
  }
  else {
    togglePlasmaDiv.innerHTML = '&nbsp;';
  }
}

function toggleTheFlint() {
  state.theFlint = !state.theFlint;
  redrawPlayfield();

  if(state.theFlint) {
    toggleTheFlintDiv.innerText = 'X';
  }
  else {
    toggleTheFlintDiv.innerHTML = '&nbsp;';
  }
}

function toggleTheEye() {
  state.theEye = !state.theEye;
  redrawPlayfield();

  if(state.theEye) {
    toggleTheEyeDiv.innerText = 'X';
  }
  else {
    toggleTheEyeDiv.innerHTML = '&nbsp;';
  }
}

function toggleObservatory() {
  state.observatory = !state.observatory;
  redrawPlayfield();

  if(state.observatory) {
    toggleObservatoryDiv.innerText = 'X';
    consumables.style.display = 'block';
  }
  else {
    toggleObservatoryDiv.innerHTML = '&nbsp;';
    consumables.style.display = 'none';
  }
}

function togglePlayed(index) {
  hands[index].playedThisRound = hands[index].playedThisRound ? 0 : 1;

  redrawPlayfield();

  if(hands[index].playedThisRound) {
    handLevels.children[index].children[0].innerText = 'X';
  }
  else {
    handLevels.children[index].children[0].innerHTML = '&nbsp;';
  }
}

function invertPlayedHands() {
  for(let index = 0; index < hands.length; index++) {
    hands[index].playedThisRound = hands[index].playedThisRound ? 0 : 1;

    if(hands[index].playedThisRound) {
      handLevels.children[index].children[0].innerText = 'X';
    }
    else {
      handLevels.children[index].children[0].innerHTML = '&nbsp;';
    }
  }

  redrawPlayfield();
}

function toggleSettings(next) {
  if(!settingsModal) return;
  const shouldOpen = typeof next === 'boolean' ? next : !settingsModal.classList.contains('is-open');
  if(shouldOpen) {
    settingsModal.classList.add('is-open');
    settingsModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    if(settingsCloseButton && settingsCloseButton.focus) {
      settingsCloseButton.focus();
    }
  }
  else {
    settingsModal.classList.remove('is-open');
    settingsModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  }
}

document.addEventListener('keydown', (event) => {
  if(event.key === 'Escape' && settingsModal && settingsModal.classList.contains('is-open')) {
    toggleSettings(false);
  }
});

function updateOptimizeIndicators() {
  if(optimizeJokersIndicator) {
    optimizeJokersIndicator.style.display = state.optimizeJokers ? 'flex' : 'none';
  }
  if(optimizeCardsIndicator) {
    optimizeCardsIndicator.style.display = state.optimizeCards ? 'flex' : 'none';
  }
}

let dragType = null;
let dragId = null;

function clearDragOver(container) {
  if(!container) return;
  const previous = container.querySelector('.drag-over');
  if(previous) {
    previous.classList.remove('drag-over');
  }
}

function getDragTargetId(event, selector, dataKey) {
  const target = event.target;
  if(!target || !target.closest) return null;

  const direct = target.closest(selector);
  if(direct) {
    return direct.dataset?.[dataKey] || direct.id || null;
  }

  const wrapper = target.closest('.tooltip');
  if(wrapper) {
    const card = wrapper.querySelector(selector);
    if(card) {
      return card.dataset?.[dataKey] || card.id || null;
    }
  }

  return null;
}

function reorderByDrag(list, fromId, toId) {
  const fromIndex = list.indexOf(fromId);
  if(fromIndex < 0) return list;
  let toIndex = toId ? list.indexOf(toId) : list.length - 1;
  if(toIndex < 0) {
    toIndex = list.length - 1;
  }
  if(fromIndex === toIndex) return list;
  list.splice(fromIndex, 1);
  list.splice(toIndex, 0, fromId);
  return list;
}

function handleJokerDragStart(event) {
  const id = getDragTargetId(event, '.jokerCard', 'jokerId');
  if(!id) return;
  dragType = 'joker';
  dragId = id;
  if(event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', id);
  }
}

function handleJokerDragOver(event) {
  if(dragType !== 'joker') return;
  event.preventDefault();
  if(event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move';
  }
  const tooltip = event.target.closest('.tooltip');
  if(!tooltip || !jokerAreaDiv.contains(tooltip)) {
    clearDragOver(jokerAreaDiv);
    return;
  }
  clearDragOver(jokerAreaDiv);
  tooltip.classList.add('drag-over');
}

function handleJokerDrop(event) {
  if(dragType !== 'joker') return;
  event.preventDefault();
  clearDragOver(jokerAreaDiv);
  const targetId = getDragTargetId(event, '.jokerCard', 'jokerId');
  markJokersDirty();
  reorderByDrag(state.bestJokers, dragId, targetId);
  const newPlayfield = {};
  for(const joker of state.bestJokers) {
    newPlayfield[joker] = state.playfieldJokers[joker];
  }
  state.playfieldJokers = newPlayfield;
  if(state.optimizeJokers) {
    toggleJoker();
  }
  else {
    redrawPlayfield();
  }
  dragType = null;
  dragId = null;
}

function handleCardDragStart(event) {
  const id = getDragTargetId(event, '.playfieldCard', 'cardId');
  if(!id) return;
  dragType = 'card';
  dragId = id;
  if(event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', id);
  }
}

function handleCardDragOver(event) {
  if(dragType !== 'card') return;
  event.preventDefault();
  if(event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move';
  }
  const tooltip = event.target.closest('.tooltip');
  if(!tooltip || !bestPlayDiv.contains(tooltip)) {
    clearDragOver(bestPlayDiv);
    return;
  }
  clearDragOver(bestPlayDiv);
  tooltip.classList.add('drag-over');
}

function handleCardDrop(event) {
  if(dragType !== 'card') return;
  event.preventDefault();
  clearDragOver(bestPlayDiv);
  const targetId = getDragTargetId(event, '.playfieldCard', 'cardId');
  markCardsDirty();
  reorderByDrag(state.bestHand, dragId, targetId);
  if(state.optimizeCards) {
    toggleCard();
  }
  else {
    redrawPlayfield();
  }
  dragType = null;
  dragId = null;
}

function setupDragAndDrop() {
  if(jokerAreaDiv) {
    jokerAreaDiv.addEventListener('dragstart', handleJokerDragStart);
    jokerAreaDiv.addEventListener('dragover', handleJokerDragOver);
    jokerAreaDiv.addEventListener('drop', handleJokerDrop);
    jokerAreaDiv.addEventListener('dragend', () => {
      dragType = null;
      dragId = null;
      clearDragOver(jokerAreaDiv);
    });
  }
  if(bestPlayDiv) {
    bestPlayDiv.addEventListener('dragstart', handleCardDragStart);
    bestPlayDiv.addEventListener('dragover', handleCardDragOver);
    bestPlayDiv.addEventListener('drop', handleCardDrop);
    bestPlayDiv.addEventListener('dragend', () => {
      dragType = null;
      dragId = null;
      clearDragOver(bestPlayDiv);
    });
  }
}

async function copyRunAsJson() {
  const bestPlayScoreDiv = document.getElementById('bestPlayScore');
  const bestPlayNameDiv = document.getElementById('bestPlayName');
  const scoreChipsDiv = document.getElementById('scoreChips');
  const scoreMultDiv = document.getElementById('scoreMult');
  const cardIds = Object.keys(state.playfieldCards);
  const jokerIds = Object.keys(state.playfieldJokers);
  const pageUrl = window.location.href;

  const payload = {
    version: 1,
    generatedAt: new Date().toISOString(),
    pageUrl,
    score: {
      bestPlayName: bestPlayNameDiv ? bestPlayNameDiv.innerText : '',
      bestPlayScore: bestPlayScoreDiv ? bestPlayScoreDiv.innerText : '',
      scoreChips: scoreChipsDiv ? scoreChipsDiv.innerText : '',
      scoreMult: scoreMultDiv ? scoreMultDiv.innerText : ''
    },
    settings: {
      optimizeJokers: state.optimizeJokers,
      optimizeCards: state.optimizeCards,
      minimize: state.minimize,
      optimizeMode: state.optimizeMode,
      theFlint: state.theFlint,
      theEye: state.theEye,
      plasmaDeck: state.plasmaDeck,
      observatory: state.observatory,
      highContrast: state.highContrast
    },
    spectral: { ...state.spectral },
    hands: hands.map(hand => ({
      name: hand.name,
      level: hand.level,
      planets: hand.planets,
      played: hand.played,
      playedThisRound: hand.playedThisRound,
      chips: hand.chips,
      mult: hand.mult
    })),
    jokers: {
      order: state.bestJokers.slice(),
      all: jokerIds.reduce((acc, id) => {
        acc[id] = {
          type: state.playfieldJokers[id].type.slice(),
          modifiers: { ...state.playfieldJokers[id].modifiers },
          value: state.playfieldJokers[id].value,
          sell: state.playfieldJokers[id].sell
        };
        return acc;
      }, {})
    },
    cards: {
      selected: state.bestHand.slice(),
      inHand: cardIds.filter(id => state.bestHand.indexOf(id) === -1),
      all: cardIds.reduce((acc, id) => {
        acc[id] = {
          type: state.playfieldCards[id].type.slice(),
          modifiers: { ...state.playfieldCards[id].modifiers }
        };
        return acc;
      }, {})
    },
    lastTypeOfHand: state.lastTypeOfHand,
    lastCompiledValues: state.lastCompiledValues,
    editor: {
      cardCount,
      jokerCount,
      jokerValue: state.jokerValue,
      modifiers: { ...state.modifiers },
      jokerModifiers: { ...state.jmodifiers }
    }
  };

  const json = JSON.stringify(payload, null, 2);
  let copied = false;

  try {
    if(navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(json);
      copied = true;
    }
  } catch (err) {
    copied = false;
  }

  if(!copied) {
    const textarea = document.createElement('textarea');
    textarea.value = json;
    textarea.setAttribute('readonly', 'true');
    textarea.style.position = 'absolute';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      copied = document.execCommand('copy');
    } catch (err) {
      copied = false;
    }
    document.body.removeChild(textarea);
  }

  if(copyJsonStatus) {
    copyJsonStatus.innerText = copied ? 'Copied JSON to clipboard.' : 'Unable to copy JSON.';
    if(copied) {
      setTimeout(() => {
        if(copyJsonStatus) copyJsonStatus.innerText = '';
      }, 2000);
    }
  }
}

const jokerValueHTML = document.getElementById('jokerVal');
state.jokerValue = 0;

const jokerCountHTML = document.getElementById('jokerCnt');
let jokerCount = 1;

const cardCountHTML = document.getElementById('cardCnt');
let cardCount = 1;

function incrementJokerValue(inc) {
  state.jokerValue += inc;
  if(inc === 0) {
    state.jokerValue = 0;
  }
  jokerValueHTML.innerText = state.jokerValue;
  jredrawCards();
}

function setJokerValue() {
  let willBlur = false;

  if(jokerValueHTML.innerText.indexOf('\n') >= 0) {
    jokerValueHTML.innerText = jokerValueHTML.innerText.replace(/[\r\n]/g, '');
    willBlur = true;
  }
  if(!isNaN(jokerValueHTML.innerText)) {
    state.jokerValue = Math.round(jokerValueHTML.innerText * 1);
  }
  else {
    state.jokerValue = 0;
  }

  if(willBlur) {
    jokerValueHTML.blur();
    jokerValueHTML.innerText = state.jokerValue;
  }

  jredrawCards();
}

function incrementJokerCount(inc) {
  jokerCount += inc;
  if(inc === 0) {
    jokerCount = 1;
  }
  jokerCountHTML.innerText = Math.max(1, jokerCount);
}

function setJokerCount() {
  console.log(jokerCountHTML.innerText);
  let willBlur = false;

  if(jokerCountHTML.innerText.indexOf('\n') >= 0) {
    jokerCountHTML.innerText = jokerCountHTML.innerText.replace(/[\r\n]/g, '');
    willBlur = true;
  }
  if(!isNaN(jokerCountHTML.innerText)) {
    jokerCount = Math.max(1, Math.round(jokerCountHTML.innerText * 1));
  }
  else {
    jokerCount = 1;
  }

  if(willBlur) {
    jokerCountHTML.blur();
    jokerCountHTML.innerText = jokerCount;
  }
}

function incrementCardCount(inc) {
  cardCount += inc;
  if(inc === 0) {
    cardCount = 1;
  }
  cardCountHTML.innerText = Math.max(1, cardCount);
}

function setCardCount() {
  console.log(cardCountHTML.innerText);
  let willBlur = false;

  if(cardCountHTML.innerText.indexOf('\n') >= 0) {
    cardCountHTML.innerText = cardCountHTML.innerText.replace(/[\r\n]/g, '');
    willBlur = true;
  }
  if(!isNaN(cardCountHTML.innerText)) {
    cardCount = Math.max(1, Math.round(cardCountHTML.innerText * 1));
  }
  else {
    cardCount = 1;
  }

  if(willBlur) {
    cardCountHTML.blur();
    cardCountHTML.innerText = cardCount;
  }
}

handLevels.innerHTML = '';

for(let i = 0; i < hands.length; i++) {
  hands[i].level = 1;
  hands[i].planets = 0;
  hands[i].id = hands[i].name.replace(/ /g,'');
  hands[i].played = 0;
  hands[i].playedThisRound = 0;
  handLevels.innerHTML += `<div class="handLevel" id="${hands[i].id}">
    <span class="lvlBtn" title="played this round" onclick="togglePlayed(${i})">&nbsp;</span>
    <div style="float: left;">&nbsp;#<span contenteditable="true" class="handCount" onfocus="selectAll(this)" oninput="setPlayed(${i})">0</span></div>
    <span contenteditable="true" class="handLvl" onfocus="removeLvlText(${i})" onblur="addLvlText(${i})" oninput="setLevel(${i})">lvl.1</span>
    <span class="handName">${hands[i].name}</span>
    <span class="levelStat">
      <span class="levelStatB">${hands[i].chips}</span>X<span class="levelStatR">${hands[i].mult}</span>
    </span>
  </div>`;

  consumables.innerHTML += `<div class="handLevel" id="planets-${hands[i].id}" style="background-color: #89b; text-align: center;">
    <span class="lvlBtn" onclick="incrementPlanet(-1, ${i})">-</span>
    <span class="lvlBtn" onclick="incrementPlanet( 0, ${i})">0</span>
    <span class="lvlBtn" onclick="incrementPlanet( 1, ${i})">+</span>
    <span contenteditable="true" class="handLvl" oninput="setPlanet(${i})" onfocus="selectAll(this)">0</span>
    <div style="display: flex;"><div style="color: #cef; width: 100%;">${hands[i].planet}</div><div style="width: 100%;">${hands[i].name}</div></dpv>
  </div>`;
}

let modifierString = ', url(assets/Enhancers.png) -71px 0px';
let modifierPostString = '';

let modifierClass = '';

function jtoggleCardModifier(name) {
  if(('foil holographic polychrome disabled'.indexOf(name) >= 0) && !state.jmodifiers[name]) {
    state.jmodifiers.foil = false;
    state.jmodifiers.holographic = false;
    state.jmodifiers.polychrome = false;
    state.jmodifiers.disabled = false;
  }
  state.jmodifiers[name] = !state.jmodifiers[name];

  jredrawCards();
}

function setModifierString() {
  modifierClass = '';

  if(state.modifiers.stone) {
    modifierString = ', url(assets/Enhancers.png) 142px 0';
  }
  else if(state.modifiers.increment) {
    modifierString = ', url(assets/Enhancers.png) -71px -95px';
  }
  else if(state.modifiers.mult) {
    modifierString = ', url(assets/Enhancers.png) -142px -95px';
  }
  else if(state.modifiers.wild) {
    modifierString = ', url(assets/Enhancers.png) -213px -95px';
  }
  else if(state.modifiers.chance) {
    modifierString = ', url(assets/Enhancers.png) -284px -95px';
  }
  else if(state.modifiers.glass) {
    modifierString = ', url(assets/Enhancers.png) -355px -95px';
  }
  else if(state.modifiers.steel) {
    modifierString = ', url(assets/Enhancers.png) -426px -95px';
  }
  else if(state.modifiers.gold) {
    modifierString = ', url(assets/Enhancers.png) 71px 0px';
  }
  else {
    modifierString = ', url(assets/Enhancers.png) -71px 0px';
  }

  if(state.modifiers.double) {
    modifierPostString = 'url(assets/Enhancers.png) 142px 95px, ';
  }
  else {
    modifierPostString = 'url(assets/Jokers.png) 0px -855px, ';
  }

  if(state.modifiers.foil) {
    modifierPostString += 'url(assets/Editions.png) -71px 0, ';
  }
  else if(state.modifiers.holographic) {
    modifierPostString += 'url(assets/Editions.png) -142px 0, ';
  }
  else if(state.modifiers.polychrome) {
    modifierClass = ' polychrome';
    modifierPostString += 'url(assets/Editions.png) -213px 0, ';
  }
  else if(state.modifiers.disabled) {
    modifierPostString += 'url(assets/Editions.png) 71px 0, ';
  }
}

function toggleCardModifier(name) {
  if(('gold stone increment mult wild chance glass steel'.indexOf(name) >= 0) && !state.modifiers[name]) {
    state.modifiers.stone = false;
    state.modifiers.increment = false;
    state.modifiers.mult = false;
    state.modifiers.wild = false;
    state.modifiers.chance = false;
    state.modifiers.glass = false;
    state.modifiers.steel = false;
    state.modifiers.gold = false;
  }

  if(('foil holographic polychrome disabled'.indexOf(name) >= 0) && !state.modifiers[name]) {
    state.modifiers.foil = false;
    state.modifiers.holographic = false;
    state.modifiers.polychrome = false;
    state.modifiers.disabled = false;
  }
  state.modifiers[name] = !state.modifiers[name];

  setModifierString();

  redrawCards();
}

const cardsDiv = document.getElementById('cards');
const jcardsDiv = document.getElementById('jokers');

state.highContrast = window.localStorage.hc === '1';
if(state.highContrast) {
  highContrastDiv.innerText = 'X';
}

function cardString(i, j, hc = 0) {
  if(state.modifiers.stone) {
    return `${modifierClass}" style="background: ` +
    `${modifierPostString}${modifierString.slice(2)}"`;
  }
  else {
    return `${modifierClass}" style="background: ` +
    `${modifierPostString}url(assets/8BitDeck${(hc === 2 || (hc === 0 && state.highContrast))?'_opt2':''}.png) ` +
    `-${71*j}px -${95*i}px${modifierString}"`;
  }
}

function redrawCards() {
  let txt = '';
  for(let i = 0; i < 4; i++) {
    txt += '<div>';
    for(let j = 0; j < 13; j++) {
      txt += `<div class="tooltip"><div class="playingCard${cardString((i+3) % 4, j)} onclick="addCard(${i}, ${j})" onmousemove = 'hoverCard(event)' onmouseout = 'noHoverCard(event)'></div></div>`;
    }
    txt += '</div>';
  }
  cardsDiv.innerHTML = txt;
}

function toggleContrast() {
    state.highContrast = !state.highContrast;
    window.localStorage.setItem('hc', state.highContrast?1:0);
    if(state.highContrast) {
      highContrastDiv.innerText = 'X';
    }
    else {
      highContrastDiv.innerHTML = '&nbsp;';
    }

    redrawCards();
    redrawPlayfieldHTML();
}

document.getElementById('highContrastBtn').addEventListener('click', toggleContrast);

const jokerTemplateKeys = [
  "state",
  "hands",
  "rankNames",
  "suitNames",
  "rarityNames",
  "endc",
  "multc",
  "prodc",
  "chipc",
  "numc",
  "moneyc",
  "probc",
  "shadowc",
  "diamondc",
  "heartc",
  "spadec",
  "clubc",
  "diamondsc",
  "heartsc",
  "spadesc",
  "clubsc",
  "spectralc",
  "planetc",
  "tarotc",
  "celestialc",
  "negativec",
  "commonc",
  "roomc"
];

const jokerTemplateValues = [
  state,
  hands,
  rankNames,
  suitNames,
  rarityNames,
  endc,
  multc,
  prodc,
  chipc,
  numc,
  moneyc,
  probc,
  shadowc,
  diamondc,
  heartc,
  spadec,
  clubc,
  diamondsc,
  heartsc,
  spadesc,
  clubsc,
  spectralc,
  planetc,
  tarotc,
  celestialc,
  negativec,
  commonc,
  roomc
];

function renderJokerText(template) {
  try {
    return Function(...jokerTemplateKeys, `return \`${template}\`;`)(...jokerTemplateValues);
  }
  catch (err) {
    console.error('Failed to render joker text', err);
    return 'WIP';
  }
}

function jokerString(i, j, modifiers) {
  let jmodifierClass = '';

  let jmodifierString = 'url(assets/Jokers.png) 0px -855px, ';
  let jmodifierPostString = '';

  if(modifiers.foil) {
    jmodifierPostString = 'url(assets/Editions.png) -71px 0, ';
  }
  else if(modifiers.holographic) {
    jmodifierPostString = 'url(assets/Editions.png) -142px 0, ';
  }
  else if(modifiers.polychrome) {
    jmodifierClass = ' polychrome';
    jmodifierPostString = 'url(assets/Editions.png) -213px 0, ';
  }
  else if(modifiers.disabled) {
    jmodifierPostString = 'url(assets/Editions.png) 71px 0, ';
  }
  else {
    jmodifierPostString = '';
  }

  switch(`${i},${j}`) {
    case '8,3': jmodifierString = `url(assets/Jokers.png) -${71*3}px -${95*9}px, `; break;
    case '8,4': jmodifierString = `url(assets/Jokers.png) -${71*4}px -${95*9}px, `; break;
    case '8,5': jmodifierString = `url(assets/Jokers.png) -${71*5}px -${95*9}px, `; break;
    case '8,6': jmodifierString = `url(assets/Jokers.png) -${71*6}px -${95*9}px, `; break;
    case '8,7': jmodifierString = `url(assets/Jokers.png) -${71*7}px -${95*9}px, `; break;
    case '12,4': jmodifierString = `url(assets/Jokers.png) -${71*2}px -${95*9}px, `; break;
  }
  return `${jmodifierClass}" style="mask-position:  -${71*j}px -${95*i}px; background: ${jmodifierPostString}${jmodifierString}url(assets/Jokers.png) -${71*j}px -${95*i}px"`;
}

function jredrawCards() {
  let txt = '<div>';
  let count = 0;
  for(let i = 0; i < 16; i++) {
    if(i === 9) {i++;}
    for(let j = 0; j < 10; j++) {
      const title = (jokerTexts.length > i && jokerTexts[i].length > j) ? jokerTexts[i][j][0] : 'WIP';
      const description = (jokerTexts.length > i && jokerTexts[i].length > j) ? renderJokerText(jokerTexts[i][j][1]) : 'WIP';
      if(title.toLowerCase().indexOf(state.searchVal.toLowerCase()) >= 0 || description.replace(/\<[^\>]+\>/g,'').toLowerCase().indexOf(state.searchVal.toLowerCase()) >= 0) {
        txt += `<div class='tooltip'><div class="jokerCard${jokerString(i, j, state.jmodifiers)} onclick="addJoker(${i}, ${j})" onmousemove = 'hoverCard(event)' onmouseout = 'noHoverCard(event)'></div><span class='tooltiptext'>` +
        `<div class='title'>${title}</div><br style="display: none">` +
        `<div class='desc'><span class='descContent'>${description}</span></span>` +
        `</div></div>`;
        count++;
        if(count >= 10) {
          count = 0;
          txt += '</div><div>';
        }
      }
    }
  }
  txt += '</div>';
  jcardsDiv.innerHTML = txt;
}

redrawCards();
jredrawCards();

const jokerAreaDiv = document.getElementById('jokerArea');
const bestPlayDiv = document.getElementById('bestPlay');
const cardsInHandDiv = document.getElementById('cardsInHand');

const jokerLimitDiv = document.getElementById('jokerLimit');
const handLimitDiv = document.getElementById('handLimit');

state.playfieldCards = {};

function updateTooltips() {
  const previousJokerValue = state.jokerValue;
  for(let joker in state.playfieldJokers) {
    let i = state.playfieldJokers[joker].type[0];
    let j = state.playfieldJokers[joker].type[1];
    state.jokerValue = state.playfieldJokers[joker].value;
    state.playfieldJokers[joker].tooltip = (jokerTexts.length > i && jokerTexts[i].length > j) ? [jokerTexts[i][j][0], renderJokerText(jokerTexts[i][j][1])] : ['WIP', 'WIP'];
  }
  state.jokerValue = previousJokerValue;
}

function addJoker(i, j, sell = false) {
  markJokersDirty();
  for(let k = 0; k < jokerCount; k++) {
    let id = 'j'+(Math.random()+'').slice(2);
    while(state.playfieldJokers.hasOwnProperty(id)) {
      id = 'j'+(Math.random()+'').slice(2);
    }

    state.playfieldJokers[id] = {
      id,
      type: [i, j],
      modifiers: {...state.jmodifiers},
      value: state.jokerValue,
      sell: sell !== false ? sell : Math.floor((jokerPrice[i][j] + ((state.jmodifiers.foil || state.jmodifiers.holographic || state.jmodifiers.polychrome) ? 1 : 0)) / 2),
      string: jokerString(i, j, state.jmodifiers),
      tooltip: (jokerTexts.length > i && jokerTexts[i].length > j) ? [jokerTexts[i][j][0], renderJokerText(jokerTexts[i][j][1])] : ['WIP', 'WIP']
    };
  }

  jokerLimitDiv.innerText = Object.keys(state.playfieldJokers).length;

  updateTooltips();
  redrawPlayfield();
}

function removeJoker(id) {
  markJokersDirty();
  delete state.playfieldJokers[id];

  jokerLimitDiv.innerText = Object.keys(state.playfieldJokers).length;

  updateTooltips();
  redrawPlayfield();

  changeTab(state.revertToTab)();
}

function addCard(i, j) {
  markCardsDirty();
  for(let k = 0; k < cardCount; k++) {
    let id = ((j === 10 && !state.modifiers.stone) ? (!state.modifiers.steel ? '993' : '992') : '') + (''+j).padStart(2, 0)+(4-i)+Object.keys(state.modifiers).map(a=>state.modifiers[a]?'1':'0').join('');
    while(state.playfieldCards.hasOwnProperty(id)) {
      id += '#';
    }

    state.playfieldCards[id] = {
      id,
      type: [(i + 3) % 4, j],
      modifiers: {...state.modifiers},
      string: cardString((i + 3) % 4, j, 1),
      HCString: cardString((i + 3) % 4, j, 2),
    };
  }

  handLimitDiv.innerText = Object.keys(state.playfieldCards).length;

  redrawPlayfield();
}

function removeCard(id) {
  markCardsDirty();
  if(state.bestHand.indexOf(id) >= 0) {
    state.bestHand.splice(state.bestHand.indexOf(id), 1);
  }

  delete state.playfieldCards[id];

  handLimitDiv.innerText = Object.keys(state.playfieldCards).length;

  redrawPlayfield();
}

function redrawPlayfield() {
  calculator();
}

function redrawPlayfieldHTML() {
  compileHand();

  let txt = '';
  let ignoreCard = -1;
  for(let id of state.bestJokers) {
    txt += `<div class='tooltip'><div id="${id}" class="jokerCard${state.playfieldJokers[id].string} ` +
    `draggable="true" data-joker-id="${id}" onclick="modifyJoker('${id}')" onmousemove = 'hoverCard(event)' onmouseout = 'noHoverCard(event)'></div>` +
    `<div class="removeJoker" onclick="removeJoker('${id}')">X</div>` +
    `<span class='tooltiptext'>` +
    `<span class='title'>${state.playfieldJokers[id].tooltip[0]}</span>` +
    `<span class='desc'><span class='descContent'>${state.playfieldJokers[id].tooltip[1]}</span></span>` +
    `</span>` +
    `<div style="position: absolute; top: 100%; width: 100%;">` +
    `<div class="positionButtons">` +
    `<div class="lvlBtn" onclick="moveJokerLeft('${id}')">&lt;</div>` +
    `<div class="lvlBtn" onclick="moveJokerRight('${id}')">&gt;</div>` +
    `</div>` +
    `</div>` +
    `</div>`;
  }
  jokerAreaDiv.innerHTML = txt;

  txt = '';
  for(let id of state.bestHand) {
    txt += `<div class="tooltip"><div id="p${id}" ` +
    `class="playfieldCard${state.highContrast ? state.playfieldCards[id].HCString : state.playfieldCards[id].string} ` +
    `draggable="true" data-card-id="${id}" onclick="removeCard('${id}')" onmousemove = 'hoverCard(event)' onmouseout = 'noHoverCard(event)'></div>` +
    `<div style="position: absolute; top: 100%; width: 100%;">` +
    `<div class="positionButtons">` +
    `<div class="lvlBtn" onclick="moveHandCardLeft('${id}')">&lt;</div>` +
    `<div class="lvlBtn" onclick="moveHandCardDown('${id}')">v</div>` +
    `<div class="lvlBtn" onclick="moveHandCardRight('${id}')">&gt;</div>` +
    `</div></div>` +
    `</div>`;
  }
  bestPlayDiv.innerHTML = txt;

  txt = '';

  let lowestCards = [];

  for(let id of Object.keys(state.playfieldCards).sort().reverse()) {
    if(state.bestHand.indexOf(id) >= 0) continue;
    if(id.indexOf('99') !== 0) continue;
    txt += `<div class="tooltip"><div id="${id}" class="playfieldCard${state.highContrast ? state.playfieldCards[id].HCString : state.playfieldCards[id].string} onclick="removeCard('${id}')" onmousemove = 'hoverCard(event)' onmouseout = 'noHoverCard(event)'></div>` +
    `<div style="position: absolute; top: 100%; width: 100%;">` +
    `<div class="positionButtons">` +
    `<div class="lvlBtn" onclick="moveCardUp('${id}')">^</div>` +
    `</div></div>` +
    `</div>`;
  }

  // if Raised Fist, move the lowest cards to the left
  if(Object.keys(state.playfieldJokers).reduce((a,b) => a || (state.playfieldJokers[b].type[0] === 2 && state.playfieldJokers[b].type[1] === 8 && !state.playfieldJokers[b].modifiers.disabled), false)) {
    let lowest = 100;
    let isQueen = true;
    let type = 0;
    for(let card in state.playfieldCards) {
      if(!state.playfieldCards[card].modifiers.stone && state.bestHand.indexOf(card) < 0) {
        if(lowest > cardValues[state.playfieldCards[card].type[1]] + (state.playfieldCards[card].type[1] === QUEEN ? 10 : 0)) {
          isQueen = state.playfieldCards[card].type[1] === QUEEN;
          lowest = cardValues[state.playfieldCards[card].type[1]] + (isQueen ? 10 : 0);
          lowestCards = [card];
          type = state.playfieldCards[card].type[1];
        }
        else if(lowest === cardValues[state.playfieldCards[card].type[1]]) {
          lowestCards.push(card);
        }
      }
    }

    let index = 0;
    let highScore = 0;
    for(let i = 0; i < lowestCards.length; i++) {
      const card = lowestCards[i];
      if(!state.playfieldCards[card].modifiers.disabled) {
        let thisScore = 1;
        if(state.playfieldCards[card].modifiers.steel) {
          thisScore += 2;
        }
        if(state.playfieldCards[card].modifiers.double) {
          thisScore += 4;
        }
        if(thisScore > highScore) {
          highScore = thisScore;
          index = i;
        }
      }
    }

    ignoreCard = -1;

    // only add cards if there is a valid lowest card
    if(lowest > 0 && lowest < 100 && !isQueen) {
      ignoreCard = lowestCards[index];

      for(let id of Object.keys(state.playfieldCards).sort().reverse()) {
        if(lowestCards.indexOf(id) < 0) continue;
        if(id === ignoreCard) continue;
        if(id.indexOf('99') === 0) continue;
        txt += `<div class="tooltip"><div id="${id}" class="playfieldCard${state.highContrast ? state.playfieldCards[id].HCString : state.playfieldCards[id].string} onclick="removeCard('${id}')" onmousemove = 'hoverCard(event)' onmouseout = 'noHoverCard(event)'></div>` +
        `<div style="position: absolute; top: 100%; width: 100%;">` +
        `<div class="positionButtons">` +
        `<div class="lvlBtn" onclick="moveCardUp('${id}')">^</div>` +
        `</div></div>` +
        `</div>`;
      }

      txt += `<div class="tooltip"><div id="${ignoreCard}" class="playfieldCard${state.highContrast ? state.playfieldCards[ignoreCard].HCString : state.playfieldCards[ignoreCard].string} onclick="removeCard('${ignoreCard}')" onmousemove = 'hoverCard(event)' onmouseout = 'noHoverCard(event)'></div>` +
      `<div style="position: absolute; top: 100%; width: 100%;">` +
      `<div class="positionButtons">` +
      `<div class="lvlBtn" onclick="moveCardUp('${ignoreCard}')">^</div>` +
      `</div></div>` +
      `</div>`;
    }
    //console.log(txt);
  }

  for(let id of Object.keys(state.playfieldCards).sort().reverse()) {
    if(state.bestHand.indexOf(id) >= 0) continue;
    if(lowestCards.indexOf(id) >= 0) continue;
    if(id.indexOf('99') === 0) continue;
    txt += `<div class="tooltip"><div id="${id}" class="playfieldCard${state.highContrast ? state.playfieldCards[id].HCString : state.playfieldCards[id].string} onclick="removeCard('${id}')" onmousemove = 'hoverCard(event)' onmouseout = 'noHoverCard(event)'></div>` +
    `<div style="position: absolute; top: 100%; width: 100%;">` +
    `<div class="positionButtons">` +
    `<div class="lvlBtn" onclick="moveCardUp('${id}')">^</div>` +
    `</div></div>` +
    `</div>`;
  }
  cardsInHandDiv.innerHTML = txt;
}

function moveJokerLeft(id) {
  markJokersDirty();
  if(state.optimizeJokers) toggleJoker();
  const index = state.bestJokers.indexOf(id);
  if(index > 0) {
    state.bestJokers.splice(index, 1);
    state.bestJokers.splice(index - 1, 0, id);
  }
  let newPlayfield = {};
  for(const joker of state.bestJokers) {
    newPlayfield[joker] = state.playfieldJokers[joker];
  }
  state.playfieldJokers = newPlayfield;
  redrawPlayfield();
}

function moveJokerRight(id) {
  markJokersDirty();
  let index = state.bestJokers.indexOf(id);
  if(index < state.bestJokers.length) {
    state.bestJokers.splice(index, 1);
    state.bestJokers.splice(index + 1, 0, id);
  }
  let newPlayfield = {};
  for(let i = 0; i < state.bestJokers.length; i++) {
    let joker = state.bestJokers[i];
    newPlayfield[joker] = state.playfieldJokers[joker];
  }
  state.playfieldJokers = newPlayfield;

  if(state.optimizeJokers) {
    toggleJoker();
  }
  else {
    redrawPlayfield();
  }
}

function moveHandCardLeft(id) {
  markCardsDirty();
  if(state.optimizeCards) toggleCard();
  let index = state.bestHand.indexOf(id);
  if(index > 0) {
    state.bestHand.splice(index, 1);
    state.bestHand.splice(index - 1, 0, id);
  }
  redrawPlayfield();
}
function moveHandCardRight(id) {
  markCardsDirty();
  if(state.optimizeCards) toggleCard();
  let index = state.bestHand.indexOf(id);
  if(index < state.bestHand.length) {
    state.bestHand.splice(index, 1);
    state.bestHand.splice(index + 1, 0, id);
  }
  redrawPlayfield();
}

function moveHandCardDown(id) {
  markCardsDirty();
  if(state.optimizeCards) toggleCard();
  state.bestHand.splice(state.bestHand.indexOf(id), 1);
  redrawPlayfield();
}

function moveCardUp(id) {
  markCardsDirty();
  if(state.optimizeCards) toggleCard();
  if(state.bestHand.length < 5) {
    state.bestHand.push(id);
  }
  redrawPlayfield();
}

const searchDiv = document.getElementById('SearchVal');

function searchJoker() {
  state.searchVal = searchDiv.value;
  jredrawCards();
}

let modifyTab = changeTab(4);

function modifyJoker(id) {
  modifyTab();
  state.modifyingJoker = id;
  modifyingJokerValDiv.innerText = state.playfieldJokers[state.modifyingJoker].value;
  modifyingJokerSellValDiv.innerText = state.playfieldJokers[state.modifyingJoker].sell;

  const type = state.playfieldJokers[state.modifyingJoker].type;
  if(jokerTexts[type[0]][type[1]][2]) {
    modifyingJokerValueDiv.style.display = 'inline-block';
    modifyingJokerValTxt.innerText = jokerTexts[type[0]][type[1]][2];
  }
  else {
    modifyingJokerValueDiv.style.display = 'none';
  }

  updateModifyingJoker();
}

function updateModifyingJoker() {
  if(!state.playfieldJokers.hasOwnProperty(state.modifyingJoker)) return;

  modifyJokerDiv.innerHTML = `<div><div class='tooltip'><div data-scale='2' class="jokerCard${state.playfieldJokers[state.modifyingJoker].string} onmousemove = 'hoverCard(event)' onmouseout = 'noHoverCard(event)'></div>` +
  `<span class='tooltiptext'>` +
  `<span class='title'>${state.playfieldJokers[state.modifyingJoker].tooltip[0]}</span>` +
  `<span class='desc'><span class='descContent'>${state.playfieldJokers[state.modifyingJoker].tooltip[1]}</span></span>` +
  `</span>` +
  `</div></div>`;

}

function mjtoggleCardModifier(name) {
  if(!state.modifyingJoker) return;
  markJokersDirty();
  let joker = state.playfieldJokers[state.modifyingJoker];
  if(('foil holographic polychrome disabled'.indexOf(name) >= 0) && !joker.modifiers[name]) {
    joker.modifiers.foil = false;
    joker.modifiers.holographic = false;
    joker.modifiers.polychrome = false;
    joker.modifiers.disabled = false;
  }
  joker.modifiers[name] = !joker.modifiers[name];
  joker.string = jokerString(joker.type[0], joker.type[1], joker.modifiers);


  updateTooltips();
  redrawPlayfield();
  updateModifyingJoker();
}

function incrementModifyJokerValue(inc) {
  if(!state.modifyingJoker) return;
  markJokersDirty();
  let joker = state.playfieldJokers[state.modifyingJoker];
  joker.value += inc;
  if(inc === 0) {
    joker.value = 0;
  }
  modifyingJokerValDiv.innerText = joker.value;

  let tmp = state.jokerValue;
  state.jokerValue = joker.value;
  joker.tooltip[1] = (jokerTexts.length > joker.type[0] && jokerTexts[joker.type[0]].length > joker.type[1]) ? renderJokerText(jokerTexts[joker.type[0]][joker.type[1]][1]) : 'WIP'
  state.jokerValue = tmp;

  redrawPlayfield();
  updateModifyingJoker();
}

function setModifyJokerValue() {
  let joker = state.playfieldJokers[state.modifyingJoker];
  markJokersDirty();
  let willBlur = false;

  if(modifyingJokerValDiv.innerText.indexOf('\n') >= 0) {
    modifyingJokerValDiv.innerText = modifyingJokerValDiv.innerText.replace(/[\r\n]/g, '');
    willBlur = true;
  }

  if(!isNaN(modifyingJokerValDiv.innerText)) {
    joker.value = Math.round(modifyingJokerValDiv.innerText * 1);
  }
  else {
    joker.value = 0;
  }

  let tmp = state.jokerValue;
  state.jokerValue = joker.value;
  joker.tooltip[1] = (jokerTexts.length > joker.type[0] && jokerTexts[joker.type[0]].length > joker.type[1]) ? renderJokerText(jokerTexts[joker.type[0]][joker.type[1]][1]) : 'WIP'
  state.jokerValue = tmp;

  if(willBlur) modifyingJokerValDiv.blur();

  redrawPlayfield();
  updateModifyingJoker();
}

function incrementModifyJokerSellValue(inc) {
  if(!state.modifyingJoker) return;
  markJokersDirty();
  let joker = state.playfieldJokers[state.modifyingJoker];
  joker.sell += inc;
  if(inc === 0 || joker.sell < 0) {
    joker.sell = 0;
  }
  modifyingJokerSellValDiv.innerText = joker.sell;

  redrawPlayfield();
  updateModifyingJoker();
}

function setModifyJokerSellValue() {
  let joker = state.playfieldJokers[state.modifyingJoker];
  markJokersDirty();
  let willBlur = false;

  if(modifyingJokerSellValDiv.innerText.indexOf('\n') >= 0) {
    modifyingJokerSellValDiv.innerText = modifyingJokerSellValDiv.innerText.replace(/[\r\n]/g, '');
    willBlur = true;
  }

  if(!isNaN(modifyingJokerSellValDiv.innerText)) {
    joker.sell = Math.max(0, Math.round(modifyingJokerSellValDiv.innerText * 1));
  }
  else {
    joker.sell = 0;
  }

  if(willBlur) modifyingJokerSellValDiv.blur();

  redrawPlayfield();
  updateModifyingJoker();
}


function updateJokerValue(joker) {
  let tmp = state.jokerValue;
  state.jokerValue = joker.value;
  joker.string = jokerString(joker.type[0], joker.type[1], joker.modifiers);
  joker.tooltip[1] = (jokerTexts.length > joker.type[0] && jokerTexts[joker.type[0]].length > joker.type[1]) ? renderJokerText(jokerTexts[joker.type[0]][joker.type[1]][1]) : 'WIP';
  state.jokerValue = tmp;
}

function playHand() {
  markCardsDirty();
  for(let j = 0; j < state.bestJokers.length; j++) {
    const joker = state.playfieldJokers[state.bestJokers[j]];
    if(joker.modifiers.disabled) continue;
    switch(''+joker.type[0]+joker.type[1]) {
      case '24':
        // Loyalty Card
        if(joker.value === 0) {
          joker.value = 5;
        }
        else {
          joker.value--;
        }
        break;
      case '40':
        // Wee Joker
        if(state.bestHand.length === 4) {
          joker.value++;
        }
        break;
      case '61':
        // Ride the Bus
        joker.value = state.lastCompiledValues[j];
        break;
      case '103':
        // Runner
        if(state.lastTypeOfHand === 3 || state.lastTypeOfHand === 7) {
          joker.value++;
        }
        break;
      case '104':
        // Ice cream
        joker.value++;
        if(joker.value >= 20) {
          joker.modifiers.foil = false;
          joker.modifiers.holographic = false;
          joker.modifiers.polychrome = false;
          joker.modifiers.disabled = true;
        }
        break;
      case '107':
        // Blue Joker
        joker.value -= state.bestHand.length;
        break;
      case '112':
        // Green Joker
        joker.value++;
        break;
      case '119':
        // Square Joker
        if(state.bestHand.length === 4) {
          joker.value++;
        }
        break;
      case '122':
        // Vampire
        joker.value = state.lastCompiledValues[j];
        break;
      case '129':
        // Obelisk
        joker.value = state.lastCompiledValues[j] * 5 - 5;
        break;
      case '134':
        // Turtle Bean
        joker.value++;
        if(joker.value >= 5) {
          joker.modifiers.foil = false;
          joker.modifiers.holographic = false;
          joker.modifiers.polychrome = false;
          joker.modifiers.disabled = true;
        }
        break;
      case '151':
        // Popcorn
        joker.value++;
        if(joker.value >= 5) {
          joker.modifiers.foil = false;
          joker.modifiers.holographic = false;
          joker.modifiers.polychrome = false;
          joker.modifiers.disabled = true;
        }
        break;
      case '153':
        joker.value++;
        if(joker.value >= 10) {
          joker.modifiers.foil = false;
          joker.modifiers.holographic = false;
          joker.modifiers.polychrome = false;
          joker.modifiers.disabled = true;
        }
        break;
      case '154':
        // Spare Trousers
        joker.value += state.lastCompiledValues[j];
        break;
    }
    updateJokerValue(joker);
  }

  for(let c in state.playfieldCards) {
    if(state.bestHand.indexOf(c) >= 0) {
      delete state.playfieldCards[c];
    }
  }
  hands[state.lastTypeOfHand].playedThisRound = 1;
  handLevels.children[state.lastTypeOfHand].children[0].innerText = 'X';
  hands[state.lastTypeOfHand].played++;
  handLevels.children[state.lastTypeOfHand].children[1].children[0].innerText = hands[state.lastTypeOfHand].played;

  state.bestHand = [];

  redrawPlayfield();

  if(state.modifyingJoker) {
    modifyJoker(state.modifyingJoker);
  }
}

function clearHand() {
  markCardsDirty();
  state.playfieldCards = {};
  state.bestHand = [];

  handLimitDiv.innerText = Object.keys(state.playfieldCards).length;

  for(let i = 0; i < hands.length; i++) {
    hands[i].playedThisRound = 0;
    handLevels.children[i].children[0].innerHTML = '&nbsp;';
  }

  redrawPlayfield();
}

function resetHand() {
  window.location.replace('/');
}

function setupWheelHandlers() {
    function wheelHandler(e) {
        e.preventDefault(); // Prevent page scrolling

        if (this.onfocus) { // Apply logic similar to when user makes a change (namely affects Hands)
            this.onfocus.call(this);
        }

        let currentValue = parseInt(this.textContent) || 0;
        if (e.deltaY < 0) {
            currentValue++;
        } else {
            currentValue = Math.max(0, currentValue - 1);
        }
        this.textContent = currentValue;

        if (this.oninput) { // Trigger recalculations if they exist
            this.oninput.call(this);
        }

        if (this.onblur) { // Apply logic similar to when user makes a change (namely affects Hands)
            this.onblur.call(this); // Note: Important that this is triggered after `oninput`
        }
    }

    const spans = document.querySelectorAll('span.handLvl, span.handCount');
    spans.forEach(span => {
        span.addEventListener('wheel', wheelHandler);
    });
}

setupWheelHandlers();
updateOptimizeIndicators();
setupDragAndDrop();

export {
  addCard,
  addJoker,
  addLvlText,
  clearHand,
  incrementCardCount,
  incrementJokerCount,
  incrementJokerValue,
  incrementLevel,
  incrementModifyJokerSellValue,
  incrementModifyJokerValue,
  incrementPlanet,
  invertPlayedHands,
  jtoggleCardModifier,
  mjtoggleCardModifier,
  modifyJoker,
  moveCardUp,
  moveHandCardDown,
  moveHandCardLeft,
  moveHandCardRight,
  moveJokerLeft,
  moveJokerRight,
  playHand,
  redrawPlayfield,
  redrawPlayfieldHTML,
  removeCard,
  removeJoker,
  removeLvlText,
  resetHand,
  searchJoker,
  selectAll,
  setCardCount,
  setJokerCount,
  setJokerValue,
  setLevel,
  setModifierString,
  setModifyJokerSellValue,
  setModifyJokerValue,
  setPlanet,
  setPlayed,
  toggleCard,
  toggleCardModifier,
  copyRunAsJson,
  toggleJoker,
  setOptimizeMode,
  toggleObservatory,
  togglePlasma,
  toggleSpectral,
  toggleSettings,
  toggleTheEye,
  toggleTheFlint,
  togglePlayed,
  updateModifyingJoker,
  handLevels
};
