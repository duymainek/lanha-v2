import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import AppRouter from './AppRouter'
import { Toaster } from "@/components/ui/sonner"
import { QuickCreateSheet } from "@/components/quick-create-sheet"

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AppRouter />
      <QuickCreateSheet />
      <Toaster />
    </BrowserRouter>
  </StrictMode>,
)
