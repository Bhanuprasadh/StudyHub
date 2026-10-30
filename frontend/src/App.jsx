import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';

// Lazy-loaded pages for optimal bundle splitting and performance
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const CourseCatalog = lazy(() => import('./pages/CourseCatalog'));
const CourseDetail = lazy(() => import('./pages/CourseDetail'));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const LearningWorkspace = lazy(() => import('./pages/LearningWorkspace'));
const QuizInterface = lazy(() => import('./pages/QuizInterface'));
const InstructorDashboard = lazy(() => import('./pages/InstructorDashboard'));
const CourseEditor = lazy(() => import('./pages/CourseEditor'));
const QuizEditor = lazy(() => import('./pages/QuizEditor'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Navbar />
            <main style={{ flex: 1 }}>
              <Suspense
                fallback={
                  <div
                    style={{
                      minHeight: '60vh',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <LoadingSpinner text="Loading view..." />
                  </div>
                }
              >
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/courses" element={<CourseCatalog />} />
                  <Route path="/courses/:id" element={<CourseDetail />} />

                  {/* Protected Student Routes */}
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <StudentDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/learn/:id"
                    element={
                      <ProtectedRoute>
                        <LearningWorkspace />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/quiz/:quizId"
                    element={
                      <ProtectedRoute>
                        <QuizInterface />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <ProfilePage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Protected Instructor Routes */}
                  <Route
                    path="/instructor"
                    element={
                      <ProtectedRoute allowedRoles={['instructor', 'admin']}>
                        <InstructorDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/instructor/courses/new"
                    element={
                      <ProtectedRoute allowedRoles={['instructor', 'admin']}>
                        <CourseEditor />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/instructor/courses/:courseId/quizzes/new"
                    element={
                      <ProtectedRoute allowedRoles={['instructor', 'admin']}>
                        <QuizEditor />
                      </ProtectedRoute>
                    }
                  />

                  {/* Protected Admin Routes */}
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <AdminDashboard />
                      </ProtectedRoute>
                    }
                  />

                  {/* 404 Fallback */}
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </Suspense>
            </main>
            <Footer />
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
