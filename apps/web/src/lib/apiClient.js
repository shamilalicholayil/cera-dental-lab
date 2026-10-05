const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  throw new Error("VITE_API_URL is not configured");
}

let refreshPromise = null;

function createNetworkError(cause) {
  const error = new Error("Unable to reach the server");

  error.code = "NETWORK_ERROR";
  error.requestId = null;
  error.cause = cause;

  return error;
}

async function performRequest(path, options = {}) {
  const { headers, body, ...requestOptions } = options;

  let response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      credentials: "include",

      headers: {
        ...(body !== undefined &&
          !(body instanceof FormData) && {
            "Content-Type": "application/json",
          }),

        ...headers,
      },

      body:
        body !== undefined && !(body instanceof FormData)
          ? JSON.stringify(body)
          : body,

      ...requestOptions,
    });
  } catch (cause) {
    throw createNetworkError(cause);
  }

  let data = null;

  const contentType = response.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  }

  return {
    response,
    data,
  };
}

function createResponseError(response, data) {
  const error = new Error(data?.error?.message || "Request failed");

  error.status = response.status;

  error.code = data?.error?.code || "REQUEST_FAILED";

  error.requestId = data?.error?.requestId || null;

  return error;
}

async function refreshAuthentication() {
  if (!refreshPromise) {
    refreshPromise = performRequest("/auth/refresh", {
      method: "POST",
    })
      .then(({ response, data }) => {
        if (!response.ok) {
          throw createResponseError(response, data);
        }

        return data;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

export async function apiRequest(path, options = {}) {
  const { skipAuthRefresh = false, ...requestOptions } = options;

  const { response, data } = await performRequest(path, requestOptions);

  if (response.ok) {
    return data;
  }

  const shouldRefresh =
    response.status === 401 &&
    data?.error?.code === "AUTHENTICATION_REQUIRED" &&
    !skipAuthRefresh;

  if (shouldRefresh) {
    try {
      await refreshAuthentication();

      return apiRequest(path, {
        ...requestOptions,
        skipAuthRefresh: true,
      });
    } catch {
      // Original request will surface its auth error.
    }
  }

  throw createResponseError(response, data);
}
