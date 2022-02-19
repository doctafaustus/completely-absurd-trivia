import { getCurrentUserValue } from '@/utils/user-utils.js';
import utils from '@/utils/utils.js';
import fetchFriends from '@/lobby/fetch-friends.js';


const addFriendForm = document.querySelector('.add-friend-form');
const addFriendInput = addFriendForm.querySelector('.add-friend-input');
const friendCodeInput = addFriendForm.querySelector('.friend-code-input');
const addFriendStatus = addFriendForm.querySelector('.add-friend-status');


export default function addFriendSection(lobbySocket) {

  // Add friend form
  addFriendForm.addEventListener('submit', e => {
    e.preventDefault();

    const friendToAdd = addFriendInput.value;
    const friendCode = friendCodeInput.value;

    if (!friendToAdd) {
      return addFriendStatus.textContent = 'Must enter friend name';
    } else if (!friendCode) {
      return addFriendStatus.textContent = 'Must enter friend code';
    }

    addFriendStatus.textContent = '';
    addFriend(friendToAdd, friendCode);
  });


  // Friend submenu & invite requests
  document.addEventListener('click', ({ target }) => {
  
    // Invite friend
    if (target.matches('.invite-friend')) {
      const friendMenu = target.closest('.friend-menu');
      const friendID = friendMenu.dataset.friendId;
      inviteFriend(friendID, lobbySocket);
      resetMenu(friendMenu);
    }
  
    // Remove friend
    if (target.matches('.remove-friend')) {
      const friendToRemoveID = target.closest('.friend-menu').dataset.friendId;
      removeFriend(friendToRemoveID);
    }

    if (target.matches('.invite-request .close, .decline-invite')) {
      target.closest('.invite-request').remove();
    }
  });
}


function removeFriend(friendToRemoveID) {
  fetch('/remove-friend', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'CSRF-Token': utils.getCookie('XSRF-TOKEN')
    },
    body: JSON.stringify({ friendToRemoveID })
  })
  .then(response => response.json())
  .then(data => {
    console.log('/remove-friend: \n', data);
    fetchFriends();
  });
}

function inviteFriend(friendID, lobbySocket) {
  lobbySocket.emit('inviteFriend', friendID);
}

function resetMenu(friendMenu) {
  const statusEl = friendMenu.querySelector('.invite-status');

  friendMenu.open = false;
  statusEl.textContent = 'invited';
}

function addFriend(friendToAdd, friendCode) {   
  fetch('/add-friend', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'CSRF-Token': utils.getCookie('XSRF-TOKEN')
    },
    body: JSON.stringify({ 
      friendToAdd,
      friendCode
    })
  })
  .then(response => response.json())
  .then(data => {
    console.log('/add-friend: \n', data);

    addFriendStatus.textContent = data.result;
    setTimeout(() => { addFriendStatus.textContent = ''}, 3000);

    if (data.result.includes('Friend added:')) {
      fetchFriends();
      [addFriendInput, friendCodeInput].forEach(input => input.value = '');
    }
  });
}
