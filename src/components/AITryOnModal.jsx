import { useEffect, useRef, useState } from 'react';
import supabase from '../utils/supabase';

// Selfie -> AI-generated "you, wearing this cap" photo. Unlike the live AR
// Try It On (real-time 3D model tracked to your face), this sends one still
// photo to the ai-tryon edge function, which sends it -- with a single fixed
// prompt it always uses, never typed by the customer -- to an image model
// and gets back a photorealistic composite.
export default function AITryOnModal({ product, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // 'camera' | 'preview' | 'loading' | 'result' | 'error'
  const [stage, setStage] = useState('camera');
  const [photo, setPhoto] = useState(null); // captured selfie, data URL
  const [resultImage, setResultImage] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      .then(stream => {
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      })
      .catch(() => {
        if (!cancelled) { setError("Couldn't access your camera. Please allow camera access and try again."); setStage('error'); }
      });
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  const capture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    // Flip horizontally so the captured photo matches the mirrored preview
    // the customer was just looking at, instead of coming out reversed.
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    setPhoto(canvas.toDataURL('image/jpeg', 0.9));
    stopCamera();
    setStage('preview');
  };

  const retake = async () => {
    setPhoto(null);
    setStage('camera');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch {
      setError("Couldn't access your camera. Please allow camera access and try again.");
      setStage('error');
    }
  };

  const generate = async () => {
    setStage('loading');
    setError('');
    const { data, error: fnError } = await supabase.functions.invoke('ai-tryon', {
      body: { selfie: photo, product_id: String(product.id) },
    });
    if (fnError) {
      let message = "We couldn't generate that image. Please try again.";
      if (fnError.context && typeof fnError.context.json === 'function') {
        try {
          const payload = await fnError.context.json();
          if (payload?.error) message = payload.error;
        } catch { /* keep generic message */ }
      }
      setError(message);
      setStage('error');
      return;
    }
    setResultImage(data.image);
    setStage('result');
  };

  const download = () => {
    const a = document.createElement('a');
    a.href = resultImage;
    a.download = `onlycaps-tryon-${product.product_id || product.id}.jpg`;
    a.click();
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-70 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl max-w-md w-full overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close AI try on"
          className="absolute top-3 right-3 z-10 bg-black/50 text-white rounded-full p-2 border-none cursor-pointer"
        >
          ✕
        </button>

        <div className="relative bg-black aspect-[3/4] flex items-center justify-center">
          {stage === 'camera' && (
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
          )}
          {(stage === 'preview' || stage === 'loading') && photo && (
            <img src={photo} alt="Your selfie" className="w-full h-full object-cover" />
          )}
          {stage === 'result' && resultImage && (
            <img src={resultImage} alt={`You wearing ${product.full_name || product.name}`} className="w-full h-full object-cover" />
          )}
          {stage === 'loading' && (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3">
              <div className="try-on-spinner" />
              <p className="text-white text-sm font-body">Generating your look…</p>
            </div>
          )}
          {stage === 'error' && (
            <div className="p-8 text-center">
              <p className="text-white text-sm">{error}</p>
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className="p-5 space-y-3">
          <p className="font-bold text-gray-900 text-sm text-center">{product.full_name || product.name}</p>

          {stage === 'camera' && (
            <button onClick={capture} className="w-full bg-gray-900 text-white py-3.5 rounded-full font-bold text-sm hover:bg-black transition-colors border-none cursor-pointer">
              Take Selfie
            </button>
          )}

          {stage === 'preview' && (
            <div className="flex gap-3">
              <button onClick={retake} className="flex-1 border-2 border-gray-300 text-gray-900 py-3 rounded-full font-bold text-sm hover:border-gray-900 transition-colors cursor-pointer">
                Retake
              </button>
              <button onClick={generate} className="flex-1 bg-[#00BFFF] text-black py-3 rounded-full font-bold text-sm hover:bg-[#00a8e0] transition-colors border-none cursor-pointer">
                Generate
              </button>
            </div>
          )}

          {stage === 'result' && (
            <div className="flex gap-3">
              <button onClick={retake} className="flex-1 border-2 border-gray-300 text-gray-900 py-3 rounded-full font-bold text-sm hover:border-gray-900 transition-colors cursor-pointer">
                Try Again
              </button>
              <button onClick={download} className="flex-1 bg-gray-900 text-white py-3 rounded-full font-bold text-sm hover:bg-black transition-colors border-none cursor-pointer">
                Save Photo
              </button>
            </div>
          )}

          {stage === 'error' && (
            <button onClick={retake} className="w-full bg-gray-900 text-white py-3.5 rounded-full font-bold text-sm hover:bg-black transition-colors border-none cursor-pointer">
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
