import { useEffect, useRef } from 'react'

const SHAPE_TYPES = ['cube', 'tetra', 'octa', 'prism']

const randomRange = (min, max) => min + Math.random() * (max - min)

function getGeometry(type) {
  if (type === 'tetra') {
    const vertices = [
      [1, 1, 1],
      [-1, -1, 1],
      [-1, 1, -1],
      [1, -1, -1],
    ]
    const edges = [
      [0, 1], [0, 2], [0, 3],
      [1, 2], [1, 3], [2, 3],
    ]
    return { vertices, edges }
  }

  if (type === 'octa') {
    const vertices = [
      [1, 0, 0],
      [-1, 0, 0],
      [0, 1, 0],
      [0, -1, 0],
      [0, 0, 1],
      [0, 0, -1],
    ]
    const edges = [
      [0, 2], [0, 3], [0, 4], [0, 5],
      [1, 2], [1, 3], [1, 4], [1, 5],
      [2, 4], [2, 5], [3, 4], [3, 5],
    ]
    return { vertices, edges }
  }

  if (type === 'prism') {
    const vertices = [
      [-1, -1, 1],
      [1, -1, 1],
      [1, 1, 1],
      [-1, 1, 1],
      [-0.6, -0.6, -1],
      [0.6, -0.6, -1],
      [0.6, 0.6, -1],
      [-0.6, 0.6, -1],
    ]
    const edges = [
      [0, 1], [1, 2], [2, 3], [3, 0],
      [4, 5], [5, 6], [6, 7], [7, 4],
      [0, 4], [1, 5], [2, 6], [3, 7],
    ]
    return { vertices, edges }
  }

  const vertices = [
    [-1, -1, -1],
    [1, -1, -1],
    [1, 1, -1],
    [-1, 1, -1],
    [-1, -1, 1],
    [1, -1, 1],
    [1, 1, 1],
    [-1, 1, 1],
  ]
  const edges = [
    [0, 1], [1, 2], [2, 3], [3, 0],
    [4, 5], [5, 6], [6, 7], [7, 4],
    [0, 4], [1, 5], [2, 6], [3, 7],
  ]
  return { vertices, edges }
}

function rotatePoint([x, y, z], rx, ry, rz) {
  const cx = Math.cos(rx)
  const sx = Math.sin(rx)
  const cy = Math.cos(ry)
  const sy = Math.sin(ry)
  const cz = Math.cos(rz)
  const sz = Math.sin(rz)

  let ny = y * cx - z * sx
  let nz = y * sx + z * cx
  let nx = x

  const tx = nx * cy + nz * sy
  const tz = -nx * sy + nz * cy
  nx = tx
  nz = tz

  const fx = nx * cz - ny * sz
  const fy = nx * sz + ny * cz

  return [fx, fy, nz]
}

function getMenuRect() {
  const menu = document.querySelector('.menu-shell')
  if (menu) {
    return menu.getBoundingClientRect()
  }

  const wrap = document.querySelector('.screen-wrap')
  if (wrap) {
    return wrap.getBoundingClientRect()
  }

  return null
}

export default function PsychedelicWireframeScene({ shapeCount = 118 }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const viewport = { width: window.innerWidth, height: window.innerHeight }

    const shapes = Array.from({ length: shapeCount }, () => {
      const type = SHAPE_TYPES[Math.floor(Math.random() * SHAPE_TYPES.length)]
      return {
        ...getGeometry(type),
        x: randomRange(-viewport.width * 0.45, viewport.width * 0.45),
        y: randomRange(-viewport.height * 0.42, viewport.height * 0.42),
        z: randomRange(180, 980),
        vx: randomRange(-46, 46),
        vy: randomRange(-34, 34),
        vz: randomRange(-62, 62),
        driftX: randomRange(-22, 22),
        driftY: randomRange(-18, 18),
        driftZ: randomRange(-55, 55),
        size: randomRange(20, 168),
        hue: randomRange(0, 360),
        hueSpeed: randomRange(18, 64),
        rotX: randomRange(0, Math.PI * 2),
        rotY: randomRange(0, Math.PI * 2),
        rotZ: randomRange(0, Math.PI * 2),
        rotSpeedX: randomRange(-0.9, 0.9),
        rotSpeedY: randomRange(-1.15, 1.15),
        rotSpeedZ: randomRange(-0.75, 0.75),
        scaleX: randomRange(0.6, 1.4),
        scaleY: randomRange(0.6, 1.4),
        scaleZ: randomRange(0.6, 1.4),
        pulseA: randomRange(0.7, 1.6),
        pulseB: randomRange(0.8, 1.8),
        pulseC: randomRange(0.6, 1.5),
        phase: randomRange(0, Math.PI * 2),
        fadePhase: randomRange(0, Math.PI * 2),
        fadeSpeed: randomRange(0.25, 0.95),
        fadeFloor: randomRange(0.08, 0.28),
        fadeCeil: randomRange(0.65, 1),
        trailProjected: [],
      }
    })

    let frameId = 0
    const start = performance.now()
    let previousTime = start

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      viewport.width = window.innerWidth
      viewport.height = window.innerHeight
      canvas.width = Math.floor(viewport.width * dpr)
      canvas.height = Math.floor(viewport.height * dpr)
      canvas.style.width = `${viewport.width}px`
      canvas.style.height = `${viewport.height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const wrapShape = (shape, width, height) => {
      const boundX = width * 0.72
      const boundY = height * 0.66

      if (shape.x < -boundX) shape.x = boundX
      if (shape.x > boundX) shape.x = -boundX
      if (shape.y < -boundY) shape.y = boundY
      if (shape.y > boundY) shape.y = -boundY
      if (shape.z < 130) shape.z = 980
      if (shape.z > 1040) shape.z = 180
    }

    const bounceOffMenuContainer = (shape, focal, cx, cy, menuRect) => {
      if (!menuRect) return

      const p = focal / (focal + shape.z)
      const sx = cx + shape.x * p
      const sy = cy + shape.y * p
      const sr = Math.max(6, shape.size * 0.28 * p)

      const insideX = sx > menuRect.left - sr && sx < menuRect.right + sr
      const insideY = sy > menuRect.top - sr && sy < menuRect.bottom + sr
      if (!insideX || !insideY) return

      const distLeft = Math.abs(sx - menuRect.left)
      const distRight = Math.abs(menuRect.right - sx)
      const distTop = Math.abs(sy - menuRect.top)
      const distBottom = Math.abs(menuRect.bottom - sy)
      const minDist = Math.min(distLeft, distRight, distTop, distBottom)

      const bounceGain = 1.02
      if (minDist === distLeft) {
        const target = menuRect.left - sr - 1
        shape.x = (target - cx) / p
        shape.vx = -Math.abs(shape.vx) * bounceGain
      } else if (minDist === distRight) {
        const target = menuRect.right + sr + 1
        shape.x = (target - cx) / p
        shape.vx = Math.abs(shape.vx) * bounceGain
      } else if (minDist === distTop) {
        const target = menuRect.top - sr - 1
        shape.y = (target - cy) / p
        shape.vy = -Math.abs(shape.vy) * bounceGain
      } else {
        const target = menuRect.bottom + sr + 1
        shape.y = (target - cy) / p
        shape.vy = Math.abs(shape.vy) * bounceGain
      }
    }

    const render = (now) => {
      const t = (now - start) / 1000
      const dt = Math.min(0.05, (now - previousTime) / 1000)
      previousTime = now
      const { width, height } = viewport

      const bgGradient = ctx.createLinearGradient(0, 0, width, height)
      bgGradient.addColorStop(0, `hsl(${(t * 18 + 312) % 360} 24% 4%)`)
      bgGradient.addColorStop(0.5, `hsl(${(t * 24 + 42) % 360} 28% 6%)`)
      bgGradient.addColorStop(1, `hsl(${(t * 22 + 188) % 360} 24% 1%)`)
      ctx.fillStyle = bgGradient
      ctx.fillRect(0, 0, width, height)

      // Retro disco beams sweeping across the back layer.
      for (let i = 0; i < 6; i += 1) {
        const pivotX = width * (0.12 + i * 0.16)
        const pivotY = height * 1.07
        const beamAngle = Math.sin(t * 0.7 + i * 0.9) * 0.65 + (i % 2 === 0 ? -0.3 : 0.3)
        const beamLength = height * 1.2
        const beamWidth = width * 0.14
        const tipX = pivotX + Math.sin(beamAngle) * beamLength
        const tipY = pivotY - Math.cos(beamAngle) * beamLength

        ctx.save()
        ctx.beginPath()
        ctx.moveTo(pivotX - beamWidth * 0.5, pivotY)
        ctx.lineTo(pivotX + beamWidth * 0.5, pivotY)
        ctx.lineTo(tipX, tipY)
        ctx.closePath()
        const beam = ctx.createLinearGradient(pivotX, pivotY, tipX, tipY)
        beam.addColorStop(0, `hsla(${(t * 50 + i * 42) % 360}, 95%, 66%, 0.2)`)
        beam.addColorStop(1, 'rgba(0, 0, 0, 0)')
        ctx.fillStyle = beam
        ctx.fill()
        ctx.restore()
      }

      for (let i = 0; i < 22; i += 1) {
        const cx = width * (0.04 + (i % 11) * 0.095) + Math.sin(t * 0.42 + i * 0.8) * 48
        const cy = height * (0.1 + Math.floor(i / 11) * 0.55) + Math.cos(t * 0.52 + i * 0.67) * 42
        const r = width * (0.08 + (i % 3) * 0.018)
        const orb = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
        orb.addColorStop(0, `hsla(${(t * 65 + i * 26) % 360}, 98%, 68%, 0.27)`)
        orb.addColorStop(1, 'rgba(0, 0, 0, 0)')
        ctx.fillStyle = orb
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.fill()
      }

      const focal = Math.max(width, height) * 0.9
      const cx = width / 2
      const cy = height / 2
      const menuRect = getMenuRect()

      shapes.sort((a, b) => b.z - a.z)
      shapes.forEach((shape) => {
        shape.x += shape.vx * dt + Math.sin(t * 0.3 + shape.phase) * shape.driftX * 0.018
        shape.y += shape.vy * dt + Math.cos(t * 0.33 + shape.phase) * shape.driftY * 0.016
        shape.z += shape.vz * dt + Math.sin(t * 0.22 + shape.phase) * shape.driftZ * 0.024

        // bounceOffMenuContainer(shape, focal, cx, cy, menuRect)

        wrapShape(shape, width, height)

        const localScaleX = shape.scaleX * (1 + Math.sin(t * shape.pulseA + shape.phase) * 0.36)
        const localScaleY = shape.scaleY * (1 + Math.cos(t * shape.pulseB + shape.phase * 0.7) * 0.34)
        const localScaleZ = shape.scaleZ * (1 + Math.sin(t * shape.pulseC + shape.phase * 0.9) * 0.32)

        const rx = shape.rotX + t * shape.rotSpeedX
        const ry = shape.rotY + t * shape.rotSpeedY
        const rz = shape.rotZ + t * shape.rotSpeedZ

        const projected = shape.vertices.map((v) => {
          const scaled = [
            v[0] * shape.size * localScaleX,
            v[1] * shape.size * localScaleY,
            v[2] * shape.size * localScaleZ,
          ]
          const [wx, wy, wz] = rotatePoint(scaled, rx, ry, rz)
          const dz = shape.z + wz
          const p = focal / (focal + dz)

          return {
            x: cx + (shape.x + wx) * p,
            y: cy + (shape.y + wy) * p,
            depth: dz,
            scale: p,
          }
        })

        const hue = (shape.hue + t * shape.hueSpeed) % 360
        const depthAlpha = Math.min(0.95, 0.3 + (1 - shape.z / 1100) * 0.85)
        const fadeWave = (Math.sin(t * shape.fadeSpeed + shape.fadePhase) + 1) * 0.5
        const fadeAlpha = shape.fadeFloor + (shape.fadeCeil - shape.fadeFloor) * fadeWave
        const alpha = depthAlpha * fadeAlpha

        if (shape.trailProjected.length > 0) {
          const latest = shape.trailProjected[shape.trailProjected.length - 1]
          const jump = Math.hypot(projected[0].x - latest[0].x, projected[0].y - latest[0].y)

          if (jump < 90) {
            shape.trailProjected.forEach((trailFrame, index) => {
              const ghostT = (index + 1) / shape.trailProjected.length
              const ghostAlpha = alpha * (0.06 + ghostT * 0.18)
              ctx.strokeStyle = `hsla(${(hue + 22 + index * 6) % 360}, 100%, 72%, ${ghostAlpha})`
              ctx.lineWidth = Math.max(0.35, 0.9 + ghostT * 0.8)

              shape.edges.forEach(([a, b]) => {
                const va = trailFrame[a]
                const vb = trailFrame[b]
                ctx.beginPath()
                ctx.moveTo(va.x, va.y)
                ctx.lineTo(vb.x, vb.y)
                ctx.stroke()
              })
            })
          } else {
            shape.trailProjected = []
          }
        }

        ctx.strokeStyle = `hsla(${hue}, 100%, 68%, ${alpha})`
        ctx.lineWidth = Math.max(0.7, 2.5 * (1 - shape.z / 1200))

        shape.edges.forEach(([a, b]) => {
          const va = projected[a]
          const vb = projected[b]
          ctx.beginPath()
          ctx.moveTo(va.x, va.y)
          ctx.lineTo(vb.x, vb.y)
          ctx.stroke()
        })

        shape.trailProjected.push(projected.map((point) => ({ x: point.x, y: point.y })))
        if (shape.trailProjected.length > 25) {
          shape.trailProjected.shift()
        }
      })

      frameId = window.requestAnimationFrame(render)
    }

    resize()
    frameId = window.requestAnimationFrame(render)
    window.addEventListener('resize', resize)

    return () => {
      window.cancelAnimationFrame(frameId)
      window.removeEventListener('resize', resize)
    }
  }, [shapeCount])

  return <canvas ref={canvasRef} className="scene-canvas" aria-hidden="true" />
}
