import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CursorGlow } from "@/components/cursor-glow";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import About from "@/pages/about";
import Competition from "@/pages/competition";
import Cohorts from "@/pages/cohorts";
import Gallery from "@/pages/gallery";
import Scoreboard from "@/pages/scoreboard";
import Contact from "@/pages/contact";
import Register from "@/pages/register";
import Admin from "@/pages/admin";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/competition" component={Competition} />
      <Route path="/cohorts" component={Cohorts} />
      <Route path="/gallery" component={Gallery} />
      <Route path="/scoreboard" component={Scoreboard} />
      <Route path="/contact" component={Contact} />
      <Route path="/register" component={Register} />
      <Route path="/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <CursorGlow />
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
