import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Dex from './pages/Dex'
import Portfolio from './pages/Portfolio'
import Docs from './pages/Docs'
import Faucet from './pages/Faucet'
import Positions from './pages/Positions'
import PnL from './pages/PnL'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/trade" element={<Dex />} />
      <Route path="/portfolio" element={<Portfolio />} />
      <Route path="/docs" element={<Docs />} />
      <Route path="/faucet" element={<Faucet />} />
      <Route path="/positions" element={<Positions />} />
      <Route path="/pnl" element={<PnL />} />
    </Routes>
  )
}
