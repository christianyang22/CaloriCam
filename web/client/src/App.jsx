import { useState, useEffect, useRef } from 'react'
import { Sun, Moon, Camera, RotateCcw, ArrowRight, Info, AlertTriangle } from 'lucide-react'
import { ImageUploader } from './components/ImageUploader'

const PALETA_COLORES = [
  "#10b981", "#f59e0b", "#3b82f6", "#ef4444", 
  "#8b5cf6", "#14b8a6", "#f97316", "#ec4899"
]

function App() {
  const [isDarkMode, setIsDarkMode] = useState(true) 
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)
  const [analysisResult, setAnalysisResult] = useState(null)

  const imageRef = useRef(null)
  const [imgOriginalSize, setImgOriginalSize] = useState({ width: 0, height: 0 })
  
  const abortControllerRef = useRef(null)
  const [devToken, setDevToken] = useState(null)

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])

  /*
    precarga del token al abrir la web.
    Se conecta con el backend local para obtener un token de desarrollo.
    Si el usuario no existe, primero lo registra de forma automática y luego inicia sesión.
  */
  useEffect(() => {
    const fetchDevToken = async () => {
      const baseUrl = import.meta.env.DEV ? "http://127.0.0.1:8000" : ""
      const headers = { 
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        /* permite saltar la pantalla de advertencia cuando se usan túneles como localtunnel o ngrok. */
        'Bypass-Tunnel-Reminder': 'true' 
      }

      try {
        let res = await fetch(`${baseUrl}/login`, {
          method: 'POST', headers,
          body: JSON.stringify({ email: "dev@caloricam.com", password: "DevPassword123!" })
        })

        if (!res.ok) {
          await fetch(`${baseUrl}/registro`, {
            method: 'POST', headers,
            body: JSON.stringify({ nombre: "Modo Desarrollador", email: "dev@caloricam.com", password: "DevPassword123!", terminos_aceptados: true })
          })
          res = await fetch(`${baseUrl}/login`, {
            method: 'POST', headers,
            body: JSON.stringify({ email: "dev@caloricam.com", password: "DevPassword123!" })
          })
        }

        const data = await res.json()
        if (data.token) setDevToken(data.token)
      } catch (error) {
        console.error("Error inicial conectando con el backend:", error)
      }
    }
    
    fetchDevToken()
  }, [])

  const toggleTheme = () => setIsDarkMode(!isDarkMode)

  const handleImageSelected = (file) => {
    handleReset()
    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const handleImageLoad = (e) => {
    setImgOriginalSize({
      width: e.target.naturalWidth,
      height: e.target.naturalHeight
    })
  }

  const handleReset = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setSelectedFile(null)
    setPreviewUrl(null)
    setAnalysisResult(null)
    setErrorMsg(null)
    setLoading(false)
  }

  const handleAnalyze = async () => {
    if (!selectedFile) return
    setLoading(true)
    setErrorMsg(null)

    abortControllerRef.current = new AbortController()

    const API_URL = import.meta.env.DEV ? "http://127.0.0.1:8000/analizar_plato" : "/analizar_plato"
    const baseUrl = import.meta.env.DEV ? "http://127.0.0.1:8000" : ""

    /*
      función auxiliar que prepara y envía la imagen.
      Construye el formdata y configura las cabeceras necesarias, inyectando el token de autorización si está disponible.
    */
    const performRequest = async (tokenToUse) => {
      const formData = new FormData()
      formData.append("imagen", selectedFile)
      
      const requestHeaders = {
        'ngrok-skip-browser-warning': 'true',
        'Bypass-Tunnel-Reminder': 'true'
      }
      if (tokenToUse) requestHeaders['Authorization'] = `Bearer ${tokenToUse}`

      return await fetch(API_URL, {
        method: "POST",
        headers: requestHeaders,
        body: formData,
        signal: abortControllerRef.current.signal
      })
    }

    try {
      /* primer intento de petición utilizando el token actual que tenemos guardado en memoria. */
      let response = await performRequest(devToken)

      /*
        mecanismo de recuperación automática.
        Si obtenemos un error 401 de no autorizado suele ser porque se ha reiniciado el backend y el token caducó.
        En ese caso hacemos un login silencioso de nuevo para obtener otro token fresco y reintentamos.
      */
      if (response.status === 401 || !devToken) {
        console.log("Token caducado (Backend reiniciado). Reautenticando silenciosamente...")
        
        const authHeaders = { 
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
          'Bypass-Tunnel-Reminder': 'true'
        }
        
        let loginRes = await fetch(`${baseUrl}/login`, {
          method: 'POST', headers: authHeaders,
          body: JSON.stringify({ email: "dev@caloricam.com", password: "DevPassword123!" })
        })

        if (!loginRes.ok) {
          await fetch(`${baseUrl}/registro`, {
            method: 'POST', headers: authHeaders,
            body: JSON.stringify({ nombre: "Modo Desarrollador", email: "dev@caloricam.com", password: "DevPassword123!", terminos_aceptados: true })
          })
          loginRes = await fetch(`${baseUrl}/login`, {
            method: 'POST', headers: authHeaders,
            body: JSON.stringify({ email: "dev@caloricam.com", password: "DevPassword123!" })
          })
        }

        const authData = await loginRes.json()
        if (authData.token) {
          setDevToken(authData.token)
          /* segundo intento de envío de la imagen pero esta vez usando el token nuevo. */
          response = await performRequest(authData.token)
        } else {
          throw new Error("Imposible autorizar la web.")
        }
      }

      if (!response.ok) {
        throw new Error(`El servidor respondió con error: ${response.status}`)
      }

      const data = await response.json()
      
      const nombresUnicos = [...new Set(data.detalles.map(d => d.ingrediente.toLowerCase()))]
      const mapaColores = {}
      nombresUnicos.forEach((nombre, index) => {
        mapaColores[nombre] = PALETA_COLORES[index % PALETA_COLORES.length]
      })

      const datosConColores = {
        ...data,
        detalles: data.detalles.map(item => ({
          ...item,
          colorAsignado: mapaColores[item.ingrediente.toLowerCase()]
        })),
        agrupados: (data.agrupados || []).map(item => ({
          ...item,
          colorAsignado: mapaColores[item.ingrediente.toLowerCase()]
        }))
      }

      setAnalysisResult(datosConColores)

    } catch (error) {
      if (error.name === 'AbortError') return
      console.error("Error en la conexión:", error)
      setErrorMsg("No se ha podido conectar con el servidor de inteligencia artificial. Verifica que fastapi esté corriendo.")
    } finally {
      if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
        setLoading(false)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100 flex flex-col transition-colors duration-300">
      
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer transition-opacity hover:opacity-80" onClick={handleReset}>
            <Camera className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <h1 className="text-xl font-semibold tracking-tight">CaloriCam <span className="text-xs text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md ml-2 border border-emerald-500/20">Modo DEV</span></h1>
          </div>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
            aria-label="Alternar tema"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </header>

      <main className="flex-grow max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center justify-start">
        
        {errorMsg && (
          <div className="w-full max-w-2xl mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-300">{errorMsg}</p>
          </div>
        )}

        {!previewUrl ? (
          <ImageUploader onImageSelected={handleImageSelected} />
        ) : (
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium">Inspección de Bounding Boxes</h2>
                <button
                  onClick={handleReset}
                  className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Cambiar
                </button>
              </div>

              <div className="relative w-full rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                <img
                  ref={imageRef}
                  src={previewUrl}
                  onLoad={handleImageLoad}
                  alt="Plato seleccionado"
                  className="max-h-[60vh] w-full object-contain"
                />

                {analysisResult && imgOriginalSize.width > 0 && analysisResult.detalles.map((item, index) => {
                  const [x1, y1, x2, y2] = item.coordenadas_caja;
                  const top = (y1 / imgOriginalSize.height) * 100;
                  const left = (x1 / imgOriginalSize.width) * 100;
                  const width = ((x2 - x1) / imgOriginalSize.width) * 100;
                  const height = ((y2 - y1) / imgOriginalSize.height) * 100;

                  return (
                    <div
                      key={`box-${index}`}
                      className="absolute border-2 transition-all"
                      style={{
                        top: `${top}%`, left: `${left}%`, width: `${width}%`, height: `${height}%`,
                        borderColor: item.colorAsignado, backgroundColor: `${item.colorAsignado}20`
                      }}
                    >
                      <span 
                        className="absolute -top-6 left-[-2px] px-2 py-0.5 text-xs font-bold text-white whitespace-nowrap rounded-t-sm"
                        style={{ backgroundColor: item.colorAsignado }}
                      >
                        {item.ingrediente.toUpperCase()}
                      </span>
                    </div>
                  )
                })}
              </div>

              {!analysisResult && (
                <button
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Procesando con YOLO & EfficientNet...
                    </span>
                  ) : (
                    <><span>Analizar arquitectura de imagen</span><ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              )}
            </div>

            {analysisResult && (
              <div className="space-y-6">
                
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-medium mb-4">Resumen General</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Calorías Totales</p>
                      <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                        {parseFloat(Number(analysisResult.resumen?.calorias_totales_plato || 0).toFixed(2))} <span className="text-sm font-normal text-gray-600 dark:text-gray-300">kcal</span>
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Alimentos</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-baseline gap-1">
                        {analysisResult.resumen?.clases_unicas || 0} 
                        <span className="text-sm font-normal text-gray-500 dark:text-gray-400">({analysisResult.resumen?.ingredientes_totales || 0} fragmentos)</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-medium mb-4">Métricas por Alimento</h3>
                  <div className="space-y-4">
                    {analysisResult.agrupados.map((item, index) => {
                      const macros = item.macronutrientes || { proteinas_g: 0, carbohidratos_g: 0, grasas_g: 0 };
                      
                      return (
                        <div key={`ing-${index}`} className="pb-4 border-b border-gray-100 dark:border-gray-700 last:border-0 last:pb-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span 
                              className="w-3 h-3 rounded-sm flex-shrink-0 shadow-sm"
                              style={{ backgroundColor: item.colorAsignado }}
                            ></span>
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 capitalize">
                              {item.ingrediente} <span className="text-sm font-normal text-gray-500 dark:text-gray-400">({parseFloat(Number(item.gramos_totales).toFixed(2))}g)</span>
                            </h4>
                          </div>
                          
                          <p className="text-sm text-gray-600 dark:text-gray-300 ml-5">
                            <strong className="text-orange-500 dark:text-orange-400">{parseFloat(Number(item.calorias_totales).toFixed(2))} kcal</strong>
                            <span className="mx-2 text-gray-300 dark:text-gray-600">|</span>
                            P: {parseFloat(Number(macros.proteinas_g).toFixed(2))}g
                            <span className="mx-2 text-gray-300 dark:text-gray-600">|</span>
                            C: {parseFloat(Number(macros.carbohidratos_g).toFixed(2))}g
                            <span className="mx-2 text-gray-300 dark:text-gray-600">|</span>
                            G: {parseFloat(Number(macros.grasas_g).toFixed(2))}g
                          </p>

                          {item.aviso && (
                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 ml-5 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                              {item.aviso}
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

      </main>

      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-6 mt-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-3 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-emerald-500/20">
            <Info className="w-5 h-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
            <p>
              <strong>Terminal de Pruebas (DEV).</strong> Interfaz destinada exclusivamente a comprobar el correcto dimensionamiento de las Bounding Boxes generadas por YOLOv11 y la posterior regresión de masas de EfficientNet-B0.
            </p>
          </div>
        </div>
      </footer>

    </div>
  )
}

export default App