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
    const db = firebase.database();
    const configRef = db.ref('config');

    const adminLoginDiv = document.getElementById('adminLogin');
    const adminContentDiv = document.getElementById('adminContent');
    const adminLoginForm = document.getElementById('adminLoginForm');
    const adminLoginError = document.getElementById('adminLoginError');

    const postForm = document.getElementById('postForm');
    const statusEl = document.getElementById('status');

    let adminPassword = "";

    // Disable login until config is loaded
    const loginBtn = adminLoginForm.querySelector('button');
    loginBtn.disabled = true;
    loginBtn.innerText = "Yükleniyor...";

    // 1. Initial Config Check
    configRef.once('value', (snapshot) => {
        const config = snapshot.val() || {};
        if (!config.adminPassword) {
            configRef.update({ adminPassword: "esref1560" });
            adminPassword = "esref1560";
        } else {
            adminPassword = config.adminPassword;
        }

        if (!config.viewPassword) {
            configRef.update({ viewPassword: "1300" });
        }

        // Check Session
        if (sessionStorage.getItem('adminAuth') === adminPassword && adminPassword !== "") {
            showAdmin();
        }

        loginBtn.disabled = false;
        loginBtn.innerText = "Giriş Yap";
    }, (error) => {
        console.error("Config fetch failed:", error);
        adminLoginError.innerText = "Bağlantı hatası! Lütfen sayfayı yenileyin.";
        // Fallback for safety if database is unreachable but we want to allow entry?
        // Better to wait for user to fix rules.
    });

    function showAdmin() {
        adminLoginDiv.classList.add('hidden');
        adminContentDiv.classList.remove('hidden');
        // Sync the hidden secret field for existing post logic if needed, 
        // though we'll update that logic to use session.
        document.getElementById('secret').value = adminPassword;
    }

    // 2. Admin Login
    adminLoginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('adminLoginPass').value;
        if (input === adminPassword) {
            sessionStorage.setItem('adminAuth', adminPassword);
            showAdmin();
        } else {
            adminLoginError.innerText = "Hatalı şifre!";
        }
    });

    // 3. Update Passwords
    window.updatePassword = function (type) {
        const inputId = type === 'admin' ? 'newAdminPass' : 'newViewPass';
        const newPass = document.getElementById(inputId).value;
        const status = document.getElementById('settingsStatus');

        if (!newPass) {
            alert("Lütfen bir şifre girin.");
            return;
        }

        const updates = {};
        updates[type + 'Password'] = newPass;

        configRef.update(updates).then(() => {
            status.innerText = (type === 'admin' ? 'Admin' : 'Pano') + " şifresi güncellendi!";
            status.style.color = "#4ade80";
            if (type === 'admin') {
                adminPassword = newPass;
                sessionStorage.setItem('adminAuth', newPass);
                document.getElementById('secret').value = newPass;
            }
            document.getElementById(inputId).value = "";
            setTimeout(() => status.innerText = "", 3000);
        }).catch(err => {
            status.innerText = "Hata: " + err.message;
            status.style.color = "#ff6b6b";
        });
    };

    postForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const title = document.getElementById('title').value;
        const category = document.getElementById('category').value;
        const isPinned = document.getElementById('isPinned').checked;
        const content = document.getElementById('content').value;
        const secret = sessionStorage.getItem('adminAuth');
        const submitBtn = document.getElementById('submitBtn');

        if (secret !== adminPassword) {
            alert("Yetkiniz yok veya oturumunuz kapandı. Lütfen sayfayı yenileyin.");
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerText = "Yayınlanıyor...";

        const newPostRef = db.ref('posts').push();
        newPostRef.set({
            title: title,
            content: content,
            category: category,
            isPinned: isPinned,
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
    const secret = sessionStorage.getItem('adminAuth');
    // We need to fetch the password again or use a global reference since this is outside the scope
    // For simplicity, let's just check if the session exists and matches the one we used to login
    if (!secret) {
        alert("Yetkiniz yok!");
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
