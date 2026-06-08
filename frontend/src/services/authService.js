const MOCK_USER = {
    id: "66666666-6666-6666-6666-666666666666",
    name: "Jan Kowalski",
    email: "jan@test.pl",
};

export async function login(email, password) {
    if (!email || !password) {
        throw new Error("Podaj email i hasło.");
    }

    const fakeToken = "mock-jwt-token";

    localStorage.setItem("token", fakeToken);
    localStorage.setItem("user", JSON.stringify(MOCK_USER));

    return {
        token: fakeToken,
        user: MOCK_USER,
    };
}

export async function register(userData) {
    const fakeToken = "mock-jwt-token";

    const user = {
        id: "66666666-6666-6666-6666-666666666666",
        name: `${userData.name} ${userData.surname}`,
        email: userData.email,
    };

    localStorage.setItem("token", fakeToken);
    localStorage.setItem("user", JSON.stringify(user));

    return {
        token: fakeToken,
        user,
    };
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