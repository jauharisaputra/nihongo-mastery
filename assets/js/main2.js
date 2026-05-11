console.log('🚀 Nihongo Mastery JS v3.0 - GITHUB PAGES + GAS FIXED');

// ========================================
// GLOBAL STATE
// ========================================
let currentUser = null;
let selectedExam = 'jlpt-n5';
let promoEndTime;
let notifInterval;
let isProcessingPayment = false;

// ========================================
// GOOGLE APPS SCRIPT URL
// ========================================
const GAS_URL = 'https://script.google.com/macros/s/AKfycbzdDuFwNNMQQUoV3YAhzJctS9M2t0wr8c3WDwIU5fc1q8Lb1mHmFAwsCUEXIL_s1zMC/exec';

console.log('✅ GAS URL:', GAS_URL);

// ========================================
// 1. COUNTDOWN PROMO
// ========================================
function initCountdown() {

    promoEndTime = Date.now() + (10 * 60 * 1000);

    updateCountdownDisplay();

    setInterval(updateCountdownDisplay, 1000);
}

function updateCountdownDisplay() {

    const timer = document.getElementById('countdown-timer');

    if (!timer) return;

    const now = Date.now();

    const diff = promoEndTime - now;

    if (diff <= 0) {

        timer.textContent = '00:00';

        return;
    }

    const minutes = Math.floor(diff / 60000);

    const seconds = Math.floor((diff % 60000) / 1000);

    timer.textContent =
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// ========================================
// 2. TOAST
// ========================================
function showToast(message, type = 'success') {

    const toast = document.createElement('div');

    toast.style.cssText = `
        position: fixed;
        top: 120px;
        right: 20px;
        z-index: 99999;
        background: ${type === 'error' ? '#ff4757' : '#00ff88'};
        color: #000;
        padding: 15px 25px;
        border-radius: 15px;
        font-weight: bold;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        transform: translateX(400px);
        transition: all .4s ease;
        max-width: 320px;
    `;

    toast.textContent = message;

    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        toast.style.transform = 'translateX(0)';
    });

    setTimeout(() => {

        toast.style.transform = 'translateX(400px)';

        setTimeout(() => {
            toast.remove();
        }, 400);

    }, 3500);
}

// ========================================
// 3. JWT PARSER
// ========================================
function parseJwt(token) {

    try {

        const base64Url = token.split('.')[1];

        const base64 = base64Url
            .replace(/-/g, '+')
            .replace(/_/g, '/');

        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map(c =>
                    '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
                )
                .join('')
        );

        return JSON.parse(jsonPayload);

    } catch (err) {

        console.error('JWT Parse Error:', err);

        return null;
    }
}

// ========================================
// 4. UPDATE USER UI
// ========================================
function updateUserUI(user) {

    console.log('🎉 LOGIN SUCCESS:', user);

    currentUser = user;

    // SAVE SESSION
    localStorage.setItem('userId', user.user_id || '');
    localStorage.setItem('userEmail', user.email || '');
    localStorage.setItem('userName', user.name || '');
    localStorage.setItem('userRole', user.role || 'student');

    // ========================================
    // HEADER
    // ========================================
    const header = document.getElementById('userHeader');

    if (header) {
        header.style.display = 'flex';
    }

    // ========================================
    // USER NAME
    // ========================================
    const userNameDisplay =
        document.getElementById('userNameDisplay');

    if (userNameDisplay) {
        userNameDisplay.textContent =
            user.name || 'User';
    }

    // ========================================
    // AVATAR
    // ========================================
    const avatar =
        document.getElementById('userAvatar');

    if (avatar) {

        avatar.src =
            `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=1a1a3e&color=ffd700&size=128`;
    }

    // ========================================
    // CTA
    // ========================================
    const guestCTA =
        document.getElementById('guestCTA');

    const personalCTA =
        document.getElementById('personalCTA');

    if (guestCTA) guestCTA.style.display = 'none';

    if (personalCTA) personalCTA.style.display = 'block';

    // ========================================
    // BADGE
    // ========================================
    const badge = document.getElementById('n5-badge');

    if (badge) {

        badge.textContent =
            user.role === 'premium'
                ? '💎 Premium'
                : '✅ Free';

        badge.className =
            user.role === 'premium'
                ? 'access-badge premium'
                : 'access-badge free';
    }

    showToast(`Welcome ${user.name}! 🎓`);

    checkUserEntitlement();
}

// ========================================
// 5. LOGOUT
// ========================================
function logoutUser() {

    currentUser = null;

    localStorage.clear();

    const header = document.getElementById('userHeader');

    if (header) {
        header.style.display = 'none';
    }

    const personalCTA =
        document.getElementById('personalCTA');

    const guestCTA =
        document.getElementById('guestCTA');

    if (personalCTA) personalCTA.style.display = 'none';

    if (guestCTA) guestCTA.style.display = 'block';

    showToast('Logout berhasil!');
}

// ========================================
// 6. REGISTER USER TO GAS
// ========================================
async function registerUser(user) {

    try {

        console.log('📡 Sending to GAS:', user);

        const response = await fetch(GAS_URL, {

            method: 'POST',

            // ========================================
            // 🔥 FIX CORS PRE-FLIGHT
            // ========================================
            headers: {
                'Content-Type': 'text/plain;charset=utf-8'
            },

            body: JSON.stringify({
                action: 'register',
                email: user.email,
                name: user.name
            })
        });

        const data = await response.json();

        console.log('✅ GAS RESPONSE:', data);

        if (data.success) {

            const finalUser = {
                user_id: data.user_id,
                email: user.email,
                name: user.name,
                role: data.role || 'student'
            };

            updateUserUI(finalUser);

            return finalUser;
        }

        throw new Error(data.error || 'Register failed');

    } catch (err) {

        console.error('❌ REGISTER ERROR:', err);

        // ========================================
        // FALLBACK OFFLINE MODE
        // ========================================
        const fallbackUser = {
            user_id: 'guest_' + Date.now(),
            email: user.email,
            name: user.name,
            role: 'student'
        };

        updateUserUI(fallbackUser);

        showToast('Offline mode login', 'error');

        return fallbackUser;
    }
}

// ========================================
// 7. GOOGLE LOGIN CALLBACK
// ========================================
async function handleGoogleLogin(response) {

    try {

        console.log('🔐 Google Login Started');

        const payload = parseJwt(response.credential);

        console.log('👤 Google Payload:', payload);

        if (!payload) {

            showToast('Google login gagal!', 'error');

            return;
        }

        await registerUser({
            email: payload.email,
            name: payload.name
        });

    } catch (err) {

        console.error('❌ GOOGLE LOGIN ERROR:', err);

        showToast('Login gagal!', 'error');
    }
}

// ========================================
// 8. CHECK USER ACCESS
// ========================================
function checkUserEntitlement() {

    if (!currentUser) return;

    const role =
        localStorage.getItem('userRole') || 'student';

    const statusEl =
        document.getElementById('accessStatus');

    const btn =
        document.getElementById('userCTABtn');

    if (statusEl) {

        statusEl.textContent =
            role === 'premium'
                ? '💎 PREMIUM AKTIF'
                : '🆓 FREE TRIAL';
    }

    if (btn) {

        if (role === 'premium') {

            btn.textContent =
                '🚀 Buka Dashboard';

            btn.onclick = () => {
                window.location.href =
                    'dashboard.html';
            };

        } else {

            btn.textContent =
                '🚀 Mulai Simulasi N5';

            btn.onclick = () => {

                window.location.href =
                    `exam.html?path=jlpt/n5/written/v1-lite&user=${currentUser.user_id}`;
            };
        }
    }
}

// ========================================
// 9. START FREE TRIAL
// ========================================
function startFreeTrial() {

    if (!currentUser) {

        showToast('Login dulu!', 'error');

        return;
    }

    window.location.href =
        `exam.html?path=jlpt/n5/written/v1-lite&user=${currentUser.user_id}`;
}

// ========================================
// 10. SELECT EXAM
// ========================================
function selectExam(exam) {

    selectedExam = exam;

    showToast(`${exam.toUpperCase()} dipilih!`);
}

// ========================================
// 11. BUY PLAN
// ========================================
async function buyPlan(plan, amount) {

    if (!currentUser) {

        showToast('Login dulu!', 'error');

        return;
    }

    if (isProcessingPayment) return;

    isProcessingPayment = true;

    try {

        const orderId =
            `ORDER-${Date.now()}`;

        const paymentInfo = `
💰 TRANSFER KE:

🔹 BRI: 1234-5678-9012
🔹 DANA: 0812-3456-7890

💳 Nominal:
Rp ${amount.toLocaleString('id-ID')}

📋 Order ID:
${orderId}

👤 Nama:
${currentUser.name}

📧 Email:
${currentUser.email}

📱 Kirim bukti transfer ke admin.
        `.trim();

        // SAVE PAYMENT
        await fetch(GAS_URL, {

            method: 'POST',

            headers: {
                'Content-Type': 'text/plain;charset=utf-8'
            },

            body: JSON.stringify({
                action: 'verify_payment',
                user_id: currentUser.user_id,
                order_id: orderId,
                plan: plan,
                amount: amount,
                status: 'pending'
            })
        });

        try {

            await navigator.clipboard.writeText(paymentInfo);

            showToast('Info pembayaran dicopy!');

        } catch (e) {
            console.log('Clipboard blocked');
        }

        alert(paymentInfo);

    } catch (err) {

        console.error(err);

        showToast('Payment gagal!', 'error');

    } finally {

        isProcessingPayment = false;
    }
}

// ========================================
// 12. LIVE NOTIFICATIONS
// ========================================
const notifications = [

    "Doni Jakarta upgrade PREMIUM! 🎉",
    "Siti Surabaya beli PRO! 💰",
    "Andi Bandung skor N5 92%! 🔥",
    "Rina Medan beli LIFETIME! 💎",
    "Agus Bali join FREE TRIAL! 🚀"
];

function initLiveNotifications() {

    const notifEl =
        document.getElementById('liveNotifications');

    if (!notifEl) return;

    let idx = 0;

    function showNotif() {

        notifEl.textContent =
            notifications[idx];

        notifEl.classList.add('show');

        setTimeout(() => {

            notifEl.classList.remove('show');

        }, 5000);

        idx =
            (idx + 1) % notifications.length;
    }

    setTimeout(showNotif, 2000);

    setInterval(showNotif, 9000);
}

// ========================================
// 13. RESTORE SESSION
// ========================================
function restoreSession() {

    const userId =
        localStorage.getItem('userId');

    if (!userId) return;

    currentUser = {

        user_id: userId,

        email:
            localStorage.getItem('userEmail'),

        name:
            localStorage.getItem('userName'),

        role:
            localStorage.getItem('userRole')
    };

    console.log('🔄 Session restored:', currentUser);

    updateUserUI(currentUser);
}

// ========================================
// 14. INIT
// ========================================
window.addEventListener('DOMContentLoaded', () => {

    console.log('🌐 DOM READY');

    restoreSession();

    initCountdown();

    initLiveNotifications();

    console.log('✅ Nihongo Mastery Ready!');
});

console.log('✅ main.js loaded successfully');