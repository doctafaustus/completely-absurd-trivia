// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  var error;
  for (var i = 0; i < entry.length; i++) {
    try {
      newRequire(entry[i]);
    } catch (e) {
      // Save first error but execute all entries
      if (!error) {
        error = e;
      }
    }
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  parcelRequire = newRequire;

  if (error) {
    // throw error from earlier, _after updating parcelRequire_
    throw error;
  }

  return newRequire;
})({"utils/utils.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var utils = {
  debounce: function debounce(func, wait, immediate) {
    var timeout;
    return function () {
      var context = this,
          args = arguments;

      var later = function later() {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };

      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    };
  } // getCookie(name) {
  //   const nameEQ = `${name}=`;
  //   const ca = document.cookie.split(';');
  //   for (let i = 0; i < ca.length; i++) {
  //     let c = ca[i];
  //     while (c.charAt(0) === ' ') {
  //       c = c.substring(1, c.length);
  //     }
  //     if (c.indexOf(nameEQ) === 0) {
  //       return c.substring(nameEQ.length, c.length);
  //     }
  //   }
  //   return null;
  // },
  // setCookie(name, value, minutes) {
  //   let expirationFragment = '';
  //   if (minutes) {
  //     const date = new Date();
  //     const ms = minutes * 60 * 1000;
  //     const expiration = date.getTime() + ms;
  //     date.setTime(expiration);
  //     expirationFragment = `; expires=${date.toGMTString()}`;
  //   }
  //   document.cookie = `${name}=${value}${expirationFragment}; path=/`;
  // },
  // deleteCookie(name) {
  //   document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
  // }

};
var _default = utils;
exports.default = _default;
},{}],"scripts/lobby.js":[function(require,module,exports) {
"use strict";

var _utils = _interopRequireDefault(require("../utils/utils.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

document.addEventListener('click', function (_ref) {
  var target = _ref.target;

  // Invite friend
  if (target.matches('.invite-friend')) {
    console.log('Invite friend');
  } // Remove friend


  if (target.matches('.remove-friend')) {
    console.log('Remove friend');
  }
}); // Add friend form

var addFriendForm = document.querySelector('.add-friend-form');
var addFriendInput = addFriendForm.querySelector('.add-friend-input');
var addFriendStatus = addFriendForm.querySelector('.add-friend-status');
addFriendForm.addEventListener('submit', function (e) {
  e.preventDefault();
  addFriendInput.value = '';
  console.log('Submit add friend form');
  addFriendStatus.textContent = 'Friend added!';
  setTimeout(function () {
    addFriendStatus.textContent = '';
  }, 3000);
});
var playerCount = document.querySelector('#player-count');
var playerList = document.querySelector('#player-list');
var myFriendList = document.querySelector('.my-friend-list');
var findFriendResults = document.querySelector('.find-friend-results');
var findFriendInput = document.querySelector('#find-friend-input');

if (localStorage.getItem('user')) {
  console.log('init');
  initLobby();
} else {
  console.log('Not logged in!');
}

function initLobby() {
  var lobbySocket = io('/lobby');
  var user = JSON.parse(localStorage.getItem('user'));
  document.querySelector('#my-email').textContent = user.email;
  document.querySelector('#my-name').textContent = user.username;
  lobbySocket.on('connect', function () {
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
    document.querySelector('#party-members').innerHTML = partyList.map(function (member) {
      return "<li>".concat(member, "</li>");
    }).join('');
  }

  function initInviteListener() {
    var partyInviteEl = document.querySelector('#party-invite');
    partyInviteEl.addEventListener('click', function (e) {
      var inviter = e.target.closest('div').id.replace('invite-from-', '');
      if (e.target.matches('.accept-invite')) lobbySocket.emit('acceptInvite', inviter);
    });
  }

  function initFriendRemoveListener() {
    myFriendList.addEventListener('click', function (e) {
      if (e.target.matches('.remove-friend')) removeFriend(e.target.dataset.friend);
      if (e.target.matches('.invite')) inviteFriend(e.target.dataset.friend);
    });
  }

  function inviteFriend(friendToInvite) {
    console.log(friendToInvite);
    lobbySocket.emit('inviteFriend', friendToInvite);
  }

  function removeFriend(friendToRemove) {
    var currentUserID = getCurrentUserValue('id');
    if (!currentUserID) return;
    fetch('/api/remove-friend', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        currentUserID: currentUserID,
        friendToRemove: friendToRemove
      })
    }).then(function (response) {
      return response.json();
    }).then(function (data) {
      console.log('/api/remove-friend: \n', data);
      fetchFriends();
    });
  }
}

function fetchFriends() {
  var currentUserID = getCurrentUserValue('id');
  fetch('/api/fetch-friends', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      currentUserID: currentUserID
    })
  }).then(function (response) {
    return response.json();
  }).then(function (data) {
    console.log('/api/fetch-friends: \n', data);
    var myFriendListHTML = data.map(function (friend) {
      return "<li class=\"friend\">\n        <span>".concat(friend, "</span>\n        <button class=\"invite\" data-friend=\"").concat(friend, "\">Invite To Party</button>\n        <button class=\"remove-friend\" data-friend=\"").concat(friend, "\">Remove Friend</button>\n      </li>");
    }).join('');
    myFriendList.innerHTML = myFriendListHTML;
  });
}

function initSearchListener() {
  var debounceThreshold = 100;
  findFriendInput.addEventListener('keyup', _utils.default.debounce(function (e) {
    var value = e.target.value;
    if (value.trim() === '') return findFriendResults.innerHTML = '';
    fetch('/api/find-friend', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        searchTerm: value
      })
    }).then(function (response) {
      return response.json();
    }).then(function (data) {
      console.log('/api/find-friend: \n', data);
      buildSearchResultList(data);
    });
  }, debounceThreshold));
  findFriendResults.addEventListener('click', function (e) {
    if (e.target.matches('.add-friend')) addFriend(e.target.dataset.friend);
  });
}

function buildSearchResultList(results) {
  var currentUserUsername = getCurrentUserValue('username');
  var filteredResults = results.filter(function (result) {
    return result !== currentUserUsername;
  });
  var findFriendResultsHTML = filteredResults.map(function (friend) {
    return "<li class=\"friend-item\">\n      <span>".concat(friend, "</span>\n      <button class=\"add-friend\" data-friend=\"").concat(friend, "\">Add Friend</button>\n    </li>");
  }).join('');
  if (!findFriendResultsHTML) findFriendResultsHTML = '<li>No results found</li>';
  findFriendResults.innerHTML = findFriendResultsHTML;
}

function addFriend(friendToAdd) {
  var currentUserID = getCurrentUserValue('id');
  if (!currentUserID) return;
  fetch('/api/add-friend', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      currentUserID: currentUserID,
      friendToAdd: friendToAdd
    })
  }).then(function (response) {
    return response.json();
  }).then(function (data) {
    console.log('/api/add-friend: \n', data);
    fetchFriends();
  });
}

function updatePeople(lobbyPeople) {
  playerCount.textContent = Object.values(lobbyPeople).length;
  playerList.innerHTML = Object.values(lobbyPeople).map(function (player) {
    return "<li>\n      <span class=\"player\">".concat(player.username, "</span>\n    </li>");
  }).join('');
}

function getCurrentUserValue(value) {
  return JSON.parse(localStorage.getItem('user') || '{}')[value];
}

function displayInvite(inviter) {
  var partyInviteEl = document.querySelector('#party-invite'); // TODO: Add deduplication of invite - or flash existing one

  partyInviteEl.innerHTML += "<div id=\"invite-from-".concat(inviter, "\">\n      <span class=\"invitation\"> ").concat(inviter, " would like to invite you to their party</span>\n      <button class=\"accept-invite\">Accept</button>\n      <button>Decline</button>\n    </div>\n  ");
}
},{"../utils/utils.js":"utils/utils.js"}],"../../../Users/Bill/AppData/Roaming/npm/node_modules/parcel-bundler/src/builtins/hmr-runtime.js":[function(require,module,exports) {
var global = arguments[3];
var OVERLAY_ID = '__parcel__error__overlay__';
var OldModule = module.bundle.Module;

function Module(moduleName) {
  OldModule.call(this, moduleName);
  this.hot = {
    data: module.bundle.hotData,
    _acceptCallbacks: [],
    _disposeCallbacks: [],
    accept: function (fn) {
      this._acceptCallbacks.push(fn || function () {});
    },
    dispose: function (fn) {
      this._disposeCallbacks.push(fn);
    }
  };
  module.bundle.hotData = null;
}

module.bundle.Module = Module;
var checkedAssets, assetsToAccept;
var parent = module.bundle.parent;

if ((!parent || !parent.isParcelRequire) && typeof WebSocket !== 'undefined') {
  var hostname = "" || location.hostname;
  var protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  var ws = new WebSocket(protocol + '://' + hostname + ':' + "59770" + '/');

  ws.onmessage = function (event) {
    checkedAssets = {};
    assetsToAccept = [];
    var data = JSON.parse(event.data);

    if (data.type === 'update') {
      var handled = false;
      data.assets.forEach(function (asset) {
        if (!asset.isNew) {
          var didAccept = hmrAcceptCheck(global.parcelRequire, asset.id);

          if (didAccept) {
            handled = true;
          }
        }
      }); // Enable HMR for CSS by default.

      handled = handled || data.assets.every(function (asset) {
        return asset.type === 'css' && asset.generated.js;
      });

      if (handled) {
        console.clear();
        data.assets.forEach(function (asset) {
          hmrApply(global.parcelRequire, asset);
        });
        assetsToAccept.forEach(function (v) {
          hmrAcceptRun(v[0], v[1]);
        });
      } else if (location.reload) {
        // `location` global exists in a web worker context but lacks `.reload()` function.
        location.reload();
      }
    }

    if (data.type === 'reload') {
      ws.close();

      ws.onclose = function () {
        location.reload();
      };
    }

    if (data.type === 'error-resolved') {
      console.log('[parcel] ✨ Error resolved');
      removeErrorOverlay();
    }

    if (data.type === 'error') {
      console.error('[parcel] 🚨  ' + data.error.message + '\n' + data.error.stack);
      removeErrorOverlay();
      var overlay = createErrorOverlay(data);
      document.body.appendChild(overlay);
    }
  };
}

function removeErrorOverlay() {
  var overlay = document.getElementById(OVERLAY_ID);

  if (overlay) {
    overlay.remove();
  }
}

function createErrorOverlay(data) {
  var overlay = document.createElement('div');
  overlay.id = OVERLAY_ID; // html encode message and stack trace

  var message = document.createElement('div');
  var stackTrace = document.createElement('pre');
  message.innerText = data.error.message;
  stackTrace.innerText = data.error.stack;
  overlay.innerHTML = '<div style="background: black; font-size: 16px; color: white; position: fixed; height: 100%; width: 100%; top: 0px; left: 0px; padding: 30px; opacity: 0.85; font-family: Menlo, Consolas, monospace; z-index: 9999;">' + '<span style="background: red; padding: 2px 4px; border-radius: 2px;">ERROR</span>' + '<span style="top: 2px; margin-left: 5px; position: relative;">🚨</span>' + '<div style="font-size: 18px; font-weight: bold; margin-top: 20px;">' + message.innerHTML + '</div>' + '<pre>' + stackTrace.innerHTML + '</pre>' + '</div>';
  return overlay;
}

function getParents(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return [];
  }

  var parents = [];
  var k, d, dep;

  for (k in modules) {
    for (d in modules[k][1]) {
      dep = modules[k][1][d];

      if (dep === id || Array.isArray(dep) && dep[dep.length - 1] === id) {
        parents.push(k);
      }
    }
  }

  if (bundle.parent) {
    parents = parents.concat(getParents(bundle.parent, id));
  }

  return parents;
}

function hmrApply(bundle, asset) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (modules[asset.id] || !bundle.parent) {
    var fn = new Function('require', 'module', 'exports', asset.generated.js);
    asset.isNew = !modules[asset.id];
    modules[asset.id] = [fn, asset.deps];
  } else if (bundle.parent) {
    hmrApply(bundle.parent, asset);
  }
}

function hmrAcceptCheck(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (!modules[id] && bundle.parent) {
    return hmrAcceptCheck(bundle.parent, id);
  }

  if (checkedAssets[id]) {
    return;
  }

  checkedAssets[id] = true;
  var cached = bundle.cache[id];
  assetsToAccept.push([bundle, id]);

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    return true;
  }

  return getParents(global.parcelRequire, id).some(function (id) {
    return hmrAcceptCheck(global.parcelRequire, id);
  });
}

function hmrAcceptRun(bundle, id) {
  var cached = bundle.cache[id];
  bundle.hotData = {};

  if (cached) {
    cached.hot.data = bundle.hotData;
  }

  if (cached && cached.hot && cached.hot._disposeCallbacks.length) {
    cached.hot._disposeCallbacks.forEach(function (cb) {
      cb(bundle.hotData);
    });
  }

  delete bundle.cache[id];
  bundle(id);
  cached = bundle.cache[id];

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    cached.hot._acceptCallbacks.forEach(function (cb) {
      cb();
    });

    return true;
  }
}
},{}]},{},["../../../Users/Bill/AppData/Roaming/npm/node_modules/parcel-bundler/src/builtins/hmr-runtime.js","scripts/lobby.js"], null)
//# sourceMappingURL=/lobby.bf1c6fc4.js.map