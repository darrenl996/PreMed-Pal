import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import CoursePage from "@/pages/course-page";
import StudyPlanPage from "@/pages/study-plan-page";
import CoursesPage from "@/pages/courses-page";
import StudyPlansPage from "@/pages/study-plans-page";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";

function Router() {
  return (
    <AuthProvider>
      <Switch>
        <ProtectedRoute path="/" component={Dashboard} />
        <ProtectedRoute path="/courses" component={CoursesPage} />
        <ProtectedRoute path="/courses/:id" component={CoursePage} />
        <ProtectedRoute path="/study-plans" component={StudyPlansPage} />
        <ProtectedRoute path="/study-plans/:id" component={StudyPlanPage} />
        <Route path="/auth" component={AuthPage} />
        <Route component={NotFound} />
      </Switch>
    </AuthProvider>
  );
}

function App() {
  return (
    <>
      <Router />
      <Toaster />
    </>
  );
}

export default App;
