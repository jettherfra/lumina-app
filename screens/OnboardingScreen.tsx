import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, SafeAreaView
} from 'react-native'
import { supabase } from '../services/supabase'

const SKIN_TYPES = [
  { key: 'dry', label: 'Tørr' },
  { key: 'oily', label: 'Fet' },
  { key: 'combination', label: 'Kombinert' },
  { key: 'sensitive', label: 'Sensitiv' },
  { key: 'normal', label: 'Normal' },
]

const CONCERNS = [
  { key: 'acne', label: 'Acne' },
  { key: 'redness', label: 'Rødhet' },
  { key: 'hyperpigmentation', label: 'Pigmentering' },
  { key: 'dryness', label: 'Tørrhet' },
  { key: 'oiliness', label: 'Oljete hud' },
  { key: 'texture', label: 'Tekstur' },
  { key: 'pores', label: 'Porer' },
]

export default function OnboardingScreen({ userId, onComplete }: { userId: string, onComplete: () => void }) {
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [skinType, setSkinType] = useState('')
  const [concerns, setConcerns] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)

  function toggleConcern(key: string) {
    setConcerns(prev =>
      prev.includes(key) ? prev.filter(c => c !== key) : [...prev, key]
    )
  }

  async function handleSave() {
    if (!name || !skinType) {
      Alert.alert('Mangler info', 'Fyll inn navn og hudtype')
      return
    }
    setLoading(true)
    const { error } = await supabase
      .from('users')
      .update({ name, age: age ? parseInt(age) : null, skin_type: skinType, concerns })
      .eq('id', userId)

    if (error) Alert.alert('Feil', error.message)
    else onComplete()
    setLoading(false)
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Progress */}
        <View style={styles.progressRow}>
          <View style={[styles.progressDot, step >= 1 && styles.progressDotActive]} />
          <View style={[styles.progressLine, step >= 2 && styles.progressLineActive]} />
          <View style={[styles.progressDot, step >= 2 && styles.progressDotActive]} />
          <View style={[styles.progressLine, step >= 3 && styles.progressLineActive]} />
          <View style={[styles.progressDot, step >= 3 && styles.progressDotActive]} />
        </View>

        {step === 1 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepLabel}>STEG 1 AV 3</Text>
            <Text style={styles.title}>Hva heter du?</Text>
            <Text style={styles.subtitle}>Vi bruker dette for å personalisere analysen din.</Text>

            <TextInput
              style={styles.input}
              placeholder="Ditt navn"
              placeholderTextColor="#bbb"
              value={name}
              onChangeText={setName}
              autoFocus
            />

            <Text style={styles.inputLabel}>Alder (valgfritt)</Text>
            <TextInput
              style={styles.input}
              placeholder="Din alder"
              placeholderTextColor="#bbb"
              value={age}
              onChangeText={setAge}
              keyboardType="numeric"
            />

            <TouchableOpacity
              style={[styles.button, !name && styles.buttonDisabled]}
              onPress={() => name && setStep(2)}
              disabled={!name}
            >
              <Text style={styles.buttonText}>Fortsett</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepLabel}>STEG 2 AV 3</Text>
            <Text style={styles.title}>Hva er din hudtype?</Text>
            <Text style={styles.subtitle}>Velg den som beskriver huden din best.</Text>

            <View style={styles.optionsGrid}>
              {SKIN_TYPES.map(type => (
                <TouchableOpacity
                  key={type.key}
                  style={[styles.optionChip, skinType === type.key && styles.optionChipSelected]}
                  onPress={() => setSkinType(type.key)}
                >
                  <Text style={[styles.optionText, skinType === type.key && styles.optionTextSelected]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.backButton} onPress={() => setStep(1)}>
                <Text style={styles.backButtonText}>Tilbake</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonFlex, !skinType && styles.buttonDisabled]}
                onPress={() => skinType && setStep(3)}
                disabled={!skinType}
              >
                <Text style={styles.buttonText}>Fortsett</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepLabel}>STEG 3 AV 3</Text>
            <Text style={styles.title}>Hva er du mest opptatt av?</Text>
            <Text style={styles.subtitle}>Velg alle som gjelder.</Text>

            <View style={styles.optionsGrid}>
              {CONCERNS.map(concern => (
                <TouchableOpacity
                  key={concern.key}
                  style={[styles.optionChip, concerns.includes(concern.key) && styles.optionChipSelected]}
                  onPress={() => toggleConcern(concern.key)}
                >
                  <Text style={[styles.optionText, concerns.includes(concern.key) && styles.optionTextSelected]}>
                    {concern.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.backButton} onPress={() => setStep(2)}>
                <Text style={styles.backButtonText}>Tilbake</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonFlex]}
                onPress={handleSave}
                disabled={loading}
              >
                <Text style={styles.buttonText}>{loading ? 'Lagrer...' : 'Kom i gang'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

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
    paddingTop: 32,
    minHeight: '100%',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 48,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
  },
  progressDotActive: {
    backgroundColor: '#1a1a1a',
  },
  progressLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 4,
  },
  progressLineActive: {
    backgroundColor: '#1a1a1a',
  },
  stepContainer: {
    flex: 1,
  },
  stepLabel: {
    fontSize: 11,
    color: '#999',
    letterSpacing: 2,
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#1a1a1a',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#999',
    marginBottom: 32,
    lineHeight: 22,
    fontWeight: '300',
  },
  inputLabel: {
    fontSize: 13,
    color: '#999',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1a1a1a',
    backgroundColor: '#ffffff',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 32,
  },
  optionChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#ffffff',
  },
  optionChipSelected: {
    backgroundColor: '#1a1a1a',
    borderColor: '#1a1a1a',
  },
  optionText: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '400',
  },
  optionTextSelected: {
    color: '#ffffff',
  },
  button: {
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonFlex: {
    flex: 1,
    marginTop: 0,
  },
  buttonDisabled: {
    backgroundColor: '#e0e0e0',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  backButton: {
    padding: 18,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 15,
    color: '#999',
  },
})