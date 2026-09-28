import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Explore from "./pages/Explore";
import ProjectDetails from "./pages/ProjectDetails";
import ListProject from "./pages/ListProject";
import { About, AdminDashboard, AuthPage, Contact, ContinuityBond, InfoPage, RoleDashboard } from "./pages/RoutePages";
import Workspace from "./pages/Workspace";

function Router(){return <Switch><Route path="/" component={Home}/><Route path="/explore" component={Explore}/><Route path="/project/:id" component={ProjectDetails}/><Route path="/list-project" component={ListProject}/><Route path="/how-it-works"><InfoPage kind="how-it-works"/></Route><Route path="/startups"><InfoPage kind="startups"/></Route><Route path="/companies"><InfoPage kind="companies"/></Route><Route path="/offers"><InfoPage kind="offers"/></Route><Route path="/due-diligence"><InfoPage kind="due-diligence"/></Route><Route path="/continuity-bond" component={ContinuityBond}/><Route path="/about" component={About}/><Route path="/contact" component={Contact}/><Route path="/login"><AuthPage/></Route><Route path="/signup"><AuthPage signup/></Route><Route path="/dashboard/startup"><RoleDashboard role="startup"/></Route><Route path="/dashboard/company"><RoleDashboard role="company"/></Route><Route path="/admin" component={AdminDashboard}/><Route path="/workspace" component={Workspace}/><Route><Home/></Route></Switch>}
export default function App(){return <ErrorBoundary><ThemeProvider defaultTheme="dark"><TooltipProvider><Toaster/><Router/></TooltipProvider></ThemeProvider></ErrorBoundary>}
