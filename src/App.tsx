reimport { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import MorningPage from './pages/MorningPage'
import ArtistDatePage from './pages/ArtistDatePage'
import { AuthProvider, useAuth } from './auth/AuthProvider'

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
            <Route path="/morning-page" element={<ProtectedRoute><MorningPage /></ProtectedRoute>} />
            <Route path="/artist-date" element={<ProtectedRoute><ArtistDatePage /></ProtectedRoute>} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
