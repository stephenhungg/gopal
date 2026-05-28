import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { VRMLoaderPlugin, VRMUtils } from "@pixiv/three-vrm";

export class GopalVrmStage {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.modelUrl = options.modelUrl || "/models/goblin.vrm";
    this.clock = new THREE.Clock();
    this.mood = "idle";
    this.speaking = false;
    this.mouth = 0;
    this.targetMouth = 0;
    this.loaded = false;
    this.mixer = null;
    this.animationActions = new Map();
    this.currentAction = null;
    this.animationReturnTimer = null;

    this.scene = new THREE.Scene();
    this.scene.background = null;

    this.camera = new THREE.PerspectiveCamera(26, 1, 0.1, 100);
    this.camera.position.set(0, 1.15, 4.15);

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance"
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.enablePan = false;
    this.controls.enableZoom = false;
    this.controls.target.set(0, 0.95, 0);

    this.scene.add(new THREE.HemisphereLight(0xeaffc8, 0x25321d, 3.0));

    const key = new THREE.DirectionalLight(0xffffff, 4.0);
    key.position.set(1.5, 2.5, 2.5);
    this.scene.add(key);

    const rim = new THREE.DirectionalLight(0x94ff4f, 2.2);
    rim.position.set(-2, 1.2, -1.4);
    this.scene.add(rim);

    window.addEventListener("resize", () => this.resize());
    this.resize();
  }

  async load() {
    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));

    const gltf = await loader.loadAsync(this.modelUrl);
    const vrm = gltf.userData.vrm;
    VRMUtils.removeUnnecessaryVertices(gltf.scene);
    VRMUtils.removeUnnecessaryJoints(gltf.scene);

    this.vrm = vrm;
    this.scene.add(vrm.scene);
    this.mixer = new THREE.AnimationMixer(vrm.scene);
    vrm.scene.rotation.y = Math.PI;
    vrm.scene.position.set(0, 0, 0);
    this.fitModel(vrm.scene);
    this.poseModel(vrm);
    this.loaded = true;
    this.animate();
  }

  async loadAnimations(animationMap) {
    if (!this.vrm) throw new Error("load the VRM before loading animations");

    const loader = new FBXLoader();
    for (const [name, url] of Object.entries(animationMap)) {
      const fbx = await loader.loadAsync(url);
      const clip = this.createVrmClip(name, fbx, fbx.animations[0]);
      const action = this.mixer.clipAction(clip);
      action.loop = name === "dance" ? THREE.LoopRepeat : THREE.LoopOnce;
      action.clampWhenFinished = name !== "dance";
      this.animationActions.set(name, action);
    }

    this.mixer.addEventListener("finished", () => {
      this.currentAction = null;
    });
  }

  createVrmClip(name, fbx, sourceClip) {
    if (!sourceClip) throw new Error(`missing animation clip for ${name}`);

    const tracks = [];
    const hipsMotion = findFbxBone(fbx, "Hips");
    const motionHipsHeight = Math.max(Math.abs(hipsMotion?.position.y || 1), 1);
    const vrmHips = this.vrm.humanoid.getNormalizedBoneNode("hips");
    const vrmHipsWorld = new THREE.Vector3();
    const vrmRootWorld = new THREE.Vector3();
    vrmHips?.getWorldPosition(vrmHipsWorld);
    this.vrm.scene.getWorldPosition(vrmRootWorld);
    const hipsScale = Math.max(Math.abs(vrmHipsWorld.y - vrmRootWorld.y), 0.01) / motionHipsHeight;

    for (const track of sourceClip.tracks) {
      const parsed = parseTrackName(track.name);
      const humanoidName = mixamoToVrmBone[parsed.bone];
      if (!humanoidName) continue;

      const node = this.vrm.humanoid.getNormalizedBoneNode(humanoidName);
      if (!node) continue;
      const fbxBone = findFbxBone(fbx, parsed.rawBone);

      if (parsed.property === "quaternion") {
        if (!fbxBone) continue;
        const values = retargetQuaternionTrack(track, fbxBone);
        tracks.push(new THREE.QuaternionKeyframeTrack(`${node.name}.quaternion`, track.times, values));
      }

      if (parsed.property === "position" && humanoidName === "hips") {
        const values = new Float32Array(track.values.length);
        for (let i = 0; i < track.values.length; i += 3) {
          values[i] = track.values[i] * hipsScale;
          values[i + 1] = track.values[i + 1] * hipsScale;
          values[i + 2] = track.values[i + 2] * hipsScale;
        }
        tracks.push(new THREE.VectorKeyframeTrack(`${node.name}.position`, track.times, values));
      }
    }

    if (!tracks.length) throw new Error(`no compatible tracks found for ${name}`);
    return new THREE.AnimationClip(name, sourceClip.duration, tracks);
  }

  playAnimation(name, options = {}) {
    const action = this.animationActions.get(name);
    if (!action || !this.mixer) return false;

    const fade = options.fade ?? 0.18;
    const previous = this.currentAction;
    if (previous === action && name !== "idle") action.reset();
    if (previous && previous !== action) previous.fadeOut(fade);

    action.reset().fadeIn(fade).play();
    this.currentAction = action;

    window.clearTimeout(this.animationReturnTimer);
    if (name === "dance") {
      this.animationReturnTimer = window.setTimeout(() => {
        action.fadeOut(0.25);
        if (this.currentAction === action) this.currentAction = null;
      }, options.durationMs || 4200);
    }

    return true;
  }

  fitModel(object) {
    const box = new THREE.Box3().setFromObject(object);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    object.position.x -= center.x;
    object.position.z -= center.z;
    object.position.y -= box.min.y;

    const scale = 1.48 / Math.max(size.y, 0.001);
    object.scale.setScalar(scale);
  }

  poseModel(vrm) {
    const leftUpperArm = vrm.humanoid.getNormalizedBoneNode("leftUpperArm");
    const rightUpperArm = vrm.humanoid.getNormalizedBoneNode("rightUpperArm");
    const leftLowerArm = vrm.humanoid.getNormalizedBoneNode("leftLowerArm");
    const rightLowerArm = vrm.humanoid.getNormalizedBoneNode("rightLowerArm");

    if (leftUpperArm) leftUpperArm.rotation.z = 1.18;
    if (rightUpperArm) rightUpperArm.rotation.z = -1.18;
    if (leftLowerArm) leftLowerArm.rotation.z = 0.18;
    if (rightLowerArm) rightLowerArm.rotation.z = -0.18;
  }

  bindRuntime(runtime) {
    runtime.addEventListener("mood", (event) => {
      this.setMood(event.detail.mood);
    });
    runtime.addEventListener("status", (event) => {
      if (event.detail.status === "offline") this.setMood("idle");
    });
  }

  setMood(mood) {
    this.mood = mood || "idle";
    this.speaking = this.mood === "speaking";
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();
    const t = this.clock.elapsedTime;
    this.controls.update();
    this.mixer?.update(delta);
    this.vrm?.update(delta);

    if (this.vrm) {
      const root = this.vrm.scene;
      const animationWeight = this.currentAction?.getEffectiveWeight() ?? 0;
      const bobSpeed = this.speaking ? 10 : this.mood === "thinking" ? 3.4 : 1.6;
      const bobAmount = this.speaking ? 0.032 : this.mood === "listening" ? 0.012 : 0.008;
      if (animationWeight < 0.35) {
        root.position.y = Math.sin(t * bobSpeed) * bobAmount;
        root.rotation.z = Math.sin(t * 1.7) * 0.025;
      }

      this.targetMouth = this.speaking ? 0.28 + Math.abs(Math.sin(t * 18)) * 0.72 : 0;
      this.mouth += (this.targetMouth - this.mouth) * 0.32;
      this.setExpression("aa", this.mouth);
      this.setExpression("happy", this.mood === "speaking" ? 0.28 : 0);
      this.setExpression("relaxed", this.mood === "listening" ? 0.18 : 0);
      this.setExpression("surprised", this.mood === "thinking" ? 0.2 : 0);
    }

    this.renderer.render(this.scene, this.camera);
  }

  setExpression(name, value) {
    const expressionManager = this.vrm?.expressionManager;
    if (!expressionManager) return;
    try {
      expressionManager.setValue(name, value);
    } catch {
      // VRM models do not all ship the same expression presets.
    }
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }
}

function parseTrackName(trackName) {
  const dot = trackName.lastIndexOf(".");
  const rawBone = dot === -1 ? trackName : trackName.slice(0, dot);
  const property = dot === -1 ? "" : trackName.slice(dot + 1);
  return {
    rawBone,
    bone: rawBone.replace(/^.*:/, "").replace(/^mixamorig/i, "").replace(/[^a-z0-9]/gi, "").toLowerCase(),
    property
  };
}

function findFbxBone(fbx, name) {
  const exact = fbx.getObjectByName(name);
  if (exact) return exact;

  const normalized = name.replace(/^.*:/, "").replace(/^mixamorig/i, "").replace(/[^a-z0-9]/gi, "").toLowerCase();
  let found = null;
  fbx.traverse((node) => {
    if (found) return;
    const nodeName = node.name.replace(/^.*:/, "").replace(/^mixamorig/i, "").replace(/[^a-z0-9]/gi, "").toLowerCase();
    if (nodeName === normalized) found = node;
  });
  return found;
}

function retargetQuaternionTrack(track, fbxBone) {
  const restRotationInverse = new THREE.Quaternion();
  const parentRestWorldRotation = new THREE.Quaternion();
  const key = new THREE.Quaternion();
  const values = new Float32Array(track.values.length);

  fbxBone.getWorldQuaternion(restRotationInverse).invert();
  fbxBone.parent?.getWorldQuaternion(parentRestWorldRotation);

  for (let i = 0; i < track.values.length; i += 4) {
    key.fromArray(track.values, i);
    key.premultiply(parentRestWorldRotation).multiply(restRotationInverse);
    key.toArray(values, i);
  }

  return values;
}

const mixamoToVrmBone = {
  hips: "hips",
  spine: "spine",
  spine1: "chest",
  spine2: "upperChest",
  neck: "neck",
  head: "head",
  leftshoulder: "leftShoulder",
  leftarm: "leftUpperArm",
  leftforearm: "leftLowerArm",
  lefthand: "leftHand",
  rightshoulder: "rightShoulder",
  rightarm: "rightUpperArm",
  rightforearm: "rightLowerArm",
  righthand: "rightHand",
  leftupleg: "leftUpperLeg",
  leftleg: "leftLowerLeg",
  leftfoot: "leftFoot",
  lefttoebase: "leftToes",
  rightupleg: "rightUpperLeg",
  rightleg: "rightLowerLeg",
  rightfoot: "rightFoot",
  righttoebase: "rightToes",
  lefthandthumb1: "leftThumbMetacarpal",
  lefthandthumb2: "leftThumbProximal",
  lefthandthumb3: "leftThumbDistal",
  lefthandindex1: "leftIndexProximal",
  lefthandindex2: "leftIndexIntermediate",
  lefthandindex3: "leftIndexDistal",
  lefthandmiddle1: "leftMiddleProximal",
  lefthandmiddle2: "leftMiddleIntermediate",
  lefthandmiddle3: "leftMiddleDistal",
  lefthandring1: "leftRingProximal",
  lefthandring2: "leftRingIntermediate",
  lefthandring3: "leftRingDistal",
  lefthandpinky1: "leftLittleProximal",
  lefthandpinky2: "leftLittleIntermediate",
  lefthandpinky3: "leftLittleDistal",
  righthandthumb1: "rightThumbMetacarpal",
  righthandthumb2: "rightThumbProximal",
  righthandthumb3: "rightThumbDistal",
  righthandindex1: "rightIndexProximal",
  righthandindex2: "rightIndexIntermediate",
  righthandindex3: "rightIndexDistal",
  righthandmiddle1: "rightMiddleProximal",
  righthandmiddle2: "rightMiddleIntermediate",
  righthandmiddle3: "rightMiddleDistal",
  righthandring1: "rightRingProximal",
  righthandring2: "rightRingIntermediate",
  righthandring3: "rightRingDistal",
  righthandpinky1: "rightLittleProximal",
  righthandpinky2: "rightLittleIntermediate",
  righthandpinky3: "rightLittleDistal"
};
