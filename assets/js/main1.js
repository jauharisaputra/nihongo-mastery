console.log('🚀 Nihongo Mastery JS v2.1 - GITHUB PAGES + GAS BACKEND');

let currentUser = null;
let selectedExam = 'jlpt-n5';
let promoEndTime;
let notifInterval;
const GAS_URL = 'https://script.google.com/macros/s/AKfycbzdDuFwNNMQQUoV3YAhzJctS9M2t0wr8c3WDwIU5fc1q8Lb1mHmFAwsCUEXIL_s1zMC/exec';

let isProcessingPayment = false;

// ========================================
// 1. COUNTDOWN 10 MENIT PROMO (UNCHANGED)
// ========================================
function initCountdown() {
    promoEndTime = Date.now() + (10 * 60 * 1000);
    updateCountdownDisplay();
    setInterval(updateCountdownDisplay, 1000);
}

function updateCountdownDisplay() {
    const now = Date.now();
    const diff = promoEndTime - now;

    if (diff <= 0) {
        document.getElementById('countdown').innerHTML = `
            <div style="font-size:2rem;color:#ffd700;">🎉 PROMO SELESAI!</div>
            <p>Gunakan kode <strong>PROMO10</strong> untuk diskon 10%!</p>
        `;
        return;
    }

    const minutes = Math.floor(diff / (1000 * 60));
    const seconds = Math.floor((diff % 60000) / 1000);
    document.getElementById('countdown-timer').textContent =
        `${minutes.toString().padStart(2,'0')}:${seconds.toString().padStart(2,'0')}`;

    const timerEl = document.getElementById('countdown-timer');
    if (diff < 120000) {
        timerEl.style.background = 'rgba(255,0,0,0.4)';
        timerEl.style.color = '#fff';
        timerEl.style.boxShadow = '0 0 20px rgba(255,0,0,0.8)';
    }
}
initCountdown();

// ========================================
// 2. USER LOGIN/UI FUNCTIONS (UPDATED)
// ========================================
function updateUserUI(user) {
    console.log('🎉 Login Success:', user);
    currentUser = user;
    localStorage.setItem('userId', user.user_id || user.id);
    localStorage.setItem('userEmail', user.email);
    localStorage.setItem('userName', user.name);

    // Header
    const header = document.getElementById('userHeader');
    if (header) header.style.display = 'block';
    document.getElementById('userNameDisplay').textContent = user.name || 'User';
    document.getElementById('userAvatar').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=1a1a3e&color=ffd700&size=40`;

    // CTA Switch
    const guestCTA = document.getElementById('guestCTA');
    const personalCTA = document.getElementById('personalCTA');
    const n5Badge = document.getElementById('n5-badge');

    if (guestCTA) guestCTA.style.display = 'none';
    if (personalCTA) personalCTA.style.display = 'block';
    if (n5Badge) {
        n5Badge.textContent = '✅ Free';
        n5Badge.className = 'access-badge free';
    }

    showToast(`Welcome ${user.name}! 🎓`);
    checkUserEntitlement();
}

function logoutUser() {
    currentUser = null;
    localStorage.clear();
    document.getElementById('userHeader').style.display = 'none';
    document.getElementById('personalCTA').style.display = 'none';
    document.getElementById('guestCTA').style.display = 'block';
    showToast('Logged out successfully!');
}

// ========================================
// 3. GOOGLE LOGIN → GAS REGISTER (CONVERTED)
// ========================================
function handleGoogleLogin(response) {
    console.log('🔐 Google Login Triggered');
    const idToken = response.credential;

    // Decode Google token client-side (simplified)
    fetch(`${GAS_URL}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'register',
            token: idToken,
            method: 'google'
        })
    })
    .then(res => res.json())
    .then(data => {
        console.log('GAS Response:', data);
        if (data.success) {
            const user = {
                user_id: data.user_id,
                id: data.user_id,
                email: idToken.split('.')[1], // Simplified
                name: 'Google User'
            };
            updateUserUI(user);
        } else {
            showToast('Login gagal: ' + (data.error || 'Unknown'), 'error');
        }
    })
    .catch(err => {
        console.error('Network error:', err);
        showToast('Koneksi error!', 'error');
    });
}

// ========================================
// 4. EXAM & MANUAL PAYMENT (NO MIDTRANS)
// ========================================
function selectExam(exam) {
    selectedExam = exam;
    showToast(`${exam.toUpperCase()} dipilih! ✅`);
}

function checkUserEntitlement() {
    if (!currentUser) return;

    // Simulate entitlement check (localStorage + role)
    const role = localStorage.getItem('userRole') || 'student';
    const statusEl = document.getElementById('accessStatus');
    const btn = document.getElementById('userCTABtn');

    if (statusEl) statusEl.textContent = role === 'premium' ? 'PREMIUM AKTIF' : 'FREE TRIAL';
    
    if (btn) {
        if (role === 'premium') {
            btn.textContent = "🚀 Buka Dashboard";
            btn.onclick = () => window.location.href = 'dashboard.html';
        } else {
            btn.textContent = "🚀 Mulai Simulasi N5";
            btn.onclick = () => window.location.href = `exam.html?path=jlpt/n5/written/v1-lite&user=${currentUser.user_id}`;
        }
    }
}

function startFreeTrial() {
    if (!currentUser) return showToast('Login dulu! 🔐', 'error');
    window.location.href = `exam.html?path=jlpt/n5/written/v1-lite&user=${currentUser.user_id}`;
}

function buyPlan(plan, amount) {
    if (!currentUser) return showToast('Login dulu! 🔐', 'error');
    if (isProcessingPayment) return;

    isProcessingPayment = true;
    
    const orderId = `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    const rekeningInfo = `
💰 TRANSFER KE (Pilih 1):
🔹 BRI: 1234-5678-9012 a/n Jauhari Saputra
🔹 BNI: 0987-6543-2109
🔹 GoPay: 0812-3456-7890
🔹 OVO: 0812-3456-7890
🔹 DANA: 0812-3456-7890

💳 Nominal: Rp ${amount.toLocaleString()}
📋 Order ID: ${orderId}
👤 Nama: ${currentUser.name || 'User'}
📧 Email: ${localStorage.getItem('userEmail') || 'N/A'}

✅ Kirim BUKTI TRANSFER via WA:
📱 0812-3456-7890 (Admin)

⏰ Premium aktif dalam 5 menit setelah konfirmasi!
    `.trim();

    // Save pending payment to GAS
    fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'verify_payment',
            user_id: currentUser.user_id,
            plan: plan,
            amount: amount,
            order_id: orderId,
            status: 'pending'
        })
    }).then(() => {
        navigator.clipboard.writeText(rekeningInfo).then(() => {
            showToast('✅ Info rekening DI-COPY! Paste ke WA admin.', 'success');
        });
        isProcessingPayment = false;
        
        // Show modal/info
        alert(rekeningInfo);
    }).catch(err => {
        console.error('Save payment failed:', err);
        isProcessingPayment = false;
        alert(rekeningInfo);
    });
}

// ========================================
// 5. TOAST NOTIFICATIONS (UNCHANGED)
// ========================================
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position:fixed; top:120px; right:20px; z-index:10001;
        background:${type==='error'?'#ff4757':'#00ff88'}; color:#000;
        padding:15px 25px; border-radius:25px; font-weight:bold;
        box-shadow:0 10px 30px rgba(0,0,0,0.3); transform:translateX(400px);
        transition:all 0.4s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => toast.style.transform = 'translateX(0)');
    setTimeout(() => {
        toast.style.transform = 'translateX(400px)';
        setTimeout(() => toast.remove(), 400);
    }, 3500);
}

// ========================================
// 6. LIVE NOTIFICATIONS (UNCHANGED)
// ========================================
const notifications = [
    "Doni Jakarta upgrade PREMIUM! 🎉",
    "Siti Surabaya beli PRO -40%! 💰",
    "Andi Bandung N5 skor 92%! 🔥",
    "Rina Medan LIFETIME! 💎",
    "Budi Makassar free trial! 🚀",
    "Dewi Yogyakarta PREMIUM! 🎓",
    "Agus Bali join! 👋"
];

function initLiveNotifications() {
    const notifEl = document.getElementById('liveNotifications');
    let idx = 0;

    function showNotif() {
        if (notifEl) {
            notifEl.textContent = notifications[idx];
            notifEl.classList.add('show');
            setTimeout(() => {
                notifEl.classList.remove('show');
                idx = (idx + 1) % notifications.length;
            }, 8000);
        }
    }

    setTimeout(showNotif, 2000);
    setInterval(showNotif, 10000);
}

// ========================================
// 7. INIT & SESSION RESTORE
// ========================================
console.log('✅ GAS Backend Ready! URL:', GAS_URL);

window.addEventListener('DOMContentLoaded', () => {
    // Restore session
    const savedUserId = localStorage.getItem('userId');
    const savedRole = localStorage.getItem('userRole');
    
    if (savedUserId && !currentUser) {
        console.log('🔄 Restoring session:', savedUserId);
        currentUser = { user_id: savedUserId };
        checkUserEntitlement();
    }
    
    // Init notifications
    initLiveNotifications();
});

console.log('✅ Nihongo Mastery v2.1 LIVE - GitHub Pages + GAS!');