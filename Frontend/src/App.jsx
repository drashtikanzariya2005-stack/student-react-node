import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";

import { AuthProvider } from "./context/AuthContext";
import { AdminAuthProvider } from "./context/AdminAuthContext";
import { CartProvider } from "./context/CartContext";
import { ToastProvider } from "./context/ToastContext";
import { ProtectedRoute } from "./components/ProtectedRoute";

import CustomerLayout from "./layouts/CustomerLayout";
import AdminLayout from "./layouts/AdminLayout";

import Home from "./pages/Home";
import Menu from "./pages/Menu";
import Cart from "./pages/Cart";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MyOrders from "./pages/MyOrders";
import OrderBill from "./pages/OrderBill";
import Profile from "./pages/Profile";
import ContactUs from "./pages/ContactUs";
import Wishlist from "./pages/Wishlist";
import Restaurants from "./pages/Restaurants";
import Offers from "./pages/Offers";
import NotFound from "./pages/NotFound";

import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageFoods from "./pages/admin/ManageFoods";
import ManageOrders from "./pages/admin/ManageOrders";
import ManageUsers from "./pages/admin/ManageUsers";
import ManageMessages from "./pages/admin/ManageMessages";
import ManageCategories from "./pages/admin/ManageCategories";
import ManageRestaurants from "./pages/admin/ManageRestaurants";
import ManageOffers from "./pages/admin/ManageOffers";

function App() {
  return (
    <AuthProvider>
    <AdminAuthProvider>
      <ToastProvider>
        <CartProvider>
          <BrowserRouter>
            <Routes>
              {/* ---------- Customer-facing site ---------- */}
              <Route element={<CustomerLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/menu" element={<Menu />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/contact" element={<ContactUs />} />
                <Route path="/offers" element={<Offers />} />
                <Route path="/restaurants" element={<Restaurants />} />
                <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />

                <Route
                  path="/my-orders"
                  element={
                    <ProtectedRoute>
                      <MyOrders />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/bill/:id"
                  element={
                    <ProtectedRoute>
                      <OrderBill />
                    </ProtectedRoute>
                  }
                />
              </Route>

              {/* ---------- Separate admin login (no customer navbar/footer) ---------- */}
              <Route path="/admin/login" element={<AdminLogin />} />

              {/* ---------- Separate admin panel with its own sidebar layout ---------- */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="foods" element={<ManageFoods />} />
                <Route path="categories" element={<ManageCategories />} />
                <Route path="restaurants" element={<ManageRestaurants />} />
                <Route path="offers" element={<ManageOffers />} />
                <Route path="orders" element={<ManageOrders />} />
                <Route path="users" element={<ManageUsers />} />
                {/* Bill viewed from inside the admin panel — uses the admin
                    session, so an admin no longer gets bounced to /login. */}
                <Route path="bill/:id" element={<OrderBill admin />} />
                <Route path="messages" element={<ManageMessages />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </ToastProvider>
    </AdminAuthProvider>
    </AuthProvider>
  );
}

export default App;
