const answerBtns = document.querySelectorAll('.answer');

function bindBtnListeners() {
  answerBtns.forEach(btn => btn.addEventListener('click', handleGuess));
}

function handleGuess(e) {
  e.target.classList.add('selected');
  answerBtns.forEach(btn => btn.disabled = true);
}

function init() {
  bindBtnListeners();
}

init();

animateValue({ selector: '.contestant-score', endValue: 2000 });

function animateValue({ selector, endValue }) {
  
  const el = document.querySelector(selector);
  const range = endValue - Number(el.innerHTML);
  const duration = 500;
  const stepTime = 50;
  
  // get current time and calculate desired end time
  const startTime = new Date().getTime();
  const endTime = startTime + duration;
  let timer;

  function run() {
    const now = new Date().getTime();
    const remaining = Math.max((endTime - now) / duration, 0);
    let value = Math.round(endValue - (remaining * range));
    el.innerHTML = value;
    if (value == endValue) clearInterval(timer);
  }
  
  timer = setInterval(run, stepTime);
  run();
}

