import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LoadScript } from '@react-google-maps/api'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Map from './pages/Map'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/map" element={<Map />} />
        </Routes>
      </LoadScript>
    </BrowserRouter>
  )
}

export default App
