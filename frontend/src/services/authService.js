import { API_BASE_URL } from "./apiConfig";

const AUTH_API_URL = `${API_BASE_URL}/auth`;
function decodeJwtPayload(token) {
    try {
        const payload = token.split(".")[1];

        if (!payload) {
            return null;
        }

        const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
        const decodedPayload = atob(normalizedPayload);
        const jsonPayload = decodeURIComponent(
            decodedPayload
                .split("")
                .map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
                .join("")
        );

        return JSON.parse(jsonPayload);
    } catch (error) {
        console.warn("Nie udało się odczytać danych z tokena JWT:", error);
        return null;
    }
}

function pickToken(data) {
    return (
        data?.token ||
        data?.accessToken ||
        data?.jwt ||
        data?.bearerToken ||
        data?.data?.token ||
        data?.data?.accessToken ||
        null
    );
}

function normalizeUser(apiUser, fallbackEmail = "") {
    const user = {
        id:
            apiUser?.id ||
            apiUser?.userId ||
            apiUser?.uuid ||
            apiUser?.data?.id ||
            apiUser?.data?.userId ||
            null,

        name:
            apiUser?.name ||
            apiUser?.fullName ||
            apiUser?.username ||
            apiUser?.data?.name ||
            fallbackEmail ||
            "Użytkownik",

        email:
            apiUser?.email ||
            apiUser?.data?.email ||
            fallbackEmail ||
            "",

        avatar:
            apiUser?.avatar ||
            apiUser?.avatarUrl ||
            apiUser?.photoUrl ||
            apiUser?.profilePicture ||
            apiUser?.data?.avatar ||
            apiUser?.data?.avatarUrl ||
            apiUser?.data?.photoUrl ||
            apiUser?.data?.profilePicture ||
            "",
    };

    if (!user.id) {
        throw new Error("API /auth/me nie zwróciło UUID użytkownika.");
    }

    return user;
}

async function readError(response, fallbackMessage) {
    const errorText = await response.text().catch(() => "");

    if (!errorText) {
        return fallbackMessage;
    }

    try {
        const errorJson = JSON.parse(errorText);
        return errorJson.message || errorJson.error || errorText;
    } catch {
        return errorText;
    }
}

async function getMeWithToken(token, fallbackEmail = "") {
    const response = await fetch(`${AUTH_API_URL}/me`, {
        method: "GET",
        headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const message = await readError(
            response,
            "Nie udało się pobrać aktualnie zalogowanego użytkownika."
        );
        throw new Error(message);
    }

    const data = await response.json();
    return normalizeUser(data, fallbackEmail);
}

async function saveAuthData(data, fallbackEmail = "") {
    const token = pickToken(data);

    if (!token) {
        throw new Error("Brak tokena w odpowiedzi API.");
    }

    localStorage.setItem("token", token);

    const user = await getMeWithToken(token, fallbackEmail);
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
        const message = await readError(response, "Dane logowania są niepoprawne.");
        throw new Error(message);
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
            surname: userData.surname,
            email: userData.email,
            password: userData.password,
        }),
    });

    if (!response.ok) {
        const message = await readError(response, "Nie udało się utworzyć konta.");
        throw new Error(message);
    }

    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
        const data = await response.json();

        const token = pickToken(data);

        if (token) {
            return saveAuthData(data, userData.email);
        }
    }

    return login(userData.email, userData.password);
}

export async function saveOAuthTokenFromUrl() {
    const token = new URLSearchParams(window.location.search).get("token");

    if (!token) {
        return false;
    }

    const tokenPayload = decodeJwtPayload(token);
    const fallbackEmail = tokenPayload?.email || tokenPayload?.sub || "";

    try {
        localStorage.setItem("token", token);

        const user = await getMeWithToken(token, fallbackEmail);
        localStorage.setItem("user", JSON.stringify(user));
            window.history.replaceState({}, document.title, "/home");
        return true;
    } catch (error) {
        console.error("Nie udało się obsłużyć tokena OAuth:", error);
        logout();
        window.history.replaceState({}, document.title, "/login");
        return false;
    }
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

    if (!user) {
        return null;
    }

    try {
        return JSON.parse(user);
    } catch {
        localStorage.removeItem("user");
        return null;
    }
}
