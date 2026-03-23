import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "./supabase.js";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from "recharts";

// ─── Constants ────────────────────────────────────────────────────────────────
const NAVY  = "#1e3a5f";
const GOLD  = "#d4a017";
const BLUE  = "#29ABE2";
const BROWN = "#8B7335";

const CAMP_NAMES = ["2s PScamp","3s PScamp","4s & 5s","Kinder Camp","Safety Stars","Adventure","Fun and Games","Grove","Sports Camp","Cycle and Surf","Xtreme Teens","Star Makers","Broadway Bound","Dance","CIT","Camp Connection","Post Camp"];
const CAMP_DISPLAY = {"2s PScamp":"Preschool 2s","3s PScamp":"Preschool 3s","4s & 5s":"Preschool 4s & 5s","Kinder Camp":"Kinder Camp","Safety Stars":"Safety Stars","Adventure":"Adventure","Fun and Games":"Fun & Games","Grove":"Grove","Sports Camp":"Sports Camp","Cycle and Surf":"Cycle & Surf","Xtreme Teens":"Xtreme Teens","Star Makers":"Star Makers","Broadway Bound":"Broadway Bound","Dance":"Dance","CIT":"CIT","Camp Connection":"Camp Connection","Post Camp":"Post Camp"};
const CAMP_YEARS  = Array.from({length:16},(_,i)=>2017+i); // 2017-2032
const FUTURE_YEARS = [2026,2027,2028,2029,2030,2031,2032];

const CB_SITES   = ["Country Meadows","Ivy Hall","Kildeer","Kilmer","Longfellow","Meridian","Prairie","Pritchett","Tripp","Willow Grove"];
const CB_MONTHS  = ["August","September","October","November","December","January","February","March","April","May"];
const CB_YEARS   = Array.from({length:16},(_,i)=>2017+i);

const FY_LIST    = ["2017/18","2018/19","2019/20","2020/21","2021/22","2022/23","2023/24","2024/25","2025/26","2026/27","2027/28","2028/29","2029/30","2030/31","2031/32"];
const FY_MONTHS  = ["May","June","July","August","September","October","November","December","January","February","March","April"];

const REC_PL_CATS    = ["Rentals - All","Concessions","WSP - User Fees","Aquatics","SNP - User Fees","Golf Dome","Adult General","Adult Sports","Camps","Performing Arts","Seniors","Youth General","Youth Sports","Special Events","Tot and Child"];
const REC_REV_CATS   = ["Overall Revenue","Rentals - All","Concessions","WSP - User Fees","Aquatics","Golf Dome","Adult General","Adult Sports","Camps","Performing Arts","Seniors","Youth General","Youth Sports","Special Events","Tot and Child"];
const REC_EXP_CATS   = ["Personnel","Contractual Services","Commodities","Utilities","Rentals"];

const FIT_REV_CATS   = ["Overall Revenue","Memberships","Personal Training","Specialty Programs"];
const FIT_EXP_CATS   = ["Personnel","Contractual Services","Commodities","Utilities","Personal Training","Specialty Programs"];
const FIT_PL_CATS    = ["Personal Training","Specialty Programs"];
const FIT_KPI_METRICS= ["Active Members","New Members","Cancellations","Member Visits","Group Ex Numbers","Personal Training","Reformer Training"];

// ─── Formatters ───────────────────────────────────────────────────────────────
const dollar = v => !v||v===0 ? "—" : v<0 ? `($${Math.abs(Math.round(v)).toLocaleString()})` : `$${Math.round(v).toLocaleString()}`;
const pct    = v => !v&&v!==0 ? "—" : `${(v*100).toFixed(1)}%`;
const num    = v => !v&&v!==0 ? "—" : Math.round(v).toLocaleString();

// ─── BGPDLogo ─────────────────────────────────────────────────────────────────
function BGPDLogo({size=48}){
  return(
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="44" fill="none" stroke="#29ABE2" strokeWidth="6"/>
      <circle cx="50" cy="50" r="38" fill="none" stroke="#29ABE2" strokeWidth="2" opacity="0.5"/>
      <g transform="translate(18,22) scale(0.64)">
        <path fill="#8B7335" d="M14,45 C14,45 10,38 12,30 C14,22 20,18 26,20 C28,14 34,10 40,12 C42,8 48,6 52,10 C58,6 66,8 68,16 C74,16 80,22 78,30 C82,32 84,38 80,44 C84,46 86,54 80,58 C84,64 80,72 72,70 C70,76 62,78 56,72 C52,76 44,76 40,70 C34,74 26,70 26,62 C18,62 12,54 14,45 Z"/>
      </g>
    </svg>
  );
}

// ─── KCard ────────────────────────────────────────────────────────────────────
function KCard({label,value,sub,accent,trend}){
  const trendColor = trend>0?"#16a34a":trend<0?"#dc2626":"#94a3b8";
  return(
    <div style={{borderTop:`3px solid ${accent||NAVY}`}} className="bg-white rounded-lg p-4 shadow-sm">
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</div>
      <div className="text-2xl font-bold text-slate-800">{value}</div>
      {sub&&<div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
      {trend!==undefined&&trend!==null&&<div className="text-xs font-semibold mt-1" style={{color:trendColor}}>{trend>0?"↑":"↓"} {Math.abs(trend).toFixed(1)}% vs prior year</div>}
    </div>
  );
}

// ─── SectionHeader ───────────────────────────────────────────────────────────
function SectionHeader({title,sub,children}){
  return(
    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
      <div>
        <h2 className="font-bold text-slate-800 text-base">{title}</h2>
        {sub&&<p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
      <div className="flex gap-2">{children}</div>
    </div>
  );
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────
function ChartTooltip({active,payload,label,formatter=dollar}){
  if(!active||!payload?.length) return null;
  return(
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-xs">
      <div className="font-bold text-slate-700 mb-1">{label}</div>
      {payload.map((p,i)=>(
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{background:p.color}}/>
          <span className="text-slate-500">{p.name}:</span>
          <span className="font-semibold text-slate-700">{formatter(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

// ─── NumberInput ─────────────────────────────────────────────────────────────
function NumInput({value,onChange,placeholder=""}){
  return(
    <input type="number" value={value||""} onChange={e=>onChange(parseFloat(e.target.value)||null)}
      placeholder={placeholder}
      className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white text-right"
      style={{MozAppearance:"textfield"}}/>
  );
}

// ─── ConfirmModal ────────────────────────────────────────────────────────────
function ConfirmModal({message,onConfirm,onCancel}){
  return(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:"rgba(15,23,42,0.5)"}}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <div className="text-base font-bold text-slate-800">Are you sure?</div>
        <div className="text-sm text-slate-500">{message}</div>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 text-sm text-slate-500 border border-slate-200 rounded-lg">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm font-semibold text-white rounded-lg" style={{background:"#dc2626"}}>Confirm</button>
        </div>
      </div>
    </div>
  );
}

// ─── COLORS for charts ───────────────────────────────────────────────────────
const CHART_COLORS = ["#1e3a5f","#29ABE2","#d4a017","#22c55e","#f97316","#8b5cf6","#ec4899","#14b8a6","#ef4444","#64748b"];

// ══════════════════════════════════════════════════════════════════════════════
// CAMPS MODULE
// ══════════════════════════════════════════════════════════════════════════════
function CampsModule({db}){
  const [data,setData]         = useState([]);
  const [view,setView]         = useState("overview"); // overview | detail | entry
  const [selectedCamp,setSC]   = useState(null);
  const [selectedYear,setSY]   = useState(null);
  const [editRow,setEditRow]   = useState(null);
  const [saving,setSaving]     = useState(false);
  const [form,setForm]         = useState({enrollment:null,revenue:null,expenses:null,notes:""});

  const load = useCallback(async()=>{
    const {data:rows} = await db.from("camp_annual").select("*").order("camp").order("year");
    setData(rows||[]);
  },[db]);
  useEffect(()=>{load();},[load]);

  const byKey = useMemo(()=>{
    const m={};
    (data||[]).forEach(r=>{m[`${r.camp}__${r.year}`]=r;});
    return m;
  },[data]);

  // Overview: total enrollment and revenue by year
  const overviewByYear = useMemo(()=>{
    const m={};
    (data||[]).forEach(r=>{
      if(!m[r.year]) m[r.year]={year:r.year,enrollment:0,revenue:0,expenses:0,profit_loss:0};
      m[r.year].enrollment += r.enrollment||0;
      m[r.year].revenue    += r.revenue||0;
      m[r.year].expenses   += r.expenses||0;
      m[r.year].profit_loss+= r.profit_loss||0;
    });
    return Object.values(m).sort((a,b)=>a.year-b.year).filter(r=>r.revenue>0||r.enrollment>0);
  },[data]);

  const latest = overviewByYear[overviewByYear.length-1];
  const prior  = overviewByYear[overviewByYear.length-2];
  const enrTrend = latest&&prior&&prior.enrollment>0 ? ((latest.enrollment-prior.enrollment)/prior.enrollment)*100 : null;
  const revTrend = latest&&prior&&prior.revenue>0    ? ((latest.revenue-prior.revenue)/prior.revenue)*100 : null;

  // Per-camp latest year data for table
  const campSummary = useMemo(()=>{
    return CAMP_NAMES.map(camp=>{
      const rows = (data||[]).filter(r=>r.camp===camp&&(r.revenue||r.enrollment)).sort((a,b)=>b.year-a.year);
      const latest = rows[0]||null;
      const prior  = rows[1]||null;
      return {camp, display:CAMP_DISPLAY[camp]||camp, latest, prior,
        enrTrend: latest&&prior&&prior.enrollment>0?((latest.enrollment-prior.enrollment)/prior.enrollment)*100:null,
        revTrend: latest&&prior&&prior.revenue>0?((latest.revenue-prior.revenue)/prior.revenue)*100:null};
    });
  },[data]);

  async function saveEntry(){
    setSaving(true);
    const payload = {camp:selectedCamp, year:selectedYear, enrollment:form.enrollment, revenue:form.revenue, expenses:form.expenses, profit_loss:(form.revenue||0)-(form.expenses||0), notes:form.notes||""};
    if(editRow?.id){
      await db.from("camp_annual").update(payload).eq("id",editRow.id);
    } else {
      await db.from("camp_annual").upsert(payload,{onConflict:"camp,year"});
    }
    setSaving(false);
    setView("detail");
    load();
  }

  function openEntry(camp,year){
    const existing = byKey[`${camp}__${year}`];
    setSelectedCamp(camp); setSelectedYear(year);
    setEditRow(existing||null);
    setForm({enrollment:existing?.enrollment||null, revenue:existing?.revenue||null, expenses:existing?.expenses||null, notes:existing?.notes||""});
    setView("entry");
  }

  if(view==="entry"){
    return(
      <div className="space-y-5">
        <button onClick={()=>setView("detail")} className="text-sm text-slate-400 hover:text-slate-600">← Back</button>
        <div>
          <h2 className="font-bold text-slate-800 text-lg">{CAMP_DISPLAY[selectedCamp]}</h2>
          <p className="text-sm text-slate-400">Enter actuals for {selectedYear}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[["Enrollment","enrollment"],["Revenue ($)","revenue"],["Expenses ($)","expenses"]].map(([label,key])=>(
              <div key={key}>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{label}</label>
                <NumInput value={form[key]} onChange={v=>setForm(f=>({...f,[key]:v}))}/>
              </div>
            ))}
          </div>
          {form.revenue!=null&&form.expenses!=null&&(
            <div className="rounded-lg px-4 py-3 text-sm" style={{background:"#f0fdf4",border:"1px solid #bbf7d0"}}>
              <span className="text-slate-500">Profit / (Loss): </span>
              <span className="font-bold" style={{color:(form.revenue-form.expenses)>=0?"#16a34a":"#dc2626"}}>{dollar((form.revenue||0)-(form.expenses||0))}</span>
              <span className="ml-3 text-slate-400">Gross margin: {form.revenue>0?pct(((form.revenue-form.expenses)/form.revenue)):""}</span>
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Notes</label>
            <textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} rows={2}
              className="w-full rounded border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 resize-none"/>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={()=>setView("detail")} className="px-4 py-2 text-sm text-slate-500 border border-slate-200 rounded-lg">Cancel</button>
            <button onClick={saveEntry} disabled={saving} className="px-5 py-2 text-sm font-bold text-white rounded-lg disabled:opacity-40" style={{background:NAVY}}>
              {saving?"Saving…":"Save"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if(view==="detail"&&selectedCamp){
    const campRows = (data||[]).filter(r=>r.camp===selectedCamp).sort((a,b)=>a.year-b.year);
    const chartData = campRows.filter(r=>r.revenue>0||r.enrollment>0);
    return(
      <div className="space-y-5">
        <button onClick={()=>{setView("overview");setSC(null);}} className="text-sm text-slate-400 hover:text-slate-600">← All Camps</button>
        <SectionHeader title={CAMP_DISPLAY[selectedCamp]} sub="Year-over-year enrollment, revenue, and P/L">
          <button onClick={()=>openEntry(selectedCamp,new Date().getFullYear())} className="text-xs font-bold px-3 py-2 rounded text-white" style={{background:NAVY}}>+ Enter Data</button>
        </SectionHeader>
        {chartData.length>1&&(
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Enrollment & Revenue Trend</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData} margin={{top:5,right:10,left:10,bottom:5}}>
                <XAxis dataKey="year" tick={{fontSize:11}} />
                <YAxis yAxisId="left" tick={{fontSize:11}} tickFormatter={v=>v>=1000?`$${(v/1000).toFixed(0)}k`:v} />
                <YAxis yAxisId="right" orientation="right" tick={{fontSize:11}} />
                <Tooltip content={<ChartTooltip/>}/>
                <Legend/>
                <Line yAxisId="left" type="monotone" dataKey="revenue" name="Revenue" stroke={NAVY} strokeWidth={2} dot={false}/>
                <Line yAxisId="left" type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" strokeWidth={2} dot={false}/>
                <Line yAxisId="right" type="monotone" dataKey="enrollment" name="Enrollment" stroke={GOLD} strokeWidth={2} dot={false}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 text-xs text-slate-400 uppercase tracking-wider">
              {["Year","Enrollment","Revenue","Expenses","P/(L)","Margin",""].map(h=>(
                <th key={h} className="px-4 py-2 text-left font-semibold">{h}</th>
              ))}
            </tr></thead>
            <tbody>{CAMP_YEARS.map((yr,i)=>{
              const r = campRows.find(x=>x.year===yr)||{year:yr};
              const hasData = r.revenue||r.enrollment;
              const margin = r.revenue>0?((r.revenue-(r.expenses||0))/r.revenue):null;
              return(
                <tr key={yr} className={`border-t border-slate-50 ${i%2===0?"bg-white":"bg-slate-50/50"} ${!hasData?"opacity-40":""}`}>
                  <td className="px-4 py-2.5 font-semibold text-slate-700">{yr}</td>
                  <td className="px-4 py-2.5 font-mono">{r.enrollment?num(r.enrollment):"—"}</td>
                  <td className="px-4 py-2.5 font-mono">{r.revenue?dollar(r.revenue):"—"}</td>
                  <td className="px-4 py-2.5 font-mono">{r.expenses?dollar(r.expenses):"—"}</td>
                  <td className={`px-4 py-2.5 font-mono font-semibold ${(r.profit_loss||0)>=0?"text-green-700":"text-red-600"}`}>{r.profit_loss!=null?dollar(r.profit_loss):"—"}</td>
                  <td className="px-4 py-2.5 font-mono text-slate-500">{margin!=null?pct(margin):"—"}</td>
                  <td className="px-4 py-2.5"><button onClick={()=>openEntry(selectedCamp,yr)} className="text-xs text-slate-400 hover:text-slate-700 font-medium">{hasData?"Edit":"+ Add"}</button></td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      </div>
    );
  }

  // Overview
  return(
    <div className="space-y-6">
      <SectionHeader title="Camps — Portfolio Overview" sub="All camps combined · click a camp to view detail"/>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KCard label="Total Enrollment" value={latest?num(latest.enrollment):"—"} sub={latest?`${latest.year} season`:""} accent={NAVY} trend={enrTrend}/>
        <KCard label="Total Revenue"    value={latest?dollar(latest.revenue):"—"} sub={latest?`${latest.year} season`:""} accent={GOLD} trend={revTrend}/>
        <KCard label="Total Expenses"   value={latest?dollar(latest.expenses):"—"} sub={latest?`${latest.year} season`:""} accent="#64748b"/>
        <KCard label="Net P/(L)"        value={latest?dollar(latest.profit_loss):"—"} sub={latest?`${latest.year} season`:""} accent={latest&&latest.profit_loss>=0?"#22c55e":"#ef4444"}/>
      </div>
      {overviewByYear.length>1&&(
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Portfolio Enrollment Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={overviewByYear} margin={{top:5,right:10,left:10,bottom:5}}>
              <XAxis dataKey="year" tick={{fontSize:11}}/>
              <YAxis tick={{fontSize:11}}/>
              <Tooltip content={<ChartTooltip formatter={num}/>}/>
              <Bar dataKey="enrollment" name="Enrollment" fill={NAVY}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <h3 className="font-bold text-slate-700 text-sm">All Camps — Latest Year</h3>
          <p className="text-xs text-slate-400 mt-0.5">Click a camp to view history and enter data</p>
        </div>
        <table className="w-full text-sm">
          <thead><tr className="bg-slate-50 text-xs text-slate-400 uppercase tracking-wider">
            {["Camp","Year","Enrollment","Revenue","Expenses","P/(L)","Margin","YoY Enr"].map(h=>(
              <th key={h} className="px-3 py-2 text-left font-semibold">{h}</th>
            ))}
          </tr></thead>
          <tbody>{campSummary.map((c,i)=>(
            <tr key={c.camp} className={`border-t border-slate-50 hover:bg-slate-50 cursor-pointer ${i%2===0?"bg-white":"bg-slate-50/50"}`}
              onClick={()=>{setSC(c.camp);setView("detail");}}>
              <td className="px-3 py-2.5 font-semibold text-slate-700">{c.display}</td>
              <td className="px-3 py-2.5 text-slate-400">{c.latest?.year||"—"}</td>
              <td className="px-3 py-2.5 font-mono">{c.latest?.enrollment?num(c.latest.enrollment):"—"}</td>
              <td className="px-3 py-2.5 font-mono">{c.latest?.revenue?dollar(c.latest.revenue):"—"}</td>
              <td className="px-3 py-2.5 font-mono">{c.latest?.expenses?dollar(c.latest.expenses):"—"}</td>
              <td className={`px-3 py-2.5 font-mono font-semibold ${(c.latest?.profit_loss||0)>=0?"text-green-700":"text-red-600"}`}>{c.latest?.profit_loss!=null?dollar(c.latest.profit_loss):"—"}</td>
              <td className="px-3 py-2.5 font-mono text-slate-500">{c.latest?.revenue>0?pct((c.latest.revenue-(c.latest.expenses||0))/c.latest.revenue):"—"}</td>
              <td className="px-3 py-2.5">
                {c.enrTrend!=null&&<span className="text-xs font-semibold" style={{color:c.enrTrend>=0?"#16a34a":"#dc2626"}}>{c.enrTrend>=0?"↑":"↓"}{Math.abs(c.enrTrend).toFixed(1)}%</span>}
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CLUBHOUSE MODULE
// ══════════════════════════════════════════════════════════════════════════════
function ClubhouseModule({db}){
  const [enrData,setEnrData]   = useState([]);
  const [finData,setFinData]   = useState([]);
  const [view,setView]         = useState("overview");
  const [selectedSite,setSite] = useState(null);
  const [entryYear,setEY]      = useState(new Date().getFullYear());
  const [enrForm,setEnrForm]   = useState({});
  const [finForm,setFinForm]   = useState({revenue:null,expenses:null,notes:""});
  const [saving,setSaving]     = useState(false);
  const [entryTab,setEntryTab] = useState("enrollment");

  const load = useCallback(async()=>{
    const [{data:e},{data:f}] = await Promise.all([
      db.from("clubhouse_enrollment").select("*"),
      db.from("clubhouse_financials").select("*"),
    ]);
    setEnrData(e||[]); setFinData(f||[]);
  },[db]);
  useEffect(()=>{load();},[load]);

  const enrByKey = useMemo(()=>{
    const m={};
    enrData.forEach(r=>{m[`${r.site}__${r.year}__${r.month}`]=r;});
    return m;
  },[enrData]);

  const finByKey = useMemo(()=>{
    const m={};
    finData.forEach(r=>{m[`${r.site}__${r.year}`]=r;});
    return m;
  },[finData]);

  // Overview: portfolio total enrollment by year
  const overviewByYear = useMemo(()=>{
    const m={};
    enrData.forEach(r=>{
      if(!m[r.year]) m[r.year]={year:r.year};
      CB_SITES.forEach(s=>{ if(!m[r.year][s]) m[r.year][s]=0; });
      if(r.enrollment) m[r.year][r.site]=(m[r.year][r.site]||0)+r.enrollment;
    });
    // Average per site per year
    return Object.values(m).sort((a,b)=>a.year-b.year).map(r=>{
      const counts = CB_SITES.map(s=>r[s]||0).filter(v=>v>0);
      return {...r, total: counts.reduce((a,b)=>a+b,0)};
    }).filter(r=>r.total>0);
  },[enrData]);

  // Site avg enrollment by year
  const siteAvgByYear = useMemo(()=>{
    const m={};
    CB_SITES.forEach(site=>{
      m[site]={};
      CB_YEARS.forEach(yr=>{
        const monthVals = CB_MONTHS.map(mo=>enrByKey[`${site}__${yr}__${mo}`]?.enrollment).filter(v=>v!=null&&v>0);
        m[site][yr] = monthVals.length>0 ? monthVals.reduce((a,b)=>a+b,0)/monthVals.length : null;
      });
    });
    return m;
  },[enrByKey]);

  async function saveEnrollment(){
    setSaving(true);
    const ops = CB_MONTHS.map(month=>{
      const val = enrForm[month];
      if(val==null) return null;
      return db.from("clubhouse_enrollment").upsert({site:selectedSite,year:entryYear,month,enrollment:val},{onConflict:"site,year,month"});
    }).filter(Boolean);
    await Promise.all(ops);
    setSaving(false);
    setView("detail");
    load();
  }

  async function saveFinancials(){
    setSaving(true);
    await db.from("clubhouse_financials").upsert({
      site:selectedSite, year:entryYear,
      revenue:finForm.revenue, expenses:finForm.expenses,
      profit_loss:(finForm.revenue||0)-(finForm.expenses||0),
      notes:finForm.notes||""
    },{onConflict:"site,year"});
    setSaving(false);
    setView("detail");
    load();
  }

  function openEntry(site,year){
    setSite(site); setEY(year);
    // Pre-fill enrollment form
    const ef={};
    CB_MONTHS.forEach(mo=>{
      ef[mo]=enrByKey[`${site}__${year}__${mo}`]?.enrollment||null;
    });
    setEnrForm(ef);
    const fin=finByKey[`${site}__${year}`];
    setFinForm({revenue:fin?.revenue||null,expenses:fin?.expenses||null,notes:fin?.notes||""});
    setView("entry");
  }

  if(view==="entry"){
    return(
      <div className="space-y-5">
        <button onClick={()=>setView("detail")} className="text-sm text-slate-400 hover:text-slate-600">← Back</button>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-800 text-lg">{selectedSite}</h2>
            <p className="text-sm text-slate-400">Enter data for {entryYear}</p>
          </div>
          <select value={entryYear} onChange={e=>setEY(parseInt(e.target.value))}
            className="text-sm rounded border border-slate-200 px-3 py-2 bg-white">
            {CB_YEARS.map(y=><option key={y}>{y}</option>)}
          </select>
        </div>
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="flex border-b border-slate-100">
            {[["enrollment","Monthly Enrollment"],["financials","Annual Financials"]].map(([t,l])=>(
              <button key={t} onClick={()=>setEntryTab(t)}
                className={`px-5 py-3 text-sm font-semibold border-b-2 transition ${entryTab===t?"text-slate-800":"border-transparent text-slate-400 hover:text-slate-600"}`}
                style={entryTab===t?{borderColor:GOLD}:{}}>{l}</button>
            ))}
          </div>
          <div className="p-5">
            {entryTab==="enrollment"?(
              <div className="space-y-4">
                <p className="text-xs text-slate-400">Enter average monthly enrollment for {entryYear}. School year runs August–May.</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                  {CB_MONTHS.map(month=>(
                    <div key={month}>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">{month}</label>
                      <NumInput value={enrForm[month]} onChange={v=>setEnrForm(f=>({...f,[month]:v}))}/>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button onClick={()=>setView("detail")} className="px-4 py-2 text-sm text-slate-500 border border-slate-200 rounded-lg">Cancel</button>
                  <button onClick={saveEnrollment} disabled={saving} className="px-5 py-2 text-sm font-bold text-white rounded-lg disabled:opacity-40" style={{background:NAVY}}>{saving?"Saving…":"Save Enrollment"}</button>
                </div>
              </div>
            ):(
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {[["Revenue ($)","revenue"],["Site Staff Expenses ($)","expenses"]].map(([label,key])=>(
                    <div key={key}>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{label}</label>
                      <NumInput value={finForm[key]} onChange={v=>setFinForm(f=>({...f,[key]:v}))}/>
                    </div>
                  ))}
                </div>
                {finForm.revenue!=null&&finForm.expenses!=null&&(
                  <div className="rounded-lg px-4 py-3 text-sm" style={{background:"#f0fdf4",border:"1px solid #bbf7d0"}}>
                    <span className="text-slate-500">Profit / (Loss): </span>
                    <span className="font-bold" style={{color:(finForm.revenue-finForm.expenses)>=0?"#16a34a":"#dc2626"}}>{dollar((finForm.revenue||0)-(finForm.expenses||0))}</span>
                    <span className="ml-3 text-slate-400">Margin: {finForm.revenue>0?pct(((finForm.revenue-finForm.expenses)/finForm.revenue)):""}</span>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Notes</label>
                  <textarea value={finForm.notes} onChange={e=>setFinForm(f=>({...f,notes:e.target.value}))} rows={2}
                    className="w-full rounded border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 resize-none"/>
                </div>
                <div className="flex justify-end gap-3">
                  <button onClick={()=>setView("detail")} className="px-4 py-2 text-sm text-slate-500 border border-slate-200 rounded-lg">Cancel</button>
                  <button onClick={saveFinancials} disabled={saving} className="px-5 py-2 text-sm font-bold text-white rounded-lg disabled:opacity-40" style={{background:NAVY}}>{saving?"Saving…":"Save Financials"}</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if(view==="detail"&&selectedSite){
    const siteAvgs = CB_YEARS.map(yr=>({year:yr, avg:siteAvgByYear[selectedSite]?.[yr]||null})).filter(r=>r.avg!=null);
    const siteFin  = CB_YEARS.map(yr=>({year:yr,...(finByKey[`${selectedSite}__${yr}`]||{})})).filter(r=>r.revenue);
    return(
      <div className="space-y-5">
        <button onClick={()=>{setView("overview");setSite(null);}} className="text-sm text-slate-400 hover:text-slate-600">← All Sites</button>
        <SectionHeader title={selectedSite} sub="Monthly enrollment history and annual financials">
          <button onClick={()=>openEntry(selectedSite,new Date().getFullYear())} className="text-xs font-bold px-3 py-2 rounded text-white" style={{background:NAVY}}>+ Enter Data</button>
        </SectionHeader>
        {siteAvgs.length>1&&(
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Avg Monthly Enrollment by Year</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={siteAvgs} margin={{top:5,right:10,left:10,bottom:5}}>
                <XAxis dataKey="year" tick={{fontSize:11}}/>
                <YAxis tick={{fontSize:11}}/>
                <Tooltip content={<ChartTooltip formatter={v=>Math.round(v).toString()}/>}/>
                <Bar dataKey="avg" name="Avg Enrollment" fill={NAVY}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100"><h3 className="font-bold text-slate-700 text-sm">Monthly Enrollment by Year</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="bg-slate-50 text-slate-400 uppercase tracking-wider">
                <th className="px-3 py-2 text-left font-semibold">Year</th>
                {CB_MONTHS.map(m=><th key={m} className="px-2 py-2 text-center font-semibold">{m.slice(0,3)}</th>)}
                <th className="px-3 py-2 text-center font-semibold">Avg</th>
                <th className="px-2 py-2"/>
              </tr></thead>
              <tbody>{CB_YEARS.map((yr,i)=>{
                const monthVals = CB_MONTHS.map(mo=>enrByKey[`${selectedSite}__${yr}__${mo}`]?.enrollment);
                const hasAny = monthVals.some(v=>v!=null);
                const avg = siteAvgByYear[selectedSite]?.[yr];
                return(
                  <tr key={yr} className={`border-t border-slate-50 ${i%2===0?"bg-white":"bg-slate-50/50"} ${!hasAny?"opacity-40":""}`}>
                    <td className="px-3 py-2 font-semibold text-slate-700">{yr}</td>
                    {monthVals.map((v,mi)=><td key={mi} className="px-2 py-2 text-center font-mono">{v!=null?Math.round(v):"—"}</td>)}
                    <td className="px-3 py-2 text-center font-mono font-bold text-slate-700">{avg!=null?avg.toFixed(1):"—"}</td>
                    <td className="px-2 py-2"><button onClick={()=>openEntry(selectedSite,yr)} className="text-slate-400 hover:text-slate-700 text-xs">{hasAny?"Edit":"+"}</button></td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        </div>
        {siteFin.length>0&&(
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100"><h3 className="font-bold text-slate-700 text-sm">Annual Financials</h3></div>
            <table className="w-full text-sm">
              <thead><tr className="bg-slate-50 text-xs text-slate-400 uppercase tracking-wider">
                {["Year","Revenue","Expenses","P/(L)","Margin"].map(h=><th key={h} className="px-4 py-2 text-left font-semibold">{h}</th>)}
              </tr></thead>
              <tbody>{siteFin.map((r,i)=>(
                <tr key={r.year} className={`border-t border-slate-50 ${i%2===0?"bg-white":"bg-slate-50/50"}`}>
                  <td className="px-4 py-2.5 font-semibold text-slate-700">{r.year}</td>
                  <td className="px-4 py-2.5 font-mono">{dollar(r.revenue)}</td>
                  <td className="px-4 py-2.5 font-mono">{dollar(r.expenses)}</td>
                  <td className={`px-4 py-2.5 font-mono font-semibold ${(r.profit_loss||0)>=0?"text-green-700":"text-red-600"}`}>{dollar(r.profit_loss)}</td>
                  <td className="px-4 py-2.5 font-mono text-slate-500">{r.revenue>0?pct((r.revenue-(r.expenses||0))/r.revenue):"—"}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // Overview
  const latestYearAvgs = CB_SITES.map(site=>{
    const years = CB_YEARS.slice().reverse();
    for(const yr of years){
      const avg = siteAvgByYear[site]?.[yr];
      if(avg!=null) return {site,year:yr,avg,fin:finByKey[`${site}__${yr}`]};
    }
    return {site,year:null,avg:null,fin:null};
  });

  const totalEnr2024 = latestYearAvgs.reduce((a,r)=>a+(r.avg||0),0);
  return(
    <div className="space-y-6">
      <SectionHeader title="Clubhouse — All Sites" sub="Average monthly enrollment and financials by site"/>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KCard label="Total Avg Enrollment" value={num(Math.round(totalEnr2024))} sub="All sites combined" accent={NAVY}/>
        <KCard label="Sites" value={CB_SITES.length} sub="Active locations" accent={GOLD}/>
        <KCard label="Total Revenue" value={dollar(finData.filter(r=>r.year===2024).reduce((a,r)=>a+(r.revenue||0),0))} sub="2024" accent="#22c55e"/>
        <KCard label="Total P/(L)" value={dollar(finData.filter(r=>r.year===2024).reduce((a,r)=>a+(r.profit_loss||0),0))} sub="2024" accent="#1e3a5f"/>
      </div>
      {overviewByYear.length>1&&(
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Portfolio Total Enrollment by Year</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={overviewByYear} margin={{top:5,right:10,left:10,bottom:5}}>
              <XAxis dataKey="year" tick={{fontSize:11}}/>
              <YAxis tick={{fontSize:11}}/>
              <Tooltip content={<ChartTooltip formatter={num}/>}/>
              <Bar dataKey="total" name="Total Enrollment" fill={NAVY}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <h3 className="font-bold text-slate-700 text-sm">Site Summary — Latest Year</h3>
          <p className="text-xs text-slate-400 mt-0.5">Click a site to view full history and enter data</p>
        </div>
        <table className="w-full text-sm">
          <thead><tr className="bg-slate-50 text-xs text-slate-400 uppercase tracking-wider">
            {["Site","Year","Avg Enrollment","Revenue","Expenses","P/(L)","Margin"].map(h=><th key={h} className="px-3 py-2 text-left font-semibold">{h}</th>)}
          </tr></thead>
          <tbody>{latestYearAvgs.map((r,i)=>(
            <tr key={r.site} className={`border-t border-slate-50 hover:bg-slate-50 cursor-pointer ${i%2===0?"bg-white":"bg-slate-50/50"}`}
              onClick={()=>{setSite(r.site);setView("detail");}}>
              <td className="px-3 py-2.5 font-semibold text-slate-700">{r.site}</td>
              <td className="px-3 py-2.5 text-slate-400">{r.year||"—"}</td>
              <td className="px-3 py-2.5 font-mono">{r.avg?r.avg.toFixed(1):"—"}</td>
              <td className="px-3 py-2.5 font-mono">{r.fin?.revenue?dollar(r.fin.revenue):"—"}</td>
              <td className="px-3 py-2.5 font-mono">{r.fin?.expenses?dollar(r.fin.expenses):"—"}</td>
              <td className={`px-3 py-2.5 font-mono font-semibold ${(r.fin?.profit_loss||0)>=0?"text-green-700":"text-red-600"}`}>{r.fin?.profit_loss!=null?dollar(r.fin.profit_loss):"—"}</td>
              <td className="px-3 py-2.5 font-mono text-slate-500">{r.fin?.revenue>0?pct((r.fin.revenue-(r.fin.expenses||0))/r.fin.revenue):"—"}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// RECREATION FUND 4 MODULE
// ══════════════════════════════════════════════════════════════════════════════
function RecreationModule({db}){
  const [plData,setPlData]   = useState([]);
  const [revData,setRevData] = useState([]);
  const [expData,setExpData] = useState([]);
  const [view,setView]       = useState("overview"); // overview | pl | revenue | expenses | entry
  const [entryType,setET]    = useState("pl");
  const [form,setForm]       = useState({});
  const [selFY,setSelFY]     = useState("2025/26");
  const [selCat,setSelCat]   = useState(REC_PL_CATS[0]);
  const [saving,setSaving]   = useState(false);

  const load = useCallback(async()=>{
    const [{data:p},{data:r},{data:e}] = await Promise.all([
      db.from("rec_pl").select("*"),
      db.from("rec_revenue").select("*"),
      db.from("rec_expenses").select("*"),
    ]);
    setPlData(p||[]); setRevData(r||[]); setExpData(e||[]);
  },[db]);
  useEffect(()=>{load();},[load]);

  const plByKey  = useMemo(()=>{ const m={}; plData.forEach(r=>{m[`${r.category}__${r.fiscal_year}`]=r;}); return m; },[plData]);
  const revByKey = useMemo(()=>{ const m={}; revData.forEach(r=>{m[`${r.category}__${r.fiscal_year}`]=r;}); return m; },[revData]);
  const expByKey = useMemo(()=>{ const m={}; expData.forEach(r=>{m[`${r.category}__${r.fiscal_year}`]=r;}); return m; },[expData]);

  // Overview: total revenue, expenses, P/L by fiscal year
  const overviewByFY = useMemo(()=>{
    const m={};
    revData.filter(r=>r.category==="Overall Revenue"||r.category.trim()==="Overall Revenue").forEach(r=>{
      m[r.fiscal_year]={fy:r.fiscal_year,revenue:r.total||0,expenses:0,pl:0};
    });
    expData.filter(r=>r.category==="Personnel"||r.category.trim()==="Personnel").forEach(r=>{
      // Just track total expenses from P&L total
    });
    plData.filter(r=>r.category==="Total Program Profit Loss"||r.category.includes("Total")).forEach(r=>{
      if(!m[r.fiscal_year]) m[r.fiscal_year]={fy:r.fiscal_year,revenue:0,expenses:0,pl:0};
      m[r.fiscal_year].pl = r.total||0;
    });
    return Object.values(m).sort((a,b)=>a.fy.localeCompare(b.fy)).filter(r=>r.revenue>0||r.pl!==0);
  },[revData,plData,expData]);

  // Total P/L by area for latest FY
  const latestFY = FY_LIST.slice().reverse().find(fy=>plData.some(r=>r.fiscal_year===fy))||FY_LIST[FY_LIST.length-1];
  const plByArea = useMemo(()=>{
    return REC_PL_CATS.map(cat=>{
      const row = plByKey[`${cat}__${latestFY}`];
      return {category:cat, total:row?.total||null, margin:row?.margin||null};
    }).filter(r=>r.total!=null);
  },[plByKey,latestFY]);

  // YoY for each category
  const plTrend = useMemo(()=>{
    const m={};
    REC_PL_CATS.forEach(cat=>{
      const rows = FY_LIST.map(fy=>({fy,total:plByKey[`${cat}__${fy}`]?.total})).filter(r=>r.total!=null);
      m[cat]=rows;
    });
    return m;
  },[plByKey]);

  function openEntry(type,cat,fy){
    setEntryType(type); setSelCat(cat); setSelFY(fy);
    const cats = type==="pl"?REC_PL_CATS:type==="revenue"?REC_REV_CATS:REC_EXP_CATS;
    const byKey = type==="pl"?plByKey:type==="revenue"?revByKey:expByKey;
    const existing = byKey[`${cat}__${fy}`]||{};
    const f={};
    FY_MONTHS.forEach(m=>{f[m]=existing[m.toLowerCase()]!=null?existing[m.toLowerCase()]:null;});
    f.notes=existing.notes||"";
    setForm(f);
    setView("entry");
  }

  async function saveEntry(){
    setSaving(true);
    const table = entryType==="pl"?"rec_pl":entryType==="revenue"?"rec_revenue":"rec_expenses";
    const row = {category:selCat, fiscal_year:selFY, notes:form.notes||""};
    let total=0;
    FY_MONTHS.forEach(m=>{
      const val = form[m];
      row[m.toLowerCase()]=val;
      if(val) total+=val;
    });
    row.total=total;
    if(entryType==="pl") row.margin = null; // computed separately
    await db.from(table).upsert(row,{onConflict:"category,fiscal_year"});
    setSaving(false);
    setView(entryType==="pl"?"pl":entryType==="revenue"?"revenue":"expenses");
    load();
  }

  if(view==="entry"){
    const cats = entryType==="pl"?REC_PL_CATS:entryType==="revenue"?REC_REV_CATS:REC_EXP_CATS;
    return(
      <div className="space-y-5">
        <button onClick={()=>setView(entryType==="pl"?"pl":entryType==="revenue"?"revenue":"expenses")} className="text-sm text-slate-400 hover:text-slate-600">← Back</button>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="font-bold text-slate-800 text-lg">Enter {entryType==="pl"?"P/L":entryType==="revenue"?"Revenue":"Expenses"}</h2>
            <p className="text-sm text-slate-400">{selCat} · {selFY}</p>
          </div>
          <div className="flex gap-2">
            <select value={selCat} onChange={e=>setSelCat(e.target.value)} className="text-sm rounded border border-slate-200 px-3 py-2 bg-white">
              {cats.map(c=><option key={c}>{c}</option>)}
            </select>
            <select value={selFY} onChange={e=>setSelFY(e.target.value)} className="text-sm rounded border border-slate-200 px-3 py-2 bg-white">
              {FY_LIST.map(f=><option key={f}>{f}</option>)}
            </select>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {FY_MONTHS.map(month=>(
              <div key={month}>
                <label className="block text-xs font-semibold text-slate-500 mb-1">{month}</label>
                <NumInput value={form[month]} onChange={v=>setForm(f=>({...f,[month]:v}))}/>
              </div>
            ))}
          </div>
          <div className="rounded-lg px-4 py-3 text-sm bg-slate-50 border border-slate-100">
            Annual Total: <span className="font-bold text-slate-800">{dollar(FY_MONTHS.reduce((a,m)=>a+(form[m]||0),0))}</span>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Notes</label>
            <textarea value={form.notes||""} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} rows={2}
              className="w-full rounded border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 resize-none"/>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={()=>setView(entryType)} className="px-4 py-2 text-sm text-slate-500 border border-slate-200 rounded-lg">Cancel</button>
            <button onClick={saveEntry} disabled={saving} className="px-5 py-2 text-sm font-bold text-white rounded-lg disabled:opacity-40" style={{background:NAVY}}>{saving?"Saving…":"Save"}</button>
          </div>
        </div>
      </div>
    );
  }

  const recSubViews = [["overview","Overview"],["pl","P/L by Area"],["revenue","Revenue"],["expenses","Expenses"]];

  return(
    <div className="space-y-6">
      <SectionHeader title="Recreation — Fund 4" sub="Program P/L, revenue, and expenses by area and fiscal year">
        <button onClick={()=>openEntry("pl",REC_PL_CATS[0],latestFY)} className="text-xs font-bold px-3 py-2 rounded text-white" style={{background:NAVY}}>+ Enter Data</button>
      </SectionHeader>

      {/* Sub-nav */}
      <div className="flex gap-1 bg-white rounded-lg shadow-sm px-3 py-2 overflow-x-auto">
        {recSubViews.map(([v,l])=>(
          <button key={v} onClick={()=>setView(v)}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition whitespace-nowrap ${view===v?"text-white":"text-slate-500 hover:bg-slate-50"}`}
            style={view===v?{background:NAVY}:{}}>{l}</button>
        ))}
      </div>

      {view==="overview"&&(
        <div className="space-y-5">
          {overviewByYear.length>0&&(
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Overall Revenue by Fiscal Year</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={overviewByYear} margin={{top:5,right:10,left:10,bottom:5}}>
                  <XAxis dataKey="fy" tick={{fontSize:10}}/>
                  <YAxis tickFormatter={v=>`$${(v/1000000).toFixed(1)}M`} tick={{fontSize:11}}/>
                  <Tooltip content={<ChartTooltip/>}/>
                  <Bar dataKey="revenue" name="Revenue" fill={NAVY}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100"><h3 className="font-bold text-slate-700 text-sm">P/L by Area — {latestFY}</h3></div>
            <table className="w-full text-sm">
              <thead><tr className="bg-slate-50 text-xs text-slate-400 uppercase tracking-wider">
                {["Program Area","Annual P/(L)","Margin"].map(h=><th key={h} className="px-4 py-2 text-left font-semibold">{h}</th>)}
              </tr></thead>
              <tbody>{plByArea.sort((a,b)=>(b.total||0)-(a.total||0)).map((r,i)=>(
                <tr key={r.category} className={`border-t border-slate-50 ${i%2===0?"bg-white":"bg-slate-50/50"}`}>
                  <td className="px-4 py-2.5 font-semibold text-slate-700">{r.category.trim()}</td>
                  <td className={`px-4 py-2.5 font-mono font-semibold ${r.total>=0?"text-green-700":"text-red-600"}`}>{dollar(r.total)}</td>
                  <td className="px-4 py-2.5 font-mono text-slate-500">{r.margin!=null?pct(r.margin):"—"}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {(view==="pl"||view==="revenue"||view==="expenses")&&(()=>{
        const cats   = view==="pl"?REC_PL_CATS:view==="revenue"?REC_REV_CATS:REC_EXP_CATS;
        const byKey  = view==="pl"?plByKey:view==="revenue"?revByKey:expByKey;
        const label  = view==="pl"?"P/L":view==="revenue"?"Revenue":"Expenses";
        return(
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="font-semibold text-slate-700">{label} by Program Area</h3>
              <div className="flex gap-2 items-center">
                <span className="text-xs text-slate-400">Showing:</span>
                <select value={selFY} onChange={e=>setSelFY(e.target.value)} className="text-sm rounded border border-slate-200 px-3 py-2 bg-white">
                  {FY_LIST.map(f=><option key={f}>{f}</option>)}
                </select>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <table className="w-full text-xs">
                <thead><tr className="bg-slate-50 text-slate-400 uppercase tracking-wider">
                  <th className="px-3 py-2 text-left font-semibold">Category</th>
                  {FY_MONTHS.map(m=><th key={m} className="px-1.5 py-2 text-center font-semibold">{m.slice(0,3)}</th>)}
                  <th className="px-3 py-2 text-center font-semibold">Total</th>
                  <th className="px-2 py-2"/>
                </tr></thead>
                <tbody>{cats.map((cat,i)=>{
                  const row = byKey[`${cat}__${selFY}`]||{};
                  const total = row.total;
                  return(
                    <tr key={cat} className={`border-t border-slate-50 ${i%2===0?"bg-white":"bg-slate-50/50"} ${!total&&total!==0?"opacity-40":""}`}>
                      <td className="px-3 py-2 font-semibold text-slate-700 whitespace-nowrap">{cat.trim()}</td>
                      {FY_MONTHS.map(m=>{
                        const v=row[m.toLowerCase()];
                        return <td key={m} className={`px-1.5 py-2 text-center font-mono ${v<0?"text-red-500":""}`}>{v!=null?dollar(v):"—"}</td>;
                      })}
                      <td className={`px-3 py-2 text-center font-mono font-bold ${total<0?"text-red-600":total>0?"text-green-700":"text-slate-500"}`}>{total!=null?dollar(total):"—"}</td>
                      <td className="px-2 py-2"><button onClick={()=>openEntry(view,cat,selFY)} className="text-slate-400 hover:text-slate-700 text-xs">{total!=null?"Edit":"+"}</button></td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// FITNESS CENTER MODULE
// ══════════════════════════════════════════════════════════════════════════════
function FitnessModule({db}){
  const [revData,setRevData] = useState([]);
  const [expData,setExpData] = useState([]);
  const [plData,setPlData]   = useState([]);
  const [kpiData,setKpiData] = useState([]);
  const [view,setView]       = useState("overview");
  const [entryType,setET]    = useState("revenue");
  const [selFY,setSelFY]     = useState("2025/26");
  const [selCat,setSelCat]   = useState(FIT_REV_CATS[0]);
  const [form,setForm]       = useState({});
  const [saving,setSaving]   = useState(false);

  const load = useCallback(async()=>{
    const [{data:r},{data:e},{data:p},{data:k}] = await Promise.all([
      db.from("fitness_revenue").select("*"),
      db.from("fitness_expenses").select("*"),
      db.from("fitness_pl").select("*"),
      db.from("fitness_kpis").select("*"),
    ]);
    setRevData(r||[]); setExpData(e||[]); setPlData(p||[]); setKpiData(k||[]);
  },[db]);
  useEffect(()=>{load();},[load]);

  const revByKey = useMemo(()=>{const m={}; revData.forEach(r=>{m[`${r.category}__${r.fiscal_year}`]=r;}); return m;},[revData]);
  const expByKey = useMemo(()=>{const m={}; expData.forEach(r=>{m[`${r.category}__${r.fiscal_year}`]=r;}); return m;},[expData]);
  const plByKey  = useMemo(()=>{const m={}; plData.forEach(r=>{m[`${r.category}__${r.fiscal_year}__${r.type}`]=r;}); return m;},[plData]);
  const kpiByKey = useMemo(()=>{const m={}; kpiData.forEach(r=>{m[`${r.metric}__${r.fiscal_year}`]=r;}); return m;},[kpiData]);

  const latestFY = FY_LIST.slice().reverse().find(fy=>revData.some(r=>r.fiscal_year===fy))||"2025/26";

  // Overview chart: overall revenue by FY
  const overviewByFY = useMemo(()=>{
    return FY_LIST.map(fy=>{
      const rev = revByKey[`Overall Revenue__${fy}`];
      const mem = revByKey[`Memberships__${fy}`];
      const pt  = revByKey[`Personal Training__${fy}`];
      const sp  = revByKey[`Specialty Programs__${fy}`];
      if(!rev&&!mem) return null;
      return {fy, total:rev?.total||null, memberships:mem?.total||null, pt:pt?.total||null, specialty:sp?.total||null};
    }).filter(Boolean);
  },[revByKey]);

  // Membership KPIs by FY
  const membersByFY = useMemo(()=>{
    return FY_LIST.map(fy=>{
      const am = kpiByKey[`Active Members__${fy}`];
      const nm = kpiByKey[`New Members__${fy}`];
      const ca = kpiByKey[`Cancellations__${fy}`];
      const mv = kpiByKey[`Member Visits__${fy}`];
      if(!am&&!nm) return null;
      return {fy, activeMembers:am?.total||null, newMembers:nm?.total||null, cancellations:ca?.total||null, memberVisits:mv?.total||null};
    }).filter(Boolean);
  },[kpiByKey]);

  function openEntry(type,cat,fy){
    setEntryType(type); setSelCat(cat); setSelFY(fy);
    const cats = type==="revenue"?FIT_REV_CATS:type==="expenses"?FIT_EXP_CATS:FIT_KPI_METRICS;
    const byKey = type==="revenue"?revByKey:type==="expenses"?expByKey:kpiByKey;
    const keyPfx = type==="kpis"?"metric":"category";
    const existing = byKey[`${cat}__${fy}`]||{};
    const f={};
    FY_MONTHS.forEach(m=>{f[m]=existing[m.toLowerCase()]!=null?existing[m.toLowerCase()]:null;});
    f.notes=existing.notes||"";
    setForm(f);
    setView("entry");
  }

  async function saveEntry(){
    setSaving(true);
    const table = entryType==="revenue"?"fitness_revenue":entryType==="expenses"?"fitness_expenses":entryType==="kpis"?"fitness_kpis":"fitness_pl";
    const isKPI = entryType==="kpis";
    const row = isKPI?{metric:selCat,fiscal_year:selFY,notes:form.notes||""}:{category:selCat,fiscal_year:selFY,notes:form.notes||""};
    let total=0;
    FY_MONTHS.forEach(m=>{
      const val=form[m];
      row[m.toLowerCase()]=val;
      if(val) total+=val;
    });
    row.total=total;
    const conflict = isKPI?"metric,fiscal_year":"category,fiscal_year";
    await db.from(table).upsert(row,{onConflict:conflict});
    setSaving(false);
    setView(entryType);
    load();
  }

  if(view==="entry"){
    const cats = entryType==="revenue"?FIT_REV_CATS:entryType==="expenses"?FIT_EXP_CATS:FIT_KPI_METRICS;
    const label = entryType==="revenue"?"Revenue":entryType==="expenses"?"Expenses":"KPI Metrics";
    return(
      <div className="space-y-5">
        <button onClick={()=>setView(entryType)} className="text-sm text-slate-400 hover:text-slate-600">← Back</button>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="font-bold text-slate-800 text-lg">Enter {label}</h2>
            <p className="text-sm text-slate-400">{selCat} · {selFY}</p>
          </div>
          <div className="flex gap-2">
            <select value={selCat} onChange={e=>setSelCat(e.target.value)} className="text-sm rounded border border-slate-200 px-3 py-2 bg-white">
              {cats.map(c=><option key={c}>{c}</option>)}
            </select>
            <select value={selFY} onChange={e=>setSelFY(e.target.value)} className="text-sm rounded border border-slate-200 px-3 py-2 bg-white">
              {FY_LIST.map(f=><option key={f}>{f}</option>)}
            </select>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {FY_MONTHS.map(month=>(
              <div key={month}>
                <label className="block text-xs font-semibold text-slate-500 mb-1">{month}</label>
                <NumInput value={form[month]} onChange={v=>setForm(f=>({...f,[month]:v}))}/>
              </div>
            ))}
          </div>
          <div className="rounded-lg px-4 py-3 text-sm bg-slate-50 border border-slate-100">
            Annual Total: <span className="font-bold text-slate-800">
              {entryType==="kpis"?num(FY_MONTHS.reduce((a,m)=>a+(form[m]||0),0)):dollar(FY_MONTHS.reduce((a,m)=>a+(form[m]||0),0))}
            </span>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={()=>setView(entryType)} className="px-4 py-2 text-sm text-slate-500 border border-slate-200 rounded-lg">Cancel</button>
            <button onClick={saveEntry} disabled={saving} className="px-5 py-2 text-sm font-bold text-white rounded-lg disabled:opacity-40" style={{background:NAVY}}>{saving?"Saving…":"Save"}</button>
          </div>
        </div>
      </div>
    );
  }

  const fitSubViews = [["overview","Overview"],["revenue","Revenue"],["expenses","Expenses"],["kpis","Membership KPIs"],["pl","P/L Detail"]];
  const latestMembers = membersByFY[membersByFY.length-1];
  const priorMembers  = membersByFY[membersByFY.length-2];
  const memTrend = latestMembers&&priorMembers&&priorMembers.activeMembers?((latestMembers.activeMembers-priorMembers.activeMembers)/priorMembers.activeMembers)*100:null;
  const latestRev = overviewByFY[overviewByFY.length-1];
  const priorRev  = overviewByFY[overviewByFY.length-2];
  const revTrend2 = latestRev&&priorRev&&priorRev.total?((latestRev.total-priorRev.total)/priorRev.total)*100:null;

  return(
    <div className="space-y-6">
      <SectionHeader title="Fitness Center — Fund 21" sub="Revenue, expenses, P/L, and membership KPIs">
        <button onClick={()=>openEntry("revenue",FIT_REV_CATS[0],latestFY)} className="text-xs font-bold px-3 py-2 rounded text-white" style={{background:NAVY}}>+ Enter Data</button>
      </SectionHeader>

      <div className="flex gap-1 bg-white rounded-lg shadow-sm px-3 py-2 overflow-x-auto">
        {fitSubViews.map(([v,l])=>(
          <button key={v} onClick={()=>setView(v)}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition whitespace-nowrap ${view===v?"text-white":"text-slate-500 hover:bg-slate-50"}`}
            style={view===v?{background:NAVY}:{}}>{l}</button>
        ))}
      </div>

      {view==="overview"&&(
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <KCard label="Total Revenue" value={latestRev?dollar(latestRev.total):"—"} sub={latestFY} accent={NAVY} trend={revTrend2}/>
            <KCard label="Active Members" value={latestMembers?num(latestMembers.activeMembers):"—"} sub={latestFY} accent={GOLD} trend={memTrend}/>
            <KCard label="New Members" value={latestMembers?num(latestMembers.newMembers):"—"} sub={latestFY} accent="#22c55e"/>
            <KCard label="Cancellations" value={latestMembers?num(latestMembers.cancellations):"—"} sub={latestFY} accent="#ef4444"/>
          </div>
          {overviewByFY.length>1&&(
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Revenue by Category — Trend</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={overviewByFY} margin={{top:5,right:10,left:10,bottom:5}}>
                  <XAxis dataKey="fy" tick={{fontSize:10}}/>
                  <YAxis tickFormatter={v=>`$${(v/1000000).toFixed(1)}M`} tick={{fontSize:11}}/>
                  <Tooltip content={<ChartTooltip/>}/>
                  <Legend/>
                  <Bar dataKey="memberships" name="Memberships" fill={NAVY} stackId="a"/>
                  <Bar dataKey="pt" name="Personal Training" fill={GOLD} stackId="a"/>
                  <Bar dataKey="specialty" name="Specialty Programs" fill={BLUE} stackId="a"/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          {membersByFY.length>1&&(
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Active Members Trend</h3>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={membersByFY} margin={{top:5,right:10,left:10,bottom:5}}>
                  <XAxis dataKey="fy" tick={{fontSize:10}}/>
                  <YAxis tick={{fontSize:11}}/>
                  <Tooltip content={<ChartTooltip formatter={num}/>}/>
                  <Line type="monotone" dataKey="activeMembers" name="Active Members" stroke={NAVY} strokeWidth={2} dot={false}/>
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {(view==="revenue"||view==="expenses")&&(()=>{
        const cats  = view==="revenue"?FIT_REV_CATS:FIT_EXP_CATS;
        const byKey = view==="revenue"?revByKey:expByKey;
        const label = view==="revenue"?"Revenue":"Expenses";
        return(
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="font-semibold text-slate-700">{label} by Category</h3>
              <select value={selFY} onChange={e=>setSelFY(e.target.value)} className="text-sm rounded border border-slate-200 px-3 py-2 bg-white">
                {FY_LIST.map(f=><option key={f}>{f}</option>)}
              </select>
            </div>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <table className="w-full text-xs">
                <thead><tr className="bg-slate-50 text-slate-400 uppercase tracking-wider">
                  <th className="px-3 py-2 text-left font-semibold">Category</th>
                  {FY_MONTHS.map(m=><th key={m} className="px-1.5 py-2 text-center font-semibold">{m.slice(0,3)}</th>)}
                  <th className="px-3 py-2 text-center font-semibold">Total</th>
                  <th className="px-2 py-2"/>
                </tr></thead>
                <tbody>{cats.map((cat,i)=>{
                  const row = byKey[`${cat}__${selFY}`]||{};
                  return(
                    <tr key={cat} className={`border-t border-slate-50 ${i%2===0?"bg-white":"bg-slate-50/50"} ${!row.total&&row.total!==0?"opacity-40":""}`}>
                      <td className="px-3 py-2 font-semibold text-slate-700 whitespace-nowrap">{cat}</td>
                      {FY_MONTHS.map(m=>{
                        const v=row[m.toLowerCase()];
                        return <td key={m} className="px-1.5 py-2 text-center font-mono">{v!=null?dollar(v):"—"}</td>;
                      })}
                      <td className="px-3 py-2 text-center font-mono font-bold text-slate-800">{row.total!=null?dollar(row.total):"—"}</td>
                      <td className="px-2 py-2"><button onClick={()=>openEntry(view,cat,selFY)} className="text-slate-400 hover:text-slate-700 text-xs">{row.total!=null?"Edit":"+"}</button></td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {view==="kpis"&&(
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="font-semibold text-slate-700">Membership & Participation KPIs</h3>
            <select value={selFY} onChange={e=>setSelFY(e.target.value)} className="text-sm rounded border border-slate-200 px-3 py-2 bg-white">
              {FY_LIST.map(f=><option key={f}>{f}</option>)}
            </select>
          </div>
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="w-full text-xs">
              <thead><tr className="bg-slate-50 text-slate-400 uppercase tracking-wider">
                <th className="px-3 py-2 text-left font-semibold">Metric</th>
                {FY_MONTHS.map(m=><th key={m} className="px-1.5 py-2 text-center font-semibold">{m.slice(0,3)}</th>)}
                <th className="px-3 py-2 text-center font-semibold">Total/Avg</th>
                <th className="px-2 py-2"/>
              </tr></thead>
              <tbody>{FIT_KPI_METRICS.map((metric,i)=>{
                const row = kpiByKey[`${metric}__${selFY}`]||{};
                return(
                  <tr key={metric} className={`border-t border-slate-50 ${i%2===0?"bg-white":"bg-slate-50/50"} ${!row.total&&row.total!==0?"opacity-40":""}`}>
                    <td className="px-3 py-2 font-semibold text-slate-700 whitespace-nowrap">{metric}</td>
                    {FY_MONTHS.map(m=>{
                      const v=row[m.toLowerCase()];
                      return <td key={m} className="px-1.5 py-2 text-center font-mono">{v!=null?num(v):"—"}</td>;
                    })}
                    <td className="px-3 py-2 text-center font-mono font-bold text-slate-800">{row.total!=null?num(row.total):"—"}</td>
                    <td className="px-2 py-2"><button onClick={()=>openEntry("kpis",metric,selFY)} className="text-slate-400 hover:text-slate-700 text-xs">{row.total!=null?"Edit":"+"}</button></td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        </div>
      )}

      {view==="pl"&&(
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-700">Profit / Loss Detail — Personal Training & Specialty Programs</h3>
          {FIT_PL_CATS.map(cat=>{
            const rows = FY_LIST.map(fy=>{
              const r = plByKey[`${cat}__${fy}__revenue`];
              const e = plByKey[`${cat}__${fy}__expenses`];
              const p = plByKey[`${cat}__${fy}__profit_loss`];
              if(!r&&!e&&!p) return null;
              return {fy, revenue:r?.total, expenses:e?.total, profit_loss:p?.total, margin:r?.total>0?((r.total-(e?.total||0))/r.total):null};
            }).filter(Boolean);
            return(
              <div key={cat} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 font-bold text-slate-700 text-sm">{cat}</div>
                <table className="w-full text-sm">
                  <thead><tr className="bg-slate-50 text-xs text-slate-400 uppercase tracking-wider">
                    {["Fiscal Year","Revenue","Expenses","P/(L)","Margin"].map(h=><th key={h} className="px-4 py-2 text-left font-semibold">{h}</th>)}
                  </tr></thead>
                  <tbody>{rows.map((r,i)=>(
                    <tr key={r.fy} className={`border-t border-slate-50 ${i%2===0?"bg-white":"bg-slate-50/50"}`}>
                      <td className="px-4 py-2.5 font-semibold text-slate-700">{r.fy}</td>
                      <td className="px-4 py-2.5 font-mono">{dollar(r.revenue)}</td>
                      <td className="px-4 py-2.5 font-mono">{dollar(r.expenses)}</td>
                      <td className={`px-4 py-2.5 font-mono font-semibold ${(r.profit_loss||0)>=0?"text-green-700":"text-red-600"}`}>{dollar(r.profit_loss)}</td>
                      <td className="px-4 py-2.5 font-mono text-slate-500">{r.margin!=null?pct(r.margin):"—"}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// OVERVIEW MODULE
// ══════════════════════════════════════════════════════════════════════════════
function OverviewModule({db}){
  const [campData,setCampData]   = useState([]);
  const [cbFin,setCbFin]         = useState([]);
  const [fitRev,setFitRev]       = useState([]);
  const [recRev,setRecRev]       = useState([]);
  const [fitKpi,setFitKpi]       = useState([]);

  useEffect(()=>{
    Promise.all([
      db.from("camp_annual").select("year,revenue,expenses,profit_loss,enrollment"),
      db.from("clubhouse_financials").select("year,revenue,expenses,profit_loss"),
      db.from("fitness_revenue").select("category,fiscal_year,total"),
      db.from("rec_revenue").select("category,fiscal_year,total"),
      db.from("fitness_kpis").select("metric,fiscal_year,total"),
    ]).then(([{data:c},{data:cb},{data:fr},{data:rr},{data:fk}])=>{
      setCampData(c||[]); setCbFin(cb||[]); setFitRev(fr||[]); setRecRev(rr||[]); setFitKpi(fk||[]);
    });
  },[db]);

  // Camp latest year
  const campByYear={};
  campData.forEach(r=>{if(!campByYear[r.year])campByYear[r.year]={year:r.year,enrollment:0,revenue:0,profit_loss:0}; campByYear[r.year].enrollment+=(r.enrollment||0); campByYear[r.year].revenue+=(r.revenue||0); campByYear[r.year].profit_loss+=(r.profit_loss||0);});
  const campYears = Object.values(campByYear).sort((a,b)=>b.year-a.year).filter(r=>r.revenue>0);
  const latestCamp = campYears[0];
  const priorCamp  = campYears[1];

  // Clubhouse latest year
  const cbByYear={};
  cbFin.forEach(r=>{if(!cbByYear[r.year])cbByYear[r.year]={year:r.year,revenue:0,profit_loss:0}; cbByYear[r.year].revenue+=(r.revenue||0); cbByYear[r.year].profit_loss+=(r.profit_loss||0);});
  const cbYears = Object.values(cbByYear).sort((a,b)=>b.year-a.year).filter(r=>r.revenue>0);
  const latestCB = cbYears[0];

  // Fitness latest FY
  const fitRevByFY={};
  fitRev.filter(r=>r.category==="Overall Revenue").forEach(r=>{fitRevByFY[r.fiscal_year]=r.total;});
  const fitFYs = Object.entries(fitRevByFY).sort((a,b)=>a[0].localeCompare(b[0]));
  const latestFit = fitFYs[fitFYs.length-1];
  const priorFit  = fitFYs[fitFYs.length-2];

  // Rec Fund 4 latest FY
  const recRevByFY={};
  recRev.filter(r=>r.category.trim()==="Overall Revenue"||r.category.trim()==="Overall Revenue ").forEach(r=>{recRevByFY[r.fiscal_year]=r.total;});
  const recFYs = Object.entries(recRevByFY).sort((a,b)=>a[0].localeCompare(b[0]));
  const latestRec = recFYs[recFYs.length-1];

  // Active members
  const membersByFY={};
  fitKpi.filter(r=>r.metric==="Active Members").forEach(r=>{membersByFY[r.fiscal_year]=r.total;});
  const memberFYs = Object.entries(membersByFY).sort((a,b)=>a[0].localeCompare(b[0]));
  const latestMem = memberFYs[memberFYs.length-1];

  const campRevTrend = latestCamp&&priorCamp&&priorCamp.revenue>0?((latestCamp.revenue-priorCamp.revenue)/priorCamp.revenue)*100:null;
  const fitRevTrend  = latestFit&&priorFit&&priorFit[1]>0?((latestFit[1]-priorFit[1])/priorFit[1])*100:null;

  const cards = [
    {title:"Camps",year:latestCamp?.year,revenue:latestCamp?.revenue,pl:latestCamp?.profit_loss,extra:`${num(latestCamp?.enrollment)} enrolled`,trend:campRevTrend,color:NAVY},
    {title:"Clubhouse",year:latestCB?.year,revenue:latestCB?.revenue,pl:latestCB?.profit_loss,extra:"All 10 sites",trend:null,color:"#0f766e"},
    {title:"Recreation Fund 4",year:latestRec?.[0],revenue:latestRec?.[1],pl:null,extra:"Overall fund revenue",trend:null,color:"#7c3aed"},
    {title:"Fitness Center",year:latestFit?.[0],revenue:latestFit?.[1],pl:null,extra:`${latestMem?num(latestMem[1]):"—"} active members`,trend:fitRevTrend,color:GOLD},
  ];

  return(
    <div className="space-y-6">
      <SectionHeader title="BGPD Rec Funds — Overview" sub="All four funds at a glance"/>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {cards.map(c=>(
          <div key={c.title} className="bg-white rounded-xl shadow-sm overflow-hidden" style={{borderTop:`4px solid ${c.color}`}}>
            <div className="px-5 py-4">
              <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{color:c.color}}>{c.title}</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-slate-400 mb-0.5">Revenue</div>
                  <div className="text-2xl font-black text-slate-800">{c.revenue?dollar(c.revenue):"—"}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{c.year}</div>
                </div>
                {c.pl!=null&&(
                  <div>
                    <div className="text-xs text-slate-400 mb-0.5">Net P/(L)</div>
                    <div className={`text-2xl font-black ${c.pl>=0?"text-green-700":"text-red-600"}`}>{dollar(c.pl)}</div>
                  </div>
                )}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="text-xs text-slate-400">{c.extra}</div>
                {c.trend!=null&&(
                  <div className="text-xs font-semibold" style={{color:c.trend>=0?"#16a34a":"#dc2626"}}>
                    {c.trend>=0?"↑":"↓"} {Math.abs(c.trend).toFixed(1)}% YoY
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════════════════════════════════════════
const TABS = [
  {id:"overview",  label:"Overview"},
  {id:"camps",     label:"Camps"},
  {id:"clubhouse", label:"Clubhouse"},
  {id:"recreation",label:"Recreation"},
  {id:"fitness",   label:"Fitness Center"},
];

export default function App(){
  const [tab,setTab] = useState("overview");

  return(
    <div className="min-h-screen" style={{background:"#f1f5f9"}}>
      {/* Header */}
      <header style={{backgroundColor:NAVY}} className="px-4 py-4 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <BGPDLogo size={36}/>
          <div>
            <div className="text-white font-bold text-base leading-tight">Buffalo Grove Park District</div>
            <div className="text-xs font-semibold tracking-widest uppercase" style={{color:"#29ABE2"}}>Rec Funds — Financial Dashboard</div>
          </div>
        </div>
      </header>

      {/* Nav */}
      <nav className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto flex gap-1 px-4 overflow-x-auto">
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              className={`px-5 py-3 text-sm font-semibold border-b-2 transition whitespace-nowrap ${tab===t.id?"text-slate-800":"border-transparent text-slate-400 hover:text-slate-600"}`}
              style={tab===t.id?{borderColor:GOLD,borderBottomWidth:"2px"}:{}}>
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {tab==="overview"   &&<OverviewModule   db={supabase}/>}
        {tab==="camps"      &&<CampsModule      db={supabase}/>}
        {tab==="clubhouse"  &&<ClubhouseModule  db={supabase}/>}
        {tab==="recreation" &&<RecreationModule db={supabase}/>}
        {tab==="fitness"    &&<FitnessModule    db={supabase}/>}
      </main>
    </div>
  );
}
