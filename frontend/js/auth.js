// auth.js

const API_URL = "https://el-greco-app.onrender.com";
// Είσοδος χρήστη
async function login(username, password) {
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, password }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Σφάλμα κατά την είσοδο");
        }

        const data = await response.json();
        // Αποθήκευση του JWT στο localStorage
        localStorage.setItem("token", data.token);
        //alert("Επιτυχής σύνδεση!");
        window.location.href = "/index.html"; // Ανακατεύθυνση στην κύρια σελίδα
    } catch (error) {
        console.error("Σφάλμα σύνδεσης:", error.message);
        alert(error.message);
    }
}

// Έλεγχος αν ο χρήστης είναι συνδεδεμένος
function isLoggedIn() {
    const token = localStorage.getItem("token");
    return token !== null;
}

// Λήψη του token
function getToken() {
    return localStorage.getItem("token");
}

// Αποσύνδεση χρήστη
function logout() {
    localStorage.removeItem("token");
    //alert("Έχετε αποσυνδεθεί!");
}

async function fetchWithAuth(url, options = {}) {
    const token = getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }
  
    const headers = {
      ...options.headers,
      'Authorization': `${token}`,
      'Content-Type': 'application/json',
    };
  
    const response = await fetch(url, {
      ...options,
      headers,
    });
  
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API request failed');
    }
  
    return response;
}

// Εξαγωγή λειτουργιών
export { login, isLoggedIn, logout, fetchWithAuth };
