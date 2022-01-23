import { getCurrentUserValue } from '@/utils/user-utils.js';
import fetchFriends from '@/lobby/fetch-friends.js';


const addFriendForm = document.querySelector('.add-friend-form');
const addFriendInput = addFriendForm.querySelector('.add-friend-input');
const addFriendStatus = addFriendForm.querySelector('.add-friend-status');


export default function addFriendSection() {
  addFriendForm.addEventListener('submit', e => {
    e.preventDefault();
    const friendToAdd = addFriendInput.value;
    addFriend(friendToAdd);
  });
}


function addFriend(friendToAdd) {
  const currentUserID = getCurrentUserValue('id');
  const currentUserName = getCurrentUserValue('username');

  if (!currentUserID) return;
   
  fetch('http://localhost:8080/api/add-friend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentUserID, currentUserName, friendToAdd })
  })
  .then(response => response.json())
  .then(data => {
    console.log('/api/add-friend: \n', data);

    addFriendStatus.textContent = data.result;
    setTimeout(() => { addFriendStatus.textContent = ''}, 3000);

    if (data.result.includes('Friend added:')) {
      fetchFriends();
      addFriendInput.value = '';
    }
  });
}
