import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Workspace from "./pages/Workspace";

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="dark"><TooltipProvider><Toaster /><Switch><Route path="/" component={Home} /><Route path="/workspace" component={Workspace} /></Switch></TooltipProvider></ThemeProvider></ErrorBoundary>;
}
