// Model.ts
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export class Model {
    name: string;
    filepath: string;
    latHiLng: [number, number, number]; // [lat, height, lng]
    sceneObject?: THREE.Object3D;

    constructor(options: {
        name: string;
        filepath: string;
        latHiLng: [number, number, number];
    }) {
        this.name = options.name;
        this.filepath = options.filepath;
        this.latHiLng = options.latHiLng;
    }

    async load(scene: THREE.Scene): Promise<void> {
        if (this.sceneObject) return;

        const loader = new GLTFLoader();
        const gltf = await new Promise<THREE.Group>((resolve) => {
            loader.load(this.filepath, (g) => resolve(g.scene));
        });

        // Container allows future transformations
        const container = new THREE.Group();
        container.add(gltf);

        // Shift model so its base is at y=0
        const box = new THREE.Box3().setFromObject(gltf);
        gltf.position.y -= box.min.y;

        // Position directly using latHiLng
        const [lat, height, lng] = this.latHiLng;
        container.position.set(lng, height, -lat); // x=lng, y=height, z=-lat

        this.sceneObject = container;
        scene.add(container);
    }
}
