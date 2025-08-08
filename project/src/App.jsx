import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Monetization from './components/monetization/Monetization'
import ManTripTracker from './components/ManTripTracker'
import About from './components/About'
import { getRouterBasename } from './utils/routerUtils'

function App() {

  return (
    <Monetization>
      <Router basename={getRouterBasename()}>
        <Routes>
          <Route path="/" element={<ManTripTracker />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </Router>
    </Monetization>
  )
}

export default App