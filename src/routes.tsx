import { lazy } from "react";
import type { RouteObject } from "react-router-dom";

// 使用React.lazy()懒加载所有组件
const Index = lazy(() => import("./pages/Index"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Count = lazy(() => import("./pages/count"));
export const routes: RouteObject[] = [
  {
    path: "/",
    element: <Index />,
  },
  {
    path: "/count",
    element: <Count />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
];
