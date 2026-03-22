import { useEffect, useRef, useState } from 'react'

// ─── Classic pixel-art sprites ────────────────────────────────────────────
// Each sprite is [frame0, frame1] where frame = 2-D array of 0/1 pixels.
// Row 0 → squid (Type 1), rows 1-2 → crab (Type 2), rows 3-4 → octopus (Type 3).

const SI_SQUID = [
  [ // frame 0
    [0,0,0,1,1,0,0,0],
    [0,0,1,1,1,1,0,0],
    [0,1,1,0,0,1,1,0],
    [1,1,0,1,1,0,1,1],
    [1,1,1,1,1,1,1,1],
    [0,1,1,1,1,1,1,0],
    [0,1,0,0,0,0,1,0],
    [1,0,0,0,0,0,0,1],
  ],
  [ // frame 1
    [0,0,0,1,1,0,0,0],
    [0,0,1,1,1,1,0,0],
    [0,1,1,0,0,1,1,0],
    [1,1,0,1,1,0,1,1],
    [1,1,1,1,1,1,1,1],
    [0,1,1,1,1,1,1,0],
    [1,0,1,0,0,1,0,1],
    [0,1,0,0,0,0,1,0],
  ],
]

const SI_CRAB = [
  [ // frame 0
    [0,0,1,0,0,0,0,0,1,0,0],
    [0,0,0,1,0,0,0,1,0,0,0],
    [0,0,1,1,1,1,1,1,1,0,0],
    [0,1,1,0,1,1,1,0,1,1,0],
    [1,1,1,1,1,1,1,1,1,1,1],
    [1,0,1,1,1,1,1,1,1,0,1],
    [1,0,1,0,0,0,0,0,1,0,1],
    [0,0,0,1,0,0,0,1,0,0,0],
  ],
  [ // frame 1
    [0,0,1,0,0,0,0,0,1,0,0],
    [1,0,0,1,0,0,0,1,0,0,1],
    [0,0,1,1,1,1,1,1,1,0,0],
    [0,1,1,0,1,1,1,0,1,1,0],
    [1,1,1,1,1,1,1,1,1,1,1],
    [1,0,1,1,1,1,1,1,1,0,1],
    [0,0,1,0,0,0,0,0,1,0,0],
    [1,0,0,1,0,0,0,1,0,0,1],
  ],
]

const SI_OCTOPUS = [
  [ // frame 0
    [0,0,1,1,1,1,1,1,0,0],
    [0,1,1,1,1,1,1,1,1,0],
    [1,1,1,1,1,1,1,1,1,1],
    [1,1,0,1,1,1,1,0,1,1],
    [1,1,1,1,1,1,1,1,1,1],
    [1,0,0,1,1,1,1,0,0,1],
    [0,1,0,0,0,0,0,0,1,0],
    [0,0,1,0,0,0,0,1,0,0],
  ],
  [ // frame 1
    [0,0,1,1,1,1,1,1,0,0],
    [0,1,1,1,1,1,1,1,1,0],
    [1,1,1,1,1,1,1,1,1,1],
    [1,1,0,1,1,1,1,0,1,1],
    [1,1,1,1,1,1,1,1,1,1],
    [0,1,1,0,0,0,0,1,1,0],
    [1,0,0,1,0,0,1,0,0,1],
    [0,0,0,0,1,1,0,0,0,0],
  ],
]

// Classic arch bunker (17 × 12 pixels) — same pixel scale as sprites (3 px/pixel)
// Columns = 17, Rows = 12. Bottom rows have a centre notch (the arch opening).
const BUNKER_TEMPLATE = [
  [0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0],
  [0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
  [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,1],
  [1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1],
  [1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1],
  [1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1],
]
const BUNKER_PS = 3          // pixels per bunker pixel
const BUNKER_CY_OFFSET = 68  // px above player centre
const BUNKER_COUNT = 4

// Flat cannon body with central gun barrel (13 × 7)
const SI_PLAYER = [
  [0,0,0,0,0,0,1,0,0,0,0,0,0],
  [0,0,0,0,0,1,1,1,0,0,0,0,0],
  [0,0,0,0,0,1,1,1,0,0,0,0,0],
  [0,1,1,1,1,1,1,1,1,1,1,1,0],
  [1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1],
]

const PLAYER_SPEED = 430
const PLAYER_BULLET_SPEED = 700
const ENEMY_BULLET_SPEED = 310

const randomRange = (min, max) => min + Math.random() * (max - min)

const createInvaders = () => {
  const invaders = []
  for (let row = 0; row < 5; row += 1) {
    for (let col = 0; col < 10; col += 1) {
      invaders.push({
        row,
        col,
        alive: true,
      })
    }
  }
  return invaders
}

// Four bunkers spaced across the lower playfield; layout adapts to canvas width.
const createBunkers = (width) => {
  const span = Math.max(140, Math.min(430, width - 60))
  const startX = width / 2 - span / 2
  const step = span / (BUNKER_COUNT - 1)
  return Array.from({ length: BUNKER_COUNT }, (_, index) => ({
    cx: startX + step * index,
    pixels: BUNKER_TEMPLATE.map((row) => [...row]),
  }))
}

export default function SpaceInvadersViewport() {
  const canvasRef = useRef(null)
  const controlsRef = useRef({ left: false, right: false, fire: false })
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    const state = {
      width: 1,
      height: 1,
      player: { x: 0, y: 0, w: 44, h: 18 },
      playerBullets: [],
      enemyBullets: [],
      invaders: createInvaders(),
      invaderOffsetX: 0,
      invaderOffsetY: 0,
      invaderDir: 1,
      invaderSpeed: 30,
      invaderStepDown: 18,
      shootCooldown: 0,
      enemyFireCooldown: 0,
      beatPhase: 0,
      invaderAnimFrame: 0,
      invaderAnimTimer: 0,
      marchTimer: 0.45,
      marchStep: 0,
      bunkers: createBunkers(640),
      gameOver: false,
    }

    const audioRef = {
      ctx: null,
      master: null,
      noiseBuffer: null,
    }

    const ensureAudio = async () => {
      if (audioRef.ctx) {
        if (audioRef.ctx.state === 'suspended') {
          try {
            await audioRef.ctx.resume()
          } catch {
            // Ignore blocked resumes; next user gesture can retry.
          }
        }
        return audioRef.ctx
      }

      const Ctx = window.AudioContext || window.webkitAudioContext
      if (!Ctx) return null

      const ctx = new Ctx()
      const master = ctx.createGain()
      master.gain.value = 0.16
      master.connect(ctx.destination)

      // Reusable white-noise buffer for explosion-style effects.
      const noiseBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.25), ctx.sampleRate)
      const data = noiseBuffer.getChannelData(0)
      for (let i = 0; i < data.length; i += 1) {
        data[i] = (Math.random() * 2 - 1) * 0.9
      }

      audioRef.ctx = ctx
      audioRef.master = master
      audioRef.noiseBuffer = noiseBuffer
      return ctx
    }

    const playTone = ({ type = 'square', freq = 220, toFreq = null, duration = 0.1, volume = 0.14, attack = 0.002 }) => {
      const ctx = audioRef.ctx
      if (!ctx || !audioRef.master) return

      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = type
      osc.frequency.setValueAtTime(freq, now)
      if (toFreq != null) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(18, toFreq), now + duration)
      }

      gain.gain.setValueAtTime(0.0001, now)
      gain.gain.linearRampToValueAtTime(volume, now + attack)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)

      osc.connect(gain)
      gain.connect(audioRef.master)
      osc.start(now)
      osc.stop(now + duration + 0.02)
    }

    const playNoiseBurst = ({ duration = 0.08, volume = 0.1, hp = 350, lp = 2400 }) => {
      const ctx = audioRef.ctx
      if (!ctx || !audioRef.master || !audioRef.noiseBuffer) return

      const now = ctx.currentTime
      const src = ctx.createBufferSource()
      src.buffer = audioRef.noiseBuffer

      const hpFilter = ctx.createBiquadFilter()
      hpFilter.type = 'highpass'
      hpFilter.frequency.setValueAtTime(hp, now)

      const lpFilter = ctx.createBiquadFilter()
      lpFilter.type = 'lowpass'
      lpFilter.frequency.setValueAtTime(lp, now)

      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0.0001, now)
      gain.gain.linearRampToValueAtTime(volume, now + 0.003)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)

      src.connect(hpFilter)
      hpFilter.connect(lpFilter)
      lpFilter.connect(gain)
      gain.connect(audioRef.master)

      src.start(now)
      src.stop(now + duration + 0.02)
    }

    const playInvaderMarchStep = () => {
      const thumpFreq = [58, 49][state.marchStep % 2]
      playTone({ type: 'sine', freq: thumpFreq, toFreq: thumpFreq * 0.78, duration: 0.11, volume: 0.14, attack: 0.001 })
      playTone({ type: 'triangle', freq: thumpFreq * 2, toFreq: thumpFreq * 1.45, duration: 0.07, volume: 0.045, attack: 0.001 })

      const stepFreq = [118, 104, 98, 88][state.marchStep % 4]
      playTone({ type: 'square', freq: stepFreq, duration: 0.09, volume: 0.085 })
      playTone({ type: 'triangle', freq: stepFreq * 0.5, duration: 0.08, volume: 0.045 })
      state.marchStep = (state.marchStep + 1) % 4
    }

    const playPlayerShot = () => {
      const ctx = audioRef.ctx
      if (!ctx || !audioRef.master) return

      const now = ctx.currentTime
      const dur = 0.16

      // Carrier gives the main "zziiing" sweep.
      const carrier = ctx.createOscillator()
      carrier.type = 'sawtooth'
      carrier.frequency.setValueAtTime(2400, now)
      carrier.frequency.exponentialRampToValueAtTime(760, now + dur)

      // Mild FM adds the electric "zz" edge without turning into noise.
      const mod = ctx.createOscillator()
      mod.type = 'sine'
      mod.frequency.setValueAtTime(42, now)

      const modGain = ctx.createGain()
      modGain.gain.setValueAtTime(58, now)
      modGain.gain.exponentialRampToValueAtTime(12, now + dur)

      const filter = ctx.createBiquadFilter()
      filter.type = 'bandpass'
      filter.frequency.setValueAtTime(1900, now)
      filter.frequency.exponentialRampToValueAtTime(980, now + dur)
      filter.Q.setValueAtTime(4.5, now)
      filter.Q.exponentialRampToValueAtTime(1.3, now + dur)

      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0.0001, now)
      gain.gain.linearRampToValueAtTime(0.13, now + 0.004)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur)

      mod.connect(modGain)
      modGain.connect(carrier.frequency)
      carrier.connect(filter)
      filter.connect(gain)
      gain.connect(audioRef.master)

      carrier.start(now)
      mod.start(now)
      carrier.stop(now + dur + 0.02)
      mod.stop(now + dur + 0.02)
    }

    const playInvaderHit = () => {
      playTone({ type: 'square', freq: 310, toFreq: 120, duration: 0.07, volume: 0.1, attack: 0.001 })
      playNoiseBurst({ duration: 0.06, volume: 0.07, hp: 700, lp: 4200 })
    }

    const playPlayerDeath = () => {
      playTone({ type: 'square', freq: 260, toFreq: 70, duration: 0.34, volume: 0.12, attack: 0.003 })
      playTone({ type: 'triangle', freq: 190, toFreq: 55, duration: 0.37, volume: 0.1, attack: 0.003 })
      playNoiseBurst({ duration: 0.22, volume: 0.09, hp: 220, lp: 1600 })
    }

    const bunkerCols = BUNKER_TEMPLATE[0].length
    const bunkerRows = BUNKER_TEMPLATE.length

    const getBunkerBounds = (bunker) => {
      const bcy = state.player.y - BUNKER_CY_OFFSET
      return {
        ox: bunker.cx - (bunkerCols * BUNKER_PS) / 2,
        oy: bcy - (bunkerRows * BUNKER_PS) / 2,
      }
    }

    const carveBunker = (bunker, row, col, radius) => {
      for (let dr = -radius; dr <= radius; dr += 1) {
        for (let dc = -radius; dc <= radius; dc += 1) {
          if (dr * dr + dc * dc > radius * radius) continue
          const rr = row + dr
          const cc = col + dc
          if (rr >= 0 && rr < bunkerRows && cc >= 0 && cc < bunkerCols) {
            bunker.pixels[rr][cc] = 0
          }
        }
      }
    }

    const tryHitBunkers = (x, y0, y1, radius) => {
      const travel = y1 - y0
      const steps = Math.max(1, Math.ceil(Math.abs(travel) / (BUNKER_PS * 0.5)))
      for (let step = 0; step <= steps; step += 1) {
        const t = step / steps
        const sampleY = y0 + travel * t
        for (const bunker of state.bunkers) {
          const { ox, oy } = getBunkerBounds(bunker)
          const col = Math.floor((x - ox) / BUNKER_PS)
          const row = Math.floor((sampleY - oy) / BUNKER_PS)
          if (row >= 0 && row < bunkerRows && col >= 0 && col < bunkerCols && bunker.pixels[row][col]) {
            carveBunker(bunker, row, col, radius)
            return true
          }
        }
      }
      return false
    }

    const resetPlayer = () => {
      state.player.x = state.width / 2
      state.player.y = state.height - 42
    }

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      state.width = Math.max(1, canvas.clientWidth)
      state.height = Math.max(1, canvas.clientHeight)
      canvas.width = Math.floor(state.width * dpr)
      canvas.height = Math.floor(state.height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      resetPlayer()
      state.bunkers = createBunkers(state.width)
    }

    const getInvaderPosition = (invader) => {
      const baseX = 70 + invader.col * 54
      const baseY = 58 + invader.row * 40
      return {
        x: baseX + state.invaderOffsetX,
        y: baseY + state.invaderOffsetY,
        w: 34,
        h: 22,
      }
    }

    const firePlayerBullet = () => {
      if (state.shootCooldown > 0 || state.gameOver) return
      state.playerBullets.push({
        x: state.player.x,
        y: state.player.y - 12,
        vy: -PLAYER_BULLET_SPEED,
      })
      playPlayerShot()
      state.shootCooldown = 0.19
    }

    const enemyShoot = () => {
      const living = state.invaders.filter((inv) => inv.alive)
      if (living.length === 0) return

      const byColumn = new Map()
      living.forEach((inv) => {
        const current = byColumn.get(inv.col)
        if (!current || inv.row > current.row) {
          byColumn.set(inv.col, inv)
        }
      })

      const shooters = Array.from(byColumn.values())
      const shooter = shooters[Math.floor(Math.random() * shooters.length)]
      if (!shooter) return

      const pos = getInvaderPosition(shooter)
      state.enemyBullets.push({
        x: pos.x,
        y: pos.y + 12,
        vy: ENEMY_BULLET_SPEED,
      })
    }

    const onKeyDown = (event) => {
      ensureAudio()
      if (event.code === 'ArrowLeft' || event.code === 'KeyA') controlsRef.current.left = true
      if (event.code === 'ArrowRight' || event.code === 'KeyD') controlsRef.current.right = true
      if (event.code === 'Space') {
        controlsRef.current.fire = true
        event.preventDefault()
      }
    }

    const onKeyUp = (event) => {
      if (event.code === 'ArrowLeft' || event.code === 'KeyA') controlsRef.current.left = false
      if (event.code === 'ArrowRight' || event.code === 'KeyD') controlsRef.current.right = false
      if (event.code === 'Space') controlsRef.current.fire = false
    }

    let frameId = 0
    let last = performance.now()

    const loop = (now) => {
      const dt = Math.min(0.033, (now - last) / 1000)
      last = now

      if (!state.gameOver) {
        if (controlsRef.current.left) state.player.x -= PLAYER_SPEED * dt
        if (controlsRef.current.right) state.player.x += PLAYER_SPEED * dt
        state.player.x = Math.max(24, Math.min(state.width - 24, state.player.x))

        if (controlsRef.current.fire) firePlayerBullet()

        if (state.shootCooldown > 0) state.shootCooldown -= dt
        if (state.enemyFireCooldown > 0) state.enemyFireCooldown -= dt

        state.playerBullets = state.playerBullets
          .map((bullet) => ({ ...bullet, prevY: bullet.y, y: bullet.y + bullet.vy * dt }))
          .filter((bullet) => bullet.y > -12)

        state.enemyBullets = state.enemyBullets
          .map((bullet) => ({ ...bullet, prevY: bullet.y, y: bullet.y + bullet.vy * dt }))
          .filter((bullet) => bullet.y < state.height + 12)

        state.invaderOffsetX += state.invaderDir * state.invaderSpeed * dt

        const livingInvaders = state.invaders.filter((inv) => inv.alive)
        let minX = Infinity
        let maxX = -Infinity
        let maxY = -Infinity

        livingInvaders.forEach((inv) => {
          const pos = getInvaderPosition(inv)
          minX = Math.min(minX, pos.x - 17)
          maxX = Math.max(maxX, pos.x + 17)
          maxY = Math.max(maxY, pos.y + 12)
        })

        if (minX < 18 || maxX > state.width - 18) {
          state.invaderDir *= -1
          state.invaderOffsetY += state.invaderStepDown
          state.invaderSpeed = Math.min(130, state.invaderSpeed + 6)
        }

        if (state.enemyFireCooldown <= 0) {
          enemyShoot()
          state.enemyFireCooldown = randomRange(0.35, 0.9)
        }

        state.playerBullets = state.playerBullets.filter((bullet) => {
          // Swept bunker collision; player shots carve a smaller crater.
          if (tryHitBunkers(bullet.x, (bullet.prevY ?? bullet.y) - 8, bullet.y - 8, 1)) return false
          // Invader collision
          for (const inv of state.invaders) {
            if (!inv.alive) continue
            const pos = getInvaderPosition(inv)
            if (
              bullet.x > pos.x - pos.w / 2 &&
              bullet.x < pos.x + pos.w / 2 &&
              bullet.y > pos.y - pos.h / 2 &&
              bullet.y < pos.y + pos.h / 2
            ) {
              inv.alive = false
              playInvaderHit()
              setScore((prev) => prev + 20 + (4 - inv.row) * 5)
              return false
            }
          }
          return true
        })

        state.enemyBullets = state.enemyBullets.filter((bullet) => {
          // Swept bunker collision; alien shots carve a larger crater.
          if (tryHitBunkers(bullet.x, (bullet.prevY ?? bullet.y) + 2, bullet.y + 2, 2)) return false
          // Player collision
          const hitPlayer =
            bullet.x > state.player.x - state.player.w / 2 &&
            bullet.x < state.player.x + state.player.w / 2 &&
            bullet.y > state.player.y - state.player.h / 2 &&
            bullet.y < state.player.y + state.player.h / 2

          if (hitPlayer) {
            playPlayerDeath()
            setLives((prev) => {
              const next = Math.max(0, prev - 1)
              if (next === 0) state.gameOver = true
              return next
            })
            resetPlayer()
            return false
          }

          return true
        })

        const remaining = state.invaders.filter((inv) => inv.alive)
        if (remaining.length === 0) {
          state.invaders = createInvaders()
          state.invaderOffsetX = 0
          state.invaderOffsetY = 0
          state.invaderDir = 1
          state.invaderSpeed = Math.min(145, state.invaderSpeed + 12)
          state.playerBullets = []
          state.enemyBullets = []
          state.bunkers = createBunkers(state.width)
          state.marchTimer = 0.45
          state.marchStep = 0
        }

        if (remaining.length > 0 && audioRef.ctx) {
          const ratio = remaining.length / 50
          const marchInterval = 0.08 + ratio * 0.55
          state.marchTimer -= dt
          if (state.marchTimer <= 0) {
            playInvaderMarchStep()
            state.marchTimer += marchInterval
          }
        }

        if (maxY > state.player.y - 22) {
          state.gameOver = true
        }
      }

      state.beatPhase += dt * 6
      state.invaderAnimTimer += dt
      if (state.invaderAnimTimer >= 0.5) {
        state.invaderAnimTimer -= 0.5
        state.invaderAnimFrame = 1 - state.invaderAnimFrame
      }

      ctx.clearRect(0, 0, state.width, state.height)
      ctx.fillStyle = 'rgba(2, 10, 18, 0.95)'
      ctx.fillRect(0, 0, state.width, state.height)

      // Background scan grid.
      ctx.strokeStyle = 'rgba(85, 230, 255, 0.09)'
      ctx.lineWidth = 1
      for (let x = 0; x <= state.width; x += 24) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, state.height)
        ctx.stroke()
      }
      for (let y = 0; y <= state.height; y += 24) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(state.width, y)
        ctx.stroke()
      }

      // Draw invaders — pixel-art sprites.
      const drawSprite = (pixels, cx, cy, ps, color) => {
        ctx.fillStyle = color
        const rows = pixels.length
        const cols = pixels[0].length
        const ox = cx - (cols * ps) / 2
        const oy = cy - (rows * ps) / 2
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            if (pixels[r][c]) {
              ctx.fillRect(Math.round(ox + c * ps), Math.round(oy + r * ps), Math.ceil(ps), Math.ceil(ps))
            }
          }
        }
      }

      state.invaders.forEach((inv) => {
        if (!inv.alive) return
        const pos = getInvaderPosition(inv)
        const spriteSet =
          inv.row === 0 ? SI_SQUID :
          inv.row <= 2  ? SI_CRAB  :
                          SI_OCTOPUS
        const pixels = spriteSet[state.invaderAnimFrame]
        drawSprite(pixels, pos.x, pos.y, 3, 'rgba(255, 255, 255, 0.97)')
      })

      // Draw bunkers.
      const bcy = state.player.y - BUNKER_CY_OFFSET
      ctx.fillStyle = 'rgba(100, 255, 120, 0.97)'
      state.bunkers.forEach((bunker) => {
        const ox = bunker.cx - (bunkerCols * BUNKER_PS) / 2
        const oy = bcy - (bunkerRows * BUNKER_PS) / 2
        for (let r = 0; r < bunkerRows; r++) {
          for (let c = 0; c < bunkerCols; c++) {
            if (bunker.pixels[r][c]) {
              ctx.fillRect(Math.round(ox + c * BUNKER_PS), Math.round(oy + r * BUNKER_PS), BUNKER_PS, BUNKER_PS)
            }
          }
        }
      })

      // Player ship — pixel-art sprite.
      const playerColor = state.gameOver ? 'rgba(255, 112, 112, 0.95)' : 'rgba(100, 255, 120, 0.97)'
      drawSprite(SI_PLAYER, state.player.x, state.player.y, 3, playerColor)

      // Bullets.
      ctx.fillStyle = '#ffe48d'
      state.playerBullets.forEach((bullet) => {
        ctx.fillRect(bullet.x - 2, bullet.y - 8, 4, 10)
      })

      ctx.fillStyle = '#ff8fb7'
      state.enemyBullets.forEach((bullet) => {
        ctx.fillRect(bullet.x - 1.8, bullet.y - 6, 3.6, 8)
      })

      if (state.gameOver) {
        ctx.fillStyle = 'rgba(255, 164, 164, 0.95)'
        ctx.font = 'bold 26px Chakra Petch, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('GAME OVER', state.width / 2, state.height / 2)
      }

      frameId = window.requestAnimationFrame(loop)
    }

    resize()
    frameId = window.requestAnimationFrame(loop)
    window.addEventListener('resize', resize)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

    return () => {
      window.cancelAnimationFrame(frameId)
      window.removeEventListener('resize', resize)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      if (audioRef.ctx) {
        audioRef.ctx.close()
      }
    }
  }, [])

  return (
    <div className="spaceinvaders-center-wrap">
      <canvas ref={canvasRef} className="spaceinvaders-canvas" />
      <div className="spaceinvaders-overlay">
        <span>Score {String(score).padStart(5, '0')}</span>
        <span>Lives {lives}</span>
        <span>Move + Space</span>
      </div>
    </div>
  )
}
