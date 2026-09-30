import { useEffect, useRef } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Falls back to the A-Frame model so nothing breaks for a product that
// hasn't been given its own model_filename yet.
const DEFAULT_MODEL = 'BLUELA_AFrame.glb';

// The only three numbers that should ever need re-tuning, for any model:
// every .glb is normalized to the same internal scale/pivot on load (see
// below), so one shared calibration now applies to all of them instead of
// each hat needing its own hand-tuned constant.
const HAT_SCALE = 33;          // how big the hat renders relative to the tracked head
const HAT_LIFT = 5.5;          // moves the hat up onto the crown/forehead instead of down over the eyes
const HAT_DEPTH = -14;         // pushes the hat forward off the face plane so it doesn't clip into it

export default function FaceTracker({ modelFile, onClose }) {
  const modelUrl = `/models/CapModels/${modelFile || DEFAULT_MODEL}`;
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

      // 2. Load Face Landmarker model
      faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: '/models/face_landmarker.task',
        },
        runningMode: 'VIDEO',
        numFaces: 1,
        outputFacialTransformationMatrixes: true,
      });

      // 2.5 Set up Three.js
      const scene = new THREE.Scene();
      scene.scale.x = -1; // mirror the whole scene to match the mirrored video/canvas
      const container = threeCanvasRef.current.parentElement;
      const W = container.offsetWidth;
      const H = container.offsetHeight;
      const camera = new THREE.PerspectiveCamera(57.5, W / H, 0.1, 5000);
      camera.position.set(0, 0, 0);

      const renderer = new THREE.WebGLRenderer({ alpha: true });
      renderer.setClearColor(0x000000, 0);
      renderer.setSize(W, H);
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
          const loadedScene = gltf.scene;
          let occluder = null;

          loadedScene.traverse(child => {
            if (child.isMesh && child.name === 'head_occluder') {
              occluder = child;
              child.material = new THREE.MeshBasicMaterial({
                colorWrite: false, // invisible
                depthWrite: true,
              });
              child.renderOrder = -1; // renders before the hat so it blocks correctly
            }
          });

          // Every hat .glb was modeled/exported independently, each at
          // whatever scale and pivot its own author's tool happened to use --
          // that's why one shared scale constant made some hats render
          // enormous. Measure the hat's OWN geometry (excluding the
          // head_occluder, which is deliberately head-sized -- much bigger
          // than the actual cap -- and would otherwise dominate the
          // measurement) and normalize every model to the same width and to
          // a pivot at the horizontal center of its brim's underside, which
          // is the point that should actually sit against the head.
          if (occluder) occluder.visible = false;
          const box = new THREE.Box3().setFromObject(loadedScene);
          if (occluder) occluder.visible = true;
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());
          const width = Math.max(size.x, size.z) || 1;
          const normalize = 1 / width;

          loadedScene.scale.setScalar(normalize);
          loadedScene.position.set(-center.x * normalize, -box.min.y * normalize, -center.z * normalize);

          // Undo the scene-level mirror for the model itself -- only the
          // scene needs flipping to match the mirrored video; the hat's own
          // geometry shouldn't also come out backwards.
          const mirrorWrapper = new THREE.Group();
          mirrorWrapper.scale.x = -1;
          mirrorWrapper.add(loadedScene);

          hatRef.current = new THREE.Group();
          hatRef.current.add(mirrorWrapper);
          hatRef.current.matrixAutoUpdate = false;

          scene.add(hatRef.current);
          resolve();
        });
      });

      // 3. Start webcam safely
      stream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      if (cancelled) {
        stream.getTracks().forEach(t => t.stop());
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

          if (result.facialTransformationMatrixes?.length > 0) {
            const matrix = result.facialTransformationMatrixes[0];

            const threeMatrix = new THREE.Matrix4();
            threeMatrix.fromArray(matrix.data);

            // Mirroring now happens once at the scene level (scene.scale.x =
            // -1, undone per-model in the loader above) instead of here --
            // doing it both places would mirror the hat twice.

            threeMatrix.setPosition(
              threeMatrix.elements[12],
              threeMatrix.elements[13] + HAT_LIFT,
              threeMatrix.elements[14] + HAT_DEPTH,
            );

            // smooth between frames
            if (prevMatrixRef.current) {
              for (let i = 0; i < 16; i++) {
                threeMatrix.elements[i] =
                  prevMatrixRef.current.elements[i] * 0.6 + threeMatrix.elements[i] * 0.4;
              }
            }
            prevMatrixRef.current = threeMatrix.clone();

            // Every model was normalized to the same width on load, so this
            // one HAT_SCALE now governs how big every hat renders.
            threeMatrix.elements[0] *= HAT_SCALE;
            threeMatrix.elements[1] *= HAT_SCALE;
            threeMatrix.elements[2] *= HAT_SCALE;
            threeMatrix.elements[4] *= HAT_SCALE;
            threeMatrix.elements[5] *= HAT_SCALE;
            threeMatrix.elements[6] *= HAT_SCALE;
            threeMatrix.elements[8] *= HAT_SCALE;
            threeMatrix.elements[9] *= HAT_SCALE;
            threeMatrix.elements[10] *= HAT_SCALE;

            if (hatRef.current) {
              hatRef.current.matrix.copy(threeMatrix);
            }
          }

          // DEBUG DRAWING
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');

          const displayWidth = video.offsetWidth;
          const displayHeight = video.offsetHeight;

          canvas.width = displayWidth;
          canvas.height = displayHeight;

          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // draw dots
          for (let i = 0; i < landmarks.length; i++) {
            const x = landmarks[i].x * canvas.width;
            const y = landmarks[i].y * canvas.height;

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

    // Without this, leaving the page (or closing the modal) left the camera
    // recording and the render loop running in the background indefinitely.
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
      }}
    >
      <video
        ref={videoRef}
        style={{
          width: '100%',
          height: '100%',
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
      <button
        onClick={() => onClose?.()}
        aria-label="Close try on"
        style={{
          position: 'absolute', top: 16, right: 16, color: 'white', zIndex: 10,
          background: 'rgba(0,0,0,0.5)', borderRadius: '9999px', padding: '8px 12px',
          border: 'none', cursor: 'pointer',
        }}
      >
        ✕
      </button>
    </div>
  );
}
