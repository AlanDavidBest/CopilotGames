import RecycleViewport from './RecycleViewport'
import { fmtRecycle, RecycleGameProvider, useRecycleGame } from './RecycleStore'

function TopPanel() {
  return (
    <>
      <span>MODE: RECYCLE</span>
      <span>CIRCULAR ECONOMY // GLOBAL LOOP</span>
      <span>OBJECTIVE: ZERO WASTE</span>
    </>
  )
}

function LeftPanel() {
  const { game, visibleStreams, worldComplete } = useRecycleGame()

  return (
    <div className="recycle-left-wrap">
      <section className="recycle-left-section">
        <h2 className="recycle-left-heading">Global Status</h2>
        <div className="recycle-left-stat"><span>Credits</span><strong>{fmtRecycle(game.credits)}</strong></div>
        <div className="recycle-left-stat"><span>Recycle Impact</span><strong>{fmtRecycle(game.impact)}</strong></div>
        <div className="recycle-left-stat"><span>Status</span><strong className="recycle-left-status">{worldComplete ? 'Single-Use World Achieved' : 'Expansion In Progress'}</strong></div>
      </section>

      <section className="recycle-left-section">
        <h2 className="recycle-left-heading">Stream Stats</h2>
        {visibleStreams.map((streamKey) => {
          const stream = game.streams[streamKey]
          return (
            <div key={streamKey} className="recycle-left-stream">
              <div className="recycle-left-stream-title">{stream.label}</div>
              <div className="recycle-left-stat"><span>Total Recycled</span><strong>{fmtRecycle(stream.total)}</strong></div>
              <div className="recycle-left-stat"><span>Auto Rate</span><strong>{fmtRecycle(stream.auto)}/s</strong></div>
            </div>
          )
        })}
      </section>

      <section className="recycle-left-section recycle-left-howto">
        <h2 className="recycle-left-heading">How To Play</h2>
        <p>Click stream buttons to process materials.</p>
        <p>Outputs sell over time for credits.</p>
        <p>Buy upgrades to boost throughput &amp; automation.</p>
        <p>sewage &rarr; waste &rarr; land &rarr; acquisitions &rarr; world</p>
      </section>
    </div>
  )
}

function CenterPanel() {
  return (
    <>
      <RecycleViewport />
    </>
  )
}

function RightPanel() {
  const { availableUpgrades, buyUpgrade, debugBoost } = useRecycleGame()

  return (
    <>
      <h2>Upgrades</h2>
      <div className="recycle-side-upgrades">
        {availableUpgrades.length === 0 ? <p>No upgrades currently available.</p> : null}
        {availableUpgrades.map((upgrade) => (
          <div className="recycle-upgrade-item" key={upgrade.id}>
            <div>
              <strong>{upgrade.name}</strong>
              <p>{upgrade.desc}</p>
            </div>
            <button type="button" className="hud-button" onClick={() => buyUpgrade(upgrade)}>
              Buy ({fmtRecycle(upgrade.cost)})
            </button>
          </div>
        ))}
      </div>

      <button type="button" className="hud-button recycle-debug-button" onClick={debugBoost}>
        Debug x1000
      </button>
    </>
  )
}

function BottomPanel({ onBackToMenu }) {
  return (
    <>
      <div className="hud-wave" aria-hidden="true" />
      <div className="hud-bottom-row">
        <button type="button" className="hud-button" onClick={onBackToMenu}>Exit To Menu</button>
        <button type="button" className="hud-button">Policy</button>
        <button type="button" className="hud-button">Logistics</button>
        <button type="button" className="hud-button">R&D</button>
      </div>
    </>
  )
}

const RecyclePanels = {
  Provider: RecycleGameProvider,
  TopPanel,
  LeftPanel,
  CenterPanel,
  RightPanel,
  BottomPanel,
}

export default RecyclePanels
