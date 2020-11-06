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

}


function updatePeople(lobbyPeople) {
  const playerCount = document.querySelector('#player-count');
  const playerList = document.querySelector('#player-list'); 


  playerCount.textContent = Object.values(lobbyPeople).length;
  playerList.innerHTML = Object.values(lobbyPeople).map(player => {
    return `<li>${player.username}</li>`;
  }).join('');
  

}
