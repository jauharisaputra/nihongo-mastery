console.log('🚀 Nihongo Mastery JS v2.0 - FULLY FUNCTIONAL');

let currentUser = null;
let selectedExam = 'jlpt-n5';
let snapToken = null;
let promoEndTime;
let notifInterval;

// ========================================
// 1. COUNTDOWN 10 MENIT PROMO
// ========================================
function initCountdown() {
    promoEndTime = Date.now() + (10 * 60 * 1000); // 10 minutes
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

    // Urgent red < 2min
    const timerEl = document.getElementById('countdown-timer');
    if (diff < 120000) {
        timerEl.style.background = 'rgba(255,0,0,0.4)';
        timerEl.style.color = '#fff';
        timerEl.style.boxShadow = '0 0 20px rgba(255,0,0,0.8)';
    }
}
initCountdown();

// ========================================
// 2. USER LOGIN/UI FUNCTIONS
// ========================================
function updateUserUI(user) {
    console.log('🎉 Login Success:', user);
    currentUser = user;
    // 🔥 TAMBAHKAN INI (Simpan ID ke browser agar tidak hilang saat refresh)
    localStorage.setItem('userId', user.id);
    // Header
    const header = document.getElementById('userHeader');
    header.style.display = 'block';
    document.getElementById('userNameDisplay').textContent = user.name || 'User';
    document.getElementById('userAvatar').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=1a1a3e&color=ffd700&size=40`;

    // CTA Switch
    const guestCTA =
        document.getElementById('guestCTA');

    const personalCTA =
        document.getElementById('personalCTA');

    const n5Badge =
        document.getElementById('n5-badge');

    if (guestCTA) {
        guestCTA.style.display = 'none';
    }

    if (personalCTA) {
        personalCTA.style.display = 'block';
    }

    if (n5Badge) {
        n5Badge.textContent = '✅ Free';
        n5Badge.className = 'access-badge free';
    }

    showToast(`Welcome ${user.name}! 🎓`);
    // 🔥 TAMBAHKAN INI (Panggil fungsi check agar status loading hilang)
    checkUserEntitlement();

    showToast(`Welcome ${user.name}! 🎓`);
}

function logoutUser() {
    currentUser = null;
    localStorage.removeItem('userId'); // 🔥 TAMBAHKAN INI
    document.getElementById('userHeader').style.display = 'none';
    document.getElementById('personalCTA').style.display = 'none';
    document.getElementById('guestCTA').style.display = 'block';
    showToast('Logged out successfully!');
}

// ========================================
// 3. GOOGLE LOGIN HANDLER
// ========================================
function handleGoogleLogin(response) {
    console.log('🔐 Google Login Triggered');
    const idToken = response.credential;

    fetch('api/register.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token: idToken,
                method: 'google'
            })
        })
        .then(res => {
            console.log('API Status:', res.status);
            return res.json();
        })
        .then(data => {
            console.log('API Response:', data);
            if (data.success && data.user) {
                updateUserUI(data.user);
            } else {
                console.error('Login failed:', data);
                showToast('Login gagal: ' + (data.error || 'Unknown'), 'error');
            }
        })
        .catch(err => {
            console.error('Network error:', err);
            showToast('Koneksi error!', 'error');
        });
}

// ========================================
// 4. EXAM & PAYMENT FUNCTIONS
// ========================================
function selectExam(exam) {
    selectedExam = exam;
    showToast(`${exam.toUpperCase()} dipilih! ✅`);
}

function checkEntitlement(type, exam, callback) {
    if (!currentUser) return callback(false);
    fetch(`api/register.php?action=check&user_id=${currentUser.id}&exam=${exam}&type=${type}`)
        .then(res => res.json())
        .then(data => callback(!!data.hasAccess))
        .catch(() => callback(false));
}
// TAMBAHKAN INI DI BAGIAN 4
function checkUserEntitlement() {
    if (!currentUser) return;

    fetch(`api/register.php?action=check&user_id=${currentUser.id}&exam=jlpt-n5&type=premium`)
        .then(res => res.json())
        .then(data => {
            const statusEl = document.getElementById('accessStatus');
            const btn = document.getElementById('userCTABtn');

            if (statusEl) statusEl.textContent = data.hasAccess ? 'PREMIUM AKTIF' : 'FREE TRIAL';

            if (btn) {
                if (data.hasAccess) {
                    // USER PREMIUM: Tombol mengarah ke Dashboard
                    btn.textContent = "🚀 Buka Dashboard";
                    btn.onclick = () => window.location.href = 'dashboard.html';
                } else {
                    // USER FREE: Tombol langsung ujian N5
                    btn.textContent = "🚀 Mulai Simulasi N5";
                    btn.onclick = () => window.location.href = `exam.html?path=jtest/de/written/v1&mode=free`; // 🔥 UBAH KE SIMULASI N5 GRATIS
                }
            }
        })
        .catch(err => console.error('Entitlement check error:', err));
}

function startFreeTrial() {
    if (!currentUser) return showToast('Login dulu! 🔐', 'error');
    checkEntitlement('free', selectedExam, (hasAccess) => {
        if (hasAccess) {
            window.location.href = `dashboard.html?exam=${selectedExam}&mode=free`;
        } else {
            showToast('Free trial habis. Upgrade yuk! 💰');
        }
    });
}
// Tambahkan variabel di atas (global)
let isProcessingPayment = false;

function buyPlan(plan, amount) {
    if (!currentUser) return showToast('Login dulu! 🔐', 'error');
    if (isProcessingPayment) return; // 🔥 MENCEGAH KLIK GANDA

    isProcessingPayment = true;
    showToast('Membuat token pembayaran...', 'info');

    fetch('api/create-token.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: currentUser.id,
                name: currentUser.name,
                email: currentUser.email,
                amount: amount,
                plan: plan,
                exam: selectedExam
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.token) {
                snap.pay(data.token, {
                    onSuccess: (result) => {

                        console.log('✅ PAYMENT SUCCESS:', result);

                        isProcessingPayment = false;

                        // =========================
                        // SIMPAN STATUS PREMIUM
                        // =========================
                        localStorage.setItem('premium_access', 'true');

                        // simpan plan
                        localStorage.setItem('premium_plan', plan);

                        // simpan order id
                        localStorage.setItem(
                            'premium_order_id',
                            result.order_id || ''
                        );

                        // simpan waktu aktivasi
                        localStorage.setItem(
                            'premium_date',
                            new Date().toISOString()
                        );

                        // optional
                        localStorage.setItem(
                            'premium_user',
                            currentUser.id
                        );

                        showToast('🎉 Premium berhasil aktif!');

                        // redirect
                        setTimeout(() => {

                            window.location.href =
                                'dashboard.html';

                        }, 1500);

                    },
                    onPending: (result) => {
                        isProcessingPayment = false;
                        showToast('⏳ Menunggu pembayaran.');
                    },
                    onError: (result) => {
                        isProcessingPayment = false;
                        showToast('❌ Pembayaran gagal.', 'error');
                    },
                    onClose: () => {
                        isProcessingPayment = false; // 🔥 PENTING: Reset state saat popup ditutup
                    }
                });
            } else {
                isProcessingPayment = false;
                showToast('Token error: ' + (data.error || 'Unknown'), 'error');
            }
        })
        .catch(err => {
            isProcessingPayment = false;
            showToast('Error: ' + err.message, 'error');
        });
}
// ========================================
// 5. TOAST NOTIFICATIONS
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

    // Animate in
    requestAnimationFrame(() => toast.style.transform = 'translateX(0)');

    // Remove
    setTimeout(() => {
        toast.style.transform = 'translateX(400px)';
        setTimeout(() => toast.remove(), 400);
    }, 3500);
}

// ========================================
// 6. LIVE NOTIFICATIONS
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
        notifEl.textContent = notifications[idx];
        notifEl.classList.add('show');

        setTimeout(() => {
            notifEl.classList.remove('show');
            idx = (idx + 1) % notifications.length;
        }, 8000);
    }

    setTimeout(showNotif, 2000);
    setInterval(showNotif, 10000);
}
initLiveNotifications();

// ========================================
// 7. INIT
// ========================================
console.log('✅ All systems ready!');
// 🔥 TAMBAHKAN DI PALING BAWAH
window.addEventListener('DOMContentLoaded', () => {
    const savedUserId = localStorage.getItem('userId');
    if (savedUserId && !currentUser) {
        console.log('🔄 Restoring session for user:', savedUserId);
        fetch(`api/register.php?action=user&id=${savedUserId}`)
            .then(res => res.json())
            .then(user => {
                if (user.id) updateUserUI(user);
            });
    }
});