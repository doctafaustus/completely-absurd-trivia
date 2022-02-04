import utils from '@/utils/utils.js';

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
firebase.auth().setPersistence(firebase.auth.Auth.Persistence.NONE);


const googleProvider = new firebase.auth.GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});


// Log In
document.querySelector('#log-in').addEventListener('click', logIn);

function logIn() {
  firebase.auth().signInWithPopup(googleProvider).then(result => {
    const user = result.user;
    console.log('signed in:', user);

    user.getIdToken().then(idToken => {
      fetch('/session-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'CSRF-Token': utils.getCookie('XSRF-TOKEN')
        },
        body: JSON.stringify({ idToken })
      })
      .then(() => {
        console.log('Login successful');
        addIfNew(user);
        firebase.auth().signOut();
      })
      .catch(err => {
        console.error('ERROR:', err);
      });
    });
  }).catch(error => {
    const { code, message, email, credential } = error;
    console.log(`Error signing in: ${code} - ${message} - ${email} - ${credential}`);
  });
}

function addIfNew(user) {
  fetch('/add-if-new', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'CSRF-Token': utils.getCookie('XSRF-TOKEN')
    },
    body: JSON.stringify({ authUser: user })
  })
  .then(response => response.json())
  .then(data => {
    console.log('/add-if-new response: \n', data);
    localStorage.setItem('user', JSON.stringify(data));
  });
}
