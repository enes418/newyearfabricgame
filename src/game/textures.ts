import * as THREE from 'three';

export interface ProceduralTextures {
  belt: THREE.CanvasTexture;
  floorWood: THREE.CanvasTexture;
  brickWall: THREE.CanvasTexture;
  snowGround: THREE.CanvasTexture;
  contactShadow: THREE.CanvasTexture;
  snowflake: THREE.CanvasTexture;
  factorySign: THREE.CanvasTexture;
  hazardStripe: THREE.CanvasTexture;
  dispose: () => void;
}

export function createProceduralTextures(maxAnisotropy: number): ProceduralTextures {
  const aniso = Math.min(maxAnisotropy || 4, 8);

  // 1. Conveyor Belt Chevron Texture (horizontally tileable)
  const beltCanvas = document.createElement('canvas');
  beltCanvas.width = 256;
  beltCanvas.height = 128;
  const bCtx = beltCanvas.getContext('2d')!;
  bCtx.fillStyle = '#182232';
  bCtx.fillRect(0, 0, 256, 128);

  bCtx.fillStyle = '#223045';
  for (let x = 0; x < 256; x += 32) {
    bCtx.fillRect(x, 0, 12, 128);
  }

  bCtx.strokeStyle = '#facc15';
  bCtx.lineWidth = 6;
  bCtx.lineCap = 'round';
  bCtx.lineJoin = 'round';
  for (let x = 32; x < 256; x += 64) {
    bCtx.beginPath();
    bCtx.moveTo(x - 16, 28);
    bCtx.lineTo(x + 8, 64);
    bCtx.lineTo(x - 16, 100);
    bCtx.stroke();
  }

  bCtx.fillStyle = '#dc2626';
  bCtx.fillRect(0, 0, 256, 9);
  bCtx.fillRect(0, 119, 256, 9);

  const belt = new THREE.CanvasTexture(beltCanvas);
  belt.colorSpace = THREE.SRGBColorSpace;
  belt.wrapS = THREE.RepeatWrapping;
  belt.wrapT = THREE.RepeatWrapping;
  belt.repeat.set(4, 1);
  belt.anisotropy = aniso;

  // 2. Polished Workshop Oak Planks
  const woodCanvas = document.createElement('canvas');
  woodCanvas.width = 512;
  woodCanvas.height = 512;
  const wCtx = woodCanvas.getContext('2d')!;
  wCtx.fillStyle = '#4e311c';
  wCtx.fillRect(0, 0, 512, 512);

  const plankPalette = ['#684226', '#5c3920', '#70482a', '#613c22'];
  const plankH = 64;
  for (let row = 0; row < 8; row++) {
    const offset = (row % 2) * 128;
    for (let col = -1; col < 3; col++) {
      const px = col * 256 + offset;
      const py = row * plankH;
      wCtx.fillStyle = plankPalette[(row + col + 4) % plankPalette.length];
      wCtx.fillRect(px + 2, py + 2, 252, plankH - 4);

      wCtx.strokeStyle = 'rgba(35, 18, 8, 0.28)';
      wCtx.lineWidth = 2;
      for (let g = 0; g < 3; g++) {
        wCtx.beginPath();
        wCtx.moveTo(px + 8, py + 16 + g * 16);
        wCtx.lineTo(px + 244, py + 16 + g * 16);
        wCtx.stroke();
      }
      // Brass nail accents
      wCtx.fillStyle = 'rgba(217, 179, 92, 0.35)';
      wCtx.fillRect(px + 10, py + 12, 4, 4);
      wCtx.fillRect(px + 10, py + 48, 4, 4);
    }
  }
  const floorWood = new THREE.CanvasTexture(woodCanvas);
  floorWood.colorSpace = THREE.SRGBColorSpace;
  floorWood.wrapS = THREE.RepeatWrapping;
  floorWood.wrapT = THREE.RepeatWrapping;
  floorWood.repeat.set(4, 4);
  floorWood.anisotropy = aniso;

  // 3. Architectural Brick Wall Texture
  const brickCanvas = document.createElement('canvas');
  brickCanvas.width = 256;
  brickCanvas.height = 256;
  const brCtx = brickCanvas.getContext('2d')!;
  brCtx.fillStyle = '#cfc7be';
  brCtx.fillRect(0, 0, 256, 256);

  const brickColors = ['#8c2b2b', '#9e3434', '#7b2323', '#a63e3e'];
  for (let r = 0; r < 8; r++) {
    const off = (r % 2) * 32;
    for (let c = -1; c < 5; c++) {
      brCtx.fillStyle = brickColors[(r * 3 + c + 8) % brickColors.length];
      brCtx.fillRect(c * 64 + off + 3, r * 32 + 3, 58, 26);
    }
  }
  const brickWall = new THREE.CanvasTexture(brickCanvas);
  brickWall.colorSpace = THREE.SRGBColorSpace;
  brickWall.wrapS = THREE.RepeatWrapping;
  brickWall.wrapT = THREE.RepeatWrapping;
  brickWall.repeat.set(4, 2);
  brickWall.anisotropy = aniso;

  // 4. Snowy Ground Texture
  const snowCanvas = document.createElement('canvas');
  snowCanvas.width = 256;
  snowCanvas.height = 256;
  const sCtx = snowCanvas.getContext('2d')!;
  sCtx.fillStyle = '#e7f1fa';
  sCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 420; i++) {
    const x = (i * 73) % 256;
    const y = (i * 139) % 256;
    sCtx.fillStyle = i % 3 === 0 ? 'rgba(255,255,255,0.85)' : 'rgba(186,214,240,0.45)';
    sCtx.fillRect(x, y, 4, 4);
  }
  const snowGround = new THREE.CanvasTexture(snowCanvas);
  snowGround.colorSpace = THREE.SRGBColorSpace;
  snowGround.wrapS = THREE.RepeatWrapping;
  snowGround.wrapT = THREE.RepeatWrapping;
  snowGround.repeat.set(16, 16);
  snowGround.anisotropy = aniso;

  // 5. Soft Radial Contact Shadow
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 128;
  shadowCanvas.height = 128;
  const shCtx = shadowCanvas.getContext('2d')!;
  const grad = shCtx.createRadialGradient(64, 64, 6, 64, 64, 62);
  grad.addColorStop(0, 'rgba(6, 12, 24, 0.65)');
  grad.addColorStop(0.6, 'rgba(6, 12, 24, 0.25)');
  grad.addColorStop(1, 'rgba(6, 12, 24, 0)');
  shCtx.fillStyle = grad;
  shCtx.fillRect(0, 0, 128, 128);
  const contactShadow = new THREE.CanvasTexture(shadowCanvas);

  // 6. Crisp Snowflake Particle Sprite
  const flakeCanvas = document.createElement('canvas');
  flakeCanvas.width = 64;
  flakeCanvas.height = 64;
  const fCtx = flakeCanvas.getContext('2d')!;
  const fGrad = fCtx.createRadialGradient(32, 32, 2, 32, 32, 28);
  fGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  fGrad.addColorStop(0.45, 'rgba(230, 245, 255, 0.85)');
  fGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  fCtx.fillStyle = fGrad;
  fCtx.fillRect(0, 0, 64, 64);
  const snowflake = new THREE.CanvasTexture(flakeCanvas);
  snowflake.colorSpace = THREE.SRGBColorSpace;

  // 7. Crisp Factory Architectural Signboard Texture
  const signCanvas = document.createElement('canvas');
  signCanvas.width = 512;
  signCanvas.height = 128;
  const sgCtx = signCanvas.getContext('2d')!;
  sgCtx.fillStyle = '#132136';
  sgCtx.fillRect(0, 0, 512, 128);
  sgCtx.strokeStyle = '#f59e0b';
  sgCtx.lineWidth = 8;
  sgCtx.strokeRect(8, 8, 496, 112);
  sgCtx.fillStyle = '#fef08a';
  sgCtx.font = 'bold 38px sans-serif';
  sgCtx.textAlign = 'center';
  sgCtx.textBaseline = 'middle';
  sgCtx.fillText('CHRISTMAS FACTORY', 256, 50);
  sgCtx.fillStyle = '#86efac';
  sgCtx.font = 'bold 20px sans-serif';
  sgCtx.fillText('KUZEY KUTBU HEDİYE ÜRETİM MERKEZİ', 256, 92);
  const factorySign = new THREE.CanvasTexture(signCanvas);
  factorySign.colorSpace = THREE.SRGBColorSpace;
  factorySign.anisotropy = aniso;

  // 8. Industrial Hazard / Loading Bay Floor Stripe
  const hazCanvas = document.createElement('canvas');
  hazCanvas.width = 256;
  hazCanvas.height = 64;
  const hzCtx = hazCanvas.getContext('2d')!;
  hzCtx.fillStyle = '#1e293b';
  hzCtx.fillRect(0, 0, 256, 64);
  hzCtx.fillStyle = '#eab308';
  for (let x = -64; x < 320; x += 48) {
    hzCtx.beginPath();
    hzCtx.moveTo(x, 64);
    hzCtx.lineTo(x + 24, 64);
    hzCtx.lineTo(x + 56, 0);
    hzCtx.lineTo(x + 32, 0);
    hzCtx.closePath();
    hzCtx.fill();
  }
  const hazardStripe = new THREE.CanvasTexture(hazCanvas);
  hazardStripe.colorSpace = THREE.SRGBColorSpace;
  hazardStripe.wrapS = THREE.RepeatWrapping;
  hazardStripe.wrapT = THREE.RepeatWrapping;
  hazardStripe.repeat.set(3, 1);
  hazardStripe.anisotropy = aniso;

  return {
    belt,
    floorWood,
    brickWall,
    snowGround,
    contactShadow,
    snowflake,
    factorySign,
    hazardStripe,
    dispose: () => {
      belt.dispose();
      floorWood.dispose();
      brickWall.dispose();
      snowGround.dispose();
      contactShadow.dispose();
      snowflake.dispose();
      factorySign.dispose();
      hazardStripe.dispose();
    },
  };
}
