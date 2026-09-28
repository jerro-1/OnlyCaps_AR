import { useEffect, useRef } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export default function FaceTracker() {
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
        loader.load('/models/CapModels/BLUELA_AFrame.glb', gltf => {
          hatRef.current = gltf.scene;
          hatRef.current.matrixAutoUpdate = false;

          hatRef.current.traverse(child => {
            if (child.isMesh && child.name === 'head_occluder') {
              child.material = new THREE.MeshBasicMaterial({
                colorWrite: false, // invisible
                depthWrite: true,
              });
              child.renderOrder = -1; // renders before the hat so it blocks correctly
            }
          });

          scene.add(hatRef.current);
          resolve();
        });
      });

      // 3. Start webcam safely
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });

      const video = videoRef.current;
      video.srcObject = stream;

      // IMPORTANT FIX (prevents AbortError)
      video.onloadedmetadata = async () => {
        await video.play();
        detectLoop();
      };
    };

    const detectLoop = () => {
      if (!rendererRef.current || !sceneRef.current || !cameraRef.current) {
        requestAnimationFrame(detectLoop);
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

            // proper mirror transform instead of flipping individual elements
            const mirrorMatrix = new THREE.Matrix4().set(
              -1,
              0,
              0,
              0,
              0,
              1,
              0,
              0,
              0,
              0,
              1,
              0,
              0,
              0,
              0,
              1,
            );
            threeMatrix.premultiply(mirrorMatrix);

            // apply offsets BEFORE premultiply affects position
            const worldOffset = new THREE.Vector3(0, -3, -14);
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

      requestAnimationFrame(detectLoop);
    };

    init();
    // console.log(videoRef.current);
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
    </div>
  );
}
