import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { RequireAuth } from './components/RequireAuth';
import { AuthProvider } from './hooks/AuthContext';
import { About } from './pages/About';
import { Dashboard } from './pages/Dashboard';
import { DesignerProfile } from './pages/DesignerProfile';
import { EditProfile } from './pages/EditProfile';
import { Home } from './pages/Home';
import { HowItWorks } from './pages/HowItWorks';
import { JobDetail } from './pages/JobDetail';
import { JobIntake } from './pages/JobIntake';
import { Login } from './pages/Login';
import { Marketplace } from './pages/Marketplace';
import { Messages } from './pages/Messages';
import { NotFound } from './pages/NotFound';
import { ProjectDetail } from './pages/ProjectDetail';
import { Profile } from './pages/Profile';
import { PublicProfile } from './pages/PublicProfile';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<Home />} />
            <Route path="about" element={<About />} />
            <Route path="how-it-works" element={<HowItWorks />} />
            <Route path="login" element={<Login />} />
            <Route path="marketplace" element={<Marketplace />} />
            <Route path="designers/:id" element={<DesignerProfile />} />
            <Route path="profiles/:id" element={<PublicProfile />} />
            <Route
              path="profile"
              element={
                <RequireAuth>
                  <Profile />
                </RequireAuth>
              }
            />
            <Route
              path="profile/edit"
              element={
                <RequireAuth>
                  <EditProfile />
                </RequireAuth>
              }
            />
            <Route
              path="messages/new"
              element={
                <RequireAuth>
                  <Messages />
                </RequireAuth>
              }
            />
            <Route
              path="messages"
              element={
                <RequireAuth>
                  <Messages />
                </RequireAuth>
              }
            />
            <Route path="jobs/:id" element={<JobDetail />} />
            <Route
              path="jobs/new"
              element={
                <RequireAuth roles={['client']}>
                  <JobIntake />
                </RequireAuth>
              }
            />
            <Route
              path="dashboard"
              element={
                <RequireAuth>
                  <Dashboard />
                </RequireAuth>
              }
            />
            <Route
              path="projects/:id"
              element={
                <RequireAuth>
                  <ProjectDetail />
                </RequireAuth>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}