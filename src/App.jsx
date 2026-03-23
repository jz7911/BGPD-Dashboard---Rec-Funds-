import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "./supabase.js";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from "recharts";

const NAVY="#1e3a5f",GOLD="#d4a017",BLUE="#29ABE2";
const CHART_COLORS=[NAVY,GOLD,BLUE,"#22c55e","#f97316","#8b5cf6","#ec4899","#14b8a6","#ef4444","#64748b"];

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

const dollar=v=>!v&&v!==0?"—":v<0?`($${Math.abs(Math.round(v)).toLocaleString()})`:`$${Math.round(v).toLocaleString()}`;
const pct=v=>v==null?"—":`${(v*100).toFixed(1)}%`;
const num=v=>v==null?"—":Math.round(v).toLocaleString();
const tc=v=>v>0?"#16a34a":v<0?"#dc2626":"#94a3b8";

function Logo({size=48}){return(<svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="44" fill="none" stroke="#29ABE2" strokeWidth="6"/><circle cx="50" cy="50" r="38" fill="none" stroke="#29ABE2" strokeWidth="2" opacity="0.5"/><g transform="translate(18,22) scale(0.64)"><path fill="#8B7335" d="M14,45 C14,45 10,38 12,30 C14,22 20,18 26,20 C28,14 34,10 40,12 C42,8 48,6 52,10 C58,6 66,8 68,16 C74,16 80,22 78,30 C82,32 84,38 80,44 C84,46 86,54 80,58 C84,64 80,72 72,70 C70,76 62,78 56,72 C52,76 44,76 40,70 C34,74 26,70 26,62 C18,62 12,54 14,45 Z"/></g></svg>);}

function KCard({label,value,sub,accent,trend}){return(<div style={{borderTop:`3px solid ${accent||NAVY}`}} className="bg-white rounded-lg p-4 shadow-sm"><div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</div><div className="text-2xl font-bold text-slate-800">{value}</div>{sub&&<div className="text-xs text-slate-400 mt-0.5">{sub}</div>}{trend!=null&&<div className="text-xs font-semibold mt-1" style={{color:tc(trend)}}>{trend>0?"↑":"↓"} {Math.abs(trend).toFixed(1)}% YoY</div>}</div>);}

function Tip({active,payload,label,fmt=dollar}){if(!active||!payload?.length)return null;return(<div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-xs"><div className="font-bold text-slate-700 mb-1">{label}</div>{payload.map((p,i)=>(<div key={i} className="flex items-center gap-2"><span className="w-2 h-2 rounded-full shrink-0" style={{background:p.color}}/><span className="text-slate-500">{p.name}:</span><span className="font-semibold text-slate-700">{fmt(p.value)}</span></div>))}</div>);}

function NumIn({value,onChange}){return(<input type="number" value={value??""} onChange={e=>{const v=e.target.value;onChange(v===""?null:parseFloat(v));}} className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white text-right" style={{MozAppearance:"textfield"}}/>);}

function Sel({value,onChange,options,className=""}){return(<select value={value} onChange={e=>onChange(e.target.value)} className={`text-sm rounded border border-slate-200 px-3 py-2 bg-white focus:outline-none ${className}`}>{options.map(o=>Array.isArray(o)?<option key={o[0]} value={o[0]}>{o[1]}</option>:<option key={o} value={o}>{o}</option>)}</select>);}

function Btn({onClick,children,variant="primary",small=false}){const base=`font-semibold rounded-lg transition ${small?"px-2 py-1 text-xs":"px-4 py-2 text-sm"}`;if(variant==="primary")return <button onClick={onClick} className={base+" text-white"} style={{background:NAVY}}>{children}</button>;if(variant==="outline")return <button onClick={onClick} className={base+" border border-slate-200 text-slate-500 hover:bg-slate-50"}>{children}</button>;return <button onClick={onClick} className={base+" text-slate-400 hover:text-slate-700 border border-slate-200 hover:bg-slate-50"}>{children}</button>;}

function SubNav({views,active,onChange}){return(<div className="flex gap-1 bg-white rounded-lg shadow-sm px-3 py-2 overflow-x-auto">{views.map(([v,l])=>(<button key={v} onClick={()=>onChange(v)} className={`px-4 py-2 text-sm font-semibold rounded-lg transition whitespace-nowrap ${active===v?"text-white":"text-slate-500 hover:bg-slate-50"}`} style={active===v?{background:NAVY}:{}}>{l}</button>))}</div>);}

function MonthlyTable({cats,byKey,selFY,months,onEdit,fmt=dollar}){return(<div className="bg-white rounded-lg shadow-sm overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr className="bg-slate-50 text-slate-400 uppercase tracking-wider"><th className="px-3 py-2 text-left font-semibold sticky left-0 bg-slate-50">Category</th>{months.map(m=><th key={m} className="px-1.5 py-2 text-center font-semibold">{m.slice(0,3)}</th>)}<th className="px-3 py-2 text-center font-semibold">Total</th><th className="px-2 py-2"/></tr></thead><tbody>{cats.map((cat,i)=>{const row=byKey[`${cat.trim()}__${selFY}`]||{};const total=row.total;return(<tr key={cat} className={`border-t border-slate-50 ${i%2===0?"bg-white":"bg-slate-50/40"} ${total==null?"opacity-30":""}`}><td className="px-3 py-2 font-semibold text-slate-700 whitespace-nowrap sticky left-0 bg-inherit">{cat.trim()}</td>{months.map(m=>{const v=row[m.toLowerCase()];return <td key={m} className={`px-1.5 py-2 text-center font-mono ${v<0?"text-red-500":""}`}>{v!=null?fmt(v):"—"}</td>;})}<td className={`px-3 py-2 text-center font-mono font-bold ${total<0?"text-red-600":total>0?"text-green-700":"text-slate-400"}`}>{total!=null?fmt(total):"—"}</td><td className="px-2 py-2"><Btn onClick={()=>onEdit(cat)} variant="ghost" small>{total!=null?"Edit":"+ Add"}</Btn></td></tr>);})}</tbody></table></div></div>);}

function EntryForm({title,sub,fy,setFY,cat,setCat,cats,months,form,setForm,onSave,onCancel,saving,fmt=dollar}){const total=months.reduce((a,m)=>a+(form[m]||0),0);return(<div className="space-y-5"><button onClick={onCancel} className="text-sm text-slate-400 hover:text-slate-600">← Back</button><div className="flex items-center justify-between flex-wrap gap-3"><div><h2 className="font-bold text-slate-800 text-lg">{title}</h2>{sub&&<p className="text-sm text-slate-400">{sub}</p>}</div><div className="flex gap-2 flex-wrap">{setCat&&cats&&<Sel value={cat} onChange={setCat} options={cats}/>}<Sel value={fy} onChange={setFY} options={FY_LIST}/></div></div><div className="bg-white rounded-xl shadow-sm p-5 space-y-4"><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{months.map(month=>(<div key={month}><label className="block text-xs font-semibold text-slate-500 mb-1">{month}</label><NumIn value={form[month]} onChange={v=>setForm(f=>({...f,[month]:v}))}/></div>))}</div><div className="rounded-lg px-4 py-3 text-sm bg-slate-50 border border-slate-100">Total: <span className="font-bold text-slate-800">{fmt(total)}</span></div><div><label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Notes</label><textarea value={form.notes||""} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} rows={2} className="w-full rounded border border-slate-200 px-3 py-2 text-sm focus:outline-none resize-none"/></div><div className="flex justify-end gap-3"><Btn onClick={onCancel} variant="outline">Cancel</Btn><button onClick={onSave} disabled={saving} className="px-5 py-2 text-sm font-bold text-white rounded-lg disabled:opacity-40" style={{background:NAVY}}>{saving?"Saving…":"Save"}</button></div></div></div>);}

function TrendChart({data,xKey,keys,title,fmt=dollar,height=200}){return(<div className="bg-white rounded-lg shadow-sm p-4"><h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">{title}</h3><ResponsiveContainer width="100%" height={height}><LineChart data={data} margin={{top:5,right:10,left:10,bottom:5}}><CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/><XAxis dataKey={xKey} tick={{fontSize:10}}/><YAxis tick={{fontSize:10}} tickFormatter={v=>v>=1000000?`$${(v/1000000).toFixed(1)}M`:v>=1000?`$${(v/1000).toFixed(0)}k`:String(Math.round(v))}/><Tooltip content={<Tip fmt={fmt}/>}/><Legend/>{keys.map((k,i)=><Line key={k.key} type="monotone" dataKey={k.key} name={k.name||k.key} stroke={CHART_COLORS[i]} strokeWidth={2} dot={{r:3}} connectNulls/>)}</LineChart></ResponsiveContainer></div>);}

function CmpChart({data,xKey,keyA,keyB,labelA,labelB,title,fmt=dollar,height=220,angle=0}){return(<div className="bg-white rounded-lg shadow-sm p-4"><h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">{title}</h3><ResponsiveContainer width="100%" height={height}><BarChart data={data} margin={{top:5,right:10,left:10,bottom:angle?70:10}}><CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/><XAxis dataKey={xKey} tick={{fontSize:10}} angle={angle} textAnchor={angle?"end":"middle"} interval={0}/><YAxis tick={{fontSize:10}} tickFormatter={v=>v>=1000000?`$${(v/1000000).toFixed(1)}M`:v>=1000?`$${(v/1000).toFixed(0)}k`:String(Math.round(v))}/><Tooltip content={<Tip fmt={fmt}/>}/><Legend/><Bar dataKey={keyA} name={labelA} fill={NAVY}/><Bar dataKey={keyB} name={labelB} fill={GOLD}/></BarChart></ResponsiveContainer></div>);}

// ── useMonthlyEntry: shared hook for fiscal-year monthly data entry ────────
function useMonthlyEntry({db,table,catField="category",conflictKey}){
  const [showEntry,setShow]=useState(false);
  const [selFY,setFY]=useState("2025/26");
  const [selCat,setCat]=useState("");
  const [form,setForm]=useState({});
  const [saving,setSaving]=useState(false);

  function open(cat,fy,existing){
    setCat(cat);setFY(fy);
    const f={notes:existing?.notes||""};
    FY_MONTHS.forEach(m=>{f[m]=existing?.[m.toLowerCase()]??null;});
    setForm(f);setShow(true);
  }

  async function save(reload){
    setSaving(true);
    const row={[catField]:selCat.trim(),fiscal_year:selFY,notes:form.notes||""};
    let total=0;
    FY_MONTHS.forEach(m=>{row[m.toLowerCase()]=form[m]??null;if(form[m])total+=form[m];});
    row.total=total;
    await db.from(table).upsert(row,{onConflict:conflictKey});
    setSaving(false);setShow(false);reload();
  }

  return {showEntry,setShow,selFY,setFY,selCat,setCat,form,setForm,saving,open,save};
}

// ══════════════════════════════════════════════════════════════════════════════
// CAMPS
// ══════════════════════════════════════════════════════════════════════════════
function CampsModule({db}){
  const [data,setData]=useState([]);
  const [view,setView]=useState("overview");
  const [selCamp,setSC]=useState(null);
  const [selYear,setSY]=useState(new Date().getFullYear());
  const [editRow,setER]=useState(null);
  const [saving,setSaving]=useState(false);
  const [form,setForm]=useState({enrollment:null,revenue:null,expenses:null,notes:""});
  const [cmpA,setCmpA]=useState(2023);
  const [cmpB,setCmpB]=useState(2024);
  const [showEntry,setShowEntry]=useState(false);

  const load=useCallback(async()=>{const {data:r}=await db.from("camp_annual").select("*").order("camp").order("year");setData(r||[]);},[db]);
  useEffect(()=>{load();},[load]);

  const byKey=useMemo(()=>{const m={};data.forEach(r=>{m[`${r.camp}__${r.year}`]=r;});return m;},[data]);

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

  function openEntry(camp,year){
    const ex=byKey[`${camp}__${year}`];
    setSC(camp);setSY(year);setER(ex||null);
    setForm({enrollment:ex?.enrollment??null,revenue:ex?.revenue??null,expenses:ex?.expenses??null,notes:ex?.notes||""});
    setShowEntry(true);
  }

  async function saveEntry(){
    setSaving(true);
    const pl=(form.revenue||0)-(form.expenses||0);
    const payload={camp:selCamp,year:selYear,enrollment:form.enrollment,revenue:form.revenue,expenses:form.expenses,profit_loss:pl,notes:form.notes||""};
    if(editRow?.id){await db.from("camp_annual").update(payload).eq("id",editRow.id);}
    else{await db.from("camp_annual").upsert(payload,{onConflict:"camp,year"});}
    setSaving(false);setShowEntry(false);load();
  }

  if(showEntry){return(<div className="space-y-4">
    <button onClick={()=>setShowEntry(false)} className="text-sm text-slate-400 hover:text-slate-600">← Back</button>
    <div className="flex items-center justify-between flex-wrap gap-2">
      <div><h2 className="font-bold text-slate-800 text-lg">{CAMP_DISPLAY[selCamp]}</h2><p className="text-sm text-slate-400">{selYear}</p></div>
      <Sel value={selYear} onChange={v=>setSY(parseInt(v))} options={CAMP_YEARS}/>
    </div>
    <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[["Enrollment","enrollment"],["Revenue ($)","revenue"],["Expenses ($)","expenses"]].map(([label,key])=>(
          <div key={key}><label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{label}</label><NumIn value={form[key]} onChange={v=>setForm(f=>({...f,[key]:v}))}/></div>
        ))}
      </div>
      {form.revenue!=null&&form.expenses!=null&&(
        <div className="rounded-lg px-4 py-3 text-sm" style={{background:"#f0fdf4",border:"1px solid #bbf7d0"}}>
          P/(L): <span className="font-bold" style={{color:(form.revenue-form.expenses)>=0?"#16a34a":"#dc2626"}}>{dollar((form.revenue||0)-(form.expenses||0))}</span>
          {form.revenue>0&&<span className="ml-3 text-slate-400">Margin: {pct(((form.revenue-form.expenses)/form.revenue))}</span>}
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
    const allRows=CAMP_YEARS.map(yr=>({year:yr,...(byKey[`${selCamp}__${yr}`]||{})}));
    return(<div className="space-y-5">
      <button onClick={()=>setView("overview")} className="text-sm text-slate-400 hover:text-slate-600">← All Camps</button>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div><h2 className="font-bold text-slate-800 text-lg">{CAMP_DISPLAY[selCamp]}</h2><p className="text-sm text-slate-400">Year-over-year performance</p></div>
        <Btn onClick={()=>openEntry(selCamp,new Date().getFullYear())}>+ Enter Data</Btn>
      </div>
      {campRows.length>1&&(
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TrendChart data={campRows} xKey="year" keys={[{key:"enrollment",name:"Enrollment"}]} title="Enrollment Trend" fmt={v=>num(v)} height={180}/>
          <TrendChart data={campRows} xKey="year" keys={[{key:"revenue",name:"Revenue"},{key:"expenses",name:"Expenses"}]} title="Revenue vs Expenses" height={180}/>
        </div>
      )}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-slate-50 text-xs text-slate-400 uppercase tracking-wider">
            {["Year","Enrollment","Revenue","Expenses","P/(L)","Margin",""].map(h=><th key={h} className="px-4 py-2 text-left font-semibold">{h}</th>)}
          </tr></thead>
          <tbody>{allRows.map((r,i)=>{
            const hasData=r.revenue>0||r.enrollment>0;
            const margin=r.revenue>0?((r.revenue-(r.expenses||0))/r.revenue):null;
            return(<tr key={r.year} className={`border-t border-slate-50 ${i%2===0?"bg-white":"bg-slate-50/40"} ${!hasData?"opacity-30":""}`}>
              <td className="px-4 py-2.5 font-semibold text-slate-700">{r.year}</td>
              <td className="px-4 py-2.5 font-mono">{r.enrollment>0?num(r.enrollment):r.year<=2025?"DNR/DNO":"—"}</td>
              <td className="px-4 py-2.5 font-mono">{r.revenue>0?dollar(r.revenue):"—"}</td>
              <td className="px-4 py-2.5 font-mono">{r.expenses>0?dollar(r.expenses):"—"}</td>
              <td className={`px-4 py-2.5 font-mono font-semibold ${(r.profit_loss||0)>=0?"text-green-700":"text-red-600"}`}>{r.profit_loss!=null&&hasData?dollar(r.profit_loss):"—"}</td>
              <td className="px-4 py-2.5 font-mono text-slate-500">{margin!=null?pct(margin):"—"}</td>
              <td className="px-4 py-2.5"><Btn onClick={()=>openEntry(selCamp,r.year)} variant="ghost" small>{hasData?"Edit":"+ Add"}</Btn></td>
            </tr>);
          })}</tbody>
        </table>
      </div>
    </div>);}

  return(<div className="space-y-6">
    <div className="flex items-center justify-between"><h2 className="font-bold text-slate-800 text-base">Camps — Portfolio Overview</h2></div>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <KCard label="Total Enrollment" value={latest?num(latest.enrollment):"—"} sub={latest?`${latest.year} season`:""} accent={NAVY} trend={latest&&prior&&prior.enrollment>0?((latest.enrollment-prior.enrollment)/prior.enrollment)*100:null}/>
      <KCard label="Total Revenue" value={latest?dollar(latest.revenue):"—"} sub={latest?`${latest.year} season`:""} accent={GOLD} trend={latest&&prior&&prior.revenue>0?((latest.revenue-prior.revenue)/prior.revenue)*100:null}/>
      <KCard label="Total Expenses" value={latest?dollar(latest.expenses):"—"} sub={latest?`${latest.year}`:""} accent="#64748b"/>
      <KCard label="Net P/(L)" value={latest?dollar(latest.profit_loss):"—"} sub={latest?`${latest.year}`:""} accent={latest&&latest.profit_loss>=0?"#22c55e":"#ef4444"}/>
    </div>
    {portfolio.length>1&&<TrendChart data={portfolio} xKey="year" keys={[{key:"enrollment",name:"Total Enrollment"}]} title="Portfolio Enrollment by Year" fmt={v=>num(v)} height={200}/>}
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
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-bold text-slate-700 text-sm">All Camps — Latest Year</h3>
        <span className="text-xs text-slate-400">Click camp name for full history</span>
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
          <td className="px-3 py-2.5 font-mono text-slate-500">{c.latest?.revenue>0?pct((c.latest.revenue-(c.latest.expenses||0))/c.latest.revenue):"—"}</td>
          <td className="px-3 py-2.5">{c.enrTrend!=null&&<span className="text-xs font-semibold" style={{color:tc(c.enrTrend)}}>{c.enrTrend>=0?"↑":"↓"}{Math.abs(c.enrTrend).toFixed(1)}%</span>}</td>
          <td className="px-3 py-2.5"><Btn onClick={()=>openEntry(c.camp,new Date().getFullYear())} variant="ghost" small>+ Add</Btn></td>
        </tr>))}</tbody>
      </table>
    </div>
  </div>);
}

// ══════════════════════════════════════════════════════════════════════════════
// CLUBHOUSE
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
      if(avgs.length>0||rev>0)m[yr]={year:yr,total:avgs.reduce((a,b)=>a+b,0),revenue:rev,profit_loss:pl};
    });
    return Object.values(m).sort((a,b)=>a.year-b.year);
  },[siteAvg,finByKey]);

  const cmpData=useMemo(()=>CB_SITES.map(site=>({
    site,
    [cmpA]:siteAvg[site]?.[cmpA]!=null?Math.round(siteAvg[site][cmpA]*10)/10:0,
    [cmpB]:siteAvg[site]?.[cmpB]!=null?Math.round(siteAvg[site][cmpB]*10)/10:0,
  })).filter(r=>r[cmpA]>0||r[cmpB]>0),[siteAvg,cmpA,cmpB]);

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
    const ops=CB_MONTHS.filter(mo=>enrForm[mo]!=null).map(mo=>
      db.from("clubhouse_enrollment").upsert({site:selSite,year:entryYear,month:mo,enrollment:enrForm[mo]},{onConflict:"site,year,month"})
    );
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
            <p className="text-xs text-slate-400">Average monthly enrollment — school year August through May</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {CB_MONTHS.map(month=>(<div key={month}><label className="block text-xs font-semibold text-slate-500 mb-1">{month}</label><NumIn value={enrForm[month]} onChange={v=>setEnrForm(f=>({...f,[month]:v}))}/></div>))}
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Btn onClick={()=>setShowEntry(false)} variant="outline">Cancel</Btn>
              <button onClick={saveEnr} disabled={saving} className="px-5 py-2 text-sm font-bold text-white rounded-lg disabled:opacity-40" style={{background:NAVY}}>{saving?"Saving…":"Save Enrollment"}</button>
            </div>
          </div>
        ):(
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[["Revenue ($)","revenue"],["Site Staff Expenses ($)","expenses"]].map(([label,key])=>(
                <div key={key}><label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{label}</label><NumIn value={finForm[key]} onChange={v=>setFinForm(f=>({...f,[key]:v}))}/></div>
              ))}
            </div>
            {finForm.revenue!=null&&finForm.expenses!=null&&(
              <div className="rounded-lg px-4 py-3 text-sm" style={{background:"#f0fdf4",border:"1px solid #bbf7d0"}}>
                P/(L): <span className="font-bold" style={{color:(finForm.revenue-finForm.expenses)>=0?"#16a34a":"#dc2626"}}>{dollar((finForm.revenue||0)-(finForm.expenses||0))}</span>
              </div>
            )}
            <div><label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Notes</label>
              <textarea value={finForm.notes} onChange={e=>setFinForm(f=>({...f,notes:e.target.value}))} rows={2} className="w-full rounded border border-slate-200 px-3 py-2 text-sm focus:outline-none resize-none"/></div>
            <div className="flex justify-end gap-3">
              <Btn onClick={()=>setShowEntry(false)} variant="outline">Cancel</Btn>
              <button onClick={saveFin} disabled={saving} className="px-5 py-2 text-sm font-bold text-white rounded-lg disabled:opacity-40" style={{background:NAVY}}>{saving?"Saving…":"Save Financials"}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>);}

  if(view==="detail"&&selSite){
    const siteAvgs=CB_YEARS.map(yr=>({year:yr,avg:siteAvg[selSite]?.[yr]})).filter(r=>r.avg!=null);
    return(<div className="space-y-5">
      <button onClick={()=>setView("overview")} className="text-sm text-slate-400 hover:text-slate-600">← All Sites</button>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div><h2 className="font-bold text-slate-800 text-lg">{selSite}</h2><p className="text-sm text-slate-400">Monthly enrollment and annual financials</p></div>
        <Btn onClick={()=>openEntry(selSite,new Date().getFullYear())}>+ Enter Data</Btn>
      </div>
      {siteAvgs.length>1&&<TrendChart data={siteAvgs} xKey="year" keys={[{key:"avg",name:"Avg Enrollment"}]} title="Average Monthly Enrollment by Year" fmt={v=>v.toFixed(1)} height={200}/>}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100"><h3 className="font-bold text-slate-700 text-sm">Monthly Enrollment</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="bg-slate-50 text-slate-400 uppercase tracking-wider">
                <th className="px-3 py-2 text-left font-semibold">Year</th>
                {CB_MONTHS.map(m=><th key={m} className="px-1.5 py-2 text-center font-semibold">{m.slice(0,3)}</th>)}
                <th className="px-3 py-2 text-center font-semibold">Avg</th><th className="px-2 py-2"/>
              </tr></thead>
              <tbody>{CB_YEARS.map((yr,i)=>{
                const vals=CB_MONTHS.map(mo=>enrByKey[`${selSite}__${yr}__${mo}`]?.enrollment);
                const hasAny=vals.some(v=>v!=null);
                const avg=siteAvg[selSite]?.[yr];
                return(<tr key={yr} className={`border-t border-slate-50 ${i%2===0?"bg-white":"bg-slate-50/40"} ${!hasAny?"opacity-30":""}`}>
                  <td className="px-3 py-2 font-semibold text-slate-700">{yr}</td>
                  {vals.map((v,mi)=><td key={mi} className="px-1.5 py-2 text-center font-mono">{v!=null?Math.round(v):"—"}</td>)}
                  <td className="px-3 py-2 text-center font-mono font-bold">{avg!=null?avg.toFixed(1):"—"}</td>
                  <td className="px-2 py-2"><Btn onClick={()=>openEntry(selSite,yr)} variant="ghost" small>{hasAny?"Edit":"+"}</Btn></td>
                </tr>);
              })}</tbody>
            </table>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100"><h3 className="font-bold text-slate-700 text-sm">Annual Financials</h3></div>
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 text-xs text-slate-400 uppercase tracking-wider">
              {["Year","Revenue","Expenses","P/(L)","Margin",""].map(h=><th key={h} className="px-3 py-2 text-left font-semibold">{h}</th>)}
            </tr></thead>
            <tbody>{CB_YEARS.map((yr,i)=>{
              const f=finByKey[`${selSite}__${yr}`];
              return(<tr key={yr} className={`border-t border-slate-50 ${i%2===0?"bg-white":"bg-slate-50/40"} ${!f?"opacity-30":""}`}>
                <td className="px-3 py-2.5 font-semibold text-slate-700">{yr}</td>
                <td className="px-3 py-2.5 font-mono">{f?.revenue>0?dollar(f.revenue):"—"}</td>
                <td className="px-3 py-2.5 font-mono">{f?.expenses>0?dollar(f.expenses):"—"}</td>
                <td className={`px-3 py-2.5 font-mono font-semibold ${(f?.profit_loss||0)>=0?"text-green-700":"text-red-600"}`}>{f?.profit_loss!=null?dollar(f.profit_loss):"—"}</td>
                <td className="px-3 py-2.5 font-mono text-slate-500">{f?.revenue>0?pct((f.revenue-(f.expenses||0))/f.revenue):"—"}</td>
                <td className="px-3 py-2.5"><Btn onClick={()=>openEntry(selSite,yr)} variant="ghost" small>{f?"Edit":"+ Add"}</Btn></td>
              </tr>);
            })}</tbody>
          </table>
        </div>
      </div>
    </div>);}

  const latestData=CB_SITES.map(site=>{
    for(const yr of CB_YEARS.slice().reverse()){const a=siteAvg[site]?.[yr];if(a!=null)return{site,year:yr,avg:a,fin:finByKey[`${site}__${yr}`]||null};}
    return{site,year:null,avg:null,fin:null};
  });
  const latestPL=portfolio[portfolio.length-1];
  return(<div className="space-y-6">
    <div className="flex items-center justify-between"><h2 className="font-bold text-slate-800 text-base">Clubhouse — All Sites</h2></div>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <KCard label="Combined Avg Enrollment" value={num(Math.round(latestData.reduce((a,r)=>a+(r.avg||0),0)))} sub="All sites" accent={NAVY}/>
      <KCard label="Sites" value={CB_SITES.length} accent={GOLD}/>
      <KCard label="Total Revenue" value={latestPL?.revenue>0?dollar(latestPL.revenue):"—"} sub={`${latestPL?.year||""}`} accent="#22c55e"/>
      <KCard label="Total P/(L)" value={latestPL?dollar(latestPL.profit_loss):"—"} sub={`${latestPL?.year||""}`} accent={NAVY}/>
    </div>
    {portfolio.length>1&&<TrendChart data={portfolio} xKey="year" keys={[{key:"total",name:"Total Enrollment"},{key:"revenue",name:"Revenue"}]} title="Portfolio Enrollment & Revenue by Year" fmt={v=>v>=1000?dollar(v):num(v)} height={220}/>}
    <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Site Enrollment Comparison</h3>
        <div className="flex items-center gap-2">
          <Sel value={cmpA} onChange={v=>setCmpA(parseInt(v))} options={CB_YEARS}/>
          <span className="text-xs text-slate-400">vs</span>
          <Sel value={cmpB} onChange={v=>setCmpB(parseInt(v))} options={CB_YEARS}/>
        </div>
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
        <thead><tr className="bg-slate-50 text-xs text-slate-400 uppercase tracking-wider">
          {["Site","Year","Avg Enrollment","Revenue","Expenses","P/(L)","Margin",""].map(h=><th key={h} className="px-3 py-2 text-left font-semibold">{h}</th>)}
        </tr></thead>
        <tbody>{latestData.map((r,i)=>(<tr key={r.site} className={`border-t border-slate-50 hover:bg-slate-50 ${i%2===0?"bg-white":"bg-slate-50/40"}`}>
          <td className="px-3 py-2.5"><button onClick={()=>{setSite(r.site);setView("detail");}} className="font-semibold text-slate-700 hover:text-blue-600 hover:underline">{r.site}</button></td>
          <td className="px-3 py-2.5 text-slate-400">{r.year||"—"}</td>
          <td className="px-3 py-2.5 font-mono">{r.avg!=null?r.avg.toFixed(1):"—"}</td>
          <td className="px-3 py-2.5 font-mono">{r.fin?.revenue>0?dollar(r.fin.revenue):"—"}</td>
          <td className="px-3 py-2.5 font-mono">{r.fin?.expenses>0?dollar(r.fin.expenses):"—"}</td>
          <td className={`px-3 py-2.5 font-mono font-semibold ${(r.fin?.profit_loss||0)>=0?"text-green-700":"text-red-600"}`}>{r.fin?.profit_loss!=null?dollar(r.fin.profit_loss):"—"}</td>
          <td className="px-3 py-2.5 font-mono text-slate-500">{r.fin?.revenue>0?pct((r.fin.revenue-(r.fin.expenses||0))/r.fin.revenue):"—"}</td>
          <td className="px-3 py-2.5"><Btn onClick={()=>openEntry(r.site,new Date().getFullYear())} variant="ghost" small>+ Enter</Btn></td>
        </tr>))}</tbody>
      </table>
    </div>
  </div>);}

// ══════════════════════════════════════════════════════════════════════════════
// RECREATION
// ══════════════════════════════════════════════════════════════════════════════
function RecreationModule({db}){
  const [plData,setPlData]=useState([]);
  const [revData,setRevData]=useState([]);
  const [expData,setExpData]=useState([]);
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
    const [{data:p},{data:r},{data:e}]=await Promise.all([
      db.from("rec_pl").select("*"),
      db.from("rec_revenue").select("*"),
      db.from("rec_expenses").select("*"),
    ]);
    setPlData(p||[]);setRevData(r||[]);setExpData(e||[]);
  },[db]);
  useEffect(()=>{load();},[load]);

  const plByKey=useMemo(()=>{const m={};plData.forEach(r=>{m[`${r.category.trim()}__${r.fiscal_year}`]=r;});return m;},[plData]);
  const revByKey=useMemo(()=>{const m={};revData.forEach(r=>{m[`${r.category.trim()}__${r.fiscal_year}`]=r;});return m;},[revData]);
  const expByKey=useMemo(()=>{const m={};expData.forEach(r=>{m[`${r.category.trim()}__${r.fiscal_year}`]=r;});return m;},[expData]);

  const latestFY=useMemo(()=>FY_LIST.slice().reverse().find(fy=>plData.some(r=>r.fiscal_year===fy))||"2025/26",[plData]);

  const overviewByFY=useMemo(()=>FY_LIST.map(fy=>{
    const rev=revData.find(r=>r.fiscal_year===fy&&r.category.trim()==="Overall Revenue");
    if(!rev)return null;
    return{fy,revenue:rev.total||0};
  }).filter(Boolean),[revData]);

  const cmpData=useMemo(()=>REC_PL_CATS.map(cat=>{
    const a=plByKey[`${cat.trim()}__${cmpA}`];
    const b=plByKey[`${cat.trim()}__${cmpB}`];
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
    let total=0;
    FY_MONTHS.forEach(m=>{row[m.toLowerCase()]=form[m]??null;if(form[m])total+=form[m];});
    row.total=total;
    await db.from(table).upsert(row,{onConflict:"category,fiscal_year"});
    setSaving(false);setShowEntry(false);load();
  }

  if(showEntry){
    const cats=entryType==="pl"?REC_PL_CATS:entryType==="revenue"?REC_REV_CATS:REC_EXP_CATS;
    const label=entryType==="pl"?"P/L":entryType==="revenue"?"Revenue":"Expenses";
    return(<div className="space-y-5">
      <button onClick={()=>setShowEntry(false)} className="text-sm text-slate-400 hover:text-slate-600">← Back</button>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h2 className="font-bold text-slate-800 text-lg">Enter {label}</h2><p className="text-sm text-slate-400">{entryCat} · {entryFY}</p></div>
        <div className="flex gap-2 flex-wrap">
          <Sel value={entryCat} onChange={v=>setEC(v)} options={cats}/>
          <Sel value={entryFY} onChange={v=>setEFY(v)} options={FY_LIST}/>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {FY_MONTHS.map(month=>(<div key={month}><label className="block text-xs font-semibold text-slate-500 mb-1">{month}</label><NumIn value={form[month]} onChange={v=>setForm(f=>({...f,[month]:v}))}/></div>))}
        </div>
        <div className="rounded-lg px-4 py-3 text-sm bg-slate-50 border border-slate-100">
          Total: <span className="font-bold text-slate-800">{dollar(FY_MONTHS.reduce((a,m)=>a+(form[m]||0),0))}</span>
        </div>
        <div><label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Notes</label>
          <textarea value={form.notes||""} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} rows={2} className="w-full rounded border border-slate-200 px-3 py-2 text-sm focus:outline-none resize-none"/></div>
        <div className="flex justify-end gap-3">
          <Btn onClick={()=>setShowEntry(false)} variant="outline">Cancel</Btn>
          <button onClick={saveEntry} disabled={saving} className="px-5 py-2 text-sm font-bold text-white rounded-lg disabled:opacity-40" style={{background:NAVY}}>{saving?"Saving…":"Save"}</button>
        </div>
      </div>
    </div>);}

  const subViews=[["overview","Overview"],["pl","P/L by Area"],["revenue","Revenue"],["expenses","Expenses"]];

  const renderTable=(cats,byKey,type)=>(
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-semibold text-slate-700">{type==="pl"?"P/L":type==="revenue"?"Revenue":"Expenses"} by Area</h3>
        <Sel value={selFY} onChange={setSelFY} options={FY_LIST}/>
      </div>
      <MonthlyTable cats={cats} byKey={byKey} selFY={selFY} months={FY_MONTHS} onEdit={cat=>openEntry(type,cat,selFY)}/>
    </div>
  );

  return(<div className="space-y-6">
    <div className="flex items-center justify-between flex-wrap gap-2">
      <div><h2 className="font-bold text-slate-800 text-base">Recreation — Fund 4</h2><p className="text-xs text-slate-400 mt-0.5">Program P/L, revenue, and expenses by area</p></div>
      <Btn onClick={()=>openEntry("pl",REC_PL_CATS[0],latestFY)}>+ Enter Data</Btn>
    </div>
    <SubNav views={subViews} active={subView} onChange={setSubView}/>

    {subView==="overview"&&(
      <div className="space-y-5">
        {overviewByFY.length>1&&<TrendChart data={overviewByFY} xKey="fy" keys={[{key:"revenue",name:"Revenue"}]} title="Overall Revenue by Fiscal Year" height={200}/>}
        <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">P/L by Area — Year Comparison</h3>
            <div className="flex items-center gap-2">
              <Sel value={cmpA} onChange={setCmpA} options={FY_LIST}/>
              <span className="text-xs text-slate-400">vs</span>
              <Sel value={cmpB} onChange={setCmpB} options={FY_LIST}/>
            </div>
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
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-700 text-sm">P/L by Area</h3>
            <Sel value={selFY} onChange={setSelFY} options={FY_LIST}/>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 text-xs text-slate-400 uppercase tracking-wider">
              {["Program Area","Annual P/(L)","Margin",""].map(h=><th key={h} className="px-4 py-2 text-left font-semibold">{h}</th>)}
            </tr></thead>
            <tbody>{REC_PL_CATS.map((cat,i)=>{
              const row=plByKey[`${cat.trim()}__${selFY}`];
              return(<tr key={cat} className={`border-t border-slate-50 ${i%2===0?"bg-white":"bg-slate-50/40"} ${!row?"opacity-30":""}`}>
                <td className="px-4 py-2.5 font-semibold text-slate-700">{cat.trim()}</td>
                <td className={`px-4 py-2.5 font-mono font-semibold ${(row?.total||0)>=0?"text-green-700":"text-red-600"}`}>{row?.total!=null?dollar(row.total):"—"}</td>
                <td className="px-4 py-2.5 font-mono text-slate-500">{row?.margin!=null?pct(row.margin):"—"}</td>
                <td className="px-4 py-2.5"><Btn onClick={()=>openEntry("pl",cat,selFY)} variant="ghost" small>{row?"Edit":"+ Add"}</Btn></td>
              </tr>);
            })}</tbody>
          </table>
        </div>
      </div>
    )}
    {subView==="pl"&&renderTable(REC_PL_CATS,plByKey,"pl")}
    {subView==="revenue"&&renderTable(REC_REV_CATS,revByKey,"revenue")}
    {subView==="expenses"&&renderTable(REC_EXP_CATS,expByKey,"expenses")}
  </div>);}

// ══════════════════════════════════════════════════════════════════════════════
// FITNESS
// ══════════════════════════════════════════════════════════════════════════════
function FitnessModule({db}){
  const [revData,setRevData]=useState([]);
  const [expData,setExpData]=useState([]);
  const [plData,setPlData]=useState([]);
  const [kpiData,setKpiData]=useState([]);
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
    const [{data:r},{data:e},{data:p},{data:k}]=await Promise.all([
      db.from("fitness_revenue").select("*"),
      db.from("fitness_expenses").select("*"),
      db.from("fitness_pl").select("*"),
      db.from("fitness_kpis").select("*"),
    ]);
    setRevData(r||[]);setExpData(e||[]);setPlData(p||[]);setKpiData(k||[]);
  },[db]);
  useEffect(()=>{load();},[load]);

  const revByKey=useMemo(()=>{const m={};revData.forEach(r=>{m[`${r.category}__${r.fiscal_year}`]=r;});return m;},[revData]);
  const expByKey=useMemo(()=>{const m={};expData.forEach(r=>{m[`${r.category}__${r.fiscal_year}`]=r;});return m;},[expData]);
  const plByKey=useMemo(()=>{const m={};plData.forEach(r=>{m[`${r.category}__${r.fiscal_year}__${r.type}`]=r;});return m;},[plData]);
  const kpiByKey=useMemo(()=>{const m={};kpiData.forEach(r=>{m[`${r.metric}__${r.fiscal_year}`]=r;});return m;},[kpiData]);

  const latestFY=useMemo(()=>FY_LIST.slice().reverse().find(fy=>revData.some(r=>r.fiscal_year===fy))||"2025/26",[revData]);

  const revByFY=useMemo(()=>FY_LIST.map(fy=>{
    const r=revByKey[`Overall Revenue__${fy}`];
    const m=revByKey[`Memberships__${fy}`];
    const pt=revByKey[`Personal Training__${fy}`];
    const sp=revByKey[`Specialty Programs__${fy}`];
    if(!r&&!m)return null;
    return{fy,total:r?.total,memberships:m?.total,pt:pt?.total,specialty:sp?.total};
  }).filter(Boolean),[revByKey]);

  const membersByFY=useMemo(()=>FY_LIST.map(fy=>{
    const am=kpiByKey[`Active Members__${fy}`];
    const nm=kpiByKey[`New Members__${fy}`];
    const ca=kpiByKey[`Cancellations__${fy}`];
    const mv=kpiByKey[`Member Visits__${fy}`];
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
    const f={notes:ex.notes||""};
    FY_MONTHS.forEach(m=>{f[m]=ex[m.toLowerCase()]??null;});
    setForm(f);setShowEntry(true);
  }

  async function saveEntry(){
    setSaving(true);
    const table=entryType==="revenue"?"fitness_revenue":entryType==="expenses"?"fitness_expenses":"fitness_kpis";
    const isKPI=entryType==="kpis";
    const row=isKPI?{metric:entryCat,fiscal_year:entryFY,notes:form.notes||""}:{category:entryCat,fiscal_year:entryFY,notes:form.notes||""};
    let total=0;
    FY_MONTHS.forEach(m=>{row[m.toLowerCase()]=form[m]??null;if(form[m])total+=form[m];});
    row.total=total;
    await db.from(table).upsert(row,{onConflict:isKPI?"metric,fiscal_year":"category,fiscal_year"});
    setSaving(false);setShowEntry(false);load();
  }

  if(showEntry){
    const cats=entryType==="revenue"?FIT_REV_CATS:entryType==="expenses"?FIT_EXP_CATS:FIT_KPI_METRICS;
    const fmt=entryType==="kpis"?num:dollar;
    const label=entryType==="revenue"?"Revenue":entryType==="expenses"?"Expenses":"KPI";
    return(<div className="space-y-5">
      <button onClick={()=>setShowEntry(false)} className="text-sm text-slate-400 hover:text-slate-600">← Back</button>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h2 className="font-bold text-slate-800 text-lg">Enter {label}</h2><p className="text-sm text-slate-400">{entryCat} · {entryFY}</p></div>
        <div className="flex gap-2 flex-wrap">
          <Sel value={entryCat} onChange={setEC} options={cats}/>
          <Sel value={entryFY} onChange={setEFY} options={FY_LIST}/>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {FY_MONTHS.map(month=>(<div key={month}><label className="block text-xs font-semibold text-slate-500 mb-1">{month}</label><NumIn value={form[month]} onChange={v=>setForm(f=>({...f,[month]:v}))}/></div>))}
        </div>
        <div className="rounded-lg px-4 py-3 text-sm bg-slate-50 border border-slate-100">
          Total: <span className="font-bold text-slate-800">{fmt(FY_MONTHS.reduce((a,m)=>a+(form[m]||0),0))}</span>
        </div>
        <div><label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Notes</label>
          <textarea value={form.notes||""} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} rows={2} className="w-full rounded border border-slate-200 px-3 py-2 text-sm focus:outline-none resize-none"/></div>
        <div className="flex justify-end gap-3">
          <Btn onClick={()=>setShowEntry(false)} variant="outline">Cancel</Btn>
          <button onClick={saveEntry} disabled={saving} className="px-5 py-2 text-sm font-bold text-white rounded-lg disabled:opacity-40" style={{background:NAVY}}>{saving?"Saving…":"Save"}</button>
        </div>
      </div>
    </div>);}

  const subViews=[["overview","Overview"],["revenue","Revenue"],["expenses","Expenses"],["kpis","Membership KPIs"],["pl","P/L Detail"]];
  const latestMem=membersByFY[membersByFY.length-1];const priorMem=membersByFY[membersByFY.length-2];
  const latestRev=revByFY[revByFY.length-1];const priorRev=revByFY[revByFY.length-2];
  const memTrend=latestMem&&priorMem&&priorMem.activeMembers?((latestMem.activeMembers-priorMem.activeMembers)/priorMem.activeMembers)*100:null;
  const revTrend=latestRev&&priorRev&&priorRev.total?((latestRev.total-priorRev.total)/priorRev.total)*100:null;

  return(<div className="space-y-6">
    <div className="flex items-center justify-between flex-wrap gap-2">
      <div><h2 className="font-bold text-slate-800 text-base">Fitness Center — Fund 21</h2><p className="text-xs text-slate-400 mt-0.5">Revenue, expenses, P/L, and membership KPIs</p></div>
      <Btn onClick={()=>openEntry("revenue",FIT_REV_CATS[0],latestFY)}>+ Enter Data</Btn>
    </div>
    <SubNav views={subViews} active={subView} onChange={setSubView}/>

    {subView==="overview"&&(<div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KCard label="Total Revenue" value={latestRev?dollar(latestRev.total):"—"} sub={latestFY} accent={NAVY} trend={revTrend}/>
        <KCard label="Active Members" value={latestMem?num(latestMem.activeMembers):"—"} sub={latestFY} accent={GOLD} trend={memTrend}/>
        <KCard label="New Members" value={latestMem?num(latestMem.newMembers):"—"} sub={latestFY} accent="#22c55e"/>
        <KCard label="Cancellations" value={latestMem?num(latestMem.cancellations):"—"} sub={latestFY} accent="#ef4444"/>
      </div>
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
          <div className="flex items-center gap-2">
            <Sel value={cmpA} onChange={setCmpA} options={FY_LIST}/>
            <span className="text-xs text-slate-400">vs</span>
            <Sel value={cmpB} onChange={setCmpB} options={FY_LIST}/>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={expCmp} margin={{top:5,right:10,left:10,bottom:5}}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
            <XAxis dataKey="category" tick={{fontSize:10}}/><YAxis tickFormatter={v=>`$${(v/1000).toFixed(0)}k`} tick={{fontSize:10}}/>
            <Tooltip content={<Tip/>}/><Legend/>
            <Bar dataKey={cmpA} name={cmpA} fill={NAVY}/>
            <Bar dataKey={cmpB} name={cmpB} fill={GOLD}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>)}

    {(subView==="revenue"||subView==="expenses")&&(
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-semibold text-slate-700">{subView==="revenue"?"Revenue":"Expenses"} by Category</h3>
          <div className="flex gap-2"><Sel value={selFY} onChange={setSelFY} options={FY_LIST}/><Btn onClick={()=>openEntry(subView,subView==="revenue"?FIT_REV_CATS[0]:FIT_EXP_CATS[0],selFY)}>+ Enter</Btn></div>
        </div>
        <MonthlyTable cats={subView==="revenue"?FIT_REV_CATS:FIT_EXP_CATS} byKey={subView==="revenue"?revByKey:expByKey} selFY={selFY} months={FY_MONTHS} onEdit={cat=>openEntry(subView,cat,selFY)}/>
      </div>
    )}

    {subView==="kpis"&&(
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-semibold text-slate-700">Membership & Participation KPIs</h3>
          <div className="flex gap-2"><Sel value={selFY} onChange={setSelFY} options={FY_LIST}/><Btn onClick={()=>openEntry("kpis",FIT_KPI_METRICS[0],selFY)}>+ Enter</Btn></div>
        </div>
        <MonthlyTable cats={FIT_KPI_METRICS} byKey={kpiByKey} selFY={selFY} months={FY_MONTHS} onEdit={cat=>openEntry("kpis",cat,selFY)} fmt={num}/>
      </div>
    )}

    {subView==="pl"&&(
      <div className="space-y-6">
        <h3 className="font-semibold text-slate-700">P/L Detail — Personal Training & Specialty Programs</h3>
        {FIT_PL_CATS.map(cat=>{
          const rows=FY_LIST.map(fy=>{
            const r=plByKey[`${cat}__${fy}__revenue`];
            const e=plByKey[`${cat}__${fy}__expenses`];
            const p=plByKey[`${cat}__${fy}__profit_loss`];
            if(!r&&!p)return null;
            return{fy,revenue:r?.total,expenses:e?.total,profit_loss:p?.total,margin:r?.total>0?((r.total-(e?.total||0))/r.total):null};
          }).filter(Boolean);
          return(<div key={cat} className="space-y-4">
            {rows.length>1&&<TrendChart data={rows} xKey="fy" keys={[{key:"revenue",name:"Revenue"},{key:"expenses",name:"Expenses"},{key:"profit_loss",name:"P/L"}]} title={`${cat} — Trend`} height={200}/>}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 font-bold text-slate-700 text-sm">{cat}</div>
              <table className="w-full text-sm">
                <thead><tr className="bg-slate-50 text-xs text-slate-400 uppercase tracking-wider">
                  {["Fiscal Year","Revenue","Expenses","P/(L)","Margin"].map(h=><th key={h} className="px-4 py-2 text-left font-semibold">{h}</th>)}
                </tr></thead>
                <tbody>{rows.map((r,i)=>(<tr key={r.fy} className={`border-t border-slate-50 ${i%2===0?"bg-white":"bg-slate-50/40"}`}>
                  <td className="px-4 py-2.5 font-semibold text-slate-700">{r.fy}</td>
                  <td className="px-4 py-2.5 font-mono">{dollar(r.revenue)}</td>
                  <td className="px-4 py-2.5 font-mono">{dollar(r.expenses)}</td>
                  <td className={`px-4 py-2.5 font-mono font-semibold ${(r.profit_loss||0)>=0?"text-green-700":"text-red-600"}`}>{dollar(r.profit_loss)}</td>
                  <td className="px-4 py-2.5 font-mono text-slate-500">{r.margin!=null?pct(r.margin):"—"}</td>
                </tr>))}</tbody>
              </table>
            </div>
          </div>);
        })}
      </div>
    )}
  </div>);}

// ══════════════════════════════════════════════════════════════════════════════
// OVERVIEW
// ══════════════════════════════════════════════════════════════════════════════
function OverviewModule({db}){
  const [campData,setCampData]=useState([]);
  const [cbFin,setCbFin]=useState([]);
  const [fitRev,setFitRev]=useState([]);
  const [recRev,setRecRev]=useState([]);
  const [fitKpi,setFitKpi]=useState([]);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    setLoading(true);
    Promise.all([
      db.from("camp_annual").select("year,revenue,expenses,profit_loss,enrollment"),
      db.from("clubhouse_financials").select("year,revenue,expenses,profit_loss"),
      db.from("fitness_revenue").select("category,fiscal_year,total"),
      db.from("rec_revenue").select("category,fiscal_year,total"),
      db.from("fitness_kpis").select("metric,fiscal_year,total"),
    ]).then(([{data:c},{data:cb},{data:fr},{data:rr},{data:fk}])=>{
      setCampData(c||[]);setCbFin(cb||[]);setFitRev(fr||[]);setRecRev(rr||[]);setFitKpi(fk||[]);
      setLoading(false);
    });
  },[db]);

  const campByYear=useMemo(()=>{
    const m={};
    campData.forEach(r=>{
      if(!m[r.year])m[r.year]={year:r.year,enrollment:0,revenue:0,profit_loss:0};
      m[r.year].enrollment+=(r.enrollment||0);m[r.year].revenue+=(r.revenue||0);m[r.year].profit_loss+=(r.profit_loss||0);
    });
    return Object.values(m).filter(r=>r.revenue>0||r.enrollment>0).sort((a,b)=>a.year-b.year);
  },[campData]);

  const cbByYear=useMemo(()=>{
    const m={};
    cbFin.forEach(r=>{
      if(!m[r.year])m[r.year]={year:r.year,revenue:0,profit_loss:0};
      m[r.year].revenue+=(r.revenue||0);m[r.year].profit_loss+=(r.profit_loss||0);
    });
    return Object.values(m).filter(r=>r.revenue>0).sort((a,b)=>a.year-b.year);
  },[cbFin]);

  const fitRevByFY=useMemo(()=>{const m={};fitRev.filter(r=>r.category==="Overall Revenue"&&r.total>0).forEach(r=>{m[r.fiscal_year]=r.total;});return m;},[fitRev]);
  const recRevByFY=useMemo(()=>{const m={};recRev.filter(r=>(r.category?.trim()==="Overall Revenue")&&r.total>0).forEach(r=>{m[r.fiscal_year]=r.total;});return m;},[recRev]);
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
    return fys.map(fy=>({fy,fitness:fitRevByFY[fy]||null,recreation:recRevByFY[fy]||null})).filter(r=>r.fitness||r.recreation);
  },[fitRevByFY,recRevByFY,fitFYs,recFYs]);

  const cards=[
    {title:"Camps",color:NAVY,year:campLatest?.year,revenue:campLatest?.revenue,pl:campLatest?.profit_loss,extra:`${num(campLatest?.enrollment)} enrolled`,trend:campLatest&&campPrior&&campPrior.revenue>0?((campLatest.revenue-campPrior.revenue)/campPrior.revenue)*100:null},
    {title:"Clubhouse",color:"#0f766e",year:cbLatest?.year,revenue:cbLatest?.revenue,pl:cbLatest?.profit_loss,extra:"All 10 sites",trend:cbLatest&&cbPrior&&cbPrior.revenue>0?((cbLatest.revenue-cbPrior.revenue)/cbPrior.revenue)*100:null},
    {title:"Recreation Fund 4",color:"#7c3aed",year:recLatest?.[0],revenue:recLatest?.[1],pl:null,extra:"Overall fund revenue",trend:recLatest&&recPrior&&recPrior[1]>0?((recLatest[1]-recPrior[1])/recPrior[1])*100:null},
    {title:"Fitness Center",color:GOLD,year:fitLatest?.[0],revenue:fitLatest?.[1],pl:null,extra:`${memLatest?num(memLatest[1]):"—"} active members`,trend:fitLatest&&fitPrior&&fitPrior[1]>0?((fitLatest[1]-fitPrior[1])/fitPrior[1])*100:null},
  ];

  if(loading)return <div className="text-center py-20 text-slate-400 text-sm">Loading data…</div>;

  return(<div className="space-y-6">
    <div><h2 className="font-bold text-slate-800 text-base">BGPD Rec Funds — Overview</h2><p className="text-xs text-slate-400 mt-0.5">All four funds at a glance</p></div>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {cards.map(c=>(<div key={c.title} className="bg-white rounded-xl shadow-sm overflow-hidden" style={{borderTop:`4px solid ${c.color}`}}>
        <div className="px-5 py-4">
          <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{color:c.color}}>{c.title}</div>
          <div className="grid grid-cols-2 gap-4">
            <div><div className="text-xs text-slate-400 mb-0.5">Revenue</div><div className="text-2xl font-black text-slate-800">{c.revenue?dollar(c.revenue):"No data yet"}</div><div className="text-xs text-slate-400 mt-0.5">{c.year||"—"}</div></div>
            {c.pl!=null&&(<div><div className="text-xs text-slate-400 mb-0.5">Net P/(L)</div><div className={`text-2xl font-black ${c.pl>=0?"text-green-700":"text-red-600"}`}>{dollar(c.pl)}</div></div>)}
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="text-xs text-slate-400">{c.extra}</div>
            {c.trend!=null&&<div className="text-xs font-semibold" style={{color:tc(c.trend)}}>{c.trend>=0?"↑":"↓"} {Math.abs(c.trend).toFixed(1)}% YoY</div>}
          </div>
        </div>
      </div>))}
    </div>
    {combined.length>1&&<TrendChart data={combined} xKey="fy" keys={[{key:"fitness",name:"Fitness Center"},{key:"recreation",name:"Recreation Fund 4"}]} title="Revenue Trend — Recreation & Fitness" height={240}/>}
    {campByYear.length>1&&(
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TrendChart data={campByYear} xKey="year" keys={[{key:"enrollment",name:"Enrollment"}]} title="Camps — Total Enrollment by Year" fmt={num} height={200}/>
        <TrendChart data={cbByYear} xKey="year" keys={[{key:"revenue",name:"Revenue"}]} title="Clubhouse — Total Revenue by Year" height={200}/>
      </div>
    )}
  </div>);}

// ══════════════════════════════════════════════════════════════════════════════
// APP
// ══════════════════════════════════════════════════════════════════════════════
const TABS=[{id:"overview",label:"Overview"},{id:"camps",label:"Camps"},{id:"clubhouse",label:"Clubhouse"},{id:"recreation",label:"Recreation"},{id:"fitness",label:"Fitness Center"}];

export default function App(){
  const [tab,setTab]=useState("overview");
  return(<div className="min-h-screen" style={{background:"#f1f5f9"}}>
    <header style={{backgroundColor:NAVY}} className="px-4 py-4 shadow-lg">
      <div className="max-w-6xl mx-auto flex items-center gap-3">
        <Logo size={36}/>
        <div>
          <div className="text-white font-bold text-base leading-tight">Buffalo Grove Park District</div>
          <div className="text-xs font-semibold tracking-widest uppercase" style={{color:BLUE}}>Rec Funds — Financial Dashboard</div>
        </div>
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
