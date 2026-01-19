import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SvgIconTypeMap } from '@mui/material';
import { OverridableComponent } from '@mui/material/OverridableComponent';

interface RouteConfig {
  path: string;
  text?: string;
  icon?: OverridableComponent<SvgIconTypeMap<{}, "svg">> & {
    muiName: string;
  };
  inNav: boolean;
  isPrivate: boolean;
}

interface BottomNavbarProps {
  routeConfig: RouteConfig[];
}

const BottomNavbar: React.FC<BottomNavbarProps> = ({ routeConfig }) => {
  const location = useLocation();

  const hasNavProps = (
    route: RouteConfig
  ): route is Required<Pick<RouteConfig, "icon" | "text">> & RouteConfig => {
    return route.inNav && route.icon !== undefined && route.text !== undefined;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white shadow-lg md:hidden ">
      <div className="flex justify-around items-center">
        {routeConfig
          .filter(hasNavProps)
          .map((route) => {
            const isActive = location.pathname.startsWith(route.path);
            const Icon = route.icon;
            return (
              <Link
                key={route.path}
                to={route.path}
                className={`flex flex-col items-center justify-center p-2 text-xs font-medium ${
                  isActive ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'
                }`}
              >
                <Icon className="text-3xl pb-1" />
                <span className="hidden">{route.text}</span>
              </Link>
            );
          })}
      </div>
    </nav>
  );
};

export default BottomNavbar;
