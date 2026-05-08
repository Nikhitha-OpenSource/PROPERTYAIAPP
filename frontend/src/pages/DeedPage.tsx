import { useState } from 'react';
import { deedApi } from '../utils/api';
import { Upload, CheckCircle, Clock, AlertCircle, FileText } from 'lucide-react';

const STAGES = ['UPLOAD','OCR_EXTRACTION','NAME_VERIFY','LEGAL_CHECK','APPROVED'];

export default function DeedPage() {
  const [parcelId, setParcelId] = useState('');
  const [declaredName, setDeclaredName] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<any>(null);
  const [timeline, setTimeline] = useState<Record<string, unknown> | null>(null);
  const [stampState, setStampState] = useState('Telangana');
  const [stampValue, setStampValue] = useState(5000000);
  const [stampResult, setStampResult] = useState<Record<string, unknown> | null>(null);
  const [reraNo, setReraNo] = useState('');
  const [reraResult, setReraResult] = useState<Record<string, unknown> | null>(null);
  const [reraLoading, setReraLoading] = useState(false);
  const [reraError, setReraError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [tab, setTab] = useState<'upload'|'status'|'stamp'|'rera'>('upload');

  const checkStatus = async () => {
    if (!parcelId) return;
    try {
      const { data } = await deedApi.status(parcelId);
      setStatus(data);
      const tl = await deedApi.timeline(parcelId);
      setTimeline(tl.data);
    } catch { alert('Parcel not found. Make sure it exists in the system.'); }
  };

  const calcStamp = async () => {
    const { data } = await deedApi.stampDuty(stampState, stampValue);
    setStampResult(data);
  };

  const checkRera = async () => {
    if (!reraNo) return;
    setReraLoading(true);
    setReraError('');
    setReraResult(null);
    try {
      const { data } = await deedApi.rera(reraNo);
      setReraResult(data);
    } catch (error: any) {
      setReraError(error.response?.data?.detail || error.message || 'RERA verification failed');
    } finally {
      setReraLoading(false);
    }
  };

  const currentStageIdx = status ? STAGES.indexOf(String(status.stage)) : -1;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px 60px' }}>
      <div style={{ marginBottom: 32 }}>
        <h1>📄 Land Deed & Legal Workflow</h1>
        <p>Upload documents, track verification status, calculate stamp duty, and check RERA registration.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 32, borderBottom: '2px solid var(--borderGray)' }}>
        {[
          { key: 'upload', label: '📤 Upload Documents' },
          { key: 'status', label: '🔍 Check Status' },
          { key: 'stamp',  label: '🏛️ Stamp Duty' },
          { key: 'rera',   label: '📋 RERA Check' },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key as typeof tab)}
            className={`btn btn-sm ${tab===key?'btn-primary':'btn-secondary'}`}
            style={{ borderRadius: '8px 8px 0 0', borderBottom: 'none', marginBottom: -2 }}>
            {label}
          </button>
        ))}
      </div>

      {/* Upload Tab */}
      {tab === 'upload' && (
        <div className="card" style={{ padding: 32 }}>
          <h3 style={{ marginBottom: 24 }}>Upload Deed Documents</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--gray)', display: 'block', marginBottom: 6 }}>LAND PARCEL ID</label>
              <input id="deed-parcel-id" className="input" placeholder="Enter parcel ID (UUID)" value={parcelId} onChange={(e) => setParcelId(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--gray)', display: 'block', marginBottom: 6 }}>OWNER NAME (as on deed)</label>
              <input id="deed-owner-name" className="input" placeholder="Full name as it appears on the deed" value={declaredName} onChange={(e) => setDeclaredName(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--gray)', display: 'block', marginBottom: 6 }}>DOCUMENTS TO UPLOAD</label>
              <div style={{ border: '2px dashed var(--borderGray)', borderRadius: 12, padding: 24, textAlign: 'center', cursor: 'pointer',
                background: files.length > 0 ? 'var(--lightBg2)' : 'var(--lightGray)',
                transition: 'all 0.2s' }}>
                <input id="deed-file-input" type="file" multiple accept=".pdf,.jpg,.jpeg,.png"
                  style={{ display: 'none' }}
                  onChange={(e) => setFiles(Array.from(e.target.files || []))}
                />
                <label htmlFor="deed-file-input" style={{ cursor: 'pointer' }}>
                  <Upload size={32} style={{ color: 'var(--accent)', margin: '0 auto 12px' }} />
                  <div style={{ fontWeight: 600, color: 'var(--primary)', marginBottom: 4 }}>
                    {files.length > 0 ? `${files.length} file(s) selected` : 'Click to upload documents'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--gray)' }}>
                    Sale Deed, Encumbrance Certificate, Patta, Aadhar (PDF/JPG/PNG)
                  </div>
                </label>
              </div>
              {files.length > 0 && (
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {files.map((f) => (
                    <div key={f.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: 'var(--gray)' }}>
                      <FileText size={14} style={{ color: 'var(--accent2)' }} /> {f.name} ({(f.size/1024).toFixed(0)} KB)
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ background: 'var(--lightBg4)', borderRadius: 10, padding: 16, fontSize: '0.85rem' }}>
              <strong style={{ color: 'var(--accent4)' }}>ℹ️ What happens next:</strong>
              <ol style={{ marginTop: 8, paddingLeft: 20, color: 'var(--gray)', lineHeight: 2 }}>
                <li>Documents uploaded to Azure Blob Storage (encrypted)</li>
                <li>Azure Document Intelligence OCR extracts owner name & survey number</li>
                <li>AI fuzzy-matches extracted name with your declared name</li>
                <li>Legal check and timeline estimation</li>
              </ol>
            </div>
            <button id="deed-upload-btn" className="btn btn-primary btn-lg" disabled={uploading || !parcelId || !declaredName || files.length === 0}
              onClick={async () => {
                if (!parcelId || !declaredName || files.length === 0) return;

                setUploading(true);
                try {
                  const { data } = await deedApi.upload(parcelId, declaredName, files);
                  alert(`✅ Documents uploaded successfully!\n\nUpload ID: ${data.upload_id}\nFiles: ${data.files_count}\n\nCheck the Status tab to track verification progress.`);
                  setTab('status');
                  // Clear form after successful upload
                  setFiles([]);
                } catch (error: any) {
                  console.error('Upload failed:', error);
                  alert(`❌ Upload failed: ${error.response?.data?.message || error.message || 'Unknown error'}`);
                } finally {
                  setUploading(false);
                }
              }}>
              {uploading ? '⏳ Uploading...' : '🚀 Submit Documents'}
            </button>
          </div>
        </div>
      )}

      {/* Status Tab */}
      {tab === 'status' && (
        <div>
          <div className="card" style={{ padding: 24, marginBottom: 24 }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <input id="deed-status-parcel" className="input" placeholder="Enter Parcel ID" value={parcelId}
                onChange={(e) => setParcelId(e.target.value)} />
              <button className="btn btn-primary" onClick={checkStatus}>Check Status</button>
            </div>
          </div>

          {status && (
            <div className="card" style={{ padding: 28 }}>
              <h3 style={{ marginBottom: 24 }}>Verification Progress</h3>
              {/* Stage Tracker */}
              <div className="deed-stages">
                {STAGES.map((stage, i) => (
                  <div key={stage} className={`deed-stage ${i < currentStageIdx ? 'done' : i === currentStageIdx ? 'active' : ''}`}>
                    <div className="deed-stage-dot">
                      {i < currentStageIdx ? <CheckCircle size={16} /> : i === currentStageIdx ? <Clock size={16} /> : i + 1}
                    </div>
                    <div className="deed-stage-label">{stage.replace('_',' ')}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 28, display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
                <div style={{ padding: 16, background: 'var(--lightBg)', borderRadius: 10 }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray)', marginBottom: 4 }}>DECLARED NAME</div>
                  <div style={{ fontWeight: 700 }}>{String((status as any).declared_name || '—')}</div>
                </div>
                <div
                  style={{
                    padding: 16,
                    background:
                      (status as any).name_match_score && Number((status as any).name_match_score) >= 0.85
                        ? 'var(--lightBg2)'
                        : 'var(--lightBg)',
                    borderRadius: 10,
                  }}
                >
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray)', marginBottom: 4 }}>EXTRACTED NAME (OCR)</div>
                  <div style={{ fontWeight: 700 }}>{String((status as any).extracted_name || 'Pending OCR...')}</div>
                  {(status as any).name_match_score && (
                    <div
                      style={{
                        marginTop: 4,
                        fontSize: '0.8rem',
                        color: Number((status as any).name_match_score) >= 0.85 ? 'var(--accent2)' : 'var(--danger)',
                        fontWeight: 600,
                      }}
                    >
                      Match: {(Number((status as any).name_match_score) * 100).toFixed(0)}%
                    </div>
                  )}
                </div>
              </div>

              {status.notes && (
                <div style={{ marginTop: 16, padding: 14, background: 'var(--lightBg4)', borderRadius: 10, fontSize: '0.875rem' }}>
                  📝 {String(status.notes)}
                </div>
              )}

              {timeline && (
                <div style={{ marginTop: 20, padding: 20, background: 'linear-gradient(135deg, var(--lightBg3), var(--lightBg))', borderRadius: 12 }}>
                  <h4 style={{ marginBottom: 12 }}>⏱️ Legal Timeline Estimate</h4>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 800, color: 'var(--primary)' }}>
                    ~{String(timeline.estimated_days)} days
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
                    <span className="badge badge-green">P(&lt;30d): {Math.round(Number(timeline.probability_lt_30)*100)}%</span>
                    <span className="badge badge-blue">P(30-60d): {Math.round(Number(timeline.probability_30_60)*100)}%</span>
                    <span className="badge badge-danger">P(&gt;60d): {Math.round(Number(timeline.probability_gt_60)*100)}%</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Stamp Duty Tab */}
      {tab === 'stamp' && (
        <div className="card" style={{ padding: 32 }}>
          <h3 style={{ marginBottom: 24 }}>🏛️ e-Stamp Duty Calculator</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 500 }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--gray)', display: 'block', marginBottom: 6 }}>STATE</label>
              <select id="stamp-state" className="input select" value={stampState} onChange={(e) => setStampState(e.target.value)}>
                {['Telangana','Maharashtra','Karnataka','Tamil Nadu'].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--gray)', display: 'block', marginBottom: 6 }}>PROPERTY VALUE (₹)</label>
              <input id="stamp-value" className="input" type="number" value={stampValue} onChange={(e) => setStampValue(Number(e.target.value))} />
              <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                {[[50,'5000000'],[80,'8000000'],['1Cr','10000000'],['2Cr','20000000']].map(([l,v]) => (
                  <button key={String(l)} className="badge badge-blue" style={{ cursor: 'pointer', border: '1px solid var(--accent)' }}
                    onClick={() => setStampValue(Number(v))}>₹{l}L</button>
                ))}
              </div>
            </div>
            <button id="calc-stamp" className="btn btn-primary" onClick={calcStamp}>Calculate Stamp Duty</button>
          </div>

          {stampResult && (
            <div style={{ marginTop: 32, display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
              {[
                ['Stamp Duty', stampResult.stamp_duty, 'var(--accent)'],
                ['Registration Fee', stampResult.registration_fee, 'var(--accent2)'],
                ['Transfer Duty', stampResult.transfer_duty, 'var(--accent4)'],
                ['Total Charges', stampResult.total_charges, 'var(--primary)'],
              ].map(([label, value, color]) => (
                <div key={String(label)} className="card kpi-card" style={{ borderLeftColor: String(color) }}>
                  <div className="kpi-value" style={{ fontSize: '1.5rem', color: String(color) }}>₹{Number(value).toLocaleString('en-IN')}</div>
                  <div className="kpi-label">{String(label)}</div>
                </div>
              ))}
              <div style={{ gridColumn: '1/-1', padding: 12, background: 'var(--lightBg4)', borderRadius: 10, fontSize: '0.875rem', color: 'var(--gray)' }}>
                Effective rate: <strong>{String(stampResult.effective_rate_pct)}%</strong> of property value in {stampState}
              </div>
            </div>
          )}
        </div>
      )}

      {/* RERA Tab */}
      {tab === 'rera' && (
        <div className="card" style={{ padding: 32 }}>
          <h3 style={{ marginBottom: 24 }}>📋 RERA Registration Check</h3>
          <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
            <input id="rera-number-input" className="input" placeholder="Enter RERA Registration Number" value={reraNo} onChange={(e) => setReraNo(e.target.value)} />
            <button id="check-rera" className="btn btn-primary" onClick={checkRera} disabled={reraLoading || !reraNo.trim()}>
              {reraLoading ? 'Checking...' : 'Check'}
            </button>
          </div>
          <div style={{ background: 'var(--lightBg4)', borderRadius: 10, padding: 14, fontSize: '0.85rem', marginBottom: 24 }}>
            ℹ️ Verify RERA registration at <a href="https://rera.telangana.gov.in" target="_blank" style={{ color: 'var(--accent)' }}>rera.telangana.gov.in</a>.
            Use the official registered-projects search for final verification.
          </div>
          {reraError && (
            <div style={{ color: 'var(--danger)', background: '#FDEDEC', padding: '10px 14px', borderRadius: 8, marginBottom: 16 }}>
              {reraError}
            </div>
          )}

          {reraResult && (
            <div className="card" style={{ padding: 24, borderLeft: `4px solid ${reraResult.is_registered === true ? 'var(--accent2)' : 'var(--accent4)'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                {reraResult.is_registered === true ? <CheckCircle size={24} color="var(--accent2)" /> : <AlertCircle size={24} color="var(--accent4)" />}
                <h3 style={{ margin: 0, color: reraResult.is_registered === true ? 'var(--accent2)' : 'var(--accent4)' }}>{String(reraResult.status).split('_').join(' ')}</h3>
              </div>
              {[
                ['RERA Number', reraResult.rera_number],
                ['Source', reraResult.source],
                ['Project Name', reraResult.project_name],
                ['Promoter', reraResult.promoter],
                ['Completion Date', reraResult.completion_date],
                ['Registered Date', reraResult.registered_date],
                ['Checked At', reraResult.checked_at],
              ].map(([label, value]) => (
                value ? <div key={String(label)} style={{ display: 'flex', gap: 16, padding: '10px 0', borderBottom: '1px solid var(--lightGray)' }}>
                  <div style={{ width: 160, fontSize: '0.8rem', color: 'var(--gray)', fontWeight: 600 }}>{String(label)}</div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{String(value)}</div>
                </div> : null
              ))}
              {Boolean(reraResult.note) && (
                <div style={{ marginTop: 16, padding: 14, background: 'var(--lightBg4)', borderRadius: 10, fontSize: '0.875rem', color: 'var(--gray)' }}>
                  {String(reraResult.note)}
                </div>
              )}
              {Boolean(reraResult.official_search_url) && (
                <a className="btn btn-primary" href={String(reraResult.official_search_url)} target="_blank" rel="noreferrer" style={{ marginTop: 16 }}>
                  Open Official TG-RERA Search
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
