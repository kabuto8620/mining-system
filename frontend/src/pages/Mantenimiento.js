import React, { useState, useEffect } from 'react';
import API from '../api';
import BombaDeAgua from '../components/BombaDeAgua';

const AREAS = [
  { key:'TRITURACION', color:'#f59e0b', icon:'⬡', label:'ÁREA DE TRITURACIÓN', desc:'Reducción primaria y secundaria del mineral', equipCount:5 },
  { key:'MOLIENDA', color:'#fb923c', icon:'◈', label:'ÁREA DE MOLIENDA', desc:'Molienda y clasificación del material triturado', equipCount:6 },
  { key:'FLOTACION', color:'#fbbf24', icon:'◉', label:'ÁREA DE FLOTACIÓN', desc:'Separación por flotación de minerales', equipCount:3 },
  { key:'RECIRCULACION', color:'#f97316', icon:'⊛', label:'ÁREA DE RECIRCULACIÓN', desc:'Sistema de recirculación de agua y fluidos', equipCount:1 },
];

const STATUS_MAP = {
  operational: { label:'OPERATIVO', color:'#22c55e' },
  maintenance: { label:'MANTENIMIENTO', color:'#f59e0b' },
  critical: { label:'CRÍTICO', color:'#ef4444' },
  stopped: { label:'DETENIDO', color:'#fb923c' },
};

function EquipmentCard({ eq, color, onClick }) {
  const st = STATUS_MAP[eq.status] || STATUS_MAP.operational;
  return (
    <div onClick={() => onClick(eq)} style={{ ...EC.card, borderColor: color + '28' }} className="eq-card">
      <div style={EC.top}>
        <div style={{ ...EC.num, color, borderColor: color + '35' }}>
          {String(eq.number).padStart(2,'0')}
        </div>
        <div style={{ ...EC.statusPill, background: st.color + '12', color: st.color, borderColor: st.color + '35' }}>
          <div style={{ width:5, height:5, borderRadius:'50%', background:st.color, boxShadow:`0 0 5px ${st.color}` }} />
          {st.label}
        </div>
      </div>
      <div style={EC.name}>{eq.name}</div>
      <div style={{ ...EC.viewBtn, color, borderColor: color + '28' }}>VER DETALLES →</div>
    </div>
  );
}

function GenericEquipmentDetail({ eq, onBack, color }) {
  const [detail, setDetail] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [maintDesc, setMaintDesc] = useState('');
  const [maintType, setMaintType] = useState('preventivo');
  const [tech, setTech] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    API.get(`/equipment/${eq.id}`).then(r => setDetail(r.data)).catch(() => {});
  }, [eq.id]);

  const submitMaint = async () => {
    if (!maintDesc) return;
    setSaving(true);
    try {
      await API.post('/maintenance', { equipment_id: eq.id, type: maintType, description: maintDesc, technician: tech });
      const r = await API.get(`/equipment/${eq.id}`);
      setDetail(r.data);
      setShowForm(false); setMaintDesc(''); setTech('');
    } catch {}
    setSaving(false);
  };

  return (
    <div style={GD.wrap} className="fade-in-up">
      <button onClick={onBack} style={GD.back} className="back-btn">← VOLVER</button>

      <div style={{ ...GD.header, borderColor: color + '28', background:`linear-gradient(135deg,${color}06,transparent)` }}>
        <div style={{ ...GD.numBig, color, borderColor: color + '45' }}>{eq.number}</div>
        <div style={{ flex:1 }}>
          <h2 style={{ ...GD.title, color }}>{eq.name}</h2>
          <p style={GD.area}>ÁREA DE {eq.area}</p>
        </div>
        <div style={{
          ...GD.statusBig,
          color: STATUS_MAP[eq.status]?.color || '#22c55e',
          borderColor: (STATUS_MAP[eq.status]?.color || '#22c55e') + '35',
          background: (STATUS_MAP[eq.status]?.color || '#22c55e') + '08',
        }}>
          ● {STATUS_MAP[eq.status]?.label || 'OPERATIVO'}
        </div>
      </div>

      <button onClick={() => setShowForm(!showForm)}
        style={{ ...GD.maintBtn, borderColor: color + '40', color, background: showForm ? color + '12' : 'transparent' }}
        className="maint-btn">
        ⚙ {showForm ? 'CANCELAR' : 'REGISTRAR MANTENIMIENTO'}
      </button>

      {showForm && (
        <div style={{ ...GD.form, borderColor: color + '28', animation:'slideDown 0.3s ease' }}>
          <div style={{ ...GD.formTitle, color }}>◈ NUEVO REGISTRO DE MANTENIMIENTO</div>
          <div style={GD.formRow}>
            <div style={GD.formField}>
              <label style={{ ...GD.label, color }}>TIPO</label>
              <select style={GD.input} value={maintType} onChange={e => setMaintType(e.target.value)} className="amber-input">
                <option value="preventivo">Preventivo</option>
                <option value="correctivo">Correctivo</option>
                <option value="predictivo">Predictivo</option>
              </select>
            </div>
            <div style={GD.formField}>
              <label style={{ ...GD.label, color }}>TÉCNICO</label>
              <input style={GD.input} value={tech} onChange={e => setTech(e.target.value)} placeholder="Nombre del técnico" className="amber-input" />
            </div>
          </div>
          <div style={GD.formField}>
            <label style={{ ...GD.label, color }}>DESCRIPCIÓN DEL TRABAJO</label>
            <textarea style={{ ...GD.input, minHeight:70, resize:'vertical' }} value={maintDesc} onChange={e => setMaintDesc(e.target.value)} placeholder="Trabajo realizado, observaciones..." className="amber-input" />
          </div>
          <button onClick={submitMaint} disabled={saving} style={{ ...GD.saveBtn, background: color + '15', borderColor: color + '50', color }}>
            {saving ? '◌ GUARDANDO...' : '✓ GUARDAR REGISTRO'}
          </button>
        </div>
      )}

      {detail?.logs?.length > 0 && (
        <div style={GD.logs}>
          <div style={{ ...GD.logsTitle, color }}>📋 HISTORIAL DE MANTENIMIENTO</div>
          {detail.logs.map((log, i) => (
            <div key={log.id} style={{ ...GD.logRow, animationDelay:`${i*0.05}s` }} className="log-row">
              <div style={{ ...GD.logTypePill, background: color+'12', color, borderColor: color+'30' }}>
                {log.type?.toUpperCase()}
              </div>
              <span style={GD.logDesc}>{log.description}</span>
              <span style={GD.logDate}>{new Date(log.date).toLocaleDateString('es-BO')}</span>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes slideDown{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
        .fade-in-up{animation:fadeUp 0.4s ease both;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        .amber-input:focus{outline:none;border-color:${color}60!important;box-shadow:0 0 15px ${color}20!important;}
        .back-btn:hover{background:rgba(245,158,11,0.08)!important;color:#f59e0b!important;}
        .maint-btn:hover{background:${color}15!important;}
        .log-row{animation:fadeUp 0.3s ease both;opacity:0;}
      `}</style>
    </div>
  );
}

export default function Mantenimiento() {
  const [selectedArea, setSelectedArea] = useState(null);
  const [equipment, setEquipment] = useState([]);
  const [selectedEq, setSelectedEq] = useState(null);

  useEffect(() => {
    if (selectedArea) {
      API.get(`/equipment?area=${selectedArea}`).then(r => setEquipment(r.data)).catch(() => {});
    }
  }, [selectedArea]);

  const area = AREAS.find(a => a.key === selectedArea);

  // Bomba de agua special view
  if (selectedEq && selectedEq.name === 'BOMBA DE AGUA' && selectedEq.area === 'RECIRCULACION') {
    return (
      <div>
        <Breadcrumb items={[
          { label:'MANTENIMIENTO', onClick:() => { setSelectedArea(null); setSelectedEq(null); } },
          { label:selectedArea, onClick:() => setSelectedEq(null), color: area?.color },
          { label:'BOMBA DE AGUA', color:'#f97316' },
        ]} />
        <BombaDeAgua equipmentId={selectedEq.id} />
      </div>
    );
  }

  // Equipment detail
  if (selectedEq) {
    return (
      <div>
        <Breadcrumb items={[
          { label:'MANTENIMIENTO', onClick:() => { setSelectedArea(null); setSelectedEq(null); } },
          { label:selectedArea, onClick:() => setSelectedEq(null), color: area?.color },
          { label:selectedEq.name, color: area?.color },
        ]} />
        <GenericEquipmentDetail eq={selectedEq} onBack={() => setSelectedEq(null)} color={area?.color || '#f59e0b'} />
      </div>
    );
  }

  // Equipment list in area
  if (selectedArea) {
    return (
      <div>
        <Breadcrumb items={[
          { label:'MANTENIMIENTO', onClick:() => setSelectedArea(null) },
          { label:selectedArea, color: area?.color },
        ]} />
        <div style={{ ...ST.areaHeader, borderColor: area.color + '28', background: area.color + '05' }}>
          <div style={{ fontSize:40, color:area.color, filter:`drop-shadow(0 0 14px ${area.color})`, lineHeight:1 }}>{area.icon}</div>
          <div>
            <h2 style={{ fontFamily:'Orbitron', fontSize:18, fontWeight:800, letterSpacing:3, color:area.color }}>{area.label}</h2>
            <p style={{ fontFamily:'Share Tech Mono', fontSize:10, color:'#78350f', letterSpacing:1, marginTop:5 }}>{area.desc}</p>
          </div>
          <div style={{ marginLeft:'auto', textAlign:'right' }}>
            <div style={{ fontFamily:'Orbitron', fontSize:28, fontWeight:900, color:area.color }}>{equipment.length}</div>
            <div style={{ fontFamily:'Share Tech Mono', fontSize:8, color:'#78350f', letterSpacing:3 }}>EQUIPOS</div>
          </div>
        </div>
        <div style={ST.eqGrid}>
          {equipment.map(eq => (
            <EquipmentCard key={eq.id} eq={eq} color={area.color} onClick={setSelectedEq} />
          ))}
        </div>
        <style>{`
          @keyframes cardIn{from{opacity:0;transform:translateY(18px) scale(0.96)}to{opacity:1;transform:translateY(0) scale(1)}}
          .eq-card{animation:cardIn 0.35s ease both;cursor:pointer;transition:all 0.2s;}
          .eq-card:hover{transform:translateY(-5px);box-shadow:0 8px 24px rgba(245,158,11,0.15);}
        `}</style>
      </div>
    );
  }

  // Main area selector
  return (
    <div style={{ ...ST.wrap, opacity: 1 }} className="fade-in-up">
      <div style={ST.pageHeader}>
        <div style={ST.pageTag}>⚙ GESTIÓN TÉCNICA</div>
        <h1 style={ST.pageTitle}>MÓDULO DE MANTENIMIENTO</h1>
        <p style={ST.pageSub}>Selecciona un área para gestionar sus equipos y registrar mantenimientos</p>
      </div>
      <div style={ST.areasGrid}>
        {AREAS.map((area, i) => (
          <div key={area.key} onClick={() => setSelectedArea(area.key)}
            style={{ ...ST.areaCard, borderColor: area.color + '28', animationDelay:`${i*0.1}s` }}
            className="main-area-card">
            <div style={{ ...ST.areaGlow, background:`radial-gradient(circle at 30% 20%,${area.color}10,transparent 65%)` }} />
            <div style={{ ...ST.areaCardIcon, color:area.color, filter:`drop-shadow(0 0 15px ${area.color})` }}>
              {area.icon}
            </div>
            <h3 style={{ ...ST.areaCardTitle, color:area.color }}>{area.label}</h3>
            <p style={ST.areaCardDesc}>{area.desc}</p>
            <div style={ST.areaCardMeta}>
              <span style={{ fontFamily:'Share Tech Mono', fontSize:10, color: area.color + '88' }}>
                {area.equipCount} equipos
              </span>
            </div>
            <div style={{ ...ST.areaCardBtn, borderColor: area.color + '38', color: area.color }}>
              ACCEDER →
            </div>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes areaIn{from{opacity:0;transform:scale(0.93) translateY(20px)}to{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        .fade-in-up{animation:fadeUp 0.5s ease both;}
        .main-area-card{animation:areaIn 0.45s ease both;cursor:pointer;transition:all 0.25s;}
        .main-area-card:hover{transform:translateY(-8px) scale(1.02)!important;box-shadow:0 12px 40px rgba(245,158,11,0.15);}
      `}</style>
    </div>
  );
}

function Breadcrumb({ items }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:18, animation:'fadeUp 0.4s ease both' }}>
      {items.map((item, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span style={{ color:'rgba(245,158,11,0.25)', fontSize:12 }}>›</span>}
          <button onClick={item.onClick}
            style={{
              fontFamily:'Orbitron', fontSize:9, letterSpacing:2,
              color: item.color || (item.onClick ? '#78350f' : '#3d1c00'),
              background:'transparent', border:'none',
              cursor: item.onClick ? 'pointer' : 'default',
              padding:'4px 8px', borderRadius:4,
              transition:'color 0.2s',
            }}
            onMouseEnter={e => item.onClick && (e.target.style.color = '#d97706')}
            onMouseLeave={e => item.onClick && (e.target.style.color = item.color || '#78350f')}>
            {item.label}
          </button>
        </React.Fragment>
      ))}
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}

const EC = {
  card: {
    background:'rgba(20,12,0,0.9)', border:'1px solid',
    borderRadius:10, padding:'16px', display:'flex',
    flexDirection:'column', gap:8,
  },
  top: { display:'flex', justifyContent:'space-between', alignItems:'center' },
  num: { fontFamily:'Orbitron', fontSize:22, fontWeight:900, border:'1px solid', borderRadius:8, padding:'2px 10px' },
  statusPill: { display:'flex', alignItems:'center', gap:5, fontFamily:'Share Tech Mono', fontSize:8, border:'1px solid', borderRadius:20, padding:'3px 9px', letterSpacing:1 },
  name: { fontFamily:'Exo 2', fontSize:14, fontWeight:600, color:'#fef3c7', lineHeight:1.3 },
  viewBtn: { fontFamily:'Orbitron', fontSize:8, letterSpacing:2, border:'1px solid', borderRadius:6, padding:'5px 10px', marginTop:2, textAlign:'center', transition:'all 0.2s' },
};

const GD = {
  wrap: { display:'flex', flexDirection:'column', gap:14 },
  back: { background:'transparent', border:'1px solid rgba(245,158,11,0.2)', borderRadius:8, padding:'8px 16px', color:'#d97706', fontFamily:'Orbitron', fontSize:9, letterSpacing:2, cursor:'pointer', alignSelf:'flex-start', transition:'all 0.2s' },
  header: { display:'flex', alignItems:'center', gap:16, padding:'18px 20px', border:'1px solid', borderRadius:12 },
  numBig: { fontFamily:'Orbitron', fontSize:34, fontWeight:900, border:'2px solid', borderRadius:12, padding:'6px 16px', flexShrink:0, lineHeight:1 },
  title: { fontFamily:'Orbitron', fontSize:18, fontWeight:800, letterSpacing:3 },
  area: { fontFamily:'Share Tech Mono', fontSize:9, color:'#3d1c00', letterSpacing:2, marginTop:4 },
  statusBig: { marginLeft:'auto', fontFamily:'Share Tech Mono', fontSize:10, border:'1px solid', borderRadius:20, padding:'6px 16px', letterSpacing:2 },
  maintBtn: { background:'transparent', border:'1px solid', borderRadius:8, padding:'11px 20px', fontFamily:'Orbitron', fontSize:10, letterSpacing:2, cursor:'pointer', alignSelf:'flex-start', transition:'all 0.2s' },
  form: { background:'rgba(20,12,0,0.9)', border:'1px solid', borderRadius:12, padding:'18px' },
  formTitle: { fontFamily:'Orbitron', fontSize:10, letterSpacing:3, marginBottom:14 },
  formRow: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 },
  formField: { display:'flex', flexDirection:'column', gap:6, marginBottom:12 },
  label: { fontFamily:'Orbitron', fontSize:8, letterSpacing:3 },
  input: { background:'rgba(0,0,0,0.5)', border:'1px solid rgba(245,158,11,0.18)', borderRadius:8, padding:'9px 12px', color:'#fef3c7', fontFamily:'Share Tech Mono', fontSize:12 },
  saveBtn: { border:'1px solid', borderRadius:8, padding:'10px 22px', fontFamily:'Orbitron', fontSize:9, letterSpacing:2, cursor:'pointer', transition:'all 0.2s' },
  logs: { background:'rgba(20,12,0,0.85)', border:'1px solid rgba(245,158,11,0.1)', borderRadius:12, padding:'16px 18px' },
  logsTitle: { fontFamily:'Orbitron', fontSize:9, letterSpacing:3, marginBottom:12 },
  logRow: { display:'flex', alignItems:'center', gap:12, padding:'8px 0', borderBottom:'1px solid rgba(245,158,11,0.05)', opacity:0 },
  logTypePill: { fontFamily:'Orbitron', fontSize:8, letterSpacing:2, border:'1px solid', borderRadius:20, padding:'3px 10px', flexShrink:0 },
  logDesc: { flex:1, fontFamily:'Exo 2', fontSize:13, color:'#fef3c7' },
  logDate: { fontFamily:'Share Tech Mono', fontSize:9, color:'#3d1c00' },
};

const ST = {
  wrap: { display:'flex', flexDirection:'column', gap:22 },
  pageHeader: { paddingBottom:16, borderBottom:'1px solid rgba(245,158,11,0.1)' },
  pageTag: { fontFamily:'Share Tech Mono', fontSize:9, color:'#78350f', letterSpacing:4, marginBottom:8 },
  pageTitle: { fontFamily:'Orbitron', fontSize:22, fontWeight:900, color:'#f59e0b', letterSpacing:3, filter:'drop-shadow(0 0 12px rgba(245,158,11,0.3))' },
  pageSub: { fontFamily:'Share Tech Mono', fontSize:10, color:'#3d1c00', letterSpacing:1, marginTop:6 },
  areasGrid: { display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:16 },
  areaCard: { background:'rgba(20,12,0,0.92)', border:'1px solid', borderRadius:14, padding:'28px', position:'relative', overflow:'hidden', display:'flex', flexDirection:'column', gap:10 },
  areaGlow: { position:'absolute', inset:0, pointerEvents:'none' },
  areaCardIcon: { fontSize:48, lineHeight:1, position:'relative', zIndex:1 },
  areaCardTitle: { fontFamily:'Orbitron', fontSize:13, fontWeight:800, letterSpacing:3, position:'relative', zIndex:1 },
  areaCardDesc: { fontFamily:'Exo 2', fontSize:13, color:'#78350f', lineHeight:1.5, position:'relative', zIndex:1 },
  areaCardMeta: { position:'relative', zIndex:1 },
  areaCardBtn: { border:'1px solid', borderRadius:8, padding:'10px 16px', fontFamily:'Orbitron', fontSize:10, letterSpacing:3, marginTop:4, textAlign:'center', position:'relative', zIndex:1, transition:'all 0.2s' },
  areaHeader: { display:'flex', alignItems:'center', gap:16, padding:'18px 22px', border:'1px solid', borderRadius:12, marginBottom:16 },
  eqGrid: { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 },
};
