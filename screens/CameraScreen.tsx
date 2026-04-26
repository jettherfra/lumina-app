import { useState, useRef, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Image, SafeAreaView
} from 'react-native'
import { CameraView, useCameraPermissions, FaceDetectionResult } from 'expo-camera'
import * as ImageManipulator from 'expo-image-manipulator'
import * as Brightness from 'expo-brightness'

interface Props {
  onClose: () => void
  onPhotoTaken: (uri: string) => void
}

type LightStatus = 'ok' | 'too_dark' | 'too_bright' | null
type DistanceStatus = 'ok' | 'too_far' | 'too_close' | 'no_face' | null

async function checkLighting(uri: string): Promise<LightStatus> {
  try {
    const small = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 50, height: 50 } }],
      { base64: true, format: ImageManipulator.SaveFormat.JPEG, compress: 0.1 }
    )
    if (!small.base64) return 'ok'
    const base64 = small.base64
    let sum = 0
    let count = 0
    for (let i = 0; i < base64.length; i++) {
      sum += base64.charCodeAt(i)
      count++
    }
    const avg = sum / count
    if (avg < 80) return 'too_dark'
    if (avg > 115) return 'too_bright'
    return 'ok'
  } catch {
    return 'ok'
  }
}

export default function CameraScreen({ onClose, onPhotoTaken }: Props) {
  const [permission, requestPermission] = useCameraPermissions()
  const [photo, setPhoto] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [lightStatus, setLightStatus] = useState<LightStatus>(null)
  const [distanceStatus, setDistanceStatus] = useState<DistanceStatus>('no_face')
  const cameraRef = useRef<CameraView>(null)
  const originalBrightness = useRef<number>(1)

  // Skru opp skjermlysstyrke når kamera åpnes
  useEffect(() => {
    async function setBrightness() {
      try {
        const { status } = await Brightness.requestPermissionsAsync()
        if (status === 'granted') {
          originalBrightness.current = await Brightness.getBrightnessAsync()
          await Brightness.setBrightnessAsync(1)
        }
      } catch (e) {
        console.log('Brightness not available', e)
      }
    }
    setBrightness()
    return () => {
      Brightness.setBrightnessAsync(originalBrightness.current).catch(() => {})
    }
  }, [])

  if (!permission) return <View style={styles.container} />

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.permissionText}>
          Vi trenger tilgang til kameraet for å analysere huden din.
        </Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Gi tilgang til kamera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.textButton} onPress={onClose}>
          <Text style={styles.textButtonText}>Avbryt</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  function handleFacesDetected({ faces }: FaceDetectionResult) {
    if (!faces || faces.length === 0) {
      setDistanceStatus('no_face')
      return
    }
    const face = faces[0]
    const faceWidth = face.bounds.size.width
    // Juster disse verdiene etter testing
    if (faceWidth < 150) setDistanceStatus('too_far')
    else if (faceWidth > 280) setDistanceStatus('too_close')
    else setDistanceStatus('ok')
  }

  function getDistanceMessage() {
    switch (distanceStatus) {
      case 'no_face': return { text: 'Plasser ansiktet i rammen', color: 'rgba(255,255,255,0.7)' }
      case 'too_far': return { text: '📱 Hold telefonen nærmere', color: '#FFD60A' }
      case 'too_close': return { text: '↔️ Hold telefonen litt lenger unna', color: '#FFD60A' }
      case 'ok': return { text: '✓ Perfekt avstand', color: '#34C759' }
      default: return { text: 'Plasser ansiktet i rammen', color: 'rgba(255,255,255,0.7)' }
    }
  }

  async function takePicture() {
    if (!cameraRef.current) return
    setLoading(true)
    setLightStatus(null)
    try {
      const result = await cameraRef.current.takePictureAsync({ quality: 0.9 })
      if (result) {
        const light = await checkLighting(result.uri)
        setLightStatus(light)
        setPhoto(result.uri)
      }
    } catch (e) {
      console.error('Kunne ikke ta bilde', e)
    }
    setLoading(false)
  }

  if (photo) {
    const isLightingBad = lightStatus === 'too_dark' || lightStatus === 'too_bright'
    return (
      <View style={styles.container}>
        <Image source={{ uri: photo }} style={styles.preview} />
        {isLightingBad && (
          <View style={[
            styles.lightWarning,
            lightStatus === 'too_dark' ? styles.lightWarningDark : styles.lightWarningBright
          ]}>
            <Text style={styles.lightWarningIcon}>
              {lightStatus === 'too_dark' ? '🌙' : '☀️'}
            </Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.lightWarningTitle}>
                {lightStatus === 'too_dark' ? 'For mørkt' : 'For lyst'}
              </Text>
              <Text style={styles.lightWarningText}>
                {lightStatus === 'too_dark'
                  ? 'Skjermen lyser opp automatisk — prøv igjen.'
                  : 'Unngå direkte sollys eller sterkt baklys.'}
              </Text>
            </View>
          </View>
        )}
        <SafeAreaView style={styles.previewControls}>
          <Text style={styles.previewTitle}>
            {isLightingBad ? 'Dårlig belysning oppdaget' : 'Ser bildet bra ut?'}
          </Text>
          {isLightingBad ? (
            <>
              <TouchableOpacity style={styles.button} onPress={() => {
                setPhoto(null)
                setLightStatus(null)
              }}>
                <Text style={styles.buttonText}>Ta nytt bilde</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.textButton} onPress={() => onPhotoTaken(photo)}>
                <Text style={styles.textButtonText}>Bruk allikevel</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity style={styles.button} onPress={() => onPhotoTaken(photo)}>
                <Text style={styles.buttonText}>Bruk dette bildet ✓</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.textButton} onPress={() => {
                setPhoto(null)
                setLightStatus(null)
              }}>
                <Text style={styles.textButtonText}>Ta på nytt</Text>
              </TouchableOpacity>
            </>
          )}
        </SafeAreaView>
      </View>
    )
  }

  const distanceMsg = getDistanceMessage()
  const canTakePhoto = distanceStatus === 'ok'

  return (
    <View style={styles.container}>
      <View style={{ flex: 1, width: '100%' }}>
        <CameraView
          style={styles.camera}
          facing="front"
          ref={cameraRef}
          onFacesDetected={handleFacesDetected}
          faceDetectorSettings={{
            mode: 'fast',
            detectLandmarks: 'none',
            runClassifications: 'none',
            minDetectionInterval: 200,
            tracking: true,
          }}
        />
        <View style={styles.overlay}>
          {/* Avstandsindikator øverst */}
          <View style={styles.distanceBadge}>
            <Text style={[styles.distanceText, { color: distanceMsg.color }]}>
              {distanceMsg.text}
            </Text>
          </View>

          {/* Ansiktsramme — farge basert på status */}
          <View style={[
            styles.faceGuide,
            distanceStatus === 'ok' && styles.faceGuideOk,
            distanceStatus === 'too_far' && styles.faceGuideWarn,
            distanceStatus === 'too_close' && styles.faceGuideWarn,
          ]} />

          <Text style={styles.guideText}>
            Hold telefonen 20–30 cm fra ansiktet{'\n'}
            Skjermen lyser opp for bedre analyse
          </Text>
        </View>
      </View>

      <SafeAreaView style={styles.controls}>
        <TouchableOpacity style={styles.textButton} onPress={onClose}>
          <Text style={styles.textButtonWhite}>Avbryt</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.shutterButton, !canTakePhoto && styles.shutterButtonDisabled]}
          onPress={takePicture}
          disabled={loading || !canTakePhoto}
        >
          {loading
            ? <ActivityIndicator color="black" />
            : <View style={styles.shutterInner} />
          }
        </TouchableOpacity>
        <View style={{ width: 60 }} />
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  distanceBadge: {
    position: 'absolute',
    top: 60,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  distanceText: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  faceGuide: {
    width: 260,
    height: 320,
    borderRadius: 130,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    borderStyle: 'dashed',
  },
  faceGuideOk: {
    borderColor: '#34C759',
    borderStyle: 'solid',
  },
  faceGuideWarn: {
    borderColor: '#FFD60A',
    borderStyle: 'solid',
  },
  guideText: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginTop: 24,
    paddingHorizontal: 48,
    fontSize: 12,
    letterSpacing: 0.3,
    lineHeight: 20,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 32,
    paddingVertical: 24,
    backgroundColor: '#000',
  },
  shutterButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#000',
  },
  preview: {
    width: '100%',
    flex: 1,
  },
  previewControls: {
    width: '100%',
    padding: 24,
    backgroundColor: '#000',
    gap: 12,
  },
  previewTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  lightWarning: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  lightWarningDark: {
    backgroundColor: 'rgba(0,0,0,0.85)',
  },
  lightWarningBright: {
    backgroundColor: 'rgba(255,200,0,0.85)',
  },
  lightWarningIcon: { fontSize: 28 },
  lightWarningTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  lightWarningText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    lineHeight: 16,
  },
  button: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
  },
  buttonText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  textButton: {
    padding: 16,
    alignItems: 'center',
  },
  textButtonText: {
    color: '#999',
    fontSize: 15,
  },
  textButtonWhite: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 15,
  },
  permissionText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    paddingHorizontal: 32,
    marginBottom: 32,
    lineHeight: 24,
    fontWeight: '300',
  },
})