import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, ProtectedRoute } from "./components/auth";
import { Layout } from "./components/layout/Layout";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { ProjectEditorPage } from "./pages/ProjectEditorPage";
import { ProjectListPage } from "./pages/ProjectListPage";
import { SettingsPage } from "./pages/SettingsPage";
import { VoicesPage } from "./pages/VoicesPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Protected routes with layout */}
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/projects" element={<ProjectListPage />} />
              <Route path="/projects/:projectId" element={<ProjectEditorPage />} />
              <Route path="/voices" element={<VoicesPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
      <Toaster position="bottom-right" richColors />
    </QueryClientProvider>
  );
}

export default App;
