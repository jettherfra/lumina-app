import { useState, useRef } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Image, SafeAreaView
} from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'

interface Props {
  onClose: () => void
  onPhotoTaken: (uri: string) => void
}

export default function CameraScreen({ onClose, onPhotoTaken }: Props) {
  const [permission, requestPermission] = useCameraPermissions()
  const [photo, setPhoto] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const cameraRef = useRef<CameraView>(null)

  if (!permission) {
    return <View style={styles.container} />
  }

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

  async function takePicture() {
    if (!cameraRef.current) return
    setLoading(true)
    try {
      const result = await cameraRef.current.takePictureAsync({ quality: 0.8 })
      if (result) setPhoto(result.uri)
    } catch (e) {
      console.error('Kunne ikke ta bilde', e)
    }
    setLoading(false)
  }

  if (photo) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: photo }} style={styles.preview} />
        <SafeAreaView style={styles.previewControls}>
          <Text style={styles.previewTitle}>Ser bildet bra ut?</Text>
          <TouchableOpacity style={styles.button} onPress={() => onPhotoTaken(photo)}>
            <Text style={styles.buttonText}>Bruk dette bildet</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.textButton} onPress={() => setPhoto(null)}>
            <Text style={styles.textButtonText}>Ta på nytt</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={{ flex: 1, width: '100%' }}>
        <CameraView style={styles.camera} facing="front" ref={cameraRef} />
        <View style={styles.overlay}>
          <View style={styles.faceGuide} />
          <Text style={styles.guideText}>
            Plasser ansiktet ditt i rammen. God belysning gir best resultat.
          </Text>
        </View>
      </View>

      <SafeAreaView style={styles.controls}>
        <TouchableOpacity style={styles.textButton} onPress={onClose}>
          <Text style={styles.textButtonWhite}>Avbryt</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.shutterButton}
          onPress={takePicture}
          disabled={loading}
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
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceGuide: {
    width: 240,
    height: 300,
    borderRadius: 120,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    borderStyle: 'dashed',
  },
  guideText: {
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: 24,
    paddingHorizontal: 48,
    fontSize: 13,
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