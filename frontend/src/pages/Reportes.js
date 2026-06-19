import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import API from '../api';

const COLORS = ['#f59e0b','#fb923c','#fbbf24','#f97316'];
const AREA_COLORS = { TRITURACION:'#f59e0b', MOLIENDA:'#fbbf24', FLOTACION:'#22c55e', RECIRCULACION:'#60a5fa' };
const TYPE_LABELS = { preventivo:'Preventivo', correctivo:'Correctivo', predictivo:'Predictivo' };
const TYPE_COLORS = { preventivo:'#22c55e', correctivo:'#ef4444', predictivo:'#60a5fa' };

// ── helpers ────────────────────────────────────────────────────────────────
function fDate(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('es-BO', { day:'2-digit', month:'short', year:'numeric' });
}
function fDateInput(dt) {
  if (!dt) return '';
  return dt.split('T')[0].substring(0, 10);
}

// ── MODAL CRUD ──────────────────────────────────────────────────────────────
function MaintenanceModal({ log, onClose, onSave, onDelete }) {
  const [form, setForm] = useState({
    type: log?.type || 'preventivo',
    description: log?.description || '',
    technician: log?.technician || '',
    next_maintenance: fDateInput(log?.next_maintenance),
  });
  const [saving, setSaving] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(log.id, form);
    setSaving(false);
  };

  return (
    <div style={M.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={M.panel} className="modal-panel">
        {/* Header */}
        <div style={M.header}>
          <div>
            <div style={M.modalTitle}>◈ EDITAR REGISTRO</div>
            <div style={M.modalSub}>REG-{String(log.id).padStart(4,'0')} — {log.equipment_name} [{log.equipment_area}]</div>
          </div>
          <button style={M.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={M.body}>
          {/* Tipo */}
          <div style={M.fieldGroup}>
            <label style={M.label}>TIPO DE MANTENIMIENTO</label>
            <div style={M.typeRow}>
              {['preventivo','correctivo','predictivo'].map(t => (
                <button key={t} onClick={() => setForm(f=>({...f,type:t}))}
                  style={{ ...M.typeBtn, ...(form.type===t ? { background: TYPE_COLORS[t]+'22', borderColor: TYPE_COLORS[t], color: TYPE_COLORS[t] } : {}) }}>
                  {TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          {/* Descripción */}
          <div style={M.fieldGroup}>
            <label style={M.label}>DESCRIPCIÓN DEL TRABAJO</label>
            <textarea style={M.textarea} value={form.description}
              onChange={e => setForm(f=>({...f,description:e.target.value}))}
              placeholder="Describir las actividades realizadas..." rows={4} />
          </div>

          {/* Técnico */}
          <div style={M.fieldGroup}>
            <label style={M.label}>TÉCNICO RESPONSABLE</label>
            <input style={M.input} value={form.technician}
              onChange={e => setForm(f=>({...f,technician:e.target.value}))}
              placeholder="Nombre del técnico" />
          </div>

          {/* Próximo mantenimiento */}
          <div style={M.fieldGroup}>
            <label style={M.label}>PRÓXIMO MANTENIMIENTO</label>
            <input type="date" style={M.input} value={form.next_maintenance}
              onChange={e => setForm(f=>({...f,next_maintenance:e.target.value}))} />
          </div>
        </div>

        <div style={M.footer}>
          {!confirmDel ? (
            <button style={M.deleteBtn} onClick={() => setConfirmDel(true)}>⊗ ELIMINAR</button>
          ) : (
            <div style={{ display:'flex', gap:8 }}>
              <button style={M.confirmDelBtn} onClick={() => onDelete(log.id)}>¿Confirmar?</button>
              <button style={M.cancelDelBtn} onClick={() => setConfirmDel(false)}>No</button>
            </div>
          )}
          <div style={{ display:'flex', gap:8 }}>
            <button style={M.cancelBtn} onClick={onClose}>Cancelar</button>
            <button style={{ ...M.saveBtn, opacity: saving ? 0.6 : 1 }} onClick={handleSave} disabled={saving}>
              {saving ? '◌ Guardando...' : '▶ GUARDAR'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── VISTA DETALLE ───────────────────────────────────────────────────────────
function MaintenanceDetail({ log, onClose, onEdit, onExportPDF, exporting }) {
  return (
    <div style={M.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ ...M.panel, maxWidth:580 }} className="modal-panel">
        <div style={M.header}>
          <div>
            <div style={M.modalTitle}>◈ DETALLE DE REGISTRO</div>
            <div style={M.modalSub}>REG-{String(log.id).padStart(4,'0')}</div>
          </div>
          <button style={M.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={M.body}>
          <div style={DT.grid}>
            <div style={DT.field}><span style={DT.lbl}>EQUIPO</span><span style={DT.val}>{log.equipment_name}</span></div>
            <div style={DT.field}><span style={DT.lbl}>ÁREA</span>
              <span style={{ ...DT.val, color: AREA_COLORS[log.equipment_area] || '#f59e0b' }}>{log.equipment_area}</span>
            </div>
            <div style={DT.field}><span style={DT.lbl}>FECHA</span><span style={DT.val}>{fDate(log.date)}</span></div>
            <div style={DT.field}><span style={DT.lbl}>TIPO</span>
              <span style={{ ...DT.badge, background: TYPE_COLORS[log.type]+'22', border:`1px solid ${TYPE_COLORS[log.type]}66`, color: TYPE_COLORS[log.type] }}>
                {TYPE_LABELS[log.type] || log.type}
              </span>
            </div>
            <div style={DT.field}><span style={DT.lbl}>TÉCNICO</span><span style={DT.val}>{log.technician || '—'}</span></div>
            <div style={DT.field}><span style={DT.lbl}>PRÓXIMO MTTO</span><span style={DT.val}>{fDate(log.next_maintenance)}</span></div>
          </div>
          <div style={DT.descWrap}>
            <div style={DT.lbl}>DESCRIPCIÓN</div>
            <div style={DT.desc}>{log.description || '—'}</div>
          </div>
        </div>
        <div style={M.footer}>
          <button style={{ ...M.deleteBtn, background:'rgba(96,165,250,0.08)', borderColor:'rgba(96,165,250,0.4)', color:'#60a5fa' }}
            onClick={() => onExportPDF(log.id)} disabled={exporting}>
            {exporting ? '◌ Generando...' : '↓ EXPORTAR PDF'}
          </button>
          <div style={{display:'flex',gap:8}}>
            <button style={M.cancelBtn} onClick={onClose}>Cerrar</button>
            <button style={M.saveBtn} onClick={() => onEdit(log)}>✎ EDITAR</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── COMPONENTE PRINCIPAL ────────────────────────────────────────────────────
export default function Reportes() {
  const [stats, setStats] = useState(null);
  const [equipment, setEquipment] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  const [filterArea, setFilterArea] = useState('');
  const [filterType, setFilterType] = useState('');
  const [search, setSearch] = useState('');

  const [detailLog, setDetailLog] = useState(null);
  const [editLog, setEditLog] = useState(null);
  const [exporting, setExporting] = useState(null);

  const fetchLogs = useCallback(async () => {
    setLoadingLogs(true);
    try { const r = await API.get('/maintenance/all'); setLogs(r.data); }
    catch {}
    setLoadingLogs(false);
  }, []);

  useEffect(() => {
    API.get('/stats').then(r => setStats(r.data)).catch(() => {});
    API.get('/equipment').then(r => setEquipment(r.data)).catch(() => {});
    fetchLogs();
  }, [fetchLogs]);

  const handleSave = async (id, form) => {
    await API.put(`/maintenance/${id}`, form);
    setEditLog(null);
    setDetailLog(null);
    fetchLogs();
  };

  const handleDelete = async (id) => {
    await API.delete(`/maintenance/${id}`);
    setEditLog(null);
    setDetailLog(null);
    fetchLogs();
  };

  const handleExportPDF = async (id) => {
    setExporting(id);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/maintenance/${id}/pdf`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Error al generar PDF');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mantenimiento_REG${String(id).padStart(4,'0')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) { alert('Error al exportar PDF'); }
    setExporting(null);
  };

  // Filtros
  const filteredLogs = logs.filter(l => {
    if (filterArea && l.equipment_area !== filterArea) return false;
    if (filterType && l.type !== filterType) return false;
    if (search) {
      const q = search.toLowerCase();
      return (l.equipment_name||'').toLowerCase().includes(q) ||
             (l.description||'').toLowerCase().includes(q) ||
             (l.technician||'').toLowerCase().includes(q);
    }
    return true;
  });

  const barData = (stats?.by_area || []).map(a => ({
    name: a.area.slice(0,5), total: a.count,
    op: equipment.filter(e => e.area === a.area && e.status === 'operational').length,
  }));

  const pieData = [
    { name:'Operativo', value: stats?.operational || 0 },
    { name:'Mantenimiento', value: stats?.maintenance || 0 },
    { name:'Crítico', value: stats?.critical || 0 },
  ].filter(d => d.value > 0);

  const areas = [...new Set(logs.map(l => l.equipment_area))];

  return (
    <div style={s.wrap}>
      {/* Modales */}
      {detailLog && !editLog && (
        <MaintenanceDetail log={detailLog} onClose={() => setDetailLog(null)}
          onEdit={log => { setEditLog(log); }}
          onExportPDF={handleExportPDF} exporting={exporting === detailLog.id} />
      )}
      {editLog && (
        <MaintenanceModal log={editLog} onClose={() => setEditLog(null)}
          onSave={handleSave} onDelete={handleDelete} />
      )}

      {/* Encabezado */}
      <div style={s.header}>
        <div>
          <h1 style={s.title}>REPORTES Y ANÁLISIS</h1>
          <p style={s.subtitle}>Vista estadística — IMVET S.R.L.</p>
        </div>
        <div style={s.statChips}>
          {[
            { lbl:'Total', val: stats?.total || 0, c:'#f59e0b' },
            { lbl:'Operativo', val: stats?.operational || 0, c:'#22c55e' },
            { lbl:'Mantto', val: stats?.maintenance || 0, c:'#fb923c' },
            { lbl:'Registros', val: logs.length, c:'#60a5fa' },
          ].map(chip => (
            <div key={chip.lbl} style={{ ...s.chip, borderColor: chip.c+'44' }}>
              <span style={{ fontFamily:'Orbitron', fontSize:20, fontWeight:900, color:chip.c }}>{chip.val}</span>
              <span style={{ fontFamily:'Share Tech Mono', fontSize:9, color:'#78350f', letterSpacing:2 }}>{chip.lbl.toUpperCase()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Gráficas */}
      <div style={s.grid}>
        <div style={s.card}>
          <div style={s.cardTitle}>◈ EQUIPOS POR ÁREA</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} barGap={4}>
              <XAxis dataKey="name" tick={{ fill:'#d97706', fontSize:10, fontFamily:'Share Tech Mono' }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fill:'#78350f', fontSize:10 }} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{ background:'#1a0e00', border:'1px solid rgba(245,158,11,0.3)', borderRadius:8, color:'#f59e0b', fontFamily:'Share Tech Mono', fontSize:11 }}/>
              <Bar dataKey="total" fill="#f59e0b33" stroke="#f59e0b" strokeWidth={1} radius={[4,4,0,0]} name="Total"/>
              <Bar dataKey="op" fill="#22c55e33" stroke="#22c55e" strokeWidth={1} radius={[4,4,0,0]} name="Operativo"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={s.card}>
          <div style={s.cardTitle}>◈ DISTRIBUCIÓN DE ESTADO</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={82} paddingAngle={4} dataKey="value">
                {pieData.map((_,i) => <Cell key={i} fill={[COLORS[0],'#fb923c','#ef4444'][i]} stroke="none"/>)}
              </Pie>
              <Legend iconType="circle" wrapperStyle={{ fontFamily:'Share Tech Mono', fontSize:10, color:'#d97706' }}/>
              <Tooltip contentStyle={{ background:'#1a0e00', border:'1px solid rgba(245,158,11,0.3)', borderRadius:8, color:'#f59e0b', fontFamily:'Share Tech Mono', fontSize:11 }}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── HISTORIAL DE MANTENIMIENTOS ──────────────────────────────────── */}
      <div style={s.sectionHeader}>
        <div style={s.sectionTitle}>◈ HISTORIAL DE MANTENIMIENTOS</div>
        <div style={s.filterRow}>
          {/* Búsqueda */}
          <input style={s.searchInput} value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍  Buscar equipo, técnico..." />
          {/* Filtro área */}
          <select style={s.select} value={filterArea} onChange={e => setFilterArea(e.target.value)}>
            <option value="">Todas las áreas</option>
            {areas.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          {/* Filtro tipo */}
          <select style={s.select} value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="">Todos los tipos</option>
            <option value="preventivo">Preventivo</option>
            <option value="correctivo">Correctivo</option>
            <option value="predictivo">Predictivo</option>
          </select>
        </div>
      </div>

      <div style={s.tableCard}>
        {loadingLogs ? (
          <div style={s.emptyState}>
            <div style={s.shimmer}/>
            <div style={s.shimmer}/>
            <div style={s.shimmer}/>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div style={s.emptyState}>
            <div style={{ fontSize:40, marginBottom:12 }}>⚙</div>
            <div style={{ fontFamily:'Orbitron', fontSize:13, color:'#78350f', letterSpacing:3 }}>SIN REGISTROS</div>
            <div style={{ fontFamily:'Share Tech Mono', fontSize:11, color:'#3d1c00', marginTop:6 }}>
              No hay mantenimientos{filterArea||filterType||search ? ' con los filtros aplicados' : ' registrados aún'}
            </div>
          </div>
        ) : (
          <table style={s.table}>
            <thead>
              <tr>
                {['REG', 'FECHA', 'EQUIPO', 'ÁREA', 'TIPO', 'TÉCNICO', 'PRÓX. MTTO', 'ACCIONES'].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log, i) => (
                <tr key={log.id} style={{ ...s.tr, background: i%2===0?'transparent':'rgba(245,158,11,0.015)' }}
                  className="log-row">
                  <td style={{ ...s.td, fontFamily:'Orbitron', fontSize:10, color:'#d97706' }}>
                    REG-{String(log.id).padStart(4,'0')}
                  </td>
                  <td style={{ ...s.td, fontFamily:'Share Tech Mono', fontSize:11 }}>{fDate(log.date)}</td>
                  <td style={{ ...s.td, fontWeight:600, color:'#fef3c7' }}>{log.equipment_name}</td>
                  <td style={{ ...s.td }}>
                    <span style={{ color: AREA_COLORS[log.equipment_area] || '#f59e0b', fontFamily:'Share Tech Mono', fontSize:10 }}>
                      {log.equipment_area}
                    </span>
                  </td>
                  <td style={s.td}>
                    <span style={{
                      padding:'2px 8px', borderRadius:4,
                      background: (TYPE_COLORS[log.type]||'#f59e0b')+'18',
                      border:`1px solid ${(TYPE_COLORS[log.type]||'#f59e0b')}44`,
                      color: TYPE_COLORS[log.type]||'#f59e0b',
                      fontFamily:'Share Tech Mono', fontSize:9, letterSpacing:1,
                    }}>
                      {TYPE_LABELS[log.type] || log.type || '—'}
                    </span>
                  </td>
                  <td style={{ ...s.td, color:'#a07030' }}>{log.technician || '—'}</td>
                  <td style={{ ...s.td, fontFamily:'Share Tech Mono', fontSize:10, color: log.next_maintenance ? '#fbbf24' : '#3d1c00' }}>
                    {fDate(log.next_maintenance)}
                  </td>
                  <td style={{ ...s.td, whiteSpace:'nowrap' }}>
                    <button style={s.actionBtn} onClick={() => setDetailLog(log)} title="Ver detalle">
                      ◉ VER
                    </button>
                    <button style={{ ...s.actionBtn, ...s.actionBtnBlue }}
                      onClick={e => { e.stopPropagation(); handleExportPDF(log.id); }}
                      title="Exportar PDF"
                      disabled={exporting === log.id}>
                      {exporting === log.id ? '◌' : '↓ PDF'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {filteredLogs.length > 0 && (
          <div style={s.tableFooter}>
            <span style={{ fontFamily:'Share Tech Mono', fontSize:10, color:'#78350f' }}>
              {filteredLogs.length} registro{filteredLogs.length!==1?'s':''} {filterArea||filterType||search?'(filtrado)':''}
            </span>
          </div>
        )}
      </div>

      {/* Inventario completo */}
      <div style={s.tableCard}>
        <div style={s.cardTitle}>◈ INVENTARIO COMPLETO</div>
        <table style={s.table}>
          <thead>
            <tr>{['ÁREA','N°','EQUIPO','ESTADO','NOTAS'].map(h=><th key={h} style={s.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {equipment.map((e,i) => (
              <tr key={e.id} style={{ ...s.tr, background: i%2===0?'transparent':'rgba(245,158,11,0.015)' }}>
                <td style={{ ...s.td, color: AREA_COLORS[e.area]||'#f59e0b', fontFamily:'Share Tech Mono', fontSize:10 }}>{e.area}</td>
                <td style={{ ...s.td, fontFamily:'Orbitron', fontSize:11 }}>{e.number}</td>
                <td style={s.td}>{e.name}</td>
                <td style={s.td}>
                  <span style={{ fontFamily:'Share Tech Mono', fontSize:9, color: e.status==='operational'?'#22c55e':'#fb923c', letterSpacing:1 }}>
                    ● {e.status==='operational'?'OPERATIVO':'MANTENIMIENTO'}
                  </span>
                </td>
                <td style={{ ...s.td, color:'#78350f', fontSize:12 }}>{e.notes||'—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style>{`
        @keyframes shimmerAnim{0%{background-position:-400px 0}100%{background-position:400px 0}}
        @keyframes logRowIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
.log-row{animation:logRowIn 0.3s ease both;}
.log-row:hover td{background:rgba(245,158,11,0.04)!important;}
        .modal-panel{animation:modalIn 0.35s cubic-bezier(0.16,1,0.3,1) forwards;}
        @keyframes modalIn{from{opacity:0;transform:scale(0.92) translateY(20px)}to{opacity:1;transform:scale(1) translateY(0)}}
      `}</style>
    </div>
  );
}

// ── Estilos ─────────────────────────────────────────────────────────────────
const s = {
  wrap:{ display:'flex', flexDirection:'column', gap:20 },
  header:{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', paddingBottom:16, borderBottom:'1px solid rgba(245,158,11,0.12)' },
  title:{ fontFamily:'Orbitron', fontSize:20, fontWeight:800, color:'#f59e0b', letterSpacing:4, margin:0 },
  subtitle:{ fontFamily:'Share Tech Mono', fontSize:11, color:'#78350f', letterSpacing:2, marginTop:4 },
  statChips:{ display:'flex', gap:10 },
  chip:{ display:'flex', flexDirection:'column', alignItems:'center', padding:'8px 16px', background:'rgba(245,158,11,0.04)', border:'1px solid', borderRadius:10, minWidth:70 },
  grid:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 },
  card:{ background:'rgba(20,10,0,0.9)', border:'1px solid rgba(245,158,11,0.12)', borderRadius:12, padding:'18px 20px' },
  cardTitle:{ fontFamily:'Orbitron', fontSize:10, color:'#d97706', letterSpacing:3, marginBottom:16 },
  sectionHeader:{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10 },
  sectionTitle:{ fontFamily:'Orbitron', fontSize:12, color:'#f59e0b', letterSpacing:3 },
  filterRow:{ display:'flex', gap:8, flexWrap:'wrap' },
  searchInput:{ background:'rgba(245,158,11,0.04)', border:'1px solid rgba(245,158,11,0.18)', borderRadius:7, padding:'7px 12px', color:'#fef3c7', fontFamily:'Share Tech Mono', fontSize:11, outline:'none', width:220 },
  select:{ background:'rgba(20,10,0,0.95)', border:'1px solid rgba(245,158,11,0.18)', borderRadius:7, padding:'7px 10px', color:'#d97706', fontFamily:'Share Tech Mono', fontSize:10, outline:'none', cursor:'pointer' },
  tableCard:{ background:'rgba(20,10,0,0.9)', border:'1px solid rgba(245,158,11,0.12)', borderRadius:12, padding:'18px 22px', overflowX:'auto' },
  table:{ width:'100%', borderCollapse:'collapse', minWidth:600 },
  th:{ fontFamily:'Orbitron', fontSize:9, color:'#78350f', letterSpacing:3, padding:'8px 10px', textAlign:'left', borderBottom:'1px solid rgba(245,158,11,0.1)' },
  tr:{ borderBottom:'1px solid rgba(245,158,11,0.04)', transition:'background 0.15s' },
  td:{ fontFamily:'Rajdhani', fontSize:13, color:'#d4a050', padding:'9px 10px' },
  actionBtn:{ padding:'4px 10px', background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.25)', borderRadius:5, color:'#f59e0b', fontFamily:'Orbitron', fontSize:8, letterSpacing:1, cursor:'pointer', marginRight:4, transition:'all 0.2s' },
  actionBtnBlue:{ background:'rgba(96,165,250,0.08)', borderColor:'rgba(96,165,250,0.25)', color:'#60a5fa' },
  emptyState:{ display:'flex', flexDirection:'column', alignItems:'center', padding:'48px 0', color:'#3d1c00' },
  shimmer:{ height:40, borderRadius:6, background:'linear-gradient(90deg,rgba(245,158,11,0.04) 25%,rgba(245,158,11,0.08) 50%,rgba(245,158,11,0.04) 75%)', backgroundSize:'400px 100%', animation:'shimmerAnim 1.4s infinite', marginBottom:8, width:'100%' },
  tableFooter:{ marginTop:12, paddingTop:10, borderTop:'1px solid rgba(245,158,11,0.06)', textAlign:'right' },
};

// Estilos del modal
const M = {
  overlay:{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(4px)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 },
  panel:{ background:'linear-gradient(160deg,#1a0e00 0%,#140a00 100%)', border:'1px solid rgba(245,158,11,0.25)', borderRadius:14, width:'100%', maxWidth:540, boxShadow:'0 30px 80px rgba(0,0,0,0.8)' },
  header:{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'18px 22px', borderBottom:'1px solid rgba(245,158,11,0.1)' },
  modalTitle:{ fontFamily:'Orbitron', fontSize:12, color:'#f59e0b', letterSpacing:3 },
  modalSub:{ fontFamily:'Share Tech Mono', fontSize:10, color:'#78350f', marginTop:4 },
  closeBtn:{ background:'transparent', border:'none', color:'#78350f', cursor:'pointer', fontSize:18, padding:4, lineHeight:1 },
  body:{ padding:'18px 22px', display:'flex', flexDirection:'column', gap:14 },
  footer:{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 22px', borderTop:'1px solid rgba(245,158,11,0.1)' },
  fieldGroup:{ display:'flex', flexDirection:'column', gap:6 },
  label:{ fontFamily:'Orbitron', fontSize:9, color:'#d97706', letterSpacing:3 },
  input:{ background:'rgba(245,158,11,0.04)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:7, padding:'10px 12px', color:'#fef3c7', fontFamily:'Share Tech Mono', fontSize:12, outline:'none' },
  textarea:{ background:'rgba(245,158,11,0.04)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:7, padding:'10px 12px', color:'#fef3c7', fontFamily:'Share Tech Mono', fontSize:12, outline:'none', resize:'vertical' },
  typeRow:{ display:'flex', gap:8 },
  typeBtn:{ flex:1, padding:'8px', background:'rgba(245,158,11,0.04)', border:'1px solid rgba(245,158,11,0.15)', borderRadius:7, color:'#78350f', fontFamily:'Orbitron', fontSize:9, letterSpacing:2, cursor:'pointer', transition:'all 0.2s' },
  saveBtn:{ padding:'9px 20px', background:'rgba(245,158,11,0.15)', border:'1px solid rgba(245,158,11,0.5)', borderRadius:7, color:'#f59e0b', fontFamily:'Orbitron', fontSize:10, letterSpacing:2, cursor:'pointer' },
  cancelBtn:{ padding:'9px 16px', background:'transparent', border:'1px solid rgba(245,158,11,0.1)', borderRadius:7, color:'#78350f', fontFamily:'Orbitron', fontSize:10, letterSpacing:2, cursor:'pointer' },
  deleteBtn:{ padding:'9px 14px', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:7, color:'#ef4444', fontFamily:'Orbitron', fontSize:9, letterSpacing:1, cursor:'pointer' },
  confirmDelBtn:{ padding:'9px 14px', background:'rgba(239,68,68,0.2)', border:'1px solid rgba(239,68,68,0.6)', borderRadius:7, color:'#ef4444', fontFamily:'Orbitron', fontSize:9, cursor:'pointer' },
  cancelDelBtn:{ padding:'9px 14px', background:'transparent', border:'1px solid rgba(245,158,11,0.2)', borderRadius:7, color:'#78350f', fontFamily:'Orbitron', fontSize:9, cursor:'pointer' },
};

const DT = {
  grid:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 },
  field:{ display:'flex', flexDirection:'column', gap:4, padding:'10px 12px', background:'rgba(245,158,11,0.03)', borderRadius:7, border:'1px solid rgba(245,158,11,0.08)' },
  lbl:{ fontFamily:'Orbitron', fontSize:8, color:'#78350f', letterSpacing:3 },
  val:{ fontFamily:'Share Tech Mono', fontSize:12, color:'#fef3c7' },
  badge:{ display:'inline-block', padding:'2px 10px', borderRadius:5, fontFamily:'Share Tech Mono', fontSize:10, letterSpacing:1 },
  descWrap:{ padding:'12px 14px', background:'rgba(245,158,11,0.03)', borderRadius:7, border:'1px solid rgba(245,158,11,0.08)', display:'flex', flexDirection:'column', gap:6, marginTop:4 },
  desc:{ fontFamily:'Share Tech Mono', fontSize:12, color:'#fef3c7', lineHeight:1.6, whiteSpace:'pre-wrap' },
};