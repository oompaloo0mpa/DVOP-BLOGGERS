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