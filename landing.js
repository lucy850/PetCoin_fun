const menuToggle = document.querySelector('#menu-toggle');
const siteNav = document.querySelector('#site-nav');

menuToggle.addEventListener('click', () => {
  const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
  menuToggle.setAttribute('aria-expanded', String(!expanded));
  menuToggle.setAttribute('aria-label', expanded ? 'Buka menu' : 'Tutup menu');
  siteNav.classList.toggle('open', !expanded);
});

siteNav.addEventListener('click', event => {
  if (event.target.closest('a')) {
    siteNav.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Buka menu');
  }
});

function updatePetLocks() {
  let unlocked = [];
  try {
    unlocked = JSON.parse(localStorage.getItem('petcoin-unlocked') || '[]');
  } catch {
    unlocked = [];
  }
  document.querySelectorAll('.purchasable-pet').forEach(card => {
    const isOwned = unlocked.includes(card.dataset.pet);
    card.href = isOwned ? card.dataset.page : 'frontend_new/shop.html';
    const label = card.querySelector('.purchase-tag');
    if (label) label.textContent = isOwned ? 'SUDAH DIMILIKI · BUKA' : `BELI · ${card.dataset.price} TREAT`;
  });
}

updatePetLocks();
window.addEventListener('pageshow', updatePetLocks);
window.addEventListener('storage', updatePetLocks);

const heroCat = document.querySelector('.hero-cat');
if (heroCat) {
  let petReset;
  let isDragging = false;
  let skipPetClick = false;
  heroCat.addEventListener('pointerdown', event => {
    isDragging = false;
    heroCat.dataset.dragStartX = String(event.clientX);
    heroCat.dataset.dragStartY = String(event.clientY);
    heroCat.setPointerCapture(event.pointerId);
  });
  heroCat.addEventListener('pointermove', event => {
    if (!heroCat.hasPointerCapture(event.pointerId)) return;
    if (Math.hypot(event.clientX - Number(heroCat.dataset.dragStartX), event.clientY - Number(heroCat.dataset.dragStartY)) > 5) {
      isDragging = true;
      const bounds = heroCat.parentElement.getBoundingClientRect();
      const halfWidth = heroCat.offsetWidth / 2;
      const halfHeight = heroCat.offsetHeight / 2;
      const x = Math.max(halfWidth, Math.min(bounds.width - halfWidth, event.clientX - bounds.left));
      const y = Math.max(halfHeight, Math.min(bounds.height - halfHeight, event.clientY - bounds.top));
      heroCat.style.left = `${x}px`;
      heroCat.style.top = `${y}px`;
    }
  });
  heroCat.addEventListener('pointerup', event => {
    if (heroCat.hasPointerCapture(event.pointerId)) heroCat.releasePointerCapture(event.pointerId);
    if (isDragging) {
      skipPetClick = true;
      setTimeout(() => { skipPetClick = false; }, 80);
    }
    isDragging = false;
  });
  heroCat.addEventListener('pointercancel', () => { isDragging = false; });
  const petCat = () => {
    heroCat.classList.remove('bounce');
    void heroCat.offsetWidth;
    heroCat.classList.add('bounce');
    heroCat.src = 'frontend_new/png/kucing%20senang.png';
    heroCat.alt = 'Kucing senang';
    const rect = heroCat.getBoundingClientRect();
    for (let i = 0; i < 8; i += 1) {
      const heart = document.createElement('span');
      heart.className = 'hero-heart';
      heart.textContent = '♥';
      heart.style.left = `${rect.left + Math.random() * rect.width}px`;
      heart.style.top = `${rect.top + Math.random() * rect.height * 0.65}px`;
      heart.style.animationDelay = `${Math.random() * 0.35}s`;
      document.body.append(heart);
      heart.addEventListener('animationend', () => heart.remove(), { once: true });
    }
    clearTimeout(petReset);
    petReset = setTimeout(() => {
      heroCat.classList.remove('bounce');
      heroCat.src = 'frontend_new/png/kucing123.png';
      heroCat.alt = 'Kucing Pet Coin';
    }, 1900);
  };
  heroCat.addEventListener('click', () => { if (!skipPetClick) petCat(); });
  heroCat.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      petCat();
    }
  });
}

const bathScene = document.querySelector('#cat-bathroom-scene');
if (bathScene) {
  const bathPet = document.querySelector('#cat-bath-pet');
  const bathImage = document.querySelector('#cat-bath-image');
  const showerSwitch = document.querySelector('#cat-shower-switch');
  const showerWater = document.querySelector('#cat-shower-water');
  const bathHint = document.querySelector('#cat-bath-hint');
  let petDragging = false;
  let suppressBathTap = false;
  let happyTimeout;
  let foamTimeout;
  const showBathHearts = () => {
    const rect = bathImage.getBoundingClientRect();
    for (let i = 0; i < 8; i += 1) {
      const heart = document.createElement('span');
      heart.className = 'hero-heart';
      heart.textContent = '♥';
      heart.style.left = `${rect.left + Math.random() * rect.width}px`;
      heart.style.top = `${rect.top + Math.random() * rect.height * 0.65}px`;
      heart.style.animationDelay = `${Math.random() * 0.35}s`;
      document.body.append(heart);
      heart.addEventListener('animationend', () => heart.remove(), { once: true });
    }
  };
  const overlap = (first, second) => {
    const a = first.getBoundingClientRect();
    const b = second.getBoundingClientRect();
    return a.right > b.left + b.width * 0.18 && a.left < b.right - b.width * 0.18
      && a.bottom > b.top + b.height * 0.12 && a.top < b.bottom - b.height * 0.08;
  };
  showerSwitch.addEventListener('click', () => {
    const on = showerSwitch.getAttribute('aria-pressed') !== 'true';
    showerSwitch.setAttribute('aria-pressed', String(on));
    showerSwitch.textContent = on ? 'ON' : 'OFF';
    showerWater.hidden = !on;
    bathScene.classList.toggle('shower-on', on);
    if (on) {
      bathPet.classList.add('is-wet');
      bathHint.textContent = 'Air shower mengalir! Seret sabun untuk membuat busa.';
    } else {
      bathHint.textContent = bathPet.classList.contains('is-wet')
        ? 'Kucing basah kuyup! Seret handuk untuk mengeringkannya.'
        : 'Shower dimatikan. Elus Kucing atau geser ke bathtub!';
    }
  });
  bathPet.addEventListener('pointerdown', event => {
    const rect = bathPet.getBoundingClientRect();
    bathPet.dataset.dragX = String(event.clientX - rect.left);
    bathPet.dataset.dragY = String(event.clientY - rect.top);
    bathPet.dataset.startX = String(event.clientX);
    bathPet.dataset.startY = String(event.clientY);
    petDragging = false;
    bathPet.setPointerCapture(event.pointerId);
  });
  bathPet.addEventListener('pointermove', event => {
    if (!bathPet.hasPointerCapture(event.pointerId)) return;
    const dx = event.clientX - Number(bathPet.dataset.startX);
    const dy = event.clientY - Number(bathPet.dataset.startY);
    if (Math.hypot(dx, dy) > 6) {
      petDragging = true;
      bathPet.style.left = `${event.clientX - bathScene.getBoundingClientRect().left - Number(bathPet.dataset.dragX)}px`;
      bathPet.style.top = `${event.clientY - bathScene.getBoundingClientRect().top - Number(bathPet.dataset.dragY)}px`;
      bathPet.style.bottom = 'auto';
      bathPet.style.width = 'min(34%, 270px)';
      bathPet.classList.remove('in-tub');
    }
  });
  bathPet.addEventListener('pointerup', event => {
    if (bathPet.hasPointerCapture(event.pointerId)) bathPet.releasePointerCapture(event.pointerId);
    if (!petDragging) return;
    suppressBathTap = true;
    setTimeout(() => { suppressBathTap = false; }, 80);
    const tub = bathScene.querySelector('.cat-bathtub').getBoundingClientRect();
    const cat = bathPet.getBoundingClientRect();
    const centerX = cat.left + cat.width / 2;
    const feetY = cat.top + cat.height * 0.82;
    if (centerX > tub.left - cat.width * 0.2 && centerX < tub.right + cat.width * 0.2 && feetY > tub.top && feetY < tub.bottom + 30) {
      bathPet.classList.add('in-tub');
      bathHint.textContent = 'Kucing sedang berendam di bathtub!';
    }
    petDragging = false;
  });
  bathPet.addEventListener('pointercancel', () => { petDragging = false; });
  bathPet.addEventListener('click', () => {
    if (suppressBathTap) return;
    bathPet.classList.remove('bounce');
    void bathPet.offsetWidth;
    bathPet.classList.add('bounce');
    bathImage.src = 'frontend_new/png/kucing%20senang.png';
    bathImage.alt = 'Kucing senang';
    showBathHearts();
    bathHint.textContent = 'Kucing senang sekali! ♥';
    clearTimeout(happyTimeout);
    happyTimeout = setTimeout(() => {
      bathPet.classList.remove('bounce');
      bathImage.src = 'frontend_new/png/kucing123.png';
      bathImage.alt = 'Kucing';
    }, 1900);
  });
  const addToolDrag = (tool, type) => {
    let offsetX = 0;
    let offsetY = 0;
    tool.addEventListener('pointerdown', event => {
      const rect = tool.getBoundingClientRect();
      offsetX = event.clientX - rect.left;
      offsetY = event.clientY - rect.top;
      tool.setPointerCapture(event.pointerId);
      tool.classList.add('dragging');
      event.preventDefault();
    });
    tool.addEventListener('pointermove', event => {
      if (!tool.hasPointerCapture(event.pointerId)) return;
      const rect = bathScene.getBoundingClientRect();
      tool.style.left = `${event.clientX - rect.left - offsetX}px`;
      tool.style.top = `${event.clientY - rect.top - offsetY}px`;
      tool.style.right = 'auto';
      tool.style.bottom = 'auto';
      if (type === 'soap' && overlap(tool, bathPet)) {
        bathPet.classList.add('soap-foamed');
        bathHint.textContent = 'Busa sabun menyelimuti Kucing!';
      }
    });
    tool.addEventListener('pointerup', event => {
      if (tool.hasPointerCapture(event.pointerId)) tool.releasePointerCapture(event.pointerId);
      tool.classList.remove('dragging');
      if (!overlap(tool, bathPet)) return;
      if (type === 'soap') {
        bathPet.classList.add('soap-foamed');
        bathHint.textContent = 'Kucing penuh busa sabun!';
        clearTimeout(foamTimeout);
        foamTimeout = setTimeout(() => bathPet.classList.remove('soap-foamed'), 5000);
      } else {
        bathPet.classList.remove('is-wet', 'soap-foamed');
        bathPet.classList.add('bounce');
        bathHint.textContent = 'Kucing sudah kering dan bersih!';
        setTimeout(() => bathPet.classList.remove('bounce'), 1900);
      }
    });
    tool.addEventListener('pointercancel', () => tool.classList.remove('dragging'));
  };
  addToolDrag(document.querySelector('#cat-bath-soap'), 'soap');
  addToolDrag(document.querySelector('#cat-bath-towel'), 'towel');
}

// Treat and pet progress stays on this device between visits.
if (document.querySelector('#treat-count') && document.querySelector('#game-pets')) {
const treatKey = 'petcoinTreats';
const petKey = 'petcoinPets';
const pets = [
  { id: 'gajah', name: 'Gajah', rarity: 'Common', cost: 5, image: 'frontend_new/png/gajah%201.png' },
  { id: 'kucing', name: 'Kucing', rarity: 'Rare', cost: 10, image: 'frontend_new/png/kucing123.png' },
  { id: 'ayam', name: 'Ayam', rarity: 'Legendary', cost: 20, image: 'frontend_new/png/Ayam.png' }
];
let treats = Number(localStorage.getItem(treatKey)) || 0;
let owned = JSON.parse(localStorage.getItem(petKey) || '[]');
const treatCount = document.querySelector('#treat-count');
const petCards = document.querySelector('#game-pets');

function renderProgress() {
  treatCount.textContent = treats;
  petCards.innerHTML = pets.map(pet => {
    const hasPet = owned.includes(pet.id);
    return `<article class="game-pet-card"><span class="rarity rarity-${pet.rarity.toLowerCase()}">${pet.rarity}</span><img src="${pet.image}" alt="${pet.name}"/><h4>${pet.name}</h4><p>🍪 ${pet.cost} Treat</p><button type="button" data-pet="${pet.id}" ${hasPet || treats < pet.cost ? 'disabled' : ''}>${hasPet ? 'Sudah dikoleksi ✓' : 'Tukar Treat'}</button></article>`;
  }).join('');
}

petCards.addEventListener('click', event => {
  const button = event.target.closest('[data-pet]');
  if (!button) return;
  const pet = pets.find(item => item.id === button.dataset.pet);
  if (!pet || treats < pet.cost || owned.includes(pet.id)) return;
  treats -= pet.cost;
  owned.push(pet.id);
  localStorage.setItem(treatKey, treats);
  localStorage.setItem(petKey, JSON.stringify(owned));
  renderProgress();
});

const startButton = document.querySelector('#game-start');
const gameField = document.querySelector('#game-field');
const timerLabel = document.querySelector('#game-time');
const statusLabel = document.querySelector('#game-status');
let gameTimer;
let spawnTimer;
startButton.addEventListener('click', () => {
  if (startButton.disabled) return;
  let seconds = 20;
  timerLabel.textContent = seconds;
  statusLabel.textContent = 'Tangkap Treat yang muncul!';
  startButton.disabled = true;
  gameField.innerHTML = '';
  const spawnTreat = () => {
    const treat = document.createElement('button');
    treat.type = 'button';
    treat.className = 'falling-treat';
    treat.textContent = '🍪';
    treat.setAttribute('aria-label', 'Tangkap Treat');
    treat.style.left = `${5 + Math.random() * 82}%`;
    treat.style.top = `${5 + Math.random() * 72}%`;
    treat.addEventListener('click', () => {
      if (treat.disabled) return;
      treat.disabled = true;
      treats += 1;
      localStorage.setItem(treatKey, treats);
      renderProgress();
      treat.remove();
    });
    gameField.append(treat);
    setTimeout(() => treat.remove(), 1450);
  };
  spawnTreat();
  spawnTimer = setInterval(spawnTreat, 650);
  gameTimer = setInterval(() => {
    seconds -= 1;
    timerLabel.textContent = seconds;
    if (seconds <= 0) {
      clearInterval(gameTimer);
      clearInterval(spawnTimer);
      startButton.disabled = false;
      statusLabel.textContent = 'Selesai! Main lagi untuk cari Treat.';
      gameField.innerHTML = '<span class="game-hint">Mantap! Treat kamu sudah tersimpan.</span>';
    }
  }, 1000);
});

renderProgress();
}
