import { Fragment } from 'react'
import AsteroidsPanels from './Asteroids'
import LogicPanels from './Logic'
import PacmanPanels from './Pacman'
import RecyclePanels from './Recycle'
import ScaffoldPanels from './Scaffold'
import SpaceInvadersPanels from './SpaceInvaders'
import VampirePanels from './Vampire'

const PANEL_PACKS = {
  scaffold: ScaffoldPanels,
  asteroids: AsteroidsPanels,
  logic: LogicPanels,
  pacman: PacmanPanels,
  recycle: RecyclePanels,
  spaceinvaders: SpaceInvadersPanels,
  vampire: VampirePanels,
}

export default function GameScreen({ onBackToMenu, panelPack = 'asteroids' }) {
  const pack = PANEL_PACKS[panelPack] ?? ScaffoldPanels
  const PackProvider = pack.Provider ?? Fragment
  const TopPanel = pack.TopPanel
  const LeftPanel = pack.LeftPanel
  const CenterPanel = pack.CenterPanel
  const RightPanel = pack.RightPanel
  const BottomPanel = pack.BottomPanel

  return (
    <section className="game-shell" aria-label="Game viewport">
      <PackProvider>
        <header className="panel panel-top hud-strip">
          <TopPanel onBackToMenu={onBackToMenu} />
        </header>

        <aside className="panel panel-left hud-panel" aria-label="Left controls panel">
          <LeftPanel onBackToMenu={onBackToMenu} />
        </aside>

        <main className="game-content" aria-label="Main game content">
          <CenterPanel onBackToMenu={onBackToMenu} />
        </main>

        <aside className="panel panel-right hud-panel" aria-label="Right info panel">
          <RightPanel onBackToMenu={onBackToMenu} />
        </aside>

        <footer className="panel panel-bottom hud-panel" aria-label="Bottom quick actions">
          <BottomPanel onBackToMenu={onBackToMenu} />
        </footer>
      </PackProvider>
    </section>
  )
}
