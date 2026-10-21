import { useEffect, useRef } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { IoArrowBackOutline } from 'react-icons/io5';
import { IoMdClose } from 'react-icons/io';

export default function FaceTracker({ product, modelFile, onClose, onBack }) {
  const modelUrl = `/models/CapModels/${modelFile || 'FittedCap_DeepBlue.glb'}`;
  console.log('loading model:', modelUrl);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const offscreenRef = useRef(null);
  const offCtxRef = useRef(null);

  const faceLandmarkerRef = useRef(null);
  const lastVideoTimeRef = useRef(-1);

  const hatRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const prevMatrixRef = useRef(null);
  const cameraRef = useRef(null);
  const threeCanvasRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    let rafId = null;
    let stream = null;

    const init = async () => {
      // 1. Load MediaPipe WASM
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm',
      );

      if (cancelled) return;

      // 2. Load Face Landmarker model
      faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: '/models/face_landmarker.task',
        },
        runningMode: 'VIDEO',
        numFaces: 1,
        outputFacialTransformationMatrixes: true,
      });

      if (cancelled) return;

      // 2.5 Set up Three.js
      const scene = new THREE.Scene();
      const container = threeCanvasRef.current.parentElement;
      const width = container.clientWidth;
      const height = container.clientHeight;

      const camera = new THREE.PerspectiveCamera(57.5, width / height, 0.1, 5000);
      camera.position.set(0, 0, 0);

      const renderer = new THREE.WebGLRenderer({ alpha: true });
      renderer.setClearColor(0x000000, 0);
      renderer.setSize(width, height);
      renderer.domElement.style.position = 'absolute';
      renderer.domElement.style.top = '0';
      renderer.domElement.style.left = '0';
      renderer.domElement.style.pointerEvents = 'none';
      threeCanvasRef.current.appendChild(renderer.domElement);

      const light = new THREE.DirectionalLight(0xffffff, 3);
      light.position.set(-1, 2, 4);
      scene.add(light);

      sceneRef.current = scene;
      cameraRef.current = camera;
      rendererRef.current = renderer;

      await new Promise((resolve, reject) => {
        const dracoLoader = new DRACOLoader();

        dracoLoader.setDecoderPath('/draco/');

        const loader = new GLTFLoader();
        loader.setDRACOLoader(dracoLoader);

        loader.load(
          modelUrl,
          gltf => {
            hatRef.current = gltf.scene;
            hatRef.current.matrixAutoUpdate = false;

            hatRef.current.traverse(child => {
              if (child.isMesh && child.name === 'head_occluder') {
                child.material = new THREE.MeshBasicMaterial({
                  colorWrite: false,
                  depthWrite: true,
                });
                child.renderOrder = -1;
              }
            });

            scene.add(hatRef.current);
            resolve();
          },
          undefined,
          error => {
            console.error('Failed to load cap model:', error);
            reject(error);
          },
        );
      });

      // 3. Start webcam safely
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
      });

      if (cancelled) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }

      const video = videoRef.current;
      video.srcObject = stream;

      video.onloadedmetadata = async () => {
        await video.play();

        // Set up offscreen canvas for pre-mirrored frames
        const offscreen = document.createElement('canvas');
        offscreen.width = video.videoWidth;
        offscreen.height = video.videoHeight;
        const offCtx = offscreen.getContext('2d');
        offscreenRef.current = offscreen;
        offCtxRef.current = offCtx;

        detectLoop();
      };
    };

    const detectLoop = () => {
      if (cancelled) return;
      if (!rendererRef.current || !sceneRef.current || !cameraRef.current) {
        rafId = requestAnimationFrame(detectLoop);
        return;
      }
      const video = videoRef.current;
      const landmarker = faceLandmarkerRef.current;

      if (!video || !landmarker || !offscreenRef.current) return;

      if (video.currentTime !== lastVideoTimeRef.current) {
        // Draw mirrored frame to offscreen canvas
        const offCtx = offCtxRef.current;
        const offscreen = offscreenRef.current;
        offCtx.save();
        offCtx.scale(-1, 1);
        offCtx.drawImage(video, -offscreen.width, 0, offscreen.width, offscreen.height);
        offCtx.restore();

        // Feed mirrored canvas to MediaPipe
        const result = landmarker.detectForVideo(offscreen, performance.now());

        lastVideoTimeRef.current = video.currentTime;

        if (result.faceLandmarks?.length > 0) {
          const landmarks = result.faceLandmarks[0];

          if (result.facialTransformationMatrixes?.length > 0) {
            const matrix = result.facialTransformationMatrixes[0];

            const threeMatrix = new THREE.Matrix4();
            threeMatrix.fromArray(matrix.data);

            // apply position and depth offsets
            const worldOffset = new THREE.Vector3(0, 1, -14);
            threeMatrix.setPosition(
              threeMatrix.elements[12] + worldOffset.x,
              threeMatrix.elements[13] + worldOffset.y,
              threeMatrix.elements[14] + worldOffset.z,
            );

            // smooth between frames
            if (prevMatrixRef.current) {
              for (let i = 0; i < 16; i++) {
                threeMatrix.elements[i] =
                  prevMatrixRef.current.elements[i] * 0.5 + threeMatrix.elements[i] * 0.4;
              }
            }
            prevMatrixRef.current = threeMatrix.clone();

            const s = 11.5;
            threeMatrix.elements[0] *= s;
            threeMatrix.elements[1] *= s;
            threeMatrix.elements[2] *= s;
            threeMatrix.elements[4] *= s;
            threeMatrix.elements[5] *= s;
            threeMatrix.elements[6] *= s;
            threeMatrix.elements[8] *= s;
            threeMatrix.elements[9] *= s;
            threeMatrix.elements[10] *= s;

            if (hatRef.current) {
              hatRef.current.matrix.copy(threeMatrix);
            }
          }

          // DEBUG DRAWING
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');

          const displayWidth = video.clientWidth;
          const displayHeight = video.clientHeight;

          canvas.width = displayWidth;
          canvas.height = displayHeight;

          ctx.clearRect(0, 0, canvas.width, canvas.height);

          const videoWidth = video.videoWidth;
          const videoHeight = video.videoHeight;
          const scale = Math.max(displayWidth / videoWidth, displayHeight / videoHeight);
          const scaledWidth = videoWidth * scale;
          const scaledHeight = videoHeight * scale;
          const offsetX = (displayWidth - scaledWidth) / 2;
          const offsetY = (displayHeight - scaledHeight) / 2;

          for (let i = 0; i < landmarks.length; i++) {
            const x = landmarks[i].x * scaledWidth + offsetX;
            const y = landmarks[i].y * scaledHeight + offsetY;
            ctx.fillStyle = 'white';
            ctx.fillRect(x, y, 2, 2);
          }
        }
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }

      rafId = requestAnimationFrame(detectLoop);
    };

    init().catch(err => {
      if (!cancelled) console.error('Try It On failed to start', err);
    });

    return () => {
      cancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
      stream?.getTracks().forEach(t => t.stop());
      faceLandmarkerRef.current?.close();
      rendererRef.current?.dispose();
    };
  }, []);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <video
        ref={videoRef}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: 'scaleX(-1)',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      />
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',

          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none',
        }}
      />
      <div
        ref={threeCanvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none',
        }}
      />

      {product && (
        <>
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '50%',
              height: '100%',
              zIndex: 10,
              background: 'transparent',
              pointerEvents: 'none',
            }}
          />
          <h2
            style={{
              position: 'absolute',
              bottom: 32,
              left: 32,
              zIndex: 11,
              margin: 0,
              color: 'white',
              fontSize: '24px',
              fontWeight: '700',
            }}
          >
            {product.name}
          </h2>
          <p
            style={{
              position: 'absolute',
              bottom: 32,
              right: 32,
              zIndex: 11,
              margin: 0,
              color: 'white',
              fontSize: '14px',
              opacity: 0.8,
            }}
          >
            {product.category}
          </p>
        </>
      )}

      <button
        onClick={() => onBack?.()}
        aria-label="Back to product"
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          color: 'white',
          zIndex: 10,
          background: 'rgba(0,0,0,0.5)',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          padding: 0,
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <IoArrowBackOutline size={20} />
      </button>

      <button
        onClick={() => onClose?.()}
        aria-label="Close try on"
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          color: 'white',
          zIndex: 10,
          background: 'rgba(0,0,0,0.5)',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          padding: 0,
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <IoMdClose size={20} />
      </button>
    </div>
  );
}
