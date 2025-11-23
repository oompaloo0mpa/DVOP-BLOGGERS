//Function to open edit modal and populate fields - Dani
function editPost(data) {
	// accept either an object or a JSON string
	const selectedPost = (typeof data === 'string') ? JSON.parse(data) : (data || {});

	const title = document.getElementById('title');
	const content = document.getElementById('content');
	const imageInput = document.getElementById('imageInput');
	const imagePreview = document.getElementById('imagePreview');

	if (title) title.value = selectedPost.title || '';
	if (content) content.value = selectedPost.content || '';

	// show preview if imageUrl exists
	if (imagePreview) {
		imagePreview.src = selectedPost.imageUrl || '';
		imagePreview.style.display = selectedPost.imageUrl ? 'block' : 'none';
	}
	if (imageInput) imageInput.value = null;

	// set the modal's save button to call updatePost with the correct id
	const editBtn = document.getElementById("modalEdit");
	if (editBtn) {
		// store id on the button instead of creating another global onclick handler
		editBtn.dataset.postId = selectedPost.id || '';
	}

	// show modal using page's showModal() if present, otherwise fallback to backdrop
	if (typeof showModal === 'function') {
		showModal();
	} else {
		const backdrop = document.getElementById('modalBackdrop');
		if (backdrop) backdrop.style.display = 'flex';
	}
}

// Function to update post - Dani
async function updatePost(id) {
	var response = "";

	// read DOM elements and values first (so validation uses actual values)
	const titleEl = document.getElementById("title");
	const contentEl = document.getElementById("content");
	const imageInput = document.getElementById("imageInput");

	const title = titleEl ? titleEl.value.trim() : "";
	const content = contentEl ? contentEl.value.trim() : "";

	var jsonData = {
		title: title,
		content: content,
		imageInput: imageInput ? imageInput.value : "",
		imageUrl: ''
	};

	if (!title || !content) {
		alert('Title and content are required!');
		return;
	}

	try {
		// uses matin code to upload image first if a new image is selected
		var imageUrl = null;
		if (imageInput && imageInput.files && imageInput.files.length > 0) {
			var fd = new FormData();
			fd.append('image', imageInput.files[0]);
			var upRes = await fetch('/upload', { method: 'POST', body: fd });
			var upJson = await upRes.json();
			if (!upRes.ok) { alert('Image upload failed: ' + (upJson.message || upRes.status)); return; }
			imageUrl = upJson.imageUrl; // server returns the public path - matin
		}
		jsonData.imageUrl = imageUrl || "";

		// sends updated data to edit-post endpoint
		var request = new XMLHttpRequest();
		request.open("PUT", "/edit-post/" + id, true);
		request.setRequestHeader('Content-Type', 'application/json');
		request.onload = function () {
			try { response = JSON.parse(request.responseText); } catch (e) { response = {}; }
			if (request.status === 200) {
				document.getElementById("title").value = "";
				document.getElementById("content").value = "";
				if (imageInput) {
					imageInput.value = null;
					try { var prev = document.getElementById('imagePreview'); if (prev) prev.src = ''; } catch (e) { }
				}
				// hide modal if available
				try { if (typeof hideModal === 'function') hideModal(); } catch (e) { }
				// show notification
				try {
					var n = document.getElementById('notif');
					if (n) {
						n.textContent = 'Post Edited';
						n.style.display = 'block';
						setTimeout(function () { n.style.display = 'none'; }, 2500);
					} else {
						alert('Edited Post: ' + jsonData.title + '!');
					}
				} catch (e) { alert('Edited Post: ' + jsonData.title + '!'); }

				// delay reload by 2 seconds so the user sees the success notification
				setTimeout(function () { location.reload(); }, 1000);
			} else {
				alert('Unable to Edit post!');
			}
		};
		request.send(JSON.stringify(jsonData));

	} catch (err) { 
		// log error and alert user
		console.error(err);
		alert('Unable to edit post: ' + err.message);
	}

}
