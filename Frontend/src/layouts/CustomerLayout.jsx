import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import PageTransition from "../components/PageTransition";

function CustomerLayout() {
  return (
    <div className="app-shell">
      <Navbar />

      <main className="app-main">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>

      <footer className="app-footer">
        <p>© {new Date().getFullYear()} FoodExpress. Built with MERN — MCA Sem 3 Project.</p>
        <p className="footer-links">
          <a href="/contact">Contact Us</a>
        </p>
      </footer>
    </div>
  );
}

export default CustomerLayout;
