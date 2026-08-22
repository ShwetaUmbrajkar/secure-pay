const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

function getToken() {
  return localStorage.getItem("securepay_token");
}

export function setToken(token) {
  localStorage.setItem("securepay_token", token);
  window.dispatchEvent(new Event("securepay-auth-changed"));
}

export function clearToken() {
  localStorage.removeItem("securepay_token");
  localStorage.removeItem("securepay_is_admin");
  window.dispatchEvent(new Event("securepay-auth-changed"));
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      message = body.message || JSON.stringify(body.errors) || message;
    } catch (_) {
      /* ignore parse errors, keep default message */
    }
    throw new Error(message);
  }

  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  register: (username, password) =>
    request("/api/auth/register", { method: "POST", body: JSON.stringify({ username, password }) }),

  login: (username, password) =>
    request("/api/auth/login", { method: "POST", body: JSON.stringify({ username, password }) }),

  getAccount: (accountNumber) => request(`/api/accounts/${accountNumber}`),

  createAccount: (payload) => request("/api/accounts", { method: "POST", body: JSON.stringify(payload) }),

  getTransactionHistory: (accountNumber, page = 0, size = 20) =>
    request(`/api/transactions/account/${accountNumber}?page=${page}&size=${size}&sort=createdAt,desc`),

  getTransaction: (ref) => request(`/api/transactions/${ref}`),

  createTransaction: (payload) => request("/api/transactions", { method: "POST", body: JSON.stringify(payload) }),

  getFlaggedTransactions: () => request("/api/admin/flagged"),
};
