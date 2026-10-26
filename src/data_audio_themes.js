  <script>
    // =========================================================================
    // PAWNS & PAWS: 3D CAT CHESS — DATA, DIORAMA MAPS & WEB AUDIO SYNTHESIZER
    // =========================================================================

    const CAT_BREED_INFO = {
      k: {
        name: 'Royal Chonky Persian King',
        role: 'King',
        desc: 'Massive, ultra-fluffy Persian boss cat with a smug royal gaze and a 5-point ruby & sapphire gold crown.',
        moveStyle: 'Dignified royal stride & heavy pounce'
      },
      q: {
        name: 'Slender Siamese Crown Queen',
        role: 'Queen',
        desc: 'Tall, long-legged Oriental Queen with winged blue eyes, red bell collar, and a golden dome crown.',
        moveStyle: 'Graceful high-speed pounce & paw strike'
      },
      r: {
        name: 'Ragdoll Guardian Rook',
        role: 'Rook',
        desc: 'Large, muscular seal-point Ragdoll cat with dark brown ears, eye mask, fluffy ruff, and bushy tail.',
        moveStyle: 'Powerhouse fortress charge'
      },
      b: {
        name: 'Mitre-Crowned Plaza Bishop',
        role: 'Bishop',
        desc: 'Sleek white cat wearing a tall white-and-gold liturgical Bishop mitre hat and ceremonial cape.',
        moveStyle: 'Silent diagonal glide & pounce'
      },
      n: {
        name: 'Steel-Helm Siamese Knight',
        role: 'Knight',
        desc: 'Dark-masked warrior cat wearing a rounded steel-blue medieval nasal helmet.',
        moveStyle: 'Acrobatic L-shaped mid-air leap'
      },
      p: {
        name: 'Big-Eyed Scottish Fold Pawn',
        role: 'Pawn',
        desc: 'Adorable sitting tabby cat with huge lime-yellow eyes, folded ears, and tail wrapped around its paws.',
        moveStyle: 'Playful hop & four-legged pounce'
      }
    };

    const BOARD_THEMES = {
      classic: {
        id: 'classic',
        effectLabel: '☀️ Sunlit Breeze Petals',
        name: 'Coastal Cat Plaza',
        icon: '🏖️',
        lightSq: '#e6dfd5',
        darkSq: '#5c4942',
        frameColor: '#8c7a6b',
        rimColor: '#c29b61',
        courtyardColor: '#b8a99a',
        wallColor: '#d97742',
        wallAltColor: '#e89954',
        roofColor: '#992b15',
        shutterColor: '#166534',
        treeFoliage: '#2d6a3e',
        treeFoliageAlt: '#3f8552',
        waterColor: '#0284c7',
        skyTop: '#38bdf8',
        skyBottom: '#e0f2fe',
        ambientLight: '#fff7ed',
        keyLight: '#ffedd5',
        rimLight: '#38bdf8',
        particleColor: '#ffffff',
        particleType: 'seagulls',
        roughness: 0.48,
        metalness: 0.05,
        ambientPitch: 220
      },
      sakura: {
        id: 'sakura',
        effectLabel: '🌸 3D Falling Blossoms',
        name: 'Kyoto Sakura Courtyard',
        icon: '🌸',
        lightSq: '#fff1f2',
        darkSq: '#703850',
        frameColor: '#4c1d34',
        rimColor: '#f472b6',
        courtyardColor: '#cbb8b8',
        wallColor: '#fdf2f8',
        wallAltColor: '#fce7f3',
        roofColor: '#334155',
        shutterColor: '#831843',
        treeFoliage: '#f472b6',
        treeFoliageAlt: '#fbcfe8',
        waterColor: '#38bdf8',
        skyTop: '#f472b6',
        skyBottom: '#fce7f3',
        ambientLight: '#fce7f3',
        keyLight: '#fbcfe8',
        rimLight: '#f472b6',
        particleColor: '#f9a8d4',
        particleType: 'petals',
        roughness: 0.42,
        metalness: 0.08,
        ambientPitch: 293.7
      },
      cyber: {
        id: 'cyber',
        effectLabel: '⚡ 3D Neon Holo-Cubes',
        name: 'Shibuya Neon Alley',
        icon: '⚡',
        lightSq: '#cbd5e1',
        darkSq: '#1e293b',
        frameColor: '#0f172a',
        rimColor: '#06b6d4',
        courtyardColor: '#1e293b',
        wallColor: '#1e1b4b',
        wallAltColor: '#311042',
        roofColor: '#020617',
        shutterColor: '#06b6d4',
        treeFoliage: '#0891b2',
        treeFoliageAlt: '#a855f7',
        waterColor: '#0f172a',
        skyTop: '#090d24',
        skyBottom: '#1e1b4b',
        ambientLight: '#cffafe',
        keyLight: '#67e8f9',
        rimLight: '#d946ef',
        particleColor: '#22d3ee',
        particleType: 'cyber',
        roughness: 0.22,
        metalness: 0.55,
        ambientPitch: 130.8
      },
      winter: {
        id: 'winter',
        effectLabel: '❄️ Real 3D Snowfall',
        name: 'Alpine Winter Lodge',
        icon: '❄️',
        lightSq: '#f0f9ff',
        darkSq: '#3b6998',
        frameColor: '#94a3b8',
        rimColor: '#38bdf8',
        courtyardColor: '#e2e8f0',
        wallColor: '#7c2d12',
        wallAltColor: '#9a3412',
        roofColor: '#f8fafc',
        shutterColor: '#0369a1',
        treeFoliage: '#cbd5e1',
        treeFoliageAlt: '#94a3b8',
        waterColor: '#7dd3fc',
        skyTop: '#1e3a8a',
        skyBottom: '#bae6fd',
        ambientLight: '#e0f2fe',
        keyLight: '#bae6fd',
        rimLight: '#38bdf8',
        particleColor: '#ffffff',
        particleType: 'snow',
        roughness: 0.30,
        metalness: 0.15,
        ambientPitch: 261.6
      },
      autumn: {
        id: 'autumn',
        effectLabel: '🍁 3D Falling Maple Leaves',
        name: 'Autumn Forest Shrine',
        icon: '🍁',
        lightSq: '#fde8c8',
        darkSq: '#6b2d14',
        frameColor: '#5c2d16',
        rimColor: '#ea580c',
        courtyardColor: '#a8896c',
        wallColor: '#b45309',
        wallAltColor: '#d97706',
        roofColor: '#451a03',
        shutterColor: '#78350f',
        treeFoliage: '#ea580c',
        treeFoliageAlt: '#f59e0b',
        waterColor: '#0284c7',
        skyTop: '#c2410c',
        skyBottom: '#fed7aa',
        ambientLight: '#ffedd5',
        keyLight: '#fdba74',
        rimLight: '#f97316',
        particleColor: '#fb923c',
        particleType: 'leaves',
        roughness: 0.48,
        metalness: 0.08,
        ambientPitch: 220
      },
      volcano: {
        id: 'volcano',
        effectLabel: '🔥 3D Rising Lava Embers',
        name: 'Volcanic Obsidian Keep',
        icon: '🌋',
        lightSq: '#d6d3d1',
        darkSq: '#292524',
        frameColor: '#1c1917',
        rimColor: '#ef4444',
        courtyardColor: '#292524',
        wallColor: '#44403c',
        wallAltColor: '#292524',
        roofColor: '#7f1d1d',
        shutterColor: '#ea580c',
        treeFoliage: '#7f1d1d',
        treeFoliageAlt: '#b91c1c',
        waterColor: '#ea580c',
        skyTop: '#450a0a',
        skyBottom: '#991b1b',
        ambientLight: '#fecaca',
        keyLight: '#fca5a5',
        rimLight: '#f97316',
        particleColor: '#fb7185',
        particleType: 'embers',
        roughness: 0.58,
        metalness: 0.22,
        ambientPitch: 110
      },
      castle: {
        id: 'castle',
        effectLabel: '✨ 3D Starlight Fireflies',
        name: 'Moonlit Royal Fortress',
        icon: '🌙',
        lightSq: '#cbd5e1',
        darkSq: '#334155',
        frameColor: '#1e293b',
        rimColor: '#818cf8',
        courtyardColor: '#475569',
        wallColor: '#334155',
        wallAltColor: '#475569',
        roofColor: '#1e1b4b',
        shutterColor: '#6366f1',
        treeFoliage: '#1e3a8a',
        treeFoliageAlt: '#312e81',
        waterColor: '#1e3a8a',
        skyTop: '#0f172a',
        skyBottom: '#312e81',
        ambientLight: '#e0e7ff',
        keyLight: '#c7d2fe',
        rimLight: '#818cf8',
        particleColor: '#a5b4fc',
        particleType: 'wisps',
        roughness: 0.45,
        metalness: 0.25,
        ambientPitch: 164.8
      },
      ocean: {
        id: 'ocean',
        effectLabel: '🫧 3D Rising Sea Bubbles',
        name: 'Coral Harbor Promenade',
        icon: '🌊',
        lightSq: '#ecfeff',
        darkSq: '#155e75',
        frameColor: '#0e7490',
        rimColor: '#2dd4bf',
        courtyardColor: '#a5f3fc',
        wallColor: '#0284c7',
        wallAltColor: '#38bdf8',
        roofColor: '#0d9488',
        shutterColor: '#f43f5e',
        treeFoliage: '#0d9488',
        treeFoliageAlt: '#14b8a6',
        waterColor: '#0369a1',
        skyTop: '#0284c7',
        skyBottom: '#ccfbf1',
        ambientLight: '#ccfbf1',
        keyLight: '#99f6e4',
        rimLight: '#06b6d4',
        particleColor: '#67e8f9',
        particleType: 'bubbles',
        roughness: 0.30,
        metalness: 0.18,
        ambientPitch: 174.6
      },
      candy: {
        id: 'candy',
        effectLabel: '⭐ 3D Sugar Star Confetti',
        name: 'Pastel Patisserie Plaza',
        icon: '🍬',
        lightSq: '#fffbeb',
        darkSq: '#9333ea',
        frameColor: '#7e22ce',
        rimColor: '#f43f5e',
        courtyardColor: '#fbcfe8',
        wallColor: '#f472b6',
        wallAltColor: '#c084fc',
        roofColor: '#db2777',
        shutterColor: '#facc15',
        treeFoliage: '#f472b6',
        treeFoliageAlt: '#c084fc',
        waterColor: '#38bdf8',
        skyTop: '#ec4899',
        skyBottom: '#fef08a',
        ambientLight: '#fae8ff',
        keyLight: '#f5d0fe',
        rimLight: '#ec4899',
        particleColor: '#f0abfc',
        particleType: 'stars',
        roughness: 0.32,
        metalness: 0.12,
        ambientPitch: 329.6
      },
      desert: {
        id: 'desert',
        effectLabel: '🌪️ 3D Golden Sand Shimmer',
        name: 'Pharaoh Oasis Courtyard',
        icon: '🏜️',
        lightSq: '#fef3c7',
        darkSq: '#78350f',
        frameColor: '#92400e',
        rimColor: '#fbbf24',
        courtyardColor: '#fde68a',
        wallColor: '#d97706',
        wallAltColor: '#f59e0b',
        roofColor: '#b45309',
        shutterColor: '#0284c7',
        treeFoliage: '#15803d',
        treeFoliageAlt: '#22c55e',
        waterColor: '#06b6d4',
        skyTop: '#d97706',
        skyBottom: '#fef9c3',
        ambientLight: '#fef08a',
        keyLight: '#fde047',
        rimLight: '#f59e0b',
        particleColor: '#fcd34d',
        particleType: 'sand',
        roughness: 0.55,
        metalness: 0.10,
        ambientPitch: 196
      }
    };

    const CAT_PUZZLES = [
      {
        id: 'daily-1',
        title: 'Daily Cat Tactic: Feather-Wand Queen Strike',
        rating: 1150,
        fen: 'r1bqkbnr/pppp1ppp/2n5/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4',
        objective: 'White to move — Capture on f7 with the Queen to trigger the 3D Attack Cam Checkmate!',
        solution: ['Qxf7#']
      },
      {
        id: 'puz-2',
        title: 'Mitre Bishop Sacrifice & Fork',
        rating: 1280,
        fen: 'r2qk2r/ppp2ppp/2np4/4N3/2B1P1b1/2N5/PPPP1PPP/R1BQK2R w KQkq - 0 7',
        objective: 'White to move — Capture on f7+ with the Bishop to force the King out!',
        solution: ['Bxf7+', 'Ke7', 'Nd5#']
      },
      {
        id: 'puz-3',
        title: 'Roomba Rook Back-Rank Sweep',
        rating: 1320,
        fen: '6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1',
        objective: 'White to move — Roll the Roomba Rook to d8 for checkmate!',
        solution: ['Rd8#']
      },
      {
        id: 'puz-4',
        title: 'Coastal Plaza Castling',
        rating: 1450,
        fen: 'r1b1k2r/ppppqppp/2n2n2/4p3/1bB1P3/2NP1N2/PPP2PPP/R1BQK2R w KQkq - 3 6',
        objective: 'White to move — Castle Kingside (O-O) to bring the Roomba Rook into play!',
        solution: ['O-O']
      },
      {
        id: 'puz-5',
        title: 'Back-Rank Capture Showdown',
        rating: 1620,
        fen: '5rk1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1',
        objective: 'White to move — Attack the Black Rook on f8 or deliver mate on e8!',
        solution: ['Re8', 'Rxe8']
      },
      {
        id: 'puz-6',
        title: 'Plaza Cat Ascension',
        rating: 1380,
        fen: '8/5P1k/8/8/8/8/8/6K1 w - - 0 1',
        objective: 'White to move — Promote your Plaza Cat on f8 to a Queen!',
        solution: ['f8=Q']
      }
    ];

    let audioCtx = null;
    let ambientNodes = null;
    let boomboxInterval = null;
    let lastMeowTime = 0;

    function ensureAudioContext() {
      if (appState.audio.muted) return null;
      if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) audioCtx = new AudioContextClass();
      }
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
      }
      return audioCtx;
    }

    function getEffectiveGain(channel) {
      if (appState.audio.muted) return 0;
      const master = appState.audio.master / 100;
      const ch = (appState.audio[channel] ?? 80) / 100;
      return Math.max(0, Math.min(1, master * ch));
    }

    function playSoundEffect(type) {
      const ctx = ensureAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const sfxGain = getEffectiveGain('sfx');
      const musicGain = getEffectiveGain('music');
      if (sfxGain <= 0.001 && musicGain <= 0.001) return;

      try {
        if (type === 'click' || type === 'hover') {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(420, now);
          osc.frequency.exponentialRampToValueAtTime(720, now + 0.045);
          g.gain.setValueAtTime(0.08 * sfxGain, now);
          g.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
          osc.connect(g).connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.055);
        } else if (type === 'select') {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(340, now);
          osc.frequency.exponentialRampToValueAtTime(520, now + 0.08);
          g.gain.setValueAtTime(0.12 * sfxGain, now);
          g.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
          osc.connect(g).connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.095);
        } else if (type === 'move') {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(180, now);
          osc.frequency.exponentialRampToValueAtTime(85, now + 0.075);
          g.gain.setValueAtTime(0.24 * sfxGain, now);
          g.gain.exponentialRampToValueAtTime(0.001, now + 0.085);
          osc.connect(g).connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.09);
        } else if (type === 'knightLeap' || type === 'captureStart') {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(210, now);
          osc.frequency.exponentialRampToValueAtTime(590, now + 0.22);
          g.gain.setValueAtTime(0.15 * sfxGain, now);
          g.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
          osc.connect(g).connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.27);
          if (type === 'captureStart') {
            playCatCombatVoice('attacker');
          }
        } else if (type === 'captureImpact') {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(165, now);
          osc.frequency.exponentialRampToValueAtTime(46, now + 0.21);
          g.gain.setValueAtTime(0.38 * sfxGain, now);
          g.gain.exponentialRampToValueAtTime(0.001, now + 0.23);
          osc.connect(g).connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.24);

          // Dramatic Beaten Cat Vocalization ("Meee-yoww!" + paw smack)
          playCatCombatVoice('victim');
        } else if (type === 'meow') {
          playCatMeowVariation(true);
        } else if (type === 'illegal') {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(145, now);
          osc.frequency.setValueAtTime(120, now + 0.08);
          g.gain.setValueAtTime(0.14 * sfxGain, now);
          g.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
          osc.connect(g).connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.19);
        } else if (type === 'check' || type === 'promote' || type === 'victory' || type === 'checkmate' || type === 'gameStart' || type === 'themeChange' || type === 'undo' || type === 'castle' || type === 'defeat') {
          const notes = type === 'defeat' ? [392, 349.2, 311.1] : [523.25, 659.25, 783.99];
          notes.forEach((f, i) => {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(f, now + i * 0.07);
            g.gain.setValueAtTime(0.15 * musicGain, now + i * 0.07);
            g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.25);
            osc.connect(g).connect(ctx.destination);
            osc.start(now + i * 0.07);
            osc.stop(now + i * 0.07 + 0.26);
          });
        }
      } catch (e) {}
    }

    function playCatMeowVariation(force = false) {
      const nowMs = performance.now();
      if (!force && nowMs - lastMeowTime < 600) return;
      lastMeowTime = nowMs;

      const ctx = ensureAudioContext();
      if (!ctx) return;
      const sfxGain = getEffectiveGain('sfx');
      if (sfxGain <= 0.001) return;

      const presets = [
        { start: 490, peak: 810, end: 430, dur: 0.27 },
        { start: 370, peak: 610, end: 320, dur: 0.33 },
        { start: 300, peak: 460, end: 260, dur: 0.36 },
        { start: 530, peak: 880, end: 490, dur: 0.24 }
      ];
      const p = presets[Math.floor(Math.random() * presets.length)];
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const g = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(p.start, now);
      osc.frequency.exponentialRampToValueAtTime(p.peak, now + p.dur * 0.38);
      osc.frequency.exponentialRampToValueAtTime(p.end, now + p.dur);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(p.peak * 1.35, now);
      filter.Q.setValueAtTime(4.0, now);

      g.gain.setValueAtTime(0.001, now);
      g.gain.linearRampToValueAtTime(0.15 * sfxGain, now + 0.035);
      g.gain.exponentialRampToValueAtTime(0.001, now + p.dur);

      osc.connect(filter).connect(g).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + p.dur + 0.02);
    }

    function toggleAmbientSoundscape() {
      const ctx = ensureAudioContext();
      if (!ctx) return;
      const btn = document.getElementById('btn-toggle-ambient-loop');
      if (ambientNodes) {
        try {
          ambientNodes.osc1.stop();
          ambientNodes.osc2.stop();
        } catch (e) {}
        ambientNodes = null;
        if (btn) btn.textContent = '🌲 Ambience: OFF';
        return;
      }
      const theme = BOARD_THEMES[appState.themeId] || BOARD_THEMES.classic;
      const baseFreq = theme.ambientPitch || 220;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc1.type = 'sine';
      osc2.type = 'triangle';
      osc1.frequency.value = baseFreq;
      osc2.frequency.value = baseFreq * 1.5;
      gain.gain.value = 0.025 * getEffectiveGain('ambient');
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      osc1.start();
      osc2.start();
      ambientNodes = { osc1, osc2, gain };
      if (btn) btn.textContent = '🌲 Ambience: ON';
    }

    function toggleBoomboxGroove() {
      const ctx = ensureAudioContext();
      const badge = document.getElementById('badge-prop-boombox');
      if (boomboxInterval) {
        clearInterval(boomboxInterval);
        boomboxInterval = null;
        appState.mapProps.boomboxPlaying = false;
        if (badge) badge.textContent = 'Play';
        showToast('📻 Plaza Boombox Paused');
        return;
      }
      appState.mapProps.boomboxPlaying = true;
      if (badge) badge.textContent = '♫ Playing';
      showToast('📻 Plaza Boombox Playing Coastal Cat Groove!');
      const melody = [523.25, 659.25, 783.99, 659.25, 587.33, 698.46, 783.99, 523.25];
      let step = 0;
      boomboxInterval = setInterval(() => {
        if (!ctx || appState.audio.muted) return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(melody[step % melody.length], now);
        g.gain.setValueAtTime(0.07 * getEffectiveGain('music'), now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.connect(g).connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.24);
        if (dioramaProps.boomboxPos) {
          spawnCaptureSparkleBurst(dioramaProps.boomboxPos, '#38bdf8');
        }
        step++;
      }, 320);
    }


    // =========================================================================
    // EXPRESSIVE COMBAT CAT VOICE SYNTHESIZER (WHEN BEATING / CAPTURING CATS)
    // Uses dual-formant vocal tract filters (F1 & F2) + vibrato + paw hiss
    // =========================================================================
    function playCatCombatVoice(role = 'victim') {
      const ctx = ensureAudioContext();
      if (!ctx) return;
      const sfxGain = getEffectiveGain('sfx');
      if (sfxGain <= 0.001) return;

      const now = ctx.currentTime;
      const isVictim = role === 'victim';

      // Dual-oscillator feline vocal cords
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc2.type = 'triangle';

      // Vibrato LFO for realistic cat vocal inflection
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(isVictim ? 18 : 11, now);
      lfoGain.gain.setValueAtTime(isVictim ? 22 : 14, now);
      lfo.connect(lfoGain);
      lfoGain.connect(osc1.frequency);
      lfoGain.connect(osc2.frequency);

      const dur = isVictim ? 0.46 : 0.32;
      if (isVictim) {
        // Beaten cat: High-pitched surprised "Meee-yaoww!" descending cry
        const basePitch = 580 + Math.random() * 110;
        osc1.frequency.setValueAtTime(basePitch, now);
        osc1.frequency.exponentialRampToValueAtTime(basePitch * 1.48, now + 0.11);
        osc1.frequency.exponentialRampToValueAtTime(basePitch * 0.92, now + 0.28);
        osc1.frequency.exponentialRampToValueAtTime(basePitch * 0.52, now + dur);

        osc2.frequency.setValueAtTime(basePitch * 1.01, now);
        osc2.frequency.exponentialRampToValueAtTime(basePitch * 1.49, now + 0.11);
        osc2.frequency.exponentialRampToValueAtTime(basePitch * 0.52, now + dur);
      } else {
        // Attacker cat: Fierce pounce "Mrrr-oww!" rising roar
        const basePitch = 310 + Math.random() * 70;
        osc1.frequency.setValueAtTime(basePitch, now);
        osc1.frequency.exponentialRampToValueAtTime(basePitch * 1.65, now + 0.16);
        osc1.frequency.exponentialRampToValueAtTime(basePitch * 1.12, now + dur);

        osc2.frequency.setValueAtTime(basePitch * 0.5, now);
        osc2.frequency.exponentialRampToValueAtTime(basePitch * 0.85, now + 0.16);
        osc2.frequency.exponentialRampToValueAtTime(basePitch * 0.55, now + dur);
      }

      // Formant 1 (mouth cavity) & Formant 2 (nasal/throat tract)
      const f1 = ctx.createBiquadFilter();
      const f2 = ctx.createBiquadFilter();
      f1.type = 'bandpass';
      f2.type = 'bandpass';
      f1.Q.setValueAtTime(3.2, now);
      f2.Q.setValueAtTime(4.5, now);

      f1.frequency.setValueAtTime(isVictim ? 780 : 520, now);
      f1.frequency.exponentialRampToValueAtTime(isVictim ? 1320 : 960, now + dur * 0.35);
      f1.frequency.exponentialRampToValueAtTime(isVictim ? 640 : 480, now + dur);

      f2.frequency.setValueAtTime(isVictim ? 1650 : 1280, now);
      f2.frequency.exponentialRampToValueAtTime(isVictim ? 2550 : 1950, now + dur * 0.35);
      f2.frequency.exponentialRampToValueAtTime(isVictim ? 1350 : 1120, now + dur);

      const env = ctx.createGain();
      env.gain.setValueAtTime(0.001, now);
      env.gain.linearRampToValueAtTime(0.24 * sfxGain, now + 0.035);
      env.gain.setValueAtTime(0.22 * sfxGain, now + dur * 0.55);
      env.gain.exponentialRampToValueAtTime(0.001, now + dur);

      osc1.connect(f1);
      osc2.connect(f1);
      osc1.connect(f2);
      f1.connect(env);
      f2.connect(env);
      env.connect(ctx.destination);

      lfo.start(now);
      osc1.start(now);
      osc2.start(now);
      lfo.stop(now + dur + 0.02);
      osc1.stop(now + dur + 0.02);
      osc2.stop(now + dur + 0.02);
    }

    // =========================================================================
    // SOOTHING CLASSICAL & COZY IN-GAME MUSIC ENGINE (Erik Satie / Clair de Lune)
    // Plays gentle, relaxing classical piano & harp chords while playing chess
    // =========================================================================
    let soothingMusicTimer = null;
    let soothingMusicActive = false;
    let soothingMusicStep = 0;
    let soothingMusicStyle = 'satie'; // 'satie' | 'debussy' | 'plaza'

    const SOOTHING_TRACKS = {
      satie: {
        name: 'Gymnopédie No. 1 (Soothing Piano)',
        tempoMs: 1350,
        // Warm Erik Satie Gymnopédie progression (Gmaj7 -> Dmaj7) with floating melody
        steps: [
          { bass: 196.00, chord: [293.66, 369.99, 493.88], melody: 739.99 },
          { bass: 146.83, chord: [277.18, 329.63, 440.00], melody: 659.25 },
          { bass: 196.00, chord: [293.66, 369.99, 493.88], melody: 587.33 },
          { bass: 146.83, chord: [277.18, 329.63, 440.00], melody: 554.37 },
          { bass: 196.00, chord: [293.66, 392.00, 493.88], melody: 659.25 },
          { bass: 146.83, chord: [293.66, 369.99, 440.00], melody: 739.99 },
          { bass: 164.81, chord: [246.94, 329.63, 392.00], melody: 493.88 },
          { bass: 146.83, chord: [220.00, 293.66, 369.99], melody: 587.33 }
        ]
      },
      debussy: {
        name: 'Clair de Lune (Moonlit Celesta)',
        tempoMs: 1200,
        steps: [
          { bass: 174.61, chord: [261.63, 349.23, 440.00], melody: 698.46 },
          { bass: 174.61, chord: [261.63, 349.23, 440.00], melody: 659.25 },
          { bass: 196.00, chord: [293.66, 349.23, 466.16], melody: 587.33 },
          { bass: 196.00, chord: [293.66, 349.23, 440.00], melody: 523.25 },
          { bass: 164.81, chord: [261.63, 329.63, 392.00], melody: 659.25 },
          { bass: 146.83, chord: [261.63, 349.23, 440.00], melody: 587.33 },
          { bass: 130.81, chord: [246.94, 329.63, 392.00], melody: 523.25 },
          { bass: 174.61, chord: [261.63, 349.23, 440.00], melody: 440.00 }
        ]
      },
      plaza: {
        name: 'Italian Coastal Lullaby (Warm Harp)',
        tempoMs: 1100,
        steps: [
          { bass: 261.63, chord: [329.63, 392.00, 493.88], melody: 659.25 },
          { bass: 220.00, chord: [329.63, 440.00, 523.25], melody: 783.99 },
          { bass: 174.61, chord: [261.63, 349.23, 440.00], melody: 698.46 },
          { bass: 196.00, chord: [293.66, 392.00, 493.88], melody: 587.33 },
          { bass: 164.81, chord: [246.94, 329.63, 392.00], melody: 659.25 },
          { bass: 220.00, chord: [261.63, 329.63, 440.00], melody: 523.25 },
          { bass: 146.83, chord: [261.63, 349.23, 440.00], melody: 587.33 },
          { bass: 196.00, chord: [246.94, 293.66, 392.00], melody: 493.88 }
        ]
      }
    };

    function playSoothingChordStep() {
      if (!soothingMusicActive || appState.audio.muted) return;
      const ctx = ensureAudioContext();
      if (!ctx) return;
      const musicGain = getEffectiveGain('music');
      if (musicGain <= 0.001) return;

      const track = SOOTHING_TRACKS[soothingMusicStyle] || SOOTHING_TRACKS.satie;
      const stepObj = track.steps[soothingMusicStep % track.steps.length];
      soothingMusicStep++;

      const now = ctx.currentTime;
      const masterFilter = ctx.createBiquadFilter();
      masterFilter.type = 'lowpass';
      masterFilter.frequency.setValueAtTime(1600, now);
      masterFilter.connect(ctx.destination);

      // 1. Soft Warm Bass Note
      const bassOsc = ctx.createOscillator();
      const bassGain = ctx.createGain();
      bassOsc.type = 'sine';
      bassOsc.frequency.setValueAtTime(stepObj.bass, now);
      bassGain.gain.setValueAtTime(0.001, now);
      bassGain.gain.linearRampToValueAtTime(0.048 * musicGain, now + 0.08);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + 1.25);
      bassOsc.connect(bassGain).connect(masterFilter);
      bassOsc.start(now);
      bassOsc.stop(now + 1.28);

      // 2. Arpeggiated Warm Chord Notes
      stepObj.chord.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'triangle';
        const tStart = now + 0.14 + idx * 0.11;
        osc.frequency.setValueAtTime(freq, tStart);
        g.gain.setValueAtTime(0.001, tStart);
        g.gain.linearRampToValueAtTime(0.028 * musicGain, tStart + 0.06);
        g.gain.exponentialRampToValueAtTime(0.001, tStart + 1.05);
        osc.connect(g).connect(masterFilter);
        osc.start(tStart);
        osc.stop(tStart + 1.08);
      });

      // 3. Delicate High Bell / Piano Melody Note
      if (stepObj.melody) {
        const melOsc = ctx.createOscillator();
        const melGain = ctx.createGain();
        melOsc.type = 'sine';
        const mStart = now + 0.52;
        melOsc.frequency.setValueAtTime(stepObj.melody, mStart);
        melGain.gain.setValueAtTime(0.001, mStart);
        melGain.gain.linearRampToValueAtTime(0.036 * musicGain, mStart + 0.05);
        melGain.gain.exponentialRampToValueAtTime(0.001, mStart + 1.15);
        melOsc.connect(melGain).connect(masterFilter);
        melOsc.start(mStart);
        melOsc.stop(mStart + 1.18);
      }
    }

    function updateSoothingMusicUI() {
      const label = soothingMusicActive ? '♫ Music: ON' : '♫ Music: OFF';
      ['btn-header-music', 'btn-options-music', 'btn-audio-soothing-toggle'].forEach((id) => {
        const el = document.getElementById(id);
        if (el) {
          el.textContent = label;
          el.classList.toggle('active-pill', soothingMusicActive);
        }
      });
    }

    function startSoothingBackgroundMusic(silentToast = false) {
      if (soothingMusicActive) return;
      ensureAudioContext();
      soothingMusicActive = true;
      clearInterval(soothingMusicTimer);
      const track = SOOTHING_TRACKS[soothingMusicStyle] || SOOTHING_TRACKS.satie;
      playSoothingChordStep();
      soothingMusicTimer = setInterval(playSoothingChordStep, track.tempoMs);
      updateSoothingMusicUI();
      if (!silentToast) {
        showToast(`♫ Playing: ${track.name}`);
      }
    }

    function stopSoothingBackgroundMusic(silentToast = false) {
      soothingMusicActive = false;
      clearInterval(soothingMusicTimer);
      soothingMusicTimer = null;
      updateSoothingMusicUI();
      if (!silentToast) {
        showToast('♫ Soothing background music paused');
      }
    }

    function toggleSoothingGameMusic() {
      if (soothingMusicActive) {
        stopSoothingBackgroundMusic(false);
      } else {
        startSoothingBackgroundMusic(false);
      }
    }

    function setSoothingMusicTrack(styleKey) {
      soothingMusicStyle = SOOTHING_TRACKS[styleKey] ? styleKey : 'satie';
      if (soothingMusicActive) {
        stopSoothingBackgroundMusic(true);
        startSoothingBackgroundMusic(false);
      } else {
        startSoothingBackgroundMusic(false);
      }
    }
