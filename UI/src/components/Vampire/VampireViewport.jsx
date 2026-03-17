import { useEffect, useRef, useState } from 'react'

const PLAYER_SPEED = 330
const BULLET_SPEED = 540
const BASE_FIRE_RATE = 0.13
const KEY_TO_DIR = {
  KeyW: 'up',
  ArrowUp: 'up',
  KeyS: 'down',
  ArrowDown: 'down',
  KeyA: 'left',
  ArrowLeft: 'left',
  KeyD: 'right',
  ArrowRight: 'right',
}

const randomRange = (min, max) => min + Math.random() * (max - min)

const spawnEnemy = (width, height, wave) => {
  const side = Math.floor(Math.random() * 4)
  const padding = 26
  let x = width / 2
  let y = height / 2

  if (side === 0) {
    x = randomRange(0, width)
    y = -padding
  } else if (side === 1) {
    x = width + padding
    y = randomRange(0, height)
  } else if (side === 2) {
    x = randomRange(0, width)
    y = height + padding
  } else {
    x = -padding
    y = randomRange(0, height)
  }

  const scale = randomRange(0.8, 1.35)

  return {
    x,
    y,
    radius: 9 * scale,
    speed: randomRange(42, 78) + wave * 1.9,
    hp: Math.max(1, Math.floor(1 + wave / 6)),
    hue: randomRange(330, 358),
  }
}

export default function VampireViewport() {
  const canvasRef = useRef(null)
  const controlsRef = useRef({ up: false, down: false, left: false, right: false })
  const pointerRef = useRef({ x: 0, y: 0, active: false })
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    const state = {
      width: 1,
      height: 1,
      player: {
        x: 0,
        y: 0,
        radius: 13,
        hp: 100,
        maxHp: 100,
      },
      bullets: [],
      enemies: [],
      shards: [],
      waveTime: 0,
      spawnCooldown: 0.08,
      fireCooldown: 0,
      gameOver: false,
      elapsed: 0,
      xp: 0,
      xpNeed: 160,
      weapon: {
        bulletCount: 1,
        spread: 0,
        fireRate: BASE_FIRE_RATE,
        bulletSpeed: BULLET_SPEED,
        bulletSize: 3,
        bulletDamage: 1,
      },
      upgradeIndex: 0,
      upgradeToast: '',
      upgradeToastTimer: 0,
    }

    const upgrades = [
      {
        label: '+1 Projectile',
        apply: () => {
          state.weapon.bulletCount = Math.min(6, state.weapon.bulletCount + 1)
          state.weapon.spread = Math.min(0.45, state.weapon.spread + 0.04)
        },
      },
      {
        label: 'Rapid Fire',
        apply: () => {
          state.weapon.fireRate = Math.max(0.05, state.weapon.fireRate - 0.014)
        },
      },
      {
        label: 'Velocity Boost',
        apply: () => {
          state.weapon.bulletSpeed = Math.min(860, state.weapon.bulletSpeed + 70)
        },
      },
      {
        label: 'Heavy Rounds',
        apply: () => {
          state.weapon.bulletDamage = Math.min(5, state.weapon.bulletDamage + 1)
          state.weapon.bulletSize = Math.min(6.5, state.weapon.bulletSize + 0.55)
        },
      },
    ]

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      state.width = Math.max(1, canvas.clientWidth)
      state.height = Math.max(1, canvas.clientHeight)
      canvas.width = Math.floor(state.width * dpr)
      canvas.height = Math.floor(state.height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      if (!pointerRef.current.active) {
        pointerRef.current.x = state.width / 2
        pointerRef.current.y = state.height / 2
      }

      if (state.player.x === 0 && state.player.y === 0) {
        state.player.x = state.width / 2
        state.player.y = state.height / 2
      }
    }

    const fireTowardsPointer = () => {
      if (state.fireCooldown > 0 || state.gameOver) return
      const dx = pointerRef.current.x - state.player.x
      const dy = pointerRef.current.y - state.player.y
      const mag = Math.hypot(dx, dy)
      if (mag < 3) return

      const baseAngle = Math.atan2(dy, dx)
      const count = state.weapon.bulletCount
      const spread = state.weapon.spread
      for (let i = 0; i < count; i += 1) {
        const t = count === 1 ? 0 : i / (count - 1)
        const offset = (t - 0.5) * spread
        const shotAngle = baseAngle + offset
        state.bullets.push({
          x: state.player.x,
          y: state.player.y,
          vx: Math.cos(shotAngle) * state.weapon.bulletSpeed,
          vy: Math.sin(shotAngle) * state.weapon.bulletSpeed,
          life: 1.18,
          damage: state.weapon.bulletDamage,
          size: state.weapon.bulletSize,
        })
      }

      state.fireCooldown = state.weapon.fireRate
    }

    const onPointerMove = (event) => {
      const rect = canvas.getBoundingClientRect()
      pointerRef.current.active = true
      pointerRef.current.x = event.clientX - rect.left
      pointerRef.current.y = event.clientY - rect.top
    }

    const onPointerLeave = () => {
      pointerRef.current.active = false
    }

    const onKeyDown = (event) => {
      const dir = KEY_TO_DIR[event.code]
      if (!dir) return
      controlsRef.current[dir] = true
      event.preventDefault()
    }

    const onKeyUp = (event) => {
      const dir = KEY_TO_DIR[event.code]
      if (!dir) return
      controlsRef.current[dir] = false
      event.preventDefault()
    }

    let frameId = 0
    let last = performance.now()

    const loop = (now) => {
      const dt = Math.min(0.033, (now - last) / 1000)
      last = now
      state.elapsed += dt
      state.waveTime += dt

      if (!state.gameOver) {
        const moveX = (controlsRef.current.right ? 1 : 0) - (controlsRef.current.left ? 1 : 0)
        const moveY = (controlsRef.current.down ? 1 : 0) - (controlsRef.current.up ? 1 : 0)
        const moveMag = Math.hypot(moveX, moveY)

        if (moveMag > 0) {
          state.player.x += (moveX / moveMag) * PLAYER_SPEED * dt
          state.player.y += (moveY / moveMag) * PLAYER_SPEED * dt
        }

        state.player.x = Math.max(14, Math.min(state.width - 14, state.player.x))
        state.player.y = Math.max(14, Math.min(state.height - 14, state.player.y))

        if (state.fireCooldown > 0) state.fireCooldown -= dt
        fireTowardsPointer()

        state.spawnCooldown -= dt
        if (state.spawnCooldown <= 0) {
          const wave = 1 + Math.floor(state.waveTime / 9)
          const amount = wave > 5 ? 2 : 1
          for (let i = 0; i < amount; i += 1) {
            state.enemies.push(spawnEnemy(state.width, state.height, wave))
          }
          state.spawnCooldown = Math.max(0.19, 0.72 - wave * 0.04)
        }

        state.bullets = state.bullets
          .map((bullet) => ({
            ...bullet,
            x: bullet.x + bullet.vx * dt,
            y: bullet.y + bullet.vy * dt,
            life: bullet.life - dt,
          }))
          .filter((bullet) => bullet.life > 0)

        state.enemies.forEach((enemy) => {
          const ex = state.player.x - enemy.x
          const ey = state.player.y - enemy.y
          const em = Math.hypot(ex, ey) || 1
          enemy.x += (ex / em) * enemy.speed * dt
          enemy.y += (ey / em) * enemy.speed * dt
        })

        state.bullets = state.bullets.filter((bullet) => {
          for (const enemy of state.enemies) {
            const dxHit = enemy.x - bullet.x
            const dyHit = enemy.y - bullet.y
            const hit = Math.hypot(dxHit, dyHit) < enemy.radius + 3
            if (hit) {
              enemy.hp -= bullet.damage ?? 1
              return false
            }
          }
          return true
        })

        const survivors = []
        state.enemies.forEach((enemy) => {
          if (enemy.hp > 0) {
            survivors.push(enemy)
          } else {
            state.shards.push({ x: enemy.x, y: enemy.y, r: 4.5, xp: 18 })
            setScore((prev) => prev + 12)
          }
        })
        state.enemies = survivors

        state.shards = state.shards.filter((shard) => {
          const dxShard = state.player.x - shard.x
          const dyShard = state.player.y - shard.y
          const d = Math.hypot(dxShard, dyShard)
          if (d < 120) {
            shard.x += (dxShard / (d || 1)) * 240 * dt
            shard.y += (dyShard / (d || 1)) * 240 * dt
          }
          if (d < state.player.radius + shard.r + 1) {
            state.xp += shard.xp
            while (state.xp >= state.xpNeed) {
              state.xp -= state.xpNeed
              state.xpNeed = Math.round(state.xpNeed * 1.2)
              const nextUpgrade = upgrades[state.upgradeIndex % upgrades.length]
              nextUpgrade.apply()
              state.upgradeIndex += 1
              state.upgradeToast = nextUpgrade.label
              state.upgradeToastTimer = 1.8
              setLevel((prev) => prev + 1)
            }
            return false
          }
          return true
        })

        for (const enemy of state.enemies) {
          const dxCol = state.player.x - enemy.x
          const dyCol = state.player.y - enemy.y
          const touching = Math.hypot(dxCol, dyCol) < state.player.radius + enemy.radius
          if (touching) {
            state.player.hp -= 24 * dt
            if (state.player.hp <= 0) {
              state.player.hp = 0
              state.gameOver = true
              break
            }
          }
        }
      }

      if (state.upgradeToastTimer > 0) {
        state.upgradeToastTimer -= dt
      }

      ctx.clearRect(0, 0, state.width, state.height)

      const bg = ctx.createRadialGradient(
        state.player.x,
        state.player.y,
        40,
        state.player.x,
        state.player.y,
        state.width * 0.8,
      )
      bg.addColorStop(0, 'rgba(45, 11, 42, 0.95)')
      bg.addColorStop(1, 'rgba(7, 5, 15, 0.98)')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, state.width, state.height)

      // Subtle crosshatch to give the arena texture.
      ctx.strokeStyle = 'rgba(157, 91, 196, 0.08)'
      ctx.lineWidth = 1
      for (let x = 0; x < state.width; x += 30) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x - state.height * 0.2, state.height)
        ctx.stroke()
      }

      state.shards.forEach((shard) => {
        ctx.fillStyle = 'rgba(110, 241, 255, 0.92)'
        ctx.beginPath()
        ctx.arc(shard.x, shard.y, shard.r, 0, Math.PI * 2)
        ctx.fill()
      })

      state.enemies.forEach((enemy) => {
        ctx.fillStyle = `hsla(${enemy.hue}, 88%, 62%, 0.92)`
        ctx.beginPath()
        ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2)
        ctx.fill()

        ctx.strokeStyle = 'rgba(255, 194, 226, 0.55)'
        ctx.lineWidth = 1.2
        ctx.beginPath()
        ctx.moveTo(enemy.x - enemy.radius * 0.4, enemy.y - enemy.radius * 0.3)
        ctx.lineTo(enemy.x + enemy.radius * 0.4, enemy.y + enemy.radius * 0.3)
        ctx.moveTo(enemy.x + enemy.radius * 0.4, enemy.y - enemy.radius * 0.3)
        ctx.lineTo(enemy.x - enemy.radius * 0.4, enemy.y + enemy.radius * 0.3)
        ctx.stroke()
      })

      state.bullets.forEach((bullet) => {
        ctx.fillStyle = 'rgba(255, 231, 150, 0.95)'
        ctx.beginPath()
        ctx.arc(bullet.x, bullet.y, bullet.size ?? 3, 0, Math.PI * 2)
        ctx.fill()
      })

      const aimDx = pointerRef.current.x - state.player.x
      const aimDy = pointerRef.current.y - state.player.y
      const aimMag = Math.hypot(aimDx, aimDy) || 1
      const aimX = state.player.x + (aimDx / aimMag) * 22
      const aimY = state.player.y + (aimDy / aimMag) * 22

      ctx.strokeStyle = 'rgba(255, 236, 168, 0.82)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(state.player.x, state.player.y)
      ctx.lineTo(aimX, aimY)
      ctx.stroke()

      ctx.fillStyle = 'rgba(255, 214, 106, 0.95)'
      ctx.beginPath()
      ctx.arc(state.player.x, state.player.y, state.player.radius, 0, Math.PI * 2)
      ctx.fill()

      ctx.strokeStyle = 'rgba(255, 252, 232, 0.8)'
      ctx.beginPath()
      ctx.arc(state.player.x, state.player.y, state.player.radius + 6 + Math.sin(state.elapsed * 6) * 1.2, 0, Math.PI * 2)
      ctx.stroke()

      // HP / XP bars in-canvas so gameplay state is always visible.
      const barW = Math.min(240, state.width * 0.35)
      const hpPct = state.player.hp / state.player.maxHp
      const xpPct = state.xp / state.xpNeed

      ctx.fillStyle = 'rgba(20, 22, 28, 0.72)'
      ctx.fillRect(18, state.height - 44, barW, 9)
      ctx.fillRect(18, state.height - 27, barW, 7)

      ctx.fillStyle = 'rgba(255, 115, 132, 0.92)'
      ctx.fillRect(18, state.height - 44, barW * hpPct, 9)
      ctx.fillStyle = 'rgba(97, 235, 255, 0.9)'
      ctx.fillRect(18, state.height - 27, barW * xpPct, 7)

      if (state.gameOver) {
        ctx.fillStyle = 'rgba(255, 164, 194, 0.96)'
        ctx.font = 'bold 30px Chakra Petch, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('HUNTER FALLEN', state.width / 2, state.height / 2)
      }

      if (state.upgradeToastTimer > 0) {
        ctx.fillStyle = 'rgba(170, 255, 193, 0.95)'
        ctx.font = 'bold 18px Chakra Petch, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(`POWER UP: ${state.upgradeToast}`, state.width / 2, 36)
      }

      frameId = window.requestAnimationFrame(loop)
    }

    resize()
    frameId = window.requestAnimationFrame(loop)
    canvas.addEventListener('mousemove', onPointerMove)
    canvas.addEventListener('mouseenter', onPointerMove)
    canvas.addEventListener('mouseleave', onPointerLeave)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('resize', resize)

    return () => {
      window.cancelAnimationFrame(frameId)
      canvas.removeEventListener('mousemove', onPointerMove)
      canvas.removeEventListener('mouseenter', onPointerMove)
      canvas.removeEventListener('mouseleave', onPointerLeave)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <div className="vampire-center-wrap">
      <canvas ref={canvasRef} className="vampire-canvas" />
      <div className="vampire-overlay">
        <span>Score {String(score).padStart(5, '0')}</span>
        <span>Level {String(level).padStart(2, '0')}</span>
        <span>WASD Move / Mouse Aim</span>
      </div>
    </div>
  )
}
