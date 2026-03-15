import { useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, SafeAreaView, Alert, TextInput
} from 'react-native'
import { supabase } from '../services/supabase'

interface Props {
  userId: string
  onClose: () => void
}

const PRODUCTS = ['Rens', 'Toner', 'Serum', 'Fuktighetskrem', 'Solkrem', 'Retinol', 'Eksfoliering']

export default function DailyLogScreen({ userId, onClose }: Props) {
  const [sleep, setSleep] = useState<number | null>(null)
  const [stress, setStress] = useState<number | null>(null)
  const [water, setWater] = useState<number | null>(null)
  const [products, setProducts] = useState<string[]>([])
  const [period, setPeriod] = useState(false)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  function toggleProduct(product: string) {
    setProducts(prev =>
      prev.includes(product) ? prev.filter(p => p !== product) : [...prev, product]
    )
  }

  async function handleSave() {
    setLoading(true)
    try {
      const today = new Date().toISOString().split('T')[0]

      const { error } = await supabase
        .from('daily_logs')
        .upsert({
          user_id: userId,
          date: today,
          sleep_hours: sleep,
          stress_level: stress,
          water_intake: water,
          products_used: products,
          period_tracking: period,
          notes: notes || null,
        }, { onConflict: 'user_id,date' })

      if (error) throw error
      Alert.alert('Lagret', 'Dagens logg er lagret.')
      onClose()
    } catch (e: any) {
      Alert.alert('Feil', e.message)
    }
    setLoading(false)
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        <View style={styles.header}>
          <Text style={styles.title}>Daglig logg</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeText}>Avbryt</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.dateText}>
          {new Date().toLocaleDateString('nb-NO', { weekday: 'long', day: 'numeric', month: 'long' })}
        </Text>

        {/* Søvn */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SØVN</Text>
          <Text style={styles.sectionSub}>Hvor mange timer sov du?</Text>
          <View style={styles.optionsRow}>
            {[5, 6, 7, 8, 9].map(h => (
              <TouchableOpacity
                key={h}
                style={[styles.chip, sleep === h && styles.chipSelected]}
                onPress={() => setSleep(h)}
              >
                <Text style={[styles.chipText, sleep === h && styles.chipTextSelected]}>
                  {h}t
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Stress */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>STRESSNIVÅ</Text>
          <Text style={styles.sectionSub}>Fra 1 (lavt) til 5 (høyt)</Text>
          <View style={styles.optionsRow}>
            {[1, 2, 3, 4, 5].map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.chip, stress === s && styles.chipSelected]}
                onPress={() => setStress(s)}
              >
                <Text style={[styles.chipText, stress === s && styles.chipTextSelected]}>
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Vann */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>VANNINNTAK</Text>
          <Text style={styles.sectionSub}>Antall glass vann i dag</Text>
          <View style={styles.optionsRow}>
            {[2, 4, 6, 8, 10].map(w => (
              <TouchableOpacity
                key={w}
                style={[styles.chip, water === w && styles.chipSelected]}
                onPress={() => setWater(w)}
              >
                <Text style={[styles.chipText, water === w && styles.chipTextSelected]}>
                  {w}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Produkter */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PRODUKTER BRUKT</Text>
          <Text style={styles.sectionSub}>Hva brukte du i dag?</Text>
          <View style={styles.optionsRow}>
            {PRODUCTS.map(p => (
              <TouchableOpacity
                key={p}
                style={[styles.chip, products.includes(p) && styles.chipSelected]}
                onPress={() => toggleProduct(p)}
              >
                <Text style={[styles.chipText, products.includes(p) && styles.chipTextSelected]}>
                  {p}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Menstruasjon */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>MENSTRUASJON</Text>
          <TouchableOpacity
            style={[styles.toggleButton, period && styles.toggleButtonActive]}
            onPress={() => setPeriod(!period)}
          >
            <Text style={[styles.toggleText, period && styles.toggleTextActive]}>
              {period ? 'Ja' : 'Nei'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Notater */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>NOTATER</Text>
          <Text style={styles.sectionSub}>Noe annet du vil huske?</Text>
          <TextInput
            style={styles.textArea}
            placeholder="F.eks. prøvde ny krem, spiste mye sukker..."
            placeholderTextColor="#bbb"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Lagrer...' : 'Lagre dagens logg'}
          </Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    marginBottom: 4,
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
  dateText: {
    fontSize: 13,
    color: '#999',
    textTransform: 'capitalize',
    marginBottom: 32,
  },
  section: {
    marginBottom: 28,
  },
  sectionLabel: {
    fontSize: 11,
    color: '#999',
    letterSpacing: 2,
    marginBottom: 4,
  },
  sectionSub: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
    fontWeight: '300',
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#ffffff',
  },
  chipSelected: {
    backgroundColor: '#1a1a1a',
    borderColor: '#1a1a1a',
  },
  chipText: {
    fontSize: 14,
    color: '#1a1a1a',
  },
  chipTextSelected: {
    color: '#ffffff',
  },
  toggleButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  toggleButtonActive: {
    backgroundColor: '#1a1a1a',
    borderColor: '#1a1a1a',
  },
  toggleText: {
    fontSize: 14,
    color: '#1a1a1a',
  },
  toggleTextActive: {
    color: '#ffffff',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: '#1a1a1a',
    minHeight: 90,
    textAlignVertical: 'top',
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