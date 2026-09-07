// WebGL side of the room-tour hero — a single textured quad (no lathe geometry,
// no lights: this isn't a 3D scene, it's a fragment shader doing depth-based
// parallax over a flat photo). Mirrors src/components/hero/heroScene.ts's own
// shape (dynamic-THREE-param function, start/stop/dispose lifecycle) on purpose
// so RoomTour.tsx's effect can reuse Hero.tsx's proven IntersectionObserver/
// visibility/StrictMode-guard pattern verbatim — but this file is entirely
// standalone: it does not import from, or get imported by, heroScene.ts.
import type * as ThreeTypes from 'three'
import { IMAGE_ASPECT, IMAGE_HEIGHT, IMAGE_WIDTH, PARALLAX_STRENGTH, computeCameraState } from './roomTourCamera'

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
//
// Shared by both fragment shader variants below: the camera math (screen UV →
// the depth-parallaxed image UV to sample) and the color grade (contrast/
// saturation lift + a soft vignette — cheap, just math on an already-sampled
// color, no extra texture reads, so both tiers get it).
const SHADER_COMMON = `
uniform sampler2D uColorMap;
uniform sampler2D uDepthMap;
uniform vec2 uCenter;
uniform float uZoom;
uniform float uTilt;
uniform vec2 uNudge;
uniform float uParallaxStrength;
uniform float uImageAspect;
uniform float uScreenAspect;
uniform vec2 uImageSize;
varying vec2 vUv;

vec2 computeFinalUV() {
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
  return clamp(baseUV + parallax, 0.0, 1.0);
}

vec3 grade(vec3 color) {
  color = clamp((color - 0.5) * 1.12 + 0.5, 0.0, 1.0);
  float luma = dot(color, vec3(0.299, 0.587, 0.114));
  color = mix(vec3(luma), color, 1.14);
  float vignette = smoothstep(0.95, 0.32, length(vUv - 0.5));
  color *= mix(0.85, 1.0, vignette);
  return clamp(color, 0.0, 1.0);
}
`

// FAST variant (mobile/low-power tier, matching heroScene.ts's own desktop/
// mobile split — see getTier() there): one texture2D tap for color, one for
// depth. Cheapest possible correct render of this effect.
const FRAGMENT_SHADER_FAST =
  SHADER_COMMON +
  `
void main() {
  vec2 finalUV = computeFinalUV();
  vec3 color = texture2D(uColorMap, finalUV).rgb;
  gl_FragColor = vec4(grade(color), 1.0);
}
`

// HQ variant (desktop only): the source photo is 1584×672 — even after
// BASE_ZOOM was brought down (see roomTourCamera.ts), that's well under 1:1
// texel-to-pixel on anything wider than a phone, so a single bilinear tap
// reads soft (confirmed by screenshotting a zoomed stop against the raw
// source). Three fixes on top of the shared camera math, working with the
// SAME asset (no new image): bicubic resampling (four bilinear taps
// arranged to approximate a Catmull-Rom filter — smoother than plain
// bilinear when magnifying), a fine 1px-radius unsharp mask (edge contrast),
// and a wider 3px-radius "clarity" pass (mid-frequency local contrast — the
// bigger lever for a crisp, "could be a render" look). ~13 texture reads/
// pixel total — measured as real added frame cost (not dev-mode noise, A/B'd
// against the FAST variant), which is why this whole variant is gated to the
// desktop tier rather than applied everywhere. None of this invents texture
// detail that isn't there; genuine per-pixel sharpness at these zoom levels
// would need a meaningfully higher-resolution source image.
const FRAGMENT_SHADER_HQ =
  SHADER_COMMON +
  `
vec4 cubicWeights(float v) {
  vec4 n = vec4(1.0, 2.0, 3.0, 4.0) - v;
  vec4 s = n * n * n;
  float x = s.x;
  float y = s.y - 4.0 * s.x;
  float z = s.z - 4.0 * s.y + 6.0 * s.x;
  float w = 6.0 - x - y - z;
  return vec4(x, y, z, w) / 6.0;
}

vec3 sampleBicubic(sampler2D tex, vec2 uv) {
  vec2 texSize = uImageSize;
  vec2 invTexSize = 1.0 / texSize;
  vec2 coords = uv * texSize - 0.5;
  vec2 fxy = fract(coords);
  coords -= fxy;

  vec4 xcubic = cubicWeights(fxy.x);
  vec4 ycubic = cubicWeights(fxy.y);

  vec4 c = coords.xxyy + vec2(-0.5, 1.5).xyxy;
  vec4 s = vec4(xcubic.xz + xcubic.yw, ycubic.xz + ycubic.yw);
  vec4 offset = (c + vec4(xcubic.yw, ycubic.yw) / s) * invTexSize.xxyy;

  vec3 sample0 = texture2D(tex, offset.xz).rgb;
  vec3 sample1 = texture2D(tex, offset.yz).rgb;
  vec3 sample2 = texture2D(tex, offset.xw).rgb;
  vec3 sample3 = texture2D(tex, offset.yw).rgb;

  float sx = s.x / (s.x + s.y);
  float sy = s.z / (s.z + s.w);
  return mix(mix(sample3, sample2, sx), mix(sample1, sample0, sx), sy);
}

void main() {
  vec2 finalUV = computeFinalUV();
  vec3 color = sampleBicubic(uColorMap, finalUV);
  vec2 texel = 1.0 / uImageSize;

  // Fine unsharp mask (1px radius): a cheap 4-tap cross average stands in for
  // a blurred version of this pixel; pushing the real sample away from it
  // recovers edge contrast smoothing erases. Plain bilinear taps (not another
  // 4x sampleBicubic call each) — this is just a rough local-average
  // reference, it doesn't need bicubic precision.
  vec3 blurNear = (
    texture2D(uColorMap, finalUV + vec2(texel.x, 0.0)).rgb +
    texture2D(uColorMap, finalUV - vec2(texel.x, 0.0)).rgb +
    texture2D(uColorMap, finalUV + vec2(0.0, texel.y)).rgb +
    texture2D(uColorMap, finalUV - vec2(0.0, texel.y)).rgb
  ) * 0.25;

  // Wider "clarity" pass (3px radius, diagonal taps): the same idea at a
  // larger radius, weighted lighter — recovers mid-frequency local contrast
  // (the difference between a crisp studio render and a flat, hazy photo)
  // rather than just single-pixel edges. This is the bigger lever of the two
  // for "looks CGI-clean" without inventing detail that isn't there.
  vec2 texel3 = texel * 3.0;
  vec3 blurFar = (
    texture2D(uColorMap, finalUV + vec2(texel3.x, texel3.y)).rgb +
    texture2D(uColorMap, finalUV - vec2(texel3.x, texel3.y)).rgb +
    texture2D(uColorMap, finalUV + vec2(texel3.x, -texel3.y)).rgb +
    texture2D(uColorMap, finalUV - vec2(texel3.x, -texel3.y)).rgb
  ) * 0.25;

  color += (color - blurNear) * 0.65;
  color += (color - blurFar) * 0.35;

  gl_FragColor = vec4(grade(color), 1.0);
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
  // Same breakpoint heroScene.ts's getTier() uses. Pixel-ratio cap AND shader
  // choice both key off it, for the same reason: weaker mobile GPUs shouldn't
  // pay for the desktop-tier's ~8x texture-read HQ pass.
  const isDesktopTier = window.innerWidth >= 768

  // alpha:false — this quad fills the whole frame every pixel, no transparent
  // hero-canvas-over-dreamy-background trick needed here (unlike the dish hero).
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isDesktopTier ? 2 : 1.5))
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
    uImageSize: { value: new THREE.Vector2(IMAGE_WIDTH, IMAGE_HEIGHT) },
  }

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: VERTEX_SHADER,
    fragmentShader: isDesktopTier ? FRAGMENT_SHADER_HQ : FRAGMENT_SHADER_FAST,
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
