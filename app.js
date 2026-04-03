// Importar variables de entorno protegidas
import { env } from './config.js';

// Importar funciones de Firebase SDK (Versión 9 Modular)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { 
    getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, 
    onAuthStateChanged, signOut, sendPasswordResetEmail, updateProfile 
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

// 1. CONFIGURACIÓN DE FIREBASE (Usa las llaves importadas)
const firebaseConfig = {
    apiKey: env.FIREBASE_API_KEY,
    authDomain: env.FIREBASE_AUTH_DOMAIN,
    projectId: env.FIREBASE_PROJECT_ID,
    storageBucket: env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID,
    appId: env.FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// 2. ELEMENTOS DEL DOM
const authSection = document.getElementById('auth-section');
const dashboardSection = document.getElementById('dashboard-section');
const btnLogout = document.getElementById('btn-logout');
const userGreeting = document.getElementById('user-greeting');
const authMsg = document.getElementById('auth-msg');

const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const resetForm = document.getElementById('reset-form');

// Navegación entre formularios
document.getElementById('link-register').addEventListener('click', () => toggleForms(registerForm, 'Registrarse'));
document.getElementById('link-login').addEventListener('click', () => toggleForms(loginForm, 'Iniciar Sesión'));
document.getElementById('link-reset').addEventListener('click', () => toggleForms(resetForm, 'Recuperar Contraseña'));
document.getElementById('link-login-from-reset').addEventListener('click', () => toggleForms(loginForm, 'Iniciar Sesión'));

function toggleForms(activeForm, title) {
    loginForm.classList.add('hidden');
    registerForm.classList.add('hidden');
    resetForm.classList.add('hidden');
    activeForm.classList.remove('hidden');
    document.getElementById('auth-title').innerText = title;
    authMsg.innerText = '';
}

// 3. LÓGICA DE AUTENTICACIÓN
registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const username = document.getElementById('reg-username').value;

    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            return updateProfile(userCredential.user, { displayName: username });
        })
        .catch((error) => { authMsg.innerText = "Error: " + error.message; });
});

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    signInWithEmailAndPassword(auth, email, password)
        .catch((error) => { authMsg.innerText = "Credenciales incorrectas."; });
});

resetForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('reset-email').value;
    sendPasswordResetEmail(auth, email)
        .then(() => { authMsg.innerText = "Correo de recuperación enviado."; authMsg.style.color="green"; })
        .catch((error) => { authMsg.innerText = "Error: " + error.message; });
});

btnLogout.addEventListener('click', () => signOut(auth));

onAuthStateChanged(auth, (user) => {
    if (user) {
        authSection.classList.add('hidden');
        dashboardSection.classList.remove('hidden');
        btnLogout.classList.remove('hidden');
        userGreeting.innerText = user.displayName;
    } else {
        authSection.classList.remove('hidden');
        dashboardSection.classList.add('hidden');
        btnLogout.classList.add('hidden');
    }
});

// 4. FECHA Y CLIMA (Geolocalización + OpenWeather)
const dateDisplay = document.getElementById('date-display');
const weatherDisplay = document.getElementById('weather-display');

const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
dateDisplay.innerText = new Date().toLocaleDateString('es-MX', options);

if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(position => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        fetchWeather(lat, lon);
    }, () => {
        // Fallback: Coordenadas de Ciudad Juárez si se deniega el permiso
        fetchWeather(31.6904, -106.4245);
    });
} else {
    weatherDisplay.innerText = "Geolocalización no soportada";
}

async function fetchWeather(lat, lon) {
    try {
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=es&appid=${env.OPENWEATHER_API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();
        
        // 1. Guardamos el nombre original que devuelve la API
        let city = data.name;

        // 2. Tu filtro para corregir la geolocalización en la frontera
        const ciudadesFronterizas = ["San Elizario", "El Paso", "Manuel F. Martínez", "Socorro", "Sunland Park"];
        if (ciudadesFronterizas.some(frontera => city.includes(frontera))) {
            city = "Ciudad Juárez";
        }
        
        // 3. Imprimimos el resultado usando la variable 'city' ya filtrada
        weatherDisplay.innerHTML = `<i class="fas fa-cloud-sun"></i> ${city}: ${Math.round(data.main.temp)}°C, ${data.weather[0].description}`;
    } catch (error) {
        weatherDisplay.innerText = "No se pudo cargar el clima";
    }
}

// 5. REGISTRO DEL SERVICE WORKER (Para PWA)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('Service Worker registrado con éxito'))
            .catch(err => console.error('Error registrando SW', err));
    });
}