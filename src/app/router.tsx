import { lazy, Suspense } from 'react'
import { Navigate, createBrowserRouter } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { RouteErrorBoundary } from '../components/ui/RouteErrorBoundary'
import { LoadingState } from '../components/ui/States'

const TodayPage = lazy(() => import('../pages/TodayPage').then(module => ({ default: module.TodayPage })))
const TasksPage = lazy(() => import('../pages/TasksPage').then(module => ({ default: module.TasksPage })))
const CalendarPage = lazy(() => import('../pages/CalendarPage').then(module => ({ default: module.CalendarPage })))
const DashboardPage = lazy(() => import('../pages/DashboardPage').then(module => ({ default: module.DashboardPage })))
const SettingsPage = lazy(() => import('../pages/SettingsPage').then(module => ({ default: module.SettingsPage })))

const load = (page: React.ReactNode) => <Suspense fallback={<LoadingState />}>{page}</Suspense>

export const router = createBrowserRouter([{
  path: '/',
  element: <AppShell />,
  errorElement: <RouteErrorBoundary />,
  children: [
    { index: true, element: <Navigate to="/today" replace /> },
    { path: 'today', element: load(<TodayPage />) },
    { path: 'tasks', element: load(<TasksPage />) },
    { path: 'calendar', element: load(<CalendarPage />) },
    { path: 'dashboard', element: load(<DashboardPage />) },
    { path: 'settings', element: load(<SettingsPage />) },
  ],
}])
