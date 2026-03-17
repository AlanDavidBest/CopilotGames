import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const RecycleGameContext = createContext(null)

const STREAM_ORDER = ['sewage', 'waste', 'land', 'acquisition', 'world']

const STREAM_BASE = {
  sewage: {
    label: 'Sewerage Recycling',
    outputName: 'Fertilizer',
    unlocked: true,
    amount: 0,
    total: 0,
    manual: 1,
    auto: 0,
    sellValue: 1.3,
    sellRate: 4,
  },
  waste: {
    label: 'General Waste Recycling',
    outputName: 'Recovered Materials',
    unlocked: false,
    amount: 0,
    total: 0,
    manual: 1,
    auto: 0,
    sellValue: 2.2,
    sellRate: 4,
  },
  land: {
    label: 'Land Reclamation',
    outputName: 'Usable Land Units',
    unlocked: false,
    amount: 0,
    total: 0,
    manual: 1,
    auto: 0,
    sellValue: 4.5,
    sellRate: 3,
  },
  acquisition: {
    label: 'Legacy Asset Recovery',
    outputName: 'Retrofitted Assets',
    unlocked: false,
    amount: 0,
    total: 0,
    manual: 1,
    auto: 0,
    sellValue: 8,
    sellRate: 2,
  },
  world: {
    label: 'Single-Use World Loop',
    outputName: 'Complete Recycle Cycles',
    unlocked: false,
    amount: 0,
    total: 0,
    manual: 1,
    auto: 0,
    sellValue: 15,
    sellRate: 2,
  },
}

const UPGRADE_LIST = [
  {
    id: 'sewage-biofilter',
    stream: 'sewage',
    name: 'Biofilter Expansion',
    desc: '+2 manual sewage processing',
    cost: 45,
    unlock: (g) => g.streams.sewage.total >= 18,
    apply: (s) => {
      s.manual += 2
    },
  },
  {
    id: 'sewage-auto-pump',
    stream: 'sewage',
    name: 'Auto Pump Array',
    desc: 'Unlock sewage automation (+2.5/s)',
    cost: 190,
    unlock: (g) => g.streams.sewage.total >= 80,
    apply: (s) => {
      s.auto += 2.5
    },
  },
  {
    id: 'sewage-ai-plant',
    stream: 'sewage',
    name: 'AI Plant Control',
    desc: '+5/s automation and better sale throughput',
    cost: 760,
    unlock: (g) => g.streams.sewage.total >= 260,
    apply: (s) => {
      s.auto += 5
      s.sellRate += 4
    },
  },
  {
    id: 'waste-sort-line',
    stream: 'waste',
    name: 'Sort Line Core',
    desc: '+2 manual waste processing',
    cost: 1200,
    unlock: (g) => g.streams.waste.unlocked,
    apply: (s) => {
      s.manual += 2
    },
  },
  {
    id: 'waste-paper',
    stream: 'waste',
    name: 'Paper/Cardboard Recovery',
    desc: 'Increase waste sale value',
    cost: 1650,
    unlock: (g) => g.streams.waste.total >= 80,
    apply: (s) => {
      s.sellValue += 0.9
    },
  },
  {
    id: 'waste-plastic',
    stream: 'waste',
    name: 'Plastic Reprocessing',
    desc: 'Increase waste sale rate',
    cost: 2200,
    unlock: (g) => g.streams.waste.total >= 130,
    apply: (s) => {
      s.sellRate += 2.4
    },
  },
  {
    id: 'waste-glass',
    stream: 'waste',
    name: 'Glass Furnace Loop',
    desc: 'Increase waste sale value again',
    cost: 2800,
    unlock: (g) => g.streams.waste.total >= 190,
    apply: (s) => {
      s.sellValue += 1.15
    },
  },
  {
    id: 'waste-metal',
    stream: 'waste',
    name: 'Metal Recovery Smelter',
    desc: '+3.5/s automation',
    cost: 3400,
    unlock: (g) => g.streams.waste.total >= 250,
    apply: (s) => {
      s.auto += 3.5
    },
  },
  {
    id: 'waste-auto-fleet',
    stream: 'waste',
    name: 'Autonomous Collection Fleet',
    desc: '+7/s automation and +2 manual',
    cost: 5200,
    unlock: (g) => g.streams.waste.total >= 380,
    apply: (s) => {
      s.auto += 7
      s.manual += 2
    },
  },
  {
    id: 'land-drone',
    stream: 'land',
    name: 'Terrain Drone Survey',
    desc: '+2 manual land reclamation',
    cost: 9200,
    unlock: (g) => g.streams.land.unlocked,
    apply: (s) => {
      s.manual += 2
    },
  },
  {
    id: 'land-auto-rig',
    stream: 'land',
    name: 'Auto Regrade Rig',
    desc: '+4.5/s land automation',
    cost: 14600,
    unlock: (g) => g.streams.land.total >= 90,
    apply: (s) => {
      s.auto += 4.5
    },
  },
  {
    id: 'land-habitat-loop',
    stream: 'land',
    name: 'Habitat Restoration Loop',
    desc: 'Increase land value and sale throughput',
    cost: 23000,
    unlock: (g) => g.streams.land.total >= 180,
    apply: (s) => {
      s.sellValue += 2.8
      s.sellRate += 2
    },
  },
  {
    id: 'acquire-brownfield',
    stream: 'acquisition',
    name: 'Brownfield Buyout',
    desc: '+2 manual acquisition processing',
    cost: 32000,
    unlock: (g) => g.streams.acquisition.unlocked,
    apply: (s) => {
      s.manual += 2
    },
  },
  {
    id: 'acquire-fabricator',
    stream: 'acquisition',
    name: 'Retrofit Fabricators',
    desc: '+4/s automation',
    cost: 47000,
    unlock: (g) => g.streams.acquisition.total >= 70,
    apply: (s) => {
      s.auto += 4
    },
  },
  {
    id: 'acquire-site-swarm',
    stream: 'acquisition',
    name: 'Site Salvage Swarm',
    desc: '+7/s automation and increased value',
    cost: 70000,
    unlock: (g) => g.streams.acquisition.total >= 140,
    apply: (s) => {
      s.auto += 7
      s.sellValue += 3.5
    },
  },
  {
    id: 'world-loop-core',
    stream: 'world',
    name: 'Single-Use Loop Core',
    desc: '+6/s world automation',
    cost: 120000,
    unlock: (g) => g.streams.world.unlocked,
    apply: (s) => {
      s.auto += 6
    },
  },
  {
    id: 'world-one-pass',
    stream: 'world',
    name: 'One-Pass Circular Protocol',
    desc: '+14/s automation and +6 sale value',
    cost: 240000,
    unlock: (g) => g.streams.world.total >= 70,
    apply: (s) => {
      s.auto += 14
      s.sellValue += 6
      s.sellRate += 4
    },
  },
]

const makeInitialGame = () => ({
  credits: 0,
  impact: 0,
  streams: structuredClone(STREAM_BASE),
  purchased: {},
  notifications: ['Start by recycling sewerage into fertilizer.'],
})

const pushNotice = (list, message) => [message, ...list].slice(0, 5)

export const fmtRecycle = (n) => n.toLocaleString(undefined, { maximumFractionDigits: n >= 100 ? 0 : 2 })

export function RecycleGameProvider({ children }) {
  const [game, setGame] = useState(makeInitialGame)

  const visibleStreams = useMemo(
    () => STREAM_ORDER.filter((key) => game.streams[key].unlocked),
    [game.streams],
  )

  const availableUpgrades = useMemo(
    () =>
      UPGRADE_LIST.filter((upgrade) => {
        if (game.purchased[upgrade.id]) return false
        return game.streams[upgrade.stream].unlocked && upgrade.unlock(game)
      }),
    [game],
  )

  const worldComplete = useMemo(
    () => game.streams.world.total >= 250 && (game.streams.world.auto >= 20 || game.streams.world.sellValue >= 21),
    [game],
  )

  const buyUpgrade = (upgrade) => {
    setGame((prev) => {
      if (prev.purchased[upgrade.id]) return prev
      if (prev.credits < upgrade.cost) return prev
      if (!upgrade.unlock(prev)) return prev

      const next = {
        ...prev,
        credits: prev.credits - upgrade.cost,
        streams: structuredClone(prev.streams),
        purchased: { ...prev.purchased, [upgrade.id]: true },
        notifications: [...prev.notifications],
      }

      upgrade.apply(next.streams[upgrade.stream])
      next.notifications = pushNotice(next.notifications, `Upgrade online: ${upgrade.name}`)
      return next
    })
  }

  const manualRecycle = (streamKey) => {
    setGame((prev) => {
      const stream = prev.streams[streamKey]
      if (!stream?.unlocked) return prev

      const next = {
        ...prev,
        streams: structuredClone(prev.streams),
      }

      const s = next.streams[streamKey]
      s.amount += s.manual
      s.total += s.manual
      next.impact = prev.impact + s.manual
      return next
    })
  }

  const debugBoost = () => {
    setGame((prev) => {
      const next = {
        ...prev,
        credits: prev.credits + 1000,
        impact: prev.impact * 1000 + 1000,
        streams: structuredClone(prev.streams),
        notifications: [...prev.notifications],
      }

      STREAM_ORDER.forEach((key) => {
        const s = next.streams[key]
        if (!s.unlocked) return
        s.amount *= 1000
        s.total *= 1000
        s.manual *= 1000
        s.auto *= 1000
        s.sellValue *= 1000
        s.sellRate *= 1000
      })

      next.notifications = pushNotice(next.notifications, 'DEBUG BOOST APPLIED (x1000).')
      return next
    })
  }

  useEffect(() => {
    const id = window.setInterval(() => {
      setGame((prev) => {
        const next = {
          ...prev,
          streams: structuredClone(prev.streams),
          notifications: [...prev.notifications],
        }

        let credits = prev.credits
        let impact = prev.impact

        STREAM_ORDER.forEach((key) => {
          if (!next.streams[key].unlocked) return
          const stream = next.streams[key]
          const produced = stream.auto * 0.2
          stream.amount += produced
          stream.total += produced

          const sold = Math.min(stream.amount, stream.sellRate * 0.2)
          stream.amount -= sold
          credits += sold * stream.sellValue
          impact += produced + sold * 0.25
        })

        next.credits = credits
        next.impact = impact

        const sewage = next.streams.sewage
        const waste = next.streams.waste
        const land = next.streams.land
        const acquisition = next.streams.acquisition
        const world = next.streams.world

        if (!waste.unlocked && (sewage.total >= 280 || credits >= 950)) {
          waste.unlocked = true
          next.notifications = pushNotice(next.notifications, 'General waste recycling unlocked.')
        }

        if (!land.unlocked && (waste.total >= 340 || credits >= 9000)) {
          land.unlocked = true
          next.notifications = pushNotice(next.notifications, 'Land reclamation operations unlocked.')
        }

        if (!acquisition.unlocked && (land.total >= 260 || credits >= 30000)) {
          acquisition.unlocked = true
          next.notifications = pushNotice(next.notifications, 'Legacy acquisition and retrofit unlocked.')
        }

        if (!world.unlocked && (acquisition.total >= 220 || credits >= 110000)) {
          world.unlocked = true
          next.notifications = pushNotice(next.notifications, 'Single-use world loop unlocked.')
        }

        return next
      })
    }, 200)

    return () => window.clearInterval(id)
  }, [])

  const value = {
    game,
    visibleStreams,
    availableUpgrades,
    worldComplete,
    manualRecycle,
    buyUpgrade,
    debugBoost,
  }

  return <RecycleGameContext.Provider value={value}>{children}</RecycleGameContext.Provider>
}

export function useRecycleGame() {
  const value = useContext(RecycleGameContext)
  if (!value) {
    throw new Error('useRecycleGame must be used inside RecycleGameProvider')
  }
  return value
}
