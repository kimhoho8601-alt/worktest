import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  LayoutDashboard, Target, MessageSquareText, Users, Sparkles, LogOut, Menu,
  Plus, Search, Pencil, Trash2, AlertTriangle, CheckCircle2, Clock3, Copy,
  Download, ShieldCheck, UserCheck, UserX, Loader2, X, Save, ChevronRight,
  CalendarDays, CircleGauge, Building2, BriefcaseBusiness, Info
} from 'lucide-react'
import { supabase, isSupabaseConfigured } from './lib/supabase'
import './styles.css'

const MENU = [
  ['dashboard','대시보드',LayoutDashboard],
  ['goals','성과관리',Target],
  ['interviews','면담관리',MessageSquareText],
  ['employees','직원관리',Users],
  ['ai','AI 도우미',Sparkles],
]
const goalBlank = { title:'',description:'',owner_id:'',period:'연간',category:'',target_value:'',current_value:'',weight:0,due_date:'',progress:0,status:'미진행',evidence:'',manager_feedback:'' }
const interviewBlank = { employee_id:'',interview_date:'',interview_type:'정기면담',mood:'보통',summary:'',strengths:'',concerns:'',action_items:'',employee_commitment:'',manager_support:'',next_date:'',visibility:'participants' }
const roleLabel = { employee:'직원', manager:'팀장', admin:'관리자' }
const employeeBlank = { name:'',department:'',position:'',employment_status:'재직',joined_date:'',manager_id:'',memo:'' }

function App(){
  const [session,setSession]=useState(null),[profile,setProfile]=useState(null),[loading,setLoading]=useState(true)
  const [page,setPage]=useState('dashboard'),[mobile,setMobile]=useState(false)
  useEffect(()=>{ if(!isSupabaseConfigured){setLoading(false);return} supabase.auth.getSession().then(({data})=>{setSession(data.session);setLoading(false)}); const {data:s}=supabase.auth.onAuthStateChange((_e,n)=>setSession(n)); return()=>s.subscription.unsubscribe() },[])
  useEffect(()=>{ if(!session){setProfile(null);return} supabase.from('profiles').select('*').eq('id',session.user.id).single().then(({data})=>setProfile(data)) },[session])
  if(loading) return <FullLoader/>
  if(!isSupabaseConfigured) return <SetupScreen/>
  if(!session) return <AuthScreen/>
  if(!profile) return <FullLoader/>
  if(profile.account_status!=='active') return <PendingScreen profile={profile}/>
  const canManage = ['manager','admin'].includes(profile.role)
  return <div className="app-shell">
    <aside className={`sidebar ${mobile?'open':''}`}>
      <div className="brand"><span className="brand-mark">S</span><div><strong>성과·면담</strong><small>관리 시스템 V4.1</small></div></div>
      <nav>{MENU.filter(([k])=>k!=='employees'||canManage).map(([k,l,I])=><button key={k} className={page===k?'active':''} onClick={()=>{setPage(k);setMobile(false)}}><I size={19}/><span>{l}</span></button>)}</nav>
      <div className="sidebar-user"><div className="avatar">{(profile.name||profile.email||'?')[0]}</div><div><strong>{profile.name||'사용자'}</strong><small>{roleLabel[profile.role]}</small></div><button className="icon-btn" onClick={()=>supabase.auth.signOut()} title="로그아웃"><LogOut size={18}/></button></div>
    </aside>
    <main><header className="topbar"><button className="mobile-menu" onClick={()=>setMobile(!mobile)}><Menu/></button><div><h1>{MENU.find(x=>x[0]===page)?.[1]}</h1><p>{new Date().toLocaleDateString('ko-KR',{year:'numeric',month:'long',day:'numeric',weekday:'long'})}</p></div><span className="role-badge"><ShieldCheck size={15}/>{roleLabel[profile.role]}</span></header>
      <section className="content">
        {page==='dashboard'&&<Dashboard profile={profile}/>} {page==='goals'&&<Goals profile={profile}/>} {page==='interviews'&&<Interviews profile={profile}/>} {page==='employees'&&canManage&&<Employees profile={profile}/>} {page==='ai'&&<AIAssistant profile={profile}/>} 
      </section>
    </main>
  </div>
}

function SetupScreen(){return <div className="center-card"><h1>V4 초기 설정이 필요합니다</h1><p>Netlify 환경변수에 Supabase 정보를 등록하세요.</p><pre>VITE_SUPABASE_URL=...{`\n`}VITE_SUPABASE_ANON_KEY=...</pre><p><b>DEPLOY_GUIDE.md</b>에 순서가 정리되어 있습니다.</p></div>}
function FullLoader(){return <div className="full-loader"><Loader2 className="spin"/> 불러오는 중...</div>}
function PendingScreen({profile}){return <div className="center-card"><UserCheck size={48}/><h1>{profile.account_status==='pending'?'관리자 승인을 기다리고 있습니다':'사용이 중지된 계정입니다'}</h1><p>{profile.email}</p><p>승인 후 다시 로그인하면 시스템을 이용할 수 있습니다.</p><button className="secondary" onClick={()=>supabase.auth.signOut()}>로그아웃</button></div>}

function AuthScreen(){
  const [mode,setMode]=useState('login'),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[name,setName]=useState(''),[msg,setMsg]=useState(''),[busy,setBusy]=useState(false)
  async function submit(e){e.preventDefault();setBusy(true);setMsg('');const r=mode==='login'?await supabase.auth.signInWithPassword({email,password}):await supabase.auth.signUp({email,password,options:{data:{name}}});if(r.error)setMsg(r.error.message);else if(mode==='signup')setMsg('팀장 계정 가입이 접수되었습니다. 이메일 인증과 관리자 승인 후 사용할 수 있습니다.');setBusy(false)}
  return <div className="auth-wrap"><div className="auth-visual"><div className="auth-logo">S</div><h1>성과와 성장의 과정을<br/>한곳에서 관리하세요.</h1><p>목표, 면담, 직원 정보와 실행 알림을 연결합니다.</p></div><form className="auth-card" onSubmit={submit}><h2>{mode==='login'?'로그인':'회원가입'}</h2><p>관리자 또는 팀장만 가입합니다. 업무용 이메일을 사용하세요.</p>{mode==='signup'&&<label>이름<input required value={name} onChange={e=>setName(e.target.value)} placeholder="홍길동"/></label>}<label>이메일<input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@company.org"/></label><label>비밀번호<input required minLength="6" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="6자 이상"/></label>{msg&&<div className="notice">{msg}</div>}<button className="primary wide" disabled={busy}>{busy?<Loader2 className="spin" size={18}/>:mode==='login'?'로그인':'회원가입'}</button><button type="button" className="text-btn" onClick={()=>{setMode(mode==='login'?'signup':'login');setMsg('')}}>{mode==='login'?'계정이 없나요? 회원가입':'이미 계정이 있나요? 로그인'}</button></form></div>
}

function Dashboard({profile}){
  const [goals,setGoals]=useState([]),[interviews,setInterviews]=useState([]),[people,setPeople]=useState([])
  useEffect(()=>{load()},[])
  async function load(){const [g,i,p]=await Promise.all([supabase.from('goals').select('*').order('due_date'),supabase.from('interviews').select('*').order('interview_date',{ascending:false}),supabase.from('employees').select('*').order('name')]);setGoals(g.data||[]);setInterviews(i.data||[]);setPeople(p.data||[])}
  const now=new Date(), week=new Date(Date.now()+7*86400000), stale=new Date(Date.now()-30*86400000), ninety=new Date(Date.now()-90*86400000)
  const avg=goals.length?Math.round(goals.reduce((sum,g)=>sum+(g.progress||0),0)/goals.length):0
  const overdue=goals.filter(g=>g.due_date&&new Date(g.due_date)<now&&g.status!=='완료')
  const dueSoon=goals.filter(g=>g.due_date&&new Date(g.due_date)>=now&&new Date(g.due_date)<=week&&g.status!=='완료')
  const staleGoals=goals.filter(g=>new Date(g.last_progress_at||g.updated_at)<stale&&g.status==='진행중')
  const activePeople=people.filter(p=>p.employment_status==='재직')
  const noInterview=activePeople.filter(p=>!interviews.some(i=>i.employee_id===p.id&&new Date(i.interview_date)>=ninety))
  return <>
    <div className="stat-grid"><Stat icon={Users} label="관리 팀원" value={activePeople.length} sub={profile.role==='admin'?'전체 재직 팀원':'내 팀 재직 인원'}/><Stat icon={CircleGauge} label="평균 진행률" value={`${avg}%`} sub="전체 목표 평균"/><Stat icon={MessageSquareText} label="면담 기록" value={interviews.length} sub="누적 조회 건수"/><Stat icon={AlertTriangle} label="주의 항목" value={overdue.length+staleGoals.length} sub="기한 경과·장기 미갱신" danger={overdue.length+staleGoals.length>0}/></div>
    <div className="two-col"><Panel title="자동 점검 알림"><AlertList items={[
      ...overdue.map(x=>({level:'danger',title:`기한 경과: ${x.title}`,sub:x.due_date})),
      ...dueSoon.map(x=>({level:'warn',title:`7일 이내 마감: ${x.title}`,sub:x.due_date})),
      ...staleGoals.map(x=>({level:'warn',title:`30일 이상 미갱신: ${x.title}`,sub:'진행률 확인 필요'})),
      ...noInterview.slice(0,5).map(x=>({level:'info',title:`최근 90일 면담 없음: ${x.name}`,sub:x.department||'부서 미지정'}))
    ]}/></Panel><Panel title="운영 현황"><div className="progress-ring-wrap"><div className="progress-ring" style={{'--p':`${avg*3.6}deg`}}><span>{avg}%</span></div><div><h3>평균 목표 진행률</h3><p>팀원이 등록하는 계정 없이 팀장이 직접 관리합니다.</p></div></div><div className="mini-metrics"><div><strong>{activePeople.length}</strong><span>재직 팀원</span></div><div><strong>{goals.filter(g=>g.status==='완료').length}</strong><span>완료 목표</span></div><div><strong>{dueSoon.length}</strong><span>7일 내 마감</span></div></div></Panel></div>
    <Panel title="최근 목표"><GoalTable rows={goals.slice(0,8)} employees={people}/></Panel>
  </>
}
function Stat({icon:I,label,value,sub,danger}){return <div className={`stat-card ${danger?'danger':''}`}><div className="stat-icon"><I/></div><div><span>{label}</span><strong>{value}</strong><small>{sub}</small></div></div>}
function AlertList({items}){return <div className="alert-list">{items.length?items.slice(0,10).map((x,i)=><div className={`alert-row ${x.level}`} key={i}><AlertTriangle size={17}/><div><strong>{x.title}</strong><small>{x.sub}</small></div></div>):<div className="empty compact"><CheckCircle2/> 현재 확인할 자동 알림이 없습니다.</div>}</div>}
function Panel({title,children,action}){return <div className="panel"><div className="panel-head"><h2>{title}</h2>{action}</div>{children}</div>}

function Goals({profile}){
  const [rows,setRows]=useState([]),[people,setPeople]=useState([]),[search,setSearch]=useState(''),[status,setStatus]=useState('전체'),[modal,setModal]=useState(false),[form,setForm]=useState(goalBlank),[editId,setEditId]=useState(null)
  const canManage=['manager','admin'].includes(profile.role)
  useEffect(()=>{load()},[])
  async function load(){const [a,b]=await Promise.all([supabase.from('goals').select('*').order('created_at',{ascending:false}),supabase.from('employees').select('id,name,department,employment_status')]);setRows(a.data||[]);setPeople((b.data||[]).filter(x=>x.employment_status!=='퇴직'))}
  function open(row){setEditId(row?.id||null);setForm(row?{...row}:{...goalBlank,owner_id:''});setModal(true)}
  async function save(e){e.preventDefault();const payload={...form,progress:Number(form.progress),weight:Number(form.weight),created_by:profile.id,last_progress_at:new Date().toISOString()};const r=editId?await supabase.from('goals').update(payload).eq('id',editId):await supabase.from('goals').insert(payload);if(r.error)alert(r.error.message);else{setModal(false);load()}}
  async function remove(id){if(confirm('이 목표를 삭제할까요?')){const r=await supabase.from('goals').delete().eq('id',id);if(r.error)alert(r.error.message);load()}}
  const filtered=rows.filter(r=>(r.title||'').toLowerCase().includes(search.toLowerCase())&&(status==='전체'||r.status===status))
  function exportCsv(){downloadCsv('성과목표.csv',filtered.map(r=>({목표:r.title,담당자:people.find(p=>p.id===r.owner_id)?.name||'',기간:r.period,상태:r.status,진행률:r.progress,마감일:r.due_date||'',목표값:r.target_value||'',현재값:r.current_value||''})))}
  return <><div className="toolbar"><div className="toolbar-left"><div className="search"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="목표 검색"/></div><select value={status} onChange={e=>setStatus(e.target.value)}><option>전체</option><option>미진행</option><option>진행중</option><option>완료</option><option>보류</option></select></div><div className="toolbar-actions"><button className="secondary" onClick={exportCsv}><Download size={17}/> CSV</button><button className="primary" onClick={()=>open()}><Plus size={17}/> 목표 등록</button></div></div><Panel title={`성과 목표 ${filtered.length}건`}><GoalTable rows={filtered} employees={people} editable onEdit={open} onDelete={remove}/></Panel>
  {modal&&<Modal title={editId?'목표 수정':'목표 등록'} onClose={()=>setModal(false)}><form className="form-grid" onSubmit={save}><label className="span2">목표명<input required value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></label><label className="span2">목표 설명<textarea value={form.description||''} onChange={e=>setForm({...form,description:e.target.value})}/></label>{canManage&&<label>담당자<select required value={form.owner_id} onChange={e=>setForm({...form,owner_id:e.target.value})}><option value="">선택</option>{people.map(x=><option key={x.id} value={x.id}>{x.name} · {x.department||'부서 미지정'}</option>)}</select></label>}<label>기간<select value={form.period} onChange={e=>setForm({...form,period:e.target.value})}><option>연간</option><option>상반기</option><option>하반기</option><option>1분기</option><option>2분기</option><option>3분기</option><option>4분기</option></select></label><label>분류<input value={form.category||''} onChange={e=>setForm({...form,category:e.target.value})} placeholder="예: 사업성과"/></label><label>가중치(%)<input type="number" min="0" max="100" value={form.weight} onChange={e=>setForm({...form,weight:e.target.value})}/></label><label>목표값<input value={form.target_value||''} onChange={e=>setForm({...form,target_value:e.target.value})}/></label><label>현재값<input value={form.current_value||''} onChange={e=>setForm({...form,current_value:e.target.value})}/></label><label>마감일<input type="date" value={form.due_date||''} onChange={e=>setForm({...form,due_date:e.target.value})}/></label><label>진행률<input type="number" min="0" max="100" value={form.progress} onChange={e=>setForm({...form,progress:e.target.value})}/></label><label>상태<select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option>미진행</option><option>진행중</option><option>완료</option><option>보류</option></select></label><label className="span2">근거·성과자료<textarea value={form.evidence||''} onChange={e=>setForm({...form,evidence:e.target.value})}/></label>{canManage&&<label className="span2">관리자 피드백<textarea value={form.manager_feedback||''} onChange={e=>setForm({...form,manager_feedback:e.target.value})}/></label>}<FormActions onCancel={()=>setModal(false)}/></form></Modal>}</>
}
function GoalTable({rows,employees=[],editable,onEdit,onDelete}){return <div className="table-wrap"><table><thead><tr><th>목표</th><th>담당자</th><th>기간</th><th>진행률</th><th>상태</th><th>마감일</th>{editable&&<th/>}</tr></thead><tbody>{rows.length?rows.map(r=><tr key={r.id}><td><strong>{r.title}</strong><small>{r.category||r.description||'분류 없음'}</small></td><td>{employees.find(x=>x.id===r.owner_id)?.name||'-'}</td><td>{r.period||'-'}</td><td><div className="bar"><i style={{width:`${Math.min(100,r.progress||0)}%`}}/><span>{r.progress||0}%</span></div></td><td><Badge status={r.status}/></td><td>{r.due_date||'-'}</td>{editable&&<td className="actions"><button className="icon-btn" onClick={()=>onEdit(r)}><Pencil size={16}/></button><button className="icon-btn danger-text" onClick={()=>onDelete(r.id)}><Trash2 size={16}/></button></td>}</tr>):<tr><td colSpan="7" className="empty">등록된 목표가 없습니다.</td></tr>}</tbody></table></div>}
function Badge({status}){return <span className={`badge ${status==='완료'?'done':status==='보류'?'hold':status==='미진행'?'idle':''}`}>{status}</span>}

function Interviews({profile}){
  const [rows,setRows]=useState([]),[people,setPeople]=useState([]),[modal,setModal]=useState(false),[form,setForm]=useState(interviewBlank),[editId,setEditId]=useState(null)
  const canWrite=['manager','admin'].includes(profile.role)
  useEffect(()=>{load()},[])
  async function load(){const [a,b]=await Promise.all([supabase.from('interviews').select('*').order('interview_date',{ascending:false}),supabase.from('employees').select('id,name,department,employment_status')]);setRows(a.data||[]);setPeople((b.data||[]).filter(x=>x.employment_status!=='퇴직'))}
  function open(row){setEditId(row?.id||null);setForm(row?{...row}:{...interviewBlank,manager_id:profile.id,interview_date:new Date().toISOString().slice(0,10)});setModal(true)}
  async function save(e){e.preventDefault();const payload={...form,manager_id:form.manager_id||profile.id};const r=editId?await supabase.from('interviews').update(payload).eq('id',editId):await supabase.from('interviews').insert(payload);if(r.error)alert(r.error.message);else{setModal(false);load()}}
  async function remove(id){if(confirm('면담 기록을 삭제할까요?')){await supabase.from('interviews').delete().eq('id',id);load()}}
  return <><div className="toolbar"><div><h2 className="page-subtitle">면담 기록</h2><p>사실, 합의사항, 후속 지원을 중심으로 기록하세요.</p></div>{canWrite&&<button className="primary" onClick={()=>open()}><Plus size={17}/> 면담 등록</button>}</div><div className="card-list">{rows.length?rows.map(r=>{const e=people.find(x=>x.id===r.employee_id);return <div className="interview-card" key={r.id}><div className="card-date"><strong>{new Date(r.interview_date).getDate()}</strong><small>{new Date(r.interview_date).toLocaleDateString('ko-KR',{month:'short'})}</small></div><div className="grow"><div className="card-title-row"><h3>{e?.name||'직원'} · {r.interview_type}</h3><span className="mood">{r.mood||'보통'}</span></div><p>{r.summary}</p>{r.action_items&&<div className="action-box"><ChevronRight size={16}/><span><b>후속 실행</b> {r.action_items}</span></div>} {r.next_date&&<small>다음 면담: {r.next_date}</small>}</div>{canWrite&&<div className="actions"><button className="icon-btn" onClick={()=>open(r)}><Pencil size={16}/></button><button className="icon-btn danger-text" onClick={()=>remove(r.id)}><Trash2 size={16}/></button></div>}</div>}):<div className="empty-card">면담 기록이 없습니다.</div>}</div>
  {modal&&<Modal title={editId?'면담 수정':'면담 등록'} onClose={()=>setModal(false)}><form className="form-grid" onSubmit={save}><label>직원<select required value={form.employee_id} onChange={e=>setForm({...form,employee_id:e.target.value})}><option value="">선택</option>{people.map(x=><option key={x.id} value={x.id}>{x.name} · {x.department||'부서 미지정'}</option>)}</select></label><label>면담일<input required type="date" value={form.interview_date} onChange={e=>setForm({...form,interview_date:e.target.value})}/></label><label>유형<select value={form.interview_type} onChange={e=>setForm({...form,interview_type:e.target.value})}><option>정기면담</option><option>성과점검</option><option>고충면담</option><option>복귀면담</option><option>수시면담</option></select></label><label>현재 상태<select value={form.mood} onChange={e=>setForm({...form,mood:e.target.value})}><option>좋음</option><option>보통</option><option>주의 필요</option></select></label><label className="span2">핵심 요약<textarea required value={form.summary} onChange={e=>setForm({...form,summary:e.target.value})}/></label><label>강점·긍정 변화<textarea value={form.strengths||''} onChange={e=>setForm({...form,strengths:e.target.value})}/></label><label>우려·지원 필요<textarea value={form.concerns||''} onChange={e=>setForm({...form,concerns:e.target.value})}/></label><label className="span2">합의한 실행 항목<textarea value={form.action_items||''} onChange={e=>setForm({...form,action_items:e.target.value})}/></label><label>직원 실행 약속<textarea value={form.employee_commitment||''} onChange={e=>setForm({...form,employee_commitment:e.target.value})}/></label><label>관리자 지원 약속<textarea value={form.manager_support||''} onChange={e=>setForm({...form,manager_support:e.target.value})}/></label><label>다음 면담일<input type="date" value={form.next_date||''} onChange={e=>setForm({...form,next_date:e.target.value})}/></label><label>공개 범위<select value={form.visibility} onChange={e=>setForm({...form,visibility:e.target.value})}><option value="participants">팀장·관리자 공유</option><option value="manager_only">작성 팀장·관리자만</option></select></label><FormActions onCancel={()=>setModal(false)}/></form></Modal>}</>
}

function Employees({profile}){
  const [rows,setRows]=useState([]),[accounts,setAccounts]=useState([]),[selected,setSelected]=useState(null),[search,setSearch]=useState(''),[accountEdit,setAccountEdit]=useState(null)
  const isAdmin=profile.role==='admin'
  useEffect(()=>{load()},[])
  async function load(){
    const queries=[supabase.from('employees').select('*').order('created_at',{ascending:false})]
    if(isAdmin) queries.push(supabase.from('profiles').select('*').order('created_at',{ascending:false}))
    const result=await Promise.all(queries);setRows(result[0].data||[]);if(isAdmin)setAccounts(result[1].data||[])
  }
  function open(row){setSelected(row?{...row}:{...employeeBlank,manager_id:isAdmin?'':profile.id})}
  async function save(e){e.preventDefault();const {id,...values}=selected;const payload={...values,manager_id:isAdmin?(values.manager_id||profile.id):profile.id};const r=id?await supabase.from('employees').update(payload).eq('id',id):await supabase.from('employees').insert(payload);if(r.error)alert(r.error.message);else{setSelected(null);load()}}
  async function remove(row){
    const hasHistory=confirm(`${row.name} 팀원을 퇴직 처리할까요?\n\n확인: 퇴직 처리(기록 보존)\n취소 후 별도 삭제 버튼을 이용할 수 있습니다.`)
    if(hasHistory){const r=await supabase.from('employees').update({employment_status:'퇴직'}).eq('id',row.id);if(r.error)alert(r.error.message);else load()}
  }
  async function hardDelete(row){if(!confirm(`${row.name} 팀원과 연결된 목표·면담 기록까지 완전히 삭제합니다. 계속할까요?`))return;const r=await supabase.from('employees').delete().eq('id',row.id);if(r.error)alert(r.error.message);else load()}
  async function saveAccount(e){e.preventDefault();const {id,...payload}=accountEdit;const r=await supabase.from('profiles').update(payload).eq('id',id);if(r.error)alert(r.error.message);else{setAccountEdit(null);load()}}
  const filtered=rows.filter(x=>`${x.name} ${x.department||''} ${x.position||''}`.toLowerCase().includes(search.toLowerCase()))
  const managerName=id=>accounts.find(x=>x.id===id)?.name||profile.name||'-'
  return <>
    <div className="toolbar"><div className="search"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="팀원 검색"/></div><div className="toolbar-actions"><div className="summary-chip"><Users size={16}/> 전체 {filtered.length}명 · 재직 {filtered.filter(x=>x.employment_status==='재직').length}명</div><button className="primary" onClick={()=>open()}><Plus size={17}/> 팀원 추가</button></div></div>
    <div className="employee-grid">{filtered.map(x=><div className="employee-card" key={x.id}><div className="avatar large">{(x.name||'?')[0]}</div><div className="grow"><h3>{x.name||'이름 미입력'} <Badge status={x.employment_status}/></h3><p>{x.department||'부서 미지정'} · {x.position||'직위 미지정'}</p><small>{isAdmin?`담당 팀장: ${managerName(x.manager_id)}`:`입사일: ${x.joined_date||'-'}`}</small></div><div className="actions"><button className="icon-btn" onClick={()=>open(x)} title="수정"><Pencil size={16}/></button><button className="icon-btn" onClick={()=>remove(x)} title="퇴직 처리"><UserX size={16}/></button>{isAdmin&&<button className="icon-btn danger-text" onClick={()=>hardDelete(x)} title="완전 삭제"><Trash2 size={16}/></button>}</div></div>)}</div>
    {!filtered.length&&<div className="empty-card">등록된 팀원이 없습니다. ‘팀원 추가’로 시작하세요.</div>}
    {isAdmin&&<Panel title="팀장 계정 승인·관리"><div className="table-wrap"><table><thead><tr><th>이름</th><th>이메일</th><th>권한</th><th>상태</th><th>부서</th><th/></tr></thead><tbody>{accounts.map(a=><tr key={a.id}><td>{a.name||'-'}</td><td>{a.email}</td><td>{roleLabel[a.role]}</td><td><Badge status={a.account_status==='active'?'활성':a.account_status==='pending'?'승인대기':'중지'}/></td><td>{a.department||'-'}</td><td><button className="icon-btn" onClick={()=>setAccountEdit({...a})}><Pencil size={16}/></button></td></tr>)}</tbody></table></div></Panel>}
    {selected&&<Modal title={selected.id?'팀원 수정':'팀원 추가'} onClose={()=>setSelected(null)}><form className="form-grid" onSubmit={save}><label>이름<input required value={selected.name||''} onChange={e=>setSelected({...selected,name:e.target.value})}/></label><label>부서<input value={selected.department||''} onChange={e=>setSelected({...selected,department:e.target.value})}/></label><label>직위<input value={selected.position||''} onChange={e=>setSelected({...selected,position:e.target.value})}/></label><label>재직 상태<select value={selected.employment_status} onChange={e=>setSelected({...selected,employment_status:e.target.value})}><option>재직</option><option>휴직</option><option>퇴직</option></select></label><label>입사일<input type="date" value={selected.joined_date||''} onChange={e=>setSelected({...selected,joined_date:e.target.value})}/></label>{isAdmin&&<label>담당 팀장<select required value={selected.manager_id||''} onChange={e=>setSelected({...selected,manager_id:e.target.value})}><option value="">선택</option>{accounts.filter(a=>a.account_status==='active'&&['manager','admin'].includes(a.role)).map(a=><option key={a.id} value={a.id}>{a.name} · {roleLabel[a.role]}</option>)}</select></label>}<label className="span2">메모<textarea value={selected.memo||''} onChange={e=>setSelected({...selected,memo:e.target.value})}/></label><FormActions onCancel={()=>setSelected(null)}/></form></Modal>}
    {accountEdit&&<Modal title="팀장 계정 승인·권한" onClose={()=>setAccountEdit(null)}><form className="form-grid" onSubmit={saveAccount}><label>이름<input value={accountEdit.name||''} onChange={e=>setAccountEdit({...accountEdit,name:e.target.value})}/></label><label>이메일<input disabled value={accountEdit.email||''}/></label><label>부서<input value={accountEdit.department||''} onChange={e=>setAccountEdit({...accountEdit,department:e.target.value})}/></label><label>직위<input value={accountEdit.position||''} onChange={e=>setAccountEdit({...accountEdit,position:e.target.value})}/></label><label>권한<select value={accountEdit.role} onChange={e=>setAccountEdit({...accountEdit,role:e.target.value})}><option value="manager">팀장</option><option value="admin">관리자</option></select></label><label>계정 상태<select value={accountEdit.account_status} onChange={e=>setAccountEdit({...accountEdit,account_status:e.target.value})}><option value="pending">승인대기</option><option value="active">활성</option><option value="inactive">중지</option></select></label><FormActions onCancel={()=>setAccountEdit(null)}/></form></Modal>}
  </>
}

function AIAssistant({profile}){
  const [type,setType]=useState('performance'),[input,setInput]=useState(''),[answer,setAnswer]=useState(''),[busy,setBusy]=useState(false),[notice,setNotice]=useState('')
  const labels={performance:'성과 피드백',interview:'면담 정리',manager:'관리자 코칭',report:'보고서 초안'}
  const prompt=useMemo(()=>buildPrompt(type,input),[type,input])
  async function copy(){if(!input.trim()){setNotice('먼저 내용을 입력하세요.');return}await navigator.clipboard.writeText(prompt);setNotice('프롬프트를 복사했습니다. 사용하는 ChatGPT·Gemini 등에 붙여넣으세요.')}
  async function run(){if(!input.trim())return;setBusy(true);setAnswer('');setNotice('');try{const {data:{session}}=await supabase.auth.getSession();const r=await fetch('/.netlify/functions/ai-assistant',{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${session?.access_token||''}`},body:JSON.stringify({type,input,user:profile.name})});const d=await r.json();if(!r.ok)throw new Error(d.error);setAnswer(d.answer)}catch(e){setNotice(e.message)}finally{setBusy(false)}}
  return <><div className="info-banner"><Info size={20}/><div><strong>회사 비용이 없는 기본 운영 방식</strong><p>아래에서 프롬프트를 복사해 각자가 이용 중인 ChatGPT 무료·유료 계정이나 다른 AI에 붙여넣습니다. 시스템에는 개인 API 키를 저장하지 않습니다.</p></div></div><div className="ai-layout"><Panel title="AI 작업 준비"><div className="ai-options">{Object.entries(labels).map(([k,v])=><button key={k} className={type===k?'active':''} onClick={()=>setType(k)}><Sparkles size={18}/>{v}</button>)}</div><label className="ai-input">분석할 내용<textarea value={input} onChange={e=>setInput(e.target.value)} placeholder="목표 진행 상황, 면담 메모, 보고할 내용 등을 입력하세요."/></label>{notice&&<div className="notice">{notice}</div>}<div className="button-stack"><button className="primary wide" onClick={copy}><Copy size={17}/> 무료 방식: 프롬프트 복사</button><button className="secondary wide" onClick={run} disabled={busy}>{busy?<Loader2 className="spin" size={17}/>:<Sparkles size={17}/>} 조직 API가 있을 때 내부 실행</button></div></Panel><Panel title="결과"><div className="ai-result">{answer||<div className="ai-placeholder"><Sparkles size={42}/><p>조직 API가 설정된 경우 결과가 여기에 표시됩니다.<br/>현재는 프롬프트 복사 방식을 권장합니다.</p></div>}</div></Panel></div></>
}
function buildPrompt(type,input){const guide={performance:'다음 성과 내용을 바탕으로 1) 핵심 성과 2) 지연 또는 위험요인 3) 우선순위 4) 다음 실행 3가지를 정리해 주세요. 사실과 해석을 구분하고 인사평가 점수를 임의로 매기지 마세요.',interview:'다음 면담 메모를 1) 핵심 요약 2) 직원의 관점 3) 확인이 필요한 사항 4) 후속 질문 5) 합의할 실행 항목으로 정리해 주세요. 개인정보는 불필요하게 반복하지 마세요.',manager:'다음 상황에 대해 1) 상황 진단 2) 대화 시작 문장 3) 확인 질문 4) 피해야 할 행동 5) 1주일 실행안을 제시해 주세요. 단정하거나 낙인찍지 마세요.',report:'다음 내용을 보고용 문체로 1) 현황 2) 주요 성과 3) 리스크 4) 지원 요청 5) 다음 계획 순서로 간결하게 정리해 주세요.'};return `${guide[type]}\n\n[입력 내용]\n${input}`}

function Modal({title,onClose,children}){return <div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&onClose()}><div className="modal"><div className="modal-head"><h2>{title}</h2><button className="icon-btn" onClick={onClose}><X/></button></div>{children}</div></div>}
function FormActions({onCancel}){return <div className="form-actions span2"><button type="button" className="secondary" onClick={onCancel}>취소</button><button className="primary"><Save size={17}/> 저장</button></div>}
function downloadCsv(filename,rows){if(!rows.length){alert('내보낼 데이터가 없습니다.');return}const keys=Object.keys(rows[0]);const esc=v=>`"${String(v??'').replaceAll('"','""')}"`;const csv='\ufeff'+[keys.map(esc).join(','),...rows.map(r=>keys.map(k=>esc(r[k])).join(','))].join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download=filename;a.click();URL.revokeObjectURL(a.href)}

createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>)
