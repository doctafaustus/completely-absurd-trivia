import myFriendsSection from '@/lobby/my-friends-section.js';
import fetchFriends from '@/lobby/fetch-friends.js';


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


  myFriendsSection(lobbySocket);

  // Populate user data
  document.querySelector('.username').textContent = user.username;
  document.querySelector('.friend-code-val').textContent = user.friendCode;

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

  // Decline party invitation
  document.addEventListener('click', ({ target }) => {
    if (target.matches('.decline-invite')) {
      const invite = target.closest('.invite-request');
      invite.remove();
    }
  });



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
  console.log('displayInvite', inviter);

  const inviteToast = `
    <div class="toast invite-request">
      <div class="invite-message">
        ${inviter} would like to invite you to their party! 🥳
      </div>
      <div class="invite-actions">
        <button class="invite-action accept-invite">Accept</button>
        <button class="invite-action decline-invite">Decline</button>
      </div>
      <img class="close" src="/images/x.png">
    </div>
  `;

  const toastsContainer = document.querySelector('.toasts-container');
  toastsContainer.insertAdjacentHTML('afterbegin', inviteToast);
}



