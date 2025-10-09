import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LoadScript } from '@react-google-maps/api'
import { AuthProvider } from './contexts/AuthContext'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Map from './pages/Map'
import Login from './pages/Login'
import MyPage from './pages/MyPage'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/map" element={<Map />} />
            <Route path="/login" element={<Login />} />
            <Route path="/mypage" element={<MyPage />} />
          </Routes>
        </LoadScript>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
