import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/components/ThemeProvider";
import { InstallPWAButton } from "@/components/InstallPWAButton";
import { Layout } from "./components/Layout";
import Index from "./pages/Index";
import SearchPage from "./pages/SearchPage";
import AnimeDetailPage from "./pages/AnimeDetailPage";
import CalendarPage from "./pages/CalendarPage";
import ProfilePage from "./pages/ProfilePage";
import AuthPage from "./pages/AuthPage";
import LegalPage from "./pages/LegalPage";
import PremiumPage from "./pages/PremiumPage";
import CustomListPage from "./pages/CustomListPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <InstallPWAButton />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<AuthPage />} />
              <Route element={<Layout />}>
                <Route path="/" element={<Index />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/anime/:id" element={<AnimeDetailPage />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/premium" element={<PremiumPage />} />
                <Route path="/lists/:id" element={<CustomListPage />} />
                <Route path="/legal/:section" element={<LegalPage />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
