import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import logoImvet from '../assets/logo_imvet.png';
import logoMantenimiento from '../assets/logo_mantenimiento.png';

// ── Gear Icon SVG ─────────────────────────────────────────────────────────
function GearIcon({ size = 22, color = '#f59e0b', spin = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      style={spin ? { animation: 'gearSpin 8s linear infinite', display:'block' } : { display:'block' }}>
      <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12 3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.92c.04-.34.07-.69.07-1.08s-.03-.74-.07-1.08l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.34-.07.69-.07 1.08s.03.74.07 1.08l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65z"
        fill={color}/>
    </svg>
  );
}

const NAV = [
  { path: '/dashboard', icon: '◈', label: 'INICIO' },
  { path: '/dashboard/inventario', icon: '⊞', label: 'INVENTARIO' },
  { path: '/dashboard/mantenimiento', icon: 'gear', label: 'MANTENIMIENTO' },
  { path: '/dashboard/reportes', icon: '◉', label: 'REPORTES' },
];

// ── MODAL DE ENGRANAJES (efecto apertura) ─────────────────────────────────
function GearTransitionModal({ visible, onDone }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const startRef = useRef(null);
  const DURATION = 900;

  useEffect(() => {
    if (!visible) return;
    startRef.current = null;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const gears = [
      { x:0.5, y:0.5, r:120, teeth:18, dir:1, speed:1.2, color:'#f59e0b', phase:0 },
      { x:0.5, y:0.5, r:72, teeth:11, dir:-1, speed:2, color:'#fb923c', phase:0.28 },
      { x:0.5, y:0.5, r:42, teeth:7, dir:1, speed:3.4, color:'#fbbf24', phase:0.6 },
      { x:0.25, y:0.25, r:55, teeth:8, dir:-1, speed:1.8, color:'#d97706', phase:1.1 },
      { x:0.75, y:0.25, r:48, teeth:7, dir:1, speed:2.1, color:'#f59e0b', phase:0.8 },
      { x:0.25, y:0.75, r:50, teeth:7, dir:1, speed:1.6, color:'#fb923c', phase:1.4 },
      { x:0.75, y:0.75, r:55, teeth:8, dir:-1, speed:1.9, color:'#fbbf24', phase:0.5 },
    ];

    function drawGear(ctx, cx, cy, outerR, teeth, angle, color, alpha) {
      const innerR = outerR * 0.75;
      const holeR = outerR * 0.22;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      ctx.beginPath();
      for (let i = 0; i < teeth; i++) {
        const a0 = (i / teeth) * Math.PI * 2;
        const a1 = ((i + 0.4) / teeth) * Math.PI * 2;
        const a2 = ((i + 0.6) / teeth) * Math.PI * 2;
        const a3 = ((i + 1) / teeth) * Math.PI * 2;
        ctx.lineTo(Math.cos(a0) * innerR, Math.sin(a0) * innerR);
        ctx.lineTo(Math.cos(a1) * outerR, Math.sin(a1) * outerR);
        ctx.lineTo(Math.cos(a2) * outerR, Math.sin(a2) * outerR);
        ctx.lineTo(Math.cos(a3) * innerR, Math.sin(a3) * innerR);
      }
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = color === '#f59e0b' ? '#fbbf2488' : '#f59e0b44';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, holeR, 0, Math.PI * 2);
      ctx.fillStyle = '#0e0a00';
      ctx.fill();
      ctx.restore();
    }

    function frame(ts) {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const t = Math.min(elapsed / DURATION, 1);
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      const openAmt = t < 0.5 ? 0 : (t - 0.5) * 2;
      const doorW = w / 2 * (1 - openAmt);
      ctx.fillStyle = '#0e0a00';
      ctx.fillRect(0, 0, doorW, h);
      ctx.fillRect(w - doorW, 0, doorW, h);
      const gearAlpha = t < 0.6 ? 1 : 1 - (t - 0.6) / 0.4;
      const easeT = t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2;
      gears.forEach(g => {
        const cx = g.x * w, cy = g.y * h;
        const angle = g.phase + easeT * g.speed * Math.PI * 2 * g.dir;
        const scale = 0.3 + easeT * 0.7;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(scale, scale);
        ctx.translate(-cx, -cy);
        drawGear(ctx, cx, cy, g.r, g.teeth, angle, g.color, gearAlpha * (0.6 + 0.4 * easeT));
        ctx.restore();
      });
      if (t > 0.1 && t < 0.75) {
        const textAlpha = t < 0.5 ? (t - 0.1) / 0.4 : 1 - (t - 0.5) / 0.25;
        ctx.save();
        ctx.globalAlpha = Math.max(0, textAlpha);
        ctx.font = 'bold 48px Orbitron, monospace';
        ctx.fillStyle = '#f59e0b';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 20;
        ctx.fillText('IMVET', w/2, h/2);
        ctx.font = 'bold 16px Share Tech Mono, monospace';
        ctx.fillStyle = '#fb923c';
        ctx.shadowBlur = 8;
        ctx.fillText('SISTEMA DE MANTENIMIENTO', w/2, h/2 + 44);
        ctx.restore();
      }
      if (t < 1) {
        animRef.current = requestAnimationFrame(frame);
      } else {
        onDone();
      }
    }
    animRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(animRef.current);
  }, [visible]);

  if (!visible) return null;
  return (
    <div style={{ position:'fixed', inset:0, zIndex:9999, pointerEvents:'all' }}>
      <canvas ref={canvasRef} style={{ width:'100%', height:'100%', display:'block' }} />
    </div>
  );
}

function CircuitBackground() {
  const canvasRef = useRef(null);
  const scrollRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let frame = 0, animId;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener('resize', resize);
    const onScroll = (e) => { scrollRef.current += e.deltaY * 0.003; };
    canvas.parentElement?.addEventListener('wheel', onScroll, { passive: true });
    const COLS = 18, ROWS = 12;
    const nodes = [];
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        nodes.push({ x:(c/(COLS-1))*100, y:(r/(ROWS-1))*100, active:Math.random()>0.5, pulseOffset:Math.random()*Math.PI*2 });
    const flows = Array.from({length:12}, () => ({
      col:Math.floor(Math.random()*COLS), progress:Math.random(),
      speed:0.002+Math.random()*0.004,
      color:Math.random()>0.5?'#f59e0b':'#fb923c',
    }));
    const draw = () => {
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0,0,w,h);
      frame += 0.01;
      const cellW = w/(COLS-1), cellH = h/(ROWS-1);
      ctx.strokeStyle = 'rgba(245,158,11,0.04)';
      ctx.lineWidth = 1;
      for (let r=0;r<ROWS;r++){ctx.beginPath();ctx.moveTo(0,r*cellH);ctx.lineTo(w,r*cellH);ctx.stroke();}
      for (let c=0;c<COLS;c++){ctx.beginPath();ctx.moveTo(c*cellW,0);ctx.lineTo(c*cellW,h);ctx.stroke();}
      const paths=[[0,0,3,0,3,2,6,2,6,5],[12,0,12,3,15,3,15,6,17,6],[0,8,4,8,4,11,8,11],[9,0,9,4,14,4]];
      paths.forEach((path,pi)=>{
        const pulse=(Math.sin(frame*1.5+pi*1.2)+1)/2;
        ctx.strokeStyle=`rgba(245,158,11,${0.12+pulse*0.1})`;
        ctx.lineWidth=1.5;
        ctx.beginPath();
        for(let i=0;i<path.length;i+=2){const x=path[i]*cellW,y=path[i+1]*cellH;i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);}
        ctx.stroke();
        for(let i=0;i<path.length;i+=2){
          ctx.fillStyle=`rgba(251,191,36,${0.3+pulse*0.4})`;
          ctx.beginPath();ctx.arc(path[i]*cellW,path[i+1]*cellH,2.5,0,Math.PI*2);ctx.fill();
        }
      });
      flows.forEach(fl=>{
        fl.progress=(fl.progress+fl.speed+scrollRef.current*0.01)%1;
        const x=fl.col*cellW, y=fl.progress*h;
        const g=ctx.createLinearGradient(x,y-20,x,y+20);
        g.addColorStop(0,fl.color+'00');g.addColorStop(0.5,fl.color+'cc');g.addColorStop(1,fl.color+'00');
        ctx.strokeStyle=g;ctx.lineWidth=1.5;
        ctx.beginPath();ctx.moveTo(x,y-20);ctx.lineTo(x,y+20);ctx.stroke();
      });
      nodes.forEach(n=>{
        if(!n.active)return;
        const nx=n.x/100*w,ny=n.y/100*h;
        const p=(Math.sin(frame*2+n.pulseOffset)+1)/2;
        ctx.fillStyle=`rgba(245,158,11,${0.15+p*0.35})`;
        ctx.beginPath();ctx.arc(nx,ny,2+p,0,Math.PI*2);ctx.fill();
      });
      scrollRef.current*=0.9;
      animId=requestAnimationFrame(draw);
    };
    draw();
    return ()=>{cancelAnimationFrame(animId);window.removeEventListener('resize',resize);};
  },[]);
  return <canvas ref={canvasRef} style={{position:'absolute',inset:0,width:'100%',height:'100%',opacity:0.7}}/>;
}

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [time, setTime] = useState(new Date());
  const [gearModal, setGearModal] = useState(false);
  const [pendingNav, setPendingNav] = useState(null);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleNav = (item) => {
    if (item.path === '/dashboard/mantenimiento' && loc.pathname !== item.path) {
      setPendingNav(item.path);
      setGearModal(true);
    } else {
      navigate(item.path);
    }
  };

  const onGearDone = () => {
    setGearModal(false);
    if (pendingNav) { navigate(pendingNav); setPendingNav(null); }
  };

  return (
    <div style={S.wrap}>
      <GearTransitionModal visible={gearModal} onDone={onGearDone} />

      {/* Sidebar */}
      <aside style={{ ...S.sidebar, width: collapsed ? 62 : 210, transition:'width 0.35s cubic-bezier(0.4,0,0.2,1)' }}>
        <div style={S.sideTop}>
          {/* IMVET Brand con logo real */}
          <div style={S.brand} onClick={() => setCollapsed(!collapsed)}>
            <img
              src={logoImvet}
              alt="IMVET"
              style={{
                width: collapsed ? 36 : 44,
                height: collapsed ? 36 : 44,
                objectFit: 'contain',
                flexShrink: 0,
                transition: 'all 0.3s',
              }}
            />
            {!collapsed && (
              <div style={{ overflow:'hidden', lineHeight:1.1 }}>
                <div style={S.brandName}>IMVET</div>
                <div style={S.brandSub}>S.R.L.</div>
                <div style={S.brandSubSub}>MANTENIMIENTO</div>
              </div>
            )}
          </div>
          {!collapsed && (
            <div style={S.clock}>
              <span style={S.clockText}>{time.toLocaleTimeString('es-BO',{hour12:false})}</span>
              <div style={S.clockDate}>{time.toLocaleDateString('es-BO',{day:'2-digit',month:'short'}).toUpperCase()}</div>
            </div>
          )}
        </div>

        <nav style={S.nav}>
          {NAV.map((item, i) => {
            const active = loc.pathname === item.path || (item.path !== '/dashboard' && loc.pathname.startsWith(item.path));
            return (
              <button key={item.path} onClick={() => handleNav(item)}
                style={{
                  ...S.navItem,
                  ...(active ? S.navActive : {}),
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  animationDelay:`${i*0.05}s`,
                }}
                className={`nav-item${active?' nav-active':''}`}>
                <span style={{ ...S.navIcon, ...(active?{filter:'drop-shadow(0 0 6px rgba(245,158,11,0.9))'}:{}) }}>
                  {item.icon === 'gear'
                    ? <GearIcon size={18} color={active ? '#f59e0b' : '#78350f'} spin={active} />
                    : item.icon}
                </span>
                {!collapsed && <span style={S.navLabel}>{item.label}</span>}
                {active && <div style={{ ...S.navGlow, right: collapsed ? '50%' : 8 }} />}
              </button>
            );
          })}
        </nav>

        <div style={S.sideBottom}>
          {!collapsed && (
            <div style={S.userInfo}>
              <div style={S.userAvatar}>{user?.username?.[0]?.toUpperCase()}</div>
              <div style={{overflow:'hidden'}}>
                <div style={S.userName}>{user?.username}</div>
                <div style={S.userRole}>{user?.role?.toUpperCase()}</div>
              </div>
            </div>
          )}
          <button onClick={logout}
            style={{ ...S.logoutBtn, justifyContent: collapsed?'center':'flex-start' }}
            className="logout-btn">
            <span style={{fontSize:16}}>⏻</span>
            {!collapsed && <span>SALIR</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={S.main}>
        <header style={S.topbar}>
          <div style={S.topLeft}>
            <div style={S.systemDot}/>
            <span style={S.topText}>SISTEMA ACTIVO</span>
            <span style={S.topDivider}>◆</span>
            <span style={S.topText}>{time.toLocaleDateString('es-BO',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</span>
          </div>
          <div style={S.topRight}>
            {/* Escudo Depto. Mantenimiento REAL */}
            <div style={S.deptBadge}>
              <img
                src={logoMantenimiento}
                alt="Depto. Mantenimiento IMVET"
                style={{ width: 28, height: 28, objectFit: 'contain' }}
              />
              <span style={{ fontFamily:'Orbitron', fontSize:8, color:'#f59e0b', letterSpacing:2, marginLeft:6 }}>
                DEPTO. MANTENIMIENTO
              </span>
            </div>
            <div style={S.versionBadge}>v2.1.0</div>
          </div>
        </header>

        <div style={{ ...S.content, position:'relative', overflow:'auto' }}>
          <CircuitBackground/>
          <div style={{position:'relative',zIndex:1}}>
            <Outlet/>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}
        @keyframes gearSpin{to{transform:rotate(360deg)}}
        @keyframes navIn{from{opacity:0;transform:translateX(-14px)}to{opacity:1;transform:translateX(0)}}
        .nav-item{animation:navIn 0.4s ease forwards;}
        .nav-item:hover:not(.nav-active){background:rgba(245,158,11,0.08)!important;color:#f59e0b!important;}
        .logout-btn:hover{background:rgba(239,68,68,0.12)!important;border-color:rgba(239,68,68,0.5)!important;}
      `}</style>
    </div>
  );
}

const S = {
  wrap:{ display:'flex', height:'100vh', overflow:'hidden', background:'#0e0a00' },
  sidebar:{
    background:'linear-gradient(180deg,#1a0e00 0%,#140a00 60%,#0e0800 100%)',
    borderRight:'1px solid rgba(245,158,11,0.15)',
    display:'flex', flexDirection:'column', overflow:'hidden', flexShrink:0,
    boxShadow:'4px 0 40px rgba(0,0,0,0.7)',
  },
  sideTop:{ padding:'16px 10px 0', borderBottom:'1px solid rgba(245,158,11,0.08)' },
  brand:{ display:'flex', alignItems:'center', gap:10, padding:'0 0 14px', cursor:'pointer', transition:'opacity 0.2s' },
  brandName:{ fontFamily:'Orbitron', fontSize:15, fontWeight:900, color:'#f59e0b', letterSpacing:3 },
  brandSub:{ fontFamily:'Orbitron', fontSize:9, color:'#CC0000', letterSpacing:4 },
  brandSubSub:{ fontFamily:'Share Tech Mono', fontSize:7, color:'#78350f', letterSpacing:3, marginTop:2 },
  clock:{ paddingBottom:12, textAlign:'center' },
  clockText:{ fontFamily:'Share Tech Mono', fontSize:19, color:'#f59e0b', letterSpacing:3, filter:'drop-shadow(0 0 8px rgba(245,158,11,0.5))' },
  clockDate:{ fontFamily:'Share Tech Mono', fontSize:9, color:'#78350f', letterSpacing:2, marginTop:2 },
  nav:{ flex:1, padding:'14px 6px', display:'flex', flexDirection:'column', gap:2 },
  navItem:{
    display:'flex', alignItems:'center', gap:10, padding:'9px 12px',
    background:'transparent', border:'none', color:'#78350f',
    cursor:'pointer', borderRadius:8, transition:'all 0.2s',
    fontFamily:'Orbitron', fontSize:10, letterSpacing:2,
    position:'relative', width:'100%',
  },
  navActive:{ background:'rgba(245,158,11,0.1)', color:'#f59e0b', boxShadow:'inset 2px 0 0 #f59e0b' },
  navIcon:{ fontSize:17, flexShrink:0, transition:'filter 0.2s', lineHeight:1, display:'flex', alignItems:'center' },
  navLabel:{ fontSize:10 },
  navGlow:{ position:'absolute', width:6, height:6, borderRadius:'50%', background:'#f59e0b', boxShadow:'0 0 8px #f59e0b', top:'50%', transform:'translateY(-50%)', animation:'blink 2s ease-in-out infinite' },
  sideBottom:{ padding:'10px 6px', borderTop:'1px solid rgba(245,158,11,0.08)' },
  userInfo:{ display:'flex', alignItems:'center', gap:10, padding:'8px 8px 10px' },
  userAvatar:{ width:30, height:30, borderRadius:8, background:'rgba(245,158,11,0.15)', border:'1px solid rgba(245,158,11,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Orbitron', fontSize:13, color:'#f59e0b', flexShrink:0 },
  userName:{ fontFamily:'Exo 2', fontSize:13, fontWeight:600, color:'#fef3c7' },
  userRole:{ fontFamily:'Share Tech Mono', fontSize:8, color:'#78350f', letterSpacing:2 },
  logoutBtn:{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', background:'transparent', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, color:'#ef4444', cursor:'pointer', fontFamily:'Orbitron', fontSize:10, letterSpacing:2, transition:'all 0.2s', width:'100%' },
  main:{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' },
  topbar:{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 22px', background:'rgba(14,10,0,0.95)', borderBottom:'1px solid rgba(245,158,11,0.12)', backdropFilter:'blur(10px)', flexShrink:0 },
  topLeft:{ display:'flex', alignItems:'center', gap:10 },
  systemDot:{ width:7, height:7, borderRadius:'50%', background:'#22c55e', boxShadow:'0 0 10px #22c55e', animation:'blink 2.5s ease-in-out infinite' },
  topText:{ fontFamily:'Share Tech Mono', fontSize:10, color:'#a07030', letterSpacing:1 },
  topDivider:{ color:'rgba(245,158,11,0.25)', fontSize:8 },
  topRight:{ display:'flex', gap:8, alignItems:'center' },
  deptBadge:{ display:'flex', alignItems:'center', background:'rgba(245,158,11,0.06)', border:'1px solid rgba(245,158,11,0.15)', borderRadius:5, padding:'3px 9px' },
  versionBadge:{ background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:4, padding:'2px 8px', fontFamily:'Share Tech Mono', fontSize:9, color:'#d97706', letterSpacing:2 },
  content:{ flex:1, overflow:'auto', padding:'22px' },
};