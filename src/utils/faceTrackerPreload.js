// "Try it on" needs a JS chunk, a ~11 MB wasm runtime and a ~3.7 MB model.
// Warming these while the shopper is still looking at the product means the
// camera view opens almost instantly when they press the button.

export const loadFaceTracker = () => import('../pages/FaceTracker');

let warmed = false;

export function preloadFaceTracker() {
  if (warmed) return;
  if (navigator.connection?.saveData) return;
  warmed = true;

  loadFaceTracker();

  const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 300));
  idle(() => {
    ['/models/face_landmarker.task', '/mediapipe/vision_wasm_internal.js', '/mediapipe/vision_wasm_internal.wasm']
      .forEach(url => fetch(url).catch(() => {}));
  });
}
