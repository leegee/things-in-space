import * as THREE from 'three';
import { XRButton } from 'three/examples/jsm/webxr/XRButton.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

let targetLat = 47.4979, targetLng = 19.0402; // Example target location: Budapest Parliament

const EARTH_RADIUS_M = 6371000;

let userLat, userLng;
let model;

// Convert GPS coordinates to AR coordinates (meters relative to user)
function getARPosition(lat, lng) {
  const deltaLat = (lat - userLat) * (Math.PI / 180) * EARTH_RADIUS_M;
  const deltaLng = (lng - userLng) * (Math.PI / 180) * EARTH_RADIUS_M * Math.cos(userLat * Math.PI / 180);
  return { x: deltaLng, z: -deltaLat }; // Use negative deltaLat for proper front-back positioning
}

// Calculate distance between two GPS coordinates in meters - with thanks
function getDistance(lat1, lon1, lat2, lon2) {
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_M * c;
}

async function setModel(scene, filepath, coords) {
  const loader = new GLTFLoader();
  await new Promise((resolve) => {
    loader.load(filepath, (gltf) => {
      model = gltf.scene;
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

function startLocationTracking(camera) {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser.");
    throw new Error("Geolocation API access impossible.");
  }

  navigator.geolocation.watchPosition(
    (position) => {
      userLat = position.coords.latitude;
      userLng = position.coords.longitude;

      camera.position.set(0, 1.6, 0); // Keep camera at a natural height
      camera.lookAt(new THREE.Vector3(0, 0, -1));

      // Calculate distance between user and target
      const distance = getDistance(userLat, userLng, targetLat, targetLng);
      if (distance < 100 && model) {
        model.visible = true;
      } else if (model) {
        model.visible = false;
      }
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

async function init() {
  const { scene, camera, renderer } = setScene();
  await setModel(scene, '/cemetery_angel_-_miller/scene.gltf', [0, 0, -1]); // Test by setting 1m in front

  startLocationTracking(camera);

  // const arPos = getARPosition(targetLat, targetLng);
  // model.position.set(arPos.x, 0, arPos.z);

  renderer.setAnimationLoop(() => {
    renderer.render(scene, camera);
  });
}

init();
