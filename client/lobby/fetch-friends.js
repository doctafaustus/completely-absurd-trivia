import { getCurrentUserValue } from '@/utils/user-utils.js';


export default function fetchFriends() {
  const currentUserID = getCurrentUserValue('id');

  fetch('http://localhost:8080/api/fetch-friends', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentUserID })
  })
  .then(response =>response.json())
  .then(data => {
    const friendListHTML = data.map(friend => {
      return `<li class="friend-listing" data-status="online">
        <details class="friend-menu" data-friend-username="${friend}">
          <summary class="friend-name">
            <img class="friend-avatar" src="../images/avatar-example.jpg">
            ${friend}
          </summary>
          <button class="lobby-btn invite-friend">
              Invite
          </button>
          <button class="lobby-btn remove-friend">
              Remove
            </button>
        </details>
      </li>`
    }).join(''); 

    const friendList = document.querySelector('.friend-list');
    friendList.innerHTML = friendListHTML;
  });
}

