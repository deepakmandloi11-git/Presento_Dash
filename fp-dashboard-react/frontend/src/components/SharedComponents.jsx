export function StatCard({ label, value, sub, color='' }) {
  return (
    <div className={`stat-card ${color}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value??'—'}</div>
      {sub&&<div className="stat-sub">{sub}</div>}
    </div>
  );
}

function initials(name){ return (name||'?').split(' ').map(w=>w[0]||'').join('').slice(0,2).toUpperCase()||'?'; }

export function LiveFeed({ rows }) {
  return (
    <div className="card" style={{padding:0,overflow:'hidden'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'11px 14px',borderBottom:'1px solid var(--border)',background:'var(--bg3)'}}>
        <div className="mono" style={{display:'flex',alignItems:'center',gap:8}}><span className="pulse-dot"/>ATTENDANCE STREAM</div>
        <span className="mono">{rows.length} event{rows.length!==1?'s':''}</span>
      </div>
      <div style={{maxHeight:340,overflowY:'auto'}}>
        {!rows.length&&<div style={{padding:40,textAlign:'center',color:'var(--muted)'}} className="mono">Waiting for fingerprint scans…</div>}
        {rows.slice(0,50).map((r,i)=>(
          <div key={r.id??i} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 14px',borderBottom:'1px solid var(--border)'}}>
            <div style={{width:32,height:32,borderRadius:8,background:'var(--bg3)',border:'1px solid var(--border2)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--mono)',fontSize:12,color:'var(--accent)',flexShrink:0}}>{initials(r.name)}</div>
            <div>
              <div style={{fontWeight:500,fontSize:13}}>{r.name||<span style={{color:'var(--muted)'}}>Unknown</span>} <span className="mono">#{r.fp_id}</span></div>
              <div style={{fontSize:11,color:'var(--muted)'}}>{r.department||'—'}</div>
            </div>
            <div style={{marginLeft:'auto',textAlign:'right'}} className="mono">
              <div>{r.time}</div><div style={{fontSize:10,marginTop:2}}>{r.date}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
