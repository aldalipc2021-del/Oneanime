import { Outlet } from "react-router-dom";
import { Navigation } from "./Navigation";
import { Footer } from "./Footer";

export const Layout = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navigation />
      <main className="flex-1 pb-24 pt-24 md:pb-8 md:pt-28">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};
