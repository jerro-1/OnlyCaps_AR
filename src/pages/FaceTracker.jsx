import { useEffect, useRef, useState } from "react";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

// The wasm runtime is served from our own origin (copied out of node_modules by
// scripts/copy-mediapipe.mjs) so it comes from the same CDN/cache as the site
// instead of a cold third-party request on every "Try it on".
const WASM_BASE = "/mediapipe";
const MODEL_URL = "/models/face_landmarker.task";

async function createLandmarker() {
    const vision = await FilesetResolver.forVisionTasks(WASM_BASE);
    const options = (delegate) => ({
        baseOptions: { modelAssetPath: MODEL_URL, delegate },
        runningMode: "VIDEO",
        numFaces: 1,
    });
    try {
        return await FaceLandmarker.createFromOptions(vision, options("GPU"));
    } catch {
        return await FaceLandmarker.createFromOptions(vision, options("CPU"));
    }
}

function getCamera() {
    return navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
    });
}

export default function FaceTracker({ onClose }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [status, setStatus] = useState("loading");
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        let cancelled = false;
        let landmarker = null;
        let stream = null;
        let rafId = null;
        let lastVideoTime = -1;

        const detectLoop = () => {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            if (cancelled || !video || !canvas) return;

            if (video.readyState >= 2 && video.currentTime !== lastVideoTime) {
                lastVideoTime = video.currentTime;
                const result = landmarker.detectForVideo(video, performance.now());

                const cw = video.clientWidth;
                const ch = video.clientHeight;
                if (canvas.width !== cw || canvas.height !== ch) {
                    canvas.width = cw;
                    canvas.height = ch;
                }
                const ctx = canvas.getContext("2d");
                ctx.clearRect(0, 0, cw, ch);

                const face = result.faceLandmarks?.[0];
                if (face) {
                    // The video is object-fit: cover, so map landmarks through the same crop
                    const scale = Math.max(cw / video.videoWidth, ch / video.videoHeight);
                    const offsetX = (cw - video.videoWidth * scale) / 2;
                    const offsetY = (ch - video.videoHeight * scale) / 2;
                    ctx.fillStyle = "white";
                    for (const p of face) {
                        ctx.fillRect(p.x * video.videoWidth * scale + offsetX, p.y * video.videoHeight * scale + offsetY, 2, 2);
                    }
                }
            }
            rafId = requestAnimationFrame(detectLoop);
        };

        const init = async () => {
            try {
                // Model and camera load at the same time instead of one after the other
                const [lm, cam] = await Promise.all([
                    createLandmarker().then(l => {
                        if (cancelled) l.close();
                        return l;
                    }),
                    getCamera().then(s => {
                        if (cancelled) s.getTracks().forEach(t => t.stop());
                        return s;
                    }),
                ]);
                landmarker = lm;
                stream = cam;
                if (cancelled) {
                    lm.close();
                    cam.getTracks().forEach(t => t.stop());
                    return;
                }

                const video = videoRef.current;
                video.srcObject = stream;
                await video.play();
                setStatus("ready");
                detectLoop();
            } catch (err) {
                if (cancelled) return;
                setErrorMessage(
                    err?.name === "NotAllowedError"
                        ? "Camera access was blocked. Allow the camera in your browser to try caps on."
                        : err?.name === "NotFoundError"
                            ? "No camera was found on this device."
                            : "Couldn't start the try-on. Please try again."
                );
                setStatus("error");
            }
        };

        init();

        return () => {
            cancelled = true;
            if (rafId) cancelAnimationFrame(rafId);
            stream?.getTracks().forEach(track => track.stop());
            landmarker?.close();
            if (videoRef.current) videoRef.current.srcObject = null;
        };
    }, []);

    return (
        <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", background: "#0B0B0C" }}>
            <video ref={videoRef} autoPlay playsInline muted
                style={{
                    width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)",
                    position: "absolute", top: 0, left: 0,
                    opacity: status === "ready" ? 1 : 0, transition: "opacity 0.4s ease",
                }} />
            <canvas ref={canvasRef}
                style={{ width: "100%", height: "100%", transform: "scaleX(-1)", position: "absolute", top: 0, left: 0, pointerEvents: "none" }} />

            {status !== "ready" && (
                <div style={{
                    position: "absolute", inset: 0, display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center", gap: 16, padding: 24,
                    color: "#F2F2F3", textAlign: "center", fontSize: 14,
                }}>
                    {status === "loading" ? (
                        <>
                            <div className="try-on-spinner" />
                            <p style={{ margin: 0, color: "#A3A3A8" }}>Starting your camera…</p>
                        </>
                    ) : (
                        <p style={{ margin: 0, maxWidth: 320, lineHeight: 1.5 }}>{errorMessage}</p>
                    )}
                </div>
            )}

            <button
                onClick={() => onClose?.()}
                aria-label="Close try on"
                style={{ position: "absolute", top: 16, right: 16, color: "white", zIndex: 10, background: "rgba(0,0,0,0.5)", borderRadius: "9999px", padding: "8px 12px", border: "none", cursor: "pointer" }}
            >
                ✕
            </button>
        </div>
    );
}
