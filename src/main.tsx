import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import AuthGateway from './components/AuthGateway.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {import.meta.env.MODE === "test" || import.meta.env.VITE_DEMO_MODE === "true" ? (
      <App />
    ) : (
      <AuthGateway>{(profile) => <App authenticatedUser={profile} />}</AuthGateway>
    )}
  </StrictMode>,
);
