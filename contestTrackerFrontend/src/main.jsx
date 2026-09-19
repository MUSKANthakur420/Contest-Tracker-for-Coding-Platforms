import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { Provider } from 'react-redux';
import { store } from './app/store.js';
import {createBrowserRouter,RouterProvider} from "react-router-dom";
import Layout from './components/Layout.jsx';
import Home from './components/Home.jsx';
import Register from './components/Register.jsx';
import Login from './components/Login.jsx';
import DashBoard from './components/DashBoard.jsx';
import Edit from './components/Edit.jsx';
import Contests from './components/Contests.jsx';
import ProtectedRoute from "./components/ProtectedRoute.jsx";
const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Home />
      },
      {
        path: "register",
        element: <Register />
      },
      {
        path: "login",
        element: <Login />
      },

      // Protected Dashboard
      {
        path: "dashboard",
        element: <ProtectedRoute />,
        children: [
          {
            index: true,
            element: <DashBoard />
          }
        ]
      },

      {
        path: "edit",
        element: <Edit />
      },
      {
        path: "contests",
        element: <Contests />
      }
    ]
  }
]);
createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <RouterProvider router={router}/>
  </Provider>,
)
