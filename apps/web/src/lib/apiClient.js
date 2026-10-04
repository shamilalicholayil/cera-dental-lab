const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  throw new Error("VITE_API_URL is not configured");
}

export async function apiRequest(path, options = {}) {
  const { headers, body, ...requestOptions } = options;

  const response = await fetch(`${API_URL}${path}`, {
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

  let data;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const error = new Error(data?.error?.message || "Request failed");

    error.status = response.status;
    error.code = data?.error?.code || "REQUEST_FAILED";
    error.requestId = data?.error?.requestId || null;

    throw error;
  }

  return data;
}
