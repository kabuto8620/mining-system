import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const { login } = useAuth();
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const frameRef = useRef(0);

  // Mouse parallax
  useEffect(() => {
    const onMove = (e) => setMousePos({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  // Canvas circuit + orbit animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    const nodes = Array.from({ length: 24 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 2 + 1,
      pulse: Math.random() * Math.PI * 2,
    }));

    const particles = Array.from({ length: 40 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 1.5 + 0.5,
      speed: Math.random() * 0.4 + 0.1,
      opacity: Math.random() * 0.5 + 0.1,
    }));

    const draw = () => {
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      frameRef.current += 0.008;
      const f = frameRef.current;

      const mx = mousePos.x * w, my = mousePos.y * h;
      const bg = ctx.createRadialGradient(mx, my, 0, mx, my, Math.max(w,h) * 0.8);
      bg.addColorStop(0, 'rgba(245,158,11,0.04)');
      bg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      nodes.forEach(n => {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
        n.pulse += 0.02;
      });

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < 200) {
            const alpha = (1 - dist/200) * 0.25;
            ctx.strokeStyle = `rgba(245,158,11,${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[i].x + dx/2, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
            const t = (f * 0.5) % 1;
            const px = nodes[i].x + dx * t;
            const py = nodes[i].y + (nodes[j].y - nodes[i].y) * Math.min(t * 2, 1);
            ctx.fillStyle = `rgba(251,191,36,${alpha * 2})`;
            ctx.beginPath(); ctx.arc(px, py, 1.5, 0, Math.PI * 2); ctx.fill();
          }
        }
      }

      nodes.forEach(n => {
        const pulse = (Math.sin(n.pulse) + 1) / 2;
        ctx.fillStyle = `rgba(245,158,11,${0.3 + pulse * 0.5})`;
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r + pulse, 0, Math.PI * 2); ctx.fill();
        const ng = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 6);
        ng.addColorStop(0, `rgba(245,158,11,${pulse * 0.15})`);
        ng.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = ng;
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r * 6, 0, Math.PI * 2); ctx.fill();
      });

      const cx = w/2 + (mousePos.x - 0.5) * -30;
      const cy = h/2 + (mousePos.y - 0.5) * -20;
      const orbits = [
        { r:110, speed:0.35, color:'#f59e0b', dotR:5 },
        { r:175, speed:-0.22, color:'#fb923c', dotR:4 },
        { r:245, speed:0.16, color:'#fbbf24', dotR:6 },
        { r:320, speed:-0.10, color:'#f97316', dotR:3.5 },
        { r:400, speed:0.07, color:'#f59e0b', dotR:2.5 },
      ];
      orbits.forEach(o => {
        ctx.beginPath(); ctx.arc(cx, cy, o.r, 0, Math.PI * 2);
        ctx.strokeStyle = o.color + '22'; ctx.lineWidth = 1;
        ctx.setLineDash([4, 8]); ctx.stroke(); ctx.setLineDash([]);
        const angle = f * o.speed * 60;
        const dx = cx + Math.cos(angle) * o.r;
        const dy = cy + Math.sin(angle) * o.r;
        const grad = ctx.createRadialGradient(dx, dy, 0, dx, dy, o.dotR * 4);
        grad.addColorStop(0, o.color + 'ff'); grad.addColorStop(1, o.color + '00');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(dx, dy, o.dotR * 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = o.color;
        ctx.beginPath(); ctx.arc(dx, dy, o.dotR, 0, Math.PI * 2); ctx.fill();
        for (let t = 1; t <= 8; t++) {
          const ta = angle - t * 0.1 * (o.speed > 0 ? 1 : -1);
          const tx = cx + Math.cos(ta) * o.r, ty = cy + Math.sin(ta) * o.r;
          ctx.fillStyle = o.color + Math.floor((1-t/8)*0x60).toString(16).padStart(2,'0');
          ctx.beginPath(); ctx.arc(tx, ty, o.dotR*(1-t/10), 0, Math.PI*2); ctx.fill();
        }
      });

      const pulse2 = (Math.sin(f * 3) + 1) / 2;
      const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 70 + pulse2 * 25);
      cg.addColorStop(0, `rgba(245,158,11,${0.12 + pulse2 * 0.08})`);
      cg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = cg;
      ctx.beginPath(); ctx.arc(cx, cy, 70 + pulse2 * 25, 0, Math.PI * 2); ctx.fill();

      particles.forEach(p => {
        ctx.fillStyle = `rgba(245,158,11,${p.opacity})`;
        ctx.beginPath();
        ctx.arc((p.x + f * p.speed * 4) % 100 / 100 * w, p.y / 100 * h, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener('resize', resize); };
  }, [mousePos]);

  const handleSubmit = async () => {
    if (!username || !password) { setError('Completa todos los campos'); return; }
    setLoading(true); setError('');
    try {
      await login(username, password);
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 800);
    } catch (e) {
      setError(e.response?.data?.error || 'Error de conexión');
    }
    setLoading(false);
  };

  return (
    <div style={S.wrap}>
      <canvas ref={canvasRef} style={S.canvas} />
      <div style={S.scanlines} />

      <div style={S.panel} className="login-panel">
        {/* Logo */}
        <div style={S.logo}>
          <div style={S.logoGear}>⚙</div>
          <div>
            <div style={S.logoTitle}>MINING</div>
            <div style={S.logoSub}>MAINTENANCE CONTROL</div>
          </div>
          <div style={S.logoStatus}>
            <div style={S.statusDot} />
            <span style={S.statusText}>EN LÍNEA</span>
          </div>
        </div>

        {/* Solo login — sin tabs de registro */}
        <div style={S.sectionTitle}>◈ ACCESO AL SISTEMA</div>

        <div style={S.form}>
          <div style={S.field}>
            <label style={S.label}>◈ USUARIO</label>
            <input style={S.input} value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="admin" autoComplete="username" className="amber-input" />
          </div>
          <div style={S.field}>
            <label style={S.label}>◈ CONTRASEÑA</label>
            <input style={S.input} type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="••••••••" autoComplete="current-password" className="amber-input" />
          </div>

          {error && <div style={S.error} className="shake">⚠ {error}</div>}
          {success && <div style={S.successMsg}>✓ Acceso concedido...</div>}

          <button style={{ ...S.btn, ...(loading ? S.btnLoading : {}), ...(success ? S.btnSuccess : {}) }}
            onClick={handleSubmit} disabled={loading} className="amber-btn">
            {loading ? '◌ VERIFICANDO...' : success ? '✓ CONCEDIDO' : '▶ INICIAR SESIÓN'}
          </button>
        </div>

        {/* Corner decorations */}
        <div style={{ ...S.corner, top:8, left:8, borderTop:'2px solid', borderLeft:'2px solid', borderColor:'rgba(245,158,11,0.4)' }} />
        <div style={{ ...S.corner, top:8, right:8, borderTop:'2px solid', borderRight:'2px solid', borderColor:'rgba(245,158,11,0.4)' }} />
        <div style={{ ...S.corner, bottom:8, left:8, borderBottom:'2px solid', borderLeft:'2px solid', borderColor:'rgba(245,158,11,0.4)' }} />
        <div style={{ ...S.corner, bottom:8, right:8, borderBottom:'2px solid', borderRight:'2px solid', borderColor:'rgba(245,158,11,0.4)' }} />
      </div>

      <style>{`
        @keyframes panelIn {
          from{opacity:0;transform:translateY(50px) scale(0.92)}
          to{opacity:1;transform:translateY(0) scale(1)}
        }
        @keyframes shake {
          0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-6px)} 40%,80%{transform:translateX(6px)}
        }
        @keyframes amberpulse {
          0%,100%{box-shadow:0 0 15px rgba(245,158,11,0.3),inset 0 0 30px rgba(245,158,11,0.03)}
          50%{box-shadow:0 0 35px rgba(245,158,11,0.6),inset 0 0 50px rgba(245,158,11,0.06)}
        }
        @keyframes gearSpin { to{transform:rotate(360deg)} }
        .login-panel{animation:panelIn 0.9s cubic-bezier(0.16,1,0.3,1) forwards,amberpulse 3s ease-in-out 0.9s infinite;}
        .shake{animation:shake 0.4s ease;}
        .amber-input:focus{outline:none;border-color:rgba(245,158,11,0.7)!important;box-shadow:0 0 20px rgba(245,158,11,0.25),0 0 0 1px rgba(245,158,11,0.2)!important;background:rgba(245,158,11,0.04)!important;}
        .amber-btn:hover:not(:disabled){background:rgba(245,158,11,0.2)!important;box-shadow:0 0 30px rgba(245,158,11,0.5)!important;transform:translateY(-2px);}
        .amber-btn:active:not(:disabled){transform:translateY(0);}
      `}</style>
    </div>
  );
}

const S = {
  wrap: { position:'fixed', inset:0, display:'flex', alignItems:'center', justifyContent:'center', background:'#0e0a00' },
  canvas: { position:'absolute', inset:0, zIndex:0 },
  scanlines: {
    position:'absolute', inset:0, zIndex:1, pointerEvents:'none',
    background:'repeating-linear-gradient(0deg,rgba(0,0,0,0.03) 0px,rgba(0,0,0,0.03) 1px,transparent 1px,transparent 2px)',
  },
  panel: {
    position:'relative', zIndex:10, width:420,
    background:'linear-gradient(160deg,rgba(20,12,0,0.97) 0%,rgba(26,16,0,0.97) 100%)',
    border:'1px solid rgba(245,158,11,0.25)', borderRadius:12,
    padding:'36px 32px', backdropFilter:'blur(20px)',
  },
  logo: { display:'flex', alignItems:'center', gap:12, marginBottom:28 },
  logoGear: { fontSize:32, color:'#f59e0b', filter:'drop-shadow(0 0 12px rgba(245,158,11,0.8))', lineHeight:1, display:'inline-block', animation:'gearSpin 12s linear infinite' },
  logoTitle: { fontFamily:'Orbitron', fontSize:20, fontWeight:900, color:'#f59e0b', letterSpacing:4 },
  logoSub: { fontFamily:'Share Tech Mono', fontSize:9, color:'#78350f', letterSpacing:3, marginTop:2 },
  logoStatus: { marginLeft:'auto', display:'flex', alignItems:'center', gap:6 },
  statusDot: { width:7, height:7, borderRadius:'50%', background:'#22c55e', boxShadow:'0 0 10px #22c55e' },
  statusText: { fontFamily:'Share Tech Mono', fontSize:9, color:'#22c55e', letterSpacing:2 },
  sectionTitle: { fontFamily:'Orbitron', fontSize:10, color:'#78350f', letterSpacing:4, marginBottom:20, paddingBottom:10, borderBottom:'1px solid rgba(245,158,11,0.1)' },
  form: { display:'flex', flexDirection:'column', gap:16 },
  field: { display:'flex', flexDirection:'column', gap:6 },
  label: { fontFamily:'Orbitron', fontSize:10, letterSpacing:3, color:'#d97706' },
  input: {
    background:'rgba(245,158,11,0.03)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:8,
    padding:'12px 14px', color:'#fef3c7', fontFamily:'Share Tech Mono', fontSize:13,
    transition:'all 0.3s', width:'100%',
  },
  error: {
    background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.3)',
    borderRadius:8, padding:'10px 14px', color:'#ef4444', fontSize:13, fontFamily:'Share Tech Mono',
  },
  successMsg: {
    background:'rgba(34,197,94,0.08)', border:'1px solid rgba(34,197,94,0.3)',
    borderRadius:8, padding:'10px 14px', color:'#22c55e', fontSize:13, fontFamily:'Share Tech Mono',
  },
  btn: {
    marginTop:4, padding:'14px',
    background:'linear-gradient(135deg,rgba(245,158,11,0.18),rgba(245,158,11,0.06))',
    border:'1px solid rgba(245,158,11,0.5)', borderRadius:8, color:'#f59e0b',
    fontFamily:'Orbitron', fontSize:12, letterSpacing:3, cursor:'pointer', transition:'all 0.3s',
  },
  btnLoading: { opacity:0.6, cursor:'not-allowed' },
  btnSuccess: { borderColor:'rgba(34,197,94,0.6)', color:'#22c55e', background:'rgba(34,197,94,0.1)' },
  corner: { position:'absolute', width:12, height:12, borderRadius:1 },
};