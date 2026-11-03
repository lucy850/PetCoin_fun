const stage = document.querySelector('#room-stage');
const art = document.querySelector('#pet-art');
const pet = document.querySelector('#pet-tap');
const image = document.querySelector('#pet-image');
const hint = document.querySelector('#pet-hint');
const showerToggle = document.querySelector('#shower-toggle');
const showerWater = document.querySelector('#shower-water');
const soap = document.querySelector('#soap-item');
const towel = document.querySelector('#bath-towel');
const foam = document.querySelector('#soap-foam');
const wetOverlay = document.querySelector('#pet-wet-overlay');
let draggingPet = false;
let suppressTap = false;
let emotionTimeout;
let lastFoamAt = 0;

function updateImage(mood) {
  const filename = mood === 'happy' ? 'kucing senang.png' : mood === 'sad' ? 'kucing sedih.png' : 'kucing123.png';
  image.src = `png/${encodeURIComponent(filename)}`;
  image.alt = mood === 'happy' ? 'Kucing senang' : mood === 'sad' ? 'Kucing sedih' : 'Kucing';
  const mask = `url("${image.src}")`;
  wetOverlay.style.maskImage = mask;
  wetOverlay.style.webkitMaskImage = mask;
}

function makeHearts() {
  const rect = image.getBoundingClientRect();
  for (let i = 0; i < 8; i += 1) {
    const heart = document.createElement('span');
    heart.className = 'heart';
    heart.textContent = '♥';
    heart.style.left = `${rect.left + Math.random() * rect.width}px`;
    heart.style.top = `${rect.top + Math.random() * rect.height * 0.65}px`;
    heart.style.animationDelay = `${Math.random() * 0.35}s`;
    document.body.append(heart);
    heart.addEventListener('animationend', () => heart.remove(), { once: true });
  }
}

function bouncePet() {
  clearTimeout(emotionTimeout);
  updateImage('happy');
  pet.classList.remove('bounce');
  void pet.offsetWidth;
  pet.classList.add('bounce');
  makeHearts();
  document.querySelector('#mood-chip').textContent = 'FEELING LOVED ♥';
  hint.textContent = 'Kucing senang sekali! ♥';
  emotionTimeout = setTimeout(() => {
    pet.classList.remove('bounce');
    updateImage('normal');
    document.querySelector('#mood-chip').textContent = pet.classList.contains('is-wet') ? 'ALL WET' : 'FEELING GOOD ✳';
  }, 1900);
}

showerToggle.addEventListener('click', () => {
  const on = showerToggle.getAttribute('aria-pressed') !== 'true';
  if (on && (!stage.classList.contains('pet-at-tub') || !stage.classList.contains('pet-near-shower'))) {
    hint.textContent = 'Geser Kucing ke dalam bathtub, tepat di bawah shower.';
    return;
  }
  if (on && !pet.classList.contains('soap-foamed')) {
    hint.textContent = 'Sabuni Kucing dulu sebelum menyalakan shower.';
    return;
  }
  showerToggle.setAttribute('aria-pressed', String(on));
  showerToggle.setAttribute('aria-label', on ? 'Matikan shower' : 'Nyalakan shower');
  showerToggle.textContent = on ? 'ON' : 'OFF';
  stage.classList.toggle('shower-on', on);
  showerWater.hidden = !on;
  if (on) {
    pet.classList.add('is-wet');
    pet.classList.remove('soap-foamed');
    foam.replaceChildren();
    foam.hidden = true;
    wetOverlay.style.maskImage = `url("${image.src}")`;
    wetOverlay.style.webkitMaskImage = `url("${image.src}")`;
    document.querySelector('#mood-chip').textContent = 'BATH TIME';
    hint.textContent = 'Kucing sedang mandi! Gunakan sabun, lalu keringkan dengan handuk.';
  } else {
    hint.textContent = pet.classList.contains('is-wet') ? 'Kucing basah kuyup! Seret handuk untuk mengeringkannya.' : 'Elus Kucing atau ajak mandi lagi!';
  }
});

function centerPet() {
  pet.style.left = `${Math.max(0, (art.clientWidth - pet.offsetWidth) / 2)}px`;
  pet.style.top = `${Math.max(0, (art.clientHeight - pet.offsetHeight) / 2)}px`;
}
requestAnimationFrame(centerPet);
window.addEventListener('resize', centerPet);

pet.addEventListener('pointerdown', event => {
  const rect = pet.getBoundingClientRect();
  pet.dataset.offsetX = String(event.clientX - rect.left);
  pet.dataset.offsetY = String(event.clientY - rect.top);
  pet.dataset.startX = String(event.clientX);
  pet.dataset.startY = String(event.clientY);
  draggingPet = false;
  pet.setPointerCapture(event.pointerId);
  pet.classList.add('dragging');
});
pet.addEventListener('pointermove', event => {
  if (!pet.hasPointerCapture(event.pointerId)) return;
  const dx = event.clientX - Number(pet.dataset.startX);
  const dy = event.clientY - Number(pet.dataset.startY);
  if (Math.hypot(dx, dy) > 4) {
    draggingPet = true;
    stage.classList.remove('pet-at-tub', 'pet-near-shower');
    if (showerToggle.getAttribute('aria-pressed') === 'true') {
      showerToggle.setAttribute('aria-pressed', 'false');
      showerToggle.setAttribute('aria-label', 'Nyalakan shower');
      showerToggle.textContent = 'OFF';
      stage.classList.remove('shower-on');
      showerWater.hidden = true;
    }
  }
  const rect = art.getBoundingClientRect();
  const maxX = Math.max(0, art.clientWidth - pet.offsetWidth);
  const maxY = Math.max(0, art.clientHeight - pet.offsetHeight);
  pet.style.left = `${Math.min(maxX, Math.max(0, event.clientX - rect.left - Number(pet.dataset.offsetX)))}px`;
  pet.style.top = `${Math.min(maxY, Math.max(0, event.clientY - rect.top - Number(pet.dataset.offsetY)))}px`;
  foam.style.left = pet.style.left;
  foam.style.top = pet.style.top;
  foam.style.width = `${pet.offsetWidth}px`;
  foam.style.height = `${pet.offsetHeight}px`;
});
pet.addEventListener('pointerup', event => {
  if (pet.hasPointerCapture(event.pointerId)) pet.releasePointerCapture(event.pointerId);
  pet.classList.remove('dragging');
  if (!draggingPet) return;
  suppressTap = true;
  setTimeout(() => { suppressTap = false; }, 80);
  const bathRect = document.querySelector('.room-bath').getBoundingClientRect();
  const showerRect = document.querySelector('.room-shower').getBoundingClientRect();
  const rect = pet.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const feetY = rect.top + rect.height * 0.82;
  const inTub = centerX > bathRect.left - rect.width * 0.22 && centerX < bathRect.right + rect.width * 0.22 && feetY >= bathRect.top && feetY <= bathRect.bottom + 24;
  const underShower = centerX >= showerRect.left - 34 && centerX <= showerRect.right + 34 && centerY >= showerRect.top - 34 && centerY <= showerRect.bottom + 20;
  if (inTub && underShower) {
    stage.classList.add('pet-at-tub');
    stage.classList.add('pet-near-shower');
    hint.textContent = 'Kucing berada di bathtub, tepat di bawah shower!';
  } else if (inTub) {
    stage.classList.add('pet-at-tub');
    stage.classList.remove('pet-near-shower');
    hint.textContent = 'Geser Kucing ke bawah shower agar air menyala.';
  } else {
    if (underShower) {
      stage.classList.remove('pet-at-tub');
      stage.classList.add('pet-near-shower');
      hint.textContent = 'Kucing harus berada di dalam bathtub dan tepat di bawah shower.';
    }
  }
  draggingPet = false;
});
pet.addEventListener('pointercancel', () => { draggingPet = false; pet.classList.remove('dragging'); });
pet.addEventListener('click', () => { if (!suppressTap) bouncePet(); });

function overlapsPet(element) {
  const a = element.getBoundingClientRect();
  const b = pet.getBoundingClientRect();
  return a.right > b.left + b.width * 0.18 && a.left < b.right - b.width * 0.18
    && a.bottom > b.top + b.height * 0.12 && a.top < b.bottom - b.height * 0.08;
}

function foamPet() {
  if (showerToggle.getAttribute('aria-pressed') === 'true') {
    pet.classList.remove('soap-foamed');
    foam.replaceChildren();
    foam.hidden = true;
    hint.textContent = 'Air shower membilas busa dari Kucing!';
    return;
  }
  const rect = art.getBoundingClientRect();
  const petRect = pet.getBoundingClientRect();
  foam.style.left = `${petRect.left - rect.left}px`;
  foam.style.top = `${petRect.top - rect.top}px`;
  foam.style.width = `${petRect.width}px`;
  foam.style.height = `${petRect.height}px`;
  foam.hidden = false;
  const now = Date.now();
  if (now - lastFoamAt < 90) return;
  lastFoamAt = now;
  const count = pet.classList.contains('soap-foamed') ? 3 : 20;
  for (let i = 0; i < count; i += 1) {
    const bubble = document.createElement('i');
    bubble.className = 'soap-bubble';
    const size = 13 + Math.random() * 22;
    bubble.style.width = `${size}px`;
    bubble.style.height = `${size}px`;
    bubble.style.left = `${Math.random() * Math.max(0, foam.clientWidth - size)}px`;
    bubble.style.top = `${Math.random() * Math.max(0, foam.clientHeight - size)}px`;
    bubble.style.animationDelay = `${Math.random() * -0.5}s`;
    foam.append(bubble);
  }
  while (foam.children.length > 48) foam.firstElementChild.remove();
  pet.classList.add('soap-foamed');
  hint.textContent = 'Kucing jadi penuh busa sabun!';
}

function addDragTool(tool, action) {
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
    const rect = art.getBoundingClientRect();
    tool.style.left = action === 'towel' ? `${event.clientX - offsetX}px` : `${event.clientX - rect.left - offsetX}px`;
    tool.style.top = action === 'towel' ? `${event.clientY - offsetY}px` : `${event.clientY - rect.top - offsetY}px`;
    tool.style.right = 'auto';
    tool.style.bottom = 'auto';
    if (action === 'soap' && overlapsPet(tool)) foamPet();
  });
  tool.addEventListener('pointerup', event => {
    if (tool.hasPointerCapture(event.pointerId)) tool.releasePointerCapture(event.pointerId);
    const droppedOnPet = overlapsPet(tool);
    tool.classList.remove('dragging');
    tool.style.left = '';
    tool.style.top = '';
    tool.style.right = '';
    tool.style.bottom = '';
    if (!droppedOnPet) return;
    if (action === 'soap') foamPet();
    else {
      pet.classList.remove('is-wet');
      showerToggle.setAttribute('aria-pressed', 'false');
      showerToggle.setAttribute('aria-label', 'Nyalakan shower');
      showerToggle.textContent = 'OFF';
      stage.classList.remove('shower-on');
      showerWater.hidden = true;
      document.querySelector('#mood-chip').textContent = 'FEELING GOOD ✳';
      hint.textContent = 'Kucing sudah selesai mandi.';
      bouncePet();
    }
  });
  tool.addEventListener('pointercancel', () => tool.classList.remove('dragging'));
}
addDragTool(soap, 'soap');
addDragTool(towel, 'towel');
