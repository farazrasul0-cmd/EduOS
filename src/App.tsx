import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { RequireAuth, RequireRole, RedirectIfAuthed, RequireOnboarding } from '@/auth/RequireAuth'

const Login = lazy(() => import('@/pages/Login'))
const Onboarding = lazy(() => import('@/pages/Onboarding'))
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const Students = lazy(() => import('@/pages/Students'))
const StudentDetail = lazy(() => import('@/pages/StudentDetail'))
const Attendance = lazy(() => import('@/pages/Attendance'))
const Timetable = lazy(() => import('@/pages/Timetable'))
const Assignments = lazy(() => import('@/pages/Assignments'))
const Exams = lazy(() => import('@/pages/Exams'))
const Results = lazy(() => import('@/pages/Results'))
const Fees = lazy(() => import('@/pages/Fees'))
const CalendarPage = lazy(() => import('@/pages/CalendarPage'))
const ParentMessages = lazy(() => import('@/pages/ParentMessages'))
const Settings = lazy(() => import('@/pages/Settings'))
const Admissions = lazy(() => import('@/pages/Admissions'))
const AdmissionPortal = lazy(() => import('@/pages/AdmissionPortal'))
const Library = lazy(() => import('@/pages/Library'))
const Payroll = lazy(() => import('@/pages/Payroll'))
const Certificates = lazy(() => import('@/pages/Certificates'))
const Hostel = lazy(() => import('@/pages/Hostel'))
const AdmitCards = lazy(() => import('@/pages/AdmitCards'))
const Leave = lazy(() => import('@/pages/Leave'))
const NoticeBoard = lazy(() => import('@/pages/NoticeBoard'))
const ParentPortal = lazy(() => import('@/pages/ParentPortal'))
const NotFound = lazy(() => import('@/pages/NotFound'))

function PageFallback() {
  return (
    <div className="grid min-h-[40vh] place-items-center">
      <Loader2 className="animate-spin text-primary" size={24} />
    </div>
  )
}

export default function App() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route
          path="/login"
          element={
            <RedirectIfAuthed>
              <Login />
            </RedirectIfAuthed>
          }
        />
        <Route
          path="/onboarding"
          element={
            <RequireOnboarding>
              <Onboarding />
            </RequireOnboarding>
          }
        />
        <Route path="/apply" element={<AdmissionPortal />} />

        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route element={<RequireRole roles={['owner', 'admin', 'teacher']} />}>
              <Route path="/students" element={<Students />} />
              <Route path="/students/:studentId" element={<StudentDetail />} />
              <Route path="/attendance" element={<Attendance />} />
            </Route>
            <Route path="/timetable" element={<Timetable />} />
            <Route path="/assignments" element={<Assignments />} />
            <Route path="/exams" element={<Exams />} />
            <Route path="/results" element={<Results />} />
            <Route element={<RequireRole roles={['owner', 'admin', 'parent', 'student']} />}>
              <Route path="/fees" element={<Fees />} />
            </Route>
            <Route path="/calendar" element={<CalendarPage />} />
            <Route element={<RequireRole roles={['owner', 'admin', 'teacher', 'parent']} />}>
              <Route path="/messages" element={<ParentMessages />} />
            </Route>
            <Route element={<RequireRole roles={['owner', 'admin']} />}>
              <Route path="/admissions" element={<Admissions />} />
            </Route>
            <Route path="/library" element={<Library />} />
            <Route element={<RequireRole roles={['owner', 'admin', 'teacher']} />}>
              <Route path="/payroll" element={<Payroll />} />
              <Route path="/certificates" element={<Certificates />} />
              <Route path="/hostel" element={<Hostel />} />
              <Route path="/admit-cards" element={<AdmitCards />} />
            </Route>
            <Route path="/leave" element={<Leave />} />
            <Route path="/notices" element={<NoticeBoard />} />
            <Route path="/portal" element={<ParentPortal />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  )
}
