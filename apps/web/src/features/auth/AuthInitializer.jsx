import { useEffect } from "react";

import { useDispatch } from "react-redux";

import { restoreSession } from "./authSlice";

export function AuthInitializer({ children }) {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(restoreSession());
  }, [dispatch]);

  return children;
}
