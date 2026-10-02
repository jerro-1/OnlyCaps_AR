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
  const debugRef = useRef(null); // TEMP: on-screen readout while calibrating dynamic hat scale
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

      // Every hat .glb was modeled/exported independently (BLUELA_AFrame is
      // ~2.16 units wide natively, the three fitted-cap models ~2.70) --
      // the dynamic scale computed in detectLoop() assumes it's setting the
      // hat's FINAL width directly, which only works if every model starts
      // out exactly 1 unit wide. Normalize that here instead of guessing a
      // per-model fudge factor. Measured by walking each mesh's own
      // geometry directly (excluding the occluder by reference) -- THREE.
      // Box3 does NOT check .visible, so toggling the occluder invisible
      // first (an earlier attempt) silently measured it anyway.
      const box = new THREE.Box3();
      loadedScene.updateWorldMatrix(true, true);
      loadedScene.traverse(child => {
        if (child.isMesh && child !== occluder && child.geometry) {
          const geomBox = new THREE.Box3().setFromBufferAttribute(child.geometry.attributes.position);
          geomBox.applyMatrix4(child.matrixWorld);
          box.union(geomBox);
        }
      });
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const nativeWidth = Math.max(size.x, size.z) || 1;
      const normalize = 1 / nativeWidth;
      loadedScene.scale.setScalar(normalize);
      // Re-center horizontally, but the vertical anchor is NOT the lowest
      // point of the mesh -- on a baseball cap that's the tip of the front
      // brim, well below where the cap actually wraps around a head. Using
      // that as (0,0,0) put almost the whole crown above the tracked point
      // no matter how much extra lift got added on top. Anchoring ~20% up
      // from the bottom instead approximates the brim/crown line -- much
      // closer to where the head actually is.
      const pivotY = box.min.y + 0.2 * size.y;
      loadedScene.position.set(-center.x * normalize, -pivotY * normalize, -center.z * normalize);

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

            // The vertical lift used to be a fixed +1, which only looks
            // right at one specific distance from the camera -- sit closer
            // and the same absolute lift is too small a fraction of what's
            // visible, sit back and it's too much. It's made proportional
            // to distance below instead, once that's known.
            const worldOffset = new THREE.Vector3(0, 0, -14);
            threeMatrix.setPosition(
              threeMatrix.elements[12] + worldOffset.x,
              threeMatrix.elements[13] + worldOffset.y,
              threeMatrix.elements[14] + worldOffset.z,
            );

            // Smooth between frames so tiny landmark jitter doesn't make the
            // hat shake -- but a heavy blend also means it takes several
            // frames to catch up after a real, sudden head movement (e.g.
            // right after opening Try It On), which can look like a bad fit
            // for a moment when it's actually just lag. Lightened from
            // 0.6/0.4 so it settles noticeably faster after a real move,
            // while still smoothing out normal frame-to-frame noise.
            if (prevMatrixRef.current) {
              for (let i = 0; i < 16; i++) {
                threeMatrix.elements[i] =
                  prevMatrixRef.current.elements[i] * 0.3 + threeMatrix.elements[i] * 0.7;
              }
            }
            prevMatrixRef.current = threeMatrix.clone();

            // Size the hat from the ACTUAL detected head width this frame,
            // instead of one fixed number -- a fixed scale only ever looks
            // right on whichever camera/sitting distance/person it was
            // tuned against, since a different webcam's field of view or a
            // different distance from the camera both change how big a
            // fixed scale appears, with nothing to do with the hat itself.
            //
            // Measure the face across landmarks 234/454 (left/right cheek,
            // a standard face-width pair) in real video pixels, express that
            // as a fraction of the frame width, then convert that fraction
            // into this hat model's own scale units using the same
            // perspective math the renderer itself uses: how wide a slice
            // of the 3D scene is actually visible at the hat's depth.
            const left = landmarks[234];
            const right = landmarks[454];
            const cam = cameraRef.current;
            let s = 11.5; // fallback if landmarks/camera aren't available yet
            if (left && right && cam && video.videoWidth) {
              // 2D screen-space distance alone shrinks when the head turns
              // -- the same foreshortening that makes a rotated rectangle
              // look narrower from an angle -- even though the real head
              // hasn't changed size. MediaPipe's landmarks include a z (depth)
              // per point, using roughly the same scale convention as x, so
              // including it gives the actual 3D separation between the two
              // cheek points, which stays consistent as the head rotates.
              const faceWidthPx = Math.hypot(
                (right.x - left.x) * video.videoWidth,
                (right.y - left.y) * video.videoHeight,
                (right.z - left.z) * video.videoWidth,
              );
              const faceWidthFraction = faceWidthPx / video.videoWidth;
              // The hat's real distance from the camera is MediaPipe's own
              // tracked depth plus our small offset -- that's already sitting
              // in elements[14] at this point, smoothing included. Using the
              // fixed offset alone (14) instead of this was the bug: it's
              // only a few units, while the tracked depth is much larger, so
              // every scale came out far smaller than it should have.
              const distance = Math.abs(threeMatrix.elements[14]);
              const vFovRad = (cam.fov * Math.PI) / 180;
              const visibleHeightAtDepth = 2 * distance * Math.tan(vFovRad / 2);
              const visibleWidthAtDepth = visibleHeightAtDepth * cam.aspect;
              // Calibrated from a real screenshot, not guessed: at s=18.41
              // (this constant at 1.15) the hat rendered at roughly 0.64x
              // the actual head width -- landmarks 234/454 sit on the
              // cheeks, noticeably narrower than the temple-to-temple width
              // a hat actually needs. 1.15 * (1.15/0.64) ~= 2.07 corrects
              // for that gap directly from the measured ratio.
              const HEAD_WIDTH_VS_FACE_WIDTH = 2.07;
              s = faceWidthFraction * visibleWidthAtDepth * HEAD_WIDTH_VS_FACE_WIDTH;

              // A flat lift constant has now failed twice at two different
              // distances/head angles -- it can't work in general, because
              // how far "above the nose" the hairline sits depends on this
              // specific person's face and how far back their head is
              // tilted, not just distance from the camera. Measuring it
              // directly instead: landmark 10 is a well-established
              // forehead-top/hairline reference point. The real screen-space
              // gap between it and the nose tip (landmark 1), converted to
              // world units the same validated way the width fix already
              // is, gives an actual per-frame measurement instead of a
              // guessed number.
              const noseTip = landmarks[1];
              const foreheadTop = landmarks[10];
              let lift = 0;
              if (noseTip && foreheadTop) {
                const foreheadGapPx = (noseTip.y - foreheadTop.y) * video.videoHeight;
                const worldPerPixelY = visibleHeightAtDepth / video.videoHeight;
                const EXTRA_INTO_HAIRLINE = 0; // the bare forehead-top measurement alone is landing within ~2 units of correct now
                lift = foreheadGapPx * worldPerPixelY * (1 + EXTRA_INTO_HAIRLINE);
              }
              threeMatrix.elements[13] += lift;

              // TEMP: real numbers on screen so we can calibrate this from a
              // screenshot instead of guessing blind again.
              if (debugRef.current) {
                debugRef.current.textContent =
                  `faceWidthFraction=${faceWidthFraction.toFixed(3)} ` +
                  `rawZ=${matrix.data[14].toFixed(2)} ` +
                  `distance=${distance.toFixed(2)} ` +
                  `fov=${cam.fov.toFixed(1)} aspect=${cam.aspect.toFixed(2)} ` +
                  `visibleWidthAtDepth=${visibleWidthAtDepth.toFixed(2)} ` +
                  `s=${s.toFixed(2)} lift=${lift.toFixed(2)}`;
              }
            }
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
      {/* TEMP: remove once hat scale is calibrated */}
      <pre
        ref={debugRef}
        style={{
          position: 'absolute', bottom: 8, left: 8, right: 8, zIndex: 10,
          color: '#0f0', background: 'rgba(0,0,0,0.7)', padding: '6px 10px',
          fontSize: 11, borderRadius: 8, whiteSpace: 'pre-wrap', margin: 0,
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
