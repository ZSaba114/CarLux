import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";

// Récupère l'id de la voiture cliquée
const urlParams = new URLSearchParams(window.location.search);
const carId = urlParams.get('car') || '1';

const container = document.getElementById('carDetailContainer');

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

scene.add(new THREE.AmbientLight(0xffffff, 1.5));
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

const loader = new GLTFLoader();

loader.load(`./models/car${carId}/scene.gltf`,
    function(gltf) {
        const carGroup = new THREE.Group(); // Groupe pour gérer scale et centrage
        const car = gltf.scene;
        carGroup.add(car);
        scene.add(carGroup);

        // Calculer la bounding box
        const box = new THREE.Box3().setFromObject(carGroup);
        const size = new THREE.Vector3();
        box.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);

        // Scale automatique
        const scaleFactor = 50 / maxDim; // Ajuster si besoin
        carGroup.scale.setScalar(scaleFactor);

        // Recentrer après scale
        const boxScaled = new THREE.Box3().setFromObject(carGroup);
        const centerScaled = boxScaled.getCenter(new THREE.Vector3());
        carGroup.position.sub(centerScaled);

        // Ajuster caméra
        const sizeScaled = boxScaled.getSize(new THREE.Vector3());
        const maxDimScaled = Math.max(sizeScaled.x, sizeScaled.y, sizeScaled.z);
        camera.position.set(0, maxDimScaled * 0.8, maxDimScaled * 1.5);
        camera.lookAt(0, 0, 0);

        controls.update();
    },
    function(xhr){ console.log(`Car ${carId} Loading: ${(xhr.loaded/xhr.total*100).toFixed(2)}%`); },
    function(error){ console.error(`Error loading Car ${carId}:`, error); }
);

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
});
