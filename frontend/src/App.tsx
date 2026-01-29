import { BrowserRouter, Routes, Route } from "react-router";

import Sales from "./views/sales/Sales";
import Header from "./components/layouts/header/Header";
// import BottomNav from "./views/layouts/bottom-nav/BottomNav";
import "@radix-ui/themes/styles.css";
import Sell from "./views/sell/Sell";
import Login from "./views/auth/login/Login";
import Products from "./views/products/Products";
import Debt from "./views/debt/Debt";
import Customers from "./views/customers/Customers";
import Expenses from "./views/expenses/Expenses";
import ProtectedRoute from "./components/common/ProtectedRoute";
import Reports from "./views/reports/Reports";

function App() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/*" element={
            <ProtectedRoute>
              <div className="min-h-screen bg-background pb-24">
                <Header />
                <main className="p-4">
                  <Routes>
                    <Route path="/" element={<Sell />} />
                    <Route path="/sales" element={<Sales />} />
                    <Route path="/debts" element={<Debt />} />
                    <Route path="/customers" element={<Customers />} />
                    <Route path="/expenses" element={<Expenses />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/reports" element={<Reports />} />
                  </Routes>
                </main>
                {/* <BottomNav /> */}
              </div>
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
