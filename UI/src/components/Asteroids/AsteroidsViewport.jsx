import { useEffect, useRef, useState } from 'react'

const clampWrap = (value, max) => {
  if (value < 0) return value + max
  if (value > max) return value - max
  return value
}

const randomRange = (min, max) => min + Math.random() * (max - min)
const ASTEROID_TRAIL_LENGTH = 7
const ASTEROID_COLORS = [
  [64, 148, 255],
  [96, 244, 255],
  [72, 255, 140],
  [255, 220, 60],
  [255, 0, 0],
]
const ASTEROID_COLOR_CYCLE = 300

const ASTEROID_CONFIG = {
  large: { minRadius: 42, maxRadius: 58, speedMin: 0.35, speedMax: 0.85, score: 20, splitTo: 'medium' },
  medium: { minRadius: 24, maxRadius: 34, speedMin: 0.85, speedMax: 1.65, score: 35, splitTo: 'small' },
  small: { minRadius: 12, maxRadius: 18, speedMin: 1.85, speedMax: 3.1, score: 55, splitTo: null },
}
const INITIAL_ASTEROID_COUNT = 6
const ASTEROIDS_PER_WAVE_INCREMENT = 5
const SHIP_TURN_RATE = 0.085
const SHIP_THRUST = 0.125
const SHIP_DRAG = 0.994
const BULLET_SPEED = 7.8
const BULLET_LIFE = 64
const BULLET_COOLDOWN = 7

// Mostly convex silhouettes with a few sharp concave notches (arcade-like asteroids).
const ASTEROID_SHAPES = [
  [
    [0.0, 1.08],
    [0.09, 1.16],
    [0.18, 1.04],
    [0.27, 0.76],
    [0.35, 1.14],
    [0.44, 1.07],
    [0.54, 1.19],
    [0.64, 1.02],
    [0.73, 0.81],
    [0.83, 1.11],
    [0.92, 1.0],
  ],
  [
    [0.0, 1.12],
    [0.09, 1.02],
    [0.18, 1.21],
    [0.27, 1.08],
    [0.36, 0.74],
    [0.46, 1.13],
    [0.55, 1.0],
    [0.64, 1.18],
    [0.73, 0.84],
    [0.82, 1.1],
    [0.91, 0.98],
  ],
  [
    [0.0, 1.04],
    [0.09, 1.14],
    [0.18, 1.01],
    [0.28, 0.79],
    [0.37, 1.17],
    [0.46, 1.05],
    [0.56, 0.87],
    [0.65, 1.2],
    [0.74, 1.03],
    [0.83, 1.12],
    [0.92, 0.97],
  ],
]

const createAsteroid = (width, height, options = {}) => {
  const size = options.size ?? 'large'
  const config = ASTEROID_CONFIG[size]
  const radius = options.radius ?? randomRange(config.minRadius, config.maxRadius)

  let x = options.x
  let y = options.y

  if (x === undefined || y === undefined) {
    const side = Math.floor(Math.random() * 4)

    if (side === 0) {
      x = randomRange(0, width)
      y = -radius
    } else if (side === 1) {
      x = width + radius
      y = randomRange(0, height)
    } else if (side === 2) {
      x = randomRange(0, width)
      y = height + radius
    } else {
      x = -radius
      y = randomRange(0, height)
    }
  }

  let vx = options.vx
  let vy = options.vy

  if (vx === undefined || vy === undefined) {
    const angle = randomRange(0, Math.PI * 2)
    const speed = randomRange(config.speedMin, config.speedMax)
    vx = Math.cos(angle) * speed
    vy = Math.sin(angle) * speed
  }

  const shapeTemplate = ASTEROID_SHAPES[Math.floor(Math.random() * ASTEROID_SHAPES.length)]
  const shapeRotation = randomRange(0, Math.PI * 2)

  return {
    x,
    y,
    size,
    radius,
    vx,
    vy,
    rot: randomRange(0, Math.PI * 2),
    rotSpeed: randomRange(-0.02, 0.02),
    trail: [],
    points: shapeTemplate.map(([turn, radiusScale]) => ({
      angle: shapeRotation + turn * Math.PI * 2 + randomRange(-0.02, 0.02),
      r: Math.min(1.24, Math.max(0.72, radiusScale + randomRange(-0.03, 0.03))),
    })),
  }
}

const splitAsteroid = (asteroid, width, height) => {
  const nextSize = ASTEROID_CONFIG[asteroid.size].splitTo
  if (!nextSize) {
    return []
  }

  const baseAngle = Math.atan2(asteroid.vy, asteroid.vx)
  const parentSpeed = Math.hypot(asteroid.vx, asteroid.vy)
  const nextConfig = ASTEROID_CONFIG[nextSize]
  const childSpeed = Math.max(parentSpeed * 1.12, nextConfig.speedMin)
  const spawnDistance = Math.max(asteroid.radius * 0.3, 7)

  // Children keep the parent's general heading while separating by 90 degrees.
  return [-Math.PI / 4, Math.PI / 4].map((offset) => {
    const angle = baseAngle + offset
    return createAsteroid(width, height, {
      size: nextSize,
      x: clampWrap(asteroid.x + Math.cos(angle) * spawnDistance, width),
      y: clampWrap(asteroid.y + Math.sin(angle) * spawnDistance, height),
      vx: Math.cos(angle) * childSpeed,
      vy: Math.sin(angle) * childSpeed,
    })
  })
}

export default function AsteroidsViewport() {
  const canvasRef = useRef(null)
  const controls = useRef({ left: false, right: false, thrust: false, fire: false })
  const livesRef = useRef(3)
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)

  // Keep the ref in sync with state
  useEffect(() => {
    livesRef.current = lives
  }, [lives])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    // --- Web Audio ---
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)()

    // Classic arcade-style two-tone pulse (lower pitch, slower cycle).
    let audioStarted = false
    const droneOsc = audioCtx.createOscillator()
    const droneGain = audioCtx.createGain()
    let pulseTimer = 0
    let toneStep = 0
    const pulseIntervalMs = 820
    const pulseToneHz = [44, 34]

    droneOsc.type = 'square'
    droneOsc.frequency.value = pulseToneHz[0]

    droneGain.gain.value = 0
    droneOsc.connect(droneGain)
    droneGain.connect(audioCtx.destination)

    droneOsc.start()

    const startPulseLoop = () => {
      const pulse = () => {
        if (!audioStarted || audioCtx.state !== 'running') return
        const t = audioCtx.currentTime
        const toneHz = pulseToneHz[toneStep % pulseToneHz.length]
        toneStep += 1
        droneOsc.frequency.setValueAtTime(toneHz, t)
        // Short pulse and longer gap for a slower, distinct two-tone cadence.
        droneGain.gain.cancelScheduledValues(t)
        droneGain.gain.setValueAtTime(0.16, t)
        droneGain.gain.exponentialRampToValueAtTime(0.001, t + 0.28)
        pulseTimer = window.setTimeout(pulse, pulseIntervalMs)
      }
      if (!pulseTimer) pulse()
    }

    const startAudio = () => {
      if (audioStarted) return
      audioStarted = true
      const begin = () => {
        const t = audioCtx.currentTime
        droneGain.gain.cancelScheduledValues(t)
        droneGain.gain.setValueAtTime(0, t)
        droneGain.gain.linearRampToValueAtTime(0.16, t + 1.4)
        startPulseLoop()
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume().then(begin)
      } else {
        begin()
      }
    }

    const playLaser = () => {
      if (audioCtx.state !== 'running') return
      const t = audioCtx.currentTime
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(1400, t)
      osc.frequency.exponentialRampToValueAtTime(160, t + 0.18)
      gain.gain.setValueAtTime(0.22, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18)
      osc.connect(gain)
      gain.connect(audioCtx.destination)
      osc.start(t)
      osc.stop(t + 0.2)
    }

    const playNoiseExplosion = ({ playbackRate = 1, gainAmount = 0.8, filterStart = 700, filterEnd = 60 } = {}) => {
      if (audioCtx.state !== 'running') return
      const t = audioCtx.currentTime
      const dur = 0.9
      const buf = audioCtx.createBuffer(1, Math.floor(audioCtx.sampleRate * dur), audioCtx.sampleRate)
      const data = buf.getChannelData(0)
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
      const src = audioCtx.createBufferSource()
      src.buffer = buf
      src.playbackRate.setValueAtTime(playbackRate, t)
      const filter = audioCtx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(filterStart, t)
      filter.frequency.exponentialRampToValueAtTime(filterEnd, t + dur)
      const gain = audioCtx.createGain()
      gain.gain.setValueAtTime(gainAmount, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur)
      src.connect(filter)
      filter.connect(gain)
      gain.connect(audioCtx.destination)
      src.start(t)
    }

    const playExplosion = () => {
      playNoiseExplosion({ playbackRate: 1, gainAmount: 0.8, filterStart: 700, filterEnd: 60 })
    }

    const playAsteroidHit = () => {
      // Same synthesis as ship explosion, slightly lower pitch with a brighter noise body.
      playNoiseExplosion({ playbackRate: 0.43, gainAmount: 0.55, filterStart: 2400, filterEnd: 140 })
    }
    // --- End Web Audio ---

    const state = {
      width: canvas.clientWidth,
      height: canvas.clientHeight,
      ship: {
        x: canvas.clientWidth / 2,
        y: canvas.clientHeight / 2,
        vx: 0,
        vy: 0,
        angle: -Math.PI / 2,
      },
      bullets: [],
      asteroids: Array.from({ length: INITIAL_ASTEROID_COUNT }, () =>
        createAsteroid(canvas.clientWidth, canvas.clientHeight, { size: 'large' }),
      ),
      wave: 1,
      stars: Array.from({ length: 60 }, () => ({
        x: randomRange(0, canvas.clientWidth),
        y: randomRange(0, canvas.clientHeight),
        z: randomRange(0.2, 1),
      })),
      bulletCooldown: 0,
      particles: [],
      isAlive: true,
      respawnFrames: 0,
      colorTimer: 0,
      shipPieces: [],
      explodeFrames: 0,
      waitingForSafeSpawn: false,
    }

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      state.width = canvas.clientWidth
      state.height = canvas.clientHeight
      canvas.width = Math.floor(state.width * dpr)
      canvas.height = Math.floor(state.height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const SPAWN_SAFETY_RADIUS = 75
    const SPAWN_CHECK_FRAMES = 12

    const canSpawnSafely = () => {
      const spawnX = state.width / 2
      const spawnY = state.height / 2
      // Check if spawn point is currently inside any asteroid
      for (const asteroid of state.asteroids) {
        const dx = spawnX - asteroid.x
        const dy = spawnY - asteroid.y
        const dist = Math.hypot(dx, dy)
        if (dist < asteroid.radius + SPAWN_SAFETY_RADIUS) {
          return false
        }
      }
      // Check if any asteroid will pass through spawn zone in next SPAWN_CHECK_FRAMES frames
      for (const asteroid of state.asteroids) {
        let projX = asteroid.x
        let projY = asteroid.y
        for (let frame = 0; frame < SPAWN_CHECK_FRAMES; frame += 1) {
          projX += asteroid.vx
          projY += asteroid.vy
          const dx = spawnX - projX
          const dy = spawnY - projY
          const dist = Math.hypot(dx, dy)
          if (dist < asteroid.radius + SPAWN_SAFETY_RADIUS) {
            return false
          }
        }
      }
      return true
    }

    const resetShip = () => {
      state.ship.x = state.width / 2
      state.ship.y = state.height / 2
      state.ship.vx = 0
      state.ship.vy = 0
      state.ship.angle = -Math.PI / 2
      state.isAlive = true
      state.respawnFrames = 48
    }

    const shoot = () => {
      if (state.bulletCooldown > 0 || !state.isAlive) {
        return
      }
      state.bullets.push({
        x: state.ship.x + Math.cos(state.ship.angle) * 14,
        y: state.ship.y + Math.sin(state.ship.angle) * 14,
        vx: Math.cos(state.ship.angle) * BULLET_SPEED + state.ship.vx,
        vy: Math.sin(state.ship.angle) * BULLET_SPEED + state.ship.vy,
        life: BULLET_LIFE,
      })
      state.bulletCooldown = BULLET_COOLDOWN
      playLaser()
    }

    const spawnAsteroidParticles = (x, y, radius) => {
      const particleCount = Math.max(6, Math.min(14, Math.floor(radius / 4)))
      for (let i = 0; i < particleCount; i += 1) {
        const angle = randomRange(0, Math.PI * 2)
        const speed = randomRange(1.1, 2.8)
        const life = randomRange(12, 20)
        state.particles.push({
          x: x + randomRange(-radius * 0.08, radius * 0.08),
          y: y + randomRange(-radius * 0.08, radius * 0.08),
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life,
          maxLife: life,
        })
      }
    }

    const handleKeyDown = (event) => {
      startAudio()
      if (event.code === 'ArrowLeft' || event.code === 'KeyA') controls.current.left = true
      if (event.code === 'ArrowRight' || event.code === 'KeyD') controls.current.right = true
      if (event.code === 'ArrowUp' || event.code === 'KeyW') controls.current.thrust = true
      if (event.code === 'Space') {
        event.preventDefault()
        controls.current.fire = true
      }
    }

    const handlePointerDown = () => {
      startAudio()
    }

    const handleKeyUp = (event) => {
      if (event.code === 'ArrowLeft' || event.code === 'KeyA') controls.current.left = false
      if (event.code === 'ArrowRight' || event.code === 'KeyD') controls.current.right = false
      if (event.code === 'ArrowUp' || event.code === 'KeyW') controls.current.thrust = false
      if (event.code === 'Space') controls.current.fire = false
    }

    let frameId = 0

    const tick = () => {
      const { ship } = state

      if (state.bulletCooldown > 0) state.bulletCooldown -= 1

      if (controls.current.left) ship.angle -= SHIP_TURN_RATE
      if (controls.current.right) ship.angle += SHIP_TURN_RATE

      if (controls.current.thrust && state.isAlive) {
        ship.vx += Math.cos(ship.angle) * SHIP_THRUST
        ship.vy += Math.sin(ship.angle) * SHIP_THRUST
      }

      ship.vx *= SHIP_DRAG
      ship.vy *= SHIP_DRAG

      ship.x = clampWrap(ship.x + ship.vx, state.width)
      ship.y = clampWrap(ship.y + ship.vy, state.height)

      if (controls.current.fire) {
        shoot()
      }

      state.bullets = state.bullets
        .map((bullet) => ({
          ...bullet,
          x: clampWrap(bullet.x + bullet.vx, state.width),
          y: clampWrap(bullet.y + bullet.vy, state.height),
          life: bullet.life - 1,
        }))
        .filter((bullet) => bullet.life > 0)

      state.particles = state.particles
        .map((particle) => ({
          ...particle,
          x: particle.x + particle.vx,
          y: particle.y + particle.vy,
          vx: particle.vx * 0.95,
          vy: particle.vy * 0.95,
          life: particle.life - 1,
        }))
        .filter((particle) => particle.life > 0)

      state.asteroids.forEach((asteroid) => {
        if (!asteroid.trail) {
          asteroid.trail = []
        }
        asteroid.trail.unshift({ x: asteroid.x, y: asteroid.y, rot: asteroid.rot })
        if (asteroid.trail.length > ASTEROID_TRAIL_LENGTH) {
          asteroid.trail.length = ASTEROID_TRAIL_LENGTH
        }

        asteroid.x = clampWrap(asteroid.x + asteroid.vx, state.width)
        asteroid.y = clampWrap(asteroid.y + asteroid.vy, state.height)
        asteroid.rot += asteroid.rotSpeed
      })

      const nextAsteroids = []
      let addScore = 0

      state.asteroids.forEach((asteroid) => {
        let hit = false

        state.bullets = state.bullets.filter((bullet) => {
          const dx = bullet.x - asteroid.x
          const dy = bullet.y - asteroid.y
          const dist = Math.hypot(dx, dy)
          if (!hit && dist < asteroid.radius) {
            hit = true
            addScore += ASTEROID_CONFIG[asteroid.size].score
            playAsteroidHit()
            spawnAsteroidParticles(asteroid.x, asteroid.y, asteroid.radius)
            return false
          }
          if (hit && dist < asteroid.radius) {
            return false
          }
          return true
        })

        if (!hit) {
          nextAsteroids.push(asteroid)
        } else {
          nextAsteroids.push(...splitAsteroid(asteroid, state.width, state.height))
        }
      })

      if (addScore > 0) {
        setScore((prev) => prev + addScore)
      }

      if (nextAsteroids.length === 0) {
        state.wave += 1
        const asteroidsInNextWave = INITIAL_ASTEROID_COUNT + (state.wave - 1) * ASTEROIDS_PER_WAVE_INCREMENT
        nextAsteroids.push(
          ...Array.from({ length: asteroidsInNextWave }, () => createAsteroid(state.width, state.height, { size: 'large' })),
        )
      }

      state.asteroids = nextAsteroids

      if (state.isAlive) {
        if (state.respawnFrames > 0) {
          state.respawnFrames -= 1
        } else {
          for (const asteroid of state.asteroids) {
            const dx = ship.x - asteroid.x
            const dy = ship.y - asteroid.y
            const dist = Math.hypot(dx, dy)
            if (dist < asteroid.radius + 10) {
              const sx = ship.x, sy = ship.y, sa = ship.angle
              const localToWorld = (lx, ly) => ({
                x: sx + Math.cos(sa) * lx - Math.sin(sa) * ly,
                y: sy + Math.sin(sa) * lx + Math.cos(sa) * ly,
              })
              const pts = [
                localToWorld(13, 0),
                localToWorld(-10, -8),
                localToWorld(-4, 0),
                localToWorld(-10, 8),
              ]
              state.shipPieces = [[0, 1], [1, 2], [2, 3], [3, 0]].map(([i, j]) => {
                const a = pts[i], b = pts[j]
                const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2
                const pdx = mx - sx, pdy = my - sy
                const pdist = Math.hypot(pdx, pdy) || 1
                const speed = 2 + Math.random() * 1.5
                return {
                  x1: a.x, y1: a.y, x2: b.x, y2: b.y,
                  vx: (pdx / pdist) * speed + (Math.random() - 0.5),
                  vy: (pdy / pdist) * speed + (Math.random() - 0.5),
                }
              })
              state.isAlive = false
              state.explodeFrames = 50
              playExplosion()
              setLives((prev) => Math.max(0, prev - 1))
              break
            }
          }
        }
      } else if (state.explodeFrames > 0) {
        state.explodeFrames -= 1
        state.shipPieces.forEach((piece) => {
          piece.x1 += piece.vx
          piece.y1 += piece.vy
          piece.x2 += piece.vx
          piece.y2 += piece.vy
        })
        if (state.explodeFrames <= 0) {
          state.shipPieces = []
          // Only respawn if we still have lives remaining
          if (livesRef.current > 0) {
            // Check if spawn point is safe; if not, wait for asteroids to clear
            if (canSpawnSafely()) {
              resetShip()
            } else {
              state.waitingForSafeSpawn = true
            }
          }
        }
      } else if (state.waitingForSafeSpawn) {
        // Ship explosion finished, waiting for safe spawn point
        if (canSpawnSafely()) {
          state.waitingForSafeSpawn = false
          resetShip()
        }
      }

      ctx.clearRect(0, 0, state.width, state.height)

      // Starfield background for the arcade space look.
      ctx.fillStyle = 'rgba(2, 9, 18, 0.95)'
      ctx.fillRect(0, 0, state.width, state.height)
      state.stars.forEach((star) => {
        ctx.fillStyle = `rgba(140, 250, 255, ${0.2 + star.z * 0.5})`
        ctx.fillRect(star.x, star.y, star.z * 2, star.z * 2)
      })

      state.colorTimer += 1
      const colorPos = (state.colorTimer / ASTEROID_COLOR_CYCLE) % ASTEROID_COLORS.length
      const colorFrom = ASTEROID_COLORS[Math.floor(colorPos) % ASTEROID_COLORS.length]
      const colorTo = ASTEROID_COLORS[(Math.floor(colorPos) + 1) % ASTEROID_COLORS.length]
      const colorFrac = colorPos - Math.floor(colorPos)
      const cr = Math.round(colorFrom[0] + (colorTo[0] - colorFrom[0]) * colorFrac)
      const cg = Math.round(colorFrom[1] + (colorTo[1] - colorFrom[1]) * colorFrac)
      const cb = Math.round(colorFrom[2] + (colorTo[2] - colorFrom[2]) * colorFrac)

      ctx.lineWidth = 2
      state.asteroids.forEach((asteroid) => {
        const [r, g, b] = [cr, cg, cb]
        asteroid.trail.forEach((ghost, index) => {
          if (index % 3 !== 0) return
          const trailAlpha = ((ASTEROID_TRAIL_LENGTH - index) / ASTEROID_TRAIL_LENGTH) * 0.38
          if (trailAlpha <= 0) {
            return
          }

          ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${trailAlpha})`
          ctx.beginPath()
          asteroid.points.forEach((point, pointIndex) => {
            const angle = point.angle + ghost.rot
            const px = ghost.x + Math.cos(angle) * asteroid.radius * point.r
            const py = ghost.y + Math.sin(angle) * asteroid.radius * point.r
            if (pointIndex === 0) ctx.moveTo(px, py)
            else ctx.lineTo(px, py)
          })
          ctx.closePath()
          ctx.stroke()
        })

        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.85)`
        ctx.beginPath()
        asteroid.points.forEach((point, index) => {
          const angle = point.angle + asteroid.rot
          const px = asteroid.x + Math.cos(angle) * asteroid.radius * point.r
          const py = asteroid.y + Math.sin(angle) * asteroid.radius * point.r
          if (index === 0) ctx.moveTo(px, py)
          else ctx.lineTo(px, py)
        })
        ctx.closePath()
        ctx.stroke()
      })

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)'
      ctx.lineWidth = 2.3

      if (state.shipPieces.length > 0) {
        state.shipPieces.forEach((piece) => {
          ctx.beginPath()
          ctx.moveTo(piece.x1, piece.y1)
          ctx.lineTo(piece.x2, piece.y2)
          ctx.stroke()
        })
      }

      const showShip = state.isAlive && (state.respawnFrames <= 0 || Math.floor(state.respawnFrames / 8) % 2 === 0)
      if (showShip) {
        ctx.save()
        ctx.translate(ship.x, ship.y)
        ctx.rotate(ship.angle)
        ctx.beginPath()
        ctx.moveTo(13, 0)
        ctx.lineTo(-10, -8)
        ctx.lineTo(-4, 0)
        ctx.lineTo(-10, 8)
        ctx.closePath()
        ctx.stroke()

        if (controls.current.thrust && state.isAlive && state.respawnFrames <= 0) {
          ctx.strokeStyle = 'rgba(91, 244, 255, 0.95)'
          ctx.beginPath()
          ctx.moveTo(-10, -4)
          ctx.lineTo(-17 - Math.random() * 8, 0)
          ctx.lineTo(-10, 4)
          ctx.stroke()
        }
        ctx.restore()
      }

      ctx.fillStyle = 'rgba(184, 250, 255, 0.95)'
      state.bullets.forEach((bullet) => {
        ctx.beginPath()
        ctx.arc(bullet.x, bullet.y, 2.1, 0, Math.PI * 2)
        ctx.fill()
      })

      state.particles.forEach((particle) => {
        const alpha = particle.life / particle.maxLife
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, 1.4, 0, Math.PI * 2)
        ctx.fill()
      })

      frameId = window.requestAnimationFrame(tick)
    }

    resize()
    resetShip()
    frameId = window.requestAnimationFrame(tick)

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('resize', resize)
    canvas.addEventListener('pointerdown', handlePointerDown)

    return () => {
      window.cancelAnimationFrame(frameId)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('pointerdown', handlePointerDown)
      if (pulseTimer) window.clearTimeout(pulseTimer)
      droneOsc.stop()
      audioCtx.close()
    }
  }, [])

  return (
    <div className="asteroids-center-wrap">
      <canvas ref={canvasRef} className="asteroids-canvas" />
      <div className="asteroids-overlay">
        <span>Score {String(score).padStart(5, '0')}</span>
        <span>Lives {lives}</span>
        {lives === 0 ? <span style={{ color: '#ff4444', fontSize: '1.5em', fontWeight: 'bold' }}>GAME OVER</span> : <span>Arrows/WASD + Space</span>}
      </div>
    </div>
  )
}
