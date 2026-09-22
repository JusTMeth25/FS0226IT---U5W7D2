import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { RichiedeAccesso, RichiedeAdmin } from './components/Guardie'
import Layout from './components/Layout'
import { AuthProvider } from './context/AuthProvider'
import { PreferitiProvider } from './context/PreferitiProvider'
import { ToastProvider } from './context/ToastProvider'
import AdminPage from './pages/AdminPage'
import AuthPage from './pages/AuthPage'
import DiscoPage from './pages/DiscoPage'
import NotFoundPage from './pages/NotFoundPage'
import PreferitiPage from './pages/PreferitiPage'
import VetrinaPage from './pages/VetrinaPage'

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <PreferitiProvider>
            <Routes>
              <Route element={<Layout />}>
                <Route index element={<VetrinaPage />} />
                <Route path="dischi/:id" element={<DiscoPage />} />
                <Route path="login" element={<AuthPage modo="login" />} />
                <Route path="registrazione" element={<AuthPage modo="registrazione" />} />
                <Route
                  path="preferiti"
                  element={
                    <RichiedeAccesso>
                      <PreferitiPage />
                    </RichiedeAccesso>
                  }
                />
                <Route
                  path="admin"
                  element={
                    <RichiedeAdmin>
                      <AdminPage />
                    </RichiedeAdmin>
                  }
                />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </PreferitiProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}
