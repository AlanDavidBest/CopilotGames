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

const UPGRADE_LABELS = {
  wideShot: 'Wide Shot',
  rearShot: 'Shoot Behind',
  leechShot: 'Leech Life Shot',
  damageAura: 'Damage Area',
  orbitingStars: 'Orbiting Stars',
  pickupRange: 'Pickup Range',
  projectiles: '+1 Projectile',
  heavyRounds: 'Heavy Rounds',
  rapidFire: 'Rapid Fire',
  velocity: 'Velocity Boost',
}

const EMPTY_UPGRADES = {
  wideShot: 0,
  rearShot: 0,
  leechShot: 0,
  damageAura: 0,
  orbitingStars: 0,
  pickupRange: 0,
}

const applyUpgradeEffect = (state, id) => {
  switch (id) {
    case 'wideShot':
      state.upgrades.wideShot += 1
      break
    case 'rearShot':
      state.upgrades.rearShot += 1
      break
    case 'leechShot':
      state.upgrades.leechShot += 1
      break
    case 'damageAura':
      state.upgrades.damageAura += 1
      break
    case 'orbitingStars':
      state.upgrades.orbitingStars += 1
      break
    case 'pickupRange':
      state.upgrades.pickupRange += 1
      break
    case 'projectiles':
      state.weapon.bulletCount = Math.min(10, state.weapon.bulletCount + 1)
      state.weapon.spread = Math.min(0.68, state.weapon.spread + 0.04)
      break
    case 'rapidFire':
      state.weapon.fireRate = Math.max(0.045, state.weapon.fireRate - 0.013)
      break
    case 'velocity':
      state.weapon.bulletSpeed = Math.min(980, state.weapon.bulletSpeed + 70)
      break
    case 'heavyRounds':
      state.weapon.bulletDamage = Math.min(9, state.weapon.bulletDamage + 1)
      state.weapon.bulletSize = Math.min(8, state.weapon.bulletSize + 0.5)
      break
    default:
      break
  }
}

// 12x12 hunter sprite (player)
const HUNTER_SPRITE = [
  [0,0,0,0,0,1,1,0,0,0,0,0],
  [0,0,0,0,1,1,1,1,0,0,0,0],
  [0,0,0,1,1,1,1,1,1,0,0,0],
  [0,0,0,1,0,1,1,0,1,0,0,0],
  [0,0,1,1,1,1,1,1,1,1,0,0],
  [0,0,1,1,0,1,1,0,1,1,0,0],
  [0,1,1,1,1,1,1,1,1,1,1,0],
  [0,1,1,1,1,1,1,1,1,1,1,0],
  [0,0,1,1,1,1,1,1,1,1,0,0],
  [0,0,1,1,0,0,0,0,1,1,0,0],
  [0,1,1,0,0,0,0,0,0,1,1,0],
  [1,1,0,0,0,0,0,0,0,0,1,1],
]

// 12x12 bat sprite (enemy), two flap frames.
const BAT_SPRITES = [
  [
    [0,0,1,0,0,0,0,0,0,1,0,0],
    [0,1,1,1,0,0,0,0,1,1,1,0],
    [1,1,1,1,1,0,0,1,1,1,1,1],
    [1,1,0,1,1,1,1,1,1,0,1,1],
    [1,0,0,0,1,1,1,1,0,0,0,1],
    [0,0,0,1,1,0,0,1,1,0,0,0],
    [0,0,1,1,1,1,1,1,1,1,0,0],
    [0,1,1,1,0,1,1,0,1,1,1,0],
    [0,0,1,1,1,1,1,1,1,1,0,0],
    [0,0,0,1,1,0,0,1,1,0,0,0],
    [0,0,1,0,0,0,0,0,0,1,0,0],
    [0,1,0,0,0,0,0,0,0,0,1,0],
  ],
  [
    [1,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,0,0,0,0,0,0,0,0,1,1],
    [1,1,1,0,0,0,0,0,0,1,1,1],
    [0,1,1,1,1,0,0,1,1,1,1,0],
    [0,0,1,1,1,1,1,1,1,1,0,0],
    [0,0,0,1,1,0,0,1,1,0,0,0],
    [0,0,1,1,1,1,1,1,1,1,0,0],
    [0,1,1,1,0,1,1,0,1,1,1,0],
    [0,0,1,1,1,1,1,1,1,1,0,0],
    [0,0,0,1,1,0,0,1,1,0,0,0],
    [0,0,1,0,0,0,0,0,0,1,0,0],
    [0,1,0,0,0,0,0,0,0,0,1,0],
  ],
]

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
      trails: [],
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
      pausedForUpgrade: false,
      upgradeChoices: [],
      upgrades: { ...EMPTY_UPGRADES },
    }

    const upgradeDefs = [
      {
        id: 'wideShot',
        label: 'Wide Shot',
        detail: 'Adds side volleys that scale with projectile count.',
        apply: () => applyUpgradeEffect(state, 'wideShot'),
      },
      {
        id: 'rearShot',
        label: 'Shoot Behind',
        detail: 'Adds rear volleys that also scale with projectile count.',
        apply: () => applyUpgradeEffect(state, 'rearShot'),
      },
      {
        id: 'leechShot',
        label: 'Leech Life Shot',
        detail: 'Heal a little each kill.',
        apply: () => applyUpgradeEffect(state, 'leechShot'),
      },
      {
        id: 'damageAura',
        label: 'Damage Area',
        detail: 'Small damage pulse around the hunter.',
        apply: () => applyUpgradeEffect(state, 'damageAura'),
      },
      {
        id: 'orbitingStars',
        label: 'Orbiting Stars',
        detail: 'Stars orbit and damage enemies on contact.',
        apply: () => applyUpgradeEffect(state, 'orbitingStars'),
      },
      {
        id: 'pickupRange',
        label: 'Pickup Range',
        detail: 'Pull experience orbs from farther away.',
        apply: () => applyUpgradeEffect(state, 'pickupRange'),
      },
      {
        id: 'projectiles',
        label: '+1 Projectile',
        detail: 'Adds one projectile to every volley pattern.',
        apply: () => applyUpgradeEffect(state, 'projectiles'),
      },
      {
        id: 'rapidFire',
        label: 'Rapid Fire',
        detail: 'Shoot faster.',
        apply: () => applyUpgradeEffect(state, 'rapidFire'),
      },
      {
        id: 'velocity',
        label: 'Velocity Boost',
        detail: 'Faster projectile speed.',
        apply: () => applyUpgradeEffect(state, 'velocity'),
      },
      {
        id: 'heavyRounds',
        label: 'Heavy Rounds',
        detail: 'Bigger and stronger bullets.',
        apply: () => applyUpgradeEffect(state, 'heavyRounds'),
      },
    ]

    const rollUpgradeChoices = () => {
      const pool = [...upgradeDefs]
      const picks = []
      while (picks.length < 3 && pool.length > 0) {
        const index = Math.floor(Math.random() * pool.length)
        picks.push(pool.splice(index, 1)[0])
      }
      state.upgradeChoices = picks
      state.pausedForUpgrade = true
    }

    const chooseUpgrade = (choiceIndex) => {
      if (!state.pausedForUpgrade || state.gameOver) return
      const choice = state.upgradeChoices[choiceIndex]
      if (!choice) return

      choice.apply()
      state.upgradeToast = choice.label
      state.upgradeToastTimer = 1.8
      state.upgradeChoices = []
      state.pausedForUpgrade = false
    }

    const onGrantUpgrade = (event) => {
      const upgradeId = event?.detail?.id
      if (!upgradeId || state.gameOver) return
      applyUpgradeEffect(state, upgradeId)
      const label = UPGRADE_LABELS[upgradeId]
      if (label) {
        state.upgradeToast = label
        state.upgradeToastTimer = 1.2
      }
    }

    const getUpgradeCardRects = () => {
      const cardW = Math.min(260, state.width * 0.28)
      const cardH = 146
      const gap = Math.min(20, state.width * 0.03)
      const totalW = cardW * 3 + gap * 2
      const startX = (state.width - totalW) / 2
      const y = state.height * 0.27
      return [0, 1, 2].map((index) => ({
        x: startX + index * (cardW + gap),
        y,
        w: cardW,
        h: cardH,
      }))
    }

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
      if (state.fireCooldown > 0 || state.gameOver || state.pausedForUpgrade) return
      const dx = pointerRef.current.x - state.player.x
      const dy = pointerRef.current.y - state.player.y
      const mag = Math.hypot(dx, dy)
      if (mag < 3) return

      const volleyAngles = []
      const baseAngle = Math.atan2(dy, dx)
      volleyAngles.push(baseAngle)

      const widePairs = state.upgrades.wideShot
      for (let i = 0; i < widePairs; i += 1) {
        const offset = 0.42 + i * 0.13
        volleyAngles.push(baseAngle + offset)
        volleyAngles.push(baseAngle - offset)
      }

      const rearPairs = state.upgrades.rearShot
      for (let i = 0; i < rearPairs; i += 1) {
        const rearBase = baseAngle + Math.PI
        const fan = i * 0.12
        volleyAngles.push(rearBase + fan)
        if (fan > 0) volleyAngles.push(rearBase - fan)
      }

      const count = state.weapon.bulletCount
      const spread = state.weapon.spread
      volleyAngles.forEach((volleyAngle) => {
        for (let i = 0; i < count; i += 1) {
          const t = count === 1 ? 0 : i / (count - 1)
          const offset = (t - 0.5) * spread
          const shotAngle = volleyAngle + offset
          state.bullets.push({
            x: state.player.x,
            y: state.player.y,
            vx: Math.cos(shotAngle) * state.weapon.bulletSpeed,
            vy: Math.sin(shotAngle) * state.weapon.bulletSpeed,
            life: 1.18,
            damage: state.weapon.bulletDamage,
            size: state.weapon.bulletSize,
            hue: (state.elapsed * 180 + shotAngle * 90 + i * 22) % 360,
          })
        }
      })

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

    const onPointerDown = (event) => {
      if (!state.pausedForUpgrade || state.gameOver) return
      const rect = canvas.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      const cardRects = getUpgradeCardRects()
      for (let i = 0; i < cardRects.length; i += 1) {
        const card = cardRects[i]
        const inside = x >= card.x && x <= card.x + card.w && y >= card.y && y <= card.y + card.h
        if (inside) {
          chooseUpgrade(i)
          break
        }
      }
    }

    const onKeyDown = (event) => {
      if (state.pausedForUpgrade && !state.gameOver) {
        if (event.code === 'Digit1' || event.code === 'Numpad1') {
          chooseUpgrade(0)
          event.preventDefault()
          return
        }
        if (event.code === 'Digit2' || event.code === 'Numpad2') {
          chooseUpgrade(1)
          event.preventDefault()
          return
        }
        if (event.code === 'Digit3' || event.code === 'Numpad3') {
          chooseUpgrade(2)
          event.preventDefault()
          return
        }

        event.preventDefault()
        return
      }

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
      if (!state.pausedForUpgrade) {
        state.elapsed += dt
        state.waveTime += dt
      }

      if (!state.gameOver && !state.pausedForUpgrade) {
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
          .map((bullet) => {
            const nextBullet = {
              ...bullet,
              x: bullet.x + bullet.vx * dt,
              y: bullet.y + bullet.vy * dt,
              life: bullet.life - dt,
            }

            // Faint multi-color afterimages.
            state.trails.push({
              x: bullet.x,
              y: bullet.y,
              vx: -bullet.vx * 0.015 + randomRange(-9, 9),
              vy: -bullet.vy * 0.015 + randomRange(-9, 9),
              life: randomRange(0.18, 0.34),
              maxLife: 0.34,
              size: Math.max(1.2, (bullet.size ?? 3) * randomRange(0.55, 0.95)),
              hue: (bullet.hue + randomRange(-38, 38) + 360) % 360,
            })

            return nextBullet
          })
          .filter((bullet) => bullet.life > 0)

        state.trails = state.trails
          .map((trail) => ({
            ...trail,
            x: trail.x + trail.vx * dt,
            y: trail.y + trail.vy * dt,
            life: trail.life - dt,
            size: Math.max(0.4, trail.size - dt * 3.2),
          }))
          .filter((trail) => trail.life > 0)

        if (state.trails.length > 2200) {
          state.trails.splice(0, state.trails.length - 2200)
        }

        state.enemies.forEach((enemy) => {
          const ex = state.player.x - enemy.x
          const ey = state.player.y - enemy.y
          const em = Math.hypot(ex, ey) || 1
          enemy.x += (ex / em) * enemy.speed * dt
          enemy.y += (ey / em) * enemy.speed * dt
        })

        if (state.upgrades.damageAura > 0) {
          const auraRadius = 56 + state.upgrades.damageAura * 12
          const auraDps = 8 + state.upgrades.damageAura * 6
          state.enemies.forEach((enemy) => {
            const dxAura = enemy.x - state.player.x
            const dyAura = enemy.y - state.player.y
            const dAura = Math.hypot(dxAura, dyAura)
            if (dAura < auraRadius + enemy.radius) {
              enemy.hp -= auraDps * dt
            }
          })
        }

        if (state.upgrades.orbitingStars > 0) {
          const starCount = Math.min(8, 2 + state.upgrades.orbitingStars)
          const starOrbitR = 28 + state.upgrades.orbitingStars * 5
          const starDps = 26 + state.upgrades.orbitingStars * 12
          for (let i = 0; i < starCount; i += 1) {
            const ang = state.elapsed * (2.4 + state.upgrades.orbitingStars * 0.12) + (Math.PI * 2 * i) / starCount
            const sx = state.player.x + Math.cos(ang) * starOrbitR
            const sy = state.player.y + Math.sin(ang) * starOrbitR
            state.enemies.forEach((enemy) => {
              const d = Math.hypot(enemy.x - sx, enemy.y - sy)
              if (d < enemy.radius + 6) {
                enemy.hp -= starDps * dt
              }
            })
          }
        }

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
            if (state.upgrades.leechShot > 0) {
              state.player.hp = Math.min(state.player.maxHp, state.player.hp + state.upgrades.leechShot * 0.8)
            }
            setScore((prev) => prev + 12)
          }
        })
        state.enemies = survivors

        state.shards = state.shards.filter((shard) => {
          const dxShard = state.player.x - shard.x
          const dyShard = state.player.y - shard.y
          const d = Math.hypot(dxShard, dyShard)
          const pickupRange = 120 + state.upgrades.pickupRange * 36
          if (d < pickupRange) {
            shard.x += (dxShard / (d || 1)) * 240 * dt
            shard.y += (dyShard / (d || 1)) * 240 * dt
          }
          if (d < state.player.radius + shard.r + 1) {
            state.xp += shard.xp
            while (state.xp >= state.xpNeed) {
              state.xp -= state.xpNeed
              state.xpNeed = Math.round(state.xpNeed * 1.2)
              rollUpgradeChoices()
              state.upgradeIndex += 1
              setLevel((prev) => prev + 1)
              break
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

      const drawSprite = (pixels, x, y, pixelSize, color, flipX = false) => {
        const rows = pixels.length
        const cols = pixels[0].length
        const ox = x - (cols * pixelSize) / 2
        const oy = y - (rows * pixelSize) / 2
        ctx.fillStyle = color

        for (let r = 0; r < rows; r += 1) {
          for (let c = 0; c < cols; c += 1) {
            if (!pixels[r][c]) continue
            const cc = flipX ? cols - 1 - c : c
            ctx.fillRect(
              Math.round(ox + cc * pixelSize),
              Math.round(oy + r * pixelSize),
              Math.ceil(pixelSize),
              Math.ceil(pixelSize),
            )
          }
        }
      }

      state.shards.forEach((shard) => {
        ctx.fillStyle = 'rgba(110, 241, 255, 0.92)'
        ctx.beginPath()
        ctx.arc(shard.x, shard.y, shard.r, 0, Math.PI * 2)
        ctx.fill()
      })

      state.enemies.forEach((enemy) => {
        const flap = Math.floor(state.elapsed * 8 + enemy.x * 0.01) % 2
        const batPixel = Math.max(1.6, (enemy.radius * 2.35) / 12)
        const enemyColor = `hsla(${enemy.hue}, 88%, 64%, 0.94)`
        drawSprite(BAT_SPRITES[flap], enemy.x, enemy.y, batPixel, enemyColor)
      })

      state.trails.forEach((trail) => {
        const alpha = Math.max(0, trail.life / trail.maxLife) * 0.38
        ctx.fillStyle = `hsla(${trail.hue}, 95%, 70%, ${alpha.toFixed(3)})`
        ctx.beginPath()
        ctx.arc(trail.x, trail.y, trail.size, 0, Math.PI * 2)
        ctx.fill()
      })

      state.bullets.forEach((bullet) => {
        ctx.fillStyle = `hsla(${((bullet.hue ?? 52) + 20) % 360}, 95%, 76%, 0.95)`
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
      const playerPixel = (state.player.radius * 2.3) / 12
      const lookingLeft = pointerRef.current.x < state.player.x
      drawSprite(HUNTER_SPRITE, state.player.x, state.player.y, playerPixel, 'rgba(255, 214, 106, 0.95)', lookingLeft)

      ctx.strokeStyle = 'rgba(255, 252, 232, 0.8)'
      ctx.beginPath()
      ctx.arc(state.player.x, state.player.y, state.player.radius + 6 + Math.sin(state.elapsed * 6) * 1.2, 0, Math.PI * 2)
      ctx.stroke()

      if (state.upgrades.damageAura > 0) {
        const auraRadius = 56 + state.upgrades.damageAura * 12
        const pulse = 0.72 + Math.sin(state.elapsed * 5.5) * 0.12
        ctx.strokeStyle = `rgba(167, 235, 255, ${0.2 + state.upgrades.damageAura * 0.04})`
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.arc(state.player.x, state.player.y, auraRadius * pulse, 0, Math.PI * 2)
        ctx.stroke()
      }

      if (state.upgrades.orbitingStars > 0) {
        const starCount = Math.min(8, 2 + state.upgrades.orbitingStars)
        const starOrbitR = 28 + state.upgrades.orbitingStars * 5
        for (let i = 0; i < starCount; i += 1) {
          const ang = state.elapsed * (2.4 + state.upgrades.orbitingStars * 0.12) + (Math.PI * 2 * i) / starCount
          const sx = state.player.x + Math.cos(ang) * starOrbitR
          const sy = state.player.y + Math.sin(ang) * starOrbitR
          ctx.fillStyle = 'rgba(255, 243, 173, 0.95)'
          ctx.beginPath()
          ctx.arc(sx, sy, 3.2, 0, Math.PI * 2)
          ctx.fill()
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.arc(sx, sy, 4.5, 0, Math.PI * 2)
          ctx.stroke()
        }
      }

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

      if (state.pausedForUpgrade && !state.gameOver) {
        ctx.fillStyle = 'rgba(10, 8, 20, 0.72)'
        ctx.fillRect(0, 0, state.width, state.height)

        ctx.fillStyle = 'rgba(235, 247, 255, 0.96)'
        ctx.font = 'bold 30px Chakra Petch, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('Choose an Upgrade', state.width / 2, state.height * 0.19)

        ctx.fillStyle = 'rgba(194, 224, 255, 0.9)'
        ctx.font = '16px Chakra Petch, sans-serif'
        ctx.fillText('Press 1, 2, 3 or click a card', state.width / 2, state.height * 0.235)

        const cardRects = getUpgradeCardRects()
        state.upgradeChoices.forEach((choice, index) => {
          const card = cardRects[index]
          if (!card) return

          ctx.fillStyle = 'rgba(26, 28, 46, 0.96)'
          ctx.fillRect(card.x, card.y, card.w, card.h)
          ctx.strokeStyle = 'rgba(138, 232, 255, 0.8)'
          ctx.lineWidth = 2
          ctx.strokeRect(card.x, card.y, card.w, card.h)

          ctx.fillStyle = 'rgba(145, 250, 197, 0.95)'
          ctx.font = 'bold 20px Chakra Petch, sans-serif'
          ctx.textAlign = 'left'
          ctx.fillText(`${index + 1}. ${choice.label}`, card.x + 14, card.y + 34)

          ctx.fillStyle = 'rgba(224, 236, 255, 0.9)'
          ctx.font = '15px Chakra Petch, sans-serif'
          const words = choice.detail.split(' ')
          const lines = []
          let line = ''
          words.forEach((word) => {
            const next = line ? `${line} ${word}` : word
            if (ctx.measureText(next).width > card.w - 24) {
              if (line) lines.push(line)
              line = word
            } else {
              line = next
            }
          })
          if (line) lines.push(line)
          lines.slice(0, 3).forEach((text, lineIndex) => {
            ctx.fillText(text, card.x + 14, card.y + 66 + lineIndex * 20)
          })
        })
      }

      frameId = window.requestAnimationFrame(loop)
    }

    resize()
    frameId = window.requestAnimationFrame(loop)
    canvas.addEventListener('mousemove', onPointerMove)
    canvas.addEventListener('mouseenter', onPointerMove)
    canvas.addEventListener('mouseleave', onPointerLeave)
    canvas.addEventListener('mousedown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('resize', resize)
    window.addEventListener('vampire:grant-upgrade', onGrantUpgrade)

    return () => {
      window.cancelAnimationFrame(frameId)
      canvas.removeEventListener('mousemove', onPointerMove)
      canvas.removeEventListener('mouseenter', onPointerMove)
      canvas.removeEventListener('mouseleave', onPointerLeave)
      canvas.removeEventListener('mousedown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('resize', resize)
      window.removeEventListener('vampire:grant-upgrade', onGrantUpgrade)
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
