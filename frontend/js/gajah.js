const png = 'png/';
const petImage = document.querySelector('#pet-image');
const petWetOverlay = document.querySelector('#pet-wet-overlay');
const happyBar = document.querySelector('#happy-bar');
const hungryBar = document.querySelector('#hungry-bar');
const cleanBar = document.querySelector('#clean-bar');
const sleepBar = document.querySelector('#sleep-bar');
const happyValue = document.querySelector('#happy-value');
const hungryValue = document.querySelector('#hungry-value');
const cleanValue = document.querySelector('#clean-value');
const sleepValue = document.querySelector('#sleep-value');
const moodChip = document.querySelector('#mood-chip');
const statusNote = document.querySelector('#status-note');
const treatBalance = document.querySelector('#treat-balance');
const accessoryOverlay = document.querySelector('#accessory-overlay');
const toolOverlay = document.querySelector('#tool-overlay');
const modal = document.querySelector('#item-modal');
const itemGrid = document.querySelector('#item-grid');
const modalTitle = document.querySelector('#modal-title');
const modalFeedback = document.querySelector('#modal-feedback');
const toast = document.querySelector('#toast');
const roomStage = document.querySelector('#room-stage');
const sleepMask = document.querySelector('#sleep-mask');
const sleepMaskOverlay = document.querySelector('#sleep-mask-overlay');
const restLamp = document.querySelector('#rest-lamp');
const sleepRow = document.querySelector('#sleep-row');
// Satukan status dan food store ke dalam kartu Gajah.
roomStage.append(document.querySelector('.pet-controls > .status-panel'));
roomStage.append(document.querySelector('#food-panel'));
roomStage.append(document.querySelector('#accessory-panel'));
roomStage.append(document.querySelector('.pet-controls > .bath-panel'));
const roomName = document.querySelector('#room-name');
const roomNumber = document.querySelector('#room-number');
const roomProps = document.querySelector('#room-props');
const showerToggle = document.querySelector('#shower-toggle');
const showerWater = document.querySelector('#shower-water');
const soapItem = document.querySelector('#soap-item');
let currentRoom = 0;
const rooms = [
  { name: 'Kitchen', number: '01', scene: 'room-kitchen', props: 'kitchen-props' },
  { name: 'Restroom', number: '02', scene: 'room-restroom', props: 'restroom-props' },
  { name: 'Bathroom', number: '03', scene: 'room-bathroom', props: 'bathroom-props' },
  { name: 'Rest Room', number: '04', scene: 'room-rest', props: 'rest-props' }
];

function setRoom(index) {
  currentRoom = (index + rooms.length) % rooms.length;
  const room = rooms[currentRoom];
  roomStage.classList.remove(...rooms.map(item => item.scene));
  roomStage.classList.remove('pet-at-tub', 'pet-near-shower', 'pet-in-bed', 'pet-sleeping', 'pet-masked');
  sleepMask.hidden = false;
  sleepMask.classList.remove('dragging');
  sleepMask.style.left = '';
  sleepMask.style.top = '';
  sleepMask.style.right = '';
  sleepMask.style.bottom = '';
  restLamp.hidden = room.name !== 'Rest Room';
  restLamp.classList.remove('lamp-off');
  restLamp.classList.add('lamp-on');
  restLamp.setAttribute('aria-pressed', 'true');
  restLamp.setAttribute('aria-label', 'Matikan lampu');
  roomStage.classList.remove('lamp-off');
  roomStage.classList.add(room.scene);
  roomName.textContent = room.name;
  roomNumber.textContent = room.number;
  roomProps.className = `room-props ${room.props}`;
  sleepRow.hidden = room.name !== 'Rest Room';
  showerToggle.hidden = room.name !== 'Bathroom';
  soapItem.hidden = room.name !== 'Bathroom';
  roomStage.classList.remove('shower-on');
  showerWater.hidden = true;
  showerToggle.setAttribute('aria-pressed', 'false');
  showerToggle.setAttribute('aria-label', 'Nyalakan shower');
  showerToggle.textContent = 'OFF';
  moodChip.textContent = 'FEELING GOOD ✳';
  document.querySelectorAll('.room-panel').forEach(panel => {
    panel.hidden = panel.dataset.room !== room.name.toLowerCase();
  });
}

document.querySelector('#room-next').addEventListener('click', () => setRoom(currentRoom + 1));
document.querySelector('#room-prev').addEventListener('click', () => setRoom(currentRoom - 1));
setRoom(currentRoom);

restLamp.addEventListener('click', () => {
  const on = restLamp.getAttribute('aria-pressed') !== 'true';
  restLamp.setAttribute('aria-pressed', String(on));
  restLamp.setAttribute('aria-label', on ? 'Matikan lampu' : 'Nyalakan lampu');
  restLamp.classList.toggle('lamp-on', on);
  restLamp.classList.toggle('lamp-off', !on);
  roomStage.classList.toggle('lamp-off', !on);
  document.querySelector('#pet-hint').textContent = on ? 'Lampu kamar dinyalakan.' : 'Lampu kamar dimatikan. Gajah siap tidur.';
});

showerToggle.addEventListener('click', () => {
  const isRunning = showerToggle.getAttribute('aria-pressed') !== 'true';
  showerToggle.setAttribute('aria-pressed', String(isRunning));
  showerToggle.setAttribute('aria-label', isRunning ? 'Matikan shower' : 'Nyalakan shower');
  showerToggle.textContent = isRunning ? 'ON' : 'OFF';
  roomStage.classList.toggle('shower-on', isRunning);
  showerWater.hidden = !isRunning;
  if (isRunning) {
    petTap.classList.add('is-wet');
    stats.clean = Math.min(100, stats.clean + 15);
    updateStatus();
    clearTimeout(foamTimeout);
    petTap.classList.remove('soap-foamed');
    soapFoam.replaceChildren();
    soapFoam.hidden = true;
  }
  document.querySelector('#pet-hint').textContent = isRunning
    ? 'Air shower mengalir deras ke Gajah!'
    : 'Gajah basah kuyup! Seret handuk untuk mengeringkannya.';
});

const itemData = {
  hair: [
    { name: 'Long Hair', price: 0, image: 'long gajah.png' },
    { name: 'Curly Hair', price: 8, image: 'curly gajah.png' },
    { name: 'Short Hair', price: 8, image: 'short gajah.png' }
  ],
  accessories: [
    { name: 'Scarf', price: 5, image: 'syal gajah.png' },
    { name: 'Hat', price: 0, image: 'hat gajah.png' },
    { name: 'Necklace', price: 5, image: 'kalung gajah.png' }
  ],
  playTools: [
    { name: 'Racket', price: 5, image: 'racket.png' },
    { name: 'Basket', price: 5, image: 'basket.png' },
    { name: 'Fishing Gear', price: 5, image: 'pancingan.png' }
  ]
};

const categoryLabels = { hair: 'Hair', accessories: 'Accessories', playTools: 'Play tools' };
const readJson = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
  catch { return fallback; }
};
let treats = Number(localStorage.getItem('petcoin-treats') || 0);
let stats = { happy: 50, hungry: 50, clean: 50, sleep: 50, ...readJson('petcoin-gajah-stats', {}) };
if (!localStorage.getItem('petcoin-gajah-stats-v2')) {
  stats = { happy: 50, hungry: 50, clean: 50, sleep: 50 };
  localStorage.setItem('petcoin-gajah-stats-v2', '1');
}
let inventory = readJson('petcoin-gajah-items', { hair: [], accessories: [], playTools: [] });
let equipped = readJson('petcoin-gajah-equipped', {});
let emotionOverride = '';
let emotionTimeout;
let toastTimeout;

function persistStats() {
  localStorage.setItem('petcoin-gajah-stats', JSON.stringify(stats));
}

function updateTreats() {
  treats = Number(localStorage.getItem('petcoin-treats') || 0);
  treatBalance.textContent = treats;
}

function itemFor(type, name) {
  return (itemData[type] || []).find(item => item.name === name);
}

function currentMood() {
  if (stats.happy <= 20 || stats.hungry <= 20) return 'sad';
  return emotionOverride || 'normal';
}

function renderPet() {
  const mood = currentMood();
  const hair = itemFor('hair', equipped.hair);
  let imageName = 'gajah 1.png';
  if (hair) {
    imageName = hair.image;
    if (mood === 'happy') imageName = hair.image.replace('.png', ' seneng.png');
    if (mood === 'sad') imageName = hair.image.replace('.png', ' sedih.png');
  } else if (mood === 'happy') imageName = 'gajah seneng.png';
  else if (mood === 'sad') imageName = 'gajah sedih.png';

  petImage.src = png + encodeURIComponent(imageName).replaceAll('%2F', '/');
  const petMask = `url("${petImage.src}")`;
  petWetOverlay.style.maskImage = petMask;
  petWetOverlay.style.webkitMaskImage = petMask;
  petImage.alt = mood === 'sad' ? 'Gajah sedang sedih' : mood === 'happy' ? 'Gajah senang' : 'Gajah';
  const accessory = itemFor('accessories', equipped.accessories);
  const tool = itemFor('playTools', equipped.playTools);
  accessoryOverlay.src = accessory ? png + encodeURIComponent(accessory.image) : '';
  toolOverlay.src = tool ? png + encodeURIComponent(tool.image) : '';
  accessoryOverlay.hidden = !accessory;
  toolOverlay.hidden = !tool;
}

function updateStatus() {
  stats.happy = Math.max(0, Math.min(100, Math.round(stats.happy)));
  stats.hungry = Math.max(0, Math.min(100, Math.round(stats.hungry)));
  happyBar.style.width = `${stats.happy}%`;
  hungryBar.style.width = `${stats.hungry}%`;
  hungryBar.classList.toggle('low', stats.hungry <= 25);
  stats.clean = Math.max(0, Math.min(100, Math.round(stats.clean)));
  stats.sleep = Math.max(0, Math.min(100, Math.round(stats.sleep)));
  cleanBar.style.width = `${stats.clean}%`;
  cleanBar.classList.toggle('low', stats.clean < 30);
  petTap.classList.toggle('is-dirty', stats.clean < 30);
  sleepBar.style.width = `${stats.sleep}%`;
  sleepBar.classList.toggle('low', stats.sleep <= 25);
  happyValue.textContent = `${stats.happy}%`;
  hungryValue.textContent = `${stats.hungry}%`;
  cleanValue.textContent = stats.clean < 30 ? `Kotor · ${stats.clean}%` : `${stats.clean}%`;
  sleepValue.textContent = `${stats.sleep}%`;

  const sad = stats.happy <= 20 || stats.hungry <= 20;
  moodChip.textContent = sad ? 'NEED SOME LOVE' : 'FEELING GOOD ✳';
  moodChip.classList.toggle('sad-chip', sad);
  statusNote.textContent = stats.sleep <= 25 ? 'Gajah mengantuk. Ajak ke Rest Room untuk tidur!' : stats.clean < 30 ? 'Gajah kotor. Mandikan supaya bersih lagi!' : stats.hungry <= 25 ? 'Gajah lapar. Kasih camilan supaya kenyang lagi!' : stats.happy <= 25 ? 'Gajah butuh perhatian. Elus atau ajak main!' : 'Gajah lagi happy. Ajak main atau kasih camilan!';
  persistStats();
  renderPet();
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove('show'), 1800);
}

function makeHearts() {
  const rect = petImage.getBoundingClientRect();
  for (let i = 0; i < 8; i++) {
    const heart = document.createElement('span');
    heart.className = 'heart';
    heart.textContent = '♥';
    heart.style.left = `${rect.left + Math.random() * rect.width}px`;
    heart.style.top = `${rect.top + Math.random() * rect.height * .65}px`;
    heart.style.animationDelay = `${Math.random() * .35}s`;
    document.body.append(heart);
    heart.addEventListener('animationend', () => heart.remove(), { once: true });
  }
}

function bouncePet(mood = 'happy') {
  clearTimeout(emotionTimeout);
  emotionOverride = mood;
  renderPet();
  const tap = document.querySelector('#pet-tap');
  tap.classList.remove('bounce');
  void tap.offsetWidth;
  tap.classList.add('bounce');
  makeHearts();
  emotionTimeout = setTimeout(() => {
    emotionOverride = '';
    tap.classList.remove('bounce');
    renderPet();
  }, 1900);
}

function splashShower() {
  const drops = document.querySelector('#shower-drops');
  const art = document.querySelector('#pet-art');
  drops.replaceChildren();
  for (let i = 0; i < 16; i++) {
    const drop = document.createElement('i');
    drop.style.left = `${18 + Math.random() * 64}%`;
    drop.style.animationDelay = `${Math.random() * .55}s`;
    drops.append(drop);
  }
  art.classList.add('showering');
  setTimeout(() => art.classList.remove('showering'), 1700);
}

const bathTowel = document.querySelector('#bath-towel');
let towelDragOffsetX = 0;
let towelDragOffsetY = 0;
function towelTouchesGajah() {
  const towelRect = bathTowel.getBoundingClientRect();
  const petRect = petTap.getBoundingClientRect();
  return towelRect.right > petRect.left + petRect.width * .18
    && towelRect.left < petRect.right - petRect.width * .18
    && towelRect.bottom > petRect.top + petRect.height * .12
    && towelRect.top < petRect.bottom - petRect.height * .08;
}
function dryGajahWithTowel() {
  petTap.classList.remove('is-wet');
  stats.happy = Math.min(100, stats.happy + 5);
  stats.clean = Math.min(100, stats.clean + 15);
  updateStatus();
  bouncePet('happy');
  document.querySelector('#pet-hint').textContent = 'Gajah sudah dikeringkan dengan handuk!';
}
bathTowel.addEventListener('pointerdown', event => {
  const rect = bathTowel.getBoundingClientRect();
  towelDragOffsetX = event.clientX - rect.left;
  towelDragOffsetY = event.clientY - rect.top;
  bathTowel.setPointerCapture(event.pointerId);
  bathTowel.classList.add('dragging');
  event.preventDefault();
});
bathTowel.addEventListener('pointermove', event => {
  if (!bathTowel.hasPointerCapture(event.pointerId)) return;
  bathTowel.style.left = `${event.clientX - towelDragOffsetX}px`;
  bathTowel.style.top = `${event.clientY - towelDragOffsetY}px`;
});
function finishTowelDrag(event) {
  if (!bathTowel.hasPointerCapture(event.pointerId)) return;
  bathTowel.releasePointerCapture(event.pointerId);
  const landedOnGajah = event.type === 'pointerup' && towelTouchesGajah();
  bathTowel.classList.remove('dragging');
  bathTowel.style.left = '';
  bathTowel.style.top = '';
  if (landedOnGajah) dryGajahWithTowel();
}
bathTowel.addEventListener('pointerup', finishTowelDrag);
bathTowel.addEventListener('pointercancel', finishTowelDrag);

const petFrame = document.querySelector('#pet-art');
const petTap = document.querySelector('#pet-tap');
let soapDragX = 0;
let soapDragY = 0;
let foamTimeout;
let lastFoamAt = 0;
const soapFoam = document.querySelector('#soap-foam');
function syncFoamPosition() {
  const frameRect = petFrame.getBoundingClientRect();
  const petRect = petTap.getBoundingClientRect();
  soapFoam.style.left = `${petRect.left - frameRect.left}px`;
  soapFoam.style.top = `${petRect.top - frameRect.top}px`;
  soapFoam.style.width = `${petRect.width}px`;
  soapFoam.style.height = `${petRect.height}px`;
}
soapItem.addEventListener('pointerdown', event => {
  const rect = soapItem.getBoundingClientRect();
  soapDragX = event.clientX - rect.left;
  soapDragY = event.clientY - rect.top;
  soapItem.setPointerCapture(event.pointerId);
  soapItem.classList.add('dragging');
  event.preventDefault();
});
function soapTouchesGajah() {
  const soapRect = soapItem.getBoundingClientRect();
  const petRect = petTap.getBoundingClientRect();
  const target = {
    left: petRect.left + petRect.width * .18,
    right: petRect.right - petRect.width * .18,
    top: petRect.top + petRect.height * .12,
    bottom: petRect.bottom - petRect.height * .08
  };
  return soapRect.right > target.left && soapRect.left < target.right
    && soapRect.bottom > target.top && soapRect.top < target.bottom;
}
function makePetFoamy() {
  syncFoamPosition();
  soapFoam.hidden = false;
  const now = Date.now();
  if (now - lastFoamAt < 90) return;
  lastFoamAt = now;
  const firstBubble = !petTap.classList.contains('soap-foamed');
  const bubblesToAdd = firstBubble ? 20 : 3;
  for (let i = 0; i < bubblesToAdd; i++) {
    const bubble = document.createElement('i');
    bubble.className = 'soap-bubble';
    const size = 13 + Math.random() * (firstBubble ? 22 : 17);
    bubble.style.width = `${size}px`;
    bubble.style.height = `${size}px`;
    bubble.style.left = `${Math.random() * Math.max(0, soapFoam.clientWidth - size)}px`;
    bubble.style.top = `${Math.random() * Math.max(0, soapFoam.clientHeight - size)}px`;
    bubble.style.animationDelay = `${Math.random() * -.5}s`;
    soapFoam.append(bubble);
  }
  while (soapFoam.children.length > 48) soapFoam.firstElementChild.remove();
  petTap.classList.add('soap-foamed');
  if (firstBubble) document.querySelector('#pet-hint').textContent = 'Gajah jadi penuh busa sabun!';
  clearTimeout(foamTimeout);
  function removeFoamWhenDry() {
    if (showerToggle.getAttribute('aria-pressed') === 'true') {
      foamTimeout = setTimeout(removeFoamWhenDry, 1000);
      return;
    }
    petTap.classList.remove('soap-foamed');
    soapFoam.replaceChildren();
    soapFoam.hidden = true;
  }
  foamTimeout = setTimeout(removeFoamWhenDry, 3200);
}
soapItem.addEventListener('pointermove', event => {
  if (!soapItem.hasPointerCapture(event.pointerId)) return;
  const frameRect = petFrame.getBoundingClientRect();
  const maxX = Math.max(0, petFrame.clientWidth - soapItem.offsetWidth);
  const maxY = Math.max(0, petFrame.clientHeight - soapItem.offsetHeight);
  const left = event.clientX - frameRect.left - soapDragX;
  const top = event.clientY - frameRect.top - soapDragY;
  soapItem.style.left = `${Math.min(maxX, Math.max(0, left))}px`;
  soapItem.style.top = `${Math.min(maxY, Math.max(0, top))}px`;
  if (soapTouchesGajah()) makePetFoamy();
});
function finishSoapDrag(event) {
  if (soapItem.hasPointerCapture(event.pointerId)) soapItem.releasePointerCapture(event.pointerId);
  soapItem.classList.remove('dragging');
  if (event.type === 'pointerup' && soapTouchesGajah()) makePetFoamy();
}
soapItem.addEventListener('pointerup', finishSoapDrag);
soapItem.addEventListener('pointercancel', finishSoapDrag);
let dragOffsetX = 0;
let dragOffsetY = 0;
let dragStartX = 0;
let dragStartY = 0;
let petWasDragged = false;

function centerPet() {
  petTap.style.left = `${Math.max(0, (petFrame.clientWidth - petTap.offsetWidth) / 2)}px`;
  petTap.style.top = `${Math.max(0, (petFrame.clientHeight - petTap.offsetHeight) / 2)}px`;
  if (!soapFoam.hidden) syncFoamPosition();
}

function keepPetInsideFrame() {
  const maxX = Math.max(0, petFrame.clientWidth - petTap.offsetWidth);
  const maxY = Math.max(0, petFrame.clientHeight - petTap.offsetHeight);
  petTap.style.left = `${Math.min(maxX, Math.max(0, parseFloat(petTap.style.left) || 0))}px`;
  petTap.style.top = `${Math.min(maxY, Math.max(0, parseFloat(petTap.style.top) || 0))}px`;
}

requestAnimationFrame(centerPet);
window.addEventListener('resize', keepPetInsideFrame);
petTap.addEventListener('pointerdown', event => {
  const petRect = petTap.getBoundingClientRect();
  dragOffsetX = event.clientX - petRect.left;
  dragOffsetY = event.clientY - petRect.top;
  dragStartX = event.clientX;
  dragStartY = event.clientY;
  petWasDragged = false;
  petTap.setPointerCapture(event.pointerId);
  petTap.classList.add('dragging');
});
petTap.addEventListener('pointermove', event => {
  if (!petTap.hasPointerCapture(event.pointerId)) return;
  const frameRect = petFrame.getBoundingClientRect();
  const maxX = Math.max(0, petFrame.clientWidth - petTap.offsetWidth);
  const maxY = Math.max(0, petFrame.clientHeight - petTap.offsetHeight);
  const left = event.clientX - frameRect.left - dragOffsetX;
  const top = event.clientY - frameRect.top - dragOffsetY;
  if (Math.hypot(event.clientX - dragStartX, event.clientY - dragStartY) > 4) {
    petWasDragged = true;
    roomStage.classList.remove('pet-at-tub', 'pet-near-shower', 'pet-in-bed', 'pet-sleeping');
    if (roomStage.classList.contains('pet-masked')) {
      roomStage.classList.remove('pet-masked');
      sleepMask.hidden = false;
      sleepMask.style.left = '';
      sleepMask.style.top = '';
      sleepMask.style.right = '';
      sleepMask.style.bottom = '';
    }
  }
  petTap.style.left = `${Math.min(maxX, Math.max(0, left))}px`;
  petTap.style.top = `${Math.min(maxY, Math.max(0, top))}px`;
  if (!soapFoam.hidden) syncFoamPosition();
});
function finishPetDrag(event) {
  if (petTap.hasPointerCapture(event.pointerId)) petTap.releasePointerCapture(event.pointerId);
  petTap.classList.remove('dragging');
  if (event.type !== 'pointerup') return;
  if (roomStage.classList.contains('room-rest')) {
    const bedRect = roomProps.querySelector('.rest-bed').getBoundingClientRect();
    const petRect = petTap.getBoundingClientRect();
    const centerX = petRect.left + petRect.width / 2;
    const feetY = petRect.top + petRect.height * .82;
    const onBed = centerX > bedRect.left - petRect.width * .18
      && centerX < bedRect.right + petRect.width * .18
      && feetY >= bedRect.top && feetY <= bedRect.bottom + 24;
    if (onBed) {
      roomStage.classList.add('pet-in-bed');
      roomStage.classList.remove('pet-sleeping');
      updateStatus();
      document.querySelector('#mood-chip').textContent = 'READY TO SLEEP Zzz';
      document.querySelector('#pet-hint').textContent = 'Gajah sudah siap bobo!';
    } else {
      document.querySelector('#pet-hint').textContent = 'Geser Gajah ke tempat tidur untuk bobo.';
    }
    return;
  }
  if (!roomStage.classList.contains('room-bathroom')) return;
  const showerRect = roomProps.querySelector('.room-shower').getBoundingClientRect();
  const petRect = petTap.getBoundingClientRect();
  const petCenterX = petRect.left + petRect.width / 2;
  const petCenterY = petRect.top + petRect.height / 2;
  const nearShower = petCenterX >= showerRect.left - 34 && petCenterX <= showerRect.right + 34
    && petCenterY >= showerRect.top - 34 && petCenterY <= showerRect.bottom + 20;
  const pastShowerEnd = petCenterY > showerRect.bottom + 20;
  if (nearShower) {
    roomStage.classList.add('pet-at-tub', 'pet-near-shower');
    document.querySelector('#pet-hint').textContent = 'Gajah sedang mandi di dekat shower!';
  } else {
    const bathRect = roomProps.querySelector('.room-bath').getBoundingClientRect();
    const feetX = petRect.left + petRect.width / 2;
    const feetY = petRect.top + petRect.height * .82;
    const inTub = feetX > bathRect.left - petRect.width * .22
      && feetX < bathRect.right + petRect.width * .22
      && feetY >= bathRect.top && feetY <= bathRect.bottom;
    if (inTub || pastShowerEnd) roomStage.classList.add('pet-at-tub');
  }
}
petTap.addEventListener('pointerup', finishPetDrag);
petTap.addEventListener('pointercancel', finishPetDrag);

let maskOffsetX = 0;
let maskOffsetY = 0;
sleepMask.addEventListener('pointerdown', event => {
  if (!roomStage.classList.contains('room-rest')) return;
  const rect = sleepMask.getBoundingClientRect();
  maskOffsetX = event.clientX - rect.left;
  maskOffsetY = event.clientY - rect.top;
  sleepMask.setPointerCapture(event.pointerId);
  sleepMask.classList.add('dragging');
  event.preventDefault();
});
sleepMask.addEventListener('pointermove', event => {
  if (!sleepMask.hasPointerCapture(event.pointerId)) return;
  const rect = petFrame.getBoundingClientRect();
  sleepMask.style.left = `${event.clientX - rect.left - maskOffsetX}px`;
  sleepMask.style.top = `${event.clientY - rect.top - maskOffsetY}px`;
  sleepMask.style.right = 'auto';
  sleepMask.style.bottom = 'auto';
});
sleepMask.addEventListener('pointerup', event => {
  if (sleepMask.hasPointerCapture(event.pointerId)) sleepMask.releasePointerCapture(event.pointerId);
  sleepMask.classList.remove('dragging');
  const maskRect = sleepMask.getBoundingClientRect();
  const petRect = petImage.getBoundingClientRect();
  const maskCenterX = maskRect.left + maskRect.width / 2;
  const maskCenterY = maskRect.top + maskRect.height / 2;
  const onFace = maskCenterX >= petRect.left + petRect.width * .2
    && maskCenterX <= petRect.right - petRect.width * .2
    && maskCenterY >= petRect.top + petRect.height * .08
    && maskCenterY <= petRect.top + petRect.height * .48;
  if (onFace) {
    const frameRect = petFrame.getBoundingClientRect();
    sleepMaskOverlay.style.left = `${petRect.left - frameRect.left + petRect.width * .5 - sleepMask.offsetWidth / 2}px`;
    sleepMaskOverlay.style.top = `${petRect.top - frameRect.top + petRect.height * .42 - sleepMask.offsetHeight / 2}px`;
    roomStage.classList.add('pet-masked');
    sleepMask.hidden = true;
    document.querySelector('#pet-hint').textContent = 'Penutup mata terpasang. Gajah siap bobo!';
    updateStatus();
  } else {
    sleepMask.style.left = '';
    sleepMask.style.top = '';
    sleepMask.style.right = '';
    sleepMask.style.bottom = '';
  }
});
sleepMask.addEventListener('pointercancel', () => sleepMask.classList.remove('dragging'));
function removeSleepMask() {
  roomStage.classList.remove('pet-masked');
  sleepMask.hidden = false;
  sleepMask.style.left = '';
  sleepMask.style.top = '';
  sleepMask.style.right = '';
  sleepMask.style.bottom = '';
  document.querySelector('#pet-hint').textContent = 'Penutup mata dilepas.';
  updateStatus();
}
sleepMaskOverlay.addEventListener('click', removeSleepMask);
sleepMaskOverlay.addEventListener('keydown', event => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    removeSleepMask();
  }
});

petTap.addEventListener('click', () => {
  if (petWasDragged) {
    petWasDragged = false;
    return;
  }
  if (roomStage.classList.contains('room-rest') && roomStage.classList.contains('pet-in-bed')) {
    roomStage.classList.remove('pet-in-bed', 'pet-sleeping');
    if (roomStage.classList.contains('pet-masked')) removeSleepMask();
    moodChip.textContent = 'FEELING GOOD ✳';
    document.querySelector('#pet-hint').textContent = 'Gajah sudah bangun!';
    updateStatus();
    return;
  }
  stats.happy = Math.min(100, stats.happy + 3);
  updateStatus();
  bouncePet('happy');
  document.querySelector('#pet-hint').textContent = 'Gajah suka banget dielus!';
});

document.querySelectorAll('.food-item').forEach(food => food.addEventListener('click', () => {
  if (stats.hungry >= 100) {
    showToast('Gajah sudah kenyang!');
    return;
  }
  const isFree = food.dataset.name === 'Apple';
  if (!isFree) {
    updateTreats();
    if (treats < 2) {
      showToast('Treat belum cukup. Main mini game dulu!');
      return;
    }
    treats -= 2;
    localStorage.setItem('petcoin-treats', String(treats));
    updateTreats();
  }
  stats.hungry = Math.min(100, stats.hungry + (isFree ? 1 : 8));
  updateStatus();
  bouncePet('happy');
  document.querySelector('#pet-hint').textContent = `${food.dataset.name} jadi camilan favorit Gajah!`;
}));

function renderCategory(type) {
  modalTitle.textContent = categoryLabels[type];
  modalFeedback.textContent = '';
  itemGrid.innerHTML = '';
  const normal = document.createElement('article');
  normal.className = 'item-card';
  normal.innerHTML = '<div class="normal-icon">✳</div><h3>Natural look</h3><p>Kembali ke tampilan awal</p><button class="item-action" type="button">Lepas item</button>';
  normal.querySelector('button').addEventListener('click', () => {
    delete equipped[type];
    localStorage.setItem('petcoin-gajah-equipped', JSON.stringify(equipped));
    renderPet();
    modalFeedback.textContent = 'Item dilepas.';
    renderCategory(type);
  });
  itemGrid.append(normal);

  itemData[type].forEach(item => {
    const owned = (inventory[type] || []).includes(item.name);
    const wearing = equipped[type] === item.name;
    const card = document.createElement('article');
    card.className = 'item-card';
    const image = document.createElement('img');
    image.src = png + encodeURIComponent(item.image);
    image.alt = item.name;
    const title = document.createElement('h3');
    title.textContent = item.name;
    const price = document.createElement('p');
    price.textContent = `${owned ? 'Owned' : item.price === 0 ? 'Gratis' : `🦴 ${item.price} treat`}${wearing ? ' · Dipakai' : ''}`;
    const action = document.createElement('button');
    action.type = 'button';
    action.className = `item-action${wearing ? ' equipped' : ''}`;
    action.disabled = wearing;
    action.textContent = wearing ? 'Sedang dipakai' : owned ? 'Pakai' : item.price === 0 ? 'Ambil & pakai' : 'Beli & pakai';
    action.addEventListener('click', () => {
      if (!owned) {
        updateTreats();
        if (treats < item.price) {
          modalFeedback.textContent = `Treat belum cukup untuk ${item.name}.`;
          return;
        }
        treats -= item.price;
        localStorage.setItem('petcoin-treats', String(treats));
        if (!inventory[type]) inventory[type] = [];
        inventory[type].push(item.name);
        localStorage.setItem('petcoin-gajah-items', JSON.stringify(inventory));
        updateTreats();
      }
      equipped[type] = item.name;
      localStorage.setItem('petcoin-gajah-equipped', JSON.stringify(equipped));
      renderPet();
      modalFeedback.textContent = `${item.name} sekarang dipakai Gajah!`;
      renderCategory(type);
    });
    card.append(image, title, price, action);
    itemGrid.append(card);
  });
}

document.querySelectorAll('[data-category]').forEach(button => button.addEventListener('click', () => {
  renderCategory(button.dataset.category);
  modal.hidden = false;
}));
document.querySelector('#modal-close').addEventListener('click', () => { modal.hidden = true; });
modal.addEventListener('click', event => { if (event.target === modal) modal.hidden = true; });
document.addEventListener('keydown', event => { if (event.key === 'Escape') modal.hidden = true; });

setInterval(() => {
  stats.hungry = Math.max(0, stats.hungry - (5 / 6));
  stats.happy = Math.max(0, stats.happy - (5 / 6));
  stats.clean = Math.max(0, stats.clean - (5 / 6));
  const sleeping = roomStage.classList.contains('room-rest')
    && roomStage.classList.contains('pet-in-bed')
    && roomStage.classList.contains('pet-masked');
  stats.sleep = Math.max(0, Math.min(100, stats.sleep + (sleeping ? (50 / 6) : -(5 / 6))));
  updateStatus();
}, 10000);

updateTreats();
updateStatus();
