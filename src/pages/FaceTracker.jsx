import { useEffect, useRef } from "react";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

export default function FaceTracker() {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);

    const faceLandmarkerRef = useRef(null);
    const lastVideoTimeRef = useRef(-1);

    useEffect(() => {
        const init = async () => {
            // 1. Load MediaPipe WASM runtime
            const vision = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
            );

            // 2. Load Face Landmarker model
            faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(
                vision,
                {
                    baseOptions: {
                        modelAssetPath: "/models/face_landmarker.task",
                    },
                    runningMode: "VIDEO",
                    numFaces: 1,
                }
            );

            // 3. Start webcam 
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
            });


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

            // only process new frames
            if (video.currentTime !== lastVideoTimeRef.current) {
                const result = landmarker.detectForVideo(
                    video,
                    performance.now()
                );

                lastVideoTimeRef.current = video.currentTime;

                if (result.faceLandmarks?.length > 0) {
                    const landmarks = result.faceLandmarks[0];

                    // DEBUG DRAWING
                    const canvas = canvasRef.current;
                    const ctx = canvas.getContext("2d");

                    const displayWidth = video.offsetWidth;
                    const displayHeight = video.offsetHeight;

                    canvas.width = displayWidth;
                    canvas.height = displayHeight;

                    ctx.clearRect(0, 0, canvas.width, canvas.height);

                    // draw dots
                    for (let i = 0; i < landmarks.length; i++) {
                        const x = landmarks[i].x * canvas.width;
                        const y = landmarks[i].y * canvas.height;

                        ctx.fillStyle = "white";
                        ctx.fillRect(x, y, 2, 2);
                    };
                }
            }

            requestAnimationFrame(detectLoop);
        };

        init();
    }, []);

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
            }}
        >
            <video
                ref={videoRef}
                autoPlay
                playsInline
                style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transform: "scaleX(-1)",
                    position: "absolute",
                    top: 0,
                    left: 0,
                }}
            />

            <canvas
                ref={canvasRef}
                style={{
                    width: "100%",
                    height: "100%",
                    transform: "scaleX(-1)",
                    position: "absolute",
                    top: 0,
                    left: 0,
                    pointerEvents: "none",
                }}
            />
        </div>
    );
}
