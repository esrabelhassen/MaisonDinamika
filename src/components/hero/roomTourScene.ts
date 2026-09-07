// WebGL side of the room-tour hero — a single textured quad (no lathe geometry,
// no lights: this isn't a 3D scene, it's a fragment shader doing depth-based
// parallax over a flat photo). Mirrors src/components/hero/heroScene.ts's own
// shape (dynamic-THREE-param function, start/stop/dispose lifecycle) on purpose
// so RoomTour.tsx's effect can reuse Hero.tsx's proven IntersectionObserver/
// visibility/StrictMode-guard pattern verbatim — but this file is entirely
// standalone: it does not import from, or get imported by, heroScene.ts.
import type * as ThreeTypes from 'three'
import { computeCameraState, IMAGE_ASPECT, PARALLAX_STRENGTH } from './roomTourCamera'

type THREE = typeof ThreeTypes

export type RoomTourSceneHandle = {
  /** Drive one frame at scroll progress 0..1 (also called once, at whatever
   * progress is current, for the prefers-reduced-motion "static" render). */
  renderAtProgress: (p: number) => void
  start: () => void
  stop: () => void
  dispose: () => void
}

export type RoomTourSceneOptions = {
  canvas: HTMLCanvasElement
  getProgress: () => number
  onContextLost: () => void
  colorUrl: string
  depthUrl: string
}

// Fullscreen triangle-free quad: position is already in clip space (-1..1), so
// the vertex shader is a pass-through. `uv` comes from PlaneGeometry's default
// attribute (v=0 at the bottom, v=1 at the top — same "up" direction textures
// get after their default flipY, so no manual flip is needed anywhere below).
const VERTEX_SHADER = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`

// See roomTourCamera.ts for what each uniform means. The one thing worth
// flagging here: `uCenter` arrives already flipped to v-space (1 - center.y)
// by the JS below — CSS's fallback path uses the same STOPS in top-down
// image-space directly (that's what background-position expects), so the
// top-down → v-space flip is kept local to this GL-only file.
const FRAGMENT_SHADER = `
uniform sampler2D uColorMap;
uniform sampler2D uDepthMap;
uniform vec2 uCenter;
uniform float uZoom;
uniform float uTilt;
uniform vec2 uNudge;
uniform float uParallaxStrength;
uniform float uImageAspect;
uniform float uScreenAspect;
varying vec2 vUv;

void main() {
  vec2 p = vUv - 0.5;
  // Aspect-correct so zoom stays isotropic (a round area on screen samples a
  // round — not stretched — area of the image) regardless of viewport shape.
  p.x *= uScreenAspect / uImageAspect;

  float c = cos(uTilt);
  float s = sin(uTilt);
  p = mat2(c, -s, s, c) * p;

  p /= uZoom;

  vec2 baseUV = clamp(uCenter + p, 0.0, 1.0);

  // Sampled at the UNPARALLAXED position on purpose — depth answers "how near
  // is the thing the camera is currently pointed at", not "how near is the
  // thing after we've already nudged the view", which would feed back on itself.
  float depth = texture2D(uDepthMap, baseUV).r; // white(1)=near, black(0)=far

  vec2 parallax = uNudge * depth * uParallaxStrength;
  vec2 finalUV = clamp(baseUV + parallax, 0.0, 1.0);

  gl_FragColor = vec4(texture2D(uColorMap, finalUV).rgb, 1.0);
}
`

function loadTexture(loader: ThreeTypes.TextureLoader, url: string): Promise<ThreeTypes.Texture> {
  return new Promise((resolve, reject) => {
    loader.load(url, resolve, undefined, reject)
  })
}

export async function createRoomTourScene(
  THREE: THREE,
  { canvas, getProgress, onContextLost, colorUrl, depthUrl }: RoomTourSceneOptions,
): Promise<RoomTourSceneHandle> {
  // alpha:false — this quad fills the whole frame every pixel, no transparent
  // hero-canvas-over-dreamy-background trick needed here (unlike the dish hero).
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false })
  const pixelRatioCap = window.innerWidth < 768 ? 1.5 : 2
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, pixelRatioCap))
  renderer.outputEncoding = THREE.sRGBEncoding

  const loader = new THREE.TextureLoader()
  const [colorTex, depthTex] = await Promise.all([loadTexture(loader, colorUrl), loadTexture(loader, depthUrl)])

  colorTex.encoding = THREE.sRGBEncoding
  for (const tex of [colorTex, depthTex]) {
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping
    tex.minFilter = THREE.LinearFilter
    tex.magFilter = THREE.LinearFilter
    tex.generateMipmaps = false
  }

  const scene = new THREE.Scene()
  // Orthographic, sized to exactly frame a 2×2 quad — this is 2D compositing,
  // not a 3D camera; all the "camera movement" is the shader's UV math.
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

  const uniforms = {
    uColorMap: { value: colorTex },
    uDepthMap: { value: depthTex },
    uCenter: { value: new THREE.Vector2(0.5, 0.5) },
    uZoom: { value: 3 },
    uTilt: { value: 0 },
    uNudge: { value: new THREE.Vector2(0, 0) },
    uParallaxStrength: { value: PARALLAX_STRENGTH },
    uImageAspect: { value: IMAGE_ASPECT },
    uScreenAspect: { value: window.innerWidth / window.innerHeight },
  }

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    depthTest: false,
    depthWrite: false,
  })
  const geometry = new THREE.PlaneGeometry(2, 2)
  scene.add(new THREE.Mesh(geometry, material))

  function renderAtProgress(raw: number) {
    const time = performance.now()
    const state = computeCameraState(raw, uniforms.uScreenAspect.value, time)
    uniforms.uCenter.value.set(state.center.x, 1 - state.center.y)
    uniforms.uZoom.value = state.zoom
    uniforms.uTilt.value = state.tilt
    uniforms.uNudge.value.set(state.nudge.x, state.nudge.y)
    renderer.render(scene, camera)
  }

  let rafId = 0
  let running = false

  function loop() {
    if (!running) return
    renderAtProgress(getProgress())
    rafId = requestAnimationFrame(loop)
  }

  function start() {
    if (running) return
    running = true
    rafId = requestAnimationFrame(loop)
  }

  function stop() {
    running = false
    if (rafId) cancelAnimationFrame(rafId)
    rafId = 0
  }

  function handleResize() {
    uniforms.uScreenAspect.value = window.innerWidth / window.innerHeight
    renderer.setSize(window.innerWidth, window.innerHeight)
  }
  renderer.setSize(window.innerWidth, window.innerHeight)
  window.addEventListener('resize', handleResize)

  function handleContextLost(event: Event) {
    event.preventDefault()
    stop()
    onContextLost()
  }
  canvas.addEventListener('webglcontextlost', handleContextLost)

  function dispose() {
    stop()
    window.removeEventListener('resize', handleResize)
    canvas.removeEventListener('webglcontextlost', handleContextLost)
    geometry.dispose()
    material.dispose()
    colorTex.dispose()
    depthTex.dispose()
    renderer.dispose()
  }

  return { renderAtProgress, start, stop, dispose }
}
