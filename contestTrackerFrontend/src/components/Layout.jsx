import { Outlet } from "react-router-dom";
import Footer from "./Footer";
import Header from "./Header";
export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0b0e14]">
      <div className="flex-1">
        <Header/>
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}