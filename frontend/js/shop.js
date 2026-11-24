const cards = [...document.querySelectorAll('.shop-card')];
const grid = document.querySelector('.shop-grid');
const balanceDisplay = document.querySelector('#treat-balance');
const ownedCount = document.querySelector('#owned-count');
const status = document.querySelector('#shop-status');

const getTreats = () => Number(localStorage.getItem('petcoin-treats') || 0);
const openPetPage = card => {
  const destination = new URL(card.dataset.page, window.location.href);
  window.location.assign(destination.href);
};
const getOwnedPets = () => {
  try {
    const saved = JSON.parse(localStorage.getItem('petcoin-unlocked') || '[]');
    return new Set(['Mochi', ...saved.filter(name => ['Gajah', 'Bear', 'Mochi', 'Boba', 'Ayam'].includes(name))]);
  } catch {
    return new Set(['Mochi']);
  }
};

function renderShop() {
  const ownedPets = getOwnedPets();
  balanceDisplay.textContent = getTreats();
  ownedCount.textContent = `${ownedPets.size} / ${cards.length}`;

  const orderedCards = [...cards].sort((a, b) => Number(ownedPets.has(b.dataset.pet)) - Number(ownedPets.has(a.dataset.pet)));
  orderedCards.forEach(card => {
    grid.append(card);
    const owned = ownedPets.has(card.dataset.pet);
    card.classList.toggle('is-owned', owned);
    const button = card.querySelector('.buy-button');
    button.disabled = false;
    button.textContent = owned ? 'Lihat pet-mu' : `Beli · ${card.dataset.price} treat`;
  });
}

cards.forEach(card => card.querySelector('.buy-button').addEventListener('click', () => {
  const pet = card.dataset.pet;
  const name = card.dataset.name;
  const price = Number(card.dataset.price);
  const ownedPets = getOwnedPets();

  if (ownedPets.has(pet)) {
    openPetPage(card);
    return;
  }

  const treats = getTreats();
  if (treats < price) {
    status.textContent = `Treat belum cukup untuk membeli ${name}. Kamu punya ${treats} treat.`;
    return;
  }
  if (!window.confirm(`Beli ${name} seharga ${price} treat?`)) return;

  ownedPets.add(pet);
  localStorage.setItem('petcoin-treats', String(treats - price));
  localStorage.setItem('petcoin-unlocked', JSON.stringify([...ownedPets].filter(item => item !== 'Mochi')));
  status.textContent = `${name} sudah masuk koleksimu!`;
  renderShop();
}));

renderShop();
