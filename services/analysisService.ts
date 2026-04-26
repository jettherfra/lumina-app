const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000'

export interface ZoneMetrics {
  redness: number
  texture: number
  evenness: number
  pigmentation: number
  moisture: number
  pore_size: number
}

export interface AnalysisResult {
  overall_score: number
  metrics: Record<string, ZoneMetrics>
  ai_summary: string
  analysis_id?: string
  face_detected?: boolean
}

export async function analyzePhoto(imageUri: string, userId?: string): Promise<AnalysisResult> {
  const formData = new FormData()

  formData.append('image', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'skin_photo.jpg',
  } as any)

  if (userId) {
    formData.append('user_id', userId)
  }

  const response = await fetch(`${API_URL}/analysis/?user_id=${userId || ''}`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Analyse feilet: ${error}`)
  }

  return response.json()
}

export async function getAnalysisHistory(userId: string) {
  const response = await fetch(`${API_URL}/analysis/${userId}/history`)
  if (!response.ok) throw new Error('Kunne ikke hente historikk')
  return response.json()
}