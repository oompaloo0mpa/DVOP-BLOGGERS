// NEW: addPost - upload image then create blog post
async function addPost() {
	var response = "";
	// collect form values for za new post - matin
	var title = document.getElementById("title").value;
	var content = document.getElementById("content").value;
	var owner = document.getElementById("owner").value;
	var imageInput = document.getElementById("imageInput"); // file input

	// form validation to make sure they cant just submit smt empty - matin
	if (!title || !content) {
		alert('Title and content are required!');
		return;
	}
	var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; //form vali for email god bless copilot - matin
	if (owner && !emailPattern.test(owner)) {
		alert('Please enter a valid email for owner!');
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

		// creates the post object - matin
		var jsonData = {
			title: title,
			content: content,
			imageUrl: imageUrl || "",
			owner: owner || ""
		};

		// sends allat to add-post - matin
		var request = new XMLHttpRequest();
		request.open("POST", "/add-post", true);
		request.setRequestHeader('Content-Type', 'application/json');
		request.onload = function () {
			try { response = JSON.parse(request.responseText); } catch(e) { response = {}; }
			if (request.status === 201) {
				// on success: clear fields, closes the popup and shows success notif - matin
				// clear text fields frm the form so next ppl can add new stuff - matin
				document.getElementById("title").value = "";
				document.getElementById("content").value = "";
				document.getElementById("owner").value = "";
				// clear file input and preview just like the text fields - matin
				if (imageInput) {
					imageInput.value = null;
					try { var prev = document.getElementById('imagePreview'); if (prev) prev.src = ''; } catch(e){}
				}
				// hide modal if available
				try { if (typeof hideModal === 'function') hideModal(); } catch(e){}
				// show notification
				try {
					var n = document.getElementById('notif');
					if (n) {
						n.textContent = 'Post added';
						n.style.display = 'block';
						setTimeout(function(){ n.style.display = 'none'; }, 2500);
					} else {
						alert('Added Post: ' + jsonData.title + '!');
					}

							// Changed this so it now auto refreshes aft every new uploadz - matin
							try { if (typeof loadPosts === 'function') loadPosts(); } catch(e) { /* ignore */ }
				} catch(e) { alert('Added Post: ' + jsonData.title + '!'); }
			} else {
				alert('Unable to add post!');
			}
		};
		request.send(JSON.stringify(jsonData));
	} catch (err) { //error handling - matin
		console.error(err);
		alert('Error: ' + err.message);
	}
}

// preview image if they do add smt - matin
// improved previewImage: uses object URLs, shows the preview element,
// and revokes previous object URLs to avoid leaks.
function previewImage(inputId, imgId) {
	const input = document.getElementById(inputId);
	const img = document.getElementById(imgId);
	if (!input || !img) return;
	let objectUrl;
	input.addEventListener('change', function () {
		const f = input.files[0];
		if (!f) { img.src = ''; img.style.display = 'none'; if (objectUrl) { URL.revokeObjectURL(objectUrl); objectUrl = null; } return; }
		if (objectUrl) { URL.revokeObjectURL(objectUrl); objectUrl = null; }
		objectUrl = URL.createObjectURL(f);
		img.src = objectUrl;
		img.style.display = 'block';
		// revoke after the image loads to free memory
		img.onload = () => { if (objectUrl) { URL.revokeObjectURL(objectUrl); objectUrl = null; } };
	});
}

//  Enable preview for the image ^ - matin
if (document.getElementById('imageInput') && document.getElementById('imagePreview')) previewImage('imageInput','imagePreview');

// Reset modal form (clear inputs + preview). Call before opening modal.
function resetModalForm() {
	try {
		var t = document.getElementById('title'); if (t) t.value = '';
		var c = document.getElementById('content'); if (c) c.value = '';
		var o = document.getElementById('owner'); if (o) o.value = '';
		var fi = document.getElementById('imageInput'); if (fi) fi.value = null;
		var prev = document.getElementById('imagePreview'); if (prev) { prev.src = ''; prev.style.display = 'none'; }
	} catch (e) { console.error('resetModalForm error', e); }
}

