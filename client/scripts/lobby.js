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
  fetchFriends();
}

function fetchFriends() {
  const currentUserID = getCurrentUserID();
  const myFriendList = document.querySelector('.my-friend-list');

  fetch('/api/fetch-friends', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentUserID })
  })
  .then(response => response.json())
  .then(data => {
    console.log('/api/fetch-friends: \n', data);
    const myFriendListHTML = data.map(friend => {
      return `<li class="friend">
        <span>${friend}</span>
        <button data-friend="${friend}">Remove Friend</button>
      </li>`;
    }).join(''); 

    myFriendList.innerHTML = myFriendListHTML;
  });
}

function initSearchListener() {
  const friendList = document.querySelector('.friend-list');
  const findFriendInput = document.querySelector('#find-friend-input');
  const debounceThreshold = 100;

  findFriendInput.addEventListener('keyup', utils.debounce(e => {
    const { value } = e.target;

    if (value.trim() === '') {
      document.querySelector('.friend-list').innerHTML = '';
      return;
    }

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

  friendList.addEventListener('click', e => {
    if (e.target.matches('.add-friend')) addFriend(e.target.dataset.friend);
  });
}

function buildSearchResultList(results) {
  const friendList = document.querySelector('.friend-list');
  let friendListHTML = results.map(friend => {
    return `<li class="friend-item">
      <span>${friend}</span>
      <button class="add-friend" data-friend="${friend}">Add Friend</button>
    </li>`;
  }).join('');
  
  if (!friendListHTML) friendListHTML = '<li>No results found</li>';
  friendList.innerHTML = friendListHTML;
}

function addFriend(friendToAdd) {

  const currentUserID = getCurrentUserID();
  if (!currentUserID) return;
   
  fetch('/api/add-friend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentUserID, friendToAdd })
  })
  .then(response => response.json())
  .then(data => {
    console.log('/api/add-friend: \n', data);
    fetchFriends();
  });
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


function getCurrentUserID() {
  return JSON.parse(localStorage.getItem('user') || '{}').id;
}