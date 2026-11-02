(() => {
  const firebaseConfig = {
    apiKey: "AIzaSyBdg7ULfChhdMSGMy4DiB5AvX0egXgz84E",
    authDomain: "eirnbooster.firebaseapp.com",
    databaseURL: "https://eirnbooster-default-rtdb.firebaseio.com",
    projectId: "eirnbooster",
    messagingSenderId: "1062288115898",
    appId: "1:1062288115898:web:952df73a31a3acdc2e5a83"
  };
  const scriptUrl = document.currentScript && document.currentScript.src
    ? document.currentScript.src
    : new URL("floating-messages.js", window.location.href).href;
  const inboxUrl = new URL("typing_Master_Pro.html?openMessages=1", new URL(".", scriptUrl)).href;
  const style = document.createElement("style");
  style.textContent = `
    #floating-messages-widget{position:fixed;right:18px;bottom:18px;z-index:29;display:grid;justify-items:end;gap:10px;font-family:Arial,Helvetica,sans-serif}
    #floating-messages-panel{position:fixed;inset:0;z-index:2147483000;display:none;background:#f1f5f9}
    #floating-messages-panel.is-visible{display:block}
    #floating-messages-frame{width:100%;height:100%;border:0;background:#f1f5f9}
    #floating-messages-close{position:absolute;top:12px;right:14px;z-index:1;width:42px;height:42px;border:0;border-radius:999px;background:#0f172a;color:#fff;font-size:28px;line-height:1;box-shadow:0 3px 12px #0f172a55;cursor:pointer}
    #floating-messages-close:hover{background:#1e293b}
    #floating-messages-toast{display:none;width:min(330px,calc(100vw - 32px));padding:12px 14px;border:1px solid #bfdbfe;border-radius:16px;background:linear-gradient(145deg,#fff,#eff6ff);color:#0f172a;text-align:left;box-shadow:0 10px 30px #102e5040;cursor:pointer}
    #floating-messages-toast.is-visible{display:block;animation:floating-message-in .2s ease-out}
    #floating-messages-toast strong{display:block;margin-bottom:4px;color:#1d4ed8;font-size:13px}
    #floating-messages-toast span{display:-webkit-box;overflow:hidden;font-size:12px;line-height:1.45;overflow-wrap:anywhere;-webkit-box-orient:vertical;-webkit-line-clamp:3}
    #floating-messages-button{position:relative;display:inline-flex;min-width:54px;height:54px;align-items:center;justify-content:center;padding:0 14px;border:2px solid #fff;border-radius:999px;background:linear-gradient(135deg,#2563eb,#7c3aed);color:#fff;font-size:24px;box-shadow:0 5px 0 #1e3a8a,0 9px 22px #17255455;cursor:pointer}
    #floating-messages-button:hover{filter:brightness(1.08);transform:translateY(-1px)}
    #floating-messages-button:active{transform:translateY(3px);box-shadow:0 2px 0 #1e3a8a}
    #floating-messages-badge{position:absolute;top:-5px;right:-5px;display:none;min-width:21px;height:21px;align-items:center;justify-content:center;padding:0 5px;border:2px solid #fff;border-radius:999px;background:#ef4444;color:#fff;font-size:10px;font-weight:900}
    #floating-messages-badge.is-visible{display:inline-flex}
    #floating-messages-status{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
    @keyframes floating-message-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    @media(max-width:600px){#floating-messages-widget{right:12px;bottom:max(12px,env(safe-area-inset-bottom))}#floating-messages-button{min-width:50px;height:50px;font-size:22px}#floating-messages-toast{width:min(300px,calc(100vw - 24px))}}
    @media(prefers-reduced-motion:reduce){#floating-messages-toast.is-visible{animation:none}}
  `;
  document.head.appendChild(style);

  const panel = document.createElement("section");
  panel.id = "floating-messages-panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "Messages");
  panel.setAttribute("aria-modal", "true");
  panel.innerHTML = `
    <button id="floating-messages-close" type="button" aria-label="Close messages and return to the previous page">×</button>
    <iframe id="floating-messages-frame" title="Messages inbox"></iframe>
  `;
  document.body.appendChild(panel);

  const widget = document.createElement("aside");
  widget.id = "floating-messages-widget";
  widget.setAttribute("aria-label", "Messages");
  widget.innerHTML = `
    <button id="floating-messages-toast" type="button" aria-label="Open new message">
      <strong id="floating-messages-toast-title">New message</strong>
      <span id="floating-messages-toast-body"></span>
    </button>
    <button id="floating-messages-button" type="button" aria-label="Open messages" title="Messages">
      <span aria-hidden="true">💬</span>
      <span id="floating-messages-badge" aria-live="polite"></span>
    </button>
    <span id="floating-messages-status" role="status" aria-live="polite"></span>
  `;
  document.body.appendChild(widget);

  const inboxPath = new URL(inboxUrl).pathname;
  let previousBodyOverflow = "";
  const openInbox = () => {
    if (window.location.pathname === inboxPath && typeof window.openMessages === "function") {
      window.openMessages();
      return;
    }
    const frame = panel.querySelector("#floating-messages-frame");
    if (!frame.src) frame.src = inboxUrl;
    if (!panel.classList.contains("is-visible")) previousBodyOverflow = document.body.style.overflow;
    panel.classList.add("is-visible");
    document.body.style.overflow = "hidden";
  };
  const closeInbox = () => {
    panel.classList.remove("is-visible");
    document.body.style.overflow = previousBodyOverflow;
  };
  panel.querySelector("#floating-messages-close").addEventListener("click", closeInbox);
  window.addEventListener("message", event => {
    const frame = panel.querySelector("#floating-messages-frame");
    const isExpectedOrigin = event.origin === window.location.origin ||
      (window.location.protocol === "file:" && event.origin === "null");
    if (event.source !== frame.contentWindow || !isExpectedOrigin ||
        !event.data || event.data.type !== "typingmaster:close-floating-messages") return;
    closeInbox();
  });
  const button = widget.querySelector("#floating-messages-button");
  const badge = widget.querySelector("#floating-messages-badge");
  const toast = widget.querySelector("#floating-messages-toast");
  const toastTitle = widget.querySelector("#floating-messages-toast-title");
  const toastBody = widget.querySelector("#floating-messages-toast-body");
  const status = widget.querySelector("#floating-messages-status");
  button.addEventListener("click", openInbox);
  toast.addEventListener("click", openInbox);
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && panel.classList.contains("is-visible")) closeInbox();
  });

  let conversationRef = null;
  let conversationCallback = null;
  let userId = null;
  let snapshotInitialized = false;
  let messageMarkers = Object.create(null);
  let unreadCount = 0;
  let toastTimer = null;

  function safeDatabaseKey(value) {
    return encodeURIComponent(String(value))
      .replace(/\./g, "%2E")
      .replace(/[!'()*]/g, character => `%${character.charCodeAt(0).toString(16).toUpperCase()}`);
  }

  function updateUnreadCount() {
    badge.textContent = unreadCount > 99 ? "99+" : String(unreadCount);
    badge.classList.toggle("is-visible", unreadCount > 0);
    button.setAttribute("aria-label", unreadCount > 0 ? `Open messages, ${unreadCount} new` : "Open messages");
    status.textContent = unreadCount > 0 ? `${unreadCount} new message${unreadCount === 1 ? "" : "s"}` : "";
  }

  function showMessageToast(conversation) {
    toastTitle.textContent = `💬 ${conversation.otherName || conversation.otherId || "New message"}`;
    toastBody.textContent = String(conversation.lastMessage || "You received a new message.");
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 8000);
  }

  function stopListening() {
    if (conversationRef && conversationCallback) {
      conversationRef.off("value", conversationCallback);
    }
    conversationRef = null;
    conversationCallback = null;
    snapshotInitialized = false;
    messageMarkers = Object.create(null);
    unreadCount = 0;
    updateUnreadCount();
  }

  function listenToUserConversations(database, nextUserId) {
    if (!nextUserId) {
      if (userId !== null) stopListening();
      userId = null;
      return;
    }
    if (userId === nextUserId && conversationRef) return;

    stopListening();
    userId = nextUserId;
    conversationRef = database.ref(`user_conversations/${safeDatabaseKey(nextUserId)}`);
    conversationCallback = snapshot => {
      const conversations = snapshot.val() || {};
      Object.entries(conversations).forEach(([key, conversation]) => {
        if (!conversation || !conversation.otherId) return;
        const marker = String(conversation.lastMessageId || conversation.lastMessageAt || "");
        if (
          snapshotInitialized &&
          marker &&
          marker !== messageMarkers[key] &&
          String(conversation.lastMessageFrom || "") === String(conversation.otherId)
        ) {
          unreadCount += 1;
          updateUnreadCount();
          showMessageToast(conversation);
        }
        if (marker) messageMarkers[key] = marker;
      });
      snapshotInitialized = true;
    };
    conversationRef.on("value", conversationCallback, error => {
      console.error("Floating message listener failed:", error);
      status.textContent = "Could not check for new messages. Check your connection.";
    });
  }

  function getCurrentUserId() {
    try {
      const user = JSON.parse(localStorage.getItem("currentUser") || "null");
      const id = user && (user.id || user.uid || user.userId || user.username || user.email);
      return id ? String(id) : null;
    } catch (error) {
      console.error("Could not read the signed-in user for message notifications:", error);
      return null;
    }
  }

  function syncUser(database) {
    listenToUserConversations(database, getCurrentUserId());
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Could not load ${src}`));
      document.head.appendChild(script);
    });
  }

  async function initializeMessaging() {
    try {
      if (!window.firebase || !firebase.database) {
        if (!window.firebase) {
          await loadScript("https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js");
        }
        if (!window.firebase.database) {
          await loadScript("https://www.gstatic.com/firebasejs/9.23.0/firebase-database-compat.js");
        }
      }
      if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
      const database = firebase.database();
      syncUser(database);
      window.addEventListener("storage", event => {
        if (event.key === "currentUser") syncUser(database);
      });
      window.addEventListener("focus", () => syncUser(database));
      document.addEventListener("visibilitychange", () => {
        if (!document.hidden) syncUser(database);
      });
      window.setInterval(() => syncUser(database), 5000);
    } catch (error) {
      console.error("Floating message notifications could not initialize:", error);
      status.textContent = "Message alerts are unavailable. Open Messages to check your inbox.";
    }
  }

  initializeMessaging();
})();
