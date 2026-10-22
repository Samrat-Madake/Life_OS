export const fmtINR = (paise:number)=> new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:2}).format(paise/100);
export const fmtDate = (iso:string)=> new Date(iso+"T12:00:00").toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"});
export const isOverdue = (due:string|null)=> {
  if(!due) return false;
  const d=new Date(due+"T23:59:59"); return d < new Date() && d.toDateString()!== new Date().toDateString();
};
export const todayISO = ()=> new Date().toISOString().slice(0,10);
export function minutesToHM(m:number){ const h=Math.floor(m/60), mm=m%60; return h?`${h}h ${mm}m`:`${mm}m`; }
export function groupBy<T>(arr:T[], fn:(x:T)=>string){ const m=new Map<string,T[]>(); for(const x of arr){ const k=fn(x); const a=m.get(k)??[]; a.push(x); m.set(k,a);} return m; }
export function uid(){ return Math.random().toString(36).slice(2,9) }
export function toMinutes(t:string){ const [h,m]=t.split(":").map(Number); return h*60+m; }
export function hasConflict(a:{start:string;end:string}, b:{start:string;end:string}){ return !(toMinutes(a.end)<=toMinutes(b.start) || toMinutes(b.end)<=toMinutes(a.start)); }
export function streakForHabit(logDates:string[], frequency:string){
  if(!logDates.length) return {current:0,longest:0};
  const set=new Set(logDates);
  const sorted=[...set].sort();
  // longest
  let longest=0, cur=0; let prev: string| null=null;
  const isExpected=(dateStr:string, prevStr:string|null)=>{
    if(frequency==="daily") return true; // simple streak daily
    if(frequency==="weekdays"){ const d=new Date(dateStr+"T12:00:00"); const day=d.getDay(); return day!==0&&day!==6; }
    return true;
  };
  // longest: count consecutive days present (ignoring frequency nuance for simplicity but weekdays skip weekends)
  // compute by scanning sorted
  let run=1; for(let i=1;i<sorted.length;i++){
    const a=new Date(sorted[i-1]+"T12:00:00"), b=new Date(sorted[i]+"T12:00:00");
    const diff=(+b - +a)/86400000;
    if(frequency==="weekdays"){
      // allow gap over weekend
      if(diff===1 || (diff===3 && a.getDay()===5) || (diff===2 && a.getDay()===5) || (diff===2 && a.getDay()===6) ) run++;
      else if(diff===1) run++; else run=1;
    } else if(diff===1) run++; else run=1;
    longest=Math.max(longest,run);
  }
  longest=Math.max(longest,run, sorted.length?1:0);
  // current: count back from today
  let curStreak=0; let d=new Date(); d.setHours(12,0,0,0);
  for(let k=0;k<365;k++){
    const iso=d.toISOString().slice(0,10);
    if(set.has(iso)) curStreak++;
    else {
      if(frequency==="weekdays"){ const day=d.getDay(); if(day===0||day===6){ d.setDate(d.getDate()-1); continue; } }
      // weekly: current streak logic: if not daily, still break if missing
      // For weekly with target, we approximate: break only if no log this week? Simplify: break on miss
      break;
    }
    d.setDate(d.getDate()-1);
  }
  return {current:curStreak, longest};
}
