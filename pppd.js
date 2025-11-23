
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- Configuración ---
const config = {
    sunSize: 10,
    orbitSpeedMultiplier: 0.5,
    planetScale: 1
};

// Datos de los planetas
const planetData = [
    { name: "Mercurio", size: 1.2, dist: 20, color: 0xA5A5A5, speed: 0.04 },
    { name: "Venus", size: 1.8, dist: 30, color: 0xE3BB76, speed: 0.015 },
    { name: "Tierra", size: 2.0, dist: 45, color: 0x2233FF, speed: 0.01 },
    { name: "Marte", size: 1.4, dist: 60, color: 0xFF3300, speed: 0.008 },
    { name: "Júpiter", size: 5.0, dist: 90, color: 0xDCA768, speed: 0.002 },
    { name: "Saturno", size: 4.5, dist: 120, color: 0xC5AB6E, speed: 0.0009, hasRing: true },
    { name: "Urano", size: 3.0, dist: 150, color: 0x4FD0E7, speed: 0.0004 },
    { name: "Neptuno", size: 3.0, dist: 170, color: 0x2933CC, speed: 0.0001 }
];

// --- Escena ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(-50, 90, 150);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// Controles de cámara
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// --- Luces ---
const ambientLight = new THREE.AmbientLight(0x333333); 
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xFFFFFF, 2, 400);
scene.add(pointLight);

// --- Objetos ---

// 1. El Sol
const sunGeo = new THREE.SphereGeometry(config.sunSize, 32, 32);
const sunMat = new THREE.MeshBasicMaterial({ color: 0xFFDD00 });
const sun = new THREE.Mesh(sunGeo, sunMat);
scene.add(sun);

// 2. Campo de Estrellas
function createStars() {
    const starsGeo = new THREE.BufferGeometry();
    const count = 2000;
    const positions = new Float32Array(count * 3);
    for(let i=0; i<count*3; i++) {
        positions[i] = (Math.random() - 0.5) * 800;
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const starsMat = new THREE.PointsMaterial({color: 0xffffff, size: 0.5});
    const stars = new THREE.Points(starsGeo, starsMat);
    scene.add(stars);
}
createStars();

// 3. Planetas
const planets = [];

planetData.forEach(data => {
    // Pivote para la órbita (centro en el sol)
    const orbitPivot = new THREE.Object3D();
    scene.add(orbitPivot);

    // Malla del planeta
    const geometry = new THREE.SphereGeometry(data.size * config.planetScale, 32, 32);
    const material = new THREE.MeshStandardMaterial({ 
        color: data.color,
        roughness: 0.7,
        metalness: 0.1
    });
    const planet = new THREE.Mesh(geometry, material);
    planet.position.x = data.dist; // Desplazar del centro
    orbitPivot.add(planet);

    // Línea de órbita visual
    const pathGeo = new THREE.RingGeometry(data.dist - 0.1, data.dist + 0.1, 64);
    const pathMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, side: THREE.DoubleSide, opacity: 0.1, transparent: true });
    const path = new THREE.Mesh(pathGeo, pathMat);
    path.rotation.x = Math.PI / 2;
    scene.add(path);

    // Anillos de Saturno
    if (data.hasRing) {
        const ringGeo = new THREE.RingGeometry(data.size * 1.4, data.size * 2.2, 32);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xAABBCC, side: THREE.DoubleSide, opacity: 0.6, transparent: true });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2.2;
        planet.add(ring);
    }

    // Guardar referencia
    planets.push({
        mesh: planet,
        pivot: orbitPivot,
        speed: data.speed * config.orbitSpeedMultiplier,
        name: data.name
    });
});

// --- Etiquetas UI ---
const labelContainer = document.body;
planets.forEach(p => {
    const div = document.createElement('div');
    div.className = 'label';
    div.textContent = p.name;
    labelContainer.appendChild(div);
    p.label = div;
});

// --- Loop de Animación ---
function animate() {
    requestAnimationFrame(animate);

    sun.rotation.y += 0.002;

    planets.forEach(p => {
        // Rotación orbital
        p.pivot.rotation.y += p.speed;
        // Rotación sobre su eje
        p.mesh.rotation.y += 0.02;

        // Posición de la etiqueta
        const worldPos = new THREE.Vector3();
        p.mesh.getWorldPosition(worldPos);
        worldPos.project(camera);

        const x = (worldPos.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-(worldPos.y * 0.5) + 0.5) * window.innerHeight;

        p.label.style.transform = `translate(-50%, -150%) translate(${x}px, ${y}px)`;
        
        // Ocultar si está detrás de la cámara
        if (Math.abs(worldPos.z) > 1) {
           p.label.style.opacity = 0;
        } else {
           p.label.style.opacity = 1;
        }
    });

    controls.update();
    renderer.render(scene, camera);
}

// --- Resize ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
