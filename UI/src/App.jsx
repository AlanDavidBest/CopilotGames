import { useState } from 'react'
import AnimatedRoadScene from './components/AnimatedRoadScene'
import GameScreen from './components/GameScreen'
import MenuScreen from './components/MenuScreen'
import PsychedelicWireframeScene from './components/PsychedelicWireframeScene'
import './App.css'

function App() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [panelPack, setPanelPack] = useState('asteroids')
  const [backgroundMode, setBackgroundMode] = useState('psychedelic')
  const [shapeCount, setShapeCount] = useState(118)

  const startWithPack = (packName) => {
    setPanelPack(packName)
    setIsPlaying(true)
  }

  return (
    <div className="app-shell">
      {backgroundMode === 'psychedelic' ? <PsychedelicWireframeScene shapeCount={shapeCount} /> : <AnimatedRoadScene />}

      <div className="vignette" aria-hidden="true" />

      <div className={`foreground-layer ${isPlaying ? 'foreground-layer-game' : ''}`}>
        <div className={`screen-wrap ${isPlaying ? 'screen-wrap-game' : ''}`}>
          {isPlaying ? (
            <GameScreen panelPack={panelPack} onBackToMenu={() => setIsPlaying(false)} />
          ) : (
            <MenuScreen
              onStartAsteroids={() => startWithPack('asteroids')}
              onStartLogic={() => startWithPack('logic')}
              onStartPacman={() => startWithPack('pacman')}
              onStartSpaceInvaders={() => startWithPack('spaceinvaders')}
              onStartVampire={() => startWithPack('vampire')}
              onStartRecycle={() => startWithPack('recycle')}
              onStartScaffold={() => startWithPack('scaffold')}
              backgroundMode={backgroundMode}
              onToggleBackground={() =>
                setBackgroundMode((prev) => (prev === 'psychedelic' ? 'road' : 'psychedelic'))
              }
            />
          )}
        </div>
      </div>

      {!isPlaying ? (
        <div className="shape-slider-control">
          <label htmlFor="shape-count-slider">Wireframes: {shapeCount}</label>
          <input
            id="shape-count-slider"
            type="range"
            min="1"
            max="500"
            step="1"
            value={shapeCount}
            onChange={(event) => setShapeCount(Number(event.target.value))}
            disabled={backgroundMode !== 'psychedelic'}
          />
        </div>
      ) : null}
    </div>
  )
}

export default App
