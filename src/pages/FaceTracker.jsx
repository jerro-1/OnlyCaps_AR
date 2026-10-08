import { useEffect, useRef } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { IoArrowBackOutline } from 'react-icons/io5';
import { IoMdClose } from 'react-icons/io';

export default function FaceTracker({ product, modelFile, onClose, onBack }) {
  const modelUrl = `/models/CapModels/${modelFile}`;
  console.log('loading model:', modelUrl);
  console.log('Modal description:', product);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

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
      scene.scale.x = -1;
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

      await new Promise(resolve => {
        const loader = new GLTFLoader();
        loader.load(modelUrl, gltf => {
          const loadedScene = gltf.scene; // NEW: temp reference

          loadedScene.traverse(child => {
            // CHANGED: was hatRef.current.traverse
            if (child.isMesh && child.name === 'head_occluder') {
              child.material = new THREE.MeshBasicMaterial({
                colorWrite: false, // invisible
                depthWrite: true,
              });
              child.renderOrder = -1; // renders before the hat so it blocks correctly
            }
          });

          const mirrorWrapper = new THREE.Group(); // NEW
          mirrorWrapper.scale.x = -1; // NEW
          while (loadedScene.children.length > 0) {
            // NEW
            mirrorWrapper.add(loadedScene.children[0]); // NEW
          } // NEW

          hatRef.current = new THREE.Group(); // CHANGED: was gltf.scene directly
          hatRef.current.add(mirrorWrapper); // NEW
          hatRef.current.matrixAutoUpdate = false; // unchanged, just moved down

          scene.add(hatRef.current);
          resolve();
        });
      });

      // 3. Start webcam safely
      stream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });

      if (cancelled) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }

      const video = videoRef.current;
      video.srcObject = stream;

      // IMPORTANT FIX (prevents AbortError)
      video.onloadedmetadata = async () => {
        await video.play();
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

      if (!video || !landmarker) return;

      // only process new frames
      if (video.currentTime !== lastVideoTimeRef.current) {
        const result = landmarker.detectForVideo(video, performance.now());

        lastVideoTimeRef.current = video.currentTime;

        if (result.faceLandmarks?.length > 0) {
          const landmarks = result.faceLandmarks[0];

          // log raw landmark 10 (forehead top)
          console.log('landmark 10:', landmarks[10]);

          if (result.facialTransformationMatrixes?.length > 0) {
            const matrix = result.facialTransformationMatrixes[0];

            const threeMatrix = new THREE.Matrix4();
            threeMatrix.fromArray(matrix.data);

            const faceCenterX = landmarks[168].x - 0.5;
            const faceCenterY = landmarks[168].y - 0.5;
            const distFromCenter = Math.sqrt(faceCenterX * faceCenterX + faceCenterY * faceCenterY);
            const correctionStrength = 2 + distFromCenter * 4;
            threeMatrix.elements[12] -= faceCenterX * correctionStrength;
            threeMatrix.elements[13] += faceCenterY * correctionStrength;

            // apply offsets BEFORE premultiply affects position
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

            // keep your position and depth offsets

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

          // Original video dimensions
          const videoWidth = video.videoWidth;
          const videoHeight = video.videoHeight;

          // Calculate the scale used by object-fit: cover
          const scale = Math.max(displayWidth / videoWidth, displayHeight / videoHeight);

          const scaledWidth = videoWidth * scale;
          const scaledHeight = videoHeight * scale;

          // Calculate how much gets cropped
          const offsetX = (displayWidth - scaledWidth) / 2;
          const offsetY = (displayHeight - scaledHeight) / 2;

          // Draw landmarks using the same transformation as the video
          for (let i = 0; i < landmarks.length; i++) {
            const x = landmarks[i].x * scaledWidth + offsetX;
            const y = landmarks[i].y * scaledHeight + offsetY;

            ctx.fillStyle = 'white';
            ctx.fillRect(x, y, 2, 2);
          }
        }
      }
      // render Three.js scene each frame
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }

      rafId = requestAnimationFrame(detectLoop);
    };

    init().catch(err => {
      if (!cancelled) console.error('Try It On failed to start', err);
    });
    // console.log(videoRef.current);
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
          transform: 'scaleX(-1)',
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

      {/* Description overlay */}
      {product && (
        <>
          {/* Left Half Overlay */}
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

          {/* Product Name - Bottom Left of Entire Modal */}
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

          {/* Category - Bottom Right of Entire Modal */}
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

      {/* Back button */}
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

      {/* Close button */}
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
