function isInterviewPage(){
  const pageTitle=document.querySelector('.topbar-title h1')?.textContent?.trim()
  const hasInterviewHeading=[...document.querySelectorAll('.page-subtitle')].some(el=>el.textContent?.includes('면담 기록'))
  return pageTitle==='면담관리'&&hasInterviewHeading
}

function syncInterviewCalendarVisibility(){
  const visible=isInterviewPage()
  document.querySelectorAll('.interview-calendar-extension').forEach(el=>{
    el.hidden=!visible
    if(visible)el.removeAttribute('aria-hidden')
    else el.setAttribute('aria-hidden','true')
  })
}

const observer=new MutationObserver(syncInterviewCalendarVisibility)
observer.observe(document.documentElement,{childList:true,subtree:true,characterData:true})
window.addEventListener('load',syncInterviewCalendarVisibility)
setTimeout(syncInterviewCalendarVisibility,0)
setTimeout(syncInterviewCalendarVisibility,300)
