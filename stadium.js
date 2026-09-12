// ===============================================================
// ZERO CONTACT CRICKET - 3D COMEDY STADIUM & CHARACTER SCENE
// Built with Three.js (r128)
// ===============================================================

class CricketStadium {
  constructor(canvas) {
    this.canvas = canvas;
    this.updateDimensions();

    this.BOWLER_Z = -44;
    this.CREASE_Z = 0.0;  // Batsman stands at popping crease
    this.STUMP_Z = 1.4;   // Wickets are planted BEHIND the batsman
    this.SCALE_X = 4.2 / (220); // maps 2D game coords to 3D

    this.batSkin = 'willow';
    this.initScene();
    this.buildStadium();
    this.buildCharacters();
    this.buildBall();

    window.addEventListener('resize', () => this.onWindowResize());
  }

  updateDimensions() {
    const rect = this.canvas.parentElement ? this.canvas.parentElement.getBoundingClientRect() : { width: 440, height: 600 };
    this.W = rect.width || 440;
    this.H = rect.height || 600;
  }

  onWindowResize() {
    this.updateDimensions();
    if (this.camera && this.renderer) {
      this.camera.aspect = this.W / this.H;
      this.camera.fov = this.W < 500 ? 64 : 54;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(this.W, this.H, false);
    }
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0c1220);
    this.scene.fog = new THREE.FogExp2(0x0c1220, 0.012);

    this.camera = new THREE.PerspectiveCamera(54, this.W / this.H, 0.1, 300);
    this.camera.position.set(0, 3.2, this.STUMP_Z + 5.8);
    this.camera.lookAt(0, 1.4, this.BOWLER_Z * 0.45);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(this.W, this.H, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Lighting
    const ambient = new THREE.AmbientLight(0xdde8ff, 0.6);
    this.scene.add(ambient);

    // Floodlights
    this.mainLight = new THREE.DirectionalLight(0xfff7e6, 1.1);
    this.mainLight.position.set(-15, 25, 12);
    this.mainLight.castShadow = true;
    this.mainLight.shadow.mapSize.width = 1024;
    this.mainLight.shadow.mapSize.height = 1024;
    this.mainLight.shadow.camera.near = 5;
    this.mainLight.shadow.camera.far = 80;
    this.mainLight.shadow.camera.left = -25;
    this.mainLight.shadow.camera.right = 25;
    this.mainLight.shadow.camera.top = 25;
    this.mainLight.shadow.camera.bottom = -25;
    this.scene.add(this.mainLight);

    const fillLight = new THREE.DirectionalLight(0x70a5ff, 0.7);
    fillLight.position.set(15, 18, -25);
    this.scene.add(fillLight);
  }

  buildStadium() {
    // Outfield Turf
    const turfGeo = new THREE.PlaneGeometry(90, 110, 16, 16);
    const turfMat = new THREE.MeshStandardMaterial({
      color: 0x1a6b2c,
      roughness: 0.85,
      metalness: 0.1
    });
    const turf = new THREE.Mesh(turfGeo, turfMat);
    turf.rotation.x = -Math.PI / 2;
    turf.position.set(0, 0, this.BOWLER_Z * 0.4);
    turf.receiveShadow = true;
    this.scene.add(turf);

    // Mower Stripe Pattern on Grass
    for (let i = -7; i <= 7; i++) {
      if (i % 2 === 0) {
        const stripe = new THREE.Mesh(
          new THREE.PlaneGeometry(90, 5),
          new THREE.MeshStandardMaterial({ color: 0x165b25, roughness: 0.85 })
        );
        stripe.rotation.x = -Math.PI / 2;
        stripe.position.set(0, 0.005, this.BOWLER_Z * 0.4 + i * 5);
        stripe.receiveShadow = true;
        this.scene.add(stripe);
      }
    }

    // Pitch Strip
    const pitchGeo = new THREE.PlaneGeometry(3.6, Math.abs(this.BOWLER_Z) + 12);
    const pitchMat = new THREE.MeshStandardMaterial({
      color: 0xc4a36f,
      roughness: 0.9,
      metalness: 0.05
    });
    const pitch = new THREE.Mesh(pitchGeo, pitchMat);
    pitch.rotation.x = -Math.PI / 2;
    pitch.position.set(0, 0.015, this.BOWLER_Z / 2);
    pitch.receiveShadow = true;
    this.scene.add(pitch);

    // Crease Lines
    this.createCreaseLine(this.STUMP_Z + 0.18);
    this.createCreaseLine(this.BOWLER_Z - 0.18);

    // Return Creases (side lines)
    const returnCreaseMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    [-1.3, 1.3].forEach(x => {
      const line = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.02, 1.8), returnCreaseMat);
      line.position.set(x, 0.02, this.STUMP_Z + 0.5);
      this.scene.add(line);
    });

    // Grandstands (Multi-tiered Stadium Ring)
    this.buildGrandstands();

    // Floodlight Towers
    this.buildFloodlights();

    // LED Advertising Banners (Meme Edition)
    this.buildMemeBoards();

    // Stumps & Bails
    this.batsmanStumps = this.buildWickets(this.STUMP_Z);
    this.bowlerStumps = this.buildWickets(this.BOWLER_Z);
  }

  createCreaseLine(z) {
    const crease = new THREE.Mesh(
      new THREE.BoxGeometry(2.8, 0.02, 0.07),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    crease.position.set(0, 0.02, z);
    this.scene.add(crease);
  }

  buildGrandstands() {
    const standMat1 = new THREE.MeshLambertMaterial({ color: 0x1f293d });
    const standMat2 = new THREE.MeshLambertMaterial({ color: 0x141c2c });
    const crowdColors = [0xff4444, 0x3388ff, 0xffcc00, 0x22cc66, 0xffffff, 0xaa44ff];

    // Background curved stands
    for (let tier = 1; tier <= 3; tier++) {
      const stand = new THREE.Mesh(
        new THREE.BoxGeometry(70 + tier * 8, 4 + tier * 3, 12),
        tier % 2 === 0 ? standMat1 : standMat2
      );
      stand.position.set(0, (tier * 3.5) - 2, this.BOWLER_Z - 18 - tier * 5);
      this.scene.add(stand);

      // Cheering crowd dots on stands
      const crowdGroup = new THREE.Group();
      for (let c = 0; c < 120; c++) {
        const dotMat = new THREE.MeshBasicMaterial({
          color: crowdColors[Math.floor(Math.random() * crowdColors.length)]
        });
        const person = new THREE.Mesh(new THREE.SphereGeometry(0.25, 4, 4), dotMat);
        person.position.set(
          (Math.random() - 0.5) * (64 + tier * 6),
          stand.position.y + 1.8 + Math.random() * 2,
          stand.position.z + (Math.random() - 0.5) * 6
        );
        crowdGroup.add(person);
      }
      this.scene.add(crowdGroup);
    }
  }

  buildFloodlights() {
    const towerMat = new THREE.MeshStandardMaterial({ color: 0x4a5568, metalness: 0.8, roughness: 0.3 });
    const lightGlowMat = new THREE.MeshBasicMaterial({ color: 0xfffff0 });

    const positions = [
      [-28, this.BOWLER_Z - 8],
      [28, this.BOWLER_Z - 8],
      [-26, this.STUMP_Z + 14],
      [26, this.STUMP_Z + 14]
    ];

    positions.forEach(([x, z]) => {
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.8, 26, 8), towerMat);
      tower.position.set(x, 13, z);
      this.scene.add(tower);

      const lampBank = new THREE.Mesh(new THREE.BoxGeometry(4.5, 2.2, 0.8), towerMat);
      lampBank.position.set(x, 25.5, z);
      lampBank.lookAt(0, 0, this.BOWLER_Z * 0.4);
      this.scene.add(lampBank);

      const glow = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.9, 0.2), lightGlowMat);
      glow.position.set(0, 0, 0.4);
      lampBank.add(glow);
    });
  }

  buildMemeBoards() {
    const memeTexts = [
      "⚠️ 404: BAT NOT FOUND",
      "🌬️ കാറ്റാടിയന്ത്രം PREMIER LEAGUE",
      "🏃 DISTANCE: 3 BUSINESS DAYS",
      "😭 BALL: എന്നെ തൊടാൻ പറ്റില്ല",
      "💀 0 RUNS IN 999 MATCHES",
      "✨ WIND GENERATION PRO MAX"
    ];

    this.memeBoards = [];
    memeTexts.forEach((txt, idx) => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#0a101d';
      ctx.fillRect(0, 0, 512, 128);
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 6;
      ctx.strokeRect(3, 3, 506, 122);
      ctx.fillStyle = '#ffea00';
      ctx.font = 'bold 26px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(txt, 256, 64);

      const texture = new THREE.CanvasTexture(canvas);
      const boardMat = new THREE.MeshBasicMaterial({ map: texture });
      const board = new THREE.Mesh(new THREE.BoxGeometry(6.2, 1.5, 0.2), boardMat);

      const spread = 36;
      const x = -spread + (idx * (spread * 2 / (memeTexts.length - 1)));
      board.position.set(x, 0.8, this.BOWLER_Z - 5);
      board.lookAt(0, 1.2, this.CREASE_Z);
      this.scene.add(board);
      this.memeBoards.push({ board, canvas, ctx, texture, text: txt });
    });
  }

  buildWickets(z) {
    const group = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0xdeb887,
      roughness: 0.6,
      metalness: 0.1
    });

    const stumps = [];
    for (let i = -1; i <= 1; i++) {
      const stump = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.78, 12), woodMat);
      stump.position.set(i * 0.18, 0.39, 0);
      stump.castShadow = true;
      group.add(stump);
      stumps.push(stump);
    }

    const bailMat = new THREE.MeshStandardMaterial({ color: 0xff3b30 });
    const bail1 = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.22, 8), bailMat);
    bail1.rotation.z = Math.PI / 2;
    bail1.position.set(-0.09, 0.8, 0);
    group.add(bail1);

    const bail2 = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.22, 8), bailMat);
    bail2.rotation.z = Math.PI / 2;
    bail2.position.set(0.09, 0.8, 0);
    group.add(bail2);

    group.position.z = z;
    this.scene.add(group);

    return { group, stumps, bails: [bail1, bail2], bailsFallen: false };
  }

  resetStumps() {
    [this.batsmanStumps, this.bowlerStumps].forEach(stumpSet => {
      stumpSet.bails[0].position.set(-0.09, 0.8, 0);
      stumpSet.bails[0].rotation.set(0, 0, Math.PI / 2);
      stumpSet.bails[1].position.set(0.09, 0.8, 0);
      stumpSet.bails[1].rotation.set(0, 0, Math.PI / 2);
      stumpSet.stumps.forEach((s, idx) => {
        s.position.set((idx - 1) * 0.18, 0.39, 0);
        s.rotation.set(0, 0, 0);
      });
      stumpSet.bailsFallen = false;
    });
  }

  triggerBowledOut() {
    this.batsmanStumps.bailsFallen = true;
    // Bails blast off with rotation
    this.batsmanStumps.bails[0].position.y = 1.4;
    this.batsmanStumps.bails[0].position.x = -0.5;
    this.batsmanStumps.bails[0].rotation.z = 1.2;
    this.batsmanStumps.bails[0].rotation.x = 0.8;

    this.batsmanStumps.bails[1].position.y = 1.6;
    this.batsmanStumps.bails[1].position.x = 0.6;
    this.batsmanStumps.bails[1].rotation.z = -1.5;

    // Middle stump tilts back
    this.batsmanStumps.stumps[1].rotation.x = -0.4;
    this.batsmanStumps.stumps[1].position.z = -0.2;
  }

  buildCharacters() {
    // --- BATSMAN ---
    this.batsman = new THREE.Group();
    this.batsman.position.set(0, 0, this.CREASE_Z);
    this.scene.add(this.batsman);

    this.jerseyMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.6 }); // Team blue
    this.pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });
    this.padsMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 });
    this.skinMat = new THREE.MeshStandardMaterial({ color: 0xd49b6a, roughness: 0.8 });
    this.helmetMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.4 });
    this.visorMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.2, metalness: 0.9 });

    // Legs & Pads
    const legL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.9, 0.28), this.padsMat);
    legL.position.set(-0.16, 0.45, 0);
    legL.castShadow = true;
    this.batsman.add(legL);

    const legR = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.9, 0.28), this.padsMat);
    legR.position.set(0.16, 0.45, 0);
    legR.castShadow = true;
    this.batsman.add(legR);

    // Torso (Jersey)
    this.torso = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.76, 0.34), this.jerseyMat);
    this.torso.position.y = 1.28;
    this.torso.castShadow = true;
    this.batsman.add(this.torso);

    // Head & Helmet
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), this.skinMat);
    head.position.y = 1.8;
    this.batsman.add(head);

    const helmet = new THREE.Mesh(
      new THREE.SphereGeometry(0.23, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.68),
      this.helmetMat
    );
    helmet.position.y = 1.84;
    this.batsman.add(helmet);

    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.05), this.visorMat);
    visor.position.set(0, 1.76, 0.19);
    this.batsman.add(visor);

    // Swing Pivot Arm & Bat
    this.swingPivot = new THREE.Group();
    this.swingPivot.position.set(0.35, 1.2, 0.1);
    this.batsman.add(this.swingPivot);

    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.55, 8), this.skinMat);
    arm.rotation.z = Math.PI / 2.3;
    arm.position.set(0.25, -0.05, 0);
    this.swingPivot.add(arm);

    // Bat container
    this.batContainer = new THREE.Group();
    this.batContainer.position.set(0.52, -0.32, 0);
    this.swingPivot.add(this.batContainer);

    this.rebuildBatSkin('willow');

    // --- BOWLER ---
    this.bowler = new THREE.Group();
    this.bowler.position.set(0, 0, this.BOWLER_Z + 1.5);
    this.scene.add(this.bowler);

    const bowlerJerseyMat = new THREE.MeshStandardMaterial({ color: 0xdc2626 });
    const bowlerTorso = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.72, 0.3), bowlerJerseyMat);
    bowlerTorso.position.y = 1.25;
    this.bowler.add(bowlerTorso);

    const bowlerHead = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), this.skinMat);
    bowlerHead.position.y = 1.74;
    this.bowler.add(bowlerHead);

    const bowlerPants = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.9, 0.28), this.pantsMat);
    bowlerPants.position.y = 0.45;
    this.bowler.add(bowlerPants);

    // Bowler arm
    this.bowlerArm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.65, 8), this.skinMat);
    this.bowlerArm.position.set(0.32, 1.35, 0);
    this.bowler.add(this.bowlerArm);
  }

  setTeamColor(colorHex) {
    if (this.jerseyMat) {
      this.jerseyMat.color.setHex(colorHex);
    }
  }

  rebuildBatSkin(skinType) {
    this.batSkin = skinType;
    while (this.batContainer.children.length > 0) {
      this.batContainer.remove(this.batContainer.children[0]);
    }

    const gripMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });

    if (skinType === 'willow') {
      // Classic English Willow Bat
      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.32, 10), gripMat);
      handle.position.y = 0.16;
      this.batContainer.add(handle);

      const bladeMat = new THREE.MeshStandardMaterial({
        color: 0xd4a359,
        roughness: 0.5,
        metalness: 0.05
      });
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.62, 0.06), bladeMat);
      blade.position.y = -0.31;
      blade.castShadow = true;
      this.batContainer.add(blade);
      this.activeBatBlade = blade;
    } else if (skinType === 'chicken') {
      // Screaming Rubber Chicken
      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.22, 8), gripMat);
      handle.position.y = 0.11;
      this.batContainer.add(handle);

      const chickenMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 });
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.65, 12), chickenMat);
      body.position.y = -0.3;
      this.batContainer.add(body);

      // Comb & Beak
      const combMat = new THREE.MeshStandardMaterial({ color: 0xef4444 });
      const comb = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.15, 0.12), combMat);
      comb.position.set(0, -0.65, 0);
      this.batContainer.add(comb);

      const beakMat = new THREE.MeshStandardMaterial({ color: 0xf97316 });
      const beak = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.14, 8), beakMat);
      beak.rotation.x = Math.PI / 2;
      beak.position.set(0, -0.58, 0.12);
      this.batContainer.add(beak);
      this.activeBatBlade = body;
    } else if (skinType === 'hole') {
      // Bat With An Enormous Window In The Middle
      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.32, 8), gripMat);
      handle.position.y = 0.16;
      this.batContainer.add(handle);

      const frameMat = new THREE.MeshStandardMaterial({ color: 0x8b5cf6, roughness: 0.4 });
      // Left rim
      const leftRim = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.6, 0.05), frameMat);
      leftRim.position.set(-0.08, -0.3, 0);
      this.batContainer.add(leftRim);
      // Right rim
      const rightRim = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.6, 0.05), frameMat);
      rightRim.position.set(0.08, -0.3, 0);
      this.batContainer.add(rightRim);
      // Top rim
      const topRim = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.04, 0.05), frameMat);
      topRim.position.set(0, -0.02, 0);
      this.batContainer.add(topRim);
      // Bottom rim
      const bottomRim = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.04, 0.05), frameMat);
      bottomRim.position.set(0, -0.58, 0);
      this.batContainer.add(bottomRim);
      this.activeBatBlade = topRim;
    } else if (skinType === 'toothpick') {
      // Microscopic Toothpick
      const toothpickMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0 });
      const toothpick = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.7, 6), toothpickMat);
      toothpick.position.y = -0.15;
      this.batContainer.add(toothpick);
      this.activeBatBlade = toothpick;
    } else if (skinType === 'noodle') {
      // Wobbly Green Wet Noodle
      const noodleMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.3 });
      for (let s = 0; s < 5; s++) {
        const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.14, 8), noodleMat);
        seg.position.set(Math.sin(s * 0.9) * 0.06, -0.1 - s * 0.12, 0);
        seg.rotation.z = Math.sin(s * 0.8) * 0.3;
        this.batContainer.add(seg);
      }
      this.activeBatBlade = this.batContainer.children[0];
    }
  }

  buildBall() {
    this.ballGroup = new THREE.Group();

    // Red Cricket Ball Sphere
    const ballMat = new THREE.MeshStandardMaterial({
      color: 0xd81f26,
      roughness: 0.35,
      metalness: 0.1
    });
    this.ballMesh = new THREE.Mesh(new THREE.SphereGeometry(0.13, 20, 20), ballMat);
    this.ballMesh.castShadow = true;
    this.ballGroup.add(this.ballMesh);

    // White seam around ball
    const seamMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const seam = new THREE.Mesh(new THREE.TorusGeometry(0.132, 0.012, 8, 24), seamMat);
    this.ballMesh.add(seam);

    // Googly Eyes (Looking smugly at the batsman)
    const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x000000 });

    [-0.05, 0.05].forEach(x => {
      const eyeWhite = new THREE.Mesh(new THREE.SphereGeometry(0.038, 8, 8), eyeWhiteMat);
      eyeWhite.position.set(x, 0.04, 0.11);
      this.ballGroup.add(eyeWhite);

      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 6), pupilMat);
      pupil.position.set(x, 0.04, 0.14);
      this.ballGroup.add(pupil);
    });

    this.scene.add(this.ballGroup);

    // Cartoon evasion smoke puff particles
    this.puffs = [];
    for (let i = 0; i < 8; i++) {
      const p = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 6, 6),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 })
      );
      this.scene.add(p);
      this.puffs.push({ mesh: p, life: 0 });
    }
  }

  spawnEvasionPuff(x, y, z) {
    this.puffs.forEach((p, idx) => {
      p.mesh.position.set(
        x + (Math.random() - 0.5) * 0.3,
        y + (Math.random() - 0.5) * 0.3,
        z + (Math.random() - 0.5) * 0.3
      );
      p.mesh.scale.set(1, 1, 1);
      p.mesh.material.opacity = 0.85;
      p.life = 1.0;
    });
  }

  updatePuffs(dt) {
    this.puffs.forEach(p => {
      if (p.life > 0) {
        p.life -= dt * 3.5;
        p.mesh.scale.multiplyScalar(1.04);
        p.mesh.material.opacity = Math.max(0, p.life * 0.85);
      }
    });
  }

  toWorldX(gameX) {
    return (gameX - 220) * this.SCALE_X;
  }

  toWorldZ(gameY) {
    const t = Math.max(0, Math.min(1.1, (gameY - 50) / (660 - 50)));
    return this.BOWLER_Z + t * (this.STUMP_Z - this.BOWLER_Z);
  }

  getArcHeight(gameY) {
    const progress = Math.max(0, Math.min(1, (gameY - 50) / (660 - 50)));
    return 2.5 * Math.sin(Math.PI * progress) + 0.15;
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}

window.CricketStadium = CricketStadium;
