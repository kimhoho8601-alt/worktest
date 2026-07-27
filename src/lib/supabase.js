import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(
  url && key && !url.includes('YOUR_PROJECT')
)

// sessionStorage를 사용하면 새로고침 중에는 로그인 상태가 유지되지만,
// 브라우저 탭/창을 완전히 닫으면 세션이 제거됩니다.
const browserSessionStorage =
  typeof window !== 'undefined' ? window.sessionStorage : undefined

export const supabase = createClient(
  url || 'https://example.supabase.co',
  key || 'placeholder',
  {
    auth: {
      persistSession: true,
      storage: browserSessionStorage,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
)

// 30분 동안 사용자 활동이 없으면 자동 로그아웃합니다.
const IDLE_TIMEOUT_MS = 30 * 60 * 1000
let idleTimer = null
let logoutInProgress = false

async function signOutForInactivity() {
  if (logoutInProgress) return

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) return

  logoutInProgress = true

  try {
    await supabase.auth.signOut()
  } finally {
    // 로그인 화면으로 돌아가면서 자동 로그아웃 사유를 표시할 수 있게 합니다.
    window.sessionStorage.setItem('session_notice', 'idle_timeout')
    window.location.replace('/')
  }
}

function resetIdleTimer() {
  if (idleTimer) window.clearTimeout(idleTimer)
  idleTimer = window.setTimeout(signOutForInactivity, IDLE_TIMEOUT_MS)
}

function startSessionSecurity() {
  if (typeof window === 'undefined') return

  const activityEvents = [
    'pointerdown',
    'keydown',
    'mousemove',
    'touchstart',
    'scroll',
  ]

  activityEvents.forEach((eventName) => {
    window.addEventListener(eventName, resetIdleTimer, { passive: true })
  })

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) resetIdleTimer()
  })

  supabase.auth.onAuthStateChange((_event, session) => {
    if (session) {
      logoutInProgress = false
      resetIdleTimer()
    } else if (idleTimer) {
      window.clearTimeout(idleTimer)
      idleTimer = null
    }
  })

  resetIdleTimer()
}

startSessionSecurity()
