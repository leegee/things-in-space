import * as THREE from 'three';
import { XRButton } from 'three/examples/jsm/webxr/XRButton.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

let camera, scene, renderer;
let model, light;

// Target GPS location
const targetLat = 47.4979;  // Example: Budapest Parliament
const targetLng = 19.0402;
let userLat, userLng;

// Init Scene
function init() {
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
    loader.load('model.gltf', (gltf) => {
        model = gltf.scene;
        model.position.set(0, 0, -2); // Start 2m in front
        scene.add(model);
    });

    animate();
}

// Function to convert GPS to AR coordinates
function getARPosition(lat, lng) {
    const earthRadius = 6371000; // meters
    const deltaLat = (lat - userLat) * (Math.PI / 180) * earthRadius;
    const deltaLng = (lng - userLng) * (Math.PI / 180) * earthRadius * Math.cos(userLat * Math.PI / 180);
    return { x: deltaLng, z: -deltaLat };
}

// Get user's location
navigator.geolocation.getCurrentPosition((position) => {
    userLat = position.coords.latitude;
    userLng = position.coords.longitude;

    const arPos = getARPosition(targetLat, targetLng);
    if (model) {
        model.position.set(arPos.x, 0, arPos.z);
    }
});

// Animation loop
function animate() {
    renderer.setAnimationLoop(() => {
        renderer.render(scene, camera);
    });
}

init();
