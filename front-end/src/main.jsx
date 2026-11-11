import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { SiteSettingsProvider } from "./context/SiteSettingsContext";
import { ThemeProvider } from "./context/ThemeContext";
import "../public/main.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <ThemeProvider>
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <SiteSettingsProvider>
            <App />
          </SiteSettingsProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  </ThemeProvider>,
);
