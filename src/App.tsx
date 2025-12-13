import {
  Add,
  Home,
  ListAlt,
  Login as LoginIcon,
  Menu,
  Settings as SettingsIcon,
  Summarize,
  AttachMoney,
} from "@mui/icons-material";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import "./App.css";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import MonthlySummary from "./pages/MonthlySummary";
import NewOrder from "./pages/NewOrder";
import Orders from "./pages/Orders";
import Settings from "./pages/Settings";
import PrivateRoute from "./components/PrivateRoute";
import { useState } from "react";
import Expenses from "./pages/Expenses";

// I've refactored the routing and navigation to be data-driven.
// This makes it easier to manage routes and navigation links.
const routeConfig = [
  { path: "/dashboard", text: "Dashboard", icon: Home, component: Dashboard, inNav: true, isPrivate: true },
  { path: "/orders", text: "Orders", icon: ListAlt, component: Orders, inNav: true, isPrivate: true },
  { path: "/new-order", text: "New Order", icon: Add, component: NewOrder, inNav: true, isPrivate: true },
  { path: "/monthly-summary", text: "Monthly Summary", icon: Summarize, component: MonthlySummary, inNav: true, isPrivate: true },
  { path: "/expenses", text: "Expenses", icon: AttachMoney, component: Expenses, inNav: true, isPrivate: true },
  { path: "/settings", text: "Settings", icon: SettingsIcon, component: Settings, inNav: true, isPrivate: true },
  { path: "/login", text: "Login", icon: LoginIcon, component: Login, inNav: true, isPrivate: false },
  { path: "/", component: Dashboard, inNav: false, isPrivate: true },
];

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <Router>
      <div className="flex min-h-screen bg-gray-100 text-gray-900">
        <nav
          className={`w-64 bg-gradient-to-r from-blue-500 to-purple-600 p-4 text-white transition-all duration-300 ${sidebarOpen ? "block" : "hidden"
            } md:block`}
        >
          <h1 className="text-2xl font-bold">Photo Fixx</h1>
          <ul className="mt-8 space-y-2">
            {routeConfig
              .filter((route) => route.inNav && route.icon && route.text)
              .map((route) => (
                <li key={route.path}>
                  <Link
                    to={route.path}
                    className="flex items-center p-2 hover:bg-purple-700 rounded-lg"
                  >
                    {route.icon && <route.icon className="mr-2" />}
                    {route.text}
                  </Link>
                </li>
              ))}
          </ul>
        </nav>
        <main className="flex-1 p-4 md:p-8">
          <button
            className="md:hidden mb-4"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu />
          </button>
          <Routes>
            {routeConfig.map((route) => {
              const PageComponent = route.component;
              let element = <PageComponent />;

              if (route.isPrivate) {
                element = <PrivateRoute>{element}</PrivateRoute>;
              }

              return (
                <Route key={route.path} path={route.path} element={element} />
              );
            })}
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;