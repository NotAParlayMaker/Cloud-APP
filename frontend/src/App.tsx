import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DataUpload from './pages/DataUpload';
import Analytics from './pages/Analytics';
import Predictions from './pages/Predictions';
import Datasets from './pages/Datasets';
import Teams from './pages/Teams';
import Players from './pages/Players';

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Layout>
                <Dashboard />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/upload"
          element={
            isAuthenticated ? (
              <Layout>
                <DataUpload />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/analytics"
          element={
            isAuthenticated ? (
              <Layout>
                <Analytics />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/predictions"
          element={
            isAuthenticated ? (
              <Layout>
                <Predictions />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/datasets"
          element={
            isAuthenticated ? (
              <Layout>
                <Datasets />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/teams"
          element={
            isAuthenticated ? (
              <Layout>
                <Teams />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/players"
          element={
            isAuthenticated ? (
              <Layout>
                <Players />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
