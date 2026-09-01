import { useRef, useState, useEffect } from 'react'
import { Camera, X, AlertCircle } from 'lucide-react'

export function WebcamCapture({ onCapture, onCancel }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    let stream = null;

    const startCamera = async () => {
      try {
        /*
          solicitud de acceso al flujo multimedia del dispositivo.
          Se prioriza la cámara trasera en dispositivos móviles mediante facingMode para encuadrar mejor los platos.
        */
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false
        })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      } catch (err) {
        console.error("Error accediendo a la cámara:", err)
        setErrorMsg('No se pudo acceder a la cámara. Verifica los permisos del navegador.')
      }
    }

    startCamera()

    /*
      función de limpieza que se ejecuta al desmontar el componente.
      Detiene todos los canales activos del flujo de video para liberar el hardware de la cámara.
    */
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return
    
    const video = videoRef.current
    const canvas = canvasRef.current
    
    /*
      sincronización de las dimensiones espaciales.
      Ajustamos el canvas a la resolución nativa real del video para evitar capturas deformadas.
    */
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    
    /*
      extracción del fotograma actual.
      Convertimos el contenido del canvas a un archivo binario jpeg con alta calidad para enviarlo a la api.
    */
    canvas.toBlob((blob) => {
      if (!blob) {
        setErrorMsg('Error procesando la captura.')
        return
      }
      const file = new File([blob], "captura_caloricam.jpg", { type: "image/jpeg" })
      onCapture(file)
    }, 'image/jpeg', 0.95)
  }

  return (
    <div className="w-full max-w-2xl mx-auto bg-gray-900 rounded-xl overflow-hidden shadow-lg relative aspect-video flex flex-col items-center justify-center">
      
      {errorMsg ? (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-4 rounded-lg m-4">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{errorMsg}</p>
        </div>
      ) : (
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className="w-full h-full object-cover"
        />
      )}

      {/* elemento canvas invisible utilizado exclusivamente como buffer temporal para leer los píxeles del video. */}
      <canvas ref={canvasRef} className="hidden" />
      
      {/* botonera superpuesta al flujo visual del componente. */}
      <div className="absolute bottom-6 w-full flex justify-center items-center gap-8">
        <button
          onClick={onCancel}
          className="p-3 rounded-full bg-gray-800/80 hover:bg-gray-700/90 text-white backdrop-blur-sm transition-colors focus:outline-none focus:ring-2 focus:ring-white"
          title="Cancelar"
        >
          <X className="w-6 h-6" />
        </button>

        <button
          onClick={takePhoto}
          disabled={!!errorMsg}
          className="p-4 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white border-4 border-white/30 shadow-xl transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          title="Capturar foto"
        >
          <Camera className="w-8 h-8" />
        </button>
      </div>
    </div>
  )
}