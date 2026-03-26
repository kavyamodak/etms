import { useEffect, useRef, useState } from 'react';

// ──────────────────────────────────────────────────────────
//  PREMIUM 3D-STYLE TRANSPORT ANIMATION
//  • Isometric city perspective with 3D buildings
//  • Gradient-shaded realistic bus + car models
//  • Animated GPS route with pulse
//  • Floating cards with real photos
//  • Mouse parallax (4 depth layers)
//  • Pure CSS/SVG — zero dependencies
// ──────────────────────────────────────────────────────────

export default function TransportAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      setMouse({ x, y });
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  const shift = (dx: number, dy: number) => ({
    transform: `translate(${mouse.x * dx}px, ${mouse.y * dy}px)`,
    transition: 'transform 0.18s ease-out',
  });

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', aspectRatio: '1/1', maxWidth: 560, userSelect: 'none' }}>
      <style>{`
        @keyframes bus-move   { 0%{offset-distance:0%}   100%{offset-distance:100%} }
        @keyframes car-move   { 0%{offset-distance:0%}   100%{offset-distance:100%} }
        @keyframes gps-chase  { 0%{offset-distance:20%}  100%{offset-distance:100%} }
        @keyframes dash-flow  { to { stroke-dashoffset: -36; } }
        @keyframes float-up   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes float-down { 0%,100%{transform:translateY(0)} 50%{transform:translateY(10px)} }
        @keyframes ping-out   { 0%{transform:scale(1);opacity:.7} 100%{transform:scale(2.8);opacity:0} }
        @keyframes glow-throb { 0%,100%{opacity:.12} 50%{opacity:.28} }
        @keyframes wheel-spin { from{transform-origin:50% 50%; transform:rotate(0)} to{transform:rotate(360deg)} }
        @keyframes fade-in-up { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        .card-in { animation: fade-in-up 0.7s ease forwards; }
      `}</style>

      {/* ═══════ LAYER 0 — Ambient glows ═══════ */}
      <div style={{ position: 'absolute', inset: 0, ...shift(3, 2) }}>
        <div style={{
          position: 'absolute', top: '10%', left: '15%',
          width: 280, height: 280,
          background: 'radial-gradient(circle, rgba(16,185,129,.22) 0%, transparent 70%)',
          borderRadius: '50%', animation: 'glow-throb 4s ease-in-out infinite',
        }}/>
        <div style={{
          position: 'absolute', bottom: '12%', right: '10%',
          width: 210, height: 210,
          background: 'radial-gradient(circle, rgba(20,184,166,.18) 0%, transparent 70%)',
          borderRadius: '50%', animation: 'glow-throb 5.5s ease-in-out infinite 1.5s',
        }}/>
      </div>

      {/* ═══════ LAYER 1 — Isometric city SVG ═══════ */}
      <div style={{ position: 'absolute', inset: 0, ...shift(5, 4) }}>
        <svg viewBox="0 0 560 560" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
          <defs>
            {/* ── Gradients for 3D building faces ── */}
            <linearGradient id="bld-top"   x1="0" y1="0" x2="0" y2="1"><stop stopColor="#ecfdf5"/><stop offset="1" stopColor="#d1fae5"/></linearGradient>
            <linearGradient id="bld-front" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#f0fdf4"/><stop offset="1" stopColor="#bbf7d0"/></linearGradient>
            <linearGradient id="bld-side"  x1="0" y1="0" x2="1" y2="0"><stop stopColor="#a7f3d0"/><stop offset="1" stopColor="#6ee7b7"/></linearGradient>
            <linearGradient id="bld2-top"   x1="0" y1="0" x2="0" y2="1"><stop stopColor="#fff7ed"/><stop offset="1" stopColor="#fed7aa"/></linearGradient>
            <linearGradient id="bld2-front" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#fff7ed"/><stop offset="1" stopColor="#fdba74"/></linearGradient>
            <linearGradient id="bld2-side"  x1="0" y1="0" x2="1" y2="0"><stop stopColor="#fdba74"/><stop offset="1" stopColor="#fb923c"/></linearGradient>
            {/* ── Bus gradient ── */}
            <linearGradient id="bus-body" x1="0" y1="0" x2="0" y2="1">
              <stop stopColor="#059669"/><stop offset=".6" stopColor="#047857"/><stop offset="1" stopColor="#065f46"/>
            </linearGradient>
            <linearGradient id="bus-roof" x1="0" y1="0" x2="0" y2="1">
              <stop stopColor="#34d399"/><stop offset="1" stopColor="#059669"/>
            </linearGradient>
            <linearGradient id="bus-glass" x1="0" y1="0" x2="0" y2="1">
              <stop stopColor="#ecfdf5" stopOpacity=".95"/><stop offset="1" stopColor="#a7f3d0" stopOpacity=".7"/>
            </linearGradient>
            {/* ── Car gradient ── */}
            <linearGradient id="car-body" x1="0" y1="0" x2="0" y2="1">
              <stop stopColor="#0d9488"/><stop offset="1" stopColor="#0f766e"/>
            </linearGradient>
            <linearGradient id="car-roof" x1="0" y1="0" x2="0" y2="1">
              <stop stopColor="#2dd4bf"/><stop offset="1" stopColor="#0d9488"/>
            </linearGradient>
            {/* ── Road gradient ── */}
            <linearGradient id="road-h" x1="0" y1="0" x2="1" y2="0">
              <stop stopColor="#f1f5f9"/><stop offset=".5" stopColor="#e2e8f0"/><stop offset="1" stopColor="#f1f5f9"/>
            </linearGradient>
            <linearGradient id="road-v" x1="0" y1="0" x2="0" y2="1">
              <stop stopColor="#f1f5f9"/><stop offset=".5" stopColor="#e2e8f0"/><stop offset="1" stopColor="#f1f5f9"/>
            </linearGradient>
            {/* ── Drop shadow filter ── */}
            <filter id="shadow-sm" x="-20%" y="-20%" width="140%" height="160%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#10b981" floodOpacity=".15"/>
            </filter>
            <filter id="shadow-card" x="-10%" y="-10%" width="120%" height="140%">
              <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#000" floodOpacity=".12"/>
            </filter>
            <filter id="veh-glow">
              <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="#10b981" floodOpacity=".5"/>
            </filter>

            {/* ── Route paths (used for motion) ── */}
            <path id="bus-rt" d="M55 295 L190 295 L190 205 L365 205 L365 148 L465 148"/>
            <path id="car-rt" d="M75 425 L190 425 L190 345 L310 345 L310 235 L465 235"/>
          </defs>

          {/* ══ ROADS ══ */}
          {/* Horizontals */}
          <rect x="38" y="283" width="484" height="24" rx="5" fill="url(#road-h)" stroke="#e2e8f0" strokeWidth="1"/>
          <rect x="38" y="415" width="484" height="18" rx="5" fill="url(#road-h)" stroke="#e2e8f0" strokeWidth="1"/>
          <rect x="38" y="195" width="484" height="18" rx="5" fill="url(#road-h)" stroke="#e2e8f0" strokeWidth="1"/>
          {/* Road center lines */}
          <line x1="38" y1="295" x2="522" y2="295" stroke="white" strokeWidth="1.5" strokeDasharray="18 12" opacity=".8"/>
          <line x1="38" y1="424" x2="522" y2="424" stroke="white" strokeWidth="1.5" strokeDasharray="14 10" opacity=".6"/>
          {/* Verticals */}
          <rect x="178" y="80" width="24" height="400" rx="5" fill="url(#road-v)" stroke="#e2e8f0" strokeWidth="1"/>
          <rect x="353" y="80" width="24" height="320" rx="5" fill="url(#road-v)" stroke="#e2e8f0" strokeWidth="1"/>
          <line x1="190" y1="80" x2="190" y2="480" stroke="white" strokeWidth="1.5" strokeDasharray="18 12" opacity=".8"/>
          <line x1="365" y1="80" x2="365" y2="400" stroke="white" strokeWidth="1.5" strokeDasharray="14 10" opacity=".6"/>

          {/* ══ 3D BUILDINGS (isometric-style with 3 faces) ══ */}

          {/* Building 1 — Large emerald (top-left) */}
          <g filter="url(#shadow-sm)">
            {/* Front face */}
            <rect x="55" y="130" width="115" height="152" rx="6" fill="url(#bld-front)" stroke="#bbf7d0" strokeWidth="1"/>
            {/* Top face (pseudo 3d) */}
            <rect x="55" y="130" width="115" height="18" rx="6" fill="url(#bld-top)" stroke="#a7f3d0" strokeWidth="1"/>
            {/* Side accent */}
            <rect x="165" y="132" width="10" height="150" rx="3" fill="url(#bld-side)" opacity=".6"/>
            {/* Windows — 3 columns, 4 rows */}
            {[[72,152],[99,152],[128,152],[72,178],[99,178],[128,178],[72,204],[99,204],[128,204],[72,230],[99,230],[128,230]].map(([cx,cy],i)=>(
              <rect key={i} x={cx} y={cy} width={16} height={14} rx="2"
                fill={Math.random() > 0.3 ? '#d1fae5' : '#fff'} stroke="#bbf7d0" strokeWidth=".5" opacity=".9"/>
            ))}
            {/* Rooftop details */}
            <rect x="75" y="133" width="24" height="8" rx="2" fill="#6ee7b7" opacity=".7"/>
            <rect x="107" y="133" width="24" height="8" rx="2" fill="#6ee7b7" opacity=".7"/>
          </g>

          {/* Building 2 — Orange office tower (center) */}
          <g filter="url(#shadow-sm)">
            <rect x="212" y="100" width="130" height="185" rx="6" fill="url(#bld2-front)" stroke="#fdba74" strokeWidth="1"/>
            <rect x="212" y="100" width="130" height="20" rx="6" fill="url(#bld2-top)"/>
            <rect x="337" y="102" width="10" height="183" rx="3" fill="url(#bld2-side)" opacity=".5"/>
            {[[222,124],[248,124],[275,124],[302,124],[222,148],[248,148],[275,148],[302,148],
              [222,172],[248,172],[275,172],[302,172],[222,196],[248,196],[275,196],[302,196],
              [222,220],[248,220],[275,220],[302,220]].map(([cx,cy],i)=>(
              <rect key={i} x={cx} y={cy} width={15} height={13} rx="2" fill={i%4===0?'#fed7aa':'#fff'} stroke="#fdba74" strokeWidth=".5" opacity=".85"/>
            ))}
            <rect x="225" y="103" width="28" height="9" rx="2" fill="#fb923c" opacity=".6"/>
            <rect x="261" y="103" width="28" height="9" rx="2" fill="#fb923c" opacity=".6"/>
          </g>

          {/* Building 3 — Teal HQ (top right) */}
          <g filter="url(#shadow-sm)">
            <rect x="395" y="90" width="118" height="100" rx="6" fill="#f0fdf4" stroke="#a7f3d0" strokeWidth="1.2"/>
            <rect x="395" y="90" width="118" height="18" rx="6" fill="#d1fae5"/>
            <rect x="508" y="92" width="8" height="98" rx="3" fill="#6ee7b7" opacity=".5"/>
            {[[405,112],[430,112],[455,112],[480,112],[405,132],[430,132],[455,132],[480,132],[405,152],[430,152],[455,152],[480,152]].map(([cx,cy],i)=>(
              <rect key={i} x={cx} y={cy} width={14} height={12} rx="2" fill={i%3===0?'#d1fae5':'#ecfdf5'} stroke="#a7f3d0" strokeWidth=".5" opacity=".9"/>
            ))}
          </g>

          {/* ══ ROUTE LINES ══ */}
          {/* Main bus route — glow shadow */}
          <path d="M55 295 L190 295 L190 205 L365 205 L365 148 L465 148"
            stroke="#10b981" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity=".08"/>
          {/* Dashed animated route */}
          <path d="M55 295 L190 295 L190 205 L365 205 L365 148 L465 148"
            stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"
            strokeDasharray="14 7" style={{ animation: 'dash-flow 1.1s linear infinite' }}/>
          {/* Car route */}
          <path d="M75 425 L190 425 L190 345 L310 345 L310 235 L465 235"
            stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"
            strokeDasharray="9 6" opacity=".55" style={{ animation: 'dash-flow 1.6s linear infinite' }}/>

          {/* ══ ROUTE WAYPOINT NODES ══ */}
          {[{cx:190,cy:295},{cx:190,cy:205},{cx:365,cy:205},{cx:365,cy:148}].map((n,i)=>(
            <g key={i}>
              <circle cx={n.cx} cy={n.cy} r="9" fill="white" stroke="#10b981" strokeWidth="2.5" filter="url(#shadow-sm)"/>
              <circle cx={n.cx} cy={n.cy} r="4.5" fill="#10b981"/>
              <circle cx={n.cx} cy={n.cy} r="2" fill="white"/>
            </g>
          ))}

          {/* ══ HOME ORIGIN PIN ══ */}
          <g transform="translate(30, 268)">
            <filter id="pin-glow"><feDropShadow dx="0" dy="3" stdDeviation="6" floodColor="#10b981" floodOpacity=".4"/></filter>
            <g filter="url(#pin-glow)">
              <circle cx="16" cy="16" r="16" fill="white" stroke="#10b981" strokeWidth="2.5"/>
              <circle cx="16" cy="16" r="10" fill="#ecfdf5"/>
              {/* House icon */}
              <path d="M16 8 L24 14 L24 24 L18 24 L18 19 L14 19 L14 24 L8 24 L8 14 Z" fill="#059669"/>
              <rect x="13" y="19" width="6" height="5" rx="1" fill="#047857"/>
              <path d="M9 14 L16 8 L23 14" fill="none" stroke="#059669" strokeWidth="1.5"/>
            </g>
          </g>

          {/* ══ OFFICE DESTINATION PIN ══ */}
          <g transform="translate(452, 122)">
            <g filter="url(#pin-glow)">
              <circle cx="16" cy="16" r="16" fill="white" stroke="#059669" strokeWidth="2.5"/>
              <circle cx="16" cy="16" r="10" fill="#ecfdf5"/>
              {/* Office building icon */}
              <rect x="8" y="11" width="16" height="13" rx="1.5" fill="#059669"/>
              <rect x="8" y="11" width="16" height="4" rx="1.5" fill="#047857"/>
              <rect x="11" y="15" width="3" height="3" rx=".5" fill="#d1fae5"/>
              <rect x="16" y="15" width="3" height="3" rx=".5" fill="#d1fae5"/>
              <rect x="21" y="15" width="3" height="3" rx=".5" fill="#d1fae5"/>
              <rect x="13" y="19" width="6" height="5" rx="1" fill="#6ee7b7"/>
            </g>
          </g>

          {/* ══ GPS PULSE DOT ══ */}
          <g style={{
            offsetPath: 'path("M55 295 L190 295 L190 205 L365 205 L365 148 L465 148")',
            animation: 'gps-chase 8s linear infinite',
            offsetRotate: '0deg',
          } as any}>
            <circle cx="0" cy="0" r="12" fill="#10b981" opacity=".12" style={{ animation: 'ping-out 1.2s ease-out infinite' }}/>
            <circle cx="0" cy="0" r="6"  fill="white" stroke="#10b981" strokeWidth="2.5"/>
            <circle cx="0" cy="0" r="3"  fill="#10b981"/>
          </g>

          {/* ══ REALISTIC 3D BUS ══ */}
          <g style={{
            offsetPath: 'path("M55 295 L190 295 L190 205 L365 205 L365 148 L465 148")',
            animation: 'bus-move 9s cubic-bezier(0.45,0,0.55,1) infinite',
            offsetRotate: 'auto',
          } as any} filter="url(#veh-glow)">
            <g transform="translate(-20,-13)">
              {/* Bus shadow */}
              <ellipse cx="20" cy="27" rx="18" ry="4" fill="#000" opacity=".12"/>
              {/* Bus body — gradient */}
              <rect x="0" y="4" width="40" height="20" rx="4" fill="url(#bus-body)"/>
              {/* Roof */}
              <rect x="2" y="1" width="36" height="8" rx="4" fill="url(#bus-roof)"/>
              {/* Front bumper */}
              <rect x="0" y="20" width="40" height="3" rx="1.5" fill="#065f46"/>
              {/* Windows row */}
              <rect x="4"  y="5"  width="7" height="6" rx="1.5" fill="url(#bus-glass)"/>
              <rect x="13" y="5"  width="7" height="6" rx="1.5" fill="url(#bus-glass)"/>
              <rect x="22" y="5"  width="7" height="6" rx="1.5" fill="url(#bus-glass)"/>
              <rect x="31" y="5"  width="7" height="6" rx="1.5" fill="url(#bus-glass)"/>
              {/* Window highlight */}
              <rect x="4"  y="5"  width="7" height="2" rx="1" fill="white" opacity=".5"/>
              <rect x="13" y="5"  width="7" height="2" rx="1" fill="white" opacity=".5"/>
              {/* Body stripe */}
              <rect x="0" y="14" width="40" height="2" fill="#047857" opacity=".7"/>
              {/* TRANZO label */}
              <rect x="9" y="15" width="22" height="6" rx="2" fill="#065f46" opacity=".6"/>
              <text x="20" y="20" textAnchor="middle" fontSize="4.5" fontWeight="800" fill="white" letterSpacing=".8">TRANZO</text>
              {/* Headlights */}
              <rect x="1" y="15" width="4" height="3" rx="1" fill="#fef3c7" opacity=".9"/>
              <rect x="35" y="15" width="4" height="3" rx="1" fill="#fef3c7" opacity=".9"/>
              {/* Wheels */}
              <g>
                <circle cx="7"  cy="25" r="5"  fill="#1f2937"/>
                <circle cx="7"  cy="25" r="3"  fill="#374151"/>
                <circle cx="7"  cy="25" r="1.5" fill="#6b7280"/>
              </g>
              <g>
                <circle cx="33" cy="25" r="5"  fill="#1f2937"/>
                <circle cx="33" cy="25" r="3"  fill="#374151"/>
                <circle cx="33" cy="25" r="1.5" fill="#6b7280"/>
              </g>
            </g>
          </g>

          {/* ══ REALISTIC 3D CAR ══ */}
          <g style={{
            offsetPath: 'path("M75 425 L190 425 L190 345 L310 345 L310 235 L465 235")',
            animation: 'car-move 6.5s cubic-bezier(0.45,0,0.55,1) infinite 1.2s',
            offsetRotate: 'auto',
          } as any} filter="url(#veh-glow)">
            <g transform="translate(-13,-10)">
              {/* Car shadow */}
              <ellipse cx="13" cy="21" rx="12" ry="3" fill="#000" opacity=".12"/>
              {/* Car body */}
              <rect x="0" y="8" width="26" height="12" rx="3.5" fill="url(#car-body)"/>
              {/* Windshield + roof */}
              <path d="M4 8 Q5 2 10 2 L16 2 Q21 2 22 8 Z" fill="url(#car-roof)"/>
              {/* Windshield glass */}
              <path d="M6 8 Q7 3.5 10 3.5 L16 3.5 Q19 3.5 20 8 Z" fill="#ccfbf1" opacity=".85"/>
              {/* Side windows */}
              <rect x="5"  y="4" width="5" height="4" rx="1" fill="#ccfbf1" opacity=".8"/>
              <rect x="16" y="4" width="5" height="4" rx="1" fill="#ccfbf1" opacity=".8"/>
              {/* Door panel line */}
              <line x1="13" y1="8" x2="13" y2="19" stroke="#0f766e" strokeWidth=".8" opacity=".7"/>
              {/* Door handles */}
              <rect x="7"  y="13" width="3" height="1.5" rx=".75" fill="#99f6e4" opacity=".8"/>
              <rect x="16" y="13" width="3" height="1.5" rx=".75" fill="#99f6e4" opacity=".8"/>
              {/* Headlights */}
              <rect x="1" y="11" width="3" height="2" rx="1" fill="#fef3c7" opacity=".9"/>
              <rect x="22" y="11" width="3" height="2" rx="1" fill="#fef3c7" opacity=".9"/>
              {/* Wheels */}
              <g>
                <circle cx="5"  cy="20" r="4" fill="#1f2937"/>
                <circle cx="5"  cy="20" r="2.5" fill="#374151"/>
                <circle cx="5"  cy="20" r="1.2" fill="#6b7280"/>
              </g>
              <g>
                <circle cx="21" cy="20" r="4" fill="#1f2937"/>
                <circle cx="21" cy="20" r="2.5" fill="#374151"/>
                <circle cx="21" cy="20" r="1.2" fill="#6b7280"/>
              </g>
            </g>
          </g>

          {/* ══ SMALL PARK / TREES ══ */}
          {[[316,308],[330,308],[316,322],[330,322]].map(([cx,cy],i)=>(
            <g key={i}>
              <circle cx={cx} cy={cy} r="7" fill={i%2===0?'#bbf7d0':'#a7f3d0'} opacity=".8"/>
              <circle cx={cx} cy={cy} r="4" fill={i%2===0?'#6ee7b7':'#34d399'} opacity=".9"/>
            </g>
          ))}

          {/* ══ ZEBRA CROSSINGS ══ */}
          {[0,1,2,3].map(i=>(
            <rect key={i} x={176} y={305+i*8} width={28} height={5} rx="1" fill="white" opacity=".7"/>
          ))}
        </svg>
      </div>

      {/* ═══════ LAYER 2 — Floating premium cards ═══════ */}
      <div style={{ position: 'absolute', inset: 0, ...shift(9, 7), pointerEvents: 'none' }}>

        {/* ── Card 1: ETA (top-left) ── */}
        <div className="card-in" style={{
          animationDelay: '0.1s',
          position: 'absolute', top: '7%', left: '1%',
          background: 'white',
          borderRadius: 18,
          padding: '12px 14px',
          boxShadow: '0 12px 40px rgba(0,0,0,.12), 0 2px 8px rgba(0,0,0,.06)',
          border: '1.5px solid #e5e7eb',
          display: 'flex', alignItems: 'center', gap: 10,
          animation: 'float-up 4s ease-in-out infinite',
          minWidth: 152,
          backdropFilter: 'blur(8px)',
        }}>
          {/* Real bus photo thumbnail */}
          <div style={{
            width: 44, height: 44, borderRadius: 12, overflow: 'hidden', flexShrink: 0,
            background: 'linear-gradient(135deg,#059669,#0d9488)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <img
              src="https://images.unsplash.com/photo-1567449303078-57ad995bd17f?w=80&q=80&fit=crop"
              alt="bus"
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }}
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
          <div>
            <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 600, letterSpacing: '0.05em', textTransform: '' }}>Next Bus ETA</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#059669', lineHeight: 1.2 }}>4 min</div>
            <div style={{ fontSize: 10, color: '#9ca3af' }}>Route 12 • Sector B</div>
          </div>
        </div>

        {/* ── Card 2: Employee tracking (bottom-left) ── */}
        <div className="card-in" style={{
          animationDelay: '0.3s',
          position: 'absolute', bottom: '13%', left: '-2%',
          background: 'white',
          borderRadius: 18,
          padding: '12px 14px',
          boxShadow: '0 12px 40px rgba(0,0,0,.12)',
          border: '1.5px solid #e5e7eb',
          display: 'flex', alignItems: 'center', gap: 10,
          animation: 'float-down 4.5s ease-in-out infinite',
          minWidth: 168,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, overflow: 'hidden', flexShrink: 0,
            background: 'linear-gradient(135deg,#f59e0b,#f97316)',
          }}>
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&q=80&fit=crop&crop=face"
              alt="employee"
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }}
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', display: 'inline-block', boxShadow: '0 0 6px #22c55e' }}/>
              <span style={{ fontSize: 10, color: '#22c55e', fontWeight: 600 }}>Live GPS</span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Driver</div>
            <div style={{ fontSize: 10, color: '#9ca3af' }}>On board • Seat 7A</div>
          </div>
        </div>

        {/* ── Card 3: AI Route (top-right) ── */}
        <div className="card-in" style={{
          animationDelay: '0.5s',
          position: 'absolute', top: '24%', right: '-2%',
          background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
          borderRadius: 18,
          padding: '12px 14px',
          boxShadow: '0 12px 40px rgba(79,70,229,.35)',
          display: 'flex', alignItems: 'center', gap: 10,
          animation: 'float-up 5s ease-in-out infinite 0.8s',
          minWidth: 158,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 24,
          }}>🛣️</div>
          <div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,.7)', fontWeight: 600, textTransform: '', letterSpacing: '0.05em' }}>AI Route</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'white' }}>Optimized ✓</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,.6)' }}>23% fuel saved</div>
          </div>
        </div>

        {/* ── Card 4: Fleet status (bottom-right) ── */}
        <div className="card-in" style={{
          animationDelay: '0.7s',
          position: 'absolute', bottom: '5%', right: '0%',
          background: 'white',
          borderRadius: 18,
          padding: '12px 14px',
          boxShadow: '0 12px 40px rgba(0,0,0,.12)',
          border: '1.5px solid #e5e7eb',
          display: 'flex', alignItems: 'center', gap: 10,
          animation: 'float-down 6s ease-in-out infinite 1.2s',
          minWidth: 148,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, overflow: 'hidden', flexShrink: 0,
            background: '#ecfdf5',
          }}>
            <img
              src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=80&q=80&fit=crop"
              alt="fleet"
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }}
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
          <div>
            <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 600, textTransform: '', letterSpacing: '0.05em' }}>Fleet Active</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#111827' }}>12 <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 400 }}>vehicles</span></div>
            <div style={{
              fontSize: 10, color: '#059669', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 3,
            }}>
              <span>↑</span> 99.9% on-time
            </div>
          </div>
        </div>
      </div>

      {/* ═══════ LAYER 3 — Depth particles ═══════ */}
      <div style={{ position: 'absolute', inset: 0, ...shift(14, 11), pointerEvents: 'none' }}>
        {[
          { t:'6%',  l:'40%', s:8,  c:'#10b981', d:'0s'   },
          { t:'32%', l:'4%',  s:6,  c:'#14b8a6', d:'0.7s' },
          { t:'62%', l:'48%', s:5,  c:'#f59e0b', d:'1.4s' },
          { t:'78%', l:'18%', s:7,  c:'#6366f1', d:'0.3s' },
          { t:'16%', r:'6%',  s:5,  c:'#10b981', d:'1.1s' },
          { t:'55%', r:'3%',  s:9,  c:'#0d9488', d:'1.8s' },
          { t:'44%', l:'2%',  s:6,  c:'#f97316', d:'2.2s' },
        ].map((p,i)=>(
          <div key={i} style={{
            position: 'absolute',
            top: p.t, left: (p as any).l, right: (p as any).r,
            width: p.s, height: p.s, borderRadius: '50%',
            background: p.c, opacity: 0.45,
            animation: `${i%2===0?'float-up':'float-down'} ${3+i*0.6}s ease-in-out infinite ${p.d}`,
          }}/>
        ))}
      </div>
    </div>
  );
}
