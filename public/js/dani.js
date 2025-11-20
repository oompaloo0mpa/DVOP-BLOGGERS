async function editPost() {
	var response = "";
	var title = document.getElementById("title").value;
	var content = document.getElementById("content").value;
	var owner = document.getElementById("owner").value;
	var imageInput = document.getElementById("imageInput"); 

	if (!title || !content) {
		alert('Title and content are required!');
		return;
	}

	var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; 
	if (owner && !emailPattern.test(owner)) {
		alert('Please enter a valid email for owner!');
		return;
	}

	try {
		var imageUrl = null;
		if (imageInput && imageInput.files && imageInput.files.length > 0) {
			var fd = new FormData();
			fd.append('image', imageInput.files[0]);
			var upRes = await fetch('/upload', { method: 'POST', body: fd });
			var upJson = await upRes.json();
			if (!upRes.ok) { alert('Image upload failed: ' + (upJson.message || upRes.status)); return; }
			imageUrl = upJson.imageUrl; 
		}

		var jsonData = {
			title: title,
			content: content,
			imageUrl: imageUrl || "",
			owner: owner || ""
		};

		var request = new XMLHttpRequest();
		request.open("POST", "/add-post", true);
		request.setRequestHeader('Content-Type', 'application/json');
		request.onload = function () {
			try { response = JSON.parse(request.responseText); } catch(e) { response = {}; }
			if (request.status === 201) {
				document.getElementById("title").value = "";
				document.getElementById("content").value = "";
				document.getElementById("owner").value = "";
                
				if (imageInput) {
					imageInput.value = null;
					try { var prev = document.getElementById('imagePreview'); if (prev) prev.src = ''; } catch(e){}
				}
				try { if (typeof hideModal === 'function') hideModal(); } catch(e){}
				try {
					var n = document.getElementById('notif');
					if (n) {
						n.textContent = 'Post added';
						n.style.display = 'block';
						setTimeout(function(){ n.style.display = 'none'; }, 2500);
					} else {
						alert('Added Post: ' + jsonData.title + '!');
					}
				} catch(e) { alert('Added Post: ' + jsonData.title + '!'); }
			} else {
				alert('Unable to add post!');
			}
		};
		request.send(JSON.stringify(jsonData));
	} catch (err) { 
		console.error(err);
		alert('Error: ' + err.message);
	}
}

function previewImage(inputId, imgId) {
	var input = document.getElementById(inputId);
	var img = document.getElementById(imgId);
	if (!input || !img) return;
	input.addEventListener('change', function () {
		var f = input.files[0];
		if (!f) { img.src = ''; return; }
		img.src = URL.createObjectURL(f);
	});
}

if (document.getElementById('imageInput') && document.getElementById('imagePreview')) previewImage('imageInput','imagePreview');

function resetModalForm() {
	try {
		var t = document.getElementById('title'); if (t) t.value = '';
		var c = document.getElementById('content'); if (c) c.value = '';
		var o = document.getElementById('owner'); if (o) o.value = '';
		var fi = document.getElementById('imageInput'); if (fi) fi.value = null;
		var prev = document.getElementById('imagePreview'); if (prev) prev.src = '';
	} catch (e) { console.error('resetModalForm error', e); }
}

