import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Search, Edit2, Trash2, Lock, Plus, CheckCircle, AlertTriangle, Download } from 'lucide-react';
import RiskHeatmap from '../components/RiskHeatmap';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { listarContexto, guardarContexto, eliminarContexto } from '../lib/contextoApi';

export default function Context() {
  const { userRole } = useAuth();
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('table');
  const [selectedItem, setSelectedItem] = useState(null);
  const [saving, setSaving] = useState(false);

  const cargarItems = () => {
    setLoadingItems(true);
    listarContexto()
      .then(setItems)
      .catch(err => { console.error(err); setItems([]); })
      .finally(() => setLoadingItems(false));
  };

  useEffect(() => {
    cargarItems();
  }, []);

  const filteredItems = items.filter(r => 
    r.riesgo.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.factorCritico.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canEdit = () => {
    return userRole === 'SGI';
  };

  const handleSave = (e) => {
    e.preventDefault();
    setSaving(true);
    guardarContexto(selectedItem)
      .then(() => {
        cargarItems();
        setViewMode('table');
      })
      .catch(err => alert('Error al guardar: ' + err.message))
      .finally(() => setSaving(false));
  };

  const handleDelete = (item) => {
    if (!window.confirm(`¿Eliminar el factor ${item.id}? Esta acción no se puede deshacer.`)) return;
    eliminarContexto(item.id)
      .then(cargarItems)
      .catch(err => alert('Error al eliminar: ' + err.message));
  };

  const getNivelBadge = (p, i) => {
    const n = p * i;
    if (n >= 15) return <span className="badge" style={{backgroundColor: '#fef2f2', color: '#ef4444'}}>🔴 {n} (Muy Alto)</span>;
    if (n >= 10) return <span className="badge" style={{backgroundColor: '#fff7ed', color: '#f97316'}}>🟠 {n} (Alto)</span>;
    if (n >= 6) return <span className="badge" style={{backgroundColor: '#fefce8', color: '#eab308'}}>🟡 {n} (Medio)</span>;
    return <span className="badge" style={{backgroundColor: '#f0fdf4', color: '#8dc63f'}}>🟢 {n} (Bajo)</span>;
  };

  const exportPDF = () => {
    const doc = new jsPDF('landscape');
    doc.setFontSize(18);
    doc.setTextColor(0, 51, 160); // Azul AUBASA
    doc.text('AUBASA - Matriz de Contexto Estratégico', 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Fecha de exportación: ${new Date().toLocaleDateString()}`, 14, 30);

    const tableColumn = ["Factor Crítico", "Contexto", "Riesgo/Oportunidad", "Proceso", "Partes Interesadas", "PxI", "Nivel", "Acción"];
    const tableRows = [];

    filteredItems.forEach(item => {
      const pxi = item.probabilidad * item.impacto;
      let nivelTexto = "Bajo";
      if (pxi >= 15) nivelTexto = "Muy Alto";
      else if (pxi >= 10) nivelTexto = "Alto";
      else if (pxi >= 6) nivelTexto = "Medio";

      const itemData = [
        item.factorCritico,
        item.contexto,
        item.riesgo,
        item.proceso,
        item.partesInteresadas,
        `${item.probabilidad}x${item.impacto}=${pxi}`,
        nivelTexto,
        item.planAccion
      ];
      tableRows.push(itemData);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [0, 51, 160], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [241, 245, 249] },
      columnStyles: {
        6: { fontStyle: 'bold' } // Nivel
      },
      didParseCell: function (data) {
        if (data.section === 'body' && data.column.index === 6) {
          if (data.cell.raw === 'Muy Alto') { data.cell.styles.textColor = [239, 68, 68]; }
          else if (data.cell.raw === 'Alto') { data.cell.styles.textColor = [249, 115, 22]; }
          else if (data.cell.raw === 'Medio') { data.cell.styles.textColor = [234, 179, 8]; }
          else { data.cell.styles.textColor = [34, 197, 94]; }
        }
      }
    });

    doc.save('AUBASA_Matriz_Contexto.pdf');
  };

  return (
    <div className="module-container">
      <div className="module-header animate-fade-in">
        <div>
          <h2>Análisis de Contexto (Estratégico)</h2>
          <p>Factores Críticos y Partes Interesadas (Cláusulas 4.1 y 4.2) - Criterio AUBASA Anexo 2.1</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={exportPDF} style={{ backgroundColor: '#fff', border: '1px solid #cbd5e1', color: '#475569' }}>
            <Download size={18} /> Exportar PDF
          </button>
          {canEdit() && (
            <button 
              className="btn btn-primary"
              onClick={() => {
                setSelectedItem({
                  factorCritico: '', contexto: 'Externo', riesgo: '', proceso: '', partesInteresadas: '',
                  probabilidad: 1, impacto: 1, planAccion: '', responsable: '', ocurrio: '', fechaOcurrencia: '', eficacia: '', respMedicion: '', fechaMedicion: '', año: new Date().getFullYear()
                });
                setViewMode('form');
              }}
            >
              <Plus size={18} /> Nuevo Factor
            </button>
          )}
        </div>
      </div>

      {!canEdit() && (
        <div className="animate-fade-in" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px 16px', borderRadius: '8px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Lock size={20} color="#64748b" />
          <p style={{ margin: 0, color: '#475569', fontSize: '14px' }}>El Análisis de Contexto es un documento estratégico de SGI. Tu rol de <strong>{userRole}</strong> tiene permisos de solo lectura.</p>
        </div>
      )}

      {viewMode === 'table' ? (
        <>
          <div className="glass table-container animate-fade-in delay-1">
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ position: 'relative', width: '350px' }}>
                <Search size={18} style={{ position: 'absolute', top: '10px', left: '12px', color: 'var(--text-secondary)' }} />
                <input 
                  type="text" 
                  placeholder="Buscar en factores críticos o riesgos..." 
                  className="form-control" 
                  style={{ paddingLeft: '36px' }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <table className="data-table">
              <thead>
                <tr>
                  <th>Factor Crítico</th>
                  <th>Contexto</th>
                  <th>Riesgo / Oportunidad</th>
                  <th>Proceso Relacionado</th>
                  <th>Partes Interesadas (ISO 4.2)</th>
                  <th style={{textAlign:'center'}}>Prob</th>
                  <th style={{textAlign:'center'}}>Imp</th>
                  <th style={{textAlign:'center'}}>Nivel</th>
                  <th>Plan de Acción</th>
                  <th>Responsable</th>
                  <th style={{textAlign:'center'}}>¿Ocurrió?</th>
                  <th>Eficacia</th>
                  <th style={{textAlign:'right'}}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map(r => (
                  <tr key={r.id}>
                    <td><span className="truncate" style={{maxWidth: '120px'}} title={r.factorCritico}><strong>{r.factorCritico}</strong></span></td>
                    <td><span className="badge" style={{backgroundColor: r.contexto === 'Interno' ? '#e0f2fe' : '#fce7f3', color: r.contexto === 'Interno' ? '#0369a1' : '#be185d'}}>{r.contexto}</span></td>
                    <td><span className="truncate" style={{maxWidth: '200px'}} title={r.riesgo}>{r.riesgo}</span></td>
                    <td>{r.proceso}</td>
                    <td><span className="truncate" style={{maxWidth: '150px'}} title={r.partesInteresadas}>{r.partesInteresadas}</span></td>
                    <td style={{textAlign:'center', fontWeight:'bold'}}>{r.probabilidad}</td>
                    <td style={{textAlign:'center', fontWeight:'bold'}}>{r.impacto}</td>
                    <td style={{textAlign:'center'}}>{getNivelBadge(r.probabilidad, r.impacto)}</td>
                    <td><span className="truncate" style={{maxWidth: '150px'}} title={r.planAccion}>{r.planAccion}</span></td>
                    <td>{r.responsable}</td>
                    <td style={{textAlign:'center'}}>
                      {r.ocurrio === 'Sí' ? <span style={{color: '#dc2626', fontWeight: 'bold'}}>Sí</span> : r.ocurrio === 'No' ? <span style={{color: '#16a34a'}}>No</span> : '-'}
                    </td>
                    <td>
                      {r.eficacia === 'Eficaz' ? <CheckCircle size={16} color="#16a34a" /> : r.eficacia ? <AlertTriangle size={16} color="#eab308" /> : '-'}
                    </td>
                    <td style={{textAlign:'right', whiteSpace: 'nowrap'}}>
                      {canEdit() ? (
                        <>
                          <button className="btn btn-icon" onClick={() => { setSelectedItem(r); setViewMode('form'); }}>
                            <Edit2 size={16} />
                          </button>
                          <button className="btn btn-icon" onClick={() => handleDelete(r)} title="Eliminar definitivamente">
                            <Trash2 size={16} color="#dc2626" />
                          </button>
                        </>
                      ) : (
                        <button className="btn btn-icon" disabled title="Solo SGI puede editar el contexto">
                          <Lock size={16} color="#94a3b8" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {!loadingItems && filteredItems.length === 0 && (
                  <tr>
                    <td colSpan="13" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                      No se encontraron factores en el contexto.
                    </td>
                  </tr>
                )}
                {loadingItems && (
                  <tr>
                    <td colSpan="13" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                      Cargando...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {/* MAPA DE CALOR ABAJO DE LA TABLA */}
          <RiskHeatmap risks={filteredItems} />
        </>
      ) : (
        <div className="glass animate-fade-in delay-1" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
            <h3 style={{ margin: 0, color: 'var(--accent-color)' }}>{selectedItem?.id ? `Editar Factor: ${selectedItem.id}` : 'Nuevo Factor de Contexto'}</h3>
          </div>
          <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            
            <div style={{ gridColumn: '1 / -1' }}>
              <h4 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '16px', color: '#64748b' }}>Identificación (15 Columnas Estándar)</h4>
            </div>

            <div>
              <label className="form-label">Factor Crítico</label>
              <input type="text" className="form-control" value={selectedItem?.factorCritico} onChange={e => setSelectedItem({...selectedItem, factorCritico: e.target.value})} required />
            </div>
            <div>
              <label className="form-label">Contexto</label>
              <select className="form-control" value={selectedItem?.contexto} onChange={e => setSelectedItem({...selectedItem, contexto: e.target.value})}>
                <option value="Interno">Interno</option>
                <option value="Externo">Externo</option>
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Riesgo / Oportunidad</label>
              <textarea className="form-control" rows="2" value={selectedItem?.riesgo} onChange={e => setSelectedItem({...selectedItem, riesgo: e.target.value})} required></textarea>
            </div>
            <div>
              <label className="form-label">Proceso Relacionado</label>
              <input type="text" className="form-control" value={selectedItem?.proceso} onChange={e => setSelectedItem({...selectedItem, proceso: e.target.value})} required placeholder="Ej: Gerencia General, Sistemas..." />
            </div>
            <div>
              <label className="form-label">Partes Interesadas (ISO 4.2)</label>
              <input type="text" className="form-control" value={selectedItem?.partesInteresadas} onChange={e => setSelectedItem({...selectedItem, partesInteresadas: e.target.value})} placeholder="Ej: Usuarios, Proveedores, Estado..." required />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <h4 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '16px', marginTop: '16px', color: '#64748b' }}>Evaluación AUBASA 5x5</h4>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <label className="form-label">Probabilidad (1 a 5)</label>
                <input type="number" min="1" max="5" className="form-control" value={selectedItem?.probabilidad} onChange={e => setSelectedItem({...selectedItem, probabilidad: Number(e.target.value)})} required />
              </div>
              <div style={{ flex: 1 }}>
                <label className="form-label">Impacto (1 a 5)</label>
                <input type="number" min="1" max="5" className="form-control" value={selectedItem?.impacto} onChange={e => setSelectedItem({...selectedItem, impacto: Number(e.target.value)})} required />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <div style={{ padding: '12px 16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', width: '100%' }}>
                <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Nivel de Riesgo (Prob x Imp)</span>
                {getNivelBadge(selectedItem?.probabilidad || 0, selectedItem?.impacto || 0)}
              </div>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Plan de Acción (Estado actual)</label>
              <textarea className="form-control" rows="2" value={selectedItem?.planAccion} onChange={e => setSelectedItem({...selectedItem, planAccion: e.target.value})}></textarea>
            </div>
            <div>
              <label className="form-label">Responsable</label>
              <input type="text" className="form-control" value={selectedItem?.responsable} onChange={e => setSelectedItem({...selectedItem, responsable: e.target.value})} />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <h4 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '16px', marginTop: '16px', color: '#64748b' }}>Cierre y Eficacia (Fin de Año)</h4>
            </div>

            <div>
              <label className="form-label">¿Ocurrió?</label>
              <select className="form-control" value={selectedItem?.ocurrio} onChange={e => setSelectedItem({...selectedItem, ocurrio: e.target.value})}>
                <option value="">Seleccionar...</option>
                <option value="Sí">Sí</option>
                <option value="No">No</option>
              </select>
            </div>
            <div>
              <label className="form-label">Fecha de Ocurrencia</label>
              <input type="date" className="form-control" value={selectedItem?.fechaOcurrencia} onChange={e => setSelectedItem({...selectedItem, fechaOcurrencia: e.target.value})} disabled={selectedItem?.ocurrio !== 'Sí'} />
            </div>
            <div>
              <label className="form-label">Eficacia de las Acciones</label>
              <select className="form-control" value={selectedItem?.eficacia} onChange={e => setSelectedItem({...selectedItem, eficacia: e.target.value})}>
                <option value="">Pendiente de medición...</option>
                <option value="Eficaz">Eficaz</option>
                <option value="No Eficaz">No Eficaz</option>
                <option value="En proceso">En proceso</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <label className="form-label">Resp. Medición</label>
                <input type="text" className="form-control" value={selectedItem?.respMedicion} onChange={e => setSelectedItem({...selectedItem, respMedicion: e.target.value})} />
              </div>
              <div style={{ flex: 1 }}>
                <label className="form-label">Fecha Medición</label>
                <input type="date" className="form-control" value={selectedItem?.fechaMedicion} onChange={e => setSelectedItem({...selectedItem, fechaMedicion: e.target.value})} />
              </div>
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setViewMode('table')}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Guardar Factor'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
