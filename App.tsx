import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import {
  StyleSheet, Text, View, TextInput,
  TouchableOpacity, Alert, KeyboardAvoidingView, Platform
} from 'react-native'
import { useState, useEffect } from 'react'
import { supabase } from './services/supabase'
import { useAuth } from './hooks/useAuth'
import { initializePurchases } from './services/purchases'
import OnboardingScreen from './screens/OnboardingScreen'
import HomeScreen from './screens/HomeScreen'

function AuthScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isLogin, setIsLogin] = useState(true)

  async function handleAuth() {
    setLoading(true)
    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) Alert.alert('Feil', error.message)
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) Alert.alert('Feil', error.message)
      else Alert.alert('Konto opprettet', 'Sjekk e-posten din for bekreftelse.')
    }
    setLoading(false)
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inner}
      >
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>Lumina</Text>
          <Text style={styles.logoSub}>Skin Intelligence</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.formTitle}>
            {isLogin ? 'Logg inn' : 'Opprett konto'}
          </Text>

          <TextInput
            style={styles.input}
            placeholder="E-post"
            placeholderTextColor="#bbb"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Passord"
            placeholderTextColor="#bbb"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={styles.button}
            onPress={handleAuth}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Laster...' : isLogin ? 'Logg inn' : 'Registrer deg'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => setIsLogin(!isLogin)}
          >
            <Text style={styles.switchText}>
              {isLogin ? 'Har ikke konto? Registrer deg' : 'Har konto? Logg inn'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      <StatusBar style="dark" />
    </SafeAreaView>
  )
}

export default function App() {
  const { session, loading, hasProfile, userName, streak } = useAuth()

  useEffect(() => {
    initializePurchases()
  }, [])

  if (loading) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.container}>
          <Text style={styles.logoText}>Lumina</Text>
        </SafeAreaView>
      </SafeAreaProvider>
    )
  }

  if (!session) {
    return (
      <SafeAreaProvider>
        <AuthScreen />
      </SafeAreaProvider>
    )
  }

  if (!hasProfile) {
    return (
      <SafeAreaProvider>
        <OnboardingScreen
          userId={session.user.id}
          onComplete={() => supabase.auth.refreshSession()}
        />
      </SafeAreaProvider>
    )
  }

  return (
    <SafeAreaProvider>
      <HomeScreen userName={userName || session.user.email?.split('@')[0] || ''} streak={streak} />
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  inner: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingTop: 40,
  },
  logoText: {
    fontSize: 42,
    fontWeight: '300',
    color: '#1a1a1a',
    letterSpacing: -1,
  },
  logoSub: {
    fontSize: 13,
    color: '#999',
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  form: {
    paddingBottom: 24,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 24,
    letterSpacing: -0.5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1a1a1a',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  switchButton: {
    alignItems: 'center',
    padding: 16,
  },
  switchText: {
    fontSize: 14,
    color: '#999',
  },
})