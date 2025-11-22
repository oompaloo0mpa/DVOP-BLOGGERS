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

	// file inputs cannot be pre-filled for security; show preview instead
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
		imageInput: imageInput ? imageInput.value : ""
	};

	// form validation to make sure they cant just submit smt empty - matin
	if (!title || !content) {
		alert('Title and content are required!');
		return;
	}

	try {
		var imageUrl = null;
		// uploads file if user selects smt - matin
		if (imageInput && imageInput.files && imageInput.files.length > 0) {
			var fd = new FormData();
			fd.append('image', imageInput.files[0]);
			var upRes = await fetch('/upload', { method: 'POST', body: fd });
			var upJson = await upRes.json();
			if (!upRes.ok) { alert('Image upload failed: ' + (upJson.message || upRes.status)); return; }
			imageUrl = upJson.imageUrl; // server returns the public path - matin
		}

		// sends allat to add-post - matin
		var request = new XMLHttpRequest();
		request.open("PUT", "/edit-post/" + id, true);
		request.setRequestHeader('Content-Type', 'application/json');
		request.onload = function () {
			try { response = JSON.parse(request.responseText); } catch (e) { response = {}; }
			if (request.status === 200) {
				// on success: clear fields, closes the popup and shows success notif - matin
				// clear text fields frm the form so next ppl can add new stuff - matin
				document.getElementById("title").value = "";
				document.getElementById("content").value = "";
				// clear file input and preview just like the text fields - matin
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

	} catch (err) { //error handling - matin
		console.error(err);
		alert('Unable to edit post: ' + err.message);
	}

}
