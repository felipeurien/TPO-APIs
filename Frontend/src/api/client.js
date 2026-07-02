const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:3000";

async function apiRequest(path, options = {}) {
  const { token, body, headers, ...fetchOptions } = options;
  const requestHeaders = {
    ...headers,
  };

  if (body !== undefined) {
    requestHeaders["Content-Type"] = "application/json";
  }

  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...fetchOptions,
    headers: requestHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok || payload?.ok === false) {
    throw new Error(payload?.message || `Request failed with ${response.status}`);
  }

  if (payload?.token) {
    return payload;
  }

  return payload?.data ?? payload;
}

export function apiGet(path, options) {
  return apiRequest(path, { ...options, method: "GET" });
}

export function apiPost(path, body, options) {
  return apiRequest(path, { ...options, method: "POST", body });
}

export function apiPut(path, body, options) {
  return apiRequest(path, { ...options, method: "PUT", body });
}

export function apiPatch(path, body, options) {
  return apiRequest(path, { ...options, method: "PATCH", body });
}

export function apiDelete(path, options) {
  return apiRequest(path, { ...options, method: "DELETE" });
}

export { API_BASE_URL };
