// The 3D rig, ported from reference/kitchenware-hero.html (r128). Kept as plain,
// framework-free functions so the tuned material/geometry/texture code stays exactly
// as it was — only the surrounding capability system (tiers, flush-cumulative stack,
// context-loss, lifecycle) is new, layered on top for the React port.
//
// `three` is imported dynamically (by the caller, passed in as `THREE`) so it never
// enters the SSR bundle or the initial client JS payload — this module has no static
// import of 'three' itself, only compile-time types (erased at build time).
import type * as ThreeTypes from 'three'

type THREE = typeof ThreeTypes

export type DishShape = 'plate' | 'bowl'

type DishSpec = {
  shape: DishShape
  scale: number
  start: { p: [number, number, number]; r: [number, number, number] }
  endR: [number, number, number]
}

// Verbatim from the prototype: drift-apart start position/rotation per dish, and the
// scale each grows into. Only `end.y` was hand-tuned magic numbers there (0, 0.16,
// 0.30, 0.42, 0.525, 0.615, 0.70) — replaced below by computeFlushStackY(), which
// derives the same numbers from each dish's own thickness (see the constants below),
// so a reduced (mobile) dish set still stacks flush with no gaps or overlap.
const BASE_SPECS: DishSpec[] = [
  { shape: 'plate', scale: 2.55, start: { p: [-1.6, -1.4, -3.6], r: [-0.32, 0.22, 0.16] }, endR: [0, 0.1, 0] },
  { shape: 'plate', scale: 2.3, start: { p: [2.5, -1.9, -1.1], r: [0.3, -0.28, 0.2] }, endR: [0, -0.2, 0] },
  { shape: 'plate', scale: 2.05, start: { p: [-3.1, 0.7, -2.3], r: [0.24, 0.34, -0.2] }, endR: [0, 0.34, 0] },
  { shape: 'plate', scale: 1.82, start: { p: [3.1, 1.3, 0.4], r: [-0.3, -0.24, 0.16] }, endR: [0, -0.12, 0] },
  { shape: 'plate', scale: 1.6, start: { p: [-1.3, 2.3, 1.5], r: [0.34, 0.2, -0.26] }, endR: [0, 0.22, 0] },
  { shape: 'plate', scale: 1.4, start: { p: [1.1, 2.0, 2.5], r: [-0.24, 0.3, 0.2] }, endR: [0, -0.28, 0] },
  { shape: 'bowl', scale: 1.28, start: { p: [0.3, -0.5, 3.0], r: [0.2, -0.2, -0.14] }, endR: [0, 0.15, 0] },
]

// How much vertical stacking room one unit of `scale` occupies for each shape —
// derived by fitting the prototype's original hand-tuned end.y deltas (they came out
// to a near-constant ~0.06 per unit of plate scale; the bowl constant is estimated
// the same way since nothing in the prototype ever stacks on top of the bowl).
const THICKNESS_PER_SCALE: Record<DishShape, number> = { plate: 0.06, bowl: 0.1 }

function computeFlushStackY(specs: DishSpec[]): number[] {
  let cumulative = 0
  return specs.map((spec) => {
    const y = cumulative
    cumulative += THICKNESS_PER_SCALE[spec.shape] * spec.scale
    return y
  })
}

type Tier = {
  name: 'desktop' | 'mobile'
  specIndices: number[]
  latheSegments: number
  shadowMapSize: number
  pixelRatioCap: number
  envSize: { w: number; h: number }
}

const TIERS: Record<'desktop' | 'mobile', Tier> = {
  desktop: {
    name: 'desktop',
    specIndices: [0, 1, 2, 3, 4, 5, 6],
    latheSegments: 128,
    shadowMapSize: 2048,
    pixelRatioCap: 2,
    envSize: { w: 512, h: 256 },
  },
  // Fewer dishes + lighter geometry/shadow/env resolution for weaker mobile GPUs.
  mobile: {
    name: 'mobile',
    specIndices: [0, 2, 4, 6],
    latheSegments: 64,
    shadowMapSize: 1024,
    pixelRatioCap: 1.5,
    envSize: { w: 256, h: 128 },
  },
}

function getTier(): Tier {
  return typeof window !== 'undefined' && window.innerWidth < 768 ? TIERS.mobile : TIERS.desktop
}

function mulberry32(a: number) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function P(THREE: THREE, points: [number, number][]) {
  return points.map((p) => new THREE.Vector2(p[0], p[1]))
}

function plateProfile(THREE: THREE) {
  return P(THREE, [
    [0.0, 0.06],
    [0.34, 0.045],
    [0.6, 0.05],
    [0.8, 0.12],
    [0.94, 0.185],
    [1.0, 0.2],
    [1.0, 0.12],
    [0.9, 0.082],
    [0.66, 0.072],
    [0.64, 0.0],
    [0.56, 0.0],
    [0.54, 0.072],
    [0.2, 0.076],
    [0.0, 0.078],
  ])
}

function bowlProfile(THREE: THREE) {
  return P(THREE, [
    [0.0, 0.07],
    [0.3, 0.03],
    [0.52, 0.07],
    [0.74, 0.32],
    [0.86, 0.56],
    [0.9, 0.62],
    [0.855, 0.615],
    [0.78, 0.47],
    [0.6, 0.23],
    [0.4, 0.095],
    [0.34, 0.0],
    [0.26, 0.0],
    [0.24, 0.085],
    [0.1, 0.092],
    [0.0, 0.094],
  ])
}

/** Procedural "studio" reflection environment — soft gradient + bright window glows. */
function envTexture(THREE: THREE, size: { w: number; h: number }) {
  const { w, h } = size
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const x = c.getContext('2d')!
  const g = x.createLinearGradient(0, 0, 0, h)
  g.addColorStop(0, '#ffffff')
  g.addColorStop(0.42, '#efe9dc')
  g.addColorStop(0.6, '#cfc9bd')
  g.addColorStop(1, '#3c4048')
  x.fillStyle = g
  x.fillRect(0, 0, w, h)
  function glow(cx: number, cy: number, r: number, a: number) {
    const rg = x.createRadialGradient(cx, cy, 0, cx, cy, r)
    rg.addColorStop(0, `rgba(255,255,255,${a})`)
    rg.addColorStop(1, 'rgba(255,255,255,0)')
    x.fillStyle = rg
    x.beginPath()
    x.arc(cx, cy, r, 0, 7)
    x.fill()
  }
  glow(w * 0.28, h * 0.3, w * 0.176, 0.9)
  glow(w * 0.7, h * 0.24, w * 0.137, 0.75)
  glow(w * 0.5, h * 0.5, w * 0.234, 0.25)
  const t = new THREE.CanvasTexture(c)
  t.mapping = THREE.EquirectangularReflectionMapping
  return t
}

/** Reactive-glaze color/bump texture — speckled pooled glaze, unique per dish via `seed`. */
function glazeTexture(THREE: THREE, seed: number) {
  const rnd = mulberry32(seed * 911 + 7)
  const s = 256
  const c = document.createElement('canvas')
  c.width = c.height = s
  const x = c.getContext('2d')!
  x.fillStyle = '#5f7387'
  x.fillRect(0, 0, s, s)
  const pools: [string, number][] = [
    ['#8fa2b6', 60],
    ['#aebccb', 44],
    ['#3d4753', 54],
    ['#2b333d', 40],
    ['#c7ccd4', 26],
  ]
  for (let k = 0; k < 190; k++) {
    const [col, mr] = pools[(rnd() * pools.length) | 0]
    const r = 8 + rnd() * mr
    const px = rnd() * s
    const py = rnd() * s
    const g = x.createRadialGradient(px, py, 0, px, py, r)
    g.addColorStop(0, col)
    g.addColorStop(1, 'rgba(95,115,135,0)')
    x.globalAlpha = 0.1 + rnd() * 0.22
    x.fillStyle = g
    x.beginPath()
    x.arc(px, py, r, 0, 7)
    x.fill()
  }
  x.globalAlpha = 1
  for (let k = 0; k < 1500; k++) {
    const px = rnd() * s
    const py = rnd() * s
    const r = rnd() * 1.5 + 0.3
    x.fillStyle = rnd() < 0.7 ? `rgba(20,18,20,${0.28 + rnd() * 0.5})` : `rgba(214,218,226,${0.18 + rnd() * 0.42})`
    x.beginPath()
    x.arc(px, py, r, 0, 7)
    x.fill()
  }
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(2, 1)
  t.anisotropy = 4
  t.encoding = THREE.sRGBEncoding
  return t
}

type Dish = ThreeTypes.Mesh & {
  endScale: number
  floatScale: number
  startP: ThreeTypes.Vector3
  startR: [number, number, number]
  endP: ThreeTypes.Vector3
  endR: [number, number, number]
  phase: number
  spd: number
}

export type HeroSceneHandle = {
  /** Drive the float→stack animation for one frame (0 = drifting apart, 1 = stacked). */
  renderAtProgress: (p: number) => void
  /** Start the rAF loop (driven by `getProgress`). No-op if already running. */
  start: () => void
  /** Stop the rAF loop without tearing anything down (IntersectionObserver/visibility gating). */
  stop: () => void
  /** Full teardown: renderer, geometries, materials, textures, listeners. */
  dispose: () => void
}

export type HeroSceneOptions = {
  canvas: HTMLCanvasElement
  getProgress: () => number
  onContextLost: () => void
}

export async function createHeroScene(
  THREE: THREE,
  { canvas, getProgress, onContextLost }: HeroSceneOptions,
): Promise<HeroSceneHandle> {
  const tier = getTier()

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, tier.pixelRatioCap))
  renderer.setClearColor(0x000000, 0)
  renderer.outputEncoding = THREE.sRGBEncoding
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.0
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(34, window.innerWidth / window.innerHeight, 0.1, 100)
  camera.position.set(0, 2.7, 7.2)
  camera.lookAt(0, 0.7, 0)

  const pmrem = new THREE.PMREMGenerator(renderer)
  pmrem.compileEquirectangularShader()
  const et = envTexture(THREE, tier.envSize)
  scene.environment = pmrem.fromEquirectangular(et).texture
  et.dispose()
  pmrem.dispose()

  scene.add(new THREE.HemisphereLight(0xffffff, 0x5b6472, 0.35))
  const key = new THREE.DirectionalLight(0xfff4e6, 1.0)
  key.position.set(-4.5, 7, 5)
  key.castShadow = true
  key.shadow.mapSize.set(tier.shadowMapSize, tier.shadowMapSize)
  key.shadow.camera.near = 1
  key.shadow.camera.far = 30
  key.shadow.camera.left = -6
  key.shadow.camera.right = 6
  key.shadow.camera.top = 6
  key.shadow.camera.bottom = -6
  key.shadow.bias = -0.0004
  key.shadow.radius = 4
  scene.add(key)
  const fill = new THREE.DirectionalLight(0xbcd0e0, 0.35)
  fill.position.set(5, 2, 3)
  scene.add(fill)
  const rim = new THREE.DirectionalLight(0xffffff, 0.5)
  rim.position.set(2, 4, -6)
  scene.add(rim)

  function makeDish(shape: DishShape, seed: number): Dish {
    const profile = shape === 'bowl' ? bowlProfile(THREE) : plateProfile(THREE)
    const geo = new THREE.LatheGeometry(profile, tier.latheSegments)
    geo.computeVertexNormals()
    const tex = glazeTexture(THREE, seed)
    const mat = new THREE.MeshPhysicalMaterial({
      map: tex,
      bumpMap: tex,
      bumpScale: 0.004,
      color: 0xffffff,
      roughness: 0.42,
      metalness: 0.0,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      envMapIntensity: 1.0,
    })
    const m = new THREE.Mesh(geo, mat) as unknown as Dish
    m.castShadow = true
    m.receiveShadow = true
    return m
  }

  const specs = tier.specIndices.map((i) => BASE_SPECS[i])
  const stackY = computeFlushStackY(specs)

  // Aspect-aware float spread: compress how far dishes drift apart on the x axis for
  // narrow/tall viewports (less horizontal room), but keep the z depth lanes as
  // tuned — those don't depend on viewport width.
  const aspect = window.innerWidth / window.innerHeight
  const xCompress = Math.min(1, Math.max(0.55, aspect))

  const dishes: Dish[] = specs.map((spec, i) => {
    const m = makeDish(spec.shape, i + 1)
    m.endScale = spec.scale
    m.floatScale = spec.scale * 0.5
    m.scale.setScalar(m.floatScale)
    m.startP = new THREE.Vector3(spec.start.p[0] * xCompress, spec.start.p[1], spec.start.p[2])
    m.startR = spec.start.r
    m.endP = new THREE.Vector3(0, stackY[i], 0)
    m.endR = spec.endR
    m.phase = i * 1.7
    m.spd = 0.6 + i * 0.12
    scene.add(m)
    return m
  })

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: 0 }))
  ground.rotation.x = -Math.PI / 2
  ground.position.y = -0.001
  ground.receiveShadow = true
  scene.add(ground)

  const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t
  const smooth = (e0: number, e1: number, x: number) => {
    const t = Math.min(Math.max((x - e0) / (e1 - e0), 0), 1)
    return t * t * (3 - 2 * t)
  }
  const tmp = new THREE.Vector3()

  function renderAtProgress(raw: number) {
    const time = performance.now()
    const p = easeInOut(raw)
    const idle = 1 - p
    const grow = smooth(0.22, 0.96, raw)
    dishes.forEach((d) => {
      tmp.lerpVectors(d.startP, d.endP, p)
      tmp.y += Math.sin(time * 0.001 * d.spd + d.phase) * 0.16 * idle
      tmp.x += Math.cos(time * 0.0007 * d.spd + d.phase) * 0.08 * idle * xCompress
      d.position.copy(tmp)
      d.scale.setScalar(lerp(d.floatScale, d.endScale, grow))
      d.rotation.set(
        lerp(d.startR[0], d.endR[0], p) + Math.sin(time * 0.0006 + d.phase) * 0.09 * idle,
        lerp(d.startR[1], d.endR[1], p) + time * 0.00015 * idle,
        lerp(d.startR[2], d.endR[2], p) + Math.cos(time * 0.0005 + d.phase) * 0.08 * idle,
      )
    })
    ;(ground.material as ThreeTypes.ShadowMaterial).opacity = smooth(0.4, 1, p) * 0.32
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
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
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
    dishes.forEach((d) => {
      d.geometry.dispose()
      const mat = d.material as ThreeTypes.MeshPhysicalMaterial
      mat.map?.dispose()
      mat.bumpMap?.dispose()
      mat.dispose()
    })
    ground.geometry.dispose()
    ;(ground.material as ThreeTypes.Material).dispose()
    scene.environment?.dispose()
    renderer.dispose()
  }

  return { renderAtProgress, start, stop, dispose }
}
