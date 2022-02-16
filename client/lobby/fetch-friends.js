import { getCurrentUserValue } from '@/utils/user-utils.js';
import utils from '@/utils/utils.js';


export default function fetchFriends() {
  const currentUserID = getCurrentUserValue('id');

  fetch('/fetch-friends', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'CSRF-Token': utils.getCookie('XSRF-TOKEN')
    },
    body: JSON.stringify({ currentUserID })
  })
  .then(response =>response.json())
  .then(data => {
    const friendListHTML = data.map(({ username, id }) => {
      return `<li class="friend-listing" data-status="online">
        <details class="friend-menu" data-friend-id="${id}">
          <summary class="friend-name">
            <img class="friend-avatar" src="/images/avatar-example.jpg">
            ${username}
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

