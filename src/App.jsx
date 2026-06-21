import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage.jsx'
import PendingPage from './pages/auth/PendingPage.jsx'
import DeactivatedPage from './pages/DeactivatedPage.jsx'
import SADashboard from './pages/super-admin/SADashboard.jsx'
import SAManageTasks from './pages/super-admin/SAManageTasks.jsx'
import SAManageManagers from './pages/super-admin/SAManageManagers.jsx'
import SAManageDevelopers from './pages/super-admin/SAManageDevelopers.jsx'
import MGRDashboard from './pages/manager/MGRDashboard.jsx'
import MGRProjects from './pages/manager/MGRProjects.jsx'
import MGRProjectDetail from './pages/manager/MGRProjectDetail.jsx'
import DEVDashboard from './pages/developer/DEVDashboard.jsx'
import DEVMyTasks from './pages/developer/DEVMyTasks.jsx'
import DEVTaskDetail from './pages/developer/DEVTaskDetail.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import ProtectedRoute from './routes/ProtectedRoute.jsx'
import RoleRoute from './routes/RoleRoute.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/pending" element={<PendingPage />} />
        <Route path="/deactivated" element={<DeactivatedPage />} />

        <Route
          path="/super-admin/dashboard"
          element={
            <RoleRoute allowedRoles={['super_admin']}>
              <SADashboard />
            </RoleRoute>
          }
        />
        <Route
          path="/super-admin/tasks"
          element={
            <RoleRoute allowedRoles={['super_admin']}>
              <SAManageTasks />
            </RoleRoute>
          }
        />
        <Route
          path="/super-admin/managers"
          element={
            <RoleRoute allowedRoles={['super_admin']}>
              <SAManageManagers />
            </RoleRoute>
          }
        />
        <Route
          path="/super-admin/developers"
          element={
            <RoleRoute allowedRoles={['super_admin']}>
              <SAManageDevelopers />
            </RoleRoute>
          }
        />

        <Route
          path="/manager/dashboard"
          element={
            <RoleRoute allowedRoles={['manager']}>
              <MGRDashboard />
            </RoleRoute>
          }
        />
        <Route
          path="/manager/projects"
          element={
            <RoleRoute allowedRoles={['manager']}>
              <MGRProjects />
            </RoleRoute>
          }
        />
        <Route
          path="/manager/projects/:id"
          element={
            <RoleRoute allowedRoles={['manager']}>
              <MGRProjectDetail />
            </RoleRoute>
          }
        />

        <Route
          path="/developer/dashboard"
          element={
            <RoleRoute allowedRoles={['developer']}>
              <DEVDashboard />
            </RoleRoute>
          }
        />
        <Route
          path="/developer/tasks"
          element={
            <RoleRoute allowedRoles={['developer']}>
              <DEVMyTasks />
            </RoleRoute>
          }
        />
        <Route
          path="/developer/tasks/:id"
          element={
            <RoleRoute allowedRoles={['developer']}>
              <DEVTaskDetail />
            </RoleRoute>
          }
        />

        {/* Profile — accessible to all roles */}
        <Route path="/profile" element={<ProfilePage />} />
      </Route>
    </Routes>
  )
}
