// ═══════════════════════════════════════════════════════════
//  HACKERMAN SINGULARITY TERMINAL v10.0 — Motor Principal
// ═══════════════════════════════════════════════════════════

// ═══ DOM ═══
const outputEl     = document.getElementById('output');
const inputEl      = document.getElementById('cmd-input');
const promptTextEl = document.getElementById('prompt-text');
const ghostEl      = document.getElementById('ghost-text');
const matrixCanvas = document.getElementById('matrix-canvas');
const mtx          = matrixCanvas.getContext('2d');
const starCanvas   = document.getElementById('star-canvas');
const stx          = starCanvas.getContext('2d');
const particlesCv  = document.getElementById('particles-canvas');
const ptx          = particlesCv.getContext('2d');
const toastsEl     = document.getElementById('toasts');
const notifEl      = document.getElementById('notifications');

// ⬇️ DECLARAÇÕES QUE FALTAVAM ⬇️
const bootScreen    = document.getElementById('boot-screen');
const bootText      = document.getElementById('boot-text');
const bootBar       = document.getElementById('boot-bar');
const paletteOv     = document.getElementById('palette-overlay');
const paletteInput  = document.getElementById('palette-input');
const paletteRes    = document.getElementById('palette-results');
const themeEditorOv = document.getElementById('theme-editor-overlay');
const startMenuEl   = document.getElementById('start-menu');

// ═══ ESTADO ═══
window.state = {
    history:       JSON.parse(localStorage.getItem('hk_history') || '[]'),
    historyIndex:  0,
    isTyping:      false,
    matrixActive:  false,
    matrixInterval:null,
    starsActive:   false,
    starsInterval: null,
    soundEnabled:  localStorage.getItem('hk_sound') === 'on',
    soundCtx:      null,
    speed:         localStorage.getItem('hk_speed') || 'normal',
    guessGame:     null,
    snakeGame:     null,
    pongGame:      null,
    blackjackGame: null,
    quizGame:      null,
    editingFile:   null,
    spyInterval:   null,
    cpuInterval:   null,
    aliases:       JSON.parse(localStorage.getItem('hk_aliases') || '{}'),
    currentDir:    '~',
    recording:     false,
    recorded:      [],
    particles:     [],
    playerName:    'guest',
};

// ═══ FS ═══
function loadFS() {
    const saved = localStorage.getItem('hk_fs_v5');
    if (saved) {
        try { return JSON.parse(saved); } catch(e) {}
    }
    return {
        '~': {
            type: 'dir',
            children: {
                'README.txt': { type: 'file', content: 'Hackerman v10 — Singularity Edition!\nBem-vindo ao futuro. 🚀' },
                'welcome.md': { type: 'file', content: '# Bem-vindo ao v10\n\n## O que há de novo:\n- Janelas flutuantes\n- IA com API real\n- Multiplayer entre abas\n- Jogos: snake, pong, blackjack\n- Editor de código\n- Cofre encriptado\n- E muito mais!' },
                '.env':       { type: 'file', content: 'API_KEY=hackerman_v10_secreta\nDB_PASS=admin123' },
                'secret.txt': { type: 'file', content: 'A password do WiFi do vizinho é... brincadeira! 😏' },
                'projetos':   { type: 'dir', children: {
                    'hackerman-v10.md': { type: 'file', content: 'O terminal mais épico do mundo!' },
                    'neural-vis.md':    { type: 'file', content: 'Visualizador 3D de redes neuronais.' },
                }},
            }
        }
    };
}
window.FS = loadFS();
function saveFS() { try { localStorage.setItem('hk_fs_v5', JSON.stringify(window.FS)); } catch(e) {} }

function getNode(path) {
    const FS = window.FS;
    if (path === '~') return FS['~'];
    const parts = path.replace('~/', '').split('/');
    let n = FS['~'];
    for (const q of parts) {
        if (!n.children || !n.children[q]) return null;
        n = n.children[q];
    }
    return n;
}
window.getNode = getNode;

function updateFileCount() {
    let count = 0;
    (function walk(n) {
        if (!n.children) return;
        for (const k in n.children) {
            count++;
            if (n.children[k].type === 'dir') walk(n.children[k]);
        }
    })(window.FS['~']);
    const el = document.getElementById('tk-files');
    if (el) el.textContent = count;
}

// ═══ PARTÍCULAS ═══
function spawnParticles(x, y, count = 15, color = null) {
    for (let i = 0; i < count; i++) {
        state.particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            life: 1,
            color: color || getComputedStyle(document.body).getPropertyValue('--main-color').trim() || '#00ff66',
        });
    }
}
function renderParticles() {
    ptx.clearRect(0, 0, particlesCv.width, particlesCv.height);
    state.particles = state.particles.filter(p => p.life > 0);
    state.particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;
        ptx.globalAlpha = p.life;
        ptx.fillStyle = p.color;
        ptx.shadowColor = p.color;
        ptx.shadowBlur = 10;
        ptx.fillRect(p.x, p.y, 2, 2);
    });
    ptx.globalAlpha = 1;
    ptx.shadowBlur = 0;
    requestAnimationFrame(renderParticles);
}
function resizeParticles() {
    particlesCv.width = window.innerWidth;
    particlesCv.height = window.innerHeight;
}

// ═══ SOM ═══
function playClick() {
    if (!state.soundEnabled) return;
    try {
        if (!state.soundCtx) state.soundCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = state.soundCtx.createOscillator();
        const gain = state.soundCtx.createGain();
        osc.type = 'square';
        osc.frequency.value = 800 + Math.random() * 400;
        gain.gain.setValueAtTime(0.02, state.soundCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, state.soundCtx.currentTime + 0.05);
        osc.connect(gain); gain.connect(state.soundCtx.destination);
        osc.start(); osc.stop(state.soundCtx.currentTime + 0.05);
    } catch (e) {}
}
window.playNote = function(freq, duration = 0.3, type = 'sine') {
    try {
        if (!state.soundCtx) state.soundCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = state.soundCtx.createOscillator();
        const gain = state.soundCtx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.1, state.soundCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, state.soundCtx.currentTime + duration);
        osc.connect(gain); gain.connect(state.soundCtx.destination);
        osc.start(); osc.stop(state.soundCtx.currentTime + duration);
    } catch (e) {}
};

// ═══ TOASTS ═══
function toast(msg, type = '') {
    const t = document.createElement('div');
    t.className = 'toast ' + type;
    t.textContent = msg;
    toastsEl.appendChild(t);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 300); }, 3000);
}
window.toast = toast;

function notify(msg) {
    const n = document.createElement('div');
    n.className = 'notification';
    n.textContent = msg;
    notifEl.appendChild(n);
    setTimeout(() => { n.style.opacity = '0'; setTimeout(() => n.remove(), 300); }, 4000);
}

// ═══ MATRIX ═══
window.setupMatrix = function() {
    matrixCanvas.width = window.innerWidth;
    matrixCanvas.height = window.innerHeight;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()*&^%áàãâéêíóôõúç';
    const fontSize = 14;
    const columns = Math.floor(matrixCanvas.width / fontSize);
    const drops = Array(columns).fill(1);
    function draw() {
        mtx.fillStyle = 'rgba(0,0,0,0.05)';
        mtx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);
        mtx.fillStyle = getComputedStyle(document.body).getPropertyValue('--main-color').trim() || '#00ff66';
        mtx.font = fontSize + 'px monospace';
        for (let i = 0; i < drops.length; i++) {
            const text = chars.charAt(Math.floor(Math.random() * chars.length));
            mtx.fillText(text, i * fontSize, drops[i] * fontSize);
            if (drops[i] * fontSize > matrixCanvas.height && Math.random() > 0.975) drops[i] = 0;
            drops[i]++;
        }
    }
    if (state.matrixInterval) clearInterval(state.matrixInterval);
    state.matrixInterval = setInterval(draw, 33);
};

window.setupStars = function() {
    starCanvas.width = window.innerWidth;
    starCanvas.height = window.innerHeight;
    const stars = Array.from({ length: 200 }, () => ({
        x: Math.random() * starCanvas.width,
        y: Math.random() * starCanvas.height,
        z: Math.random() * 3 + 1,
        speed: Math.random() * 2 + 0.5,
    }));
    function draw() {
        stx.fillStyle = 'rgba(0,0,0,0.3)';
        stx.fillRect(0, 0, starCanvas.width, starCanvas.height);
        stx.fillStyle = getComputedStyle(document.body).getPropertyValue('--main-color').trim() || '#00ff66';
        stars.forEach(s => {
            stx.globalAlpha = s.z / 4;
            stx.beginPath();
            stx.arc(s.x, s.y, s.z * 0.5, 0, Math.PI * 2);
            stx.fill();
            s.y += s.speed * s.z * 0.3;
            if (s.y > starCanvas.height) { s.y = 0; s.x = Math.random() * starCanvas.width; }
        });
        stx.globalAlpha = 1;
    }
    if (state.starsInterval) clearInterval(state.starsInterval);
    state.starsInterval = setInterval(draw, 33);
};

// ═══ TYPING ═══
function getSpeed() { return state.speed === 'turbo' ? 1 : state.speed === 'slow' ? 30 : 12; }

function typeText(text, callback, customSpeed) {
    state.isTyping = true;
    inputEl.disabled = true;
    const lineEl = document.createElement('div');
    lineEl.className = 'line';
    outputEl.appendChild(lineEl);
    const speed = customSpeed ?? getSpeed();
    let index = 0;
    function process() {
        if (index < text.length) {
            if (text[index] === '<') {
                const close = text.indexOf('>', index);
                if (close !== -1) { lineEl.innerHTML += text.substring(index, close + 1); index = close + 1; }
                else lineEl.innerHTML += text[index++];
            } else {
                lineEl.innerHTML += text[index++];
                if (text[index - 1] !== ' ' && Math.random() < 0.3) playClick();
            }
            scrollBottom();
            setTimeout(process, speed);
        } else {
            state.isTyping = false;
            inputEl.disabled = false;
            focusInput();
            if (callback) callback();
        }
    }
    process();
}

function appendOutput(html, animate = true) {
    const lineEl = document.createElement('div');
    lineEl.className = 'line' + (animate ? ' fade-in' : '');
    lineEl.innerHTML = html;
    outputEl.appendChild(lineEl);
    scrollBottom();
}

function scrollBottom() {
    const body = document.getElementById('terminal-body');
    if (body) body.scrollTop = body.scrollHeight;
}

function focusInput() {
    if (!state.isTyping && !state.snakeGame && !state.pongGame && !state.blackjackGame && !state.quizGame && !state.editingFile) {
        inputEl.focus();
    }
}

function updatePrompt() {
    const dir = state.currentDir === '~' ? '~' : state.currentDir;
    promptTextEl.textContent = `guest@hackerman:${dir}$`;
    const tkDir = document.getElementById('tk-dir');
    if (tkDir) tkDir.textContent = dir;
}

function glitchEffect() {
    document.body.classList.add('glitch');
    setTimeout(() => document.body.classList.remove('glitch'), 300);
}

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function escapeHtml(str) {
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;")
        .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

// ═══ BANNER ═══
const BANNER = `
██╗  ██╗ █████╗  ██████╗██╗  ██╗███████╗██████╗ ███╗   ███╗ █████╗ ███╗   ██╗
██║  ██║██╔══██╗██╔════╝██║ ██╔╝██╔════╝██╔══██╗████╗ ████║██╔══██╗████╗  ██║
███████║███████║██║     █████╔╝ █████╗  ██████╔╝██╔████╔██║███████║██╔██╗ ██║
██╔══██║██╔══██║██║     ██╔═██╗ ██╔══╝  ██╔══██╗██║╚██╔╝██║██╔══██║██║╚██╗██║
██║  ██║██║  ██║╚██████╗██║  ██╗███████╗██║  ██║██║ ╚═╝ ██║██║  ██║██║ ╚████║
╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝
═══════════════════════════════════════════════════════════════════════════
        🔥 HACKERMAN SINGULARITY TERMINAL v10.0.0 🔥
              [BUILD 9999-SINGULARITY] — NEURAL EDITION
═══════════════════════════════════════════════════════════════════════════
   Escreve 'help' ou clica nos ícones do topo. Ctrl+K paleta.
═══════════════════════════════════════════════════════════════════════════
`;

// ═══ DADOS ═══
const SKILLS_DATA = [
    { name: 'HTML5 / CSS3 / SASS',     level: 95 },
    { name: 'JavaScript (ES6+) / TS',  level: 90 },
    { name: 'React / Vue.js',          level: 85 },
    { name: 'Node.js / Express',       level: 80 },
    { name: 'Python / Scripting',      level: 75 },
    { name: 'Git / Docker / Linux',    level: 85 },
    { name: 'Cibersegurança',          level: 88 },
    { name: 'Quantum Computing',       level: 42 },
    { name: 'Neural Networks',         level: 68 },
];

const PROJECTS_DATA = [
    { title: 'CyberNet-OS',   desc: 'SO futurista em Web Techs.',           link: '#' },
    { title: 'Neural-Vis',    desc: 'Visualizador 3D de redes neuronais.',   link: '#' },
    { title: 'CryptoPulse',   desc: 'Dashboard de cripto com WebSockets.',   link: '#' },
    { title: 'Retro-Arcade',  desc: 'Jogos de terminal clássicos em Canvas.', link: '#' },
    { title: 'Hackerman-TTY', desc: 'Este terminal v10.',                   link: '#' },
    { title: 'Quantum-Chat',  desc: 'Chat encriptado pós-quântico.',        link: '#' },
];

const JOKES = [
    "Porque é que o programador foi ao médico? Tinha um bug! 🐛",
    "Há 10 tipos de pessoas: as que entendem binário e as que não. 🤓",
    "Um SQL entra num bar, aproxima-se de duas mesas: 'Posso fazer JOIN?' 🍺",
    "Porque é que o Java dev usa óculos? Porque não consegue C#. 👓",
    "Debugging: ser o detetive num filme onde TU és o criminoso. 🔍",
    "99 bugs no código, tira um, faz patch, 127 bugs no código. 🎵",
];

const FORTUNES = [
    "O melhor código é aquele que nunca precisas de escrever.",
    "Um bug evitado é melhor que dois corrigidos.",
    "Nunca faças deploy à sexta. 🚫",
    "Se funciona, não mexas.",
    "Refactorar é como arrumar o quarto.",
    "Programa como se o próximo leitor fosse um psicopata.",
];

const WEATHER_FAKE = [
    "☀️  Lisboa: 22°C — Céu limpo",
    "🌧️  Porto: 15°C — Chuva",
    "⛅  Madrid: 25°C — Nublado",
    "❄️  Moscovo: -8°C — Neve",
    "🔥  Dubai: 42°C — Sol",
];

// ═══ COMANDOS ═══
const COMMANDS = {
    help: 'Lista todos os comandos.',
    about: 'Sobre o desenvolvedor.',
    skills: 'Competências técnicas.',
    projects: 'Projetos.',
    theme: 'Muda o tema: theme <nome>.',
    themes: '🎨 Abre editor de temas.',
    banner: 'Logótipo ASCII.',
    matrix: 'Toggle chuva Matrix.',
    stars: 'Toggle campo de estrelas.',
    sound: 'Toggle som.',
    speed: 'Muda velocidade: speed [slow|normal|turbo].',
    turbo: 'Atalho para velocidade turbo.',
    focus: 'Modo foco.',
    clear: 'Limpa ecrã. (Ctrl+L)',
    echo: 'Repete texto.',
    date: 'Data e hora.',
    whoami: 'Quem sou eu.',
    ls: 'Lista ficheiros.',
    cd: 'Muda diretório.',
    pwd: 'Diretório atual.',
    cat: 'Mostra ficheiro.',
    mkdir: 'Cria diretório.',
    touch: 'Cria ficheiro.',
    rm: 'Remove.',
    tree: 'Árvore de ficheiros.',
    edit: 'Edita ficheiro.',
    sudo: 'Tenta root.',
    ping: 'Ping a host.',
    neofetch: 'Info sistema.',
    weather: 'Tempo. "weather real" para API real.',
    joke: 'Piada.',
    ip: 'IP fake.',
    scan: 'Scan portas.',
    decrypt: 'Efeito desencriptar.',
    encrypt: 'Encripta base64.',
    coffee: 'Café virtual.',
    guess: 'Adivinha o número.',
    snake: 'Jogo Snake.',
    pong: 'Jogo Pong.',
    blackjack: '🃏 Blackjack.',
    quiz: '🧠 Quiz.',
    play: 'Melodia ASCII.',
    synth: 'Sintetizador.',
    chart: 'Gráfico animado.',
    cpu: 'Monitor de CPU.',
    spy: 'Vigilância fake.',
    ai: 'Chat IA. "ai persona <nome>" muda personalidade.',
    alias: 'Cria atalho.',
    unalias: 'Remove atalho.',
    aliases: 'Lista aliases.',
    history: 'Histórico.',
    palette: 'Paleta. (Ctrl+K)',
    snapshot: 'Snapshot sistema.',
    fortune: 'Frase aleatória.',
    roll: 'Dado: roll 2d20.',
    calc: 'Calculadora.',
    base64: 'Base64 enc/dec.',
    crypto: 'Preços cripto reais.',
    record: 'Grava sessão.',
    replay: 'Replay da sessão.',
    export: 'Exporta FS.',
    import: 'Importa FS.',
    imgascii: 'Imagem → ASCII.',
    png: 'Screenshot PNG.',
    gallery: 'Galeria ASCII.',
    dash: 'Dashboard.',
    apps: 'Lista apps.',
    open: 'Abre app: open <nome>.',
    players: 'Chat multiplayer.',
    tut: '🎓 Tutorial interativo.',
    exit: 'Adeus.',
};

// ═══ API ═══
async function fetchCrypto(coin) {
    const map = { bitcoin:'BTC', ethereum:'ETH', solana:'SOL', dogecoin:'DOGE', cardano:'ADA', polkadot:'DOT', ripple:'XRP', litecoin:'LTC' };
    if (!map[coin]) return null;
    try {
        const r = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coin}&vs_currencies=usd,eur&include_24hr_change=true`);
        return (await r.json())[coin];
    } catch (e) { return null; }
}

async function fetchWeatherReal(city) {
    try {
        const geo = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=pt`).then(r => r.json());
        if (!geo.results?.[0]) return null;
        const { latitude, longitude, name, country } = geo.results[0];
        const w = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`).then(r => r.json());
        return { name, country, ...w.current_weather };
    } catch (e) { return null; }
}

// ═══ HANDLER PRINCIPAL ═══
function handleCommand(rawCmd) {
    const original = rawCmd;
    const parts0 = rawCmd.trim().split(/\s+/);
    if (state.aliases[parts0[0]]) rawCmd = state.aliases[parts0[0]] + ' ' + parts0.slice(1).join(' ');
    const cmd = rawCmd.trim();

    appendOutput(`<div><span class="prompt">${promptTextEl.textContent}</span> ${escapeHtml(original)}</div>`);

    if (cmd !== '') {
        if (state.history[state.history.length - 1] !== original) state.history.push(original);
        state.historyIndex = state.history.length;
        localStorage.setItem('hk_history', JSON.stringify(state.history.slice(-100)));
        if (state.recording) state.recorded.push(original);
        if (window.AI) AI.learn(cmd);
    }

    if (state.editingFile) { handleEdit(cmd); return; }
    if (state.guessGame && cmd !== '') { if (handleGuess(cmd)) return; }
    if (state.blackjackGame && cmd !== '') { if (handleBlackjack(cmd)) return; }
    if (state.quizGame && cmd !== '') { if (handleQuiz(cmd)) return; }

    const parts = cmd.split(/\s+/);
    const mainCmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (mainCmd) {
        case '': break;

        case 'help': {
            let txt = '<span class="highlight">╔══ COMANDOS ══╗</span><br><br>';
            Object.keys(COMMANDS).sort().forEach(k => {
                txt += `  <span class="highlight">${k.padEnd(11, ' ')}</span> ${COMMANDS[k]}<br>`;
            });
            txt += '<br><span class="dim">💡 Tab completa | Ctrl+K paleta | !atalho | Apps no topo</span>';
            typeText(txt, null, 3);
            break;
        }

        case 'about': typeText(`<span class="highlight">SOBRE:</span>\n👤 Alex "Hackerman" Silva\n💼 Full-Stack / Neural\n🟢 Disponível\n🎯 Interfaces retro, cibersegurança, IA`); break;

        case 'skills': {
            let t = '<span class="highlight">SKILLS:</span><br><br>';
            SKILLS_DATA.forEach(s => {
                const f = Math.round((s.level / 100) * 20);
                t += `${s.name.padEnd(30, ' ')} [${'█'.repeat(f)}${'░'.repeat(20-f)}] ${s.level}%<br>`;
            });
            typeText(t, null, 5);
            break;
        }

        case 'projects': {
            let t = '<span class="highlight">PROJETOS:</span><br><br>';
            PROJECTS_DATA.forEach((p, i) => {
                t += `  [0${i+1}] <span class="highlight">${p.title}</span> — ${p.desc}<br>`;
            });
            typeText(t, null, 4);
            break;
        }

        case 'theme': {
            const t = (args[0] || '').toLowerCase();
            const valid = ['matrix','cyberpunk','ice','red','dracula','nord','gruvbox','tokyo','synthwave','solarized','monokai','ocean','forest','sunset','mono'];
            if (valid.includes(t)) {
                document.body.className = `theme-${t}`;
                localStorage.setItem('hk_theme', t);
                const el = document.getElementById('tb-theme');
                if (el) el.textContent = t.toUpperCase();
                typeText(`🎨 Tema: <span class="highlight">${t.toUpperCase()}</span>`);
                spawnParticles(window.innerWidth / 2, window.innerHeight / 2, 30);
            } else typeText(`<span class="alert">Inválido.</span> ${valid.join(', ')}`);
            break;
        }

        case 'themes': openThemeEditor(); break;

        case 'banner': appendOutput(`<div class="ascii-art">${BANNER}</div>`); break;

        case 'matrix': {
            state.matrixActive = !state.matrixActive;
            matrixCanvas.classList.toggle('active', state.matrixActive);
            if (state.matrixActive) { window.setupMatrix(); typeText('🟢 Matrix ON.'); }
            else { clearInterval(state.matrixInterval); typeText('Matrix OFF.'); }
            break;
        }

        case 'stars': {
            state.starsActive = !state.starsActive;
            starCanvas.classList.toggle('active', state.starsActive);
            if (state.starsActive) { window.setupStars(); typeText('🌌 Estrelas ON.'); }
            else { clearInterval(state.starsInterval); typeText('Estrelas OFF.'); }
            break;
        }

        case 'sound': {
            state.soundEnabled = !state.soundEnabled;
            localStorage.setItem('hk_sound', state.soundEnabled ? 'on' : 'off');
            const el = document.getElementById('tk-sound');
            if (el) el.textContent = state.soundEnabled ? 'ON' : 'OFF';
            typeText(`🔊 Som: ${state.soundEnabled ? 'ON' : 'OFF'}`);
            break;
        }

        case 'speed': {
            const s = (args[0] || '').toLowerCase();
            if (['slow','normal','turbo'].includes(s)) {
                state.speed = s;
                localStorage.setItem('hk_speed', s);
                const el = document.getElementById('tk-speed');
                if (el) el.textContent = s.toUpperCase();
                typeText(`⚡ Velocidade: ${s.toUpperCase()}`);
            } else typeText('<span class="warn">slow | normal | turbo</span>');
            break;
        }

        case 'turbo': {
            state.speed = state.speed === 'turbo' ? 'normal' : 'turbo';
            localStorage.setItem('hk_speed', state.speed);
            const el = document.getElementById('tk-speed');
            if (el) el.textContent = state.speed.toUpperCase();
            typeText(`⚡ ${state.speed.toUpperCase()}`);
            break;
        }

        case 'focus': {
            document.body.classList.toggle('focus-mode');
            typeText(`🎯 Foco: ${document.body.classList.contains('focus-mode') ? 'ON' : 'OFF'}`);
            break;
        }

        case 'clear': outputEl.innerHTML = ''; break;

        case 'echo': typeText(escapeHtml(args.join(' ')) || '<span class="dim">(vazio)</span>'); break;

        case 'date': typeText('📅 ' + new Date().toLocaleString('pt-PT')); break;

        case 'whoami': typeText('<span class="highlight">guest</span> (root 😎)'); break;

        case 'ls': {
            const node = getNode(state.currentDir);
            if (!node?.children || Object.keys(node.children).length === 0) { typeText('<span class="dim">(vazio)</span>'); break; }
            const html = Object.entries(node.children).map(([n, i]) =>
                i.type === 'dir' ? `<span class="accent bold">📁 ${n}/</span>` : `<span class="highlight">📄 ${n}</span>`
            ).join('   ');
            typeText(html);
            break;
        }

        case 'cd': {
            const target = args[0] || '~';
            if (target === '~') { state.currentDir = '~'; updatePrompt(); break; }
            if (target === '..') {
                if (state.currentDir !== '~') {
                    const parts2 = state.currentDir.split('/');
                    parts2.pop();
                    state.currentDir = parts2.join('/') || '~';
                    updatePrompt();
                }
                break;
            }
            const newPath = state.currentDir === '~' ? `~/${target}` : `${state.currentDir}/${target}`;
            const node = getNode(newPath);
            if (node?.type === 'dir') { state.currentDir = newPath; updatePrompt(); }
            else { glitchEffect(); typeText(`<span class="alert">cd: ${escapeHtml(target)}: Não encontrado</span>`); }
            break;
        }

        case 'pwd': typeText(state.currentDir); break;

        case 'cat': {
            const file = args[0];
            if (!file) { typeText('<span class="warn">cat &lt;ficheiro&gt;</span>'); break; }
            const path = state.currentDir === '~' ? `~/${file}` : `${state.currentDir}/${file}`;
            const node = getNode(path);
            if (node?.type === 'file') typeText(escapeHtml(node.content));
            else { glitchEffect(); typeText(`<span class="alert">Não encontrado.</span>`); }
            break;
        }

        case 'mkdir': {
            const name = args[0];
            if (!name) { typeText('<span class="warn">mkdir &lt;nome&gt;</span>'); break; }
            const node = getNode(state.currentDir);
            if (node.children[name]) { typeText('<span class="alert">Já existe.</span>'); break; }
            node.children[name] = { type: 'dir', children: {} };
            saveFS();
            updateFileCount();
            typeText(`✅ '${escapeHtml(name)}' criado.`);
            break;
        }

        case 'touch': {
            const name = args[0];
            if (!name) { typeText('<span class="warn">touch &lt;nome&gt;</span>'); break; }
            const node = getNode(state.currentDir);
            if (node.children[name]) { typeText('<span class="warn">Já existe.</span>'); break; }
            node.children[name] = { type: 'file', content: '' };
            saveFS();
            updateFileCount();
            typeText(`✅ '${escapeHtml(name)}' criado.`);
            break;
        }

        case 'rm': {
            const name = args[0];
            if (!name) { typeText('<span class="warn">rm &lt;nome&gt;</span>'); break; }
            const node = getNode(state.currentDir);
            if (!node.children[name]) { glitchEffect(); typeText('<span class="alert">Não encontrado.</span>'); break; }
            delete node.children[name];
            saveFS();
            updateFileCount();
            typeText(`🗑️ '${escapeHtml(name)}' removido.`);
            break;
        }

        case 'tree': {
            let t = `<span class="highlight">${state.currentDir}</span><br>`;
            const node = getNode(state.currentDir);
            (function walk(n, prefix = '') {
                if (!n.children) return;
                const entries = Object.entries(n.children);
                entries.forEach(([k, v], i) => {
                    const last = i === entries.length - 1;
                    t += `${prefix}${last ? '└── ' : '├── '}${v.type === 'dir' ? '📁' : '📄'} ${k}<br>`;
                    if (v.type === 'dir') walk(v, prefix + (last ? '    ' : '│   '));
                });
            })(node);
            typeText(t, null, 4);
            break;
        }

        case 'edit': {
            const name = args[0];
            if (!name) { typeText('<span class="warn">edit &lt;ficheiro&gt;</span>'); break; }
            const node = getNode(state.currentDir);
            if (!node.children[name]) node.children[name] = { type: 'file', content: '' };
            state.editingFile = { name, content: node.children[name].content };
            typeText(`<span class="accent">📝 MODO EDIÇÃO: ${escapeHtml(name)}</span>\n:w guardar | :q sair | :wq ambos | :show`);
            if (state.editingFile.content) typeText('<span class="dim">Atual:</span>\n' + escapeHtml(state.editingFile.content));
            inputEl.placeholder = 'linha... ou :wq';
            break;
        }

        case 'sudo': {
            typeText('<span class="warn">[sudo] password para guest:</span> ********');
            setTimeout(() => {
                typeText('<span class="alert">guest não está no sudoers. 🚨</span>');
                glitchEffect();
                spawnParticles(window.innerWidth / 2, window.innerHeight / 2, 30, '#ff3333');
            }, 800);
            break;
        }

        case 'ping': {
            const host = args[0] || 'localhost';
            typeText(`PING ${escapeHtml(host)}: 56 data bytes`, () => {
                let i = 0;
                const loop = setInterval(() => {
                    appendOutput(`64 bytes from ${escapeHtml(host)}: icmp_seq=${i} ttl=64 time=${(Math.random()*40+5).toFixed(1)} ms`);
                    if (++i >= 4) { clearInterval(loop); setTimeout(() => typeText('\n4 packets, 0% loss'), 300); }
                }, 500);
            }, 4);
            break;
        }

        case 'neofetch': {
            const up = Math.floor(performance.now() / 1000) + 's';
            appendOutput(`<pre style="color:var(--main-color);white-space:pre;font-family:monospace;line-height:1.2">
<span class="highlight">        ▄▄▄▄▄▄▄▄        </span>  <span class="bold">guest@hackerman</span>
<span class="highlight">      ▄██████████▄      </span>  ─────────────────
<span class="highlight">    ▄██████████████▄    </span>  OS      : HackermanOS v10
<span class="highlight">   ██████████████████   </span>  Kernel  : JS-Singularity
<span class="highlight">  ████████████████████  </span>  Shell   : hksh v10
<span class="highlight">  ████████████████████  </span>  Uptime  : ${up}
<span class="highlight">   ██████████████████   </span>  Theme   : ${document.body.className.replace('theme-','')}
<span class="highlight">    ▀██████████████▀    </span>  Sound   : ${state.soundEnabled ? 'on' : 'off'}
<span class="highlight">      ▀██████████▀      </span>  Speed   : ${state.speed}
<span class="highlight">        ▀▀▀▀▀▀▀▀        </span>  Apps    : ${window.Apps ? Apps.running.size : 0}
                              Aliases : ${Object.keys(state.aliases).length}
                              Hist    : ${state.history.length}
</pre>`);
            break;
        }

        case 'weather': {
            if (args[0] === 'real') {
                typeText('🌦️ A obter...', async () => {
                    const w = await fetchWeatherReal(args[1] || 'Lisbon');
                    if (w) {
                        const emoji = w.weathercode < 3 ? '☀️' : w.weathercode < 50 ? '⛅' : w.weathercode < 70 ? '🌧️' : '❄️';
                        typeText(`${emoji} <span class="highlight">${w.name}, ${w.country}</span>\n🌡️  ${w.temperature}°C\n💨 ${w.windspeed} km/h`);
                    } else typeText('<span class="alert">Erro. Tenta outra cidade.</span>');
                });
            } else typeText(WEATHER_FAKE[rand(0, WEATHER_FAKE.length-1)]);
            break;
        }

        case 'joke': typeText('😂 ' + JOKES[rand(0, JOKES.length-1)]); break;

        case 'ip': typeText(`🌐 <span class="highlight">${rand(1,255)}.${rand(0,255)}.${rand(0,255)}.${rand(1,255)}</span>`); break;

        case 'scan': {
            const host = args[0];
            if (!host) { typeText('<span class="warn">scan &lt;host&gt;</span>'); break; }
            typeText(`🔍 A escanear ${escapeHtml(host)}...`, () => {
                const ports = [22, 80, 443, 3306, 8080, 1337];
                let i = 0;
                const loop = setInterval(() => {
                    if (i >= ports.length) { clearInterval(loop); setTimeout(() => typeText('\n✅ Completo.'), 200); return; }
                    const open = Math.random() > 0.5;
                    appendOutput(`Porta ${ports[i].toString().padEnd(5)} → <span class="${open ? 'highlight' : 'dim'}">${open ? 'OPEN' : 'closed'}</span>`);
                    i++;
                }, 200);
            }, 4);
            break;
        }

        case 'decrypt': {
            const msg = args.join(' ');
            if (!msg) { typeText('<span class="warn">decrypt &lt;msg&gt;</span>'); break; }
            typeText('🔐 A desencriptar...', () => {
                const chars = '█▓▒░@#$%&*!?';
                let it = 0;
                const lineEl = document.createElement('div');
                lineEl.className = 'line';
                outputEl.appendChild(lineEl);
                const iv = setInterval(() => {
                    let d = '';
                    for (let i = 0; i < msg.length; i++) d += i < it / 3 ? msg[i] : chars[rand(0, chars.length-1)];
                    lineEl.innerHTML = `<span class="highlight">${d}</span>`;
                    if (++it / 3 >= msg.length) {
                        clearInterval(iv);
                        lineEl.innerHTML = `<span class="highlight">${escapeHtml(msg)}</span>`;
                        typeText('\n🔓 Completo!');
                    }
                }, 40);
            }, 4);
            break;
        }

        case 'encrypt': {
            const msg = args.join(' ');
            if (!msg) { typeText('<span class="warn">encrypt &lt;msg&gt;</span>'); break; }
            typeText(`🔒 ${btoa(unescape(encodeURIComponent(msg)))}`);
            break;
        }

        case 'base64': {
            const mode = args[0], txt = args.slice(1).join(' ');
            if (!mode || !txt) { typeText('<span class="warn">base64 enc|dec &lt;txt&gt;</span>'); break; }
            try {
                if (mode === 'enc') typeText(`📤 ${btoa(unescape(encodeURIComponent(txt)))}`);
                else if (mode === 'dec') typeText(`📥 ${decodeURIComponent(escape(atob(txt)))}`);
                else typeText('<span class="warn">enc ou dec</span>');
            } catch (e) { typeText('<span class="alert">Erro.</span>'); }
            break;
        }

        case 'coffee': {
            appendOutput(`<pre style="color:var(--main-color)">
       ( (
        ) )
     ........
     |      |]
     \\      /
      \`----'</pre>`);
            typeText('☕ Café! 💪');
            break;
        }

        case 'guess':
            state.guessGame = { number: rand(1, 100), tries: 0 };
            typeText('🎮 Adivinha (1-100). Ou "sair".');
            break;

        case 'snake': startSnake(); break;
        case 'pong': startPong(); break;
        case 'blackjack': startBlackjack(); break;
        case 'quiz': startQuiz(); break;

        case 'play': {
            typeText('🎵 A tocar...', null, 20);
            const n = ['♪','♫','♩','♬'];
            let i = 0;
            const iv = setInterval(() => {
                appendOutput(`<span class="accent">${n.map(() => n[rand(0,3)]).join(' ')}</span>`, false);
                if (++i > 8) clearInterval(iv);
            }, 180);
            break;
        }

        case 'synth': {
            const mel = [
                { n: 'C4', f: 261.63 }, { n: 'D4', f: 293.66 }, { n: 'E4', f: 329.63 },
                { n: 'G4', f: 392 }, { n: 'A4', f: 440 }, { n: 'C5', f: 523.25 },
            ];
            typeText('🎵 Escala...', () => {
                mel.forEach((m, i) => setTimeout(() => {
                    appendOutput(`<span class="accent">♪ ${m.n} (${m.f} Hz)</span>`, false);
                    window.playNote(m.f, 0.4);
                }, i * 350));
                setTimeout(() => typeText('\n🎼 Fim!'), mel.length * 350 + 500);
            }, 15);
            break;
        }

        case 'chart': {
            const bars = Array.from({ length: 20 }, () => Math.random());
            let f = 0;
            const iv = setInterval(() => {
                outputEl.lastChild?.remove();
                let t = '<span class="highlight">📊 LIVE</span><br>';
                bars.forEach((b, i) => {
                    const h = Math.floor(Math.abs(Math.sin((f + i) / 3)) * 20) + 1;
                    t += `<span class="${h > 15 ? 'alert' : h > 10 ? 'warn' : 'accent'}">${'█'.repeat(h)}</span> ${h*5}%<br>`;
                });
                const el = document.createElement('div');
                el.className = 'line';
                el.innerHTML = t;
                outputEl.appendChild(el);
                scrollBottom();
                if (++f > 30) { clearInterval(iv); typeText('\n<span class="dim">Fim.</span>'); }
            }, 150);
            break;
        }

        case 'cpu': {
            if (state.cpuInterval) { clearInterval(state.cpuInterval); state.cpuInterval = null; typeText('CPU parado.'); break; }
            typeText('🖥️ Monitor ON. "cpu" para parar.');
            const c = document.createElement('div');
            c.className = 'line';
            outputEl.appendChild(c);
            state.cpuInterval = setInterval(() => {
                const cpu = rand(5, 95), mem = rand(20, 80);
                const bar = v => { const f = Math.round(v/5); return '█'.repeat(f) + '░'.repeat(20-f); };
                c.innerHTML = `CPU: [${bar(cpu)}] ${cpu}%\nRAM: [${bar(mem)}] ${mem}%\n🌡️  ${rand(40,75)}°C   ⚡ ${rand(1,5)}.${rand(0,9)} GHz`;
                scrollBottom();
            }, 800);
            break;
        }

        case 'spy': {
            if (state.spyInterval) { clearInterval(state.spyInterval); state.spyInterval = null; typeText('🕵️ Parado.'); break; }
            typeText('🕵️ <span class="highlight">VIGILÂNCIA ON</span> (Ctrl+C ou "spy" para parar)');
            const ips = ['192.168.1.1','10.0.0.42','172.16.0.8','8.8.8.8','1.1.1.1'];
            state.spyInterval = setInterval(() => {
                appendOutput(`<span class="dim">[${new Date().toLocaleTimeString()}]</span> ${['TCP','UDP','HTTPS','DNS'][rand(0,3)].padEnd(6)} ${ips[rand(0,4)]}:${rand(1024,65535)} ${Math.random()>0.9?'<span class="alert">⚠️</span>':''}`, false);
            }, 600);
            break;
        }

        case 'ai': {
            if (!window.AI) { typeText('<span class="alert">Módulo IA não carregado.</span>'); break; }
            if (args[0] === 'persona') {
                const p = args[1];
                if (AI.personalities[p]) {
                    AI.personality = p;
                    localStorage.setItem('hk_ai_pers', p);
                    typeText(`🤖 Personalidade: <span class="highlight">${p.toUpperCase()}</span>`);
                } else typeText(`<span class="warn">${Object.keys(AI.personalities).join(', ')}</span>`);
                break;
            }
            const msg = args.join(' ');
            if (!msg) { typeText('<span class="warn">ai &lt;msg&gt; ou ai persona &lt;nome&gt;</span>'); break; }
            typeText('<span class="dim">🤖 IA a pensar...</span>', async () => {
                const resp = await AI.think(msg);
                typeText(`<span class="accent">🤖 ${resp}</span>`, null, 20);
            });
            break;
        }

        case 'alias': {
            const m = args.join(' ').match(/^(\w+)=(.+)$/);
            if (!m) { typeText('<span class="warn">alias nome=comando</span>'); break; }
            state.aliases[m[1]] = m[2];
            localStorage.setItem('hk_aliases', JSON.stringify(state.aliases));
            typeText(`✅ ${m[1]} → ${escapeHtml(m[2])}`);
            break;
        }

        case 'unalias': {
            delete state.aliases[args[0]];
            localStorage.setItem('hk_aliases', JSON.stringify(state.aliases));
            typeText(`🗑️ Removido.`);
            break;
        }

        case 'aliases': {
            const keys = Object.keys(state.aliases);
            if (!keys.length) { typeText('<span class="dim">Nenhum.</span>'); break; }
            let t = '<span class="highlight">ALIASES:</span><br>';
            keys.forEach(k => t += `  <span class="accent">!${k}</span> → ${escapeHtml(state.aliases[k])}<br>`);
            typeText(t);
            break;
        }

        case 'history': {
            if (!state.history.length) { typeText('<span class="dim">Vazio.</span>'); break; }
            let t = '<span class="highlight">HISTÓRICO:</span><br>';
            state.history.slice(-20).forEach((c, i) => {
                t += `  ${(state.history.length - Math.min(20, state.history.length) + i + 1).toString().padStart(3)}  ${escapeHtml(c)}<br>`;
            });
            typeText(t, null, 3);
            break;
        }

        case 'palette': openPalette(); break;

        case 'snapshot': {
            const s = `
┌────────────────────────────────────────┐
│  HACKERMAN v10 SNAPSHOT                │
├────────────────────────────────────────┤
│  📅 ${new Date().toLocaleString('pt-PT').padEnd(35)}│
│  🎨 Tema : ${document.body.className.replace('theme-','').padEnd(27)}│
│  📁 Dir  : ${state.currentDir.padEnd(27)}│
│  🔊 Som  : ${(state.soundEnabled?'ON':'OFF').padEnd(27)}│
│  📊 Hist : ${state.history.length.toString().padEnd(27)}│
│  🕐 Uptime: ${(Math.floor(performance.now()/1000)+'s').padEnd(26)}│
│  🪟 Apps : ${window.Apps ? Apps.running.size.toString().padEnd(27) : '0'.padEnd(27)}│
└────────────────────────────────────────┘`;
            appendOutput(`<pre style="color:var(--main-color)">${s}</pre>`);
            toast('📸 Snapshot', 'accent');
            break;
        }

        case 'fortune': typeText('🔮 ' + FORTUNES[rand(0, FORTUNES.length-1)]); break;

        case 'roll': {
            const m = (args[0] || '1d6').match(/^(\d+)d(\d+)$/i);
            if (!m) { typeText('<span class="warn">roll 2d20</span>'); break; }
            const n = +m[1], f = +m[2];
            const rolls = Array.from({length: n}, () => rand(1, f));
            typeText(`🎲 ${n}d${f} → [${rolls.join(', ')}] = <span class="highlight">${rolls.reduce((a,b)=>a+b,0)}</span>`);
            break;
        }

        case 'calc': {
            const e = args.join(' ');
            if (!e || !/^[\d\s+\-*/().%]+$/.test(e)) { typeText('<span class="alert">Inválido.</span>'); break; }
            try { typeText(`= <span class="highlight">${Function('"use strict";return (' + e + ')')()}</span>`); }
            catch { typeText('<span class="alert">Erro.</span>'); }
            break;
        }

        case 'crypto': {
            const coin = (args[0] || 'bitcoin').toLowerCase();
            typeText(`🌐 A obter ${coin}...`, async () => {
                const d = await fetchCrypto(coin);
                if (!d) { typeText('<span class="alert">Inválida ou API em baixo.</span>\nTenta: bitcoin, ethereum, solana, dogecoin'); return; }
                const ch = d.usd_24h_change?.toFixed(2);
                typeText(`💰 <span class="highlight">${coin.toUpperCase()}</span>\n💵 $${d.usd?.toLocaleString()}\n💶 €${d.eur?.toLocaleString()}\n${ch > 0 ? '📈' : '📉'} 24h: ${ch}%`);
            });
            break;
        }

        case 'record': {
            state.recording = !state.recording;
            if (state.recording) { state.recorded = []; typeText('🎬 <span class="alert">REC</span> ON'); }
            else typeText(`⏹️ Parado. ${state.recorded.length} comandos. Usa "replay".`);
            break;
        }

        case 'replay': {
            if (!state.recorded.length) { typeText('<span class="warn">Nada gravado.</span>'); break; }
            typeText(`▶️ A reproduzir ${state.recorded.length} comandos...`);
            let i = 0;
            const iv = setInterval(() => {
                if (i >= state.recorded.length) { clearInterval(iv); typeText('⏹️ Fim.'); return; }
                handleCommand(state.recorded[i++]);
            }, 1200);
            break;
        }

        case 'export': {
            const blob = new Blob([JSON.stringify(window.FS, null, 2)], { type: 'application/json' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `hackerman-fs-${Date.now()}.json`;
            a.click();
            typeText('📤 Exportado!');
            toast('Exportado', 'accent');
            break;
        }

        case 'import': {
            try {
                const p = JSON.parse(args.join(' '));
                if (p['~']) { window.FS = p; saveFS(); updateFileCount(); typeText('📥 Importado!'); }
                else typeText('<span class="alert">Inválido.</span>');
            } catch { typeText('<span class="alert">JSON inválido.</span>'); }
            break;
        }

        case 'imgascii': {
            const fi = document.getElementById('file-input');
            if (fi) fi.click();
            typeText('🖼️ Abre seletor...');
            break;
        }

        case 'png': captureAsPNG(); break;

        case 'gallery': {
            const G = {
                cat: ` /\\_/\\  \n( o.o ) \n > ^ <  `,
                skull: `   _____\n  /     \\\n | () () |\n  \\  ^  /\n   |||||\n   |||||`,
                rocket: `    /\\\n   /  \\\n  |    |\n  |NASA|\n  |    |\n /|    |\\\n/ |    | \\\n  |    |\n  |____|`,
                heart: `  **   **\n **** ****\n************\n **********\n  ********\n   ******\n    ****\n     **`,
            };
            if (!args[0]) { typeText(`🎪 Disponíveis: ${Object.keys(G).join(', ')}`); break; }
            if (G[args[0]]) appendOutput(`<pre style="color:var(--main-color)">${G[args[0]]}</pre>`);
            else typeText('<span class="alert">Não existe.</span>');
            break;
        }

        case 'dash': {
            const stats = window.AI ? AI.commandStats : {};
            const top = Object.entries(stats).sort((a,b) => b[1] - a[1]).slice(0, 5);
            const total = Object.values(stats).reduce((a,b) => a+b, 0);
            let t = `<span class="highlight">📊 DASHBOARD v10</span>\n\n`;
            t += `📈 Total comandos: ${total}\n`;
            t += `💾 Ficheiros: ${Object.keys(getNode('~').children).length}\n`;
            t += `🪟 Apps abertas: ${window.Apps ? Apps.running.size : 0}\n`;
            t += `⚡ Velocidade: ${state.speed}\n`;
            t += `🔥 Streak: ${localStorage.getItem('hk_streak') || 0} dias\n\n`;
            t += `<span class="highlight">🏆 TOP 5:</span>\n`;
            top.forEach(([k, v], i) => t += `  ${i+1}. ${k.padEnd(14)} ${v}x\n`);
            typeText(t, null, 3);
            break;
        }

        case 'apps': {
            let t = '<span class="highlight">APPS DISPONÍVEIS:</span><br><br>';
            Object.entries(window.Apps.apps).forEach(([k, v]) => {
                t += `  ${v.icon} <span class="highlight">${k.padEnd(11)}</span> — ${v.name}<br>`;
            });
            t += `<br><span class="dim">Abre com: open &lt;nome&gt;</span>`;
            typeText(t);
            break;
        }

        case 'open': {
            const name = (args[0] || '').toLowerCase();
            if (name === 'terminal') {
                const tw = document.getElementById('terminal-window');
                if (tw) { tw.classList.remove('minimized'); if (window.Apps) Apps.bringToFront(tw); }
                typeText('📂 Terminal aberto.');
                break;
            }
            const app = window.Apps.apps[name];
            if (app && app.open) { app.open(); typeText(`📂 A abrir ${app.name}...`); }
            else typeText(`<span class="alert">App '${escapeHtml(name)}' não existe.</span> Usa "apps".`);
            break;
        }

        case 'players': window.Apps.openChat(); break;

        case 'tut': startTutorial(); break;

        case 'exit':
            typeText('👋 Adeus!\n<span class="dim">(recarrega para voltar)</span>');
            toast('Até à próxima! 👋');
            break;

        default:
            glitchEffect();
            spawnParticles(window.innerWidth / 2, window.innerHeight / 2, 10, '#ff3333');
            typeText(`<span class="alert">Comando desconhecido: '${escapeHtml(cmd)}'.</span> Escreve '<span class="highlight">help</span>'.`);
            break;
    }
}

// ═══ EDIÇÃO ═══
function handleEdit(cmd) {
    if (cmd === ':w' || cmd === ':wq') {
        const node = getNode(state.currentDir);
        node.children[state.editingFile.name].content = state.editingFile.content;
        saveFS();
        typeText('💾 Guardado.');
        if (cmd === ':wq') exitEdit();
    } else if (cmd === ':q') exitEdit();
    else if (cmd === ':show') typeText(escapeHtml(state.editingFile.content) || '<span class="dim">(vazio)</span>');
    else {
        state.editingFile.content += (state.editingFile.content ? '\n' : '') + cmd;
        appendOutput(`<span class="dim">+ ${escapeHtml(cmd)}</span>`);
    }
}
function exitEdit() {
    state.editingFile = null;
    inputEl.placeholder = '';
    typeText('👋 Saíste do editor.');
    focusInput();
}

// ═══ GUESS ═══
function handleGuess(v) {
    if (v === 'sair') { state.guessGame = null; typeText('Fim.'); return true; }
    const n = parseInt(v);
    if (isNaN(n)) { typeText('<span class="warn">Número ou "sair".</span>'); return true; }
    state.guessGame.tries++;
    if (n === state.guessGame.number) {
        const t = state.guessGame.tries;
        state.guessGame = null;
        typeText(`🎉 ACERTASTE! Era ${n}. ${t} tentativas.`);
        window.playNote(880, 0.5); setTimeout(() => window.playNote(1100, 0.5), 150);
        spawnParticles(window.innerWidth/2, window.innerHeight/2, 40);
    } else if (n < state.guessGame.number) typeText(`📈 Baixo! (${state.guessGame.tries})`);
    else typeText(`📉 Alto! (${state.guessGame.tries})`);
    return true;
}

// ═══ SNAKE ═══
function startSnake() {
    state.snakeGame = { snake: [{x:10,y:10}], dir: {x:1,y:0}, food: {x:15,y:10}, score: 0, width: 30, height: 15, interval: null };
    inputEl.disabled = true;
    typeText('🐍 SNAKE — WASD/setas. Q para sair.', () => {
        renderSnake();
        state.snakeGame.interval = setInterval(snakeTick, 150);
        window.addEventListener('keydown', snakeInput);
    });
}
function snakeInput(e) {
    if (!state.snakeGame) return;
    const d = state.snakeGame.dir, k = e.key.toLowerCase();
    if ((k === 'arrowup' || k === 'w') && d.y === 0) state.snakeGame.dir = {x:0,y:-1};
    else if ((k === 'arrowdown' || k === 's') && d.y === 0) state.snakeGame.dir = {x:0,y:1};
    else if ((k === 'arrowleft' || k === 'a') && d.x === 0) state.snakeGame.dir = {x:-1,y:0};
    else if ((k === 'arrowright' || k === 'd') && d.x === 0) state.snakeGame.dir = {x:1,y:0};
    else if (k === 'q') endSnake();
    e.preventDefault();
}
function snakeTick() {
    const g = state.snakeGame;
    if (!g) return;
    const h = { x: g.snake[0].x + g.dir.x, y: g.snake[0].y + g.dir.y };
    if (h.x < 0 || h.x >= g.width || h.y < 0 || h.y >= g.height || g.snake.some(s => s.x === h.x && s.y === h.y)) return endSnake();
    g.snake.unshift(h);
    if (h.x === g.food.x && h.y === g.food.y) {
        g.score++;
        window.playNote(600 + g.score * 20, 0.1);
        g.food = { x: rand(0, g.width-1), y: rand(0, g.height-1) };
    } else g.snake.pop();
    renderSnake();
}
function renderSnake() {
    const g = state.snakeGame;
    if (!g) return;
    outputEl.lastChild?.remove();
    let t = `<span class="highlight">🐍 SNAKE — ${g.score}</span>\n`;
    for (let y = 0; y < g.height; y++) {
        let l = '';
        for (let x = 0; x < g.width; x++) {
            if (g.snake[0].x === x && g.snake[0].y === y) l += '<span class="accent">●</span>';
            else if (g.snake.some(s => s.x === x && s.y === y)) l += '<span class="highlight">○</span>';
            else if (g.food.x === x && g.food.y === y) l += '<span class="alert">◆</span>';
            else l += '<span class="dim">·</span>';
        }
        t += l + '\n';
    }
    const el = document.createElement('div');
    el.className = 'line';
    el.style.cssText = 'line-height:1;font-family:monospace';
    el.innerHTML = t;
    outputEl.appendChild(el);
    scrollBottom();
}
function endSnake() {
    const g = state.snakeGame;
    if (!g) return;
    clearInterval(g.interval);
    window.removeEventListener('keydown', snakeInput);
    const s = g.score;
    state.snakeGame = null;
    inputEl.disabled = false;
    typeText(`\n💀 GAME OVER! Score: <span class="highlight">${s}</span>`);
    focusInput();
}

// ═══ PONG ═══
function startPong() {
    state.pongGame = { ball: {x:15,y:7,dx:1,dy:1}, paddle: {x:28,y:5,h:4}, cpu: {x:1,y:5,h:4}, ps: 0, cs: 0, width: 32, height: 15, interval: null };
    inputEl.disabled = true;
    typeText('🎮 PONG — W/S move. Q sai. Primeiro a 5.', () => {
        renderPong();
        state.pongGame.interval = setInterval(pongTick, 150);
        window.addEventListener('keydown', pongInput);
    });
}
function pongInput(e) {
    if (!state.pongGame) return;
    const p = state.pongGame.paddle, k = e.key.toLowerCase();
    if ((k === 'w' || k === 'arrowup') && p.y > 0) p.y--;
    if ((k === 's' || k === 'arrowdown') && p.y + p.h < state.pongGame.height) p.y++;
    if (k === 'q') endPong();
    e.preventDefault();
}
function pongTick() {
    const g = state.pongGame;
    if (!g) return;
    g.ball.x += g.ball.dx;
    g.ball.y += g.ball.dy;
    if (g.ball.y <= 0 || g.ball.y >= g.height - 1) g.ball.dy *= -1;
    const c = g.cpu.y + g.cpu.h / 2;
    if (c < g.ball.y - 1 && g.cpu.y + g.cpu.h < g.height) g.cpu.y++;
    else if (c > g.ball.y + 1 && g.cpu.y > 0) g.cpu.y--;
    if (g.ball.x <= g.cpu.x + 1 && g.ball.y >= g.cpu.y && g.ball.y < g.cpu.y + g.cpu.h) { g.ball.dx = 1; g.ball.x = g.cpu.x + 2; window.playNote(400, 0.1); }
    if (g.ball.x >= g.paddle.x - 1 && g.ball.y >= g.paddle.y && g.ball.y < g.paddle.y + g.paddle.h) { g.ball.dx = -1; g.ball.x = g.paddle.x - 2; window.playNote(700, 0.1); }
    if (g.ball.x < 0) { g.ps++; g.ball = {x:15,y:7,dx:-1,dy:1}; }
    if (g.ball.x > g.width) { g.cs++; g.ball = {x:15,y:7,dx:1,dy:1}; }
    if (g.ps >= 5 || g.cs >= 5) return endPong();
    renderPong();
}
function renderPong() {
    const g = state.pongGame;
    if (!g) return;
    outputEl.lastChild?.remove();
    let t = `<span class="highlight">🎮 PONG — Tu: ${g.ps} | CPU: ${g.cs}</span>\n`;
    for (let y = 0; y < g.height; y++) {
        let l = '';
        for (let x = 0; x < g.width; x++) {
            if (x === g.ball.x && y === g.ball.y) l += '<span class="accent">●</span>';
            else if (x === g.paddle.x && y >= g.paddle.y && y < g.paddle.y + g.paddle.h) l += '<span class="highlight">█</span>';
            else if (x === g.cpu.x && y >= g.cpu.y && y < g.cpu.y + g.cpu.h) l += '<span class="warn">█</span>';
            else if (x === Math.floor(g.width/2) && y % 2 === 0) l += '<span class="dim">│</span>';
            else l += ' ';
        }
        t += l + '\n';
    }
    const el = document.createElement('div');
    el.className = 'line';
    el.style.cssText = 'line-height:1;font-family:monospace';
    el.innerHTML = t;
    outputEl.appendChild(el);
    scrollBottom();
}
function endPong() {
    const g = state.pongGame;
    if (!g) return;
    clearInterval(g.interval);
    window.removeEventListener('keydown', pongInput);
    const r = g.ps >= 5 ? '🎉 GANHASTE!' : '💀 PERDESTE!';
    const sc = `${g.ps}-${g.cs}`;
    state.pongGame = null;
    inputEl.disabled = false;
    typeText(`\n${r} (${sc})`);
    focusInput();
}

// ═══ BLACKJACK ═══
function startBlackjack() {
    state.blackjackGame = { player: [], dealer: [], deck: [] };
    const suits = ['♠','♥','♦','♣'];
    const vals = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
    for (const s of suits) for (const v of vals) state.blackjackGame.deck.push({ s, v });
    state.blackjackGame.deck.sort(() => Math.random() - 0.5);
    state.blackjackGame.player.push(state.blackjackGame.deck.pop(), state.blackjackGame.deck.pop());
    state.blackjackGame.dealer.push(state.blackjackGame.deck.pop(), state.blackjackGame.deck.pop());
    inputEl.disabled = true;
    typeText('🃏 <span class="highlight">BLACKJACK</span> — "hit" ou "stand". "sair" para sair.', renderBlackjack);
}
function cardVal(c) {
    if (c.v === 'A') return 11;
    if (['J','Q','K'].includes(c.v)) return 10;
    return parseInt(c.v);
}
function handVal(h) {
    let total = h.reduce((a, c) => a + cardVal(c), 0);
    let aces = h.filter(c => c.v === 'A').length;
    while (total > 21 && aces > 0) { total -= 10; aces--; }
    return total;
}
function renderBlackjack() {
    const g = state.blackjackGame;
    if (!g) return;
    outputEl.lastChild?.remove();
    const pv = handVal(g.player);
    const dv = handVal(g.dealer);
    let t = `<span class="highlight">🃏 BLACKJACK</span>\n\n`;
    t += `🤵 Dealer: ${g.dealer.map(c => c.s + c.v).join(' ')} = ${dv}\n\n`;
    t += `👤 Tu:     ${g.player.map(c => c.s + c.v).join(' ')} = ${pv}\n`;
    const el = document.createElement('div');
    el.className = 'line';
    el.style.lineHeight = '1.4';
    el.innerHTML = t;
    outputEl.appendChild(el);
    scrollBottom();
}
function handleBlackjack(cmd) {
    const g = state.blackjackGame;
    if (!g) return false;
    const c = cmd.toLowerCase();
    if (c === 'sair') { state.blackjackGame = null; inputEl.disabled = false; typeText('Fim do jogo.'); focusInput(); return true; }
    if (c === 'hit') {
        g.player.push(g.deck.pop());
        renderBlackjack();
        const v = handVal(g.player);
        if (v > 21) {
            typeText(`<span class="alert">💥 Bust! ${v} > 21. Perdeste.</span>`);
            state.blackjackGame = null; inputEl.disabled = false; focusInput(); return true;
        }
        if (v === 21) { typeText('🎉 21! Stand automático...'); setTimeout(() => handleBlackjack('stand'), 500); }
        return true;
    }
    if (c === 'stand') {
        while (handVal(g.dealer) < 17) g.dealer.push(g.deck.pop());
        renderBlackjack();
        const pv = handVal(g.player), dv = handVal(g.dealer);
        setTimeout(() => {
            if (dv > 21 || pv > dv) { typeText(`🎉 <span class="highlight">GANHASTE!</span> ${pv} vs ${dv}`); window.playNote(880, 0.4); }
            else if (pv === dv) typeText(`🤝 Empate! ${pv} vs ${dv}`);
            else typeText(`💀 <span class="alert">PERDESTE.</span> ${pv} vs ${dv}`);
            state.blackjackGame = null; inputEl.disabled = false; focusInput();
        }, 300);
        return true;
    }
    typeText('<span class="warn">"hit" ou "stand"</span>');
    return true;
}

// ═══ QUIZ ═══
function startQuiz() {
    const questions = [
        { q: 'Qual é a saída de typeof [] em JavaScript?', a: 'object', opts: ['array','object','list','undefined'] },
        { q: 'Qual destes NÃO é tipo primitivo em JS?', a: 'object', opts: ['string','number','object','boolean'] },
        { q: 'O que significa HTML?', a: 'HyperText Markup Language', opts: ['HyperText Markup Language','High Tech Modern Language','Hyperlink Text Mark Language','Home Tool Markup Language'] },
        { q: 'Resultado de 2 + "2" em JS?', a: '22', opts: ['4','22','NaN','error'] },
        { q: 'Operador que compara valor E tipo?', a: '===', opts: ['==','===','=','!='] },
        { q: 'JavaScript foi criada por...?', a: 'Brendan Eich', opts: ['Python','Brendan Eich','James Gosling','Yukihiro Matsumoto'] },
    ];
    const q = questions[rand(0, questions.length - 1)];
    const shuffled = [...q.opts].sort(() => Math.random() - 0.5);
    state.quizGame = { correct: q.a, current: q, shuffled };
    inputEl.disabled = true;
    typeText(`🧠 <span class="highlight">QUIZ</span>\n\n${q.q}\n\n${shuffled.map((o, i) => `  ${i+1}) ${o}`).join('\n')}\n\nResponde com o número (ou "sair").`);
}
function handleQuiz(cmd) {
    const g = state.quizGame;
    if (!g) return false;
    if (cmd.toLowerCase() === 'sair') { state.quizGame = null; inputEl.disabled = false; typeText('Fim do quiz.'); focusInput(); return true; }
    const idx = parseInt(cmd) - 1;
    if (isNaN(idx) || idx < 0 || idx >= g.shuffled.length) { typeText('<span class="warn">Número 1-4 ou "sair".</span>'); return true; }
    if (g.shuffled[idx] === g.correct) {
        typeText('🎉 <span class="highlight">CORRETO!</span>');
        window.playNote(880, 0.4);
        spawnParticles(window.innerWidth/2, window.innerHeight/2, 30);
    } else {
        typeText(`❌ <span class="alert">Errado!</span> A resposta era: <span class="highlight">${g.correct}</span>`);
        glitchEffect();
    }
    state.quizGame = null;
    inputEl.disabled = false;
    focusInput();
    return true;
}

// ═══ TUTORIAL ═══
function startTutorial() {
    const steps = [
        '🎓 <span class="highlight">BEM-VINDO AO TUTORIAL!</span>\n\n1/5 - Escreve <span class="highlight">help</span> para veres todos os comandos.',
        '2/5 - Experimenta <span class="highlight">neofetch</span> para veres as infos do sistema.',
        '3/5 - Usa <span class="highlight">ls</span> para listar ficheiros e <span class="highlight">cat README.txt</span> para ler.',
        '4/5 - Testa <span class="highlight">theme dracula</span> para mudar de tema. Ou <span class="highlight">themes</span> para o editor.',
        '5/5 - Abre apps com os ícones no topo, ou digita <span class="highlight">apps</span>.\n\n🎉 Tutorial completo! Explora o resto!',
    ];
    let i = 0;
    function next() {
        if (i >= steps.length) return;
        typeText(steps[i], () => { i++; setTimeout(next, 800); });
    }
    next();
}

// ═══ PNG ═══
function captureAsPNG() {
    typeText('📸 A gerar...', () => {
        const t = outputEl.innerText;
        const lines = t.split('\n');
        const c = document.createElement('canvas');
        c.width = 1400;
        c.height = Math.max(400, lines.length * 20 + 40);
        const cx = c.getContext('2d');
        const s = getComputedStyle(document.body);
        cx.fillStyle = s.getPropertyValue('--bg-color').trim() || '#000';
        cx.fillRect(0, 0, c.width, c.height);
        cx.fillStyle = s.getPropertyValue('--main-color').trim() || '#0f0';
        cx.font = '14px monospace';
        cx.shadowColor = cx.fillStyle;
        cx.shadowBlur = 4;
        lines.forEach((l, i) => cx.fillText(l, 20, 30 + i * 20));
        c.toBlob(b => {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(b);
            a.download = `hackerman-${Date.now()}.png`;
            a.click();
        });
        toast('📸 PNG!', 'accent');
    }, 3);
}

// ═══ IMG ASCII ═══
(function() {
    const fi = document.getElementById('file-input');
    if (!fi) return;
    fi.addEventListener('change', (e) => {
        const f = e.target.files[0];
        if (!f) return;
        const r = new FileReader();
        r.onload = (ev) => {
            const img = new Image();
            img.onload = () => {
                const w = 80, h = Math.floor(img.height / img.width * w * 0.5);
                const c = document.createElement('canvas');
                c.width = w; c.height = h;
                const cx = c.getContext('2d');
                cx.drawImage(img, 0, 0, w, h);
                const d = cx.getImageData(0, 0, w, h).data;
                const chars = ' .:-=+*#%@';
                let art = '';
                for (let y = 0; y < h; y++) {
                    for (let x = 0; x < w; x++) {
                        const i = (y * w + x) * 4;
                        const l = (d[i] + d[i+1] + d[i+2]) / 3;
                        art += chars[Math.floor(l / 255 * (chars.length - 1))];
                    }
                    art += '\n';
                }
                appendOutput(`<pre style="color:var(--main-color);font-size:6px;line-height:1">${art}</pre>`);
                typeText('🖼️ Feito!');
            };
            img.src = ev.target.result;
        };
        r.readAsDataURL(f);
    });
})();

// ═══ PALETTE ═══
function openPalette() {
    paletteOv.classList.add('active');
    paletteInput.value = '';
    paletteInput.focus();
    renderPalette('');
}
function closePalette() { paletteOv.classList.remove('active'); focusInput(); }
function renderPalette(q) {
    q = q.toLowerCase().trim();
    const items = Object.keys(COMMANDS).filter(k => !q || k.includes(q) || COMMANDS[k].toLowerCase().includes(q)).slice(0, 15);
    paletteRes.innerHTML = items.length ? items.map((k, i) =>
        `<div class="palette-item${i===0?' selected':''}" data-cmd="${k}"><span class="p-name">${k}</span><span class="p-desc">${COMMANDS[k]}</span></div>`
    ).join('') : '<div class="palette-item"><span class="p-name">Sem resultados</span></div>';
    paletteRes.querySelectorAll('.palette-item').forEach(el => el.addEventListener('click', () => {
        closePalette(); inputEl.value = el.dataset.cmd; inputEl.focus();
    }));
}
paletteInput.addEventListener('input', () => renderPalette(paletteInput.value));
paletteInput.addEventListener('keydown', (e) => {
    const items = paletteRes.querySelectorAll('.palette-item');
    if (e.key === 'Escape') closePalette();
    else if (e.key === 'Enter') { const s = paletteRes.querySelector('.selected') || items[0]; if (s) { closePalette(); inputEl.value = s.dataset.cmd; inputEl.focus(); } }
    else if (e.key === 'ArrowDown') { e.preventDefault(); const s = paletteRes.querySelector('.selected'); if (s?.nextElementSibling) { s.classList.remove('selected'); s.nextElementSibling.classList.add('selected'); s.nextElementSibling.scrollIntoView({ block: 'nearest' }); } }
    else if (e.key === 'ArrowUp') { e.preventDefault(); const s = paletteRes.querySelector('.selected'); if (s?.previousElementSibling) { s.classList.remove('selected'); s.previousElementSibling.classList.add('selected'); s.previousElementSibling.scrollIntoView({ block: 'nearest' }); } }
});
paletteOv.addEventListener('click', (e) => { if (e.target.id === 'palette-overlay') closePalette(); });

// ═══ THEME EDITOR ═══
function openThemeEditor() {
    themeEditorOv.classList.add('active');
    renderThemeEditor('colors');
}
function closeThemeEditor() { themeEditorOv.classList.remove('active'); focusInput(); }
function renderThemeEditor(tab) {
    const body = document.getElementById('te-body');
    const s = getComputedStyle(document.body);
    const hex = (v) => {
        if (!v) return '#000000';
        if (v.startsWith('#')) return v;
        const m = v.match(/\d+/g);
        return m ? '#' + m.slice(0,3).map(n => parseInt(n).toString(16).padStart(2,'0')).join('') : '#000000';
    };
    if (tab === 'colors') {
        body.innerHTML = `
            <label>Background <input type="color" id="te-bg" value="${hex(s.getPropertyValue('--bg-color').trim())}"></label>
            <label>Principal <input type="color" id="te-main" value="${hex(s.getPropertyValue('--main-color').trim())}"></label>
            <label>Secundária <input type="color" id="te-dim" value="${hex(s.getPropertyValue('--dim-color').trim())}"></label>
            <label>Alerta <input type="color" id="te-alert" value="${hex(s.getPropertyValue('--alert-color').trim())}"></label>
            <label>Aviso <input type="color" id="te-warn" value="${hex(s.getPropertyValue('--warn-color').trim())}"></label>
            <label>Acento <input type="color" id="te-accent" value="${hex(s.getPropertyValue('--accent-color').trim())}"></label>
        `;
        body.querySelectorAll('input').forEach(i => i.addEventListener('input', applyCustomTheme));
    } else if (tab === 'effects') {
        body.innerHTML = `
            <label>Fonte <select id="te-font">
                <option value="'Fira Code', monospace">Fira Code</option>
                <option value="'JetBrains Mono', monospace">JetBrains Mono</option>
                <option value="'Courier New', monospace">Courier New</option>
                <option value="monospace">Monospace</option>
            </select></label>
            <label>Tamanho <input type="range" id="te-size" min="11" max="22" value="${parseInt(s.fontSize) || 15}"> <span id="te-size-val">${parseInt(s.fontSize) || 15}px</span></label>
            <label>Glow <input type="range" id="te-glow" min="0" max="1" step="0.1" value="0.7"></label>
        `;
        body.querySelectorAll('input, select').forEach(i => i.addEventListener('input', () => {
            const sz = document.getElementById('te-size-val');
            if (sz) sz.textContent = document.getElementById('te-size').value + 'px';
            applyCustomTheme();
        }));
    } else if (tab === 'presets') {
        const presets = ['matrix','cyberpunk','ice','red','dracula','nord','gruvbox','tokyo','synthwave','solarized','monokai','ocean','forest','sunset','mono'];
        body.innerHTML = `<div class="te-presets">${presets.map(p => `<button class="te-preset" data-t="${p}">${p.toUpperCase()}</button>`).join('')}</div>`;
        body.querySelectorAll('.te-preset').forEach(b => b.addEventListener('click', () => {
            document.body.className = `theme-${b.dataset.t}`;
            document.body.style.cssText = '';
            localStorage.setItem('hk_theme', b.dataset.t);
            const el = document.getElementById('tb-theme');
            if (el) el.textContent = b.dataset.t.toUpperCase();
            toast(`Tema: ${b.dataset.t.toUpperCase()}`, 'accent');
        }));
    } else if (tab === 'export') {
        const cs = getComputedStyle(document.body);
        const css = `body.theme-custom {\n  --bg-color: ${cs.getPropertyValue('--bg-color').trim()};\n  --main-color: ${cs.getPropertyValue('--main-color').trim()};\n  --dim-color: ${cs.getPropertyValue('--dim-color').trim()};\n  --alert-color: ${cs.getPropertyValue('--alert-color').trim()};\n  --warn-color: ${cs.getPropertyValue('--warn-color').trim()};\n  --accent-color: ${cs.getPropertyValue('--accent-color').trim()};\n}`;
        body.innerHTML = `<div class="dim" style="margin-bottom:8px">Copia este CSS:</div><textarea readonly style="width:100%;height:200px;background:rgba(0,0,0,0.3);border:1px solid var(--dim-color);color:var(--main-color);padding:10px;border-radius:4px;font-family:monospace;font-size:12px">${css}</textarea>`;
    }
    document.querySelectorAll('.te-tab').forEach(b => b.classList.toggle('active', b.dataset.te === tab));
}
document.querySelectorAll('.te-tab').forEach(t => t.addEventListener('click', () => renderThemeEditor(t.dataset.te)));
document.getElementById('te-close').addEventListener('click', closeThemeEditor);
document.getElementById('te-reset').addEventListener('click', () => {
    document.body.style.cssText = '';
    document.body.className = 'theme-matrix';
    toast('Reset');
});
document.getElementById('te-save').addEventListener('click', () => {
    const s = getComputedStyle(document.body);
    const t = {
        bg: s.getPropertyValue('--bg-color').trim(),
        main: s.getPropertyValue('--main-color').trim(),
        dim: s.getPropertyValue('--dim-color').trim(),
        alert: s.getPropertyValue('--alert-color').trim(),
        warn: s.getPropertyValue('--warn-color').trim(),
        accent: s.getPropertyValue('--accent-color').trim(),
    };
    localStorage.setItem('hk_custom_theme', JSON.stringify(t));
    toast('💾 Guardado', 'success');
});
themeEditorOv.addEventListener('click', (e) => { if (e.target.id === 'theme-editor-overlay') closeThemeEditor(); });

function applyCustomTheme() {
    ['bg','main','dim','alert','warn','accent'].forEach(k => {
        const v = document.getElementById('te-' + k)?.value;
        if (v) document.body.style.setProperty('--' + (k === 'bg' ? 'bg-color' : k + '-color'), v);
    });
    const font = document.getElementById('te-font')?.value;
    if (font) document.body.style.setProperty('--font-family', font);
    const size = document.getElementById('te-size')?.value;
    if (size) document.body.style.setProperty('--font-size', size + 'px');
    const glow = document.getElementById('te-glow')?.value;
    if (glow) document.body.style.setProperty('--glow-opacity', glow);
}

// ═══ START MENU ═══
function buildStartMenu() {
    const apps = document.getElementById('sm-apps');
    if (!apps || !window.Apps) return;
    apps.innerHTML = '';
    Object.entries(Apps.apps).forEach(([k, v]) => {
        const btn = document.createElement('button');
        btn.className = 'sm-app';
        btn.innerHTML = `<span class="sm-app-icon">${v.icon}</span><span>${v.name}</span>`;
        btn.addEventListener('click', () => {
            startMenuEl.classList.remove('active');
            if (k === 'terminal') {
                const tw = document.getElementById('terminal-window');
                if (tw) { tw.classList.remove('minimized'); Apps.bringToFront(tw); }
                return;
            }
            if (v.open) v.open();
        });
        apps.appendChild(btn);
    });
}

// ═══ CLOCK ═══
setInterval(() => {
    const d = new Date();
    const el = document.getElementById('tb-clock');
    if (el) el.textContent = d.toLocaleTimeString('pt-PT');
}, 1000);

// ═══ AUTOCOMPLETE ═══
function updateGhost() {
    const v = inputEl.value;
    if (!v) { ghostEl.textContent = ''; return; }
    const m = Object.keys(COMMANDS).filter(c => c.startsWith(v.toLowerCase()) && c !== v);
    ghostEl.textContent = (m.length > 0 && inputEl.selectionStart === v.length) ? m[0].slice(v.length) : '';
}

// ═══ EVENTOS INPUT ═══
inputEl.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'l') { e.preventDefault(); outputEl.innerHTML = ''; return; }
    if (e.ctrlKey && e.key === 'k') { e.preventDefault(); openPalette(); return; }
    if (e.ctrlKey && e.key === 't') {
        e.preventDefault();
        const tw = document.getElementById('terminal-window');
        if (tw) {
            if (tw.classList.contains('minimized')) {
                tw.classList.remove('minimized');
                if (window.Apps) Apps.bringToFront(tw);
            } else {
                tw.classList.add('minimized');
            }
        }
        return;
    }
    if (e.ctrlKey && e.key === 'c') {
        e.preventDefault();
        appendOutput(`<div><span class="prompt">${promptTextEl.textContent}</span> ${escapeHtml(inputEl.value)}^C</div>`);
        inputEl.value = ''; ghostEl.textContent = '';
        if (state.spyInterval) { clearInterval(state.spyInterval); state.spyInterval = null; }
        if (state.cpuInterval) { clearInterval(state.cpuInterval); state.cpuInterval = null; }
        return;
    }
    if (e.ctrlKey && e.key === 'u') { e.preventDefault(); inputEl.value = ''; ghostEl.textContent = ''; return; }

    if (e.key === 'Enter') {
        const c = inputEl.value;
        inputEl.value = '';
        ghostEl.textContent = '';
        handleCommand(c);
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (state.history.length > 0 && state.historyIndex > 0) {
            state.historyIndex--;
            inputEl.value = state.history[state.historyIndex];
            updateGhost();
        }
    } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (state.historyIndex < state.history.length - 1) {
            state.historyIndex++;
            inputEl.value = state.history[state.historyIndex];
        } else { state.historyIndex = state.history.length; inputEl.value = ''; }
        updateGhost();
    } else if (e.key === 'Tab') {
        e.preventDefault();
        const v = inputEl.value.trim().toLowerCase();
        if (!v) return;
        const m = Object.keys(COMMANDS).filter(c => c.startsWith(v));
        if (m.length === 1) { inputEl.value = m[0] + ' '; ghostEl.textContent = ''; }
        else if (m.length > 1) {
            let common = m[0];
            m.forEach(x => { while (!x.startsWith(common)) common = common.slice(0, -1); });
            if (common.length > v.length) inputEl.value = common;
            else {
                appendOutput(`<div><span class="prompt">${promptTextEl.textContent}</span> ${escapeHtml(inputEl.value)}</div>`);
                appendOutput(m.map(x => `<span class="highlight">${x}</span>`).join('   '));
            }
        }
    }
});
inputEl.addEventListener('input', updateGhost);
inputEl.addEventListener('click', updateGhost);
inputEl.addEventListener('keyup', (e) => { if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') updateGhost(); });

document.getElementById('terminal-body').addEventListener('click', focusInput);

document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'k') { e.preventDefault(); openPalette(); }
    if (e.key === 'Escape') { closePalette(); closeThemeEditor(); startMenuEl.classList.remove('active'); }
});

// ═══ START MENU / TASKBAR ═══
document.getElementById('tk-start').addEventListener('click', (e) => {
    e.stopPropagation();
    startMenuEl.classList.toggle('active');
});
document.getElementById('sm-search').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll('.sm-app').forEach(el => {
        el.style.display = el.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
});
document.getElementById('sm-shutdown').addEventListener('click', () => shutdown());
document.getElementById('sm-restart').addEventListener('click', () => location.reload());
document.getElementById('sm-lock').addEventListener('click', () => {
    startMenuEl.classList.remove('active');
    toast('🔒 Bloqueado (recarrega para desbloquear)', 'warn');
});
document.addEventListener('click', (e) => {
    if (!startMenuEl.contains(e.target) && e.target.id !== 'tk-start') startMenuEl.classList.remove('active');
});
document.getElementById('tb-power').addEventListener('click', () => shutdown());

// ═══ SHUTDOWN ═══
function shutdown() {
    const scr = document.getElementById('shutdown-screen');
    const txt = document.getElementById('shutdown-text');
    scr.classList.add('active');
    txt.innerHTML = '';
    const lines = ['A encerrar sistema...', 'A guardar dados...', 'A desligar módulos...', '', 'Adeus. 👋'];
    let i = 0;
    const iv = setInterval(() => {
        if (i >= lines.length) { clearInterval(iv); return; }
        txt.innerHTML += lines[i] + '<br>';
        i++;
    }, 400);
}

// ═══ STREAK ═══
function updateStreak() {
    const today = new Date().toDateString();
    const last = localStorage.getItem('hk_last_visit');
    let streak = parseInt(localStorage.getItem('hk_streak') || '0');
    if (last === today) {}
    else if (last && new Date(last).getTime() > Date.now() - 48 * 3600 * 1000) streak++;
    else streak = 1;
    localStorage.setItem('hk_last_visit', today);
    localStorage.setItem('hk_streak', streak);
    const el = document.getElementById('tb-streak');
    if (el) el.textContent = `🔥 ${streak}`;
}

// ═══ BOOT ═══
function bootSequence() {
    const lines = [
        '[BIOS] Hackerman Singularity v10.0',
        '[BIOS] A verificar integridade quântica... OK',
        '[BOOT] A carregar kernel JS-Singularity...',
        '[BOOT] A inicializar módulos:',
        '       ├─ neural-core.js ........... OK',
        '       ├─ quantum-engine.js ........ OK',
        '       ├─ ai-engine.js ............. OK',
        '       ├─ window-manager.js ........ OK',
        '       ├─ apps-registry.js ......... OK',
        '       └─ singularity-driver.js .... OK',
        '[BOOT] A montar sistema de ficheiros... OK',
        '[BOOT] A ligar aos satélites...',
        '[BOOT] Acesso root concedido ✅',
        '',
        '══════════════════════════════════════════════',
        '   🔥 SINGULARITY INTERFACE PRONTA 🔥',
        '══════════════════════════════════════════════',
    ];

    let i = 0;
    function next() {
        if (i >= lines.length) {
            setTimeout(() => {
                bootScreen.classList.add('hidden');
                startTerminal();
            }, 500);
            return;
        }
        bootText.innerHTML += lines[i] + '\n';
        i++;
        if (bootBar) bootBar.style.width = ((i / lines.length) * 100) + '%';
        setTimeout(next, Math.random() * 150 + 60);
    }
    next();
}

function startTerminal() {
    const saved = localStorage.getItem('hk_theme') || 'matrix';
    document.body.className = `theme-${saved}`;
    const tbTheme = document.getElementById('tb-theme');
    if (tbTheme) tbTheme.textContent = saved.toUpperCase();

    const ct = localStorage.getItem('hk_custom_theme');
    if (ct) {
        try {
            const t = JSON.parse(ct);
            ['bg','main','dim','alert','warn','accent'].forEach(k => {
                if (t[k]) document.body.style.setProperty('--' + (k === 'bg' ? 'bg-color' : k + '-color'), t[k]);
            });
        } catch (e) {}
    }

    updateStreak();
    const tkSound = document.getElementById('tk-sound');
    if (tkSound) tkSound.textContent = state.soundEnabled ? 'ON' : 'OFF';
    const tkSpeed = document.getElementById('tk-speed');
    if (tkSpeed) tkSpeed.textContent = state.speed.toUpperCase();
    updateFileCount();
    updatePrompt();

    appendOutput(`<div class="ascii-art">${BANNER}</div>`, false);
    setTimeout(() => {
        typeText('<span class="highlight">Sistema iniciado.</span> ✅\nEscreve <span class="highlight">help</span>, <span class="highlight">tut</span> ou <span class="highlight">dash</span>.', () => focusInput(), 8);
    }, 300);
}

// ═══ INIT ═══
window.addEventListener('load', () => {
    resizeParticles();
    renderParticles();
    window.addEventListener('resize', resizeParticles);

    if (window.Apps) {
        buildStartMenu();
        Apps.init();
    }

    const termWin = document.getElementById('terminal-window');
    if (termWin) {
        termWin.querySelectorAll('.win-dot').forEach(dot => {
            dot.addEventListener('click', (e) => {
                e.stopPropagation();
                const a = dot.dataset.action;
                if (a === 'close') toast('O terminal não pode ser fechado 😄', 'warn');
                else if (a === 'min') termWin.classList.add('minimized');
                else if (a === 'max') termWin.classList.toggle('maximized');
            });
        });

        // ⬇️ BOTÃO X DO TERMINAL → ESCONDE (não fecha) ⬇️
        const termCloseX = document.getElementById('terminal-close-x');
        if (termCloseX) {
            termCloseX.addEventListener('click', (e) => {
                e.stopPropagation();
                termWin.classList.add('minimized');
                toast('Terminal oculto. Clica em ⌨️ na topbar para reabrir.', 'warn');
            });
        }
        // ⬆️ ATÉ AQUI ⬆️

        termWin.addEventListener('mousedown', () => window.Apps && Apps.bringToFront(termWin));

        const th = termWin.querySelector('.win-header');
        let drag = false, ox, oy;
        th.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('win-dot')) return;
            if (e.target.classList.contains('win-close-x')) return;
            drag = true;
            ox = e.clientX - termWin.offsetLeft;
            oy = e.clientY - termWin.offsetTop;
            if (window.Apps) Apps.bringToFront(termWin);
        });
        document.addEventListener('mousemove', (e) => {
            if (!drag) return;
            termWin.style.left = (e.clientX - ox) + 'px';
            termWin.style.top = Math.max(32, e.clientY - oy) + 'px';
        });
        document.addEventListener('mouseup', () => { drag = false; });
    }

    bootSequence();
});