async function loadPosts() {
  try {
    const res = await fetch('/utils/posts.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load posts');
    const posts = await res.json();
    renderPosts(posts || []);
  } catch (err) {
    console.error(err);
    document.getElementById('posts').innerText = 'Error loading posts';
  }
}

function formatDate(iso) {
  try { return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }); }
  catch(e) { return iso || ''; }
}

function previewText(text, max = 140) {
  if (!text) return '';
  return text.length > max ? text.slice(0, max).trim() + '…' : text;
}

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
}

function renderPosts(posts) {
  const container = document.getElementById('posts');
  container.innerHTML = '';
  if (!posts.length) {
    container.innerHTML = '<div>No posts yet</div>';
    return;
  }

  posts.slice().sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt)).forEach(post => {
    const card = document.createElement('article');
    card.className = 'card';
    card.tabIndex = 0;
    card.setAttribute('role','button');

    const imgHtml = post.imageUrl ? `<img src="${post.imageUrl.startsWith('/') ? post.imageUrl : '/' + post.imageUrl}" alt="">` : '';
    card.innerHTML = `
      ${imgHtml}
      <h2 class="title">${escapeHtml(post.title || 'Untitled')}</h2>
      <div class="meta">
        <span>✉️ ${escapeHtml(post.owner || 'Anonymous')}</span>
        <span>📅 ${formatDate(post.createdAt)}</span>
      </div>
      <p class="preview">${escapeHtml(previewText(post.content))}</p>
    `;

    card.addEventListener('click', ()=> {
      window.location.href = `/post.html?id=${encodeURIComponent(post.id)}`;
    });
    card.addEventListener('keypress', (e)=> { if (e.key === 'Enter') card.click(); });

    container.appendChild(card);
  });
}

document.addEventListener('DOMContentLoaded', loadPosts);


// Loads post by id from backend API /posts/:id and renders expanded view with Edit button.

function escapeHtml(str){
  return String(str || '').replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
}
function nl2br(s){ return String(s || '').replace(/\r\n|\n/g, '<br>'); }
function formatDate(iso){
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { year:'numeric', month:'long', day:'numeric' });
  } catch(e){ return iso || ''; }
}

// Function to display error messages with proper formatting
function displayError(target, message, code) {
  target.innerHTML = `
    <div class="error-message">
      <h2>⚠️ Error</h2>
      <p>${escapeHtml(message)}</p>
      ${code ? `<p class="error-code">Error Code: ${escapeHtml(code)}</p>` : ''}
    </div>
  `;
}

// Function to display loading state
function displayLoading(target) {
  target.innerHTML = `
    <div class="loading">
      <p>Loading post...</p>
    </div>
  `;
}

async function loadPostPage(){
  const params = new URLSearchParams(location.search);
  const id = params.get('id');

  // If this page doesn't have a target element for the post, do nothing.
  const target = document.getElementById('post');
  if (!target) return; // <-- safe early exit to avoid the TypeError

  // Show loading state
  displayLoading(target);

  try {
    // CHANGED: Fetch from backend API instead of JSON file
    const res = await fetch(`/posts/${id}`, { cache: 'no-store' });
    const data = await res.json();

    // FRONTEND ERROR HANDLING #2: Handle backend errors
    if (!res.ok || !data.success) {
      // Handle specific error codes from backend
      switch (data.code) {
        case 'INVALID_ID':
          displayError(target, 'The post ID is invalid. Please check the URL and try again.', data.code);
          break;
        case 'POST_NOT_FOUND':
          displayError(target, `Post #${id} could not be found. It may have been deleted.`, data.code);
          break;
        case 'FILE_READ_ERROR':
          displayError(target, 'We are having trouble loading posts. Please try again in a moment.', data.code);
          break;
        case 'UNEXPECTED_ERROR':
          displayError(target, 'Something went wrong on our end. Please try again later.', data.code);
          break;
        default:
          displayError(target, data.error || 'An error occurred while loading the post.', data.code);
      }
      return;
    }

    // Success: Extract the post from response
    const post = data.post;

    // Render the post (keeping your existing styling and structure)
    const imgUrl = post.imageUrl ? (post.imageUrl.startsWith('/') ? post.imageUrl : '/' + post.imageUrl) : null;
    const imgHtml = imgUrl ? `<img class="post-image" src="${escapeHtml(imgUrl)}" alt="${escapeHtml(post.title)}">` : '';
    const owner = post.owner || post.author || 'Anonymous';
    const date = formatDate(post.createdAt || post.date || '');

    target.innerHTML = `
      <h1 class="title">${escapeHtml(post.title || 'Untitled')}</h1>
      <div class="meta">
        <div class="item" title="Owner">
          <svg viewBox="0 0 24 24" fill="none" style="width:18px;height:18px"><path d="M21 8v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M7 8a5 5 0 1 1 10 0" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <span>${escapeHtml(owner)}</span>
        </div>
        <div class="item" title="Date">
          <svg viewBox="0 0 24 24" fill="none" style="width:18px;height:18px"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.2"/><path d="M16 2v4M8 2v4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
          <span>${escapeHtml(date)}</span>
        </div>
      </div>
      ${imgHtml}
      <hr class="sep">
      <div class="content">${nl2br(escapeHtml(post.content || ''))}</div>
    `;

    // wire edit button
    const editBtn = document.getElementById('editBtn');
    if (editBtn){
      editBtn.onclick = () => {
        // future: navigate to an edit form; for now show an alert
        alert('Edit feature coming soon — post id: ' + post.id);
      };
    }

    // accessibility: ensure back link works (no extra JS required)
    const backBtn = document.getElementById('backBtn');
    if (backBtn){
      // keep default navigation; if you want to animate or use history, modify here
    }

  } catch (err) {
    // FRONTEND ERROR HANDLING #3: Network/Connection errors
    console.error('Error fetching post:', err);
    displayError(
      target,
      'Unable to connect to the server. Please check your internet connection and try again.',
      'NETWORK_ERROR'
    );
  }
}

document.addEventListener('DOMContentLoaded', loadPostPage);