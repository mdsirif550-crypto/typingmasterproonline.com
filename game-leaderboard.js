(function () {
  const firebaseConfig = {
    apiKey: "AIzaSyBdg7ULfChhdMSGMy4DiB5AvX0egXgz84E",
    authDomain: "eirnbooster.firebaseapp.com",
    databaseURL: "https://eirnbooster-default-rtdb.firebaseio.com",
    projectId: "eirnbooster",
    storageBucket: "eirnbooster.firebasestorage.app",
    messagingSenderId: "1062288115898",
    appId: "1:1062288115898:web:952df73a31a3acdc2e5a83"
  };
  const monthKey = () => {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Dhaka",
      year: "numeric",
      month: "2-digit"
    }).formatToParts(new Date());
    const year = parts.find(part => part.type === "year").value;
    const month = parts.find(part => part.type === "month").value;
    return `${year}-${month}`;
  };
  const finiteNumber = value => Number.isFinite(Number(value)) ? Number(value) : 0;
  const getSharedPresenceGuestId = () => {
    try {
      const storedId = localStorage.getItem("typingMasterGuestPresenceId");
      if (storedId && String(storedId).trim()) return String(storedId).trim();
      const nextId = `guest_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
      localStorage.setItem("typingMasterGuestPresenceId", nextId);
      return nextId;
    } catch (error) {
      console.warn("Could not read the shared guest presence id:", error);
      return `guest_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
    }
  };
  let presenceDatabase = null;
  let presenceConnectionRef = null;
  let presenceRef = null;
  let presenceSessionId = null;
  let presenceUserId = null;
  let presenceUser = null;
  let presenceConnected = false;
  let typingActive = false;
  let typingWpm = 0;
  let typingIdleTimer = null;
  let lastTypingUpdateAt = 0;
  let latestLeaderboardUsers = null;
  const setStatus = (message, isError) => {
    document.querySelectorAll("[data-game-leaderboard-status]").forEach(element => {
      element.textContent = message;
      element.classList.toggle("game-leaderboard-error", Boolean(isError));
      element.classList.toggle("sync-error", Boolean(isError));
    });
  };

  function readPresenceUser() {
    try {
      const user = JSON.parse(localStorage.getItem("currentUser") || "null");
      if (user && typeof user.id === "string" && user.id.trim()) {
        return user;
      }
      return {
        id: getSharedPresenceGuestId(),
        name: "Guest",
        guest: true
      };
    } catch (error) {
      console.error("Could not read the game presence account:", error);
      setStatus("লগ ইন তথ্য পড়া যায়নি; লাইভ টাইপিং দেখানো যাচ্ছে না।", true);
      return {
        id: getSharedPresenceGuestId(),
        name: "Guest",
        guest: true
      };
    }
  }

  function updateTypingPresence(active, wpm = 0) {
    const wasTyping = typingActive;
    typingActive = active;
    typingWpm = active ? Math.max(0, Math.round(finiteNumber(wpm))) : 0;
    clearTimeout(typingIdleTimer);
    if (active) typingIdleTimer = setTimeout(() => setTypingStatus(false), 5000);
    if (!presenceRef || !presenceConnected) return;
    const now = Date.now();
    if (!active || !wasTyping || now - lastTypingUpdateAt >= 1000) {
      lastTypingUpdateAt = now;
      presenceRef.update({
        typing: active,
        wpm: typingWpm,
        lastSeen: firebase.database.ServerValue.TIMESTAMP
      }).catch(error => {
        console.error("Game typing presence update failed:", error);
        setStatus("লাইভ টাইপিং স্পিড আপডেট করা যায়নি।", true);
      });
    }
  }

  function syncPresenceAccount() {
    const user = readPresenceUser();
    const nextUserId = user && user.id ? String(user.id).trim() : "";
    if (nextUserId === presenceUserId) {
      presenceUser = user;
      return;
    }
    if (presenceRef) {
      const previousRef = presenceRef;
      previousRef.onDisconnect().cancel().catch(error =>
        console.error("Could not cancel the previous game presence:", error)
      );
      previousRef.remove().catch(error =>
        console.error("Could not clear the previous game presence:", error)
      );
    }
    presenceRef = null;
    presenceUserId = nextUserId || null;
    presenceUser = user;
    if (!presenceUserId) return;
    if (/[.#$/\[\]]/.test(presenceUserId)) {
      setStatus("এই অ্যাকাউন্ট আইডি দিয়ে লাইভ টাইপিং দেখানো যাচ্ছে না।", true);
      presenceUserId = null;
      presenceUser = null;
      return;
    }
    if (!presenceDatabase || !presenceSessionId) return;
    presenceRef = presenceDatabase.ref(
      `online_users/${presenceUserId}/connections/${presenceSessionId}`
    );
    if (presenceConnected) registerTypingPresence();
  }

  function registerTypingPresence() {
    if (!presenceRef || !presenceConnected || !presenceUser) return;
    const ref = presenceRef;
    const userName = presenceUser.name || presenceUser.id || "Guest";
    ref.onDisconnect().remove().then(() => ref.set({
      uid: presenceUser.id,
      name: userName,
      online: true,
      typing: false,
      wpm: 0,
      lastSeen: firebase.database.ServerValue.TIMESTAMP
    })).then(() => {
      lastTypingUpdateAt = 0;
      if (typingActive) updateTypingPresence(true, typingWpm);
    }).catch(error => {
      console.error("Game typing presence registration failed:", error);
      setStatus("লাইভ টাইপিং সংযোগ করা যায়নি।", true);
    });
  }

  function initPresence() {
    if (presenceConnectionRef) return;
    if (!window.firebase || !firebase.database) {
      setStatus("Firebase সংযোগ নেই; লাইভ টাইপিং দেখানো যাচ্ছে না।", true);
      return;
    }
    try {
      if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
      presenceDatabase = firebase.database();
      presenceSessionId = presenceDatabase.ref("online_users").push().key;
      if (!presenceSessionId) throw new Error("Could not create a game presence session.");
      presenceConnectionRef = presenceDatabase.ref(".info/connected");
      presenceConnectionRef.on("value", snapshot => {
        presenceConnected = snapshot.val() === true;
        if (presenceConnected) {
          const previousUserId = presenceUserId;
          syncPresenceAccount();
          if (previousUserId === presenceUserId) registerTypingPresence();
        }
      }, error => {
        console.error("Game presence connection listener failed:", error);
        setStatus("লাইভ টাইপিং সংযোগ যাচাই করা যায়নি।", true);
      });
      window.addEventListener("storage", event => {
        if (event.key === "currentUser") syncPresenceAccount();
      });
      syncPresenceAccount();
    } catch (error) {
      console.error("Game typing presence initialization failed:", error);
      setStatus("লাইভ টাইপিং চালু করা যায়নি।", true);
    }
  }

  function setTypingStatus(active, wpm = 0) {
    if (!presenceConnectionRef) initPresence();
    updateTypingPresence(active, wpm);
  }

  function setAccountStatus(message, isError) {
    const element = document.querySelector("[data-game-account-status]");
    if (!element) return;
    element.textContent = message;
    element.classList.toggle("game-leaderboard-error", Boolean(isError));
  }

  function ensurePanel() {
    let panel = document.querySelector("[data-game-leaderboard]");

    const style = document.createElement("style");
    style.textContent = ".game-account,.game-leaderboard{max-width:1050px;margin:18px auto;padding:18px;border:1px solid #d7e4f2;border-radius:18px;background:#fff;box-shadow:0 5px 18px #17406a12;font-family:Arial,Helvetica,sans-serif;color:#17365d}.game-account h2,.game-leaderboard h2,.game-leaderboard h3{margin:0 0 6px}.game-account-status,.game-leaderboard-status,.game-live-status{margin:0 0 12px;color:#65758e;font-size:13px}.game-leaderboard-error{color:#bd3348}.game-account-fields{display:grid;grid-template-columns:1fr 1fr auto;gap:9px}.game-account input{width:100%;min-width:0;padding:10px 12px;border:1px solid #cbd9e9;border-radius:10px;font:inherit}.game-account button{padding:10px 16px;border:0;border-radius:10px;background:#236ff0;color:#fff;font-weight:700;cursor:pointer}.game-account button:disabled{opacity:.6;cursor:wait}.game-account-logged{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}.game-account-logout{background:#eaf2ff!important;color:#1658b6!important}.game-leaderboard-list,.game-live-list{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;padding:0;margin:0;list-style:none}.game-live-list{grid-template-columns:repeat(auto-fit,minmax(160px,1fr));margin-top:8px}.game-leaderboard-entry,.game-live-entry{display:flex;align-items:center;gap:8px;min-width:0;padding:12px;border:1px solid #d8e8f5;border-radius:13px;background:#f7fbff}.game-live-entry{flex-direction:column;align-items:flex-start;gap:4px;background:linear-gradient(135deg,#f2f9ff,#edf7ff)}.game-live-entry.is-typing{border-color:#98d2a8;background:linear-gradient(135deg,#eafdf3,#f3fff9)}.game-leaderboard-name,.game-live-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:800}.game-live-meta{display:flex;justify-content:space-between;align-items:center;width:100%;gap:6px}.game-live-state{font-size:11px;font-weight:700;padding:4px 7px;border-radius:999px;background:#dfeeff;color:#1557a5}.game-live-state.typing{background:#dff9ea;color:#0c7f4a}.game-leaderboard-score,.game-live-score{margin-left:auto;white-space:nowrap;color:#1677ef;font-size:12px;font-weight:800}.game-live-score{margin-left:0}.game-leaderboard-empty,.game-live-empty{grid-column:1/-1;color:#65758e}@media(max-width:650px){.game-account,.game-leaderboard{margin:14px 12px}.game-account-fields{grid-template-columns:1fr}.game-leaderboard-list,.game-live-list{grid-template-columns:1fr}}";
    style.textContent += ".game-my-rank{display:flex;align-items:center;gap:12px;margin:12px 0 18px;padding:12px;border:2px solid #8bb9ff;border-radius:14px;background:linear-gradient(110deg,#eff6ff,#f8fbff);color:inherit;text-decoration:none}.game-my-rank[hidden]{display:none}.game-my-rank-avatar{width:48px;height:48px;flex:none;border:3px solid #4f8ff7;border-radius:50%;object-fit:cover;background:#fff}.game-my-rank-info{display:flex;flex:1;min-width:0;flex-direction:column;gap:3px}.game-my-rank-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:800}.game-my-rank-id{color:#65758e;font-size:12px}.game-my-rank-badge{color:#1688e8}.game-my-rank-values{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:6px}.game-my-rank-values span{padding:6px 9px;border-radius:9px;background:#fff;color:#1658b6;font-size:12px;font-weight:800;white-space:nowrap}.game-my-rank:hover{border-color:#3479e6;box-shadow:0 4px 14px #2466ad20}@media(max-width:480px){.game-my-rank{gap:8px;padding:9px}.game-my-rank-avatar{width:40px;height:40px}.game-my-rank-values{flex-direction:column;gap:4px}.game-my-rank-values span{padding:4px 6px;font-size:11px}}";
    document.head.appendChild(style);
    if (!panel) {
    panel = document.createElement("section");
    panel.className = "game-leaderboard";
    panel.setAttribute("data-game-leaderboard", "");
    const heading = document.createElement("h2");
    heading.textContent = "🏆 মাসের সেরা ৩ খেলোয়াড়";
    const status = document.createElement("p");
    status.className = "game-leaderboard-status";
    status.setAttribute("data-game-leaderboard-status", "");
    status.textContent = "লিডারবোর্ড লোড হচ্ছে…";
    const list = document.createElement("ol");
    list.className = "game-leaderboard-list";
    list.setAttribute("data-game-leaderboard-list", "");
    const myRank = document.createElement("a");
    myRank.className = "game-my-rank";
    myRank.setAttribute("data-game-my-rank", "");
    myRank.hidden = true;
    myRank.innerHTML = '<img class="game-my-rank-avatar" alt="প্রোফাইল ছবি"><span class="game-my-rank-info"><strong class="game-my-rank-name"></strong><small class="game-my-rank-id"></small></span><span class="game-my-rank-values"><span data-my-rank-position></span><span data-my-rank-monthly></span><span data-my-rank-total></span></span>';
    const liveHeading = document.createElement("h3");
    liveHeading.textContent = "📡 এখন টাইপ করছে";
    const liveStatus = document.createElement("p");
    liveStatus.className = "game-live-status";
    liveStatus.setAttribute("data-game-live-status", "");
    liveStatus.textContent = "কেউ এখন টাইপ করছে না।";
    const liveList = document.createElement("ul");
    liveList.className = "game-live-list";
    liveList.setAttribute("data-game-live-list", "");
    const home = document.createElement("a");
    home.href = "index.html";
    home.textContent = "হোম পেজে যান";
    home.style.cssText = "display:inline-block;margin-top:12px;color:#1677ef;font-weight:700";
    panel.append(heading, status, list, myRank, liveHeading, liveStatus, liveList, home);
    const footer = document.querySelector("footer");
    if (footer) footer.before(panel);
    else document.body.appendChild(panel);
    }
    return panel;
  }

  function updateAccount() {
    let user = null;
    try {
      user = JSON.parse(localStorage.getItem("currentUser") || "null");
    } catch (error) {
      console.error("Could not read the signed-in user:", error);
      setAccountStatus("লগ ইন তথ্য পড়া যায়নি। আবার লগ ইন করুন।", true);
    }

    const form = document.querySelector("[data-game-account-form]");
    const loggedIn = document.querySelector("[data-game-account-logged]");
    if (!form || !loggedIn) return;
    const hasUser = Boolean(user && typeof user.id === "string" && user.id);
    form.hidden = hasUser;
    loggedIn.hidden = !hasUser;
    if (hasUser) {
      document.querySelector("[data-game-account-name]").textContent =
        `লগ ইন করেছেন: ${user.name || user.id}`;
      setAccountStatus("আপনার গেমের পয়েন্ট এই অ্যাকাউন্টের লিডারবোর্ডে যোগ হবে।", false);
    } else if (document.querySelector("[data-game-account-status]").textContent === "") {
      setAccountStatus("বিদ্যমান অ্যাকাউন্টে লগ ইন করুন, অথবা নতুন User ID ও পাসওয়ার্ড দিয়ে অ্যাকাউন্ট খুলুন।", false);
    }
    if (latestLeaderboardUsers) renderTopThree(latestLeaderboardUsers);
  }

  async function handleLogin(event) {
    event.preventDefault();
    const form = document.querySelector("[data-game-account-form]");
    const userId = form.querySelector('input[autocomplete="username"]');
    const password = form.querySelector('input[autocomplete="current-password"]');
    const submit = form.querySelector('button[type="submit"]');
    const rawId = userId.value.trim();
    const pass = password.value.trim();
    if (!rawId || !pass) {
      setAccountStatus("User ID এবং পাসওয়ার্ড লিখুন।", true);
      return;
    }

    const normalizedId = rawId.toLowerCase();
    if (/[.#$/\[\]]/.test(normalizedId)) {
      setAccountStatus("User ID-তে . # $ / [ ] ব্যবহার করা যাবে না।", true);
      return;
    }
    if (!window.firebase || !firebase.database) {
      setAccountStatus("Firebase সংযোগ নেই; লগ ইন করা যায়নি।", true);
      return;
    }

    submit.disabled = true;
    setAccountStatus("লগ ইন হচ্ছে…", false);
    try {
      if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
      const snapshot = await firebase.database().ref("users").once("value");
      const users = snapshot.val() || {};
      const identity = rawId.toLowerCase();
      const match = Object.keys(users).find(id => id.toLowerCase() === identity) ||
        Object.keys(users).find(id => users[id] &&
          String(users[id].name || "").toLowerCase() === identity);

      let user;
      if (match) {
        user = { id: match, ...users[match] };
        if (user.password !== pass) {
          setAccountStatus("পাসওয়ার্ড সঠিক নয়।", true);
          return;
        }
      } else {
        const month = monthKey();
        user = {
          id: normalizedId,
          name: rawId,
          password: pass,
          points: 0,
          monthlyPoints: 0,
          monthlyPointsMonth: month,
          mistakes: 0,
          bestWpm: 0,
          pic: "",
          bio: ""
        };
        await firebase.database().ref(`users/${normalizedId}`).set(user);
      }

      localStorage.setItem("currentUser", JSON.stringify(user));
      updateAccount();
      syncPresenceAccount();
      setStatus(`লগ ইন করেছেন: ${user.name || user.id}`, false);
      userId.value = "";
      password.value = "";
    } catch (error) {
      console.error("Game account login failed:", error);
      setAccountStatus("লগ ইন/রেজিস্টার করা যায়নি। সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।", true);
    } finally {
      submit.disabled = false;
    }
  }

  function renderTopThree(users) {
    const list = document.querySelector("[data-game-leaderboard-list]");
    if (!list) return;
    latestLeaderboardUsers = users || {};
    const month = monthKey();
    const allPlayers = Object.keys(latestLeaderboardUsers).map(id => {
      const user = latestLeaderboardUsers[id] || {};
      return {
        id,
        name: user.name || id,
        pic: user.pic || "",
        verifiedBadge: user.verifiedBadge === true,
        points: finiteNumber(user.points),
        monthlyPoints: user.monthlyPointsMonth === month ? finiteNumber(user.monthlyPoints) : 0
      };
    }).sort((a, b) => b.monthlyPoints - a.monthlyPoints || b.points - a.points);
    const ranking = allPlayers.slice(0, 3);

    list.replaceChildren();
    if (allPlayers.length === 0) {
      const empty = document.createElement("li");
      empty.className = "game-leaderboard-empty";
      empty.textContent = "এখনো কোনো খেলোয়াড় নেই।";
      list.appendChild(empty);
    }

    const medals = ["🥇", "🥈", "🥉"];
    ranking.forEach((user, index) => {
      const item = document.createElement("li");
      item.className = "game-leaderboard-entry";
      const rank = document.createElement("strong");
      rank.textContent = medals[index];
      const name = document.createElement("span");
      name.className = "game-leaderboard-name";
      name.textContent = user.name;
      const score = document.createElement("span");
      score.className = "game-leaderboard-score";
      score.textContent = `${user.monthlyPoints} মাসিক পয়েন্ট`;
      item.append(rank, name, score);
      list.appendChild(item);
    });

    const myRank = document.querySelector("[data-game-my-rank]");
    let currentUser = null;
    try {
      currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
    } catch (error) {
      console.error("Could not read the signed-in user for leaderboard rank:", error);
    }
    if (!myRank) return;
    const player = currentUser && allPlayers.find(user => user.id === String(currentUser.id || ""));
    if (!player) {
      myRank.hidden = true;
      return;
    }
    myRank.href = `profile.html?id=${encodeURIComponent(player.id)}`;
    const avatar = myRank.querySelector(".game-my-rank-avatar");
    avatar.onerror = () => {
      avatar.onerror = null;
      avatar.src = "logo.png";
    };
    avatar.src = player.pic || "logo.png";
    const name = myRank.querySelector(".game-my-rank-name");
    name.textContent = player.name;
    name.querySelector(".game-my-rank-badge")?.remove();
    if (player.verifiedBadge) {
      const badge = document.createElement("span");
      badge.className = "game-my-rank-badge";
      badge.textContent = " ✓";
      badge.title = "ভেরিফায়েড প্রোফাইল";
      name.appendChild(badge);
    }
    myRank.querySelector(".game-my-rank-id").textContent = `ID: ${player.id}`;
    myRank.querySelector("[data-my-rank-position]").textContent = `র‍্যাংক #${allPlayers.indexOf(player) + 1}`;
    myRank.querySelector("[data-my-rank-monthly]").textContent = `${player.monthlyPoints} মাসিক পয়েন্ট`;
    myRank.querySelector("[data-my-rank-total]").textContent = `${player.points} মোট পয়েন্ট`;
    myRank.hidden = false;
  }

  function renderLiveTyping(entries) {
    const list = document.querySelector("[data-game-live-list]");
    const status = document.querySelector("[data-game-live-status]");
    if (!list) return;

    const liveList = [];
    const source = entries || {};
    Object.keys(source).forEach(userId => {
      const user = source[userId] || {};
      const connections = user.connections && typeof user.connections === "object" ? user.connections : {};
      Object.keys(connections).forEach(connectionId => {
        const connection = connections[connectionId] || {};
        const lastSeen = Number(connection.lastSeen || 0);
        const isTyping = Boolean(connection.typing);
        const staleMs = Date.now() - lastSeen;
        if (!isTyping && staleMs > 15000) return;
        liveList.push({
          id: connection.uid || userId,
          name: connection.name || user.name || userId,
          typing: isTyping,
          wpm: Math.max(0, Number(connection.wpm || 0)),
          lastSeen
        });
      });
    });

    liveList.sort((a, b) => (b.typing ? 1 : 0) - (a.typing ? 1 : 0) || b.wpm - a.wpm || b.lastSeen - a.lastSeen);
    list.replaceChildren();

    if (!liveList.length) {
      const empty = document.createElement("li");
      empty.className = "game-live-empty";
      empty.textContent = "কেউ এখন টাইপ করছে না।";
      list.appendChild(empty);
      if (status) {
        status.textContent = "কেউ এখন টাইপ করছে না।";
        status.hidden = false;
      }
      return;
    }

    liveList.slice(0, 6).forEach(entry => {
      const item = document.createElement("li");
      item.className = `game-live-entry${entry.typing ? " is-typing" : ""}`;
      const meta = document.createElement("div");
      meta.className = "game-live-meta";
      const name = document.createElement("span");
      name.className = "game-live-name";
      name.textContent = entry.name;
      const state = document.createElement("span");
      state.className = `game-live-state${entry.typing ? " typing" : ""}`;
      state.textContent = entry.typing ? "টাইপ করছে" : "লাইভ";
      meta.append(name, state);
      const score = document.createElement("span");
      score.className = "game-live-score";
      score.textContent = `${entry.wpm} WPM`;
      item.append(meta, score);
      list.appendChild(item);
    });

    if (status) {
      status.textContent = `লাইভ: ${liveList.length} জন`;
      status.hidden = false;
    }
  }

  function init() {
    ensurePanel();
    updateAccount();
    const accountForm = document.querySelector("[data-game-account-form]");
    const logoutButton = document.querySelector("[data-game-account-logout]");
    if (accountForm) {
      accountForm.addEventListener("submit", handleLogin);
    }
    if (logoutButton) {
      logoutButton.addEventListener("click", () => {
        localStorage.removeItem("currentUser");
        updateAccount();
        syncPresenceAccount();
        setStatus("পয়েন্ট জমা করতে লগ ইন করুন।", false);
      });
    }
    if (!window.firebase || !firebase.database) {
      setStatus("লিডারবোর্ড লোড হয়নি। ইন্টারনেট সংযোগ ও Firebase SDK পরীক্ষা করুন।", true);
      return;
    }
    try {
      if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
      initPresence();
      firebase.database().ref("users").on("value", snapshot => {
        renderTopThree(snapshot.val());
      }, error => {
        console.error("Leaderboard load failed:", error);
        setStatus("লিডারবোর্ড লোড করা যায়নি। পরে আবার চেষ্টা করুন।", true);
      });
      firebase.database().ref("online_users").on("value", snapshot => {
        renderLiveTyping(snapshot.val());
      }, error => {
        console.error("Live typing leaderboard load failed:", error);
      });

      const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
      if (currentUser && currentUser.id) {
        setStatus(`লগ ইন করেছেন: ${currentUser.name || currentUser.id}`, false);
      } else {
        setStatus("পয়েন্ট জমা করতে উপরের লগ ইন ফর্ম ব্যবহার করুন।", false);
      }
    } catch (error) {
      console.error("Leaderboard initialization failed:", error);
      setStatus("লিডারবোর্ড চালু করা যায়নি। পরে আবার চেষ্টা করুন।", true);
    }
  }

  function save(correctChars, wpm, mistakes, extra = {}) {
    const probableMistakes = (mistakes && typeof mistakes === "object") ? (
      Number(mistakes.mistakes ?? mistakes.errors ?? mistakes.wrong ?? 0) || 0
    ) : finiteNumber(mistakes);
    const typedCorrect = Math.max(0, Math.floor(finiteNumber(correctChars)));
    const speed = Math.max(0, Math.floor(finiteNumber(wpm)));
    const errorCount = Math.max(0, Math.floor(probableMistakes));
    const earned = Math.floor(typedCorrect / 5);
    let user;
    try {
      user = JSON.parse(localStorage.getItem("currentUser") || "null");
    } catch (error) {
      console.error("Could not read the signed-in user:", error);
      setStatus("লগ ইন তথ্য পড়া যায়নি। হোম পেজে আবার লগ ইন করুন।", true);
      return Promise.resolve(false);
    }

    const resolvedUserId = String((user && (user.id || user.uid || user.userId || user.username || user.email)) || "").trim();
    if (!resolvedUserId) {
      setStatus("পয়েন্ট সেভ হয়নি। উপরের লগ ইন ফর্মে লগ ইন করুন।", true);
      return Promise.resolve(false);
    }
    if (/[.#$/\[\]]/.test(resolvedUserId)) {
      setStatus("এই অ্যাকাউন্ট আইডি দিয়ে স্কোর সেভ করা যাচ্ছে না।", true);
      return Promise.resolve(false);
    }
    if (!window.firebase || !firebase.database) {
      setStatus("Firebase সংযোগ নেই; স্কোর সেভ করা যায়নি।", true);
      return Promise.resolve(false);
    }

    const safeUser = { ...user, id: resolvedUserId, name: user && user.name ? user.name : resolvedUserId };
    setStatus("স্কোর লিডারবোর্ডে সেভ হচ্ছে…", false);
    try {
      if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
      const ref = firebase.database().ref(`users/${resolvedUserId}`);
      return new Promise(resolve => {
        ref.transaction(current => {
          const month = monthKey();
          const existing = current && typeof current === "object" ? current : {
            id: resolvedUserId,
            name: safeUser.name || resolvedUserId,
            password: safeUser.password || "",
            points: 0,
            monthlyPoints: 0,
            monthlyPointsMonth: month,
            mistakes: 0,
            bestWpm: 0,
            pic: safeUser.pic || "",
            bio: safeUser.bio || ""
          };
          existing.id = existing.id || resolvedUserId;
          existing.name = existing.name || safeUser.name || resolvedUserId;
          existing.password = existing.password || safeUser.password || "";
          existing.points = finiteNumber(existing.points) + earned;
          existing.monthlyPoints = (existing.monthlyPointsMonth === month ? finiteNumber(existing.monthlyPoints) : 0) + earned;
          existing.monthlyPointsMonth = month;
          existing.bestWpm = Math.max(finiteNumber(existing.bestWpm), speed);
          existing.mistakes = finiteNumber(existing.mistakes) + errorCount;
          existing.pic = existing.pic || safeUser.pic || "";
          existing.bio = existing.bio || safeUser.bio || "";
          return existing;
        }, (error, committed, snapshot) => {
          if (error) {
            console.error("Game score save failed:", error);
            setStatus("স্কোর সেভ করা যায়নি। পরে আবার চেষ্টা করুন।", true);
            resolve(false);
            return;
          }
          if (!committed || !snapshot || !snapshot.exists()) {
            setStatus("অ্যাকাউন্টটি লিডারবোর্ডে পাওয়া যায়নি। হোম পেজে লগ ইন করুন।", true);
            resolve(false);
            return;
          }
          try {
            localStorage.setItem("currentUser", JSON.stringify({ ...safeUser, ...snapshot.val() }));
          } catch (storageError) {
            console.error("Could not update the local user profile:", storageError);
          }
          setStatus(`সেভ হয়েছে: +${earned} পয়েন্ট`, false);
          resolve(true);
        }, false);
      });
    } catch (error) {
      console.error("Game score save failed:", error);
      setStatus("স্কোর সেভ করা যায়নি। পরে আবার চেষ্টা করুন।", true);
      return Promise.resolve(false);
    }
  }

  function saveRaceProgress(raceId, correctChars, wpm, mistakes = 0) {
    const safeRaceId = String(raceId || "").trim();
    const typedCorrect = Math.max(0, Math.floor(finiteNumber(correctChars)));
    const speed = Math.max(0, Math.floor(finiteNumber(wpm)));
    const errorCount = Math.max(0, Math.floor(finiteNumber(mistakes)));
    let user;
    try {
      user = JSON.parse(localStorage.getItem("currentUser") || "null");
    } catch (error) {
      console.error("Could not read the signed-in user for race progress:", error);
      setStatus("লগ ইন তথ্য পড়া যায়নি; রেসের পয়েন্ট সেভ হয়নি।", true);
      return Promise.resolve(false);
    }

    const userId = String(user && user.id || "").trim();
    if (!safeRaceId || !userId || /[.#$/\[\]]/.test(userId)) {
      setStatus("রেসের পয়েন্ট সেভ করতে লগ ইন করুন।", true);
      return Promise.resolve(false);
    }
    if (!window.firebase || !firebase.database) {
      setStatus("Firebase সংযোগ নেই; রেসের পয়েন্ট সেভ হয়নি।", true);
      return Promise.resolve(false);
    }

    const safeUser = { ...user, id: userId, name: user.name || userId };
    let newlyEarned = 0;
    let progressRef;
    try {
      if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
      progressRef = firebase.database().ref(`users/${userId}`);
    } catch (error) {
      console.error("Could not initialize live race score saving:", error);
      setStatus("লিডারবোর্ড সংযোগ করা যায়নি; রেসের পয়েন্ট সেভ হয়নি।", true);
      return Promise.resolve(false);
    }
    return new Promise(resolve => {
      progressRef.transaction(current => {
        const month = monthKey();
        const account = current && typeof current === "object" ? current : {
          id: userId,
          name: safeUser.name,
          password: safeUser.password || "",
          points: 0,
          monthlyPoints: 0,
          monthlyPointsMonth: month,
          mistakes: 0,
          bestWpm: 0,
          pic: safeUser.pic || "",
          bio: safeUser.bio || ""
        };
        const progress = account.gameRaceProgress && typeof account.gameRaceProgress === "object"
          ? { ...account.gameRaceProgress }
          : {};
        const previous = progress[safeRaceId] && typeof progress[safeRaceId] === "object"
          ? progress[safeRaceId]
          : {};
        const nextCorrect = Math.max(finiteNumber(previous.correctChars), typedCorrect);
        const nextMistakes = Math.max(finiteNumber(previous.mistakes), errorCount);
        const earned = Math.max(0, Math.floor(nextCorrect / 5) - Math.floor(finiteNumber(previous.correctChars) / 5));
        newlyEarned = earned;
        const mistakesAdded = Math.max(0, nextMistakes - finiteNumber(previous.mistakes));
        progress[safeRaceId] = {
          correctChars: nextCorrect,
          mistakes: nextMistakes,
          updatedAt: Date.now()
        };
        const raceIds = Object.keys(progress);
        if (raceIds.length > 25) {
          raceIds.sort((a, b) => finiteNumber(progress[a].updatedAt) - finiteNumber(progress[b].updatedAt));
          raceIds.slice(0, raceIds.length - 25).forEach(id => delete progress[id]);
        }

        const previousMonth = /^\d{4}-\d{2}$/.test(account.monthlyPointsMonth || "") &&
          account.monthlyPointsMonth < month;
        return {
          ...account,
          id: account.id || userId,
          name: account.name || safeUser.name,
          password: account.password || safeUser.password || "",
          points: finiteNumber(account.points) + earned,
          monthlyPoints: (previousMonth || account.monthlyPointsMonth !== month ? 0 : finiteNumber(account.monthlyPoints)) + earned,
          monthlyPointsMonth: month,
          bestWpm: Math.max(finiteNumber(account.bestWpm), speed),
          mistakes: finiteNumber(account.mistakes) + mistakesAdded,
          pic: account.pic || safeUser.pic || "",
          bio: account.bio || safeUser.bio || "",
          gameRaceProgress: progress
        };
      }, (error, committed, snapshot) => {
        if (error) {
          console.error("Live race score save failed:", error);
          setStatus("রেসের পয়েন্ট লিডারবোর্ডে সেভ করা যায়নি। আবার চেষ্টা করুন।", true);
          resolve(false);
          return;
        }
        if (!committed || !snapshot || !snapshot.exists()) {
          setStatus("রেসের পয়েন্ট সেভ হয়নি। আবার লগ ইন করে চেষ্টা করুন।", true);
          resolve(false);
          return;
        }
        try {
          localStorage.setItem("currentUser", JSON.stringify({ ...safeUser, ...snapshot.val() }));
        } catch (storageError) {
          console.error("Could not update the local race profile:", storageError);
        }
        setStatus(newlyEarned > 0 ? `লাইভ লিডারবোর্ডে +${newlyEarned} পয়েন্ট যোগ হয়েছে।` : "রেসের স্কোর লিডারবোর্ডে আপডেট হয়েছে।", false);
        resolve(true);
      }, false);
    });
  }

  window.GameLeaderboard = { init, save, saveRaceProgress, initPresence, setTypingStatus };
})();
