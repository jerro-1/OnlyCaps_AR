import { useEffect, useRef, useState } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Falls back to the A-Frame model so nothing breaks for a product that
// hasn't been given its own model_filename yet.
const DEFAULT_MODEL = 'BLUELA_AFrame.glb';

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
  const resizeObserverRef = useRef(null);
  const [hatReady, setHatReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let rafId = null;
    let stream = null;

    // The wasm runtime is served from our own origin (copied out of
    // node_modules by scripts/copy-mediapipe.mjs) instead of a cold
    // third-party request to jsdelivr on every "Try it on" -- and GPU
    // delegate decodes noticeably faster than CPU where it's available.
    const createLandmarker = async () => {
      const vision = await FilesetResolver.forVisionTasks('/mediapipe');
      const options = (delegate) => ({
        baseOptions: { modelAssetPath: '/models/face_landmarker.task', delegate },
        runningMode: 'VIDEO',
        numFaces: 1,
        outputFacialTransformationMatrixes: true,
      });
      try {
        return await FaceLandmarker.createFromOptions(vision, options('GPU'));
      } catch {
        return await FaceLandmarker.createFromOptions(vision, options('CPU'));
      }
    };

    const loadHatModel = () => new Promise((resolve, reject) => {
      new GLTFLoader().load(modelUrl, gltf => resolve(gltf.scene), undefined, reject);
    });

    const init = async () => {
      // Three.js scene/renderer setup is cheap and synchronous -- do it
      // immediately so the canvas is ready the instant everything below
      // finishes, instead of only starting to set it up after other loads.
      const scene = new THREE.Scene();
      scene.scale.x = -1; // mirror the whole scene to match the mirrored video/canvas
      const container = threeCanvasRef.current.parentElement;

      // Right when this component mounts (e.g. coming out of a Suspense
      // fallback), the container can briefly report 0x0 before the browser
      // finishes laying it out -- that's what was making the AR view come
      // out the wrong size. Wait a frame and re-measure instead of building
      // the camera/renderer against a size that isn't real yet.
      let W = container.offsetWidth;
      let H = container.offsetHeight;
      for (let tries = 0; (W === 0 || H === 0) && tries < 10; tries++) {
        await new Promise(r => requestAnimationFrame(r));
        W = container.offsetWidth;
        H = container.offsetHeight;
      }

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

      // Keeps the AR view correctly sized/proportioned if the container
      // ever actually changes size (window resize, phone rotation) --
      // a fixed size measured once wouldn't survive either of those.
      const resizeObserver = new ResizeObserver(() => {
        const w = container.offsetWidth;
        const h = container.offsetHeight;
        if (w === 0 || h === 0) return;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      });
      resizeObserver.observe(container);
      resizeObserverRef.current = resizeObserver;

      const light = new THREE.DirectionalLight(0xffffff, 3);
      light.position.set(-1, 2, 4);
      scene.add(light);

      sceneRef.current = scene;
      cameraRef.current = camera;
      rendererRef.current = renderer;

      // The camera is the thing the shopper is actually staring at, waiting
      // to tap "Allow" -- it now starts the instant permission is granted
      // instead of waiting for the face model and hat model to finish
      // downloading first. detectLoop() below already tolerates those not
      // being ready yet, so video shows up immediately and the hat simply
      // fades in a moment later once it's loaded.
      stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (cancelled) {
        stream.getTracks().forEach(t => t.stop());
        return;
      }
      const video = videoRef.current;
      video.srcObject = stream;
      video.onloadedmetadata = () => {
        video.play();
        detectLoop();
      };

      // Face model + hat model load in the background, in parallel with
      // each other, while the shopper already sees themselves on camera.
      const [landmarker, loadedScene] = await Promise.all([createLandmarker(), loadHatModel()]);
      if (cancelled) {
        landmarker.close();
        return;
      }
      faceLandmarkerRef.current = landmarker;

      loadedScene.traverse(child => {
        if (child.isMesh && child.name === 'head_occluder') {
          child.material = new THREE.MeshBasicMaterial({
            colorWrite: false, // invisible
            depthWrite: true,
          });
          child.renderOrder = -1; // renders before the hat so it blocks correctly
        }
      });

      // Undo the scene-level mirror for the model itself -- only the
      // scene needs flipping to match the mirrored video; the hat's own
      // geometry shouldn't also come out backwards.
      const mirrorWrapper = new THREE.Group();
      mirrorWrapper.scale.x = -1;
      while (loadedScene.children.length > 0) {
        mirrorWrapper.add(loadedScene.children[0]);
      }

      hatRef.current = new THREE.Group();
      hatRef.current.add(mirrorWrapper);
      hatRef.current.matrixAutoUpdate = false;
      scene.add(hatRef.current);
      if (!cancelled) setHatReady(true);
    };

    const detectLoop = () => {
      if (cancelled) return;
      const video = videoRef.current;
      const landmarker = faceLandmarkerRef.current;
      if (!video || !landmarker) {
        // Camera's already live; just waiting on the face model / hat model
        // to finish loading in the background -- keep looping so detection
        // starts the instant they're ready instead of stalling here.
        rafId = requestAnimationFrame(detectLoop);
        return;
      }

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
                  prevMatrixRef.current.elements[i] * 0.6 + threeMatrix.elements[i] * 0.4;
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
      resizeObserverRef.current?.disconnect();
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
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      />
      {!hatReady && (
        <div
          style={{
            position: 'absolute', top: 16, left: 16, color: 'white', zIndex: 10,
            background: 'rgba(0,0,0,0.5)', borderRadius: '9999px', padding: '6px 14px',
            fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
          }}
        >
          <span className="try-on-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
          Loading hat…
        </div>
      )}
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
