
(function () {
  'use strict';
  if (typeof THREE === 'undefined') return;

  const canvas = document.getElementById('ra-canvas');
  const renderer = new THREE.WebGLRenderer({
    canvas, antialias: false, alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.3));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0, 0, 38);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  const rand     = (a, b) => Math.random() * (b - a) + a;
  const PALETTE  = [0xff1a2e, 0xcc0000, 0xff4422, 0xff3366, 0xff6644, 0xffaa44];
  const rndColor = () => new THREE.Color(PALETTE[Math.floor(Math.random() * PALETTE.length)]);

  // ── 5×7 PIXEL FONT ──────────────────────────────────────
  const FONT = {
    A: [[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,1,1,1,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1]],
    Y: [[1,0,0,0,1],[1,0,0,0,1],[0,1,0,1,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0]],
    U: [[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0]],
    S: [[0,1,1,1,1],[1,0,0,0,0],[1,0,0,0,0],[0,1,1,1,0],[0,0,0,0,1],[0,0,0,0,1],[1,1,1,1,0]],
    H: [[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,1,1,1,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1]],
    R: [[1,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,1,1,1,0],[1,1,0,0,0],[1,0,1,0,0],[1,0,0,1,0]],
    J: [[0,0,1,1,1],[0,0,0,1,0],[0,0,0,1,0],[0,0,0,1,0],[0,0,0,1,0],[1,0,0,1,0],[0,1,1,0,0]],
  };

  // ── LAYOUT ──────────────────────────────────────────────
  const BSIZ      = 0.68;
  const BGAP      = 0.20;
  const BSTEP     = BSIZ + BGAP;
  const LET_W     = 5 * BSTEP;          // rendered width per letter
  const LET_GAP   = 0.90;               // gap between letters
  const LET_STEP  = LET_W + LET_GAP;
  const WORD_GAP  = 2.0;                // gap between words
  const ROW_H     = 7 * BSTEP;          // single row height
  const LINE_GAP  = 1.6;                // vertical gap between rows

  const LINE1 = ['A','Y','U','S','H'];
  const LINE2 = ['R','A','J'];

  function lineWidth(letters) {
    return letters.length * LET_W + (letters.length - 1) * LET_GAP;
  }

  const w1 = lineWidth(LINE1);
  const w2 = lineWidth(LINE2);

  // vertical center: two rows
  const totalH = ROW_H * 2 + LINE_GAP;
  const topY1  =  totalH / 2;             // top of line 1
  const topY2  =  topY1 - ROW_H - LINE_GAP;  // top of line 2

  const formPositions = [];

  function buildLine(letters, startX, topY) {
    letters.forEach((ch, li) => {
      const ox = startX + li * LET_STEP;
      FONT[ch].forEach((row, ry) => {
        row.forEach((cell, rx) => {
          if (cell) formPositions.push({
            x: ox + rx * BSTEP,
            y: topY - ry * BSTEP,
            z: 0,
          });
        });
      });
    });
  }

  buildLine(LINE1, -w1 / 2, topY1);
  buildLine(LINE2, -w2 / 2, topY2);

  const FORM_N    = formPositions.length;
  const AMBIENT_N = 28;
  const TOTAL     = FORM_N + AMBIENT_N;

  // ── INSTANCED MESH ───────────────────────────────────────
  const geo = new THREE.BoxGeometry(BSIZ, BSIZ, BSIZ);

  const mat = new THREE.MeshBasicMaterial({
    vertexColors: true, transparent: true, opacity: 0.88,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const mesh = new THREE.InstancedMesh(geo, mat, TOTAL);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(mesh);
  for (let i = 0; i < TOTAL; i++) mesh.setColorAt(i, rndColor());
  mesh.instanceColor.needsUpdate = true;

  // Glow pass (back-face, larger, low opacity)
  const glowMat = new THREE.MeshBasicMaterial({
    vertexColors: true, transparent: true, opacity: 0.15,
    blending: THREE.AdditiveBlending, depthWrite: false,
    side: THREE.BackSide,
  });
  const glow = new THREE.InstancedMesh(geo, glowMat, TOTAL);
  glow.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(glow);
  for (let i = 0; i < TOTAL; i++) glow.setColorAt(i, rndColor());
  glow.instanceColor.needsUpdate = true;

  // ── CUBE STATES ──────────────────────────────────────────
  const dummy  = new THREE.Object3D();
  const states = [];

  for (let i = 0; i < FORM_N; i++) {
    const fp = formPositions[i];
    states.push({
      x: rand(-40,40), y: rand(-24,24), z: rand(-20,8),
      tx: fp.x, ty: fp.y, tz: fp.z,
      rx: rand(0,Math.PI*2), ry: rand(0,Math.PI*2), rz: 0,
      vrx: rand(-0.025,0.025), vry: rand(-0.030,0.030),
      vx: rand(-0.005,0.005), vy: rand(-0.004,0.004), vz: rand(-0.002,0.002),
      scale: rand(0.5,1.2),
      delay: rand(0, 1.0),
      explodeDir: null,
      isFormation: true,
    });
  }
  for (let i = FORM_N; i < TOTAL; i++) {
    states.push({
      x: rand(-38,38), y: rand(-22,22), z: rand(-28,7),
      tx:0, ty:0, tz:0,
      rx: rand(0,Math.PI*2), ry: rand(0,Math.PI*2), rz: rand(0,Math.PI*2),
      vrx: rand(-0.006,0.006), vry: rand(-0.008,0.008), vrz: rand(-0.003,0.003),
      vx: rand(-0.005,0.005), vy: rand(-0.004,0.004), vz: rand(-0.002,0.002),
      scale: rand(0.35,2.2),
      delay:0, explodeDir:null, isFormation:false,
    });
  }

  // ── PARTICLES ────────────────────────────────────────────
  const P    = 180;
  const pPos = new Float32Array(P * 3);
  const pCol = new Float32Array(P * 3);
  const pSpd = [];
  for (let i = 0; i < P; i++) {
    pPos[i*3]=rand(-42,42); pPos[i*3+1]=rand(-26,26); pPos[i*3+2]=rand(-30,7);
    const c=rndColor(); pCol[i*3]=c.r; pCol[i*3+1]=c.g; pCol[i*3+2]=c.b;
    pSpd.push({ vx:rand(-0.007,0.007), vy:rand(-0.006,0.006), vz:rand(-0.002,0.002) });
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos,3));
  pGeo.setAttribute('color',    new THREE.BufferAttribute(pCol,3));
  const pMat = new THREE.PointsMaterial({
    size:0.12, vertexColors:true, transparent:true, opacity:0.65,
    blending:THREE.AdditiveBlending, depthWrite:false,
  });
  scene.add(new THREE.Points(pGeo, pMat));

  // ── MOUSE PARALLAX ───────────────────────────────────────
  let mx=0, my=0, camTX=0, camTY=0;
  document.addEventListener('mousemove', e => {
    mx=(e.clientX/window.innerWidth -0.5)*2;
    my=(e.clientY/window.innerHeight-0.5)*2;
  });

  
  const T_ASM_START   = 1.4;
  const T_ASM_END     = 4.8;
  const T_HOLD_END    = 8.5;
  const T_EXPLODE_END = 10.5;

  const easeOut = x => 1 - Math.pow(1 - Math.max(0,Math.min(1,x)), 3);
  const lerp    = (a,b,t) => a + (b-a)*t;

  function setInst(i, x, y, z, rx, ry, rz, s) {
    dummy.position.set(x,y,z);
    dummy.rotation.set(rx,ry,rz);
    dummy.scale.setScalar(s);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    dummy.scale.setScalar(s * 1.7);
    dummy.updateMatrix();
    glow.setMatrixAt(i, dummy.matrix);
  }

  let t = 0;

  function animate() {
    requestAnimationFrame(animate);
    if (document.hidden) return;
    t += 0.016;

    camTX += (mx*1.8 - camTX)*0.028;
    camTY += (-my*1.2 - camTY)*0.028;
    camera.position.x += (camTX - camera.position.x)*0.045;
    camera.position.y += (camTY - camera.position.y)*0.045;
    camera.lookAt(0,0,0);
    glowMat.opacity = 0.10 + Math.sin(t*1.8)*0.06;

    for (let i = 0; i < TOTAL; i++) {
      const s  = states[i];
      const et = t - s.delay;

      if (s.isFormation) {
        if (et < T_ASM_START) {
          s.x+=s.vx*0.22; s.y+=s.vy*0.22;
          s.rx+=s.vrx; s.ry+=s.vry;
          const fi = Math.min(Math.max(et,0)/T_ASM_START,1);
          setInst(i, s.x, s.y, s.z, s.rx, s.ry, 0, 0.2+fi*0.5);

        } else if (et < T_ASM_END) {
          const p  = (et-T_ASM_START)/(T_ASM_END-T_ASM_START);
          const ep = easeOut(p);
          s.x=lerp(s.x,s.tx,0.08+ep*0.05);
          s.y=lerp(s.y,s.ty,0.08+ep*0.05);
          s.z=lerp(s.z,s.tz,0.06);
          s.rx=lerp(s.rx,0,0.10);
          s.ry=lerp(s.ry,0,0.10);
          setInst(i, s.x, s.y, s.z, s.rx, s.ry, 0, lerp(0.6,1.0,ep));

        } else if (et < T_HOLD_END) {
          const rot   = (et-T_ASM_END)*0.14;
          const pulse = 1.0+Math.sin(t*2.8+i*0.35)*0.045;
          const cx    = s.tx*Math.cos(rot)-s.tz*Math.sin(rot);
          const cz    = s.tx*Math.sin(rot)+s.tz*Math.cos(rot);
          s.x=cx; s.y=s.ty; s.z=cz;
          setInst(i, s.x, s.y, s.z, 0, rot, 0, pulse);

        } else if (et < T_EXPLODE_END) {
          if (!s.explodeDir) {
            const angle = Math.random()*Math.PI*2;
            const spd   = rand(0.22,0.65);
            s.explodeDir = {
              x: Math.cos(angle)*spd + (s.tx>0?0.18:-0.18),
              y: Math.sin(angle)*spd*0.55,
              z: rand(-0.25,0.04),
            };
          }
          s.x+=s.explodeDir.x*0.52;
          s.y+=s.explodeDir.y*0.52;
          s.z+=s.explodeDir.z*0.52;
          s.rx+=s.vrx*4; s.ry+=s.vry*4;
          const sh=easeOut((et-T_HOLD_END)/(T_EXPLODE_END-T_HOLD_END));
          setInst(i, s.x, s.y, s.z, s.rx, s.ry, 0, Math.max(0.05,1.0-sh*0.7));

        } else {
          s.x+=s.vx; s.y+=s.vy; s.z+=s.vz;
          s.rx+=s.vrx; s.ry+=s.vry;
          if(s.x> 38) s.x=-38; if(s.x<-38) s.x= 38;
          if(s.y> 24) s.y=-24; if(s.y<-24) s.y= 24;
          if(s.z> 10) s.z=-28; if(s.z<-28) s.z= 10;
          setInst(i, s.x, s.y, s.z, s.rx, s.ry, 0, s.scale*(0.93+Math.sin(t*1.1+i)*0.07));
        }

      } else {
        s.x+=s.vx; s.y+=s.vy; s.z+=s.vz;
        s.rx+=s.vrx; s.ry+=s.vry; s.rz+=s.vrz;
        if(s.x> 40) s.x=-40; if(s.x<-40) s.x= 40;
        if(s.y> 24) s.y=-24; if(s.y<-24) s.y= 24;
        if(s.z> 10) s.z=-28; if(s.z<-28) s.z= 10;
        setInst(i, s.x, s.y, s.z, s.rx, s.ry, s.rz, s.scale*(0.86+Math.sin(t*0.9+i*0.7)*0.15));
      }
    }

    mesh.instanceMatrix.needsUpdate = true;
    glow.instanceMatrix.needsUpdate = true;

    const pa = pGeo.attributes.position.array;
    for (let i = 0; i < P; i++) {
      pa[i*3]+=pSpd[i].vx; pa[i*3+1]+=pSpd[i].vy; pa[i*3+2]+=pSpd[i].vz;
      if(pa[i*3]  > 44) pa[i*3]  =-44; if(pa[i*3]  <-44) pa[i*3]  = 44;
      if(pa[i*3+1]> 28) pa[i*3+1]=-28; if(pa[i*3+1]<-28) pa[i*3+1]= 28;
      if(pa[i*3+2]>  9) pa[i*3+2]=-30; if(pa[i*3+2]<-30) pa[i*3+2]=  9;
    }
    pGeo.attributes.position.needsUpdate = true;
    pMat.opacity = 0.45+Math.sin(t*0.6)*0.22;

    renderer.render(scene, camera);
  }

  animate();
})();
