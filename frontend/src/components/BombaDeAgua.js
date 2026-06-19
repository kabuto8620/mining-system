import React, { useState, useEffect, useRef } from 'react';
import API from '../api';

const CATEGORIES = [
  { key: 'MOTOR TRIFASICO', icon: '⚡', color: '#00d4ff', label: 'MOTOR TRIFÁSICO',
    // zona clickeable en canvas (cx, cy, radio aprox) — referencia W=340,H=240
    zone: { type: 'rect', x: 250, y: 84, w: 75, h: 72 } },
  { key: 'BOMBA DE AGUA',   icon: '◈', color: '#ffd700', label: 'BOMBA CAPRARI',
    zone: { type: 'circle', x: 170, y: 120, r: 52 } },
  { key: 'SUCCION',         icon: '▽', color: '#00ff88', label: 'SUCCIÓN',
    zone: { type: 'circle', x: 30,  y: 120, r: 16 } },
  { key: 'EXPULSION',       icon: '△', color: '#ff8c00', label: 'EXPULSIÓN',
    zone: { type: 'rect', x: 160, y: 15,  w: 20, h: 53 } },
];

// ─── Zoom overlay definitions (what to highlight per category) ───────────────
// Each entry: label shown, focal point in 340×240 canvas, zoom level
const ZONE_ZOOM = {
  'MOTOR TRIFASICO': { label: 'MOTOR TRIFÁSICO — WEG W22', fx: 287, fy: 120, zoom: 3.2, color: '#00d4ff' },
  'BOMBA DE AGUA':   { label: 'BOMBA CAPRARI MEC-A2/80A',  fx: 170, fy: 120, zoom: 2.8, color: '#ffd700' },
  'SUCCION':         { label: 'ENTRADA DE SUCCIÓN',         fx: 30,  fy: 120, zoom: 4.5, color: '#00ff88' },
  'EXPULSION':       { label: 'TUBERÍA DE EXPULSIÓN',       fx: 170, fy: 40,  zoom: 4.0, color: '#ff8c00' },
};

// ─── Canvas drawing (same as original, returns draw fn) ──────────────────────
function usePumpAnimation(canvasRef, active, highlightZone) {
  const frameRef = useRef(0);
  const animRef  = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = 340, H = 240;
    canvas.width = W; canvas.height = H;
    frameRef.current = 0;

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      frameRef.current += active ? 0.04 : 0.005;
      const frame = frameRef.current;

      // Background glow
      const bg = ctx.createRadialGradient(W/2,H/2,20,W/2,H/2,120);
      bg.addColorStop(0,'rgba(0,212,255,0.06)');
      bg.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);

      const suctionX=30, pumpCX=170, pumpCY=120;

      // SUCTION PIPE
      ctx.strokeStyle='#00ff8888'; ctx.lineWidth=14; ctx.lineCap='round';
      ctx.beginPath(); ctx.moveTo(suctionX,pumpCY); ctx.lineTo(pumpCX-52,pumpCY); ctx.stroke();
      ctx.strokeStyle='#00ff88'; ctx.lineWidth=4;
      ctx.setLineDash([12,10]); ctx.lineDashOffset=-frame*60;
      ctx.beginPath(); ctx.moveTo(suctionX+4,pumpCY); ctx.lineTo(pumpCX-54,pumpCY); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle='#00ff8888'; ctx.font='600 9px "Share Tech Mono"';
      ctx.fillText('SUCCIÓN',suctionX-4,pumpCY-12);
      // Chupador
      ctx.strokeStyle='#00ff88'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.arc(suctionX,pumpCY,10,0,Math.PI*2);
      ctx.stroke(); ctx.fillStyle='rgba(0,255,136,0.1)'; ctx.fill();

      // PUMP BODY
      const gradient=ctx.createRadialGradient(pumpCX,pumpCY,10,pumpCX,pumpCY,55);
      gradient.addColorStop(0,'rgba(0,212,255,0.35)');
      gradient.addColorStop(0.6,'rgba(0,100,180,0.2)');
      gradient.addColorStop(1,'rgba(0,50,100,0.1)');
      ctx.fillStyle=gradient;
      ctx.beginPath(); ctx.arc(pumpCX,pumpCY,52,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle='#00d4ff'; ctx.lineWidth=2.5;
      ctx.beginPath(); ctx.arc(pumpCX,pumpCY,52,0,Math.PI*2); ctx.stroke();
      ctx.strokeStyle='rgba(0,212,255,0.3)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.arc(pumpCX,pumpCY,38,0,Math.PI*2); ctx.stroke();

      // IMPELLER
      ctx.save(); ctx.translate(pumpCX,pumpCY); ctx.rotate(frame*(active?3:0.3));
      for(let b=0;b<6;b++){
        ctx.rotate(Math.PI/3);
        ctx.strokeStyle=`rgba(0,212,255,${0.6+Math.sin(frame*4+b)*0.3})`;
        ctx.lineWidth=3; ctx.lineCap='round';
        ctx.beginPath(); ctx.moveTo(6,0); ctx.quadraticCurveTo(16,6,30,3); ctx.stroke();
      }
      ctx.restore();

      // Center hub
      const hubG=ctx.createRadialGradient(pumpCX,pumpCY,0,pumpCX,pumpCY,8);
      hubG.addColorStop(0,'#00d4ff'); hubG.addColorStop(1,'#0066aa');
      ctx.fillStyle=hubG; ctx.beginPath(); ctx.arc(pumpCX,pumpCY,8,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(pumpCX,pumpCY,3,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#00d4ffaa'; ctx.font='bold 8px "Share Tech Mono"';
      ctx.textAlign='center'; ctx.fillText('CAPRARI',pumpCX,pumpCY+24); ctx.textAlign='left';

      // MOTOR
      const motorX=pumpCX+80, motorY=pumpCY-36, mW=75, mH=72;
      const motorGrad=ctx.createLinearGradient(motorX,motorY,motorX+mW,motorY+mH);
      motorGrad.addColorStop(0,'rgba(0,180,255,0.2)'); motorGrad.addColorStop(1,'rgba(0,80,140,0.1)');
      ctx.fillStyle=motorGrad; ctx.strokeStyle='#00d4ff'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.roundRect(motorX,motorY,mW,mH,6); ctx.fill(); ctx.stroke();
      ctx.strokeStyle='#00d4ffaa'; ctx.lineWidth=4;
      ctx.beginPath(); ctx.moveTo(pumpCX+52,pumpCY); ctx.lineTo(motorX,pumpCY); ctx.stroke();
      for(let f=0;f<5;f++){
        const fy=motorY+8+f*12;
        ctx.strokeStyle='rgba(0,212,255,0.3)'; ctx.lineWidth=1;
        ctx.beginPath(); ctx.moveTo(motorX+4,fy); ctx.lineTo(motorX+mW-4,fy); ctx.stroke();
      }
      ctx.fillStyle='#00d4ff'; ctx.font='bold 8px "Share Tech Mono"'; ctx.textAlign='center';
      ctx.fillText('MOTOR',motorX+mW/2,motorY+mH/2-4);
      ctx.fillStyle='#7ab0cc'; ctx.font='7px "Share Tech Mono"';
      ctx.fillText('WEG W22',motorX+mW/2,motorY+mH/2+8);
      ctx.fillText('2800 RPM',motorX+mW/2,motorY+mH/2+18);
      ctx.textAlign='left';
      const pulse=(Math.sin(frame*(active?8:1))+1)/2;
      ctx.strokeStyle=`rgba(255,215,0,${0.3+pulse*0.4})`; ctx.lineWidth=1;
      ctx.beginPath(); ctx.arc(motorX+mW/2,motorY+mH/2,20+pulse*10,0,Math.PI*2); ctx.stroke();

      // DISCHARGE PIPE (top)
      const dischargeX=pumpCX, dischargeY=15;
      ctx.strokeStyle='#ff8c0088'; ctx.lineWidth=14; ctx.lineCap='round';
      ctx.beginPath(); ctx.moveTo(dischargeX,pumpCY-52); ctx.lineTo(dischargeX,dischargeY); ctx.stroke();
      ctx.strokeStyle='#ff8c00'; ctx.lineWidth=4;
      ctx.setLineDash([12,10]); ctx.lineDashOffset=frame*60;
      ctx.beginPath(); ctx.moveTo(dischargeX,pumpCY-54); ctx.lineTo(dischargeX,dischargeY+4); ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle='#ff8c00'; ctx.lineWidth=2;
      ctx.beginPath();
      ctx.moveTo(dischargeX-10,dischargeY+18); ctx.lineTo(dischargeX+10,dischargeY+30);
      ctx.lineTo(dischargeX+10,dischargeY+18); ctx.lineTo(dischargeX-10,dischargeY+30);
      ctx.closePath(); ctx.stroke();
      ctx.fillStyle='rgba(255,140,0,0.1)'; ctx.fill();
      ctx.fillStyle='#ff8c00aa'; ctx.font='600 9px "Share Tech Mono"';
      ctx.textAlign='right'; ctx.fillText('EXPULSIÓN',dischargeX-14,dischargeY+10); ctx.textAlign='left';

      // Highlight zone pulsing border
      if(highlightZone) {
        const zd = ZONE_ZOOM[highlightZone];
        if(zd) {
          const hp=(Math.sin(frame*6)+1)/2;
          ctx.strokeStyle=zd.color; ctx.lineWidth=2+hp*2;
          ctx.globalAlpha=0.5+hp*0.5;
          const cat=CATEGORIES.find(c=>c.key===highlightZone);
          if(cat?.zone.type==='circle'){
            ctx.beginPath(); ctx.arc(cat.zone.x,cat.zone.y,cat.zone.r+4+hp*4,0,Math.PI*2); ctx.stroke();
          } else if(cat?.zone.type==='rect'){
            ctx.strokeRect(cat.zone.x-4,cat.zone.y-4,cat.zone.w+8,cat.zone.h+8);
          }
          ctx.globalAlpha=1;
        }
      }

      // Status text
      const statusPulse=(Math.sin(frame*3)+1)/2;
      ctx.fillStyle=active?`rgba(0,255,136,${0.7+statusPulse*0.3})`:`rgba(255,215,0,${0.7+statusPulse*0.3})`;
      ctx.font='bold 10px "Orbitron"'; ctx.textAlign='center';
      ctx.fillText(active?'● OPERANDO':'● EN ESPERA',W/2,H-10); ctx.textAlign='left';

      animRef.current=requestAnimationFrame(draw);
    };
    draw();
    return ()=>cancelAnimationFrame(animRef.current);
  }, [active, highlightZone]);
}

// ─── Cinematic Zoom Overlay ──────────────────────────────────────────────────
function ZoomOverlay({ catKey, canvasRef, onDone }) {
  const overlayRef = useRef(null);
  const animRef    = useRef(null);
  const startRef   = useRef(null);
  const DURATION   = 1100; // ms

  useEffect(() => {
    if (!catKey || !canvasRef.current) return;
    const zd = ZONE_ZOOM[catKey];
    if (!zd) return;
    startRef.current = null;

    const overlay = overlayRef.current;
    if (!overlay) return;
    const ctx = overlay.getContext('2d');

    // Match canvas display size
    const srcCanvas = canvasRef.current;
    const dw = srcCanvas.offsetWidth, dh = srcCanvas.offsetHeight;
    overlay.width  = dw;
    overlay.height = dh;

    // Scale factors (canvas internal 340×240 → display size)
    const scaleX = dw / 340;
    const scaleY = dh / 240;
    const fxD = zd.fx * scaleX;
    const fyD = zd.fy * scaleY;

    function easeInOutCubic(t) {
      return t < 0.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2;
    }

    function frame(ts) {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const rawT    = Math.min(elapsed / DURATION, 1);

      // Phase: 0→0.55 zoom in, 0.55→0.75 hold, 0.75→1 zoom out
      let zoomT, labelAlpha, vignAlpha;
      if (rawT < 0.55) {
        zoomT      = easeInOutCubic(rawT / 0.55);
        labelAlpha = rawT / 0.55;
        vignAlpha  = zoomT * 0.82;
      } else if (rawT < 0.75) {
        zoomT      = 1;
        labelAlpha = 1;
        vignAlpha  = 0.82;
      } else {
        const t2   = (rawT - 0.75) / 0.25;
        zoomT      = 1 - easeInOutCubic(t2);
        labelAlpha = 1 - t2;
        vignAlpha  = 0.82 * (1 - t2);
      }

      const currentZoom = 1 + (zd.zoom - 1) * zoomT;
      ctx.clearRect(0, 0, dw, dh);

      // ── Dark vignette ──
      const vig = ctx.createRadialGradient(fxD, fyD, 0, fxD, fyD, Math.max(dw, dh) * 0.7);
      vig.addColorStop(0, 'rgba(0,0,0,0)');
      vig.addColorStop(0.5, `rgba(0,0,0,${vignAlpha * 0.35})`);
      vig.addColorStop(1,   `rgba(0,0,0,${vignAlpha})`);
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, dw, dh);

      // ── Draw snapshot of pump canvas zoomed in ──
      ctx.save();
      ctx.translate(fxD, fyD);
      ctx.scale(currentZoom, currentZoom);
      ctx.translate(-fxD, -fyD);
      // Draw the live pump canvas scaled
      try { ctx.drawImage(srcCanvas, 0, 0, dw, dh); } catch(e){}
      ctx.restore();

      // ── Colored ring at focal point ──
      if (zoomT > 0.1) {
        const ringPulse = (Math.sin(elapsed * 0.01) + 1) / 2;
        const ringAlpha = Math.min(zoomT, labelAlpha) * (0.6 + ringPulse * 0.4);
        ctx.strokeStyle = zd.color;
        ctx.lineWidth   = 2 + ringPulse * 2;
        ctx.globalAlpha = ringAlpha;
        ctx.shadowColor = zd.color;
        ctx.shadowBlur  = 16;
        ctx.beginPath();
        ctx.arc(fxD, fyD, (18 + ringPulse * 6) * currentZoom, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.shadowBlur  = 0;
      }

      // ── Label banner ──
      if (labelAlpha > 0.05) {
        const bannerH = 42;
        const bannerY = dh - bannerH - 10;
        // Background pill
        ctx.globalAlpha = labelAlpha * 0.92;
        const bannerGrad = ctx.createLinearGradient(0, bannerY, dw, bannerY);
        bannerGrad.addColorStop(0, 'rgba(0,0,0,0)');
        bannerGrad.addColorStop(0.1, `${zd.color}22`);
        bannerGrad.addColorStop(0.9, `${zd.color}22`);
        bannerGrad.addColorStop(1,   'rgba(0,0,0,0)');
        ctx.fillStyle = bannerGrad;
        ctx.fillRect(0, bannerY, dw, bannerH);
        // Top border line
        ctx.strokeStyle = zd.color;
        ctx.lineWidth   = 1;
        ctx.globalAlpha = labelAlpha * 0.6;
        ctx.beginPath(); ctx.moveTo(dw*0.05, bannerY); ctx.lineTo(dw*0.95, bannerY); ctx.stroke();

        ctx.globalAlpha = labelAlpha;
        ctx.fillStyle   = zd.color;
        ctx.font        = `bold ${Math.round(11 * (dw/320))}px Orbitron, monospace`;
        ctx.textAlign   = 'center';
        ctx.shadowColor = zd.color;
        ctx.shadowBlur  = 8;
        ctx.fillText(zd.label, dw/2, bannerY + 16);
        ctx.shadowBlur  = 0;

        ctx.fillStyle   = 'rgba(255,255,255,0.55)';
        ctx.font        = `${Math.round(9 * (dw/320))}px Share Tech Mono, monospace`;
        ctx.fillText('TAP PARA CERRAR  ✕', dw/2, bannerY + 32);
        ctx.textAlign = 'left';
        ctx.globalAlpha = 1;
      }

      if (rawT < 1) {
        animRef.current = requestAnimationFrame(frame);
      } else {
        onDone();
      }
    }

    animRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(animRef.current);
  }, [catKey]);

  if (!catKey) return null;
  return (
    <canvas
      ref={overlayRef}
      onClick={onDone}
      style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        borderRadius: 8,
        cursor: 'pointer',
        zIndex: 10,
      }}
    />
  );
}

// ─── WaterPumpAnimation wrapper ───────────────────────────────────────────────
function WaterPumpAnimation({ active, highlightZone, onZoneClick }) {
  const canvasRef = useRef(null);
  const [zoomKey, setZoomKey] = useState(null);

  usePumpAnimation(canvasRef, active, highlightZone);

  // Hit test on canvas click
  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    // Convert click to internal 340×240 coords
    const cx = ((e.clientX - rect.left) / rect.width)  * 340;
    const cy = ((e.clientY - rect.top)  / rect.height) * 240;
    for (const cat of CATEGORIES) {
      const z = cat.zone;
      let hit = false;
      if (z.type === 'circle') {
        const dx = cx - z.x, dy = cy - z.y;
        hit = dx*dx + dy*dy <= (z.r + 8) * (z.r + 8);
      } else {
        hit = cx >= z.x - 8 && cx <= z.x + z.w + 8 && cy >= z.y - 8 && cy <= z.y + z.h + 8;
      }
      if (hit) {
        setZoomKey(cat.key);
        onZoneClick(cat.key);
        return;
      }
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        style={{ width: '100%', height: 240, borderRadius: 8, cursor: 'crosshair', display: 'block' }}
      />
      {zoomKey && (
        <ZoomOverlay
          catKey={zoomKey}
          canvasRef={canvasRef}
          onDone={() => setZoomKey(null)}
        />
      )}
    </div>
  );
}

// ─── CategoryPanel ────────────────────────────────────────────────────────────
function CategoryPanel({ cat, items, color, isOpen, onToggle, highlight }) {
  return (
    <div style={{
      ...cp.card,
      borderColor: isOpen ? color + '60' : highlight ? color + '80' : color + '25',
      boxShadow: isOpen ? `0 0 20px ${color}15` : highlight ? `0 0 14px ${color}22` : 'none',
      transition: 'all 0.35s ease',
    }}>
      <div style={{ ...cp.header, background: isOpen ? color + '12' : highlight ? color + '08' : 'transparent' }}
        onClick={onToggle}>
        <div style={cp.headerLeft}>
          <div style={{ ...cp.dot, background: color, boxShadow: `0 0 8px ${color}` }} />
          <span style={{ ...cp.catTitle, color }}>{cat.label}</span>
          <span style={cp.itemCount}>{items.length} ítems</span>
        </div>
        <div style={{ ...cp.chevron, color, transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</div>
      </div>

      {isOpen && (
        <div style={cp.body}>
          <div style={cp.specGrid}>
            {items.map((item, i) => (
              <div key={item.id} style={{ ...cp.specRow, animationDelay: `${i * 0.04}s` }} className="spec-row">
                <div style={{ ...cp.specName, borderColor: color + '20' }}>
                  <span style={{ color: color + '88', marginRight: 8, fontFamily: 'Orbitron', fontSize: 9 }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {item.name}
                </div>
                <div style={{ ...cp.specValue, color }}>
                  {item.specification !== item.name ? item.specification : '—'}
                </div>
                <div style={{
                  ...cp.specStatus,
                  background: item.status === 'good' ? 'rgba(0,255,136,0.1)' : 'rgba(255,211,0,0.1)',
                  color: item.status === 'good' ? '#00ff88' : '#ffd700',
                  borderColor: item.status === 'good' ? 'rgba(0,255,136,0.2)' : 'rgba(255,211,0,0.2)'
                }}>
                  {item.status === 'good' ? '✓ OK' : '⚠ REV'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes specIn { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
        .spec-row { animation: specIn 0.25s ease forwards; opacity: 0; }
      `}</style>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function BombaDeAgua({ equipmentId }) {
  const [components, setComponents]       = useState({});
  const [openCat, setOpenCat]             = useState('MOTOR TRIFASICO');
  const [isRunning, setIsRunning]         = useState(true);
  const [logs, setLogs]                   = useState([]);
  const [showMaintForm, setShowMaintForm] = useState(false);
  const [maintDesc, setMaintDesc]         = useState('');
  const [maintType, setMaintType]         = useState('preventivo');
  const [tech, setTech]                   = useState('');
  const [saving, setSaving]               = useState(false);
  const [highlightZone, setHighlightZone] = useState(null); // from canvas click → highlight panel

  useEffect(() => {
    if (!equipmentId) return;
    API.get(`/components/${equipmentId}`).then(r => setComponents(r.data)).catch(() => {});
    API.get(`/equipment/${equipmentId}`).then(r => {
      setLogs(r.data.logs || []);
      setIsRunning(r.data.equipment?.status === 'operational');
    }).catch(() => {});
  }, [equipmentId]);

  const toggleStatus = async () => {
    const newStatus = isRunning ? 'maintenance' : 'operational';
    await API.put(`/equipment/${equipmentId}`, { status: newStatus });
    setIsRunning(!isRunning);
  };

  const submitMaint = async () => {
    if (!maintDesc) return;
    setSaving(true);
    try {
      await API.post('/maintenance', {
        equipment_id: equipmentId,
        type: maintType, description: maintDesc, technician: tech,
        next_maintenance: new Date(Date.now() + 30*86400000).toISOString(),
      });
      const r = await API.get(`/equipment/${equipmentId}`);
      setLogs(r.data.logs || []);
      setShowMaintForm(false); setMaintDesc(''); setTech('');
    } catch {}
    setSaving(false);
  };

  // When user clicks a zone on canvas → highlight that panel and open it
  const handleZoneClick = (catKey) => {
    setHighlightZone(catKey);
    setOpenCat(catKey);
    // Clear highlight after 3s
    setTimeout(() => setHighlightZone(null), 3000);
  };

  return (
    <div style={b.wrap}>
      {/* Header */}
      <div style={b.header}>
        <div style={b.headerLeft}>
          <div style={b.pumpIcon}><span style={{ fontSize: 28 }}>⬡</span></div>
          <div>
            <h2 style={b.title}>BOMBA DE AGUA</h2>
            <p style={b.subtitle}>CAPRARI MEC-A2/80A · S/N 795395/5 · Módena, Italia</p>
          </div>
        </div>
        <div style={b.controls}>
          <button onClick={toggleStatus} style={{
            ...b.toggleBtn,
            background: isRunning ? 'rgba(255,51,102,0.15)' : 'rgba(0,255,136,0.15)',
            borderColor: isRunning ? 'rgba(255,51,102,0.5)' : 'rgba(0,255,136,0.5)',
            color: isRunning ? '#ff3366' : '#00ff88',
          }}>
            {isRunning ? '⏹ DETENER' : '▶ OPERAR'}
          </button>
          <button onClick={() => setShowMaintForm(!showMaintForm)} style={b.maintBtn}>
            ⚙ MANTENIMIENTO
          </button>
        </div>
      </div>

      {/* Hint tooltip */}
      <div style={b.hint}>
        <span style={b.hintIcon}>◈</span>
        <span style={b.hintText}>Haz clic en cualquier parte del diagrama para hacer zoom sobre esa sección</span>
      </div>

      {/* Animated pump + specs side by side */}
      <div style={b.mainRow}>
        <div style={b.pumpCanvas}>
          <div style={b.canvasLabel}>DIAGRAMA DE SISTEMA</div>
          <WaterPumpAnimation
            active={isRunning}
            highlightZone={highlightZone}
            onZoneClick={handleZoneClick}
          />
          {/* Quick specs */}
          <div style={b.quickSpecs}>
            {[
              { k:'VOLTAJE', v:'220-380V', c:'#00d4ff' },
              { k:'RPM',     v:'2800',     c:'#ffd700' },
              { k:'Hmax',    v:'100 m',    c:'#00ff88' },
              { k:'IP',      v:'55',       c:'#ff8c00' },
            ].map(qs => (
              <div key={qs.k} style={b.qSpec}>
                <div style={{ ...b.qSpecVal, color: qs.c }}>{qs.v}</div>
                <div style={b.qSpecKey}>{qs.k}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Components */}
        <div style={b.compCol}>
          <div style={b.compTitle}>COMPONENTES DEL SISTEMA</div>
          <div style={{ display:'flex', flexDirection:'column', gap: 8 }}>
            {CATEGORIES.map(cat => (
              <CategoryPanel
                key={cat.key}
                cat={cat}
                color={cat.color}
                items={components[cat.key] || []}
                isOpen={openCat === cat.key}
                highlight={highlightZone === cat.key}
                onToggle={() => setOpenCat(openCat === cat.key ? null : cat.key)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Maintenance form */}
      {showMaintForm && (
        <div style={b.maintForm}>
          <div style={b.maintFormTitle}>⚙ REGISTRAR MANTENIMIENTO</div>
          <div style={b.maintRow}>
            <div style={b.maintField}>
              <label style={b.maintLabel}>TIPO</label>
              <select style={b.maintInput} value={maintType} onChange={e => setMaintType(e.target.value)}>
                <option value="preventivo">Preventivo</option>
                <option value="correctivo">Correctivo</option>
                <option value="predictivo">Predictivo</option>
              </select>
            </div>
            <div style={b.maintField}>
              <label style={b.maintLabel}>TÉCNICO</label>
              <input style={b.maintInput} value={tech} onChange={e => setTech(e.target.value)} placeholder="Nombre del técnico" />
            </div>
          </div>
          <div style={b.maintField}>
            <label style={b.maintLabel}>DESCRIPCIÓN</label>
            <textarea style={{ ...b.maintInput, minHeight:70, resize:'vertical' }}
              value={maintDesc} onChange={e => setMaintDesc(e.target.value)}
              placeholder="Describa el trabajo realizado..." />
          </div>
          <button onClick={submitMaint} disabled={saving} style={b.submitBtn}>
            {saving ? 'REGISTRANDO...' : '✓ GUARDAR REGISTRO'}
          </button>
        </div>
      )}

      {/* Maintenance logs */}
      {logs.length > 0 && (
        <div style={b.logsSection}>
          <div style={b.logsTitle}>📋 HISTORIAL DE MANTENIMIENTO</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {logs.map(log => (
              <div key={log.id} style={b.logRow}>
                <div style={{ ...b.logType, color: log.type==='preventivo'?'#00d4ff':'#ffd700' }}>
                  {log.type?.toUpperCase()}
                </div>
                <div style={b.logDesc}>{log.description}</div>
                <div style={b.logMeta}>
                  <span style={b.logTech}>{log.technician || '—'}</span>
                  <span style={b.logDate}>{new Date(log.date).toLocaleDateString('es-BO')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        input:focus,select:focus,textarea:focus { outline:none; border-color:#00d4ff !important; }
        @keyframes hintPulse { 0%,100%{opacity:0.6} 50%{opacity:1} }
      `}</style>
    </div>
  );
}

const cp = {
  card:{ border:'1px solid', borderRadius:10, overflow:'hidden', transition:'all 0.3s' },
  header:{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 16px', cursor:'pointer', transition:'background 0.2s' },
  headerLeft:{ display:'flex', alignItems:'center', gap:10 },
  dot:{ width:8, height:8, borderRadius:'50%' },
  catTitle:{ fontFamily:'Orbitron', fontSize:11, fontWeight:700, letterSpacing:2 },
  itemCount:{ fontFamily:'Share Tech Mono', fontSize:10, color:'#3a6080', letterSpacing:1 },
  chevron:{ fontSize:10, transition:'transform 0.3s' },
  body:{ padding:'0 0 8px' },
  specGrid:{ display:'flex', flexDirection:'column' },
  specRow:{ display:'flex', alignItems:'center', gap:0, borderBottom:'1px solid rgba(0,212,255,0.05)', padding:'7px 16px' },
  specName:{ flex:2, fontFamily:'Rajdhani', fontSize:12, color:'#c8e8ff', borderRight:'1px solid', paddingRight:10 },
  specValue:{ flex:1, fontFamily:'Share Tech Mono', fontSize:11, paddingLeft:12, paddingRight:12 },
  specStatus:{ fontFamily:'Share Tech Mono', fontSize:9, border:'1px solid', borderRadius:10, padding:'2px 8px', letterSpacing:1 },
};

const b = {
  wrap:{ display:'flex', flexDirection:'column', gap:16 },
  header:{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'16px 20px', background:'rgba(4,20,36,0.9)', border:'1px solid rgba(0,212,255,0.2)', borderRadius:12 },
  headerLeft:{ display:'flex', alignItems:'center', gap:14 },
  pumpIcon:{ width:52, height:52, borderRadius:12, background:'rgba(0,212,255,0.1)', border:'1px solid rgba(0,212,255,0.3)', display:'flex', alignItems:'center', justifyContent:'center', color:'#00d4ff', filter:'drop-shadow(0 0 8px #00d4ff)' },
  title:{ fontFamily:'Orbitron', fontSize:18, fontWeight:800, color:'#00d4ff', letterSpacing:3 },
  subtitle:{ fontFamily:'Share Tech Mono', fontSize:10, color:'#3a6080', letterSpacing:1, marginTop:4 },
  controls:{ display:'flex', gap:10 },
  toggleBtn:{ border:'1px solid', borderRadius:8, padding:'10px 18px', fontFamily:'Orbitron', fontSize:10, letterSpacing:2, cursor:'pointer', transition:'all 0.2s' },
  maintBtn:{ background:'rgba(255,140,0,0.1)', border:'1px solid rgba(255,140,0,0.3)', borderRadius:8, padding:'10px 18px', color:'#ff8c00', fontFamily:'Orbitron', fontSize:10, letterSpacing:2, cursor:'pointer' },
  hint:{ display:'flex', alignItems:'center', gap:8, padding:'6px 14px', background:'rgba(0,212,255,0.04)', border:'1px solid rgba(0,212,255,0.12)', borderRadius:8, animation:'hintPulse 3s ease-in-out infinite' },
  hintIcon:{ color:'#00d4ff', fontSize:12 },
  hintText:{ fontFamily:'Share Tech Mono', fontSize:10, color:'#3a6080', letterSpacing:1 },
  mainRow:{ display:'grid', gridTemplateColumns:'340px 1fr', gap:16 },
  pumpCanvas:{ background:'rgba(4,20,36,0.9)', border:'1px solid rgba(0,212,255,0.15)', borderRadius:12, padding:'16px', display:'flex', flexDirection:'column' },
  canvasLabel:{ fontFamily:'Orbitron', fontSize:9, color:'#3a6080', letterSpacing:3, marginBottom:10 },
  quickSpecs:{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6, marginTop:12 },
  qSpec:{ background:'rgba(0,0,0,0.3)', border:'1px solid rgba(0,212,255,0.1)', borderRadius:6, padding:'8px', textAlign:'center' },
  qSpecVal:{ fontFamily:'Orbitron', fontSize:12, fontWeight:700 },
  qSpecKey:{ fontFamily:'Share Tech Mono', fontSize:8, color:'#3a6080', letterSpacing:1, marginTop:3 },
  compCol:{ display:'flex', flexDirection:'column', gap:4 },
  compTitle:{ fontFamily:'Orbitron', fontSize:10, color:'#7ab0cc', letterSpacing:3, marginBottom:6 },
  maintForm:{ background:'rgba(4,20,36,0.95)', border:'1px solid rgba(255,140,0,0.3)', borderRadius:12, padding:'20px' },
  maintFormTitle:{ fontFamily:'Orbitron', fontSize:12, color:'#ff8c00', letterSpacing:3, marginBottom:14 },
  maintRow:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 },
  maintField:{ display:'flex', flexDirection:'column', gap:6, marginBottom:12 },
  maintLabel:{ fontFamily:'Orbitron', fontSize:9, color:'#3a6080', letterSpacing:3 },
  maintInput:{ background:'rgba(0,0,0,0.5)', border:'1px solid rgba(0,212,255,0.2)', borderRadius:8, padding:'10px 12px', color:'#c8e8ff', fontFamily:'Share Tech Mono', fontSize:12 },
  submitBtn:{ background:'rgba(0,255,136,0.15)', border:'1px solid rgba(0,255,136,0.4)', borderRadius:8, padding:'12px 24px', color:'#00ff88', fontFamily:'Orbitron', fontSize:11, letterSpacing:2, cursor:'pointer' },
  logsSection:{ background:'rgba(4,20,36,0.8)', border:'1px solid rgba(0,212,255,0.1)', borderRadius:12, padding:'16px 20px' },
  logsTitle:{ fontFamily:'Orbitron', fontSize:10, color:'#7ab0cc', letterSpacing:3, marginBottom:12 },
  logRow:{ display:'flex', alignItems:'center', gap:14, padding:'10px 0', borderBottom:'1px solid rgba(0,212,255,0.06)' },
  logType:{ fontFamily:'Orbitron', fontSize:9, letterSpacing:2, width:90 },
  logDesc:{ flex:1, fontFamily:'Rajdhani', fontSize:13, color:'#c8e8ff' },
  logMeta:{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:2 },
  logTech:{ fontFamily:'Share Tech Mono', fontSize:10, color:'#00d4ff' },
  logDate:{ fontFamily:'Share Tech Mono', fontSize:9, color:'#3a6080' },
};