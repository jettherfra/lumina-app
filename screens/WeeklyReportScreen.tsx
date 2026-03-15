import { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, SafeAreaView, ActivityIndicator
} from 'react-native'

const API_URL = process.env.EXPO_PUBLIC_API_URL

interface Props {
  userId: string
  onClose: () => void
}

interface ReportData {
  report: string
  analysis_count: number
  avg_score: number
  score_change: number
}

export default function WeeklyReportScreen({ userId, onClose }: Props) {
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    loadReport()
  }, [])

  async function loadReport() {
    try {
      const res = await fetch(`${API_URL}/weekly-report/${userId}`)
      const json = await res.json()
      setData(json)
    } catch (e) {
      setError(true)
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a1a1a" />
        <Text style={styles.loadingTitle}>Genererer rapport</Text>
        <Text style={styles.loadingSubtext}>Analyserer uken din</Text>
      </SafeAreaView>
    )
  }

  if (error || !data) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Ukentlig rapport</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeText}>Lukk</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.errorText}>Kunne ikke laste rapporten. Sjekk at backend kjører.</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>

        <View style={styles.header}>
          <Text style={styles.title}>Ukentlig rapport</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeText}>Lukk</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>ANALYSER</Text>
            <Text style={styles.statValue}>{data.analysis_count}</Text>
            <Text style={styles.statUnit}>denne uken</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>SNITT</Text>
            <Text style={styles.statValue}>{data.avg_score}</Text>
            <Text style={styles.statUnit}>/ 100</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>ENDRING</Text>
            <Text style={styles.statValue}>
              {data.score_change > 0 ? `+${data.score_change}` : data.score_change}
            </Text>
            <Text style={styles.statUnit}>poeng</Text>
          </View>
        </View>

        <View style={styles.reportCard}>
          <Text style={styles.reportLabel}>UKENS RAPPORT</Text>
          <Text style={styles.reportText}>{data.report}</Text>
        </View>

        <Text style={styles.dateText}>
          Generert {new Date().toLocaleDateString('nb-NO', {
            day: 'numeric', month: 'long', year: 'numeric'
          })}
        </Text>

        <TouchableOpacity style={styles.button} onPress={onClose}>
          <Text style={styles.buttonText}>Tilbake</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
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
  content: {
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    marginBottom: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#1a1a1a',
    letterSpacing: -0.5,
  },
  closeText: {
    fontSize: 15,
    color: '#999',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
  },
  statLabel: {
    fontSize: 9,
    color: '#999',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1a1a1a',
    letterSpacing: -0.5,
  },
  statUnit: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  reportCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
  },
  reportLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 2,
    marginBottom: 16,
  },
  reportText: {
    fontSize: 15,
    color: '#ffffff',
    lineHeight: 26,
    fontWeight: '300',
  },
  dateText: {
    fontSize: 12,
    color: '#bbb',
    textAlign: 'center',
    marginBottom: 24,
    textTransform: 'capitalize',
  },
  button: {
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginBottom: 32,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  errorText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    padding: 24,
  },
})