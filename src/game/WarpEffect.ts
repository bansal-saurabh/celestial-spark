import { Scene, Vector3, ParticleSystem, Color4, Texture, MeshBuilder, StandardMaterial, Color3, Mesh, Animation, EasingFunction, CubicEase } from '@babylonjs/core';

export class WarpEffect {
  private scene: Scene;
  private starStreaks: ParticleSystem | null = null;
  private warpTunnel: Mesh | null = null;
  private isWarping: boolean = false;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  async create(): Promise<void> {
    this.createStarStreaks();
    this.createWarpTunnel();
  }

  private createStarStreaks(): void {
    this.starStreaks = new ParticleSystem('warpStars', 5000, this.scene);

    // Create streak texture
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Create elongated streak
    const gradient = ctx.createLinearGradient(0, size / 2, size, size / 2);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
    gradient.addColorStop(0.3, 'rgba(200, 220, 255, 0.8)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.7, 'rgba(200, 220, 255, 0.8)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, size / 2 - 2, size, 4);

    const texture = new Texture('data:' + canvas.toDataURL(), this.scene);
    this.starStreaks.particleTexture = texture;

    // Emit from a large sphere around the camera
    this.starStreaks.emitter = Vector3.Zero();
    this.starStreaks.minEmitBox = new Vector3(-100, -100, -100);
    this.starStreaks.maxEmitBox = new Vector3(100, 100, 100);

    this.starStreaks.color1 = new Color4(0.8, 0.9, 1, 1);
    this.starStreaks.color2 = new Color4(0.6, 0.8, 1, 1);
    this.starStreaks.colorDead = new Color4(0.4, 0.6, 1, 0);

    this.starStreaks.minSize = 0.5;
    this.starStreaks.maxSize = 3;

    this.starStreaks.minLifeTime = 0.1;
    this.starStreaks.maxLifeTime = 0.5;

    this.starStreaks.emitRate = 0; // Start stopped

    this.starStreaks.blendMode = ParticleSystem.BLENDMODE_ADD;
    this.starStreaks.gravity = new Vector3(0, 0, 0);

    // Particles move toward camera (negative Z)
    this.starStreaks.direction1 = new Vector3(-0.2, -0.2, -1);
    this.starStreaks.direction2 = new Vector3(0.2, 0.2, -1);

    this.starStreaks.minEmitPower = 100;
    this.starStreaks.maxEmitPower = 200;
    this.starStreaks.updateSpeed = 0.01;
  }

  private createWarpTunnel(): void {
    // Create a tunnel effect using a cylinder
    this.warpTunnel = MeshBuilder.CreateCylinder('warpTunnel', {
      height: 500,
      diameter: 100,
      tessellation: 64,
      sideOrientation: Mesh.BACKSIDE // Render inside
    }, this.scene);

    const tunnelMaterial = new StandardMaterial('warpTunnelMaterial', this.scene);
    tunnelMaterial.emissiveColor = new Color3(0.1, 0.2, 0.4);
    tunnelMaterial.alpha = 0;
    tunnelMaterial.backFaceCulling = false;
    tunnelMaterial.disableLighting = true;

    this.warpTunnel.material = tunnelMaterial;
    this.warpTunnel.rotation.x = Math.PI / 2; // Align with view direction
    this.warpTunnel.setEnabled(false);
  }

  startWarp(onComplete?: () => void): void {
    if (this.isWarping) return;
    this.isWarping = true;

    // Enable effects
    if (this.starStreaks) {
      this.starStreaks.emitRate = 3000;
      this.starStreaks.start();
    }

    if (this.warpTunnel) {
      this.warpTunnel.setEnabled(true);
      
      // Animate tunnel alpha
      const material = this.warpTunnel.material as StandardMaterial;
      
      // Fade in
      const fadeInAnimation = new Animation(
        'tunnelFadeIn',
        'alpha',
        60,
        Animation.ANIMATIONTYPE_FLOAT,
        Animation.ANIMATIONLOOPMODE_CONSTANT
      );

      const fadeInKeys = [
        { frame: 0, value: 0 },
        { frame: 30, value: 0.6 },
        { frame: 90, value: 0.6 },
        { frame: 120, value: 0 }
      ];
      fadeInAnimation.setKeys(fadeInKeys);

      const easingFunction = new CubicEase();
      easingFunction.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);
      fadeInAnimation.setEasingFunction(easingFunction);

      material.animations = [fadeInAnimation];
      this.scene.beginAnimation(material, 0, 120, false, 1, () => {
        this.stopWarp();
        if (onComplete) onComplete();
      });
    }

    // Also animate tunnel rotation for spinning effect
    if (this.warpTunnel) {
      const rotateAnimation = new Animation(
        'tunnelRotate',
        'rotation.z',
        60,
        Animation.ANIMATIONTYPE_FLOAT,
        Animation.ANIMATIONLOOPMODE_CONSTANT
      );

      const rotateKeys = [
        { frame: 0, value: 0 },
        { frame: 120, value: Math.PI * 4 }
      ];
      rotateAnimation.setKeys(rotateKeys);

      // Clear previous animations before adding new one to prevent accumulation
      this.warpTunnel.animations = [rotateAnimation];
      this.scene.beginAnimation(this.warpTunnel, 0, 120, false);
    }
  }

  stopWarp(): void {
    this.isWarping = false;

    if (this.starStreaks) {
      this.starStreaks.emitRate = 0;
      // Let existing particles fade out
      setTimeout(() => {
        if (this.starStreaks && !this.isWarping) {
          this.starStreaks.stop();
        }
      }, 500);
    }

    if (this.warpTunnel) {
      this.warpTunnel.setEnabled(false);
      if (this.warpTunnel.material) {
        (this.warpTunnel.material as StandardMaterial).alpha = 0;
      }
    }
  }

  updatePosition(cameraPosition: Vector3, cameraTarget: Vector3): void {
    if (!this.isWarping) return;

    // Position effects relative to camera
    if (this.starStreaks) {
      this.starStreaks.emitter = cameraPosition;
    }

    if (this.warpTunnel) {
      this.warpTunnel.position = cameraPosition;
      // Point tunnel toward camera target
      this.warpTunnel.lookAt(cameraTarget);
    }
  }

  isActive(): boolean {
    return this.isWarping;
  }

  dispose(): void {
    if (this.starStreaks) this.starStreaks.dispose();
    if (this.warpTunnel) this.warpTunnel.dispose();
  }
}
