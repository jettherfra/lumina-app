import { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Modal
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { getAnalysisHistory } from '../services/analysisService'
import AnalysisResultScreen from './AnalysisResultScreen'

interface Analysis {
  id: string
  created_at: string
  overall_score: number
  ai_summary: string
  metrics: any
}

interface Props {
  userId: string
  onClose: () => void
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('nb-NO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function HistoryScreen({ userId, onClose }: Props) {
  const [analyses, setAnalyses] = useState<Analysis[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAnalysis, setSelectedAnalysis] = useState<Analysis | null>(null)

  useEffect(() => {
    loadHistory()
  }, [])

  async function loadHistory() {
    try {
      const data = await getAnalysisHistory(userId)
      const formatted = data.analyses.map((a: any) => {
        const metrics: Record<string, any> = {}
        if (a.analysis_metrics) {
          for (const m of a.analysis_metrics) {
            metrics[m.zone] = {
              redness: m.redness,
              texture: m.texture,
              evenness: m.evenness,
              pigmentation: m.pigmentation,
              moisture: m.moisture,
              pore_size: m.pore_size,
            }
          }
        }
        return { ...a, metrics }
      })
      setAnalyses(formatted)
    } catch (e) {
      console.error('Kunne ikke laste historikk:', e)
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a1a1a" />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>

        <View style={styles.header}>
          <Text style={styles.title}>Historikk</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeText}>Lukk</Text>
          </TouchableOpacity>
        </View>

        {analyses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>Ingen analyser ennå</Text>
            <Text style={styles.emptyText}>Ta din første hudanalyse for å se historikken her.</Text>
          </View>
        ) : (
          <>
            {analyses.length > 1 && (
              <View style={styles.trendCard}>
                <Text style={styles.trendLabel}>UTVIKLING</Text>
                <View style={styles.trendRow}>
                  <View style={styles.trendItem}>
                    <Text style={styles.trendValue}>{analyses[0].overall_score}</Text>
                    <Text style={styles.trendSub}>Siste</Text>
                  </View>
                  <View style={styles.trendDivider} />
                  <View style={styles.trendItem}>
                    <Text style={styles.trendValue}>{analyses[analyses.length - 1].overall_score}</Text>
                    <Text style={styles.trendSub}>Første</Text>
                  </View>
                  <View style={styles.trendDivider} />
                  <View style={styles.trendItem}>
                    <Text style={[
                      styles.trendValue,
                      { color: analyses[0].overall_score >= analyses[analyses.length - 1].overall_score ? '#1a1a1a' : '#999' }
                    ]}>
                      {analyses[0].overall_score >= analyses[analyses.length - 1].overall_score ? '+' : ''}
                      {analyses[0].overall_score - analyses[analyses.length - 1].overall_score}
                    </Text>
                    <Text style={styles.trendSub}>Endring</Text>
                  </View>
                </View>
              </View>
            )}

            {analyses.map((analysis, index) => (
              <TouchableOpacity
                key={analysis.id}
                style={styles.card}
                onPress={() => setSelectedAnalysis(analysis)}
                activeOpacity={0.8}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardDate}>{formatDate(analysis.created_at)}</Text>
                  <Text style={styles.cardScore}>{analysis.overall_score}</Text>
                </View>

                {index > 0 && (
                  <Text style={styles.changeText}>
                    {analysis.overall_score > analyses[index - 1].overall_score
                      ? `+${analysis.overall_score - analyses[index - 1].overall_score} fra forrige`
                      : analysis.overall_score < analyses[index - 1].overall_score
                      ? `${analysis.overall_score - analyses[index - 1].overall_score} fra forrige`
                      : 'Ingen endring fra forrige'
                    }
                  </Text>
                )}

                <Text style={styles.summaryText} numberOfLines={2}>
                  {analysis.ai_summary}
                </Text>

                <Text style={styles.tapHint}>Trykk for å se detaljer →</Text>
              </TouchableOpacity>
            ))}
          </>
        )}

        <TouchableOpacity style={styles.button} onPress={onClose}>
          <Text style={styles.buttonText}>Tilbake</Text>
        </TouchableOpacity>

      </ScrollView>

      <Modal visible={!!selectedAnalysis} animationType="slide">
        {selectedAnalysis && (
          <AnalysisResultScreen
            result={selectedAnalysis}
            onClose={() => setSelectedAnalysis(null)}
          />
        )}
      </Modal>
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
  emptyContainer: {
    marginTop: 80,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  trendCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
  },
  trendLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 2,
    marginBottom: 16,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendItem: {
    flex: 1,
    alignItems: 'center',
  },
  trendValue: {
    fontSize: 28,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: -1,
  },
  trendSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 4,
  },
  trendDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  card: {
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardDate: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
    textTransform: 'capitalize',
  },
  cardScore: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    letterSpacing: -0.5,
  },
  changeText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
    fontWeight: '300',
  },
  tapHint: {
    fontSize: 11,
    color: '#bbb',
    marginTop: 10,
    letterSpacing: 0.5,
  },
  button: {
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
})