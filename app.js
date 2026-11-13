// Standup Board: add, save and render posts.
// Shared contract: #post-form (name, yesterday, today, blockers), #posts,
// article.post > h3.post-name, p.post-yesterday, p.post-today,
// p.post-blockers, time.post-time; localStorage "standup-posts".

const STORAGE_KEY = "standup-posts";

const form = document.getElementById("post-form");
const postsEl = document.getElementById("posts");

function loadPosts() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function savePosts(posts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

function field(tag, className, label, text) {
  const el = document.createElement(tag);
  el.className = className;
  if (label) {
    const strong = document.createElement("strong");
    strong.textContent = label + ": ";
    el.append(strong);
  }
  el.append(text);
  return el;
}

function formatTime(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function renderPost(post) {
  const article = document.createElement("article");
  article.className = "post";

  const time = document.createElement("time");
  time.className = "post-time";
  time.dateTime = post.at;
  time.textContent = formatTime(post.at);

  article.append(
    field("h3", "post-name", null, post.name),
    field("p", "post-yesterday", "Yesterday", post.yesterday),
    field("p", "post-today", "Today", post.today),
    field("p", "post-blockers", "Blockers", post.blockers || "None"),
    time
  );
  return article;
}

function render() {
  const posts = loadPosts();
  postsEl.replaceChildren();

  if (posts.length === 0) {
    const empty = document.createElement("p");
    empty.className = "posts-empty";
    empty.textContent = "No updates yet. Be the first to post.";
    postsEl.append(empty);
    return;
  }

  // Newest first.
  [...posts]
    .sort((a, b) => String(b.at).localeCompare(String(a.at)))
    .forEach((post) => postsEl.append(renderPost(post)));
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const post = {
    name: String(data.get("name") || "").trim(),
    yesterday: String(data.get("yesterday") || "").trim(),
    today: String(data.get("today") || "").trim(),
    blockers: String(data.get("blockers") || "").trim(),
    at: new Date().toISOString(),
  };

  if (!post.name || !post.yesterday || !post.today) {
    form.reportValidity();
    return;
  }

  const posts = loadPosts();
  posts.push(post);
  savePosts(posts);
  render();
  form.reset();
  form.elements.name.focus();
});

// Keep multiple open tabs in sync.
window.addEventListener("storage", (event) => {
  if (event.key === STORAGE_KEY) render();
});

render();
