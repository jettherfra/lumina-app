import { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, SafeAreaView, ActivityIndicator
} from 'react-native'
import Svg, { Polyline, Circle, Line, Text as SvgText } from 'react-native-svg'
import { getAnalysisHistory } from '../services/analysisService'

interface Props {
  userId: string
  onClose: () => void
}

const METRICS = [
  { key: 'overall', label: 'Overordnet skår' },
  { key: 'redness', label: 'Rødhet' },
  { key: 'texture', label: 'Tekstur' },
  { key: 'moisture', label: 'Fuktighet' },
]

function LineChart({ data }: { data: { x: number; y: number }[] }) {
  if (data.length < 2) return null

  const width = 300
  const height = 140
  const padLeft = 32
  const padBottom = 24
  const padTop = 12
  const padRight = 12

  const chartW = width - padLeft - padRight
  const chartH = height - padBottom - padTop

  const minY = 0
  const maxY = 100
  const minX = 1
  const maxX = Math.max(data.length, 2)

  function toX(x: number) {
    return padLeft + ((x - minX) / (maxX - minX)) * chartW
  }

  function toY(y: number) {
    return padTop + (1 - (y - minY) / (maxY - minY)) * chartH
  }

  const points = data.map(d => `${toX(d.x)},${toY(d.y)}`).join(' ')
  const yTicks = [0, 25, 50, 75, 100]

  return (
    <Svg width={width} height={height}>
      {/* Y-grid lines */}
      {yTicks.map(tick => (
        <Line
          key={tick}
          x1={padLeft}
          y1={toY(tick)}
          x2={width - padRight}
          y2={toY(tick)}
          stroke="#e0e0e0"
          strokeWidth="1"
        />
      ))}

      {/* Y labels */}
      {yTicks.map(tick => (
        <SvgText
          key={tick}
          x={padLeft - 4}
          y={toY(tick) + 4}
          fontSize="9"
          fill="#999"
          textAnchor="end"
        >
          {tick}
        </SvgText>
      ))}

      {/* Line */}
      <Polyline
        points={points}
        fill="none"
        stroke="#1a1a1a"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Dots */}
      {data.map(d => (
        <Circle
          key={d.x}
          cx={toX(d.x)}
          cy={toY(d.y)}
          r="4"
          fill="#1a1a1a"
        />
      ))}

      {/* X labels */}
      {data.map(d => (
        <SvgText
          key={d.x}
          x={toX(d.x)}
          y={height - 4}
          fontSize="9"
          fill="#999"
          textAnchor="middle"
        >
          {d.x}
        </SvgText>
      ))}
    </Svg>
  )
}

export default function TrendsScreen({ userId, onClose }: Props) {
  const [analyses, setAnalyses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeMetric, setActiveMetric] = useState('overall')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const data = await getAnalysisHistory(userId)
      setAnalyses(data.analyses.reverse())
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  function getChartData() {
    if (activeMetric === 'overall') {
      return analyses.map((a, i) => ({ x: i + 1, y: a.overall_score }))
    }
    return analyses.map((a, i) => {
      const metrics = a.analysis_metrics || []
      const values = metrics.map((m: any) => m[activeMetric]).filter(Boolean)
      const avg = values.length
        ? values.reduce((a: number, b: number) => a + b, 0) / values.length
        : 0
      return { x: i + 1, y: Math.round(avg) }
    })
  }

  function getLatestValue() {
    const data = getChartData()
    return data.length ? data[data.length - 1].y : 0
  }

  function getTrend() {
    const data = getChartData()
    if (data.length < 2) return null
    return data[data.length - 1].y - data[0].y
  }

  const chartData = getChartData()
  const trend = getTrend()

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
          <Text style={styles.title}>Trender</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeText}>Lukk</Text>
          </TouchableOpacity>
        </View>

        {analyses.length < 2 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>Ikke nok data ennå</Text>
            <Text style={styles.emptyText}>
              Ta minst 2 analyser for å se trender over tid.
            </Text>
          </View>
        ) : (
          <>
            {/* Metric-velger */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.metricScroll}>
              {METRICS.map(m => (
                <TouchableOpacity
                  key={m.key}
                  style={[styles.metricChip, activeMetric === m.key && styles.metricChipActive]}
                  onPress={() => setActiveMetric(m.key)}
                >
                  <Text style={[styles.metricChipText, activeMetric === m.key && styles.metricChipTextActive]}>
                    {m.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>SISTE</Text>
                <Text style={styles.statValue}>{getLatestValue()}</Text>
                <Text style={styles.statUnit}>/ 100</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>ENDRING</Text>
                <Text style={styles.statValue}>
                  {trend !== null ? (trend > 0 ? `+${trend}` : `${trend}`) : '–'}
                </Text>
                <Text style={styles.statUnit}>poeng</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>ANALYSER</Text>
                <Text style={styles.statValue}>{analyses.length}</Text>
                <Text style={styles.statUnit}>totalt</Text>
              </View>
            </View>

            {/* Graf */}
            <View style={styles.chartCard}>
              <Text style={styles.chartLabel}>
                {METRICS.find(m => m.key === activeMetric)?.label.toUpperCase()}
              </Text>
              <LineChart data={chartData} />
            </View>

            {/* Innsikt */}
            {trend !== null && (
              <View style={styles.insightCard}>
                <Text style={styles.insightLabel}>INNSIKT</Text>
                <Text style={styles.insightText}>
                  {trend > 5
                    ? `${METRICS.find(m => m.key === activeMetric)?.label} har forbedret seg med ${trend} poeng siden første analyse. Fortsett det du gjør!`
                    : trend < -5
                    ? `${METRICS.find(m => m.key === activeMetric)?.label} har gått ned ${Math.abs(trend)} poeng. Sjekk om noe har endret seg i rutinen din.`
                    : 'Huden din er stabil. Fortsett å logge for å se tydeligere trender over tid.'}
                </Text>
              </View>
            )}
          </>
        )}

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
  metricScroll: {
    marginBottom: 20,
  },
  metricChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginRight: 8,
  },
  metricChipActive: {
    backgroundColor: '#1a1a1a',
    borderColor: '#1a1a1a',
  },
  metricChipText: {
    fontSize: 13,
    color: '#1a1a1a',
  },
  metricChipTextActive: {
    color: '#ffffff',
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
  chartCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  chartLabel: {
    fontSize: 11,
    color: '#999',
    letterSpacing: 2,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  insightCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  insightLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 2,
    marginBottom: 8,
  },
  insightText: {
    fontSize: 14,
    color: '#ffffff',
    lineHeight: 22,
    fontWeight: '300',
  },
  button: {
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
})