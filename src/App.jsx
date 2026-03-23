import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "./supabase.js";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid, PieChart, Pie, Cell } from "recharts";

const NAVY="#1e3a5f",GOLD="#d4a017",BLUE="#29ABE2";
const CC=[NAVY,GOLD,BLUE,"#22c55e","#f97316","#8b5cf6","#ec4899","#14b8a6","#ef4444","#64748b"];

const CAMP_NAMES=["2s PScamp","3s PScamp","4s & 5s","Kinder Camp","Safety Stars","Adventure","Fun and Games","Grove","Sports Camp","Cycle and Surf","Xtreme Teens","Star Makers","Broadway Bound","Dance","CIT","Camp Connection","Post Camp"];
const CAMP_DISPLAY={"2s PScamp":"Preschool 2s","3s PScamp":"Preschool 3s","4s & 5s":"Preschool 4s & 5s","Kinder Camp":"Kinder Camp","Safety Stars":"Safety Stars","Adventure":"Adventure","Fun and Games":"Fun & Games","Grove":"Grove","Sports Camp":"Sports Camp","Cycle and Surf":"Cycle & Surf","Xtreme Teens":"Xtreme Teens","Star Makers":"Star Makers","Broadway Bound":"Broadway Bound","Dance":"Dance","CIT":"CIT","Camp Connection":"Camp Connection","Post Camp":"Post Camp"};
const CAMP_YEARS=Array.from({length:16},(_,i)=>2017+i);
const CB_SITES=["Country Meadows","Ivy Hall","Kildeer","Kilmer","Longfellow","Meridian","Prairie","Pritchett","Tripp","Willow Grove"];
const CB_MONTHS=["August","September","October","November","December","January","February","March","April","May"];
const CB_YEARS=Array.from({length:16},(_,i)=>2017+i);
const FY_LIST=["2017/18","2018/19","2019/20","2020/21","2021/22","2022/23","2023/24","2024/25","2025/26","2026/27","2027/28","2028/29","2029/30","2030/31","2031/32"];
const FY_MONTHS=["May","June","July","August","September","October","November","December","January","February","March","April"];
const REC_PL_CATS=["Rentals - All","Concessions","WSP - User Fees","Aquatics","SNP - User Fees","Golf Dome","Adult General","Adult Sports","Camps","Performing Arts","Seniors","Youth General","Youth Sports","Special Events","Tot and Child"];
const REC_REV_CATS=["Overall Revenue","Rentals - All","Concessions","WSP - User Fees","Aquatics","Golf Dome","Adult General","Adult Sports","Camps","Performing Arts","Seniors","Youth General","Youth Sports","Special Events","Tot and Child"];
const REC_EXP_CATS=["Personnel","Contractual Services","Commodities","Utilities","Rentals"];
const FIT_REV_CATS=["Overall Revenue","Memberships","Personal Training","Specialty Programs"];
const FIT_EXP_CATS=["Personnel","Contractual Services","Commodities","Utilities","Personal Training","Specialty Programs"];
const FIT_PL_CATS=["Personal Training","Specialty Programs"];
const FIT_KPI_METRICS=["Active Members","New Members","Cancellations","Member Visits","Group Ex Numbers","Personal Training","Reformer Training"];
const CAMP_EXP_FIELDS=[["instructor","Instructor"],["supplies","Supplies"],["contractual","Contractual"],["rentals","Rentals"],["tickets","Tickets/Admission"],["expense_total","Total Expenses"]];

const dollar=v=>!v&&v!==0?"—":v<0?`($${Math.abs(Math.round(v)).toLocaleString()})`:`$${Math.round(v).toLocaleString()}`;
const pct=v=>v==null?"—":`${(v*100).toFixed(1)}%`;
const num=v=>v==null?"—":Math.round(v).toLocaleString();
const tc=v=>v>0?"#16a34a":v<0?"#dc2626":"#94a3b8";
const plPct=(pl,rev)=>rev&&rev>0?pct(pl/rev):"—";

// ── Login screen ──────────────────────────────────────────────────────────────
const APPROVED_NAMES=["joe zimmermann","erika strojinc","tim beckmann","dan stanczak","amanda busch","mike terson","chuck burgess","chris eckert","brian o'malley","diana clayson"];
function LoginScreen({onLogin}){
  const [name,setName]=useState("");
  const [err,setErr]=useState(false);
  function attempt(){
    if(APPROVED_NAMES.includes(name.trim().toLowerCase())){onLogin(name.trim());}
    else{setErr(true);setTimeout(()=>setErr(false),2500);}
  }
  return(
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{background:`linear-gradient(135deg,${NAVY} 0%,#0d2240 100%)`}}>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8 gap-3">
          <Logo size={64}/>
          <div className="text-center">
            <div className="text-white font-bold text-xl">Buffalo Grove Park District</div>
            <div className="text-xs font-semibold tracking-widest uppercase mt-1" style={{color:BLUE}}>Rec Funds Dashboard</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-5">
          <div>
            <div className="font-bold text-slate-800 text-base mb-1">Welcome</div>
            <div className="text-xs text-slate-400">Enter your name to continue</div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Your Name</label>
            <input type="text" value={name} onChange={e=>setName(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&attempt()}
              className={`w-full rounded-lg border px-4 py-3 text-sm focus:outline-none focus:ring-2 transition ${err?"border-red-400 focus:ring-red-300 bg-red-50":"border-slate-200 focus:ring-blue-300"}`}
              placeholder="First and last name" autoFocus/>
            {err&&<div className="text-xs text-red-500 mt-1.5 font-medium">Name not recognized. Please check the spelling and try again.</div>}
          </div>
          <button onClick={attempt} className="w-full py-3 rounded-xl font-bold text-white text-sm transition hover:opacity-90 active:scale-95" style={{background:NAVY}}>
            Sign In
          </button>
        </div>
        <div className="text-center mt-6 text-xs text-white/30">Buffalo Grove Park District · Rec Funds</div>
      </div>
    </div>
  );
}

// ── Shared UI ─────────────────────────────────────────────────────────────────
function Logo({size=48}){return(<svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="44" fill="none" stroke="#29ABE2" strokeWidth="6"/><circle cx="50" cy="50" r="38" fill="none" stroke="#29ABE2" strokeWidth="2" opacity="0.5"/><g transform="translate(18,22) scale(0.64)"><path fill="#8B7335" d="M14,45 C14,45 10,38 12,30 C14,22 20,18 26,20 C28,14 34,10 40,12 C42,8 48,6 52,10 C58,6 66,8 68,16 C74,16 80,22 78,30 C82,32 84,38 80,44 C84,46 86,54 80,58 C84,64 80,72 72,70 C70,76 62,78 56,72 C52,76 44,76 40,70 C34,74 26,70 26,62 C18,62 12,54 14,45 Z"/></g></svg>);}

function KCard({label,value,sub,accent,trend,small=false}){return(<div style={{borderTop:`3px solid ${accent||NAVY}`}} className="bg-white rounded-lg p-4 shadow-sm"><div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</div><div className={`font-bold text-slate-800 ${small?"text-lg":"text-2xl"}`}>{value}</div>{sub&&<div className="text-xs text-slate-400 mt-0.5">{sub}</div>}{trend!=null&&<div className="text-xs font-semibold mt-1" style={{color:tc(trend)}}>{trend>0?"↑":"↓"} {Math.abs(trend).toFixed(1)}% YoY</div>}</div>);}

function PLBadge({pl,rev}){
  if(pl==null)return null;
  const color=pl>=0?"#16a34a":"#dc2626";
  const bg=pl>=0?"#f0fdf4":"#fff1f2";
  const margin=rev&&rev>0?` · ${pct(pl/rev)}`:"";
  return(<span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{color,background:bg}}>{dollar(pl)}{margin}</span>);
}

function Tip({active,payload,label,fmt=dollar}){if(!active||!payload?.length)return null;return(<div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-xs"><div className="font-bold text-slate-700 mb-1">{label}</div>{payload.map((p,i)=>(<div key={i} className="flex items-center gap-2"><span className="w-2 h-2 rounded-full shrink-0" style={{background:p.color}}/><span className="text-slate-500">{p.name}:</span><span className="font-semibold text-slate-700">{fmt(p.value)}</span></div>))}</div>);}

function NumIn({value,onChange}){return(<input type="number" value={value??""} onChange={e=>{const v=e.target.value;onChange(v===""?null:parseFloat(v));}} className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white text-right" style={{MozAppearance:"textfield"}}/>);}

function Sel({value,onChange,options,className=""}){return(<select value={value} onChange={e=>onChange(e.target.value)} className={`text-sm rounded border border-slate-200 px-3 py-2 bg-white focus:outline-none ${className}`}>{options.map(o=>Array.isArray(o)?<option key={o[0]} value={o[0]}>{o[1]}</option>:<option key={o} value={o}>{o}</option>)}</select>);}

function Btn({onClick,children,variant="primary",small=false,disabled=false}){
  const base=`font-semibold rounded-lg transition ${small?"px-2 py-1 text-xs":"px-4 py-2 text-sm"} ${disabled?"opacity-40 cursor-not-allowed":""}`;
  if(variant==="primary")return <button onClick={onClick} disabled={disabled} className={base+" text-white"} style={{background:NAVY}}>{children}</button>;
  if(variant==="outline")return <button onClick={onClick} disabled={disabled} className={base+" border border-slate-200 text-slate-500 hover:bg-slate-50"}>{children}</button>;
  return <button onClick={onClick} disabled={disabled} className={base+" text-slate-400 hover:text-slate-700 border border-slate-200 hover:bg-slate-50"}>{children}</button>;
}

function SubNav({views,active,onChange}){return(<div className="flex gap-1 bg-white rounded-lg shadow-sm px-3 py-2 overflow-x-auto">{views.map(([v,l])=>(<button key={v} onClick={()=>onChange(v)} className={`px-4 py-2 text-sm font-semibold rounded-lg transition whitespace-nowrap ${active===v?"text-white":"text-slate-500 hover:bg-slate-50"}`} style={active===v?{background:NAVY}:{}}>{l}</button>))}</div>);}

function TrendChart({data,xKey,keys,title,fmt=dollar,height=200}){return(<div className="bg-white rounded-lg shadow-sm p-4"><h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">{title}</h3><ResponsiveContainer width="100%" height={height}><LineChart data={data} margin={{top:5,right:10,left:10,bottom:5}}><CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/><XAxis dataKey={xKey} tick={{fontSize:10}}/><YAxis tick={{fontSize:10}} tickFormatter={v=>v>=1000000?`$${(v/1000000).toFixed(1)}M`:v>=1000?`$${(v/1000).toFixed(0)}k`:String(Math.round(v))}/><Tooltip content={<Tip fmt={fmt}/>}/><Legend/>{keys.map((k,i)=><Line key={k.key} type="monotone" dataKey={k.key} name={k.name||k.key} stroke={CC[i]} strokeWidth={2} dot={{r:3}} connectNulls/>)}</LineChart></ResponsiveContainer></div>);}

function BarCmpChart({data,xKey,keyA,keyB,title,fmt=dollar,height=220,angle=0}){return(<div className="bg-white rounded-lg shadow-sm p-4"><h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">{title}</h3><ResponsiveContainer width="100%" height={height}><BarChart data={data} margin={{top:5,right:10,left:10,bottom:angle?70:10}}><CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/><XAxis dataKey={xKey} tick={{fontSize:10}} angle={angle} textAnchor={angle?"end":"middle"} interval={0}/><YAxis tick={{fontSize:10}} tickFormatter={v=>v>=1000000?`$${(v/1000000).toFixed(1)}M`:v>=1000?`$${(v/1000).toFixed(0)}k`:String(Math.round(v))}/><Tooltip content={<Tip fmt={fmt}/>}/><Legend/><Bar dataKey={keyA} name={String(keyA)} fill={NAVY}/><Bar dataKey={keyB} name={String(keyB)} fill={GOLD}/></BarChart></ResponsiveContainer></div>);}

function PLSummaryRow({label,revenue,expenses,pl,margin,accent=NAVY}){
  return(<div className="flex items-center justify-between px-4 py-3 border-b border-slate-50 last:border-0">
    <div className="font-semibold text-slate-700 text-sm">{label}</div>
    <div className="flex items-center gap-4 text-sm font-mono">
      {revenue!=null&&<span className="text-slate-500">{dollar(revenue)}</span>}
      {expenses!=null&&<span className="text-slate-500">{dollar(expenses)}</span>}
      <span className={`font-bold ${(pl||0)>=0?"text-green-700":"text-red-600"}`}>{dollar(pl)}</span>
      {margin!=null&&<span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{color:(pl||0)>=0?"#16a34a":"#dc2626",background:(pl||0)>=0?"#f0fdf4":"#fff1f2"}}>{margin}</span>}
    </div>
  </div>);
}

function MonthlyTable({cats,byKey,selFY,months,onEdit,fmt=dollar}){return(<div className="bg-white rounded-lg shadow-sm overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr className="bg-slate-50 text-slate-400 uppercase tracking-wider"><th className="px-3 py-2 text-left font-semibold sticky left-0 bg-slate-50 z-10">Category</th>{months.map(m=><th key={m} className="px-1.5 py-2 text-center font-semibold">{m.slice(0,3)}</th>)}<th className="px-3 py-2 text-center font-semibold">Total</th><th className="px-2 py-2"/></tr></thead><tbody>{cats.map((cat,i)=>{const row=byKey[`${cat.trim()}__${selFY}`]||{};const total=row.total;return(<tr key={cat} className={`border-t border-slate-50 ${i%2===0?"bg-white":"bg-slate-50/40"} ${total==null?"opacity-30":""}`}><td className="px-3 py-2 font-semibold text-slate-700 whitespace-nowrap sticky left-0 bg-inherit z-10">{cat.trim()}</td>{months.map(m=>{const v=row[m.toLowerCase()];return <td key={m} className={`px-1.5 py-2 text-center font-mono ${v<0?"text-red-500":""}`}>{v!=null?fmt(v):"—"}</td>;})}<td className={`px-3 py-2 text-center font-mono font-bold ${total<0?"text-red-600":total>0?"text-green-700":"text-slate-400"}`}>{total!=null?fmt(total):"—"}</td><td className="px-2 py-2"><Btn onClick={()=>onEdit(cat)} variant="ghost" small>{total!=null?"Edit":"+ Add"}</Btn></td></tr>);})}</tbody></table></div></div>);}

// ══════════════════════════════════════════════════════════════════════════════
// CAMPS MODULE
// ══════════════════════════════════════════════════════════════════════════════
function CampsModule({db}){
  const [data,setData]=useState([]);
  const [detail,setDetail]=useState([]);
  const [view,setView]=useState("overview");
  const [selCamp,setSC]=useState(null);
  const [selYear,setSY]=useState(new Date().getFullYear());
  const [editRow,setER]=useState(null);
  const [saving,setSaving]=useState(false);
  const [form,setForm]=useState({enrollment:null,revenue:null,instructor:null,supplies:null,contractual:null,rentals:null,tickets:null,notes:""});
  const [cmpA,setCmpA]=useState(2023);
  const [cmpB,setCmpB]=useState(2024);
  const [showEntry,setShowEntry]=useState(false);
  const [subView,setSubView]=useState("overview");

  const load=useCallback(async()=>{
    const [{data:r},{data:d}]=await Promise.all([
      db.from("camp_annual").select("*").order("camp").order("year"),
      db.from("camp_detail").select("*").order("camp").order("year"),
    ]);
    setData(r||[]);setDetail(d||[]);
  },[db]);
  useEffect(()=>{load();},[load]);

  const byKey=useMemo(()=>{const m={};data.forEach(r=>{m[`${r.camp}__${r.year}`]=r;});return m;},[data]);
  const detByKey=useMemo(()=>{const m={};detail.forEach(r=>{m[`${r.camp}__${r.year}`]=r;});return m;},[detail]);

  const portfolio=useMemo(()=>{
    const m={};
    data.forEach(r=>{
      if(!m[r.year])m[r.year]={year:r.year,enrollment:0,revenue:0,expenses:0,profit_loss:0};
      m[r.year].enrollment+=(r.enrollment||0);
      m[r.year].revenue+=(r.revenue||0);
      m[r.year].expenses+=(r.expenses||0);
      m[r.year].profit_loss+=(r.profit_loss||0);
    });
    return Object.values(m).filter(r=>r.revenue>0||r.enrollment>0).sort((a,b)=>a.year-b.year);
  },[data]);

  // Expense mix for portfolio latest year
  const expMix=useMemo(()=>{
    const latest=portfolio[portfolio.length-1];
    if(!latest)return[];
    const yr=latest.year;
    const totals={instructor:0,supplies:0,contractual:0,rentals:0,tickets:0};
    detail.filter(r=>r.year===yr).forEach(r=>{
      Object.keys(totals).forEach(k=>{totals[k]+=(r[k]||0);});
    });
    return Object.entries(totals).map(([name,value])=>({name:name.charAt(0).toUpperCase()+name.slice(1),value:Math.round(value)})).filter(r=>r.value>0);
  },[detail,portfolio]);

  const latest=portfolio[portfolio.length-1];
  const prior=portfolio[portfolio.length-2];

  const campSum=useMemo(()=>CAMP_NAMES.map(camp=>{
    const rows=data.filter(r=>r.camp===camp&&(r.revenue>0||r.enrollment>0)).sort((a,b)=>b.year-a.year);
    const l=rows[0],p=rows[1];
    return{camp,display:CAMP_DISPLAY[camp]||camp,latest:l,prior:p,
      enrTrend:l&&p&&p.enrollment>0?((l.enrollment-p.enrollment)/p.enrollment)*100:null};
  }),[data]);

  const cmpData=useMemo(()=>CAMP_NAMES.map(camp=>{
    const a=byKey[`${camp}__${cmpA}`];const b=byKey[`${camp}__${cmpB}`];
    if(!a&&!b)return null;
    return{camp:CAMP_DISPLAY[camp]||camp,[cmpA]:a?.enrollment||0,[cmpB]:b?.enrollment||0};
  }).filter(Boolean),[byKey,cmpA,cmpB]);

  // Revenue vs Expenses by year for stacked chart
  const revExpByYear=useMemo(()=>portfolio.map(r=>({year:r.year,revenue:r.revenue,expenses:r.expenses,profit_loss:r.profit_loss})),[portfolio]);

  function openEntry(camp,year){
    const ex=byKey[`${camp}__${year}`];
    const exd=detByKey[`${camp}__${year}`];
    setSC(camp);setSY(year);setER(ex||null);
    setForm({
      enrollment:ex?.enrollment??null,
      revenue:ex?.revenue??null,
      instructor:exd?.instructor??null,
      supplies:exd?.supplies??null,
      contractual:exd?.contractual??null,
      rentals:exd?.rentals??null,
      tickets:exd?.tickets??null,
      notes:ex?.notes||exd?.notes||""
    });
    setShowEntry(true);
  }

  async function saveEntry(){
    setSaving(true);
    const expTotal=(form.instructor||0)+(form.supplies||0)+(form.contractual||0)+(form.rentals||0)+(form.tickets||0);
    const pl=(form.revenue||0)-expTotal;
    const margin=form.revenue>0?pl/form.revenue:null;
    // Save to camp_annual
    const payload={camp:selCamp,year:selYear,enrollment:form.enrollment,revenue:form.revenue,expenses:expTotal||null,profit_loss:pl||null,notes:form.notes||""};
    if(editRow?.id){await db.from("camp_annual").update(payload).eq("id",editRow.id);}
    else{await db.from("camp_annual").upsert(payload,{onConflict:"camp,year"});}
    // Save to camp_detail
    await db.from("camp_detail").upsert({
      camp:selCamp,year:selYear,revenue:form.revenue,
      instructor:form.instructor,supplies:form.supplies,contractual:form.contractual,
      rentals:form.rentals,tickets:form.tickets,
      expense_total:expTotal||null,profit_loss:pl||null,gross_margin:margin,
      notes:form.notes||""
    },{onConflict:"camp,year"});
    setSaving(false);setShowEntry(false);load();
  }

  if(showEntry){
    const expTotal=(form.instructor||0)+(form.supplies||0)+(form.contractual||0)+(form.rentals||0)+(form.tickets||0);
    const pl=(form.revenue||0)-expTotal;
    return(<div className="space-y-4">
      <button onClick={()=>setShowEntry(false)} className="text-sm text-slate-400 hover:text-slate-600">← Back</button>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div><h2 className="font-bold text-slate-800 text-lg">{CAMP_DISPLAY[selCamp]}</h2><p className="text-sm text-slate-400">{selYear}</p></div>
        <Sel value={selYear} onChange={v=>setSY(parseInt(v))} options={CAMP_YEARS}/>
      </div>
      <div className="bg-white rounded-xl shadow-sm p-5 space-y-5">
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Enrollment & Revenue</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[["Enrollment","enrollment"],["Revenue ($)","revenue"]].map(([label,key])=>(
              <div key={key}><label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{label}</label><NumIn value={form[key]} onChange={v=>setForm(f=>({...f,[key]:v}))}/></div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Expenses by Category</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[["Instructor ($)","instructor"],["Supplies ($)","supplies"],["Contractual ($)","contractual"],["Rentals ($)","rentals"],["Tickets/Admission ($)","tickets"]].map(([label,key])=>(
              <div key={key}><label className="block text-xs font-semibold text-slate-500 mb-1">{label}</label><NumIn value={form[key]} onChange={v=>setForm(f=>({...f,[key]:v}))}/></div>
            ))}
          </div>
        </div>
        {expTotal>0&&(
          <div className="rounded-lg px-4 py-3 space-y-1" style={{background:"#f8fafc",border:"1px solid #e2e8f0"}}>
            <div className="flex justify-between text-sm"><span className="text-slate-500">Total Expenses:</span><span className="font-mono font-semibold">{dollar(expTotal)}</span></div>
            {form.revenue>0&&<div className="flex justify-between text-sm"><span className="text-slate-500">Profit / (Loss):</span><span className="font-mono font-bold" style={{color:pl>=0?"#16a34a":"#dc2626"}}>{dollar(pl)} · {pct(pl/form.revenue)}</span></div>}
          </div>
        )}
        <div><label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Notes</label>
          <textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} rows={2} className="w-full rounded border border-slate-200 px-3 py-2 text-sm focus:outline-none resize-none"/></div>
        <div className="flex justify-end gap-3">
          <Btn onClick={()=>setShowEntry(false)} variant="outline">Cancel</Btn>
          <button onClick={saveEntry} disabled={saving} className="px-5 py-2 text-sm font-bold text-white rounded-lg disabled:opacity-40" style={{background:NAVY}}>{saving?"Saving…":"Save"}</button>
        </div>
      </div>
    </div>);}

  if(view==="detail"&&selCamp){
    const campRows=data.filter(r=>r.camp===selCamp&&(r.revenue>0||r.enrollment>0)).sort((a,b)=>a.year-b.year);
    const campDet=detail.filter(r=>r.camp===selCamp&&r.revenue>0).sort((a,b)=>a.year-b.year);
    const allRows=CAMP_YEARS.map(yr=>({year:yr,...(byKey[`${selCamp}__${yr}`]||{}),det:detByKey[`${selCamp}__${yr}`]||{}}));
    return(<div className="space-y-5">
      <button onClick={()=>setView("overview")} className="text-sm text-slate-400 hover:text-slate-600">← All Camps</button>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div><h2 className="font-bold text-slate-800 text-lg">{CAMP_DISPLAY[selCamp]}</h2></div>
        <Btn onClick={()=>openEntry(selCamp,new Date().getFullYear())}>+ Enter Data</Btn>
      </div>
      {campRows.length>1&&(
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TrendChart data={campRows} xKey="year" keys={[{key:"enrollment",name:"Enrollment"}]} title="Enrollment Trend" fmt={v=>num(v)} height={180}/>
          <TrendChart data={campRows} xKey="year" keys={[{key:"revenue",name:"Revenue"},{key:"expenses",name:"Expenses"},{key:"profit_loss",name:"P/L"}]} title="Revenue, Expenses & P/L" height={180}/>
        </div>
      )}
      {campDet.length>1&&(
        <TrendChart data={campDet} xKey="year"
          keys={[{key:"instructor",name:"Instructor"},{key:"supplies",name:"Supplies"},{key:"contractual",name:"Contractual"},{key:"rentals",name:"Rentals"},{key:"tickets",name:"Tickets"}]}
          title="Expense Breakdown by Category" height={200}/>
      )}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 text-xs text-slate-400 uppercase tracking-wider">
              {["Year","Enr","Revenue","Instructor","Supplies","Contractual","Rentals","Tickets","Total Exp","P/(L)","Margin",""].map(h=><th key={h} className="px-3 py-2 text-left font-semibold whitespace-nowrap">{h}</th>)}
            </tr></thead>
            <tbody>{allRows.map((r,i)=>{
              const hasData=r.revenue>0||r.enrollment>0;
              const d=r.det;
              return(<tr key={r.year} className={`border-t border-slate-50 ${i%2===0?"bg-white":"bg-slate-50/40"} ${!hasData?"opacity-30":""}`}>
                <td className="px-3 py-2 font-semibold text-slate-700">{r.year}</td>
                <td className="px-3 py-2 font-mono">{r.enrollment>0?num(r.enrollment):"—"}</td>
                <td className="px-3 py-2 font-mono">{r.revenue>0?dollar(r.revenue):"—"}</td>
                <td className="px-3 py-2 font-mono text-slate-500">{d.instructor>0?dollar(d.instructor):"—"}</td>
                <td className="px-3 py-2 font-mono text-slate-500">{d.supplies>0?dollar(d.supplies):"—"}</td>
                <td className="px-3 py-2 font-mono text-slate-500">{d.contractual>0?dollar(d.contractual):"—"}</td>
                <td className="px-3 py-2 font-mono text-slate-500">{d.rentals>0?dollar(d.rentals):"—"}</td>
                <td className="px-3 py-2 font-mono text-slate-500">{d.tickets>0?dollar(d.tickets):"—"}</td>
                <td className="px-3 py-2 font-mono">{(d.expense_total||r.expenses)>0?dollar(d.expense_total||r.expenses):"—"}</td>
                <td className={`px-3 py-2 font-mono font-bold ${(r.profit_loss||0)>=0?"text-green-700":"text-red-600"}`}>{r.profit_loss!=null&&hasData?dollar(r.profit_loss):"—"}</td>
                <td className="px-3 py-2 font-mono text-slate-500">{r.revenue>0&&r.profit_loss!=null?pct(r.profit_loss/r.revenue):"—"}</td>
                <td className="px-3 py-2"><Btn onClick={()=>openEntry(selCamp,r.year)} variant="ghost" small>{hasData?"Edit":"+"}</Btn></td>
              </tr>);
            })}</tbody>
          </table>
        </div>
      </div>
    </div>);}

  const subViews=[["overview","Overview"],["pl","P/L Summary"],["expenses","Expense Detail"]];
  return(<div className="space-y-6">
    <div className="flex items-center justify-between"><h2 className="font-bold text-slate-800 text-base">Camps — Portfolio Overview</h2></div>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <KCard label="Total Enrollment" value={latest?num(latest.enrollment):"—"} sub={latest?`${latest.year} season`:""} accent={NAVY} trend={latest&&prior&&prior.enrollment>0?((latest.enrollment-prior.enrollment)/prior.enrollment)*100:null}/>
      <KCard label="Total Revenue" value={latest?dollar(latest.revenue):"—"} sub={latest?`${latest.year} season`:""} accent={GOLD} trend={latest&&prior&&prior.revenue>0?((latest.revenue-prior.revenue)/prior.revenue)*100:null}/>
      <KCard label="Total Expenses" value={latest?dollar(latest.expenses):"—"} sub={latest?`${latest.year}`:""} accent="#64748b"/>
      <KCard label="Net P/(L)" value={latest?dollar(latest.profit_loss):"—"} sub={latest&&latest.revenue>0?`Margin: ${pct(latest.profit_loss/latest.revenue)}`:""} accent={latest&&latest.profit_loss>=0?"#22c55e":"#ef4444"}/>
    </div>
    <SubNav views={subViews} active={subView} onChange={setSubView}/>

    {subView==="overview"&&(<div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {portfolio.length>1&&<TrendChart data={portfolio} xKey="year" keys={[{key:"enrollment",name:"Total Enrollment"}]} title="Portfolio Enrollment by Year" fmt={v=>num(v)} height={200}/>}
        {revExpByYear.length>1&&<TrendChart data={revExpByYear} xKey="year" keys={[{key:"revenue",name:"Revenue"},{key:"expenses",name:"Expenses"},{key:"profit_loss",name:"P/L"}]} title="Revenue, Expenses & P/L" height={200}/>}
      </div>
      {expMix.length>0&&(
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Expense Mix — Latest Year</h3>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={180} height={180}>
              <PieChart><Pie data={expMix} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                {expMix.map((_,i)=><Cell key={i} fill={CC[i]}/>)}
              </Pie><Tooltip content={<Tip/>}/></PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">{expMix.map((e,i)=>(<div key={e.name} className="flex items-center gap-2 text-sm"><span className="w-3 h-3 rounded-sm" style={{background:CC[i]}}/><span className="text-slate-600">{e.name}:</span><span className="font-bold text-slate-800">{dollar(e.value)}</span></div>))}</div>
          </div>
        </div>
      )}
      <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Enrollment Comparison by Camp</h3>
          <div className="flex items-center gap-2">
            <Sel value={cmpA} onChange={v=>setCmpA(parseInt(v))} options={CAMP_YEARS}/>
            <span className="text-xs text-slate-400">vs</span>
            <Sel value={cmpB} onChange={v=>setCmpB(parseInt(v))} options={CAMP_YEARS}/>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={cmpData} margin={{top:5,right:10,left:10,bottom:65}}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
            <XAxis dataKey="camp" tick={{fontSize:9}} angle={-35} textAnchor="end" interval={0}/>
            <YAxis tick={{fontSize:10}}/><Tooltip content={<Tip fmt={num}/>}/><Legend/>
            <Bar dataKey={cmpA} name={String(cmpA)} fill={NAVY}/>
            <Bar dataKey={cmpB} name={String(cmpB)} fill={GOLD}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>)}

    {subView==="pl"&&(<div className="space-y-4">
      <h3 className="font-semibold text-slate-700 text-sm">P/L Summary — All Camps, Latest Year</h3>
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 grid grid-cols-5 text-xs font-bold text-slate-400 uppercase tracking-wider">
          <span>Camp</span><span className="text-right">Revenue</span><span className="text-right">Expenses</span><span className="text-right">P/(L)</span><span className="text-right">Margin</span>
        </div>
        {campSum.map((c,i)=>{
          const l=c.latest;
          const margin=l?.revenue>0&&l?.profit_loss!=null?pct(l.profit_loss/l.revenue):null;
          return(<div key={c.camp} className={`px-4 py-2.5 grid grid-cols-5 text-sm items-center ${i%2===0?"bg-white":"bg-slate-50/40"} ${!l?"opacity-30":""}`}>
            <button onClick={()=>{setSC(c.camp);setView("detail");}} className="font-semibold text-slate-700 hover:text-blue-600 hover:underline text-left">{c.display}</button>
            <span className="text-right font-mono">{l?.revenue>0?dollar(l.revenue):"—"}</span>
            <span className="text-right font-mono text-slate-500">{l?.expenses>0?dollar(l.expenses):"—"}</span>
            <span className={`text-right font-mono font-bold ${(l?.profit_loss||0)>=0?"text-green-700":"text-red-600"}`}>{l?.profit_loss!=null?dollar(l.profit_loss):"—"}</span>
            <span className="text-right font-mono text-slate-500">{margin||"—"}</span>
          </div>);
        })}
      </div>
    </div>)}

    {subView==="expenses"&&(<div className="space-y-4">
      <h3 className="font-semibold text-slate-700 text-sm">Expense Detail — All Camps, Latest Year</h3>
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="bg-slate-50 text-slate-400 uppercase tracking-wider">
              {["Camp","Revenue","Instructor","Supplies","Contractual","Rentals","Tickets","Total Exp","P/(L)","Margin",""].map(h=><th key={h} className="px-3 py-2 text-left font-semibold whitespace-nowrap">{h}</th>)}
            </tr></thead>
            <tbody>{campSum.map((c,i)=>{
              const l=c.latest;const d=detByKey[`${c.camp}__${l?.year}`]||{};
              return(<tr key={c.camp} className={`border-t border-slate-50 hover:bg-slate-50 ${i%2===0?"bg-white":"bg-slate-50/40"} ${!l?"opacity-30":""}`}>
                <td className="px-3 py-2"><button onClick={()=>{setSC(c.camp);setView("detail");}} className="font-semibold text-slate-700 hover:text-blue-600 hover:underline">{c.display}</button></td>
                <td className="px-3 py-2 font-mono">{l?.revenue>0?dollar(l.revenue):"—"}</td>
                <td className="px-3 py-2 font-mono text-slate-500">{d.instructor>0?dollar(d.instructor):"—"}</td>
                <td className="px-3 py-2 font-mono text-slate-500">{d.supplies>0?dollar(d.supplies):"—"}</td>
                <td className="px-3 py-2 font-mono text-slate-500">{d.contractual>0?dollar(d.contractual):"—"}</td>
                <td className="px-3 py-2 font-mono text-slate-500">{d.rentals>0?dollar(d.rentals):"—"}</td>
                <td className="px-3 py-2 font-mono text-slate-500">{d.tickets>0?dollar(d.tickets):"—"}</td>
                <td className="px-3 py-2 font-mono">{(d.expense_total||l?.expenses)>0?dollar(d.expense_total||l.expenses):"—"}</td>
                <td className={`px-3 py-2 font-mono font-bold ${(l?.profit_loss||0)>=0?"text-green-700":"text-red-600"}`}>{l?.profit_loss!=null?dollar(l.profit_loss):"—"}</td>
                <td className="px-3 py-2 font-mono text-slate-500">{l?.revenue>0&&l?.profit_loss!=null?pct(l.profit_loss/l.revenue):"—"}</td>
                <td className="px-3 py-2"><Btn onClick={()=>openEntry(c.camp,l?.year||new Date().getFullYear())} variant="ghost" small>+ Add</Btn></td>
              </tr>);
            })}</tbody>
          </table>
        </div>
      </div>
    </div>)}

    {subView==="overview"&&(<div className="bg-white rounded-lg shadow-sm overflow-hidden mt-2">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-bold text-slate-700 text-sm">All Camps — Click to view history</h3>
      </div>
      <table className="w-full text-sm">
        <thead><tr className="bg-slate-50 text-xs text-slate-400 uppercase tracking-wider">
          {["Camp","Year","Enrollment","Revenue","Expenses","P/(L)","Margin","YoY",""].map(h=><th key={h} className="px-3 py-2 text-left font-semibold">{h}</th>)}
        </tr></thead>
        <tbody>{campSum.map((c,i)=>(<tr key={c.camp} className={`border-t border-slate-50 hover:bg-slate-50 ${i%2===0?"bg-white":"bg-slate-50/40"}`}>
          <td className="px-3 py-2.5"><button onClick={()=>{setSC(c.camp);setView("detail");}} className="font-semibold text-slate-700 hover:text-blue-600 hover:underline text-left">{c.display}</button></td>
          <td className="px-3 py-2.5 text-slate-400">{c.latest?.year||"—"}</td>
          <td className="px-3 py-2.5 font-mono">{c.latest?.enrollment>0?num(c.latest.enrollment):"—"}</td>
          <td className="px-3 py-2.5 font-mono">{c.latest?.revenue>0?dollar(c.latest.revenue):"—"}</td>
          <td className="px-3 py-2.5 font-mono">{c.latest?.expenses>0?dollar(c.latest.expenses):"—"}</td>
          <td className={`px-3 py-2.5 font-mono font-semibold ${(c.latest?.profit_loss||0)>=0?"text-green-700":"text-red-600"}`}>{c.latest?.profit_loss!=null?dollar(c.latest.profit_loss):"—"}</td>
          <td className="px-3 py-2.5 font-mono text-slate-500">{c.latest?.revenue>0&&c.latest?.profit_loss!=null?pct(c.latest.profit_loss/c.latest.revenue):"—"}</td>
          <td className="px-3 py-2.5">{c.enrTrend!=null&&<span className="text-xs font-semibold" style={{color:tc(c.enrTrend)}}>{c.enrTrend>=0?"↑":"↓"}{Math.abs(c.enrTrend).toFixed(1)}%</span>}</td>
          <td className="px-3 py-2.5"><Btn onClick={()=>openEntry(c.camp,new Date().getFullYear())} variant="ghost" small>+ Add</Btn></td>
        </tr>))}</tbody>
      </table>
    </div>)}
  </div>);}

// ══════════════════════════════════════════════════════════════════════════════
// CLUBHOUSE MODULE (unchanged from working version)
// ══════════════════════════════════════════════════════════════════════════════
function ClubhouseModule({db}){
  const [enrData,setEnrData]=useState([]);
  const [finData,setFinData]=useState([]);
  const [view,setView]=useState("overview");
  const [selSite,setSite]=useState(null);
  const [entryYear,setEY]=useState(new Date().getFullYear());
  const [entryTab,setET]=useState("enrollment");
  const [enrForm,setEnrForm]=useState({});
  const [finForm,setFinForm]=useState({revenue:null,expenses:null,notes:""});
  const [saving,setSaving]=useState(false);
  const [cmpA,setCmpA]=useState(2023);
  const [cmpB,setCmpB]=useState(2024);
  const [showEntry,setShowEntry]=useState(false);

  const load=useCallback(async()=>{
    const [{data:e},{data:f}]=await Promise.all([db.from("clubhouse_enrollment").select("*"),db.from("clubhouse_financials").select("*")]);
    setEnrData(e||[]);setFinData(f||[]);
  },[db]);
  useEffect(()=>{load();},[load]);

  const enrByKey=useMemo(()=>{const m={};enrData.forEach(r=>{m[`${r.site}__${r.year}__${r.month}`]=r;});return m;},[enrData]);
  const finByKey=useMemo(()=>{const m={};finData.forEach(r=>{m[`${r.site}__${r.year}`]=r;});return m;},[finData]);

  const siteAvg=useMemo(()=>{
    const m={};
    CB_SITES.forEach(site=>{m[site]={};CB_YEARS.forEach(yr=>{
      const vals=CB_MONTHS.map(mo=>enrByKey[`${site}__${yr}__${mo}`]?.enrollment).filter(v=>v!=null&&v>0);
      m[site][yr]=vals.length>0?vals.reduce((a,b)=>a+b,0)/vals.length:null;
    });});
    return m;
  },[enrByKey]);

  const portfolio=useMemo(()=>{
    const m={};
    CB_YEARS.forEach(yr=>{
      const avgs=CB_SITES.map(s=>siteAvg[s]?.[yr]).filter(v=>v!=null);
      const rev=CB_SITES.reduce((a,s)=>{const f=finByKey[`${s}__${yr}`];return a+(f?.revenue||0);},0);
      const pl=CB_SITES.reduce((a,s)=>{const f=finByKey[`${s}__${yr}`];return a+(f?.profit_loss||0);},0);
      const exp=CB_SITES.reduce((a,s)=>{const f=finByKey[`${s}__${yr}`];return a+(f?.expenses||0);},0);
      if(avgs.length>0||rev>0)m[yr]={year:yr,total:avgs.reduce((a,b)=>a+b,0),revenue:rev,expenses:exp,profit_loss:pl};
    });
    return Object.values(m).sort((a,b)=>a.year-b.year);
  },[siteAvg,finByKey]);

  const cmpData=useMemo(()=>CB_SITES.map(site=>({site,[cmpA]:siteAvg[site]?.[cmpA]!=null?Math.round(siteAvg[site][cmpA]*10)/10:0,[cmpB]:siteAvg[site]?.[cmpB]!=null?Math.round(siteAvg[site][cmpB]*10)/10:0})).filter(r=>r[cmpA]>0||r[cmpB]>0),[siteAvg,cmpA,cmpB]);

  function openEntry(site,year){
    setSite(site);setEY(year);
    const ef={};CB_MONTHS.forEach(mo=>{ef[mo]=enrByKey[`${site}__${year}__${mo}`]?.enrollment??null;});
    setEnrForm(ef);
    const fin=finByKey[`${site}__${year}`];
    setFinForm({revenue:fin?.revenue??null,expenses:fin?.expenses??null,notes:fin?.notes||""});
    setShowEntry(true);
  }

  async function saveEnr(){
    setSaving(true);
    const ops=CB_MONTHS.filter(mo=>enrForm[mo]!=null).map(mo=>db.from("clubhouse_enrollment").upsert({site:selSite,year:entryYear,month:mo,enrollment:enrForm[mo]},{onConflict:"site,year,month"}));
    if(ops.length)await Promise.all(ops);
    setSaving(false);setShowEntry(false);load();
  }

  async function saveFin(){
    setSaving(true);
    await db.from("clubhouse_financials").upsert({site:selSite,year:entryYear,revenue:finForm.revenue,expenses:finForm.expenses,profit_loss:(finForm.revenue||0)-(finForm.expenses||0),notes:finForm.notes||""},{onConflict:"site,year"});
    setSaving(false);setShowEntry(false);load();
  }

  if(showEntry){return(<div className="space-y-5">
    <button onClick={()=>setShowEntry(false)} className="text-sm text-slate-400 hover:text-slate-600">← Back</button>
    <div className="flex items-center justify-between flex-wrap gap-2">
      <div><h2 className="font-bold text-slate-800 text-lg">{selSite}</h2><p className="text-sm text-slate-400">Enter data for {entryYear}</p></div>
      <Sel value={entryYear} onChange={v=>setEY(parseInt(v))} options={CB_YEARS}/>
    </div>
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="flex border-b border-slate-100">
        {[["enrollment","Monthly Enrollment"],["financials","Annual Financials"]].map(([t,l])=>(
          <button key={t} onClick={()=>setET(t)} className={`px-5 py-3 text-sm font-semibold border-b-2 transition ${entryTab===t?"text-slate-800":"border-transparent text-slate-400 hover:text-slate-600"}`} style={entryTab===t?{borderColor:GOLD}:{}}>{l}</button>
        ))}
      </div>
      <div className="p-5">
        {entryTab==="enrollment"?(
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {CB_MONTHS.map(month=>(<div key={month}><label className="block text-xs font-semibold text-slate-500 mb-1">{month}</label><NumIn value={enrForm[month]} onChange={v=>setEnrForm(f=>({...f,[month]:v}))}/></div>))}
            </div>
            <div className="flex justify-end gap-3"><Btn onClick={()=>setShowEntry(false)} variant="outline">Cancel</Btn><button onClick={saveEnr} disabled={saving} className="px-5 py-2 text-sm font-bold text-white rounded-lg disabled:opacity-40" style={{background:NAVY}}>{saving?"Saving…":"Save Enrollment"}</button></div>
          </div>
        ):(
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[["Revenue ($)","revenue"],["Site Staff Expenses ($)","expenses"]].map(([label,key])=>(
                <div key={key}><label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{label}</label><NumIn value={finForm[key]} onChange={v=>setFinForm(f=>({...f,[key]:v}))}/></div>
              ))}
            </div>
            {finForm.revenue!=null&&finForm.expenses!=null&&(
              <div className="rounded-lg px-4 py-3 text-sm bg-slate-50 border border-slate-100">
                P/(L): <span className="font-bold" style={{color:(finForm.revenue-finForm.expenses)>=0?"#16a34a":"#dc2626"}}>{dollar((finForm.revenue||0)-(finForm.expenses||0))}</span>
                {finForm.revenue>0&&<span className="ml-3 text-slate-400">{pct(((finForm.revenue-finForm.expenses)/finForm.revenue))}</span>}
              </div>
            )}
            <div className="flex justify-end gap-3"><Btn onClick={()=>setShowEntry(false)} variant="outline">Cancel</Btn><button onClick={saveFin} disabled={saving} className="px-5 py-2 text-sm font-bold text-white rounded-lg disabled:opacity-40" style={{background:NAVY}}>{saving?"Saving…":"Save Financials"}</button></div>
          </div>
        )}
      </div>
    </div>
  </div>);}

  if(view==="detail"&&selSite){
    const siteAvgs=CB_YEARS.map(yr=>({year:yr,avg:siteAvg[selSite]?.[yr]})).filter(r=>r.avg!=null);
    const siteFin=CB_YEARS.map(yr=>{const f=finByKey[`${selSite}__${yr}`];return f?{year:yr,...f}:null;}).filter(Boolean);
    return(<div className="space-y-5">
      <button onClick={()=>setView("overview")} className="text-sm text-slate-400 hover:text-slate-600">← All Sites</button>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div><h2 className="font-bold text-slate-800 text-lg">{selSite}</h2></div>
        <Btn onClick={()=>openEntry(selSite,new Date().getFullYear())}>+ Enter Data</Btn>
      </div>
      {siteAvgs.length>1&&<TrendChart data={siteAvgs} xKey="year" keys={[{key:"avg",name:"Avg Enrollment"}]} title="Average Monthly Enrollment by Year" fmt={v=>v.toFixed(1)} height={200}/>}
      {siteFin.length>1&&<TrendChart data={siteFin} xKey="year" keys={[{key:"revenue",name:"Revenue"},{key:"expenses",name:"Expenses"},{key:"profit_loss",name:"P/L"}]} title="Revenue, Expenses & P/L" height={200}/>}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100"><h3 className="font-bold text-slate-700 text-sm">Monthly Enrollment</h3></div>
          <div className="overflow-x-auto"><table className="w-full text-xs">
            <thead><tr className="bg-slate-50 text-slate-400 uppercase tracking-wider"><th className="px-3 py-2 text-left font-semibold">Year</th>{CB_MONTHS.map(m=><th key={m} className="px-1.5 py-2 text-center font-semibold">{m.slice(0,3)}</th>)}<th className="px-3 py-2 text-center font-semibold">Avg</th><th className="px-2 py-2"/></tr></thead>
            <tbody>{CB_YEARS.map((yr,i)=>{
              const vals=CB_MONTHS.map(mo=>enrByKey[`${selSite}__${yr}__${mo}`]?.enrollment);
              const hasAny=vals.some(v=>v!=null);const avg=siteAvg[selSite]?.[yr];
              return(<tr key={yr} className={`border-t border-slate-50 ${i%2===0?"bg-white":"bg-slate-50/40"} ${!hasAny?"opacity-30":""}`}>
                <td className="px-3 py-2 font-semibold text-slate-700">{yr}</td>
                {vals.map((v,mi)=><td key={mi} className="px-1.5 py-2 text-center font-mono">{v!=null?Math.round(v):"—"}</td>)}
                <td className="px-3 py-2 text-center font-mono font-bold">{avg!=null?avg.toFixed(1):"—"}</td>
                <td className="px-2 py-2"><Btn onClick={()=>openEntry(selSite,yr)} variant="ghost" small>{hasAny?"Edit":"+"}</Btn></td>
              </tr>);
            })}</tbody>
          </table></div>
        </div>
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100"><h3 className="font-bold text-slate-700 text-sm">Annual Financials</h3></div>
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 text-xs text-slate-400 uppercase tracking-wider">{["Year","Revenue","Expenses","P/(L)","Margin",""].map(h=><th key={h} className="px-3 py-2 text-left font-semibold">{h}</th>)}</tr></thead>
            <tbody>{CB_YEARS.map((yr,i)=>{const f=finByKey[`${selSite}__${yr}`];return(<tr key={yr} className={`border-t border-slate-50 ${i%2===0?"bg-white":"bg-slate-50/40"} ${!f?"opacity-30":""}`}>
              <td className="px-3 py-2.5 font-semibold text-slate-700">{yr}</td>
              <td className="px-3 py-2.5 font-mono">{f?.revenue>0?dollar(f.revenue):"—"}</td>
              <td className="px-3 py-2.5 font-mono">{f?.expenses>0?dollar(f.expenses):"—"}</td>
              <td className={`px-3 py-2.5 font-mono font-semibold ${(f?.profit_loss||0)>=0?"text-green-700":"text-red-600"}`}>{f?.profit_loss!=null?dollar(f.profit_loss):"—"}</td>
              <td className="px-3 py-2.5 font-mono text-slate-500">{f?.revenue>0&&f?.profit_loss!=null?pct(f.profit_loss/f.revenue):"—"}</td>
              <td className="px-3 py-2.5"><Btn onClick={()=>openEntry(selSite,yr)} variant="ghost" small>{f?"Edit":"+ Add"}</Btn></td>
            </tr>);})}
            </tbody>
          </table>
        </div>
      </div>
    </div>);}

  const latestData=CB_SITES.map(site=>{for(const yr of CB_YEARS.slice().reverse()){const a=siteAvg[site]?.[yr];if(a!=null)return{site,year:yr,avg:a,fin:finByKey[`${site}__${yr}`]||null};}return{site,year:null,avg:null,fin:null};});
  const latestPL=portfolio[portfolio.length-1];
  return(<div className="space-y-6">
    <div className="flex items-center justify-between"><h2 className="font-bold text-slate-800 text-base">Clubhouse — All Sites</h2></div>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <KCard label="Combined Avg Enrollment" value={num(Math.round(latestData.reduce((a,r)=>a+(r.avg||0),0)))} sub="All sites" accent={NAVY}/>
      <KCard label="Sites" value={CB_SITES.length} accent={GOLD}/>
      <KCard label="Total Revenue" value={latestPL?.revenue>0?dollar(latestPL.revenue):"—"} sub={`${latestPL?.year||""}`} accent="#22c55e"/>
      <KCard label="Total P/(L)" value={latestPL?dollar(latestPL.profit_loss):"—"} sub={latestPL?.revenue>0&&latestPL?.profit_loss!=null?`Margin: ${pct(latestPL.profit_loss/latestPL.revenue)}`:""} accent={NAVY}/>
    </div>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {portfolio.length>1&&<TrendChart data={portfolio} xKey="year" keys={[{key:"total",name:"Total Enrollment"}]} title="Portfolio Enrollment by Year" fmt={v=>num(v)} height={200}/>}
      {portfolio.length>1&&<TrendChart data={portfolio} xKey="year" keys={[{key:"revenue",name:"Revenue"},{key:"profit_loss",name:"P/L"}]} title="Revenue & P/L by Year" height={200}/>}
    </div>
    <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Site Enrollment Comparison</h3>
        <div className="flex items-center gap-2"><Sel value={cmpA} onChange={v=>setCmpA(parseInt(v))} options={CB_YEARS}/><span className="text-xs text-slate-400">vs</span><Sel value={cmpB} onChange={v=>setCmpB(parseInt(v))} options={CB_YEARS}/></div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={cmpData} margin={{top:5,right:10,left:10,bottom:40}}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
          <XAxis dataKey="site" tick={{fontSize:9}} angle={-30} textAnchor="end" interval={0}/>
          <YAxis tick={{fontSize:10}}/><Tooltip content={<Tip fmt={v=>v.toFixed(1)}/>}/><Legend/>
          <Bar dataKey={cmpA} name={String(cmpA)} fill={NAVY}/>
          <Bar dataKey={cmpB} name={String(cmpB)} fill={GOLD}/>
        </BarChart>
      </ResponsiveContainer>
    </div>
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100"><h3 className="font-bold text-slate-700 text-sm">Site Summary — Latest Year</h3></div>
      <table className="w-full text-sm">
        <thead><tr className="bg-slate-50 text-xs text-slate-400 uppercase tracking-wider">{["Site","Year","Avg Enrollment","Revenue","Expenses","P/(L)","Margin",""].map(h=><th key={h} className="px-3 py-2 text-left font-semibold">{h}</th>)}</tr></thead>
        <tbody>{latestData.map((r,i)=>(<tr key={r.site} className={`border-t border-slate-50 hover:bg-slate-50 ${i%2===0?"bg-white":"bg-slate-50/40"}`}>
          <td className="px-3 py-2.5"><button onClick={()=>{setSite(r.site);setView("detail");}} className="font-semibold text-slate-700 hover:text-blue-600 hover:underline">{r.site}</button></td>
          <td className="px-3 py-2.5 text-slate-400">{r.year||"—"}</td>
          <td className="px-3 py-2.5 font-mono">{r.avg!=null?r.avg.toFixed(1):"—"}</td>
          <td className="px-3 py-2.5 font-mono">{r.fin?.revenue>0?dollar(r.fin.revenue):"—"}</td>
          <td className="px-3 py-2.5 font-mono">{r.fin?.expenses>0?dollar(r.fin.expenses):"—"}</td>
          <td className={`px-3 py-2.5 font-mono font-semibold ${(r.fin?.profit_loss||0)>=0?"text-green-700":"text-red-600"}`}>{r.fin?.profit_loss!=null?dollar(r.fin.profit_loss):"—"}</td>
          <td className="px-3 py-2.5 font-mono text-slate-500">{r.fin?.revenue>0&&r.fin?.profit_loss!=null?pct(r.fin.profit_loss/r.fin.revenue):"—"}</td>
          <td className="px-3 py-2.5"><Btn onClick={()=>openEntry(r.site,new Date().getFullYear())} variant="ghost" small>+ Enter</Btn></td>
        </tr>))}</tbody>
      </table>
    </div>
  </div>);}

// ══════════════════════════════════════════════════════════════════════════════
// RECREATION MODULE
// ══════════════════════════════════════════════════════════════════════════════
function RecreationModule({db}){
  const [plData,setPlData]=useState([]);
  const [revData,setRevData]=useState([]);
  const [expData,setExpData]=useState([]);
  const [plOverall,setPlOverall]=useState([]);
  const [subView,setSubView]=useState("overview");
  const [selFY,setSelFY]=useState("2025/26");
  const [cmpA,setCmpA]=useState("2023/24");
  const [cmpB,setCmpB]=useState("2024/25");
  const [showEntry,setShowEntry]=useState(false);
  const [entryType,setET]=useState("pl");
  const [entryCat,setEC]=useState(REC_PL_CATS[0]);
  const [entryFY,setEFY]=useState("2025/26");
  const [form,setForm]=useState({});
  const [saving,setSaving]=useState(false);

  const load=useCallback(async()=>{
    const [{data:p},{data:r},{data:e},{data:o}]=await Promise.all([
      db.from("rec_pl").select("*"),
      db.from("rec_revenue").select("*"),
      db.from("rec_expenses").select("*"),
      db.from("rec_pl_overall").select("*"),
    ]);
    setPlData(p||[]);setRevData(r||[]);setExpData(e||[]);setPlOverall(o||[]);
  },[db]);
  useEffect(()=>{load();},[load]);

  const plByKey=useMemo(()=>{const m={};plData.forEach(r=>{m[`${r.category.trim()}__${r.fiscal_year}`]=r;});return m;},[plData]);
  const revByKey=useMemo(()=>{const m={};revData.forEach(r=>{m[`${r.category.trim()}__${r.fiscal_year}`]=r;});return m;},[revData]);
  const expByKey=useMemo(()=>{const m={};expData.forEach(r=>{m[`${r.category.trim()}__${r.fiscal_year}`]=r;});return m;},[expData]);
  const plOvByKey=useMemo(()=>{const m={};plOverall.forEach(r=>{m[r.fiscal_year]=r;});return m;},[plOverall]);

  const latestFY=useMemo(()=>FY_LIST.slice().reverse().find(fy=>plData.some(r=>r.fiscal_year===fy))||"2025/26",[plData]);

  // Overall trend chart data
  const overviewByFY=useMemo(()=>FY_LIST.map(fy=>{
    const rev=revData.find(r=>r.fiscal_year===fy&&r.category.trim()==="Overall Revenue");
    const ov=plOvByKey[fy];
    if(!rev&&!ov)return null;
    return{fy,revenue:rev?.total||null,profit_loss:ov?.profit_loss||null,
      pl_pct:(ov?.profit_loss!=null&&rev?.total>0)?ov.profit_loss/rev.total:null};
  }).filter(Boolean),[revData,plOvByKey]);

  const cmpData=useMemo(()=>REC_PL_CATS.map(cat=>{
    const a=plByKey[`${cat.trim()}__${cmpA}`];const b=plByKey[`${cat.trim()}__${cmpB}`];
    if(!a&&!b)return null;
    return{category:cat.trim(),[cmpA]:a?.total||0,[cmpB]:b?.total||0};
  }).filter(Boolean),[plByKey,cmpA,cmpB]);

  function openEntry(type,cat,fy){
    setET(type);setEC(cat);setEFY(fy);
    const byKey=type==="pl"?plByKey:type==="revenue"?revByKey:expByKey;
    const ex=byKey[`${cat.trim()}__${fy}`]||{};
    const f={notes:ex.notes||""};
    FY_MONTHS.forEach(m=>{f[m]=ex[m.toLowerCase()]??null;});
    setForm(f);setShowEntry(true);
  }

  async function saveEntry(){
    setSaving(true);
    const table=entryType==="pl"?"rec_pl":entryType==="revenue"?"rec_revenue":"rec_expenses";
    const row={category:entryCat.trim(),fiscal_year:entryFY,notes:form.notes||""};
    let total=0;FY_MONTHS.forEach(m=>{row[m.toLowerCase()]=form[m]??null;if(form[m])total+=form[m];});row.total=total;
    await db.from(table).upsert(row,{onConflict:"category,fiscal_year"});
    setSaving(false);setShowEntry(false);load();
  }

  if(showEntry){
    const cats=entryType==="pl"?REC_PL_CATS:entryType==="revenue"?REC_REV_CATS:REC_EXP_CATS;
    return(<div className="space-y-5">
      <button onClick={()=>setShowEntry(false)} className="text-sm text-slate-400 hover:text-slate-600">← Back</button>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h2 className="font-bold text-slate-800 text-lg">Enter {entryType==="pl"?"P/L":entryType==="revenue"?"Revenue":"Expenses"}</h2><p className="text-sm text-slate-400">{entryCat} · {entryFY}</p></div>
        <div className="flex gap-2"><Sel value={entryCat} onChange={setEC} options={cats}/><Sel value={entryFY} onChange={setEFY} options={FY_LIST}/></div>
      </div>
      <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {FY_MONTHS.map(month=>(<div key={month}><label className="block text-xs font-semibold text-slate-500 mb-1">{month}</label><NumIn value={form[month]} onChange={v=>setForm(f=>({...f,[month]:v}))}/></div>))}
        </div>
        <div className="rounded-lg px-4 py-3 text-sm bg-slate-50 border border-slate-100">Total: <span className="font-bold">{dollar(FY_MONTHS.reduce((a,m)=>a+(form[m]||0),0))}</span></div>
        <div><label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Notes</label><textarea value={form.notes||""} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} rows={2} className="w-full rounded border border-slate-200 px-3 py-2 text-sm focus:outline-none resize-none"/></div>
        <div className="flex justify-end gap-3"><Btn onClick={()=>setShowEntry(false)} variant="outline">Cancel</Btn><button onClick={saveEntry} disabled={saving} className="px-5 py-2 text-sm font-bold text-white rounded-lg disabled:opacity-40" style={{background:NAVY}}>{saving?"Saving…":"Save"}</button></div>
      </div>
    </div>);}

  const subViews=[["overview","Overview"],["pl","P/L by Area"],["revenue","Revenue"],["expenses","Expenses"]];

  // Latest FY P/L by area
  const plByArea=useMemo(()=>REC_PL_CATS.map(cat=>{
    const row=plByKey[`${cat.trim()}__${selFY}`];
    const rev=revByKey[`${cat.trim()}__${selFY}`];
    return{category:cat.trim(),total:row?.total||null,margin:row?.margin||null,revenue:rev?.total||null,
      pl_pct:row?.total!=null&&rev?.total>0?row.total/rev.total:null};
  }),[plByKey,revByKey,selFY]);

  return(<div className="space-y-6">
    <div className="flex items-center justify-between flex-wrap gap-2">
      <div><h2 className="font-bold text-slate-800 text-base">Recreation — Fund 4</h2><p className="text-xs text-slate-400 mt-0.5">Program P/L, revenue, and expenses</p></div>
      <Btn onClick={()=>openEntry("pl",REC_PL_CATS[0],latestFY)}>+ Enter Data</Btn>
    </div>
    <SubNav views={subViews} active={subView} onChange={setSubView}/>

    {subView==="overview"&&(<div className="space-y-5">
      {/* P/L Summary cards */}
      {plOvByKey[latestFY]&&(()=>{
        const ov=plOvByKey[latestFY];
        const rev=revData.find(r=>r.fiscal_year===latestFY&&r.category.trim()==="Overall Revenue");
        return(<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KCard label="Total Revenue" value={rev?.total?dollar(rev.total):"—"} sub={latestFY} accent={NAVY}/>
          <KCard label="Overall P/(L)" value={dollar(ov.profit_loss)} sub={rev?.total>0?`Margin: ${pct(ov.profit_loss/rev.total)}`:latestFY} accent={(ov.profit_loss||0)>=0?"#22c55e":"#ef4444"}/>
          <KCard label="Best Area" value={plByArea.filter(r=>r.total!=null).sort((a,b)=>(b.total||0)-(a.total||0))[0]?.category||"—"} sub="Highest P/L" accent={GOLD}/>
          <KCard label="Areas Profitable" value={`${plByArea.filter(r=>r.total>0).length} / ${plByArea.filter(r=>r.total!=null).length}`} sub={latestFY} accent="#22c55e"/>
        </div>);
      })()}
      {overviewByFY.length>1&&(
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TrendChart data={overviewByFY} xKey="fy" keys={[{key:"revenue",name:"Revenue"},{key:"profit_loss",name:"P/L"}]} title="Revenue & Overall P/L by Fiscal Year" height={220}/>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">P/L Margin % by Fiscal Year</h3>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={overviewByFY.filter(r=>r.pl_pct!=null)} margin={{top:5,right:10,left:10,bottom:5}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                <XAxis dataKey="fy" tick={{fontSize:10}}/>
                <YAxis tickFormatter={v=>`${(v*100).toFixed(1)}%`} tick={{fontSize:10}}/>
                <Tooltip content={<Tip fmt={v=>pct(v)}/>}/><Legend/>
                <Line type="monotone" dataKey="pl_pct" name="P/L Margin" stroke={GOLD} strokeWidth={2} dot={{r:3}}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">P/L by Area — Year Comparison</h3>
          <div className="flex items-center gap-2"><Sel value={cmpA} onChange={setCmpA} options={FY_LIST}/><span className="text-xs text-slate-400">vs</span><Sel value={cmpB} onChange={setCmpB} options={FY_LIST}/></div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={cmpData} margin={{top:5,right:10,left:10,bottom:75}}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
            <XAxis dataKey="category" tick={{fontSize:9}} angle={-40} textAnchor="end" interval={0}/>
            <YAxis tick={{fontSize:10}} tickFormatter={v=>v>=1000?`$${(v/1000).toFixed(0)}k`:v<=-1000?`($${(Math.abs(v)/1000).toFixed(0)}k)`:String(Math.round(v))}/>
            <Tooltip content={<Tip/>}/><Legend/>
            <Bar dataKey={cmpA} name={cmpA} fill={NAVY}/>
            <Bar dataKey={cmpB} name={cmpB} fill={GOLD}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {/* P/L table with margin % */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-700 text-sm">P/L by Area</h3>
          <Sel value={selFY} onChange={setSelFY} options={FY_LIST}/>
        </div>
        <table className="w-full text-sm">
          <thead><tr className="bg-slate-50 text-xs text-slate-400 uppercase tracking-wider">
            {["Program Area","Revenue","P/(L)","Margin %",""].map(h=><th key={h} className="px-4 py-2 text-left font-semibold">{h}</th>)}
          </tr></thead>
          <tbody>{plByArea.sort((a,b)=>(b.total||0)-(a.total||0)).map((r,i)=>(
            <tr key={r.category} className={`border-t border-slate-50 ${i%2===0?"bg-white":"bg-slate-50/40"} ${r.total==null?"opacity-30":""}`}>
              <td className="px-4 py-2.5 font-semibold text-slate-700">{r.category}</td>
              <td className="px-4 py-2.5 font-mono text-slate-500">{r.revenue!=null?dollar(r.revenue):"—"}</td>
              <td className={`px-4 py-2.5 font-mono font-semibold ${(r.total||0)>=0?"text-green-700":"text-red-600"}`}>{r.total!=null?dollar(r.total):"—"}</td>
              <td className="px-4 py-2.5">
                {r.pl_pct!=null&&<span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{color:r.pl_pct>=0?"#16a34a":"#dc2626",background:r.pl_pct>=0?"#f0fdf4":"#fff1f2"}}>{pct(r.pl_pct)}</span>}
              </td>
              <td className="px-4 py-2.5"><Btn onClick={()=>openEntry("pl",r.category,selFY)} variant="ghost" small>{r.total!=null?"Edit":"+ Add"}</Btn></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>)}

    {subView==="pl"&&(<div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-semibold text-slate-700">P/L by Area — Monthly</h3>
        <Sel value={selFY} onChange={setSelFY} options={FY_LIST}/>
      </div>
      <MonthlyTable cats={REC_PL_CATS} byKey={plByKey} selFY={selFY} months={FY_MONTHS} onEdit={cat=>openEntry("pl",cat,selFY)}/>
    </div>)}
    {subView==="revenue"&&(<div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-semibold text-slate-700">Revenue by Area — Monthly</h3>
        <Sel value={selFY} onChange={setSelFY} options={FY_LIST}/>
      </div>
      <MonthlyTable cats={REC_REV_CATS} byKey={revByKey} selFY={selFY} months={FY_MONTHS} onEdit={cat=>openEntry("revenue",cat,selFY)}/>
    </div>)}
    {subView==="expenses"&&(<div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-semibold text-slate-700">Expenses by Category — Monthly</h3>
        <Sel value={selFY} onChange={setSelFY} options={FY_LIST}/>
      </div>
      <MonthlyTable cats={REC_EXP_CATS} byKey={expByKey} selFY={selFY} months={FY_MONTHS} onEdit={cat=>openEntry("expenses",cat,selFY)}/>
    </div>)}
  </div>);}

// ══════════════════════════════════════════════════════════════════════════════
// FITNESS MODULE
// ══════════════════════════════════════════════════════════════════════════════
function FitnessModule({db}){
  const [revData,setRevData]=useState([]);
  const [expData,setExpData]=useState([]);
  const [plData,setPlData]=useState([]);
  const [kpiData,setKpiData]=useState([]);
  const [plOverall,setPlOverall]=useState([]);
  const [subView,setSubView]=useState("overview");
  const [selFY,setSelFY]=useState("2025/26");
  const [cmpA,setCmpA]=useState("2023/24");
  const [cmpB,setCmpB]=useState("2024/25");
  const [showEntry,setShowEntry]=useState(false);
  const [entryType,setET]=useState("revenue");
  const [entryCat,setEC]=useState(FIT_REV_CATS[0]);
  const [entryFY,setEFY]=useState("2025/26");
  const [form,setForm]=useState({});
  const [saving,setSaving]=useState(false);

  const load=useCallback(async()=>{
    const [{data:r},{data:e},{data:p},{data:k},{data:o}]=await Promise.all([
      db.from("fitness_revenue").select("*"),
      db.from("fitness_expenses").select("*"),
      db.from("fitness_pl").select("*"),
      db.from("fitness_kpis").select("*"),
      db.from("fitness_pl_overall").select("*"),
    ]);
    setRevData(r||[]);setExpData(e||[]);setPlData(p||[]);setKpiData(k||[]);setPlOverall(o||[]);
  },[db]);
  useEffect(()=>{load();},[load]);

  const revByKey=useMemo(()=>{const m={};revData.forEach(r=>{m[`${r.category}__${r.fiscal_year}`]=r;});return m;},[revData]);
  const expByKey=useMemo(()=>{const m={};expData.forEach(r=>{m[`${r.category}__${r.fiscal_year}`]=r;});return m;},[expData]);
  const plByKey=useMemo(()=>{const m={};plData.forEach(r=>{m[`${r.category}__${r.fiscal_year}__${r.type}`]=r;});return m;},[plData]);
  const kpiByKey=useMemo(()=>{const m={};kpiData.forEach(r=>{m[`${r.metric}__${r.fiscal_year}`]=r;});return m;},[kpiData]);
  const plOvByKey=useMemo(()=>{const m={};plOverall.forEach(r=>{m[r.fiscal_year]=r;});return m;},[plOverall]);

  const latestFY=useMemo(()=>FY_LIST.slice().reverse().find(fy=>revData.some(r=>r.fiscal_year===fy))||"2025/26",[revData]);

  const revByFY=useMemo(()=>FY_LIST.map(fy=>{
    const r=revByKey[`Overall Revenue__${fy}`];const m=revByKey[`Memberships__${fy}`];
    const pt=revByKey[`Personal Training__${fy}`];const sp=revByKey[`Specialty Programs__${fy}`];
    const ov=plOvByKey[fy];
    if(!r&&!m)return null;
    return{fy,total:r?.total,memberships:m?.total,pt:pt?.total,specialty:sp?.total,
      profit_loss:ov?.profit_loss||null,pl_pct:(ov?.profit_loss!=null&&r?.total>0)?ov.profit_loss/r.total:null};
  }).filter(Boolean),[revByKey,plOvByKey]);

  const membersByFY=useMemo(()=>FY_LIST.map(fy=>{
    const am=kpiByKey[`Active Members__${fy}`];const nm=kpiByKey[`New Members__${fy}`];
    const ca=kpiByKey[`Cancellations__${fy}`];const mv=kpiByKey[`Member Visits__${fy}`];
    if(!am&&!nm)return null;
    return{fy,activeMembers:am?.total,newMembers:nm?.total,cancellations:ca?.total,memberVisits:mv?.total};
  }).filter(Boolean),[kpiByKey]);

  const expCmp=useMemo(()=>FIT_EXP_CATS.map(cat=>{
    const a=expByKey[`${cat}__${cmpA}`];const b=expByKey[`${cat}__${cmpB}`];
    if(!a&&!b)return null;
    return{category:cat,[cmpA]:a?.total||0,[cmpB]:b?.total||0};
  }).filter(Boolean),[expByKey,cmpA,cmpB]);

  function openEntry(type,cat,fy){
    setET(type);setEC(cat);setEFY(fy);
    const isKPI=type==="kpis";
    const byKey=type==="revenue"?revByKey:type==="expenses"?expByKey:kpiByKey;
    const ex=byKey[`${cat}__${fy}`]||{};
    const f={notes:ex.notes||""};FY_MONTHS.forEach(m=>{f[m]=ex[m.toLowerCase()]??null;});
    setForm(f);setShowEntry(true);
  }

  async function saveEntry(){
    setSaving(true);
    const table=entryType==="revenue"?"fitness_revenue":entryType==="expenses"?"fitness_expenses":"fitness_kpis";
    const isKPI=entryType==="kpis";
    const row=isKPI?{metric:entryCat,fiscal_year:entryFY,notes:form.notes||""}:{category:entryCat,fiscal_year:entryFY,notes:form.notes||""};
    let total=0;FY_MONTHS.forEach(m=>{row[m.toLowerCase()]=form[m]??null;if(form[m])total+=form[m];});row.total=total;
    await db.from(table).upsert(row,{onConflict:isKPI?"metric,fiscal_year":"category,fiscal_year"});
    setSaving(false);setShowEntry(false);load();
  }

  if(showEntry){
    const cats=entryType==="revenue"?FIT_REV_CATS:entryType==="expenses"?FIT_EXP_CATS:FIT_KPI_METRICS;
    const fmt=entryType==="kpis"?num:dollar;
    return(<div className="space-y-5">
      <button onClick={()=>setShowEntry(false)} className="text-sm text-slate-400 hover:text-slate-600">← Back</button>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h2 className="font-bold text-slate-800 text-lg">Enter {entryType==="revenue"?"Revenue":entryType==="expenses"?"Expenses":"KPI"}</h2><p className="text-sm text-slate-400">{entryCat} · {entryFY}</p></div>
        <div className="flex gap-2"><Sel value={entryCat} onChange={setEC} options={cats}/><Sel value={entryFY} onChange={setEFY} options={FY_LIST}/></div>
      </div>
      <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {FY_MONTHS.map(month=>(<div key={month}><label className="block text-xs font-semibold text-slate-500 mb-1">{month}</label><NumIn value={form[month]} onChange={v=>setForm(f=>({...f,[month]:v}))}/></div>))}
        </div>
        <div className="rounded-lg px-4 py-3 text-sm bg-slate-50 border border-slate-100">Total: <span className="font-bold">{fmt(FY_MONTHS.reduce((a,m)=>a+(form[m]||0),0))}</span></div>
        <div className="flex justify-end gap-3"><Btn onClick={()=>setShowEntry(false)} variant="outline">Cancel</Btn><button onClick={saveEntry} disabled={saving} className="px-5 py-2 text-sm font-bold text-white rounded-lg disabled:opacity-40" style={{background:NAVY}}>{saving?"Saving…":"Save"}</button></div>
      </div>
    </div>);}

  const subViews=[["overview","Overview"],["revenue","Revenue"],["expenses","Expenses"],["kpis","Membership KPIs"],["pl","P/L Detail"]];
  const latestMem=membersByFY[membersByFY.length-1];const priorMem=membersByFY[membersByFY.length-2];
  const latestRev=revByFY[revByFY.length-1];const priorRev=revByFY[revByFY.length-2];
  const latestOv=plOvByKey[latestFY];

  return(<div className="space-y-6">
    <div className="flex items-center justify-between flex-wrap gap-2">
      <div><h2 className="font-bold text-slate-800 text-base">Fitness Center — Fund 21</h2></div>
      <Btn onClick={()=>openEntry("revenue",FIT_REV_CATS[0],latestFY)}>+ Enter Data</Btn>
    </div>
    <SubNav views={subViews} active={subView} onChange={setSubView}/>

    {subView==="overview"&&(<div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KCard label="Total Revenue" value={latestRev?dollar(latestRev.total):"—"} sub={latestFY} accent={NAVY} trend={latestRev&&priorRev&&priorRev.total?((latestRev.total-priorRev.total)/priorRev.total)*100:null}/>
        <KCard label="Overall P/(L)" value={latestOv?dollar(latestOv.profit_loss):"—"} sub={latestOv&&latestRev?.total?`Margin: ${pct(latestOv.profit_loss/latestRev.total)}`:latestFY} accent={(latestOv?.profit_loss||0)>=0?"#22c55e":"#ef4444"}/>
        <KCard label="Active Members" value={latestMem?num(latestMem.activeMembers):"—"} sub={latestFY} accent={GOLD} trend={latestMem&&priorMem&&priorMem.activeMembers?((latestMem.activeMembers-priorMem.activeMembers)/priorMem.activeMembers)*100:null}/>
        <KCard label="New Members" value={latestMem?num(latestMem.newMembers):"—"} sub={latestFY} accent="#22c55e"/>
      </div>
      {revByFY.length>1&&(
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TrendChart data={revByFY} xKey="fy" keys={[{key:"total",name:"Total Revenue"},{key:"profit_loss",name:"Overall P/L"}]} title="Revenue & P/L Trend" height={220}/>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">P/L Margin % by Fiscal Year</h3>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={revByFY.filter(r=>r.pl_pct!=null)} margin={{top:5,right:10,left:10,bottom:5}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                <XAxis dataKey="fy" tick={{fontSize:10}}/>
                <YAxis tickFormatter={v=>`${(v*100).toFixed(1)}%`} tick={{fontSize:10}}/>
                <Tooltip content={<Tip fmt={v=>pct(v)}/>}/><Legend/>
                <Line type="monotone" dataKey="pl_pct" name="P/L Margin" stroke={GOLD} strokeWidth={2} dot={{r:3}}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      {revByFY.length>1&&(
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Revenue by Category — Stacked</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revByFY} margin={{top:5,right:10,left:10,bottom:5}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
              <XAxis dataKey="fy" tick={{fontSize:10}}/><YAxis tickFormatter={v=>`$${(v/1000000).toFixed(1)}M`} tick={{fontSize:10}}/>
              <Tooltip content={<Tip/>}/><Legend/>
              <Bar dataKey="memberships" name="Memberships" fill={NAVY} stackId="a"/>
              <Bar dataKey="pt" name="Personal Training" fill={GOLD} stackId="a"/>
              <Bar dataKey="specialty" name="Specialty" fill={BLUE} stackId="a"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      {membersByFY.length>1&&(
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TrendChart data={membersByFY} xKey="fy" keys={[{key:"activeMembers",name:"Active Members"}]} title="Active Members Trend" fmt={num} height={200}/>
          <TrendChart data={membersByFY} xKey="fy" keys={[{key:"newMembers",name:"New Members"},{key:"cancellations",name:"Cancellations"}]} title="New vs Cancellations" fmt={num} height={200}/>
        </div>
      )}
      <div className="bg-white rounded-lg shadow-sm p-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Expense Comparison</h3>
          <div className="flex items-center gap-2"><Sel value={cmpA} onChange={setCmpA} options={FY_LIST}/><span className="text-xs text-slate-400">vs</span><Sel value={cmpB} onChange={setCmpB} options={FY_LIST}/></div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={expCmp} margin={{top:5,right:10,left:10,bottom:5}}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
            <XAxis dataKey="category" tick={{fontSize:10}}/><YAxis tickFormatter={v=>`$${(v/1000).toFixed(0)}k`} tick={{fontSize:10}}/>
            <Tooltip content={<Tip/>}/><Legend/>
            <Bar dataKey={cmpA} name={cmpA} fill={NAVY}/><Bar dataKey={cmpB} name={cmpB} fill={GOLD}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>)}

    {(subView==="revenue"||subView==="expenses")&&(<div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-semibold text-slate-700">{subView==="revenue"?"Revenue":"Expenses"} by Category</h3>
        <div className="flex gap-2"><Sel value={selFY} onChange={setSelFY} options={FY_LIST}/><Btn onClick={()=>openEntry(subView,subView==="revenue"?FIT_REV_CATS[0]:FIT_EXP_CATS[0],selFY)}>+ Enter</Btn></div>
      </div>
      <MonthlyTable cats={subView==="revenue"?FIT_REV_CATS:FIT_EXP_CATS} byKey={subView==="revenue"?revByKey:expByKey} selFY={selFY} months={FY_MONTHS} onEdit={cat=>openEntry(subView,cat,selFY)}/>
    </div>)}

    {subView==="kpis"&&(<div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-semibold text-slate-700">Membership & Participation KPIs</h3>
        <div className="flex gap-2"><Sel value={selFY} onChange={setSelFY} options={FY_LIST}/><Btn onClick={()=>openEntry("kpis",FIT_KPI_METRICS[0],selFY)}>+ Enter</Btn></div>
      </div>
      <MonthlyTable cats={FIT_KPI_METRICS} byKey={kpiByKey} selFY={selFY} months={FY_MONTHS} onEdit={cat=>openEntry("kpis",cat,selFY)} fmt={num}/>
    </div>)}

    {subView==="pl"&&(<div className="space-y-6">
      {/* Overall P/L table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100"><h3 className="font-bold text-slate-700 text-sm">Overall P/L by Fiscal Year</h3></div>
        <table className="w-full text-sm">
          <thead><tr className="bg-slate-50 text-xs text-slate-400 uppercase tracking-wider">{["Fiscal Year","Revenue","P/(L)","Margin %"].map(h=><th key={h} className="px-4 py-2 text-left font-semibold">{h}</th>)}</tr></thead>
          <tbody>{FY_LIST.map((fy,i)=>{
            const ov=plOvByKey[fy];const rev=revByKey[`Overall Revenue__${fy}`];
            if(!ov&&!rev)return null;
            const margin=ov?.profit_loss!=null&&rev?.total>0?ov.profit_loss/rev.total:null;
            return(<tr key={fy} className={`border-t border-slate-50 ${i%2===0?"bg-white":"bg-slate-50/40"}`}>
              <td className="px-4 py-2.5 font-semibold text-slate-700">{fy}</td>
              <td className="px-4 py-2.5 font-mono">{rev?.total?dollar(rev.total):"—"}</td>
              <td className={`px-4 py-2.5 font-mono font-semibold ${(ov?.profit_loss||0)>=0?"text-green-700":"text-red-600"}`}>{ov?.profit_loss!=null?dollar(ov.profit_loss):"—"}</td>
              <td className="px-4 py-2.5">{margin!=null&&<span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{color:margin>=0?"#16a34a":"#dc2626",background:margin>=0?"#f0fdf4":"#fff1f2"}}>{pct(margin)}</span>}</td>
            </tr>);
          }).filter(Boolean)}</tbody>
        </table>
      </div>
      {FIT_PL_CATS.map(cat=>{
        const rows=FY_LIST.map(fy=>{
          const r=plByKey[`${cat}__${fy}__revenue`];const e=plByKey[`${cat}__${fy}__expenses`];const p=plByKey[`${cat}__${fy}__profit_loss`];
          if(!r&&!p)return null;
          return{fy,revenue:r?.total,expenses:e?.total,profit_loss:p?.total,margin:r?.total>0&&p?.total!=null?p.total/r.total:null};
        }).filter(Boolean);
        return(<div key={cat} className="space-y-4">
          {rows.length>1&&<TrendChart data={rows} xKey="fy" keys={[{key:"revenue",name:"Revenue"},{key:"expenses",name:"Expenses"},{key:"profit_loss",name:"P/L"}]} title={`${cat} — Trend`} height={200}/>}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 font-bold text-slate-700 text-sm">{cat}</div>
            <table className="w-full text-sm">
              <thead><tr className="bg-slate-50 text-xs text-slate-400 uppercase tracking-wider">{["Fiscal Year","Revenue","Expenses","P/(L)","Margin %"].map(h=><th key={h} className="px-4 py-2 text-left font-semibold">{h}</th>)}</tr></thead>
              <tbody>{rows.map((r,i)=>(<tr key={r.fy} className={`border-t border-slate-50 ${i%2===0?"bg-white":"bg-slate-50/40"}`}>
                <td className="px-4 py-2.5 font-semibold text-slate-700">{r.fy}</td>
                <td className="px-4 py-2.5 font-mono">{dollar(r.revenue)}</td>
                <td className="px-4 py-2.5 font-mono">{dollar(r.expenses)}</td>
                <td className={`px-4 py-2.5 font-mono font-semibold ${(r.profit_loss||0)>=0?"text-green-700":"text-red-600"}`}>{dollar(r.profit_loss)}</td>
                <td className="px-4 py-2.5">{r.margin!=null&&<span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{color:r.margin>=0?"#16a34a":"#dc2626",background:r.margin>=0?"#f0fdf4":"#fff1f2"}}>{pct(r.margin)}</span>}</td>
              </tr>))}</tbody>
            </table>
          </div>
        </div>);
      })}
    </div>)}
  </div>);}

// ══════════════════════════════════════════════════════════════════════════════
// OVERVIEW MODULE
// ══════════════════════════════════════════════════════════════════════════════
function OverviewModule({db}){
  const [campData,setCampData]=useState([]);
  const [cbFin,setCbFin]=useState([]);
  const [fitRev,setFitRev]=useState([]);
  const [recRev,setRecRev]=useState([]);
  const [fitKpi,setFitKpi]=useState([]);
  const [fitPLOv,setFitPLOv]=useState([]);
  const [recPLOv,setRecPLOv]=useState([]);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    setLoading(true);
    Promise.all([
      db.from("camp_annual").select("year,revenue,expenses,profit_loss,enrollment"),
      db.from("clubhouse_financials").select("year,revenue,expenses,profit_loss"),
      db.from("fitness_revenue").select("category,fiscal_year,total"),
      db.from("rec_revenue").select("category,fiscal_year,total"),
      db.from("fitness_kpis").select("metric,fiscal_year,total"),
      db.from("fitness_pl_overall").select("*"),
      db.from("rec_pl_overall").select("*"),
    ]).then(([{data:c},{data:cb},{data:fr},{data:rr},{data:fk},{data:fo},{data:ro}])=>{
      setCampData(c||[]);setCbFin(cb||[]);setFitRev(fr||[]);setRecRev(rr||[]);
      setFitKpi(fk||[]);setFitPLOv(fo||[]);setRecPLOv(ro||[]);setLoading(false);
    });
  },[db]);

  const campByYear=useMemo(()=>{
    const m={};campData.forEach(r=>{if(!m[r.year])m[r.year]={year:r.year,enrollment:0,revenue:0,profit_loss:0};m[r.year].enrollment+=(r.enrollment||0);m[r.year].revenue+=(r.revenue||0);m[r.year].profit_loss+=(r.profit_loss||0);});
    return Object.values(m).filter(r=>r.revenue>0||r.enrollment>0).sort((a,b)=>a.year-b.year);
  },[campData]);

  const cbByYear=useMemo(()=>{
    const m={};cbFin.forEach(r=>{if(!m[r.year])m[r.year]={year:r.year,revenue:0,profit_loss:0};m[r.year].revenue+=(r.revenue||0);m[r.year].profit_loss+=(r.profit_loss||0);});
    return Object.values(m).filter(r=>r.revenue>0).sort((a,b)=>a.year-b.year);
  },[cbFin]);

  const fitRevByFY=useMemo(()=>{const m={};fitRev.filter(r=>r.category==="Overall Revenue"&&r.total>0).forEach(r=>{m[r.fiscal_year]=r.total;});return m;},[fitRev]);
  const recRevByFY=useMemo(()=>{const m={};recRev.filter(r=>r.category?.trim()==="Overall Revenue"&&r.total>0).forEach(r=>{m[r.fiscal_year]=r.total;});return m;},[recRev]);
  const fitPLByFY=useMemo(()=>{const m={};fitPLOv.forEach(r=>{m[r.fiscal_year]=r.profit_loss;});return m;},[fitPLOv]);
  const recPLByFY=useMemo(()=>{const m={};recPLOv.forEach(r=>{m[r.fiscal_year]=r.profit_loss;});return m;},[recPLOv]);
  const membersByFY=useMemo(()=>{const m={};fitKpi.filter(r=>r.metric==="Active Members"&&r.total>0).forEach(r=>{m[r.fiscal_year]=r.total;});return m;},[fitKpi]);

  const campLatest=campByYear[campByYear.length-1];const campPrior=campByYear[campByYear.length-2];
  const cbLatest=cbByYear[cbByYear.length-1];const cbPrior=cbByYear[cbByYear.length-2];
  const fitFYs=Object.entries(fitRevByFY).sort((a,b)=>a[0].localeCompare(b[0]));
  const fitLatest=fitFYs[fitFYs.length-1];const fitPrior=fitFYs[fitFYs.length-2];
  const recFYs=Object.entries(recRevByFY).sort((a,b)=>a[0].localeCompare(b[0]));
  const recLatest=recFYs[recFYs.length-1];const recPrior=recFYs[recFYs.length-2];
  const memFYs=Object.entries(membersByFY).sort((a,b)=>a[0].localeCompare(b[0]));
  const memLatest=memFYs[memFYs.length-1];

  const combined=useMemo(()=>{
    const fys=[...new Set([...fitFYs.map(f=>f[0]),...recFYs.map(f=>f[0])])].sort();
    return fys.map(fy=>({fy,fitness:fitRevByFY[fy]||null,recreation:recRevByFY[fy]||null,fitPL:fitPLByFY[fy]||null,recPL:recPLByFY[fy]||null})).filter(r=>r.fitness||r.recreation);
  },[fitRevByFY,recRevByFY,fitPLByFY,recPLByFY,fitFYs,recFYs]);

  const cards=[
    {title:"Camps",color:NAVY,year:campLatest?.year,revenue:campLatest?.revenue,pl:campLatest?.profit_loss,plPct:campLatest?.revenue>0&&campLatest?.profit_loss!=null?campLatest.profit_loss/campLatest.revenue:null,extra:`${num(campLatest?.enrollment)} enrolled`,trend:campLatest&&campPrior&&campPrior.revenue>0?((campLatest.revenue-campPrior.revenue)/campPrior.revenue)*100:null},
    {title:"Clubhouse",color:"#0f766e",year:cbLatest?.year,revenue:cbLatest?.revenue,pl:cbLatest?.profit_loss,plPct:cbLatest?.revenue>0&&cbLatest?.profit_loss!=null?cbLatest.profit_loss/cbLatest.revenue:null,extra:"All 10 sites",trend:cbLatest&&cbPrior&&cbPrior.revenue>0?((cbLatest.revenue-cbPrior.revenue)/cbPrior.revenue)*100:null},
    {title:"Recreation Fund 4",color:"#7c3aed",year:recLatest?.[0],revenue:recLatest?.[1],pl:recPLByFY[recLatest?.[0]]||null,plPct:recPLByFY[recLatest?.[0]]!=null&&recLatest?.[1]>0?recPLByFY[recLatest[0]]/recLatest[1]:null,extra:"Overall fund",trend:recLatest&&recPrior&&recPrior[1]>0?((recLatest[1]-recPrior[1])/recPrior[1])*100:null},
    {title:"Fitness Center",color:GOLD,year:fitLatest?.[0],revenue:fitLatest?.[1],pl:fitPLByFY[fitLatest?.[0]]||null,plPct:fitPLByFY[fitLatest?.[0]]!=null&&fitLatest?.[1]>0?fitPLByFY[fitLatest[0]]/fitLatest[1]:null,extra:`${memLatest?num(memLatest[1]):"—"} active members`,trend:fitLatest&&fitPrior&&fitPrior[1]>0?((fitLatest[1]-fitPrior[1])/fitPrior[1])*100:null},
  ];

  if(loading)return <div className="text-center py-20 text-slate-400 text-sm">Loading data…</div>;

  return(<div className="space-y-6">
    <div><h2 className="font-bold text-slate-800 text-base">BGPD Rec Funds — Overview</h2><p className="text-xs text-slate-400 mt-0.5">All four funds at a glance</p></div>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {cards.map(c=>(<div key={c.title} className="bg-white rounded-xl shadow-sm overflow-hidden" style={{borderTop:`4px solid ${c.color}`}}>
        <div className="px-5 py-4">
          <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{color:c.color}}>{c.title}</div>
          <div className="grid grid-cols-2 gap-4">
            <div><div className="text-xs text-slate-400 mb-0.5">Revenue</div><div className="text-xl font-black text-slate-800">{c.revenue?dollar(c.revenue):"No data yet"}</div><div className="text-xs text-slate-400 mt-0.5">{c.year||"—"}</div></div>
            <div><div className="text-xs text-slate-400 mb-0.5">Net P/(L)</div>
              <div className={`text-xl font-black ${c.pl!=null?(c.pl>=0?"text-green-700":"text-red-600"):"text-slate-300"}`}>{c.pl!=null?dollar(c.pl):"—"}</div>
              {c.plPct!=null&&<div className="text-xs mt-0.5 font-semibold" style={{color:c.plPct>=0?"#16a34a":"#dc2626"}}>{pct(c.plPct)} margin</div>}
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="text-xs text-slate-400">{c.extra}</div>
            {c.trend!=null&&<div className="text-xs font-semibold" style={{color:tc(c.trend)}}>{c.trend>=0?"↑":"↓"} {Math.abs(c.trend).toFixed(1)}% YoY</div>}
          </div>
        </div>
      </div>))}
    </div>
    {combined.length>1&&(
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TrendChart data={combined} xKey="fy" keys={[{key:"fitness",name:"Fitness"},{key:"recreation",name:"Recreation"}]} title="Revenue — Fitness & Recreation" height={220}/>
        <TrendChart data={combined.filter(r=>r.fitPL!=null||r.recPL!=null)} xKey="fy" keys={[{key:"fitPL",name:"Fitness P/L"},{key:"recPL",name:"Recreation P/L"}]} title="P/L Trend — Fitness & Recreation" height={220}/>
      </div>
    )}
    {campByYear.length>1&&(
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TrendChart data={campByYear} xKey="year" keys={[{key:"enrollment",name:"Enrollment"}]} title="Camps — Total Enrollment by Year" fmt={num} height={200}/>
        <TrendChart data={cbByYear} xKey="year" keys={[{key:"revenue",name:"Revenue"},{key:"profit_loss",name:"P/L"}]} title="Clubhouse — Revenue & P/L" height={200}/>
      </div>
    )}
  </div>);}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════════════════════════════════════════
const TABS=[{id:"overview",label:"Overview"},{id:"camps",label:"Camps"},{id:"clubhouse",label:"Clubhouse"},{id:"recreation",label:"Recreation"},{id:"fitness",label:"Fitness Center"}];

export default function App(){
  const [tab,setTab]=useState("overview");
  const [authed,setAuthed]=useState(false);
  const [userName,setUserName]=useState("");

  if(!authed)return <LoginScreen onLogin={n=>{setAuthed(true);setUserName(n);}}/>;

  return(<div className="min-h-screen" style={{background:"#f1f5f9"}}>
    <header style={{backgroundColor:NAVY}} className="px-4 py-4 shadow-lg">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo size={36}/>
          <div>
            <div className="text-white font-bold text-base leading-tight">Buffalo Grove Park District</div>
            <div className="text-xs font-semibold tracking-widest uppercase" style={{color:BLUE}}>Rec Funds — Financial Dashboard</div>
          </div>
        </div>
        <div className="flex items-center gap-3"><span className="text-xs text-white/60 capitalize">{userName}</span><button onClick={()=>{setAuthed(false);setUserName("");}} className="text-xs text-white/40 hover:text-white/70 transition">Sign out</button></div>
      </div>
    </header>
    <nav className="bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-6xl mx-auto flex gap-1 px-4 overflow-x-auto">
        {TABS.map(t=>(<button key={t.id} onClick={()=>setTab(t.id)} className={`px-5 py-3 text-sm font-semibold border-b-2 transition whitespace-nowrap ${tab===t.id?"text-slate-800":"border-transparent text-slate-400 hover:text-slate-600"}`} style={tab===t.id?{borderColor:GOLD}:{}}>{t.label}</button>))}
      </div>
    </nav>
    <main className="max-w-6xl mx-auto px-4 py-6">
      {tab==="overview"&&<OverviewModule db={supabase}/>}
      {tab==="camps"&&<CampsModule db={supabase}/>}
      {tab==="clubhouse"&&<ClubhouseModule db={supabase}/>}
      {tab==="recreation"&&<RecreationModule db={supabase}/>}
      {tab==="fitness"&&<FitnessModule db={supabase}/>}
    </main>
  </div>);}
