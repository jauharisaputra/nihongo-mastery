FRONTEND STATIC (GitHub Pages)
├── index.html (copy index.php → HTML pure)
├── dashboard.html
├── exam.html
├── success.html
└── assets/
    ├── css/style.css
    ├── js/main.js (API → GAS URL)
    ├── images/
    ├── audio/
    └── exams/ (JSON files)

BACKEND GAS (Deploy ke script.google.com)
├── Code.gs (doPost: register/save_result/verify manual)
└── Sheet: users|payments|results (1 Sheet saja)

PROXY (Netlify CORS jika perlu)
├── _headers (/* Access-Control-Allow-Origin: *)
└── register.html (fetch GAS)

Setup: 1. Copy assets 2. GAS deploy 3. JS update URL 4. git push gh-pages
