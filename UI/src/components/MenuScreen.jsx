export default function MenuScreen({
  onStartAsteroids,
  onStartLogic,
  onStartScaffold,
  onStartPacman,
  onStartSpaceInvaders,
  onStartVampire,
  onStartRecycle,
  backgroundMode,
  onToggleBackground,
}) {
  return (
    <section className="menu-shell" aria-labelledby="main-menu-title">
      <p className="menu-overline">Roadlight Arcade</p>
      <h1 id="main-menu-title">Skyline Sprint</h1>
      <p className="menu-tagline">Select a module to launch.</p>

      <div className="menu-actions">
        <button type="button" className="menu-button menu-button-primary" onClick={onStartAsteroids}>
          Asteroids
        </button>
        <button type="button" className="menu-button" onClick={onStartPacman}>
          Pac-Man
        </button>
        <button type="button" className="menu-button" onClick={onStartSpaceInvaders}>
          Space Invaders
        </button>
        <button type="button" className="menu-button" onClick={onStartLogic}>
          Logic
        </button>
        <button type="button" className="menu-button" onClick={onStartVampire}>
          Vampire
        </button>
        <button type="button" className="menu-button" onClick={onStartRecycle}>
          Recycle
        </button>
        <button type="button" className="menu-button" onClick={onStartScaffold}>
          Scaffold
        </button>
        <button type="button" className="menu-button menu-button-alt" onClick={onToggleBackground}>
          Background: {backgroundMode === 'psychedelic' ? 'Psychedelic' : 'Road'}
        </button>
      </div>
    </section>
  )
}
