const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

function buildUrl(path, query) {
  const url = new URL(`${API_BASE_URL}${path}`);
  if (query && typeof query === "object") {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, value);
      }
    });
  }
  return url.toString();
}

async function request(path, options = {}, query) {
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const defaultHeaders = isFormData ? {} : { "Content-Type": "application/json" };

  const response = await fetch(buildUrl(path, query), {
    credentials: "include",
    headers: { ...defaultHeaders, ...(options.headers || {}) },
    ...options,
  });

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const data = await response.json();
      if (data.message) {
        errorMessage = data.message;
      }
      if (data.errors?.length) {
        errorMessage = data.errors.join(", ");
      }
    } catch {
      // Ignore JSON parse errors and keep generic message.
    }
    throw new Error(errorMessage);
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return response.blob();
}

function downloadBlob(blob, fileName) {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

export const api = {
  baseUrl: API_BASE_URL,
  get: (path, query) => request(path, { method: "GET" }, query),
  post: (path, body) => request(path, { method: "POST", body: JSON.stringify(body || {}) }),
  postForm: (path, formData) => request(path, { method: "POST", body: formData }),
  put: (path, body) => request(path, { method: "PUT", body: JSON.stringify(body || {}) }),
  patch: (path, body) => request(path, { method: "PATCH", body: JSON.stringify(body || {}) }),
  delete: (path) => request(path, { method: "DELETE" }),
  authStatus: () => request("/auth/status", { method: "GET" }),
  login: (payload) => request("/auth/login", { method: "POST", body: JSON.stringify(payload || {}) }),
  setupOwner: (payload) => request("/auth/setup", { method: "POST", body: JSON.stringify(payload || {}) }),
  me: () => request("/auth/me", { method: "GET" }),
  logout: () => request("/auth/logout", { method: "POST", body: JSON.stringify({}) }),
  async download(path, fileName) {
    const blob = await request(path, { method: "GET", headers: {} });
    downloadBlob(blob, fileName);
  },
};
