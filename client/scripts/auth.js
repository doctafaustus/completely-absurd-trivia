// Initialize firebase
const firebaseConfig = {
  apiKey: "AIzaSyCPNbwrNgjrpf491e3WJwWQwnNqPJ0R7XE",
  authDomain: "completely-absurd-trivia-b939b.firebaseapp.com",
  databaseURL: "https://completely-absurd-trivia-b939b.firebaseio.com",
  projectId: "completely-absurd-trivia-b939b",
  storageBucket: "completely-absurd-trivia-b939b.appspot.com",
  messagingSenderId: "882068649922",
  appId: "1:882068649922:web:540a53211b1d913bf8885b",
  measurementId: "G-DV7RDPVL0Q"
};

firebase.initializeApp(firebaseConfig);
const googleProvider = new firebase.auth.GoogleAuthProvider();

// Log In
document.querySelector('#log-in').addEventListener('click', logIn);

// Log Out
document.querySelector('#log-out').addEventListener('click', logOut);

// Control loggedIn localStorage when user signs in/out
firebase.auth().onAuthStateChanged(user => {
  if (user) {
    console.log('logged in', user);
  } else {
    console.log('not logged in');
    localStorage.removeItem('user');
  }
});


function logIn() {
  firebase.auth().signInWithPopup(googleProvider).then(result => {
    const user = result.user;
    console.log('user', user);
    addIfNew(user);
  }).catch(error => {
    const { code, message, email, credential } = error;
    console.log(`Error signing in: ${code} - ${message} - ${email} - ${credential}`);
  });
}

function addIfNew(user) {
  fetch('http://localhost:8080/api/add-if-new', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ authUser: user })
  })
  .then(response => response.json())
  .then(data => {
    console.log('/api/add-if-new response: \n', data);
    localStorage.setItem('user', JSON.stringify(data));
  });
}

function logOut() {
  firebase.auth().signOut().then(
    () => {
      console.log('Signed Out');
    },
    error => console.error('Sign Out Error', error)
  );
}
