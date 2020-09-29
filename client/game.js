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