// ===============================================================
// ZERO CONTACT CRICKET - GAME ENGINE & TROLL PHYSICS SIMULATOR
// Guaranteed 0% Bat-to-Ball Contact™
// ===============================================================

const MALAYALAM_ROASTS = [
  "ബാറ്റ് വീശിയത് വേറെ, ബോൾ പോയത് വേറെ 😂",
  "ബോൾ കണ്ടു… പക്ഷേ ബാറ്റ് കണ്ടില്ല 😭",
  "കാറ്റിനെ അടിക്കാൻ നോക്കിയതാണോ? 💀",
  "ബാറ്റിംഗല്ല, കാറ്റ് വെട്ടലാണ് 😂",
  "ബോൾ: എന്നെ പിടിക്കാമെന്ന് വിചാരിച്ചോ? 😭",
  "ഷോട്ട് അടിക്കാൻ പോയി, വായുവിനെ അടിച്ചു 😂",
  "ബാറ്റും ബോളും തമ്മിൽ long distance relationship 💀",
  "ബോൾ പോയ വഴി ബാറ്റ്സ്മാന് അറിയില്ല 😂",
  "അടിച്ചത് ബോളിനെയല്ല, ആത്മവിശ്വാസത്തെയാണ് 😭",
  "ബോൾ പോലും തിരിഞ്ഞുനോക്കി: ‘എന്താ ഇത്?’ 😂",
  "ഇത്രയും confidence-ോടെ miss ചെയ്യുന്നത് ഒരു കഴിവാണ് 💀",
  "ബാറ്റ് full speed… result zero 😂",
  "ബോൾ അടിക്കാൻ വന്നതാണ്, പക്ഷേ ബോൾ സമ്മതിച്ചില്ല 😭",
  "ഇത് cricket ആണോ കാറ്റാടിയന്ത്രമോ? 😂",
  "ബോൾ രക്ഷപ്പെട്ടത് ഭാഗ്യം കൊണ്ട് 😭💀"
];

const EVASION_STUNTS = [
  'matrix_duck',
  'teleport_side',
  'loop_de_loop',
  'balloon_float',
  'banana_curve',
  'quantum_ghost',
  'speed_turbo'
];

class CricketGame {
  constructor() {
    this.canvas = document.getElementById('cricketCanvas');
    this.stadium = new CricketStadium(this.canvas);

    this.W = 440;
    this.H = 720;
    this.stumpX = this.W / 2;
    this.stumpY = this.H - 60;
    this.batPivotY = this.H - 110;
    this.batLength = 70;
    this.batWidth = 16;

    this.BAT_SPEED = 5.2;
    this.BAT_RANGE = 75;
    this.SWING_DURATION = 260; // ms

    this.heldKeys = { left: false, right: false, up: false, down: false };
    this.batOffsetX = 0;
    this.batOffsetZ = 0;
    this.swingStart = null;
    this.hasSwungThisBall = false;

    // Player & Match State
    this.playerName = 'Sanju';
    this.playerCountry = 'india';
    this.runs = 0;
    this.target = 1; // Target runs chosen by player
    this.ballsBowled = 0;
    this.maxBalls = 6;
    this.wickets = 0;
    this.rageMeter = 0;
    this.airMolecules = 0;
    this.matchOver = false;
    this.ball = null;
    this.ballInPlay = false;

    this.usedRoastIndices = [];
    this.currentStunt = null;

    this.initUI();
    this.bindEvents();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  getCountryCode(country) {
    const codes = {
      india: 'IND',
      australia: 'AUS',
      england: 'ENG',
      pakistan: 'PAK',
      south_africa: 'SA',
      west_indies: 'WI',
      new_zealand: 'NZ',
      sri_lanka: 'SL',
      bangladesh: 'BAN',
      afghanistan: 'AFG',
      usa: 'USA'
    };
    return codes[country] || country.toUpperCase().slice(0, 3);
  }

  getCountryName(country) {
    const names = {
      india: 'India',
      australia: 'Australia',
      england: 'England',
      pakistan: 'Pakistan',
      south_africa: 'South Africa',
      west_indies: 'West Indies',
      new_zealand: 'New Zealand',
      sri_lanka: 'Sri Lanka',
      bangladesh: 'Bangladesh',
      afghanistan: 'Afghanistan',
      usa: 'United States'
    };
    return names[country] || country;
  }

  getJerseyColor(country) {
    const colorMap = {
      india: 0x1d4ed8,
      australia: 0xfacc15,
      england: 0x38bdf8,
      pakistan: 0x16a34a,
      south_africa: 0x15803d,
      west_indies: 0x991b1b,
      new_zealand: 0x0f172a,
      sri_lanka: 0x1e3a8a,
      bangladesh: 0x065f46,
      afghanistan: 0x2563eb,
      usa: 0xdc2626
    };
    return colorMap[country] || 0x1d4ed8;
  }

  initUI() {
    this.setupModal = document.getElementById('setupModal');
    this.setupForm = document.getElementById('setupForm');
    this.inputPlayerName = document.getElementById('inputPlayerName');
    this.inputCountry = document.getElementById('inputCountry');
    this.inputTargetRuns = document.getElementById('inputTargetRuns');
    this.playerBadgeTitle = document.getElementById('playerBadgeTitle');

    this.roastBanner = document.getElementById('roastBanner');
    this.roastText = document.getElementById('roastText');
    this.rageFill = document.getElementById('rageFill');
    this.ragePercent = document.getElementById('ragePercent');
    this.moleculesVal = document.getElementById('moleculesVal');
    this.ballsTracker = document.getElementById('ballsTracker');
    this.drsModal = document.getElementById('drsModal');
    this.drsStatus = document.getElementById('drsStatus');
    this.drsReviewText = document.getElementById('drsReviewText');
    this.drsCanvas = document.getElementById('drsWaveCanvas');
    this.drsCtx = this.drsCanvas ? this.drsCanvas.getContext('2d') : null;

    this.updateScoreboard();
  }

  bindEvents() {
    // Unlock AudioContext on first touch / click
    const unlockAudio = () => {
      if (window.soundMgr) window.soundMgr.init();
      window.removeEventListener('touchstart', unlockAudio);
      window.removeEventListener('click', unlockAudio);
    };
    window.addEventListener('touchstart', unlockAudio, { passive: true });
    window.addEventListener('click', unlockAudio, { passive: true });

    // Keyboard Controls
    window.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      if (k === 'enter') {
        if (!this.ballInPlay && !this.matchOver) {
          this.bowlNewBall();
        }
        return;
      }
      if (k === ' ') {
        e.preventDefault();
        this.triggerSwing();
        return;
      }
      if (k === 'arrowleft' || k === 'a') this.heldKeys.left = true;
      if (k === 'arrowright' || k === 'd') this.heldKeys.right = true;
      if (k === 'arrowup' || k === 'w') this.heldKeys.up = true;
      if (k === 'arrowdown' || k === 's') this.heldKeys.down = true;
    });

    window.addEventListener('keyup', (e) => {
      const k = e.key.toLowerCase();
      if (k === 'arrowleft' || k === 'a') this.heldKeys.left = false;
      if (k === 'arrowright' || k === 'd') this.heldKeys.right = false;
      if (k === 'arrowup' || k === 'w') this.heldKeys.up = false;
      if (k === 'arrowdown' || k === 's') this.heldKeys.down = false;
    });

    // Touch / Mouse Dragging on 3D Canvas
    let touchStartX = 0;
    let initialBatX = 0;
    let isDragging = false;

    this.canvas.addEventListener('pointerdown', (e) => {
      touchStartX = e.clientX;
      initialBatX = this.batOffsetX;
      isDragging = true;
      this.canvas.setPointerCapture(e.pointerId);
    });

    this.canvas.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - touchStartX;
      this.batOffsetX = Math.max(-this.BAT_RANGE, Math.min(this.BAT_RANGE, initialBatX + dx * 0.7));
    });

    const endDrag = (e) => {
      if (isDragging) {
        // If it was just a quick tap without much movement, trigger swing!
        if (Math.abs(e.clientX - touchStartX) < 8) {
          if (!this.ballInPlay && !this.matchOver) {
            this.bowlNewBall();
          } else {
            this.triggerSwing();
          }
        }
        isDragging = false;
      }
    };
    this.canvas.addEventListener('pointerup', endDrag);
    this.canvas.addEventListener('pointercancel', endDrag);

    // On-screen D-Pad / Move Buttons (Hold to move)
    const btnLeft = document.getElementById('btnMoveLeft');
    const btnRight = document.getElementById('btnMoveRight');

    const bindHold = (el, key) => {
      if (!el) return;
      const start = (e) => { e.preventDefault(); this.heldKeys[key] = true; };
      const stop = (e) => { e.preventDefault(); this.heldKeys[key] = false; };
      el.addEventListener('pointerdown', start);
      el.addEventListener('pointerup', stop);
      el.addEventListener('pointercancel', stop);
      el.addEventListener('pointerleave', stop);
    };
    bindHold(btnLeft, 'left');
    bindHold(btnRight, 'right');

    // Setup Modal & Target Presets
    if (this.setupForm) {
      this.setupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = this.inputPlayerName ? this.inputPlayerName.value : 'Sanju';
        const country = this.inputCountry ? this.inputCountry.value : 'india';
        const target = this.inputTargetRuns ? parseInt(this.inputTargetRuns.value) : 1;
        this.applyMatchSetup(name, country, target);
        if (this.setupModal) this.setupModal.classList.remove('active');
        window.soundMgr.playWhoosh(400);
      });
    }

    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const val = btn.getAttribute('data-val');
        if (this.inputTargetRuns) this.inputTargetRuns.value = val;
      });
    });

    const btnOpenSetup = document.getElementById('btnOpenSetup');
    if (btnOpenSetup) {
      btnOpenSetup.addEventListener('click', () => {
        if (this.setupModal) this.setupModal.classList.add('active');
      });
    }

    // Bat skin selectors
    document.querySelectorAll('.bat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.bat-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const skin = btn.getAttribute('data-skin');
        this.stadium.rebuildBatSkin(skin);
        window.soundMgr.playSqueak();
      });
    });

    // Team jersey color selector
    const teamSelect = document.getElementById('teamSelect');
    if (teamSelect) {
      teamSelect.addEventListener('change', () => {
        const val = teamSelect.value;
        this.playerCountry = val;
        this.stadium.setTeamColor(this.getJerseyColor(val));
        if (this.playerBadgeTitle) {
          this.playerBadgeTitle.textContent = `${this.playerName.toUpperCase()} (${this.getCountryCode(this.playerCountry)})`;
        }
      });
    }

    // Play again button
    const retryBtn = document.getElementById('retryBtn');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        this.resetMatch();
      });
    }

    // Next delivery button (touch / click support)
    const bowlBtn = document.getElementById('bowlBtn');
    if (bowlBtn) {
      bowlBtn.addEventListener('click', () => {
        if (!this.ballInPlay && !this.matchOver) {
          this.bowlNewBall();
        }
      });
    }

    // Swing button (touch / click support)
    const swingBtn = document.getElementById('swingBtn');
    if (swingBtn) {
      swingBtn.addEventListener('click', () => {
        this.triggerSwing();
      });
    }
  }

  applyMatchSetup(name, country, target) {
    this.playerName = name.trim() || 'Sanju';
    this.playerCountry = country || 'india';
    this.target = Math.max(1, parseInt(target) || 1);

    if (this.playerBadgeTitle) {
      this.playerBadgeTitle.textContent = `${this.playerName.toUpperCase()} (${this.getCountryCode(this.playerCountry)})`;
    }

    const teamSelect = document.getElementById('teamSelect');
    if (teamSelect) teamSelect.value = this.playerCountry;
    this.stadium.setTeamColor(this.getJerseyColor(this.playerCountry));

    const certPlayerName = document.getElementById('certPlayerName');
    if (certPlayerName) {
      certPlayerName.textContent = `${this.playerName} (${this.getCountryName(this.playerCountry)})`;
    }
    const certTarget = document.getElementById('certTarget');
    if (certTarget) certTarget.textContent = this.target;

    this.resetMatch();
  }

  triggerSwing() {
    if (!this.ballInPlay || this.hasSwungThisBall) return;
    this.swingStart = performance.now();
    this.hasSwungThisBall = true;

    // Displace air molecules with comic math
    const addedMolecules = 1420000000 + Math.floor(Math.random() * 850000000);
    this.airMolecules += addedMolecules;
    if (this.moleculesVal) {
      this.moleculesVal.textContent = (this.airMolecules / 1e9).toFixed(2) + ' B';
    }

    if (this.stadium.batSkin === 'chicken') {
      window.soundMgr.playSqueak();
    } else {
      window.soundMgr.playWhoosh(360 + Math.random() * 100);
    }

    // If ball is within approach range, trigger immediate evasion stunt!
    if (this.ball && this.ball.y > 320 && !this.ball.hasEvaded) {
      this.executeEvasionStunt();
    }
  }

  bowlNewBall() {
    if (this.ballsBowled >= this.maxBalls) {
      this.endMatch();
      return;
    }

    this.ballInPlay = true;
    this.hasSwungThisBall = false;
    this.swingStart = null;
    this.currentStunt = EVASION_STUNTS[Math.floor(Math.random() * EVASION_STUNTS.length)];

    this.stadium.resetStumps();

    const startX = this.stumpX + (Math.random() * 30 - 15);
    const startY = 50;
    const vy = 4.2 + Math.random() * 0.8;
    const framesToStumps = (this.stumpY - startY) / vy;
    const aimX = this.stumpX + (Math.random() * 24 - 12);
    const vx = (aimX - startX) / framesToStumps;

    this.ball = {
      x: startX,
      y: startY,
      vx: vx,
      vy: vy,
      r: 8,
      hasEvaded: false,
      evadeTimer: 0,
      evadeType: this.currentStunt,
      ghostOpacity: 1.0,
      loopAngle: 0,
      baseArcOffset: 0
    };

    window.soundMgr.playWhoosh(180);
    this.hideRoast();
  }

  executeEvasionStunt() {
    if (!this.ball || this.ball.hasEvaded) return;
    this.ball.hasEvaded = true;

    const batWorldX = this.batOffsetX;
    const dodgeDirection = batWorldX >= 0 ? -1 : 1; // Dodge away from bat

    const worldX = this.stadium.toWorldX(this.ball.x);
    const worldY = this.stadium.getArcHeight(this.ball.y);
    const worldZ = this.stadium.toWorldZ(this.ball.y);
    this.stadium.spawnEvasionPuff(worldX, worldY, worldZ);

    switch (this.ball.evadeType) {
      case 'matrix_duck':
        window.soundMgr.playBoing();
        this.ball.baseArcOffset = -1.6; // Duck under bat
        this.ball.vy *= 1.3;
        break;

      case 'teleport_side':
        window.soundMgr.playPop();
        this.ball.x += dodgeDirection * 48; // Teleport sideways
        break;

      case 'loop_de_loop':
        window.soundMgr.playSlideWhistle();
        this.ball.loopAngle = Math.PI * 2;
        break;

      case 'balloon_float':
        window.soundMgr.playSlideWhistle();
        this.ball.baseArcOffset = 2.4; // Balloon floating over
        break;

      case 'banana_curve':
        window.soundMgr.playBoing();
        this.ball.vx += dodgeDirection * 6.5; // Sharp boomerang curve
        break;

      case 'quantum_ghost':
        window.soundMgr.playPop();
        this.ball.ghostOpacity = 0.25; // Phase right through
        break;

      case 'speed_turbo':
      default:
        window.soundMgr.playWhoosh(500);
        this.ball.vy *= 1.9; // Sonic burst
        break;
    }
  }

  showRoast() {
    let available = this.usedRoastIndices.length >= MALAYALAM_ROASTS.length ? [] : this.usedRoastIndices;
    if (available.length === 0) {
      this.usedRoastIndices = [];
    }
    let idx;
    do {
      idx = Math.floor(Math.random() * MALAYALAM_ROASTS.length);
    } while (this.usedRoastIndices.includes(idx));
    this.usedRoastIndices.push(idx);

    const roast = MALAYALAM_ROASTS[idx];
    if (this.roastText) {
      this.roastText.textContent = roast;
    }
    if (this.roastBanner) {
      this.roastBanner.classList.add('show');
      this.roastBanner.classList.remove('pulse');
      void this.roastBanner.offsetWidth; // trigger reflow
      this.roastBanner.classList.add('pulse');
    }

    // Play comedy roast audio reaction
    const comedySounds = [
      () => window.soundMgr.playSadTrombone(),
      () => window.soundMgr.playCrickets(),
      () => window.soundMgr.playLaughChuckle(),
      () => window.soundMgr.playGolfClap()
    ];
    const pick = comedySounds[Math.floor(Math.random() * comedySounds.length)];
    pick();

    // Increase Rage Meter
    this.rageMeter = Math.min(100, this.rageMeter + 17);
    if (this.rageFill) this.rageFill.style.width = this.rageMeter + '%';
    if (this.ragePercent) this.ragePercent.textContent = this.rageMeter + '%';

    // Show UltraEdge DRS parody briefly
    if (this.hasSwungThisBall && Math.random() > 0.4) {
      this.showUltraEdgeParody(roast);
    }
  }

  hideRoast() {
    if (this.roastBanner) {
      this.roastBanner.classList.remove('show');
    }
  }

  showUltraEdgeParody(roastText) {
    if (!this.drsModal) return;
    this.drsModal.classList.add('active');
    if (this.drsReviewText) {
      this.drsReviewText.textContent = `THIRD UMPIRE REVIEW: "UltraEdge confirms 0.000% bat contact. ${roastText}"`;
    }

    // Draw flatline oscillation on DRS canvas
    if (this.drsCtx) {
      const w = this.drsCanvas.width;
      const h = this.drsCanvas.height;
      this.drsCtx.fillStyle = '#060d17';
      this.drsCtx.fillRect(0, 0, w, h);

      this.drsCtx.strokeStyle = '#00ff88';
      this.drsCtx.lineWidth = 2;
      this.drsCtx.beginPath();
      for (let x = 0; x < w; x++) {
        const y = h / 2 + (Math.random() - 0.5) * 4; // Flatline with tiny micro-noise
        if (x === 0) this.drsCtx.moveTo(x, y);
        else this.drsCtx.lineTo(x, y);
      }
      this.drsCtx.stroke();

      // Red vertical marker where bat swung
      this.drsCtx.strokeStyle = '#ff3b30';
      this.drsCtx.lineWidth = 2;
      this.drsCtx.setLineDash([4, 4]);
      this.drsCtx.beginPath();
      this.drsCtx.moveTo(w * 0.52, 0);
      this.drsCtx.lineTo(w * 0.52, h);
      this.drsCtx.stroke();
      this.drsCtx.setLineDash([]);
    }

    setTimeout(() => {
      this.drsModal.classList.remove('active');
    }, 2400);
  }

  updateScoreboard() {
    const runsVal = document.getElementById('runsVal');
    const ballsVal = document.getElementById('ballsVal');
    const targetVal = document.getElementById('targetVal');
    if (runsVal) runsVal.textContent = this.runs;
    if (ballsVal) ballsVal.textContent = this.ballsBowled;
    if (targetVal) targetVal.textContent = this.target;

    // Update ball circle indicators [ 0 | 0 | 0 | W | 0 | 0 ]
    if (this.ballsTracker) {
      this.ballsTracker.innerHTML = '';
      for (let i = 0; i < this.maxBalls; i++) {
        const dot = document.createElement('div');
        dot.className = 'ball-dot';
        if (i < this.ballsBowled) {
          dot.classList.add('done');
          dot.textContent = '0';
        } else {
          dot.textContent = '•';
        }
        this.ballsTracker.appendChild(dot);
      }
    }
  }

  handleBallMiss() {
    this.ballInPlay = false;
    this.ballsBowled += 1;
    this.updateScoreboard();

    // Check if bowled out (ball went straight into stumps)
    const isBowled = Math.abs(this.ball.x - this.stumpX) < 22;
    if (isBowled) {
      this.wickets += 1;
      this.stadium.triggerBowledOut();
      window.soundMgr.playStumpCrash();
    }

    this.showRoast();

    if (this.ballsBowled >= this.maxBalls) {
      setTimeout(() => this.endMatch(), 1600);
    }
  }

  endMatch() {
    this.matchOver = true;
    this.ballInPlay = false;

    const certModal = document.getElementById('certificateModal');
    const certRuns = document.getElementById('certRuns');
    const certBalls = document.getElementById('certBalls');
    const certMolecules = document.getElementById('certMolecules');
    const certRage = document.getElementById('certRage');
    const certPlayerName = document.getElementById('certPlayerName');
    const certTarget = document.getElementById('certTarget');

    if (certPlayerName) certPlayerName.textContent = `${this.playerName} (${this.getCountryName(this.playerCountry)})`;
    if (certTarget) certTarget.textContent = this.target;
    if (certRuns) certRuns.textContent = `${this.runs} (Target: ${this.target})`;
    if (certBalls) certBalls.textContent = `${this.ballsBowled}/${this.maxBalls}`;
    if (certMolecules) certMolecules.textContent = (this.airMolecules / 1e9).toFixed(2) + ' Billion';
    if (certRage) certRage.textContent = this.rageMeter + '%';

    if (certModal) {
      certModal.classList.add('active');
    }
    window.soundMgr.playSadTrombone();
  }

  resetMatch() {
    this.runs = 0;
    this.ballsBowled = 0;
    this.wickets = 0;
    this.rageMeter = 0;
    this.airMolecules = 0;
    this.matchOver = false;
    this.ballInPlay = false;
    this.ball = null;

    if (this.rageFill) this.rageFill.style.width = '0%';
    if (this.ragePercent) this.ragePercent.textContent = '0%';
    if (this.moleculesVal) this.moleculesVal.textContent = '0 B';

    const certModal = document.getElementById('certificateModal');
    if (certModal) certModal.classList.remove('active');

    this.updateScoreboard();
    this.stadium.resetStumps();
    this.hideRoast();
  }

  updateBat(now) {
    if (this.heldKeys.left) this.batOffsetX -= this.BAT_SPEED;
    if (this.heldKeys.right) this.batOffsetX += this.BAT_SPEED;
    this.batOffsetX = Math.max(-this.BAT_RANGE, Math.min(this.BAT_RANGE, this.batOffsetX));

    // Batsman positioning
    this.stadium.batsman.position.x = this.stadium.toWorldX(this.stumpX + this.batOffsetX);

    // Bat swing rotation
    let angle = 0.55; // Resting guard angle
    if (this.swingStart !== null) {
      const t = (now - this.swingStart) / this.SWING_DURATION;
      if (t >= 0 && t <= 1) {
        // Swing from 0.55 down to -0.65
        angle = 0.55 - 1.2 * Math.sin(t * Math.PI);
      }
    }
    this.stadium.swingPivot.rotation.y = angle;
  }

  animate() {
    const now = performance.now();
    this.updateBat(now);

    if (this.ballInPlay && this.ball) {
      // Step ball physics
      this.ball.vy += 0.018;
      this.ball.x += this.ball.vx;
      this.ball.y += this.ball.vy;

      // Active Evasion Proximity Check
      // If the ball comes anywhere near the bat pivot zone, TRIGGER EVASION!
      const batCenterY = this.batPivotY;
      const batCenterX = this.stumpX + this.batOffsetX;
      const distToBat = Math.hypot(this.ball.x - batCenterX, this.ball.y - batCenterY);

      if (distToBat < 90 && !this.ball.hasEvaded) {
        this.executeEvasionStunt();
      }

      // 3D positioning
      let worldX = this.stadium.toWorldX(this.ball.x);
      let worldY = this.stadium.getArcHeight(this.ball.y) + (this.ball.baseArcOffset || 0);
      let worldZ = this.stadium.toWorldZ(this.ball.y);

      // Loop-de-loop effect
      if (this.ball.loopAngle > 0) {
        this.ball.loopAngle -= 0.22;
        worldY += Math.sin(this.ball.loopAngle) * 0.9;
        worldZ += Math.cos(this.ball.loopAngle) * 0.9;
      }

      this.stadium.ballGroup.position.set(worldX, Math.max(0.12, worldY), worldZ);

      // Check if ball passed batsman
      if (this.ball.y >= this.stumpY) {
        this.handleBallMiss();
      }
    }

    this.stadium.updatePuffs(0.016);
    this.stadium.render();

    requestAnimationFrame(this.animate);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.game = new CricketGame();
});
