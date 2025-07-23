// public/service-worker.js

self.addEventListener('install', (event) => {
    console.log('Service Worker installing.');
    // Vous pouvez ajouter ici des étapes d'installation, comme la mise en cache des ressources
  });
  
  self.addEventListener('activate', (event) => {
    console.log('Service Worker activating.');
    // Vous pouvez ajouter ici des étapes d'activation, comme la suppression des anciens caches
  });
  
  self.addEventListener('fetch', (event) => {
    console.log('Fetching:', event.request.url);
    // Vous pouvez ajouter ici des stratégies de mise en cache ou de récupération des ressources
  });