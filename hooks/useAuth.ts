import { useState, useEffect } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from '../services/supabase'

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasProfile, setHasProfile] = useState(false)
  const [userName, setUserName] = useState('')
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        checkProfile(session.user.id)
        calculateStreak(session.user.id)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        checkProfile(session.user.id)
        calculateStreak(session.user.id)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function checkProfile(userId: string) {
    const { data } = await supabase
      .from('users')
      .select('name, skin_type')
      .eq('id', userId)
      .single()
    setHasProfile(!!(data?.skin_type))
    if (data?.name) setUserName(data.name)
  }

  async function calculateStreak(userId: string) {
    // Hent alle analyser sortert på dato
    const { data } = await supabase
      .from('analyses')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (!data || data.length === 0) {
      setStreak(0)
      return
    }

    // Sjekk om bruker har tatt analyse i dag eller i går
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const lastAnalysisDate = new Date(data[0].created_at)
    lastAnalysisDate.setHours(0, 0, 0, 0)

    // Hvis siste analyse er eldre enn i går — streak er brutt
    if (lastAnalysisDate < yesterday) {
      setStreak(0)
      return
    }

    // Tell streak bakover
    let currentStreak = 1
    let checkDate = new Date(lastAnalysisDate)

    for (let i = 1; i < data.length; i++) {
      const analysisDate = new Date(data[i].created_at)
      analysisDate.setHours(0, 0, 0, 0)

      const expectedDate = new Date(checkDate)
      expectedDate.setDate(expectedDate.getDate() - 1)

      if (analysisDate.getTime() === expectedDate.getTime()) {
        currentStreak++
        checkDate = analysisDate
      } else if (analysisDate.getTime() === checkDate.getTime()) {
        // Flere analyser samme dag — hopp over
        continue
      } else {
        break
      }
    }

    setStreak(currentStreak)
  }

  return { session, loading, hasProfile, userName, streak }
}