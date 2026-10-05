import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { getCurrentUser, loginUser, logoutUser } from "../../api/auth";

function serializeError(error, fallbackCode, fallbackMessage) {
  return {
    code: error?.code || fallbackCode,

    message: error?.message || fallbackMessage,

    requestId: error?.requestId || null,
  };
}

export const restoreSession = createAsyncThunk(
  "auth/restoreSession",

  async (_, thunkApi) => {
    try {
      const response = await getCurrentUser();

      return response.data.user;
    } catch (error) {
      return thunkApi.rejectWithValue(
        serializeError(
          error,
          "AUTH_RESTORE_FAILED",
          "Unable to restore session",
        ),
      );
    }
  },
);

export const login = createAsyncThunk(
  "auth/login",

  async (credentials, thunkApi) => {
    try {
      const response = await loginUser(credentials);

      return response.data.user;
    } catch (error) {
      return thunkApi.rejectWithValue(
        serializeError(error, "LOGIN_FAILED", "Unable to sign in"),
      );
    }
  },
);

export const logout = createAsyncThunk(
  "auth/logout",

  async (_, thunkApi) => {
    try {
      await logoutUser();

      return true;
    } catch (error) {
      return thunkApi.rejectWithValue(
        serializeError(error, "LOGOUT_FAILED", "Unable to sign out"),
      );
    }
  },
);

const initialState = {
  user: null,

  status: "idle",

  restoreStatus: "idle",

  error: null,

  logoutStatus: "idle",

  logoutError: null,
};

const authSlice = createSlice({
  name: "auth",

  initialState,

  reducers: {
    clearAuthError(state) {
      state.error = null;
    },

    clearLogoutError(state) {
      state.logoutError = null;
    },
  },

  extraReducers: (builder) => {
    builder

      // Restore session
      .addCase(restoreSession.pending, (state) => {
        state.restoreStatus = "loading";
      })

      .addCase(restoreSession.fulfilled, (state, action) => {
        state.user = action.payload;

        state.restoreStatus = "succeeded";
      })

      .addCase(restoreSession.rejected, (state) => {
        state.user = null;

        state.restoreStatus = "failed";
      })

      // Login
      .addCase(login.pending, (state) => {
        state.status = "loading";

        state.error = null;
      })

      .addCase(login.fulfilled, (state, action) => {
        state.user = action.payload;

        state.status = "succeeded";

        state.error = null;
      })

      .addCase(login.rejected, (state, action) => {
        state.status = "failed";

        state.error = action.payload || {
          code: "LOGIN_FAILED",

          message: "Unable to sign in",

          requestId: null,
        };
      })

      // Logout
      .addCase(logout.pending, (state) => {
        state.logoutStatus = "loading";

        state.logoutError = null;
      })

      .addCase(logout.fulfilled, (state) => {
        state.user = null;

        state.status = "idle";

        state.error = null;

        state.logoutStatus = "succeeded";

        state.logoutError = null;
      })

      .addCase(logout.rejected, (state, action) => {
        state.logoutStatus = "failed";

        state.logoutError = action.payload || {
          code: "LOGOUT_FAILED",

          message: "Unable to sign out",

          requestId: null,
        };
      });
  },
});

export const { clearAuthError, clearLogoutError } = authSlice.actions;

export default authSlice.reducer;
