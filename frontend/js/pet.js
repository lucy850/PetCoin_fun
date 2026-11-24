const pets = {
  Bear: { name: 'Bear', species: 'SPECIAL PET · BERUANG', normal: 'Bear 1.png', happy: 'bear love.png', sad: 'bear sad.png' },
  Cat: { name: 'Mochi', species: 'RARE PET · KUCING', normal: 'kucing123.png', happy: 'kucing senang.png', sad: 'kucing nangis.png' },
  Chicken: { name: 'Chicken', species: 'LEGENDARY PET · AYAM', normal: 'Ayam.png', happy: 'ayam love.png', sad: 'ayam sedih.png' },
  Rabbit: { name: 'Boba', species: 'EPIC PET · KELINCI', normal: 'kelinci.png', happy: 'kelinci love.png', sad: 'kelinci sedih.png' }
};
const png = 'png/';
const pet = pets[new URLSearchParams(location.search).get('pet')] || pets.Bear;
const species = new URLSearchParams(location.search).get('pet') || 'Bear';
const hairAssets = {
  Bear: [['Long Hair','long beruang.png','long beruang seneng.png','long beruang sedih.png'],['Curly Hair','curly beruang.png','curly beruang seneng.png','curly beruang sedih.png'],['Short Hair','short beruang.png','short beruang seneng.png','short beruang sedih.png']],
  Cat: [['Long Hair','panjang kucing.png','panjang kucing seneng.png','panjang kucing sedih.png'],['Curly Hair','curly kucing.png','curly kucing seneng.png','curly kucing sedih.png'],['Short Hair','pendek kucing.png','pendek kucing seneng.png','pendek kucing sedih.png']],
  Chicken: [['Long Hair','long ayam.png','long ayam seneng.png','long ayam sedih.png'],['Curly Hair','curly ayam.png','curly ayam seneng.png','curly ayam sedih.png'],['Short Hair','short ayam.png','short ayam seneng.png','short ayam sedih.png']],
  Rabbit: [['Long Hair','long kelinci.png','long kelinci senang.png','long kelinci nangis.png'],['Curly Hair','curly kelinci.png','curly kelinci senang.png','curly kelinci nangis.png'],['Short Hair','short kelinci.png','short kelinci senang.png','short kelinci nangis.png']]
};
const accessoryAssets = {
  Bear: ['syal beruang.png','hat beruang.png','kalung beruang.png'], Cat: ['syal kucing.png','topi kucing.png','kalung kucing.png'],
  Chicken: ['syal ayam.png','hat ayam.png','kalung ayam.png'], Rabbit: ['syal kelinci.png','hat kelinci.png','kalung kelinci.png']
};
const itemData = {
  hair: (hairAssets[species] || hairAssets.Bear).map(([name,image,happy,sad],index) => ({name,price:index===0?0:8,image,happy,sad})),
  accessories: (accessoryAssets[species] || accessoryAssets.Bear).map((image,index) => ({name:['Scarf','Hat','Necklace'][index],price:index===1?0:5,image})),
  playTools: [{name:'Racket',price:5,image:'racket.png'},{name:'Basket',price:5,image:'basket.png'},{name:'Fishing Gear',price:5,image:'pancingan.png'}]
};
const categoryLabels = {hair:'Hair',accessories:'Accessories',playTools:'Play tools'};
const petImage = document.querySelector('#pet-image');
const outfitOverlay = document.querySelector('#outfit-overlay');
const toolOverlay = document.createElement('img');
toolOverlay.className = 'pet-outfit';
toolOverlay.alt = 'Mainan yang dipakai';
toolOverlay.hidden = true;
outfitOverlay.after(toolOverlay);
const wardrobePanel = document.querySelector('#wardrobe-panel');
wardrobePanel.innerHTML = '<div class="panel-heading"><div><span class="eyebrow">DRESS UP & PLAY</span><h2>Accessories shop</h2></div><span class="panel-icon">✿</span></div><div class="accessory-buttons"><button class="neo-button" data-category="hair">Hair <span>↗</span></button><button class="neo-button pink-button" data-category="accessories">Accessories <span>↗</span></button><button class="neo-button blue-button" data-category="playTools">Play tools <span>↗</span></button></div>';
document.body.insertAdjacentHTML('beforeend','<div class="modal-backdrop" id="item-modal" hidden><section class="item-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-heading"><div><span class="eyebrow">MAKE IT YOURS</span><h2 id="modal-title">Accessories</h2></div><button id="modal-close" class="close-button" type="button" aria-label="Tutup">×</button></div><div class="item-grid" id="item-grid"></div><p class="modal-feedback" id="modal-feedback" aria-live="polite"></p></section></div>');
const modal = document.querySelector('#item-modal');
const itemGrid = document.querySelector('#item-grid');
const modalTitle = document.querySelector('#modal-title');
const modalFeedback = document.querySelector('#modal-feedback');
const happyBar = document.querySelector('#happy-bar');
const hungryBar = document.querySelector('#hungry-bar');
const happyValue = document.querySelector('#happy-value');
const hungryValue = document.querySelector('#hungry-value');
const moodChip = document.querySelector('#mood-chip');
const statusNote = document.querySelector('#status-note');
const hint = document.querySelector('#pet-hint');
const treatBalance = document.querySelector('#treat-balance');
const toast = document.querySelector('#toast');
const roomStage = document.querySelector('#room-stage');
const roomName = document.querySelector('#room-name');
const roomNumber = document.querySelector('#room-number');
const roomProps = document.querySelector('#room-props');
const showerDrops = document.querySelector('#shower-drops');
const petArt = document.querySelector('.pet-art');
const inventoryKey = `petcoin-${species.toLowerCase()}-items`;
const equippedKey = `petcoin-${species.toLowerCase()}-equipped`;
const readJson = (key,fallback) => { try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; } };
let inventory = readJson(inventoryKey,{hair:[],accessories:[],playTools:[]});
let equipped = readJson(equippedKey,{});
const legacyOutfitKey = `petcoin-${pet.name.toLowerCase()}-outfit`;
const legacyOutfit = localStorage.getItem(legacyOutfitKey);
if (legacyOutfit && !equipped.accessories) {
  const legacyName = legacyOutfit === 'scarf' ? 'Scarf' : legacyOutfit === 'hat' ? 'Hat' : '';
  if (legacyName) {
    equipped.accessories = legacyName;
    inventory.accessories ||= [];
    if (!inventory.accessories.includes(legacyName)) inventory.accessories.push(legacyName);
    localStorage.setItem(inventoryKey,JSON.stringify(inventory));
    localStorage.setItem(equippedKey,JSON.stringify(equipped));
  }
  localStorage.removeItem(legacyOutfitKey);
}
let currentRoom = 0;
const rooms = [
  { name: 'Kitchen', number: '01', scene: 'room-kitchen', props: 'kitchen-props' },
  { name: 'Restroom', number: '02', scene: 'room-restroom', props: 'restroom-props' },
  { name: 'Bathroom', number: '03', scene: 'room-bathroom', props: 'bathroom-props' }
];

function setRoom(index) {
  currentRoom = (index + rooms.length) % rooms.length;
  const room = rooms[currentRoom];
  roomStage.classList.remove(...rooms.map(item => item.scene));
  roomStage.classList.add(room.scene);
  roomName.textContent = room.name;
  roomNumber.textContent = room.number;
  roomProps.className = `room-props ${room.props}`;
  document.querySelectorAll('.room-panel').forEach(panel => {
    panel.hidden = panel.dataset.room !== room.name.toLowerCase();
  });
}

document.querySelector('#room-next').addEventListener('click', () => setRoom(currentRoom + 1));
document.querySelector('#room-prev').addEventListener('click', () => setRoom(currentRoom - 1));
setRoom(currentRoom);
const storageKey = `petcoin-${pet.name.toLowerCase()}-stats`;
let stats;
try { stats = JSON.parse(localStorage.getItem(storageKey) || '{"happy":100,"hungry":100}'); }
catch { stats = { happy: 100, hungry: 100 }; }
let happyMoment = false;
let happyTimer;
let toastTimer;

document.title = `${pet.name} — Pet Coin`;
document.querySelector('#pet-name').textContent = pet.name;
document.querySelector('#pet-species').textContent = pet.species;

function updateTreatBalance() {
  treatBalance.textContent = Number(localStorage.getItem('petcoin-treats') || 0);
}
function updatePetImage() {
  const mood = stats.happy <= 20 || stats.hungry <= 20 ? 'sad' : happyMoment ? 'happy' : 'normal';
  const hair = itemData.hair.find(item => item.name === equipped.hair);
  petImage.src = png + encodeURIComponent(hair ? (mood === 'happy' ? hair.happy : mood === 'sad' ? hair.sad : hair.image) : pet[mood]);
  petImage.alt = `${pet.name}${mood === 'sad' ? ' sedang sedih' : mood === 'happy' ? ' senang' : ''}`;
}

function petKeyName() {
  return species;
}
function itemFor(type,name) {
  return itemData[type].find(item => item.name === name);
}
function renderPet() {
  const accessory = itemFor('accessories',equipped.accessories);
  const tool = itemFor('playTools',equipped.playTools);
  outfitOverlay.src = accessory ? png + encodeURIComponent(accessory.image) : '';
  outfitOverlay.hidden = !accessory;
  toolOverlay.src = tool ? png + encodeURIComponent(tool.image) : '';
  toolOverlay.hidden = !tool;
  updatePetImage();
}
function renderCategory(type) {
  modalTitle.textContent = categoryLabels[type];
  modalFeedback.textContent = '';
  itemGrid.replaceChildren();
  const normal = document.createElement('article');
  normal.className = 'item-card';
  normal.innerHTML = '<div class="normal-preview">✳</div><h3>Natural look</h3><p>Gratis</p>';
  const normalButton = document.createElement('button');
  normalButton.type = 'button';
  normalButton.className = 'item-action';
  normalButton.textContent = equipped[type] ? 'Pakai tampilan asli' : 'Sedang dipakai';
  normalButton.disabled = !equipped[type];
  normalButton.addEventListener('click',() => {
    delete equipped[type];
    localStorage.setItem(equippedKey,JSON.stringify(equipped));
    renderPet(); renderCategory(type);
  });
  normal.append(normalButton); itemGrid.append(normal);
  itemData[type].forEach(item => {
    const owned = (inventory[type] || []).includes(item.name);
    const wearing = equipped[type] === item.name;
    const card = document.createElement('article'); card.className = 'item-card';
    const image = document.createElement('img'); image.src = png + encodeURIComponent(item.image); image.alt = item.name;
    const title = document.createElement('h3'); title.textContent = item.name;
    const price = document.createElement('p'); price.textContent = owned ? `Owned${wearing ? ' · Dipakai' : ''}` : item.price === 0 ? 'Gratis' : `🦴 ${item.price} treat`;
    const action = document.createElement('button'); action.type = 'button'; action.className = `item-action${wearing ? ' equipped' : ''}`; action.disabled = wearing;
    action.textContent = wearing ? 'Sedang dipakai' : owned ? 'Pakai' : item.price === 0 ? 'Ambil & pakai' : 'Beli & pakai';
    action.addEventListener('click',() => {
      if (!owned) {
        updateTreatBalance();
        let treats = Number(localStorage.getItem('petcoin-treats') || 0);
        if (treats < item.price) { modalFeedback.textContent = `Treat belum cukup untuk ${item.name}.`; return; }
        treats -= item.price; localStorage.setItem('petcoin-treats',String(treats));
        inventory[type] ||= []; inventory[type].push(item.name); localStorage.setItem(inventoryKey,JSON.stringify(inventory));
      }
      equipped[type] = item.name; localStorage.setItem(equippedKey,JSON.stringify(equipped));
      updateTreatBalance(); renderPet(); modalFeedback.textContent = `${item.name} sekarang dipakai ${pet.name}!`; renderCategory(type);
    });
    card.append(image,title,price,action); itemGrid.append(card);
  });
}
function updateStatus() {
  stats.happy = Math.max(0, Math.min(100, Math.round(stats.happy)));
  stats.hungry = Math.max(0, Math.min(100, Math.round(stats.hungry)));
  happyBar.style.width = `${stats.happy}%`;
  hungryBar.style.width = `${stats.hungry}%`;
  hungryBar.classList.toggle('low', stats.hungry <= 25);
  happyValue.textContent = `${stats.happy}%`;
  hungryValue.textContent = `${stats.hungry}%`;
  const sad = stats.happy <= 20 || stats.hungry <= 20;
  moodChip.textContent = sad ? 'NEED SOME LOVE' : 'FEELING GOOD ✳';
  moodChip.style.background = sad ? 'var(--pink)' : 'var(--green)';
  statusNote.textContent = stats.hungry <= 25 ? `${pet.name} lapar. Kasih camilan!` : stats.happy <= 25 ? `${pet.name} butuh perhatian. Elus yuk!` : `${pet.name} lagi happy. Ajak main atau kasih camilan!`;
  localStorage.setItem(storageKey, JSON.stringify(stats));
  updatePetImage();
}
function toastMessage(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 1700);
}
function makeHearts() {
  const rect = petImage.getBoundingClientRect();
  for (let i = 0; i < 7; i++) {
    const heart = document.createElement('span');
    heart.className = 'heart';
    heart.textContent = '♥';
    heart.style.left = `${rect.left + Math.random() * rect.width}px`;
    heart.style.top = `${rect.top + Math.random() * rect.height * .6}px`;
    heart.style.animationDelay = `${Math.random() * .3}s`;
    document.body.append(heart);
    heart.addEventListener('animationend', () => heart.remove(), { once: true });
  }
}

document.querySelector('#pet-tap').addEventListener('click', () => {
  stats.happy = Math.min(100, stats.happy + 10);
  happyMoment = true;
  updateStatus();
  const button = document.querySelector('#pet-tap');
  button.classList.remove('bounce');
  void button.offsetWidth;
  button.classList.add('bounce');
  makeHearts();
  hint.textContent = `${pet.name} suka banget dielus!`;
  clearTimeout(happyTimer);
  happyTimer = setTimeout(() => { happyMoment = false; button.classList.remove('bounce'); updatePetImage(); }, 1900);
});

document.querySelectorAll('.food-item').forEach(food => food.addEventListener('click', () => {
  if (stats.hungry >= 100) { toastMessage(`${pet.name} sudah kenyang!`); return; }
  const treats = Number(localStorage.getItem('petcoin-treats') || 0);
  if (treats < 2) { toastMessage('Treat belum cukup. Main mini game dulu!'); return; }
  localStorage.setItem('petcoin-treats', String(treats - 2));
  updateTreatBalance();
  stats.hungry = Math.min(100, stats.hungry + 20);
  happyMoment = true;
  updateStatus();
  makeHearts();
  hint.textContent = `${food.dataset.name} jadi camilan favorit ${pet.name}!`;
  clearTimeout(happyTimer);
  happyTimer = setTimeout(() => { happyMoment = false; updatePetImage(); }, 1900);
}));

wardrobePanel.querySelectorAll('[data-category]').forEach(button => button.addEventListener('click', () => {
  renderCategory(button.dataset.category);
  modal.hidden = false;
}));
document.querySelector('#modal-close').addEventListener('click',() => { modal.hidden = true; });
modal.addEventListener('click',event => { if (event.target === modal) modal.hidden = true; });
document.addEventListener('keydown',event => { if (event.key === 'Escape') modal.hidden = true; });

function splashShower() {
  showerDrops.replaceChildren();
  for (let i = 0; i < 16; i++) {
    const drop = document.createElement('i');
    drop.style.left = `${18 + Math.random() * 64}%`;
    drop.style.animationDelay = `${Math.random() * .55}s`;
    showerDrops.append(drop);
  }
  petArt.classList.add('showering');
  setTimeout(() => petArt.classList.remove('showering'), 1700);
}
document.querySelector('#bath-button').addEventListener('click', () => {
  stats.happy = Math.min(100, stats.happy + 12);
  updateStatus();
  happyMoment = true;
  updatePetImage();
  splashShower();
  hint.textContent = `${pet.name} wangi dan segar setelah mandi!`;
  clearTimeout(happyTimer);
  happyTimer = setTimeout(() => { happyMoment = false; updatePetImage(); }, 1900);
});

setInterval(() => {
  stats.hungry = Math.max(0, stats.hungry - .07);
  stats.happy = Math.max(0, stats.happy - .07);
  updateStatus();
}, 10000);

updateTreatBalance();
renderPet();
updateStatus();
