import * as THREE from 'three';
import { XRButton } from 'three/examples/jsm/webxr/XRButton.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const earthRadius = 6371000; // meters
let camera, scene, renderer, model, light;
let targetLat = 47.4979, targetLng = 19.0402; // Example target location: Budapest Parliament
let userLat, userLng;
let isModelPositionSet = false; // Flag to track if the model position is already set

// Convert GPS coordinates to AR coordinates (meters relative to user)
function getARPosition(lat, lng) {
  const deltaLat = (lat - userLat) * (Math.PI / 180) * earthRadius;
  const deltaLng = (lng - userLng) * (Math.PI / 180) * earthRadius * Math.cos(userLat * Math.PI / 180);
  return { x: deltaLng, z: -deltaLat }; // Use negative deltaLat for proper front-back positioning
}

function init() {
  // Set up Three.js scene
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  document.body.appendChild(renderer.domElement);
  document.body.appendChild(XRButton.createButton(renderer));

  // Lighting setup
  light = new THREE.DirectionalLight(0xffffff, 2);
  light.position.set(1, 2, 3);
  scene.add(light);

  // Load 3D Model
  const loader = new GLTFLoader();
  loader.load('/cemetery_angel_-_miller/scene.gltf', (gltf) => {
    model = gltf.scene;
    model.position.set(0, 0, -1); // Start 1m in front
    scene.add(model);
  });

  animate();
}

// Directly request geolocation permissions and handle the response
function getUserLocation() {
  // Ask for permission to access location
  navigator.geolocation.getCurrentPosition(
    (position) => {
      userLat = position.coords.latitude;
      userLng = position.coords.longitude;

      const arPos = getARPosition(targetLat, targetLng);

      // Only set the model position if it hasn't been set already
      if (!isModelPositionSet && model) {
        model.position.set(arPos.x, 0, arPos.z); // Position model relative to user's location
        isModelPositionSet = true; // Mark the position as set
      }

      // Adjust camera to user position (looking in the right direction)
      camera.position.set(arPos.x, 0, arPos.z + 5); // Offset the camera for a better view
      camera.lookAt(new THREE.Vector3(arPos.x, 0, arPos.z)); // Look at the model
    },
    (error) => {
      console.error(error);
      alert("Error: Unable to retrieve location. " + error.toString());
    },
    {
      enableHighAccuracy: true,
      timeout: 5000,  // Timeout after 5 seconds
      maximumAge: 0  // No cached position
    }
  );
}

// Initialize the app
getUserLocation();  // Directly ask for geolocation without checking Permissions API

// Animation loop
function animate() {
  renderer.setAnimationLoop(() => {
    renderer.render(scene, camera);
  });
}

// Light intensity control
document.getElementById('light-intensity').addEventListener('input', (event) => {
  light.intensity = event.target.value;
});

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
