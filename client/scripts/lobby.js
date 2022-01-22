import utils from '../utils/utils.js';

document.addEventListener('click', ({ target }) => {
  
  // Invite friend
  if (target.matches('.invite-friend')) {
    console.log('Invite friend')
  }

  // Remove friend
  if (target.matches('.remove-friend')) {
    console.log('Remove friend');
  }
});


// Add friend form
const addFriendForm = document.querySelector('.add-friend-form');
const addFriendInput = addFriendForm.querySelector('.add-friend-input');
const addFriendStatus = addFriendForm.querySelector('.add-friend-status');
addFriendForm.addEventListener('submit', e => {
  e.preventDefault();
  addFriendInput.value = '';
  console.log('Submit add friend form');
  addFriendStatus.textContent = 'Friend added!';

  setTimeout(() => { addFriendStatus.textContent = ''}, 3000);
});








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
  const user = JSON.parse(localStorage.getItem('user'));

  document.querySelector('#my-email').textContent = user.email;
  document.querySelector('#my-name').textContent = user.username;

  lobbySocket.on('connect', () => {
    lobbySocket.emit('join', user.username);
  });
  
  lobbySocket.on('updatePeople', updatePeople);
  lobbySocket.on('inviteReceived', displayInvite);
  lobbySocket.on('partyUpdated', displayParty);

  initSearchListener();
  initFriendRemoveListener();
  initInviteListener();
  fetchFriends();

  function displayParty(partyList) {
    document.querySelector('#party-members').innerHTML = partyList.map(member => {
      return `<li>${member}</li>`;
    }).join('');
  }


  function initInviteListener() {
    const partyInviteEl = document.querySelector('#party-invite');
  
    partyInviteEl.addEventListener('click', e => {
      const inviter = e.target.closest('div').id.replace('invite-from-', '');
  
      if (e.target.matches('.accept-invite')) lobbySocket.emit('acceptInvite', inviter);
    });
  }

  function initFriendRemoveListener() {
    myFriendList.addEventListener('click', e => {
      if (e.target.matches('.remove-friend')) removeFriend(e.target.dataset.friend);
      if (e.target.matches('.invite')) inviteFriend(e.target.dataset.friend);
    });
  }



  function inviteFriend(friendToInvite) {
    console.log(friendToInvite);
    lobbySocket.emit('inviteFriend', friendToInvite);
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
        <button class="invite" data-friend="${friend}">Invite To Party</button>
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
    </li>`;
  }).join('');
}


function getCurrentUserValue(value) {
  return JSON.parse(localStorage.getItem('user') || '{}')[value];
}

function displayInvite(inviter) {
  const partyInviteEl = document.querySelector('#party-invite');
  // TODO: Add deduplication of invite - or flash existing one

  partyInviteEl.innerHTML += `<div id="invite-from-${inviter}">
      <span class="invitation"> ${inviter} would like to invite you to their party</span>
      <button class="accept-invite">Accept</button>
      <button>Decline</button>
    </div>
  `;
}



