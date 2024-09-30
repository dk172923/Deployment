import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react'; // Use RedirectToSignIn for automatic redirects
import './App.css';
import LandingPage from './Pages/LandingPage.jsx';
import Dashboard from './Pages/Dashboard.jsx';
import Header from './Components/Header.jsx';
import CreateTest from './Pages/CreateTest.jsx';
import StudentList from './Pages/StudentList.jsx';
import TestResults from './Pages/TestResults.jsx';
import WorkInProgress from './Pages/WorkInProgress.jsx';
import TestPage from './Pages/TestPage.jsx';
import Disqualified from './Pages/Disqualified.jsx';
import SubmissionPage from './Pages/SubmissionPage.jsx';
import Footer from './Components/Footer.jsx';
import ThankYouPage from './Pages/thank-you.jsx';
const App = () => {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          {/* Public route for the Work In Progress page */}
          <Route path="/test/:testId/attend" element={<WorkInProgress />} />
          <Route path="/test/:testId" element={<TestPage />} />
          <Route path="/disqualified" element={<Disqualified />} />
          <Route path="/submission" element={<SubmissionPage />} />
          <Route path="/thank-you" element={<ThankYouPage/>} />

          {/* Automatically redirect to the dashboard if signed in */}
          <Route
            path="/"
            element={
              <>
                <SignedIn>
                  {/* If user is signed in, redirect to the dashboard */}
                  <Navigate to="/dashboard" replace />
                </SignedIn>
                <SignedOut>
                  {/* If user is signed out, show the landing page */}
                  <LandingPage />
                </SignedOut>
              </>
            }
          />

          {/* Signed In routes */}
          <Route
            path="/dashboard"
            element={
              <SignedIn>
                <>
                  <Header />
                  <Dashboard />
                  <Footer/>
                </>
              </SignedIn>
            }
          />
          <Route
            path="/create-test"
            element={
              <SignedIn>
                <>
                  <Header />
                  <CreateTest />
                  {/* <Footer/> */}
                </>
              </SignedIn>
            }
          />
          <Route
            path="/student-list"
            element={
              <SignedIn>
                <>
                  <Header />
                  <StudentList />
                  <Footer/>
                </>
              </SignedIn>
            }
          />
          <Route
            path="/test-results"
            element={
              <SignedIn>
                <>
                  <Header />
                  <TestResults />
                  <Footer/>
                </>
              </SignedIn>
            }
          />

          {/* Redirect any unmatched routes to the landing page */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
