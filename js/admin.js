// FIREBASE CONFIGURATION REPLACEMENT NEEDED
const firebaseConfig = {
    apiKey: "AIzaSyDjxCyZbJEahK_QwQqV4gVLYBCtSwtftgc",
    authDomain: "sinif-panosu.firebaseapp.com",
    databaseURL: "https://sinif-panosu-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "sinif-panosu",
    storageBucket: "sinif-panosu.firebasestorage.app",
    messagingSenderId: "985958144090",
    appId: "1:985958144090:web:c6b6d74f2bc2533a9c6063",
    measurementId: "G-N7X9QDCWCN"
};

// Check if config is set
if (!firebaseConfig.apiKey) {
    alert("Lütfen js/admin.js dosyasına Firebase ayarlarını ekleyin!");
} else {
    firebase.initializeApp(firebaseConfig);
    const db = firebase.database();

    const postForm = document.getElementById('postForm');
    const statusEl = document.getElementById('status');

    postForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const title = document.getElementById('title').value;
        const content = document.getElementById('content').value;
        const secret = document.getElementById('secret').value;
        const submitBtn = document.getElementById('submitBtn');

        // Simple client-side "auth" for demonstration. 
        // In production, use Firebase Auth.
        // This is just to prevent accidental posts if the user is not the teacher.
        if (secret !== "esref1560") {
            alert("Hatalı admin şifresi!");
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerText = "Yayınlanıyor...";

        const newPostRef = db.ref('posts').push();
        newPostRef.set({
            title: title,
            content: content,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        }).then(() => {
            statusEl.innerText = "Başarıyla yayınlandı!";
            statusEl.style.color = "#4ade80";
            postForm.reset();
            // Restore password field if you want convenience
            document.getElementById('secret').value = secret;

            setTimeout(() => {
                statusEl.innerText = "";
                submitBtn.disabled = false;
                submitBtn.innerText = "Yayınla";
            }, 3000);
        }).catch((error) => {
            console.error(error);
            statusEl.innerText = "Hata oluştu: " + error.message;
            statusEl.style.color = "#ff6b6b";
            submitBtn.disabled = false;
            submitBtn.innerText = "Yayınla";
        });
    });

    // --- NEW: List and Delete Posts ---
    const manageContainer = document.getElementById('managePosts');

    // Listen for posts to display in admin panel
    db.ref('posts').limitToLast(20).on('value', (snapshot) => {
        if (!manageContainer) return;
        manageContainer.innerHTML = '<h3>Son Paylaşımlar (Yönet)</h3>';

        const posts = [];
        snapshot.forEach((childSnapshot) => {
            posts.push({
                id: childSnapshot.key,
                ...childSnapshot.val()
            });
        });
        posts.reverse();

        if (posts.length === 0) {
            manageContainer.innerHTML += '<p style="color: var(--text-muted);">Henüz paylaşım yok.</p>';
            return;
        }

        const list = document.createElement('div');
        list.className = 'admin-post-list';

        posts.forEach(post => {
            const item = document.createElement('div');
            item.className = 'admin-post-item';

            // Create a small snippet of content (text only)
            // Strip HTML tags for preview using a temp element
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = post.content;
            const textPreview = tempDiv.textContent || tempDiv.innerText || "";

            item.innerHTML = `
                <div class="admin-post-info">
                    <strong>${post.title || '(Başlıksız)'}</strong>
                    <small>${textPreview.substring(0, 50)}...</small>
                </div>
                <button class="btn-delete" onclick="deletePost('${post.id}')">Sil</button>
            `;
            list.appendChild(item);
        });

        manageContainer.appendChild(list);
    });
}

// Make deletePost function global so onclick works
window.deletePost = function (id) {
    const secret = document.getElementById('secret').value;
    if (secret !== "esref1560") {
        alert("Silmek için şifre alanına doğru şifreyi girmelisiniz!");
        document.getElementById('secret').focus();
        return;
    }

    if (confirm("Bu paylaşımı silmek istediğinize emin misiniz?")) {
        const db = firebase.database(); // Get db instance here
        db.ref('posts').child(id).remove()
            .then(() => {
                console.log("Silindi");
            })
            .catch((error) => {
                alert("Silinemedi: " + error.message);
            });
    }
}
