/// API Base URL - Will use relative URL for deployment
const API_BASE_URL = window.location.hostname.includes('localhost')
    ? 'http://localhost:8080'
    : '';  // Use empty string to make API requests relative to current domain

// Authentication module
const Auth = {
    // JWT token storage
    token: localStorage.getItem('jwt_token'),
    username: localStorage.getItem('username'),
    roles: localStorage.getItem('roles') ? JSON.parse(localStorage.getItem('roles')) : [],

    // Check if user is authenticated
    isAuthenticated() {
        return !!this.token;
    },

    // Check if user has a specific role
    hasRole(role) {
        return this.roles.includes(role);
    },

    // Login function
    async login(username, password) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(error || 'Login failed');
            }

            const data = await response.json();
            this.token = data.token;

            // Store token in localStorage
            localStorage.setItem('jwt_token', this.token);
            localStorage.setItem('username', username);

            // Decode the JWT token to get roles
            this.setUserRoles(this.parseJwt(this.token));

            return true;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    // Parse JWT token to get user details
    parseJwt(token) {
        try {
            // Split the token and get the payload
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));

            return JSON.parse(jsonPayload);
        } catch (e) {
            return null;
        }
    },

    // Set user roles from JWT claims
    setUserRoles(decodedToken) {
        if (decodedToken && decodedToken.roles) {
            this.roles = decodedToken.roles;
        } else if (decodedToken && decodedToken.scope) {
            // Another common way to store roles in JWT token
            this.roles = decodedToken.scope.split(' ');
        } else {
            // If we can't determine roles, have some fallback logic
            // Check username for 'admin' to assume ROLE_ADMIN
            if (this.username === 'admin') {
                this.roles = ['ROLE_ADMIN', 'ROLE_USER'];
            } else {
                this.roles = ['ROLE_USER'];
            }
        }

        localStorage.setItem('roles', JSON.stringify(this.roles));
    },

    // Logout function
    logout() {
        this.token = null;
        this.username = null;
        this.roles = [];

        // Clear localStorage
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('username');
        localStorage.removeItem('roles');
    },

    // Get authorization header
    getAuthHeader() {
        return {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
        };
    }
};

// Helper function to make authenticated API requests
async function apiRequest(url, method = 'GET', data = null) {
    if (!Auth.isAuthenticated()) {
        throw new Error('User not authenticated');
    }

    const options = {
        method,
        headers: Auth.getAuthHeader()
    };

    if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(`${API_BASE_URL}${url}`, options);

        // Handle 401 Unauthorized - token may have expired
        if (response.status === 401) {
            Auth.logout();
            window.location.reload();
            throw new Error('Session expired. Please login again.');
        }

        if (!response.ok) {
            const error = await response.text();
            throw new Error(error || `Request failed with status ${response.status}`);
        }

        // Check if response is empty
        const text = await response.text();
        return text ? JSON.parse(text) : null;
    } catch (error) {
        console.error('API request error:', error);
        throw error;
    }
}