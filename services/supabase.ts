import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'
import 'react-native-url-polyfill/auto'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// ─── Database Types ────────────────────────────────────────────────────────────

export type SkinType = 'dry' | 'oily' | 'combination' | 'sensitive' | 'normal'
export type SkinConcern = 'acne' | 'redness' | 'hyperpigmentation' | 'dryness' | 'oiliness' | 'texture' | 'pores' | 'aging'
export type FaceZone = 'forehead' | 'nose' | 'left_cheek' | 'right_cheek' | 'chin'
export type SkinCondition = 'acne' | 'rosacea' | 'eczema' | 'hyperpigmentation' | 'dehydration' | 'healthy'
export type LightingQuality = 'good' | 'acceptable' | 'poor'

export interface User {
  id: string
  email: string
  name: string
  age?: number
  skin_type?: SkinType
  concerns?: SkinConcern[]
  created_at: string
}

export interface Analysis {
  id: string
  user_id: string
  image_url: string
  lighting_quality: LightingQuality
  overall_score: number
  ai_summary: string
  created_at: string
}

export interface AnalysisMetrics {
  id: string
  analysis_id: string
  zone: FaceZone
  redness: number        // 0-100
  texture: number        // 0-100
  pore_size: number      // 0-100
  evenness: number       // 0-100
  pigmentation: number   // 0-100
  moisture: number       // 0-100
}

export interface AnalysisClassification {
  id: string
  analysis_id: string
  condition: SkinCondition
  severity: number       // 1-4
  confidence: number     // 0-100
  zone?: FaceZone
}

export interface DailyLog {
  id: string
  user_id: string
  date: string           // YYYY-MM-DD
  sleep_hours?: number
  stress_level?: number  // 1-10
  water_intake?: number  // glasses
  products_used?: string[]
  period_tracking?: boolean
  notes?: string
}