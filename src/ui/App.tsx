function App() {
  return (
    <div className="container">
      <h1>Event Modeling Plugin</h1>
      <p className="description">
        Create and manage Event Modeling diagrams in FigJam.
      </p>
      <div className="section">
        <h2>Create Elements</h2>
        <div className="button-group">
          <button className="button button-event" disabled>
            Event
          </button>
          <button className="button button-command" disabled>
            Command
          </button>
          <button className="button button-view" disabled>
            View
          </button>
        </div>
      </div>
      <p className="placeholder-text">
        Element creation coming soon...
      </p>
    </div>
  )
}

export default App
