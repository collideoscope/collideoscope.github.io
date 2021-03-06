var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 8;
let WorldZRotation = 0;
const Z_AXIS = new THREE.Vector3(0, 0, 1);

let inLosingState = false;
let inPracticeMode = false;
let recordDistance = 0;

var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

window.addEventListener('resize', event => {
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 8;
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.render(scene, camera);
});

let CYLINDER_PARITY = false;
const NUM_STARTING_CYLINDERS = 2;

// set up objects in scene
const enclosingCylinders = [
    NewPieCylinder(0),
    NewPieCylinder(-CYLINDER_HEIGHT, true),
];

// const endcap = NewCylinderEndcap();
// endcap.position.z = -CYLINDER_HEIGHT;
// scene.add(endcap);

const barriers = [];

const NUM_STARTING_BARRIERS = 16;
const BARRIER_STARTING_Z = 0;
const BARRIER_Z_INCREMENT = 8;
for (let i = 0; i < NUM_STARTING_BARRIERS; ++i) {
    barriers.push(NewRandomPieBarrier(BARRIER_STARTING_Z - i * BARRIER_Z_INCREMENT));
}

enclosingCylinders.forEach(obj => scene.add(obj));
barriers.forEach(obj => scene.add(obj));

const CAMERA_DISTANCE_FROM_PLAYER = 1;

const player = NewPlayer();
player.position.z = camera.position.z - CAMERA_DISTANCE_FROM_PLAYER;
scene.add(player);

// set up lights
const lights = [];

const cameraLight = new THREE.PointLight(0xffffff, 1, 100, 0);
cameraLight.position.set(0, 0, camera.position.z + 1);
lights.push(cameraLight);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
lights.push(ambientLight);

// const directionalLight = new THREE.DirectionalLight(0xffffff, 100);
// directionalLight.position.set(0, 0, -6);
// lights.push(directionalLight);
// const centerLight = new THREE.PointLight(0xffffff, 0.3, 100);
// centerLight.position.set(0, 0, 0);
// lights.push(centerLight);

lights.forEach(l => scene.add(l));

// addKeyAction takes a {key, keyCode}, onDown function, and onUp function, 
// and together with the later addEventListener calls, makes it so that
// onDown is called when the key is first pressed, and onUp
// is called when the key is released. Actions are not resent by holding the key.
const keyActions = [];
function addKeyAction(keySpec, onDown, onUp) {
    const action = {
        keySpec,
        onDown,
        onUp,
        isRepeat: false,
    };
    keyActions.push(action);
}

let isPaused = false;

// add key actions
const aka = addKeyAction;
// https://keycode.info
const ArrowLeft = { key: "ArrowLeft", keyCode: 37, isPressed: false };
const ArrowRight = { key: "ArrowRight", keyCode: 39, isPressed: false };
const ArrowUp = { key: "ArrowUp", keyCode: 38, isPressed: false };
const ArrowDown = { key: "ArrowDown", keyCode: 40, isPressed: false };
const KeyA = { key: "a", keyCode: 65, isPressed: false };
const KeyD = { key: "d", keyCode: 68, isPressed: false };
const KeyW = { key: "w", keyCode: 87, isPressed: false };
const KeyS = { key: "s", keyCode: 83, isPressed: false };
const Space = { key: "Space", keyCode: 32, isPressed: false };
const KeyP = { key: "p", keyCode: 80, isPressed: false };
const Enter = { key: "Enter", keyCode: 13, isPressed: false };
const boundKeys = [
    ArrowLeft,
    ArrowRight,
    ArrowUp,
    ArrowDown,
    KeyA,
    KeyD,
    KeyW,
    KeyS,
    Space
];

const Escape = { key: "Escape", keyCode: 27, isPressed: false };

const pausemenu = document.getElementById("pausemenu");
const currspeednode = document.getElementById("currspeed");
const speedmenu = document.getElementById("speedmenu");

function watchKey(keyObj) {
    aka(
        keyObj,
        event => { keyObj.isPressed = true },
        event => { keyObj.isPressed = false },
    );
}

boundKeys.forEach(watchKey);
const pauseOrUnpause = event => {
    if (inLosingState) {
        return;
    }

    if (!isPaused) {
        // becoming paused
        pausemenu.classList.add("ispaused");
        isPaused = true;

    } else {
        // becoming unpaused
        pausemenu.classList.remove("ispaused");
        isPaused = false;
    }
};

const losemenu = document.getElementById("losemenu");
const scoreboard = document.getElementById("scoreboard");
const record = document.getElementById("record");
function youLose() {
    if (inLosingState || inPracticeMode) {
        return;
    }
    inLosingState = true;
    scoreboard.textContent = `${Math.round(zDisplacement - zWhenStartedLife)}`;

    recordDistance = Math.max(zDisplacement - zWhenStartedLife, recordDistance);
    record.textContent = `${Math.round(recordDistance)}`;

    losemenu.classList.add("ispaused");
    currentSpeed = MIN_Z_SPEED;
}
function restartAfterLoss() {
    Space.isPressed = false;
    zWhenStartedLife = zDisplacement;
    losemenu.classList.remove('ispaused');
    inLosingState = false;
}

addKeyAction(
    Escape,
    pauseOrUnpause,
    event => { },
);

const practicemodetext = document.getElementById("practicemode");
addKeyAction(
    KeyP,
    event => {
        if (inPracticeMode) {
            practicemodetext.classList.remove("ispractice");
            speedmenu.classList.remove("ispractice");
            inPracticeMode = false;
            zWhenStartedLife = zDisplacement;
            currentSpeed = MIN_Z_SPEED;
        } else {
            inPracticeMode = true;
            practicemodetext.classList.add("ispractice");
            speedmenu.classList.add("ispractice");
        }
    },
    event => { },
);
addKeyAction(
    Space,
    event => {
        if (isPaused) {
            pausemenu.classList.remove("ispaused");
            isPaused = false;
        }
        if (inLosingState) { restartAfterLoss(); }
    },
    event => { },
);
addKeyAction(
    Enter,
    event => {
        restartAfterLoss()
    },
    event => { },
)

pauseOrUnpause();
renderer.render(scene, camera);

document.addEventListener('keydown', (event) => {
    keyActions.forEach((action) => {
        const { keySpec, onDown, isRepeat } = action;
        const { key, keyCode } = keySpec;
        if (event.key == key || event.keyCode == keyCode) {
            event.preventDefault();
            if (isRepeat) {
                return;
            } else {
                action.isRepeat = true;
            }
            onDown(event);
        }
    });
});

document.addEventListener('keyup', (event) => {
    keyActions.forEach((action) => {
        const { keySpec, onUp } = action;
        const { key, keyCode } = keySpec;
        if (event.key == key || event.keyCode == keyCode) {
            action.isRepeat = false;
            event.preventDefault();
            onUp(event);
        }
    })
});

let zDisplacement = 0;
let prevZDisplacement = 0;
let zWhenStartedLife = zDisplacement;

let zDispAtPrevBarrierAddition = 0;
const ROTATION_SPEED = 0.01;
const MIN_Z_SPEED = 0.0675;
const MAX_Z_SPEED = 0.1494;
let currentSpeed = MIN_Z_SPEED;

function increaseDifficulty() {
    if (!inPracticeMode && currentSpeed < MAX_Z_SPEED) {
        currentSpeed += 0.00006;
    }
}

// animate/render loop
function mainAnimationLoop() {
    requestAnimationFrame(mainAnimationLoop);

    // update rotation and depth velocity
    let rotZ = 0;
    if (inLosingState) {
        currentSpeed = MIN_Z_SPEED;
    } else {
        if (ArrowRight.isPressed) {
            rotZ += -ROTATION_SPEED;
            rotating = true;
            clockwise = true;
        }
        if (ArrowLeft.isPressed) {
            rotZ += ROTATION_SPEED;
            rotating = true;
            clockwise = false;
        }

        if (Space.isPressed) {
            jumped = true;
        }

        if (inPracticeMode) {
            if (ArrowUp.isPressed) {
                currentSpeed = Math.min(MAX_Z_SPEED, currentSpeed + 0.001);
            }
            if (ArrowDown.isPressed) {
                currentSpeed = Math.max(0, currentSpeed - 0.001);
            }
            currspeednode.textContent = `${Math.floor(currentSpeed * 600 * 2.23694) / 10}`;
        }

        if (isPaused) {
            return;
        }
    }

    // move the camera, lights, and player
    WorldZRotation += rotZ;
    [...barriers, ...enclosingCylinders].forEach(obj => {
        obj.rotateOnWorldAxis(Z_AXIS, rotZ);
        obj.position.z += currentSpeed;
    });

    zDisplacement += currentSpeed;

    // destroy barriers that are behind the camera
    while (barriers[0] && barriers[0].position.z > camera.position.z) {
        // add new barrier to replace the old one
        const newBarrier = NewRandomPieBarrier(barriers[barriers.length - 1].position.z - BARRIER_Z_INCREMENT);
        barriers.push(newBarrier);
        scene.add(newBarrier);

        // dispose of old barrier
        scene.remove(barriers[0]);
        barriers.shift();
    }

    // destroy cylinders that are behind the camera
    while (enclosingCylinders[0] && enclosingCylinders[0].position.z > camera.position.z + CYLINDER_HEIGHT / 2) {
        // add new cylinder to replace the old one
        const newCylinder = NewPieCylinder(enclosingCylinders[enclosingCylinders.length - 1].position.z - CYLINDER_HEIGHT, CYLINDER_PARITY);
        CYLINDER_PARITY = !CYLINDER_PARITY;
        enclosingCylinders.push(newCylinder);
        scene.add(newCylinder);
        newCylinder.rotateOnWorldAxis(Z_AXIS, WorldZRotation);

        // dispose of old cylinder
        scene.remove(enclosingCylinders[0]);
        enclosingCylinders.shift();
    }

    // reposition camera based on player
    playerXY = player.position.clone().setZ(0);
    const cameraXY = camera.position.clone().setZ(0);
    const disp = new THREE.Vector3().subVectors(playerXY, cameraXY);
    const desiredSpeed = disp.length() ** 2;
    disp.setLength(desiredSpeed);
    camera.position.add(disp);

    // but then adjust camera back toward center of tube by a little bit
    camera.position.lerp(new THREE.Vector3(0, 0, camera.position.z), 0.1);
    camera.position.z = CAMERA_DISTANCE_FROM_PLAYER + player.position.z;

    simulatePhysics();

    // check collisions
    for (let i = 0; i < barriers.length; ++i) {
        const currBarrier = barriers[i];
        if (currBarrier.position.z < player.position.z - 4) {
            break;
        }
        currBarrier.checkCollision(player);
    }

    renderer.render(scene, camera);
    animate();
    increaseDifficulty();

    SingletonKaleidoscopeTexture.needsUpdate = true;
    prevZDisplacement = zDisplacement;
}
mainAnimationLoop();
