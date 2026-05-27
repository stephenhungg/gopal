import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
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
    vrm.scene.rotation.y = Math.PI;
    vrm.scene.position.set(0, 0, 0);
    this.fitModel(vrm.scene);
    this.poseModel(vrm);
    this.loaded = true;
    this.animate();
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
    this.vrm?.update(delta);

    if (this.vrm) {
      const root = this.vrm.scene;
      const bobSpeed = this.speaking ? 10 : this.mood === "thinking" ? 3.4 : 1.6;
      const bobAmount = this.speaking ? 0.032 : this.mood === "listening" ? 0.012 : 0.008;
      root.position.y = Math.sin(t * bobSpeed) * bobAmount;
      root.rotation.z = Math.sin(t * 1.7) * 0.025;

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
