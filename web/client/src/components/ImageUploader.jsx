import { useState, useRef } from 'react'
import { Upload, Camera, AlertCircle } from 'lucide-react'
import { WebcamCapture } from './WebcamCapture'

export function ImageUploader({ onImageSelected }) {
  const [dragOver, setDragOver] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const fileInputRef = useRef(null)

  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
  const MAX_SIZE_MB = 10

  /*
    función de validación en el lado del cliente.
    Restringe el peso máximo y la extensión del archivo para evitar procesamientos pesados y asegurar la compatibilidad con la api.
    Acepta formatos estándar como jpg, png o webp.
  */
  const validateAndPassFile = (file) => {
    setErrorMsg('')
    if (!file) return

    if (!ALLOWED_TYPES.includes(file.type)) {
      setErrorMsg('Formato no compatible. Por favor, selecciona una imagen JPG, PNG o WEBP.')
      return
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setErrorMsg(`La imagen es demasiado grande. El límite es de ${MAX_SIZE_MB}MB.`)
      return
    }

    setIsCameraOpen(false)
    onImageSelected(file)
  }

  /*
    gestor del evento de arrastrar y soltar.
    Anula el comportamiento nativo del navegador para capturar el archivo soltado directamente en el estado de la aplicación.
  */
  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndPassFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndPassFile(e.target.files[0])
    }
  }

  /*
    renderizado condicional de la cámara en vivo.
    Monta el componente webrtc que accede a la lente del dispositivo cuando el usuario lo solicita.
  */
  if (isCameraOpen) {
    return (
      <WebcamCapture 
        onCapture={validateAndPassFile} 
        onCancel={() => setIsCameraOpen(false)} 
      />
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center space-y-4 ${
          dragOver
            ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
            : 'border-gray-300 dark:border-gray-700 hover:border-emerald-500 dark:hover:border-emerald-500 bg-white dark:bg-gray-800 shadow-sm'
        }`}
      >
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700/60 rounded-full flex items-center justify-center">
          <Upload className="w-8 h-8 text-gray-400 dark:text-gray-400" />
        </div>
        
        <div className="space-y-1">
          <h2 className="text-lg font-medium">Sube o arrastra una fotografía de tu plato</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Formatos soportados: JPG, PNG, WEBP (Máx. 10MB)
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              fileInputRef.current?.click()
            }}
            className="px-4 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            Seleccionar archivo
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              /* activa la cámara en el navegador. */
              setIsCameraOpen(true) 
            }}
            className="px-4 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <Camera className="w-4 h-4" />
            Hacer foto
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg, image/png, image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {errorMsg && (
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 p-3 rounded-lg border border-red-200 dark:border-red-900/50">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{errorMsg}</p>
        </div>
      )}
    </div>
  )
}