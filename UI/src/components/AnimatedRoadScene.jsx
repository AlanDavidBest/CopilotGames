import { useEffect, useRef } from 'react'

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)
const lerp = (a, b, t) => a + (b - a) * t

function mixColor(far, near, depth, alpha = 1) {
  const r = Math.round(lerp(far[0], near[0], depth))
  const g = Math.round(lerp(far[1], near[1], depth))
  const b = Math.round(lerp(far[2], near[2], depth))
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function drawHillBand(ctx, width, height, band, t) {
  const { y, amplitude, wavelength, speed, color, offset } = band
  ctx.beginPath()
  ctx.moveTo(-30, height)

  for (let x = -30; x <= width + 30; x += 12) {
    const waveX = (x + t * speed + offset) / wavelength
    const localAmplitude = amplitude * (0.75 + 0.25 * Math.sin(waveX * 0.45 + 1.2))
    const hillY = y + Math.sin(waveX) * localAmplitude + Math.sin(waveX * 0.4) * (localAmplitude * 0.6)
    ctx.lineTo(x, hillY)
  }

  ctx.lineTo(width + 30, height)
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
}

function drawDistantMountains(ctx, width, height, t, horizonY) {
  const baseY = horizonY + height * 0.015

  const makeMountainRange = (ridgeColor, shadowColor, ampA, ampB, speed, seed, alpha = 1) => {
    ctx.beginPath()
    ctx.moveTo(-30, height)

    for (let x = -30; x <= width + 30; x += 10) {
      const w = (x + t * speed + seed) / (width * 0.28)
      const peakA = Math.sin(w * 1.35 + seed * 0.003) * ampA
      const peakB = Math.sin(w * 2.25 + 1.2 + seed * 0.0017) * ampB
      const serration = Math.sin(w * 6.9 + seed * 0.009) * (ampB * 0.35)
      const y = baseY - peakA - peakB - serration
      ctx.lineTo(x, y)
    }

    ctx.lineTo(width + 30, height)
    ctx.closePath()
    ctx.fillStyle = ridgeColor
    ctx.globalAlpha = alpha
    ctx.fill()

    ctx.globalAlpha = alpha * 0.38
    ctx.fillStyle = shadowColor
    ctx.beginPath()
    ctx.moveTo(-30, baseY + 2)
    for (let x = -30; x <= width + 30; x += 14) {
      const w = (x + t * speed + seed) / (width * 0.26)
      const y = baseY - Math.sin(w * 1.4 + 0.9) * (ampA * 0.58) - Math.sin(w * 2.35 + 2.1) * (ampB * 0.52)
      ctx.lineTo(x, y + 7)
    }
    ctx.lineTo(width + 30, baseY + 12)
    ctx.lineTo(width + 30, height)
    ctx.lineTo(-30, height)
    ctx.closePath()
    ctx.fill()
    ctx.globalAlpha = 1
  }

  makeMountainRange('rgba(194, 206, 228, 0.9)', 'rgba(140, 155, 188, 0.7)', 22, 12, 1.6, 180, 0.95)
  makeMountainRange('rgba(172, 190, 214, 0.94)', 'rgba(122, 141, 176, 0.75)', 34, 16, 2.2, 620, 1)
}

function drawHighBackdropMountains(ctx, width, height, t) {
  const baseY = height * 0.21
  ctx.beginPath()
  ctx.moveTo(-40, 0)
  ctx.lineTo(-40, baseY)

  for (let x = -40; x <= width + 40; x += 10) {
    const w = (x + t * 1.1 + 120) / (width * 0.24)
    const broad = Math.sin(w * 1.45 + 0.4) * (height * 0.07)
    const medium = Math.sin(w * 2.6 + 1.9) * (height * 0.034)
    const sharp = Math.sin(w * 5.9 + 2.7) * (height * 0.013)
    const y = baseY - broad - medium - sharp
    ctx.lineTo(x, y)
  }

  ctx.lineTo(width + 40, 0)
  ctx.closePath()

  const highGradient = ctx.createLinearGradient(0, 0, 0, baseY + height * 0.08)
  highGradient.addColorStop(0, 'rgba(167, 163, 150, 0.7)')
  highGradient.addColorStop(1, 'rgba(142, 156, 168, 0.62)')
  ctx.fillStyle = highGradient
  ctx.fill()
}

function getRoadGeometry(width, height) {
  const centerX = width / 2
  const horizonY = height * 0.5
  const roadBottomWidth = clamp(width * 0.68, 280, width - 24)
  const roadTopWidth = clamp(width * 0.052, 34, 74)

  const leftBottom = centerX - roadBottomWidth / 2
  const rightBottom = centerX + roadBottomWidth / 2
  const leftTop = centerX - roadTopWidth / 2
  const rightTop = centerX + roadTopWidth / 2

  const halfWidthAtY = (y) => {
    const depth = clamp((y - horizonY) / (height - horizonY), 0, 1)
    return lerp(roadTopWidth / 2, roadBottomWidth / 2, depth)
  }

  return {
    horizonY,
    centerX,
    leftBottom,
    rightBottom,
    leftTop,
    rightTop,
    roadTopWidth,
    roadBottomWidth,
    halfWidthAtY,
  }
}

function drawPassingSideHills(ctx, width, height, t, road) {
  const { centerX, horizonY, halfWidthAtY } = road
  const hillCount = 10
  const stageWindow = 0.22
  const cycleSeconds = 9.4
  const stageFromY = height + 180
  const startMoveY = horizonY + 62
  const endY = height + 260
  const travel = endY - startMoveY
  const layers = []

  for (let i = 0; i < hillCount; i += 1) {
    const cycle = ((t / cycleSeconds) + i / hillCount) % 1
    let y = stageFromY
    let alpha = 0

    if (cycle < stageWindow) {
      // Stage hills from near-bottom upward to the horizon while fading in.
      const stageProgress = cycle / stageWindow
      const settle = Math.pow(stageProgress, 0.82)
      y = lerp(stageFromY, startMoveY, settle)
      alpha = stageProgress
    } else {
      const moveProgress = (cycle - stageWindow) / (1 - stageWindow)
      // Low exponential acceleration: slow near horizon, faster toward the foreground.
      const accel = (Math.exp(moveProgress * 1.55) - 1) / (Math.exp(1.55) - 1)
      y = startMoveY + accel * travel
      alpha = 1
    }

    const depth = clamp((y - horizonY) / (height - horizonY), 0, 1)
    const halfRoad = halfWidthAtY(y)
    const easedDepth = Math.pow(depth, 1.25)
    const ridgeHeight = lerp(18, 300, easedDepth)
    const outward = lerp(20, 300, easedDepth)

    ;[-1, 1].forEach((side) => {
      layers.push({ i, side, y, depth: easedDepth, halfRoad, ridgeHeight, outward, alpha })
    })
  }

  // Paint far-to-near so foreground terrain always sits on top with no transparency bleed.
  layers.sort((a, b) => a.depth - b.depth)

  layers.forEach(({ i, side, y, depth, halfRoad, ridgeHeight, outward, alpha }) => {
    const nearEdgeX = centerX + side * (halfRoad + outward)
    const outerX = side < 0 ? -480 : width + 480
    const hueShift = side < 0 ? 0.07 : -0.05
    const wobble = Math.sin(t * 0.62 + i * 1.21 + side * 0.76)
    const farColor = [129, 195, 172]
    const nearColor = [73, 176, 122]

    // Opaque while moving; only staged far hills are translucent.
    ctx.fillStyle = mixColor(farColor, nearColor, clamp(depth + hueShift, 0, 1), alpha)

    ctx.beginPath()
    // Extend below the viewport so terrain always feels continuous under the road edges.
    ctx.moveTo(outerX, height + 320)
    ctx.lineTo(outerX, y - ridgeHeight * 0.22)

    for (let step = 0; step <= 9; step += 1) {
      const p = step / 9
      const x = lerp(outerX, nearEdgeX, p)
      const ridge = y - ridgeHeight * (0.7 + Math.sin(p * Math.PI * 1.35 + i * 0.9 + wobble) * 0.22)
      const drop = Math.sin(p * Math.PI * 3.2 + i * 0.55 + side) * ridgeHeight * 0.1
      const crag = Math.sin(p * Math.PI * 7.5 + i * 0.45) * ridgeHeight * 0.035
      ctx.lineTo(x, ridge + drop + crag)
    }

    ctx.lineTo(nearEdgeX, height + 320)
    ctx.closePath()
    ctx.fill()

    // Keep highlight subtle; tie intensity to stage alpha so fade-in remains cohesive.
    ctx.fillStyle = mixColor([187, 230, 202], [113, 206, 160], depth, 0.14 * alpha)
    ctx.beginPath()
    ctx.ellipse(nearEdgeX - side * ridgeHeight * 0.16, y - ridgeHeight * 0.22, ridgeHeight * 0.3, ridgeHeight * 0.19, side * 0.2, 0, Math.PI * 2)
    ctx.fill()
  })
}

function drawRoad(ctx, width, height, t, road) {
  const { horizonY, centerX, leftBottom, rightBottom, leftTop, rightTop, roadTopWidth, roadBottomWidth } = road

  const roadGradient = ctx.createLinearGradient(0, horizonY, 0, height)
  roadGradient.addColorStop(0, '#9ca4b2')
  roadGradient.addColorStop(0.32, '#7d8799')
  roadGradient.addColorStop(1, '#586073')

  ctx.beginPath()
  ctx.moveTo(leftBottom, height)
  ctx.lineTo(leftTop, horizonY)
  ctx.lineTo(rightTop, horizonY)
  ctx.lineTo(rightBottom, height)
  ctx.closePath()
  ctx.fillStyle = roadGradient
  ctx.fill()

  ctx.beginPath()
  ctx.moveTo(leftBottom, height)
  ctx.lineTo(leftTop, horizonY)
  ctx.strokeStyle = 'rgba(255, 246, 205, 0.94)'
  ctx.lineWidth = 5
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(rightBottom, height)
  ctx.lineTo(rightTop, horizonY)
  ctx.stroke()

  const cycle = 1.25
  const segmentLength = 0.11
  for (let i = 0; i < 16; i += 1) {
    const phase = ((t * 0.42 + i * segmentLength) % cycle) / cycle
    const yNear = horizonY + phase * phase * (height - horizonY)
    const yFar = horizonY + Math.pow(clamp(phase - 0.06, 0, 1), 2) * (height - horizonY)

    if (yNear <= yFar + 2) {
      continue
    }

    const depth = (yNear - horizonY) / (height - horizonY)
    const halfWidth = (roadTopWidth / 2) + ((roadBottomWidth - roadTopWidth) / 2) * depth
    const markerWidth = clamp(3 + depth * 10, 3, 14)

    ctx.beginPath()
    ctx.moveTo(centerX - markerWidth / 2, yNear)
    ctx.lineTo(centerX - markerWidth / 2, yFar)
    ctx.lineTo(centerX + markerWidth / 2, yFar)
    ctx.lineTo(centerX + markerWidth / 2, yNear)
    ctx.closePath()
    ctx.fillStyle = mixColor([255, 243, 193], [255, 211, 124], depth, 0.92)
    ctx.fill()

    ctx.fillStyle = 'rgba(30, 32, 36, 0.2)'
    ctx.fillRect(centerX - halfWidth - 7, yNear, 4, yFar - yNear)
    ctx.fillRect(centerX + halfWidth + 3, yNear, 4, yFar - yNear)
  }

  // Atmospheric fade near the vanishing point for stronger depth.
  const hazeGradient = ctx.createLinearGradient(0, horizonY - 6, 0, horizonY + height * 0.34)
  hazeGradient.addColorStop(0, 'rgba(224, 239, 255, 0.66)')
  hazeGradient.addColorStop(0.7, 'rgba(224, 239, 255, 0.1)')
  hazeGradient.addColorStop(1, 'rgba(224, 239, 255, 0)')

  ctx.beginPath()
  ctx.moveTo(leftTop - 6, horizonY)
  ctx.lineTo(rightTop + 6, horizonY)
  ctx.lineTo(rightBottom, height)
  ctx.lineTo(leftBottom, height)
  ctx.closePath()
  ctx.fillStyle = hazeGradient
  ctx.fill()
}

function drawSky(ctx, width, height, t) {
  const gradient = ctx.createLinearGradient(0, 0, 0, height)
  gradient.addColorStop(0, '#ffdff1')
  gradient.addColorStop(0.26, '#ffe4bf')
  gradient.addColorStop(0.58, '#c5f0ff')
  gradient.addColorStop(1, '#8fdbff')

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  const sunX = width * 0.72 + Math.sin(t * 0.12) * width * 0.04
  const sunY = height * 0.19
  const sunRadius = width * 0.09
  const sunGradient = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunRadius)
  sunGradient.addColorStop(0, 'rgba(255, 253, 236, 0.92)')
  sunGradient.addColorStop(1, 'rgba(255, 253, 236, 0)')
  ctx.fillStyle = sunGradient
  ctx.beginPath()
  ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2)
  ctx.fill()

  ctx.globalAlpha = 0.32
  ctx.fillStyle = '#fffdf6'
  ctx.beginPath()
  ctx.ellipse(width * 0.28 + Math.sin(t * 0.08) * 15, height * 0.17, width * 0.1, width * 0.03, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(width * 0.57 + Math.sin(t * 0.1 + 2) * 18, height * 0.14, width * 0.09, width * 0.025, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1
}

export default function AnimatedRoadScene() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const viewport = { width: window.innerWidth, height: window.innerHeight }
    let frameId = 0
    const start = performance.now()

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

    const render = (now) => {
      const t = (now - start) / 1000
      const { width, height } = viewport
      const road = getRoadGeometry(width, height)
      const hillBands = [
        { y: road.horizonY + 36, amplitude: 20, wavelength: 210, speed: 10, color: '#b6e8c4', offset: 30 },
        { y: road.horizonY + 60, amplitude: 26, wavelength: 170, speed: -14, color: '#97dfb5', offset: 135 },
        { y: road.horizonY + 84, amplitude: 28, wavelength: 145, speed: 18, color: '#7fd6ae', offset: 230 },
      ]

      drawSky(ctx, width, height, t)
      drawHighBackdropMountains(ctx, width, height, t)
      drawDistantMountains(ctx, width, height, t, road.horizonY)
      hillBands.forEach((band) => drawHillBand(ctx, width, height, band, t))
      drawPassingSideHills(ctx, width, height, t, road)
      drawRoad(ctx, width, height, t, road)

      frameId = window.requestAnimationFrame(render)
    }

    resize()
    frameId = window.requestAnimationFrame(render)
    window.addEventListener('resize', resize)

    return () => {
      window.cancelAnimationFrame(frameId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={canvasRef} className="scene-canvas" aria-hidden="true" />
}
