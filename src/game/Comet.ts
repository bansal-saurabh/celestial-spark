import { Scene, MeshBuilder, StandardMaterial, Color3, Vector3, Mesh, ParticleSystem, Color4, Texture } from '@babylonjs/core';

export class Comet {
  private scene: Scene;
  private nucleus: Mesh | null = null;
  private coma: Mesh | null = null;
  private tailParticles: ParticleSystem | null = null;
  private orbitAngle: number = 0;
  private orbitSpeed: number;
  private semiMajorAxis: number;
  private eccentricity: number;
  private inclination: number;
  private name: string;

  constructor(
    scene: Scene,
    name: string,
    semiMajorAxis: number = 80,
    eccentricity: number = 0.7,
    inclination: number = 0.3,
    orbitSpeed: number = 0.0003
  ) {
    this.scene = scene;
    this.name = name;
    this.semiMajorAxis = semiMajorAxis;
    this.eccentricity = eccentricity;
    this.inclination = inclination;
    this.orbitSpeed = orbitSpeed;
    this.orbitAngle = Math.random() * Math.PI * 2;
  }

  async create(): Promise<void> {
    // Create comet nucleus (irregular icy body)
    this.nucleus = MeshBuilder.CreatePolyhedron(`${this.name}_nucleus`, {
      type: 2, // Icosahedron
      size: 0.4
    }, this.scene);

    const nucleusMaterial = new StandardMaterial(`${this.name}_nucleusMat`, this.scene);
    nucleusMaterial.diffuseColor = new Color3(0.5, 0.55, 0.6);
    nucleusMaterial.emissiveColor = new Color3(0.1, 0.15, 0.2);
    nucleusMaterial.specularColor = new Color3(0.3, 0.35, 0.4);
    this.nucleus.material = nucleusMaterial;

    // Create coma (fuzzy atmosphere around nucleus)
    this.coma = MeshBuilder.CreateSphere(`${this.name}_coma`, {
      diameter: 1.5,
      segments: 16
    }, this.scene);

    const comaMaterial = new StandardMaterial(`${this.name}_comaMat`, this.scene);
    comaMaterial.emissiveColor = new Color3(0.3, 0.5, 0.7);
    comaMaterial.alpha = 0.2;
    comaMaterial.backFaceCulling = false;
    comaMaterial.disableLighting = true;
    this.coma.material = comaMaterial;

    // Create tail particle system
    this.createTail();

    // Set initial position
    this.updatePosition();
  }

  private createTail(): void {
    if (!this.nucleus) return;

    this.tailParticles = new ParticleSystem(`${this.name}_tail`, 500, this.scene);

    // Create particle texture
    const textureSize = 32;
    const canvas = document.createElement('canvas');
    canvas.width = textureSize;
    canvas.height = textureSize;
    const ctx = canvas.getContext('2d')!;
    
    const gradient = ctx.createRadialGradient(textureSize/2, textureSize/2, 0, textureSize/2, textureSize/2, textureSize/2);
    gradient.addColorStop(0, 'rgba(200, 220, 255, 1)');
    gradient.addColorStop(0.3, 'rgba(150, 180, 255, 0.6)');
    gradient.addColorStop(1, 'rgba(100, 150, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, textureSize, textureSize);
    
    const texture = new Texture('data:' + canvas.toDataURL(), this.scene);
    this.tailParticles.particleTexture = texture;

    this.tailParticles.emitter = this.nucleus.position.clone();
    this.tailParticles.minEmitBox = new Vector3(-0.2, -0.2, -0.2);
    this.tailParticles.maxEmitBox = new Vector3(0.2, 0.2, 0.2);

    // Colors for icy blue tail
    this.tailParticles.color1 = new Color4(0.7, 0.85, 1, 0.8);
    this.tailParticles.color2 = new Color4(0.5, 0.7, 0.9, 0.5);
    this.tailParticles.colorDead = new Color4(0.3, 0.5, 0.8, 0);

    this.tailParticles.minSize = 0.3;
    this.tailParticles.maxSize = 1.2;

    this.tailParticles.minLifeTime = 1;
    this.tailParticles.maxLifeTime = 3;

    this.tailParticles.emitRate = 100;
    this.tailParticles.blendMode = ParticleSystem.BLENDMODE_ADD;

    // Tail always points away from sun (origin)
    this.tailParticles.gravity = new Vector3(0, 0, 0);
    this.tailParticles.direction1 = new Vector3(1, 0, 0);
    this.tailParticles.direction2 = new Vector3(1, 0.2, 0.2);

    this.tailParticles.minEmitPower = 1;
    this.tailParticles.maxEmitPower = 3;
    this.tailParticles.updateSpeed = 0.01;

    this.tailParticles.start();
  }

  private updatePosition(): void {
    // Calculate elliptical orbit position
    const semiMinorAxis = this.semiMajorAxis * Math.sqrt(1 - this.eccentricity * this.eccentricity);
    const focusOffset = this.semiMajorAxis * this.eccentricity;

    const x = Math.cos(this.orbitAngle) * this.semiMajorAxis - focusOffset;
    const z = Math.sin(this.orbitAngle) * semiMinorAxis;
    
    // Apply inclination
    const y = Math.sin(this.orbitAngle) * Math.sin(this.inclination) * semiMinorAxis * 0.5;

    const position = new Vector3(x, y, z);

    if (this.nucleus) {
      this.nucleus.position = position;
    }
    if (this.coma) {
      this.coma.position = position;
    }
  }

  update(): void {
    // Kepler's second law: faster near perihelion
    const distance = this.nucleus ? this.nucleus.position.length() : this.semiMajorAxis;
    const speedModifier = Math.pow(this.semiMajorAxis / Math.max(distance, 1), 1.5);
    
    this.orbitAngle += this.orbitSpeed * speedModifier;
    this.updatePosition();

    if (this.nucleus && this.tailParticles) {
      // Update tail emitter position
      this.tailParticles.emitter = this.nucleus.position.clone();

      // Update tail direction (always points away from sun/origin)
      // Avoid division by zero when nucleus is at origin
      if (distance > 0.1) {
        const sunDirection = this.nucleus.position.normalize();
        this.tailParticles.direction1 = sunDirection.scale(2);
        this.tailParticles.direction2 = sunDirection.add(new Vector3(
          (Math.random() - 0.5) * 0.3,
          (Math.random() - 0.5) * 0.3,
          (Math.random() - 0.5) * 0.3
        )).scale(2);
      }

      // Tail is more visible when closer to sun
      const tailIntensity = Math.min(1, 50 / Math.max(distance, 0.1));
      this.tailParticles.emitRate = 50 + tailIntensity * 150;
    }

    // Rotate nucleus
    if (this.nucleus) {
      this.nucleus.rotation.y += 0.01;
      this.nucleus.rotation.x += 0.005;
    }
  }

  getPosition(): Vector3 {
    return this.nucleus ? this.nucleus.position.clone() : Vector3.Zero();
  }

  getName(): string {
    return this.name;
  }

  setEnabled(enabled: boolean): void {
    if (this.nucleus) this.nucleus.setEnabled(enabled);
    if (this.coma) this.coma.setEnabled(enabled);
    if (this.tailParticles) {
      if (enabled) this.tailParticles.start();
      else this.tailParticles.stop();
    }
  }

  dispose(): void {
    if (this.nucleus) this.nucleus.dispose();
    if (this.coma) this.coma.dispose();
    if (this.tailParticles) this.tailParticles.dispose();
  }
}
