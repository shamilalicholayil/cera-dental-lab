import { StrictMode } from "react";

import { createRoot } from "react-dom/client";

import { Provider } from "react-redux";

import { BrowserRouter } from "react-router-dom";

import "./index.css";

import App from "./App.jsx";

import { AuthInitializer } from "./features/auth/AuthInitializer";

import { store } from "./store/store";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <AuthInitializer>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthInitializer>
    </Provider>
  </StrictMode>,
);
