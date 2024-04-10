import './main.css'
import * as THREE from 'three'
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

const manager = new THREE.LoadingManager();

const dracoLoader = new DRACOLoader(manager)
const loader = new GLTFLoader(manager)
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/')
dracoLoader.setDecoderConfig({ type: 'js' })
loader.setDRACOLoader(dracoLoader)

const container = document.createElement('div')
document.body.appendChild(container)

const scene = new THREE.Scene()
scene.background = new THREE.Color('#c8f0f9')

scene.fog = new THREE.Fog('#ade7f7', 40, 100);

let circle = document.getElementById('circle');
circle.style.display = 'none';
let mouseX = 0, mouseY = 0;
let xp = 0, yp = 0;

document.onmousemove = function(e){
    mouseX = e.pageX - 20;
    mouseY = e.pageY - 20;
}

const renderer = new THREE.WebGLRenderer({ antialias: false})
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.outputEncoding = THREE.sRGBEncoding
container.appendChild(renderer.domElement)

const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 1, 500)
camera.position.set(26, 4, -35)
scene.add(camera)

window.addEventListener('resize', () => {
    const width = window.innerWidth
    const height = window.innerHeight
    camera.aspect = width / height
    camera.updateProjectionMatrix()

    renderer.setSize(width, height)
    renderer.setPixelRatio(2)
})

const controls = new OrbitControls(camera, renderer.domElement)

const ambient = new THREE.AmbientLight(0xa0a0fc, 0.82)
scene.add(ambient)

const sunLight = new THREE.DirectionalLight(0xe8c37b, 1.96)
scene.add(sunLight)

let modelLoaded = false;
let circleLoader = document.getElementsByClassName('loader');

manager.onLoad = function() {
    circleLoader[0].classList.add('fade-out');
    // set interval to remove loader after fade out
    setTimeout(() => {
        document.querySelector('.title').classList.add('enter-animation');
        document.querySelector('#startButton').classList.add('enter-animation');
    }, 2000);
};

let targetObject = null;

loader.load('models/gltf/scene.glb', function (gltf) {
    gltf.scene.scale.set(0.3, 0.3, 0.3);
    gltf.scene.position.set(0, 0, 0);
    console.log(gltf)
    scene.add(gltf.scene)

    modelLoaded = true;
    circle.style.display = 'block';

    targetObject = gltf.scene;
});

let pin;
let buildingHeight = 1.7; // Remplacez par la hauteur réelle de votre bâtiment
let buildingPosition = new THREE.Vector3(0, 0, 0); // Remplacez par la position réelle de votre bâtiment

loader.load('models/gltf/pin.glb', function (gltf) {
    gltf.scene.position.set(buildingPosition.x, buildingPosition.y + buildingHeight, buildingPosition.z);
    scene.add(gltf.scene)
    pin = gltf.scene;
})

function animatePin() {
    requestAnimationFrame(animatePin);

    // Faire osciller le pin de haut en bas
    if (pin) {
        const time = Date.now() * 0.003; // Obtenir le temps actuel
        pin.position.y = buildingPosition.y + buildingHeight + Math.sin(time) * 0.2; // Modifier la position y du pin
    }

    renderer.render(scene, camera);
}
animatePin();

function moveCircle() {
    if (modelLoaded) {
        xp += ((mouseX - xp)/1.5);
        yp += ((mouseY - yp)/1.5);
        circle.style.left = xp +'px';
        circle.style.top = yp +'px';
    }
    requestAnimationFrame(moveCircle);
}
moveCircle();

const clock = new THREE.Clock()
let previousTime = 0

function calculateRotationSpeed(elapsedTime, speed) {
    return elapsedTime * speed;
}

function updateCameraPosition(radius, angle) {
    if (!manualControl) {
        camera.position.x = radius * Math.cos(angle);
        camera.position.z = radius * Math.sin(angle);
        camera.lookAt(scene.position);
    }
}

let manualControl = false;
let initialAngle = 0;
let animationStartTime = 0;

document.addEventListener('mousedown', () => {
    manualControl = true;
});

// // Ajouter un événement pour détecter la fin de la manipulation manuelle de la caméra
document.addEventListener('mouseup', () => {
    manualControl = false;
    initialAngle = Math.atan2(camera.position.z, camera.position.x); // Calculate the current angle of the camera
    animationStartTime = clock.getElapsedTime(); // Set the animation start time to the current time
});


const startButton = document.getElementById('startButton');
startButton.addEventListener('click', function(event) {
    event.preventDefault();
    startSimulation();
});

let animationFinished = false;

function startSimulation() {
    sunLight.position.set(camera.position.x, camera.position.y, camera.position.z);
    
    document.querySelector('.loader-container').classList.add('fade-out-instant');

    controls.enabled = false; // Désactiver les contrôles OrbitControls pendant l'animation de la caméra

    camera.lookAt(new THREE.Vector3(0, 0, 0));

    new TWEEN.Tween(camera.position).to({
        x: 20,
        y: 15,
        z: 30
    }, 6500)
    .delay(1000).easing(TWEEN.Easing.Quartic.InOut).start()
    .onUpdate(function() {
        camera.lookAt(new THREE.Vector3(0, 0, 0));
    })
    .onComplete(function () {
        controls.enabled = true; // Réactiver les contrôles OrbitControls
        controls.update(); // Mettre à jour les contrôles pour qu'ils fonctionnent à nouveau
        setOrbitControlsLimits(); // Réappliquer les limites des contrôles
        TWEEN.remove(this);
        tick();

        initialAngle = Math.atan2(camera.position.z, camera.position.x); // Calculate the current angle of the camera
        animationStartTime = clock.getElapsedTime(); // Set the animation start time to the current time

        animationFinished = true; // Ajoutez cette ligne
    });
}

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()
    previousTime = elapsedTime

    const radius = Math.sqrt(camera.position.x * camera.position.x + camera.position.z * camera.position.z);
    const speed = 0.1;

    if (!manualControl && animationFinished) {
        const rotationSpeed = calculateRotationSpeed(elapsedTime - animationStartTime, speed);
        updateCameraPosition(radius, initialAngle + rotationSpeed);
    }

    controls.update()

    renderer.render(scene, camera)

    window.requestAnimationFrame(tick)
}

document.querySelector('#startButton').addEventListener('animationend', () => {
    document.querySelector('.loader-container').classList.add('fade-out-background');
});

const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()

// TEST CLICK ZOOM
let targetPosition = new THREE.Vector3(); // Position cible pour la caméra
let isCameraMoving = false; // Indicateur pour savoir si la caméra est en mouvement

// Ajouter un écouteur d'événement pour détecter le clic sur le bâtiment
document.addEventListener('click', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0 && controls.enabled) {
        let object = intersects[0].object;
        while (object) {
            if (object.name === 'BATIMENT_PRINCIPAL' ) {
                targetPosition = object.position;
                moveCameraToBuilding(targetPosition);
                resetViewButton.style.display = 'block'; // Afficher le bouton
                return;
            }
            object = object.parent;
        }
    }
});

const resetViewButton = document.getElementById('resetViewButton');
resetViewButton.addEventListener('click', function(event) {
    event.preventDefault();
    resetView();
});

let animationShouldResume = true;

function resetView() {
    isCameraMoving = true; // Indiquer que la caméra est en mouvement

    new TWEEN.Tween(camera.position).to({
        x: 20, // Mettez ici la position x par défaut de la caméra
        y: 30, // Mettez ici la position y par défaut de la caméra
        z: 15  // Mettez ici la position z par défaut de la caméra
    }, 2000).easing(TWEEN.Easing.Quartic.InOut).start()
    .onUpdate(function() {
        camera.lookAt(new THREE.Vector3(0, 0, 0));
    })
    .onComplete(function() {
        resetViewButton.style.display = 'none'; // Cacher le bouton
        animationShouldResume = false;
    })
}

// Fonction pour déplacer la caméra vers le bâtiment et commencer à tourner autour de celui-ci
function moveCameraToBuilding(target) {
    isCameraMoving = true; // Indiquer que la caméra est en mouvement

    new TWEEN.Tween(camera.position).to({
        x: target.x,
        y: target.y,
        z: target.z
    }, 2000).easing(TWEEN.Easing.Quartic.InOut).start()
    .onUpdate(function() {
        camera.lookAt(target);
    })
    .onComplete(function() {
        isCameraMoving = false; // Indiquer que la caméra a fini de se déplacer
        console.log(camera.position)
        rotateCameraAroundBuilding(target); // Commencer à faire tourner la caméra autour du bâtiment
    });
}

function rotateCameraAroundBuilding(target) {
    // checker si la caméra est en mouvement toute les 60ms
    if (!animationShouldResume) {
        return;
    }

    var angle = 0;
    var radius = 10; 

    function animate() {
        // Use Math.cos and Math.sin to set camera X and Z values based on angle. 
        camera.position.x = radius * Math.cos( angle );  
        camera.position.z = radius * Math.sin( angle );
        camera.lookAt( target ); // Look at the target
    }

    function render() {
        renderer.render( scene, camera );
    }

    function update() {
        if (!animationShouldResume) {
            return;
        }

        angle += 0.005; // Increment the angle
        animate(); // Call the animate function
        render(); // Call the render function
        requestAnimationFrame(update); // Call the update function
    }

    update(); // Call the update function
}

function setOrbitControlsLimits(){
    const currentPolarAngle = controls.getPolarAngle();

    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.minDistance = 15;
    controls.maxDistance = 50;
    controls.enablePan = true;
    controls.enableRotate = true;
    controls.enableZoom = false;
    controls.minPolarAngle = currentPolarAngle;
    controls.maxPolarAngle = currentPolarAngle;
}

function rendeLoop() {
    TWEEN.update()
    controls.update()
    renderer.render(scene, camera)
    requestAnimationFrame(rendeLoop)
}

rendeLoop()

