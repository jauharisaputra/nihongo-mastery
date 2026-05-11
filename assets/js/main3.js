console.log('🚀 Nihongo Mastery JS v4.0 - PAYMENT SYSTEM FIXED');

// ========================================
// GLOBAL STATE
// ========================================
let currentUser = null;
let selectedExam = 'jlpt-n5';
let promoEndTime;
let isProcessingPayment = false;

// ========================================
// GOOGLE APPS SCRIPT URL
// ========================================
const GAS_URL =
    'https://script.google.com/macros/s/AKfycbzdDuFwNNMQQUoV3YAhzJctS9M2t0wr8c3WDwIU5fc1q8Lb1mHmFAwsCUEXIL_s1zMC/exec';

console.log('✅ GAS URL:', GAS_URL);

// ========================================
// 1. COUNTDOWN
// ========================================
function initCountdown() {

    promoEndTime =
        Date.now() + (10 * 60 * 1000);

    updateCountdownDisplay();

    setInterval(updateCountdownDisplay, 1000);
}

function updateCountdownDisplay() {

    const timer =
        document.getElementById('countdown-timer');

    if (!timer) return;

    const now = Date.now();

    const diff =
        promoEndTime - now;

    if (diff <= 0) {

        timer.textContent = '00:00';

        return;
    }

    const minutes =
        Math.floor(diff / 60000);

    const seconds =
        Math.floor((diff % 60000) / 1000);

    timer.textContent =
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// ========================================
// 2. TOAST
// ========================================
function showToast(message, type = 'success') {

    const toast =
        document.createElement('div');

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

        toast.style.transform =
            'translateX(400px)';

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

        const base64Url =
            token.split('.')[1];

        const base64 =
            base64Url
            .replace(/-/g, '+')
            .replace(/_/g, '/');

        const jsonPayload =
            decodeURIComponent(
                atob(base64)
                .split('')
                .map(c =>
                    '%' +
                    ('00' + c.charCodeAt(0).toString(16))
                    .slice(-2)
                )
                .join('')
            );

        return JSON.parse(jsonPayload);

    } catch (err) {

        console.error(err);

        return null;
    }
}

// ========================================
// 4. UPDATE USER UI
// ========================================
function updateUserUI(user) {

    currentUser = user;

    // SAVE SESSION
    localStorage.setItem(
        'userId',
        user.user_id || ''
    );

    localStorage.setItem(
        'userEmail',
        user.email || ''
    );

    localStorage.setItem(
        'userName',
        user.name || ''
    );

    localStorage.setItem(
        'userRole',
        user.role || 'student'
    );

    // ========================================
    // HEADER
    // ========================================
    const header =
        document.getElementById('userHeader');

    if (header) {

        header.style.display = 'flex';
    }

    // ========================================
    // NAME
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
    // STATUS
    // ========================================
    const userStatus =
        document.getElementById('userStatus');

    if (userStatus) {

        if (
            user.role === 'premium' ||
            user.role === 'pro' ||
            user.role === 'lifetime'
        ) {

            userStatus.textContent =
                '💎 Premium Active';

            userStatus.style.background =
                '#ffd700';

            userStatus.style.color =
                '#000';

        } else {

            userStatus.textContent =
                '🆓 Free User';

            userStatus.style.background =
                '#10b981';

            userStatus.style.color =
                '#fff';
        }
    }

    // ========================================
    // CTA
    // ========================================
    const guestCTA =
        document.getElementById('guestCTA');

    if (guestCTA) {

        guestCTA.style.display = 'none';
    }

    showToast(
        `Welcome ${user.name}! 🎉`
    );

    checkUserEntitlement();
}

// ========================================
// 5. LOGOUT
// ========================================
function logoutUser() {

    currentUser = null;

    localStorage.clear();

    location.reload();
}

// ========================================
// 6. REGISTER USER
// ========================================
async function registerUser(user) {

    try {

        const response =
            await fetch(GAS_URL, {

                method: 'POST',

                headers: {
                    'Content-Type': 'text/plain;charset=utf-8'
                },

                body: JSON.stringify({

                    action: 'register',

                    email: user.email,

                    name: user.name
                })
            });

        const data =
            await response.json();

        console.log('REGISTER:', data);

        if (data.success) {

            const finalUser = {

                user_id: data.user_id,

                email: data.email,

                name: data.name,

                role: data.role
            };

            updateUserUI(finalUser);

            return finalUser;
        }

        throw new Error(data.error);

    } catch (err) {

        console.error(err);

        showToast(
            'Register gagal!',
            'error'
        );
    }
}

// ========================================
// 7. GOOGLE LOGIN CALLBACK
// ========================================
async function handleGoogleLogin(response) {

    try {

        const payload =
            parseJwt(response.credential);

        if (!payload) {

            showToast(
                'Google login gagal!',
                'error'
            );

            return;
        }

        await registerUser({

            email: payload.email,

            name: payload.name
        });

    } catch (err) {

        console.error(err);

        showToast(
            'Login gagal!',
            'error'
        );
    }
}

// ========================================
// 8. CHECK USER ACCESS
// ========================================
function checkUserEntitlement() {

    if (!currentUser) return;

    const role =
        localStorage.getItem('userRole') || 'student';

    console.log('ROLE:', role);

    // PREMIUM ACCESS
    if (
        role === 'premium' ||
        role === 'pro' ||
        role === 'lifetime'
    ) {

        console.log('💎 PREMIUM USER');

    } else {

        console.log('🆓 FREE USER');
    }
}

// ========================================
// 9. START FREE TRIAL
// ========================================
function startFreeTrial() {

    if (!currentUser) {

        showToast(
            'Login dulu!',
            'error'
        );

        return;
    }

    window.location.href =
        `exam.html?path=jlpt/n5/written/v1-lite&user=${currentUser.user_id}`;
}

// ========================================
// 10. BUY PLAN
// ========================================
async function buyPlan(plan, amount) {

    if (!currentUser) {

        showToast(
            'Login dulu!',
            'error'
        );

        return;
    }

    if (isProcessingPayment) return;

    isProcessingPayment = true;

    try {

        const orderId =
            `ORDER-${Date.now()}`;

        // ========================================
        // SAVE PAYMENT
        // ========================================
        const response =
            await fetch(GAS_URL, {

                method: 'POST',

                headers: {
                    'Content-Type': 'text/plain;charset=utf-8'
                },

                body: JSON.stringify({

                    action: 'create_payment',

                    user_id: currentUser.user_id,

                    plan: plan,

                    amount: amount,

                    order_id: orderId
                })
            });

        const data =
            await response.json();

        console.log('PAYMENT:', data);

        if (!data.success) {

            throw new Error(data.error);
        }

        // ========================================
        // REDIRECT PAYMENT PAGE
        // ========================================
        window.location.href =
            `payment.html?order_id=${orderId}&plan=${plan}&amount=${amount}`;

    } catch (err) {

        console.error(err);

        showToast(
            'Gagal membuat pembayaran!',
            'error'
        );

    } finally {

        isProcessingPayment = false;
    }
}

// ========================================
// 11. CHECK PREMIUM ACCESS
// ========================================
function hasPremiumAccess() {

    const role =
        localStorage.getItem('userRole');

    return (
        role === 'premium' ||
        role === 'pro' ||
        role === 'lifetime'
    );
}

// ========================================
// 12. OPEN PREMIUM EXAM
// ========================================
function openPremiumExam(examPath) {

    if (!currentUser) {

        showToast(
            'Login dulu!',
            'error'
        );

        return;
    }

    if (!hasPremiumAccess()) {

        showToast(
            'Upgrade premium dulu!',
            'error'
        );

        return;
    }

    window.location.href =
        `exam.html?path=${examPath}&user=${currentUser.user_id}`;
}

// ========================================
// 13. LIVE NOTIFICATIONS
// ========================================
const notifications = [

    'Rina Jakarta upgrade PREMIUM 💎',

    'Andi Bandung lulus JLPT 🔥',

    'Sari Surabaya beli LIFETIME 👑',

    'Kevin Bali unlock Full Exam 🎧',

    'Doni Medan join PRO ⚡'
];

function initLiveNotifications() {

    const notifEl =
        document.getElementById('liveNotif');

    if (!notifEl) return;

    const titleEl =
        document.getElementById('notifTitle');

    const msgEl =
        document.getElementById('notifMessage');

    let idx = 0;

    function showNotif() {

        if (titleEl) {

            titleEl.textContent =
                notifications[idx];
        }

        if (msgEl) {

            msgEl.textContent =
                'Baru saja bergabung!';
        }

        notifEl.classList.add('show');

        setTimeout(() => {

            notifEl.classList.remove('show');

        }, 5000);

        idx =
            (idx + 1) %
            notifications.length;
    }

    setTimeout(showNotif, 3000);

    setInterval(showNotif, 12000);
}

// ========================================
// 14. RESTORE SESSION
// ========================================
async function restoreSession() {

    const userId =
        localStorage.getItem('userId');

    const email =
        localStorage.getItem('userEmail');

    if (!userId || !email) return;

    try {

        const response =
            await fetch(
                `${GAS_URL}?action=check_user&email=${encodeURIComponent(email)}`
            );

        const data =
            await response.json();

        console.log('RESTORE:', data);

        if (data.success) {

            currentUser = {

                user_id: data.user_id,

                email: data.email,

                name: data.name,

                role: data.role
            };

            updateUserUI(currentUser);
        }

    } catch (err) {

        console.error(err);
    }
}

// ========================================
// 15. SAVE EXAM RESULT
// ========================================
async function saveExamResult(
    examPath,
    score,
    totalQuestions,
    timeUsed
) {

    if (!currentUser) return;

    try {

        const response =
            await fetch(GAS_URL, {

                method: 'POST',

                headers: {
                    'Content-Type': 'text/plain;charset=utf-8'
                },

                body: JSON.stringify({

                    action: 'save_result',

                    user_id: currentUser.user_id,

                    exam_path: examPath,

                    score: score,

                    total_questions: totalQuestions,

                    time_used: timeUsed
                })
            });

        const data =
            await response.json();

        console.log('RESULT SAVED:', data);

    } catch (err) {

        console.error(err);
    }
}

// ========================================
// 16. INIT
// ========================================
window.addEventListener(
    'DOMContentLoaded',
    () => {

        console.log('🌐 DOM READY');

        restoreSession();

        initCountdown();

        initLiveNotifications();

        console.log('✅ Nihongo Mastery Ready!');
    }
);

console.log('✅ main.js loaded successfully');