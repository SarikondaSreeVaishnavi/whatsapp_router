async function request(path, { method = "GET", body, isForm = false } = {}) {
  const res = await fetch(path, {
    method,
    credentials: "include",
    headers: isForm ? undefined : { "Content-Type": "application/json" },
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });

  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await res.json() : null;

  if (!res.ok) {
    throw new Error(data?.error || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body }),
  postForm: (path, formData) => request(path, { method: "POST", body: formData, isForm: true }),
  patch: (path, body) => request(path, { method: "PATCH", body }),
};
