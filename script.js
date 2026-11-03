const mood = document.querySelector('#mood');
const toast = document.querySelector('#toast');
const careButtons = [...document.querySelectorAll('.care-button')];
let toastTimer;

careButtons.forEach(button => button.addEventListener('click', () => {
  careButtons.forEach(item => item.classList.toggle('active', item === button));
  mood.innerHTML = button.dataset.mood.replace(' ', '<br>');
  toast.textContent = `Mochi: ${button.dataset.mood.toLowerCase()}! ✦`;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 1700);
}));

document.querySelector('.shop-button').addEventListener('click', () => {
  toast.textContent = 'Toko perlengkapan mandi segera hadir!';
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 1700);
});

document.querySelector('.menu-button').addEventListener('click', () => {
  toast.textContent = 'Bubble Club · Bath Time';
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 1700);
});
