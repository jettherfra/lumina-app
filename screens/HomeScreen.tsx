import { useState, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  Modal, ActivityIndicator, Alert
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '../services/supabase'
import { analyzePhoto, AnalysisResult } from '../services/analysisService'
import { scheduleDailyReminder } from '../services/notifications'
import { checkPremiumStatus } from '../services/purchases'
import CameraScreen from './CameraScreen'
import AnalysisResultScreen from './AnalysisResultScreen'
import HistoryScreen from './HistoryScreen'
import DailyLogScreen from './DailyLogScreen'
import TrendsScreen from './TrendsScreen'
import PaywallScreen from './PaywallScreen'
import WeeklyReportScreen from './WeeklyReportScreen'

export default function HomeScreen({ userName, streak = 0 }: { userName: string, streak: number }) {
  const [showCamera, setShowCamera] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showLog, setShowLog] = useState(false)
  const [showTrends, setShowTrends] = useState(false)
  const [showPaywall, setShowPaywall] = useState(false)
  const [showWeeklyReport, setShowWeeklyReport] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [userId, setUserId] = useState<string | undefined>()
  const [isPremium, setIsPremium] = useState(false)
  const [analysisCount, setAnalysisCount] = useState(0)

  useEffect(() => {
    scheduleDailyReminder(9)
    loadPremiumStatus()
  }, [])

  async function loadPremiumStatus() {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      setUserId(session.user.id)

      // Sjekk beta-bruker først
      const { data: betaData } = await supabase
        .from('beta_users')
        .select('id')
        .eq('user_id', session.user.id)
        .maybeSingle()

      if (betaData) {
        setIsPremium(true)
      } else {
        const premium = await checkPremiumStatus()
        setIsPremium(premium)
      }

      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
      const { count } = await supabase
        .from('analyses')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id)
        .gte('created_at', oneWeekAgo.toISOString())
      setAnalysisCount(count || 0)
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  async function openCamera() {
    const { data: { session } } = await supabase.auth.getSession()
    setUserId(session?.user.id)
    if (!isPremium && analysisCount >= 2) {
      setShowPaywall(true)
      return
    }
    setShowCamera(true)
  }

  async function openLog() {
    const { data: { session } } = await supabase.auth.getSession()
    setUserId(session?.user.id)
    setShowLog(true)
  }

  async function openTrends() {
    const { data: { session } } = await supabase.auth.getSession()
    setUserId(session?.user.id)
    if (!isPremium) {
      setShowPaywall(true)
      return
    }
    setShowTrends(true)
  }

  async function openWeeklyReport() {
    if (!isPremium) {
      setShowPaywall(true)
      return
    }
    setShowWeeklyReport(true)
  }

  async function handlePhotoTaken(uri: string) {
    setShowCamera(false)
    setAnalyzing(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const analysisResult = await analyzePhoto(uri, session?.user.id)
      setResult(analysisResult)
      setAnalysisCount(prev => prev + 1)
    } catch (e: any) {
      if (e.message === 'NO_FACE') {
        Alert.alert(
          'Ansikt ikke funnet',
          'Vi fant ikke ansiktet ditt i bildet. Prøv igjen med bedre belysning og hold telefonen 20–30 cm fra ansiktet.',
          [{ text: 'Prøv igjen', style: 'default' }]
        )
      } else {
        Alert.alert(
          'Noe gikk galt',
          'Kunne ikke analysere bildet. Sjekk internettilkoblingen og prøv igjen.',
          [{ text: 'OK', style: 'default' }]
        )
      }
    }
    setAnalyzing(false)
  }

  if (analyzing) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a1a1a" />
        <Text style={styles.loadingTitle}>Analyserer</Text>
        <Text style={styles.loadingSubtext}>Dette tar noen sekunder</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>Hei, {userName}</Text>
          <Text style={styles.date}>
            {new Date().toLocaleDateString('nb-NO', { weekday: 'long', day: 'numeric', month: 'long' })}
          </Text>
        </View>
        <TouchableOpacity onPress={handleSignOut}>
          <Text style={styles.signOutText}>Logg ut</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.primaryCard} onPress={openCamera} activeOpacity={0.9}>
        <View style={styles.primaryCardInner}>
          <View style={styles.primaryCardText}>
            <Text style={styles.primaryCardLabel}>DAGLIG SJEKK</Text>
            <Text style={styles.primaryCardTitle}>Ta hudanalyse</Text>
            <Text style={styles.primaryCardSub}>
              {isPremium ? 'Ubegrenset analyser' : `${Math.min(analysisCount, 2)}/2 denne uken`}
            </Text>
          </View>
          <View style={styles.cameraIconContainer}>
            <Text style={styles.cameraIcon}>↗</Text>
          </View>
        </View>
      </TouchableOpacity>

      <View style={styles.statsRow}>
        <TouchableOpacity style={styles.statCard} onPress={() => setShowHistory(true)} activeOpacity={0.8}>
          <Text style={styles.statLabel}>HISTORIKK</Text>
          <Text style={styles.statValue}>Se alle</Text>
          <Text style={styles.statArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.statCard} onPress={openLog} activeOpacity={0.8}>
          <Text style={styles.statLabel}>DAGLIG LOGG</Text>
          <Text style={styles.statValue}>Logg dag</Text>
          <Text style={styles.statArrow}>→</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <TouchableOpacity style={styles.statCard} onPress={openTrends} activeOpacity={0.8}>
          <Text style={styles.statLabel}>TRENDER</Text>
          <Text style={styles.statValue}>{isPremium ? 'Se grafer' : 'Premium'}</Text>
          <Text style={styles.statArrow}>→</Text>
        </TouchableOpacity>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>STREAK</Text>
          <Text style={styles.statValueLarge}>{streak}</Text>
          <Text style={styles.statUnit}>dager</Text>
        </View>
      </View>

      <TouchableOpacity
        style={isPremium ? styles.reportCard : styles.reportCardLocked}
        onPress={openWeeklyReport}
        activeOpacity={0.9}
      >
        <View>
          <Text style={styles.reportCardLabel}>UKENTLIG RAPPORT</Text>
          <Text style={styles.reportCardTitle}>
            {isPremium ? 'Se ukens oppsummering' : 'Premium-feature'}
          </Text>
        </View>
        <Text style={styles.reportCardArrow}>↗</Text>
      </TouchableOpacity>

      {!isPremium && (
        <TouchableOpacity style={styles.premiumBanner} onPress={() => setShowPaywall(true)} activeOpacity={0.9}>
          <View>
            <Text style={styles.premiumBannerLabel}>OPPGRADER</Text>
            <Text style={styles.premiumBannerTitle}>Prøv Premium gratis</Text>
          </View>
          <Text style={styles.premiumBannerArrow}>↗</Text>
        </TouchableOpacity>
      )}

      <Modal visible={showCamera} animationType="slide">
        <CameraScreen onClose={() => setShowCamera(false)} onPhotoTaken={handlePhotoTaken} />
      </Modal>

      <Modal visible={!!result} animationType="slide">
        {result && <AnalysisResultScreen result={result} onClose={() => setResult(null)} />}
      </Modal>

      <Modal visible={showHistory} animationType="slide">
        {userId && <HistoryScreen userId={userId} onClose={() => setShowHistory(false)} />}
      </Modal>

      <Modal visible={showLog} animationType="slide">
        {userId && <DailyLogScreen userId={userId} onClose={() => setShowLog(false)} />}
      </Modal>

      <Modal visible={showTrends} animationType="slide">
        {userId && <TrendsScreen userId={userId} onClose={() => setShowTrends(false)} />}
      </Modal>

      <Modal visible={showPaywall} animationType="slide">
        <PaywallScreen
          onClose={() => setShowPaywall(false)}
          onPurchased={() => { setShowPaywall(false); setIsPremium(true) }}
        />
      </Modal>

      <Modal visible={showWeeklyReport} animationType="slide">
        {userId && <WeeklyReportScreen userId={userId} onClose={() => setShowWeeklyReport(false)} />}
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: '300',
    color: '#1a1a1a',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  loadingSubtext: {
    fontSize: 13,
    color: '#999',
    letterSpacing: 0.5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 8,
    paddingBottom: 24,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1a1a1a',
    letterSpacing: -0.5,
  },
  date: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  signOutText: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
  },
  primaryCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 18,
    padding: 22,
    marginBottom: 12,
  },
  primaryCardInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  primaryCardText: {
    flex: 1,
    marginRight: 12,
  },
  primaryCardLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 2,
    marginBottom: 6,
  },
  primaryCardTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  primaryCardSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
  cameraIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIcon: {
    fontSize: 18,
    color: '#ffffff',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    padding: 18,
  },
  statLabel: {
    fontSize: 11,
    color: '#999',
    letterSpacing: 2,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  statValueLarge: {
    fontSize: 30,
    fontWeight: '600',
    color: '#1a1a1a',
    letterSpacing: -1,
  },
  statUnit: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
  statArrow: {
    fontSize: 16,
    color: '#1a1a1a',
    marginTop: 4,
  },
  reportCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    padding: 18,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reportCardLocked: {
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    padding: 18,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    opacity: 0.5,
  },
  reportCardLabel: {
    fontSize: 11,
    color: '#999',
    letterSpacing: 2,
    marginBottom: 4,
  },
  reportCardTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  reportCardArrow: {
    fontSize: 18,
    color: '#1a1a1a',
  },
  premiumBanner: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 18,
    marginTop: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  premiumBannerLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 2,
    marginBottom: 4,
  },
  premiumBannerTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
  },
  premiumBannerArrow: {
    fontSize: 20,
    color: '#ffffff',
  },
})