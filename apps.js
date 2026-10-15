// ═══════════════════════════════════════════════════════════
//  HACKERMAN v10 — Módulo de Aplicações
// ═══════════════════════════════════════════════════════════

const Apps = {
    running: new Set(),

    apps: {
        terminal:  { name: 'Terminal', icon: '⌨️' },
        files:     { name: 'Ficheiros', icon: '📁', open: () => Apps.openFiles() },
        editor:    { name: 'Editor', icon: '📝', open: () => Apps.openEditor() },
        browser:   { name: 'Navegador', icon: '🌐', open: () => Apps.openBrowser() },
        music:     { name: 'Música', icon: '🎵', open: () => Apps.openMusic() },
        settings:  { name: 'Definições', icon: '⚙️', open: () => Apps.openSettings() },
        vault:     { name: 'Cofre', icon: '🔐', open: () => Apps.openVault() },
        chat:      { name: 'Chat', icon: '💬', open: () => Apps.openChat() },
        calendar:  { name: 'Calendário', icon: '📅', open: () => Apps.openCalendar() },
        analytics: { name: 'Analytics', icon: '📊', open: () => Apps.openAnalytics() },
    },

    // ═══ GERENCIADOR DE JANELAS ═══
    openWindow(id, title, content, options = {}) {
        const area = document.getElementById('windows-area');
        if (!area) return null;

        // Se já existe, foca-a
        let existing = document.querySelector(`.window[data-app="${id}"]`);
        if (existing) {
            existing.classList.remove('minimized');
            this.bringToFront(existing);
            return existing;
        }

        const win = document.createElement('div');
        win.className = 'window active';
        win.dataset.app = id;
        win.style.top  = (options.top  || 60 + Math.random() * 80) + 'px';
        win.style.left = (options.left || 60 + Math.random() * 80) + 'px';
        win.style.width  = (options.width  || 700) + 'px';
        win.style.height = (options.height || 500) + 'px';

        win.innerHTML = `
            <div class="win-header">
                <div class="win-controls">
                    <span class="win-dot close" data-action="close" title="Fechar"></span>
                    <span class="win-dot min"   data-action="min"   title="Minimizar"></span>
                    <span class="win-dot max"   data-action="max"   title="Maximizar"></span>
                </div>
                <div class="win-title">${title}</div>
                <button class="win-close-x" title="Fechar" aria-label="Fechar">×</button>
            </div>
            <div class="win-body">${content}</div>
            <div class="win-resize"></div>
        `;
        area.appendChild(win);

        // ═══ BOTÃO X ═══
        const closeX = win.querySelector('.win-close-x');
        if (closeX) {
            closeX.addEventListener('click', (e) => {
                e.stopPropagation();
                this.closeWindow(win);
            });
        }

        // ═══ DRAG ═══
        const header = win.querySelector('.win-header');
        let isDragging = false, offsetX = 0, offsetY = 0;

        header.addEventListener('mousedown', (e) => {
            // Ignora cliques nos botões e dots
            if (e.target.classList.contains('win-dot') ||
                e.target.classList.contains('win-close-x')) return;
            isDragging = true;
            offsetX = e.clientX - win.offsetLeft;
            offsetY = e.clientY - win.offsetTop;
            this.bringToFront(win);
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            win.style.left = (e.clientX - offsetX) + 'px';
            win.style.top  = Math.max(32, e.clientY - offsetY) + 'px';
        });

        document.addEventListener('mouseup', () => { isDragging = false; });

        // ═══ RESIZE ═══
        const resizer = win.querySelector('.win-resize');
        let isResizing = false, startW = 0, startH = 0, startX = 0, startY = 0;

        resizer.addEventListener('mousedown', (e) => {
            isResizing = true;
            startW = win.offsetWidth;
            startH = win.offsetHeight;
            startX = e.clientX;
            startY = e.clientY;
            e.stopPropagation();
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            const newW = Math.max(280, startW + e.clientX - startX);
            const newH = Math.max(180, startH + e.clientY - startY);
            win.style.width  = newW + 'px';
            win.style.height = newH + 'px';
        });

        document.addEventListener('mouseup', () => { isResizing = false; });

        // ═══ DOTS (mac style) ═══
        win.querySelectorAll('.win-dot').forEach(dot => {
            dot.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = dot.dataset.action;
                if (action === 'close') this.closeWindow(win);
                else if (action === 'min') win.classList.add('minimized');
                else if (action === 'max') win.classList.toggle('maximized');
            });
        });

        // ═══ FOCUS AO CLICAR ═══
        win.addEventListener('mousedown', () => this.bringToFront(win));

        this.running.add(id);
        this.updateTaskbar();
        return win;
    },

    closeWindow(win) {
        if (!win) return;
        const id = win.dataset.app;
        win.style.animation = 'windowOpen 0.2s ease-in reverse';
        setTimeout(() => {
            win.remove();
            this.running.delete(id);
            this.updateTaskbar();
        }, 180);
    },

    bringToFront(win) {
        document.querySelectorAll('.window').forEach(w => w.classList.remove('active'));
        win.classList.add('active');
    },

    updateTaskbar() {
        const tk = document.getElementById('tk-apps');
        if (!tk) return;
        tk.innerHTML = '';
        this.running.forEach(id => {
            const app = this.apps[id];
            if (!app) return;
            const btn = document.createElement('button');
            btn.className = 'tk-app active';
            btn.textContent = app.icon + ' ' + app.name;
            btn.addEventListener('click', () => {
                const win = document.querySelector(`.window[data-app="${id}"]`);
                if (win) {
                    if (win.classList.contains('minimized')) win.classList.remove('minimized');
                    this.bringToFront(win);
                }
            });
            tk.appendChild(btn);
        });
    },

    // ═══ APP: EXPLORADOR DE FICHEIROS ═══
    openFiles() {
        const win = this.openWindow('files', '📁 Explorador de Ficheiros', `
            <div style="display:flex;height:100%;gap:10px">
                <div style="width:180px;border-right:1px solid var(--dim-color);padding-right:10px" id="fs-sidebar">
                    <div class="fs-loc" data-path="~">🏠 Home</div>
                    <div class="fs-loc" data-path="~/projetos">📦 Projetos</div>
                </div>
                <div style="flex:1;overflow:auto" id="fs-content"></div>
            </div>
        `, { width: 800, height: 500 });

        const content = win.querySelector('#fs-content');
        const sidebar = win.querySelector('#fs-sidebar');

        const render = (path) => {
            if (typeof window.FS === 'undefined' || typeof window.getNode !== 'function') {
                content.innerHTML = '<div class="alert">FS não disponível.</div>';
                return;
            }
            const node = window.getNode(path);
            if (!node) {
                content.innerHTML = '<div class="warn">Diretório não encontrado.</div>';
                return;
            }
            if (node.type === 'file') {
                content.innerHTML = `<pre style="white-space:pre-wrap">${(node.content || '').replace(/</g, '&lt;')}</pre>`;
                return;
            }
            if (!node.children) {
                content.innerHTML = '<div class="dim">(vazio)</div>';
                return;
            }

            content.innerHTML = `
                <div class="dim" style="margin-bottom:8px">📁 ${path}</div>
                <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:8px">
                    ${Object.entries(node.children).map(([name, info]) => `
                        <div class="fs-item" data-name="${name}" data-type="${info.type}" style="padding:12px;border:1px solid var(--dim-color);border-radius:6px;text-align:center;cursor:pointer;transition:all 0.15s">
                            <div style="font-size:28px">${info.type === 'dir' ? '📁' : '📄'}</div>
                            <div style="font-size:11px;margin-top:4px;word-break:break-word">${name}</div>
                        </div>
                    `).join('')}
                </div>
            `;

            content.querySelectorAll('.fs-item').forEach(item => {
                item.addEventListener('mouseenter', () => {
                    item.style.background = 'rgba(0,255,102,0.1)';
                    item.style.borderColor = 'var(--main-color)';
                });
                item.addEventListener('mouseleave', () => {
                    item.style.background = '';
                    item.style.borderColor = 'var(--dim-color)';
                });
                item.addEventListener('click', () => {
                    content.querySelectorAll('.fs-item').forEach(el => el.style.borderColor = 'var(--dim-color)');
                    item.style.borderColor = 'var(--accent-color)';
                });
                item.addEventListener('dblclick', () => {
                    const name = item.dataset.name;
                    const type = item.dataset.type;
                    if (type === 'dir') {
                        render(path === '~' ? `~/${name}` : `${path}/${name}`);
                    } else {
                        const fileNode = node.children[name];
                        this.openWindow('viewer-' + name, `📄 ${name}`, `
                            <pre style="white-space:pre-wrap;font-family:var(--font-family)">${(fileNode.content || '').replace(/</g, '&lt;')}</pre>
                        `, { width: 500, height: 400 });
                    }
                });
            });
        };

        sidebar.querySelectorAll('.fs-loc').forEach(loc => {
            loc.style.padding = '6px 8px';
            loc.style.cursor = 'pointer';
            loc.style.borderRadius = '4px';
            loc.style.transition = 'background 0.15s';
            loc.addEventListener('mouseenter', () => loc.style.background = 'rgba(0,255,102,0.1)');
            loc.addEventListener('mouseleave', () => loc.style.background = '');
            loc.addEventListener('click', () => render(loc.dataset.path));
        });

        render('~');
    },

    // ═══ APP: EDITOR ═══
    openEditor() {
        const win = this.openWindow('editor', '📝 Editor de Código', `
            <div style="display:flex;flex-direction:column;height:100%">
                <div style="display:flex;gap:8px;margin-bottom:8px;align-items:center">
                    <input type="text" id="ed-filename" placeholder="nome.js" style="flex:1;background:transparent;border:1px solid var(--dim-color);color:var(--main-color);padding:6px 10px;border-radius:4px;font-family:var(--font-family);outline:none">
                    <button id="ed-save" style="background:var(--main-color);color:var(--bg-color);border:none;padding:6px 14px;border-radius:4px;cursor:pointer;font-family:var(--font-family);font-weight:bold">💾 Guardar</button>
                    <button id="ed-run" style="background:transparent;border:1px solid var(--accent-color);color:var(--accent-color);padding:6px 14px;border-radius:4px;cursor:pointer;font-family:var(--font-family)">▶️ Executar</button>
                </div>
                <textarea id="ed-code" style="flex:1;background:rgba(0,0,0,0.4);border:1px solid var(--dim-color);color:var(--main-color);padding:12px;border-radius:4px;font-family:monospace;font-size:13px;outline:none;resize:none;line-height:1.6" placeholder="// Escreve código JS aqui...&#10;console.log('Olá, mundo!');&#10;console.log(2 + 2);"></textarea>
                <div id="ed-output" style="margin-top:8px;padding:8px;border:1px solid var(--dim-color);border-radius:4px;min-height:60px;max-height:150px;overflow:auto;font-size:12px;color:var(--accent-color);background:rgba(0,0,0,0.3);font-family:monospace"><span class="dim">// Output aparece aqui...</span></div>
            </div>
        `, { width: 800, height: 600 });

        const codeEl = win.querySelector('#ed-code');
        const outEl = win.querySelector('#ed-output');
        const nameEl = win.querySelector('#ed-filename');

        win.querySelector('#ed-save').addEventListener('click', () => {
            const name = nameEl.value.trim() || 'sem-nome.js';
            if (typeof window.FS === 'undefined') return;
            window.FS['~'].children[name] = { type: 'file', content: codeEl.value };
            try { localStorage.setItem('hk_fs_v5', JSON.stringify(window.FS)); } catch(e) {}
            outEl.innerHTML = `<span class="accent">💾 Guardado como ${name}</span>`;
            if (window.toast) window.toast(`Guardado: ${name}`, 'success');
        });

        win.querySelector('#ed-run').addEventListener('click', () => {
            try {
                const logs = [];
                const customLog = (...args) => logs.push(args.map(a => {
                    if (typeof a === 'object') { try { return JSON.stringify(a); } catch(e) { return String(a); } }
                    return String(a);
                }).join(' '));
                const fn = new Function('console', codeEl.value);
                fn({ log: customLog, error: customLog, warn: customLog, info: customLog });
                outEl.innerHTML = logs.length
                    ? `<span class="accent">▶️ Output:</span><br>${logs.map(l => '  ' + l.replace(/</g, '&lt;')).join('<br>')}`
                    : '<span class="dim">(sem output)</span>';
            } catch (e) {
                outEl.innerHTML = `<span class="alert">❌ Erro: ${e.message.replace(/</g, '&lt;')}</span>`;
            }
        });

        nameEl.addEventListener('change', () => {
            const name = nameEl.value.trim();
            if (window.FS && window.FS['~'].children[name] && window.FS['~'].children[name].type === 'file') {
                codeEl.value = window.FS['~'].children[name].content;
            }
        });
    },

    // ═══ APP: NAVEGADOR ═══
    openBrowser() {
        const win = this.openWindow('browser', '🌐 Navegador Neural', `
            <div style="display:flex;flex-direction:column;height:100%">
                <div style="display:flex;gap:6px;margin-bottom:8px">
                    <input type="text" id="br-url" value="https://" style="flex:1;background:transparent;border:1px solid var(--dim-color);color:var(--main-color);padding:6px 10px;border-radius:4px;font-family:var(--font-family);outline:none">
                    <button id="br-go" style="background:var(--main-color);color:var(--bg-color);border:none;padding:6px 14px;border-radius:4px;cursor:pointer;font-family:var(--font-family);font-weight:bold">Ir</button>
                </div>
                <div id="br-content" style="flex:1;background:rgba(0,0,0,0.3);border:1px solid var(--dim-color);border-radius:4px;padding:12px;overflow:auto;font-family:var(--font-family);font-size:12px;white-space:pre-wrap">
                    <div class="dim">🌐 Bem-vindo. Escreve um URL e clica em Ir.</div>
                </div>
            </div>
        `, { width: 750, height: 500 });

        win.querySelector('#br-go').addEventListener('click', async () => {
            const url = win.querySelector('#br-url').value;
            const content = win.querySelector('#br-content');
            content.innerHTML = '<span class="accent">🌐 A carregar...</span>';
            try {
                const r = await fetch(url);
                const text = await r.text();
                content.textContent = text.slice(0, 5000);
            } catch (e) {
                content.innerHTML = `<span class="alert">❌ Erro: ${e.message}<br><br>(pode ser CORS — normal em browsers)</span>`;
            }
        });
    },

    // ═══ APP: MÚSICA ═══
    openMusic() {
        const win = this.openWindow('music', '🎵 Sintetizador', `
            <div style="display:flex;flex-direction:column;height:100%;align-items:center">
                <div style="margin-bottom:10px;color:var(--accent-color)">🎹 Clica nas teclas do piano</div>
                <div style="display:flex;gap:4px;justify-content:center;margin:20px 0" id="piano"></div>
                <div style="display:flex;gap:8px;margin:10px 0;flex-wrap:wrap;justify-content:center">
                    <button class="mel-btn" data-mel="happy">🎉 Happy</button>
                    <button class="mel-btn" data-mel="sad">😢 Sad</button>
                    <button class="mel-btn" data-mel="mario">🍄 Mario</button>
                    <button class="mel-btn" data-mel="star">⭐ Star Wars</button>
                </div>
                <div id="music-out" style="margin-top:10px;color:var(--dim-color);font-size:12px"></div>
            </div>
        `, { width: 700, height: 420 });

        const notes = [
            { name: 'C4', freq: 261.63 },
            { name: 'D4', freq: 293.66 },
            { name: 'E4', freq: 329.63 },
            { name: 'F4', freq: 349.23 },
            { name: 'G4', freq: 392.00 },
            { name: 'A4', freq: 440.00 },
            { name: 'B4', freq: 493.88 },
            { name: 'C5', freq: 523.25 },
            { name: 'D5', freq: 587.33 },
        ];

        const piano = win.querySelector('#piano');
        notes.forEach(n => {
            const k = document.createElement('button');
            k.style.cssText = 'width:55px;height:100px;background:linear-gradient(180deg,rgba(0,255,102,0.2),rgba(0,255,102,0.5));border:2px solid var(--main-color);color:var(--main-color);border-radius:6px;cursor:pointer;font-family:var(--font-family);font-size:13px;font-weight:bold;transition:all 0.1s';
            k.textContent = n.name;
            k.addEventListener('mousedown', () => {
                if (window.playNote) window.playNote(n.freq, 0.5, 'sine');
                k.style.background = 'var(--main-color)';
                k.style.color = 'var(--bg-color)';
            });
            k.addEventListener('mouseup', () => {
                k.style.background = 'linear-gradient(180deg,rgba(0,255,102,0.2),rgba(0,255,102,0.5))';
                k.style.color = 'var(--main-color)';
            });
            k.addEventListener('mouseleave', () => {
                k.style.background = 'linear-gradient(180deg,rgba(0,255,102,0.2),rgba(0,255,102,0.5))';
                k.style.color = 'var(--main-color)';
            });
            piano.appendChild(k);
        });

        const melodies = {
            happy: [[523,200],[523,200],[587,200],[659,400],[659,200],[659,200],[587,400]],
            sad: [[440,400],[415,400],[392,400],[370,800]],
            mario: [[659,150],[659,150],[0,150],[659,150],[0,150],[523,150],[659,200],[784,400]],
            star: [[392,300],[392,300],[392,300],[311,200],[466,200],[392,300],[311,200],[466,200],[392,600]],
        };

        win.querySelectorAll('.mel-btn').forEach(btn => {
            btn.style.cssText = 'background:transparent;border:1px solid var(--accent-color);color:var(--accent-color);padding:8px 14px;border-radius:4px;cursor:pointer;font-family:var(--font-family);font-size:12px';
            btn.addEventListener('click', () => {
                const mel = melodies[btn.dataset.mel];
                const out = win.querySelector('#music-out');
                out.textContent = `🎵 A tocar ${btn.dataset.mel}...`;
                let t = 0;
                mel.forEach(([freq, dur]) => {
                    if (freq > 0) setTimeout(() => window.playNote && window.playNote(freq, dur / 1000, 'sine'), t);
                    t += dur;
                });
                setTimeout(() => { out.textContent = '✅ Melodia terminada'; }, t);
            });
        });
    },

    // ═══ APP: DEFINIÇÕES ═══
    openSettings() {
        const win = this.openWindow('settings', '⚙️ Definições', `
            <div style="padding:10px">
                <div style="margin-bottom:20px">
                    <div class="accent" style="margin-bottom:10px">🎨 APARÊNCIA</div>
                    <label style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--dim-color)">
                        <span>Tema</span>
                        <select id="set-theme" style="background:var(--bg-color);color:var(--main-color);border:1px solid var(--dim-color);padding:4px 8px;border-radius:4px;font-family:var(--font-family)">
                            <option value="matrix">Matrix</option>
                            <option value="cyberpunk">Cyberpunk</option>
                            <option value="ice">Ice</option>
                            <option value="red">Red</option>
                            <option value="dracula">Dracula</option>
                            <option value="nord">Nord</option>
                            <option value="gruvbox">Gruvbox</option>
                            <option value="tokyo">Tokyo</option>
                            <option value="synthwave">Synthwave</option>
                            <option value="solarized">Solarized</option>
                            <option value="monokai">Monokai</option>
                            <option value="ocean">Ocean</option>
                            <option value="forest">Forest</option>
                            <option value="sunset">Sunset</option>
                            <option value="mono">Monochrome</option>
                        </select>
                    </label>
                    <label style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--dim-color)">
                        <span>Velocidade digitação</span>
                        <select id="set-speed" style="background:var(--bg-color);color:var(--main-color);border:1px solid var(--dim-color);padding:4px 8px;border-radius:4px;font-family:var(--font-family)">
                            <option value="slow">Lenta</option>
                            <option value="normal">Normal</option>
                            <option value="turbo">Turbo</option>
                        </select>
                    </label>
                    <label style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--dim-color)">
                        <span>Som teclado</span>
                        <input type="checkbox" id="set-sound">
                    </label>
                    <label style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--dim-color)">
                        <span>Matrix background</span>
                        <input type="checkbox" id="set-matrix">
                    </label>
                    <label style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--dim-color)">
                        <span>Estrelas</span>
                        <input type="checkbox" id="set-stars">
                    </label>
                </div>
                <div style="margin-bottom:20px">
                    <div class="accent" style="margin-bottom:10px">🤖 IA</div>
                    <label style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--dim-color)">
                        <span>Personalidade</span>
                        <select id="set-pers" style="background:var(--bg-color);color:var(--main-color);border:1px solid var(--dim-color);padding:4px 8px;border-radius:4px;font-family:var(--font-family)">
                            <option value="wise">Sábio</option>
                            <option value="sarcastic">Sarcástico</option>
                            <option value="hacker">Hacker</option>
                            <option value="philosopher">Filósofo</option>
                            <option value="teacher">Professor</option>
                        </select>
                    </label>
                    <label style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--dim-color);flex-direction:column;align-items:flex-start;gap:6px">
                        <span>API Key (opcional)</span>
                        <input type="password" id="set-apikey" placeholder="sk-... ou AIza..." style="width:100%;background:transparent;border:1px solid var(--dim-color);color:var(--main-color);padding:6px 10px;border-radius:4px;font-family:var(--font-family);outline:none">
                    </label>
                    <label style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--dim-color)">
                        <span>Provider</span>
                        <select id="set-provider" style="background:var(--bg-color);color:var(--main-color);border:1px solid var(--dim-color);padding:4px 8px;border-radius:4px;font-family:var(--font-family)">
                            <option value="local">Local (offline)</option>
                            <option value="openai">OpenAI</option>
                            <option value="gemini">Gemini</option>
                        </select>
                    </label>
                </div>
                <div>
                    <div class="accent" style="margin-bottom:10px">🗑️ DADOS</div>
                    <button id="set-wipe" style="background:transparent;border:1px solid var(--alert-color);color:var(--alert-color);padding:8px 14px;border-radius:4px;cursor:pointer;font-family:var(--font-family);width:100%">⚠️ Apagar todos os dados</button>
                </div>
            </div>
        `, { width: 550, height: 620 });

        const themeSel = win.querySelector('#set-theme');
        const speedSel = win.querySelector('#set-speed');
        const soundChk = win.querySelector('#set-sound');
        const matrixChk = win.querySelector('#set-matrix');
        const starsChk = win.querySelector('#set-stars');
        const persSel = win.querySelector('#set-pers');
        const apiKeyEl = win.querySelector('#set-apikey');
        const providerEl = win.querySelector('#set-provider');

        themeSel.value = localStorage.getItem('hk_theme') || 'matrix';
        speedSel.value = (window.state && window.state.speed) || 'normal';
        soundChk.checked = (window.state && window.state.soundEnabled) || false;
        matrixChk.checked = (window.state && window.state.matrixActive) || false;
        starsChk.checked = (window.state && window.state.starsActive) || false;
        persSel.value = window.AI ? AI.personality : 'wise';
        apiKeyEl.value = window.AI ? AI.apiKey : '';
        providerEl.value = window.AI ? AI.apiProvider : 'local';

        themeSel.addEventListener('change', () => {
            document.body.className = `theme-${themeSel.value}`;
            localStorage.setItem('hk_theme', themeSel.value);
            const el = document.getElementById('tb-theme');
            if (el) el.textContent = themeSel.value.toUpperCase();
        });
        speedSel.addEventListener('change', () => {
            if (window.state) { window.state.speed = speedSel.value; localStorage.setItem('hk_speed', speedSel.value); }
            const el = document.getElementById('tk-speed');
            if (el) el.textContent = speedSel.value.toUpperCase();
        });
        soundChk.addEventListener('change', () => {
            if (window.state) { window.state.soundEnabled = soundChk.checked; localStorage.setItem('hk_sound', soundChk.checked ? 'on' : 'off'); }
            const el = document.getElementById('tk-sound');
            if (el) el.textContent = soundChk.checked ? 'ON' : 'OFF';
        });
        matrixChk.addEventListener('change', () => {
            if (window.state) window.state.matrixActive = matrixChk.checked;
            const mc = document.getElementById('matrix-canvas');
            if (mc) mc.classList.toggle('active', matrixChk.checked);
            if (matrixChk.checked && window.setupMatrix) window.setupMatrix();
        });
        starsChk.addEventListener('change', () => {
            if (window.state) window.state.starsActive = starsChk.checked;
            const sc = document.getElementById('star-canvas');
            if (sc) sc.classList.toggle('active', starsChk.checked);
            if (starsChk.checked && window.setupStars) window.setupStars();
        });
        persSel.addEventListener('change', () => {
            if (window.AI) { AI.personality = persSel.value; localStorage.setItem('hk_ai_pers', persSel.value); }
        });
        apiKeyEl.addEventListener('change', () => {
            if (window.AI) { AI.apiKey = apiKeyEl.value; localStorage.setItem('hk_ai_key', apiKeyEl.value); }
        });
        providerEl.addEventListener('change', () => {
            if (window.AI) { AI.apiProvider = providerEl.value; localStorage.setItem('hk_ai_provider', providerEl.value); }
        });

        win.querySelector('#set-wipe').addEventListener('click', () => {
            if (confirm('⚠️ Apagar TODOS os dados? Isto é irreversível!')) {
                localStorage.clear();
                location.reload();
            }
        });
    },

    // ═══ APP: COFRE ═══
    openVault() {
        const pass = prompt('🔐 Password mestra:');
        if (!pass) return;

        const enc = (txt) => btoa(unescape(encodeURIComponent(pass + '::' + txt)));
        const dec = (b64) => {
            try {
                const t = decodeURIComponent(escape(atob(b64)));
                return t.startsWith(pass + '::') ? t.slice(pass.length + 2) : null;
            } catch (e) { return null; }
        };

        const saved = JSON.parse(localStorage.getItem('hk_vault') || '[]');
        const decrypted = saved.map(x => ({ name: x.name, value: dec(x.value) })).filter(x => x.value !== null);

        if (saved.length > 0 && decrypted.length === 0) {
            if (window.toast) window.toast('❌ Password errada', 'alert');
            return;
        }

        const win = this.openWindow('vault', '🔐 Cofre de Passwords', `
            <div style="padding:10px">
                <div style="display:flex;gap:6px;margin-bottom:12px">
                    <input type="text" id="vault-name" placeholder="nome (ex: gmail)" style="flex:1;background:transparent;border:1px solid var(--dim-color);color:var(--main-color);padding:6px 10px;border-radius:4px;font-family:var(--font-family);outline:none">
                    <input type="text" id="vault-pass" placeholder="password" style="flex:1;background:transparent;border:1px solid var(--dim-color);color:var(--main-color);padding:6px 10px;border-radius:4px;font-family:var(--font-family);outline:none">
                    <button id="vault-add" style="background:var(--main-color);color:var(--bg-color);border:none;padding:6px 14px;border-radius:4px;cursor:pointer;font-family:var(--font-family);font-weight:bold">+</button>
                </div>
                <div id="vault-list"></div>
            </div>
        `, { width: 600, height: 450 });

        const list = win.querySelector('#vault-list');
        const render = () => {
            if (decrypted.length === 0) {
                list.innerHTML = '<div class="dim" style="text-align:center;padding:20px">Cofre vazio</div>';
                return;
            }
            list.innerHTML = decrypted.map((x, i) => `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:8px;border:1px solid var(--dim-color);border-radius:4px;margin-bottom:6px">
                    <div>
                        <div class="highlight">${x.name}</div>
                        <div class="dim" style="font-size:11px">••••••••</div>
                    </div>
                    <div style="display:flex;gap:6px">
                        <button data-reveal="${i}" style="background:transparent;border:1px solid var(--accent-color);color:var(--accent-color);padding:4px 8px;border-radius:4px;cursor:pointer;font-family:var(--font-family);font-size:11px">👁️ Ver</button>
                        <button data-del="${i}" style="background:transparent;border:1px solid var(--alert-color);color:var(--alert-color);padding:4px 8px;border-radius:4px;cursor:pointer;font-family:var(--font-family);font-size:11px">🗑️</button>
                    </div>
                </div>
            `).join('');

            list.querySelectorAll('[data-reveal]').forEach(b => b.addEventListener('click', () => {
                const i = +b.dataset.reveal;
                alert(`🔐 ${decrypted[i].name}: ${decrypted[i].value}`);
            }));
            list.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => {
                const i = +b.dataset.del;
                saved.splice(i, 1);
                localStorage.setItem('hk_vault', JSON.stringify(saved));
                decrypted.splice(i, 1);
                render();
            }));
        };
        render();

        win.querySelector('#vault-add').addEventListener('click', () => {
            const name = win.querySelector('#vault-name').value.trim();
            const pass2 = win.querySelector('#vault-pass').value;
            if (!name || !pass2) return;
            saved.push({ name, value: enc(pass2) });
            localStorage.setItem('hk_vault', JSON.stringify(saved));
            decrypted.push({ name, value: pass2 });
            win.querySelector('#vault-name').value = '';
            win.querySelector('#vault-pass').value = '';
            render();
            if (window.toast) window.toast('🔐 Guardado', 'success');
        });
    },

    // ═══ APP: CHAT MULTIPLAYER ═══
    openChat() {
        const channel = new BroadcastChannel('hackerman-chat');
        const win = this.openWindow('chat', '💬 Chat Multiplayer', `
            <div style="display:flex;flex-direction:column;height:100%">
                <div class="dim" style="margin-bottom:8px;font-size:11px">💡 Abre em outra aba do browser para conversar contigo mesmo</div>
                <div id="chat-log" style="flex:1;overflow-y:auto;padding:10px;background:rgba(0,0,0,0.3);border:1px solid var(--dim-color);border-radius:4px;font-size:13px;line-height:1.6"></div>
                <div style="display:flex;gap:6px;margin-top:8px">
                    <input type="text" id="chat-input" placeholder="Mensagem..." style="flex:1;background:transparent;border:1px solid var(--dim-color);color:var(--main-color);padding:8px 12px;border-radius:4px;font-family:var(--font-family);outline:none">
                    <button id="chat-send" style="background:var(--main-color);color:var(--bg-color);border:none;padding:8px 16px;border-radius:4px;cursor:pointer;font-family:var(--font-family);font-weight:bold">Enviar</button>
                </div>
            </div>
        `, { width: 500, height: 500 });

        const log = win.querySelector('#chat-log');
        const inp = win.querySelector('#chat-input');
        const tabId = Math.random().toString(36).slice(2, 6);

        const addMsg = (from, text, mine = false) => {
            const el = document.createElement('div');
            el.style.marginBottom = '6px';
            el.innerHTML = `<span class="${mine ? 'accent' : 'highlight'}">[${from}]</span> ${String(text).replace(/</g, '&lt;')}`;
            log.appendChild(el);
            log.scrollTop = log.scrollHeight;
        };

        addMsg('sistema', 'Bem-vindo ao chat neural!', false);

        channel.onmessage = (e) => {
            if (e.data.tabId === tabId) return;
            addMsg(e.data.tabId, e.data.text, false);
        };

        const send = () => {
            const t = inp.value.trim();
            if (!t) return;
            channel.postMessage({ tabId, text: t });
            addMsg('eu', t, true);
            inp.value = '';
        };
        win.querySelector('#chat-send').addEventListener('click', send);
        inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') send(); });
    },

    // ═══ APP: CALENDÁRIO ═══
    openCalendar() {
        const now = new Date();
        const month = now.getMonth();
        const year = now.getFullYear();
        const months = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
        const days = ['D','S','T','Q','Q','S','S'];
        const first = new Date(year, month, 1).getDay();
        const total = new Date(year, month + 1, 0).getDate();

        let html = `<div class="accent" style="text-align:center;font-size:18px;margin-bottom:12px">${months[month]} ${year}</div>`;
        html += '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;text-align:center">';
        days.forEach(d => html += `<div class="dim" style="font-size:11px;padding:4px">${d}</div>`);
        for (let i = 0; i < first; i++) html += '<div></div>';
        for (let d = 1; d <= total; d++) {
            const isToday = d === now.getDate();
            html += `<div style="padding:8px 0;border:1px solid ${isToday ? 'var(--accent-color)' : 'var(--dim-color)'};border-radius:4px;${isToday ? 'background:rgba(0,255,255,0.15);color:var(--accent-color);font-weight:bold' : ''}">${d}</div>`;
        }
        html += '</div>';

        this.openWindow('calendar', '📅 Calendário', html, { width: 420, height: 420 });
    },

    // ═══ APP: ANALYTICS ═══
    openAnalytics() {
        const stats = window.AI ? AI.commandStats : {};
        const top = Object.entries(stats).sort((a,b) => b[1] - a[1]).slice(0, 10);
        const total = Object.values(stats).reduce((a,b) => a+b, 0);
        const max = Math.max(...Object.values(stats), 1);

        let html = `<div class="accent" style="font-size:16px;margin-bottom:14px">📊 Analytics — ${total} comandos executados</div>`;
        if (top.length === 0) {
            html += '<div class="dim">Sem dados ainda. Usa o terminal!</div>';
        } else {
            top.forEach(([cmd, count]) => {
                const w = Math.round((count / max) * 100);
                html += `
                    <div style="margin-bottom:8px">
                        <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:2px">
                            <span class="highlight">${cmd}</span>
                            <span class="dim">${count}x</span>
                        </div>
                        <div style="height:8px;background:rgba(0,255,102,0.1);border-radius:4px;overflow:hidden">
                            <div style="height:100%;width:${w}%;background:var(--main-color);box-shadow:0 0 8px var(--main-color)"></div>
                        </div>
                    </div>
                `;
            });
        }

        this.openWindow('analytics', '📊 Analytics', html, { width: 500, height: 500 });
    },

    // ═══ INICIALIZAÇÃO DOS BOTÕES DA TOPBAR ═══
    init() {
        document.querySelectorAll('.tb-app-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.app;
                if (id === 'terminal') {
                    const tw = document.getElementById('terminal-window');
                    if (tw) {
                        tw.classList.remove('minimized');
                        this.bringToFront(tw);
                    }
                    return;
                }
                const app = this.apps[id];
                if (app && app.open) app.open();
            });
        });
    },
};

window.Apps = Apps;