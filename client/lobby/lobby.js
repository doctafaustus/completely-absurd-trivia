import addFriendSection from '@/lobby/add-friend-section.js';
import { getCurrentUserValue } from '@/utils/user-utils.js';
import fetchFriends from '@/lobby/fetch-friends.js';

addFriendSection();

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



const playerCount = document.querySelector('#player-count');
const playerList = document.querySelector('#player-list'); 
const allPlayers = document.querySelector('.all-players'); 

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
  const lobbySocket = io('http://localhost:8080/lobby');
  const user = JSON.parse(localStorage.getItem('user'));

  // Populate user data
  document.querySelector('.username').textContent = user.username;

  document.querySelector('#my-email').textContent = user.email;
  document.querySelector('#my-name').textContent = user.username;

  lobbySocket.on('connect', () => {
    lobbySocket.emit('join', user.username);
  });
  
  lobbySocket.on('updatePeople', updatePeople);
  lobbySocket.on('inviteReceived', displayInvite);
  lobbySocket.on('partyUpdated', displayParty);

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
     
    fetch('http://localhost:8080/api/remove-friend', {
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




function updatePeople(lobbyPeople) {
  playerCount.textContent = Object.values(lobbyPeople).length;
  allPlayers.innerHTML = Object.values(lobbyPeople).map(player => {
    return `<li>
      <span class="player">${player.username}</span>
    </li>`;
  }).join('');
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



