import { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, ActivityIndicator, Alert
} from 'react-native'
import { getOfferings, purchasePremium, restorePurchases } from '../services/purchases'
import { PurchasesPackage } from 'react-native-purchases'

interface Props {
  onClose: () => void
  onPurchased: () => void
}

export default function PaywallScreen({ onClose, onPurchased }: Props) {
  const [packages, setPackages] = useState<PurchasesPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(false)
  const [selected, setSelected] = useState<PurchasesPackage | null>(null)

  useEffect(() => {
    loadOfferings()
  }, [])

  async function loadOfferings() {
    const offering = await getOfferings()
    if (offering?.availablePackages) {
      setPackages(offering.availablePackages)
      setSelected(offering.availablePackages[0])
    }
    setLoading(false)
  }

  async function handlePurchase() {
    if (!selected) return
    setPurchasing(true)
    try {
      const success = await purchasePremium(selected)
      if (success) {
        Alert.alert('Velkommen til Premium!', 'Du har nå tilgang til alle funksjoner.')
        onPurchased()
      }
    } catch (e: any) {
      Alert.alert('Feil', e.message || 'Kjøpet kunne ikke gjennomføres')
    }
    setPurchasing(false)
  }

  async function handleRestore() {
    setPurchasing(true)
    try {
      const success = await restorePurchases()
      if (success) {
        Alert.alert('Gjenopprettet!', 'Premium-abonnementet ditt er gjenopprettet.')
        onPurchased()
      } else {
        Alert.alert('Ingen kjøp funnet', 'Vi fant ingen tidligere kjøp å gjenopprette.')
      }
    } catch (e: any) {
      Alert.alert('Feil', e.message)
    }
    setPurchasing(false)
  }

  const features = [
    { label: 'Ubegrenset hudanalyser' },
    { label: 'Full analysehistorikk' },
    { label: 'Trendgrafer over tid' },
    { label: 'Triggere og innsikt' },
    { label: 'Personlige anbefalinger' },
    { label: 'Ukentlig AI-rapport' },
  ]

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeText}>Lukk</Text>
          </TouchableOpacity>
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroLabel}>LUMINA PREMIUM</Text>
          <Text style={styles.heroTitle}>Forstå huden{'\n'}din fullt ut</Text>
          <Text style={styles.heroSub}>
            Få tilgang til alle verktøy for å tracke, forstå og forbedre huden din over tid.
          </Text>
        </View>

        {/* Features */}
        <View style={styles.featuresCard}>
          {features.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={styles.featureDot} />
              <Text style={styles.featureText}>{f.label}</Text>
            </View>
          ))}
        </View>

        {/* Packages */}
        {loading ? (
          <ActivityIndicator color="#1a1a1a" style={{ marginVertical: 24 }} />
        ) : packages.length === 0 ? (
          <View style={styles.noPackageCard}>
            <Text style={styles.noPackageText}>
              Ingen abonnementer tilgjengelig ennå.{'\n'}Sett opp produkter i App Store Connect.
            </Text>
          </View>
        ) : (
          <View style={styles.packagesContainer}>
            {packages.map(pkg => (
              <TouchableOpacity
                key={pkg.identifier}
                style={[styles.packageCard, selected?.identifier === pkg.identifier && styles.packageCardSelected]}
                onPress={() => setSelected(pkg)}
                activeOpacity={0.8}
              >
                <View>
                  <Text style={[styles.packageTitle, selected?.identifier === pkg.identifier && styles.packageTitleSelected]}>
                    {pkg.packageType === 'ANNUAL' ? 'Årlig' : pkg.packageType === 'MONTHLY' ? 'Månedlig' : pkg.product.title}
                  </Text>
                  {pkg.packageType === 'ANNUAL' && (
                    <Text style={styles.packageBadge}>Spar 40%</Text>
                  )}
                </View>
                <Text style={[styles.packagePrice, selected?.identifier === pkg.identifier && styles.packagePriceSelected]}>
                  {pkg.product.priceString}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Kjøp-knapp */}
        <TouchableOpacity
          style={[styles.button, purchasing && styles.buttonDisabled]}
          onPress={handlePurchase}
          disabled={purchasing || !selected}
          activeOpacity={0.9}
        >
          {purchasing ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>
              {packages.length === 0 ? 'Ikke tilgjengelig' : 'Start Premium'}
            </Text>
          )}
        </TouchableOpacity>

        {/* Gjenopprett */}
        <TouchableOpacity onPress={handleRestore} disabled={purchasing}>
          <Text style={styles.restoreText}>Gjenopprett kjøp</Text>
        </TouchableOpacity>

        <Text style={styles.legalText}>
          Abonnementet fornyes automatisk. Avbryt når som helst i App Store.
        </Text>

      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    paddingTop: 8,
    paddingBottom: 16,
    alignItems: 'flex-end',
  },
  closeText: {
    fontSize: 15,
    color: '#999',
  },
  hero: {
    marginBottom: 24,
  },
  heroLabel: {
    fontSize: 11,
    color: '#999',
    letterSpacing: 2,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: '600',
    color: '#1a1a1a',
    letterSpacing: -1,
    lineHeight: 42,
    marginBottom: 10,
  },
  heroSub: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    fontWeight: '300',
  },
  featuresCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1a1a1a',
  },
  featureText: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '300',
  },
  noPackageCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  noPackageText: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  packagesContainer: {
    gap: 10,
    marginBottom: 16,
  },
  packageCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 14,
    padding: 18,
  },
  packageCardSelected: {
    borderColor: '#1a1a1a',
    backgroundColor: '#1a1a1a',
  },
  packageTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  packageTitleSelected: {
    color: '#ffffff',
  },
  packageBadge: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  packagePrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    letterSpacing: -0.5,
  },
  packagePriceSelected: {
    color: '#ffffff',
  },
  button: {
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  restoreText: {
    textAlign: 'center',
    fontSize: 13,
    color: '#999',
    marginBottom: 12,
  },
  legalText: {
    textAlign: 'center',
    fontSize: 11,
    color: '#bbb',
    lineHeight: 16,
    marginBottom: 16,
  },
})