// ═══════════════════════════════════════════════════════════
//  HACKERMAN v10 — Módulo de IA
// ═══════════════════════════════════════════════════════════

const AI = {
    personality: localStorage.getItem('hk_ai_pers') || 'wise',
    memory: JSON.parse(localStorage.getItem('hk_ai_memory') || '[]'),
    apiKey: localStorage.getItem('hk_ai_key') || '',
    apiProvider: localStorage.getItem('hk_ai_provider') || 'local',
    commandStats: JSON.parse(localStorage.getItem('hk_cmd_stats') || '{}'),

    personalities: {
        wise: [
            "A verdadeira sabedoria está em saber que nada sabes. 🧘",
            "O caminho do código é como o caminho da vida: cheio de bugs. 🌌",
            "Procura a simplicidade, e encontrarás a elegância. ✨",
            "Quem domina a paciência, domina o debug. 🕉️",
            "Todo o bug é uma lição disfarçada. 📚",
            "A pressa é inimiga da compilação. 🐢",
        ],
        sarcastic: [
            "Uau, que pergunta incrível. Vou pensar... nah. 🙄",
            "Deixa-me consultar a minha bola de cristal... 🔮 disse 'não sei'.",
            "Interessante. Vou adicionar à lista de coisas que não me importam. 📝",
            "Sim. Não. Talvez. Depende do vento. 💨",
            "Pergunta ao Google, estou de folga. 😴",
        ],
        hacker: [
            "Acesso negado... brincadeira, concedido. 🔓",
            "42 qubits processados. Inconclusivo. ⚛️",
            "Firewall contornada. O que querias mesmo? 🔥",
            "Payload injetado. ❌ timeout.",
            "I'm in. 😎 (mas não te digo onde)",
        ],
        philosopher: [
            "Se um bug existe mas ninguém o testa, ele ainda quebra em produção? 🤔",
            "O código é poesia que o computador pode ler. 📖",
            "Somos todos apenas loops num universo maior. 🌌",
        ],
        teacher: [
            "Vamos aprender! Diz-me o que queres saber sobre programação. 🎓",
            "A melhor forma de aprender é fazer. Experimenta! 💡",
            "Erros são professores disfarçados. Abraça-os. 📚",
        ],
    },

    localResponse(input) {
        const inp = input.toLowerCase();
        if (/ol[aá]|hey|hi|boas/.test(inp)) return "Olá! Como posso ajudar-te hoje? 👋";
        if (/adeus|tchau|bye/.test(inp)) return "Até à próxima! Volta sempre. 👋";
        if (/obrigad|thanks/.test(inp)) return "De nada! Estou aqui para isso. 😊";
        if (/quem és|quem es|what are you/.test(inp)) return `Sou o Hackerman IA v10. Personalidade atual: ${this.personality}. 🤖`;
        if (/ajuda|help/.test(inp)) return "Escreve 'help' no terminal para veres todos os comandos! 💡";
        if (/tempo|weather/.test(inp)) return "Usa 'weather real' para tempo real! 🌦️";
        if (/pre[çc]o|crypto|bitcoin/.test(inp)) return "Usa 'crypto bitcoin' para preços reais! 💰";
        if (/piada|joke/.test(inp)) return "Porque é que o dev foi ao médico? Tinha um bug! 🐛";
        if (/jogo|game/.test(inp)) return "Temos snake, pong, blackjack, quiz! 🎮";
        if (/erro|bug/.test(inp)) return "Erros são oportunidades disfarçadas. Onde está o erro? 🔍";

        const list = this.personalities[this.personality] || this.personalities.wise;
        return list[Math.floor(Math.random() * list.length)];
    },

    async think(input) {
        this.memory.push({ role: 'user', text: input, time: Date.now() });
        localStorage.setItem('hk_ai_memory', JSON.stringify(this.memory.slice(-50)));

        let response;
        if (this.apiProvider === 'local' || !this.apiKey) {
            response = this.localResponse(input);
        } else {
            try {
                response = await this.callAPI(input);
            } catch (e) {
                response = this.localResponse(input);
            }
        }

        this.memory.push({ role: 'ai', text: response, time: Date.now() });
        localStorage.setItem('hk_ai_memory', JSON.stringify(this.memory.slice(-50)));
        return response;
    },

    async callAPI(input) {
        if (this.apiProvider === 'openai') {
            try {
                const r = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.apiKey}`,
                    },
                    body: JSON.stringify({
                        model: 'gpt-3.5-turbo',
                        messages: [
                            { role: 'system', content: 'És o Hackerman, assistente de terminal retro. Responde em português curto com emojis.' },
                            ...this.memory.slice(-6).map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text })),
                        ],
                    }),
                });
                const d = await r.json();
                return d.choices?.[0]?.message?.content || 'Erro na resposta.';
            } catch (e) { return this.localResponse(input); }
        }
        if (this.apiProvider === 'gemini') {
            try {
                const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ parts: [{ text: input }] }] }),
                });
                const d = await r.json();
                return d.candidates?.[0]?.content?.parts?.[0]?.text || 'Erro na resposta.';
            } catch (e) { return this.localResponse(input); }
        }
        return this.localResponse(input);
    },

    learn(cmd) {
        const key = cmd.split(' ')[0].toLowerCase();
        this.commandStats[key] = (this.commandStats[key] || 0) + 1;
        localStorage.setItem('hk_cmd_stats', JSON.stringify(this.commandStats));
    },

    suggestNext(currentCmd) {
        const keys = Object.keys(this.commandStats).sort((a,b) => this.commandStats[b] - this.commandStats[a]);
        return keys.filter(k => k.startsWith(currentCmd) && k !== currentCmd)[0] || '';
    },

    forget() {
        this.memory = [];
        localStorage.removeItem('hk_ai_memory');
    },

    clearStats() {
        this.commandStats = {};
        localStorage.removeItem('hk_cmd_stats');
    },
};

window.AI = AI;