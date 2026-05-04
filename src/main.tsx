import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import AppToaster from './components/AppToaster.tsx'
import { UserProvider } from './contexts/UserContext.tsx'
import { ThemeProvider } from './contexts/ThemeContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <UserProvider>
          <App />
        </UserProvider>
        <AppToaster />
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)
