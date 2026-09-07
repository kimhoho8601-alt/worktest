import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  CalendarDays, ChevronLeft, ChevronRight, Plus, Clock3, CheckCircle2,
  Pencil, Trash2, MessageSquareText, X, Sparkles
} from 'lucide-react'
import { supabase, isSupabaseConfigured } from './lib/supabase'
import './interview-calendar.css'

const SCHEDULE_BLANK = {
  employee_id:'', scheduled_date:'', scheduled_time:'10:00', interview_type:'정기 1:1', topic:'', status:'예정'
}

function isoDate(date){
  const y=date.getFullYear(),m=String(date.getMonth()+1).padStart(2,'0'),d=String(date.getDate()).padStart(2,'0')
  return `${y}-${m}-${d}`
}
function monthLabel(date){return date.toLocaleDateString('ko-KR',{year:'numeric',month:'long'})}
function sameMonth(date,base){return date.getFullYear()===base.getFullYear()&&date.getMonth()===base.getMonth()}
function daysForCalendar(base){
  const first=new Date(base.getFullYear(),base.getMonth(),1)
  const start=new Date(first); start.setDate(1-first.getDay())
  return Array.from({length:42},(_,i)=>{const d=new Date(start);d.setDate(start.getDate()+i);return d})
}
function toneFor(status,kind){
  if(kind==='record') return 'record'
  if(kind==='suggestion') return 'suggestion'
  if(status==='완료') return 'done'
  if(status==='취소') return 'cancelled'
  if(status==='미실시') return 'missed'
  return 'scheduled'
}
function scopedEmployees(profile,rows){
  if(!profile)return []
  if(profile.role==='admin')return rows
  if(profile.role==='facility_manager')return rows.filter(r=>String(r.facility_id||'')===String(profile.facility_id||''))
  return rows.filter(r=>r.manager_id===profile.id)
}
function scopedByEmployees(profile,rows,employees){
  if(profile?.role==='admin')return rows
  const ids=new Set(employees.map(x=>x.id))
  return rows.filter(r=>ids.has(r.employee_id)&&(profile?.role!=='manager'||r.manager_id===profile.id))
}

function InterviewCalendarBridge(){
  const [profile,setProfile]=useState(null)
  const [people,setPeople]=useState([])
  const [interviews,setInterviews]=useState([])
  const [schedules,setSchedules]=useState([])
  const [month,setMonth]=useState(()=>new Date(new Date().getFullYear(),new Date().getMonth(),1))
  const [selectedDate,setSelectedDate]=useState(()=>isoDate(new Date()))
  const [employeeFilter,setEmployeeFilter]=useState('전체')
  const [modal,setModal]=useState(false)
  const [editId,setEditId]=useState(null)
  const [suggestionSourceId,setSuggestionSourceId]=useState(null)
  const [form,setForm]=useState(SCHEDULE_BLANK)
  const [busy,setBusy]=useState(false)
  const [notice,setNotice]=useState('')
  const [pendingLink,setPendingLink]=useState(null)

  useEffect(()=>{loadAll()},[])
  useEffect(()=>{
    const select=document.querySelector('.topbar-actions select')
    if(!select)return
    const handler=()=>setTimeout(loadAll,60)
    select.addEventListener('change',handler)
    return()=>select.removeEventListener('change',handler)
  },[])
  useEffect(()=>{
    if(!pendingLink)return
    let attempts=0
    const timer=setInterval(async()=>{
      attempts+=1
      const {data}=await supabase.from('interviews').select('id,employee_id,interview_date,created_at').eq('employee_id',pendingLink.employee_id).eq('interview_date',pendingLink.scheduled_date).order('created_at',{ascending:false}).limit(1)
      const match=data?.[0]
      if(match&&new Date(match.created_at).getTime()>=pendingLink.startedAt-5000){
        await supabase.from('interview_schedules').update({status:'완료',linked_interview_id:match.id}).eq('id',pendingLink.id)
        clearInterval(timer);setPendingLink(null);setNotice('면담 기록이 저장되어 일정을 완료 처리했습니다.');loadAll()
      }else if(attempts>=60){clearInterval(timer);setPendingLink(null)}
    },2000)
    return()=>clearInterval(timer)
  },[pendingLink])

  async function resolveEffectiveProfile(){
    const {data:{session}}=await supabase.auth.getSession()
    if(!session)return null
    const {data:me}=await supabase.from('profiles').select('*').eq('id',session.user.id).single()
    if(!me)return null
    const previewSelect=document.querySelector('.topbar-actions select')
    if(me.role==='admin'&&previewSelect?.value){
      const {data:preview}=await supabase.from('profiles').select('*').eq('id',previewSelect.value).single()
      return preview||me
    }
    return me
  }
  async function loadAll(){
    if(!isSupabaseConfigured)return
    const effective=await resolveEffectiveProfile(); if(!effective)return
    const [p,i,s]=await Promise.all([
      supabase.from('employees').select('*').neq('employment_status','퇴직').order('name'),
      supabase.from('interviews').select('*').order('interview_date',{ascending:false}),
      supabase.from('interview_schedules').select('*').order('scheduled_date',{ascending:true}).order('scheduled_time',{ascending:true})
    ])
    const scopedPeople=scopedEmployees(effective,p.data||[])
    setProfile(effective);setPeople(scopedPeople)
    setInterviews(scopedByEmployees(effective,i.data||[],scopedPeople))
    setSchedules(scopedByEmployees(effective,s.data||[],scopedPeople))
  }

  const filteredPeople=useMemo(()=>employeeFilter==='전체'?people:people.filter(x=>x.id===employeeFilter),[people,employeeFilter])
  const employeeIds=useMemo(()=>new Set(filteredPeople.map(x=>x.id)),[filteredPeople])
  const filteredSchedules=useMemo(()=>schedules.filter(x=>employeeIds.has(x.employee_id)),[schedules,employeeIds])
  const filteredInterviews=useMemo(()=>interviews.filter(x=>employeeIds.has(x.employee_id)),[interviews,employeeIds])
  const suggestions=useMemo(()=>{
    const existing=new Set(filteredSchedules.map(s=>`${s.employee_id}|${s.scheduled_date}`))
    const seen=new Set()
    return filteredInterviews.filter(r=>r.next_date).map(r=>({
      id:`suggestion-${r.id}`,employee_id:r.employee_id,scheduled_date:r.next_date,scheduled_time:'',interview_type:'정기 1:1',topic:'이전 면담에서 정한 다음 1:1',status:'제안',kind:'suggestion',source:r
    })).filter(x=>{const key=`${x.employee_id}|${x.scheduled_date}`;if(existing.has(key)||seen.has(key))return false;seen.add(key);return true})
  },[filteredInterviews,filteredSchedules])
  const events=useMemo(()=>[
    ...filteredSchedules.map(x=>({...x,kind:'schedule'})),
    ...filteredInterviews.map(x=>({...x,scheduled_date:x.interview_date,scheduled_time:'',status:'기록',kind:'record'})),
    ...suggestions
  ],[filteredSchedules,filteredInterviews,suggestions])
  const monthScheduled=filteredSchedules.filter(s=>sameMonth(new Date(`${s.scheduled_date}T00:00:00`),month)&&s.status==='예정').length
  const monthCompleted=filteredSchedules.filter(s=>sameMonth(new Date(`${s.scheduled_date}T00:00:00`),month)&&s.status==='완료').length
  const monthRecords=filteredInterviews.filter(r=>sameMonth(new Date(`${r.interview_date}T00:00:00`),month)).length
  const selectedEvents=events.filter(e=>e.scheduled_date===selectedDate).sort((a,b)=>(a.scheduled_time||'99:99').localeCompare(b.scheduled_time||'99:99'))
  const calendarDays=daysForCalendar(month)

  function employeeName(id){return people.find(x=>x.id===id)?.name||'직원'}
  function openNew(date=selectedDate,employeeId=''){
    setEditId(null);setSuggestionSourceId(null);setForm({...SCHEDULE_BLANK,scheduled_date:date||isoDate(new Date()),employee_id:employeeId});setModal(true)
  }
  function openEdit(row){
    setSuggestionSourceId(null);setEditId(row.id);setForm({employee_id:row.employee_id,scheduled_date:row.scheduled_date,scheduled_time:(row.scheduled_time||'').slice(0,5),interview_type:row.interview_type||'정기 1:1',topic:row.topic||'',status:row.status||'예정'});setModal(true)
  }
  function openSuggestionEdit(item){
    setEditId(null);setSuggestionSourceId(item.source?.id||null);setForm({employee_id:item.employee_id,scheduled_date:item.scheduled_date,scheduled_time:item.scheduled_time||'10:00',interview_type:item.interview_type||'정기 1:1',topic:item.topic||'',status:'예정'});setModal(true)
  }
  async function saveSchedule(e){
    e.preventDefault();if(!profile)return;setBusy(true)
    const payload={...form,manager_id:profile.id,scheduled_time:form.scheduled_time||null}
    const r=editId?await supabase.from('interview_schedules').update(payload).eq('id',editId):await supabase.from('interview_schedules').insert(payload)
    if(r.error){setBusy(false);alert(r.error.message);return}
    if(suggestionSourceId){
      const sourceUpdate=await supabase.from('interviews').update({next_date:form.scheduled_date}).eq('id',suggestionSourceId)
      if(sourceUpdate.error){setBusy(false);alert(sourceUpdate.error.message);return}
      setNotice('제안 일정을 수정해 확정했습니다.')
    }
    setBusy(false);setModal(false);setEditId(null);setSuggestionSourceId(null);setSelectedDate(form.scheduled_date);setMonth(new Date(`${form.scheduled_date}T00:00:00`));loadAll()
  }
  async function removeSchedule(id){if(!confirm('이 면담 일정을 삭제할까요?'))return;const r=await supabase.from('interview_schedules').delete().eq('id',id);if(r.error)alert(r.error.message);else loadAll()}
  async function setStatus(row,status){const r=await supabase.from('interview_schedules').update({status}).eq('id',row.id);if(r.error)alert(r.error.message);else loadAll()}
  async function confirmSuggestion(item){
    const payload={employee_id:item.employee_id,manager_id:profile.id,scheduled_date:item.scheduled_date,scheduled_time:null,interview_type:item.interview_type,topic:item.topic,status:'예정'}
    const r=await supabase.from('interview_schedules').insert(payload)
    if(r.error)alert(r.error.message);else{setNotice('다음 1:1 제안을 일정으로 등록했습니다.');loadAll()}
  }
  function openRecord(row){
    const trigger=[...document.querySelectorAll('.toolbar-actions button')].find(b=>b.textContent.includes('1on1 코칭'))
    if(!trigger){setNotice('상단의 1on1 코칭 버튼에서 기록을 작성해 주세요.');return}
    trigger.click();setPendingLink({...row,startedAt:Date.now()});setNotice('면담 기록 화면을 열었습니다. 저장하면 일정이 자동으로 완료 처리됩니다.')
    setTimeout(()=>prefillExistingForm(row),80)
  }
  function prefillExistingForm(row){
    const modalEl=document.querySelector('.modal');if(!modalEl)return
    const labels=[...modalEl.querySelectorAll('label')]
    const findInput=(prefix)=>labels.find(l=>l.textContent.trim().startsWith(prefix))?.querySelector('input,select')
    setNativeValue(findInput('직원'),row.employee_id)
    setNativeValue(findInput('면담일'),row.scheduled_date)
    setNativeValue(findInput('유형'),row.interview_type||'정기 1:1')
  }
  function setNativeValue(el,value){
    if(!el)return
    const proto=el.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype
    const setter=Object.getOwnPropertyDescriptor(proto,'value')?.set
    setter?.call(el,value);el.dispatchEvent(new Event('change',{bubbles:true}));el.dispatchEvent(new Event('input',{bubbles:true}))
  }

  if(!profile)return <div className="ic-loading">면담 캘린더를 불러오는 중...</div>
  return <section className="ic-wrap">
    <div className="ic-toolbar">
      <div className="ic-summary">
        <span><CalendarDays size={15}/> 이번 달 예정 <b>{monthScheduled}</b></span>
        <span><CheckCircle2 size={15}/> 완료 <b>{monthCompleted}</b></span>
        <span><MessageSquareText size={15}/> 기록 <b>{monthRecords}</b></span>
      </div>
      <div className="ic-toolbar-actions">
        <select value={employeeFilter} onChange={e=>setEmployeeFilter(e.target.value)}><option value="전체">전체 팀원</option>{people.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
        <button className="ic-primary" onClick={()=>openNew()}><Plus size={16}/> 면담 일정</button>
      </div>
    </div>
    {notice&&<div className="ic-notice"><Sparkles size={15}/><span>{notice}</span><button onClick={()=>setNotice('')}><X size={14}/></button></div>}
    <div className="ic-layout">
      <div className="ic-panel ic-calendar-panel">
        <div className="ic-panel-head">
          <div><h3>{monthLabel(month)} 면담 캘린더</h3><p>예정 일정과 완료된 면담 기록을 함께 확인합니다.</p></div>
          <div className="ic-month-nav"><button onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()-1,1))}><ChevronLeft size={17}/></button><button className="today" onClick={()=>{const n=new Date();setMonth(new Date(n.getFullYear(),n.getMonth(),1));setSelectedDate(isoDate(n))}}>오늘</button><button onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()+1,1))}><ChevronRight size={17}/></button></div>
        </div>
        <div className="ic-weekdays">{['일','월','화','수','목','금','토'].map(d=><span key={d}>{d}</span>)}</div>
        <div className="ic-calendar-grid">{calendarDays.map(day=>{
          const key=isoDate(day),dayEvents=events.filter(e=>e.scheduled_date===key),outside=!sameMonth(day,month),today=key===isoDate(new Date()),selected=key===selectedDate
          return <button key={key} className={`ic-day ${outside?'outside':''} ${today?'is-today':''} ${selected?'selected':''}`} onClick={()=>setSelectedDate(key)} onDoubleClick={()=>openNew(key)}>
            <span className="ic-day-number">{day.getDate()}</span>
            <div className="ic-day-events">{dayEvents.slice(0,3).map(ev=><span key={ev.id} className={`ic-event ${toneFor(ev.status,ev.kind)}`}><i/>{ev.scheduled_time?`${ev.scheduled_time.slice(0,5)} `:''}{employeeName(ev.employee_id)}</span>)}{dayEvents.length>3&&<span className="ic-more">+{dayEvents.length-3}건</span>}</div>
          </button>
        })}</div>
        <div className="ic-legend"><span><i className="scheduled"/>예정</span><span><i className="done"/>완료</span><span><i className="record"/>면담 기록</span><span><i className="suggestion"/>다음 1:1 제안</span></div>
      </div>
      <div className="ic-panel ic-agenda-panel">
        <div className="ic-panel-head"><div><h3>{new Date(`${selectedDate}T00:00:00`).toLocaleDateString('ko-KR',{month:'long',day:'numeric',weekday:'short'})}</h3><p>선택한 날짜의 일정과 기록</p></div><button className="ic-icon-add" onClick={()=>openNew(selectedDate)} title="일정 추가"><Plus size={17}/></button></div>
        <div className="ic-agenda-list">{selectedEvents.length?selectedEvents.map(item=>{
          const tone=toneFor(item.status,item.kind)
          return <article key={`${item.kind}-${item.id}`} className={`ic-agenda-card ${tone}`}>
            <div className="ic-agenda-top"><div><span className="ic-person">{employeeName(item.employee_id)}</span><small>{item.interview_type||'면담'}</small></div><span className={`ic-status ${tone}`}>{item.kind==='record'?'기록':item.kind==='suggestion'?'제안':item.status}</span></div>
            {item.scheduled_time&&<div className="ic-time"><Clock3 size={14}/>{item.scheduled_time.slice(0,5)}</div>}
            <p>{item.kind==='record'?(item.summary||'면담 기록'):item.topic||'면담 주제가 아직 입력되지 않았습니다.'}</p>
            <div className="ic-agenda-actions">
              {item.kind==='suggestion'?<><button className="ic-soft" onClick={()=>confirmSuggestion(item)}>일정으로 확정</button><button className="ic-icon" onClick={()=>openSuggestionEdit(item)} title="제안 일정 수정"><Pencil size={14}/></button></>:item.kind==='record'?null:<>
                {item.status!=='완료'&&<button className="ic-record" onClick={()=>openRecord(item)}><MessageSquareText size={14}/> 기록 작성</button>}
                {item.status==='예정'&&<button className="ic-soft" onClick={()=>setStatus(item,'미실시')}>미실시</button>}
                <button className="ic-icon" onClick={()=>openEdit(item)} title="수정"><Pencil size={14}/></button><button className="ic-icon danger" onClick={()=>removeSchedule(item.id)} title="삭제"><Trash2 size={14}/></button>
              </>}
            </div>
          </article>
        }):<div className="ic-empty"><CalendarDays size={26}/><strong>등록된 일정이 없습니다.</strong><span>날짜를 더블클릭하거나 ‘면담 일정’을 눌러 추가하세요.</span></div>}</div>
      </div>
    </div>
    {modal&&<div className="ic-modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setModal(false)}}><div className="ic-modal"><div className="ic-modal-head"><div><span>SCK 1:1 SCHEDULE</span><h3>{editId?'면담 일정 수정':suggestionSourceId?'제안 일정 수정 · 확정':'면담 일정 등록'}</h3></div><button onClick={()=>setModal(false)}><X size={20}/></button></div><form onSubmit={saveSchedule} className="ic-form">
      <label>팀원<select required value={form.employee_id} onChange={e=>setForm({...form,employee_id:e.target.value})}><option value="">선택</option>{people.map(p=><option key={p.id} value={p.id}>{p.name}{p.position?` · ${p.position}`:''}</option>)}</select></label>
      <div className="ic-form-row"><label>날짜<input required type="date" value={form.scheduled_date} onChange={e=>setForm({...form,scheduled_date:e.target.value})}/></label><label>시간<input type="time" value={form.scheduled_time||''} onChange={e=>setForm({...form,scheduled_time:e.target.value})}/></label></div>
      <label>면담 유형<select value={form.interview_type} onChange={e=>setForm({...form,interview_type:e.target.value})}><option>정기 1:1</option><option>성장 코칭</option><option>이슈 체크인</option><option>커리어 대화</option></select></label>
      <label>미리 정할 주제<textarea value={form.topic} onChange={e=>setForm({...form,topic:e.target.value})} placeholder="예: 상반기 목표 점검, 최근 업무 부담, 커리어 방향"/></label>
      {editId&&<label>상태<select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option>예정</option><option>완료</option><option>취소</option><option>미실시</option></select></label>}
      <div className="ic-form-actions"><button type="button" className="ic-secondary" onClick={()=>setModal(false)}>취소</button><button className="ic-primary" disabled={busy}>{busy?'저장 중...':suggestionSourceId?'수정하여 확정':'저장'}</button></div>
    </form></div></div>}
  </section>
}

const mounted=new WeakMap()
function ensureCalendarMount(){
  const heading=[...document.querySelectorAll('.page-subtitle')].find(el=>el.textContent.includes('면담 기록'))
  const toolbar=heading?.closest('.toolbar')
  if(!toolbar||!document.body.contains(toolbar))return
  let mount=toolbar.parentElement?.querySelector(':scope > .interview-calendar-extension')
  if(!mount){mount=document.createElement('div');mount.className='interview-calendar-extension';toolbar.after(mount)}
  if(!mounted.has(mount)){const root=createRoot(mount);mounted.set(mount,root);root.render(<InterviewCalendarBridge/>)}
}

const observer=new MutationObserver(()=>ensureCalendarMount())
observer.observe(document.documentElement,{childList:true,subtree:true})
window.addEventListener('load',ensureCalendarMount)
setTimeout(ensureCalendarMount,300)
