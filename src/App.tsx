import { ThemeSettings } from './theme/Theme';
import router from './routes/Router';
import { RouterProvider } from 'react-router';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { AuthProvider } from './context/AuthContext';
import IntervalFetcher from './components/intervalFetcher/IntervalFetcher';

function App() {
  const theme = ThemeSettings();


  return (
    <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <IntervalFetcher />
          <RouterProvider router={router} />
        </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
