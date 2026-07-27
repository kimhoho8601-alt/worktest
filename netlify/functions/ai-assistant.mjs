export default async (request) => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 })
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return Response.json({ error: '조직 AI가 비활성화되어 있습니다. 프롬프트 복사 기능을 이용해 주세요.' }, { status: 503 })

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY
  const authHeader = request.headers.get('authorization') || ''
  if (!supabaseUrl || !supabaseAnonKey || !authHeader.startsWith('Bearer ')) {
    return Response.json({ error: '로그인 인증이 필요합니다.' }, { status: 401 })
  }
  const authResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { Authorization: authHeader, apikey: supabaseAnonKey }
  })
  if (!authResponse.ok) return Response.json({ error: '유효하지 않은 로그인입니다.' }, { status: 401 })

  try {
    const { type = 'performance', input = '', user = '사용자' } = await request.json()
    if (!input.trim()) return Response.json({ error: '분석할 내용을 입력하세요.' }, { status: 400 })
    const guides = {
      performance: '성과관리 전문가로서 사실과 해석을 구분하고, 강점, 지연 위험, 우선순위, 다음 실행 3가지를 한국어로 간결하게 작성해라. 인사평가 점수나 확정적 판단은 하지 마라.',
      interview: 'HR 면담 전문가로서 핵심 요약, 직원의 관점, 확인이 필요한 사항, 후속 질문, 실행 항목을 정리해라. 민감정보는 반복하지 마라.',
      manager: '조직관리 코치로서 상황 진단, 대화 문장 예시, 피해야 할 행동, 1주일 실행안을 제시해라. 단정하거나 낙인찍지 마라.',
      report: '경영 보고용 문체로 현황, 주요 성과, 리스크, 지원 요청, 다음 달 계획을 간결하게 정리해라.'
    }
    const resp = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'gpt-4.1-mini', input: `${guides[type] || guides.performance}\n작성자: ${user}\n입력 내용:\n${input.slice(0, 12000)}` })
    })
    const data = await resp.json()
    if (!resp.ok) return Response.json({ error: data.error?.message || 'AI 처리 중 오류가 발생했습니다.' }, { status: resp.status })
    return Response.json({ answer: data.output_text || '분석 결과가 없습니다.' })
  } catch (error) {
    return Response.json({ error: error.message || '요청 처리 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
