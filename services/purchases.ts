import { Platform } from 'react-native'
import Purchases, { LOG_LEVEL, PurchasesPackage } from 'react-native-purchases'

const API_KEY_IOS = 'appl_JqSyKsQQRltvFktZmmyeZwwTYNh'
const API_KEY_ANDROID = 'test_CFgygwzianFqudNQvaOMqdfvFXT' // Bytt ut når du har Android-nøkkel

export function initializePurchases() {
  Purchases.setLogLevel(LOG_LEVEL.VERBOSE)
  if (Platform.OS === 'ios') {
    Purchases.configure({ apiKey: API_KEY_IOS })
  } else {
    Purchases.configure({ apiKey: API_KEY_ANDROID })
  }
}

export async function getOfferings() {
  try {
    const offerings = await Purchases.getOfferings()
    return offerings.current
  } catch (e) {
    console.error('Kunne ikke hente offerings:', e)
    return null
  }
}

export async function purchasePremium(pkg: PurchasesPackage) {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg)
    return isPremium(customerInfo)
  } catch (e: any) {
    if (!e.userCancelled) throw e
    return false
  }
}

export async function restorePurchases() {
  try {
    const customerInfo = await Purchases.restorePurchases()
    return isPremium(customerInfo)
  } catch (e) {
    console.error('Kunne ikke gjenopprette kjøp:', e)
    return false
  }
}

export async function checkPremiumStatus(): Promise<boolean> {
  try {
    const customerInfo = await Purchases.getCustomerInfo()
    return isPremium(customerInfo)
  } catch (e) {
    return false
  }
}

function isPremium(customerInfo: any): boolean {
  return typeof customerInfo.entitlements.active['premium'] !== 'undefined'
}