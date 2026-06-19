import React, { useState, useEffect } from 'react';
import API from '../api';

const AREA_COLORS = {
  TRITURACION: '#f59e0b', MOLIENDA: '#fb923c', FLOTACION: '#fbbf24', RECIRCULACION: '#f97316'
};
const STATUS_MAP = {
  operational: { label:'OPERATIVO', color:'#22c55e' },
  maintenance: { label:'MANTENIMIENTO', color:'#f59e0b' },
  critical: { label:'CRÍTICO', color:'#ef4444' },
  stopped: { label:'DETENIDO', color:'#fb923c' },
};

export default function Inventario() {
  const [equipment, setEquipment] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [editId, setEditId] = useState(null);
  const [editStatus, setEditStatus] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const AREAS = ['ALL', 'TRITURACION', 'MOLIENDA', 'FLOTACION', 'RECIRCULACION'];

  useEffect(() => { load(); }, []);
  const load = () => API.get('/equipment').then(r => setEquipment(r.data));

  const filtered = equipment.filter(e =>
    (filter === 'ALL' || e.area === filter) &&
    (!search || e.name.toLowerCase().includes(search.toLowerCase()))
  );

  const grouped = AREAS.filter(a => a !== 'ALL').reduce((acc, area) => {
    acc[area] = filtered.filter(e => e.area === area);
    return acc;
  }, {});

  const startEdit = (e) => { setEditId(e.id); setEditStatus(e.status); setEditNotes(e.notes || ''); };

  const saveEdit = async () => {
    setSaving(true);
    try {
      await API.put(`/equipment/${editId}`, { status: editStatus, notes: editNotes });
      setSaved(true);
      await load();
      setTimeout(() => { setEditId(null); setSaved(false); }, 800);
    } catch {}
    setSaving(false);
  };

  const totalsByArea = {};
  AREAS.filter(a => a !== 'ALL').forEach(a => {
    const ae = equipment.filter(e => e.area === a);
    totalsByArea[a] = { total: ae.length, op: ae.filter(e => e.status === 'operational').length };
  });

  return (
    <div style={S.wrap}>
      {/* Header */}
      <div style={S.header} className="fade-in-up">
        <div>
          <div style={S.tag}>⊞ GESTIÓN DE ACTIVOS</div>
          <h1 style={S.title}>INVENTARIO DE EQUIPOS</h1>
          <p style={S.subtitle}>Parque completo de maquinaria minera</p>
        </div>
        <div style={S.totalCard}>
          <div style={S.totalNum}>{equipment.length}</div>
          <div style={S.totalLabel}>EQUIPOS</div>
        </div>
      </div>

      {/* Area pills */}
      <div style={S.areaSummary}>
        {AREAS.filter(a => a !== 'ALL').map(area => {
          const t = totalsByArea[area] || { total:0, op:0 };
          const color = AREA_COLORS[area];
          const active = filter === area;
          return (
            <div key={area} style={{
              ...S.areaPill,
              borderColor: active ? color + '80' : color + '30',
              background: active ? color + '15' : 'rgba(20,12,0,0.8)',
              transform: active ? 'translateY(-2px)' : 'none',
              boxShadow: active ? `0 4px 16px ${color}20` : 'none',
            }} onClick={() => setFilter(filter === area ? 'ALL' : area)}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:color, boxShadow: active ? `0 0 8px ${color}` : 'none' }} />
              <span style={{ fontFamily:'Orbitron', fontSize:9, letterSpacing:2, color:active ? color : color+'88' }}>{area}</span>
              <span style={{ fontFamily:'Share Tech Mono', fontSize:9, color: active ? color+'aa' : '#3d1c00' }}>{t.op}/{t.total}</span>
            </div>
          );
        })}
      </div>

      {/* Toolbar */}
      <div style={S.toolbar}>
        <div style={S.searchWrap}>
          <span style={S.searchIcon}>⌕</span>
          <input style={S.search} placeholder="Buscar equipo..."
            value={search} onChange={e => setSearch(e.target.value)} className="amber-input" />
        </div>
        <div style={S.filterBtns}>
          {AREAS.map(a => (
            <button key={a} onClick={() => setFilter(a)} className="filter-btn"
              style={{ ...S.filterBtn, ...(filter === a ? S.filterBtnActive : {}) }}>
              {a === 'ALL' ? 'TODOS' : a.slice(0,5)}
            </button>
          ))}
        </div>
      </div>

      {/* Tables */}
      {(filter === 'ALL' ? AREAS.filter(a => a !== 'ALL') : [filter]).map(area => {
        const aEquip = grouped[area] || [];
        if (!aEquip.length) return null;
        const color = AREA_COLORS[area];
        const opPct = aEquip.length ? Math.round(aEquip.filter(e => e.status === 'operational').length / aEquip.length * 100) : 0;
        return (
          <div key={area} style={{ ...S.areaSection, borderColor: color + '25' }}>
            {/* Area header */}
            <div style={{ ...S.areaTitleBar, background:`linear-gradient(90deg,${color}10,transparent)`, borderColor: color + '30' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:10, height:10, borderRadius:'50%', background:color, boxShadow:`0 0 8px ${color}` }} />
                <span style={{ fontFamily:'Orbitron', fontSize:12, fontWeight:700, letterSpacing:3, color }}>{area}</span>
                <span style={{ fontFamily:'Share Tech Mono', fontSize:10, color: color + '88' }}>{aEquip.length} equipos</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:90, height:4, background:'rgba(255,255,255,0.05)', borderRadius:2 }}>
                  <div style={{ height:'100%', borderRadius:2, background:color, width:`${opPct}%`, transition:'width 1s ease' }} />
                </div>
                <span style={{ fontFamily:'Share Tech Mono', fontSize:10, color }}>{opPct}%</span>
              </div>
            </div>

            <table style={S.table}>
              <thead>
                <tr>
                  {['N°', 'EQUIPO', 'ESTADO', 'ÚLTIMO MANT.', 'NOTAS', 'ACCIONES'].map(h => (
                    <th key={h} style={S.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {aEquip.map((e, i) => (
                  <React.Fragment key={e.id}>
                    <tr style={{ animationDelay:`${i*0.04}s` }} className="inv-row">
                      <td style={{ ...S.td, fontFamily:'Orbitron', fontSize:12, color }}>{e.number}</td>
                      <td style={{ ...S.td, fontWeight:600, color:'#fef3c7' }}>{e.name}</td>
                      <td style={S.td}>
                        <span style={{
                          ...S.chip,
                          background:(STATUS_MAP[e.status]?.color||'#f59e0b')+'12',
                          color:STATUS_MAP[e.status]?.color||'#f59e0b',
                          borderColor:(STATUS_MAP[e.status]?.color||'#f59e0b')+'35',
                        }}>
                          ● {STATUS_MAP[e.status]?.label||e.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ ...S.td, fontFamily:'Share Tech Mono', fontSize:10, color:'#3d1c00' }}>
                        {e.last_maintenance ? new Date(e.last_maintenance).toLocaleDateString('es-BO') : '—'}
                      </td>
                      <td style={{ ...S.td, color:'#78350f', fontSize:12 }}>{e.notes || '—'}</td>
                      <td style={S.td}>
                        <button onClick={() => editId === e.id ? setEditId(null) : startEdit(e)}
                          style={{ ...S.editBtn, borderColor: color+'40', color }}
                          className="edit-btn">
                          {editId === e.id ? '✕ CERRAR' : '✎ EDITAR'}
                        </button>
                      </td>
                    </tr>
                    {editId === e.id && (
                      <tr>
                        <td colSpan={6} style={{ padding:'14px 18px', background:`${color}05`, borderTop:`1px solid ${color}20`, borderBottom:`1px solid ${color}20` }}>
                          <div style={S.editPanel}>
                            <div style={S.editField}>
                              <label style={{ ...S.editLabel, color }}>ESTADO</label>
                              <select style={{ ...S.editInput, borderColor: color+'30' }} value={editStatus} onChange={e => setEditStatus(e.target.value)} className="amber-input">
                                {Object.entries(STATUS_MAP).map(([k, v]) => (
                                  <option key={k} value={k}>{v.label}</option>
                                ))}
                              </select>
                            </div>
                            <div style={{ ...S.editField, flex:2 }}>
                              <label style={{ ...S.editLabel, color }}>NOTAS</label>
                              <input style={{ ...S.editInput, borderColor: color+'30' }} value={editNotes} onChange={e => setEditNotes(e.target.value)} placeholder="Observaciones..." className="amber-input" />
                            </div>
                            <button onClick={saveEdit} disabled={saving} style={{ ...S.saveBtn, borderColor: color+'50', color }}>
                              {saving ? '◌ GUARDANDO' : saved ? '✓ LISTO' : '✓ GUARDAR'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}

      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes rowIn{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)}}
        .fade-in-up{animation:fadeUp 0.5s ease both;}
        @keyframes rowIn{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)}}
.inv-row{animation:rowIn 0.35s ease both;}
        .inv-row:hover td{background:rgba(245,158,11,0.025)!important;}
        .amber-input:focus{outline:none;border-color:rgba(245,158,11,0.6)!important;box-shadow:0 0 15px rgba(245,158,11,0.15)!important;}
        .filter-btn:hover{background:rgba(245,158,11,0.1)!important;color:#d97706!important;}
        .edit-btn:hover{background:rgba(245,158,11,0.1)!important;}
      `}</style>
    </div>
  );
}

const S = {
  wrap: { display:'flex', flexDirection:'column', gap:16 },
  header: { display:'flex', justifyContent:'space-between', alignItems:'flex-start', paddingBottom:14, borderBottom:'1px solid rgba(245,158,11,0.1)' },
  tag: { fontFamily:'Share Tech Mono', fontSize:9, color:'#78350f', letterSpacing:4, marginBottom:6 },
  title: { fontFamily:'Orbitron', fontSize:20, fontWeight:900, color:'#f59e0b', letterSpacing:3, filter:'drop-shadow(0 0 12px rgba(245,158,11,0.3))' },
  subtitle: { fontFamily:'Share Tech Mono', fontSize:10, color:'#3d1c00', letterSpacing:2, marginTop:4 },
  totalCard: { background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.25)', borderRadius:10, padding:'14px 22px', textAlign:'center' },
  totalNum: { fontFamily:'Orbitron', fontSize:30, fontWeight:900, color:'#f59e0b', filter:'drop-shadow(0 0 10px rgba(245,158,11,0.4))' },
  totalLabel: { fontFamily:'Share Tech Mono', fontSize:8, color:'#78350f', letterSpacing:4 },
  areaSummary: { display:'flex', gap:8, flexWrap:'wrap' },
  areaPill: { display:'flex', alignItems:'center', gap:8, padding:'7px 13px', border:'1px solid', borderRadius:8, cursor:'pointer', transition:'all 0.2s' },
  toolbar: { display:'flex', gap:10, alignItems:'center' },
  searchWrap: { flex:1, position:'relative' },
  searchIcon: { position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#78350f', fontSize:16 },
  search: { width:'100%', background:'rgba(20,12,0,0.9)', border:'1px solid rgba(245,158,11,0.15)', borderRadius:8, padding:'10px 14px 10px 36px', color:'#fef3c7', fontFamily:'Share Tech Mono', fontSize:12 },
  filterBtns: { display:'flex', gap:4 },
  filterBtn: { padding:'8px 12px', background:'rgba(20,12,0,0.8)', border:'1px solid rgba(245,158,11,0.12)', borderRadius:8, color:'#78350f', fontFamily:'Orbitron', fontSize:8, letterSpacing:2, cursor:'pointer', transition:'all 0.2s' },
  filterBtnActive: { background:'rgba(245,158,11,0.15)', color:'#f59e0b', borderColor:'rgba(245,158,11,0.4)' },
  areaSection: { background:'rgba(20,12,0,0.85)', border:'1px solid', borderRadius:12, overflow:'hidden' },
  areaTitleBar: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'11px 18px', borderBottom:'1px solid' },
  table: { width:'100%', borderCollapse:'collapse' },
  th: { fontFamily:'Orbitron', fontSize:8, color:'#3d1c00', letterSpacing:3, padding:'9px 14px', textAlign:'left', background:'rgba(0,0,0,0.2)' },
  td: { fontFamily:'Exo 2', fontSize:13, color:'#d97706', padding:'10px 14px', borderBottom:'1px solid rgba(245,158,11,0.04)' },
  chip: { fontFamily:'Share Tech Mono', fontSize:8, border:'1px solid', borderRadius:20, padding:'2px 9px', letterSpacing:1 },
  editBtn: { background:'transparent', border:'1px solid', borderRadius:6, padding:'4px 10px', fontFamily:'Orbitron', fontSize:8, letterSpacing:2, cursor:'pointer', transition:'all 0.2s' },
  editPanel: { display:'flex', gap:12, alignItems:'flex-end' },
  editField: { display:'flex', flexDirection:'column', gap:5, flex:1 },
  editLabel: { fontFamily:'Orbitron', fontSize:8, letterSpacing:3 },
  editInput: { background:'rgba(0,0,0,0.5)', border:'1px solid', borderRadius:7, padding:'8px 11px', color:'#fef3c7', fontFamily:'Share Tech Mono', fontSize:12 },
  saveBtn: { background:'transparent', border:'1px solid', borderRadius:8, padding:'9px 20px', fontFamily:'Orbitron', fontSize:9, letterSpacing:2, cursor:'pointer', transition:'all 0.2s' },
};
