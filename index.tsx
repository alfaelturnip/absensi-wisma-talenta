
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Camera, 
  MapPin, 
  Clock, 
  User, 
  ArrowLeft, 
  CheckCircle2, 
  LogIn, 
  LogOut,
  Loader2,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  Lock
} from 'lucide-react';

// --- Configuration ---
const EMPLOYEES = [
  "Muhammad Faqi",
  "Imelda Reysya",
  "Salia",
  "Sri Lestari",
  "Lina",
  "Dina Agnesia"
  "Rahmawati"
].sort((a, b) => a.localeCompare(b));

// --- Types ---
type AttendanceType = 'masuk' | 'keluar' | null;
type Step = 'selection' | 'form' | 'success';

interface LocationState {
  lat: number | null;
  lng: number | null;
  address: string | null;
  error: string | null;
}

// --- Helper Functions ---
const fetchAddress = async (lat: number, lng: number): Promise<string> => {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`, {
      headers: { 'Accept-Language': 'id' }
    });
    const data = await response.json();
    return data.display_name || `${lat}, ${lng}`;
  } catch (e) {
    return `${lat}, ${lng}`;
  }
};

const checkAlreadySubmitted = (name: string, type: AttendanceType): boolean => {
  if (!name || !type) return false;
  const today = new Date().toLocaleDateString('id-ID');
  const record = localStorage.getItem(`attendance_${name}_${today}_${type}`);
  return record === 'true';
};

// --- Sub-Components ---

const SelectionView = ({ 
  onSelect 
}: { 
  onSelect: (type: AttendanceType) => void
}) => (
  <div className="flex flex-col space-y-6 animate-in fade-in duration-500 pt-10">
    <div className="text-center mb-12">
      <div className="inline-block p-4 bg-blue-600 rounded-3xl mb-4 shadow-lg shadow-blue-100">
        <Clock className="text-white" size={32} />
      </div>
      <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight leading-tight">Wisma Talenta<br/>Jakarta</h2>
    </div>
    
    <div className="grid grid-cols-1 gap-5">
      <button 
        onClick={() => onSelect('masuk')}
        className="group relative overflow-hidden bg-white border-2 border-emerald-100 p-8 rounded-[2rem] shadow-sm hover:shadow-xl hover:border-emerald-500 transition-all text-left active:scale-[0.98]"
      >
        <div className="flex items-center justify-between">
          <div>
            <span className="text-emerald-600 font-black text-2xl block">Absen Masuk</span>
          </div>
          <div className="bg-emerald-50 p-4 rounded-2xl text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-inner">
            <LogIn size={28} />
          </div>
        </div>
      </button>

      <button 
        onClick={() => onSelect('keluar')}
        className="group relative overflow-hidden bg-white border-2 border-rose-100 p-8 rounded-[2rem] shadow-sm hover:shadow-xl hover:border-rose-500 transition-all text-left active:scale-[0.98]"
      >
        <div className="flex items-center justify-between">
          <div>
            <span className="text-rose-600 font-black text-2xl block">Absen Keluar</span>
          </div>
          <div className="bg-rose-50 p-4 rounded-2xl text-rose-600 group-hover:bg-rose-500 group-hover:text-white transition-all shadow-inner">
            <LogOut size={28} />
          </div>
        </div>
      </button>
    </div>
  </div>
);

const FormView = ({ 
  attendanceType, 
  onBack, 
  onSubmit, 
  employeeName, 
  setEmployeeName, 
  isCapturing, 
  capturedImage, 
  takePhoto, 
  location, 
  getLocation, 
  isLoading, 
  videoRef, 
  canvasRef,
  retryCamera
}: any) => {
  const isAlreadySubmitted = useMemo(() => 
    checkAlreadySubmitted(employeeName, attendanceType), 
  [employeeName, attendanceType]);

  const isDisabled = isLoading || !employeeName || !capturedImage || !location.lat || isAlreadySubmitted;

  return (
    <div className="space-y-6 animate-in slide-in-from-right duration-300">
      <button 
        onClick={onBack}
        className="flex items-center text-slate-400 hover:text-blue-600 transition-all text-sm font-bold"
      >
        <ArrowLeft size={16} className="mr-2" /> Kembali
      </button>

      <div className={`p-6 rounded-[2rem] text-white font-black flex items-center justify-between shadow-2xl ${attendanceType === 'masuk' ? 'bg-emerald-500 shadow-emerald-100' : 'bg-rose-500 shadow-rose-100'}`}>
        <div className="flex flex-col">
          <span className="text-xs opacity-80 uppercase tracking-widest font-bold">Status Absen</span>
          <span className="text-xl">{attendanceType === 'masuk' ? 'MASUK' : 'KELUAR'}</span>
        </div>
        <div className="bg-white/20 p-3 rounded-full">
          {attendanceType === 'masuk' ? <LogIn size={24} /> : <LogOut size={24} />}
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-6 bg-white p-6 rounded-[2rem] border border-slate-50 shadow-sm">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center ml-1">
            <User size={12} className="mr-2 text-blue-500" /> Nama Karyawan
          </label>
          <div className="relative">
            <select 
              required
              className={`w-full px-5 py-4 rounded-2xl border-2 focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 outline-none transition-all text-slate-700 font-bold appearance-none cursor-pointer ${isAlreadySubmitted ? 'bg-red-50 border-red-200' : 'bg-slate-50/50 border-slate-100'}`}
              value={employeeName}
              onChange={(e) => setEmployeeName(e.target.value)}
            >
              <option value="" disabled>Pilih nama anda...</option>
              {EMPLOYEES.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <ChevronDown size={18} />
            </div>
          </div>
          {isAlreadySubmitted && (
            <p className="text-[10px] text-red-500 font-bold flex items-center mt-1 ml-1 animate-pulse">
              <AlertCircle size={10} className="mr-1" /> Anda sudah absen {attendanceType} hari ini.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center ml-1">
            <Camera size={12} className="mr-2 text-blue-500" /> Foto Selfie
          </label>
          
          <div className="relative aspect-square bg-slate-100 rounded-[2rem] overflow-hidden border-4 border-white shadow-inner">
            {isCapturing && (
              <div className="absolute inset-0">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-6 left-0 right-0 flex justify-center">
                  <button 
                    type="button"
                    onClick={takePhoto}
                    className="w-16 h-16 bg-white rounded-full border-4 border-blue-100 flex items-center justify-center shadow-2xl transform active:scale-90 transition-all"
                  >
                    <div className="w-12 h-12 bg-blue-600 rounded-full shadow-inner" />
                  </button>
                </div>
              </div>
            )}

            {capturedImage && (
              <div className="absolute inset-0 animate-in zoom-in duration-300">
                <img src={capturedImage} className="w-full h-full object-cover" alt="Selfie" />
                {!isAlreadySubmitted && (
                  <button 
                    type="button"
                    onClick={retryCamera}
                    className="absolute top-4 right-4 bg-white/90 backdrop-blur px-4 py-2 rounded-full text-blue-600 font-black text-[10px] shadow-lg flex items-center border border-blue-50"
                  >
                    <RefreshCw size={12} className="mr-2" /> Ambil Ulang
                  </button>
                )}
              </div>
            )}

            {!isCapturing && !capturedImage && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300">
                <Loader2 className="animate-spin mb-2" size={32} />
                <p className="text-[10px] font-black uppercase tracking-widest">Memulai Kamera...</p>
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center">
              <MapPin size={10} className="mr-1 text-red-500" /> Lokasi (Nama Jalan)
            </label>
            <button 
              type="button"
              onClick={getLocation}
              className="text-[9px] text-blue-600 font-black bg-blue-50 px-3 py-1 rounded-full"
            >
              REFRESH
            </button>
          </div>
          
          {location.lat ? (
            <div className="text-[11px] font-bold text-slate-700 bg-white p-3 rounded-xl border border-slate-100 shadow-sm leading-relaxed">
              {location.address || "Mendeteksi alamat..."}
            </div>
          ) : (
            <div className="flex items-center text-[11px] text-blue-400 font-bold animate-pulse px-2">
              {location.error ? (
                <div className="text-red-500 flex items-center font-black">
                  <AlertCircle size={10} className="mr-2" />
                  {location.error}
                </div>
              ) : (
                <>
                  <Loader2 size={10} className="mr-2 animate-spin" /> 
                  Mencari GPS...
                </>
              )}
            </div>
          )}
        </div>

        <button 
          disabled={isDisabled}
          type="submit"
          className={`w-full py-5 rounded-2xl font-black text-lg shadow-2xl transition-all flex items-center justify-center space-x-3
            ${isDisabled 
              ? 'bg-slate-100 text-slate-300 cursor-not-allowed' 
              : 'bg-slate-900 text-white hover:bg-slate-800 active:scale-95 shadow-slate-200'}`}
        >
          {isLoading ? (
            <Loader2 className="animate-spin" size={20} />
          ) : isAlreadySubmitted ? (
            <>
              <Lock size={18} className="mr-2" />
              <span className="tracking-widest uppercase">Sudah Absen</span>
            </>
          ) : (
            <span className="tracking-widest uppercase">Kirim Absensi</span>
          )}
        </button>
      </form>
    </div>
  );
};

const SuccessView = ({ 
  employeeName, 
  attendanceType, 
  submissionTime, 
  onReset 
}: { 
  employeeName: string, 
  attendanceType: AttendanceType, 
  submissionTime: Date | null, 
  onReset: () => void 
}) => {
  const formattedDate = submissionTime ? submissionTime.toLocaleDateString('id-ID', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  }) : '';
  
  const formattedTime = submissionTime ? submissionTime.toLocaleTimeString('id-ID', { 
    hour: '2-digit', 
    minute: '2-digit'
  }) : '';

  return (
    <div className="text-center py-10 space-y-8 animate-in zoom-in duration-500">
      <div className="relative inline-block">
        <div className="absolute inset-0 bg-emerald-100 rounded-full scale-[2] animate-ping opacity-20" />
        <div className="bg-emerald-500 text-white p-8 rounded-full relative shadow-2xl shadow-emerald-200">
          <CheckCircle2 size={64} />
        </div>
      </div>
      
      <div className="space-y-3 px-4">
        <h2 className="text-3xl font-black text-slate-800 tracking-tighter">Berhasil!</h2>
        <p className="text-slate-500 font-bold text-lg leading-relaxed italic">
          {attendanceType === 'masuk' ? "Selamat bekerja! ✨" : "Terima kasih atas hari ini! 🏠"}
        </p>
      </div>

      <div className="bg-white rounded-[2.5rem] p-8 text-left border border-slate-100 max-w-sm mx-auto shadow-xl space-y-5">
        <div className="flex justify-between items-center border-b border-slate-50 pb-4">
          <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Nama</span>
          <span className="font-black text-slate-900">{employeeName}</span>
        </div>
        
        <div className="space-y-2 border-b border-slate-50 pb-4">
          <div className="flex justify-between items-center">
            <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Tgl</span>
            <span className="font-bold text-slate-700 text-xs">{formattedDate}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Jam</span>
            <span className="font-black text-blue-600 text-2xl">{formattedTime}</span>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Status</span>
          <span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${attendanceType === 'masuk' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
            {attendanceType === 'masuk' ? 'MASUK' : 'KELUAR'}
          </span>
        </div>
      </div>

      <button 
        onClick={onReset}
        className="w-full max-w-sm py-5 bg-blue-600 text-white font-black rounded-2xl shadow-2xl hover:bg-blue-700 active:scale-95 transition-all uppercase tracking-widest"
      >
        Tutup
      </button>
    </div>
  );
};

const AttendanceApp = () => {
  const [step, setStep] = useState<Step>('selection');
  const [attendanceType, setAttendanceType] = useState<AttendanceType>(null);
  const [employeeName, setEmployeeName] = useState('');
  const [submissionTime, setSubmissionTime] = useState<Date | null>(null);
  const [location, setLocation] = useState<LocationState>({ lat: null, lng: null, address: null, error: null });
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbxRJFqlKSIt9zA-tNM1xYHlx-MObhPJWtxkbH39abEiFRUsGzyXUCEhFOXQMSlFqR0d/exec';

  useEffect(() => {
    if (step === 'form') {
      startCamera();
      getLocation();
    } else {
      stopCamera();
    }
  }, [step]);

  const getLocation = () => {
    setLocation(prev => ({ ...prev, lat: null, lng: null, address: null, error: null }));
    if (!navigator.geolocation) {
      setLocation(prev => ({ ...prev, error: 'GPS Tidak Didukung' }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocation(prev => ({ ...prev, lat: latitude, lng: longitude, error: null }));
        const address = await fetchAddress(latitude, longitude);
        setLocation(prev => ({ ...prev, address }));
      },
      (error) => {
        setLocation(prev => ({ ...prev, error: 'Izinkan Akses Lokasi' }));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const startCamera = async () => {
    setCapturedImage(null);
    setIsCapturing(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } }, 
        audio: false 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setIsCapturing(false);
      alert("Kamera tidak dapat diakses.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCapturing(false);
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        const maxSize = 400;
        let width = videoRef.current.videoWidth;
        let height = videoRef.current.videoHeight;
        
        if (width > height) {
          if (width > maxSize) {
            height *= maxSize / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width *= maxSize / height;
            height = maxSize;
          }
        }

        canvasRef.current.width = width;
        canvasRef.current.height = height;
        context.drawImage(videoRef.current, 0, 0, width, height);
        
        const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.7);
        setCapturedImage(dataUrl);
        stopCamera();
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeName || !capturedImage || !location.lat) return;
    
    // Final Check before sending
    if (checkAlreadySubmitted(employeeName, attendanceType)) {
      alert("Maaf, Anda sudah melakukan absensi ini hari ini.");
      return;
    }

    setIsLoading(true);
    const now = new Date();

    try {
      const payload = {
        tanggal: now.toLocaleDateString('id-ID'),
        jam: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }),
        nama: employeeName,
        tipe_absen: attendanceType === 'masuk' ? 'MASUK' : 'KELUAR',
        lokasi: location.address || `${location.lat},${location.lng}`,
        foto_selfie: capturedImage.split(',')[1] 
      };

      await fetch(WEBHOOK_URL, {
        // Mode 'no-cors' digunakan untuk menghindari isu CORS pada Apps Script
        method: 'POST',
        mode: 'no-cors', 
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload)
      });
      
      // Simpan status absensi di HP karyawan agar tidak bisa kirim lagi hari ini
      const today = now.toLocaleDateString('id-ID');
      localStorage.setItem(`attendance_${employeeName}_${today}_${attendanceType}`, 'true');

      setSubmissionTime(now);
      setIsLoading(false);
      setStep('success');

    } catch (error) {
      setIsLoading(false);
      alert("Terjadi kesalahan koneksi. Silakan coba lagi.");
    }
  };

  const handleReset = () => {
    setStep('selection');
    setAttendanceType(null);
    setEmployeeName('');
    setCapturedImage(null);
    setSubmissionTime(null);
    setLocation({ lat: null, lng: null, address: null, error: null });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-white/90 backdrop-blur-xl px-6 py-6 flex items-center sticky top-0 z-20 border-b border-slate-100 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black shadow-lg">WT</div>
          <div>
            <h1 className="text-xs font-black text-slate-900 leading-none uppercase tracking-tighter">Wisma Talenta</h1>
            <p className="text-[9px] text-slate-400 font-bold tracking-[0.2em] uppercase mt-1">Jakarta</p>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-md mx-auto p-6 pb-20">
        {step === 'selection' && <SelectionView onSelect={(t) => { setAttendanceType(t); setStep('form'); }} />}
        {step === 'form' && (
          <FormView 
            attendanceType={attendanceType}
            onBack={() => setStep('selection')}
            onSubmit={handleSubmit}
            employeeName={employeeName}
            setEmployeeName={setEmployeeName}
            isCapturing={isCapturing}
            capturedImage={capturedImage}
            takePhoto={takePhoto}
            location={location}
            getLocation={getLocation}
            isLoading={isLoading}
            videoRef={videoRef}
            canvasRef={canvasRef}
            retryCamera={startCamera}
          />
        )}
        {step === 'success' && (
          <SuccessView 
            employeeName={employeeName}
            attendanceType={attendanceType}
            submissionTime={submissionTime}
            onReset={handleReset}
          />
        )}
      </main>

      <footer className="py-8 text-center bg-white border-t border-slate-100 mt-auto">
        <p className="text-slate-400 text-[9px] font-black tracking-[0.4em] uppercase">© 2026 Wisma Talenta Jakarta</p>
      </footer>
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<AttendanceApp />);
}
