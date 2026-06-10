import { API_BASE_URL, DEFAULT_USER_ID } from "./apiConfig";

const AUTH_API_URL = `${API_BASE_URL}/auth`;
const MOCK_USER = {
    id: DEFAULT_USER_ID,
    name: "Jan Kowalski",
    email: "jan@test.pl",
};

function saveAuthData(data, fallbackEmail = "") {
    const token =
        data?.token ||
        data?.accessToken ||
        data?.jwt ||
        data?.bearerToken ||
        data?.data?.token;

    if (!token) {
        throw new Error("Brak tokena w odpowiedzi API.");
    }

    const apiUser = data?.user || data?.userDto || data?.data?.user || null;

    const user = {
        id: apiUser?.id || data?.id || DEFAULT_USER_ID,
        name: apiUser?.name || data?.name || fallbackEmail || "Użytkownik",
        email: apiUser?.email || data?.email || fallbackEmail,
    };

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));

    return { token, user };
}

export async function login(email, password) {
    if (!email || !password) {
        throw new Error("Podaj email i hasło.");
    }

    const response = await fetch(`${AUTH_API_URL}/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        throw new Error(errorText || "Dane logowania są niepoprawne.");
    }

    const data = await response.json();
    return saveAuthData(data, email);
}

export async function register(userData) {
    const response = await fetch(`${AUTH_API_URL}/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: JSON.stringify({
            name: userData.name,
            email: userData.email,
            password: userData.password,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        throw new Error(errorText || "Nie udało się utworzyć konta.");
    }

    const data = await response.json();
    return saveAuthData(data, userData.email);
}

export function saveOAuthTokenFromUrl() {
    const token = new URLSearchParams(window.location.search).get("token");

    if (!token) {
        return false;
    }

    localStorage.setItem("token", token);

    if (!localStorage.getItem("user")) {
        localStorage.setItem("user", JSON.stringify(MOCK_USER));
    }

    window.history.replaceState({}, document.title, "/home");
    return true;
}

export function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
}

export function isAuthenticated() {
    return Boolean(localStorage.getItem("token"));
}

export function getCurrentUser() {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
}
