// FIREBASE CONFIGURATION REPLACEMENT NEEDED
// Lütfen kendi Firebase yapılandırmanızı buraya yapıştırın.
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
    console.error("Firebase config missing!");
    document.getElementById('feed').innerHTML = `
        <div class="post-card">
            <h2 style="color: #ff6b6b; margin-bottom: 0.5rem;">Kurulum Gerekli</h2>
            <p>Lütfen <code>js/app.js</code> dosyasını açın ve Firebase yapılandırma bilgilerinizi girin.</p>
        </div>
    `;
} else {
    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    const db = firebase.database();
    const postsRef = db.ref('posts');

    const feedEl = document.getElementById('feed');
    let allPosts = []; // Store posts locally for filtering

    // Listen for posts
    postsRef.limitToLast(20).on('value', (snapshot) => {
        allPosts = [];
        snapshot.forEach((childSnapshot) => {
            allPosts.push({
                id: childSnapshot.key,
                ...childSnapshot.val()
            });
        });

        renderPosts('ALL');
    });

    // Filter Logic
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active state
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Render
            renderPosts(btn.dataset.category);
        });
    });

    function renderPosts(category) {
        feedEl.innerHTML = ''; // Clear feed

        let filteredPosts = allPosts;
        if (category !== 'ALL') {
            filteredPosts = allPosts.filter(post => post.category === category);
        }

        // Reverse to show newest first, BUT keep pinned posts at the top
        filteredPosts.sort((a, b) => {
            // If one is pinned and the other isn't, pinned comes first
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            // Otherwise sort by timestamp (newest first)
            return b.timestamp - a.timestamp;
        });

        if (filteredPosts.length === 0) {
            feedEl.innerHTML = `
                <div class="post-card" style="text-align: center; opacity: 0.5;">
                    <p>Bu kategoride henüz paylaşım yok.</p>
                </div>
            `;
            return;
        }

        filteredPosts.forEach(post => {
            const card = document.createElement('div');
            card.className = `post-card ${post.isPinned ? 'pinned' : ''}`;

            const date = new Date(post.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

            // Category Badge Colors
            const categoryColors = {
                'Genel': 'gray',
                'Ders Notu': 'blue',
                'Ödev': 'red',
                'Kod Örneği': 'green',
                'Duyuru': 'yellow'
            };
            const catColor = categoryColors[post.category] || 'gray';

            card.innerHTML = `
                <div class="post-meta">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span class="category-badge ${catColor}">${post.category || 'Genel'}</span>
                        <span class="post-date">${date}</span>
                    </div>
                    ${post.isPinned ? '<span class="pinned-icon">📌 Sabit</span>' : ''}
                </div>
                ${post.title ? `<h3 style="margin-bottom: 1rem; font-size: 1.25rem;">${post.title}</h3>` : ''}
                <div class="post-content">
                    ${marked.parse(post.content)}
                </div>
            `;

            // 1. Apply Syntax Highlighting
            card.querySelectorAll('pre code').forEach((el) => {
                hljs.highlightElement(el);
            });

            // 2. Add Copy Button
            card.querySelectorAll('pre').forEach((pre) => {
                // Check if button already exists to avoid duplicates
                if (pre.querySelector('.btn-copy')) return;

                const button = document.createElement('button');
                button.className = 'btn-copy';
                button.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
                button.title = "Kodu Kopyala";

                button.addEventListener('click', () => {
                    const code = pre.querySelector('code').innerText;
                    navigator.clipboard.writeText(code).then(() => {
                        button.classList.add('copied');
                        setTimeout(() => button.classList.remove('copied'), 2000);
                    });
                });

                pre.style.position = 'relative'; // Ensure button is positioned relative to code block
                pre.appendChild(button);
            });

            // 3. Add Reaction (Like) Button
            const reactionBtn = document.createElement('button');
            reactionBtn.className = `btn-reaction ${localStorage.getItem('liked_' + post.id) ? 'liked' : ''}`;
            reactionBtn.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="${localStorage.getItem('liked_' + post.id) ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
                <span>${post.likes || 0}</span>
            `;

            reactionBtn.onclick = () => {
                const isLiked = localStorage.getItem('liked_' + post.id);
                if (isLiked) return; // Prevent multiple likes (simple check)

                // Optimistic UI update
                reactionBtn.classList.add('liked');
                reactionBtn.querySelector('span').innerText = (post.likes || 0) + 1;
                reactionBtn.querySelector('svg').style.fill = "currentColor";
                localStorage.setItem('liked_' + post.id, 'true');

                // Update Firebase
                db.ref(`posts/${post.id}/likes`).transaction((currentLikes) => {
                    return (currentLikes || 0) + 1;
                });
            };

            const actionsFooter = document.createElement('div');
            actionsFooter.className = 'post-actions';
            actionsFooter.appendChild(reactionBtn);

            card.appendChild(actionsFooter);

            feedEl.appendChild(card);
        });
    } // End of renderPosts
} // End of else block

