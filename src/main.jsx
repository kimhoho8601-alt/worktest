import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  LayoutDashboard, Target, MessageSquareText, Users, Sparkles, LogOut, Menu,
  Plus, Search, Pencil, Trash2, AlertTriangle, CheckCircle2, Clock3, Copy,
  Download, ShieldCheck, UserCheck, UserX, Loader2, X, Save, ChevronRight,
  CalendarDays, CircleGauge, Building2, BriefcaseBusiness, Info, Bell, ChevronDown, Eye, EyeOff,
  UserPlus, CalendarClock, ArrowRight, ClipboardCheck, Activity, TrendingUp, Settings, SlidersHorizontal, Database, ListPlus
} from 'lucide-react'
import { supabase, isSupabaseConfigured } from './lib/supabase'
import './styles.css'

const MENU = [
  ['dashboard','대시보드',LayoutDashboard],
  ['employees','직원관리',Users],
  ['goals','성과관리',Target],
  ['interviews','면담관리',MessageSquareText],
  ['admin','관리자 설정',Settings],
]
const goalBlank = { title:'',description:'',owner_id:'',period:'연간',category:'',target_value:'',current_value:'',weight:0,due_date:'',progress:0,status:'미진행',evidence:'',manager_feedback:'' }
const interviewBlank = { employee_id:'',interview_date:'',interview_type:'정기면담',mood:'보통',summary:'',strengths:'',concerns:'',action_items:'',employee_commitment:'',manager_support:'',next_date:'',visibility:'participants' }
const roleLabel = { employee:'직원', manager:'팀장', admin:'관리자' }

const DEFAULT_SETTINGS = {
  id:'global', alert_missing_goal:false, alert_goal_overdue:true, alert_goal_due_soon:true,
  alert_goal_stale:true, alert_no_interview:true, alert_pending_manager:true,
  goal_due_days:7, goal_stale_days:30, interview_overdue_days:90,
  organization_name:'성과·면담 관리', support_text:'수탁사업지원팀 문의'
}

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
  const visibleMenu = MENU.filter(([k])=>(k!=='employees'||canManage)&&(k!=='admin'||profile.role==='admin'))
  const currentLabel = visibleMenu.find(x=>x[0]===page)?.[1] || '대시보드'
  return <div className="app-shell">
    <aside className={`sidebar ${mobile?'open':''}`}>
      <div className="brand"><img className="brand-logo" src="/Logo-black.png" alt="Save the Children"/><div className="brand-system-name">성과·면담관리 시스템</div></div>
      <nav>{visibleMenu.map(([k,l,I])=><button key={k} className={page===k?'active':''} onClick={()=>{setPage(k);setMobile(false)}}><I size={19}/><span>{l}</span></button>)}</nav>
      <div className="sidebar-spacer"/>
      <div className="sidebar-user"><div className="avatar">{(profile.name||profile.email||'?')[0]}</div><div><strong>{profile.name||'사용자'}</strong><small>{roleLabel[profile.role]}</small></div><button className="icon-btn" onClick={()=>supabase.auth.signOut()} title="로그아웃"><LogOut size={18}/></button></div>
    </aside>
    <main>
      <header className="topbar">
        <button className="mobile-menu" onClick={()=>setMobile(!mobile)}><Menu/></button>
        <div className="topbar-title"><h1>{currentLabel}</h1><p>{new Date().toLocaleDateString('ko-KR',{year:'numeric',month:'long',day:'numeric',weekday:'long'})}</p></div>
        <div className="topbar-actions"><button className="icon-btn top-icon" title="알림"><Bell size={19}/></button><div className="profile-chip"><div className="avatar">{(profile.name||profile.email||'?')[0]}</div><div><strong>{profile.name||'사용자'}</strong><small>{roleLabel[profile.role]}</small></div><ChevronDown size={15}/></div></div>
      </header>
      <section className="content">
        {page==='dashboard'&&<Dashboard profile={profile} onNavigate={setPage}/>} {page==='goals'&&<Goals profile={profile}/>} {page==='interviews'&&<Interviews profile={profile}/>} {page==='employees'&&canManage&&<Employees profile={profile}/>} {page==='admin'&&profile.role==='admin'&&<AdminPage profile={profile}/>} 
      </section>
    </main>
  </div>
}
function SetupScreen(){return <div className="center-card"><h1>V4 초기 설정이 필요합니다</h1><p>Netlify 환경변수에 Supabase 정보를 등록하세요.</p><pre>VITE_SUPABASE_URL=...{`\n`}VITE_SUPABASE_ANON_KEY=...</pre><p><b>DEPLOY_GUIDE.md</b>에 순서가 정리되어 있습니다.</p></div>}
function FullLoader(){return <div className="full-loader"><Loader2 className="spin"/> 불러오는 중...</div>}
function PendingScreen({profile}){return <div className="center-card pending-account-card"><div className="pending-status-icon"><UserCheck size={34}/></div><span className="pending-status-label">{profile.account_status==='pending'?'가입 요청 완료':'계정 상태 안내'}</span><h1>{profile.account_status==='pending'?'관리자 승인을 기다리고 있습니다':'사용이 중지된 계정입니다'}</h1><p className="pending-email">{profile.email}</p><p>{profile.account_status==='pending'?'가입 요청이 정상적으로 접수되었습니다. 관리자가 승인하면 로그인하여 사용할 수 있습니다.':'계정 사용이 중지되어 있습니다. 관리자에게 문의해 주세요.'}</p><button className="secondary" onClick={()=>supabase.auth.signOut()}>로그인 화면으로 돌아가기</button></div>}

function AuthScreen(){
  const [mode,setMode]=useState('login'),[email,setEmail]=useState(()=>localStorage.getItem('rememberedLoginEmail')||''),[password,setPassword]=useState(''),[name,setName]=useState(''),[department,setDepartment]=useState(''),[departments,setDepartments]=useState([]),[msg,setMsg]=useState(''),[msgKind,setMsgKind]=useState('info'),[busy,setBusy]=useState(false),[showPassword,setShowPassword]=useState(false),[rememberEmail,setRememberEmail]=useState(()=>Boolean(localStorage.getItem('rememberedLoginEmail')))
  useEffect(()=>{loadDepartments()},[])
  async function loadDepartments(){
    const {data,error}=await supabase.from('org_departments').select('id,name').eq('is_active',true).order('sort_order').order('name')
    if(!error)setDepartments(data||[])
  }
  async function submit(e){
    e.preventDefault()
    if(busy)return
    setBusy(true);setMsg('');setMsgKind('info')
    const normalizedEmail=email.trim().toLowerCase()
    try{
      const r=mode==='login'
        ? await supabase.auth.signInWithPassword({email:normalizedEmail,password})
        : await supabase.auth.signUp({email:normalizedEmail,password,options:{data:{name:name.trim(),department,role:'manager',account_status:'pending'}}})
      if(r.error){
        setMsgKind('error')
        const message=(r.error.message||'').toLowerCase()
        if(message.includes('email rate limit exceeded')) setMsg('현재 가입 요청이 많아 잠시 처리할 수 없습니다. 잠시 후 다시 시도해 주세요.')
        else if(message.includes('user already registered')) setMsg('이미 가입된 이메일입니다. 로그인하거나 관리자에게 계정 상태를 문의해 주세요.')
        else setMsg(r.error.message)
      }else if(mode==='signup'){
        const identities=r.data?.user?.identities
        if(Array.isArray(identities)&&identities.length===0){
          setMsgKind('error')
          setMsg('이미 가입된 이메일입니다. 로그인하거나 관리자에게 계정 상태를 문의해 주세요.')
          return
        }
        setName('');setDepartment('');setPassword('')
        if(!r.data?.session){
          setMode('login')
          setMsgKind('success')
          setMsg('가입 요청이 정상적으로 접수되었습니다. 관리자 승인 후 로그인할 수 있습니다.')
        }
      }else if(mode==='login'){
        if(rememberEmail)localStorage.setItem('rememberedLoginEmail',normalizedEmail)
        else localStorage.removeItem('rememberedLoginEmail')
      }
    }finally{setBusy(false)}
  }
  return <div className="auth-wrap">
    <div className="auth-visual">
      <div className="auth-orb orb-one"/><div className="auth-orb orb-two"/><div className="auth-grid"/>
      <div className="auth-copy"><img className="auth-brand-logo" src="/Logo-white.png" alt="Save the Children"/><h1>성과와 성장의 과정을<br/><em>한곳에서 관리하세요.</em></h1><p>목표, 면담, 팀원 정보를 쉽고 직관적으로 연결합니다.</p></div>
      <small className="auth-copyright">© 2026 Performance Management System</small>
    </div>
    <div className="auth-form-side"><form className="auth-card" onSubmit={submit}>
      <div className="auth-card-head"><span className="eyebrow">TEAM LEADER WORKSPACE</span><h2>{mode==='login'?'로그인':'팀장 계정 가입'}</h2><p>{mode==='login'?'관리자 또는 팀장 계정으로 접속하세요.':'업무용 이메일로 가입 요청을 보내면 관리자가 확인 후 승인합니다.'}</p></div>
      {mode==='signup'&&<><label>이름<input required value={name} onChange={e=>setName(e.target.value)} placeholder="홍길동"/></label><label>소속 부서<select required value={department} onChange={e=>setDepartment(e.target.value)}><option value="">부서를 선택하세요</option>{departments.map(d=><option key={d.id} value={d.name}>{d.name}</option>)}</select><small className="field-help">목록에 부서가 없다면 관리자에게 등록을 요청하세요.</small></label></>}
      <label>이메일<input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@company.org"/></label>
      <label>비밀번호<div className="password-field"><input required minLength="6" type={showPassword?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="6자 이상"/><button type="button" onClick={()=>setShowPassword(!showPassword)}>{showPassword?<EyeOff size={17}/>:<Eye size={17}/>}</button></div></label>
      {mode==='login'&&<label className="remember-email"><input type="checkbox" checked={rememberEmail} onChange={e=>setRememberEmail(e.target.checked)}/>이메일 저장</label>}
      {msg&&<div className={`notice auth-status ${msgKind}`} role="status" aria-live="polite">{msgKind==='success'?<CheckCircle2 size={18}/>:msgKind==='error'?<AlertTriangle size={18}/>:<Info size={18}/>}<span>{msg}</span></div>}
      <button className="primary wide auth-submit" disabled={busy}>{busy?<Loader2 className="spin" size={18}/>:mode==='login'?'로그인':'회원가입'}</button>
      <button type="button" className="text-btn" onClick={()=>{setMode(mode==='login'?'signup':'login');setMsg('');setMsgKind('info')}}>{mode==='login'?'팀장 계정이 없나요? 가입 요청':'이미 가입 요청을 했나요? 로그인'}</button>
    </form></div>
  </div>
}
function Dashboard({profile,onNavigate}){
  const [goals,setGoals]=useState([]),[interviews,setInterviews]=useState([]),[people,setPeople]=useState([]),[accounts,setAccounts]=useState([]),[settings,setSettings]=useState(DEFAULT_SETTINGS)
  useEffect(()=>{load()},[])
  async function load(){
    const queries=[
      supabase.from('goals').select('*').order('updated_at',{ascending:false}),
      supabase.from('interviews').select('*').order('interview_date',{ascending:false}),
      supabase.from('employees').select('*').order('created_at',{ascending:false})
    ]
    if(profile.role==='admin') queries.push(supabase.from('profiles').select('*').order('created_at',{ascending:false}))
    queries.push(supabase.from('app_settings').select('*').eq('id','global').maybeSingle())
    const result=await Promise.all(queries)
    setGoals(result[0].data||[]);setInterviews(result[1].data||[]);setPeople(result[2].data||[]);setAccounts(profile.role==='admin'?(result[3]?.data||[]):[]);const settingResult=result[profile.role==='admin'?4:3];if(settingResult?.data)setSettings({...DEFAULT_SETTINGS,...settingResult.data})
  }
  const now=new Date(), week=new Date(Date.now()+Number(settings.goal_due_days||7)*86400000), stale=new Date(Date.now()-Number(settings.goal_stale_days||30)*86400000), ninety=new Date(Date.now()-Number(settings.interview_overdue_days||90)*86400000)
  const monthStart=new Date(now.getFullYear(),now.getMonth(),1)
  const activePeople=people.filter(p=>p.employment_status==='재직')
  const leavePeople=people.filter(p=>p.employment_status==='휴직')
  const completed=goals.filter(g=>g.status==='완료')
  const avg=goals.length?Math.round(goals.reduce((sum,g)=>sum+(Number(g.progress)||0),0)/goals.length):0
  const monthlyInterviews=interviews.filter(i=>new Date(i.interview_date)>=monthStart)
  const interviewRate=activePeople.length?Math.min(100,Math.round(new Set(monthlyInterviews.map(i=>i.employee_id)).size/activePeople.length*100)):0
  const overdue=goals.filter(g=>g.due_date&&new Date(`${g.due_date}T23:59:59`)<now&&g.status!=='완료')
  const dueSoon=goals.filter(g=>g.due_date&&new Date(g.due_date)>=now&&new Date(g.due_date)<=week&&g.status!=='완료')
  const staleGoals=goals.filter(g=>new Date(g.last_progress_at||g.updated_at||g.created_at)<stale&&g.status==='진행중')
  const noGoal=activePeople.filter(p=>!goals.some(g=>g.owner_id===p.id))
  const noInterview=activePeople.filter(p=>!interviews.some(i=>i.employee_id===p.id&&new Date(i.interview_date)>=ninety))
  const pendingAccounts=accounts.filter(a=>a.account_status==='pending')
  const alerts=[
    ...(settings.alert_pending_manager?pendingAccounts.map(x=>({level:'approval',title:`팀장 승인 대기: ${x.name||x.email}`,sub:'계정 승인 후 시스템 사용 가능',action:'관리자 설정',page:'admin'})):[]),
    ...(settings.alert_goal_overdue?overdue.map(x=>({level:'danger',title:`기한 경과: ${x.title}`,sub:`마감 ${x.due_date}`,action:'성과관리',page:'goals'})):[]),
    ...(settings.alert_goal_due_soon?dueSoon.map(x=>({level:'warn',title:`${settings.goal_due_days}일 이내 마감: ${x.title}`,sub:`마감 ${x.due_date}`,action:'성과관리',page:'goals'})):[]),
    ...(settings.alert_goal_stale?staleGoals.map(x=>({level:'warn',title:`${settings.goal_stale_days}일 이상 미갱신: ${x.title}`,sub:'진행률 점검 필요',action:'성과관리',page:'goals'})):[]),
    ...(settings.alert_missing_goal?noGoal.map(x=>({level:'info',title:`목표 미등록: ${x.name}`,sub:x.department||'부서 미지정',action:'성과관리',page:'goals'})):[]),
    ...(settings.alert_no_interview?noInterview.map(x=>({level:'info',title:`최근 ${settings.interview_overdue_days}일 면담 없음: ${x.name}`,sub:x.department||'부서 미지정',action:'면담관리',page:'interviews',employeeId:x.id})):[])
  ]
  const recent=[
    ...people.slice(0,4).map(x=>({kind:'직원 등록',name:x.name,at:x.created_at,icon:UserPlus,page:'employees'})),
    ...goals.slice(0,4).map(x=>({kind:'성과 업데이트',name:x.title,at:x.updated_at||x.created_at,icon:Target,page:'goals'})),
    ...interviews.slice(0,4).map(x=>({kind:'면담 기록',name:people.find(p=>p.id===x.employee_id)?.name||'팀원',at:x.created_at||x.interview_date,icon:MessageSquareText,page:'interviews',employeeId:x.employee_id}))
  ].filter(x=>x.at).sort((a,b)=>new Date(b.at)-new Date(a.at)).slice(0,6)
  function navigate(page,employeeId=''){
    if(employeeId) sessionStorage.setItem('dashboardTargetEmployee',employeeId)
    else sessionStorage.removeItem('dashboardTargetEmployee')
    onNavigate(page)
  }
  return <>
    <div className="dashboard-hero"><div><span className="eyebrow">TODAY'S HR BRIEFING</span><h2>안녕하세요, sck 리더 {profile.name||'관리자'}님 👋</h2><p>{profile.role==='admin'?'전체 팀의 주요 변화와 오늘 처리할 업무를 확인하세요.':'내 팀의 면담·목표 현황과 우선 업무를 확인하세요.'}</p></div><div className="date-chip"><CalendarDays size={17}/>{new Date().toLocaleDateString('ko-KR',{month:'long',day:'numeric',weekday:'short'})}</div></div>
    <div className="briefing-strip"><div><span>오늘의 점검</span><strong>{alerts.length?`${alerts.length}건의 확인 항목이 있습니다.`:'오늘 처리할 긴급 업무가 없습니다.'}</strong></div><div className="briefing-pills"><span><UserPlus size={15}/> 승인대기 {pendingAccounts.length}</span><span><CalendarClock size={15}/> {settings.goal_due_days}일 내 마감 {settings.alert_goal_due_soon?dueSoon.length:0}</span><span><MessageSquareText size={15}/> {settings.interview_overdue_days}일 미면담 {settings.alert_no_interview?noInterview.length:0}</span></div></div>
    <div className="stat-grid"><Stat icon={Users} label={profile.role==='admin'?'전체 재직 팀원':'내 팀원'} value={activePeople.length} sub={`휴직 ${leavePeople.length}명`} onClick={()=>navigate('employees')}/><Stat icon={MessageSquareText} label="이번 달 면담률" value={`${interviewRate}%`} sub={`${monthlyInterviews.length}건 기록`} onClick={()=>navigate('interviews')}/><Stat icon={CircleGauge} label="평균 목표 진행률" value={`${avg}%`} sub={`완료 목표 ${completed.length}건`} onClick={()=>navigate('goals')}/><Stat icon={AlertTriangle} label="주의 항목" value={alerts.length} sub="관리자가 켠 점검 항목" danger={alerts.length>0} onClick={()=>alerts[0]&&navigate(alerts[0].page,alerts[0].employeeId)}/></div>
    <div className="dashboard-grid">
      <Panel title="자동 점검 알림" action={<span className="panel-caption">우선순위 순</span>}><AlertList items={alerts} onNavigate={navigate}/></Panel>
      <Panel title="운영 현황"><div className="progress-summary"><div className="progress-ring" style={{'--p':`${avg*3.6}deg`}}><span>{avg}%</span></div><div className="progress-copy"><span>평균 목표 진행률</span><h3>{avg>=80?'안정적으로 진행 중입니다.':avg>=50?'추가 점검이 필요합니다.':'목표를 등록하고 관리해보세요!.'}</h3><p>목표 {goals.length}건 중 {completed.length}건 완료</p></div></div><div className="status-bars"><StatusBar label="목표 진행률" value={avg}/><StatusBar label="이번 달 면담률" value={interviewRate}/></div><div className="mini-metrics"><div><strong>{activePeople.length}</strong><span>재직 팀원</span></div><div><strong>{completed.length}</strong><span>완료 목표</span></div><div><strong>{dueSoon.length}</strong><span>7일 내 마감</span></div></div></Panel>
      <Panel title="최근 활동" action={<span className="panel-caption">최근 6건</span>}><RecentActivity items={recent} onNavigate={navigate}/></Panel>
      <Panel title="빠른 현황"><div className="quick-insights"><Insight icon={ClipboardCheck} label="목표 미등록" value={settings.alert_missing_goal?noGoal.length:'OFF'} tone="warn" onClick={()=>navigate('goals')}/><Insight icon={MessageSquareText} label={`${settings.interview_overdue_days}일 미면담`} value={settings.alert_no_interview?noInterview.length:'OFF'} tone="info" onClick={()=>navigate('interviews')}/><Insight icon={Activity} label={`${settings.goal_stale_days}일 미갱신`} value={settings.alert_goal_stale?staleGoals.length:'OFF'} tone="danger" onClick={()=>navigate('goals')}/><Insight icon={TrendingUp} label="목표 완료율" value={`${goals.length?Math.round(completed.length/goals.length*100):0}%`} tone="good" onClick={()=>navigate('goals')}/></div></Panel>
    </div>
  </>
}
function Stat({icon:I,label,value,sub,danger,onClick}){return <div className={`stat-card ${danger?'danger':''}`} onClick={onClick} style={onClick?{cursor:'pointer'}:undefined}><div className="stat-icon"><I/></div><div><span>{label}</span><strong>{value}</strong><small>{sub}</small></div></div>}
function AlertList({items,onNavigate}){return <div className="alert-list">{items.length?items.slice(0,8).map((x,i)=><div className={`alert-row ${x.level}`} key={i} onClick={()=>onNavigate(x.page,x.employeeId)} style={{cursor:'pointer'}}><div className="alert-symbol">{x.level==='approval'?<UserCheck size={17}/>:x.level==='info'?<Info size={17}/>:<AlertTriangle size={17}/>}</div><div className="grow"><strong>{x.title}</strong><small>{x.sub}</small></div><span className="alert-action">{x.action}<ArrowRight size={14}/></span></div>):<div className="empty compact success-empty"><CheckCircle2/> 오늘 처리할 자동 점검 항목이 없습니다.</div>}</div>}
function Panel({title,children,action}){return <div className="panel"><div className="panel-head"><h2>{title}</h2>{action}</div>{children}</div>}
function StatusBar({label,value}){return <div className="status-bar"><div><span>{label}</span><strong>{value}%</strong></div><div className="status-track"><i style={{width:`${Math.min(100,value)}%`}}/></div></div>}
function RecentActivity({items,onNavigate}){return <div className="recent-list">{items.length?items.map((x,i)=>{const I=x.icon;return <div className="recent-row" key={i} onClick={()=>onNavigate(x.page,x.employeeId)} style={{cursor:'pointer'}}><div className="recent-icon"><I size={16}/></div><div className="grow"><strong>{x.kind}</strong><span>{x.name}</span></div><small>{relativeTime(x.at)}</small></div>}):<div className="empty compact">최근 활동이 없습니다.</div>}</div>}
function Insight({icon:I,label,value,tone,onClick}){return <div className={`insight ${tone}`} onClick={onClick} style={onClick?{cursor:'pointer'}:undefined}><div><I size={18}/><span>{label}</span></div><strong>{value}</strong></div>}
function relativeTime(value){const t=new Date(value).getTime(),d=Date.now()-t;if(!Number.isFinite(t))return '-';const m=Math.floor(d/60000);if(m<1)return '방금 전';if(m<60)return `${m}분 전`;const h=Math.floor(m/60);if(h<24)return `${h}시간 전`;const day=Math.floor(h/24);if(day<7)return `${day}일 전`;return new Date(value).toLocaleDateString('ko-KR',{month:'numeric',day:'numeric'})}

function Goals({profile}){
  const [rows,setRows]=useState([]),[people,setPeople]=useState([]),[search,setSearch]=useState(''),[status,setStatus]=useState('전체'),[modal,setModal]=useState(false),[form,setForm]=useState(goalBlank),[editId,setEditId]=useState(null)
  const canManage=['manager','admin'].includes(profile.role)
  useEffect(()=>{load()},[])
  async function load(){const [a,b]=await Promise.all([supabase.from('goals').select('*').order('created_at',{ascending:false}),supabase.from('employees').select('id,name,department,employment_status,manager_id')]);setRows(a.data||[]);setPeople((b.data||[]).filter(x=>x.employment_status!=='퇴직'))}
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
  const [rows,setRows]=useState([]),[people,setPeople]=useState([]),[modal,setModal]=useState(false),[form,setForm]=useState(interviewBlank),[editId,setEditId]=useState(null),[employeeFilter,setEmployeeFilter]=useState(()=>sessionStorage.getItem('dashboardTargetEmployee')||'전체')
  const canWrite=['manager','admin'].includes(profile.role)
  useEffect(()=>{load()},[])
  async function load(){
    const [a,b]=await Promise.all([supabase.from('interviews').select('*').order('interview_date',{ascending:false}),supabase.from('employees').select('id,name,department,employment_status,manager_id')])
    const visiblePeople=(b.data||[]).filter(x=>x.employment_status!=='퇴직'&&(profile.role==='admin'||x.manager_id===profile.id))
    const visibleIds=new Set(visiblePeople.map(x=>x.id))
    setPeople(visiblePeople);setRows((a.data||[]).filter(x=>profile.role==='admin'||visibleIds.has(x.employee_id)));sessionStorage.removeItem('dashboardTargetEmployee')
  }
  function exportInterviews(){
    const employeeName=id=>people.find(x=>x.id===id)?.name||''
    downloadCsv(profile.role==='admin'?'전체_면담기록.csv':'내팀원_면담기록.csv',filteredRows.map(r=>({
      직원명:employeeName(r.employee_id),팀장명:profile.name||profile.email,부서:people.find(x=>x.id===r.employee_id)?.department||'',면담일:r.interview_date||'',면담유형:r.interview_type||'',상태:r.mood||'',핵심요약:r.summary||'',강점:r.strengths||'',우려사항:r.concerns||'',실행항목:r.action_items||'',직원약속:r.employee_commitment||'',팀장지원:r.manager_support||'',다음면담일:r.next_date||'',공개범위:r.visibility||''
    })))
  }
  function open(row){setEditId(row?.id||null);setForm(row?{...row}:{...interviewBlank,manager_id:profile.id,interview_date:new Date().toISOString().slice(0,10)});setModal(true)}
  async function save(e){e.preventDefault();const payload={...form,manager_id:form.manager_id||profile.id};const r=editId?await supabase.from('interviews').update(payload).eq('id',editId):await supabase.from('interviews').insert(payload);if(r.error)alert(r.error.message);else{setModal(false);load()}}
  async function remove(id){if(confirm('면담 기록을 삭제할까요?')){await supabase.from('interviews').delete().eq('id',id);load()}}
  const filteredRows=employeeFilter==='전체'?rows:rows.filter(r=>r.employee_id===employeeFilter)
  const selectedName=people.find(p=>p.id===employeeFilter)?.name
  return <><div className="toolbar"><div><h2 className="page-subtitle">면담 기록</h2><p>{selectedName?`${selectedName}님의 면담 기록을 보고 있습니다.`:'사실, 합의사항, 후속 지원을 중심으로 기록하세요.'}</p></div><div className="toolbar-actions"><select value={employeeFilter} onChange={e=>setEmployeeFilter(e.target.value)}><option value="전체">전체 직원 · {rows.length}건</option>{people.map(x=><option key={x.id} value={x.id}>{x.name} · {rows.filter(r=>r.employee_id===x.id).length}건</option>)}</select><button className="secondary" onClick={exportInterviews}><Download size={17}/> {profile.role==='admin'?'면담 기록 CSV':'내 팀원 면담 CSV'}</button>{canWrite&&<button className="primary" onClick={()=>open()}><Plus size={17}/> 면담 등록</button>}</div></div><div className="card-list">{filteredRows.length?filteredRows.map(r=>{const e=people.find(x=>x.id===r.employee_id);return <div className="interview-card" key={r.id}><div className="card-date"><strong>{new Date(r.interview_date).getDate()}</strong><small>{new Date(r.interview_date).toLocaleDateString('ko-KR',{month:'short'})}</small></div><div className="grow"><div className="card-title-row"><h3>{e?.name||'직원'} · {r.interview_type}</h3><span className="mood">{r.mood||'보통'}</span></div><p>{r.summary}</p>{r.action_items&&<div className="action-box"><ChevronRight size={16}/><span><b>후속 실행</b> {r.action_items}</span></div>} {r.next_date&&<small>다음 면담: {r.next_date}</small>}</div>{canWrite&&<div className="actions"><button className="icon-btn" onClick={()=>open(r)}><Pencil size={16}/></button><button className="icon-btn danger-text" onClick={()=>remove(r.id)}><Trash2 size={16}/></button></div>}</div>}):<div className="empty-card">{employeeFilter==='전체'?'면담 기록이 없습니다.':'선택한 직원의 면담 기록이 없습니다.'}</div>}</div>
  {modal&&<Modal title={editId?'면담 수정':'면담 등록'} onClose={()=>setModal(false)}><form className="form-grid" onSubmit={save}><label>직원<select required value={form.employee_id} onChange={e=>setForm({...form,employee_id:e.target.value})}><option value="">선택</option>{people.map(x=><option key={x.id} value={x.id}>{x.name} · {x.department||'부서 미지정'}</option>)}</select></label><label>면담일<input required type="date" value={form.interview_date} onChange={e=>setForm({...form,interview_date:e.target.value})}/></label><label>유형<select value={form.interview_type} onChange={e=>setForm({...form,interview_type:e.target.value})}><option>정기면담</option><option>성과점검</option><option>고충면담</option><option>복귀면담</option><option>수시면담</option></select></label><label>현재 상태<select value={form.mood} onChange={e=>setForm({...form,mood:e.target.value})}><option>좋음</option><option>보통</option><option>주의 필요</option></select></label><label className="span2">핵심 요약<textarea required value={form.summary} onChange={e=>setForm({...form,summary:e.target.value})}/></label><label>강점·긍정 변화<textarea value={form.strengths||''} onChange={e=>setForm({...form,strengths:e.target.value})}/></label><label>우려·지원 필요<textarea value={form.concerns||''} onChange={e=>setForm({...form,concerns:e.target.value})}/></label><label className="span2">합의한 실행 항목<textarea value={form.action_items||''} onChange={e=>setForm({...form,action_items:e.target.value})}/></label><label>직원 실행 약속<textarea value={form.employee_commitment||''} onChange={e=>setForm({...form,employee_commitment:e.target.value})}/></label><label>관리자 지원 약속<textarea value={form.manager_support||''} onChange={e=>setForm({...form,manager_support:e.target.value})}/></label><label>다음 면담일<input type="date" value={form.next_date||''} onChange={e=>setForm({...form,next_date:e.target.value})}/></label><label>공개 범위<select value={form.visibility} onChange={e=>setForm({...form,visibility:e.target.value})}><option value="participants">팀장·관리자 공유</option><option value="manager_only">작성 팀장·관리자만</option></select></label><FormActions onCancel={()=>setModal(false)}/></form></Modal>}</>
}

function Employees({profile}){
  const [rows,setRows]=useState([]),[accounts,setAccounts]=useState([]),[departments,setDepartments]=useState([]),[positions,setPositions]=useState([]),[selected,setSelected]=useState(null),[search,setSearch]=useState(''),[accountEdit,setAccountEdit]=useState(null)
  const isAdmin=profile.role==='admin'
  useEffect(()=>{load()},[])
  async function load(){
    const queries=[
      supabase.from('employees').select('*').order('created_at',{ascending:false}),
      supabase.from('org_departments').select('*').order('sort_order').order('name'),
      supabase.from('org_positions').select('*').order('sort_order').order('name')
    ]
    if(isAdmin) queries.push(supabase.from('profiles').select('*').order('created_at',{ascending:false}))
    const result=await Promise.all(queries)
    setRows(result[0].data||[]);setDepartments(result[1].data||[]);setPositions(result[2].data||[])
    if(isAdmin)setAccounts(result[3].data||[])
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
    {selected&&<Modal title={selected.id?'팀원 수정':'팀원 추가'} onClose={()=>setSelected(null)}><form className="form-grid" onSubmit={save}><div className="form-section-title span2">기본정보</div><label>이름<input required value={selected.name||''} onChange={e=>setSelected({...selected,name:e.target.value})}/></label><label>소속 부서<select required value={selected.department||''} onChange={e=>setSelected({...selected,department:e.target.value,manager_id:''})}><option value="">부서를 선택하세요</option>{departments.filter(d=>d.is_active||d.name===selected.department).map(d=><option key={d.id} value={d.name}>{d.name}{!d.is_active?' (비활성)':''}</option>)}</select><small className="field-help">관리자 설정에 등록된 부서만 표시됩니다.</small></label><label>직위<select required value={selected.position||''} onChange={e=>setSelected({...selected,position:e.target.value})}><option value="">직위를 선택하세요</option>{positions.filter(p=>p.is_active||p.name===selected.position).map(p=><option key={p.id} value={p.name}>{p.name}{!p.is_active?' (비활성)':''}</option>)}</select></label><label>재직 상태<select value={selected.employment_status} onChange={e=>setSelected({...selected,employment_status:e.target.value})}><option>재직</option><option>휴직</option><option>퇴직</option></select></label><label>입사일<input type="date" value={selected.joined_date||''} onChange={e=>setSelected({...selected,joined_date:e.target.value})}/></label>{isAdmin&&<label>담당 팀장<select required value={selected.manager_id||''} onChange={e=>setSelected({...selected,manager_id:e.target.value})}><option value="">선택</option>{accounts.filter(a=>a.account_status==='active'&&['manager','admin'].includes(a.role)&&(a.department===selected.department||a.role==='admin')).map(a=><option key={a.id} value={a.id}>{a.name||a.email} · {a.department||roleLabel[a.role]}</option>)}</select><small className="field-help">선택한 부서의 활성 팀장만 표시됩니다.</small></label>}<label className="span2">메모<textarea value={selected.memo||''} onChange={e=>setSelected({...selected,memo:e.target.value})}/></label><FormActions onCancel={()=>setSelected(null)}/></form></Modal>}
    {accountEdit&&<Modal title="팀장 계정 승인·권한" onClose={()=>setAccountEdit(null)}><form className="form-grid" onSubmit={saveAccount}><label>이름<input value={accountEdit.name||''} onChange={e=>setAccountEdit({...accountEdit,name:e.target.value})}/></label><label>이메일<input disabled value={accountEdit.email||''}/></label><label>부서<input value={accountEdit.department||''} onChange={e=>setAccountEdit({...accountEdit,department:e.target.value})}/></label><label>직위<input value={accountEdit.position||''} onChange={e=>setAccountEdit({...accountEdit,position:e.target.value})}/></label><label>권한<select value={accountEdit.role} onChange={e=>setAccountEdit({...accountEdit,role:e.target.value})}><option value="manager">팀장</option><option value="admin">관리자</option></select></label><label>계정 상태<select value={accountEdit.account_status} onChange={e=>setAccountEdit({...accountEdit,account_status:e.target.value})}><option value="pending">승인대기</option><option value="active">활성</option><option value="inactive">중지</option></select></label><FormActions onCancel={()=>setAccountEdit(null)}/></form></Modal>}
  </>
}


function AdminPage({profile}){
  const [tab,setTab]=useState('alerts'),[settings,setSettings]=useState(DEFAULT_SETTINGS),[accounts,setAccounts]=useState([]),[employees,setEmployees]=useState([]),[departments,setDepartments]=useState([]),[positions,setPositions]=useState([]),[busy,setBusy]=useState(false),[notice,setNotice]=useState(''),[accountEdit,setAccountEdit]=useState(null),[newDepartment,setNewDepartment]=useState(''),[newPosition,setNewPosition]=useState('')
  useEffect(()=>{load()},[])
  async function load(){
    const [s,a,e,d,p]=await Promise.all([
      supabase.from('app_settings').select('*').eq('id','global').maybeSingle(),
      supabase.from('profiles').select('*').order('created_at',{ascending:false}),
      supabase.from('employees').select('*').order('name'),
      supabase.from('org_departments').select('*').order('sort_order').order('name'),
      supabase.from('org_positions').select('*').order('sort_order').order('name')
    ])
    if(s.data)setSettings({...DEFAULT_SETTINGS,...s.data});setAccounts(a.data||[]);setEmployees(e.data||[]);setDepartments(d.data||[]);setPositions(p.data||[])
  }
  async function saveSettings(){setBusy(true);setNotice('');const payload={...settings,id:'global',updated_at:new Date().toISOString()};const r=await supabase.from('app_settings').upsert(payload);setNotice(r.error?r.error.message:'운영 설정을 저장했습니다. 대시보드에 바로 반영됩니다.');setBusy(false)}
  async function saveAccount(e){e.preventDefault();const {id,...payload}=accountEdit;const r=await supabase.from('profiles').update(payload).eq('id',id);if(r.error)alert(r.error.message);else{setAccountEdit(null);setNotice('계정 정보를 저장했습니다.');load()}}
  async function approveAccount(account){
    const r=await supabase.from('profiles').update({account_status:'active',role:account.role==='admin'?'admin':'manager'}).eq('id',account.id)
    if(r.error)alert(r.error.message);else{setNotice(`${account.name||account.email}님의 가입 요청을 승인했습니다.`);load()}
  }
  async function rejectAccount(account){
    if(!confirm(`${account.name||account.email}님의 가입 요청을 반려할까요? 계정은 중지 상태로 보관됩니다.`))return
    const r=await supabase.from('profiles').update({account_status:'inactive'}).eq('id',account.id)
    if(r.error)alert(r.error.message);else{setNotice(`${account.name||account.email}님의 가입 요청을 반려했습니다.`);load()}
  }
  async function deleteAccount(account){
    if(account.id===profile?.id){alert('현재 로그인한 관리자 본인 계정은 삭제할 수 없습니다.');return}
    const label=account.name||account.email
    if(!confirm(`${label}님의 계정을 완전히 삭제할까요?

삭제 후에는 로그인할 수 없으며 복구할 수 없습니다. 담당 직원은 미배정 상태로 변경됩니다.`))return
    setBusy(true);setNotice('')
    const {error}=await supabase.rpc('admin_delete_user',{target_user_id:account.id})
    setBusy(false)
    if(error){alert(`계정 삭제에 실패했습니다.
${error.message}

V4.9 Supabase SQL을 먼저 실행했는지 확인하세요.`);return}
    if(accountEdit?.id===account.id)setAccountEdit(null)
    setNotice(`${label}님의 팀장 계정을 삭제했습니다.`)
    load()
  }
  async function assignManager(employeeId,managerId){const r=await supabase.from('employees').update({manager_id:managerId}).eq('id',employeeId);if(r.error)alert(r.error.message);else{setNotice('담당 팀장을 변경했습니다.');load()}}
  async function addDepartment(e){e.preventDefault();const name=newDepartment.trim();if(!name)return;const r=await supabase.from('org_departments').insert({name,sort_order:departments.length+1});if(r.error)alert(r.error.message);else{setNewDepartment('');load()}}
  async function toggleDepartment(row){const next=!row.is_active;if(!next){const count=employees.filter(e=>e.department===row.name).length;if(count&&!confirm(`${row.name} 부서를 사용하는 직원이 ${count}명 있습니다. 기존 기록은 유지되며 신규 선택 목록에서만 숨겨집니다. 계속할까요?`))return}const r=await supabase.from('org_departments').update({is_active:next}).eq('id',row.id);if(r.error)alert(r.error.message);else{setNotice(`${row.name} 부서를 ${next?'활성화':'비활성화'}했습니다.`);load()}}
  async function addPosition(e){e.preventDefault();const name=newPosition.trim();if(!name)return;const r=await supabase.from('org_positions').insert({name,sort_order:positions.length+1});if(r.error)alert(r.error.message);else{setNewPosition('');load()}}
  async function togglePosition(row){const next=!row.is_active;if(!next){const count=employees.filter(e=>e.position===row.name).length;if(count&&!confirm(`${row.name} 직위를 사용하는 직원이 ${count}명 있습니다. 기존 기록은 유지되며 신규 선택 목록에서만 숨겨집니다. 계속할까요?`))return}const r=await supabase.from('org_positions').update({is_active:next}).eq('id',row.id);if(r.error)alert(r.error.message);else{setNotice(`${row.name} 직위를 ${next?'활성화':'비활성화'}했습니다.`);load()}}
  const managerName=id=>accounts.find(x=>x.id===id)?.name||''
  const employeeName=id=>employees.find(x=>x.id===id)?.name||''
  async function exportEmployees(){downloadCsv('직원목록.csv',employees.map(e=>({직원명:e.name||'',부서:e.department||'',직위:e.position||'',재직상태:e.employment_status||'',입사일:e.joined_date||'',담당팀장명:managerName(e.manager_id),메모:e.memo||''})))}
  async function exportGoals(){const {data,error}=await supabase.from('goals').select('*').order('created_at');if(error){alert(error.message);return}downloadCsv('성과목표.csv',(data||[]).map(g=>{const emp=employees.find(e=>e.id===g.owner_id);return {목표명:g.title||'',직원명:emp?.name||'',팀장명:managerName(emp?.manager_id),부서:emp?.department||'',기간:g.period||'',분류:g.category||'',상태:g.status||'',진행률:g.progress||0,마감일:g.due_date||'',목표값:g.target_value||'',현재값:g.current_value||'',성과근거:g.evidence||'',관리자피드백:g.manager_feedback||''}}))}
  async function exportAllInterviews(){const {data,error}=await supabase.from('interviews').select('*').order('interview_date');if(error){alert(error.message);return}downloadCsv('면담기록.csv',(data||[]).map(r=>{const emp=employees.find(e=>e.id===r.employee_id);return {직원명:emp?.name||'',팀장명:managerName(r.manager_id||emp?.manager_id),부서:emp?.department||'',면담일:r.interview_date||'',면담유형:r.interview_type||'',상태:r.mood||'',핵심요약:r.summary||'',강점:r.strengths||'',우려사항:r.concerns||'',실행항목:r.action_items||'',직원약속:r.employee_commitment||'',팀장지원:r.manager_support||'',다음면담일:r.next_date||'',공개범위:r.visibility||''}}))}
  function exportAccounts(){downloadCsv('팀장계정.csv',accounts.map(a=>({이름:a.name||'',이메일:a.email||'',부서:a.department||'',직위:a.position||'',권한:roleLabel[a.role]||a.role||'',계정상태:a.account_status==='active'?'활성':a.account_status==='pending'?'승인대기':'중지',가입일:a.created_at?new Date(a.created_at).toLocaleString('ko-KR'):''})))}
  const managers=accounts.filter(a=>a.account_status==='active'&&['manager','admin'].includes(a.role))
  const pending=accounts.filter(a=>a.account_status==='pending').length
  return <>
    <div className="admin-hero"><div><span className="eyebrow">SYSTEM ADMINISTRATION</span><h2>관리자 설정</h2><p>코드를 수정하지 않고 알림, 계정, 직원 배정과 기초정보를 관리합니다.</p></div><div className="admin-summary"><span>승인 대기</span><strong>{pending}</strong></div></div>
    <div className="admin-tabs">
      <button className={tab==='alerts'?'active':''} onClick={()=>setTab('alerts')}><SlidersHorizontal size={17}/> 운영 설정</button>
      <button className={tab==='accounts'?'active':''} onClick={()=>setTab('accounts')}><ShieldCheck size={17}/> 계정·승인</button>
      <button className={tab==='assignment'?'active':''} onClick={()=>setTab('assignment')}><Users size={17}/> 직원 배정</button>
      <button className={tab==='master'?'active':''} onClick={()=>setTab('master')}><ListPlus size={17}/> 기초정보</button>
      <button className={tab==='data'?'active':''} onClick={()=>setTab('data')}><Database size={17}/> 데이터</button>
    </div>
    {notice&&<div className="notice admin-notice">{notice}</div>}
    {tab==='alerts'&&<div className="admin-grid">
      <Panel title="자동 점검 알림"><div className="setting-list">
        <SettingSwitch label="목표 미등록 알림" description="목표를 사용하지 않는 경우 끄면 대시보드에 표시되지 않습니다." value={settings.alert_missing_goal} onChange={v=>setSettings({...settings,alert_missing_goal:v})}/>
        <SettingSwitch label="목표 기한 경과 알림" description="마감일을 넘긴 미완료 목표를 표시합니다." value={settings.alert_goal_overdue} onChange={v=>setSettings({...settings,alert_goal_overdue:v})}/>
        <SettingSwitch label="목표 마감 임박 알림" description="설정한 기준일 이내에 마감되는 목표를 표시합니다." value={settings.alert_goal_due_soon} onChange={v=>setSettings({...settings,alert_goal_due_soon:v})}/>
        <SettingSwitch label="목표 장기 미갱신 알림" description="진행 중 목표가 일정 기간 갱신되지 않으면 표시합니다." value={settings.alert_goal_stale} onChange={v=>setSettings({...settings,alert_goal_stale:v})}/>
        <SettingSwitch label="장기 미면담 알림" description="직원별 최근 면담이 기준일을 넘으면 표시합니다." value={settings.alert_no_interview} onChange={v=>setSettings({...settings,alert_no_interview:v})}/>
        <SettingSwitch label="팀장 승인 대기 알림" description="신규 팀장 계정의 승인 요청을 표시합니다." value={settings.alert_pending_manager} onChange={v=>setSettings({...settings,alert_pending_manager:v})}/>
      </div></Panel>
      <Panel title="알림 기준"><div className="threshold-grid"><label>마감 임박 기준<input type="number" min="1" max="90" value={settings.goal_due_days} onChange={e=>setSettings({...settings,goal_due_days:Number(e.target.value)})}/><small>일 전</small></label><label>목표 미갱신 기준<input type="number" min="1" max="365" value={settings.goal_stale_days} onChange={e=>setSettings({...settings,goal_stale_days:Number(e.target.value)})}/><small>일</small></label><label>장기 미면담 기준<input type="number" min="1" max="365" value={settings.interview_overdue_days} onChange={e=>setSettings({...settings,interview_overdue_days:Number(e.target.value)})}/><small>일</small></label></div><button className="primary wide" onClick={saveSettings} disabled={busy}>{busy?<Loader2 className="spin" size={17}/>:<Save size={17}/>} 설정 저장</button></Panel>
    </div>}
    {tab==='accounts'&&<>
      <Panel title={`신규 가입 요청 ${pending}건`} action={<span className="panel-caption">승인 전에는 로그인할 수 없습니다.</span>}>
        <div className="approval-request-list">
          {accounts.filter(a=>a.account_status==='pending').length?accounts.filter(a=>a.account_status==='pending').map(a=><div className="approval-request-card" key={a.id}>
            <div className="approval-request-avatar">{(a.name||a.email||'?')[0]}</div>
            <div className="grow"><strong>{a.name||'이름 미입력'}</strong><span>{a.email}</span><small>{a.department||'부서 미지정'} · {a.position||'직위 미지정'} · {a.created_at?new Date(a.created_at).toLocaleString('ko-KR'):'가입일 미확인'}</small></div>
            <div className="approval-request-actions"><button className="secondary" onClick={()=>setAccountEdit({...a})}><Pencil size={15}/> 상세</button><button className="secondary danger-text" onClick={()=>rejectAccount(a)}><UserX size={15}/> 반려</button><button className="icon-btn danger-text" onClick={()=>deleteAccount(a)} title="가입 요청 계정 삭제" disabled={busy}><Trash2 size={16}/></button><button className="primary" onClick={()=>approveAccount(a)}><UserCheck size={15}/> 승인</button></div>
          </div>):<div className="empty compact success-empty"><CheckCircle2/> 대기 중인 가입 요청이 없습니다.</div>}
        </div>
      </Panel>
      <Panel title="전체 팀장 계정"><div className="table-wrap"><table><thead><tr><th>이름</th><th>이메일</th><th>부서</th><th>권한</th><th>상태</th><th/></tr></thead><tbody>{accounts.map(a=><tr key={a.id}><td><strong>{a.name||'-'}</strong></td><td>{a.email}</td><td>{a.department||'-'}</td><td>{roleLabel[a.role]}</td><td><Badge status={a.account_status==='active'?'활성':a.account_status==='pending'?'승인대기':'중지'}/></td><td><div className="account-row-actions"><button className="icon-btn" onClick={()=>setAccountEdit({...a})} title="계정 수정"><Pencil size={16}/></button><button className="icon-btn danger-text" onClick={()=>deleteAccount(a)} title="계정 삭제" disabled={busy||a.id===profile?.id}><Trash2 size={16}/></button></div></td></tr>)}</tbody></table></div></Panel>
    </>}
    {tab==='assignment'&&<Panel title="직원 담당 팀장 배정"><div className="table-wrap"><table><thead><tr><th>직원</th><th>부서</th><th>재직상태</th><th>담당 팀장</th></tr></thead><tbody>{employees.map(e=><tr key={e.id}><td><strong>{e.name}</strong></td><td>{e.department||'-'}</td><td><Badge status={e.employment_status}/></td><td><select value={e.manager_id||''} onChange={x=>assignManager(e.id,x.target.value)}><option value="">미배정</option>{managers.map(m=><option key={m.id} value={m.id}>{m.name||m.email} · {m.department||'부서 미지정'}</option>)}</select></td></tr>)}</tbody></table></div></Panel>}
    {tab==='master'&&<div className="admin-grid master-data-grid"><Panel title="부서 목록"><form className="inline-add" onSubmit={addDepartment}><input value={newDepartment} onChange={e=>setNewDepartment(e.target.value)} placeholder="새 부서명"/><button className="primary"><Plus size={16}/> 추가</button></form><div className="master-list">{departments.map(d=><div key={d.id} className={!d.is_active?'master-inactive':''}><span><strong>{d.name}</strong><small>{d.is_active?'가입·직원등록 화면에 표시':'신규 선택 목록에서 숨김'}</small></span><button className={d.is_active?'secondary compact-button':'primary compact-button'} onClick={()=>toggleDepartment(d)}>{d.is_active?'비활성화':'활성화'}</button></div>)}{!departments.length&&<div className="empty compact">등록된 부서가 없습니다.</div>}</div></Panel><Panel title="직위 목록"><form className="inline-add" onSubmit={addPosition}><input value={newPosition} onChange={e=>setNewPosition(e.target.value)} placeholder="새 직위명"/><button className="primary"><Plus size={16}/> 추가</button></form><div className="master-list">{positions.map(p=><div key={p.id} className={!p.is_active?'master-inactive':''}><span><strong>{p.name}</strong><small>{p.is_active?'직원등록 화면에 표시':'신규 선택 목록에서 숨김'}</small></span><button className={p.is_active?'secondary compact-button':'primary compact-button'} onClick={()=>togglePosition(p)}>{p.is_active?'비활성화':'활성화'}</button></div>)}{!positions.length&&<div className="empty compact">등록된 직위가 없습니다.</div>}</div></Panel><Panel title="운영 안내"><div className="guide-box"><strong>기초정보 사용 방법</strong><p>활성 부서와 직위만 가입·직원등록 화면의 선택 목록에 표시됩니다.</p><p>기존 기록 보호를 위해 기초정보는 삭제하지 않고 비활성화합니다. 기존 직원의 부서와 직위 값은 그대로 유지됩니다.</p><p>직원 등록 시 부서를 먼저 선택하면 같은 부서의 활성 팀장만 담당 팀장 목록에 표시됩니다.</p></div></Panel></div>}
    {tab==='data'&&<div className="admin-grid"><Panel title="데이터 다운로드"><div className="export-list"><button onClick={exportEmployees}><Users size={19}/><div><strong>직원 목록</strong><small>{employees.length}명 · ID 대신 직원명과 담당 팀장명으로 출력</small></div><Download size={17}/></button><button onClick={exportGoals}><Target size={19}/><div><strong>성과 목표</strong><small>직원명·팀장명·부서를 포함한 전체 목표</small></div><Download size={17}/></button><button onClick={exportAllInterviews}><MessageSquareText size={19}/><div><strong>면담 기록</strong><small>직원명·팀장명과 전체 면담 내용을 출력</small></div><Download size={17}/></button><button onClick={exportAccounts}><ShieldCheck size={19}/><div><strong>팀장 계정</strong><small>내부 ID 없이 이름과 승인 상태로 출력</small></div><Download size={17}/></button></div></Panel><Panel title="데이터 보호"><div className="guide-box"><strong>안전한 운영 원칙</strong><p>다운로드한 파일에는 인사정보와 면담 내용이 포함될 수 있습니다. 업무용 저장소에서만 보관하고 불필요한 사본은 삭제하세요.</p><p>팀장은 면담관리 화면에서 본인 담당 팀원의 기록만 다운로드할 수 있습니다.</p></div></Panel></div>}
    {accountEdit&&<Modal title="팀장 계정 승인·권한" onClose={()=>setAccountEdit(null)}><form className="form-grid" onSubmit={saveAccount}><label>이름<input value={accountEdit.name||''} onChange={e=>setAccountEdit({...accountEdit,name:e.target.value})}/></label><label>이메일<input disabled value={accountEdit.email||''}/></label><label>부서<select required value={accountEdit.department||''} onChange={e=>setAccountEdit({...accountEdit,department:e.target.value})}><option value="">부서 선택</option>{departments.filter(d=>d.is_active||d.name===accountEdit.department).map(d=><option key={d.id} value={d.name}>{d.name}{!d.is_active?' (비활성)':''}</option>)}</select></label><label>직위<select value={accountEdit.position||''} onChange={e=>setAccountEdit({...accountEdit,position:e.target.value})}><option value="">직위 선택</option>{positions.filter(p=>p.is_active||p.name===accountEdit.position).map(p=><option key={p.id} value={p.name}>{p.name}{!p.is_active?' (비활성)':''}</option>)}</select></label><label>권한<select value={accountEdit.role} onChange={e=>setAccountEdit({...accountEdit,role:e.target.value})}><option value="manager">팀장</option><option value="admin">관리자</option></select></label><label>계정 상태<select value={accountEdit.account_status} onChange={e=>setAccountEdit({...accountEdit,account_status:e.target.value})}><option value="pending">승인대기</option><option value="active">활성</option><option value="inactive">중지</option></select></label><div className="form-actions span2 account-modal-actions"><button type="button" className="secondary danger-text" onClick={()=>deleteAccount(accountEdit)} disabled={busy||accountEdit.id===profile?.id}><Trash2 size={17}/> 계정 삭제</button><span className="form-action-spacer"/><button type="button" className="secondary" onClick={()=>setAccountEdit(null)}>취소</button><button className="primary"><Save size={17}/> 저장</button></div></form></Modal>}
  </>
}
function SettingSwitch({label,description,value,onChange}){return <div className="setting-row"><div><strong>{label}</strong><small>{description}</small></div><button type="button" className={`switch ${value?'on':''}`} onClick={()=>onChange(!value)} aria-pressed={value}><i/></button></div>}

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
