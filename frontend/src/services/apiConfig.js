export const API_BASE_URL = "http://130.162.56.186:8001/api";

export const DEFAULT_USER_ID = "66666666-6666-6666-6666-666666666666";

export async function apiRequest(path, options = {}) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: {
            Accept: "application/json",
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            ...(options.headers || {}),
        },
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        throw new Error(errorText || `Błąd API (${response.status})`);
    }

    if (response.status === 204) {
        return null;
    }

    const contentType = response.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
        return null;
    }

    return response.json();
}
