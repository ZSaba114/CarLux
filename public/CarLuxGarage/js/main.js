import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";

const mainContainer = document.getElementById("carsContainer");

// Crée 12 containers et 12 voitures
for (let i = 1; i <= 16; i++) {
    const a = document.createElement("a");
    a.href = `detail.html?car=${i}`;
    a.className = "carContainer";
    a.id = `car${i}`;
    mainContainer.appendChild(a);

    createCar(a.id, i);
}

function createCar(containerId, carNumber) {
    const container = document.getElementById(containerId);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    scene.add(new THREE.AmbientLight(0xffffff, 1.5));
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);

    const loader = new GLTFLoader();
    loader.load(`./models/car${carNumber}/scene.gltf`, function(gltf) {
        const carGroup = new THREE.Group();
        const car = gltf.scene;
        carGroup.add(car);
        scene.add(carGroup);

        // --- Normalisation type Sketchfab ---
        // 1️⃣ Recentrage initial
        const box = new THREE.Box3().setFromObject(carGroup);
        const size = new THREE.Vector3();
        box.getSize(size);
        const center = box.getCenter(new THREE.Vector3());
        carGroup.position.sub(center);

        // 2️⃣ Scale normalisé sur la plus grande dimension
        const maxDim = Math.max(size.x, size.y, size.z);
        const targetSize = 1; // unité normalisée
        const scale = targetSize / maxDim;
        carGroup.scale.setScalar(scale);

        // 3️⃣ Recentrage après scale
        const boxScaled = new THREE.Box3().setFromObject(carGroup);
        const centerScaled = boxScaled.getCenter(new THREE.Vector3());
        carGroup.position.sub(centerScaled);

        // 4️⃣ Caméra dynamique après scale
        const sizeScaled = new THREE.Vector3();
        boxScaled.getSize(sizeScaled);
        const maxDimScaled = Math.max(sizeScaled.x, sizeScaled.y, sizeScaled.z);
        const fov = camera.fov * (Math.PI / 180);
        const camZ = Math.abs(maxDimScaled / 2 / Math.tan(fov / 2)) * 1.2; // padding 1.2
        camera.position.set(0, maxDimScaled / 2, camZ);
        camera.lookAt(0, 0, 0);

        controls.update();

        // Rotation continue
        function animate() {
            requestAnimationFrame(animate);
            carGroup.rotation.y += 0.01;
            controls.update();
            renderer.render(scene, camera);
        }
        animate();

    }, undefined, function(error) {
        console.error(`Erreur chargement voiture ${carNumber}:`, error);
    });

    // Resize responsive
    window.addEventListener('resize', () => {
        renderer.setSize(container.clientWidth, container.clientHeight);
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
    });
}
