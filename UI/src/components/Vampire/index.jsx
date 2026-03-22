import VampireViewport from './VampireViewport'

const DEBUG_UPGRADES = [
  { id: 'wideShot', label: 'Wide Shot' },
  { id: 'rearShot', label: 'Shoot Behind' },
  { id: 'leechShot', label: 'Leech Life Shot' },
  { id: 'damageAura', label: 'Damage Area' },
  { id: 'orbitingStars', label: 'Orbiting Stars' },
  { id: 'pickupRange', label: 'Pickup Range' },
  { id: 'projectiles', label: '+1 Projectile' },
  { id: 'heavyRounds', label: 'Heavy Rounds' },
]

function TopPanel() {
  return (
    <>
      <span>MODE: VAMPIRE</span>
      <span>NIGHT SWARM // SURVIVAL FEED</span>
      <span>STATUS: HUNT ACTIVE</span>
    </>
  )
}

function LeftPanel() {
  return (
    <>
      <h2>Controls</h2>
      <p>Move: Mouse Position</p>
      <p>Aim: Cursor Direction</p>
      <p>Fire: Automatic Pulse Shot</p>

      <div className="hud-status-stack">
        <div><span>Aura</span><strong>Charged</strong></div>
        <div><span>Swarm</span><strong>Approaching</strong></div>
        <div><span>Night</span><strong>Deep</strong></div>
      </div>
    </>
  )
}

function CenterPanel() {
  return (
    <>
      <VampireViewport />
    </>
  )
}

function RightPanel() {
  const grantUpgrade = (id) => {
    window.dispatchEvent(new CustomEvent('vampire:grant-upgrade', { detail: { id } }))
  }

  return (
    <>
      <h2>Telemetry</h2>
      <div className="hud-grid-box" aria-hidden="true">
        <div className="hud-grid-shape" />
      </div>
      <p>Wave Type: Swarm</p>
      <p>Curse Level: Rising</p>
      <p>Drop Rate: Normal</p>

      <div className="hud-status-stack">
        {DEBUG_UPGRADES.map((upgrade) => (
          <button
            key={upgrade.id}
            type="button"
            className="hud-button"
            onClick={() => grantUpgrade(upgrade.id)}
          >
            {upgrade.label}
          </button>
        ))}
      </div>
    </>
  )
}

function BottomPanel({ onBackToMenu }) {
  return (
    <>
      <div className="hud-wave" aria-hidden="true" />
      <div className="hud-bottom-row">
        <button type="button" className="hud-button" onClick={onBackToMenu}>Exit To Menu</button>
        <button type="button" className="hud-button">Dash</button>
        <button type="button" className="hud-button">Nova</button>
        <button type="button" className="hud-button">Relics</button>
      </div>
    </>
  )
}

const VampirePanels = {
  TopPanel,
  LeftPanel,
  CenterPanel,
  RightPanel,
  BottomPanel,
}

export default VampirePanels
