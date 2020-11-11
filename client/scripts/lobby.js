import utils from '../utils/utils.js';

const playerCount = document.querySelector('#player-count');
const playerList = document.querySelector('#player-list'); 
const myFriendList = document.querySelector('.my-friend-list');
const findFriendResults = document.querySelector('.find-friend-results');
const findFriendInput = document.querySelector('#find-friend-input');


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
  initFriendRemoveListener();
  fetchFriends();
}

function initFriendRemoveListener() {
  myFriendList.addEventListener('click', e => {
    if (e.target.matches('.remove-friend')) removeFriend(e.target.dataset.friend);
  });
}

function removeFriend(friendToRemove) {
  const currentUserID = getCurrentUserValue('id');
  if (!currentUserID) return;
   
  fetch('/api/remove-friend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentUserID, friendToRemove })
  })
  .then(response => response.json())
  .then(data => {
    console.log('/api/remove-friend: \n', data);
    fetchFriends();
  });
}



function fetchFriends() {
  const currentUserID = getCurrentUserValue('id');

  fetch('/api/fetch-friends', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentUserID })
  })
  .then(response =>response.json())
  .then(data => {
    console.log('/api/fetch-friends: \n', data);
    const myFriendListHTML = data.map(friend => {
      return `<li class="friend">
        <span>${friend}</span>
        <button class="remove-friend" data-friend="${friend}">Remove Friend</button>
      </li>`;
    }).join(''); 

    myFriendList.innerHTML = myFriendListHTML;
  });
}

function initSearchListener() {
  const debounceThreshold = 100;

  findFriendInput.addEventListener('keyup', utils.debounce(e => {
    const { value } = e.target;

    if (value.trim() === '') return findFriendResults.innerHTML = '';

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

  findFriendResults.addEventListener('click', e => {
    if (e.target.matches('.add-friend')) addFriend(e.target.dataset.friend);
  });
}

function buildSearchResultList(results) {
  const currentUserUsername = getCurrentUserValue('username');
  const filteredResults = results.filter(result => {
    return result !== currentUserUsername;
  });

  let findFriendResultsHTML = filteredResults.map(friend => {
    return `<li class="friend-item">
      <span>${friend}</span>
      <button class="add-friend" data-friend="${friend}">Add Friend</button>
    </li>`;
  }).join('');
  
  if (!findFriendResultsHTML) findFriendResultsHTML = '<li>No results found</li>';
  findFriendResults.innerHTML = findFriendResultsHTML;
}

function addFriend(friendToAdd) {

  const currentUserID = getCurrentUserValue('id');
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
  playerCount.textContent = Object.values(lobbyPeople).length;
  playerList.innerHTML = Object.values(lobbyPeople).map(player => {
    return `<li>
      <span class="player">${player.username}</span>
      <button class="invite">Invite</button>
    </li>`;
  }).join('');
}


function getCurrentUserValue(value) {
  return JSON.parse(localStorage.getItem('user') || '{}')[value];
}