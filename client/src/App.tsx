import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import Home from "@/pages/home";
import Chat from "@/pages/chat";
import NotFound from "@/pages/not-found";
import AdminPage from "@/pages/admin";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/chat/:id" component={Chat} />
      <Route path="/admin" component={AdminPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;