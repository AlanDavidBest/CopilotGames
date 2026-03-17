import { fmtRecycle, useRecycleGame } from './RecycleStore'

export default function RecycleViewport() {
  const { game, visibleStreams, manualRecycle } = useRecycleGame()

  return (
    <div className="recycle-center-wrap">
      <div className="recycle-stream-grid">
        {visibleStreams.map((streamKey) => {
          const stream = game.streams[streamKey]
          return (
            <article key={streamKey} className="recycle-card">
              <h3>{stream.label}</h3>
              <p>{stream.outputName} Stored: {fmtRecycle(stream.amount)}</p>
              <p>Sale Value: {fmtRecycle(stream.sellValue)} credits</p>
              <button type="button" className="hud-button" onClick={() => manualRecycle(streamKey)}>
                Recycle {fmtRecycle(stream.manual)}
              </button>
            </article>
          )
        })}
      </div>

      <div className="recycle-notes">
        <h3>Operations Log</h3>
        {game.notifications.map((message, index) => (
          <p key={`${index}-${message}`}>{message}</p>
        ))}
      </div>
    </div>
  )
}
