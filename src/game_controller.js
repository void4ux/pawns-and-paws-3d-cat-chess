
    function inspectHomeCatPiece(pieceType) {
      const info = CAT_BREED_INFO[pieceType] || CAT_BREED_INFO.k;
      ['k', 'q', 'r', 'b', 'n', 'p'].forEach((t) => {
        const btn = document.getElementById(`inspect-btn-${t}`);
        if (btn) btn.classList.toggle('active-pill', t === pieceType);
      });
      const titleEl = document.getElementById('home-inspect-title');
      const descEl = document.getElementById('home-inspect-desc');
      if (titleEl) titleEl.textContent = `${info.name} (${info.role})`;
      if (descEl) descEl.textContent = `${info.desc} • Move style: ${info.moveStyle}.`;
      playCatCombatVoice(pieceType === 'p' || pieceType === 'b' ? 'victim' : 'attacker');
    }


    // =========================================================================
    // HOME LAUNCH HUB ROUTER, PRE-GAME MAP CUSTOMIZER, MULTIPLAYER MAP VOTING
    // (HIGHEST VOTE OR FIRST-TO-TAP TIEBREAKER) & LIVE MATCH CHAT + EMOJIS
    // =========================================================================

    const mpVotingState = {
      votesByMap: {},
      playerVotedMap: null,
      opponentVotedMap: null
    };

    function switchScreenView(screenName) {
      const homeEl = document.getElementById('screen-home-hub');
      const matchEl = document.getElementById('screen-match-view');
      const homeNav = document.getElementById('home-bottom-nav');
      const lblBtn = document.getElementById('lbl-header-toggle-view');

      if (screenName === 'home') {
        if (homeEl) homeEl.classList.remove('hidden');
        if (matchEl) matchEl.classList.add('hidden');
        if (homeNav) homeNav.classList.remove('hidden');
        if (lblBtn) lblBtn.textContent = 'Active Board';
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        if (homeEl) homeEl.classList.add('hidden');
        if (matchEl) matchEl.classList.remove('hidden');
        if (homeNav) homeNav.classList.add('hidden');
        if (lblBtn) lblBtn.textContent = 'Home';
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      if (typeof onResize3DViewport === 'function') {
        onResize3DViewport();
        if (typeof requestAnimationFrame === 'function') {
          requestAnimationFrame(onResize3DViewport);
        }
        setTimeout(onResize3DViewport, 60);
      }
    }

    function openChatModal() {
      const unreadDot = document.getElementById('chat-unread-dot');
      if (unreadDot) unreadDot.classList.add('hidden');
      openModal('modal-chat');
      setTimeout(() => {
        const inp = document.getElementById('match-chat-input');
        if (inp) inp.focus();
      }, 80);
    }

    function toggleHomeAndMatchView() {
      const homeEl = document.getElementById('screen-home-hub');
      const isHomeVisible = homeEl && !homeEl.classList.contains('hidden');
      switchScreenView(isHomeVisible ? 'match' : 'home');
      playSoundEffect('click');
    }

    function openPreGameSetup(mode) {
      selectSetupMode(mode || 'ai');
      renderThemeCardsGrid();
      openModal('modal-main-menu');
    }

    function startSpectatorAiVsAi() {
      selectSetupMode('aivsai');
      switchScreenView('match');
      startConfiguredNewGame();
    }

    // --- MULTIPLAYER MAP VOTING SYSTEM ---
    // Rule: Highest vote count wins. If Player 1 selects a map of their own and Player 2 selects
    // a map of their own (1-1 tie), the map selected by the FIRST player to tap wins!
    function openMultiplayerMapVotingModal() {
      if (!mpVotingState.playerVotedMap && !mpVotingState.opponentVotedMap) {
        resetMultiplayerVotes(true);
      } else {
        renderMultiplayerVotingGrid();
      }
      openModal('modal-online');
    }

    function resetMultiplayerVotes(silent) {
      mpVotingState.votesByMap = {};
      mpVotingState.playerVotedMap = null;
      mpVotingState.opponentVotedMap = null;
      renderMultiplayerVotingGrid();
      const statusEl = document.getElementById('mp-vote-winner-subline');
      const bannerEl = document.getElementById('mp-vote-winner-headline');
      if (statusEl) statusEl.textContent = 'Waiting for first tap...';
      if (bannerEl) bannerEl.textContent = 'Winning Map: Undecided (Tap a Map!)';
      if (!silent) playSoundEffect('click');
    }

    function castPlayerMapVote(mapId) {
      const nowTs = performance.now();

      if (mpVotingState.playerVotedMap && mpVotingState.votesByMap[mpVotingState.playerVotedMap]) {
        const prev = mpVotingState.votesByMap[mpVotingState.playerVotedMap];
        prev.count = Math.max(0, prev.count - 1);
        prev.voters = prev.voters.filter((v) => v !== 'You');
        if (prev.count === 0) delete mpVotingState.votesByMap[mpVotingState.playerVotedMap];
      }

      mpVotingState.playerVotedMap = mapId;
      if (!mpVotingState.votesByMap[mapId]) {
        mpVotingState.votesByMap[mapId] = {
          count: 1,
          firstVoteTimestamp: nowTs,
          firstVoter: 'You',
          voters: ['You']
        };
      } else {
        mpVotingState.votesByMap[mapId].count += 1;
        if (!mpVotingState.votesByMap[mapId].voters.includes('You')) {
          mpVotingState.votesByMap[mapId].voters.push('You');
        }
      }

      playSoundEffect('click');

      if (!mpVotingState.opponentVotedMap) {
        setTimeout(() => {
          if (!mpVotingState.opponentVotedMap) simulateOpponentMapVote(false);
        }, 240);
      }

      renderMultiplayerVotingGrid();
    }

    function simulateOpponentMapVote(opponentTapsFirst) {
      const themeKeys = Object.keys(BOARD_THEMES);
      if (opponentTapsFirst) {
        mpVotingState.votesByMap = {};
        mpVotingState.playerVotedMap = null;
        mpVotingState.opponentVotedMap = null;
      }

      let oppMap = themeKeys[Math.floor(Math.random() * themeKeys.length)];
      if (mpVotingState.playerVotedMap && oppMap === mpVotingState.playerVotedMap) {
        oppMap = themeKeys[(themeKeys.indexOf(oppMap) + 1) % themeKeys.length];
      }

      if (mpVotingState.opponentVotedMap && mpVotingState.votesByMap[mpVotingState.opponentVotedMap]) {
        const prev = mpVotingState.votesByMap[mpVotingState.opponentVotedMap];
        prev.count = Math.max(0, prev.count - 1);
        prev.voters = prev.voters.filter((v) => v !== 'Peer');
        if (prev.count === 0) delete mpVotingState.votesByMap[mpVotingState.opponentVotedMap];
      }

      const nowTs = opponentTapsFirst ? performance.now() - 5000 : performance.now();
      mpVotingState.opponentVotedMap = oppMap;

      if (!mpVotingState.votesByMap[oppMap]) {
        mpVotingState.votesByMap[oppMap] = {
          count: 1,
          firstVoteTimestamp: nowTs,
          firstVoter: 'Opponent',
          voters: ['Peer']
        };
      } else {
        mpVotingState.votesByMap[oppMap].count += 1;
        if (!mpVotingState.votesByMap[oppMap].voters.includes('Peer')) {
          mpVotingState.votesByMap[oppMap].voters.push('Peer');
        }
      }

      playSoundEffect('move');
      renderMultiplayerVotingGrid();
    }

    function resolveWinningVotedMap() {
      const entries = Object.entries(mpVotingState.votesByMap).filter(([, info]) => info && info.count > 0);
      if (entries.length === 0) {
        return {
          winnerId: appState.themeId || 'classic',
          statusText: 'Waiting for first tap...',
          bannerText: 'Winning Map: Undecided (Tap a Map!)'
        };
      }

      entries.sort((a, b) => {
        if (b[1].count !== a[1].count) return b[1].count - a[1].count; // Highest vote wins
        return a[1].firstVoteTimestamp - b[1].firstVoteTimestamp;       // First to tap wins 1-1 tie!
      });

      const [winnerId, winInfo] = entries[0];
      const themeObj = BOARD_THEMES[winnerId] || BOARD_THEMES.classic;

      let statusText = '';
      if (winInfo.count >= 2) {
        statusText = `Highest Vote (${winInfo.count} votes) — Majority Consensus!`;
      } else if (entries.length >= 2) {
        statusText = `1–1 Vote Tie! ${winInfo.firstVoter} tapped FIRST (${themeObj.name})!`;
      } else {
        statusText = `${winInfo.firstVoter} tapped first (${themeObj.name} leads)!`;
      }

      return {
        winnerId,
        statusText,
        bannerText: `Winning Map: ${themeObj.icon} ${themeObj.name}`
      };
    }

    function renderMultiplayerVotingGrid() {
      const grid = document.getElementById('mp-map-voting-grid');
      const statusEl = document.getElementById('mp-vote-winner-subline');
      const bannerEl = document.getElementById('mp-vote-winner-headline');

      const res = resolveWinningVotedMap();
      if (statusEl) statusEl.textContent = res.statusText;
      if (bannerEl) bannerEl.textContent = res.bannerText;

      if (!grid) return;
      grid.innerHTML = Object.values(BOARD_THEMES).map((t) => {
        const info = mpVotingState.votesByMap[t.id];
        const count = info ? info.count : 0;
        const isYou = mpVotingState.playerVotedMap === t.id;
        const isPeer = mpVotingState.opponentVotedMap === t.id;
        const isWinner = count > 0 && res.winnerId === t.id;

        return `
          <div onclick="castPlayerMapVote('${t.id}')" class="vote-map-card p-2.5 flex flex-col justify-between gap-1.5 ${isYou ? 'voted-by-me' : ''} ${isPeer ? 'voted-by-peer' : ''} ${isWinner ? 'winning-vote' : ''}">
            <div class="flex items-center justify-between">
              <span class="text-base">${t.icon}</span>
              <span class="font-mono-code text-[10px] font-bold px-1.5 py-0.5 rounded ${isWinner ? 'bg-[#81b64c] text-white' : 'bg-[#1a1917] text-[#9e9b95]'}">${count} Vote${count === 1 ? '' : 's'}</span>
            </div>
            <div class="text-xs font-extrabold text-white leading-tight">${t.name}</div>
            <div class="text-[9px] text-[#a1a1aa] font-medium">${t.effectLabel || ""}</div>
            <div class="flex items-center gap-1 flex-wrap">
              ${isYou ? '<span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/40">You</span>' : ''}
              ${isPeer ? '<span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">Opponent</span>' : ''}
              ${isWinner ? '<span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#81b64c]/25 text-[#a3e635]">★ Winner</span>' : ''}
            </div>
          </div>
        `;
      }).join('');
    }

    function launchMultiplayerVotedMatch() {
      const res = resolveWinningVotedMap();
      applyThemeById(res.winnerId);
      if (!appState.online.connected) {
        createOnlineRoom();
      }
      closeModal('modal-online');
      switchScreenView('match');
      startConfiguredNewGame();
      appendMatchChatMessage('Arena Vote', `${res.bannerText} (${res.statusText})`, 'system');
    }

    // --- LIVE MATCH CHAT BOX & FLOATING 3D EMOJI REACTIONS ---
    function appendMatchChatMessage(sender, text, role) {
      const log = document.getElementById('match-chat-log');
      if (!log) return;
      const div = document.createElement('div');
      if (role === 'system') {
        div.className = 'text-[#9e9b95] italic text-[11px]';
        div.textContent = `🐾 ${text}`;
      } else {
        const colorCls = role === 'me' ? 'text-[#81b64c]' : 'text-amber-400';
        div.className = 'text-[11px] text-white leading-snug';
        div.innerHTML = `<span class="font-bold ${colorCls}">${sender}:</span> ${text}`;
      }
      log.appendChild(div);
      log.scrollTop = log.scrollHeight;
      const chatModal = document.getElementById('modal-chat');
      const unreadDot = document.getElementById('chat-unread-dot');
      if (chatModal && chatModal.classList.contains('hidden') && unreadDot && role !== 'me') {
        unreadDot.classList.remove('hidden');
      }
    }

    function spawnFloatingEmojiOnBoard(emoji, isOpponent) {
      const layer = document.getElementById('board-emoji-float-layer');
      if (!layer) return;
      const el = document.createElement('div');
      el.className = 'floating-emoji';
      el.textContent = emoji;
      el.style.left = (25 + Math.random() * 50) + '%';
      el.style.top = (isOpponent ? 22 + Math.random() * 16 : 62 + Math.random() * 16) + '%';
      layer.appendChild(el);
      setTimeout(() => el.remove(), 1750);
    }

    function sendMatchEmoji(emoji) {
      playSoundEffect('click');
      spawnFloatingEmojiOnBoard(emoji, false);
      appendMatchChatMessage('You', emoji, 'me');

      if (appState.gameMode === 'online') {
        const payload = { type: 'reaction', emoji };
        if (peerConn && peerConn.open) { try { peerConn.send(payload); } catch (e) {} }
        if (appState.online.channel) { try { appState.online.channel.postMessage(payload); } catch (e) {} }
        return;
      }

      setTimeout(() => {
        const pool = ['😺', '😼', '👑', '🐾', '🔥', '👏', '🤝'];
        const reply = pool[Math.floor(Math.random() * pool.length)];
        const oppName = document.getElementById('name-player-top')?.textContent || 'Master_Felix';
        spawnFloatingEmojiOnBoard(reply, true);
        appendMatchChatMessage(oppName, reply, 'opp');
      }, 620);
    }

    function sendMatchChatMessage(msg) {
      if (!msg || !msg.trim()) return;
      playSoundEffect('click');
      appendMatchChatMessage('You', msg.trim(), 'me');

      if (appState.gameMode === 'online') {
        const payload = { type: 'chat', text: msg.trim(), sender: appState.online.isHost ? 'Host' : 'Guest' };
        if (peerConn && peerConn.open) { try { peerConn.send(payload); } catch (e) {} }
        if (appState.online.channel) { try { appState.online.channel.postMessage(payload); } catch (e) {} }
        return;
      }

      setTimeout(() => {
        const pool = [
          'Purr-fectly played! Let us see your next move 🐾',
          'Meow! Keep your eyes on my Knights 😼',
          'Good game! May the sharpest claws win 👑',
          'The Coastal Cat Plaza favors the bold! 🏝️'
        ];
        const oppName = document.getElementById('name-player-top')?.textContent || 'Master_Felix';
        appendMatchChatMessage(oppName, pool[Math.floor(Math.random() * pool.length)], 'opp');
      }, 720);
    }

    function sendCustomChatInput() {
      const inp = document.getElementById('match-chat-input');
      if (!inp || !inp.value.trim()) return;
      sendMatchChatMessage(inp.value.trim());
      inp.value = '';
    }

    // PART 4: WEB WORKER CHESS BOT ENGINE, LICHESS UI CONTROLLERS & GAME LOGIC
    // =========================================================================

    const appState = {
      viewMode: '3d',
      gameMode: 'ai',
      aiDifficulty: 'medium',
      playerSide: 'w',
      boardFlipped: false,
      cameraLocked: true,
      themeId: 'classic',
      captureStyle: 'cinematic',
      showLegalMoves: true,
      selectedSquare: null,
      legalMovesForSelected: [],
      lastMove: null,
      activeHintMove: null,
      pendingPromotionMove: null,
      cursorSquare: 'e2',
      historySnapshots: [],
      redoStack: [],
      viewingHistoryIndex: -1,
      activePuzzleIndex: 0,
      puzzleStepIndex: 0,
      mapProps: {
        boomboxPlaying: false,
        lampOn: true
      },
      clock: {
        enabled: true,
        initialSeconds: 600,
        incrementSeconds: 0,
        wRemainingMs: 600000,
        bRemainingMs: 600000,
        paused: false,
        lastTickPerf: 0,
        gameOverByTimeout: false
      },
      custom: {
        lightSq: '#e6dfd5',
        darkSq: '#5c4942',
        boardMat: 'stone',
        whiteFur: '#f8fafc',
        blackFur: '#3f3a36',
        eyeStyle: 'classic',
        lightIntensity: 1.2,
        moveSpeed: 1.0,
        particlesEnabled: true
      },
      audio: {
        muted: false,
        master: 80,
        sfx: 85,
        music: 65,
        ambient: 55
      },
      stats: {
        gamesPlayed: 0,
        wins: 0,
        captures: 0,
        puzzlesSolved: 0,
        onlineElo: 200,
        onlineGames: 0,
        onlineWins: 0
      },
      online: {
        roomCode: '',
        connected: false,
        ws: null,
        channel: null,
        myColor: 'w'
      }
    };

    let chessEngine = null;
    let aiWorker = null;
    let aiThinking = false;
    let aiVsAiTimer = null;

    function createChessAIWebWorker() {
      const workerCode = `
        importScripts('https://cdnjs.cloudflare.com/ajax/libs/chess.js/0.10.3/chess.min.js');
        const PIECE_VALUES = { p: 100, n: 320, b: 335, r: 500, q: 920, k: 20000 };
        const PST_PAWN = [
          [0,  0,  0,  0,  0,  0,  0,  0],
          [50, 50, 50, 50, 50, 50, 50, 50],
          [12, 12, 22, 32, 32, 22, 12, 12],
          [6,  6, 12, 26, 26, 12,  6,  6],
          [0,  0,  4, 22, 22,  4,  0,  0],
          [4, -4, -8,  0,  0, -8, -4,  4],
          [4, 10, 10,-20,-20, 10, 10,  4],
          [0,  0,  0,  0,  0,  0,  0,  0]
        ];
        const PST_KNIGHT = [
          [-50,-40,-30,-30,-30,-30,-40,-50],
          [-40,-20,  0,  4,  4,  0,-20,-40],
          [-30,  4, 12, 16, 16, 12,  4,-30],
          [-30,  6, 16, 22, 22, 16,  6,-30],
          [-30,  4, 16, 22, 22, 16,  4,-30],
          [-30,  6, 12, 16, 16, 12,  6,-30],
          [-40,-20,  0,  4,  4,  0,-20,-40],
          [-50,-40,-30,-30,-30,-30,-40,-50]
        ];
        const PST_CENTER = [
          [-20,-10,-10,-10,-10,-10,-10,-20],
          [-10,  0,  0,  0,  0,  0,  0,-10],
          [-10,  0,  8, 12, 12,  8,  0,-10],
          [-10,  4,  8, 14, 14,  8,  4,-10],
          [-10,  4,  8, 14, 14,  8,  4,-10],
          [-10,  0,  8, 12, 12,  8,  0,-10],
          [-10,  2,  0,  0,  0,  0,  2,-10],
          [-20,-10,-10,-10,-10,-10,-10,-20]
        ];

        function evaluateBoard(game) {
          if (game.in_checkmate()) return game.turn() === 'w' ? -99999 : 99999;
          if (game.in_draw() || game.in_stalemate() || game.in_threefold_repetition()) return 0;
          const b = game.board();
          let score = 0;
          for (let r = 0; r < 8; r++) {
            for (let f = 0; f < 8; f++) {
              const p = b[r][f];
              if (!p) continue;
              const base = PIECE_VALUES[p.type] || 0;
              const row = p.color === 'w' ? r : (7 - r);
              let pst = p.type === 'p' ? PST_PAWN[row][f] : (p.type === 'n' ? PST_KNIGHT[row][f] : PST_CENTER[row][f]);
              score += (p.color === 'w' ? 1 : -1) * (base + pst);
            }
          }
          return score;
        }

        function orderMoves(moves) {
          return moves.sort((a, b) => {
            const sA = (a.captured ? (PIECE_VALUES[a.captured] * 10 - PIECE_VALUES[a.piece]) : 0) + (a.promotion ? 800 : 0);
            const sB = (b.captured ? (PIECE_VALUES[b.captured] * 10 - PIECE_VALUES[b.piece]) : 0) + (b.promotion ? 800 : 0);
            return sB - sA;
          });
        }

        function minimax(game, depth, alpha, beta, maximizing) {
          if (depth === 0 || game.game_over()) return evaluateBoard(game);
          const moves = orderMoves(game.moves({ verbose: true }));
          if (maximizing) {
            let maxEval = -Infinity;
            for (let i = 0; i < moves.length; i++) {
              game.move(moves[i]);
              const ev = minimax(game, depth - 1, alpha, beta, false);
              game.undo();
              if (ev > maxEval) maxEval = ev;
              if (ev > alpha) alpha = ev;
              if (beta <= alpha) break;
            }
            return maxEval;
          } else {
            let minEval = Infinity;
            for (let i = 0; i < moves.length; i++) {
              game.move(moves[i]);
              const ev = minimax(game, depth - 1, alpha, beta, true);
              game.undo();
              if (ev < minEval) minEval = ev;
              if (ev < beta) beta = ev;
              if (beta <= alpha) break;
            }
            return minEval;
          }
        }

        self.onmessage = function(e) {
          const { fen, difficulty, requestType } = e.data;
          const game = new Chess(fen);
          const legal = orderMoves(game.moves({ verbose: true }));
          if (!legal.length) {
            self.postMessage({ bestMove: null, evalCp: 0, requestType });
            return;
          }
          const depthMap = { beginner: 1, easy: 2, medium: 3, hard: 3, expert: 4 };
          const searchDepth = requestType === 'hint' ? 3 : (depthMap[difficulty] || 3);
          const isWhite = game.turn() === 'w';

          if (requestType !== 'hint' && difficulty === 'beginner' && Math.random() < 0.45) {
            const randMv = legal[Math.floor(Math.random() * legal.length)];
            self.postMessage({ bestMove: randMv, evalCp: evaluateBoard(game), depth: 1, requestType });
            return;
          }

          let bestMove = legal[0];
          let bestEval = isWhite ? -Infinity : Infinity;
          for (let i = 0; i < legal.length; i++) {
            const mv = legal[i];
            game.move(mv);
            const ev = minimax(game, searchDepth - 1, -Infinity, Infinity, !isWhite);
            game.undo();
            const jitter = (difficulty === 'easy' && requestType !== 'hint') ? (Math.random() * 40 - 20) : 0;
            const totalEv = ev + jitter;
            if (isWhite && totalEv > bestEval) {
              bestEval = totalEv;
              bestMove = mv;
            } else if (!isWhite && totalEv < bestEval) {
              bestEval = totalEv;
              bestMove = mv;
            }
          }
          self.postMessage({ bestMove, evalCp: bestEval, depth: searchDepth, requestType });
        };
      `;
      try {
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        const worker = new Worker(URL.createObjectURL(blob));
        worker.onmessage = onAIWorkerMessage;
        worker.onerror = (err) => {
          console.warn('AI worker encountered error, will use local engine:', err);
          aiWorker = null;
        };
        return worker;
      } catch (err) {
        return null;
      }
    }

    function computeBestMoveFallback(fen, difficulty) {
      const tempGame = new Chess(fen);
      const moves = tempGame.moves({ verbose: true });
      if (!moves.length) return { bestMove: null, evalCp: 0, depth: 2 };
      const vals = { p: 100, n: 320, b: 335, r: 500, q: 920, k: 20000 };
      let bestMove = moves[0];
      let bestScore = -999999;
      for (const mv of moves) {
        tempGame.move(mv);
        let score = tempGame.in_checkmate() ? 99999 : 0;
        if (!score) {
          const b = tempGame.board();
          for (let r = 0; r < 8; r++) {
            for (let f = 0; f < 8; f++) {
              const p = b[r][f];
              if (p) score += (p.color === mv.color ? 1 : -1) * (vals[p.type] || 0);
            }
          }
        }
        tempGame.undo();
        if (score > bestScore) {
          bestScore = score;
          bestMove = mv;
        }
      }
      return { bestMove, evalCp: tempGame.turn() === 'w' ? bestScore : -bestScore, depth: 2 };
    }

    function requestAIMoveOrHint(requestType = 'move') {
      if (!chessEngine || chessEngine.game_over()) return;
      aiThinking = true;
      const dot = document.getElementById('engine-status-dot');
      const lbl = document.getElementById('engine-thinking-label');
      if (dot) dot.className = 'w-2 h-2 rounded-full bg-[#3692e7] animate-ping';
      if (lbl) lbl.textContent = requestType === 'hint' ? 'Calculating best line...' : 'Bot calculating move...';

      const fen = chessEngine.fen();
      if (aiWorker) {
        let responded = false;
        const safetyTimer = setTimeout(() => {
          if (!responded) {
            console.warn('AI worker response timed out, using fallback move...');
            const res = computeBestMoveFallback(fen, appState.aiDifficulty);
            onAIWorkerMessage({ data: { ...res, requestType } });
          }
        }, 650);

        aiWorker.onmessage = (e) => {
          responded = true;
          clearTimeout(safetyTimer);
          onAIWorkerMessage(e);
        };
        try {
          aiWorker.postMessage({ fen, difficulty: appState.aiDifficulty, requestType });
        } catch (err) {
          clearTimeout(safetyTimer);
          const res = computeBestMoveFallback(fen, appState.aiDifficulty);
          onAIWorkerMessage({ data: { ...res, requestType } });
        }
      } else {
        setTimeout(() => {
          const res = computeBestMoveFallback(fen, appState.aiDifficulty);
          onAIWorkerMessage({ data: { ...res, requestType } });
        }, 150);
      }
    }

    function onAIWorkerMessage(e) {
      aiThinking = false;
      const { bestMove, evalCp, depth, requestType } = e.data;
      const dot = document.getElementById('engine-status-dot');
      const lbl = document.getElementById('engine-thinking-label');
      if (dot) dot.className = 'w-2 h-2 rounded-full bg-[#629924]';
      if (lbl) lbl.textContent = `Catfish • Depth ${depth || 3}`;

      updateEvaluationBarUI(evalCp || 0);
      if (!bestMove) return;

      if (requestType === 'hint') {
        appState.activeHintMove = { from: bestMove.from, to: bestMove.to, san: bestMove.san };
        const banner = document.getElementById('hud-hint-banner');
        const txt = document.getElementById('hud-hint-text');
        if (banner && txt) {
          txt.textContent = `${bestMove.san} (${bestMove.from.toUpperCase()} → ${bestMove.to.toUpperCase()})`;
          banner.classList.remove('hidden');
        }
        rebuild3DMarkers();
        showToast(`💡 Best Move: ${bestMove.san} (${bestMove.from} → ${bestMove.to})`);
        return;
      }

      setTimeout(() => {
        if (!chessEngine || chessEngine.game_over()) return;
        executeValidatedMove({
          from: bestMove.from,
          to: bestMove.to,
          promotion: bestMove.promotion || 'q'
        });
      }, 220);
    }

    function updateEvaluationBarUI(evalCp) {
      const pawns = (evalCp / 100).toFixed(1);
      const signStr = evalCp >= 0 ? `+${pawns}` : `${pawns}`;
      const pvEl = document.getElementById('engine-pv-line');
      const topScore = document.getElementById('eval-score-top');
      const botScore = document.getElementById('eval-score-bottom');
      const whiteBar = document.getElementById('eval-bar-white');
      const blackBar = document.getElementById('eval-bar-black');

      if (pvEl) pvEl.textContent = `Eval: ${signStr}`;
      if (botScore) botScore.textContent = signStr;
      if (topScore) topScore.textContent = evalCp < 0 ? `${(-evalCp / 100).toFixed(1)}` : '0.0';

      const clamped = Math.max(-1000, Math.min(1000, evalCp));
      const whitePct = 50 + (clamped / 1000) * 45;
      if (whiteBar && blackBar) {
        whiteBar.style.height = `${whitePct}%`;
        blackBar.style.height = `${100 - whitePct}%`;
      }
    }

    function findKingSquare(color) {
      if (!chessEngine) return null;
      const b = chessEngine.board();
      for (let r = 0; r < 8; r++) {
        for (let f = 0; f < 8; f++) {
          const p = b[r][f];
          if (p && p.type === 'k' && p.color === color) {
            return String.fromCharCode(97 + f) + (8 - r);
          }
        }
      }
      return null;
    }

    function isFiftyMoveClaimable() {
      if (!chessEngine) return false;
      const parts = chessEngine.fen().split(' ');
      return parseInt(parts[4] || '0', 10) >= 100;
    }

    function onBoardSquareInteract(square) {
      if (activeMoveAnim || aiThinking) return;
      if (!chessEngine || chessEngine.game_over()) return;

      if (appState.viewingHistoryIndex !== -1) {
        stepHistoryIndex('end');
      }

      const turn = chessEngine.turn();
      if (appState.gameMode === 'ai' && turn !== appState.playerSide) {
        showToast("Wait for the opponent's move.");
        return;
      }
      if (appState.gameMode === 'aivsai') {
        showToast("Bot vs Bot Spectator Mode active.");
        return;
      }
      if (appState.gameMode === 'online') {
        if (turn !== appState.online.myColor) {
          showToast("⏳ Waiting for opponent's move!");
          playSoundEffect('illegal');
          return;
        }
      }

      appState.cursorSquare = square;

      if (appState.selectedSquare) {
        const candidateMoves = appState.legalMovesForSelected.filter((m) => m.to === square);
        if (candidateMoves.length > 0) {
          const isPromo = candidateMoves.some((m) => m.promotion || (m.flags && m.flags.includes('p')));
          if (isPromo) {
            appState.pendingPromotionMove = { from: appState.selectedSquare, to: square };
            openModal('modal-promotion');
            return;
          }
          executeValidatedMove({ from: appState.selectedSquare, to: square });
          return;
        }
      }

      const pieceOnSq = chessEngine.get(square);
      if (pieceOnSq && pieceOnSq.color === turn) {
        if (appState.gameMode === 'online' && pieceOnSq.color !== appState.online.myColor) {
          showToast(`⚠️ You are playing as ${appState.online.myColor === 'w' ? 'White ⚪' : 'Black ⚫'}!`);
          playSoundEffect('illegal');
          return;
        }
        appState.selectedSquare = square;
        appState.legalMovesForSelected = chessEngine.moves({ square, verbose: true });
        playSoundEffect('select');
        updateSelectedCatHUD(pieceOnSq, square);
        rebuild3DMarkers();
      } else {
        if (appState.selectedSquare) playSoundEffect('illegal');
        appState.selectedSquare = null;
        appState.legalMovesForSelected = [];
        updateSelectedCatHUD(null, null);
        rebuild3DMarkers();
      }
    }

    function updateSelectedCatHUD(piece, square) {
      const card = document.getElementById('hud-selected-cat');
      if (!card) return;
      if (!piece || !square) {
        card.classList.add('hidden');
        return;
      }
      const info = CAT_BREED_INFO[piece.type] || CAT_BREED_INFO.p;
      const teamLabel = piece.color === 'w' ? 'White' : 'Black';
      document.getElementById('selected-cat-title').textContent = `${teamLabel} ${info.name}`;
      document.getElementById('selected-cat-sq').textContent = square.toUpperCase();
      document.getElementById('selected-cat-desc').textContent = info.desc;
      card.classList.remove('hidden');
    }

    function confirmPawnPromotion(promoPiece) {
      closeModal('modal-promotion');
      if (!appState.pendingPromotionMove) return;
      const { from, to } = appState.pendingPromotionMove;
      appState.pendingPromotionMove = null;
      playSoundEffect('promote');
      executeValidatedMove({ from, to, promotion: promoPiece || 'q' }, true);
    }

    let autoStartedMusicOnce = false;
    function executeValidatedMove(moveSpec, isFromPromotion = false, isRemoteSync = false) {
      if (!chessEngine) return false;
      if (!autoStartedMusicOnce && !appState.audio.muted && typeof startSoothingBackgroundMusic === 'function') {
        autoStartedMusicOnce = true;
        startSoothingBackgroundMusic(true);
      }
      if (appState.gameMode === 'puzzles') {
        return handlePuzzleMoveAttempt(moveSpec);
      }

      const moveResult = chessEngine.move(moveSpec);
      if (!moveResult) {
        playSoundEffect('illegal');
        return false;
      }

      if (appState.clock.enabled && !appState.clock.paused) {
        const incMs = appState.clock.incrementSeconds * 1000;
        if (moveResult.color === 'w') appState.clock.wRemainingMs += incMs;
        else appState.clock.bRemainingMs += incMs;
      }

      appState.selectedSquare = null;
      appState.legalMovesForSelected = [];
      appState.activeHintMove = null;
      appState.lastMove = { from: moveResult.from, to: moveResult.to, san: moveResult.san };
      appState.redoStack = [];
      appState.viewingHistoryIndex = -1;

      const bannerHint = document.getElementById('hud-hint-banner');
      if (bannerHint) bannerHint.classList.add('hidden');
      updateSelectedCatHUD(null, null);

      appState.historySnapshots.push({
        fen: chessEngine.fen(),
        san: moveResult.san,
        color: moveResult.color,
        from: moveResult.from,
        to: moveResult.to,
        captured: moveResult.captured || null
      });

      if (moveResult.captured) {
        appState.stats.captures++;
        savePersistedState();
      }

      if (appState.gameMode === 'online' && !isRemoteSync) {
        broadcastOnlineRoomMove(moveSpec);
      }

      renderMoveHistoryTable();
      updateCapturedPiecesAndMaterialUI();
      updateGameStatusBanner();
      rebuild3DMarkers();

      start3DMoveAnimation(moveResult, () => {
        if (chessEngine.in_check() && !chessEngine.game_over()) {
          playSoundEffect('check');
        }
        checkAndHandleGameOver();

        if (!chessEngine.game_over()) {
          if (appState.gameMode === 'ai' && chessEngine.turn() !== appState.playerSide) {
            requestAIMoveOrHint('move');
          } else if (appState.gameMode === 'aivsai') {
            clearTimeout(aiVsAiTimer);
            aiVsAiTimer = setTimeout(() => requestAIMoveOrHint('move'), 350);
          }
        }
      });

      return true;
    }

    // No-op stub for removed 2D board so all existing calls remain safe
    function render2DBoard() {}

    function setBoardViewMode(mode) {
      if (mode === '2d') setCameraPlayMode('overheadAuto');
      else setCameraPlayMode('diorama3d');
    }

    function formatSanWithFigurine(san) {
      if (!san) return '';
      const figMap = { N: '♘', B: '♗', R: '♖', Q: '♕', K: '♔' };
      const first = san[0];
      if (figMap[first]) {
        return figMap[first] + san.slice(1);
      }
      return san;
    }

    // PC Vertical 2-Column Move Card (1000756625.jpg) + Mobile Chess.com Horizontal Move Strip (1000756631.jpg)
    function renderMoveHistoryTable() {
      const tbody = document.getElementById('move-history-tbody');
      const emptyMsg = document.getElementById('move-history-empty');
      const countBadge = document.getElementById('move-count-badge');
      const scrollWrap = document.getElementById('move-history-scroll');
      const mobileStrip = document.getElementById('mobile-move-strip');

      const snaps = appState.historySnapshots;
      const fullMoves = Math.ceil(snaps.length / 2);
      if (countBadge) countBadge.textContent = `Move ${fullMoves}`;

      const activeIdx = appState.viewingHistoryIndex === -1 ? (snaps.length - 1) : appState.viewingHistoryIndex;

      if (snaps.length === 0) {
        if (tbody) tbody.innerHTML = '';
        if (emptyMsg) emptyMsg.classList.remove('hidden');
        if (mobileStrip) {
          mobileStrip.innerHTML = '<span class="text-[#787672] font-sans text-[11px]"></span>';
        }
        return;
      }
      if (emptyMsg) emptyMsg.classList.add('hidden');

      let tableHtml = '';
      let stripHtml = '';

      for (let i = 0; i < snaps.length; i += 2) {
        const moveNum = Math.floor(i / 2) + 1;
        const wMove = snaps[i];
        const bMove = snaps[i + 1];
        const rowBg = moveNum % 2 === 0 ? 'bg-[#14161a]' : 'bg-[#1a1c22]';
        const isWActive = activeIdx === i;
        const isBActive = activeIdx === (i + 1);

        const wActiveCls = isWActive ? 'bg-[#81b64c]/25 text-white font-bold' : 'text-[#e4e4e7] hover:bg-white/5';
        const bActiveCls = isBActive ? 'bg-[#81b64c]/25 text-white font-bold' : 'text-[#e4e4e7] hover:bg-white/5';

        // PC Vertical Table Row (Exact Leftest Image 1000756625.jpg)
        tableHtml += `<tr class="${rowBg}">
          <td class="py-1.5 px-3 text-zinc-500 w-12 select-none">${moveNum}.</td>
          <td onclick="jumpToHistorySnapshot(${i})" class="py-1.5 px-3 cursor-pointer ${wActiveCls}">${wMove.san}</td>
          <td ${bMove ? `onclick="jumpToHistorySnapshot(${i + 1})"` : ''} class="py-1.5 px-3 cursor-pointer ${bActiveCls}">${bMove ? bMove.san : ''}</td>
        </tr>`;

        // Mobile Horizontal Chess.com Strip Item (Exact Image 1000756631.jpg: 1. d4 e5  2. e3 d6  3. ♘c3 c5)
        const wStripCls = isWActive
          ? 'bg-[#3b3935] text-white font-bold px-2 py-0.5 rounded'
          : 'text-[#c7c5c0] hover:text-white px-1 py-0.5';
        const bStripCls = isBActive
          ? 'bg-[#3b3935] text-white font-bold px-2 py-0.5 rounded'
          : 'text-[#c7c5c0] hover:text-white px-1 py-0.5';

        stripHtml += `<span class="inline-flex items-center gap-1 mr-2">
          <span class="text-[#7c7a75] select-none">${moveNum}.</span>
          <button onclick="jumpToHistorySnapshot(${i})" class="${wStripCls} transition-colors">${formatSanWithFigurine(wMove.san)}</button>
          ${bMove ? `<button onclick="jumpToHistorySnapshot(${i + 1})" class="${bStripCls} transition-colors">${formatSanWithFigurine(bMove.san)}</button>` : ''}
        </span>`;
      }

      if (tbody) tbody.innerHTML = tableHtml;
      if (scrollWrap) scrollWrap.scrollTop = scrollWrap.scrollHeight;
      if (mobileStrip) {
        mobileStrip.innerHTML = stripHtml;
        mobileStrip.scrollLeft = mobileStrip.scrollWidth;
      }
    }

    function updateCapturedPiecesAndMaterialUI() {
      if (!chessEngine) return;
      const startCounts = { p: 8, n: 2, b: 2, r: 2, q: 1 };
      const currentW = { p: 0, n: 0, b: 0, r: 0, q: 0 };
      const currentB = { p: 0, n: 0, b: 0, r: 0, q: 0 };
      const vals = { p: 1, n: 3, b: 3, r: 5, q: 9 };

      const b = chessEngine.board();
      let scoreW = 0;
      let scoreB = 0;
      for (let r = 0; r < 8; r++) {
        for (let f = 0; f < 8; f++) {
          const p = b[r][f];
          if (!p || p.type === 'k') continue;
          if (p.color === 'w') {
            currentW[p.type] = (currentW[p.type] || 0) + 1;
            scoreW += vals[p.type] || 0;
          } else {
            currentB[p.type] = (currentB[p.type] || 0) + 1;
            scoreB += vals[p.type] || 0;
          }
        }
      }

      const icons = { q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' };
      const capturedBlackByWhite = [];
      const capturedWhiteByBlack = [];
      ['q', 'r', 'b', 'n', 'p'].forEach((t) => {
        const missingB = Math.max(0, startCounts[t] - currentB[t]);
        for (let i = 0; i < missingB; i++) capturedBlackByWhite.push(icons[t]);
        const missingW = Math.max(0, startCounts[t] - currentW[t]);
        for (let i = 0; i < missingW; i++) capturedWhiteByBlack.push(icons[t]);
      });

      const botTray = document.getElementById('captured-by-bottom');
      const topTray = document.getElementById('captured-by-top');
      const botAdv = document.getElementById('adv-bottom');
      const topAdv = document.getElementById('adv-top');

      if (botTray) botTray.textContent = capturedBlackByWhite.join('');
      if (topTray) topTray.textContent = capturedWhiteByBlack.join('');

      const diff = scoreW - scoreB;
      if (botAdv) botAdv.textContent = diff > 0 ? `+${diff}` : '';
      if (topAdv) topAdv.textContent = diff < 0 ? `+${Math.abs(diff)}` : '';
    }

    function updateGameStatusBanner() {
      if (!chessEngine) return;
      const headline = document.getElementById('status-headline');
      const subline = document.getElementById('status-subline');
      const dot = document.getElementById('turn-indicator-dot');
      const claimStrip = document.getElementById('claim-draw-strip');
      const claimReason = document.getElementById('claim-draw-reason');

      const turn = chessEngine.turn();
      const isWhiteTurn = turn === 'w';
      if (dot) {
        dot.className = isWhiteTurn
          ? 'w-2.5 h-2.5 rounded-full bg-white mt-1 shrink-0'
          : 'w-2.5 h-2.5 rounded-full bg-[#629924] mt-1 shrink-0';
      }

      // Update active clock highlight (Lichess style)
      const topClock = document.getElementById('clock-top');
      const botClock = document.getElementById('clock-bottom');
      if (topClock && botClock) {
        botClock.classList.toggle('clock-running', isWhiteTurn && !chessEngine.game_over());
        topClock.classList.toggle('clock-running', !isWhiteTurn && !chessEngine.game_over());
      }

      const canClaim3Fold = chessEngine.in_threefold_repetition();
      const canClaim50 = isFiftyMoveClaimable();
      if (claimStrip && claimReason) {
        if ((canClaim3Fold || canClaim50) && !chessEngine.game_over()) {
          claimReason.textContent = canClaim3Fold ? 'Threefold repetition available.' : '50-move rule reached.';
          claimStrip.classList.remove('hidden');
        } else {
          claimStrip.classList.add('hidden');
        }
      }

      if (chessEngine.in_checkmate()) {
        const winner = isWhiteTurn ? 'Black wins by checkmate' : 'White wins by checkmate';
        if (headline) headline.textContent = winner;
        if (subline) subline.textContent = '1-0 / 0-1 • Game over';
      } else if (chessEngine.in_stalemate()) {
        if (headline) headline.textContent = 'Draw by stalemate';
        if (subline) subline.textContent = '½-½ • No legal moves';
      } else if (chessEngine.insufficient_material()) {
        if (headline) headline.textContent = 'Draw by insufficient material';
        if (subline) subline.textContent = '½-½';
      } else if (chessEngine.in_check()) {
        if (headline) headline.textContent = `${isWhiteTurn ? 'White' : 'Black'} is in check!`;
        if (subline) subline.textContent = '';
      } else {
        if (headline) headline.textContent = `${isWhiteTurn ? 'White' : 'Black'} to move`;
        if (subline) {
          subline.textContent = '';
        }
      }
    }

    function recordOnlineEloIncrease(reason, amount = 15) {
      if (typeof appState.stats.onlineElo !== 'number' || isNaN(appState.stats.onlineElo) || appState.stats.onlineElo <= 0) {
        appState.stats.onlineElo = 200;
      }
      appState.stats.onlineElo += amount;
      savePersistedState();
      updateOnlineEloUI();
      showToast(`📈 Online ELO +${amount} (${reason})! Current: ${appState.stats.onlineElo}`);
    }

    function updateOnlineEloUI() {
      const elo = appState.stats.onlineElo || 200;
      const ratingBotEl = document.getElementById('rating-badge-bottom');
      const tagBotEl = document.getElementById('tag-player-bottom');
      const statOnlineEloEl = document.getElementById('stat-online-elo');
      const lobbyEloEl = document.getElementById('online-lobby-elo');

      if (statOnlineEloEl) statOnlineEloEl.textContent = String(elo);
      if (lobbyEloEl) lobbyEloEl.textContent = `${elo} ELO`;

      if (ratingBotEl) ratingBotEl.textContent = String(elo);
      if (tagBotEl) {
        if (appState.gameMode === 'online') {
          const myTag = appState.online.isHost ? 'Host' : 'Guest';
          tagBotEl.textContent = `(${myTag} • ${elo})`;
        } else {
          tagBotEl.textContent = `(${elo})`;
        }
      }
    }

    function checkAndHandleGameOver() {
      if (!chessEngine || !chessEngine.game_over()) return;
      appState.stats.gamesPlayed++;

      const iconEl = document.getElementById('gameover-icon');
      const titleEl = document.getElementById('gameover-title');
      const subEl = document.getElementById('gameover-subtitle');

      if (chessEngine.in_checkmate()) {
        const whiteWon = chessEngine.turn() === 'b';
        const isPlayerWhite = (appState.gameMode === 'online') ? (appState.online.myColor === 'w') : (appState.playerSide === 'w');
        const playerWon = (whiteWon && isPlayerWhite) || (!whiteWon && !isPlayerWhite);
        if (playerWon) {
          appState.stats.wins++;
          if (appState.gameMode === 'online') {
            appState.stats.onlineWins = (appState.stats.onlineWins || 0) + 1;
            recordOnlineEloIncrease('Checkmate Victory', 25);
          }
          playSoundEffect('victory');
        } else {
          playSoundEffect('defeat');
        }
        if (iconEl) iconEl.textContent = '👑';
        if (titleEl) titleEl.textContent = whiteWon ? 'White Cats Win by Checkmate!' : 'Black Cats Win by Checkmate!';
        if (subEl) {
          subEl.textContent = appState.gameMode === 'online'
            ? (playerWon ? `Victory in Cat Plaza! Rating: ${appState.stats.onlineElo} ELO (+25)` : 'Online match concluded.')
            : 'Victory in the Coastal Cat Plaza.';
        }
      } else {
        playSoundEffect('gameStart');
        if (appState.gameMode === 'online') {
          recordOnlineEloIncrease('Draw', 10);
        }
        if (iconEl) iconEl.textContent = '🤝';
        if (titleEl) titleEl.textContent = 'Game Drawn (½-½)';
        if (subEl) subEl.textContent = appState.gameMode === 'online' ? `Game Drawn. Rating: ${appState.stats.onlineElo} ELO (+10)` : 'Draw declared under standard FIDE / Lichess rules.';
      }

      savePersistedState();
      updateStatsModalUI();
      openModal('modal-gameover');
    }

    function formatClockMs(ms) {
      if (!appState.clock.enabled) return '∞';
      const clamped = Math.max(0, ms);
      const totalSec = Math.ceil(clamped / 1000);
      const mins = Math.floor(totalSec / 60);
      const secs = totalSec % 60;
      return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    function updateChessClocksTick() {
      const nowPerf = performance.now();
      const dt = nowPerf - (appState.clock.lastTickPerf || nowPerf);
      appState.clock.lastTickPerf = nowPerf;

      const topClockEl = document.getElementById('clock-top');
      const botClockEl = document.getElementById('clock-bottom');

      if (!appState.clock.enabled) {
        if (topClockEl) topClockEl.textContent = '∞';
        if (botClockEl) botClockEl.textContent = '∞';
        return;
      }

      if (
        chessEngine &&
        !chessEngine.game_over() &&
        !appState.clock.paused &&
        !appState.clock.gameOverByTimeout &&
        appState.historySnapshots.length > 0
      ) {
        const turn = chessEngine.turn();
        if (turn === 'w') {
          appState.clock.wRemainingMs = Math.max(0, appState.clock.wRemainingMs - dt);
          if (appState.clock.wRemainingMs <= 0) handleClockTimeout('w');
        } else {
          appState.clock.bRemainingMs = Math.max(0, appState.clock.bRemainingMs - dt);
          if (appState.clock.bRemainingMs <= 0) handleClockTimeout('b');
        }
      }

      const isFlipped = appState.boardFlipped;
      const botTime = isFlipped ? appState.clock.bRemainingMs : appState.clock.wRemainingMs;
      const topTime = isFlipped ? appState.clock.wRemainingMs : appState.clock.bRemainingMs;
      if (botClockEl) botClockEl.textContent = formatClockMs(botTime);
      if (topClockEl) topClockEl.textContent = formatClockMs(topTime);
    }

    function handleClockTimeout(expiredColor) {
      appState.clock.gameOverByTimeout = true;
      playSoundEffect('defeat');
      const winner = expiredColor === 'w' ? 'Black' : 'White';
      if (appState.gameMode === 'online') {
        const isWhite = appState.online.myColor === 'w';
        const playerWon = (expiredColor === 'b' && isWhite) || (expiredColor === 'w' && !isWhite);
        if (playerWon) {
          appState.stats.wins++;
          appState.stats.onlineWins = (appState.stats.onlineWins || 0) + 1;
          recordOnlineEloIncrease('Timeout Win', 25);
        }
      }
      document.getElementById('gameover-icon').textContent = '⏱️';
      document.getElementById('gameover-title').textContent = `${winner} Wins on Time!`;
      document.getElementById('gameover-subtitle').textContent = 'Flag fallen on the Lichess clock.';
      openModal('modal-gameover');
    }

    function toggleClockPause() {
      if (!appState.clock.enabled) {
        showToast('Game is untimed.');
        return;
      }
      appState.clock.paused = !appState.clock.paused;
      appState.clock.lastTickPerf = performance.now();
      const icon = document.getElementById('icon-pause-clock');
      const lbl = document.getElementById('label-pause-clock');
      if (icon) icon.textContent = appState.clock.paused ? '▶️' : '⏸️';
      if (lbl) lbl.textContent = appState.clock.paused ? 'Resume' : 'Pause';
      showToast(appState.clock.paused ? '⏸️ Clock paused' : '▶️ Clock resumed');
    }

    function setCameraPreset(preset) {
      playSoundEffect('click');
      if (preset === 'top') {
        setCameraPlayMode('overheadAuto');
      } else if (preset === 'white') {
        camState.playMode = 'diorama3d';
        camState.desiredTheta = 0;
        camState.desiredPhi = 1.02;
        camState.desiredRadius = 11.4;
        camState.desiredTarget.set(0, 0.3, 0);
      } else if (preset === 'black') {
        camState.playMode = 'diorama3d';
        camState.desiredTheta = Math.PI;
        camState.desiredPhi = 1.02;
        camState.desiredRadius = 11.4;
        camState.desiredTarget.set(0, 0.3, 0);
      } else if (preset === 'side') {
        camState.playMode = 'diorama3d';
        camState.desiredTheta = -0.52;
        camState.desiredPhi = 1.05;
        camState.desiredRadius = 11.2;
        camState.desiredTarget.set(0, 0.35, -0.3);
      } else if (preset === 'closeup') {
        camState.playMode = 'diorama3d';
        camState.desiredPhi = 1.15;
        camState.desiredRadius = 7.4;
      } else if (preset === 'actionPov') {
        camState.playMode = 'diorama3d';
        camState.desiredTheta = (typeof appState !== 'undefined' && appState.boardFlipped) ? Math.PI : 0;
        camState.desiredPhi = 1.28;
        camState.desiredRadius = 6.4;
        camState.desiredTarget.set(0, 0.45, -0.6);
        showToast('🎥 Action POV enabled');
      }
    }

    function toggleCameraProjection() {
      camState.isOrtho = !camState.isOrtho;
      activeCamera = camState.isOrtho ? orthoCamera : perspCamera;
      const btn = document.getElementById('btn-cam-proj');
      if (btn) btn.textContent = camState.isOrtho ? 'Ortho' : 'Persp';
      onResize3DViewport();
      playSoundEffect('click');
    }

    function toggleCameraFollow() {
      camState.followMoves = !camState.followMoves;
      const btns = [
        document.getElementById('btn-cam-follow'),
        document.getElementById('btn-pov-cam-toggle'),
        document.getElementById('btn-options-action-pov')
      ];
      btns.forEach((btn) => {
        if (!btn) return;
        btn.textContent = `🎥 Action POV: ${camState.followMoves ? 'ON' : 'OFF'}`;
        btn.classList.toggle('text-[#81b64c]', camState.followMoves);
        btn.classList.toggle('border-[#81b64c]/40', camState.followMoves);
        btn.classList.toggle('text-zinc-400', !camState.followMoves);
      });
      showToast(`Action POV: ${camState.followMoves ? 'ON' : 'OFF'}`);
      playSoundEffect('click');
    }

    function resetCameraView() {
      if (typeof camState !== 'undefined') camState.userCameraMoved = false;
      setCameraLockMode(true);
      showToast('🎥 Camera reset to default');
    }

    function zoomCameraStep(delta) {
      if (typeof camState !== 'undefined') camState.userCameraMoved = true;
      camState.desiredRadius = Math.max(3.0, Math.min(22.0, camState.desiredRadius + delta));
    }

    function orbitCameraStep(deltaTheta) {
      if (typeof camState !== 'undefined') camState.userCameraMoved = true;
      camState.desiredTheta += deltaTheta;
    }

    function flipBoardOrientation() {
      appState.boardFlipped = !appState.boardFlipped;
      setCameraPlayMode(camState.playMode);
      playSoundEffect('click');
    }

    function undoLastMove() {
      if (!chessEngine || appState.historySnapshots.length === 0 || activeMoveAnim) return;
      const stepsToUndo = (appState.gameMode === 'ai' && appState.historySnapshots.length >= 2) ? 2 : 1;
      for (let i = 0; i < stepsToUndo; i++) {
        const mv = chessEngine.undo();
        if (mv) {
          const snap = appState.historySnapshots.pop();
          if (snap) appState.redoStack.push({ move: mv, snap });
        }
      }
      appState.selectedSquare = null;
      appState.legalMovesForSelected = [];
      appState.activeHintMove = null;
      appState.viewingHistoryIndex = -1;
      playSoundEffect('undo');
      sync3DPiecesWithChessState();
      renderMoveHistoryTable();
      updateCapturedPiecesAndMaterialUI();
      updateGameStatusBanner();
    }

    function redoMove() {
      if (!chessEngine || appState.redoStack.length === 0 || activeMoveAnim) return;
      const stepsToRedo = (appState.gameMode === 'ai' && appState.redoStack.length >= 2) ? 2 : 1;
      for (let i = 0; i < stepsToRedo; i++) {
        const item = appState.redoStack.pop();
        if (item) {
          chessEngine.move(item.move);
          appState.historySnapshots.push(item.snap);
        }
      }
      playSoundEffect('undo');
      sync3DPiecesWithChessState();
      renderMoveHistoryTable();
      updateCapturedPiecesAndMaterialUI();
      updateGameStatusBanner();
    }

    function jumpToHistorySnapshot(idx) {
      if (idx < 0 || idx >= appState.historySnapshots.length) return;
      appState.viewingHistoryIndex = idx;
      chessEngine.load(appState.historySnapshots[idx].fen);
      sync3DPiecesWithChessState();
      renderMoveHistoryTable();
    }

    function stepHistoryIndex(dir) {
      const len = appState.historySnapshots.length;
      if (len === 0) return;
      let cur = appState.viewingHistoryIndex === -1 ? (len - 1) : appState.viewingHistoryIndex;
      if (dir === 'start') cur = 0;
      else if (dir === 'prev') cur = Math.max(0, cur - 1);
      else if (dir === 'next') cur = Math.min(len - 1, cur + 1);
      else if (dir === 'end') cur = len - 1;

      appState.viewingHistoryIndex = cur === len - 1 ? -1 : cur;
      chessEngine.load(appState.historySnapshots[cur].fen);
      sync3DPiecesWithChessState();
      renderMoveHistoryTable();
    }

    function requestEngineHint() {
      if (!chessEngine || chessEngine.game_over()) return;
      playSoundEffect('click');
      requestAIMoveOrHint('hint');
    }

    function claimEligibleDraw() {
      if (!chessEngine) return;
      playSoundEffect('gameStart');
      document.getElementById('gameover-icon').textContent = '⚖️';
      document.getElementById('gameover-title').textContent = 'Draw Claimed (½-½)';
      document.getElementById('gameover-subtitle').textContent = 'Draw verified under Lichess rules.';
      openModal('modal-gameover');
    }

    function offerOrAgreeDraw() {
      if (!chessEngine || chessEngine.game_over()) return;
      playSoundEffect('gameStart');
      if (appState.gameMode === 'online') {
        recordOnlineEloIncrease('Mutual Draw', 10);
      }
      document.getElementById('gameover-icon').textContent = '🤝';
      document.getElementById('gameover-title').textContent = 'Draw by Mutual Agreement (½-½)';
      document.getElementById('gameover-subtitle').textContent = 'Both sides agreed to a draw.';
      openModal('modal-gameover');
    }

    function resignCurrentGame() {
      if (!chessEngine || chessEngine.game_over()) return;
      playSoundEffect('defeat');
      const winner = chessEngine.turn() === 'w' ? 'Black' : 'White';
      document.getElementById('gameover-icon').textContent = '🏳️';
      document.getElementById('gameover-title').textContent = `${winner} Wins by Resignation`;
      document.getElementById('gameover-subtitle').textContent = 'Honorable concession in the Cat Plaza.';
      if (appState.gameMode === 'online') {
        const payload = { type: 'resign', color: appState.online.myColor };
        if (peerConn && peerConn.open) { try { peerConn.send(payload); } catch (e) {} }
        if (appState.online.channel) { try { appState.online.channel.postMessage(payload); } catch (e) {} }
      }
      openModal('modal-gameover');
    }

    function toggleShowLegalMoves() {
      appState.showLegalMoves = !appState.showLegalMoves;
      const btn = document.getElementById('btn-toggle-legal');
      if (btn) {
        btn.textContent = `🐾 Legal Dots: ${appState.showLegalMoves ? 'ON' : 'OFF'}`;
      }
      rebuild3DMarkers();
    }

    function applyThemeById(themeId) {
      const theme = BOARD_THEMES[themeId] || BOARD_THEMES.classic;
      appState.themeId = theme.id;
      appState.custom.lightSq = theme.lightSq;
      appState.custom.darkSq = theme.darkSq;

      const sel = document.getElementById('select-quick-theme');
      if (sel) sel.value = theme.id;

      const lInput = document.getElementById('cust-light-sq');
      const dInput = document.getElementById('cust-dark-sq');
      if (lInput) lInput.value = theme.lightSq;
      if (dInput) dInput.value = theme.darkSq;

      const pill = document.getElementById('hud-theme-pill');
      if (pill) pill.textContent = `${theme.icon} ${theme.name} • 32 3D Cats`;

      if (scene3d) {
        scene3d.background = new THREE.Color(theme.skyTop);
        scene3d.fog = new THREE.FogExp2(theme.skyBottom, 0.016);
      }
      if (ambientLight3d) ambientLight3d.color.set(theme.ambientLight);
      if (keyLight3d) keyLight3d.color.set(theme.keyLight);
      if (rimLight3d) rimLight3d.color.set(theme.rimLight);

      build3DChessboardGeometry();
      buildInteractiveDioramaWorld();
      rebuildEnvironmentParticles();
      renderThemeCardsGrid();
      playSoundEffect('themeChange');
      savePersistedState();
    }

    function renderThemeCardsGrid() {
      const cardsHtml = Object.values(BOARD_THEMES).map((t) => {
        const isAct = t.id === appState.themeId ? 'active-pill' : '';
        return `<button onclick="applyThemeById('${t.id}')" class="li-btn ${isAct} p-2 text-left flex flex-col gap-1">
          <div class="flex items-center justify-between">
            <span class="text-sm">${t.icon}</span>
            <span class="flex gap-1">
              <span class="w-2.5 h-2.5 rounded-full border border-white/30" style="background:${t.lightSq}"></span>
              <span class="w-2.5 h-2.5 rounded-full border border-white/30" style="background:${t.darkSq}"></span>
            </span>
          </div>
          <span class="text-[11px] font-bold leading-tight">${t.name}</span>
          <span class="text-[9px] text-[#81b64c] font-semibold">${t.effectLabel || ""}</span>
        </button>`;
      }).join('');

      const grid = document.getElementById('theme-cards-grid');
      if (grid) grid.innerHTML = cardsHtml;


      const curTheme = BOARD_THEMES[appState.themeId] || BOARD_THEMES.classic;
      const heroLbl = document.getElementById('hero-selected-map-lbl');
      if (heroLbl) heroLbl.textContent = curTheme.name;
    }

    function applyCustomColors() {
      appState.custom.lightSq = document.getElementById('cust-light-sq')?.value || '#e6dfd5';
      appState.custom.darkSq = document.getElementById('cust-dark-sq')?.value || '#5c4942';
      build3DChessboardGeometry();
      savePersistedState();
    }

    function applyCustomCatAppearance() {
      appState.custom.whiteFur = document.getElementById('cust-white-fur')?.value || '#f8fafc';
      appState.custom.blackFur = document.getElementById('cust-black-fur')?.value || '#3f3a36';
      appState.custom.eyeStyle = document.getElementById('cust-eye-style')?.value || 'classic';
      sync3DPiecesWithChessState();
      savePersistedState();
    }

    function updateLightingIntensity(val) {
      const v = parseFloat(val) || 1.2;
      appState.custom.lightIntensity = v;
      if (keyLight3d) keyLight3d.intensity = v;
      if (ambientLight3d) ambientLight3d.intensity = v * 0.68;
    }

    function updatePieceMoveSpeed(val) {
      appState.custom.moveSpeed = parseFloat(val) || 1.0;
    }

    function toggleEnvironmentParticles(checked) {
      appState.custom.particlesEnabled = Boolean(checked);
      rebuildEnvironmentParticles();
    }

    function resetCurrentThemeDefaults() {
      appState.custom.whiteFur = '#f8fafc';
      appState.custom.blackFur = '#3f3a36';
      appState.custom.eyeStyle = 'classic';
      applyThemeById(appState.themeId);
      sync3DPiecesWithChessState();
      showToast('↺ Restored default map & cat coats');
    }

    function renderPuzzlesListModal() {
      const grid = document.getElementById('puzzles-list-grid');
      if (!grid) return;
      grid.innerHTML = CAT_PUZZLES.map((p, idx) => `
        <div class="li-subpanel p-3 flex flex-col justify-between gap-2">
          <div>
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-white">${p.title}</span>
              <span class="font-mono-code text-[10px] px-1.5 py-0.5 rounded bg-[#262421] text-[#629924]">${p.rating}</span>
            </div>
            <p class="text-[11px] text-[#8c8a87] mt-1">${p.objective}</p>
          </div>
          <button onclick="startCatPuzzle(${idx})" class="li-btn-green py-1 px-3 text-xs self-end">Solve →</button>
        </div>
      `).join('');
    }

    function startCatPuzzle(idx) {
      const puz = CAT_PUZZLES[idx] || CAT_PUZZLES[0];
      appState.gameMode = 'puzzles';
      appState.activePuzzleIndex = idx;
      appState.puzzleStepIndex = 0;
      appState.clock.enabled = false;
      clearTimeout(aiVsAiTimer);

      chessEngine = new Chess(puz.fen);
      appState.historySnapshots = [];
      appState.redoStack = [];
      appState.selectedSquare = null;
      appState.legalMovesForSelected = [];

      document.getElementById('badge-active-mode').textContent = `Puzzle • ${puz.rating}`;
      document.getElementById('puzzle-strip-title').textContent = `🧩 ${puz.title}`;
      document.getElementById('puzzle-strip-Objective').textContent = puz.objective;
      document.getElementById('puzzle-control-strip').classList.remove('hidden');

      closeModal('modal-puzzles');
      closeModal('modal-main-menu');
      switchScreenView('match');
      sync3DPiecesWithChessState();
      renderMoveHistoryTable();
      updateGameStatusBanner();
      playSoundEffect('gameStart');
    }

    function handlePuzzleMoveAttempt(moveSpec) {
      const puz = CAT_PUZZLES[appState.activePuzzleIndex];
      if (!puz) return false;
      const expectedSan = puz.solution[appState.puzzleStepIndex];
      const tempMove = chessEngine.move(moveSpec);
      if (!tempMove) {
        playSoundEffect('illegal');
        return false;
      }

      if (tempMove.san !== expectedSan && !chessEngine.in_checkmate()) {
        chessEngine.undo();
        playSoundEffect('illegal');
        showToast('❌ Try again or click Hint!');
        return false;
      }

      appState.selectedSquare = null;
      appState.legalMovesForSelected = [];
      appState.lastMove = { from: tempMove.from, to: tempMove.to, san: tempMove.san };
      appState.historySnapshots.push({
        fen: chessEngine.fen(),
        san: tempMove.san,
        color: tempMove.color,
        from: tempMove.from,
        to: tempMove.to
      });

      renderMoveHistoryTable();
      rebuild3DMarkers();

      start3DMoveAnimation(tempMove, () => {
        appState.puzzleStepIndex++;
        if (appState.puzzleStepIndex >= puz.solution.length || chessEngine.in_checkmate()) {
          appState.stats.puzzlesSolved++;
          savePersistedState();
          playSoundEffect('victory');
          showToast('🎉 Puzzle Solved!');
        } else {
          const replySan = puz.solution[appState.puzzleStepIndex];
          const replyMv = chessEngine.move(replySan);
          if (replyMv) {
            appState.puzzleStepIndex++;
            start3DMoveAnimation(replyMv, () => {
              renderMoveHistoryTable();
            });
          }
        }
      });
      return true;
    }

    function retryCurrentPuzzle() {
      startCatPuzzle(appState.activePuzzleIndex);
    }

    function loadNextPuzzle() {
      startCatPuzzle((appState.activePuzzleIndex + 1) % CAT_PUZZLES.length);
    }

    function populateEditorSquaresDropdown() {
      const sel = document.getElementById('editor-sq-select');
      if (!sel) return;
      let html = '';
      for (let r = 8; r >= 1; r--) {
        for (let f = 0; f < 8; f++) {
          const sq = String.fromCharCode(97 + f) + r;
          html += `<option value="${sq}">${sq.toUpperCase()}</option>`;
        }
      }
      sel.innerHTML = html;
    }

    function loadEditorPreset(fen) {
      const inp = document.getElementById('editor-fen-input');
      if (inp) inp.value = fen;
      document.getElementById('editor-status-msg').textContent = 'Preset ready — click Load Position onto Board.';
    }

    function applyEditorSquareMutation() {
      const sq = document.getElementById('editor-sq-select')?.value || 'e4';
      const pieceCode = document.getElementById('editor-piece-select')?.value || 'wQ';
      const inp = document.getElementById('editor-fen-input');
      if (!inp) return;

      const temp = new Chess();
      if (!temp.load(inp.value.trim())) temp.reset();
      temp.remove(sq);
      if (pieceCode !== 'empty') {
        temp.put({ type: pieceCode[1].toLowerCase(), color: pieceCode[0] }, sq);
      }
      inp.value = temp.fen();
      document.getElementById('editor-status-msg').textContent = `Updated ${sq.toUpperCase()}.`;
    }

    function loadCustomFenFromEditor() {
      const fen = document.getElementById('editor-fen-input')?.value.trim();
      if (!fen) return;
      const test = new Chess();
      if (!test.load(fen)) {
        showToast('⚠️ Invalid FEN string.');
        return;
      }
      chessEngine = test;
      appState.historySnapshots = [];
      appState.redoStack = [];
      appState.selectedSquare = null;
      appState.legalMovesForSelected = [];
      sync3DPiecesWithChessState();
      renderMoveHistoryTable();
      updateCapturedPiecesAndMaterialUI();
      updateGameStatusBanner();
      closeModal('modal-editor');
      switchScreenView('match');
      showToast('✅ Position loaded onto 3D board!');
    }

    let peerInstance = null;
    let peerConn = null;

    function formatPeerRoomId(code) {
      return 'pawscat-' + code.toLowerCase().replace(/[^a-z0-9]/g, '');
    }

    function generateRandomHostCode() {
      const prefixes = ['CAT', 'PAW', 'MEOW', 'PURR', 'FELIX', 'LUNA', 'LION', 'TIGER', 'CHONK', 'WHISKER'];
      const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
      const num = Math.floor(10 + Math.random() * 90);
      const code = `${prefix}${num}`;
      const input = document.getElementById('online-host-code-input');
      if (input) input.value = code;
      const display = document.getElementById('host-active-code-display');
      if (display) display.textContent = code;
      return code;
    }

    function openHostOnlineModal() {
      if (!document.getElementById('online-host-code-input')?.value) {
        generateRandomHostCode();
      }
      renderMultiplayerVotingGrid();
      openModal('modal-online');
      setTimeout(() => {
        document.getElementById('online-host-code-input')?.focus();
      }, 100);
    }

    function openJoinOnlineModal(presetCode) {
      renderMultiplayerVotingGrid();
      openModal('modal-online');
      const joinInp = document.getElementById('online-join-code-input');
      if (joinInp) {
        if (presetCode) joinInp.value = presetCode.trim().toUpperCase();
        setTimeout(() => {
          joinInp.focus();
          joinInp.select();
        }, 100);
      }
    }

    function copyHostRoomCode() {
      const code = (document.getElementById('online-host-code-input')?.value || appState.online.roomCode || 'CAT7').trim().toUpperCase();
      copyDirectText(code, `📋 Code "${code}" copied to clipboard! Send to your friend.`);
    }

    function copyHostInviteLink() {
      const code = (document.getElementById('online-host-code-input')?.value || appState.online.roomCode || 'CAT7').trim().toUpperCase();
      const url = `${window.location.origin}${window.location.pathname}?room=${code}`;
      copyDirectText(url, `🔗 1-Click invite link copied! Send to your friend.`);
    }

    function copyDirectText(text, successToast) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
          showToast(successToast);
        }).catch(() => fallbackCopyDirect(text));
      } else {
        fallbackCopyDirect(text);
      }
    }

    function fallbackCopyDirect(text) {
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      showToast('📋 Copied to clipboard!');
    }

    function startHostingOnlineGame() {
      let code = (document.getElementById('online-host-code-input')?.value || '').trim().toUpperCase();
      if (!code) {
        code = generateRandomHostCode();
      }
      code = code.replace(/[^A-Z0-9]/g, '');
      if (!code) code = 'CAT7';

      appState.online.roomCode = code;
      appState.online.isHost = true;
      appState.online.myColor = 'w';
      appState.online.connected = false;
      appState.gameMode = 'online';

      document.getElementById('host-action-idle')?.classList.add('hidden');
      document.getElementById('host-action-active')?.classList.remove('hidden');
      const display = document.getElementById('host-active-code-display');
      if (display) display.textContent = code;

      const badge = document.getElementById('online-room-badge');
      const detail = document.getElementById('online-status-detail');
      if (badge) badge.textContent = `Hosting • ${code}`;
      if (detail) detail.textContent = `🟢 Waiting for friend to join with code: ${code}`;

      if (appState.online.channel) {
        try { appState.online.channel.close(); } catch (e) {}
      }
      if (typeof BroadcastChannel !== 'undefined') {
        const ch = new BroadcastChannel('pawns_paws_room_' + formatPeerRoomId(code));
        ch.onmessage = (ev) => handleIncomingNetworkMessage(ev.data);
        appState.online.channel = ch;
      }

      if (typeof Peer !== 'undefined') {
        try {
          if (peerConn) { try { peerConn.close(); } catch (e) {} peerConn = null; }
          if (peerInstance) { try { peerInstance.destroy(); } catch (e) {} peerInstance = null; }

          const targetPeerId = formatPeerRoomId(code);
          peerInstance = new Peer(targetPeerId);

          peerInstance.on('open', () => {
            showToast(`👑 Room ${code} is live! Waiting for friend.`);
          });

          peerInstance.on('connection', (conn) => {
            peerConn = conn;
            setupPeerConnectionListeners(conn, 'Host', code);
            launchOnlineMatchAsHost(code);
          });

          peerInstance.on('error', (err) => {
            console.warn('PeerJS Host warning:', err);
            if (err.type === 'unavailable-id') {
              showToast(`Code ${code} is already in use. Generated a fresh code!`);
              generateRandomHostCode();
              startHostingOnlineGame();
            }
          });
        } catch (err) {
          console.warn('PeerJS initialization error:', err);
        }
      }
    }

    function cancelHostingOnlineGame() {
      if (peerConn) { try { peerConn.close(); } catch (e) {} peerConn = null; }
      if (peerInstance) { try { peerInstance.destroy(); } catch (e) {} peerInstance = null; }
      if (appState.online.channel) { try { appState.online.channel.close(); } catch (e) {} appState.online.channel = null; }
      appState.online.connected = false;
      appState.online.isHost = false;
      document.getElementById('host-action-idle')?.classList.remove('hidden');
      document.getElementById('host-action-active')?.classList.add('hidden');
      const badge = document.getElementById('online-room-badge');
      const detail = document.getElementById('online-status-detail');
      if (badge) badge.textContent = 'WebRTC P2P Ready';
      if (detail) detail.textContent = '• Real-time multiplayer across different devices';
      showToast('Hosting cancelled.');
    }

    function joinOnlineGameWithCode() {
      const input = document.getElementById('online-join-code-input');
      let code = (input?.value || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (!code) {
        showToast('⚠️ Please enter the host\'s room code first!');
        if (input) input.focus();
        return;
      }

      appState.online.roomCode = code;
      appState.online.isHost = false;
      appState.online.myColor = 'b';
      appState.online.connected = false;
      appState.gameMode = 'online';

      const badge = document.getElementById('online-room-badge');
      const detail = document.getElementById('online-status-detail');
      const hint = document.getElementById('join-status-hint');
      if (badge) badge.textContent = `Joining • ${code}`;
      if (detail) detail.textContent = `Connecting to host ${code}...`;
      if (hint) hint.innerHTML = `<span class="animate-pulse text-amber-300">⏳ Connecting to host room <strong>${code}</strong>...</span>`;

      if (appState.online.channel) {
        try { appState.online.channel.close(); } catch (e) {}
      }
      if (typeof BroadcastChannel !== 'undefined') {
        const ch = new BroadcastChannel('pawns_paws_room_' + formatPeerRoomId(code));
        ch.onmessage = (ev) => handleIncomingNetworkMessage(ev.data);
        appState.online.channel = ch;
        ch.postMessage({ type: 'guest_join_intent', code });
      }

      if (typeof Peer !== 'undefined') {
        try {
          if (peerConn) { try { peerConn.close(); } catch (e) {} peerConn = null; }
          if (peerInstance) { try { peerInstance.destroy(); } catch (e) {} peerInstance = null; }

          peerInstance = new Peer();
          const targetId = formatPeerRoomId(code);

          peerInstance.on('open', () => {
            peerConn = peerInstance.connect(targetId, { reliable: true });
            setupPeerConnectionListeners(peerConn, 'Guest', code);
          });

          peerInstance.on('error', (err) => {
            console.warn('PeerJS Guest error:', err);
            if (hint) hint.innerHTML = `<span class="text-rose-400">⚠️ Could not reach host for "${code}". Check code or ensure host is waiting!</span>`;
            showToast(`⚠️ Could not reach host for code "${code}".`);
          });
        } catch (err) {
          console.warn('PeerJS join error:', err);
        }
      }
    }

    function launchOnlineMatchAsHost(code) {
      appState.gameMode = 'online';
      appState.online.roomCode = code;
      appState.online.myColor = 'w';
      appState.online.isHost = true;
      appState.online.connected = true;
      appState.boardFlipped = false;

      const res = resolveWinningVotedMap();
      applyThemeById(res.winnerId);

      closeModal('modal-online');
      switchScreenView('match');
      startConfiguredNewGame();

      appState.stats.onlineGames = (appState.stats.onlineGames || 0) + 1;
      recordOnlineEloIncrease('Online Match', 15);

      const startPayload = {
        type: 'match_start',
        code: code,
        themeId: res.winnerId,
        fen: chessEngine.fen(),
        hostColor: 'w',
        guestColor: 'b',
        elo: appState.stats.onlineElo || 200
      };

      setTimeout(() => {
        if (peerConn && peerConn.open) {
          try { peerConn.send(startPayload); } catch (e) {}
        }
        if (appState.online.channel) {
          try { appState.online.channel.postMessage(startPayload); } catch (e) {}
        }
      }, 250);

      showToast(`🎉 Friend joined room ${code}! You are White ⚪ — make your first move!`);
      playSoundEffect('gameStart');
      appendMatchChatMessage('Arena', `Multiplayer match started! Room: ${code}. Host (White ⚪) vs Guest (Black ⚫).`, 'system');
    }

    function launchOnlineMatchAsGuest(data) {
      appState.gameMode = 'online';
      appState.online.roomCode = data.code || appState.online.roomCode;
      appState.online.myColor = 'b';
      appState.online.isHost = false;
      appState.online.connected = true;
      appState.boardFlipped = true;

      if (data.themeId) applyThemeById(data.themeId);
      if (data.elo) appState.online.opponentElo = data.elo;

      closeModal('modal-online');
      switchScreenView('match');
      startConfiguredNewGame();

      appState.stats.onlineGames = (appState.stats.onlineGames || 0) + 1;
      recordOnlineEloIncrease('Online Match', 15);

      const guestInfo = { type: 'guest_info', elo: appState.stats.onlineElo || 200 };
      setTimeout(() => {
        if (peerConn && peerConn.open) { try { peerConn.send(guestInfo); } catch (e) {} }
        if (appState.online.channel) { try { appState.online.channel.postMessage(guestInfo); } catch (e) {} }
      }, 350);

      if (data.fen && chessEngine) {
        chessEngine.load(data.fen);
        sync3DPiecesWithChessState(true);
        renderMoveHistoryTable();
        updateGameStatusBanner();
      }
      setCameraPlayMode(camState.playMode);

      showToast(`🎉 Connected to Host on room ${data.code || appState.online.roomCode}! You are Black ⚫. White moves first.`);
      playSoundEffect('gameStart');
      appendMatchChatMessage('Arena', `Connected to room ${data.code}! You are Black ⚫. White moves first.`, 'system');
    }

    function setupPeerConnectionListeners(conn, roleName, code) {
      conn.on('open', () => {
        appState.online.connected = true;
        const statusDetail = document.getElementById('online-status-detail');
        const badge = document.getElementById('online-room-badge');
        if (badge) badge.textContent = `🟢 Connected • ${code}`;
        if (statusDetail) statusDetail.textContent = `Live WebRTC P2P • ${roleName}`;
        showToast(`🎉 Connected to Room ${code}!`);
      });

      conn.on('data', (data) => {
        handleIncomingNetworkMessage(data);
      });

      conn.on('close', () => {
        showToast('⚠️ Opponent disconnected from room.');
        const badge = document.getElementById('online-room-badge');
        if (badge) badge.textContent = `Disconnected • ${code}`;
      });
    }

    function handleIncomingNetworkMessage(data) {
      if (!data) return;
      if (data.type === 'match_start') {
        launchOnlineMatchAsGuest(data);
      } else if (data.type === 'guest_join_intent') {
        if (appState.online.isHost && appState.online.roomCode === data.code) {
          launchOnlineMatchAsHost(data.code);
        }
      } else if (data.type === 'move' && data.moveSpec) {
        executeValidatedMove(data.moveSpec, false, true);
        showToast('🐾 Opponent made a move! Your turn.');
      } else if (data.type === 'vote' && data.mapId) {
        mpVotingState.opponentVotedMap = data.mapId;
        renderMultiplayerVotingGrid();
        showToast(`🗺️ Opponent voted for map: ${BOARD_THEMES[data.mapId]?.name || data.mapId}!`);
      } else if (data.type === 'chat' && data.text) {
        appendMatchChatMessage(data.sender || 'Opponent', data.text, 'opp');
      } else if (data.type === 'reaction' && data.emoji) {
        spawnFloatingEmojiOnBoard(data.emoji, true);
      } else if (data.type === 'guest_info' && data.elo) {
        appState.online.opponentElo = data.elo;
        const ratingTopEl = document.getElementById('rating-badge-top');
        const tagTopEl = document.getElementById('tag-player-top');
        if (ratingTopEl) ratingTopEl.textContent = String(data.elo);
        if (tagTopEl) tagTopEl.textContent = `(Guest • ${data.elo})`;
      } else if (data.type === 'resign') {
        showToast('🏳️ Opponent resigned! You win!');
        appState.stats.wins++;
        appState.stats.onlineWins = (appState.stats.onlineWins || 0) + 1;
        recordOnlineEloIncrease('Opponent Concession', 25);
        const winnerName = appState.online.myColor === 'w' ? 'White ⚪ (You)' : 'Black ⚫ (You)';
        document.getElementById('gameover-icon').textContent = '🏆';
        document.getElementById('gameover-title').textContent = `${winnerName} Wins!`;
        document.getElementById('gameover-subtitle').textContent = `Opponent conceded the match. Rating: ${appState.stats.onlineElo} ELO (+25)`;
        openModal('modal-gameover');
        playSoundEffect('victory');
      }
    }

    function broadcastOnlineRoomMove(moveSpec) {
      if (appState.online.channel) {
        try { appState.online.channel.postMessage({ type: 'move', moveSpec }); } catch (e) {}
      }
      if (peerConn && peerConn.open) {
        try { peerConn.send({ type: 'move', moveSpec }); } catch (e) {}
      }
    }

    function copyOnlineRoomCode() {
      copyHostRoomCode();
    }

    function copyOnlineRoomInviteLink() {
      copyHostInviteLink();
    }

    function createOnlineRoom() {
      startHostingOnlineGame();
    }

    function joinOnlineRoom() {
      joinOnlineGameWithCode();
    }

    function checkUrlForRoomInvite() {
      try {
        const params = new URLSearchParams(window.location.search);
        const room = params.get('room');
        if (room) {
          const cleanCode = room.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
          const joinInp = document.getElementById('online-join-code-input');
          if (joinInp) joinInp.value = cleanCode;
          showToast(`🎮 Room invite detected: ${cleanCode}`);
          openJoinOnlineModal(cleanCode);
          setTimeout(() => {
            joinOnlineGameWithCode();
          }, 700);
        }
      } catch (e) {}
    }

    function syncIOModalFields() {
      if (!chessEngine) return;
      const fenEl = document.getElementById('io-fen-field');
      const pgnEl = document.getElementById('io-pgn-field');
      if (fenEl) fenEl.value = chessEngine.fen();
      if (pgnEl) pgnEl.value = chessEngine.pgn() || '';
    }

    function loadFenFromIOModal() {
      const fen = document.getElementById('io-fen-field')?.value.trim();
      if (!fen) return;
      const t = new Chess();
      if (!t.load(fen)) {
        showToast('⚠️ Invalid FEN');
        return;
      }
      chessEngine = t;
      appState.historySnapshots = [];
      sync3DPiecesWithChessState();
      renderMoveHistoryTable();
      updateGameStatusBanner();
      closeModal('modal-pgn-fen');
      showToast('✅ FEN loaded!');
    }

    function loadPgnFromIOModal() {
      const pgn = document.getElementById('io-pgn-field')?.value.trim();
      if (!pgn) return;
      const t = new Chess();
      if (!t.load_pgn(pgn)) {
        showToast('⚠️ Invalid PGN');
        return;
      }
      chessEngine = t;
      sync3DPiecesWithChessState();
      renderMoveHistoryTable();
      updateGameStatusBanner();
      closeModal('modal-pgn-fen');
      showToast('✅ PGN imported!');
    }

    function selectSetupMode(mode) {
      appState.gameMode = mode;
      ['ai', 'local', 'aivsai', 'practice'].forEach((m) => {
        const card = document.getElementById(`mode-card-${m}`);
        if (card) card.classList.toggle('active-pill', m === mode);
      });
      const aiOpts = document.getElementById('setup-ai-options');
      if (aiOpts) aiOpts.classList.toggle('hidden', mode !== 'ai');
      playSoundEffect('click');
    }

    function setSetupDifficulty(diff) {
      appState.aiDifficulty = diff;
      ['beginner', 'easy', 'medium', 'hard', 'expert'].forEach((d) => {
        const btn = document.getElementById(`diff-btn-${d}`);
        if (btn) btn.classList.toggle('active-pill', d === diff);
      });
      playSoundEffect('click');
    }

    function setSetupPlayerSide(side) {
      appState.playerSide = side === 'random' ? (Math.random() < 0.5 ? 'w' : 'b') : side;
      ['w', 'b', 'random'].forEach((s) => {
        const btn = document.getElementById(`side-btn-${s}`);
        if (btn) btn.classList.toggle('active-pill', s === side);
      });
      playSoundEffect('click');
    }

    function onClockPresetSelect(val) {
      const customBox = document.getElementById('custom-clock-inputs');
      if (customBox) customBox.classList.toggle('hidden', val !== 'custom');
    }

    function setCaptureAnimationStyle(style) {
      appState.captureStyle = style;
      savePersistedState();
    }

    function startConfiguredNewGame() {
      clearTimeout(aiVsAiTimer);
      chessEngine = new Chess();
      appState.historySnapshots = [];
      appState.redoStack = [];
      appState.selectedSquare = null;
      appState.legalMovesForSelected = [];
      appState.lastMove = null;
      appState.activeHintMove = null;
      appState.viewingHistoryIndex = -1;

      if (pawPrintsGroup3d) {
        while (pawPrintsGroup3d.children.length > 0) pawPrintsGroup3d.remove(pawPrintsGroup3d.children[0]);
      }

      document.getElementById('puzzle-control-strip')?.classList.add('hidden');

      const preset = document.getElementById('select-clock-preset')?.value || '600+0';
      if (preset === 'untimed' || appState.gameMode === 'practice') {
        appState.clock.enabled = false;
      } else if (preset === 'custom') {
        const mins = parseInt(document.getElementById('input-custom-mins')?.value || '10', 10);
        const inc = parseInt(document.getElementById('input-custom-inc')?.value || '0', 10);
        appState.clock.enabled = true;
        appState.clock.initialSeconds = mins * 60;
        appState.clock.incrementSeconds = inc;
      } else {
        const [secStr, incStr] = preset.split('+');
        appState.clock.enabled = true;
        appState.clock.initialSeconds = parseInt(secStr, 10) || 600;
        appState.clock.incrementSeconds = parseInt(incStr, 10) || 0;
      }
      appState.clock.wRemainingMs = appState.clock.initialSeconds * 1000;
      appState.clock.bRemainingMs = appState.clock.initialSeconds * 1000;
      appState.clock.paused = false;
      appState.clock.gameOverByTimeout = false;
      appState.clock.lastTickPerf = performance.now();

      const badge = document.getElementById('badge-active-mode');
      const eloMap = { beginner: '800', easy: '1100', medium: '1400', hard: '1800', expert: '2200' };
      const botNameMap = {
        beginner: 'Whiskers_Jr',
        easy: 'Luna_Paws',
        medium: 'Master_Felix',
        hard: 'Grand_Duchess_Siam',
        expert: 'Emperor_Maine'
      };
      const topElo = eloMap[appState.aiDifficulty] || '1400';
      const ratingTopEl = document.getElementById('rating-badge-top');
      const ratingBotEl = document.getElementById('rating-badge-bottom');

      const myElo = appState.stats.onlineElo || 200;

      if (appState.gameMode === 'ai') {
        const isBlack = appState.playerSide === 'b';
        if (badge) badge.textContent = `10+0`;
        const botName = botNameMap[appState.aiDifficulty] || 'Master_Felix';
        if (isBlack) {
          document.getElementById('name-player-top').textContent = `${botName} (White ⚪)`;
          document.getElementById('tag-player-top').textContent = `(${topElo})`;
          if (ratingTopEl) ratingTopEl.textContent = topElo;
          document.getElementById('name-player-bottom').textContent = 'checknimga (Black ⚫)';
          document.getElementById('tag-player-bottom').textContent = `(${myElo})`;
          if (ratingBotEl) ratingBotEl.textContent = String(myElo);
        } else {
          document.getElementById('name-player-top').textContent = `${botName} (Black ⚫)`;
          document.getElementById('tag-player-top').textContent = `(${topElo})`;
          if (ratingTopEl) ratingTopEl.textContent = topElo;
          document.getElementById('name-player-bottom').textContent = 'checknimga (White ⚪)';
          document.getElementById('tag-player-bottom').textContent = `(${myElo})`;
          if (ratingBotEl) ratingBotEl.textContent = String(myElo);
        }
        appState.boardFlipped = isBlack;
      } else if (appState.gameMode === 'local') {
        if (badge) badge.textContent = 'Local 2-Player';
        document.getElementById('name-player-top').textContent = 'Master_Felix';
        document.getElementById('tag-player-top').textContent = '(1500)';
        if (ratingTopEl) ratingTopEl.textContent = '1500';
        document.getElementById('name-player-bottom').textContent = 'checknimga';
        document.getElementById('tag-player-bottom').textContent = `(${myElo})`;
        if (ratingBotEl) ratingBotEl.textContent = String(myElo);
        appState.boardFlipped = false;
      } else if (appState.gameMode === 'aivsai') {
        if (badge) badge.textContent = 'Spectator Match';
        document.getElementById('name-player-top').textContent = 'Master_Felix';
        document.getElementById('name-player-bottom').textContent = 'Emperor_Maine';
      } else if (appState.gameMode === 'online') {
        const isWhite = appState.online.myColor === 'w';
        const myTag = appState.online.isHost ? 'Host' : 'Guest';
        const oppTag = appState.online.isHost ? 'Guest' : 'Host';
        const oppElo = appState.online.opponentElo || 200;
        if (badge) badge.textContent = `Online • ${appState.online.roomCode || 'Match'}`;
        document.getElementById('name-player-top').textContent = `Opponent (${isWhite ? 'Black ⚫' : 'White ⚪'})`;
        document.getElementById('tag-player-top').textContent = `(${oppTag} • ${oppElo})`;
        if (ratingTopEl) ratingTopEl.textContent = String(oppElo);
        document.getElementById('name-player-bottom').textContent = `You (${isWhite ? 'White ⚪' : 'Black ⚫'})`;
        document.getElementById('tag-player-bottom').textContent = `(${myTag} • ${myElo})`;
        if (ratingBotEl) ratingBotEl.textContent = String(myElo);
        appState.boardFlipped = !isWhite;
      } else {
        if (badge) badge.textContent = 'Pawns & Paws';
      }

      setCameraPlayMode(camState.playMode, true);
      sync3DPiecesWithChessState(true);
      renderMoveHistoryTable();
      updateCapturedPiecesAndMaterialUI();
      updateGameStatusBanner();
      closeModal('modal-main-menu');
      switchScreenView('match');
      playSoundEffect('gameStart');
      if (!appState.audio.muted && typeof startSoothingBackgroundMusic === 'function') {
        autoStartedMusicOnce = true;
        startSoothingBackgroundMusic(true);
      }

      if (appState.gameMode === 'ai' && appState.playerSide === 'b') {
        requestAIMoveOrHint('move');
      } else if (appState.gameMode === 'aivsai') {
        requestAIMoveOrHint('move');
      }
    }

    function toggleAudioMute() {
      appState.audio.muted = !appState.audio.muted;
      const btn = document.getElementById('btn-audio-mute-toggle');
      const navIcon = document.getElementById('icon-audio-state');
      if (btn) btn.textContent = appState.audio.muted ? '🔇 Audio Muted' : '🔊 Audio Active';
      if (navIcon) navIcon.textContent = appState.audio.muted ? '🔇' : '🔊';
      savePersistedState();
    }

    function updateAudioVolume(channel, val) {
      appState.audio[channel] = parseInt(val, 10) || 0;
      const lbl = document.getElementById(`lbl-vol-${channel}`);
      if (lbl) lbl.textContent = `${appState.audio[channel]}%`;
      if (ambientNodes && channel === 'ambient') {
        ambientNodes.gain.gain.value = 0.025 * getEffectiveGain('ambient');
      }
      savePersistedState();
    }

    function openModal(id) {
      playSoundEffect('click');
      if (id === 'modal-pgn-fen') syncIOModalFields();
      if (id === 'modal-stats') updateStatsModalUI();
      if (id === 'modal-online') updateOnlineEloUI();
      const el = document.getElementById(id);
      if (el) el.classList.remove('hidden');
    }

    function closeModal(id) {
      playSoundEffect('click');
      const el = document.getElementById(id);
      if (el) el.classList.add('hidden');
    }

    function showToast(message) {
      const container = document.getElementById('toast-container');
      if (!container) return;
      const toast = document.createElement('div');
      toast.className = 'li-panel px-3.5 py-2 text-xs font-semibold text-white border-l-4 border-l-[#629924] shadow-xl transition-opacity duration-300';
      toast.textContent = message;
      container.appendChild(toast);
      setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
      }, 2600);
    }

    function copyTextField(inputId, toastMsg) {
      const el = document.getElementById(inputId);
      if (!el) return;
      const text = el.value || '';
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(() => showToast(toastMsg)).catch(() => fallbackCopy(el, toastMsg));
        } else {
          fallbackCopy(el, toastMsg);
        }
      } catch (e) {
        fallbackCopy(el, toastMsg);
      }
    }

    function fallbackCopy(el, toastMsg) {
      try {
        el.select();
        document.execCommand('copy');
        showToast(toastMsg);
      } catch (e) {
        showToast('Copied!');
      }
    }

    function updateStatsModalUI() {
      const elo = appState.stats.onlineElo || 200;
      const eloEl = document.getElementById('stat-online-elo');
      if (eloEl) eloEl.textContent = String(elo);
      const lobbyEloEl = document.getElementById('online-lobby-elo');
      if (lobbyEloEl) lobbyEloEl.textContent = `${elo} ELO`;
      document.getElementById('stat-games-played').textContent = String(appState.stats.gamesPlayed);
      document.getElementById('stat-wins').textContent = String(appState.stats.wins);
      document.getElementById('stat-captures').textContent = String(appState.stats.captures);
      document.getElementById('stat-puzzles').textContent = String(appState.stats.puzzlesSolved);
    }

    function resetPlayerStats() {
      appState.stats = { gamesPlayed: 0, wins: 0, captures: 0, puzzlesSolved: 0, onlineElo: 200, onlineGames: 0, onlineWins: 0 };
      savePersistedState();
      updateStatsModalUI();
      updateOnlineEloUI();
      showToast('🏆 Statistics reset (Online ELO reset to 200).');
    }

    function initKeyboardControls() {
      window.addEventListener('keydown', (e) => {
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
        const key = e.key.toLowerCase();
        if (key === 'v') {
          setCameraPlayMode(camState.playMode === 'overheadAuto' ? 'diorama3d' : 'overheadAuto');
        } else if (key === 'f') {
          flipBoardOrientation();
        } else if (key === 'h') {
          requestEngineHint();
        } else if (key === 'z') {
          undoLastMove();
        } else if (key === 'y') {
          redoMove();
        } else if (key === 'c') {
          resetCameraView();
        } else if (key === 'm') {
          toggleAudioMute();
        }
      });
    }

    let lastGamepadPoll = 0;
    function updateGamepadPolling(nowMs) {
      if (nowMs - lastGamepadPoll < 160 || !navigator.getGamepads) return;
      const pads = navigator.getGamepads();
      const gp = pads && pads[0];
      if (!gp) return;
      lastGamepadPoll = nowMs;
      if (gp.buttons[0]?.pressed) onBoardSquareInteract(appState.cursorSquare);
      if (gp.buttons[2]?.pressed) setCameraPlayMode(camState.playMode === 'overheadAuto' ? 'diorama3d' : 'overheadAuto');
      if (gp.buttons[3]?.pressed) requestEngineHint();
    }

    function savePersistedState() {
      try {
        localStorage.setItem('pawns_and_paws_state_v2', JSON.stringify({
          themeId: appState.themeId,
          captureStyle: appState.captureStyle,
          custom: appState.custom,
          audio: appState.audio,
          stats: appState.stats,
          cameraLocked: (typeof appState.cameraLocked === 'boolean') ? appState.cameraLocked : true
        }));
      } catch (e) {}
    }

    function loadPersistedState() {
      try {
        const raw = localStorage.getItem('pawns_and_paws_state_v2');
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (parsed.themeId && BOARD_THEMES[parsed.themeId]) appState.themeId = parsed.themeId;
        if (parsed.captureStyle) appState.captureStyle = parsed.captureStyle;
        if (parsed.custom) Object.assign(appState.custom, parsed.custom);
        if (parsed.audio) Object.assign(appState.audio, parsed.audio);
        if (typeof parsed.cameraLocked === 'boolean') {
          appState.cameraLocked = parsed.cameraLocked;
        }
        if (parsed.stats) {
          Object.assign(appState.stats, parsed.stats);
          if (typeof appState.stats.onlineElo !== 'number' || isNaN(appState.stats.onlineElo) || appState.stats.onlineElo <= 0) {
            appState.stats.onlineElo = 200;
          }
        }
      } catch (e) {}
    }

    window.addEventListener('load', () => {
      loadPersistedState();
      chessEngine = new Chess();
      aiWorker = createChessAIWebWorker();

      renderThemeCardsGrid();
      renderMultiplayerVotingGrid();
      renderPuzzlesListModal();
      populateEditorSquaresDropdown();
      initKeyboardControls();
      initThreeScene();
      applyThemeById(appState.themeId);
      renderMoveHistoryTable();
      updateCapturedPiecesAndMaterialUI();
      updateGameStatusBanner();
      updateOnlineEloUI();
      switchScreenView('home');

      appState.clock.lastTickPerf = performance.now();
      setInterval(updateChessClocksTick, 200);
      requestAnimationFrame(animateThreeLoop);
      checkUrlForRoomInvite();
    });
