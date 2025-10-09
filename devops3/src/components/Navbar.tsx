import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './Navbar.css'

function Navbar() {
  const { isAuthenticated, user } = useAuth()

  return (
    <nav className="navbar">
      <div className="nav-left">
        <Link to="/" className="nav-link">Home</Link>
        <Link to="/map" className="nav-link">Map</Link>
      </div>
      <div className="nav-right">
        {isAuthenticated ? (
          <>
            <span className="nav-user">👤 {user?.nickname}</span>
            <Link to="/mypage" className="nav-link">마이페이지</Link>
          </>
        ) : (
          <Link to="/login" className="nav-link nav-login">로그인</Link>
        )}
      </div>
    </nav>
  )
}

export default Navbar
