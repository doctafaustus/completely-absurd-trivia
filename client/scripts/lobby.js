import utils from '../utils/utils.js';

if (localStorage.getItem('user')) {
  console.log('init');
  initLobby();
} else { 
  console.log('Not logged in!');
}

function initLobby() {
  const lobbySocket = io('/lobby');
  const username = JSON.parse(localStorage.getItem('user')).username;

  lobbySocket.on('connect', () => {
    lobbySocket.emit('join', username);
  });
  
  lobbySocket.on('updatePeople', updatePeople); 

  initSearchListener();
}

function initSearchListener() {
  const findFriendInput = document.querySelector('#find-friend-input');
  const debounceThreshold = 100;

  findFriendInput.addEventListener('keyup', utils.debounce(e => {
    const { value } = e.target;

    if (value.trim() === '') return;

    fetch('/api/find-friend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ searchTerm: value })
    })
    .then(response => response.json())
    .then(data => {
      console.log('/api/find-friend: \n', data);
      buildSearchResultList(data);
    });

  }, debounceThreshold));
}

function buildSearchResultList(results) {
  const friendList = document.querySelector('.friend-list');
  console.log('friendList', friendList);
}


function updatePeople(lobbyPeople) {
  const playerCount = document.querySelector('#player-count');
  const playerList = document.querySelector('#player-list'); 


  playerCount.textContent = Object.values(lobbyPeople).length;
  playerList.innerHTML = Object.values(lobbyPeople).map(player => {
    return `<li>
      <span class="player">${player.username}</span>
      <button class="invite">Invite</button>
    </li>`;
  }).join('');
  

}
