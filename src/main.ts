import * as THREE from "three";
import { ARButton } from "three/examples/jsm/webxr/ARButton.js";
import { Model } from "./Model";
import { models } from "./locations";

function setScene() {
  const scene = new THREE.Scene();
  scene.add(new THREE.AxesHelper(1));

  const camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;

  document.body.appendChild(renderer.domElement);
  document.body.appendChild(ARButton.createButton(renderer));

  const light = new THREE.DirectionalLight(0xffffff, 2);
  light.position.set(1, 2, 3);
  scene.add(light);

  return { scene, camera, renderer };
}

async function main() {
  const { scene, camera, renderer } = setScene();

  // Load models at exact Lat/Lng
  const deskAngel = new Model(models.desk);
  await deskAngel.load(scene);

  renderer.setAnimationLoop(() => {
    renderer.render(scene, camera);
  });
}

main();
