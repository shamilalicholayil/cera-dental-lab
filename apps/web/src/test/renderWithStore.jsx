import { configureStore } from "@reduxjs/toolkit";
import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";

import authReducer from "../features/auth/authSlice";

export function createTestStore(preloadedState) {
  return configureStore({
    reducer: {
      auth: authReducer,
    },

    preloadedState,
  });
}

export function renderWithStore(
  ui,
  { preloadedState, route = "/", store = createTestStore(preloadedState) } = {},
) {
  return {
    store,

    ...render(
      <Provider store={store}>
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      </Provider>,
    ),
  };
}
