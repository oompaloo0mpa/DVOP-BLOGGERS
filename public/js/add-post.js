// Handles modal form: uploads image (optional) then POSTs JSON to /add-post
async function uploadImage(file) {
  const fd = new FormData();
  fd.append('image', file);
  const res = await fetch('/upload', { method: 'POST', body: fd });
  if (!res.ok) throw new Error('Image upload failed');
  const data = await res.json();
  return data.imageUrl;
}

async function addPost() {
  const title = document.getElementById('title')?.value?.trim();
  const content = document.getElementById('content')?.value?.trim();
  const owner = document.getElementById('owner')?.value?.trim();
  const fileInput = document.getElementById('imageInput');
  if (!title || !content) {
    alert('Title and content required');
    return;
  }

  try {
    let imageUrl = null;
    if (fileInput && fileInput.files && fileInput.files[0]) {
      imageUrl = await uploadImage(fileInput.files[0]);
    }

    const res = await fetch('/add-post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, owner, imageUrl })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to add post');
    }

    const created = await res.json();
    // close modal if present
    const backdrop = document.getElementById('modalBackdrop');
    if (backdrop) backdrop.style.display = 'none';
    // reload list so new widget appears
    window.location.href = '/';
  } catch (e) {
    console.error(e);
    alert('Error adding post: ' + e.message);
  }
}

window.addPost = addPost;

// small helper to show image preview if you want
document.addEventListener('DOMContentLoaded', () => {
  const imgInput = document.getElementById('imageInput');
  const imgPreview = document.getElementById('imagePreview');
  if (imgInput && imgPreview) {
    imgInput.addEventListener('change', () => {
      const f = imgInput.files && imgInput.files[0];
      if (!f) { imgPreview.src = ''; imgPreview.style.display = 'none'; return; }
      const url = URL.createObjectURL(f);
      imgPreview.src = url;
      imgPreview.style.display = 'block';
    });
  }
});