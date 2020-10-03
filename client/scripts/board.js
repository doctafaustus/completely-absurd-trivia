const contestants = [];
for (let i = 0; i < 48; i++) {
  contestants.push({
    name: `Contestant${i}`,
    score: Math.ceil(Math.random() * 10000)
  });
}

const contestantList = document.querySelector('.board .contestant-list');
const contestantsHTML = contestants.map((contestant, index) => {
  return `<li class="contestant">
      <div class="contestant-top-row">
        <span class="contestant-name">${contestant.name}</span>
        <span class="contestant-rank">${index + 1}</span>
      </div>
      <div class="contestant-avatar-container">
        <img class="contestant-avatar" src="/avatar.64783176.jpg">
      </div>
      <div class="contestant-bottom-row">
        <span class="contestant-score">${contestant.score}</span>
      </div>
    </li>`;
}).join('');

contestantList.insertAdjacentHTML('afterbegin', contestantsHTML);

