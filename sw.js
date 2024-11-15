// Instalación del service worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open('cafeteria-cache').then(async (cache) => {
            try {
                await cache.addAll([
                    '/',                     // Página principal
                    '/index.html',
                    '/styles.css',
                    '/app.js',
                    '/offline.html',          // Shell para offline
                    '/manifest.json'
                ]);
                console.log("Todos los archivos han sido almacenados en caché exitosamente.");
            } catch (error) {
                console.error("Error al agregar archivos a la caché:", error);
            }
        })
    );
    self.skipWaiting();
});

// Activación del service worker
self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

// Intercepción de peticiones
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request).catch(() => {
            return caches.match(event.request).then((response) => {
                // Si no hay respuesta en caché, devolver la shell offline
                return response || caches.match('/offline.html');
            });
        })
    );
});

// Notificación Push
self.addEventListener('push', (event) => {
    const options = {
        body: event.data ? event.data.text() : 'Nueva promoción en nuestra cafetería!',
        icon: '/images/notification-icon.png',
    };
    event.waitUntil(
        self.registration.showNotification('Promoción Especial', options)
    );
});


// API de Vibración para retroalimentación de usuario
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'VIBRATE') {
        if (self.registration.active) {
            navigator.vibrate([100, 50, 100]);
            console.log('Vibración activada');
        }
    }
});


// API de Orientacion de pantalla
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'DEVICE_ORIENTATION') {
        window.addEventListener("deviceorientation", event => {
            const { alpha, beta, gamma } = event;
            self.registration.showNotification("Orientación del dispositivo", {
                body: `Ángulo: Alpha ${alpha.toFixed(1)}, Beta ${beta.toFixed(1)}, Gamma ${gamma.toFixed(1)}`,
                icon: '/img/icono.jpg'
            });
        });
    }
});