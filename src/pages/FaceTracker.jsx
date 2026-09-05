import { useEffect, useRef } from "react";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

export default function FaceTracker({ onClose }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const faceLandmarkerRef = useRef(null);
    const lastVideoTimeRef = useRef(-1);
    const rafIdRef = useRef(null);

    const stopEverything = () => {
        if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
        streamRef.current?.getTracks().forEach(track => track.stop());
        streamRef.current = null;

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }

        faceLandmarkerRef.current?.close();
    };

    useEffect(() => {
        let cancelled = false;

        const init = async () => {
            const vision = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
            );

            const landmarker = await FaceLandmarker.createFromOptions(vision, {
                baseOptions: { modelAssetPath: "/models/face_landmarker.task" },
                runningMode: "VIDEO",
                numFaces: 1,
            });

            if (cancelled) { landmarker.close(); return; }
            faceLandmarkerRef.current = landmarker;

            const stream = await navigator.mediaDevices.getUserMedia({ video: true });

            if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }

            streamRef.current = stream;
            const video = videoRef.current;
            video.srcObject = stream;

            video.onloadedmetadata = async () => {
                await video.play();
                detectLoop();
            };
        };

        const detectLoop = () => {
            const video = videoRef.current;
            const landmarker = faceLandmarkerRef.current;
            if (!video || !landmarker) return;

            if (video.currentTime !== lastVideoTimeRef.current) {
                const result = landmarker.detectForVideo(video, performance.now());
                lastVideoTimeRef.current = video.currentTime;

                if (result.faceLandmarks?.length > 0) {
                    const landmarks = result.faceLandmarks[0];
                    const canvas = canvasRef.current;
                    const ctx = canvas.getContext("2d");
                    canvas.width = video.offsetWidth;
                    canvas.height = video.offsetHeight;
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    for (let i = 0; i < landmarks.length; i++) {
                        const x = landmarks[i].x * canvas.width;
                        const y = landmarks[i].y * canvas.height;
                        ctx.fillStyle = "white";
                        ctx.fillRect(x, y, 2, 2);
                    }
                }
            }
            rafIdRef.current = requestAnimationFrame(detectLoop);
        };

        init();

        return () => {
            cancelled = true;
            stopEverything();
        };
    }, []);

    return (
        <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
            <video ref={videoRef} autoPlay playsInline
                style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)", position: "absolute", top: 0, left: 0 }} />
            <canvas ref={canvasRef}
                style={{ width: "100%", height: "100%", transform: "scaleX(-1)", position: "absolute", top: 0, left: 0, pointerEvents: "none" }} />

            <button
                onClick={() => {
                    stopEverything();
                    onClose?.();
                }}
                style={{ position: "absolute", top: 16, right: 16, color: "white", zIndex: 10, background: "rgba(0,0,0,0.5)", borderRadius: "9999px", padding: "8px", border: "none", cursor: "pointer" }}
            >
                ✕
            </button>
        </div>
    );
}