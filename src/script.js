import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { Pane } from 'tweakpane';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import * as EssentialsPlugin from '@tweakpane/plugin-essentials';
import vertexShader from './shaders/vertex.glsl'
import fragmentShader from './shaders/fragment.glsl'

/**
 * Base
 */
// GLTF loader
const gltfLoader = new GLTFLoader()

// Debug
const pane = new Pane();
pane.registerPlugin(EssentialsPlugin);

const fpsGraph = pane.addBlade({
  view: 'fpsgraph',
  label: 'fpsgraph',
})

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
}

window.addEventListener('resize', () => {
  // Update sizes
  sizes.width = window.innerWidth
  sizes.height = window.innerHeight

  // Update camera
  camera.aspect = sizes.width / sizes.height
  camera.updateProjectionMatrix()

  // Update renderer
  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/***
 *  Lights
 */
// Ambient Light
const light = new THREE.AmbientLight(0x404040); // soft white light
scene.add(light);

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 1000)
camera.position.x = 0
camera.position.y = 1
camera.position.z = 2
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
// controls.dampingFactor = 0.04
// controls.minDistance = 5
// controls.maxDistance = 60
// controls.enableRotate = true
// controls.enableZoom = true
// controls.maxPolarAngle = Math.PI /2.5



/**
 * Texture Loader
 */
const textureLoader = new THREE.TextureLoader()
const texture = textureLoader.load('map.jpg')
texture.anisotropy = 16
// texture.flipY = false
// texture.encoding = THREE.sRGBEncoding


/**
 * Cube
 */

const utilsObj = { value: 0 };


/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setClearColor(0x18142c, 1);


/**
 *  Gui 
 */
const params = { color: '#ffffff' };

// add a folder for the scene background color
const folder = pane.addFolder({ title: 'Background Color' });

folder.addInput(params, 'color').on('change', () => {
  const color = new THREE.Color(params.color);
  scene.background = color;
});

// For Tweaking Numbers

// add a number input to the pane
const numberInput = pane.addInput(utilsObj, 'value', {
  min: 0,
  max: 1,
  step: 0.001,
});

// update the number value when the input value changes
numberInput.on('change', () => {
  console.log(`Number value updated to ${utilsObj.value}`);
});



//

// Existing base and player in the main scene
const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, map: texture });
let geometry = new THREE.PlaneGeometry(200, 200, 1);
const base = new THREE.Mesh(geometry, material);
base.rotation.x = -Math.PI / 2;
scene.add(base);

// Create the player (using a cylinder for simplicity)
const playerGeometry = new THREE.CylinderGeometry(0.5, 0.5, 2, 16);
const playerMaterial = new THREE.MeshStandardMaterial({ color: 0x0077ff });
const player = new THREE.Mesh(playerGeometry, playerMaterial);
scene.add(player);

// Create a second scene for the minimap
const minimapScene = new THREE.Scene();

// Copy the base to the minimap scene
const minimapBase = base.clone();
minimapScene.add(minimapBase);

// Create the minimap player (a green circle)
const minimapPlayerGeometry = new THREE.CircleGeometry(4, 32);
const minimapPlayerMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const minimapPlayer = new THREE.Mesh(minimapPlayerGeometry, minimapPlayerMaterial);
minimapPlayer.rotation.x = -Math.PI / 2; // Face the circle upwards
minimapScene.add(minimapPlayer);

// Create the minimap camera
const minimapCamera = new THREE.OrthographicCamera(-100, 100, 100, -100, 0.1, 1000);
minimapCamera.position.set(0, 100, 0);
minimapCamera.lookAt(0, 0, 0);

// Toggle variables
let followPlayer = true;

// Zoom control function
function toggleMinimapZoom() {
  if (followPlayer) {
    // Switch to follow player mode
    minimapCamera.zoom = 2; // Adjust this zoom level as needed
  } else {
    // Switch to whole base view
    minimapCamera.left = -100;
    minimapCamera.right = 100;
    minimapCamera.top = 100;
    minimapCamera.bottom = -100;
    minimapCamera.position.set(0, 100, 0); // Reset camera position to center on the base
    minimapCamera.zoom = 1; // Default zoom for whole base view
  }
  minimapCamera.updateProjectionMatrix();
}

// Set up minimap container for click to toggle camera follow mode
const minimapContainer = document.getElementById('minimap');
minimapContainer.addEventListener('click', () => {
  followPlayer = !followPlayer;
  toggleMinimapZoom();
});

// Create the minimap renderer
const minimapRenderer = new THREE.WebGLRenderer({ alpha: true });
minimapRenderer.setSize(200, 200);
document.getElementById('minimap').appendChild(minimapRenderer.domElement);

// Toggle minimap size on click
minimapContainer.addEventListener('click', () => {
  minimapContainer.classList.toggle('expanded');
  if (minimapContainer.classList.contains('expanded')) {
    minimapRenderer.setSize(400, 400); // Expanded size
  } else {
    minimapRenderer.setSize(200, 200); // Collapsed size
  }
});


// WASD controls setup
const keys = { w: false, a: false, s: false, d: false };
const speed = 0.1;

// Listen for key presses
document.addEventListener('keydown', (event) => {
  if (event.key === 'w') keys.w = true;
  if (event.key === 'a') keys.a = true;
  if (event.key === 's') keys.s = true;
  if (event.key === 'd') keys.d = true;
});

document.addEventListener('keyup', (event) => {
  if (event.key === 'w') keys.w = false;
  if (event.key === 'a') keys.a = false;
  if (event.key === 's') keys.s = false;
  if (event.key === 'd') keys.d = false;
});

// Animation loop
function updateMinimap() {
  // Update player position in the main scene
  if (keys.w) player.position.z -= speed;
  if (keys.s) player.position.z += speed;
  if (keys.a) player.position.x -= speed;
  if (keys.d) player.position.x += speed;

  // Synchronize the minimap player with the main player position
  minimapPlayer.position.set(player.position.x, 0.1, player.position.z); // Keep it slightly above the base

  if (followPlayer) {
    // Update minimap camera to follow the player
    minimapCamera.position.set(player.position.x, 100, player.position.z);
    minimapCamera.lookAt(player.position.x, 0, player.position.z);
  }

  // Render the minimap scene
  minimapRenderer.render(minimapScene, minimapCamera);
}



//

/**
 * Animate
 */
class AnimationLoop {
  constructor(updateSimulation) {
    this.updateSimulation = updateSimulation;
    this.animationFrameId = null;
    this.previousTime = 0;
    this.timeAccumulator = 0;
    this.totalElapsedTime = 0;
    this.fixedTimeStep = 1 / 60; // Fixed time step for physics updates (60 FPS)

    // Bind the animation loop method to ensure correct `this` context
    this.animationLoop = this.animationLoop.bind(this);
  }

  animationLoop() {
    const currentTime = performance.now();
    const timeDelta = (currentTime - this.previousTime) / 1000; // Convert to seconds
    this.previousTime = currentTime;

    // Cap the time delta to avoid large jumps (e.g., if the tab was inactive)
    const cappedDelta = Math.min(timeDelta, 0.1); // Max 100ms per frame
    this.timeAccumulator += cappedDelta;
    this.totalElapsedTime += cappedDelta;

    // Process the physics simulation in fixed time steps
    while (this.timeAccumulator >= this.fixedTimeStep) {
      this.updateSimulation(this.fixedTimeStep, this.totalElapsedTime); // Update physics with a fixed time step
      this.timeAccumulator -= this.fixedTimeStep;
    }

    // Request the next frame to continue the loop
    this.animationFrameId = requestAnimationFrame(this.animationLoop);
  }

  // Start the animation loop
  start() {
    if (this.animationFrameId === null) { // Prevent multiple starts
      this.previousTime = performance.now();
      this.animationFrameId = requestAnimationFrame(this.animationLoop);
    }
  }

  // Stop the animation loop
  stop() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  // Reset the animation loop (optional)
  reset() {
    this.timeAccumulator = 0;
    this.totalElapsedTime = 0;
    this.previousTime = performance.now();
  }
}

// Example usage:
const updateSimulation = (deltaTime, elapsedTime) => {

  fpsGraph.begin()


  // Update controls
  controls.update()

  // Render
  renderer.render(scene, camera)
  updateMinimap()
  fpsGraph.end()
};

// Create an instance of the AnimationLoop
const animationLoop = new AnimationLoop(updateSimulation);

// Start the animation loop
animationLoop.start();

// Later, to stop the loop
// animationLoop.stop();

// To restart the loop after stopping
// animationLoop.start();

// Optionally, to reset the loop's internal timers
// animationLoop.reset();