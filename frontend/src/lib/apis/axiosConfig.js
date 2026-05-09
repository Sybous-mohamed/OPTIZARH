import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:8000",
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
    },
});

let setLoadingGlobal = null;

export const attachLoadingHandler = (fn) => {
    setLoadingGlobal = fn;
};

/*
|--------------------------------------------------------------------------
| REQUEST
|--------------------------------------------------------------------------
*/
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        if (setLoadingGlobal) setLoadingGlobal(true);

        return config;
    },
    (error) => {
        if (setLoadingGlobal) setLoadingGlobal(false);
        return Promise.reject(error);
    }
);

/*
|--------------------------------------------------------------------------
| RESPONSE
|--------------------------------------------------------------------------
*/
api.interceptors.response.use(
    (response) => {
        if (setLoadingGlobal) setLoadingGlobal(false);
        return response;
    },
    (error) => {
        if (setLoadingGlobal) setLoadingGlobal(false);

        const { status } = error.response || {};
        const currentPath = window.location.pathname;

        if (status === 401) {
            if (
                currentPath.includes("login") ||
                currentPath.includes("verify-notice") ||
                currentPath.includes("verify-email")
            ) {
                return Promise.reject(error);
            }

            localStorage.clear();
            window.location.href = "/auth/login";
        }

        if (status === 403) {
            if (currentPath.includes("verify-notice")) {
                return new Promise(() => {});
            }

            window.location.href = "/auth/verify-notice";
        }

        if (status === 500) {
            console.error("Server Error (Laravel logs)");
        }

        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => {
        if (setLoadingGlobal) setLoadingGlobal(false);
        
        // Sync theme when getting user profile
        if (response.config.url === '/api/Settings/profile' && response.data) {
            const userTheme = response.data.theme;
            if (userTheme) {
                localStorage.setItem('theme', userTheme);
                if (userTheme === 'dark') {
                    document.documentElement.classList.add('dark');
                    document.documentElement.classList.remove('light');
                } else {
                    document.documentElement.classList.add('light');
                    document.documentElement.classList.remove('dark');
                }
            }
        }
        
        return response;
    },
    (error) => {
        if (setLoadingGlobal) setLoadingGlobal(false);

        const { status } = error.response || {};
        const currentPath = window.location.pathname;

        if (status === 401) {
            if (
                currentPath.includes("login") ||
                currentPath.includes("verify-notice") ||
                currentPath.includes("verify-email")
            ) {
                return Promise.reject(error);
            }

            localStorage.clear();
            window.location.href = "/auth/login";
        }

        if (status === 403) {
            if (currentPath.includes("verify-notice")) {
                return new Promise(() => {});
            }
            window.location.href = "/auth/verify-notice";
        }

        if (status === 500) {
            console.error("Server Error (Laravel logs)");
        }

        return Promise.reject(error);
    }
);

export default api;