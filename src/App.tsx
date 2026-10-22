import { useEffect, useMemo, useRef, useState } from "react"
import { useStore } from "./store"
import { fmtINR, isOverdue, todayISO, minutesToHM, hasConflict, streakForHabit, toMinutes, uid } from "./utils"
import type { Task, SubTask, Priority, TaskStatus, CalendarEvent } from "./models"
import { ambientPlayer, SOUND_OPTIONS, type AmbientSound } from "./audio"

// ===== helpers =====
const priorityColor:Record<Priority,string>={ low:"#9a9ab0", medium:"#7c6cff", high:"#f59e0b", urgent:"#ef4444" }
const statusLabel:Record<TaskStatus,string>={ todo:"To do", doing:"Doing", done:"Done" }

function useLocalSearch<T>(items:T[], fn:(x:T)=>string, q:string){
  return useMemo(()=>{ const s=q.trim().toLowerCase(); if(!s) return items; return items.filter(x=> fn(x).toLowerCase().includes(s)); },[items,q,fn]);
}

// ===== Layout Shell =====
type View = "overview"|"tasks"|"habits"|"finance"|"focus"|"calendar"|"goals"
const nav: {id:View,label:string,icon:string}[]=[
  {id:"overview",label:"Overview",icon:"◍"},
  {id:"tasks",label:"Tasks",icon:"✓"},
  {id:"habits",label:"Habits",icon:"◐"},
  {id:"finance",label:"Finance",icon:"₹"},
  {id:"focus",label:"Focus",icon:"◎"},
  {id:"calendar",label:"Calendar",icon:"▦"},
  {id:"goals",label:"Goals",icon:"⬢"},
];

export default function App(){
  const { theme, setTheme, state, reset } = useStore();
  const [view,setView]=useState<View>("overview");
  const [collapsed,setCollapsed]=useState(false);
  const [mobileOpen,setMobileOpen]=useState(false);
  const [palette,setPalette]=useState(false);
  const [q,setQ]=useState("");
  const [toasts,setToasts]=useState<{id:string;message:string}[]>([]);
  const addToast=(message:string)=>{
    const id=uid();
    setToasts(a=>[...a,{id,message}]);
    setTimeout(()=>setToasts(a=>a.filter(x=>x.id!==id)), 2500);
  };

  // keyboard palette
  useEffect(()=>{
    const h=(e:KeyboardEvent)=>{
      if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==="k"){ e.preventDefault(); setPalette(v=>!v); }
      if(e.key==="Escape") setPalette(false);
    };
    window.addEventListener("keydown",h); return ()=>window.removeEventListener("keydown",h);
  },[]);

  // mobile auto collapse
  useEffect(()=>{
    const m=window.matchMedia("(max-width: 900px)");
    const apply=()=> setCollapsed(m.matches);
    apply(); m.addEventListener("change",apply); return ()=>m.removeEventListener("change",apply);
  },[]);

  return (
    <div style={{display:"flex", minHeight:"100vh", background:"var(--bg)"}}>
      {/* Sidebar */}
      <aside aria-label="Sidebar" style={{
        width: collapsed? "var(--sidebar-collapsed)":"var(--sidebar-w)",
        flexShrink:0,
        position:"sticky", top:0, height:"100vh",
        background:"var(--bg-soft)",
        borderRight:"1px solid var(--border)",
        display:"flex", flexDirection:"column",
        transition:"width .2s ease",
        zIndex:20,
        overflow:"hidden"
      }} className={mobileOpen?"mobile-open":""}>
        <div style={{height:"var(--topbar-h)", display:"flex", alignItems:"center", gap:10, padding: collapsed?"0 14px":"0 16px", borderBottom:"1px solid var(--border)"}}>
          <div style={{width:32,height:32,borderRadius:10, background:"linear-gradient(135deg,#7c6cff,#5eead4)", display:"grid",placeItems:"center", color:"white", fontWeight:800, fontSize:14}}>L</div>
          {!collapsed && <div style={{lineHeight:1}}>
            <div style={{fontWeight:800, fontSize:14, letterSpacing:-.02+"em"}}>LifeOS</div>
            <div style={{fontSize:11, color:"var(--text-muted)", fontWeight:600}}>Personal Command Center</div>
          </div>}
          <div style={{marginLeft:"auto", display:"flex", gap:6}}>
            <button className="btn btn-ghost btn-sm" aria-label="Toggle sidebar" onClick={()=>setCollapsed(v=>!v)}>{collapsed?"»":"«"}</button>
          </div>
        </div>

        <nav style={{padding:10, display:"flex", flexDirection:"column", gap:4, flex:1, overflowY:"auto"}}>
          {nav.map(n=>(
            <button key={n.id} onClick={()=>{setView(n.id); setMobileOpen(false);}} 
              style={{
                display:"flex", alignItems:"center", gap:12, padding: collapsed?"10px 12px":"10px 12px",
                borderRadius:10, border:"1px solid "+ (view===n.id?"var(--border-strong)":"transparent"),
                background: view===n.id ? "var(--bg-elev2)":"transparent",
                color: view===n.id ? "var(--text)":"var(--text-muted)",
                fontWeight:700, fontSize:13, cursor:"pointer", textAlign:"left"
              }}>
              <span style={{width:22,height:22,display:"grid",placeItems:"center", borderRadius:7, background: view===n.id?"var(--accent)":"var(--bg-elev2)", color: view===n.id?"white":"var(--text-muted)", fontSize:12}}>{n.icon}</span>
              {!collapsed && <span>{n.label}</span>}
              {!collapsed && view===n.id && <span style={{marginLeft:"auto",width:6,height:6,borderRadius:99,background:"var(--accent)"}}/>}
            </button>
          ))}
          {!collapsed && <div style={{marginTop:12, padding:12, borderRadius:12, background:"var(--card)", border:"1px solid var(--border)"}}>
            <div style={{fontWeight:800, fontSize:12}}>Pro tip</div>
            <div style={{fontSize:12, color:"var(--text-muted)", marginTop:4, lineHeight:1.4}}>Press <span className="kbd">Ctrl</span> + <span className="kbd">K</span> to jump anywhere instantly.</div>
            <button className="btn btn-primary btn-sm" style={{marginTop:10, width:"100%"}} onClick={()=>setPalette(true)}>Open palette</button>
          </div>}
        </nav>

        <div style={{padding:10, borderTop:"1px solid var(--border)", display:"flex", flexDirection:"column", gap:8}}>
          {!collapsed && <div style={{fontSize:11, color:"var(--text-faint)", fontWeight:700, letterSpacing:.06+"em"}}>SYSTEM</div>}
          <button className="btn btn-sm" style={{justifyContent: collapsed?"center":"flex-start"}} onClick={()=>{ reset(); addToast("Demo data restored"); }} title="Reset Demo Data">↺ {!collapsed && "Reset Demo Data"}</button>
          {!collapsed && <div style={{fontSize:11, color:"var(--text-faint)"}}>v1.0 • Local-first • {state.tasks.length} tasks</div>}
        </div>
      </aside>

      {/* Main */}
      <div style={{flex:1, minWidth:0, display:"flex", flexDirection:"column"}}>
        {/* Topbar */}
        <header style={{height:"var(--topbar-h)", position:"sticky", top:0, zIndex:10, background:"rgba(10,10,15,.75)", backdropFilter:"blur(12px)", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", gap:12, padding:"0 14px"}}>
          <button className="btn btn-ghost" style={{display:"none"}} aria-label="menu" onClick={()=>setMobileOpen(v=>!v)}>☰</button>
          <div style={{display:"flex", alignItems:"center", gap:10, flex:1, minWidth:0}}>
            <div style={{fontWeight:800, letterSpacing:-.02+"em"}}>{nav.find(n=>n.id===view)?.label}</div>
            <span className="badge" style={{background:"var(--bg-elev2)", color:"var(--text-muted)"}}>{new Date().toLocaleDateString("en-IN",{weekday:"short", day:"numeric", month:"short"})}</span>
          </div>
          <div style={{display:"flex", alignItems:"center", gap:8}}>
            <button className="btn" onClick={()=>setPalette(true)} style={{gap:8}}>
              <span style={{opacity:.7}}>⌘</span> Search <span className="kbd">Ctrl K</span>
            </button>
            <div style={{position:"relative"}}>
              <input className="input" placeholder="Quick filter…" value={q} onChange={e=>setQ(e.target.value)} style={{width:180}} aria-label="Quick filter"/>
              {q && <button onClick={()=>setQ("")} style={{position:"absolute", right:6, top:6}} className="btn btn-ghost btn-sm">✕</button>}
            </div>
            <button className="btn" aria-label="Toggle theme" onClick={()=>setTheme(theme==="dark"?"light":"dark")} title="Toggle theme">
              {theme==="dark" ? "☀ Light" : "◑ Dark"}
            </button>
          </div>
        </header>

        {/* Content */}
        <main style={{padding:16, maxWidth:1280, width:"100%", margin:"0 auto"}}>
          {view==="overview" && <Overview q={q} onNav={setView} />}
          {view==="tasks" && <Tasks q={q} onToast={addToast} />}
          {view==="habits" && <Habits q={q} onToast={addToast} />}
          {view==="finance" && <Finance q={q} />}
          {view==="focus" && <FocusStudio onToast={addToast} />}
          {view==="calendar" && <CalendarView q={q} />}
          {view==="goals" && <Goals q={q} />}
        </main>

        {/* Mobile sidebar overlay */}
        {mobileOpen && <div onClick={()=>setMobileOpen(false)} style={{position:"fixed", inset:0, background:"rgba(0,0,0,.4)", zIndex:15}}/>}

        {/* Command palette */}
        {palette && <CommandPalette onClose={()=>setPalette(false)} onNav={(v)=>{setView(v as View); setPalette(false);}} />}

        {/* Toasts */}
        {toasts.map((t,i)=> (
          <div key={t.id} role="status" style={{position:"fixed", bottom: 16 + i*52, right:16, background:"var(--card)", border:"1px solid var(--border)", padding:"10px 14px", borderRadius:10, boxShadow:"var(--shadow)", fontWeight:700, fontSize:13, animation:"slideUp .2s ease", zIndex:40}}>{t.message}</div>
        ))}

        <style>{`@media(max-width:900px){ aside{ position:fixed !important; left:0; transform: translateX(-100%); } aside.mobile-open{ transform: translateX(0); width: var(--sidebar-w) !important; } header button[aria-label="menu"]{ display:inline-flex !important; } }`}</style>
      </div>
    </div>
  )
}

// ================= Overview =================
function Overview({q, onNav}:{q:string, onNav:(v:View)=>void}){
  const { state } = useStore();
  const today=todayISO();
  const todaysTasks = state.tasks.filter(t=> (t.dueDate===today && t.status!=="done") || (t.status!=="done" && isOverdue(t.dueDate)));
  const completedToday = state.tasks.filter(t=> t.completedAt && t.completedAt.slice(0,10)===today).length;
  const habitStreaks = state.habits.map(h=>{
    const logs=state.habitLogs.filter(l=>l.habitId===h.id).map(l=>l.date);
    return streakForHabit(logs, h.frequency);
  });
  const avgStreak = habitStreaks.length? Math.round(habitStreaks.reduce((a,b)=>a+b.current,0)/habitStreaks.length):0;
  const focusMinutes = state.focusSessions.filter(s=>s.completed).reduce((a,s)=>a+s.durationMinutes,0);
  const month = new Date().toISOString().slice(0,7);
  const monthSpend = state.transactions.filter(t=> t.type==="expense" && t.date.slice(0,7)===month).reduce((a,t)=>a+t.amountPaise,0);
  const monthIncome = state.transactions.filter(t=> t.type==="income" && t.date.slice(0,7)===month).reduce((a,t)=>a+t.amountPaise,0);
  const upcoming = [...state.events].filter(e=> e.date>=today).sort((a,b)=> (a.date+a.start).localeCompare(b.date+b.start)).slice(0,5);
  const goalProgress = state.goals.map(g=>{
    const done=g.milestones.filter(m=>m.completed).length;
    const pct= g.milestones.length? Math.round(done/g.milestones.length*100): (g.targetValue? Math.min(100, Math.round((g.currentValue||0)/(g.targetValue)*100)):0);
    return {g,pct};
  });
  // activity timeline (today-ish)
  const activities = [
    ...state.tasks.filter(t=>t.completedAt && t.completedAt.slice(0,10)===today).map(t=>({time:t.completedAt!.slice(11,16), label:`Completed “${t.title}”`, kind:"task" as const})),
    ...state.focusSessions.filter(s=>s.startedAt.slice(0,10)===today && s.completed).map(s=>({time:s.startedAt.slice(11,16), label:`Focus ${s.durationMinutes}m ${s.taskTitle?`• ${s.taskTitle}`:""}`, kind:"focus" as const})),
    ...state.habitLogs.filter(l=>l.date===today).slice(0,4).map(l=>{ const h=state.habits.find(x=>x.id===l.habitId); return {time:"09:00", label:`Habit • ${h?.name||l.habitId}`, kind:"habit" as const}}),
    ...state.transactions.filter(t=>t.date===today).map(t=>({time:"12:00", label:`${t.type==="income"?"+":"-"} ${fmtINR(t.amountPaise)} • ${t.category}`, kind:"finance" as const})),
  ].slice(0,6);

  return (
    <div style={{display:"flex", flexDirection:"column", gap:16}}>
      {/* Hero metrics */}
      <div style={{display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12}}>
        <MetricCard label="Today's focus" value={minutesToHM(focusMinutes)} sub={`${state.focusSessions.filter(s=>s.completed).length} sessions`} accent="var(--accent)" />
        <MetricCard label="Tasks due" value={String(todaysTasks.length)} sub={`${completedToday} completed today`} accent="var(--success)" />
        <MetricCard label="Habit streak" value={`${avgStreak} days`} sub="avg current streak" accent="var(--accent-2)" />
        <MetricCard label="Spent this month" value={fmtINR(monthSpend)} sub={`Income ${fmtINR(monthIncome)} • Net ${fmtINR(monthIncome-monthSpend)}`} accent={ monthSpend> monthIncome*0.8 ? "var(--danger)":"var(--warn)"} />
      </div>

      <div style={{display:"grid", gridTemplateColumns:"1.35fr .85fr", gap:12}}>
        {/* Left */}
        <div style={{display:"flex", flexDirection:"column", gap:12}}>
          <div className="card" style={{padding:14}}>
            <div style={{display:"flex", alignItems:"center", justifyContent:"space-between"}}>
              <h3 style={{fontSize:14, fontWeight:800}}>Today's priority</h3>
              <button className="btn btn-sm" onClick={()=>onNav("tasks")}>Open tasks</button>
            </div>
            <div style={{marginTop:10, display:"flex", flexDirection:"column", gap:8}}>
              {todaysTasks.slice(0,5).map(t=> <TaskRow key={t.id} t={t} compact/>)}
              {todaysTasks.length===0 && <Empty text="No urgent tasks — enjoy the calm."/>}
            </div>
          </div>

          <div className="card" style={{padding:14}}>
            <h3 style={{fontSize:14,fontWeight:800}}>Spending by category (this month)</h3>
            <Donut data={(() =>{
              const map=new Map<string,number>();
              state.transactions.filter(t=>t.type==="expense" && t.date.slice(0,7)===month).forEach(t=> map.set(t.category, (map.get(t.category)||0)+t.amountPaise));
              return [...map.entries()].map(([k,v])=>({label:k,value:v}));
            })()}/>
          </div>

          <div className="card" style={{padding:14}}>
            <h3 style={{fontSize:14,fontWeight:800}}>Goals progress</h3>
            <div style={{display:"flex", flexDirection:"column", gap:10, marginTop:10}}>
              {goalProgress.map(({g,pct})=>(
                <div key={g.id} style={{display:"flex", alignItems:"center", gap:10}}>
                  <div style={{width:38,height:38,borderRadius:10, background: g.color, display:"grid", placeItems:"center", color:"white", fontWeight:800}}>⬢</div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700, fontSize:13}}>{g.title}</div>
                    <div className="progress-track" style={{marginTop:6}}><div className="progress-fill" style={{width:pct+"%", background:g.color}}/></div>
                  </div>
                  <div style={{fontWeight:800, fontSize:12}}>{pct}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right */}
        <div style={{display:"flex", flexDirection:"column", gap:12}}>
          <div className="card" style={{padding:14}}>
            <h3 style={{fontSize:14,fontWeight:800}}>Upcoming events</h3>
            <div style={{display:"flex", flexDirection:"column", gap:8, marginTop:10}}>
              {upcoming.map(e=>(
                <div key={e.id} style={{display:"flex", gap:10, padding:"10px 12px", borderRadius:10, background:"var(--bg-elev2)", border:"1px solid var(--border)"}}>
                  <div style={{width:4, borderRadius:99, background:e.color}}/>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700, fontSize:13}}>{e.title}</div>
                    <div style={{fontSize:12, color:"var(--text-muted)"}}>{e.date} • {e.start}–{e.end}</div>
                  </div>
                </div>
              ))}
              {upcoming.length===0 && <Empty text="No upcoming events."/>}
            </div>
          </div>

          <div className="card" style={{padding:14}}>
            <h3 style={{fontSize:14,fontWeight:800}}>Activity timeline</h3>
            <div style={{marginTop:10, display:"flex", flexDirection:"column", gap:8}}>
              {activities.map((a,i)=>(
                <div key={i} style={{display:"flex", gap:10, alignItems:"center"}}>
                  <div style={{width:34, textAlign:"right", fontSize:12, color:"var(--text-muted)", fontWeight:700}}>{a.time}</div>
                  <div style={{width:10,height:10,borderRadius:99, background: a.kind==="task"?"var(--success)": a.kind==="focus"?"var(--accent)": a.kind==="habit"?"var(--accent-2)":"var(--warn)"}}/>
                  <div style={{fontSize:13, fontWeight:600}}>{a.label}</div>
                </div>
              ))}
              {activities.length===0 && <Empty text="Complete a task or habit to see activity here."/>}
            </div>
          </div>

          <div className="card" style={{padding:14}}>
            <h3 style={{fontSize:14,fontWeight:800}}>Quick actions</h3>
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginTop:10}}>
              <button className="btn" onClick={()=>onNav("tasks")}>＋ New task</button>
              <button className="btn" onClick={()=>onNav("focus")}>◎ Start focus</button>
              <button className="btn" onClick={()=>onNav("finance")}>＋ Add transaction</button>
              <button className="btn" onClick={()=>onNav("calendar")}>＋ New event</button>
            </div>
          </div>
        </div>
      </div>

      <style>{`@media(max-width:1000px){ div[style*="grid-template-columns:repeat(4"]{ grid-template-columns:1fr 1fr !important; } div[style*="1.35fr"]{ grid-template-columns:1fr !important; } }`}</style>
    </div>
  )
}

function MetricCard({label,value,sub,accent}:{label:string,value:string,sub:string,accent:string}){
  return <div className="card" style={{padding:14, position:"relative", overflow:"hidden"}}>
    <div style={{position:"absolute", inset:0, background:`radial-gradient(300px 120px at 20% 0%, ${accent}18, transparent 60%)`}}/>
    <div style={{position:"relative"}}>
      <div style={{fontSize:11, fontWeight:800, letterSpacing:.06+"em", color:"var(--text-muted)", textTransform:"uppercase"}}>{label}</div>
      <div style={{fontSize:22, fontWeight:900, letterSpacing:-.03+"em", marginTop:6}}>{value}</div>
      <div style={{fontSize:12, color:"var(--text-muted)", marginTop:4}}>{sub}</div>
    </div>
  </div>
}

function Donut({data}:{data:{label:string,value:number}[]}){
  const total=data.reduce((a,b)=>a+b.value,0) || 1;
  let acc=0;
  const colors=["#7c6cff","#22c55e","#f59e0b","#06b6d4","#f472b6","#a78bfa","#ef4444","#5eead4"];
  return (
    <div style={{display:"flex", gap:16, alignItems:"center", marginTop:12}}>
      <svg width={120} height={120} viewBox="0 0 42 42" style={{flexShrink:0}}>
        <circle cx={21} cy={21} r={15.9} fill="transparent" stroke="var(--bg-elev2)" strokeWidth={6}/>
        {data.map((d,i)=>{
          const pct=d.value/total*100;
          const dash=`${pct} ${100-pct}`;
          const offset= 25 - acc; // start at top
          acc+=pct;
          return <circle key={d.label} cx={21} cy={21} r={15.9} fill="transparent" stroke={colors[i%colors.length]} strokeWidth={6} strokeDasharray={dash} strokeDashoffset={offset} style={{transform:"rotate(-90deg)", transformOrigin:"21px 21px"}}/>
        })}
        <text x={21} y={21} textAnchor="middle" dominantBaseline="middle" fontSize={4.2} fontWeight={800} fill="var(--text)">{ total>0? (data.length? data[0].label.slice(0,6):""):"—"}</text>
      </svg>
      <div style={{display:"flex", flexDirection:"column", gap:6, flex:1}}>
        {data.slice(0,6).map((d,i)=>(
          <div key={d.label} style={{display:"flex", alignItems:"center", gap:8, fontSize:12}}>
            <span style={{width:10,height:10,borderRadius:4, background:colors[i%colors.length]}}/>
            <span style={{flex:1, fontWeight:600}}>{d.label}</span>
            <span style={{color:"var(--text-muted)", fontWeight:700}}>{fmtINR(d.value)}</span>
            <span style={{fontWeight:800}}>{Math.round(d.value/total*100)}%</span>
          </div>
        ))}
        {data.length===0 && <Empty text="No spending this month."/>}
      </div>
    </div>
  )
}

// ================= Tasks =================
function Tasks({q, onToast}:{q:string, onToast:(m:string)=>void}){
  const { state, addTask, updateTask, deleteTask, toggleTask, toggleSubtask } = useStore();
  const [view,setView]=useState<"list"|"kanban">("list");
  const [query,setQuery]=useState("");
  const [filterStatus,setFilterStatus]=useState<"all"|TaskStatus>("all");
  const [filterPri,setFilterPri]=useState<"all"|Priority>("all");
  const [filterCat,setFilterCat]=useState<string>("all");
  const [sortBy,setSortBy]=useState<"due"|"priority"|"created">("due");
  const [editing,setEditing]=useState<Task|null>(null);
  const [showForm,setShowForm]=useState(false);
  const combinedQ = (q+" "+query).trim();

  const focusByTask = useMemo(()=>{
    const m=new Map<string,number>();
    for(const s of state.focusSessions){
      if(s.completed && s.taskId) m.set(s.taskId, (m.get(s.taskId)||0)+s.durationMinutes);
    }
    return m;
  },[state.focusSessions]);

  const filtered = useMemo(()=>{
    let arr=[...state.tasks];
    if(combinedQ) arr=arr.filter(t=> (t.title+" "+(t.description||"")+" "+t.category).toLowerCase().includes(combinedQ.toLowerCase()));
    if(filterStatus!=="all") arr=arr.filter(t=> t.status===filterStatus);
    if(filterPri!=="all") arr=arr.filter(t=> t.priority===filterPri);
    if(filterCat!=="all") arr=arr.filter(t=> t.category===filterCat);
    const priRank:Record<Priority,number>={ urgent:0, high:1, medium:2, low:3 };
    arr.sort((a,b)=>{
      if(sortBy==="priority") return priRank[a.priority]-priRank[b.priority];
      if(sortBy==="due"){
        const ad=a.dueDate||"9999-12-31", bd=b.dueDate||"9999-12-31";
        if(ad!==bd) return ad.localeCompare(bd);
        return priRank[a.priority]-priRank[b.priority];
      }
      return b.createdAt.localeCompare(a.createdAt);
    });
    return arr;
  },[state.tasks, combinedQ, filterStatus, filterPri, filterCat, sortBy]);

  const onDrop=(e:React.DragEvent, status:TaskStatus)=>{
    e.preventDefault();
    const id=e.dataTransfer.getData("text/plain");
    if(id) updateTask(id,{status});
  };

  return (
    <div style={{display:"flex", flexDirection:"column", gap:12}}>
      <div className="card" style={{padding:12, display:"flex", gap:8, flexWrap:"wrap", alignItems:"center"}}>
        <div style={{display:"flex", gap:6}}>
          <button className={`btn ${view==="list"?"btn-primary":""}`} onClick={()=>setView("list")}>List</button>
          <button className={`btn ${view==="kanban"?"btn-primary":""}`} onClick={()=>setView("kanban")}>Kanban</button>
        </div>
        <input className="input" placeholder="Search tasks…" value={query} onChange={e=>setQuery(e.target.value)} style={{flex:1, minWidth:160}}/>
        <select className="select" value={filterStatus} onChange={e=>setFilterStatus(e.target.value as any)} style={{width:130}}>
          <option value="all">All status</option><option value="todo">To do</option><option value="doing">Doing</option><option value="done">Done</option>
        </select>
        <select className="select" value={filterPri} onChange={e=>setFilterPri(e.target.value as any)} style={{width:130}}>
          <option value="all">Any priority</option><option value="urgent">Urgent</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
        </select>
        <select className="select" value={filterCat} onChange={e=>setFilterCat(e.target.value)} style={{width:140}}>
          <option value="all">All categories</option>
          {["Work","Personal","Health","Finance","Learning","Home"].map(c=> <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="select" value={sortBy} onChange={e=>setSortBy(e.target.value as any)} style={{width:140}}>
          <option value="due">Sort: Due + Priority</option><option value="priority">Sort: Priority</option><option value="created">Sort: Newest</option>
        </select>
        <button className="btn btn-primary" onClick={()=>{setEditing(null); setShowForm(true);}}>＋ New task</button>
      </div>

      {view==="list" ? (
        <div className="card" style={{overflow:"hidden"}}>
          <div style={{display:"grid", gridTemplateColumns:"1fr", gap:0}}>
            {filtered.map(t=> <TaskRow key={t.id} t={t} focusMinutes={focusByTask.get(t.id)||0} onToggle={()=>{ toggleTask(t.id); onToast("Task completed"); }} onToggleSubtask={(subId)=> toggleSubtask(t.id, subId)} onEdit={()=>{setEditing(t); setShowForm(true);}} onDelete={()=>{ if(confirm(`Delete “${t.title}”?`)) deleteTask(t.id); }} draggable onDragStart={(e)=> e.dataTransfer.setData("text/plain", t.id)} />)}
            {filtered.length===0 && <div style={{padding:18}}><Empty text="No tasks match your filters." actionLabel="Clear filters" onAction={()=>{setFilterStatus("all"); setFilterPri("all"); setFilterCat("all"); setQuery("");}}/></div>}
          </div>
        </div>
      ) : (
        <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12}}>
          {(["todo","doing","done"] as TaskStatus[]).map(col=>(
            <div key={col} onDragOver={e=>e.preventDefault()} onDrop={e=>onDrop(e,col)} className="card" style={{padding:10, minHeight:320}}>
              <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:8}}>
                <span className="badge" style={{background:"var(--bg-elev2)"}}>{statusLabel[col]} • {filtered.filter(t=>t.status===col).length}</span>
                <span style={{marginLeft:"auto", width:8,height:8,borderRadius:99, background: col==="done"?"var(--success)": col==="doing"?"var(--accent)":"var(--text-faint)"}}/>
              </div>
              <div style={{display:"flex", flexDirection:"column", gap:8}}>
                {filtered.filter(t=>t.status===col).map(t=>{
                  const subtasks = t.subtasks || [];
                  const subDone = subtasks.filter(s=>s.completed).length;
                  const subPct = subtasks.length ? Math.round((subDone / subtasks.length) * 100) : 0;
                  return (
                    <div key={t.id} draggable onDragStart={e=>e.dataTransfer.setData("text/plain", t.id)} style={{padding:12, borderRadius:12, background:"var(--bg-elev)", border:"1px solid var(--border)", cursor:"grab"}}>
                      <div style={{fontWeight:700, fontSize:13, display:"flex", alignItems:"center", gap:6}}>
                        <span style={{width:8,height:8,borderRadius:99, background:priorityColor[t.priority]}}/> {t.title}
                      </div>
                      {t.description && <div style={{fontSize:12, color:"var(--text-muted)", marginTop:4, lineHeight:1.4}}>{t.description}</div>}
                      
                      {/* Subtasks in Kanban */}
                      {subtasks.length > 0 && (
                        <div style={{marginTop:8, padding:8, borderRadius:8, background:"var(--bg-soft)", border:"1px solid var(--border)"}}>
                          <div style={{display:"flex", justifyContent:"space-between", fontSize:11, fontWeight:700, color:"var(--text-muted)"}}>
                            <span>Checklist</span>
                            <span>{subDone}/{subtasks.length} ({subPct}%)</span>
                          </div>
                          <div className="progress-track" style={{marginTop:4, height:4}}>
                            <div className="progress-fill" style={{width:`${subPct}%`, background: subPct===100 ? "var(--success)" : "var(--accent)"}}/>
                          </div>
                          <div style={{display:"flex", flexDirection:"column", gap:4, marginTop:6}}>
                            {subtasks.map(st => (
                              <label key={st.id} onClick={e=>e.stopPropagation()} style={{display:"flex", alignItems:"center", gap:6, fontSize:11, cursor:"pointer"}}>
                                <input
                                  type="checkbox"
                                  checked={st.completed}
                                  onChange={()=> toggleSubtask(t.id, st.id)}
                                  style={{cursor:"pointer"}}
                                />
                                <span style={{textDecoration: st.completed ? "line-through" : "none", opacity: st.completed ? 0.6 : 1}}>
                                  {st.title}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                      <div style={{display:"flex", gap:6, marginTop:8, flexWrap:"wrap"}}>
                        <span className="badge">{t.category}</span>
                        {t.dueDate && <span className="badge" style={{background: isOverdue(t.dueDate) && t.status!=="done" ? "#ef444418":"var(--bg-elev2)", color: isOverdue(t.dueDate) && t.status!=="done" ? "var(--danger)":"var(--text-muted)", borderColor: isOverdue(t.dueDate)?"#ef444430":"var(--border)"}}>{isOverdue(t.dueDate)&&t.status!=="done"?"Overdue • ":""}{t.dueDate}</span>}
                        {focusByTask.get(t.id) && <span className="badge" style={{background:"#7c6cff18", color:"var(--accent)", borderColor:"#7c6cff30"}}>⏱ {focusByTask.get(t.id)}m</span>}
                      </div>
                      <div style={{display:"flex", gap:6, marginTop:8}}>
                        <button className="btn btn-sm" onClick={()=>{ toggleTask(t.id); onToast("Task completed"); }}>{t.status==="done"?"Undo":"Complete"}</button>
                        <button className="btn btn-sm btn-ghost" onClick={()=>{setEditing(t); setShowForm(true);}}>Edit</button>
                      </div>
                    </div>
                  );
                })}
                {filtered.filter(t=>t.status===col).length===0 && <div style={{padding:10}}><Empty text="Drop tasks here."/></div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && <TaskForm initial={editing} onClose={()=>setShowForm(false)} onSave={(patch)=>{
        if(editing){ updateTask(editing.id, patch as any); }
        else { addTask({id:uid(), createdAt:new Date().toISOString().slice(0,10), status:"todo", ...patch as any}); }
        setShowForm(false);
      }}/>}

      <style>{`@media(max-width:900px){ div[style*="repeat(3,1fr)"]{ grid-template-columns:1fr !important; } }`}</style>
    </div>
  )
}

function TaskRow({t, compact, onToggle, onToggleSubtask, onEdit, onDelete, draggable, onDragStart, focusMinutes}:{t:Task, compact?:boolean, onToggle?:()=>void, onToggleSubtask?:(subtaskId:string)=>void, onEdit?:()=>void, onDelete?:()=>void, draggable?:boolean, onDragStart?:(e:React.DragEvent)=>void, focusMinutes?:number}){
  const overdue=isOverdue(t.dueDate) && t.status!=="done";
  const [expanded, setExpanded] = useState(false);
  const subtasks = t.subtasks || [];
  const subDone = subtasks.filter(s=>s.completed).length;
  const subPct = subtasks.length ? Math.round((subDone / subtasks.length) * 100) : 0;

  return (
    <div draggable={draggable} onDragStart={onDragStart} style={{display:"flex", flexDirection:"column", borderBottom:"1px solid var(--border)", background: overdue? "rgba(239,68,68,.06)":undefined}}>
      <div style={{display:"flex", gap:12, padding: compact?"10px 12px":"12px 14px", alignItems:"center"}}>
        <button aria-label="Toggle complete" onClick={onToggle} style={{width:22,height:22,borderRadius:7, border:"1px solid "+(t.status==="done"?"var(--success)":"var(--border)"), background: t.status==="done"?"var(--success)":"transparent", color:"white", display:"grid", placeItems:"center", fontSize:12, cursor:"pointer", flexShrink:0}}>
          {t.status==="done"?"✓":""}
        </button>
        <div style={{flex:1, minWidth:0}}>
          <div style={{fontWeight:750, fontSize:13, textDecoration: t.status==="done"?"line-through":"none", opacity: t.status==="done"?.7:1, display:"flex", gap:8, alignItems:"center", flexWrap:"wrap"}}>
            {t.title}
            <span style={{width:8,height:8,borderRadius:99, background:priorityColor[t.priority]}} title={t.priority}/>
            <span className="badge" style={{background:"var(--bg-elev2)"}}>{t.category}</span>
            {overdue && <span className="badge" style={{background:"#ef444418", color:"var(--danger)", borderColor:"#ef444430"}}>Overdue</span>}
            {t.goalId && <span className="badge" style={{background:"#7c6cff18", color:"var(--accent)", borderColor:"#7c6cff30"}}>Goal-linked</span>}
            {focusMinutes && <span className="badge" style={{background:"#7c6cff18", color:"var(--accent)", borderColor:"#7c6cff30"}}>⏱ {focusMinutes}m focus</span>}
            
            {/* Subtask count badge */}
            {subtasks.length > 0 && (
              <button
                type="button"
                onClick={(e)=>{ e.stopPropagation(); setExpanded(v=>!v); }}
                className="badge"
                style={{
                  background: subPct===100 ? "#22c55e18" : "var(--accent-elev)",
                  color: subPct===100 ? "var(--success)" : "var(--accent)",
                  borderColor: subPct===100 ? "#22c55e30" : "var(--border-strong)",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4
                }}
                title="Click to toggle checklist"
              >
                <span>☑ {subDone}/{subtasks.length} ({subPct}%)</span>
                <span style={{fontSize:9}}>{expanded ? "▲" : "▼"}</span>
              </button>
            )}
          </div>

          {/* Subtask progress bar */}
          {subtasks.length > 0 && (
            <div className="progress-track" style={{marginTop:6, maxWidth:240, height:4}}>
              <div className="progress-fill" style={{width:`${subPct}%`, background: subPct===100 ? "var(--success)" : "var(--accent)"}}/>
            </div>
          )}

          {!compact && t.description && <div style={{fontSize:12, color:"var(--text-muted)", marginTop:4}}>{t.description}</div>}
          <div style={{display:"flex", gap:8, marginTop:4, fontSize:12, color:"var(--text-muted)", alignItems:"center"}}>
            {t.dueDate ? <span>Due {t.dueDate}</span> : <span>No due date</span>}
            <span>•</span><span style={{textTransform:"capitalize"}}>{t.status}</span>
          </div>
        </div>
        {!compact && <div style={{display:"flex", gap:6}}>
          {onToggle && <button className="btn btn-sm" onClick={onToggle}>{t.status==="done"?"Undo":"Done"}</button>}
          {onEdit && <button className="btn btn-sm btn-ghost" onClick={onEdit}>Edit</button>}
          {onDelete && <button className="btn btn-sm btn-ghost" onClick={onDelete} style={{color:"var(--danger)"}}>Delete</button>}
        </div>}
      </div>

      {/* Expanded subtask checklist */}
      {expanded && subtasks.length > 0 && (
        <div style={{padding:"0 14px 12px 48px", display:"flex", flexDirection:"column", gap:6}}>
          {subtasks.map(st => (
            <label
              key={st.id}
              style={{
                display:"flex",
                alignItems:"center",
                gap:8,
                padding:"6px 10px",
                borderRadius:8,
                background:"var(--bg-elev2)",
                border:"1px solid var(--border)",
                cursor:"pointer",
                fontSize:12
              }}
            >
              <input
                type="checkbox"
                checked={st.completed}
                onChange={()=> onToggleSubtask && onToggleSubtask(st.id)}
                style={{cursor:"pointer"}}
              />
              <span style={{flex:1, fontWeight:600, textDecoration: st.completed ? "line-through" : "none", opacity: st.completed ? 0.6 : 1}}>
                {st.title}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

function TaskForm({initial, onClose, onSave}:{initial:Task|null, onClose:()=>void, onSave:(p:Partial<Task>)=>void}){
  const { state } = useStore();
  const [title,setTitle]=useState(initial?.title||"");
  const [description,setDescription]=useState(initial?.description||"");
  const [priority,setPriority]=useState<Priority>(initial?.priority||"medium");
  const [category,setCategory]=useState(initial?.category||"Work" as any);
  const [dueDate,setDueDate]=useState(initial?.dueDate||"");
  const [status,setStatus]=useState<TaskStatus>(initial?.status||"todo");
  const [goalId,setGoalId]=useState(initial?.goalId||"");
  const [subtasks,setSubtasks]=useState<SubTask[]>(initial?.subtasks ? [...initial.subtasks] : []);
  const [newSubtaskTitle,setNewSubtaskTitle]=useState("");
  const [err,setErr]=useState<string|null>(null);

  const addSubtaskItem = () => {
    if (!newSubtaskTitle.trim()) return;
    setSubtasks(prev => [...prev, { id: uid(), title: newSubtaskTitle.trim(), completed: false }]);
    setNewSubtaskTitle("");
  };

  return (
    <div role="dialog" aria-modal="true" style={{position:"fixed", inset:0, background:"rgba(0,0,0,.5)", display:"grid", placeItems:"center", zIndex:50, padding:16}}>
      <div className="card" style={{width:"min(580px, 100%)", padding:16, animation:"pop .18s ease", maxHeight:"90vh", overflow:"auto"}}>
        <div style={{display:"flex", alignItems:"center", justifyContent:"space-between"}}>
          <h3 style={{fontWeight:900}}>{initial?"Edit task":"New task"}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div style={{display:"flex", flexDirection:"column", gap:10, marginTop:12}}>
          <label style={{fontSize:12,fontWeight:700, color:"var(--text-muted)"}}>Title *<input className="input" value={title} onChange={e=>setTitle(e.target.value)} placeholder="What needs to be done?" /></label>
          <label style={{fontSize:12,fontWeight:700, color:"var(--text-muted)"}}>Description<textarea className="textarea" value={description} onChange={e=>setDescription(e.target.value)} placeholder="Details (optional)"/></label>
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10}}>
            <label style={{fontSize:12,fontWeight:700}}>Priority
              <select className="select" value={priority} onChange={e=>setPriority(e.target.value as Priority)}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select>
            </label>
            <label style={{fontSize:12,fontWeight:700}}>Category
              <select className="select" value={category} onChange={e=>setCategory(e.target.value as any)}>{["Work","Personal","Health","Finance","Learning","Home"].map(c=> <option key={c} value={c}>{c}</option>)}</select>
            </label>
          </div>
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10}}>
            <label style={{fontSize:12,fontWeight:700}}>Due date<input className="input" type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)} /></label>
            <label style={{fontSize:12,fontWeight:700}}>Status
              <select className="select" value={status} onChange={e=>setStatus(e.target.value as TaskStatus)}><option value="todo">To do</option><option value="doing">Doing</option><option value="done">Done</option></select>
            </label>
          </div>
          <label style={{fontSize:12,fontWeight:700}}>Link to goal (optional)
            <select className="select" value={goalId} onChange={e=>setGoalId(e.target.value)}><option value="">No goal</option>{state.goals.map(g=> <option key={g.id} value={g.id}>{g.title}</option>)}</select>
          </label>

          {/* Subtasks Builder */}
          <div style={{padding:12, borderRadius:10, background:"var(--bg-elev2)", border:"1px solid var(--border)"}}>
            <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8}}>
              <span style={{fontSize:12, fontWeight:800}}>Subtasks & Checklist ({subtasks.filter(s=>s.completed).length}/{subtasks.length})</span>
            </div>

            <div style={{display:"flex", gap:6, marginBottom:8}}>
              <input
                className="input"
                placeholder="Add subtask item…"
                value={newSubtaskTitle}
                onChange={e=>setNewSubtaskTitle(e.target.value)}
                onKeyDown={e=>{ if(e.key==="Enter"){ e.preventDefault(); addSubtaskItem(); } }}
                style={{flex:1}}
              />
              <button type="button" className="btn btn-sm" onClick={addSubtaskItem}>＋ Add</button>
            </div>

            {subtasks.length > 0 && (
              <div style={{display:"flex", flexDirection:"column", gap:6, maxHeight:180, overflowY:"auto"}}>
                {subtasks.map(st => (
                  <div key={st.id} style={{display:"flex", alignItems:"center", gap:8, padding:"6px 8px", background:"var(--card)", borderRadius:8, border:"1px solid var(--border)"}}>
                    <input
                      type="checkbox"
                      checked={st.completed}
                      onChange={()=> setSubtasks(prev => prev.map(s => s.id===st.id ? {...s, completed:!s.completed} : s))}
                      style={{cursor:"pointer"}}
                    />
                    <span style={{flex:1, fontSize:12, fontWeight:600, textDecoration: st.completed ? "line-through" : "none", opacity: st.completed ? 0.6 : 1}}>
                      {st.title}
                    </span>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={()=> setSubtasks(prev => prev.filter(s => s.id!==st.id))}
                      style={{padding:"2px 6px", color:"var(--danger)", fontSize:11}}
                      title="Remove subtask"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {err && <div style={{color:"var(--danger)", fontSize:12, fontWeight:700}}>{err}</div>}
          <div style={{display:"flex", gap:8, justifyContent:"flex-end", marginTop:4}}>
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={()=>{
              if(!title.trim()){ setErr("Title is required."); return; }
              onSave({
                title: title.trim(),
                description: description.trim() || undefined,
                priority,
                category,
                dueDate: dueDate || null,
                status,
                goalId: goalId || null,
                subtasks
              });
            }}>Save task</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ================= Habits =================
function Habits({q, onToast}:{q:string, onToast:(m:string)=>void}){
  const { state, toggleHabit, addHabit, updateHabit, deleteHabit } = useStore();
  const [query,setQuery]=useState("");
  const [showForm,setShowForm]=useState(false);
  const [editing,setEditing]=useState<any>(null);
  const combinedQ=(q+" "+query).trim().toLowerCase();
  const habits = useMemo(()=> state.habits.filter(h=> !combinedQ || (h.name+" "+h.category).toLowerCase().includes(combinedQ)),[state.habits, combinedQ]);
  const today=todayISO();
  // XP/level
  const totalCompletions=state.habitLogs.length;
  const xp= totalCompletions*10;
  const level=Math.floor(xp/100)+1;
  const xpToNext= level*100 - xp %100;

  // heatmap for last 84 days
  const heatDays = useMemo(()=>{
    const arr: {date:string,count:number}[]=[];
    for(let i=83;i>=0;i--){ const d=new Date(); d.setHours(12,0,0,0); d.setDate(d.getDate()-i); const iso=d.toISOString().slice(0,10); const c=state.habitLogs.filter(l=>l.date===iso).length; arr.push({date:iso,count:c}); }
    return arr;
  },[state.habitLogs]);

  return (
    <div style={{display:"flex", flexDirection:"column", gap:12}}>
      <div style={{display:"grid", gridTemplateColumns:"1.2fr .8fr", gap:12}}>
        <div className="card" style={{padding:14}}>
          <div style={{display:"flex", alignItems:"center", justifyContent:"space-between"}}>
            <h3 style={{fontWeight:900}}>Habits</h3>
            <button className="btn btn-primary btn-sm" onClick={()=>{setEditing(null); setShowForm(true);}}>＋ New habit</button>
          </div>
          <div style={{display:"flex", gap:8, marginTop:10}}>
            <input className="input" placeholder="Search habits…" value={query} onChange={e=>setQuery(e.target.value)} style={{flex:1}}/>
          </div>
          <div style={{display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10, marginTop:12}}>
            {habits.map(h=>{
              const logs=state.habitLogs.filter(l=>l.habitId===h.id).map(l=>l.date);
              const {current,longest}=streakForHabit(logs, h.frequency);
              const doneToday=state.habitLogs.some(l=>l.habitId===h.id && l.date===today);
              const weekCount = (()=>{ const s=new Date(); s.setHours(12,0,0,0); s.setDate(s.getDate()-6); let c=0; for(let i=0;i<7;i++){ const d=new Date(s); d.setDate(s.getDate()+i); const iso=d.toISOString().slice(0,10); if(logs.includes(iso)) c++; } return c; })();
              return (
                <div key={h.id} className="card" style={{padding:12, background:"var(--bg-elev)", border:"1px solid var(--border)"}}>
                  <div style={{display:"flex", gap:10, alignItems:"center"}}>
                    <div style={{width:36,height:36,borderRadius:10, background:h.color, display:"grid", placeItems:"center", color:"white", fontWeight:800}}>{h.icon}</div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:800, fontSize:13}}>{h.name}</div>
                      <div style={{fontSize:11, color:"var(--text-muted)", fontWeight:700}}>{h.category} • {h.frequency} • {h.targetPerWeek}/wk</div>
                    </div>
                    <button aria-label="Toggle today" onClick={()=>{ toggleHabit(h.id, today); onToast(doneToday?"Habit unchecked":"Habit logged"); }} className="btn" style={{padding:"6px 10px", background: doneToday? h.color:"var(--bg-elev2)", color: doneToday?"white":"var(--text)", borderColor: doneToday? h.color:"var(--border)"}}>
                      {doneToday?"✓ Done":"○ Mark"}
                    </button>
                  </div>
                  <div style={{display:"flex", gap:8, marginTop:10}}>
                    <span className="badge" style={{background:"#22c55e18", color:"#22c55e", borderColor:"#22c55e30"}}>Current {current}</span>
                    <span className="badge" style={{background:"var(--bg-elev2)"}}>Longest {longest}</span>
                    <span className="badge" style={{background:"var(--bg-elev2)"}}>This week {weekCount}/{h.targetPerWeek}</span>
                  </div>
                  <div className="progress-track" style={{marginTop:8}}><div className="progress-fill" style={{width: Math.min(100, Math.round(weekCount/h.targetPerWeek*100))+"%", background:h.color}}/></div>
                  <div style={{display:"flex", gap:6, marginTop:8}}>
                    <button className="btn btn-sm btn-ghost" onClick={()=>{setEditing(h); setShowForm(true);}}>Edit</button>
                    <button className="btn btn-sm btn-ghost" style={{color:"var(--danger)"}} onClick={()=>{ if(confirm(`Delete habit “${h.name}”?`)) deleteHabit(h.id); }}>Delete</button>
                  </div>
                  {/* 7-day toggles */}
                  <div style={{display:"flex", gap:6, marginTop:10}}>
                    {Array.from({length:7}).map((_,idx)=>{
                      const d=new Date(); d.setHours(12,0,0,0); d.setDate(d.getDate()-(6-idx));
                      const iso=d.toISOString().slice(0,10);
                      const done=logs.includes(iso);
                      const isToday=iso===today;
                      return (
                        <button key={iso} title={iso} onClick={()=>{ toggleHabit(h.id, iso); onToast(done?"Habit unchecked":"Habit logged"); }} style={{flex:1, padding:"6px 0", borderRadius:8, border:"1px solid "+(done?h.color: isToday?"var(--accent)":"var(--border)"), background: done? h.color: "var(--bg-elev2)", color: done?"white": isToday?"var(--text)":"var(--text-muted)", fontWeight:800, fontSize:11}}>
                          {d.toLocaleDateString("en-IN",{weekday:"narrow"})}<br/>{d.getDate()}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )
            })}
          </div>
          {habits.length===0 && <div style={{marginTop:12}}><Empty text="No habits match."/></div>}
        </div>

        <div style={{display:"flex", flexDirection:"column", gap:12}}>
          <div className="card" style={{padding:14}}>
            <h3 style={{fontWeight:900, fontSize:14}}>Level & XP</h3>
            <div style={{display:"flex", alignItems:"center", gap:12, marginTop:10}}>
              <div style={{width:56,height:56,borderRadius:16, background:"linear-gradient(135deg,#7c6cff,#f472b6)", display:"grid", placeItems:"center", color:"white", fontWeight:900, fontSize:18}}>Lv {level}</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:800}}>{xp} XP</div>
                <div style={{fontSize:12, color:"var(--text-muted)"}}>{xpToNext} XP to next level • {totalCompletions} completions</div>
                <div className="progress-track" style={{marginTop:8}}><div className="progress-fill" style={{width: ((xp%100)/100*100)+"%", background:"var(--accent)"}}/></div>
              </div>
            </div>
            <div style={{display:"flex", gap:6, marginTop:10, flexWrap:"wrap"}}>
              <Achievement unlocked={totalCompletions>=10} label="Starter — 10 completions"/>
              <Achievement unlocked={habits.some(h=> streakForHabit(state.habitLogs.filter(l=>l.habitId===h.id).map(l=>l.date), h.frequency).current>=7)} label="Week Warrior — 7-day streak"/>
              <Achievement unlocked={xp>=500} label="500 XP"/>
            </div>
          </div>

          <div className="card" style={{padding:14}}>
            <h3 style={{fontWeight:900, fontSize:14}}>84-day heatmap</h3>
            <div style={{display:"grid", gridTemplateColumns:"repeat(12,1fr)", gap:4, marginTop:10}}>
              {heatDays.map(d=>{
                const intensity = d.count===0?0: d.count===1?1: d.count===2?2:3;
                const bg = intensity===0?"var(--bg-elev2)": intensity===1?"#7c6cff55": intensity===2?"#7c6cff99":"#7c6cff";
                return <div key={d.date} title={`${d.date}: ${d.count}`} style={{height:18, borderRadius:4, background:bg, border:"1px solid var(--border)"}}/>
              })}
            </div>
            <div style={{fontSize:11, color:"var(--text-muted)", marginTop:8}}>Darker = more habits completed that day.</div>
          </div>

          <div className="card" style={{padding:14}}>
            <h3 style={{fontWeight:900, fontSize:14}}>Weekly completion</h3>
            <div style={{display:"flex", alignItems:"end", gap:6, height:90, marginTop:10}}>
              {Array.from({length:7}).map((_,i)=>{
                const d=new Date(); d.setHours(12,0,0,0); d.setDate(d.getDate()-(6-i));
                const iso=d.toISOString().slice(0,10);
                const count=state.habitLogs.filter(l=>l.date===iso).length;
                const max=Math.max(1, ...Array.from({length:7}).map((__,k)=>{ const dd=new Date(); dd.setDate(new Date().getDate()-(6-k)); return state.habitLogs.filter(l=>l.date===dd.toISOString().slice(0,10)).length; }));
                return <div key={iso} style={{flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:6}}>
                  <div style={{width:"100%", height: Math.round(count/max*70)+10, background:"var(--accent)", borderRadius:8, opacity:.85}}/>
                  <span style={{fontSize:11, color:"var(--text-muted)", fontWeight:700}}>{d.toLocaleDateString("en-IN",{weekday:"short"})}</span>
                </div>
              })}
            </div>
          </div>
        </div>
      </div>

      {showForm && <HabitForm initial={editing} onClose={()=>setShowForm(false)} onSave={(patch)=>{
        if(editing) updateHabit(editing.id, patch);
        else addHabit({id:uid(), createdAt:new Date().toISOString().slice(0,10), ...patch});
        setShowForm(false);
      }}/>}

      <style>{`@media(max-width:1000px){ div[style*="1.2fr .8fr"]{ grid-template-columns:1fr !important; } div[style*="repeat(2,1fr)"]{ grid-template-columns:1fr !important; } }`}</style>
    </div>
  )
}
function Achievement({unlocked,label}:{unlocked:boolean,label:string}){
  return <span className="badge" style={{background: unlocked?"#22c55e18":"var(--bg-elev2)", color: unlocked?"var(--success)":"var(--text-muted)", borderColor: unlocked?"#22c55e30":"var(--border)"}}>{unlocked?"✓":"○"} {label}</span>
}
function HabitForm({initial,onClose,onSave}:{initial:any|null,onClose:()=>void,onSave:(p:any)=>void}){
  const [name,setName]=useState(initial?.name||"");
  const [category,setCategory]=useState(initial?.category||"Health");
  const [frequency,setFrequency]=useState(initial?.frequency||"daily");
  const [targetPerWeek,setTarget]=useState(initial?.targetPerWeek||5);
  const [icon,setIcon]=useState(initial?.icon||"⭐");
  const [color,setColor]=useState(initial?.color||"#7c6cff");
  const [err,setErr]=useState<string|null>(null);
  return (
    <div role="dialog" aria-modal="true" style={{position:"fixed", inset:0, background:"rgba(0,0,0,.5)", display:"grid", placeItems:"center", zIndex:50, padding:16}}>
      <div className="card" style={{width:"min(520px,100%)", padding:16, animation:"pop .18s ease"}}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}><h3 style={{fontWeight:900}}>{initial?"Edit habit":"New habit"}</h3><button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button></div>
        <div style={{display:"flex", flexDirection:"column", gap:10, marginTop:10}}>
          <label style={{fontSize:12,fontWeight:700}}>Name *<input className="input" value={name} onChange={e=>setName(e.target.value)} placeholder="e.g., Morning Run"/></label>
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10}}>
            <label style={{fontSize:12,fontWeight:700}}>Category<input className="input" value={category} onChange={e=>setCategory(e.target.value)} /></label>
            <label style={{fontSize:12,fontWeight:700}}>Frequency
              <select className="select" value={frequency} onChange={e=>setFrequency(e.target.value)}>
                <option value="daily">Daily</option><option value="weekdays">Weekdays</option><option value="weekly">Weekly</option><option value="custom">Custom</option>
              </select>
            </label>
          </div>
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10}}>
            <label style={{fontSize:12,fontWeight:700}}>Target / week<input className="input" type="number" min={1} max={7} value={targetPerWeek} onChange={e=>setTarget(Number(e.target.value))}/></label>
            <label style={{fontSize:12,fontWeight:700}}>Icon<input className="input" value={icon} onChange={e=>setIcon(e.target.value)} /></label>
          </div>
          <label style={{fontSize:12,fontWeight:700}}>Color<input className="input" type="color" value={color} onChange={e=>setColor(e.target.value)} /></label>
          {err && <div style={{color:"var(--danger)", fontSize:12, fontWeight:700}}>{err}</div>}
          <div style={{display:"flex", justifyContent:"flex-end", gap:8}}>
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={()=>{ if(!name.trim()){ setErr("Name required"); return; } onSave({name:name.trim(), category, frequency, targetPerWeek: Number(targetPerWeek)||1, icon: icon||"⭐", color}); }}>Save</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ================= Finance =================
function Finance({q}:{q:string}){
  const { state, addTransaction, updateTransaction, deleteTransaction } = useStore();
  const [query,setQuery]=useState("");
  const [typeFilter,setTypeFilter]=useState<"all"|"income"|"expense">("all");
  const [catFilter,setCatFilter]=useState<string>("all");
  const [showForm,setShowForm]=useState(false);
  const [editing,setEditing]=useState<any>(null);
  const combinedQ=(q+" "+query).trim().toLowerCase();
  const filtered = useMemo(()=>{
    let arr=[...state.transactions].sort((a,b)=> b.date.localeCompare(a.date));
    if(typeFilter!=="all") arr=arr.filter(t=> t.type===typeFilter);
    if(catFilter!=="all") arr=arr.filter(t=> t.category===catFilter);
    if(combinedQ) arr=arr.filter(t=> (t.description+" "+t.category).toLowerCase().includes(combinedQ));
    return arr;
  },[state.transactions, typeFilter, catFilter, combinedQ]);

  const month=new Date().toISOString().slice(0,7);
  const monthTx=state.transactions.filter(t=> t.date.slice(0,7)===month);
  const income=monthTx.filter(t=>t.type==="income").reduce((a,t)=>a+t.amountPaise,0);
  const expense=monthTx.filter(t=>t.type==="expense").reduce((a,t)=>a+t.amountPaise,0);
  const remaining=income-expense;
  const cats=[...new Set(state.transactions.map(t=>t.category))];
  const expByCat=(()=>{
    const m=new Map<string,number>();
    monthTx.filter(t=>t.type==="expense").forEach(t=> m.set(t.category,(m.get(t.category)||0)+t.amountPaise));
    return [...m.entries()].map(([label,value])=>({label,value}));
  })();
  const budgetRows = state.budgets.map(b=>{
    const spent=monthTx.filter(t=> t.type==="expense" && t.category===b.category).reduce((a,t)=>a+t.amountPaise,0);
    const pct= b.limitPaise? Math.round(spent/b.limitPaise*100):0;
    return { ...b, spent, pct, over: spent>b.limitPaise };
  });

  return (
    <div style={{display:"flex", flexDirection:"column", gap:12}}>
      <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12}}>
        <div className="card" style={{padding:14}}><div style={{fontSize:11,fontWeight:800,color:"var(--text-muted)",textTransform:"uppercase"}}>Income (month)</div><div style={{fontSize:22,fontWeight:900, marginTop:4}}>{fmtINR(income)}</div><div style={{fontSize:12,color:"var(--text-muted)"}}>{month}</div></div>
        <div className="card" style={{padding:14}}><div style={{fontSize:11,fontWeight:800,color:"var(--text-muted)",textTransform:"uppercase"}}>Expenses (month)</div><div style={{fontSize:22,fontWeight:900, marginTop:4}}>{fmtINR(expense)}</div><div className="progress-track" style={{marginTop:8}}><div className="progress-fill" style={{width: Math.min(100, income? Math.round(expense/income*100):0)+"%", background: expense>income?"var(--danger)":"var(--warn)"}}/></div></div>
        <div className="card" style={{padding:14}}><div style={{fontSize:11,fontWeight:800,color:"var(--text-muted)",textTransform:"uppercase"}}>Remaining</div><div style={{fontSize:22,fontWeight:900, marginTop:4, color: remaining<0?"var(--danger)":"var(--success)"}}>{fmtINR(remaining)}</div><div style={{fontSize:12,color:"var(--text-muted)"}}>{remaining<0?"Over budget":"On track"}</div></div>
      </div>

      <div style={{display:"grid", gridTemplateColumns:"1.1fr .9fr", gap:12}}>
        <div className="card" style={{padding:14}}>
          <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", gap:8}}>
            <h3 style={{fontWeight:900}}>Transactions</h3>
            <button className="btn btn-primary btn-sm" onClick={()=>{setEditing(null); setShowForm(true);}}>＋ Add transaction</button>
          </div>
          <div style={{display:"flex", gap:8, marginTop:10, flexWrap:"wrap"}}>
            <input className="input" placeholder="Search description or category…" value={query} onChange={e=>setQuery(e.target.value)} style={{flex:1, minWidth:160}}/>
            <select className="select" value={typeFilter} onChange={e=>setTypeFilter(e.target.value as any)} style={{width:130}}><option value="all">All</option><option value="income">Income</option><option value="expense">Expense</option></select>
            <select className="select" value={catFilter} onChange={e=>setCatFilter(e.target.value)} style={{width:140}}><option value="all">All categories</option>{cats.map(c=> <option key={c} value={c}>{c}</option>)}</select>
          </div>
          <div style={{marginTop:10, border:"1px solid var(--border)", borderRadius:10, overflow:"hidden"}}>
            <div style={{maxHeight:420, overflow:"auto"}}>
              {filtered.map(t=>(
                <div key={t.id} style={{display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderBottom:"1px solid var(--border)"}}>
                  <div style={{width:32,height:32,borderRadius:8, background: t.type==="income"?"#22c55e18":"#ef444418", color: t.type==="income"?"var(--success)":"var(--danger)", display:"grid", placeItems:"center", fontWeight:900}}>{t.type==="income"?"↑":"↓"}</div>
                  <div style={{flex:1, minWidth:0}}>
                    <div style={{fontWeight:700, fontSize:13, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{t.description}</div>
                    <div style={{fontSize:12, color:"var(--text-muted)"}}>{t.category} • {t.date} • <span className="mono">{fmtINR(t.amountPaise)}</span></div>
                  </div>
                  <span className="badge" style={{background: t.type==="income"?"#22c55e18":"var(--bg-elev2)", color: t.type==="income"?"var(--success)":"var(--text)"}}>{t.type}</span>
                  <div style={{display:"flex", gap:6}}>
                    <button className="btn btn-sm btn-ghost" onClick={()=>{setEditing(t); setShowForm(true);}}>Edit</button>
                    <button className="btn btn-sm btn-ghost" style={{color:"var(--danger)"}} onClick={()=>{ if(confirm("Delete transaction?")) deleteTransaction(t.id); }}>Delete</button>
                  </div>
                </div>
              ))}
              {filtered.length===0 && <div style={{padding:14}}><Empty text="No transactions match."/></div>}
            </div>
          </div>
        </div>

        <div style={{display:"flex", flexDirection:"column", gap:12}}>
          <div className="card" style={{padding:14}}>
            <h3 style={{fontWeight:900, fontSize:14}}>Spending breakdown</h3>
            <Donut data={expByCat}/>
          </div>
          <div className="card" style={{padding:14}}>
            <h3 style={{fontWeight:900, fontSize:14}}>Budgets — {month}</h3>
            <div style={{display:"flex", flexDirection:"column", gap:10, marginTop:10}}>
              {budgetRows.map(b=>(
                <div key={b.category} style={{padding:10, borderRadius:10, background:"var(--bg-elev2)", border:"1px solid "+(b.over?"#ef444450":"var(--border)")}}>
                  <div style={{display:"flex", justifyContent:"space-between", fontSize:12, fontWeight:800}}>
                    <span>{b.category}</span><span style={{color: b.over?"var(--danger)":"var(--text-muted)"}}>{fmtINR(b.spent)} / {fmtINR(b.limitPaise)}</span>
                  </div>
                  <div className="progress-track" style={{marginTop:6}}><div className="progress-fill" style={{width: Math.min(100,b.pct)+"%", background: b.over?"var(--danger)": b.pct>80?"var(--warn)":"var(--accent)"}}/></div>
                  <div style={{fontSize:11, color: b.over?"var(--danger)":"var(--text-muted)", marginTop:4, fontWeight:700}}>{b.pct}% {b.over?"• Over budget":""}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showForm && <TxnForm initial={editing} onClose={()=>setShowForm(false)} onSave={(patch)=>{
        if(editing) updateTransaction(editing.id, patch as any);
        else addTransaction({id:uid(), ...patch as any});
        setShowForm(false);
      }}/>}

      <style>{`@media(max-width:1000px){ div[style*="repeat(3,1fr)"]{ grid-template-columns:1fr !important; } div[style*="1.1fr .9fr"]{ grid-template-columns:1fr !important; } }`}</style>
    </div>
  )
}

function TxnForm({initial,onClose,onSave}:{initial:any|null,onClose:()=>void,onSave:(p:any)=>void}){
  const [type,setType]=useState<"income"|"expense">(initial?.type||"expense");
  const [amount,setAmount]=useState(initial? String((initial.amountPaise/100).toFixed(2)):"");
  const [category,setCategory]=useState(initial?.category||"Groceries");
  const [description,setDescription]=useState(initial?.description||"");
  const [date,setDate]=useState(initial?.date||todayISO());
  const [err,setErr]=useState<string|null>(null);
  const categories=["Groceries","Dining","Transport","Shopping","Entertainment","Health","Utilities","Travel","Rent","Salary","Freelance","Investment","Other"];
  return (
    <div role="dialog" aria-modal="true" style={{position:"fixed", inset:0, background:"rgba(0,0,0,.5)", display:"grid", placeItems:"center", zIndex:50, padding:16}}>
      <div className="card" style={{width:"min(520px,100%)", padding:16, animation:"pop .18s ease"}}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}><h3 style={{fontWeight:900}}>{initial?"Edit transaction":"New transaction"}</h3><button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button></div>
        <div style={{display:"flex", flexDirection:"column", gap:10, marginTop:10}}>
          <div style={{display:"flex", gap:8}}>
            <button className={`btn ${type==="expense"?"btn-primary":""}`} onClick={()=>setType("expense")}>Expense</button>
            <button className={`btn ${type==="income"?"btn-primary":""}`} onClick={()=>setType("income")}>Income</button>
          </div>
          <label style={{fontSize:12,fontWeight:700}}>Amount (INR) *<input className="input" inputMode="decimal" placeholder="e.g., 1250.50" value={amount} onChange={e=>setAmount(e.target.value)} /></label>
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10}}>
            <label style={{fontSize:12,fontWeight:700}}>Category
              <select className="select" value={category} onChange={e=>setCategory(e.target.value)}>{categories.map(c=> <option key={c} value={c}>{c}</option>)}</select>
            </label>
            <label style={{fontSize:12,fontWeight:700}}>Date<input className="input" type="date" value={date} onChange={e=>setDate(e.target.value)} /></label>
          </div>
          <label style={{fontSize:12,fontWeight:700}}>Description<input className="input" value={description} onChange={e=>setDescription(e.target.value)} placeholder="What was this for?"/></label>
          {err && <div style={{color:"var(--danger)", fontSize:12, fontWeight:700}}>{err}</div>}
          <div style={{display:"flex", justifyContent:"flex-end", gap:8}}>
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={()=>{
              const n=Number(amount);
              if(!Number.isFinite(n) || n<=0){ setErr("Enter a valid amount > 0"); return; }
              if(n> 10000000){ setErr("Amount too large"); return; }
              const paise=Math.round(n*100);
              if(!description.trim()){ setErr("Description required"); return; }
              onSave({ type, amountPaise:paise, category, description:description.trim(), date });
            }}>Save</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ================= Focus =================
function FocusStudio({onToast}:{onToast:(s:string)=>void}){
  const { state, addFocusSession, upsertFocusSession } = useStore();
  const [focusM,setFocusM]=useState(25);
  const [breakM,setBreakM]=useState(5);
  const [linkedTask,setLinkedTask]=useState<string>("");
  const [mode,setMode]=useState<"focus"|"break">("focus");
  const [running,setRunning]=useState(false);
  const [secondsLeft,setSecondsLeft]=useState(25*60);
  const [sessionId,setSessionId]=useState<string|null>(null);
  const intervalRef=useRef<number|null>(null);
  const totalForMode = (mode==="focus"? focusM: breakM)*60;

  const [ambient, setAmbient] = useState<AmbientSound>("none");
  const [ambientVol, setAmbientVol] = useState<number>(0.5);

  // ambient audio sync with timer and mode
  useEffect(() => {
    if (running && mode === "focus" && ambient !== "none") {
      ambientPlayer.play(ambient, ambientVol);
    } else {
      ambientPlayer.pause();
    }
  }, [running, mode, ambient, ambientVol]);

  // volume updates live
  useEffect(() => {
    ambientPlayer.setVolume(ambientVol);
  }, [ambientVol]);

  // cleanup audio on unmount
  useEffect(() => {
    return () => {
      ambientPlayer.stop();
    };
  }, []);

  // avoid duplicate timers on nav: cleanup on unmount / mode switch
  useEffect(()=>{
    // reset seconds when durations change if not running
    if(!running) setSecondsLeft((mode==="focus"? focusM:breakM)*60);
  },[focusM,breakM,mode, running]);

  useEffect(()=>{
    if(!running){
      if(intervalRef.current) { window.clearInterval(intervalRef.current); intervalRef.current=null; }
      return;
    }
    intervalRef.current = window.setInterval(()=>{
      setSecondsLeft(prev=>{
        if(prev<=1){
          // session complete
          window.clearInterval(intervalRef.current!); intervalRef.current=null;
          setRunning(false);
          const completed = mode==="focus";
          // record session history: focus sessions only count focus completions as history? but track both
          if(sessionId){
            const s=state.focusSessions.find(x=>x.id===sessionId);
            // upsert as completed if focus
            if(completed){
              const taskTitle= linkedTask? state.tasks.find(t=>t.id===linkedTask)?.title : undefined;
              upsertFocusSession({ id:sessionId, startedAt:new Date().toISOString(), durationMinutes: focusM, completed:true, taskId: linkedTask||null, taskTitle: taskTitle||null });
              onToast(`Focus session completed — ${focusM}m`);
              // optional: auto-start break?
            }
          } else if(completed){
            const id=uid();
            const taskTitle= linkedTask? state.tasks.find(t=>t.id===linkedTask)?.title : undefined;
            addFocusSession({ id, startedAt:new Date().toISOString(), durationMinutes:focusM, completed:true, taskId: linkedTask||null, taskTitle: taskTitle||null });
            onToast(`Focus session completed — ${focusM}m`);
          }
          // switch mode
          const nextMode = completed ? "break" : "focus";
          setMode(nextMode);
          const nextSeconds = (nextMode==="focus"? focusM: breakM)*60;
          // do not auto-run next; require user to start
          setTimeout(()=> setSecondsLeft(nextSeconds), 0);
          return 0;
        }
        return prev-1;
      });
    },1000);
    return ()=>{ if(intervalRef.current) window.clearInterval(intervalRef.current); };
  },[running, mode, focusM, breakM, sessionId, state.focusSessions, state.tasks, linkedTask, addFocusSession, upsertFocusSession, onToast]);

  // page visibility: pause silently? we keep timer but ensure not corrupted
  useEffect(()=>{
    const onVis=()=>{ if(document.hidden && running){ /* keep running; interval throttled but okay */ } };
    document.addEventListener("visibilitychange", onVis);
    return ()=> document.removeEventListener("visibilitychange", onVis);
  },[running]);

  useEffect(()=>()=>{ if(intervalRef.current) window.clearInterval(intervalRef.current); },[]);

  const pct = totalForMode? Math.round((1 - secondsLeft/totalForMode)*100):0;
  const mm=Math.floor(secondsLeft/60), ss=secondsLeft%60;

  const focusMinutesTotal = state.focusSessions.filter(s=>s.completed).reduce((a,s)=>a+s.durationMinutes,0);

  return (
    <div style={{display:"flex", flexDirection:"column", gap:12}}>
      <div style={{display:"grid", gridTemplateColumns:"1.1fr .9fr", gap:12}}>
        <div className="card" style={{padding:18, textAlign:"center"}}>
          <div className="badge" style={{background: mode==="focus"?"#7c6cff18":"#22c55e18", color: mode==="focus"?"var(--accent)":"var(--success)", borderColor: mode==="focus"?"#7c6cff30":"#22c55e30"}}>{mode==="focus"?"FOCUS":"BREAK"} • {mode==="focus"? focusM:breakM}m</div>
          <div style={{marginTop:12, display:"grid", placeItems:"center"}}>
            <div style={{position:"relative", width:220, height:220}}>
              <svg width={220} height={220} viewBox="0 0 120 120">
                <circle cx={60} cy={60} r={52} fill="none" stroke="var(--bg-elev2)" strokeWidth={10}/>
                <circle cx={60} cy={60} r={52} fill="none" stroke={mode==="focus"?"var(--accent)":"var(--success)"} strokeWidth={10} strokeLinecap="round"
                  strokeDasharray={`${pct/100*326} 326`} style={{transform:"rotate(-90deg)", transformOrigin:"60px 60px", transition:"stroke-dasharray .4s ease"}}/>
              </svg>
              <div style={{position:"absolute", inset:0, display:"grid", placeItems:"center"}}>
                <div>
                  <div style={{fontSize:44, fontWeight:900, letterSpacing:-.04+"em", fontVariantNumeric:"tabular-nums"}}>{String(mm).padStart(2,"0")}:{String(ss).padStart(2,"0")}</div>
                  <div style={{fontSize:12, color:"var(--text-muted)", fontWeight:700}}>{running?"Running":"Paused"} • {pct}%</div>
                </div>
              </div>
            </div>
          </div>
          <div style={{display:"flex", gap:8, justifyContent:"center", marginTop:12, flexWrap:"wrap"}}>
            {!running ? (
              <button className="btn btn-primary" onClick={()=>{
                if(!running && secondsLeft===totalForMode){
                  const id=uid();
                  setSessionId(id);
                  // create placeholder not completed yet will be upserted on completion
                  // we don't add until completed to avoid double count; but keep id
                }
                setRunning(true);
              }}>▶ Start</button>
            ) : (
              <button className="btn" onClick={()=>setRunning(false)}>⏸ Pause</button>
            )}
            <button className="btn" onClick={()=>{ setRunning(false); setSecondsLeft(totalForMode); }}>↺ Reset</button>
            <button className="btn btn-ghost" onClick={()=>{ setRunning(false); setMode(m=> m==="focus"?"break":"focus"); }}>Switch to {mode==="focus"?"break":"focus"}</button>
          </div>
          <div style={{display:"flex", gap:8, justifyContent:"center", marginTop:12, alignItems:"center", flexWrap:"wrap"}}>
            <span style={{fontSize:12, fontWeight:700, color:"var(--text-muted)"}}>Focus</span>
            <input type="range" min={5} max={60} value={focusM} onChange={e=>setFocusM(Number(e.target.value))} />
            <span className="mono" style={{fontSize:12, fontWeight:800}}>{focusM}m</span>
            <span style={{width:1, height:18, background:"var(--border)", margin:"0 6px"}}/>
            <span style={{fontSize:12, fontWeight:700, color:"var(--text-muted)"}}>Break</span>
            <input type="range" min={3} max={30} value={breakM} onChange={e=>setBreakM(Number(e.target.value))} />
            <span className="mono" style={{fontSize:12,fontWeight:800}}>{breakM}m</span>
          </div>
          <div style={{marginTop:12}}>
            <label style={{fontSize:12,fontWeight:700, color:"var(--text-muted)"}}>Link to task (optional)
              <select className="select" value={linkedTask} onChange={e=>setLinkedTask(e.target.value)} style={{marginTop:6}}>
                <option value="">No task</option>
                {state.tasks.filter(t=>t.status!=="done").slice(0,20).map(t=> <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
            </label>
          </div>
          {/* Ambient Sound Selector */}
          <div style={{marginTop:16, paddingTop:14, borderTop:"1px solid var(--border)", textAlign:"left"}}>
            <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8}}>
              <span style={{fontSize:12, fontWeight:800, color:"var(--text)"}}>🎧 Ambient Sound</span>
              {ambient !== "none" && (
                <span className="badge" style={{background:"var(--accent-elev)", color:"var(--accent)", fontSize:11, padding:"2px 8px"}}>
                  {running && mode === "focus" ? "Playing" : "Ready"}
                </span>
              )}
            </div>

            <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(68px, 1fr))", gap:6}}>
              {SOUND_OPTIONS.map(s => {
                const active = ambient === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setAmbient(s.id)}
                    style={{
                      display:"flex",
                      flexDirection:"column",
                      alignItems:"center",
                      justifyContent:"center",
                      gap:4,
                      padding:"8px 6px",
                      borderRadius:8,
                      border: "1px solid " + (active ? "var(--accent)" : "var(--border)"),
                      background: active ? "var(--bg-elev2)" : "transparent",
                      color: active ? "var(--text)" : "var(--text-muted)",
                      cursor:"pointer",
                      fontSize:11,
                      fontWeight: active ? 800 : 600,
                      transition:"all .15s ease"
                    }}
                  >
                    <span style={{fontSize:16}}>{s.icon}</span>
                    <span>{s.label}</span>
                  </button>
                );
              })}
            </div>

            {ambient !== "none" && (
              <div style={{display:"flex", alignItems:"center", gap:8, marginTop:10}}>
                <span style={{fontSize:11, fontWeight:700, color:"var(--text-muted)"}}>Volume</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={ambientVol}
                  onChange={e => setAmbientVol(Number(e.target.value))}
                  style={{flex:1}}
                />
                <span className="mono" style={{fontSize:11, fontWeight:800, minWidth:32, textAlign:"right"}}>
                  {Math.round(ambientVol * 100)}%
                </span>
              </div>
            )}
          </div>

          <div style={{fontSize:11, color:"var(--text-faint)", marginTop:12}}>Plays automatically when focus timer starts • Pauses on break or pause.</div>
        </div>

        <div style={{display:"flex", flexDirection:"column", gap:12}}>
          <div className="card" style={{padding:14}}>
            <h3 style={{fontWeight:900, fontSize:14}}>Session history</h3>
            <div style={{fontSize:12, color:"var(--text-muted)", marginTop:4}}>Total focus {minutesToHM(focusMinutesTotal)} • {state.focusSessions.filter(s=>s.completed).length} completed</div>
            <div style={{display:"flex", flexDirection:"column", gap:8, marginTop:10, maxHeight:260, overflow:"auto"}}>
              {[...state.focusSessions].sort((a,b)=> b.startedAt.localeCompare(a.startedAt)).slice(0,12).map(s=>(
                <div key={s.id} style={{display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:10, background:"var(--bg-elev2)", border:"1px solid var(--border)"}}>
                  <span className="badge" style={{background: s.completed?"#22c55e18":"#f59e0b18", color: s.completed?"var(--success)":"var(--warn)"}}>{s.completed?"✓":"○"} {s.durationMinutes}m</span>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700, fontSize:13}}>{s.taskTitle || "Unlinked session"}</div>
                    <div style={{fontSize:11, color:"var(--text-muted)"}}>{new Date(s.startedAt).toLocaleString("en-IN")}</div>
                  </div>
                </div>
              ))}
              {state.focusSessions.length===0 && <Empty text="No sessions yet — start the timer."/>}
            </div>
          </div>

          <div className="card" style={{padding:14}}>
            <h3 style={{fontWeight:900, fontSize:14}}>Today's focus by hour (mock)</h3>
            <div style={{display:"flex", alignItems:"end", gap:6, height:90, marginTop:10}}>
              {Array.from({length:8}).map((_,i)=>{
                const h=9+i;
                const isActive = new Date().getHours()===h;
                const v=[20,45,10,60,30,15,40,25][i];
                return <div key={i} style={{flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:6}}>
                  <div style={{width:"100%", height: Math.round(v/60*70)+10, background: isActive?"var(--accent)":"var(--bg-elev2)", border:"1px solid var(--border)", borderRadius:8}}/>
                  <span style={{fontSize:10, color:"var(--text-muted)", fontWeight:700}}>{h}:00</span>
                </div>
              })}
            </div>
          </div>
        </div>
      </div>
      <style>{`@media(max-width:1000px){ div[style*="1.1fr .9fr"]{ grid-template-columns:1fr !important; } }`}</style>
    </div>
  )
}

// ================= Calendar =================
function CalendarView({q}:{q:string}){
  const { state, addEvent, updateEvent, deleteEvent } = useStore();
  const [mode,setMode]=useState<"month"|"week"|"day">("month");
  const [cursor,setCursor]=useState(()=> new Date());
  const [showForm,setShowForm]=useState(false);
  const [editing,setEditing]=useState<CalendarEvent|null>(null);

  const y=cursor.getFullYear(), m=cursor.getMonth();
  const monthStart=new Date(y,m,1), monthEnd=new Date(y,m+1,0);
  const startPad=monthStart.getDay(); // 0 Sun
  const daysInMonth=monthEnd.getDate();

  const eventsByDate = useMemo(()=>{
    const map=new Map<string, CalendarEvent[]>();
    for(const e of state.events){
      if(q && !(e.title+" "+(e.description||"")).toLowerCase().includes(q.toLowerCase())) continue;
      const arr=map.get(e.date)||[]; arr.push(e); map.set(e.date, arr);
    }
    // sort per day
    for(const [k,arr] of map) arr.sort((a,b)=> toMinutes(a.start)-toMinutes(b.start));
    return map;
  },[state.events,q]);

  // conflict detection per day
  const conflicts = useMemo(()=>{
    const set=new Set<string>();
    for(const [date, arr] of eventsByDate){
      for(let i=0;i<arr.length;i++) for(let j=i+1;j<arr.length;j++) if(hasConflict(arr[i],arr[j])){ set.add(arr[i].id); set.add(arr[j].id); }
    }
    return set;
  },[eventsByDate]);

  // week view helpers
  const weekStart = new Date(cursor); weekStart.setDate(cursor.getDate()-cursor.getDay());
  const weekDays = Array.from({length:7}).map((_,i)=>{ const d=new Date(weekStart); d.setDate(weekStart.getDate()+i); return d; });

  return (
    <div style={{display:"flex", flexDirection:"column", gap:12}}>
      <div className="card" style={{padding:12, display:"flex", gap:8, alignItems:"center", flexWrap:"wrap"}}>
        <div style={{display:"flex", gap:6}}>
          <button className={`btn ${mode==="month"?"btn-primary":""}`} onClick={()=>setMode("month")}>Month</button>
          <button className={`btn ${mode==="week"?"btn-primary":""}`} onClick={()=>setMode("week")}>Week</button>
          <button className={`btn ${mode==="day"?"btn-primary":""}`} onClick={()=>setMode("day")}>Day</button>
        </div>
        <div style={{display:"flex", gap:6, alignItems:"center"}}>
          <button className="btn btn-sm" onClick={()=>setCursor(new Date(cursor.getFullYear(), cursor.getMonth()-1,1))}>‹</button>
          <div style={{fontWeight:900, minWidth:140, textAlign:"center"}}>{cursor.toLocaleDateString("en-IN",{month:"long", year:"numeric"})} {mode!=="month" && "• "+cursor.toLocaleDateString("en-IN",{day:"numeric"})}</div>
          <button className="btn btn-sm" onClick={()=>setCursor(new Date(cursor.getFullYear(), cursor.getMonth()+1,1))}>›</button>
          <button className="btn btn-sm btn-ghost" onClick={()=>setCursor(new Date())}>Today</button>
        </div>
        <div style={{marginLeft:"auto", display:"flex", gap:8, alignItems:"center"}}>
          <span className="badge" style={{background:"#ef444418", color:"var(--danger)", borderColor:"#ef444430"}}>● Conflict</span>
          <button className="btn btn-primary btn-sm" onClick={()=>{setEditing(null); setShowForm(true);}}>＋ New event</button>
        </div>
      </div>

      {mode==="month" && (
        <div className="card" style={{overflow:"hidden"}}>
          <div style={{display:"grid", gridTemplateColumns:"repeat(7,1fr)", borderBottom:"1px solid var(--border)", background:"var(--bg-elev2)"}}>
            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d=> <div key={d} style={{padding:"8px 10px", fontSize:11, fontWeight:800, color:"var(--text-muted)", textAlign:"center"}}>{d}</div>)}
          </div>
          <div style={{display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:0}}>
            {Array.from({length: startPad}).map((_,i)=> <div key={"pad"+i} style={{minHeight:110, borderRight:"1px solid var(--border)", borderBottom:"1px solid var(--border)", background:"var(--bg-elev)"}}/>)}
            {Array.from({length: daysInMonth}).map((_,i)=>{
              const day=i+1;
              const iso=new Date(y,m,day).toISOString().slice(0,10);
              const evs=eventsByDate.get(iso)||[];
              const isToday=iso===todayISO();
              const unscheduledTasks = state.tasks.filter(t=> t.dueDate===iso && t.status!=="done" && !state.events.find(e=>e.taskId===t.id));
              return (
                <div key={iso} style={{minHeight:110, padding:8, borderRight:"1px solid var(--border)", borderBottom:"1px solid var(--border)", background: isToday?"rgba(124,108,255,.08)":"var(--card)"}}>
                  <div style={{display:"flex", alignItems:"center", justifyContent:"space-between"}}>
                    <span style={{width:24,height:24,display:"grid",placeItems:"center", borderRadius:99, background: isToday?"var(--accent)":"transparent", color: isToday?"white":"var(--text)", fontWeight:800, fontSize:12}}>{day}</span>
                    {unscheduledTasks.length>0 && <span className="badge" style={{background:"#f59e0b18", color:"var(--warn)", borderColor:"#f59e0b30"}}>{unscheduledTasks.length} tasks</span>}
                  </div>
                  <div style={{display:"flex", flexDirection:"column", gap:4, marginTop:6}}>
                    {evs.slice(0,3).map(e=>(
                      <button key={e.id} onClick={()=>{setEditing(e); setShowForm(true);}} style={{textAlign:"left", padding:"4px 6px", borderRadius:7, border:"1px solid "+(conflicts.has(e.id)?"#ef444450":e.color+"40"), background: conflicts.has(e.id)?"#ef444418": e.color+"18", fontSize:11, fontWeight:700, color:"var(--text)", cursor:"pointer"}}>
                        {e.start} {e.title}
                      </button>
                    ))}
                    {evs.length>3 && <div style={{fontSize:11, color:"var(--text-muted)", fontWeight:700}}>+{evs.length-3} more</div>}
                    {unscheduledTasks.slice(0,1).map(t=> <div key={t.id} style={{fontSize:11, color:"var(--text-muted)", border:"1px dashed var(--border)", borderRadius:7, padding:"3px 6px"}}>○ {t.title}</div>)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {mode==="week" && (
        <div className="card" style={{overflow:"hidden"}}>
          <div style={{display:"grid", gridTemplateColumns:"70px repeat(7,1fr)", borderBottom:"1px solid var(--border)", background:"var(--bg-elev2)"}}>
            <div style={{padding:8, fontSize:11, fontWeight:800, color:"var(--text-muted)"}}></div>
            {weekDays.map(d=> <div key={d.toISOString()} style={{padding:8, textAlign:"center", fontSize:12, fontWeight:800, color: d.toISOString().slice(0,10)===todayISO()?"var(--accent)":"var(--text-muted)"}}>{d.toLocaleDateString("en-IN",{weekday:"short"})} {d.getDate()}</div>)}
          </div>
          <div style={{display:"grid", gridTemplateColumns:"70px repeat(7,1fr)"}}>
            <div style={{borderRight:"1px solid var(--border)"}}>
              {Array.from({length:13}).map((_,i)=>{
                const h=7+i;
                return <div key={h} style={{height:48, padding:"6px 8px", fontSize:11, color:"var(--text-muted)", borderBottom:"1px solid var(--border)"}}>{String(h).padStart(2,"0")}:00</div>
              })}
            </div>
            {weekDays.map(d=>{
              const iso=d.toISOString().slice(0,10);
              const evs=eventsByDate.get(iso)||[];
              return (
                <div key={iso} style={{position:"relative", borderRight:"1px solid var(--border)", background: iso===todayISO()?"rgba(124,108,255,.05)":"transparent"}}>
                  {Array.from({length:13}).map((_,i)=> <div key={i} style={{height:48, borderBottom:"1px solid var(--border)"}}/>)}
                  {evs.map(e=>{
                    const top=(toMinutes(e.start)-7*60)/60*48;
                    const h=(toMinutes(e.end)-toMinutes(e.start))/60*48;
                    if(top<0 || top> 600) return null;
                    return (
                      <button key={e.id} onClick={()=>{setEditing(e); setShowForm(true);}} style={{position:"absolute", left:4, right:4, top: Math.max(0,top), height: Math.max(22,h), background: conflicts.has(e.id)?"#ef4444":e.color, color:"white", borderRadius:8, padding:"4px 6px", fontSize:11, fontWeight:800, textAlign:"left", border:"1px solid rgba(0,0,0,.1)", cursor:"pointer", overflow:"hidden"}}>
                        {e.title} • {e.start}
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {mode==="day" && (
        <div className="card" style={{padding:12}}>
          <h3 style={{fontWeight:900}}>{cursor.toLocaleDateString("en-IN",{weekday:"long", day:"numeric", month:"long", year:"numeric"})}</h3>
          <div style={{display:"flex", flexDirection:"column", gap:8, marginTop:10}}>
            {(eventsByDate.get(cursor.toISOString().slice(0,10))||[]).map(e=>(
              <div key={e.id} style={{display:"flex", gap:10, padding:12, borderRadius:12, border:"1px solid "+(conflicts.has(e.id)?"#ef444450":"var(--border)"), background: conflicts.has(e.id)?"#ef444418":"var(--bg-elev2)"}}>
                <div style={{width:4, borderRadius:99, background:e.color}}/>
                <div style={{flex:1}}>
                  <div style={{fontWeight:800, fontSize:13}}>{e.title} <span className="badge" style={{marginLeft:6}}>{e.start}–{e.end}</span> {conflicts.has(e.id) && <span className="badge" style={{background:"#ef444418", color:"var(--danger)"}}>Conflict</span>}</div>
                  {e.description && <div style={{fontSize:12, color:"var(--text-muted)", marginTop:2}}>{e.description}</div>}
                </div>
                <div style={{display:"flex", gap:6}}>
                  <button className="btn btn-sm btn-ghost" onClick={()=>{setEditing(e); setShowForm(true);}}>Edit</button>
                  <button className="btn btn-sm btn-ghost" style={{color:"var(--danger)"}} onClick={()=>{ if(confirm("Delete event?")) deleteEvent(e.id); }}>Delete</button>
                </div>
              </div>
            ))}
            {(eventsByDate.get(cursor.toISOString().slice(0,10))||[]).length===0 && <Empty text="No events this day — add one or drag a task here."/>}
            <div style={{marginTop:8}}>
              <div style={{fontSize:12,fontWeight:800, color:"var(--text-muted)"}}>Unscheduled tasks due this day</div>
              <div style={{display:"flex", flexDirection:"column", gap:6, marginTop:6}}>
                {state.tasks.filter(t=> t.dueDate===cursor.toISOString().slice(0,10) && t.status!=="done").map(t=>(
                  <div key={t.id} style={{display:"flex", alignItems:"center", gap:8, padding:"8px 10px", borderRadius:10, background:"var(--bg-elev2)", border:"1px dashed var(--border)"}}>
                    <span style={{width:7,height:7,borderRadius:99, background:priorityColor[t.priority]}}/> <span style={{fontSize:13, fontWeight:600}}>{t.title}</span> <span className="badge" style={{marginLeft:"auto"}}>{t.category}</span>
                    <button className="btn btn-sm" onClick={()=>{setEditing({id:"", title:t.title, date:cursor.toISOString().slice(0,10), start:"10:00", end:"11:00", color:"#7c6cff", taskId:t.id} as any); setShowForm(true);}}>Schedule</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {showForm && <EventForm initial={editing} conflicts={conflicts} onClose={()=>setShowForm(false)} onSave={(patch)=>{
        if(editing && editing.id){ updateEvent(editing.id, patch as any); }
        else { addEvent({id:uid(), ...patch as any}); }
        setShowForm(false);
      }} onDelete={(id)=>{ deleteEvent(id); setShowForm(false); }}/>}
    </div>
  )
}

function EventForm({initial, onClose, onSave, onDelete, conflicts}:{initial:CalendarEvent|null, onClose:()=>void, onSave:(p:Partial<CalendarEvent>)=>void, onDelete:(id:string)=>void, conflicts:Set<string>}){
  const { state } = useStore();
  const [title,setTitle]=useState(initial?.title||"");
  const [date,setDate]=useState(initial?.date|| todayISO());
  const [start,setStart]=useState(initial?.start||"10:00");
  const [end,setEnd]=useState(initial?.end||"11:00");
  const [color,setColor]=useState(initial?.color||"#7c6cff");
  const [description,setDescription]=useState(initial?.description||"");
  const [taskId,setTaskId]=useState(initial?.taskId||"");
  const [err,setErr]=useState<string|null>(null);

  const previewConflict = useMemo(()=>{
    const others=state.events.filter(e=> e.id!== initial?.id && e.date===date);
    return others.some(o=> hasConflict({start,end},{start:o.start,end:o.end}));
  },[state.events, initial, date, start, end]);

  return (
    <div role="dialog" aria-modal="true" style={{position:"fixed", inset:0, background:"rgba(0,0,0,.5)", display:"grid", placeItems:"center", zIndex:50, padding:16}}>
      <div className="card" style={{width:"min(560px,100%)", padding:16, animation:"pop .18s ease"}}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}><h3 style={{fontWeight:900}}>{initial?.id?"Edit event":"New event"}</h3><button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button></div>
        <div style={{display:"flex", flexDirection:"column", gap:10, marginTop:10}}>
          <label style={{fontSize:12,fontWeight:700}}>Title *<input className="input" value={title} onChange={e=>setTitle(e.target.value)} placeholder="Event title"/></label>
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10}}>
            <label style={{fontSize:12,fontWeight:700}}>Date<input className="input" type="date" value={date} onChange={e=>setDate(e.target.value)} /></label>
            <label style={{fontSize:12,fontWeight:700}}>Start<input className="input" type="time" value={start} onChange={e=>setStart(e.target.value)} /></label>
            <label style={{fontSize:12,fontWeight:700}}>End<input className="input" type="time" value={end} onChange={e=>setEnd(e.target.value)} /></label>
          </div>
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10}}>
            <label style={{fontSize:12,fontWeight:700}}>Color<input className="input" type="color" value={color} onChange={e=>setColor(e.target.value)} /></label>
            <label style={{fontSize:12,fontWeight:700}}>Link task
              <select className="select" value={taskId||""} onChange={e=>setTaskId(e.target.value)}><option value="">No task</option>{state.tasks.slice(0,30).map(t=> <option key={t.id} value={t.id}>{t.title}</option>)}</select>
            </label>
          </div>
          <label style={{fontSize:12,fontWeight:700}}>Description<textarea className="textarea" value={description} onChange={e=>setDescription(e.target.value)} placeholder="Details"/></label>
          {previewConflict && <div style={{padding:8, borderRadius:8, background:"#ef444418", border:"1px solid #ef444430", color:"var(--danger)", fontSize:12, fontWeight:700}}>⚠ Time conflicts with another event on {date}.</div>}
          {conflicts.has(initial?.id||"") && <div style={{fontSize:11,color:"var(--danger)", fontWeight:700}}>This event currently conflicts with another.</div>}
          {err && <div style={{color:"var(--danger)", fontSize:12, fontWeight:700}}>{err}</div>}
          <div style={{display:"flex", gap:8, justifyContent:"space-between", marginTop:4}}>
            <div>{initial?.id && <button className="btn" style={{color:"var(--danger)"}} onClick={()=>{ if(confirm("Delete event?")) onDelete(initial.id); }}>Delete</button>}</div>
            <div style={{display:"flex", gap:8}}>
              <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" onClick={()=>{
                if(!title.trim()){ setErr("Title required"); return; }
                if(toMinutes(end)<=toMinutes(start)){ setErr("End must be after start"); return; }
                onSave({ title:title.trim(), date, start, end, color, description:description.trim()||undefined, taskId: taskId||null });
              }}>Save event</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ================= Goals =================
function Goals({q}:{q:string}){
  const { state, addGoal, updateGoal, deleteGoal, toggleMilestone } = useStore();
  const [query,setQuery]=useState("");
  const [showForm,setShowForm]=useState(false);
  const [editing,setEditing]=useState<any>(null);
  const combinedQ=(q+" "+query).trim().toLowerCase();
  const filtered = useMemo(()=> state.goals.filter(g=> !combinedQ || (g.title+" "+g.description).toLowerCase().includes(combinedQ)),[state.goals, combinedQ]);

  return (
    <div style={{display:"flex", flexDirection:"column", gap:12}}>
      <div className="card" style={{padding:12, display:"flex", gap:8, alignItems:"center"}}>
        <input className="input" placeholder="Search goals…" value={query} onChange={e=>setQuery(e.target.value)} style={{flex:1}}/>
        <button className="btn btn-primary" onClick={()=>{setEditing(null); setShowForm(true);}}>＋ New goal</button>
      </div>

      <div style={{display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:12}}>
        {filtered.map(g=>{
          const done=g.milestones.filter(m=>m.completed).length;
          const pctMilestone = g.milestones.length? Math.round(done/g.milestones.length*100):0;
          const pctTarget = g.targetValue? Math.min(100, Math.round((g.currentValue||0)/g.targetValue*100)): pctMilestone;
          const pct = g.targetValue? pctTarget : pctMilestone;
          const overdueMilestones=g.milestones.filter(m=> !m.completed && m.dueDate && new Date(m.dueDate+"T23:59:59") < new Date());
          const isOverdue = new Date(g.deadline+"T23:59:59") < new Date() && pct<100;
          const linkedTasks=state.tasks.filter(t=> t.goalId===g.id);
          const linkedDone=linkedTasks.filter(t=>t.status==="done").length;
          return (
            <div key={g.id} className="card" style={{padding:14, position:"relative", overflow:"hidden"}}>
              <div style={{position:"absolute", inset:0, background:`radial-gradient(400px 160px at 0% 0%, ${g.color}14, transparent 60%)`}}/>
              <div style={{position:"relative"}}>
                <div style={{display:"flex", gap:10, alignItems:"center"}}>
                  <div style={{width:36,height:36,borderRadius:10, background:g.color, display:"grid", placeItems:"center", color:"white", fontWeight:900}}>⬢</div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:900, fontSize:14}}>{g.title}</div>
                    <div style={{fontSize:12, color:"var(--text-muted)"}}>Due {g.deadline} {isOverdue && <span className="badge" style={{background:"#ef444418", color:"var(--danger)"}}>Overdue</span>}</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontWeight:900, fontSize:18}}>{pct}%</div>
                    <div style={{fontSize:11, color:"var(--text-muted)", fontWeight:700}}>{done}/{g.milestones.length} milestones</div>
                  </div>
                </div>
                <div style={{fontSize:12, color:"var(--text-muted)", marginTop:8, lineHeight:1.5}}>{g.description}</div>
                <div className="progress-track" style={{marginTop:10}}><div className="progress-fill" style={{width:pct+"%", background:g.color}}/></div>
                {g.targetValue!==null && g.targetValue!==undefined && (
                  <div style={{fontSize:11, color:"var(--text-muted)", marginTop:6, fontWeight:700}}>
                    Measurable: {fmtINR(g.unit==="paise"? (g.currentValue||0): 0)} / {g.unit==="paise"? fmtINR(g.targetValue): g.targetValue+" "+(g.unit||"")}
                    {/* paise formatting only when needed */}
                  </div>
                )}
                {linkedTasks.length>0 && <div style={{fontSize:11, color:"var(--text-muted)", marginTop:6, fontWeight:700}}>Tasks: {linkedDone}/{linkedTasks.length} completed</div>}
                {overdueMilestones.length>0 && <div style={{marginTop:8, padding:"6px 8px", borderRadius:8, background:"#ef444418", border:"1px solid #ef444430", color:"var(--danger)", fontSize:12, fontWeight:700}}>⚠ {overdueMilestones.length} overdue milestone(s): {overdueMilestones.map(m=>m.title).join(", ")}</div>}

                <div style={{marginTop:10, display:"flex", flexDirection:"column", gap:6}}>
                  {g.milestones.map(ms=>(
                    <label key={ms.id} style={{display:"flex", alignItems:"center", gap:8, padding:"8px 10px", borderRadius:10, background:"var(--bg-elev2)", border:"1px solid var(--border)", cursor:"pointer"}}>
                      <input type="checkbox" checked={ms.completed} onChange={()=>toggleMilestone(g.id, ms.id)} />
                      <span style={{flex:1, fontSize:13, fontWeight:600, textDecoration: ms.completed?"line-through":"none", opacity: ms.completed?0.6:1}}>{ms.title}</span>
                      {ms.dueDate && <span className="badge" style={{background: !ms.completed && ms.dueDate && new Date(ms.dueDate+"T23:59:59")<new Date() ? "#ef444418":"var(--bg-elev)", color: !ms.completed && ms.dueDate && new Date(ms.dueDate+"T23:59:59")<new Date() ? "var(--danger)":"var(--text-muted)"}}>{ms.dueDate}</span>}
                    </label>
                  ))}
                </div>
                <div style={{display:"flex", gap:6, marginTop:10}}>
                  <button className="btn btn-sm btn-ghost" onClick={()=>{setEditing(g); setShowForm(true);}}>Edit</button>
                  <button className="btn btn-sm btn-ghost" style={{color:"var(--danger)"}} onClick={()=>{ if(confirm(`Delete goal “${g.title}”?`)) deleteGoal(g.id); }}>Delete</button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      {filtered.length===0 && <div className="card" style={{padding:16}}><Empty text="No goals found."/></div>}

      {showForm && <GoalForm initial={editing} onClose={()=>setShowForm(false)} onSave={(patch)=>{
        if(editing) updateGoal(editing.id, patch as any);
        else addGoal({id:uid(), createdAt:todayISO(), ...patch as any});
        setShowForm(false);
      }}/>}

      <style>{`@media(max-width:900px){ div[style*="repeat(2,1fr)"]{ grid-template-columns:1fr !important; } }`}</style>
    </div>
  )
}

function GoalForm({initial,onClose,onSave}:{initial:any|null,onClose:()=>void,onSave:(p:any)=>void}){
  const [title,setTitle]=useState(initial?.title||"");
  const [description,setDescription]=useState(initial?.description||"");
  const [deadline,setDeadline]=useState(initial?.deadline|| todayISO());
  const [color,setColor]=useState(initial?.color||"#7c6cff");
  const [milestones,setMilestones]=useState<{id:string,title:string,completed:boolean,dueDate:string}[]>(initial?.milestones?.map((m:any)=>({id:m.id,title:m.title,completed:m.completed,dueDate:m.dueDate||""})) || [{id:uid(),title:"",completed:false,dueDate:""}]);
  const [targetValue,setTargetValue]=useState(initial?.targetValue? String(initial.targetValue):"");
  const [currentValue,setCurrentValue]=useState(initial?.currentValue? String(initial.currentValue):"");
  const [unit,setUnit]=useState(initial?.unit||"");
  const [err,setErr]=useState<string|null>(null);
  return (
    <div role="dialog" aria-modal="true" style={{position:"fixed", inset:0, background:"rgba(0,0,0,.5)", display:"grid", placeItems:"center", zIndex:50, padding:16}}>
      <div className="card" style={{width:"min(640px,100%)", padding:16, animation:"pop .18s ease", maxHeight:"90vh", overflow:"auto"}}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}><h3 style={{fontWeight:900}}>{initial?"Edit goal":"New goal"}</h3><button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button></div>
        <div style={{display:"flex", flexDirection:"column", gap:10, marginTop:10}}>
          <label style={{fontSize:12,fontWeight:700}}>Title *<input className="input" value={title} onChange={e=>setTitle(e.target.value)} /></label>
          <label style={{fontSize:12,fontWeight:700}}>Description<textarea className="textarea" value={description} onChange={e=>setDescription(e.target.value)} /></label>
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10}}>
            <label style={{fontSize:12,fontWeight:700}}>Deadline<input className="input" type="date" value={deadline} onChange={e=>setDeadline(e.target.value)} /></label>
            <label style={{fontSize:12,fontWeight:700}}>Color<input className="input" type="color" value={color} onChange={e=>setColor(e.target.value)} /></label>
          </div>
          <div style={{padding:10, borderRadius:10, background:"var(--bg-elev2)", border:"1px solid var(--border)"}}>
            <div style={{fontSize:12,fontWeight:800}}>Measurable target (optional)</div>
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginTop:8}}>
              <input className="input" placeholder="Target value (e.g., 100)" value={targetValue} onChange={e=>setTargetValue(e.target.value)} />
              <input className="input" placeholder="Current value" value={currentValue} onChange={e=>setCurrentValue(e.target.value)} />
              <input className="input" placeholder="Unit (km, paise, books…)" value={unit} onChange={e=>setUnit(e.target.value)} />
            </div>
            <div style={{fontSize:11, color:"var(--text-muted)", marginTop:6}}>If set, progress derives from current/target instead of milestones. Leave blank to use milestones.</div>
          </div>
          <div>
            <div style={{fontSize:12,fontWeight:800, display:"flex", alignItems:"center", justifyContent:"space-between"}}>Milestones <button className="btn btn-sm" onClick={()=>setMilestones(m=>[...m,{id:uid(),title:"",completed:false,dueDate:""}])}>＋ Add</button></div>
            <div style={{display:"flex", flexDirection:"column", gap:8, marginTop:8}}>
              {milestones.map((ms,idx)=>(
                <div key={ms.id} style={{display:"flex", gap:8, alignItems:"center"}}>
                  <input className="input" placeholder="Milestone title" value={ms.title} onChange={e=> setMilestones(arr=> arr.map((x,i)=> i===idx? {...x,title:e.target.value}:x))} style={{flex:1}}/>
                  <input className="input" type="date" value={ms.dueDate} onChange={e=> setMilestones(arr=> arr.map((x,i)=> i===idx? {...x,dueDate:e.target.value}:x))} style={{width:160}}/>
                  <button className="btn btn-sm btn-ghost" style={{color:"var(--danger)"}} onClick={()=> setMilestones(arr=> arr.filter((_,i)=>i!==idx))}>✕</button>
                </div>
              ))}
            </div>
          </div>
          {err && <div style={{color:"var(--danger)", fontSize:12, fontWeight:700}}>{err}</div>}
          <div style={{display:"flex", justifyContent:"flex-end", gap:8}}>
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={()=>{
              if(!title.trim()){ setErr("Title required"); return; }
              const clean=milestones.filter(m=> m.title.trim()).map(m=>({id:m.id,title:m.title.trim(),completed:m.completed,dueDate:m.dueDate||null}));
              if(clean.length===0){ setErr("Add at least one milestone"); return; }
              const tv=targetValue? Number(targetValue): null;
              const cv=currentValue? Number(currentValue): null;
              if(targetValue && !Number.isFinite(tv as number)){ setErr("Target must be a number"); return; }
              onSave({ title:title.trim(), description:description.trim(), deadline, color, milestones:clean, targetValue: tv, currentValue: cv, unit: unit||null });
            }}>Save goal</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ================= Shared bits =================
function Empty({text, actionLabel, onAction}:{text:string, actionLabel?:string, onAction?:()=>void}){
  return <div style={{padding:14, borderRadius:10, background:"var(--bg-elev2)", border:"1px dashed var(--border)", textAlign:"center", color:"var(--text-muted)", fontSize:13, fontWeight:600}}>
    {text} {actionLabel && onAction && <button className="btn btn-sm" style={{marginLeft:8}} onClick={onAction}>{actionLabel}</button>}
  </div>
}

function CommandPalette({onClose,onNav}:{onClose:()=>void,onNav:(v:string)=>void}){
  const { state } = useStore();
  const [q,setQ]=useState("");
  const [idx,setIdx]=useState(0);
  const items = useMemo(()=>{
    const base = [
      ...nav.map(n=>({label:`Go to ${n.label}`, sub:"Navigation", module:n.id})),
      ...state.tasks.map(t=>({label: t.title, sub:`Task • ${t.category} • ${t.status}`, module:"tasks"})),
      ...state.habits.map(h=>({label: h.name, sub:`Habit • ${h.category}`, module:"habits"})),
      ...state.goals.map(g=>({label:g.title, sub:"Goal", module:"goals"})),
      ...state.events.map(e=>({label:e.title, sub:`Event • ${e.date} ${e.start}–${e.end}`, module:"calendar"})),
    ];
    const s=q.trim().toLowerCase();
    if(!s) return base.slice(0,12);
    return base.filter(i=> (i.label+" "+i.sub).toLowerCase().includes(s));
  },[state.tasks,state.habits,state.goals,state.events,q]);
  const active = Math.max(0, Math.min(idx, items.length-1));
  const inputRef=useRef<HTMLInputElement>(null);
  useEffect(()=>{ inputRef.current?.focus(); setIdx(0); },[]);
  const onKey=(e:React.KeyboardEvent)=>{
    if(e.key==="Escape"){ onClose(); return; }
    if(e.key==="ArrowDown"){ e.preventDefault(); setIdx(i=> (i+1)%Math.max(1,items.length)); }
    if(e.key==="ArrowUp"){ e.preventDefault(); setIdx(i=> (i-1+Math.max(1,items.length))%Math.max(1,items.length)); }
    if(e.key==="Enter"){ e.preventDefault(); const it=items[active]; if(it){ onNav(it.module); onClose(); } }
  };
  const activate=(it:{module:string})=>{ onNav(it.module); onClose(); };
  return (
    <div role="dialog" aria-modal="true" onClick={onClose} style={{position:"fixed", inset:0, background:"rgba(0,0,0,.45)", display:"grid", placeItems:"start center", paddingTop:"18vh", zIndex:60}}>
      <div onClick={e=>e.stopPropagation()} className="card" style={{width:"min(560px, 92vw)", overflow:"hidden", animation:"pop .16s ease"}}>
        <div style={{display:"flex", alignItems:"center", gap:8, padding:"10px 12px", borderBottom:"1px solid var(--border)"}}>
          <span style={{opacity:.6}}>⌘</span>
          <input ref={inputRef} className="input" placeholder="Type to search — tasks, habits, goals, events, pages…" value={q} onChange={e=>setQ(e.target.value)} onKeyDown={onKey} style={{border:"none", background:"transparent", padding:0, boxShadow:"none", flex:1}}/>
          <span className="kbd">ESC</span>
        </div>
        <div style={{maxHeight:360, overflow:"auto", padding:8, display:"flex", flexDirection:"column", gap:6}}>
          {items.map((it,i)=>(
            <button key={i} onClick={()=>{setIdx(i); activate(it);}} onKeyDown={onKey} style={{textAlign:"left", padding:"10px 12px", borderRadius:10, border:"1px solid var(--border)", background: i===active?"var(--accent)":"var(--bg-elev)", color: i===active?"white":"var(--text)", cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center"}}>
              <div>
                <span style={{fontWeight:700, fontSize:13}}>{it.label}</span>
                <span style={{fontSize:11, color: i===active?"rgba(255,255,255,.8)":"var(--text-muted)", fontWeight:700, display:"block", marginTop:2}}>{it.sub}</span>
              </div>
              <span className="kbd" style={{opacity: i===active?1:.5}}>↵</span>
            </button>
          ))}
          {items.length===0 && <div style={{padding:14}}><Empty text="No results."/></div>}
        </div>
        <div style={{padding:"8px 12px", borderTop:"1px solid var(--border)", fontSize:11, color:"var(--text-muted)", display:"flex", justifyContent:"space-between"}}>
          <span>↑↓ Navigate • Enter Select</span><span>Ctrl+K to toggle</span>
        </div>
      </div>
    </div>
  )
}
