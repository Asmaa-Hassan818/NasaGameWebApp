import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

// ---------------- إعدادات عامة ----------------
const holeRadius = 1.2;
const houseScale = 1;

// ---------------- Item Limits (for 4 astronauts) ----------------
const ITEM_LIMITS = {
  'models/bed.glb': { 
    max: 4, 
    name: 'Sleeping Pod / Crew Quarters', 
    message: 'Maximum 4 sleeping pods (1 per astronaut)!' 
  },
  'models/crew_seat.glb': { 
    max: 4, 
    name: 'Crew Seat', 
    message: 'Maximum 4 crew seats (1 per astronaut)!' 
  },
  'models/crew_table.glb': { 
    max: 1, 
    name: 'Crew Table / Dining Surface', 
    message: 'Only 1 crew table allowed!' 
  },
  'models/personal_locker.glb': { 
    max: 4, 
    name: 'Personal Locker', 
    message: 'Maximum 4 personal lockers (1 per astronaut)!' 
  },
  'models/hygiene_station.glb': { 
    max: 2, 
    name: 'Hygiene Station / Sink', 
    message: 'Maximum 2 hygiene stations allowed!' 
  },
  'models/food_storage.glb': { 
    max: 4, 
    name: 'Food Storage / Refrigerated Locker', 
    message: 'Maximum 4 food storage lockers allowed!' 
  },
  'models/treadmill.glb': { 
    max: 1, 
    name: 'Treadmill', 
    message: 'Only 1 treadmill allowed!' 
  },
  'models/medical_station.glb': { 
    max: 1, 
    name: 'Medical / Science Workstation', 
    message: 'Only 1 medical workstation allowed!' 
  },
  'models/Oxygen_Cylinder.glb': { 
    max: 4, 
    name: 'Oxygen Supply Tank', 
    message: 'Maximum 4 oxygen tanks allowed (1 per astronaut)!' 
  },
  'models/plant_growth.glb': { 
    max: 1, 
    name: 'Plant Growth Chamber', 
    message: 'Only 1 plant growth chamber allowed!' 
  },      
  'models/door.glb': { 
    max: 1, 
    name: 'Pressure Door / Airlock', 
    message: 'Only 1 pressure door allowed!' 
  },
  'models/Spacesuit.glb': { 
    max: 4, 
    name: 'Spacesuit (EVA Suit)', 
    message: 'Maximum 4 spacesuits allowed (1 per astronaut)!' 
  },
};

// Track placed items count
const placedItemsCount = {};

function checkItemLimit(modelPath) {
  if (!ITEM_LIMITS[modelPath]) return true;
  
  const limit = ITEM_LIMITS[modelPath];
  const currentCount = placedItemsCount[modelPath] || 0;
  
  if (currentCount >= limit.max) {
    showLimitWarning(limit.message);
    return false;
  }
  return true;
}

function incrementItemCount(modelPath) {
  if (!placedItemsCount[modelPath]) {
    placedItemsCount[modelPath] = 0;
  }
  placedItemsCount[modelPath]++;
  updateItemCountDisplay();
}

function decrementItemCount(modelPath) {
  if (placedItemsCount[modelPath]) {
    placedItemsCount[modelPath]--;
    if (placedItemsCount[modelPath] < 0) placedItemsCount[modelPath] = 0;
  }
  updateItemCountDisplay();
}

function updateItemCountDisplay() {
  console.log('📊 Current Items:', placedItemsCount);
}

function showLimitWarning(message) {
  const warning = document.createElement('div');
  warning.style.position = 'fixed';
  warning.style.top = '50%';
  warning.style.left = '50%';
  warning.style.transform = 'translate(-50%, -50%)';
  warning.style.background = 'rgba(220, 53, 69, 0.95)';
  warning.style.color = 'white';
  warning.style.padding = '20px 30px';
  warning.style.borderRadius = '10px';
  warning.style.zIndex = '99999';
  warning.style.fontSize = '16px';
  warning.style.fontWeight = 'bold';
  warning.style.boxShadow = '0 4px 20px rgba(0,0,0,0.5)';
  warning.style.textAlign = 'center';
  warning.innerHTML = `⚠️ ${message}`;
  
  document.body.appendChild(warning);
  
  setTimeout(() => {
    warning.style.transition = 'opacity 0.3s';
    warning.style.opacity = '0';
    setTimeout(() => warning.remove(), 300);
  }, 2500);
}

// ---------------- Scene + Renderer ----------------
const container = document.getElementById('canvas-container');
if (!container) {
  console.error('لا يوجد عنصر #canvas-container في HTML');
}

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xa0a0a0);

const camera = new THREE.PerspectiveCamera(
  50,
  (window.innerWidth - 250) / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 15, 40);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio || 1);
renderer.setSize(window.innerWidth - 250, window.innerHeight);
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 5, 0);
controls.update();

// lighting
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const dir = new THREE.DirectionalLight(0xffffff, 0.8);
dir.position.set(10, 20, 10);
scene.add(dir);

const grid = new THREE.GridHelper(500, 500);
scene.add(grid);

// ---------------- Floors + invisible placement planes ----------------
const floors = {};
const floorPlanes = {};
for (let i = 1; i <= 3; i++) {
  const group = new THREE.Group();
  group.visible = false;

  const radiusTop = 7.8;
  const radiusBottom = 7.8;
  const height = 3;
  const radialSegments = 64;

  const cylinderGeo = new THREE.CylinderGeometry(
    radiusTop,
    radiusBottom,
    height,
    radialSegments,
    1,
    true
  );

  const cylinderMat = new THREE.MeshStandardMaterial({
    color: 0xb0c4de,
    side: THREE.DoubleSide
  });

  const cylinder = new THREE.Mesh(cylinderGeo, cylinderMat);
  cylinder.position.y = height / 2;
  cylinder.name = `houseShell_floor${i}`;
  group.add(cylinder);

  if (i === 1) {
    const geo = new THREE.CircleGeometry(7.8, 34);
    const mat = new THREE.MeshStandardMaterial({ color: 0xdddddd, side: THREE.DoubleSide });
    const floor = new THREE.Mesh(geo, mat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.name = `floorSurface_${i}`;
    group.add(floor);
  } else {
    const shape = new THREE.Shape();
    shape.absarc(0, 0, 7.8, 0, Math.PI * 2, false);

    const hole = new THREE.Path();
    hole.absarc(0, 0, holeRadius, 0, Math.PI * 2, true);
    shape.holes.push(hole);

    const geo = new THREE.ShapeGeometry(shape, 64);
    const mat = new THREE.MeshStandardMaterial({ color: 0xcccccc, side: THREE.DoubleSide });
    const floor = new THREE.Mesh(geo, mat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.name = `floorSurface_${i}`;
    group.add(floor);
  }

  const planeGeo = new THREE.PlaneGeometry(50, 50);
  const planeMat = new THREE.MeshStandardMaterial({ color: 0x888888, visible: false });
  const plane = new THREE.Mesh(planeGeo, planeMat);
  plane.rotation.x = -Math.PI / 2;
  plane.position.y = 0;
  plane.name = `placementPlane_${i}`;
  group.add(plane);

  group.scale.set(houseScale, houseScale, houseScale);

  floors[i] = group;
  floorPlanes[i] = plane;
  scene.add(group);
}

let currentFloor = 1;
function showFloor(floorNumber) {
  currentFloor = floorNumber;
  for (let i = 1; i <= 3; i++) floors[i].visible = i === floorNumber;
  document.querySelectorAll('.floor-menu').forEach((menu) => {
    menu.style.display = menu.dataset.floor == floorNumber ? 'block' : 'none';
  });
}
showFloor(1);

document.querySelectorAll('#floor-tabs button').forEach((btn) => {
  btn.addEventListener('click', () => showFloor(parseInt(btn.dataset.floor)));
});

// ---------------- Loader + DRACO ----------------
const loader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
loader.setDRACOLoader(dracoLoader);

// ---------------- Model cache & promises ----------------
const modelCache = {};
const modelPromises = {};

function loadGLTF(path) {
  if (modelCache[path]) return Promise.resolve(modelCache[path]);
  if (modelPromises[path]) return modelPromises[path];

  modelPromises[path] = new Promise((resolve, reject) => {
    loader.load(
      path,
      (gltf) => {
        modelCache[path] = gltf.scene;
        modelCache[path].traverse((c) => { c.matrixAutoUpdate = true; });
        resolve(gltf.scene);
      },
      undefined,
      (err) => {
        console.error('Failed to load model', path, err);
        reject(err);
      }
    );
  });

  return modelPromises[path];
}

// ---------------- Snapshot renderer ----------------
const offRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
offRenderer.setClearColor(0x000000, 0);
const SNAP_W = 160, SNAP_H = 120;
offRenderer.setSize(SNAP_W, SNAP_H);

function createSnapshotForObject(object3D, imgEl) {
  const tmpScene = new THREE.Scene();
  const tmpLight = new THREE.DirectionalLight(0xffffff, 1);
  tmpLight.position.set(5, 10, 7);
  tmpScene.add(tmpLight);
  tmpScene.add(new THREE.AmbientLight(0xffffff, 0.6));

  const clone = object3D.clone(true);
  tmpScene.add(clone);

  const bbox = new THREE.Box3().setFromObject(clone);
  const size = new THREE.Vector3();
  bbox.getSize(size);
  const center = new THREE.Vector3();
  bbox.getCenter(center);

  const maxDim = Math.max(size.x, size.y, size.z);
  const fov = 45;
  const cam = new THREE.PerspectiveCamera(fov, SNAP_W / SNAP_H, 0.1, 1000);

  let distance = 2;
  if (maxDim > 0) {
    distance = maxDim / (2 * Math.tan((fov * Math.PI) / 360));
    distance *= 1.8;
  } else {
    distance = 3;
  }

  cam.position.set(center.x + distance, center.y + distance * 0.6, center.z + distance);
  cam.lookAt(center);
  cam.updateProjectionMatrix();

  offRenderer.render(tmpScene, cam);

  try {
    const data = offRenderer.domElement.toDataURL('image/png');
    imgEl.src = data;
  } catch (err) {
    console.warn('Snapshot failed:', err);
    imgEl.style.background = '#444';
  }

  tmpScene.remove(clone);
}

// ---------------- Preload all item models ----------------
const itemElements = Array.from(document.querySelectorAll('.item'));
const uniquePaths = Array.from(
  new Set(itemElements.map((it) => it.dataset.model).filter(Boolean))
);

async function preloadAndSnapshotAll() {
  for (const path of uniquePaths) {
    const itemEls = itemElements.filter((it) => it.dataset.model === path);
    itemEls.forEach((it) => {
      if (!it.querySelector('img')) {
        const i = document.createElement('img');
        i.width = SNAP_W / 2;
        i.height = SNAP_H / 2;
        it.insertBefore(i, it.firstChild);
      }
    });

    try {
      const sceneObj = await loadGLTF(path);
      itemEls.forEach((it) => {
        const imgEl = it.querySelector('img');
        if (imgEl) createSnapshotForObject(sceneObj, imgEl);
      });
      console.log('Preloaded & snapshot:', path);
    } catch (err) {
      console.error('Preload failed for', path, err);
      itemEls.forEach((it) => {
        const imgEl = it.querySelector('img');
        if (imgEl) {
          imgEl.alt = 'failed';
          imgEl.style.background = '#333';
        }
      });
    }
  }
}
preloadAndSnapshotAll();

// ---------------- Drag & Drop ----------------
let draggedModelPath = null;
let isReadyToPlace = false;

itemElements.forEach((item) => {
  item.setAttribute('draggable', 'true');
  
  item.addEventListener('dragstart', (ev) => {
    draggedModelPath = item.dataset.model;
    isReadyToPlace = true;
    const img = item.querySelector('img');
    if (img) ev.dataTransfer.setDragImage(img, img.width / 2, img.height / 2);
    console.log('🎯 Dragging:', draggedModelPath);
  });
  
  item.addEventListener('dragend', () => {
    console.log('✓ Drag ended');
  });
});

// Allow drop on canvas
renderer.domElement.addEventListener('dragover', (e) => {
  if (draggedModelPath) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }
});

renderer.domElement.addEventListener('drop', async (e) => {
  e.preventDefault();
  
  if (!draggedModelPath || !isReadyToPlace) {
    console.warn('No model to place');
    return;
  }

  console.log('📦 Attempting to place:', draggedModelPath);

  // Check limit before placing
  if (!checkItemLimit(draggedModelPath)) {
    draggedModelPath = null;
    isReadyToPlace = false;
    return;
  }

  const rect = renderer.domElement.getBoundingClientRect();
  const mouse = new THREE.Vector2(
    ((e.clientX - rect.left) / rect.width) * 2 - 1,
    -((e.clientY - rect.top) / rect.height) * 2 + 1
  );

  let originalScene;
  try {
    originalScene = await loadGLTF(draggedModelPath);
  } catch (err) {
    console.error('❌ Failed to load model:', draggedModelPath, err);
    draggedModelPath = null;
    isReadyToPlace = false;
    return;
  }

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);
  const plane = floorPlanes[currentFloor];
  const intersects = raycaster.intersectObject(plane);
  
  if (intersects.length === 0) {
    console.warn('⚠️ No intersection with floor plane');
    draggedModelPath = null;
    isReadyToPlace = false;
    return;
  }

  const point = intersects[0].point.clone();
  const localPoint = floors[currentFloor].worldToLocal(point.clone());

  // Check if inside house
  if (!isInsideHouse(localPoint)) {
    showLimitWarning('⚠️ Cannot place items outside the house!');
    draggedModelPath = null;
    isReadyToPlace = false;
    return;
  }

  const model = originalScene.clone(true);
  model.traverse((c) => { 
    c.matrixAutoUpdate = true;
    c.frustumCulled = false;
  });
  model.userData.placed = true;
  model.userData.modelPath = draggedModelPath;
  model.scale.set(1.5, 1.5, 1.5);

  const bbox = new THREE.Box3().setFromObject(model);
  const min = bbox.min;
  const yOffset = -min.y;
  
  model.position.set(localPoint.x, localPoint.y + yOffset + 0.01, localPoint.z);
  model.rotation.set(0, 0, 0);

  floors[currentFloor].add(model);
  incrementItemCount(draggedModelPath);

  console.log(`✅ Placed ${draggedModelPath} successfully!`);

  openPositionEditorForModel(model);

  draggedModelPath = null;
  isReadyToPlace = false;
});

const effectiveHouseRadius = 7.8 * houseScale;

function isInsideHouse(localPoint) {
  const horizDist = Math.sqrt(localPoint.x * localPoint.x + localPoint.z * localPoint.z);
  return horizDist <= effectiveHouseRadius * 0.9;
}

// ---------------- Position Editor + Selection ----------------
let selectedItem = null;
let selectedOutline = null;
let isDragging = false;

const positionEditor = document.createElement("div");
positionEditor.style.position = "absolute";
positionEditor.style.top = "10px";
positionEditor.style.right = "10px";
positionEditor.style.padding = "15px";
positionEditor.style.background = "rgba(20,20,20,0.95)";
positionEditor.style.color = "#fff";
positionEditor.style.display = "none";
positionEditor.style.zIndex = "9999";
positionEditor.style.borderRadius = "8px";
positionEditor.style.fontFamily = "Arial, sans-serif";
positionEditor.style.minWidth = "220px";
positionEditor.style.boxShadow = "0 4px 12px rgba(0,0,0,0.5)";
positionEditor.innerHTML = `
  <div style="margin-bottom: 12px; font-weight: bold; border-bottom: 2px solid #4CAF50; padding-bottom: 8px; font-size: 16px;">
    🎯 Item Editor
  </div>
  
  <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 4px; margin-bottom: 10px;">
    <div style="font-size: 13px; color: #aaa; margin-bottom: 8px;">Rotation (Degrees)</div>
    <div style="display: flex; align-items: center; gap: 8px;">
      <button id="rotLeft" style="padding: 8px 12px; background: #555; border: none; color: #fff; cursor: pointer; border-radius: 4px; font-size: 18px;">◀</button>
      <input type="number" step="15" id="rotY" style="flex: 1; padding: 6px; background: #333; color: #fff; border: 1px solid #555; border-radius: 3px; text-align: center;">
      <button id="rotRight" style="padding: 8px 12px; background: #555; border: none; color: #fff; cursor: pointer; border-radius: 4px; font-size: 18px;">▶</button>
    </div>
  </div>

  <div style="margin-top: 15px; display: flex; flex-direction: column; gap: 8px;">
    <button id="duplicateItem" style="width: 100%; padding: 10px; background: #2196F3; color: white; border: none; cursor: pointer; border-radius: 4px; font-weight: bold;">📋 Duplicate</button>
    <button id="deleteItem" style="width: 100%; padding: 10px; background: #f44336; color: white; border: none; cursor: pointer; border-radius: 4px; font-weight: bold;">🗑 Delete</button>
    <button id="closeEditor" style="width: 100%; padding: 8px; background: #666; color: white; border: none; cursor: pointer; border-radius: 4px;">Close</button>
  </div>
  
  <div style="margin-top: 10px; font-size: 11px; color: #888; border-top: 1px solid #444; padding-top: 8px;">
    💡 <strong>Shift + Drag</strong> to move item<br>
    💡 <strong>Double-click</strong> to select
  </div>
`;
document.body.appendChild(positionEditor);

const closeEditorBtn = document.getElementById("closeEditor");
const deleteBtn = document.getElementById("deleteItem");
const duplicateBtn = document.getElementById("duplicateItem");
const rotLeftBtn = document.getElementById("rotLeft");
const rotRightBtn = document.getElementById("rotRight");
const rotYInput = document.getElementById("rotY");

function openPositionEditorForModel(model) {
  selectedItem = model;
  
  if (selectedOutline) {
    scene.remove(selectedOutline);
    selectedOutline = null;
  }
  
  selectedOutline = new THREE.BoxHelper(selectedItem, 0x00ff00);
  selectedOutline.matrixAutoUpdate = true;
  scene.add(selectedOutline);

  updateEditorInputs();
  positionEditor.style.display = "block";
  
  console.log("✓ Item selected - Rotation:", THREE.MathUtils.radToDeg(selectedItem.rotation.y).toFixed(1) + "°");
}

function updateEditorInputs() {
  if (!selectedItem) return;
  rotYInput.value = Math.round(THREE.MathUtils.radToDeg(selectedItem.rotation.y));
}

// Rotate buttons
rotLeftBtn.addEventListener("click", () => {
  if (!selectedItem) return;
  selectedItem.rotation.y -= THREE.MathUtils.degToRad(15);
  updateEditorInputs();
  console.log("↺ Rotated left:", Math.round(THREE.MathUtils.radToDeg(selectedItem.rotation.y)) + "°");
});

rotRightBtn.addEventListener("click", () => {
  if (!selectedItem) return;
  selectedItem.rotation.y += THREE.MathUtils.degToRad(15);
  updateEditorInputs();
  console.log("↻ Rotated right:", Math.round(THREE.MathUtils.radToDeg(selectedItem.rotation.y)) + "°");
});

rotYInput.addEventListener("change", () => {
  if (!selectedItem) return;
  const deg = parseFloat(rotYInput.value);
  if (!isNaN(deg)) {
    selectedItem.rotation.y = THREE.MathUtils.degToRad(deg);
    console.log("↻ Rotation set to:", deg + "°");
  }
});

// Duplicate button
duplicateBtn.addEventListener("click", () => {
  if (!selectedItem || !selectedItem.userData.modelPath) return;
  
  const modelPath = selectedItem.userData.modelPath;
  
  // Check limit
  if (!checkItemLimit(modelPath)) {
    return;
  }
  
  // Clone the selected item
  const duplicate = selectedItem.clone(true);
  duplicate.traverse((c) => { 
    c.matrixAutoUpdate = true;
    c.frustumCulled = false;
  });
  duplicate.userData.placed = true;
  duplicate.userData.modelPath = modelPath;
  
  // Offset position slightly
  duplicate.position.set(
    selectedItem.position.x + 0.5,
    selectedItem.position.y,
    selectedItem.position.z + 0.5
  );
  
  floors[currentFloor].add(duplicate);
  incrementItemCount(modelPath);
  
  console.log("📋 Duplicated item");
  
  // Select the new duplicate
  openPositionEditorForModel(duplicate);
});

// Delete button
deleteBtn.addEventListener("click", () => {
  if (!selectedItem) return;
  
  if (confirm("Delete this item?")) {
    const modelPath = selectedItem.userData.modelPath;
    
    if (selectedItem.parent) {
      selectedItem.parent.remove(selectedItem);
    }
    
    if (selectedOutline) {
      scene.remove(selectedOutline);
      selectedOutline = null;
    }
    
    if (modelPath) {
      decrementItemCount(modelPath);
    }
    
    positionEditor.style.display = "none";
    selectedItem = null;
    
    console.log("🗑 Item deleted");
  }
});

// Close editor button
closeEditorBtn.addEventListener("click", () => {
  positionEditor.style.display = "none";
  if (selectedOutline) {
    scene.remove(selectedOutline);
    selectedOutline = null;
  }
  selectedItem = null;
});

// Double-click selection
renderer.domElement.addEventListener("dblclick", (event) => {
  const rect = renderer.domElement.getBoundingClientRect();
  const mouse = new THREE.Vector2(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1
  );
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(scene.children, true);
  if (intersects.length === 0) return;

  let found = null;
  for (const it of intersects) {
    let obj = it.object;
    while (obj.parent && obj.parent !== floors[currentFloor]) {
      obj = obj.parent;
    }
    if (obj.parent === floors[currentFloor] && obj.userData && obj.userData.placed) {
      found = obj;
      break;
    }
  }

  if (!found) return;

  found.traverse((c) => { c.matrixAutoUpdate = true; });
  openPositionEditorForModel(found);
});

// Visual drag with Shift key
let dragStartPos = new THREE.Vector3();

renderer.domElement.addEventListener("mousedown", (event) => {
  if (!event.shiftKey || !selectedItem) return;
  
  isDragging = true;
  controls.enabled = false;
  dragStartPos.copy(selectedItem.position);
});

renderer.domElement.addEventListener("mousemove", (event) => {
  if (!isDragging || !selectedItem) return;
  
  const rect = renderer.domElement.getBoundingClientRect();
  const mouse = new THREE.Vector2(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1
  );
  
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);
  const plane = floorPlanes[currentFloor];
  const intersects = raycaster.intersectObject(plane);
  
  if (intersects.length > 0) {
    const localPoint = floors[currentFloor].worldToLocal(intersects[0].point.clone());
    
    // Check if inside house
    if (isInsideHouse(localPoint)) {
      selectedItem.position.x = localPoint.x;
      selectedItem.position.z = localPoint.z;
    }
  }
});

renderer.domElement.addEventListener("mouseup", () => {
  if (isDragging) {
    isDragging = false;
    controls.enabled = true;
    
    // Check final position
    if (!isInsideHouse(selectedItem.position)) {
      selectedItem.position.copy(dragStartPos);
      showLimitWarning('⚠️ Cannot move items outside the house!');
    }
    
    console.log("✓ Drag complete - Position:", selectedItem.position);
  }
});

// Update outline every frame
function updateOutline() {
  if (selectedOutline && selectedItem) {
    selectedOutline.update();
  }
}

// ---------------- animate ----------------
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  updateOutline();
  renderer.render(scene, camera);
}
animate();

// ---------------- resize ----------------
window.addEventListener('resize', () => {
  camera.aspect = (window.innerWidth - 250) / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth - 250, window.innerHeight);
});