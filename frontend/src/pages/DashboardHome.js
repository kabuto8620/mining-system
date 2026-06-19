import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import API from '../api';

const AREA_COLORS = {
  TRITURACION: '#f59e0b', MOLIENDA: '#fb923c', FLOTACION: '#fbbf24', RECIRCULACION: '#f97316'
};

const mockActivity = [
  { time:'06:00', ops:14 }, { time:'08:00', ops:18 }, { time:'10:00', ops:22 },
  { time:'12:00', ops:16 }, { time:'14:00', ops:25 }, { time:'16:00', ops:20 },
  { time:'18:00', ops:12 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'#1a1000', border:'1px solid rgba(245,158,11,0.3)', borderRadius:8, padding:'8px 12px' }}>
      <div style={{ fontFamily:'Share Tech Mono', fontSize:10, color:'#d97706', marginBottom:4 }}>{label}</div>
      <div style={{ fontFamily:'Orbitron', fontSize:14, color:'#f59e0b' }}>{payload[0].value}</div>
    </div>
  );
};

export default function DashboardHome() {
  const [stats, setStats] = useState(null);
  const [equipment, setEquipment] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    API.get('/stats').then(r => setStats(r.data)).catch(() => {});
    API.get('/equipment').then(r => setEquipment(r.data)).catch(() => {});
  }, []);

  const areas = ['TRITURACION', 'MOLIENDA', 'FLOTACION', 'RECIRCULACION'];
  const radarData = areas.map(a => ({
    area: a.slice(0,5),
    valor: equipment.filter(e => e.area === a && e.status === 'operational').length,
    total: equipment.filter(e => e.area === a).length,
  }));

  const kpis = [
    { label:'EQUIPOS TOTALES', value:stats?.total ?? '—', color:'#f59e0b', icon:'⊞', sub:'inventario' },
    { label:'OPERATIVOS', value:stats?.operational ?? '—', color:'#22c55e', icon:'◉', sub:'activos' },
    { label:'MANTENIMIENTO', value:stats?.maintenance ?? '—', color:'#fb923c', icon:'⚙', sub:'en proceso' },
    { label:'ESTADO CRÍTICO', value:stats?.critical ?? '—', color:'#ef4444', icon:'⚠', sub:'requieren atención' },
  ];

  return (
    <div style={S.wrap}>
      {/* Header */}
      <div style={S.pageHeader} className="fade-in-up">
        <div>
          <div style={S.pageTag}>◈ PANEL DE CONTROL</div>
          <h1 style={S.title}>CENTRO DE OPERACIONES</h1>
          <p style={S.subtitle}>Sistema de Gestión de Mantenimiento Minero</p>
        </div>
        <div style={S.headerRight}>
          <div style={S.liveIndicator}>
            <div style={S.liveDot} />
            <span style={S.liveText}>TIEMPO REAL</span>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div style={S.kpiGrid}>
        {kpis.map((k, i) => (
          <div key={i} style={{ ...S.kpiCard, borderColor: k.color + '30', animationDelay:`${i*0.1}s` }}
            className="kpi-card">
            <div style={S.kpiTop}>
              <span style={{ ...S.kpiIcon, color: k.color }}>{k.icon}</span>
              <span style={{ ...S.kpiTrend, color: k.color + 'aa' }}>↑</span>
            </div>
            <div style={{ ...S.kpiValue, color: k.color }}>{k.value}</div>
            <div style={S.kpiLabel}>{k.label}</div>
            <div style={S.kpiSub}>{k.sub}</div>
            <div style={{ ...S.kpiBarBg, background: k.color + '10' }}>
              <div style={{
                ...S.kpiBarFill,
                background:`linear-gradient(90deg,${k.color},${k.color}66)`,
                width:`${Math.min((+k.value / (stats?.total || 1)) * 100, 100)}%`,
              }} />
            </div>
            <div style={{ ...S.kpiGlow, background:`radial-gradient(circle at 50% 0%,${k.color}08,transparent 70%)` }} />
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div style={S.mainGrid}>
        {/* Area modules */}
        <div style={S.areaCol}>
          <div style={S.sectionHeader}>
            <span style={S.sectionIcon}>◈</span>
            <span style={S.sectionTitle}>MÓDULOS POR ÁREA</span>
          </div>
          {areas.map(area => {
            const aEquip = equipment.filter(e => e.area === area);
            const opCount = aEquip.filter(e => e.status === 'operational').length;
            const color = AREA_COLORS[area];
            const pct = aEquip.length ? Math.round(opCount/aEquip.length*100) : 0;
            return (
              <div key={area} style={{ ...S.areaCard, borderColor: color + '30' }}
                onClick={() => navigate('/dashboard/mantenimiento')} className="area-card">
                <div style={S.areaTop}>
                  <div style={S.areaLeft}>
                    <div style={{ ...S.areaDot, background: color, boxShadow:`0 0 8px ${color}` }} />
                    <span style={{ ...S.areaName, color }}>{area}</span>
                  </div>
                  <div style={{ ...S.areaBadge, background: color + '18', color, borderColor: color + '40' }}>
                    {opCount}/{aEquip.length}
                  </div>
                </div>
                <div style={S.areaProgress}>
                  <div style={S.areaBar}>
                    <div style={{
                      ...S.areaFill,
                      background:`linear-gradient(90deg,${color},${color}88)`,
                      width:`${pct}%`,
                    }} />
                  </div>
                  <span style={{ ...S.areaPct, color }}>{pct}%</span>
                </div>
                <div style={S.equipTags}>
                  {aEquip.slice(0,2).map(e => (
                    <span key={e.id} style={{ ...S.equipTag, borderColor: color + '25', color: color + 'bb' }}>
                      {e.number}. {e.name.length > 16 ? e.name.slice(0,16) + '…' : e.name}
                    </span>
                  ))}
                  {aEquip.length > 2 && <span style={{ ...S.equipTag, color:'#78350f' }}>+{aEquip.length-2}</span>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Charts */}
        <div style={S.chartsCol}>
          <div style={S.chartCard}>
            <div style={S.sectionHeader}>
              <span style={S.sectionIcon}>◉</span>
              <span style={S.sectionTitle}>ACTIVIDAD DEL SISTEMA</span>
            </div>
            <ResponsiveContainer width="100%" height={155}>
              <AreaChart data={mockActivity} margin={{ top:5, right:5, bottom:0, left:-20 }}>
                <defs>
                  <linearGradient id="amberGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" tick={{ fill:'#78350f', fontSize:9, fontFamily:'Share Tech Mono' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill:'#78350f', fontSize:9 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="ops" stroke="#f59e0b" strokeWidth={2} fill="url(#amberGrad)" dot={false} activeDot={{ r:4, fill:'#f59e0b', stroke:'#fbbf24', strokeWidth:2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div style={S.chartCard}>
            <div style={S.sectionHeader}>
              <span style={S.sectionIcon}>⬡</span>
              <span style={S.sectionTitle}>ESTADO POR ÁREA</span>
            </div>
            <ResponsiveContainer width="100%" height={175}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(245,158,11,0.1)" />
                <PolarAngleAxis dataKey="area" tick={{ fill:'#d97706', fontSize:10, fontFamily:'Share Tech Mono' }} />
                <Radar name="Operativos" dataKey="valor" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.12} strokeWidth={2} dot={{ fill:'#f59e0b', r:3 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent equipment table */}
      <div style={S.tableCard} className="fade-in-up">
        <div style={S.sectionHeader}>
          <span style={S.sectionIcon}>⊞</span>
          <span style={S.sectionTitle}>REGISTRO DE EQUIPOS</span>
          <span style={S.tableCount}>{equipment.length} equipos</span>
        </div>
        <table style={S.table}>
          <thead>
            <tr>
              {['ÁREA', 'N°', 'EQUIPO', 'ESTADO', 'ACCIÓN'].map(h => (
                <th key={h} style={S.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {equipment.slice(0,8).map((e, i) => (
              <tr key={e.id} style={{ animationDelay:`${i*0.04}s` }} className="table-row">
                <td style={{ ...S.td, color: AREA_COLORS[e.area] || '#f59e0b', fontWeight:700 }}>{e.area}</td>
                <td style={{ ...S.td, fontFamily:'Orbitron', fontSize:11, color:'#d97706' }}>{e.number}</td>
                <td style={{ ...S.td, fontWeight:600 }}>{e.name}</td>
                <td style={S.td}>
                  <span style={{
                    ...S.statusChip,
                    background: e.status === 'operational' ? 'rgba(34,197,94,0.08)' : 'rgba(245,158,11,0.1)',
                    color: e.status === 'operational' ? '#22c55e' : '#f59e0b',
                    borderColor: e.status === 'operational' ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)',
                  }}>
                    ● {e.status === 'operational' ? 'OPERATIVO' : 'MANTENIMIENTO'}
                  </span>
                </td>
                <td style={S.td}>
                  <button onClick={() => navigate('/dashboard/mantenimiento')} style={S.actionBtn} className="action-btn">VER →</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}
        @keyframes amberpulse{0%,100%{box-shadow:0 0 0 0 rgba(245,158,11,0.3)}50%{box-shadow:0 0 0 8px rgba(245,158,11,0)}}
        .kpi-card{animation:fadeUp 0.5s ease both;}
        .area-card{cursor:pointer;transition:all 0.2s;}
        .area-card:hover{transform:translateX(5px);box-shadow:0 4px 20px rgba(245,158,11,0.12);}
        .table-row{animation:fadeUp 0.4s ease both;}
        .table-row:hover td{background:rgba(245,158,11,0.03)!important;}
        .fade-in-up{animation:fadeUp 0.6s ease both;}
        .action-btn:hover{background:rgba(245,158,11,0.15)!important;box-shadow:0 0 15px rgba(245,158,11,0.3)!important;}
      `}</style>
    </div>
  );
}

const S = {
  wrap: { display:'flex', flexDirection:'column', gap:18 },
  pageHeader: { display:'flex', alignItems:'flex-start', justifyContent:'space-between', paddingBottom:16, borderBottom:'1px solid rgba(245,158,11,0.1)' },
  pageTag: { fontFamily:'Share Tech Mono', fontSize:9, color:'#78350f', letterSpacing:4, marginBottom:6 },
  title: { fontFamily:'Orbitron', fontSize:22, fontWeight:900, color:'#f59e0b', letterSpacing:3, filter:'drop-shadow(0 0 15px rgba(245,158,11,0.3))' },
  subtitle: { fontFamily:'Share Tech Mono', fontSize:10, color:'#78350f', letterSpacing:2, marginTop:5 },
  headerRight: { display:'flex', gap:10 },
  liveIndicator: { display:'flex', alignItems:'center', gap:7, padding:'6px 12px', background:'rgba(34,197,94,0.06)', border:'1px solid rgba(34,197,94,0.2)', borderRadius:8 },
  liveDot: { width:6, height:6, borderRadius:'50%', background:'#22c55e', boxShadow:'0 0 8px #22c55e', animation:'blink 2s infinite' },
  liveText: { fontFamily:'Share Tech Mono', fontSize:9, color:'#22c55e', letterSpacing:2 },
  kpiGrid: { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 },
  kpiCard: {
    background:'linear-gradient(150deg,rgba(26,16,0,0.95),rgba(20,12,0,0.9))',
    border:'1px solid', borderRadius:12, padding:'18px 20px',
    position:'relative', overflow:'hidden',
  },
  kpiTop: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 },
  kpiIcon: { fontSize:20 },
  kpiTrend: { fontFamily:'Share Tech Mono', fontSize:12 },
  kpiValue: { fontFamily:'Orbitron', fontSize:36, fontWeight:900, lineHeight:1 },
  kpiLabel: { fontFamily:'Share Tech Mono', fontSize:9, color:'#78350f', letterSpacing:2, marginTop:4, marginBottom:2 },
  kpiSub: { fontFamily:'Exo 2', fontSize:11, color:'#3d1c00', marginBottom:10 },
  kpiBarBg: { height:3, borderRadius:2 },
  kpiBarFill: { height:'100%', borderRadius:2, transition:'width 1.2s cubic-bezier(0.4,0,0.2,1)' },
  kpiGlow: { position:'absolute', inset:0, pointerEvents:'none' },
  mainGrid: { display:'grid', gridTemplateColumns:'1fr 1.1fr', gap:18 },
  areaCol: { display:'flex', flexDirection:'column', gap:8 },
  sectionHeader: { display:'flex', alignItems:'center', gap:8, marginBottom:8 },
  sectionIcon: { color:'#d97706', fontSize:14 },
  sectionTitle: { fontFamily:'Orbitron', fontSize:10, color:'#d97706', letterSpacing:3 },
  tableCount: { marginLeft:'auto', fontFamily:'Share Tech Mono', fontSize:9, color:'#78350f' },
  areaCard: {
    background:'rgba(20,12,0,0.85)', border:'1px solid',
    borderRadius:10, padding:'13px 15px',
  },
  areaTop: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 },
  areaLeft: { display:'flex', alignItems:'center', gap:8 },
  areaDot: { width:8, height:8, borderRadius:'50%', flexShrink:0 },
  areaName: { fontFamily:'Orbitron', fontSize:11, fontWeight:700, letterSpacing:2 },
  areaBadge: { fontFamily:'Share Tech Mono', fontSize:10, border:'1px solid', borderRadius:20, padding:'2px 10px' },
  areaProgress: { display:'flex', alignItems:'center', gap:8, marginBottom:8 },
  areaBar: { flex:1, height:3, background:'rgba(255,255,255,0.04)', borderRadius:2 },
  areaFill: { height:'100%', borderRadius:2, transition:'width 1.2s ease' },
  areaPct: { fontFamily:'Share Tech Mono', fontSize:9, width:28, textAlign:'right' },
  equipTags: { display:'flex', flexWrap:'wrap', gap:4 },
  equipTag: { fontFamily:'Share Tech Mono', fontSize:8, border:'1px solid', borderRadius:4, padding:'2px 5px' },
  chartsCol: { display:'flex', flexDirection:'column', gap:12 },
  chartCard: {
    background:'rgba(20,12,0,0.85)', border:'1px solid rgba(245,158,11,0.1)',
    borderRadius:12, padding:'15px 18px',
  },
  tableCard: {
    background:'rgba(20,12,0,0.85)', border:'1px solid rgba(245,158,11,0.1)',
    borderRadius:12, padding:'18px 22px',
  },
  table: { width:'100%', borderCollapse:'collapse', marginTop:4 },
  th: {
    fontFamily:'Orbitron', fontSize:9, color:'#3d1c00', letterSpacing:3,
    textAlign:'left', padding:'8px 12px',
    borderBottom:'1px solid rgba(245,158,11,0.08)',
  },
  td: { fontFamily:'Exo 2', fontSize:13, color:'#fef3c7', padding:'10px 12px' },
  statusChip: {
    fontFamily:'Share Tech Mono', fontSize:8, border:'1px solid',
    borderRadius:20, padding:'3px 9px', letterSpacing:1,
  },
  actionBtn: {
    background:'rgba(245,158,11,0.06)', border:'1px solid rgba(245,158,11,0.2)',
    borderRadius:6, color:'#d97706',
    fontFamily:'Orbitron', fontSize:8, letterSpacing:2,
    padding:'4px 10px', cursor:'pointer', transition:'all 0.2s',
  },
};
