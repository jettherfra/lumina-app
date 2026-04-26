import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native'
import { AnalysisResult } from '../services/analysisService'

interface Props {
  result: AnalysisResult
  onClose: () => void
}

const ZONE_NAMES: Record<string, string> = {
  forehead: 'Panne',
  nose: 'Nese',
  left_cheek: 'Venstre kinn',
  right_cheek: 'Høyre kinn',
  chin: 'Hake',
}

function ScoreBar({ label, value, inverted = false }: { label: string; value: number; inverted?: boolean }) {
  const good = inverted ? value < 40 : value >= 60
  const color = good ? '#1a1a1a' : value >= 40 ? '#888' : '#ccc'

  return (
    <View style={styles.scoreRow}>
      <Text style={styles.scoreLabel}>{label}</Text>
      <View style={styles.barBackground}>
        <View style={[styles.barFill, { width: `${value}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.scoreValue}>{value}</Text>
    </View>
  )
}

export default function AnalysisResultScreen({ result, onClose }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>

        <View style={styles.header}>
          <Text style={styles.title}>Hudanalyse</Text>
          <Text style={styles.date}>
            {new Date().toLocaleDateString('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' })}
          </Text>
        </View>

        {result.face_detected === false && (
          <View style={styles.warningCard}>
            <Text style={styles.warningIcon}>⚠️</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.warningTitle}>Ansikt ikke funnet</Text>
              <Text style={styles.warningText}>
                Vi kunne ikke finne ansiktet tydelig i bildet. For best resultat: god belysning, ansiktet sentrert og hold telefonen 20–30 cm unna.
              </Text>
            </View>
          </View>
        )}

        <View style={styles.scoreCard}>
          <Text style={styles.scoreCardLabel}>OVERORDNET HUDSKÅR</Text>
          <View style={styles.scoreCardRow}>
            <Text style={styles.bigScore}>{result.overall_score}</Text>
            <Text style={styles.bigScoreMax}>/100</Text>
          </View>
          <View style={styles.scoreTrack}>
            <View style={[styles.scoreFill, { width: `${result.overall_score}%` }]} />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>AI-ANALYSE</Text>
          <Text style={styles.summaryText}>{result.ai_summary}</Text>
        </View>

        {Object.entries(result.metrics).map(([zone, data]) => (
          <View key={zone} style={styles.card}>
            <Text style={styles.cardLabel}>{ZONE_NAMES[zone]?.toUpperCase() || zone.toUpperCase()}</Text>
            <ScoreBar label="Rødhet" value={data.redness} inverted />
            <ScoreBar label="Tekstur" value={data.texture} />
            <ScoreBar label="Jevnhet" value={data.evenness} />
            <ScoreBar label="Fuktighet" value={data.moisture} />
            <ScoreBar label="Pigmentering" value={data.pigmentation} inverted />
          </View>
        ))}

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
  content: {
    padding: 24,
  },
  header: {
    marginBottom: 24,
    paddingTop: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#1a1a1a',
    letterSpacing: -0.5,
  },
  date: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  warningCard: {
    backgroundColor: '#FFF8E7',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#FFE0A0',
  },
  warningIcon: {
    fontSize: 20,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  scoreCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 28,
    marginBottom: 16,
  },
  scoreCardLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 2,
    marginBottom: 12,
  },
  scoreCardRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  bigScore: {
    fontSize: 64,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: -2,
  },
  bigScoreMax: {
    fontSize: 20,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 12,
    marginLeft: 4,
  },
  scoreTrack: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  scoreFill: {
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 2,
  },
  card: {
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  cardLabel: {
    fontSize: 11,
    color: '#999',
    letterSpacing: 2,
    marginBottom: 16,
  },
  summaryText: {
    fontSize: 15,
    color: '#1a1a1a',
    lineHeight: 24,
    fontWeight: '300',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  scoreLabel: {
    width: 110,
    fontSize: 13,
    color: '#666',
  },
  barBackground: {
    flex: 1,
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 2,
  },
  scoreValue: {
    width: 28,
    fontSize: 13,
    color: '#1a1a1a',
    textAlign: 'right',
    fontWeight: '500',
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