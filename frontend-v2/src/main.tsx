import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/inter/index.css'
import './styles/global.css'
import { Login } from './pages/Login'
import { Signup } from './pages/Signup'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ChatPage } from './pages/Chat'
import { Dashboard } from './pages/Dashboard'
import { GroupPage } from './pages/Group'
import { Landing } from './pages/Landing'
import { ProfilePage } from './pages/Profile'
import { SettingsPage } from './pages/Settings'
import { UserProfilePage } from './pages/UserProfile'
import { GroupDetailPage } from './pages/GroupDetail'
import { NotificationsPage } from './pages/Notifications'

export function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login/>}/>
        <Route path="/signup" element={<Signup/>}/>
        <Route path="/dashboard" element={<Dashboard/>}/>
        <Route path="/groups" element={<GroupPage/>}/>
        <Route path="/chat" element={<ChatPage/>}/>
        <Route path="/profile" element={<ProfilePage/>}/>
        <Route path="/settings" element={<SettingsPage/>}/>
        <Route path="/users/:userId" element={<UserProfilePage/>}/>
        <Route path="/groups/:groupId" element={<GroupDetailPage/>}/>
        <Route path="/notifications" element={<NotificationsPage/>}/>
        <Route path="*" element={<Landing/>}/>
      </Routes>
    </Router>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)