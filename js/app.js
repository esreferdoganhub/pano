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

    // Listen for posts (limit to last 10, ordered by time)
    postsRef.limitToLast(10).on('value', (snapshot) => {
        feedEl.innerHTML = ''; // Clear feed

        const posts = [];
        snapshot.forEach((childSnapshot) => {
            posts.push({
                id: childSnapshot.key,
                ...childSnapshot.val()
            });
        });

        // Reverse to show newest first
        posts.reverse();

        if (posts.length === 0) {
            feedEl.innerHTML = `
                <div class="post-card" style="text-align: center; opacity: 0.5;">
                    <p>Henüz hiç yönerge eklenmemiş.</p>
                </div>
            `;
            return;
        }

        posts.forEach(post => {
            const card = document.createElement('div');
            card.className = 'post-card';

            const date = new Date(post.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

            card.innerHTML = `
                <div class="post-meta">
                    <span class="post-date">${date}</span>
                    <span class="post-badge">YENİ</span>
                </div>
                ${post.title ? `<h3 style="margin-bottom: 1rem; font-size: 1.25rem;">${post.title}</h3>` : ''}
                <div class="post-content">
                    ${marked.parse(post.content)}
                </div>
            `;
            feedEl.appendChild(card);
        });
    });
}
