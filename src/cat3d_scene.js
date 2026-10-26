    // =========================================================================
    // PART 3: FULL-BODIED 3D CAT RIGS, INTERACTIVE COASTAL PLAZA DIORAMA MAP,
    //         AND OVERHEAD (IMAGE 1) -> 3D ATTACK CAMERA TRANSITION (IMAGE 2/3)
    // =========================================================================

    let scene3d = null;
    let perspCamera = null;
    let orthoCamera = null;
    let activeCamera = null;
    let renderer3d = null;
    let raycaster3d = null;
    let pointerNDC = new THREE.Vector2();

    let boardGroup3d = null;
    let dioramaGroup3d = null;
    let piecesGroup3d = null;
    let markersGroup3d = null;
    let pawPrintsGroup3d = null;
    let particlesGroup3d = null;
    let fxSparklesGroup3d = null;

    let ambientLight3d = null;
    let keyLight3d = null;
    let rimLight3d = null;
    let plazaLampLight3d = null;

    const squareMeshesMap = {};
    const catRigsBySquare = {};
    const activeSparkleBursts = [];
    const activeClawSlashEffects = [];

    const animatedTreesList = [];
    const procTexCache = {};

    function getProceduralFurBumpTexture() {
      if (procTexCache.furBump) return procTexCache.furBump;
      const c = document.createElement('canvas');
      c.width = 256; c.height = 256;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#808080';
      ctx.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 3600; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const v = 90 + Math.floor(Math.random() * 75);
        ctx.strokeStyle = `rgb(${v},${v},${v})`;
        ctx.lineWidth = 0.9 + Math.random() * 0.7;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + (Math.random() - 0.5) * 3.5, y + 4 + Math.random() * 5.5);
        ctx.stroke();
      }
      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(4, 4);
      procTexCache.furBump = tex;
      return tex;
    }

    function getProceduralIrisTexture(irisColorHex) {
      const key = 'iris_' + irisColorHex;
      if (procTexCache[key]) return procTexCache[key];
      const c = document.createElement('canvas');
      c.width = 128; c.height = 128;
      const ctx = c.getContext('2d');
      const grad = ctx.createRadialGradient(64, 64, 8, 64, 64, 62);
      grad.addColorStop(0.0, '#fef08a');
      grad.addColorStop(0.28, irisColorHex);
      grad.addColorStop(0.82, irisColorHex);
      grad.addColorStop(1.0, '#0f172a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 128, 128);

      // Radial feline iris stroma fibers
      ctx.save();
      ctx.translate(64, 64);
      for (let i = 0; i < 72; i++) {
        const ang = (i / 72) * Math.PI * 2;
        ctx.strokeStyle = i % 2 === 0 ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.22)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(ang) * 10, Math.sin(ang) * 10);
        ctx.lineTo(Math.cos(ang) * 58, Math.sin(ang) * 58);
        ctx.stroke();
      }
      ctx.restore();
      const tex = new THREE.CanvasTexture(c);
      procTexCache[key] = tex;
      return tex;
    }

    function getProceduralCobblestoneTexture() {
      if (procTexCache.cobble) return procTexCache.cobble;
      const c = document.createElement('canvas');
      c.width = 256; c.height = 256;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#6e655f';
      ctx.fillRect(0, 0, 256, 256);
      const rows = 8, cols = 8;
      const cw = 256 / cols, ch = 256 / rows;
      for (let r = 0; r < rows; r++) {
        for (let col = 0; col < cols; col++) {
          const offsetX = (r % 2 === 1) ? cw * 0.5 : 0;
          const x = (col * cw + offsetX) % 256;
          const y = r * ch;
          const shade = 148 + Math.floor(Math.random() * 34);
          ctx.fillStyle = `rgb(${shade},${shade - 6},${shade - 12})`;
          ctx.strokeStyle = '#4a423d';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(x + 2, y + 2, cw - 4, ch - 4, 5);
          ctx.fill();
          ctx.stroke();
        }
      }
      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(14, 14);
      procTexCache.cobble = tex;
      return tex;
    }

    function getProceduralBarkTexture() {
      if (procTexCache.bark) return procTexCache.bark;
      const c = document.createElement('canvas');
      c.width = 128; c.height = 128;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#5c3d28';
      ctx.fillRect(0, 0, 128, 128);
      for (let i = 0; i < 260; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#4a2f1d' : '#6e4930';
        ctx.fillRect(Math.random() * 128, Math.random() * 128, 3, 20);
      }
      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      procTexCache.bark = tex;
      return tex;
    }

    function create3DBlossomFlowerCluster(scale = 1.0, petalColor = '#fda4af', centerColor = '#fde047') {
      const flowerGroup = new THREE.Group();
      const petalMat = new THREE.MeshStandardMaterial({
        color: petalColor,
        roughness: 0.45,
        metalness: 0.02,
        side: THREE.DoubleSide
      });
      const coreMat = new THREE.MeshStandardMaterial({
        color: centerColor,
        roughness: 0.35,
        emissive: centerColor,
        emissiveIntensity: 0.18
      });

      const petalGeo = new THREE.CircleGeometry(0.068 * scale, 7);
      petalGeo.scale(1.0, 1.45, 1.0);

      for (let i = 0; i < 5; i++) {
        const ang = (i / 5) * Math.PI * 2;
        const petal = new THREE.Mesh(petalGeo, petalMat);
        petal.position.set(Math.cos(ang) * 0.055 * scale, 0.01 * scale, Math.sin(ang) * 0.055 * scale);
        petal.rotation.x = -Math.PI / 2 + 0.28;
        petal.rotation.z = -ang + Math.PI / 2;
        flowerGroup.add(petal);
      }

      const stamen = new THREE.Mesh(new THREE.SphereGeometry(0.032 * scale, 8, 8), coreMat);
      stamen.position.y = 0.018 * scale;
      flowerGroup.add(stamen);
      return flowerGroup;
    }

    function createDetailed3DTree(x, z, scale, foliageColor1, foliageColor2, isCypress, hasBlossoms = true) {
      const treeGroup = new THREE.Group();
      treeGroup.position.set(x, -0.22, z);

      const barkMat = new THREE.MeshStandardMaterial({
        color: 0x523624,
        roughness: 0.88,
        map: getProceduralBarkTexture()
      });
      const stonePlanterMat = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        roughness: 0.76,
        metalness: 0.05
      });
      const soilMat = new THREE.MeshStandardMaterial({
        color: 0x3b2a1e,
        roughness: 0.92
      });

      // Ornate Stone Tree Planter Base & Soil Mound
      const planterRing = new THREE.Mesh(
        new THREE.CylinderGeometry(0.46 * scale, 0.52 * scale, 0.24 * scale, 16),
        stonePlanterMat
      );
      planterRing.position.y = 0.12 * scale;
      planterRing.castShadow = true;
      planterRing.receiveShadow = true;
      treeGroup.add(planterRing);

      const soilDisk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.40 * scale, 0.42 * scale, 0.26 * scale, 14),
        soilMat
      );
      soilDisk.position.y = 0.13 * scale;
      treeGroup.add(soilDisk);

      const leafMat1 = new THREE.MeshStandardMaterial({
        color: foliageColor1 || 0x2e7d32,
        roughness: 0.58,
        metalness: 0.03
      });
      const leafMat2 = new THREE.MeshStandardMaterial({
        color: foliageColor2 || 0x4caf50,
        roughness: 0.52,
        metalness: 0.03
      });
      const blossomFoliageMat = new THREE.MeshStandardMaterial({
        color: 0xfbcfe8,
        roughness: 0.48,
        metalness: 0.02
      });

      const trunkH = (isCypress ? 1.68 : 1.38) * scale;
      // Lower Flared Trunk
      const trunkBase = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14 * scale, 0.28 * scale, trunkH * 0.55, 14),
        barkMat
      );
      trunkBase.position.y = trunkH * 0.27;
      trunkBase.castShadow = true;
      trunkBase.receiveShadow = true;
      treeGroup.add(trunkBase);

      // Upper Slightly Curved Trunk
      const trunkUpper = new THREE.Mesh(
        new THREE.CylinderGeometry(0.10 * scale, 0.15 * scale, trunkH * 0.58, 12),
        barkMat
      );
      trunkUpper.position.set(0.03 * scale, trunkH * 0.72, 0.02 * scale);
      trunkUpper.rotation.z = -0.06;
      trunkUpper.castShadow = true;
      trunkUpper.receiveShadow = true;
      treeGroup.add(trunkUpper);

      // Sculpted Root Buttresses
      for (let ri = 0; ri < 4; ri++) {
        const rAng = (ri / 4) * Math.PI * 2 + 0.4;
        const root = new THREE.Mesh(
          new THREE.CylinderGeometry(0.04 * scale, 0.10 * scale, 0.36 * scale, 8),
          barkMat
        );
        root.position.set(Math.cos(rAng) * 0.16 * scale, 0.22 * scale, Math.sin(rAng) * 0.16 * scale);
        root.rotation.z = -Math.cos(rAng) * 0.52;
        root.rotation.x = Math.sin(rAng) * 0.52;
        treeGroup.add(root);
      }

      const canopyGroup = new THREE.Group();
      canopyGroup.position.y = trunkH * 0.86;
      treeGroup.add(canopyGroup);

      if (isCypress) {
        // 5-Tier Sculpted Mediterranean Cypress Spire
        for (let i = 0; i < 5; i++) {
          const tRatio = i / 4;
          const cone = new THREE.Mesh(
            new THREE.ConeGeometry((0.54 - tRatio * 0.30) * scale, (1.05 - tRatio * 0.28) * scale, 16),
            i % 2 === 0 ? leafMat1 : leafMat2
          );
          cone.position.y = i * 0.42 * scale + 0.34 * scale;
          cone.castShadow = true;
          cone.receiveShadow = true;
          canopyGroup.add(cone);
        }
      } else {
        // 5 Organic Spreading Wooden Branches
        [
          [-0.28, 0.24, 0.08, 0.58, -0.15],
          [ 0.30, 0.22, -0.06, -0.55, 0.14],
          [ 0.06, 0.28, 0.26, -0.12, 0.52],
          [-0.08, 0.26, -0.26, 0.14, -0.50],
          [ 0.02, 0.48, 0.02, 0.08, 0.06]
        ].forEach(([bx, by, bz, rz, rx]) => {
          const branch = new THREE.Mesh(
            new THREE.CylinderGeometry(0.042 * scale, 0.085 * scale, 0.68 * scale, 9),
            barkMat
          );
          branch.position.set(bx * scale, by * scale, bz * scale);
          branch.rotation.z = rz;
          branch.rotation.x = rx;
          branch.castShadow = true;
          canopyGroup.add(branch);
        });

        // 11 Multi-Layered Lush Canopy Clusters
        const puffs = [
          [ 0.00, 0.62,  0.00, 0.68],
          [-0.46, 0.42,  0.24, 0.52],
          [ 0.48, 0.44, -0.22, 0.54],
          [-0.28, 0.46, -0.42, 0.49],
          [ 0.30, 0.48,  0.40, 0.50],
          [-0.52, 0.56, -0.12, 0.44],
          [ 0.52, 0.58,  0.16, 0.45],
          [ 0.00, 0.96,  0.04, 0.50],
          [-0.26, 0.82,  0.22, 0.43],
          [ 0.28, 0.80, -0.20, 0.42],
          [ 0.04, 0.54,  0.48, 0.44]
        ];
        puffs.forEach(([px, py, pz, rad], idx) => {
          const puffGeo = new THREE.IcosahedronGeometry(rad * scale, 2);
          puffGeo.scale(1.12, 0.84, 1.08);
          const chosenMat = (hasBlossoms && idx % 3 === 2)
            ? blossomFoliageMat
            : (idx % 2 === 0 ? leafMat1 : leafMat2);
          const puff = new THREE.Mesh(puffGeo, chosenMat);
          puff.position.set(px * scale, py * scale, pz * scale);
          puff.rotation.set(idx * 0.5, idx * 0.9, idx * 0.3);
          puff.castShadow = true;
          puff.receiveShadow = true;
          canopyGroup.add(puff);
        });

        // 16 Sculpted 3D Cherry Blossom Flowers Dotting the Canopy
        if (hasBlossoms) {
          for (let fi = 0; fi < 16; fi++) {
            const theta = (fi / 16) * Math.PI * 2 + (fi % 3) * 0.2;
            const phi = 0.35 + (fi % 4) * 0.26;
            const rDist = (0.72 + (fi % 3) * 0.14) * scale;
            const fl = create3DBlossomFlowerCluster(
              scale * (0.95 + (fi % 3) * 0.18),
              fi % 2 === 0 ? '#fda4af' : '#fbcfe8',
              '#fde047'
            );
            fl.position.set(
              Math.cos(theta) * Math.sin(phi) * rDist,
              0.52 * scale + Math.cos(phi) * 0.48 * scale,
              Math.sin(theta) * Math.sin(phi) * rDist
            );
            fl.lookAt(fl.position.x * 2, fl.position.y + 1.0, fl.position.z * 2);
            canopyGroup.add(fl);
          }
        }
      }

      animatedTreesList.push({
        canopy: canopyGroup,
        phase: (x + z) * 0.45,
        speed: 1.35 + (Math.abs(x) % 3) * 0.22,
        amp: isCypress ? 0.032 : 0.024
      });

      return treeGroup;
    }

    const interactivePropMeshes = [];

    // References to animated 3D Diorama Props
    const dioramaProps = {
      boomboxGroup: null,
      boomboxPos: null,
      boxKittenGroup: null,
      boxKittenPeekTimer: 0,
      picnicFishMesh: null,
      picnicFishTimer: 0,
      toyMouseGroup: null,
      toyMouseRunTimer: 0,
      seaWaterMesh: null,
      lampBulbMesh: null
    };

    // Camera Controller State
    // Default is 'overheadAuto': looks straight down from above (like Reference 1: 1000756616.jpg),
    // and automatically swoops down to low-angle 3D close-up (like Reference 2 & 3: 1000756617/18.jpg) on attacks!
    const camState = {
      playMode: 'diorama3d',
      theta: 0,
      phi: 1.04,                // Beautiful 3D perspective showing full cats and diorama
      radius: 12.8,
      target: new THREE.Vector3(0, 0.25, 0),
      desiredTheta: 0,
      desiredPhi: 1.04,
      desiredRadius: 12.8,
      desiredTarget: new THREE.Vector3(0, 0.25, 0),
      lerpSpeed: 0.14,
      isOrtho: false,
      followMoves: true,
      cameraLocked: true,
      savedPreCapture: null,
      isDragging: false,
      isPanning: false,
      dragStartX: 0,
      dragStartY: 0,
      pointerMovedDist: 0,
      pinchStartDist: 0
    };

    let activeMoveAnim = null;

    function squareToWorld(sq, yOffset = 0) {
      const file = sq.charCodeAt(0) - 97; // 0..7 (a..h)
      const rank = parseInt(sq[1], 10) - 1; // 0..7 (1..8)
      const x = (file - 3.5) * 1.15;
      const z = (3.5 - rank) * 1.15;
      return new THREE.Vector3(x, yOffset, z);
    }

    function getCurrentEyeColors() {
      const style = appState.custom.eyeStyle || 'classic';
      if (style === 'emerald') return { white: '#f59e0b', black: '#10b981' };
      if (style === 'violet') return { white: '#38bdf8', black: '#a855f7' };
      return { white: '#38bdf8', black: '#f59e0b' };
    }

    function makeCoordLabelSprite(text, colorHex) {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, 64, 64);
      ctx.font = 'bold 38px "Inter", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = colorHex || '#e6dfd5';
      ctx.fillText(text, 32, 34);
      const tex = new THREE.CanvasTexture(canvas);
      const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false });
      const geo = new THREE.PlaneGeometry(0.36, 0.36);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = -Math.PI / 2;
      return mesh;
    }

    // Create cute white Paw-Print Decal Meshes on the stone tiles with pooled shared geometries
    let cachedPawPadGeo = null;
    let cachedPawToeGeo = null;
    let cachedPawMat = null;
    function spawnPawPrintTrailOnBoard(fromPos, toPos) {
      if (!pawPrintsGroup3d) return;
      while (pawPrintsGroup3d.children.length > 0) {
        pawPrintsGroup3d.remove(pawPrintsGroup3d.children[0]);
      }
      if (!cachedPawPadGeo) cachedPawPadGeo = new THREE.CircleGeometry(0.065, 8);
      if (!cachedPawToeGeo) cachedPawToeGeo = new THREE.CircleGeometry(0.028, 6);
      if (!cachedPawMat) {
        cachedPawMat = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.85,
          depthWrite: false
        });
      }
      const steps = 4;
      for (let i = 1; i <= steps; i++) {
        const t = i / (steps + 1);
        const p = new THREE.Vector3().lerpVectors(fromPos, toPos, t);
        const sideOffset = (i % 2 === 0 ? 1 : -1) * 0.12;
        const pawGroup = new THREE.Group();
        pawGroup.position.set(p.x + sideOffset, 0.018, p.z);

        const pad = new THREE.Mesh(cachedPawPadGeo, cachedPawMat);
        pad.rotation.x = -Math.PI / 2;
        pawGroup.add(pad);

        [-0.055, 0, 0.055].forEach((tx, idx) => {
          const toe = new THREE.Mesh(cachedPawToeGeo, cachedPawMat);
          toe.rotation.x = -Math.PI / 2;
          toe.position.set(tx, 0.001, -0.075 - (idx === 1 ? 0.015 : 0));
          pawGroup.add(toe);
        });
        pawPrintsGroup3d.add(pawGroup);
      }
    }

    // =========================================================================
    // FULL-BODIED 3D CAT PIECES MATCHING REFERENCE IMAGES 1000756618 & 1000756619
    // - Pawn: Sleek sitting cat with long curved tail (stretches into 4-legged leap on attack!)
    // - Rook: Cat riding a Roomba Robot Vacuum with stacked cardboard boxes & pot helmet
    // - Knight: Agile spotted cat with visor helmet & bib
    // - Bishop: Tall sitting cat with pointed Bishop mitre hat & bib
    // - Queen: Fluffy cat on polka-dot drum with gold crown & tall blue feather teaser wand
    // - King: Giant chonky boss cat on corrugated metal trash can with tin-can/gold crown
    // =========================================================================
    // =========================================================================
    // EXACT STEAM "CAT CHESS" (APP 4163030) & IMAGE_983184.JPG 3D CAT MODELS:
    // - King (k): Giant ultra-fluffy Persian/Maine Coon cat with wide fur mane,
    //             smug half-lidded eyes, and tall 5-point gold crown with rubies & sapphires
    // - Queen (q): Tall, ultra-slender long-legged Oriental/Siamese cat with swan neck,
    //              winged blue eyes, red collar + gold bell, and golden dome crown
    // - Pawn (p): Sitting Scottish-Fold tabby cat with huge lime-yellow eyes (#cbe81e),
    //             folded ears, blue collar, and fluffy tail wrapped around front paws
    // - Bishop (b): Sleek cat wearing tall white & gold liturgical Bishop Mitre hat & cape
    // - Rook (r): Large muscular Ragdoll cat with dark seal-brown ears, eye mask & bushy tail
    // - Knight (n): Seal-point warrior cat wearing rounded steel-blue medieval nasal helmet
    // =========================================================================
    function createCatPieceRig(type, color) {
      const isWhite = color === 'w';
      const rig = new THREE.Group();

      // Start cats in an alert, wide-eyed, upright sitting posture
      const initialBehaviors = ['normalSit', 'normalSit', 'curiousTilt', 'normalSit', 'lickingPaw'];
      const initBeh = initialBehaviors[Math.floor(Math.random() * initialBehaviors.length)];

      rig.userData = {
        type,
        color,
        phaseOffset: Math.random() * Math.PI * 2,
        nextBlinkTime: performance.now() + 1500 + Math.random() * 2500,
        isBlinking: false,
        blinkStart: 0,
        blinkDuration: 180,
        isDoubleBlink: false,
        behaviorState: initBeh,
        behaviorStart: performance.now() - Math.random() * 1500,
        behaviorDuration: initBeh === 'normalSit' ? (3600 + Math.random() * 4200) : (2600 + Math.random() * 2200),
        eyeClosure: 0
      };

      const furHex = isWhite ? appState.custom.whiteFur : appState.custom.blackFur;
      const bellyFurHex = isWhite ? '#ffffff' : '#524c48';
      const stripeHex = isWhite ? '#cbd5e1' : '#18181b';
      const sealBrownHex = isWhite ? '#4a2c18' : '#0f0d0c';
      const muzzleShadeHex = isWhite ? '#f1ece4' : '#322e2b';
      const eyePair = getCurrentEyeColors();

      // Brilliant high-contrast jewel feline eye colors (Sapphire, Emerald, Amber Gold)
      let eyeHex = isWhite ? eyePair.white : eyePair.black;
      if (type === 'p' || type === 'b') {
        eyeHex = isWhite ? '#10b981' : '#f59e0b'; // Vivid Emerald / Golden Amber
      } else if (isWhite) {
        eyeHex = '#38bdf8'; // Icy Sapphire Blue
      } else {
        eyeHex = '#f59e0b'; // Radiant Feline Amber
      }

      const collarHex = (type === 'q')
        ? (isWhite ? '#dc2626' : '#9333ea')
        : (isWhite ? '#3b82f6' : '#f59e0b');
      const innerEarHex = isWhite ? '#fda4af' : '#c084fc';

      const furBumpTex = getProceduralFurBumpTexture();
      const furMat = new THREE.MeshStandardMaterial({
        color: furHex,
        roughness: 0.46,
        metalness: 0.04,
        bumpMap: furBumpTex,
        bumpScale: 0.015
      });
      const bellyMat = new THREE.MeshStandardMaterial({
        color: bellyFurHex,
        roughness: 0.50,
        metalness: 0.02,
        bumpMap: furBumpTex,
        bumpScale: 0.012
      });
      const muzzleMat = new THREE.MeshStandardMaterial({
        color: muzzleShadeHex,
        roughness: 0.48,
        metalness: 0.03,
        bumpMap: furBumpTex,
        bumpScale: 0.008
      });
      const stripeMat = new THREE.MeshStandardMaterial({ color: stripeHex, roughness: 0.58, metalness: 0.03 });
      const sealPointMat = new THREE.MeshStandardMaterial({ color: sealBrownHex, roughness: 0.54, metalness: 0.04 });
      const collarMat = new THREE.MeshStandardMaterial({ color: collarHex, roughness: 0.28, metalness: 0.42 });
      const goldMat = new THREE.MeshStandardMaterial({ color: '#facc15', roughness: 0.20, metalness: 0.82 });
      const rubyMat = new THREE.MeshStandardMaterial({ color: '#ef4444', roughness: 0.14, metalness: 0.38 });
      const sapphireMat = new THREE.MeshStandardMaterial({ color: '#3b82f6', roughness: 0.14, metalness: 0.38 });
      const steelHelmMat = new THREE.MeshStandardMaterial({
        color: isWhite ? '#93c5fd' : '#475569',
        roughness: 0.25,
        metalness: 0.68
      });
      const mitreClothMat = new THREE.MeshStandardMaterial({
        color: isWhite ? '#f8fafc' : '#1e293b',
        roughness: 0.40
      });
      const irisTex = getProceduralIrisTexture(eyeHex);
      const eyeMat = new THREE.MeshBasicMaterial({ map: irisTex });
      const pupilMat = new THREE.MeshBasicMaterial({ color: '#05070b' });
      const catchlightMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });
      const innerEarMat = new THREE.MeshStandardMaterial({ color: innerEarHex, roughness: 0.65 });
      const pinkTongueMat = new THREE.MeshStandardMaterial({ color: '#fb7185', roughness: 0.32, metalness: 0.06 });
      const darkGrooveMat = new THREE.MeshStandardMaterial({ color: isWhite ? '#334155' : '#09090b', roughness: 0.68 });
      const ivoryClawMat = new THREE.MeshStandardMaterial({ color: '#fef9c3', roughness: 0.25, metalness: 0.15 });

      // 1. Sculpted Team Pedestal Ring & Soft Contact Shadow on the Board Square
      const shadowDisc = new THREE.Mesh(
        new THREE.CircleGeometry(type === 'k' ? 0.47 : 0.39, 24),
        new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.32, depthWrite: false })
      );
      shadowDisc.rotation.x = -Math.PI / 2;
      shadowDisc.position.y = 0.01;
      rig.add(shadowDisc);

      // Subtle Team Base Accent Ring so piece roles & teams read effortlessly
      const baseRing = new THREE.Mesh(
        new THREE.RingGeometry(type === 'k' ? 0.36 : 0.29, type === 'k' ? 0.41 : 0.33, 28),
        new THREE.MeshBasicMaterial({
          color: isWhite ? '#bae6fd' : '#f59e0b',
          transparent: true,
          opacity: 0.34,
          side: THREE.DoubleSide,
          depthWrite: false
        })
      );
      baseRing.rotation.x = -Math.PI / 2;
      baseRing.position.y = 0.014;
      rig.add(baseRing);

      const catBaseY = 0.02;
      const bodyGroup = new THREE.Group();
      bodyGroup.position.y = catBaseY;
      rig.add(bodyGroup);
      rig.userData.bodyGroup = bodyGroup;
      rig.userData.catBaseY = catBaseY;

      const isKing = type === 'k';
      const isQueen = type === 'q';
      const isRook = type === 'r';
      const isBishop = type === 'b';
      const isKnight = type === 'n';
      const isPawn = type === 'p';

      // Authentic feline sitting proportions: tall, upright, slender (not a wide dumpling)
      const bodyScaleW = isKing ? 1.08 : (isRook ? 1.02 : (isQueen ? 0.86 : (isPawn ? 0.82 : 0.92)));
      const bodyScaleH = isKing ? 1.34 : (isQueen ? 1.42 : (isRook ? 1.24 : (isPawn ? 1.04 : 1.18)));

      // 2. Sculpted Feline Torso: sleek ribcage, curved waist tuck, and folded flank haunches
      const torsoPts = [
        new THREE.Vector2(0.01, 0.02 * bodyScaleH),
        new THREE.Vector2(0.18 * bodyScaleW, 0.07 * bodyScaleH),
        new THREE.Vector2(0.16 * bodyScaleW, 0.20 * bodyScaleH),
        new THREE.Vector2(0.125 * bodyScaleW, 0.36 * bodyScaleH), // Defined feline waist tuck!
        new THREE.Vector2(0.155 * bodyScaleW, 0.50 * bodyScaleH), // Proud ribcage/chest
        new THREE.Vector2(0.13 * bodyScaleW, 0.62 * bodyScaleH), // Shoulders
        new THREE.Vector2(0.095 * bodyScaleW, 0.70 * bodyScaleH), // Neck base
        new THREE.Vector2(0.01, 0.74 * bodyScaleH)
      ];
      const torsoGeo = new THREE.LatheGeometry(torsoPts, 26);
      torsoGeo.scale(1.0, 1.0, 1.12);
      const torsoMesh = new THREE.Mesh(torsoGeo, furMat);
      torsoMesh.position.set(0, 0.01, -0.01);
      torsoMesh.castShadow = true;
      torsoMesh.receiveShadow = true;
      bodyGroup.add(torsoMesh);

      // Dedicated Feline Neck (connects shoulders to head, eliminates dumpling head-sink)
      const neckMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.082 * bodyScaleW, 0.102 * bodyScaleW, 0.17 * bodyScaleH, 16),
        furMat
      );
      neckMesh.position.set(0, 0.62 * bodyScaleH, 0.04);
      neckMesh.rotation.x = 0.08;
      neckMesh.castShadow = true;
      bodyGroup.add(neckMesh);

      // Compact Seated Flank Haunches hugging sides
      [-0.145 * bodyScaleW, 0.145 * bodyScaleW].forEach((tx) => {
        const haunch = new THREE.Mesh(
          new THREE.SphereGeometry(0.125 * bodyScaleW, 16, 14),
          furMat
        );
        haunch.scale.set(0.70, 1.08, 1.28);
        haunch.position.set(tx, 0.135 * bodyScaleH, -0.03);
        haunch.castShadow = true;
        bodyGroup.add(haunch);
      });

      // Soft Lighter Belly & Sternum Fur Patch
      const bellyPatch = new THREE.Mesh(
        new THREE.SphereGeometry(0.135 * bodyScaleW, 16, 14),
        bellyMat
      );
      bellyPatch.scale.set(0.80, 1.30 * bodyScaleH, 0.52);
      bellyPatch.position.set(0, 0.35 * bodyScaleH, 0.12 * bodyScaleW);
      bodyGroup.add(bellyPatch);

      // Chest & Mane Ruff for King / Persian Queen / Rook
      if (isKing || isRook) {
        const ruffCount = isKing ? 10 : 8;
        const ruffRad = isKing ? 0.13 : 0.11;
        for (let ri = 0; ri < ruffCount; ri++) {
          const ang = (ri / ruffCount) * Math.PI * 2;
          const puff = new THREE.Mesh(new THREE.SphereGeometry(ruffRad, 12, 10), ri % 2 === 0 ? furMat : bellyMat);
          puff.scale.set(1.15, 0.88, 1.15);
          puff.position.set(
            Math.sin(ang) * 0.17 * bodyScaleW,
            (isKing ? 0.48 : 0.44) * bodyScaleH + Math.cos(ang * 2) * 0.02,
            Math.cos(ang) * 0.15 * bodyScaleW + 0.04
          );
          puff.castShadow = true;
          bodyGroup.add(puff);
        }
      } else {
        [-0.038, 0, 0.038].forEach((tx, idx) => {
          const chestTuft = new THREE.Mesh(
            new THREE.ConeGeometry(0.036 * bodyScaleW, 0.09 * bodyScaleH, 8),
            bellyMat
          );
          chestTuft.rotation.x = 2.65;
          chestTuft.rotation.z = tx * -2.2;
          chestTuft.position.set(tx, (isQueen ? 0.52 : 0.40 - (idx === 1 ? 0.02 : 0)) * bodyScaleH, 0.16 * bodyScaleW);
          bodyGroup.add(chestTuft);
        });
      }

      // 3. Individually Articulated Front Left & Right Legs with 4 Sculpted Toes, Claws & Multi-Pad Toe Beans!
      const frontLegsGroup = new THREE.Group();
      const legHeight = isQueen ? 0.46 * bodyScaleH : 0.34 * bodyScaleH;
      const legRadiusTop = isKing ? 0.055 : (isQueen ? 0.034 : 0.044);
      const legRadiusBot = isKing ? 0.045 : (isQueen ? 0.028 : 0.036);
      const legSpreadX = isKing ? 0.125 : (isQueen ? 0.068 : 0.082 * bodyScaleW);

      frontLegsGroup.position.set(0, legHeight, 0.16);
      bodyGroup.add(frontLegsGroup);
      rig.userData.frontLegsGroup = frontLegsGroup;

      [-1, 1].forEach((sideSign) => {
        const singleLegPivot = new THREE.Group();
        singleLegPivot.position.set(sideSign * legSpreadX, 0, 0.02);

        // Upper Foreleg
        const legCyl = new THREE.Mesh(
          new THREE.CylinderGeometry(legRadiusTop, legRadiusBot, legHeight, 16),
          furMat
        );
        legCyl.position.set(0, -legHeight * 0.5, 0);
        legCyl.castShadow = true;
        singleLegPivot.add(legCyl);

        // Subtle Elbow / Wrist Ankle Joint Bulge
        const wristBulge = new THREE.Mesh(
          new THREE.SphereGeometry(legRadiusBot * 1.06, 12, 10),
          furMat
        );
        wristBulge.position.set(0, -legHeight * 0.72, 0.008);
        singleLegPivot.add(wristBulge);

        if (isPawn || isBishop || isKnight) {
          [-0.32, -0.58, -0.78].forEach((frac) => {
            const band = new THREE.Mesh(
              new THREE.CylinderGeometry(legRadiusTop * 0.96, legRadiusBot * 1.02, 0.022, 12),
              stripeMat
            );
            band.position.set(0, legHeight * frac, 0.004);
            singleLegPivot.add(band);
          });
        }

        // Plump Paw Base
        const paw = new THREE.Mesh(
          new THREE.SphereGeometry(legRadiusBot * 1.38, 16, 14),
          furMat
        );
        paw.scale.set(1.14, 0.66, 1.36);
        paw.position.set(0, -legHeight + 0.022, 0.045);
        singleLegPivot.add(paw);

        // 4 Distinct Sculpted Toes + Ivory Claws + Individual Pink Toe Beans
        const toeRadius = legRadiusBot * 0.36;
        [-1.5, -0.5, 0.5, 1.5].forEach((tIdx) => {
          const tx = tIdx * (toeRadius * 1.32);
          const tz = 0.045 + legRadiusBot * 1.18 - Math.abs(tIdx) * 0.006;

          const toe = new THREE.Mesh(
            new THREE.SphereGeometry(toeRadius, 12, 10),
            furMat
          );
          toe.scale.set(0.86, 0.80, 1.38);
          toe.position.set(tx, -legHeight + 0.017, tz);
          singleLegPivot.add(toe);

          // Tiny Sculpted Ivory Claw Tip at the front of each toe
          const claw = new THREE.Mesh(
            new THREE.ConeGeometry(toeRadius * 0.28, toeRadius * 0.75, 6),
            ivoryClawMat
          );
          claw.rotation.x = Math.PI * 0.42;
          claw.position.set(tx, -legHeight + 0.011, tz + toeRadius * 1.25);
          singleLegPivot.add(claw);

          // Individual Pink Toe Bean Pad underneath each toe
          const bean = new THREE.Mesh(
            new THREE.SphereGeometry(toeRadius * 0.55, 8, 8),
            pinkTongueMat
          );
          bean.scale.set(0.85, 0.35, 1.15);
          bean.position.set(tx, -legHeight + 0.004, tz - 0.004);
          singleLegPivot.add(bean);
        });

        // Central Heart-Shaped Metacarpal Pink Paw Pad underneath
        const pinkPad = new THREE.Mesh(
          new THREE.CircleGeometry(legRadiusBot * 0.68, 12),
          pinkTongueMat
        );
        pinkPad.rotation.x = Math.PI / 2;
        pinkPad.position.set(0, -legHeight + 0.003, 0.036);
        singleLegPivot.add(pinkPad);

        frontLegsGroup.add(singleLegPivot);
        if (sideSign < 0) rig.userData.legLGroup = singleLegPivot;
        else rig.userData.legRGroup = singleLegPivot;
      });

      // Hind Paws with 3 Sculpted Toes & Ivory Claws Each
      [-0.165 * bodyScaleW, 0.165 * bodyScaleW].forEach((hx) => {
        if (isQueen) {
          const hLeg = new THREE.Mesh(
            new THREE.CylinderGeometry(0.042, 0.030, 0.44 * bodyScaleH, 12),
            furMat
          );
          hLeg.position.set(hx * 0.85, 0.22 * bodyScaleH, -0.08);
          bodyGroup.add(hLeg);
        }
        const hpaw = new THREE.Mesh(new THREE.SphereGeometry(0.068, 14, 12), furMat);
        hpaw.scale.set(1.08, 0.64, 1.38);
        hpaw.position.set(hx, 0.042, isQueen ? -0.05 : 0.055);
        bodyGroup.add(hpaw);

        // 3 Sculpted Hind Toes + Claws
        [-1, 0, 1].forEach((ti) => {
          const htx = hx + ti * 0.026;
          const htz = (isQueen ? -0.05 : 0.055) + 0.068 - Math.abs(ti) * 0.004;
          const hToe = new THREE.Mesh(new THREE.SphereGeometry(0.023, 10, 8), furMat);
          hToe.scale.set(0.88, 0.78, 1.32);
          hToe.position.set(htx, 0.026, htz);
          bodyGroup.add(hToe);

          const hClaw = new THREE.Mesh(new THREE.ConeGeometry(0.006, 0.018, 6), ivoryClawMat);
          hClaw.rotation.x = Math.PI * 0.42;
          hClaw.position.set(htx, 0.018, htz + 0.026);
          bodyGroup.add(hClaw);
        });
      });

      // Sculpted Tabby Back & Flank Stripes
      if (!isKing && !isQueen) {
        for (let si = 0; si < 4; si++) {
          const stripeArc = new THREE.Mesh(
            new THREE.TorusGeometry((0.20 - si * 0.013) * bodyScaleW, 0.013, 8, 20, Math.PI * 1.18),
            stripeMat
          );
          stripeArc.rotation.set(0.32 + si * 0.11, 0, -Math.PI * 0.09);
          stripeArc.position.set(0, (0.19 + si * 0.075) * bodyScaleH, -0.02);
          bodyGroup.add(stripeArc);
        }
      }

      // 4. Collar, Buckle & Engraved Golden Bell
      const collarY = 0.58 * bodyScaleH;
      if (!isKing) {
        const collarRadius = isQueen ? 0.082 : 0.108 * bodyScaleW;
        const collar = new THREE.Mesh(
          new THREE.TorusGeometry(collarRadius, 0.018, 14, 28),
          collarMat
        );
        collar.rotation.x = Math.PI / 2 - 0.10;
        collar.position.set(0, collarY, 0.06);
        bodyGroup.add(collar);

        const collarBell = new THREE.Mesh(
          new THREE.SphereGeometry(0.032, 14, 14),
          goldMat
        );
        collarBell.position.set(0, collarY - 0.022, 0.06 + collarRadius);
        bodyGroup.add(collarBell);

        // Tiny dark bell slot groove
        const bellSlot = new THREE.Mesh(
          new THREE.BoxGeometry(0.034, 0.007, 0.016),
          darkGrooveMat
        );
        bellSlot.position.set(0, collarY - 0.030, 0.06 + collarRadius + 0.020);
        bodyGroup.add(bellSlot);
      }

      // 5. Thick Curled Multi-Ringed Tail Wrapping Around the Haunch
      const tailGroup = new THREE.Group();
      const tailMat = isRook ? sealPointMat : furMat;
      if (isPawn) {
        tailGroup.position.set(0, 0.052, 0.02);
        const wrapTail = new THREE.Mesh(
          new THREE.TorusGeometry(0.235, 0.056, 16, 32, Math.PI * 1.30),
          furMat
        );
        wrapTail.rotation.x = Math.PI / 2;
        wrapTail.rotation.z = -Math.PI * 0.14;
        wrapTail.castShadow = true;
        tailGroup.add(wrapTail);

        // Striped rings along the wrapped tail
        for (let tri = 1; tri <= 4; tri++) {
          const rAng = -Math.PI * 0.14 + (tri / 5) * Math.PI * 1.25;
          const tRing = new THREE.Mesh(
            new THREE.TorusGeometry(0.057, 0.009, 8, 14),
            stripeMat
          );
          tRing.position.set(Math.cos(rAng) * 0.235, 0.002, Math.sin(rAng) * 0.235);
          tRing.rotation.y = -rAng;
          tailGroup.add(tRing);
        }

        const wrapTip = new THREE.Mesh(new THREE.SphereGeometry(0.058, 14, 14), bellyMat);
        wrapTip.position.set(0.20, 0.005, 0.13);
        tailGroup.add(wrapTip);
      } else {
        tailGroup.position.set(0, (isQueen ? 0.36 : 0.15) * bodyScaleH, -0.22);
        const tThick = (isKing || isRook) ? 0.068 : 0.046;
        const tailSeg1 = new THREE.Mesh(new THREE.CylinderGeometry(tThick, tThick * 1.16, 0.36, 14), tailMat);
        tailSeg1.position.set(0, 0.11, -0.14);
        tailSeg1.rotation.x = -1.02;
        tailGroup.add(tailSeg1);

        const tailSeg2 = new THREE.Mesh(new THREE.CylinderGeometry(tThick * 0.90, tThick, 0.32, 14), tailMat);
        tailSeg2.position.set(0, 0.25, -0.32);
        tailSeg2.rotation.x = -0.45;
        tailGroup.add(tailSeg2);

        // Contrasting tail rings
        [0.18, 0.28].forEach((ty, idx) => {
          const tBand = new THREE.Mesh(
            new THREE.CylinderGeometry(tThick * 0.98, tThick * 0.98, 0.032, 12),
            stripeMat
          );
          tBand.position.set(0, ty, -0.22 - idx * 0.10);
          tBand.rotation.x = -0.65;
          tailGroup.add(tBand);
        });

        const tailTip = new THREE.Mesh(new THREE.SphereGeometry(tThick * 1.12, 12, 12), isKing ? bellyMat : tailMat);
        tailTip.position.set(0, 0.38, -0.40);
        tailGroup.add(tailTip);
      }
      bodyGroup.add(tailGroup);
      rig.userData.tailGroup = tailGroup;

      // 6. Ultra-Detailed Sculpted Head, Cheek Ruffs, Forehead "M" Stripes, Nose Bridge, Nostrils, Fangs & Glassy Eyes
      const headGroup = new THREE.Group();
      const headY = collarY + 0.16 * bodyScaleH;
      headGroup.position.set(0, headY, 0.08);
      bodyGroup.add(headGroup);
      rig.userData.headGroup = headGroup;
      rig.userData.baseHeadY = headY;

      const headRadius = isKing ? 0.22 : (isRook ? 0.20 : (isQueen ? 0.175 : 0.19));
      const headSphere = new THREE.Mesh(new THREE.SphereGeometry(headRadius, 26, 22), furMat);
      headSphere.scale.set(1.08, 0.98, 1.02);
      headSphere.castShadow = true;
      headGroup.add(headSphere);

      // Sleek cheekbones and delicate side cheek ruffs
      [-1, 1].forEach((cSide) => {
        const cx = cSide * headRadius * 0.72;
        const cheekMesh = new THREE.Mesh(
          new THREE.SphereGeometry(headRadius * 0.38, 14, 12),
          furMat
        );
        cheekMesh.scale.set(0.92, 0.82, 0.96);
        cheekMesh.position.set(cx, -0.024, headRadius * 0.42);
        headGroup.add(cheekMesh);

        // Delicate sleek whisker flank tufts
        [-0.015, -0.045].forEach((ty, ti) => {
          const tuft = new THREE.Mesh(
            new THREE.ConeGeometry(0.024 - ti * 0.003, 0.065 - ti * 0.01, 8),
            furMat
          );
          tuft.rotation.z = -cSide * (Math.PI * 0.45 + ti * 0.10);
          tuft.rotation.y = -cSide * 0.16;
          tuft.position.set(
            cSide * (headRadius * 1.05),
            ty,
            headRadius * (0.32 - ti * 0.08)
          );
          headGroup.add(tuft);
        });
      });

      // Forehead Tabby "M" Markings & Crown Fur Tuft between the Ears
      [-1, 1].forEach((fSide) => {
        const mStripe1 = new THREE.Mesh(
          new THREE.CylinderGeometry(0.008, 0.010, 0.085, 8),
          stripeMat
        );
        mStripe1.position.set(fSide * 0.032, headRadius * 0.56, headRadius * 0.82);
        mStripe1.rotation.x = -0.52;
        mStripe1.rotation.z = fSide * 0.22;
        headGroup.add(mStripe1);

        const mStripe2 = new THREE.Mesh(
          new THREE.CylinderGeometry(0.007, 0.009, 0.075, 8),
          stripeMat
        );
        mStripe2.position.set(fSide * 0.074, headRadius * 0.52, headRadius * 0.76);
        mStripe2.rotation.x = -0.48;
        mStripe2.rotation.z = -fSide * 0.28;
        headGroup.add(mStripe2);
      });

      // Cute 3-Spike Crown Fur Tuft on top of the head
      if (!isBishop && !isKnight) {
        [-0.022, 0, 0.022].forEach((tx, idx) => {
          const headTuft = new THREE.Mesh(
            new THREE.ConeGeometry(0.018, idx === 1 ? 0.065 : 0.048, 7),
            furMat
          );
          headTuft.position.set(tx, headRadius * 0.93, headRadius * 0.18);
          headTuft.rotation.x = 0.24;
          headTuft.rotation.z = -tx * 4.5;
          headGroup.add(headTuft);
        });
      }

      // Rook & Knight Seal-Point Dark Brown Eye/Face Mask
      if (isRook || isKnight) {
        [-0.075, 0.075].forEach((mx) => {
          const maskPatch = new THREE.Mesh(new THREE.SphereGeometry(0.090, 14, 12), sealPointMat);
          maskPatch.scale.set(1.16, 0.96, 0.66);
          maskPatch.position.set(mx, 0.02, headRadius * 0.76);
          headGroup.add(maskPatch);
        });
      }

      // Sculpted Nose Bridge Ridge connecting Forehead to Nose Tip
      const noseBridge = new THREE.Mesh(
        new THREE.BoxGeometry(0.046, 0.078, 0.055),
        isRook || isKnight ? sealPointMat : furMat
      );
      noseBridge.position.set(0, 0.024, headRadius * 0.95);
      noseBridge.rotation.x = -0.22;
      headGroup.add(noseBridge);

      // Sculpted Muzzle Pads (Peanut Whisker Pads) & Whisker Follicle Dots
      [-0.050, 0.050].forEach((mx) => {
        const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.070, 16, 14), isKnight ? sealPointMat : muzzleMat);
        cheek.scale.set(1.16, 0.90, 0.98);
        cheek.position.set(mx, -0.042, headRadius * 0.89);
        headGroup.add(cheek);

        // 3 Tiny Dark Whisker Follicle Dots on each muzzle pad
        [-0.018, 0, 0.018].forEach((fx, fi) => {
          const dot = new THREE.Mesh(
            new THREE.SphereGeometry(0.0055, 6, 6),
            darkGrooveMat
          );
          dot.position.set(mx + (mx > 0 ? 0.024 : -0.024) + fx * 0.4, -0.036 - (fi % 2) * 0.012, headRadius * 1.06);
          headGroup.add(dot);
        });
      });

      // Sculpted Lower Chin Cushion beneath the Mouth
      const chinMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.048, 12, 10),
        bellyMat
      );
      chinMesh.scale.set(1.22, 0.68, 0.88);
      chinMesh.position.set(0, -0.082, headRadius * 0.86);
      headGroup.add(chinMesh);

      // Sculpted Rounded Triangular Nose Pad with 2 Nostrils & Vertical Philtrum Groove
      const noseMesh = new THREE.Mesh(
        new THREE.ConeGeometry(0.038, 0.046, 4),
        new THREE.MeshStandardMaterial({ color: '#fb7185', roughness: 0.34 })
      );
      noseMesh.rotation.x = Math.PI / 2;
      noseMesh.rotation.z = Math.PI / 4;
      noseMesh.position.set(0, -0.010, headRadius * 1.06);
      headGroup.add(noseMesh);

      // Left & Right Nostril Indentations on the Nose Pad
      [-0.013, 0.013].forEach((nx) => {
        const nostril = new THREE.Mesh(
          new THREE.SphereGeometry(0.0065, 6, 6),
          darkGrooveMat
        );
        nostril.scale.set(0.8, 1.3, 0.6);
        nostril.position.set(nx, -0.015, headRadius * 1.10);
        headGroup.add(nostril);
      });

      // Vertical Philtrum Groove connecting Nose Tip to Mouth
      const philtrum = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0045, 0.0045, 0.028, 6),
        darkGrooveMat
      );
      philtrum.position.set(0, -0.030, headRadius * 1.03);
      headGroup.add(philtrum);

      // Sculpted Inverted-V Frown / Mouth Groove + Openable Jaw Cavity + Tiny White Fangs + 3D Pink Tongue
      const mouthGroup = new THREE.Group();
      mouthGroup.position.set(0, -0.056, headRadius * 0.98);
      [-1, 1].forEach((mSide) => {
        const frownLine = new THREE.Mesh(
          new THREE.CylinderGeometry(0.007, 0.008, 0.068, 8),
          darkGrooveMat
        );
        frownLine.position.set(mSide * 0.024, 0, 0.01);
        frownLine.rotation.z = mSide * 0.68;
        mouthGroup.add(frownLine);
      });

      // Openable Dark Mouth Cavity + 2 Tiny White Upper Canine Fangs (visible when yawning/licking!)
      const mouthOpenMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.034, 14, 12),
        new THREE.MeshBasicMaterial({ color: '#4c0519' })
      );
      mouthOpenMesh.scale.set(1.12, 0.1, 0.62);
      mouthOpenMesh.position.set(0, -0.012, 0.005);
      mouthOpenMesh.visible = false;

      [-0.016, 0.016].forEach((fx) => {
        const fang = new THREE.Mesh(
          new THREE.ConeGeometry(0.0055, 0.016, 6),
          ivoryClawMat
        );
        fang.rotation.x = Math.PI;
        fang.position.set(fx, 0.012, 0.018);
        mouthOpenMesh.add(fang);
      });

      mouthGroup.add(mouthOpenMesh);
      rig.userData.mouthOpenMesh = mouthOpenMesh;

      // 3D Articulated Pink Cat Tongue with central groove
      const tongueGroup = new THREE.Group();
      tongueGroup.position.set(0, -0.014, 0.018);
      const tongueBlade = new THREE.Mesh(
        new THREE.SphereGeometry(0.028, 14, 12),
        pinkTongueMat
      );
      tongueBlade.scale.set(0.92, 0.34, 1.88);
      tongueBlade.position.set(0, -0.006, 0.028);
      tongueBlade.rotation.x = 0.25;
      tongueGroup.add(tongueBlade);
      tongueGroup.visible = false;
      mouthGroup.add(tongueGroup);
      rig.userData.tongueGroup = tongueGroup;

      headGroup.add(mouthGroup);
      rig.userData.mouthGroup = mouthGroup;

      // 2 Thick Sculpted Relief Whisker Stubs + 3 Long Tapered Whiskers per Cheek
      [-1, 1].forEach((side) => {
        [-0.028, -0.054].forEach((wy, wi) => {
          const stub = new THREE.Mesh(
            new THREE.CylinderGeometry(0.010, 0.008, 0.068, 8),
            furMat
          );
          stub.rotation.z = (Math.PI / 2) + side * (wi === 0 ? -0.08 : 0.10);
          stub.rotation.y = side * 0.32;
          stub.position.set(side * (headRadius * 0.68), wy, headRadius * 0.84);
          headGroup.add(stub);
        });

        [-0.09, -0.01, 0.07].forEach((angZ, wi) => {
          const wMesh = new THREE.Mesh(
            new THREE.CylinderGeometry(0.0032, 0.0015, isKing ? 0.26 : 0.20, 6),
            new THREE.MeshBasicMaterial({ color: isWhite ? '#475569' : '#e2e8f0' })
          );
          wMesh.rotation.z = (Math.PI / 2) + side * angZ;
          wMesh.rotation.y = side * 0.24;
          wMesh.position.set(side * (isKing ? 0.175 : 0.145), -0.028 - wi * 0.013, headRadius * 0.85);
          headGroup.add(wMesh);
        });
      });

      // Sculpted Central Forehead Furrow Crease & Articulated 3D Brow Ridges
      const browFurrow = new THREE.Mesh(
        new THREE.CylinderGeometry(0.008, 0.010, 0.068, 8),
        darkGrooveMat
      );
      browFurrow.position.set(0, 0.056, headRadius * 0.96);
      headGroup.add(browFurrow);
      rig.userData.browFurrow = browFurrow;

      const brows = [];
      [-1, 1].forEach((bSide) => {
        const browPivot = new THREE.Group();
        browPivot.position.set(bSide * 0.076, 0.062, headRadius * 0.92);

        const browRidge = new THREE.Mesh(
          new THREE.CylinderGeometry(0.022, 0.024, 0.128, 12),
          furMat
        );
        browRidge.rotation.z = Math.PI / 2;
        browRidge.scale.set(1.0, 1.0, 1.38);
        browPivot.add(browRidge);

        const defaultScowl = (isKing || isRook || isKnight) ? 0.24 : 0.14;
        browPivot.rotation.z = bSide * defaultScowl;
        headGroup.add(browPivot);
        brows.push(browPivot);
      });
      rig.userData.brows = brows;

      // Detailed Cat Ears with Recessed Inner Pinna, Inner Ear Fur Fluff & Lynx Ear-Tip Tufts
      const earOuterMat = (isRook || isKnight) ? sealPointMat : furMat;
      const earL = new THREE.Group();
      const earR = new THREE.Group();

      const earH = isQueen ? 0.22 : 0.185;
      const earGeo = new THREE.ConeGeometry(0.086, earH, 14);
      earGeo.scale(1.06, 1.0, 0.74);
      const innerEarGeo = new THREE.ConeGeometry(0.054, earH * 0.70, 12);
      innerEarGeo.scale(1.0, 1.0, 0.55);

      [
        [earL, -0.135, isPawn ? 0.36 : 0.24, -0.18],
        [earR,  0.135, isPawn ? -0.36 : -0.24, 0.18]
      ].forEach(([earGrp, exPos, rotZ, rotY]) => {
        earGrp.position.set(exPos, headRadius * 0.80, -0.01);
        earGrp.rotation.z = rotZ;
        earGrp.rotation.y = rotY;

        const earOuter = new THREE.Mesh(earGeo, earOuterMat);
        earOuter.castShadow = true;
        const earInner = new THREE.Mesh(innerEarGeo, innerEarMat);
        earInner.position.set(0, -0.01, 0.026);

        // Fluffy white/cream inner ear fur tuft
        const earFluff = new THREE.Mesh(
          new THREE.SphereGeometry(0.028, 8, 8),
          bellyMat
        );
        earFluff.scale.set(1.2, 0.65, 0.7);
        earFluff.position.set(0, -earH * 0.28, 0.032);

        // Pointed lynx ear-tip fur tuft
        const lynxTip = new THREE.Mesh(
          new THREE.ConeGeometry(0.014, 0.042, 6),
          earOuterMat
        );
        lynxTip.position.set(0, earH * 0.56, 0);

        earGrp.add(earOuter, earInner, earFluff, lynxTip);
      });

      headGroup.add(earL, earR);
      rig.userData.earL = earL;
      rig.userData.earR = earR;

      // 7. Large, Luminous, Almond-Shaped Feline Eyes with Dark Eyeliner & Dual Catchlights
      const eyeRadius = (isPawn || isBishop) ? 0.070 : (isQueen ? 0.065 : 0.062);
      const upperLids = [];
      const closedEyeLines = [];
      const eyeBallGroups = [];
      const pupilMeshes = [];

      [-1, 1].forEach((sideSign, eyeIdx) => {
        const ex = sideSign * (headRadius * 0.40);
        const eyeGroup = new THREE.Group();
        // Positioned forward on the facial curve (headRadius * 1.01) so eyes clearly pop out of fur
        eyeGroup.position.set(ex, 0.038, headRadius * 1.01);
        eyeGroup.rotation.y = sideSign * 0.12;
        eyeGroup.rotation.z = -sideSign * 0.14; // Feline almond cat-eye tilt

        // Dark eyeliner rim outlining the eye
        const socketRim = new THREE.Mesh(
          new THREE.TorusGeometry(eyeRadius * 1.05, 0.009, 8, 24),
          darkGrooveMat
        );
        socketRim.scale.set(1.0, 1.15, 1.0);
        socketRim.position.z = 0.006;
        eyeGroup.add(socketRim);

        const eyeBallWrap = new THREE.Group();
        // Rich jewel-toned iris sphere
        const iris = new THREE.Mesh(
          new THREE.SphereGeometry(eyeRadius, 20, 18),
          eyeMat
        );
        iris.scale.set(1.0, 1.12, 0.65);
        eyeBallWrap.add(iris);

        // Vertical feline slit pupil
        const pupil = new THREE.Mesh(
          new THREE.SphereGeometry(eyeRadius * 0.48, 14, 12),
          pupilMat
        );
        pupil.scale.set(0.42, 1.30, 0.65);
        pupil.position.z = eyeRadius * 0.42;
        eyeBallWrap.add(pupil);
        pupilMeshes.push(pupil);

        // Primary glassy white catchlight (top corner)
        const catchlight1 = new THREE.Mesh(
          new THREE.SphereGeometry(eyeRadius * 0.28, 10, 10),
          catchlightMat
        );
        catchlight1.position.set(-sideSign * eyeRadius * 0.22, eyeRadius * 0.34, eyeRadius * 0.62);
        eyeBallWrap.add(catchlight1);

        // Secondary pin-point catchlight (bottom corner)
        const catchlight2 = new THREE.Mesh(
          new THREE.SphereGeometry(eyeRadius * 0.14, 8, 8),
          catchlightMat
        );
        catchlight2.position.set(sideSign * eyeRadius * 0.20, -eyeRadius * 0.24, eyeRadius * 0.60);
        eyeBallWrap.add(catchlight2);

        eyeGroup.add(eyeBallWrap);
        eyeBallGroups.push(eyeBallWrap);

        // Upper Eyelid: kept tucked UP (-0.38 rad) when open so eyes are 100% visible
        const upperLid = new THREE.Mesh(
          new THREE.SphereGeometry(eyeRadius * 1.14, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.52),
          furMat
        );
        upperLid.scale.set(1.10, 1.02, 0.76);
        upperLid.rotation.x = -0.38;
        eyeGroup.add(upperLid);
        upperLids.push(upperLid);

        // Curved dark closed-eye line (only shown during full closed blink)
        const closedArc = new THREE.Mesh(
          new THREE.TorusGeometry(eyeRadius * 0.88, 0.008, 6, 14, Math.PI * 0.88),
          darkGrooveMat
        );
        closedArc.rotation.z = Math.PI * 1.08;
        closedArc.position.set(0, -0.004, eyeRadius * 0.64);
        closedArc.visible = false;
        eyeGroup.add(closedArc);
        closedEyeLines.push(closedArc);

        headGroup.add(eyeGroup);
      });
      rig.userData.upperLids = upperLids;
      rig.userData.closedEyeLines = closedEyeLines;
      rig.userData.eyeBallGroups = eyeBallGroups;
      rig.userData.pupilMeshes = pupilMeshes;

      // 7. Role Crowns, Mitres, Royal Capes & Medieval Helmets
      if (isKing) {
        const crownGroup = new THREE.Group();
        crownGroup.position.set(0, headRadius * 0.85, 0.01);

        // Velvet inner cushion inside the golden crown
        const velvetCap = new THREE.Mesh(
          new THREE.SphereGeometry(0.115, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55),
          rubyMat
        );
        velvetCap.position.y = 0.04;
        crownGroup.add(velvetCap);

        const crownBase = new THREE.Mesh(new THREE.CylinderGeometry(0.138, 0.120, 0.14, 24), goldMat);
        crownBase.position.y = 0.07;
        crownGroup.add(crownBase);

        for (let ci = 0; ci < 5; ci++) {
          const ang = (ci / 5) * Math.PI * 2;
          const sx = Math.sin(ang) * 0.124;
          const sz = Math.cos(ang) * 0.124;

          const spike = new THREE.Mesh(new THREE.ConeGeometry(0.038, 0.16, 10), goldMat);
          spike.position.set(sx, 0.20, sz);
          spike.rotation.x = Math.cos(ang) * 0.12;
          spike.rotation.z = -Math.sin(ang) * 0.12;
          crownGroup.add(spike);

          const tipBall = new THREE.Mesh(new THREE.SphereGeometry(0.023, 10, 10), goldMat);
          tipBall.position.set(sx * 1.12, 0.285, sz * 1.12);
          crownGroup.add(tipBall);

          const gemMat = (ci % 2 === 0) ? rubyMat : sapphireMat;
          const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.028, 0), gemMat);
          gem.position.set(Math.sin(ang) * 0.132, 0.068, Math.cos(ang) * 0.132);
          crownGroup.add(gem);
        }
        headGroup.add(crownGroup);

        // Royal Ermine-Trimmed Velvet Cape on the King's Back
        const kingCape = new THREE.Mesh(
          new THREE.CylinderGeometry(0.22, 0.38, 0.44, 18, 1, true, Math.PI * 0.52, Math.PI * 0.96),
          rubyMat
        );
        kingCape.position.set(0, 0.34 * bodyScaleH, -0.05);
        bodyGroup.add(kingCape);
      } else if (isQueen) {
        const qCrownGroup = new THREE.Group();
        qCrownGroup.position.set(0, headRadius * 0.84, 0.0);

        const qBand = new THREE.Mesh(new THREE.CylinderGeometry(0.114, 0.098, 0.10, 22), goldMat);
        qBand.position.y = 0.05;
        qCrownGroup.add(qBand);

        const qRim = new THREE.Mesh(new THREE.TorusGeometry(0.114, 0.016, 10, 24), goldMat);
        qRim.rotation.x = Math.PI / 2;
        qRim.position.y = 0.10;
        qCrownGroup.add(qRim);

        const qDome = new THREE.Mesh(
          new THREE.SphereGeometry(0.106, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.55),
          goldMat
        );
        qDome.position.y = 0.095;
        qCrownGroup.add(qDome);

        const qFinial = new THREE.Mesh(new THREE.OctahedronGeometry(0.028, 0), sapphireMat);
        qFinial.position.y = 0.215;
        qCrownGroup.add(qFinial);

        headGroup.add(qCrownGroup);
        rig.userData.mysticHalo = qCrownGroup;
      } else if (isBishop) {
        const mitreGroup = new THREE.Group();
        mitreGroup.position.set(0, headRadius * 0.80, -0.02);
        mitreGroup.rotation.x = -0.14;

        const mitreCone = new THREE.Mesh(new THREE.ConeGeometry(0.148, 0.36, 18), mitreClothMat);
        mitreCone.scale.set(1.06, 1.0, 0.78);
        mitreCone.position.y = 0.16;
        mitreGroup.add(mitreCone);

        const mitreGoldBand = new THREE.Mesh(new THREE.CylinderGeometry(0.142, 0.148, 0.044, 18), goldMat);
        mitreGoldBand.scale.set(1.06, 1.0, 0.78);
        mitreGoldBand.position.y = 0.01;
        mitreGroup.add(mitreGoldBand);

        const mitreEmblem = new THREE.Mesh(new THREE.SphereGeometry(0.026, 10, 10), goldMat);
        mitreEmblem.scale.set(0.8, 1.4, 0.5);
        mitreEmblem.position.set(0, 0.13, 0.095);
        mitreGroup.add(mitreEmblem);

        headGroup.add(mitreGroup);

        const cape = new THREE.Mesh(
          new THREE.CylinderGeometry(0.16, 0.26, 0.36, 16, 1, true, Math.PI * 0.55, Math.PI * 0.9),
          mitreClothMat
        );
        cape.position.set(0, 0.34 * bodyScaleH, -0.03);
        bodyGroup.add(cape);
      } else if (isKnight) {
        const helmGroup = new THREE.Group();
        helmGroup.position.set(0, 0.02, 0);

        const domeHelm = new THREE.Mesh(
          new THREE.SphereGeometry(headRadius * 1.10, 22, 16, 0, Math.PI * 2, 0, Math.PI * 0.56),
          steelHelmMat
        );
        helmGroup.add(domeHelm);

        const helmRim = new THREE.Mesh(
          new THREE.TorusGeometry(headRadius * 1.04, 0.016, 10, 24),
          goldMat
        );
        helmRim.rotation.x = Math.PI / 2 + 0.08;
        helmRim.position.y = 0.02;
        helmGroup.add(helmRim);

        const nasalGuard = new THREE.Mesh(
          new THREE.BoxGeometry(0.026, 0.095, 0.024),
          steelHelmMat
        );
        nasalGuard.position.set(0, 0.0, headRadius * 1.06);
        helmGroup.add(nasalGuard);

        // Knight Plume Crest on top of the helmet
        const plume = new THREE.Mesh(
          new THREE.ConeGeometry(0.038, 0.14, 10),
          collarMat
        );
        plume.rotation.x = -0.45;
        plume.position.set(0, headRadius * 1.12, -0.04);
        helmGroup.add(plume);

        headGroup.add(helmGroup);
      } else if (isRook) {
        // Crenellated Castle Battlement Crown on the Rook Cat
        const rookTowerGroup = new THREE.Group();
        rookTowerGroup.position.set(0, headRadius * 0.86, 0);
        const towerBase = new THREE.Mesh(
          new THREE.CylinderGeometry(0.092, 0.082, 0.075, 12),
          goldMat
        );
        rookTowerGroup.add(towerBase);
        for (let bi = 0; bi < 6; bi++) {
          const bAng = (bi / 6) * Math.PI * 2;
          const merlon = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.036, 0.028), goldMat);
          merlon.position.set(Math.cos(bAng) * 0.076, 0.052, Math.sin(bAng) * 0.076);
          merlon.rotation.y = -bAng;
          rookTowerGroup.add(merlon);
        }
        headGroup.add(rookTowerGroup);
      }

      rig.rotation.y = isWhite ? Math.PI : 0;
      return rig;
    }

    // Trigger a specific sitting cat animation/expression across all 32 cats on the board!
    function triggerCatBehaviorOnBoard(behaviorName) {
      const nowMs = performance.now();
      Object.values(catRigsBySquare).forEach((rig, idx) => {
        if (!rig || !rig.userData) return;
        rig.userData.behaviorState = behaviorName;
        rig.userData.behaviorStart = nowMs - (idx % 4) * 120;
        rig.userData.behaviorDuration = 3800;
      });
      if (behaviorName === 'yawning' || behaviorName === 'lickingPaw') {
        playCatMeowVariation(true);
      } else {
        playSoundEffect('click');
      }
    }

    // =========================================================================
    // BUILD COLORFUL ITALIAN COASTAL VILLAGE & PLAZA MAP (EXACT IMAGE_983184.JPG)
    // Turquoise, Sunny Orange, Coral Pink, Crimson & Olive Italian Townhouses
    // with Green Louvered Shutters, Iron Balconies, Tall Narrow Cypress Trees,
    // Glowing Yellow Streetlamp on the Left, plus Interactive Laser & Yarn Toys!
    // =========================================================================
    function buildInteractiveDioramaWorld() {
      if (!dioramaGroup3d) return;
      while (dioramaGroup3d.children.length > 0) {
        dioramaGroup3d.remove(dioramaGroup3d.children[0]);
      }
      interactivePropMeshes.length = 0;
      dioramaProps.seagullsList = [];
      dioramaProps.boatsList = [];
      dioramaProps.cloudsList = [];

      const theme = BOARD_THEMES[appState.themeId] || BOARD_THEMES.classic;
      const tid = appState.themeId || 'classic';
      const isClassic = (tid === 'classic');

      // 1. Cobblestone Paved Plaza Courtyard Deck + Carved Stone Border Trim
      const courtyardFloor = new THREE.Mesh(
        new THREE.BoxGeometry(28, 0.42, 26),
        new THREE.MeshStandardMaterial({
          color: theme.courtyardColor,
          map: getProceduralCobblestoneTexture(),
          roughness: 0.72,
          metalness: 0.05
        })
      );
      courtyardFloor.position.set(0, -0.43, 0.5);
      courtyardFloor.receiveShadow = true;
      dioramaGroup3d.add(courtyardFloor);

      // Ornate Octagonal Plaza Inlay Mosaic Ring around the Chessboard
      const mosaicRing = new THREE.Mesh(
        new THREE.RingGeometry(5.35, 5.85, 32),
        new THREE.MeshStandardMaterial({
          color: theme.rimColor || '#c29b61',
          roughness: 0.42,
          metalness: 0.25,
          side: THREE.DoubleSide
        })
      );
      mosaicRing.rotation.x = -Math.PI / 2;
      mosaicRing.position.set(0, -0.20, 0);
      dioramaGroup3d.add(mosaicRing);

      // 2. Sparkling Sea / Water Plane with Higher Vertex Detail for Waves
      const seaGeo = new THREE.PlaneGeometry(95, 75, 36, 36);
      const seaMat = new THREE.MeshStandardMaterial({
        color: theme.waterColor,
        roughness: 0.14,
        metalness: 0.42
      });
      const seaMesh = new THREE.Mesh(seaGeo, seaMat);
      seaMesh.rotation.x = -Math.PI / 2;
      seaMesh.position.set(8, -0.75, -18);
      dioramaGroup3d.add(seaMesh);
      dioramaProps.seaWaterMesh = seaMesh;

      // 3. Stone Promenade Balustrade Railing with Carved Balusters & Pillars behind the Chessboard
      const wallStoneMat = new THREE.MeshStandardMaterial({ color: '#94a3b8', roughness: 0.68 });
      const darkStoneMat = new THREE.MeshStandardMaterial({ color: '#64748b', roughness: 0.75 });

      const curbBase = new THREE.Mesh(new THREE.BoxGeometry(26, 0.32, 0.62), darkStoneMat);
      curbBase.position.set(0, -0.06, -6.8);
      curbBase.receiveShadow = true;
      dioramaGroup3d.add(curbBase);

      const topRail = new THREE.Mesh(new THREE.BoxGeometry(26, 0.16, 0.48), wallStoneMat);
      topRail.position.set(0, 0.72, -6.8);
      topRail.castShadow = true;
      dioramaGroup3d.add(topRail);

      for (let bx = -12.0; bx <= 12.0; bx += 0.8) {
        const isPillar = Math.abs(bx % 4.0) < 0.05;
        if (isPillar) {
          const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.85, 0.54), wallStoneMat);
          pillar.position.set(bx, 0.34, -6.8);
          pillar.castShadow = true;
          dioramaGroup3d.add(pillar);

          const finial = new THREE.Mesh(new THREE.SphereGeometry(0.20, 12, 10), wallStoneMat);
          finial.position.set(bx, 0.94, -6.8);
          dioramaGroup3d.add(finial);
        } else {
          const baluster = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.11, 0.62, 10), wallStoneMat);
          baluster.position.set(bx, 0.36, -6.8);
          baluster.castShadow = true;
          dioramaGroup3d.add(baluster);
        }
      }

      // 4. Ultra-Detailed Italian Coastal Townhouses with Chimneys, Awning Canopies, Arched Doors & Window Flower Boxes
      const villageHouses = [
        { x: -10.2, z: -10.5, w: 3.8, h: 7.5, d: 3.8, color: isClassic ? '#658354' : theme.wallColor },
        { x:  -6.4, z: -10.9, w: 3.5, h: 6.8, d: 3.6, color: isClassic ? '#b91c1c' : theme.wallAltColor },
        { x:  -2.5, z: -10.3, w: 4.1, h: 8.3, d: 4.0, color: isClassic ? '#2bb3c0' : theme.wallColor },
        { x:   1.6, z: -10.7, w: 3.8, h: 7.7, d: 3.8, color: isClassic ? '#f59e0b' : theme.wallAltColor },
        { x:   5.4, z: -10.9, w: 3.6, h: 8.1, d: 3.8, color: isClassic ? '#f472b6' : theme.wallColor },
        { x:   9.2, z: -10.1, w: 4.2, h: 7.3, d: 4.2, color: isClassic ? '#ea580c' : theme.wallAltColor }
      ];

      const shutterMat = new THREE.MeshStandardMaterial({ color: '#3f6212', roughness: 0.55 });
      const frameTrimMat = new THREE.MeshStandardMaterial({ color: '#fef3c7', roughness: 0.5 });
      const winGlassMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.18, metalness: 0.55 });
      const warmLitWinMat = new THREE.MeshBasicMaterial({ color: '#fef08a' });
      const balconyIronMat = new THREE.MeshStandardMaterial({ color: '#18181b', roughness: 0.4, metalness: 0.7 });
      const roofTileMat = new THREE.MeshStandardMaterial({ color: theme.roofColor || '#992b15', roughness: 0.62 });
      const woodDoorMat = new THREE.MeshStandardMaterial({ color: '#5c3a21', roughness: 0.7 });

      villageHouses.forEach((b, hIdx) => {
        const hGroup = new THREE.Group();
        hGroup.position.set(b.x, 0, b.z);

        const wallMesh = new THREE.Mesh(
          new THREE.BoxGeometry(b.w, b.h, b.d),
          new THREE.MeshStandardMaterial({ color: b.color, roughness: 0.68 })
        );
        wallMesh.position.y = b.h * 0.5;
        wallMesh.castShadow = true;
        wallMesh.receiveShadow = true;
        hGroup.add(wallMesh);

        // Decorative Stone Stringcourse Moldings between floors
        [0.4, 3.9, b.h - 0.12].forEach((my) => {
          const molding = new THREE.Mesh(
            new THREE.BoxGeometry(b.w + 0.14, 0.16, b.d + 0.14),
            frameTrimMat
          );
          molding.position.y = my;
          hGroup.add(molding);
        });

        // Pitched Terracotta Roof + Chimney Stack with Clay Pot
        const roof = new THREE.Mesh(new THREE.ConeGeometry(b.w * 0.79, 1.5, 4), roofTileMat);
        roof.position.set(0, b.h + 0.72, 0);
        roof.rotation.y = Math.PI / 4;
        hGroup.add(roof);

        const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.48, 1.15, 0.48), frameTrimMat);
        chimney.position.set((hIdx % 2 === 0 ? 1 : -1) * (b.w * 0.25), b.h + 0.85, -0.3);
        hGroup.add(chimney);
        const chimneyPot = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.32, 10), roofTileMat);
        chimneyPot.position.set(chimney.position.x, b.h + 1.52, -0.3);
        hGroup.add(chimneyPot);

        // Ground-Floor Arched Wooden Door + Striped Café Awning Canopy
        const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.85, 0.12), frameTrimMat);
        doorFrame.position.set(0, 0.95, b.d * 0.5 + 0.02);
        hGroup.add(doorFrame);

        const doorPanel = new THREE.Mesh(new THREE.BoxGeometry(0.92, 1.72, 0.14), woodDoorMat);
        doorPanel.position.set(0, 0.92, b.d * 0.5 + 0.04);
        hGroup.add(doorPanel);

        const awning = new THREE.Mesh(
          new THREE.CylinderGeometry(0.05, 0.85, 1.45, 4, 1, false, 0, Math.PI),
          new THREE.MeshStandardMaterial({ color: hIdx % 2 === 0 ? '#dc2626' : '#0284c7', roughness: 0.6 })
        );
        awning.rotation.z = Math.PI / 2;
        awning.rotation.y = Math.PI / 2;
        awning.position.set(0, 2.02, b.d * 0.5 + 0.35);
        hGroup.add(awning);

        // 2 Upper Floors of Windows with Shutters, Flower Boxes & Wrought-Iron Balconies
        [3.1, 5.4].forEach((wy, floorIdx) => {
          [-b.w * 0.25, b.w * 0.25].forEach((wx, wSideIdx) => {
            const trim = new THREE.Mesh(new THREE.BoxGeometry(0.84, 1.18, 0.10), frameTrimMat);
            trim.position.set(wx, wy, b.d * 0.5 + 0.02);
            hGroup.add(trim);

            const isWarmLit = ((hIdx + floorIdx + wSideIdx) % 3 === 0);
            const glass = new THREE.Mesh(
              new THREE.BoxGeometry(0.64, 0.96, 0.12),
              isWarmLit ? warmLitWinMat : winGlassMat
            );
            glass.position.set(wx, wy, b.d * 0.5 + 0.03);
            hGroup.add(glass);

            // Window Mullion Crossbars
            const vBar = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.96, 0.14), frameTrimMat);
            vBar.position.set(wx, wy, b.d * 0.5 + 0.04);
            const hBar = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.04, 0.14), frameTrimMat);
            hBar.position.set(wx, wy + 0.08, b.d * 0.5 + 0.04);
            hGroup.add(vBar, hBar);

            // Green Louvered Shutters
            [-0.48, 0.48].forEach((sx) => {
              const shutter = new THREE.Mesh(new THREE.BoxGeometry(0.28, 1.12, 0.14), shutterMat);
              shutter.position.set(wx + sx, wy, b.d * 0.5 + 0.05);
              hGroup.add(shutter);
            });

            // Flower Box with 3D Flowers under every window
            const flowerBox = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.16, 0.22), woodDoorMat);
            flowerBox.position.set(wx, wy - 0.58, b.d * 0.5 + 0.12);
            hGroup.add(flowerBox);
            [-0.22, 0, 0.22].forEach((fx) => {
              const fl = create3DBlossomFlowerCluster(0.75, '#fb7185', '#fde047');
              fl.position.set(wx + fx, wy - 0.46, b.d * 0.5 + 0.14);
              hGroup.add(fl);
            });

            if (floorIdx === 1) {
              const balc = new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.36, 0.36), balconyIronMat);
              balc.position.set(wx, wy - 0.42, b.d * 0.5 + 0.16);
              hGroup.add(balc);
            }
          });
        });

        dioramaGroup3d.add(hGroup);
      });

      // 5. Distant 3D Background Horizon: Coastal Mountain Cliffs, Striped Lighthouse, Sailboats, 3D Clouds & Seagulls!
      const cliffMat = new THREE.MeshStandardMaterial({
        color: tid === 'winter' ? '#cbd5e1' : (tid === 'volcano' ? '#292524' : '#475569'),
        roughness: 0.88
      });
      const cliffTopMat = new THREE.MeshStandardMaterial({
        color: tid === 'winter' ? '#f8fafc' : (theme.treeFoliage || '#2d6a3e'),
        roughness: 0.75
      });

      [
        [-22, -26, 9.5, 11.5],
        [-14, -28, 8.0,  9.2],
        [ 15, -27, 8.5, 10.4],
        [ 24, -24, 9.8, 12.2],
        [ 30, -16, 7.5,  8.5]
      ].forEach(([mx, mz, mr, mh]) => {
        const mCone = new THREE.Mesh(new THREE.ConeGeometry(mr, mh, 7), cliffMat);
        mCone.position.set(mx, mh * 0.42 - 1.0, mz);
        dioramaGroup3d.add(mCone);

        const mCap = new THREE.Mesh(new THREE.ConeGeometry(mr * 0.56, mh * 0.45, 7), cliffTopMat);
        mCap.position.set(mx, mh * 0.72 - 1.0, mz);
        dioramaGroup3d.add(mCap);
      });

      // Distant Striped Coastal Lighthouse on the Right Headland ([18.5, 0, -19.5])
      const lighthouseGroup = new THREE.Group();
      lighthouseGroup.position.set(18.5, -0.5, -19.5);
      const lhRock = new THREE.Mesh(new THREE.DodecahedronGeometry(2.4, 1), cliffMat);
      lhRock.scale.set(1.4, 0.65, 1.2);
      lighthouseGroup.add(lhRock);

      for (let li = 0; li < 4; li++) {
        const lhSeg = new THREE.Mesh(
          new THREE.CylinderGeometry(0.58 - li * 0.06, 0.64 - li * 0.06, 1.2, 14),
          new THREE.MeshStandardMaterial({ color: li % 2 === 0 ? '#f8fafc' : '#dc2626', roughness: 0.5 })
        );
        lhSeg.position.y = 0.9 + li * 1.18;
        lighthouseGroup.add(lhSeg);
      }
      const lhLantern = new THREE.Mesh(
        new THREE.CylinderGeometry(0.42, 0.42, 0.65, 12),
        new THREE.MeshBasicMaterial({ color: '#fde047' })
      );
      lhLantern.position.y = 5.35;
      lighthouseGroup.add(lhLantern);
      const lhDome = new THREE.Mesh(new THREE.ConeGeometry(0.52, 0.55, 12), roofTileMat);
      lhDome.position.y = 5.92;
      lighthouseGroup.add(lhDome);
      dioramaGroup3d.add(lighthouseGroup);

      // 2 Gently Bobbing Wooden Sailboats on the Sea
      [
        [ 9.5, -15.5, 1.0, 0.3],
        [16.2, -13.2, 0.85, -0.4]
      ].forEach(([bx, bz, bScale, bRotY], bIdx) => {
        const boatGroup = new THREE.Group();
        boatGroup.position.set(bx, -0.68, bz);
        boatGroup.scale.setScalar(bScale);
        boatGroup.rotation.y = bRotY;

        const hull = new THREE.Mesh(
          new THREE.CylinderGeometry(0.48, 0.28, 1.65, 10),
          woodDoorMat
        );
        hull.rotation.z = Math.PI / 2;
        hull.scale.set(0.65, 1.0, 0.55);
        boatGroup.add(hull);

        const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 2.1, 8), frameTrimMat);
        mast.position.y = 1.05;
        boatGroup.add(mast);

        const sailGeo = new THREE.BufferGeometry();
        const verts = new Float32Array([
          0, 0.35, 0,
          0, 1.95, 0,
          0.95, 0.45, 0
        ]);
        sailGeo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
        sailGeo.computeVertexNormals();
        const sail = new THREE.Mesh(
          sailGeo,
          new THREE.MeshStandardMaterial({ color: '#ffffff', side: THREE.DoubleSide, roughness: 0.4 })
        );
        boatGroup.add(sail);

        dioramaGroup3d.add(boatGroup);
        dioramaProps.boatsList.push({ group: boatGroup, baseY: -0.68, phase: bIdx * 2.1 });
      });

      // 5 Fluffy 3D Cloud Clusters Drifting Across the Sky
      const cloudMat = new THREE.MeshStandardMaterial({
        color: '#ffffff',
        roughness: 0.9,
        transparent: true,
        opacity: 0.88
      });
      [
        [-14, 11.5, -18, 1.25],
        [ -4, 12.8, -21, 1.45],
        [  7, 11.2, -19, 1.15],
        [ 16, 12.2, -17, 1.35],
        [-10, 10.5, -12, 0.95]
      ].forEach(([cx, cy, cz, cScale], cIdx) => {
        const cloudGrp = new THREE.Group();
        cloudGrp.position.set(cx, cy, cz);
        cloudGrp.scale.setScalar(cScale);
        [
          [0, 0, 0, 1.1],
          [-0.85, -0.15, 0.1, 0.82],
          [ 0.88, -0.12, -0.1, 0.86],
          [ 0.35,  0.38, 0.15, 0.74],
          [-0.38,  0.32, -0.1, 0.70]
        ].forEach(([px, py, pz, pr]) => {
          const puff = new THREE.Mesh(new THREE.SphereGeometry(pr, 12, 10), cloudMat);
          puff.scale.set(1.25, 0.72, 0.9);
          puff.position.set(px, py, pz);
          cloudGrp.add(puff);
        });
        dioramaGroup3d.add(cloudGrp);
        dioramaProps.cloudsList.push({ group: cloudGrp, baseX: cx, phase: cIdx * 1.4 });
      });

      // 4 Animated 3D Gliding Seagulls Wheeling High Over the Harbor
      const gullMat = new THREE.MeshBasicMaterial({ color: '#ffffff', side: THREE.DoubleSide });
      for (let gi = 0; gi < 4; gi++) {
        const gullGrp = new THREE.Group();
        const wingL = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.14), gullMat);
        wingL.position.x = -0.20;
        wingL.rotation.x = Math.PI / 2;
        const wingR = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.14), gullMat);
        wingR.position.x = 0.20;
        wingR.rotation.x = Math.PI / 2;
        gullGrp.add(wingL, wingR);
        gullGrp.position.set(0, 7.5 + gi * 0.6, -11);
        dioramaGroup3d.add(gullGrp);
        dioramaProps.seagullsList.push({
          group: gullGrp,
          wingL,
          wingR,
          phase: (gi / 4) * Math.PI * 2,
          radius: 7.5 + gi * 1.4,
          height: 6.8 + gi * 0.55
        });
      }

      // 6. Map-Specific 3D Trees & Seasonal Plaza Planters
      animatedTreesList.length = 0;
      const f1 = theme.treeFoliage || '#2d6a3e';
      const f2 = theme.treeFoliageAlt || '#4d8b55';
      const mapHasTreeBlossoms = (tid === 'sakura' || tid === 'candy');
      const mapAllPines = (tid === 'winter' || tid === 'castle');

      [
        [-8.2, -8.3, 1.42, true],
        [-4.4, -8.5, 1.36, true],
        [-0.4, -8.3, 1.46, true],
        [ 3.6, -8.4, 1.38, true],
        [ 7.4, -8.2, 1.40, true],
        [-6.3, -4.8, 1.28, mapAllPines],
        [ 6.3, -4.8, 1.28, mapAllPines],
        [-6.5,  0.2, 1.18, mapAllPines],
        [ 6.5,  0.2, 1.18, mapAllPines],
        [-6.2,  4.6, 1.25, mapAllPines],
        [ 6.2,  4.6, 1.25, mapAllPines]
      ].forEach(([tx, tz, sc, isCyp]) => {
        const tree = createDetailed3DTree(tx, tz, sc, f1, f2, isCyp, mapHasTreeBlossoms);
        dioramaGroup3d.add(tree);
      });

      // Ornate Stone Plaza Planter Boxes around the Chessboard
      const planterBoxMat = new THREE.MeshStandardMaterial({
        color: tid === 'volcano' ? '#292524' : (tid === 'cyber' ? '#0f172a' : '#cbd5e1'),
        roughness: 0.72
      });
      const hedgeColor = tid === 'winter' ? '#e2e8f0'
        : (tid === 'sakura' ? '#be185d'
        : (tid === 'autumn' ? '#b45309'
        : (tid === 'volcano' ? '#44403c'
        : (tid === 'cyber' ? '#0891b2' : '#15803d'))));
      const hedgeMat = new THREE.MeshStandardMaterial({ color: hedgeColor, roughness: 0.65 });

      const flowerColorA = tid === 'sakura' ? '#fda4af'
        : (tid === 'winter' ? '#f8fafc'
        : (tid === 'autumn' ? '#ea580c'
        : (tid === 'cyber' ? '#22d3ee'
        : (tid === 'volcano' ? '#f97316'
        : (tid === 'castle' ? '#a5b4fc'
        : (tid === 'ocean' ? '#2dd4bf'
        : (tid === 'candy' ? '#f472b6'
        : (tid === 'desert' ? '#facc15' : '#fb7185'))))))));
      const flowerColorB = tid === 'sakura' ? '#fce7f3'
        : (tid === 'winter' ? '#bae6fd'
        : (tid === 'autumn' ? '#facc15'
        : (tid === 'cyber' ? '#e879f9'
        : (tid === 'volcano' ? '#ef4444'
        : (tid === 'castle' ? '#fde047'
        : (tid === 'ocean' ? '#bae6fd'
        : (tid === 'candy' ? '#fef08a'
        : (tid === 'desert' ? '#fb923c' : '#fde047'))))))));

      [
        [-3.2, -5.65, 2.2, 0.52],
        [ 3.2, -5.65, 2.2, 0.52],
        [-5.65, -2.3, 0.52, 2.0],
        [ 5.65, -2.3, 0.52, 2.0]
      ].forEach(([px, pz, pw, pd], pIdx) => {
        const planter = new THREE.Group();
        planter.position.set(px, -0.06, pz);
        const box = new THREE.Mesh(new THREE.BoxGeometry(pw, 0.36, pd), planterBoxMat);
        box.castShadow = true;
        box.receiveShadow = true;
        planter.add(box);

        const hedge = new THREE.Mesh(new THREE.BoxGeometry(pw * 0.88, 0.24, pd * 0.86), hedgeMat);
        hedge.position.y = 0.22;
        planter.add(hedge);

        for (let fi = 0; fi < 7; fi++) {
          const fl = create3DBlossomFlowerCluster(
            1.1,
            (fi + pIdx) % 2 === 0 ? flowerColorA : flowerColorB,
            '#fde047'
          );
          const ox = ((fi / 6) - 0.5) * (pw * 0.72);
          const oz = (((fi * 3) % 5) / 4 - 0.5) * (pd * 0.62);
          fl.position.set(ox, 0.36, oz);
          planter.add(fl);
        }
        dioramaGroup3d.add(planter);
      });

      // 7. Ornate 2-Tier Stone Cat Fountain on the Left Plaza ([-8.5, -0.2, -1.5]) + Outdoor Cat Café Table on the Right ([8.5, -0.2, -1.5])
      const fountainGroup = new THREE.Group();
      fountainGroup.position.set(-8.5, -0.22, -1.5);
      const fBasin1 = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.32, 0.42, 20), wallStoneMat);
      fBasin1.position.y = 0.21;
      fBasin1.castShadow = true;
      fountainGroup.add(fBasin1);
      const fWater1 = new THREE.Mesh(
        new THREE.CylinderGeometry(1.30, 1.30, 0.44, 20),
        new THREE.MeshStandardMaterial({ color: '#38bdf8', roughness: 0.15, metalness: 0.35 })
      );
      fWater1.position.y = 0.22;
      fountainGroup.add(fWater1);
      const fPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.36, 1.15, 14), wallStoneMat);
      fPillar.position.y = 0.68;
      fountainGroup.add(fPillar);
      const fBasin2 = new THREE.Mesh(new THREE.CylinderGeometry(0.82, 0.55, 0.28, 18), wallStoneMat);
      fBasin2.position.y = 1.25;
      fountainGroup.add(fBasin2);
      const fStatueCat = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 12), wallStoneMat);
      fStatueCat.scale.set(1.0, 1.35, 1.0);
      fStatueCat.position.y = 1.58;
      fountainGroup.add(fStatueCat);
      dioramaGroup3d.add(fountainGroup);

      // Cozy Outdoor Cat Café Bistro Table & Parasol Umbrella on the Right Plaza
      const cafeGroup = new THREE.Group();
      cafeGroup.position.set(8.5, -0.22, -1.5);
      const bistroTable = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.08, 18), frameTrimMat);
      bistroTable.position.y = 0.78;
      bistroTable.castShadow = true;
      cafeGroup.add(bistroTable);
      const tableLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.24, 0.78, 12), balconyIronMat);
      tableLeg.position.y = 0.39;
      cafeGroup.add(tableLeg);
      const parasolPole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.35, 10), woodDoorMat);
      parasolPole.position.y = 1.18;
      cafeGroup.add(parasolPole);
      const parasolCanopy = new THREE.Mesh(
        new THREE.ConeGeometry(1.65, 0.62, 12),
        new THREE.MeshStandardMaterial({ color: '#dc2626', roughness: 0.55 })
      );
      parasolCanopy.position.y = 2.38;
      parasolCanopy.castShadow = true;
      cafeGroup.add(parasolCanopy);
      dioramaGroup3d.add(cafeGroup);

      // 8. Glowing Vintage Italian Streetlamps & Warm Festoon Fairy String Lights across the Back Promenade
      [
        [-5.4, -5.6],
        [ 5.4, -5.6]
      ].forEach(([lx, lz], lIdx) => {
        const lampGroup = new THREE.Group();
        lampGroup.position.set(lx, 0.0, lz);
        lampGroup.userData = { interactiveProp: 'lamp' };

        const lampPole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.09, 0.14, 3.4, 12),
          new THREE.MeshStandardMaterial({ color: '#27272a', metalness: 0.65, roughness: 0.35 })
        );
        lampPole.position.y = 1.7;
        lampPole.castShadow = true;
        lampGroup.add(lampPole);

        const lanternCage = new THREE.Mesh(
          new THREE.CylinderGeometry(0.34, 0.24, 0.56, 6),
          new THREE.MeshBasicMaterial({ color: '#fde047' })
        );
        lanternCage.position.y = 3.55;
        lampGroup.add(lanternCage);

        const lanternRoof = new THREE.Mesh(
          new THREE.ConeGeometry(0.44, 0.28, 6),
          new THREE.MeshStandardMaterial({ color: '#18181b', metalness: 0.6, roughness: 0.35 })
        );
        lanternRoof.position.y = 3.96;
        lampGroup.add(lanternRoof);
        if (lIdx === 0) dioramaProps.lampBulbMesh = lanternCage;

        dioramaGroup3d.add(lampGroup);
        interactivePropMeshes.push(lampGroup);
      });

      // Warm Festoon String Fairy Bulbs draped between the two streetlamps
      const bulbMat = new THREE.MeshBasicMaterial({ color: '#fef08a' });
      for (let bi = 0; bi <= 12; bi++) {
        const frac = bi / 12;
        const bx = -5.4 + frac * 10.8;
        const sag = Math.sin(frac * Math.PI) * 0.55;
        const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 8), bulbMat);
        bulb.position.set(bx, 3.35 - sag, -5.6);
        dioramaGroup3d.add(bulb);
      }

      // PROP B: Red Laser Pointer Dot on the Chessboard (randomly triggered during gameplay)
      const laserDotGroup = new THREE.Group();
      laserDotGroup.position.set(0, 0.03, 0);
      laserDotGroup.visible = false;
      const laserCore = new THREE.Mesh(
        new THREE.CircleGeometry(0.11, 16),
        new THREE.MeshBasicMaterial({ color: '#ff1e42' })
      );
      laserCore.rotation.x = -Math.PI / 2;
      const laserHalo = new THREE.Mesh(
        new THREE.CircleGeometry(0.24, 16),
        new THREE.MeshBasicMaterial({ color: '#ef4444', transparent: true, opacity: 0.45 })
      );
      laserHalo.rotation.x = -Math.PI / 2;
      laserDotGroup.add(laserHalo, laserCore);
      dioramaGroup3d.add(laserDotGroup);
      dioramaProps.laserDotGroup = laserDotGroup;
      dioramaProps.laserTimer = 0;

      // PROP C: Rolling Pink Yarn Ball Toy
      const yarnGroup = new THREE.Group();
      yarnGroup.position.set(-5.6, 0.22, 2.2);
      yarnGroup.userData = { interactiveProp: 'yarn' };
      const yarnSphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.24, 16, 14),
        new THREE.MeshStandardMaterial({ color: '#f43f5e', roughness: 0.75, bumpMap: getProceduralFurBumpTexture(), bumpScale: 0.03 })
      );
      yarnSphere.castShadow = true;
      yarnGroup.add(yarnSphere);
      for (let yi = 0; yi < 3; yi++) {
        const threadBand = new THREE.Mesh(
          new THREE.TorusGeometry(0.235, 0.022, 8, 20),
          new THREE.MeshStandardMaterial({ color: '#fb7185', roughness: 0.7 })
        );
        threadBand.rotation.set(yi * 0.9, yi * 0.6, 0);
        yarnGroup.add(threadBand);
      }
      dioramaGroup3d.add(yarnGroup);
      interactivePropMeshes.push(yarnGroup);
      dioramaProps.toyMouseGroup = yarnGroup;

      // PROP D: Retro Boombox Radio
      const boomboxGroup = new THREE.Group();
      boomboxGroup.position.set(6.0, 0.45, -5.2);
      boomboxGroup.rotation.y = -0.45;
      boomboxGroup.userData = { interactiveProp: 'boombox' };
      const bbBody = new THREE.Mesh(
        new THREE.BoxGeometry(1.9, 1.05, 0.62),
        new THREE.MeshStandardMaterial({ color: '#eab308', roughness: 0.35 })
      );
      bbBody.castShadow = true;
      boomboxGroup.add(bbBody);
      [-0.55, 0.55].forEach((sx) => {
        const cone = new THREE.Mesh(
          new THREE.CylinderGeometry(0.28, 0.28, 0.66, 16),
          new THREE.MeshBasicMaterial({ color: '#090d16' })
        );
        cone.rotation.x = Math.PI / 2;
        cone.position.set(sx, -0.04, 0);
        boomboxGroup.add(cone);
      });
      dioramaGroup3d.add(boomboxGroup);
      interactivePropMeshes.push(boomboxGroup);
      dioramaProps.boomboxGroup = boomboxGroup;
      dioramaProps.boomboxPos = boomboxGroup.position.clone();

      // PROP E: Peeking Kitten Box
      const boxesGroup = new THREE.Group();
      boxesGroup.position.set(5.8, -0.2, 1.6);
      boxesGroup.rotation.y = -0.35;
      boxesGroup.userData = { interactiveProp: 'boxes' };
      const openBox = new THREE.Mesh(
        new THREE.BoxGeometry(1.1, 0.68, 1.0),
        new THREE.MeshStandardMaterial({ color: '#c89d66', roughness: 0.8 })
      );
      openBox.position.y = 0.34;
      openBox.castShadow = true;
      boxesGroup.add(openBox);

      const peekKitten = new THREE.Group();
      peekKitten.position.set(0, 0.42, 0);
      peekKitten.add(new THREE.Mesh(
        new THREE.SphereGeometry(0.21, 14, 12),
        new THREE.MeshStandardMaterial({ color: '#f97316', roughness: 0.6 })
      ));
      boxesGroup.add(peekKitten);
      dioramaProps.boxKittenGroup = peekKitten;
      dioramaGroup3d.add(boxesGroup);
      interactivePropMeshes.push(boxesGroup);
    }

    // Trigger Interactive 3D Map Prop & Steam Cat Chess Toys (Laser Pointer, Yarn Ball, Streetlamp, Boombox)
    function triggerInteractiveMapProp(propId) {
      ensureAudioContext();
      if (propId === 'laser' || propId === 'picnic') {
        playCatCombatVoice('attacker');
        dioramaProps.laserTimer = performance.now();
        if (dioramaProps.laserDotGroup) dioramaProps.laserDotGroup.visible = true;
        showToast('🔴 Red Laser Pointer active! Watch the Pawn cats track the laser dot!');
      } else if (propId === 'yarn' || propId === 'mouse') {
        playSoundEffect('knightLeap');
        playCatMeowVariation(true);
        dioramaProps.toyMouseRunTimer = performance.now();
        showToast('🧶 Rolled the Pink Yarn Ball around the Italian Cat Plaza!');
      } else if (propId === 'boombox') {
        toggleSoothingGameMusic();
      } else if (propId === 'boxes') {
        playCatCombatVoice('victim');
        dioramaProps.boxKittenPeekTimer = performance.now();
        showToast('📦 Meee-oww! A curious ginger kitten popped out of the plaza box!');
      } else if (propId === 'lamp') {
        appState.mapProps.lampOn = !appState.mapProps.lampOn;
        if (plazaLampLight3d) plazaLampLight3d.intensity = appState.mapProps.lampOn ? 1.25 : 0;
        if (dioramaProps.lampBulbMesh) {
          dioramaProps.lampBulbMesh.material.color.set(appState.mapProps.lampOn ? '#fde047' : '#475569');
        }
        playSoundEffect('click');
        showToast(appState.mapProps.lampOn ? '🏮 Italian Plaza Streetlamp ON' : '🏮 Italian Plaza Streetlamp OFF');
      }
    }

    // Initialize Three.js Scene
    function initThreeScene() {
      const container = document.getElementById('canvas-3d-container');
      if (!container || typeof THREE === 'undefined') return;

      const w = container.clientWidth || 680;
      const h = container.clientHeight || 680;

      scene3d = new THREE.Scene();
      scene3d.background = new THREE.Color('#0ea5e9');
      scene3d.fog = new THREE.FogExp2('#bae6fd', 0.016);

      perspCamera = new THREE.PerspectiveCamera(44, w / h, 0.4, 85);
      const aspect = w / h;
      const frustum = 6.4;
      orthoCamera = new THREE.OrthographicCamera(
        -frustum * aspect,
        frustum * aspect,
        frustum,
        -frustum,
        0.4,
        85
      );
      activeCamera = perspCamera;

      renderer3d = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: 'high-performance'
      });
      renderer3d.setSize(w, h);
      renderer3d.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer3d.shadowMap.enabled = true;
      renderer3d.shadowMap.type = THREE.PCFShadowMap;

      container.innerHTML = '';
      container.appendChild(renderer3d.domElement);

      raycaster3d = new THREE.Raycaster();

      // Warm Mediterranean Sunlight & Sky Illumination
      ambientLight3d = new THREE.AmbientLight(0xfff7ed, 0.78);
      scene3d.add(ambientLight3d);

      keyLight3d = new THREE.DirectionalLight(0xffedd5, 1.15);
      keyLight3d.position.set(8.5, 15.0, 9.5);
      keyLight3d.castShadow = true;
      keyLight3d.shadow.bias = -0.0006;
      keyLight3d.shadow.normalBias = 0.02;
      keyLight3d.shadow.camera.near = 1.0;
      keyLight3d.shadow.camera.far = 35.0;
      keyLight3d.shadow.mapSize.width = 1024;
      keyLight3d.shadow.mapSize.height = 1024;
      const d = 7.5;
      keyLight3d.shadow.camera.left = -d;
      keyLight3d.shadow.camera.right = d;
      keyLight3d.shadow.camera.top = d;
      keyLight3d.shadow.camera.bottom = -d;
      scene3d.add(keyLight3d);

      rimLight3d = new THREE.DirectionalLight(0x38bdf8, 0.45);
      rimLight3d.position.set(-9, 8, -10);
      scene3d.add(rimLight3d);

      plazaLampLight3d = new THREE.PointLight(0xfbbf24, 1.15, 18);
      plazaLampLight3d.position.set(-2.0, 3.2, -6.5);
      scene3d.add(plazaLampLight3d);

      dioramaGroup3d = new THREE.Group();
      boardGroup3d = new THREE.Group();
      piecesGroup3d = new THREE.Group();
      markersGroup3d = new THREE.Group();
      pawPrintsGroup3d = new THREE.Group();
      particlesGroup3d = new THREE.Group();
      fxSparklesGroup3d = new THREE.Group();

      scene3d.add(
        dioramaGroup3d,
        boardGroup3d,
        piecesGroup3d,
        markersGroup3d,
        pawPrintsGroup3d,
        particlesGroup3d,
        fxSparklesGroup3d
      );

      build3DChessboardGeometry();
      buildInteractiveDioramaWorld();
      rebuildEnvironmentParticles();
      sync3DPiecesWithChessState();

      // Start in Overhead 3D View (Reference 1: 1000756616.jpg)
      setCameraPlayMode('overheadAuto', true);
      bind3DCanvasEvents(renderer3d.domElement);

      window.addEventListener('resize', onResize3DViewport);
      window.addEventListener('orientationchange', () => setTimeout(onResize3DViewport, 120));
      if (typeof ResizeObserver !== 'undefined') {
        const ro = new ResizeObserver(() => onResize3DViewport());
        ro.observe(container);
      }
    }

    function onResize3DViewport() {
      const container = document.getElementById('canvas-3d-container');
      if (!container || !renderer3d || !perspCamera || !orthoCamera) return;
      const w = container.clientWidth || 600;
      const h = container.clientHeight || 600;
      if (w < 10 || h < 10) return;
      if (renderer3d._lastW === w && renderer3d._lastH === h) return;
      renderer3d._lastW = w;
      renderer3d._lastH = h;

      perspCamera.aspect = w / h;
      perspCamera.updateProjectionMatrix();

      const aspect = w / h;
      const frustum = 6.4;
      orthoCamera.left = -frustum * aspect;
      orthoCamera.right = frustum * aspect;
      orthoCamera.top = frustum;
      orthoCamera.bottom = -frustum;
      orthoCamera.updateProjectionMatrix();

      renderer3d.setSize(w, h);
    }

    // Build the 8x8 Stone Plaza Chessboard & Curb Stones (Reference 3 & 4)
    function build3DChessboardGeometry() {
      if (!boardGroup3d) return;
      while (boardGroup3d.children.length > 0) {
        boardGroup3d.remove(boardGroup3d.children[0]);
      }

      const theme = BOARD_THEMES[appState.themeId] || BOARD_THEMES.classic;
      const lightColor = appState.custom.lightSq || theme.lightSq;
      const darkColor = appState.custom.darkSq || theme.darkSq;

      const lightMat = new THREE.MeshStandardMaterial({
        color: lightColor,
        roughness: theme.roughness,
        metalness: theme.metalness
      });
      const darkMat = new THREE.MeshStandardMaterial({
        color: darkColor,
        roughness: theme.roughness,
        metalness: theme.metalness
      });

      // Stone Curb Frame around the 8x8 Plaza Grid
      const frameMesh = new THREE.Mesh(
        new THREE.BoxGeometry(10.3, 0.26, 10.3),
        new THREE.MeshStandardMaterial({ color: theme.frameColor, roughness: 0.65, metalness: 0.1 })
      );
      frameMesh.position.y = -0.15;
      frameMesh.receiveShadow = true;
      boardGroup3d.add(frameMesh);

      // Dark Mortar Base under the 64 Stone Tiles
      const mortarMesh = new THREE.Mesh(
        new THREE.BoxGeometry(9.32, 0.27, 9.32),
        new THREE.MeshStandardMaterial({ color: '#27272a', roughness: 0.85 })
      );
      mortarMesh.position.y = -0.145;
      boardGroup3d.add(mortarMesh);

      // 64 Individual Beveled Stone Tiles
      const sqGeo = new THREE.BoxGeometry(1.10, 0.14, 1.10);
      for (let r = 0; r < 8; r++) {
        for (let f = 0; f < 8; f++) {
          const sqName = String.fromCharCode(97 + f) + (r + 1);
          const isLight = (f + r) % 2 === 1;
          const tile = new THREE.Mesh(sqGeo, isLight ? lightMat : darkMat);
          const pos = squareToWorld(sqName, -0.07);
          tile.position.copy(pos);
          tile.receiveShadow = true;
          tile.userData = { square: sqName, isSquareTile: true };
          boardGroup3d.add(tile);
          squareMeshesMap[sqName] = tile;
        }
      }

      // Engraved Stone Curb Coordinates (a–h and 1–8)
      const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
      for (let i = 0; i < 8; i++) {
        const x = (i - 3.5) * 1.15;
        const lblFront = makeCoordLabelSprite(files[i].toUpperCase(), '#f8fafc');
        lblFront.position.set(x, -0.01, 4.86);
        boardGroup3d.add(lblFront);

        const z = (3.5 - i) * 1.15;
        const rankStr = String(i + 1);
        const lblLeft = makeCoordLabelSprite(rankStr, '#f8fafc');
        lblLeft.position.set(-4.86, -0.01, z);
        boardGroup3d.add(lblLeft);
      }
    }

    // =========================================================================
    // PERMANENT MAP-SPECIFIC 3D ENVIRONMENTAL EFFECTS ACROSS THE CHESSBOARD
    // - sakura (Kyoto Sakura Courtyard): 3D 5-Petal Cherry Blossom Flowers & Sakura Petals
    // - winter (Alpine Winter Lodge): 3D 6-Pointed Crystalline Snowflakes & Snowfall
    // - autumn (Autumn Forest Shrine): 3D Sculpted Crimson & Gold Maple Leaves
    // - classic (Coastal Cat Plaza): Golden Sunlit Breeze Motes & Coastal Jasmine Petals
    // - cyber (Shibuya Neon Alley): Rising 3D Cyan & Magenta Holographic Data Cubes
    // - volcano (Volcanic Obsidian Keep): Rising 3D Glowing Magma Embers & Fire Sparks
    // - castle (Moonlit Royal Fortress): Floating 3D Starlight Fireflies & Arcane Wisps
    // - ocean (Coral Harbor Promenade): Rising 3D Iridescent Sea Bubbles & Water Pearls
    // - candy (Pastel Patisserie Plaza): Falling 3D Golden Sugar Stars & Pastel Confetti
    // - desert (Pharaoh Oasis Courtyard): Swirling 3D Golden Desert Sand Crystals
    // =========================================================================

    function createSingle3DFallingBlossom(isFullFlower, colorA = '#fda4af', colorB = '#fce7f3') {
      if (isFullFlower) {
        return create3DBlossomFlowerCluster(0.95, Math.random() > 0.45 ? colorA : colorB, '#fde047');
      }
      const petalGeo = new THREE.CircleGeometry(0.082, 7);
      petalGeo.scale(0.82, 1.38, 1.0);
      const petalMat = new THREE.MeshStandardMaterial({
        color: Math.random() > 0.45 ? colorA : colorB,
        roughness: 0.42,
        side: THREE.DoubleSide
      });
      return new THREE.Mesh(petalGeo, petalMat);
    }

    function createSingle3DFallingSnowflake() {
      const snowGroup = new THREE.Group();
      const snowMat = new THREE.MeshBasicMaterial({
        color: Math.random() > 0.3 ? '#ffffff' : '#e0f2fe',
        transparent: true,
        opacity: 0.92,
        side: THREE.DoubleSide
      });
      const barGeo = new THREE.BoxGeometry(0.14, 0.018, 0.022);
      for (let i = 0; i < 3; i++) {
        const bar = new THREE.Mesh(barGeo, snowMat);
        bar.rotation.z = (i * Math.PI) / 3;
        snowGroup.add(bar);
      }
      const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.036, 0), snowMat);
      snowGroup.add(core);
      return snowGroup;
    }

    function createSingle3DAutumnMapleLeaf() {
      const leafGroup = new THREE.Group();
      const colors = ['#ea580c', '#dc2626', '#f59e0b', '#d97706'];
      const leafColor = colors[Math.floor(Math.random() * colors.length)];
      const leafMat = new THREE.MeshStandardMaterial({
        color: leafColor,
        roughness: 0.55,
        side: THREE.DoubleSide
      });
      // 3-lobed sculpted maple leaf
      [-0.48, 0, 0.48].forEach((ang, idx) => {
        const lobeGeo = new THREE.ConeGeometry(idx === 1 ? 0.055 : 0.044, idx === 1 ? 0.16 : 0.13, 4);
        lobeGeo.scale(1.0, 1.0, 0.22);
        const lobe = new THREE.Mesh(lobeGeo, leafMat);
        lobe.rotation.z = ang;
        lobe.position.y = 0.02;
        leafGroup.add(lobe);
      });
      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.006, 0.006, 0.07, 5),
        new THREE.MeshBasicMaterial({ color: '#78350f' })
      );
      stem.position.y = -0.05;
      leafGroup.add(stem);
      return leafGroup;
    }

    function createSingle3DCyberHoloCube() {
      const isCyan = Math.random() > 0.45;
      const color = isCyan ? '#22d3ee' : '#e879f9';
      const geo = new THREE.OctahedronGeometry(0.075, 0);
      const mat = new THREE.MeshBasicMaterial({
        color,
        wireframe: Math.random() > 0.4,
        transparent: true,
        opacity: 0.85
      });
      return new THREE.Mesh(geo, mat);
    }

    function createSingle3DVolcanoEmber() {
      const colors = ['#ef4444', '#f97316', '#fde047', '#fb7185'];
      const c = colors[Math.floor(Math.random() * colors.length)];
      const geo = new THREE.DodecahedronGeometry(0.052 + Math.random() * 0.025, 0);
      const mat = new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.92 });
      return new THREE.Mesh(geo, mat);
    }

    function createSingle3DCastleFirefly() {
      const flyGroup = new THREE.Group();
      const isGold = Math.random() > 0.4;
      const coreColor = isGold ? '#fde047' : '#a5b4fc';
      const core = new THREE.Mesh(
        new THREE.SphereGeometry(0.042, 8, 8),
        new THREE.MeshBasicMaterial({ color: coreColor })
      );
      const halo = new THREE.Mesh(
        new THREE.SphereGeometry(0.088, 8, 8),
        new THREE.MeshBasicMaterial({ color: coreColor, transparent: true, opacity: 0.32 })
      );
      flyGroup.add(core, halo);
      return flyGroup;
    }

    function createSingle3DOceanBubble() {
      const bGroup = new THREE.Group();
      const rad = 0.055 + Math.random() * 0.045;
      const bubble = new THREE.Mesh(
        new THREE.SphereGeometry(rad, 12, 10),
        new THREE.MeshStandardMaterial({
          color: '#67e8f9',
          roughness: 0.1,
          metalness: 0.2,
          transparent: true,
          opacity: 0.58
        })
      );
      const glint = new THREE.Mesh(
        new THREE.SphereGeometry(rad * 0.28, 6, 6),
        new THREE.MeshBasicMaterial({ color: '#ffffff' })
      );
      glint.position.set(rad * 0.38, rad * 0.38, rad * 0.38);
      bGroup.add(bubble, glint);
      return bGroup;
    }

    function createSingle3DCandyStar() {
      const colors = ['#facc15', '#f472b6', '#c084fc', '#38bdf8', '#4ade80'];
      const c = colors[Math.floor(Math.random() * colors.length)];
      const starGroup = new THREE.Group();
      const mat = new THREE.MeshStandardMaterial({ color: c, roughness: 0.3, metalness: 0.2 });
      const d1 = new THREE.Mesh(new THREE.OctahedronGeometry(0.068, 0), mat);
      d1.scale.set(1.0, 1.35, 0.45);
      const d2 = new THREE.Mesh(new THREE.OctahedronGeometry(0.068, 0), mat);
      d2.scale.set(1.35, 1.0, 0.45);
      starGroup.add(d1, d2);
      return starGroup;
    }

    function createSingle3DDesertCrystal() {
      const colors = ['#fbbf24', '#fde047', '#f59e0b', '#fed7aa'];
      const c = colors[Math.floor(Math.random() * colors.length)];
      const geo = new THREE.OctahedronGeometry(0.048, 0);
      geo.scale(1.4, 0.6, 0.6);
      const mat = new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.84 });
      return new THREE.Mesh(geo, mat);
    }

    function rebuildEnvironmentParticles() {
      if (!particlesGroup3d) return;
      while (particlesGroup3d.children.length > 0) {
        particlesGroup3d.remove(particlesGroup3d.children[0]);
      }
      // Permanent per-map 3D effects

      const tid = appState.themeId || 'classic';
      const countMap = {
        sakura: 96,
        winter: 96,
        autumn: 86,
        classic: 68,
        cyber: 76,
        volcano: 84,
        castle: 72,
        ocean: 78,
        candy: 84,
        desert: 82
      };
      const totalCount = countMap[tid] || 76;

      // 1. Spawn Map-Specific 3D Environmental Particles Directly Over & Across the 8x8 Chessboard!
      for (let i = 0; i < totalCount; i++) {
        let mesh = null;
        let vy = -(0.38 + Math.random() * 0.44);
        let vx = 0.14 + (Math.random() - 0.5) * 0.16;
        let vz = 0.08 + (Math.random() - 0.5) * 0.14;
        let modeType = 'fall'; // 'fall' | 'rise' | 'hover' | 'sandwind'

        if (tid === 'sakura') {
          // Blossom Map: Real 3D 5-Petal Cherry Blossom Flowers & Sakura Petals
          mesh = createSingle3DFallingBlossom(i % 3 === 0, '#fda4af', '#fce7f3');
          vy = -(0.36 + Math.random() * 0.42);
          vx = 0.18 + (Math.random() - 0.5) * 0.16;
        } else if (tid === 'winter') {
          // Winter Map: Real 3D Crystalline Snowflakes
          mesh = createSingle3DFallingSnowflake();
          vy = -(0.42 + Math.random() * 0.48);
          vx = 0.08 + (Math.random() - 0.5) * 0.14;
        } else if (tid === 'autumn') {
          // Autumn Map: Real 3D Crimson & Gold Maple Leaves
          mesh = createSingle3DAutumnMapleLeaf();
          vy = -(0.34 + Math.random() * 0.38);
          vx = 0.22 + (Math.random() - 0.5) * 0.20;
        } else if (tid === 'cyber') {
          // Cyber Map: Rising 3D Cyan & Magenta Holographic Cubes
          mesh = createSingle3DCyberHoloCube();
          modeType = 'rise';
          vy = 0.38 + Math.random() * 0.45;
          vx = (Math.random() - 0.5) * 0.08;
        } else if (tid === 'volcano') {
          // Volcano Map: Rising 3D Glowing Magma Embers & Sparks
          mesh = createSingle3DVolcanoEmber();
          modeType = 'rise';
          vy = 0.48 + Math.random() * 0.58;
          vx = 0.12 + (Math.random() - 0.5) * 0.22;
        } else if (tid === 'castle') {
          // Castle Map: Floating 3D Moonlit Starlight Fireflies
          mesh = createSingle3DCastleFirefly();
          modeType = 'hover';
          vy = (Math.random() - 0.5) * 0.18;
          vx = (Math.random() - 0.5) * 0.18;
        } else if (tid === 'ocean') {
          // Ocean Map: Rising 3D Iridescent Sea Bubbles
          mesh = createSingle3DOceanBubble();
          modeType = 'rise';
          vy = 0.32 + Math.random() * 0.40;
          vx = (Math.random() - 0.5) * 0.12;
        } else if (tid === 'candy') {
          // Candy Map: Falling 3D Sugar Stars & Pastel Blossoms
          mesh = (i % 2 === 0)
            ? createSingle3DCandyStar()
            : createSingle3DFallingBlossom(false, '#f472b6', '#fef08a');
          vy = -(0.35 + Math.random() * 0.40);
        } else if (tid === 'desert') {
          // Desert Map: Swirling 3D Golden Oasis Sand Shimmers
          mesh = createSingle3DDesertCrystal();
          modeType = 'sandwind';
          vy = -(0.12 + Math.random() * 0.18);
          vx = 0.65 + Math.random() * 0.45;
          vz = 0.22 + (Math.random() - 0.5) * 0.20;
        } else {
          // Classic (Coastal Cat Plaza): Warm Sunlit Sea-Breeze Motes & White/Coral Bougainvillea Petals
          mesh = (i % 3 === 0)
            ? createSingle3DFallingBlossom(i % 6 === 0, '#fb7185', '#fff1f2')
            : createSingle3DCastleFirefly();
          vy = -(0.24 + Math.random() * 0.28);
          vx = 0.15 + (Math.random() - 0.5) * 0.12;
        }

        const px = (Math.random() - 0.5) * 10.6;
        const pz = (Math.random() - 0.5) * 10.6;
        const py = 0.25 + Math.random() * 7.2;

        mesh.position.set(px, py, pz);
        mesh.rotation.set(
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2
        );

        mesh.userData = {
          isFallingWeather: true,
          modeType,
          vy,
          vx,
          vz,
          baseY: py,
          swayPhase: Math.random() * Math.PI * 2,
          swaySpeed: 1.2 + Math.random() * 1.4,
          rotSpeedX: (Math.random() - 0.5) * 2.2,
          rotSpeedY: (Math.random() - 0.5) * 2.6,
          rotSpeedZ: (Math.random() - 0.5) * 1.8
        };
        particlesGroup3d.add(mesh);
      }

      // 2. Scatter Map-Matched Fallen Petals / Snow Crystals / Maple Leaves along the Outer Board Frame!
      if (tid === 'sakura' || tid === 'winter' || tid === 'autumn' || tid === 'candy' || tid === 'classic') {
        const borderCount = (tid === 'sakura' || tid === 'winter' || tid === 'autumn') ? 28 : 16;
        for (let bi = 0; bi < borderCount; bi++) {
          const side = bi % 4;
          const along = ((Math.floor(bi / 4) / Math.ceil(borderCount / 4)) - 0.5) * 8.4 + (Math.random() - 0.5) * 0.4;
          const rimOffset = 4.32 + (Math.random() - 0.5) * 0.28;
          const bx = (side === 0 || side === 1) ? along : (side === 2 ? -rimOffset : rimOffset);
          const bz = (side === 2 || side === 3) ? along : (side === 0 ? -rimOffset : rimOffset);

          let fallen = null;
          if (tid === 'sakura') {
            fallen = (bi % 3 === 0)
              ? create3DBlossomFlowerCluster(0.78, '#fda4af', '#fde047')
              : createSingle3DFallingBlossom(false, '#fda4af', '#fce7f3');
          } else if (tid === 'winter') {
            fallen = createSingle3DFallingSnowflake();
          } else if (tid === 'autumn') {
            fallen = createSingle3DAutumnMapleLeaf();
          } else if (tid === 'candy') {
            fallen = createSingle3DCandyStar();
          } else {
            fallen = createSingle3DFallingBlossom(false, '#fb7185', '#fff1f2');
          }

          fallen.position.set(bx, 0.035, bz);
          fallen.rotation.x = -Math.PI / 2 + (Math.random() - 0.5) * 0.15;
          fallen.rotation.z = Math.random() * Math.PI * 2;
          fallen.userData = { isStaticBorderPetal: true };
          particlesGroup3d.add(fallen);
        }
      }
    }

    function spawnCaptureSparkleBurst(worldPos, colorHex = '#fde047') {
      if (!fxSparklesGroup3d) return;
      const mat = new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 1 });
      const geo = new THREE.OctahedronGeometry(0.085, 0);
      const particles = [];
      for (let i = 0; i < 18; i++) {
        const m = new THREE.Mesh(geo, mat.clone());
        m.position.copy(worldPos);
        m.position.y += 0.35;
        const ang = (i / 18) * Math.PI * 2;
        const spd = 1.5 + Math.random() * 1.9;
        m.userData = {
          vx: Math.cos(ang) * spd,
          vy: 1.6 + Math.random() * 2.2,
          vz: Math.sin(ang) * spd
        };
        fxSparklesGroup3d.add(m);
        particles.push(m);
      }
      activeSparkleBursts.push({ startTime: performance.now(), particles });
    }

    // Dynamic 3D Golden Claw Slash Effect (triple curved claw strikes /// + impact flash)
    function spawnAttackClawSlashEffect(targetWorldPos, dirX, dirZ) {
      if (!fxSparklesGroup3d) return;
      const slashGroup = new THREE.Group();
      slashGroup.position.copy(targetWorldPos);
      slashGroup.position.y += 0.38;

      const strikeAngle = (Math.abs(dirX) + Math.abs(dirZ) > 0.01) ? Math.atan2(dirX, dirZ) : 0;
      slashGroup.rotation.y = strikeAngle;

      const clawMat = new THREE.MeshBasicMaterial({
        color: 0xffd700,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false
      });

      // 3 sharp golden claw slash streaks ///
      const offsets = [-0.18, 0, 0.18];
      offsets.forEach((ox, idx) => {
        const slashGeo = new THREE.CylinderGeometry(0.008, 0.038, 0.85, 6);
        const slashMesh = new THREE.Mesh(slashGeo, clawMat);
        slashMesh.position.set(ox, 0.15, (idx - 1) * 0.06);
        slashMesh.rotation.z = 0.58;
        slashMesh.rotation.x = 0.35;
        slashGroup.add(slashMesh);
      });

      const flashGeo = new THREE.CircleGeometry(0.42, 16);
      const flashMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.88,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      const flashMesh = new THREE.Mesh(flashGeo, flashMat);
      flashMesh.rotation.x = -Math.PI / 2;
      slashGroup.add(flashMesh);

      fxSparklesGroup3d.add(slashGroup);
      activeClawSlashEffects.push({
        group: slashGroup,
        startTime: performance.now(),
        duration: 380,
        clawMat,
        flashMat
      });
    }

    // Cleanly dispose piece rig geometry and materials from WebGL VRAM
    function disposeRig(rig) {
      if (!rig) return;
      rig.traverse((child) => {
        if (child.isMesh) {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) child.material.forEach((m) => m && m.dispose && m.dispose());
            else if (child.material.dispose) child.material.dispose();
          }
        }
      });
    }

    // High-performance piece reconciliation: reuses existing 3D rigs instead of allocating 1,200 meshes every move!
    function sync3DPiecesWithChessState(forceRebuild = false) {
      if (!piecesGroup3d || !chessEngine) return;
      const board = chessEngine.board();
      const targetPieces = {};

      for (let r = 0; r < 8; r++) {
        for (let f = 0; f < 8; f++) {
          const piece = board[r][f];
          if (!piece) continue;
          const sqName = String.fromCharCode(97 + f) + (8 - r);
          targetPieces[sqName] = piece;
        }
      }

      if (forceRebuild) {
        while (piecesGroup3d.children.length > 0) {
          const c = piecesGroup3d.children[0];
          piecesGroup3d.remove(c);
          disposeRig(c);
        }
        Object.keys(catRigsBySquare).forEach((k) => delete catRigsBySquare[k]);
      }

      // 1. Identify which existing rigs already match or moved
      const currentSquares = Object.keys(catRigsBySquare);
      for (const sq of currentSquares) {
        const rig = catRigsBySquare[sq];
        const target = targetPieces[sq];
        if (!target || target.type !== rig.userData.type || target.color !== rig.userData.color) {
          let foundNewSq = null;
          for (const newSq in targetPieces) {
            if (!catRigsBySquare[newSq] && targetPieces[newSq].type === rig.userData.type && targetPieces[newSq].color === rig.userData.color) {
              foundNewSq = newSq;
              break;
            }
          }
          if (foundNewSq) {
            delete catRigsBySquare[sq];
            catRigsBySquare[foundNewSq] = rig;
            rig.userData.square = foundNewSq;
            rig.position.copy(squareToWorld(foundNewSq, 0));
            targetPieces[foundNewSq]._placed = true;
          } else {
            piecesGroup3d.remove(rig);
            disposeRig(rig);
            delete catRigsBySquare[sq];
          }
        } else {
          targetPieces[sq]._placed = true;
          rig.position.copy(squareToWorld(sq, 0));
        }
      }

      // 2. Add only any newly required pieces
      for (const sq in targetPieces) {
        if (targetPieces[sq]._placed) continue;
        const piece = targetPieces[sq];
        const rig = createCatPieceRig(piece.type, piece.color);
        rig.position.copy(squareToWorld(sq, 0));
        rig.userData.square = sq;
        piecesGroup3d.add(rig);
        catRigsBySquare[sq] = rig;
      }

      rebuild3DMarkers();
    }

    // Shared pooled marker geometries & materials for zero-overhead highlights
    let mGeoPlane = null;
    let mGeoDot = null;
    let mGeoCapRing = null;
    let mGeoCheckHalo = null;
    let mMatSel = null;
    let mMatLast = null;
    let mMatDot = null;
    let mMatCap = null;
    let mMatCheck = null;

    function rebuild3DMarkers() {
      if (!markersGroup3d || !chessEngine) return;
      while (markersGroup3d.children.length > 0) {
        markersGroup3d.remove(markersGroup3d.children[0]);
      }

      if (!mGeoPlane) mGeoPlane = new THREE.PlaneGeometry(1.08, 1.08);
      if (!mGeoDot) mGeoDot = new THREE.CircleGeometry(0.16, 16);
      if (!mGeoCapRing) mGeoCapRing = new THREE.RingGeometry(0.39, 0.51, 20);
      if (!mGeoCheckHalo) mGeoCheckHalo = new THREE.RingGeometry(0.32, 0.54, 24);

      if (!mMatSel) mMatSel = new THREE.MeshBasicMaterial({ color: 0x629924, transparent: true, opacity: 0.48, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
      if (!mMatLast) mMatLast = new THREE.MeshBasicMaterial({ color: 0x9bc700, transparent: true, opacity: 0.34, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
      if (!mMatDot) mMatDot = new THREE.MeshBasicMaterial({ color: 0x629924, transparent: true, opacity: 0.85, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
      if (!mMatCap) mMatCap = new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
      if (!mMatCheck) mMatCheck = new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });

      // 1. Selected Square Highlight (Lichess Green/Gold Tint)
      if (appState.selectedSquare) {
        const pos = squareToWorld(appState.selectedSquare, 0.012);
        const selPad = new THREE.Mesh(mGeoPlane, mMatSel);
        selPad.rotation.x = -Math.PI / 2;
        selPad.position.copy(pos);
        markersGroup3d.add(selPad);
      }

      // 2. Last Move Highlight Pads (Lichess Olive-Yellow Tint)
      if (appState.lastMove) {
        [appState.lastMove.from, appState.lastMove.to].forEach((sq) => {
          if (!sq) return;
          const pos = squareToWorld(sq, 0.01);
          const pad = new THREE.Mesh(mGeoPlane, mMatLast);
          pad.rotation.x = -Math.PI / 2;
          pad.position.copy(pos);
          markersGroup3d.add(pad);
        });
      }

      // 3. King in Check Pulsing Crimson Glow
      if (chessEngine.in_check()) {
        const turnColor = chessEngine.turn();
        const kingSq = findKingSquare(turnColor);
        if (kingSq) {
          const pos = squareToWorld(kingSq, 0.018);
          const checkHalo = new THREE.Mesh(mGeoCheckHalo, mMatCheck);
          checkHalo.rotation.x = -Math.PI / 2;
          checkHalo.position.copy(pos);
          markersGroup3d.add(checkHalo);
        }
      }

      // 4. Legal Move Dots & Attack Target Rings
      if (appState.showLegalMoves && appState.legalMovesForSelected.length > 0) {
        appState.legalMovesForSelected.forEach((mv) => {
          const pos = squareToWorld(mv.to, 0.02);
          const isCapture = Boolean(mv.captured || (mv.flags && (mv.flags.includes('c') || mv.flags.includes('e'))));
          if (isCapture) {
            const capRing = new THREE.Mesh(mGeoCapRing, mMatCap);
            capRing.rotation.x = -Math.PI / 2;
            capRing.position.copy(pos);
            capRing.userData = { square: mv.to };
            markersGroup3d.add(capRing);
          } else {
            const dot = new THREE.Mesh(mGeoDot, mMatDot);
            dot.rotation.x = -Math.PI / 2;
            dot.position.copy(pos);
            dot.userData = { square: mv.to };
            markersGroup3d.add(dot);
          }
        });
      }

      // 5. Engine Hint Arrow in 3D
      if (appState.activeHintMove) {
        const fromPos = squareToWorld(appState.activeHintMove.from, 0.14);
        const toPos = squareToWorld(appState.activeHintMove.to, 0.14);
        const dir = new THREE.Vector3().subVectors(toPos, fromPos);
        const len = dir.length();
        if (len > 0.1) {
          const arrowHelper = new THREE.ArrowHelper(
            dir.clone().normalize(),
            fromPos,
            len,
            0x3692e7,
            0.36,
            0.26
          );
          markersGroup3d.add(arrowHelper);
        }
      }
    }

    // =========================================================================
    // OVERHEAD (IMAGE 1: 1000756616.jpg) -> 3D ATTACK CAMERA TRANSITION (IMAGE 2/3)
    // When attacking a piece, the camera smoothly swoops down from the top-down
    // view into a low-angle 3D close-up as the cat stretches into a mid-air
    // four-legged pounce with paw-print tile decals, then transitions back up!
    // =========================================================================
    function start3DMoveAnimation(moveObj, onComplete) {
      if (!piecesGroup3d) {
        sync3DPiecesWithChessState();
        if (onComplete) onComplete();
        return;
      }

      const attackerRig = catRigsBySquare[moveObj.from];
      if (!attackerRig) {
        sync3DPiecesWithChessState();
        if (onComplete) onComplete();
        return;
      }

      const isCapture = Boolean(moveObj.captured || (moveObj.flags && (moveObj.flags.includes('c') || moveObj.flags.includes('e'))));
      let capturedSq = moveObj.to;
      if (moveObj.flags && moveObj.flags.includes('e')) {
        capturedSq = moveObj.to[0] + moveObj.from[1];
      }
      const defenderRig = isCapture ? catRigsBySquare[capturedSq] : null;

      // Castling Rook simultaneous slide
      let rookRig = null;
      let rookFromPos = null;
      let rookToPos = null;
      if (moveObj.flags && (moveObj.flags.includes('k') || moveObj.flags.includes('q'))) {
        const rank = moveObj.from[1];
        const isKingside = moveObj.flags.includes('k');
        const rFrom = (isKingside ? 'h' : 'a') + rank;
        const rTo = (isKingside ? 'f' : 'd') + rank;
        rookRig = catRigsBySquare[rFrom];
        if (rookRig) {
          rookFromPos = squareToWorld(rFrom, 0);
          rookToPos = squareToWorld(rTo, 0);
        }
      }

      const fromPos = squareToWorld(moveObj.from, 0);
      const toPos = squareToWorld(moveObj.to, 0);
      const speedMult = parseFloat(appState.custom.moveSpeed || 1.0);

      // Spawn white Paw-Print Decals along the move path (like Reference 3: 1000756618.jpg!)
      spawnPawPrintTrailOnBoard(fromPos, toPos);

      // Every move (normal moves AND captures) uses the 3D POV camera transition
      const use3DPovTransition = (camState.followMoves !== false);
      // Snappy yet cinematic duration so the player sees the cat coil, pounce across tiles, and strike!
      let baseDuration = isCapture ? 1350 : 950;
      baseDuration = Math.max(480, baseDuration / speedMult);

      // AUTOMATIC OVER-THE-SHOULDER 3D ACTION POV ON EVERY MOVE & ATTACK!
      if (use3DPovTransition) {
        if (!camState.savedPreCapture) {
          camState.savedPreCapture = {
            theta: camState.desiredTheta,
            phi: camState.desiredPhi,
            radius: camState.desiredRadius,
            target: camState.desiredTarget.clone()
          };
        }

        // Calculate over-the-shoulder POV behind the moving cat, angled along the move vector
        const dirX = toPos.x - fromPos.x;
        const dirZ = toPos.z - fromPos.z;
        const moveDist = Math.hypot(dirX, dirZ);

        // Vector from target back towards camera: directly behind the moving cat (-dirX, -dirZ)
        let povTheta = (Math.abs(dirX) + Math.abs(dirZ) > 0.05)
          ? Math.atan2(-dirX, -dirZ)
          : (appState.boardFlipped ? Math.PI : 0);

        // Look-at target: focused forward on target square / defending piece
        const lookTarget = new THREE.Vector3(
          toPos.x * 0.70 + fromPos.x * 0.30,
          isCapture ? 0.45 : 0.35,
          toPos.z * 0.70 + fromPos.z * 0.30
        );
        camState.desiredTarget.copy(lookTarget);
        camState.desiredTheta = povTheta;
        // Low-angle perspective matching the reference screenshot!
        camState.desiredPhi = isCapture ? 1.30 : 1.25;
        // Dynamic close-in radius framing the cat and target pieces
        camState.desiredRadius = Math.min(5.6, Math.max(3.4, moveDist * 0.85 + 1.8));
        camState.lerpSpeed = 0.26; // Snappy, exciting camera swoop

        const banner = document.getElementById('hud-capture-banner');
        if (banner) {
          const attName = CAT_BREED_INFO[moveObj.piece]?.name || 'Plaza Cat';
          banner.textContent = isCapture
            ? `⚔️ ${attName} Captures on ${moveObj.to.toUpperCase()}!`
            : `🐾 ${attName} ➔ ${moveObj.to.toUpperCase()}`;
          banner.classList.remove('hidden');
        }
      }

      if (isCapture) {
        playSoundEffect('captureStart');
      } else if (moveObj.piece === 'n') {
        playSoundEffect('knightLeap');
      } else if (rookRig) {
        playSoundEffect('castle');
      } else {
        playSoundEffect('move');
      }

      activeMoveAnim = {
        moveObj,
        attackerRig,
        defenderRig,
        rookRig,
        rookFromPos,
        rookToPos,
        fromPos,
        toPos,
        isCapture,
        impactPlayed: false,
        startTime: performance.now(),
        duration: baseDuration,
        onComplete
      };
    }

    // 1-Click Live Demo of the Over-The-Shoulder Action POV Attack!
    function triggerDemoAttackTransition() {
      if (activeMoveAnim || !piecesGroup3d) return;
      ensureAudioContext();

      // Find any two pieces on the board to showcase the Action POV attack
      const keys = Object.keys(catRigsBySquare);
      const whiteSq = keys.find((sq) => catRigsBySquare[sq]?.userData?.color === 'w') || 'e2';
      const blackSq = keys.find((sq) => catRigsBySquare[sq]?.userData?.color === 'b') || 'e7';
      const attackerRig = catRigsBySquare[whiteSq];
      const defenderRig = catRigsBySquare[blackSq];
      if (!attackerRig || !defenderRig) return;

      const fromPos = squareToWorld(whiteSq, 0);
      const toPos = squareToWorld(blackSq, 0);
      spawnPawPrintTrailOnBoard(fromPos, toPos);

      camState.savedPreCapture = {
        theta: camState.desiredTheta,
        phi: camState.desiredPhi,
        radius: camState.desiredRadius,
        target: camState.desiredTarget.clone()
      };

      const dirX = toPos.x - fromPos.x;
      const dirZ = toPos.z - fromPos.z;
      const moveDist = Math.hypot(dirX, dirZ);
      const povTheta = (Math.abs(dirX) + Math.abs(dirZ) > 0.05) ? Math.atan2(-dirX, -dirZ) : 0;

      const lookTarget = new THREE.Vector3(
        toPos.x * 0.70 + fromPos.x * 0.30,
        0.45,
        toPos.z * 0.70 + fromPos.z * 0.30
      );
      camState.desiredTarget.copy(lookTarget);
      camState.desiredTheta = povTheta;
      camState.desiredPhi = 1.30;
      camState.desiredRadius = Math.min(5.6, Math.max(3.4, moveDist * 0.85 + 1.8));
      camState.lerpSpeed = 0.26;

      const banner = document.getElementById('hud-capture-banner');
      if (banner) {
        banner.textContent = '🎬 Action POV: Cat Pounce & Claw Strike!';
        banner.classList.remove('hidden');
      }
      playSoundEffect('captureStart');

      activeMoveAnim = {
        moveObj: { piece: attackerRig.userData.type, from: whiteSq, to: blackSq, captured: 'p' },
        attackerRig,
        defenderRig,
        rookRig: null,
        fromPos,
        toPos,
        isCapture: true,
        impactPlayed: false,
        startTime: performance.now(),
        duration: 1400,
        onComplete: () => {
          showToast('🎯 Camera smoothly returned to Overview!');
        }
      };
    }

    // Main 60fps Render & Animation Loop
    function animateThreeLoop(nowMs) {
      requestAnimationFrame(animateThreeLoop);
      updateGamepadPolling(nowMs);

      if (!scene3d || !renderer3d || !activeCamera) return;

      // 1. Smooth Camera Interpolation (Handles Overhead <-> 3D Attack Swoop!)
      camState.theta += (camState.desiredTheta - camState.theta) * camState.lerpSpeed;
      camState.phi += (camState.desiredPhi - camState.phi) * camState.lerpSpeed;
      camState.radius += (camState.desiredRadius - camState.radius) * camState.lerpSpeed;
      camState.target.lerp(camState.desiredTarget, camState.lerpSpeed);
      updateCameraTransform(false);

      const tSec = nowMs * 0.001;

      // Animate Multi-Layered 3D Trees Swaying Gently in the Breeze
      for (let ti = 0; ti < animatedTreesList.length; ti++) {
        const tr = animatedTreesList[ti];
        if (tr.canopy) {
          tr.canopy.rotation.z = Math.sin(tSec * tr.speed + tr.phase) * tr.amp;
          tr.canopy.rotation.x = Math.cos(tSec * (tr.speed * 0.8) + tr.phase) * (tr.amp * 0.7);
        }
      }

      // Animate Gliding Harbor Seagulls, Bobbing Sailboats & Drifting 3D Sky Clouds
      if (dioramaProps.seagullsList) {
        dioramaProps.seagullsList.forEach((g) => {
          const ang = tSec * 0.42 + g.phase;
          g.group.position.x = Math.cos(ang) * g.radius;
          g.group.position.z = -12 + Math.sin(ang) * (g.radius * 0.55);
          g.group.position.y = g.height + Math.sin(tSec * 1.6 + g.phase) * 0.25;
          g.group.rotation.y = -ang;
          const flap = Math.sin(tSec * 6.5 + g.phase) * 0.38;
          g.wingL.rotation.y = flap;
          g.wingR.rotation.y = -flap;
        });
      }
      if (dioramaProps.boatsList) {
        dioramaProps.boatsList.forEach((b) => {
          b.group.position.y = b.baseY + Math.sin(tSec * 1.8 + b.phase) * 0.06;
          b.group.rotation.z = Math.sin(tSec * 1.4 + b.phase) * 0.05;
        });
      }
      if (dioramaProps.cloudsList) {
        dioramaProps.cloudsList.forEach((c) => {
          c.group.position.x = c.baseX + Math.sin(tSec * 0.12 + c.phase) * 1.8;
        });
      }

      // Animate Sparkling Mediterranean Sea Waves smoothly via transform (zero CPU vertex-buffer thrashing)
      if (dioramaProps.seaWaterMesh) {
        dioramaProps.seaWaterMesh.position.y = -0.75 + Math.sin(tSec * 1.5) * 0.035;
        dioramaProps.seaWaterMesh.rotation.z = Math.sin(tSec * 0.8) * 0.006;
      }

      // 2. Automatic Random Periodic Map Toys (Laser Pointer & Rolling Yarn Ball) + Diorama Props
      if (!dioramaProps.nextRandomToyTime) {
        dioramaProps.nextRandomToyTime = nowMs + 7000 + Math.random() * 8000;
      }
      if (nowMs >= dioramaProps.nextRandomToyTime && !activeMoveAnim) {
        const randChoice = Math.random();
        if (randChoice < 0.48) {
          // Randomly activate Red Laser Pointer skittering across the board!
          dioramaProps.laserTimer = nowMs;
          if (dioramaProps.laserDotGroup) dioramaProps.laserDotGroup.visible = true;
        } else if (randChoice < 0.88) {
          // Randomly roll the Pink Yarn Ball around the plaza!
          dioramaProps.toyMouseRunTimer = nowMs;
        } else {
          // Occasional curious ginger kitten peek from the plaza box
          dioramaProps.boxKittenPeekTimer = nowMs;
        }
        // Schedule next random toy appearance in 12 to 22 seconds (natural & repeated, not continuous)
        dioramaProps.nextRandomToyTime = nowMs + 12000 + Math.random() * 10000;
      }

      if (dioramaProps.boomboxGroup && appState.mapProps.boomboxPlaying) {
        const beat = 1 + Math.abs(Math.sin(tSec * 9.8)) * 0.08;
        dioramaProps.boomboxGroup.scale.set(beat, 1 / beat, beat);
      }
      if (dioramaProps.boxKittenGroup && dioramaProps.boxKittenPeekTimer > 0) {
        const kt = (nowMs - dioramaProps.boxKittenPeekTimer) / 1400;
        if (kt < 1) {
          dioramaProps.boxKittenGroup.position.y = 0.45 + Math.sin(kt * Math.PI) * 0.48;
          dioramaProps.boxKittenGroup.rotation.y = Math.sin(kt * Math.PI * 4) * 0.35;
        } else {
          dioramaProps.boxKittenGroup.position.y = 0.45;
          dioramaProps.boxKittenPeekTimer = 0;
        }
      }
      if (dioramaProps.picnicFishMesh && dioramaProps.picnicFishTimer > 0) {
        const ft = (nowMs - dioramaProps.picnicFishTimer) / 1100;
        if (ft < 1) {
          dioramaProps.picnicFishMesh.position.y = 0.35 + Math.sin(ft * Math.PI) * 1.4;
          dioramaProps.picnicFishMesh.rotation.x = ft * Math.PI * 4;
        } else {
          dioramaProps.picnicFishMesh.visible = false;
          dioramaProps.picnicFishTimer = 0;
        }
      }
      if (dioramaProps.toyMouseGroup && dioramaProps.toyMouseRunTimer > 0) {
        const mt = (nowMs - dioramaProps.toyMouseRunTimer) / 2800;
        if (mt < 1) {
          const ang = mt * Math.PI * 2;
          dioramaProps.toyMouseGroup.position.set(Math.cos(ang) * 5.1, 0.22 + Math.abs(Math.sin(mt * 18)) * 0.18, Math.sin(ang) * 5.1);
          dioramaProps.toyMouseGroup.rotation.x += 0.25;
          dioramaProps.toyMouseGroup.rotation.z += 0.18;
        } else {
          dioramaProps.toyMouseRunTimer = 0;
        }
      }
      let activeLaserWorldPos = null;
      if (dioramaProps.laserDotGroup && dioramaProps.laserTimer > 0) {
        const lt = (nowMs - dioramaProps.laserTimer) / 3200;
        if (lt < 1) {
          const lx = Math.sin(lt * Math.PI * 4) * 2.9;
          const lz = Math.cos(lt * Math.PI * 3) * 2.5;
          dioramaProps.laserDotGroup.position.set(lx, 0.025, lz);
          activeLaserWorldPos = dioramaProps.laserDotGroup.position;
        } else {
          dioramaProps.laserDotGroup.visible = false;
          dioramaProps.laserTimer = 0;
        }
      }

      // 3. Natural Random Sitting Cat Behaviors & Lifelike Cat Blinking:
      //    Cats alternate between 'normalSit' (alert sitting with natural regular & double blinks)
      //    and random bouts of:
      //    - 'lickingPaw' (lifting 4-toed paw, closing eyes, licking with pink tongue)
      //    - 'lickingShoulder' (turning head to groom back fur)
      //    - 'slowEyeClose' (cozy slow eye close & rest)
      //    - 'grumpyScowl' (furrowed 3D brow scowl)
      //    - 'yawning' (sleepy yawn with open mouth, curled pink tongue & front leg stretch)
      //    - 'kneadingPaws' (alternating front paws pressing on the square)
      //    - 'curiousTilt' (alert head tilt & ear scan)
      const activeGroomAndExprPool = [
        'lickingPaw',
        'slowEyeClose',
        'grumpyScowl',
        'lickingShoulder',
        'kneadingPaws',
        'yawning',
        'curiousTilt'
      ];

      Object.values(catRigsBySquare).forEach((rig) => {
        if (!rig || !rig.userData) return;
        const ud = rig.userData;
        const phase = ud.phaseOffset || 0;
        const body = ud.bodyGroup;
        const head = ud.headGroup;
        const legL = ud.legLGroup;
        const legR = ud.legRGroup;
        const tongue = ud.tongueGroup;
        const mouthOpen = ud.mouthOpenMesh;

        // Transition between 'normalSit' and a random feline expression/grooming behavior
        if (!ud.behaviorState || (nowMs - ud.behaviorStart > ud.behaviorDuration)) {
          if (ud.behaviorState && ud.behaviorState !== 'normalSit') {
            // Return to natural alert sitting & blinking after finishing a special animation
            ud.behaviorState = 'normalSit';
            ud.behaviorStart = nowMs;
            ud.behaviorDuration = 3500 + Math.random() * 5200;
          } else {
            // Pick a random expression or grooming animation
            const nextIdx = Math.floor(Math.random() * activeGroomAndExprPool.length);
            ud.behaviorState = activeGroomAndExprPool[nextIdx];
            ud.behaviorStart = nowMs;
            ud.behaviorDuration = 2600 + Math.random() * 2400;
          }
        }

        const behT = Math.max(0, Math.min(1, (nowMs - ud.behaviorStart) / ud.behaviorDuration));
        const env = Math.sin(behT * Math.PI); // Smooth 0 -> 1 -> 0 envelope

        let targetHeadRotX = Math.sin(tSec * 0.9 + phase) * 0.035;
        let targetHeadRotY = Math.sin(tSec * 1.2 + phase) * 0.11;
        let targetHeadRotZ = Math.cos(tSec * 0.8 + phase) * 0.03;
        let targetLegLRotX = 0;
        let targetLegLRotZ = 0;
        let targetLegRRotX = 0;
        let targetLegRRotZ = 0;
        let targetEyeClosure = (ud.type === 'k' || ud.type === 'r') ? 0.24 : 0.04;
        let targetBrowScowl = (ud.type === 'k' || ud.type === 'r' || ud.type === 'n') ? 0.22 : 0.12;
        let targetPupilScaleX = (ud.type === 'p' || ud.type === 'b' || ud.type === 'q') ? 0.76 : 0.52;
        let showTongue = false;
        let tongueLickCycle = 0;
        let mouthOpenScaleY = 0.1;

        if (!activeMoveAnim || activeMoveAnim.attackerRig !== rig) {
          // If the red laser pointer dot is active on the board, nearby sitting cats track it with wide pupils!
          if (activeLaserWorldPos && ud.behaviorState === 'normalSit') {
            const dxL = activeLaserWorldPos.x - rig.position.x;
            const dzL = activeLaserWorldPos.z - rig.position.z;
            const distL = Math.hypot(dxL, dzL);
            if (distL < 4.2) {
              const localFactor = (ud.color === 'w') ? -1 : 1;
              targetHeadRotY = Math.max(-0.55, Math.min(0.55, dxL * 0.22 * localFactor));
              targetHeadRotX = 0.22;
              targetPupilScaleX = 0.96; // Dilated excited cat pupils!
            }
          }

          if (ud.behaviorState === 'lickingPaw') {
            // Lift right front paw to mouth, tilt head down, close eyes, and lick paw with 3D pink tongue!
            const lickWave = Math.sin(tSec * 13.5 + phase);
            targetLegRRotX = -1.32 * env;
            targetLegRRotZ = -0.36 * env;
            targetHeadRotX = (0.30 + Math.max(0, lickWave) * 0.14) * env;
            targetHeadRotY = -0.22 * env;
            targetHeadRotZ = -0.18 * env;
            targetEyeClosure = Math.max(targetEyeClosure, 0.96 * env);
            targetBrowScowl = 0.05;
            if (env > 0.25) {
              showTongue = true;
              tongueLickCycle = (lickWave + 1) * 0.5;
              mouthOpenScaleY = 0.45 + tongueLickCycle * 0.35;
            }
          } else if (ud.behaviorState === 'lickingShoulder') {
            // Turn head toward shoulder/back fur, close eyes, and lick fur rhythmically!
            const sideDir = (phase > Math.PI) ? 1 : -1;
            const lickWave = Math.sin(tSec * 12.5 + phase);
            targetHeadRotY = sideDir * 0.72 * env;
            targetHeadRotX = (0.24 + Math.max(0, lickWave) * 0.16) * env;
            targetHeadRotZ = sideDir * 0.15 * env;
            targetEyeClosure = Math.max(targetEyeClosure, 0.94 * env);
            targetBrowScowl = 0.04;
            if (env > 0.25) {
              showTongue = true;
              tongueLickCycle = (lickWave + 1) * 0.5;
              mouthOpenScaleY = 0.42 + tongueLickCycle * 0.32;
            }
          } else if (ud.behaviorState === 'slowEyeClose') {
            // Cozy cat nap nod & slow eye-closing rest!
            targetEyeClosure = Math.max(targetEyeClosure, Math.min(1.0, env * 1.25));
            targetHeadRotX = 0.16 * env;
            targetBrowScowl = 0.02;
          } else if (ud.behaviorState === 'grumpyScowl') {
            // Reference image_973dbd.png Grumpy Boss Scowl: deeply furrowed brows & half-closed glare!
            targetBrowScowl = 0.36 * env + 0.14 * (1 - env);
            targetEyeClosure = 0.48 * env + 0.12 * (1 - env);
            targetPupilScaleX = 0.38;
            targetHeadRotX = -0.06 * env;
            targetHeadRotY = Math.sin(tSec * 2.0 + phase) * 0.16 * env;
          } else if (ud.behaviorState === 'yawning') {
            // Big sleepy cat yawn: tilt head back, close eyes tightly, open jaw wide & curl pink tongue!
            targetHeadRotX = -0.26 * env;
            targetEyeClosure = Math.max(targetEyeClosure, Math.min(1.0, env * 1.3));
            targetLegLRotX = -0.35 * env;
            targetLegRRotX = -0.35 * env;
            targetBrowScowl = -0.08 * env;
            if (env > 0.2) {
              showTongue = true;
              tongueLickCycle = env;
              mouthOpenScaleY = 1.25 * env;
            }
          } else if (ud.behaviorState === 'kneadingPaws') {
            // "Making biscuits": alternating left & right 4-toed front paws lifting & pressing with happy closed eyes!
            const kneadL = Math.max(0, Math.sin(tSec * 6.5 + phase));
            const kneadR = Math.max(0, Math.sin(tSec * 6.5 + phase + Math.PI));
            targetLegLRotX = -0.45 * kneadL * env;
            targetLegRRotX = -0.45 * kneadR * env;
            targetEyeClosure = 0.0;
            targetHeadRotZ = Math.sin(tSec * 3.25 + phase) * 0.10 * env;
          } else if (ud.behaviorState === 'curiousTilt') {
            // Alert curious head-tilt & wide-eyed scan
            const tiltSign = (phase > Math.PI) ? 1 : -1;
            targetHeadRotZ = tiltSign * 0.28 * env;
            targetHeadRotY = Math.sin(tSec * 2.4 + phase) * 0.28 * env;
            targetEyeClosure = 0.0;
            targetBrowScowl = -0.06 * env;
            targetPupilScaleX = 0.92;
          }

          // Lifelike Natural Cat Blinking (quick 180ms blink every 2.5s to 5s)
          if (!ud.isBlinking && nowMs >= ud.nextBlinkTime) {
            ud.isBlinking = true;
            ud.blinkStart = nowMs;
            ud.isDoubleBlink = Math.random() < 0.25;
            ud.blinkDuration = ud.isDoubleBlink ? 360 : 180;
          }
          let activeBlinkAmount = 0;
          if (ud.isBlinking) {
            const bElapsed = nowMs - ud.blinkStart;
            if (bElapsed < ud.blinkDuration) {
              if (ud.isDoubleBlink) {
                if (bElapsed < 160) {
                  activeBlinkAmount = Math.sin((bElapsed / 160) * Math.PI);
                } else if (bElapsed >= 200) {
                  activeBlinkAmount = Math.sin(((bElapsed - 200) / 160) * Math.PI);
                }
              } else {
                activeBlinkAmount = Math.sin((bElapsed / ud.blinkDuration) * Math.PI);
              }
              targetEyeClosure = Math.max(targetEyeClosure, activeBlinkAmount);
            } else {
              ud.isBlinking = false;
              ud.nextBlinkTime = nowMs + 2500 + Math.random() * 2500;
            }
          }

          // Smooth breathing & selected bounce on body
          if (body) {
            const breath = 1 + Math.sin(tSec * 2.8 + phase) * 0.022;
            body.scale.set(1, breath, 1);
            body.rotation.x = 0;
            if (appState.selectedSquare && ud.square === appState.selectedSquare) {
              body.position.y = (ud.catBaseY || 0.02) + 0.08 + Math.abs(Math.sin(tSec * 6.5)) * 0.09;
            } else {
              body.position.y = ud.catBaseY || 0.02;
            }
          }

          // Apply articulated front leg rotations (paw licking, kneading, yawning stretch)
          if (legL) {
            legL.rotation.x += (targetLegLRotX - legL.rotation.x) * 0.18;
            legL.rotation.z += (targetLegLRotZ - legL.rotation.z) * 0.18;
          }
          if (legR) {
            legR.rotation.x += (targetLegRRotX - legR.rotation.x) * 0.18;
            legR.rotation.z += (targetLegRRotZ - legR.rotation.z) * 0.18;
          }

          // Apply head rotations
          if (head) {
            head.rotation.x += (targetHeadRotX - head.rotation.x) * 0.18;
            head.rotation.y += (targetHeadRotY - head.rotation.y) * 0.18;
            head.rotation.z += (targetHeadRotZ - head.rotation.z) * 0.18;
          }

          // Apply 3D Pink Tongue & Openable Mouth Cavity animations
          if (tongue && mouthOpen) {
            tongue.visible = showTongue;
            mouthOpen.visible = showTongue;
            if (showTongue) {
              mouthOpen.scale.y = mouthOpenScaleY;
              tongue.position.z = 0.014 + tongueLickCycle * 0.026;
              tongue.position.y = -0.014 + Math.sin(tongueLickCycle * Math.PI) * 0.012;
              tongue.rotation.x = 0.35 - tongueLickCycle * 0.65;
            }
          }

          // Apply 3D Brow Ridges (Reference image_973dbd.png scowl / curious raise)
          if (ud.brows && ud.brows.length === 2) {
            ud.brows[0].rotation.z += (-targetBrowScowl - ud.brows[0].rotation.z) * 0.2;
            ud.brows[1].rotation.z += (targetBrowScowl - ud.brows[1].rotation.z) * 0.2;
          }

          // Apply Crisp 3D Upper Eyelid Rotation (tucked UP by default, only closes during active blink)
          const lerpRate = ud.isBlinking ? 0.65 : 0.30;
          ud.eyeClosure = (ud.eyeClosure || 0) + (targetEyeClosure - (ud.eyeClosure || 0)) * lerpRate;
          if (ud.upperLids && ud.upperLids.length === 2) {
            const lidRotX = -0.38 + ud.eyeClosure * 1.15;
            ud.upperLids[0].rotation.x = lidRotX;
            ud.upperLids[1].rotation.x = lidRotX;
          }
          if (ud.eyeBallGroups && ud.eyeBallGroups.length === 2) {
            ud.eyeBallGroups[0].scale.y = 1.0;
            ud.eyeBallGroups[1].scale.y = 1.0;
          }
          if (ud.pupilMeshes && ud.pupilMeshes.length === 2) {
            ud.pupilMeshes[0].scale.x += (targetPupilScaleX - ud.pupilMeshes[0].scale.x) * 0.15;
            ud.pupilMeshes[1].scale.x += (targetPupilScaleX - ud.pupilMeshes[1].scale.x) * 0.15;
          }
          if (ud.closedEyeLines && ud.closedEyeLines.length === 2) {
            const isClosed = ud.eyeClosure > 0.75;
            ud.closedEyeLines[0].visible = isClosed;
            ud.closedEyeLines[1].visible = isClosed;
          }
        }

        // Tail swish & Ear twitch
        if (ud.tailGroup) {
          ud.tailGroup.rotation.z = Math.sin(tSec * 3.0 + phase) * 0.28;
        }
        if (ud.earL && ud.earR) {
          const twitch = Math.sin(tSec * 7.5 + phase) > 0.92 ? 0.18 : 0;
          const baseEarZ = ud.type === 'p' ? 0.36 : 0.24;
          ud.earL.rotation.z = baseEarZ + twitch;
          ud.earR.rotation.z = -baseEarZ - twitch * 0.6;
        }
      });

      // 4. Process Active Move & Multi-Phase Action POV Choreography
      if (activeMoveAnim) {
        const elapsed = nowMs - activeMoveAnim.startTime;
        const rawT = Math.min(1, elapsed / activeMoveAnim.duration);
        const { attackerRig, defenderRig, rookRig, rookFromPos, rookToPos, fromPos, toPos, moveObj, isCapture } = activeMoveAnim;

        const dx = toPos.x - fromPos.x;
        const dz = toPos.z - fromPos.z;

        // Orient cat toward target square
        if (Math.abs(dx) + Math.abs(dz) > 0.01) {
          attackerRig.rotation.y = Math.atan2(dx, dz);
        }

        if (rawT < 0.18) {
          // PHASE 1: Anticipation / Crouch / Body Coil
          const coilT = rawT / 0.18;
          const coilDip = Math.sin(coilT * Math.PI) * 0.12;
          attackerRig.position.copy(fromPos);
          attackerRig.position.y = -coilDip;
          if (attackerRig.userData.bodyGroup) {
            attackerRig.userData.bodyGroup.scale.set(1.08, 0.76, 1.15);
            attackerRig.userData.bodyGroup.rotation.x = -0.15;
          }
          if (attackerRig.userData.tailGroup) {
            attackerRig.userData.tailGroup.rotation.z = Math.sin(nowMs * 0.035) * 0.65;
          }
          if (attackerRig.userData.frontLegsGroup) {
            attackerRig.userData.frontLegsGroup.rotation.x = 0.22;
          }
        } else if (rawT < 0.76) {
          // PHASE 2: Airborne Pounce Arc with Outstretched Front Paws
          const pounceT = (rawT - 0.18) / 0.58;
          const easeT = pounceT < 0.5 ? 2 * pounceT * pounceT : 1 - Math.pow(-2 * pounceT + 2, 2) / 2;
          const arcHeight = moveObj.piece === 'n' ? 1.65 : (isCapture ? 1.05 : 0.65);
          attackerRig.position.lerpVectors(fromPos, toPos, easeT);
          attackerRig.position.y = Math.sin(pounceT * Math.PI) * arcHeight;

          if (attackerRig.userData.bodyGroup) {
            const stretch = Math.sin(pounceT * Math.PI);
            attackerRig.userData.bodyGroup.scale.set(1 - stretch * 0.14, 1 - stretch * 0.20, 1 + stretch * 0.46);
            attackerRig.userData.bodyGroup.rotation.x = (pounceT - 0.5) * 0.72;
          }
          if (attackerRig.userData.frontLegsGroup) {
            attackerRig.userData.frontLegsGroup.rotation.x = -Math.sin(pounceT * Math.PI) * 1.05;
          }
          if (attackerRig.userData.tailGroup) {
            attackerRig.userData.tailGroup.rotation.z = -0.25;
          }
          if (rookRig && rookFromPos && rookToPos) {
            rookRig.position.lerpVectors(rookFromPos, rookToPos, easeT);
          }
        } else {
          // PHASE 3: Landing / Claw Slash Strike / Impact Reaction
          attackerRig.position.copy(toPos);
          const landT = (rawT - 0.76) / 0.24;

          if (isCapture) {
            if (!activeMoveAnim.impactPlayed) {
              activeMoveAnim.impactPlayed = true;
              playSoundEffect('captureImpact');
              spawnCaptureSparkleBurst(toPos, '#fde047');
              spawnAttackClawSlashEffect(toPos, dx, dz);
            }
            // Dynamic camera micro-shake on claw impact
            if (landT < 0.45) {
              const shake = (0.45 - landT) * 0.14;
              camState.target.x += (Math.random() - 0.5) * shake;
              camState.target.y += (Math.random() - 0.5) * shake;
            }
            // Attacker right paw claw swipe
            if (attackerRig.userData.legRGroup) {
              attackerRig.userData.legRGroup.rotation.x = Math.sin(landT * Math.PI) * 1.35;
            }
            // Defender cat knockback tumble, spin & poof
            if (defenderRig) {
              const defT = Math.min(1, landT * 1.4);
              defenderRig.rotation.y += 0.55;
              defenderRig.position.y = defT * 0.85;
              defenderRig.position.x = toPos.x + (dx !== 0 ? Math.sign(dx) * defT * 0.35 : 0);
              defenderRig.position.z = toPos.z + (dz !== 0 ? Math.sign(dz) * defT * 0.35 : 0);
              defenderRig.scale.setScalar(Math.max(0.01, 1 - defT));
            }
            if (attackerRig.userData.bodyGroup) {
              const squash = Math.sin(landT * Math.PI) * 0.22;
              attackerRig.userData.bodyGroup.scale.set(1 + squash, 1 - squash, 1);
              attackerRig.userData.bodyGroup.rotation.x = 0;
            }
          } else {
            // Normal move landing squash and recovery
            const squash = Math.sin(landT * Math.PI) * 0.26;
            if (attackerRig.userData.bodyGroup) {
              attackerRig.userData.bodyGroup.scale.set(1 + squash, 1 - squash, 1);
              attackerRig.userData.bodyGroup.rotation.x = 0;
            }
            if (attackerRig.userData.frontLegsGroup) {
              attackerRig.userData.frontLegsGroup.rotation.x = 0;
            }
          }
        }

        // Return Camera Smoothly to saved overview view at end of move
        if (rawT >= 0.88 && camState.savedPreCapture) {
          camState.lerpSpeed = 0.12;
          camState.desiredTheta = camState.savedPreCapture.theta;
          camState.desiredPhi = Math.max(0.98, camState.savedPreCapture.phi);
          camState.desiredRadius = camState.savedPreCapture.radius;
          camState.desiredTarget.copy(camState.savedPreCapture.target);
          camState.savedPreCapture = null;
        }

        if (rawT >= 1) {
          const cb = activeMoveAnim.onComplete;
          activeMoveAnim = null;
          const banner = document.getElementById('hud-capture-banner');
          if (banner) banner.classList.add('hidden');
          // Reset rig transform offsets
          if (attackerRig.userData.bodyGroup) {
            attackerRig.userData.bodyGroup.scale.set(1, 1, 1);
            attackerRig.userData.bodyGroup.rotation.set(0, 0, 0);
          }
          if (attackerRig.userData.frontLegsGroup) {
            attackerRig.userData.frontLegsGroup.rotation.set(0, 0, 0);
          }
          if (attackerRig.userData.legRGroup) {
            attackerRig.userData.legRGroup.rotation.set(0, 0, 0);
          }
          sync3DPiecesWithChessState();
          if (cb) cb();
        }
      }

      // 5. Animate Permanent Map-Specific 3D Environmental Effects Across the Chessboard
      if (particlesGroup3d) {
        particlesGroup3d.children.forEach((p) => {
          if (!p.userData || p.userData.isStaticBorderPetal) return;
          const ud = p.userData;

          if (ud.modeType === 'hover') {
            p.position.y = ud.baseY + Math.sin(tSec * ud.swaySpeed + ud.swayPhase) * 0.45;
            p.position.x += Math.cos(tSec * 0.8 + ud.swayPhase) * 0.008;
            p.position.z += Math.sin(tSec * 0.7 + ud.swayPhase) * 0.008;
          } else {
            p.position.y += ud.vy * 0.016;
            p.position.x += (ud.vx + Math.sin(tSec * ud.swaySpeed + ud.swayPhase) * 0.32) * 0.016;
            p.position.z += (ud.vz + Math.cos(tSec * (ud.swaySpeed * 0.85) + ud.swayPhase) * 0.28) * 0.016;
          }

          p.rotation.x += (ud.rotSpeedX || 1.1) * 0.016;
          p.rotation.y += (ud.rotSpeedY || 1.4) * 0.016;
          p.rotation.z += (ud.rotSpeedZ || 0.9) * 0.016;

          if (ud.modeType === 'rise') {
            if (p.position.y > 7.5) {
              p.position.y = 0.15;
              p.position.x = (Math.random() - 0.5) * 10.4;
              p.position.z = (Math.random() - 0.5) * 10.4;
            }
          } else if (ud.modeType !== 'hover') {
            if (p.position.y < 0.12) {
              p.position.y = 7.2 + Math.random() * 0.8;
              p.position.x = (Math.random() - 0.5) * 10.4;
              p.position.z = (Math.random() - 0.5) * 10.4;
            }
          }

          if (p.position.x > 5.8) p.position.x = -5.6;
          if (p.position.x < -5.8) p.position.x = 5.6;
          if (p.position.z > 5.8) p.position.z = -5.6;
          if (p.position.z < -5.8) p.position.z = 5.6;
        });
      }

      for (let i = activeSparkleBursts.length - 1; i >= 0; i--) {
        const burst = activeSparkleBursts[i];
        const age = (nowMs - burst.startTime) / 650;
        if (age >= 1) {
          burst.particles.forEach((m) => fxSparklesGroup3d.remove(m));
          activeSparkleBursts.splice(i, 1);
        } else {
          burst.particles.forEach((m) => {
            m.position.x += m.userData.vx * 0.016;
            m.position.y += (m.userData.vy - age * 3.8) * 0.016;
            m.position.z += m.userData.vz * 0.016;
            m.material.opacity = 1 - age;
            m.rotation.x += 0.14;
          });
        }
      }

      for (let i = activeClawSlashEffects.length - 1; i >= 0; i--) {
        const fx = activeClawSlashEffects[i];
        const age = (nowMs - fx.startTime) / fx.duration;
        if (age >= 1) {
          fxSparklesGroup3d.remove(fx.group);
          fx.group.traverse((c) => {
            if (c.geometry) c.geometry.dispose();
          });
          if (fx.clawMat) fx.clawMat.dispose();
          if (fx.flashMat) fx.flashMat.dispose();
          activeClawSlashEffects.splice(i, 1);
        } else {
          const scale = 1 + age * 0.45;
          fx.group.scale.set(scale, scale, scale);
          fx.clawMat.opacity = Math.max(0, 1 - Math.pow(age, 1.8));
          fx.flashMat.opacity = Math.max(0, 1 - age * 2.2);
        }
      }

      renderer3d.render(scene3d, activeCamera);
    }

    let lastCanvasW = 0;
    let lastCanvasH = 0;

    function updateCameraTransform(instant = false) {
      const container = document.getElementById('canvas-3d-container');
      if (container && renderer3d) {
        const cw = container.clientWidth;
        const ch = container.clientHeight;
        if (cw > 20 && ch > 20 && (Math.abs(cw - lastCanvasW) > 2 || Math.abs(ch - lastCanvasH) > 2)) {
          lastCanvasW = cw;
          lastCanvasH = ch;
          onResize3DViewport();
        }
      }
      if (instant) {
        camState.theta = camState.desiredTheta;
        camState.phi = camState.desiredPhi;
        camState.radius = camState.desiredRadius;
        camState.target.copy(camState.desiredTarget);
      }
      if (!activeCamera) return;
      const aspect = (perspCamera && perspCamera.aspect) ? perspCamera.aspect : 1;
      const aspectScale = aspect < 1.0 ? (1.0 / Math.max(0.58, aspect)) : 1.0;
      const effectiveRadius = camState.radius * aspectScale;
      const sinPhi = Math.sin(camState.phi);
      const x = camState.target.x + effectiveRadius * sinPhi * Math.sin(camState.theta);
      const y = camState.target.y + effectiveRadius * Math.cos(camState.phi);
      const z = camState.target.z + effectiveRadius * sinPhi * Math.cos(camState.theta);
      activeCamera.position.set(x, y, z);
      activeCamera.lookAt(camState.target);
    }

    // Switch between 'overheadAuto' and 'diorama3d'
    function setCameraPlayMode(mode, instant = false) {
      camState.playMode = mode;
      const btnAuto = document.getElementById('btn-cam-mode-auto');
      const btnDio = document.getElementById('btn-cam-mode-diorama');
      if (btnAuto) btnAuto.classList.toggle('active-pill', mode === 'overheadAuto');
      if (btnDio) btnDio.classList.toggle('active-pill', mode === 'diorama3d');

      if (mode === 'overheadAuto') {
        camState.desiredTheta = appState.boardFlipped ? Math.PI : 0;
        camState.desiredPhi = 1.04;   // Fixed, crystal-clear 3D gameboard view
        camState.desiredRadius = 12.8;
        camState.desiredTarget.set(0, 0.25, 0);
      } else {
        camState.desiredTheta = (appState.boardFlipped ? Math.PI : 0) - 0.42;
        camState.desiredPhi = 1.04;
        camState.desiredRadius = 15.4;
        camState.desiredTarget.set(0, 0.35, -0.4);
      }
      if (instant) updateCameraTransform(true);
      else playSoundEffect('click');
    }

    // Toggle between Fixed Board Lock (🔒) and Free Movable/Zoom Mode (🔓)
    function setCameraLockMode(isLocked) {
      camState.cameraLocked = isLocked;
      const btnLock = document.getElementById('btn-cam-lock');
      const btnMovable = document.getElementById('btn-cam-movable');
      if (btnLock && btnMovable) {
        if (isLocked) {
          btnLock.className = "px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer bg-[#81b64c] text-[#1c1a17] shadow-sm";
          btnMovable.className = "px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer text-zinc-300 hover:text-white";
        } else {
          btnLock.className = "px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer text-zinc-300 hover:text-white";
          btnMovable.className = "px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer bg-[#81b64c] text-[#1c1a17] shadow-sm";
        }
      }
      if (isLocked) {
        // Smoothly return camera to fixed, stable gameboard view
        camState.desiredPhi = 1.04;
        camState.desiredTheta = (typeof appState !== 'undefined' && appState.boardFlipped) ? Math.PI : 0;
        camState.desiredRadius = 12.8;
        camState.desiredTarget.set(0, 0.25, 0);
        showToast('🔒 Gameboard View Locked');
      } else {
        showToast('🔓 Movable: Drag board to orbit, scroll or pinch to zoom!');
      }
      playSoundEffect('click');
    }
    window.setCameraLockMode = setCameraLockMode;

    function bind3DCanvasEvents(domElem) {
      domElem.addEventListener('contextmenu', (e) => e.preventDefault());
      domElem.style.touchAction = 'none';
      camState.cameraLocked = true; // Default to locked gameboard view

      domElem.addEventListener('pointerdown', (e) => {
        ensureAudioContext();
        camState.dragStartX = e.clientX;
        camState.dragStartY = e.clientY;
        camState.pointerMovedDist = 0;
        // In Movable mode (!cameraLocked), enable smooth drag orbit on any pointerdown!
        if (!camState.cameraLocked) {
          camState.isDragging = true;
        } else {
          camState.isDragging = false;
        }
      });

      window.addEventListener('pointermove', (e) => {
        if (!camState.isDragging || camState.cameraLocked) return;
        const dx = e.clientX - camState.dragStartX;
        const dy = e.clientY - camState.dragStartY;
        camState.dragStartX = e.clientX;
        camState.dragStartY = e.clientY;
        camState.pointerMovedDist += Math.hypot(dx, dy);
        camState.desiredTheta -= dx * 0.0075;
        camState.desiredPhi = Math.max(0.20, Math.min(1.44, camState.desiredPhi - dy * 0.0065));
      });

      window.addEventListener('pointerup', (e) => {
        const dist = camState.pointerMovedDist;
        camState.isDragging = false;
        if (dist < 14 && (e.target === domElem || domElem.contains(e.target))) {
          handle3DCanvasClick(e, domElem);
        }
      });

      domElem.addEventListener('wheel', (e) => {
        e.preventDefault();
        zoomCameraStep(e.deltaY > 0 ? 0.9 : -0.9);
      }, { passive: false });

      domElem.addEventListener('touchstart', (e) => {
        if (e.touches.length === 2) {
          const dx = e.touches[0].clientX - e.touches[1].clientX;
          const dy = e.touches[0].clientY - e.touches[1].clientY;
          camState.pinchStartDist = Math.hypot(dx, dy);
        }
      }, { passive: true });

      domElem.addEventListener('touchmove', (e) => {
        if (e.touches.length === 2 && camState.pinchStartDist > 10) {
          if (e.cancelable) e.preventDefault();
          const dx = e.touches[0].clientX - e.touches[1].clientX;
          const dy = e.touches[0].clientY - e.touches[1].clientY;
          const dist = Math.hypot(dx, dy);
          zoomCameraStep((camState.pinchStartDist - dist) * 0.03);
          camState.pinchStartDist = dist;
        }
      }, { passive: false });
    }

    function handle3DCanvasClick(e, domElem) {
      if (!raycaster3d || !activeCamera || !boardGroup3d) return;
      const rect = domElem.getBoundingClientRect();
      pointerNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointerNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster3d.setFromCamera(pointerNDC, activeCamera);

      // 1. Check Click on Interactive 3D Diorama Props (Boombox, Picnic, Cardboard Boxes, Lamp, Mouse)
      if (interactivePropMeshes.length > 0) {
        const propHits = raycaster3d.intersectObjects(interactivePropMeshes, true);
        if (propHits.length > 0) {
          let obj = propHits[0].object;
          while (obj && !obj.userData?.interactiveProp && obj.parent) {
            obj = obj.parent;
          }
          if (obj && obj.userData?.interactiveProp) {
            triggerInteractiveMapProp(obj.userData.interactiveProp);
            return;
          }
        }
      }

      // 2. Check Click on Legal Move Markers (dots / capture rings)
      if (markersGroup3d && markersGroup3d.children.length > 0) {
        const markerHits = raycaster3d.intersectObjects(markersGroup3d.children, true);
        for (const hit of markerHits) {
          if (hit.object.userData?.square) {
            onBoardSquareInteract(hit.object.userData.square);
            return;
          }
        }
      }

      // 3. Check Click on 3D Cat Pieces
      const pieceHits = raycaster3d.intersectObjects(piecesGroup3d.children, true);
      if (pieceHits.length > 0) {
        let obj = pieceHits[0].object;
        while (obj && !obj.userData?.square && obj.parent) {
          obj = obj.parent;
        }
        if (obj && obj.userData?.square) {
          onBoardSquareInteract(obj.userData.square);
          return;
        }
      }

      // 4. Check Click on 64 Stone Plaza Tiles
      const tilesList = Object.values(squareMeshesMap);
      const tileHits = raycaster3d.intersectObjects(tilesList.length > 0 ? tilesList : boardGroup3d.children, false);
      for (const hit of tileHits) {
        if (hit.object.userData?.isSquareTile && hit.object.userData.square) {
          onBoardSquareInteract(hit.object.userData.square);
          return;
        }
      }
    }
    // =========================================================================
