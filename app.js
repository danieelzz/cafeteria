// Registrar el service worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
        .then((registration) => {
            console.log('Service Worker registrado con éxito:', registration);
        })
        .catch((error) => {
            console.log('Error al registrar el Service Worker:', error);
        });
}

// IndexedDB para almacenamiento offline
let db;
const request = indexedDB.open("cafeteriaDB", 1);

request.onupgradeneeded = (event) => {
    db = event.target.result;
    if (!db.objectStoreNames.contains("productos")) {
        db.createObjectStore("productos", { keyPath: "id", autoIncrement: true });
    }
};

request.onsuccess = (event) => {
    db = event.target.result;
    console.log("IndexedDB inicializada correctamente.");
    cargarProductos(); // Cargar productos en el menú al abrir la base de datos

    mostrarNotificacionBienvenida("Bienvenido a la Cafetería", "¡Disfruta de nuestros productos!");
};

request.onerror = (event) => {
    console.log("Error con IndexedDB", event);
};

// Función para cargar productos en el menú
function cargarProductos() {
    const productos = document.getElementById("status");

    // Verificar que el elemento existe antes de manipularlo
    if (!productos) {
        return; // Termina la función si el elemento no existe
    }

    const transaction = db.transaction("productos", "readonly");
    const store = transaction.objectStore("productos");
    productos.innerHTML = ""; // Limpiar contenido antes de cargar

    store.openCursor().onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
            const { nombre, cantidad, tipo, precio } = cursor.value;
            productos.innerHTML += `<p>${nombre} - ${tipo} - Cantidad: ${cantidad} - $${precio.toFixed(2)}</p>`;
            cursor.continue();
        }
    };
}

// Manejar envío del formulario
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("addProductForm").addEventListener("submit", (event) => {
        event.preventDefault(); // Evitar el comportamiento por defecto de envío del formulario

        const nombre = document.getElementById("productName").value;
        const cantidad = parseInt(document.getElementById("productQuantity").value, 10);
        const tipo = document.getElementById("productType").value;
        const precio = parseFloat(document.getElementById("productPrice").value);

        if (nombre && cantidad && tipo && precio) {
            agregarProducto({ nombre, cantidad, tipo, precio });
            mostrarNotificacion(nombre); // Mostrar notificación al agregar un producto

            // Limpiar formulario después de guardar
            document.getElementById("addProductForm").reset();
        } else {
            alert("Por favor, completa todos los campos.");
        }
    });
});

// Función para agregar productos
function agregarProducto(producto) {
    const transaction = db.transaction("productos", "readwrite");
    const store = transaction.objectStore("productos");
    store.add(producto);

    transaction.oncomplete = () => {
        console.log("Producto agregado con éxito.");
        cargarProductos(); // Volver a cargar la lista de productos
    };

    transaction.onerror = (event) => {
        console.error("Error al agregar el producto:", event.target.error);
    };
}

// Función para mostrar notificaciones
function mostrarNotificacion(nombre) {
    if (Notification.permission === "granted") {
        new Notification("Producto Agregado", {
            body: `Se ha agregado ${nombre} a la lista de productos.`,
            icon: 'img/icono.jpg' // Asegúrate de tener un icono disponible
        });
    } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((permission) => {
            if (permission === "granted") {
                new Notification("Producto Agregado", {
                    body: `Se ha agregado ${nombre} a la lista de productos.`,
                    icon: 'img/icono.jpg'
                });
            }
        });
    }
}

function mostrarNotificacionBienvenida() {
    if (Notification.permission === "granted") {
        new Notification("Bienvenido a la Cafetería", {
            body: "¡Disfruta de nuestros productos!",
            icon: 'img/icono.jpg' // Asegúrate de tener un icono disponible
        });
    } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((permission) => {
            if (permission === "granted") {
                new Notification("Bienvenido a la Cafetería", {
                    body: "¡Disfruta de nuestros productos!",
                    icon: 'img/icono.jpg'
                });
            }
        });
    }
}

// Detectar el estado de la conexión
window.addEventListener('load', () => {
    updateOnlineStatus();
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
});

function updateOnlineStatus() {
    const offlineBanner = document.getElementById('offline-banner');
    const carousel = document.getElementById("cafeteriaCarousel");
    const galeria = document.querySelector('.container.mt-5.text-center'); // Selecciona la galería

    if (navigator.onLine) {
        offlineBanner.style.display = 'none'; // Oculta el banner si está en línea
        carousel.style.display = 'block'; // Muestra el carrusel si está en línea
        galeria.style.display = 'block'; // Muestra la galería si está en línea
    } else {
        offlineBanner.style.display = 'block'; // Muestra el banner si está offline
        carousel.style.display = 'none'; // Oculta el carrusel si está offline
        galeria.style.display = 'none'; // Oculta la galería si está offline
    }
}

// Geolocation API: Muestra la ubicación del usuario
document.getElementById('btnGeolocation').addEventListener('click', () => {
    if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition((position) => {
            const { latitude, longitude } = position.coords;
            document.getElementById('locationOutput').textContent = `Tu ubicación: Latitud ${latitude}, Longitud ${longitude}`;
        }, (error) => {
            document.getElementById('locationOutput').textContent = "No se pudo obtener la ubicación.";
        });
    } else {
        document.getElementById('locationOutput').textContent = "Geolocalización no soportada en este navegador.";
    }
});

// Camera API: Permite al usuario tomar una foto
document.getElementById('btnCamera').addEventListener('click', () => {
    const video = document.getElementById('cameraOutput');
    video.style.display = 'block';

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then((stream) => {
                video.srcObject = stream;
            })
            .catch((error) => {
                console.error("Error al acceder a la cámara:", error);
            });
    } else {
        alert("API de cámara no soportada en este navegador.");
    }
});

// Share API: Permite compartir el contenido de la aplicación
document.getElementById('btnShare').addEventListener('click', () => {
    if (navigator.share) {
        navigator.share({
            title: 'Cafetería Zenteno',
            text: '¡Visita nuestra cafetería y disfruta de un delicioso café!',
            url: window.location.href
        })
        .then(() => console.log('Contenido compartido exitosamente'))
        .catch((error) => console.error('Error al compartir:', error));
    } else {
        alert("La API de Compartir no está disponible en este navegador.");
    }
});

// Activar vibración al agregar un producto
function vibrarAlAgregarProducto() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
            registration.active.postMessage({ type: 'VIBRATE' });
        });
    }
}

// Orientación del dispositivo
function obtenerOrientacionDispositivo() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
            registration.active.postMessage({ type: 'DEVICE_ORIENTATION' });
        });
    }
}

document.getElementById("addProductForm").addEventListener("submit", (event) => {
    event.preventDefault();
    // Lógica de agregar producto...
    vibrarAlAgregarProducto();
    obtenerOrientacionDispositivo()
});