import * as THREE from 'three';
import { XRButton } from 'three/examples/jsm/webxr/XRButton.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

let targetLat = 47.4979, targetLng = 19.0402; // Example target location: Budapest Parliament

const EARTH_RADIUS_M = 6371000;

let userLat, userLng;

// Convert GPS coordinates to AR coordinates (meters relative to user)
function getARPosition(lat, lng) {
  const deltaLat = (lat - userLat) * (Math.PI / 180) * EARTH_RADIUS_M;
  const deltaLng = (lng - userLng) * (Math.PI / 180) * EARTH_RADIUS_M * Math.cos(userLat * Math.PI / 180);
  return { x: deltaLng, z: -deltaLat }; // Use negative deltaLat for proper front-back positioning
}

async function init() {
  const { scene, camera, renderer } = setScene();
  const model = await setModel(scene, '/cemetery_angel_-_miller/scene.gltf', [0, 0, -1]);// Test by setting 1m in front

  startLocationTracking(model);

  renderer.setAnimationLoop(() => {
    renderer.render(scene, camera);
  });
}

async function setModel(scene, filepath, coords) {
  const loader = new GLTFLoader();
  await new Promise((resolve) => {
    loader.load(filepath, (gltf) => {
      const model = gltf.scene;
      model.position.set(...coords);
      scene.add(model);
      resolve();
    });
  });
}

function setScene() {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  document.body.appendChild(renderer.domElement);
  document.body.appendChild(XRButton.createButton(renderer));

  const light = new THREE.DirectionalLight(0xffffff, 2);
  light.position.set(1, 2, 3);
  scene.add(light);

  return { scene, camera, renderer };
}

// Directly request geolocation permissions and handle the response
function startLocationTracking(model) {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser.");
    throw new Error("Geolocation API access impossible.");
  }

  navigator.geolocation.watchPosition(
    (position) => {
      userLat = position.coords.latitude;
      userLng = position.coords.longitude;

      console.log(`Updated Location: ${userLat}, ${userLng}`);

      if (model) {
        const arPos = getARPosition(targetLat, targetLng);
        model.position.set(arPos.x, 0, arPos.z);
      }

      camera.position.set(0, 1.6, 0); // Keep camera at a natural height
      camera.lookAt(new THREE.Vector3(0, 0, -1));
    },
    (error) => {
      console.error("Geolocation error:", error);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 5000
    }
  );
}

// Record point control
document.getElementById('record-point').addEventListener('click', () => {
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      const accuracy = position.coords.accuracy; // Accuracy in meters

      const locationData = { latitude, longitude, accuracy };

      fetch('//api/record-location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(locationData)
      });

      alert(`Your location is: Latitude: ${latitude}, Longitude: ${longitude} (Accuracy: ${accuracy} meters)`);
    },
    (error) => {
      alert("Error: Unable to retrieve location. " + error.toString());
    },
    {
      enableHighAccuracy: true,
      timeout: 5000,  // Timeout after 5 seconds
      maximumAge: 0  // No cached position
    }
  );
});

init();
