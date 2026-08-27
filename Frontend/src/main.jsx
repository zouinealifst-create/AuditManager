import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'

import 'bootstrap/dist/css/bootstrap.min.css'
import './index.css'
import App from './App.jsx'

import { store } from './store/store.js'
import { AuthProvider } from './context/AuthContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* Redux Provider — RTK Query cache global */}
    <Provider store={store}>
      {/* AuthProvider préservé intact — coexiste avec Redux */}
      <AuthProvider>
        <App />
      </AuthProvider>
    </Provider>
  </StrictMode>,
)