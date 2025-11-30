import { Scene, Mesh, MeshBuilder, StandardMaterial, Color3, Vector3, GlowLayer, ParticleSystem, Color4, Texture, DynamicTexture } from '@babylonjs/core';

export interface PlanetInfo {
  name: string;
  type: string;
  distance: number;
  size: number;
  atmosphere: string;
  population: string;
  ignited: boolean;
}

export class ProceduralPlanet {
  private name: string;
  private orbitDistance: number;
  private size: number;
  private baseColor: Color3;
  private hasRings: boolean;
  private orbitSpeed: number;
  private scene: Scene;
  private glowLayer: GlowLayer;
  
  private mesh: Mesh | null = null;
  private ringMesh: Mesh | null = null;
  private atmosphereMesh: Mesh | null = null;
  private orbitAngle: number = 0;
  private rotationSpeed: number = 0.005;
  private selected: boolean = false;
  private ignited: boolean = false;
  private ignitionParticles: ParticleSystem | null = null;
  private surfaceTexture: DynamicTexture | null = null;

  constructor(
    name: string,
    orbitDistance: number,
    size: number,
    baseColor: Color3,
    hasRings: boolean,
    orbitSpeed: number,
    scene: Scene,
    glowLayer: GlowLayer
  ) {
    this.name = name;
    this.orbitDistance = orbitDistance;
    this.size = size;
    this.baseColor = baseColor;
    this.hasRings = hasRings;
    this.orbitSpeed = orbitSpeed;
    this.scene = scene;
    this.glowLayer = glowLayer;
    this.orbitAngle = Math.random() * Math.PI * 2;
    this.rotationSpeed = 0.002 + Math.random() * 0.008;
  }

  async create(): Promise<void> {
    // Create the main planet mesh
    this.mesh = MeshBuilder.CreateSphere(this.name, { 
      diameter: this.size * 2, 
      segments: 32 
    }, this.scene);

    // Set initial position
    this.mesh.position.x = Math.cos(this.orbitAngle) * this.orbitDistance;
    this.mesh.position.z = Math.sin(this.orbitAngle) * this.orbitDistance;

    // Create procedural texture
    this.createProceduralTexture();

    // Create material
    const material = new StandardMaterial(`${this.name}_material`, this.scene);
    material.diffuseTexture = this.surfaceTexture;
    material.specularColor = new Color3(0.2, 0.2, 0.2);
    material.specularPower = 32;
    this.mesh.material = material;

    // Create atmosphere
    this.createAtmosphere();

    // Create rings if applicable
    if (this.hasRings) {
      this.createRings();
    }

    // Create moons for larger planets
    if (this.size > 2) {
      this.createMoons();
    }
  }

  private createProceduralTexture(): void {
    const textureSize = 512;
    this.surfaceTexture = new DynamicTexture(`${this.name}_texture`, textureSize, this.scene, true);
    
    const ctx = this.surfaceTexture.getContext() as CanvasRenderingContext2D;
    
    // Generate procedural planet surface
    this.generatePlanetSurface(ctx, textureSize);
    
    this.surfaceTexture.update();
  }

  private generatePlanetSurface(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, size: number): void {
    // Create base gradient
    const imageData = ctx.createImageData(size, size);
    const data = imageData.data;

    // Simple noise function for terrain generation
    const noise = (x: number, y: number, seed: number): number => {
      const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
      return n - Math.floor(n);
    };

    const octaveNoise = (x: number, y: number, seed: number): number => {
      let value = 0;
      let amplitude = 1;
      let frequency = 1;
      let maxValue = 0;

      for (let i = 0; i < 4; i++) {
        value += noise(x * frequency / size * 10, y * frequency / size * 10, seed + i * 100) * amplitude;
        maxValue += amplitude;
        amplitude *= 0.5;
        frequency *= 2;
      }

      return value / maxValue;
    };

    const seed = this.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;
        
        // Get noise value
        const noiseVal = octaveNoise(x, y, seed);
        
        // Apply color based on noise and base color
        const variation = 0.3;
        const r = Math.min(255, Math.max(0, (this.baseColor.r + (noiseVal - 0.5) * variation) * 255));
        const g = Math.min(255, Math.max(0, (this.baseColor.g + (noiseVal - 0.5) * variation) * 255));
        const b = Math.min(255, Math.max(0, (this.baseColor.b + (noiseVal - 0.5) * variation) * 255));

        // Add polar ice caps for some planets
        const latNormalized = Math.abs((y / size) - 0.5) * 2;
        const polarEffect = latNormalized > 0.8 ? (latNormalized - 0.8) * 5 : 0;
        
        data[idx] = Math.min(255, r + polarEffect * 100);
        data[idx + 1] = Math.min(255, g + polarEffect * 100);
        data[idx + 2] = Math.min(255, b + polarEffect * 100);
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);

    // Add some cloud-like patterns
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = 'white';
    
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const cloudWidth = 20 + Math.random() * 60;
      const cloudHeight = 10 + Math.random() * 20;
      
      ctx.beginPath();
      ctx.ellipse(x, y, cloudWidth, cloudHeight, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.globalAlpha = 1;
  }

  private createAtmosphere(): void {
    if (!this.mesh) return;

    this.atmosphereMesh = MeshBuilder.CreateSphere(`${this.name}_atmosphere`, {
      diameter: this.size * 2.15,
      segments: 32
    }, this.scene);

    this.atmosphereMesh.position = this.mesh.position.clone();

    const atmosphereMaterial = new StandardMaterial(`${this.name}_atmosphere_material`, this.scene);
    atmosphereMaterial.emissiveColor = this.baseColor.scale(0.5);
    atmosphereMaterial.alpha = 0.15;
    atmosphereMaterial.backFaceCulling = false;
    atmosphereMaterial.disableLighting = true;
    this.atmosphereMesh.material = atmosphereMaterial;
  }

  private createRings(): void {
    if (!this.mesh) return;

    // Create ring using a disc with a hole
    const innerRadius = this.size * 1.5;
    const outerRadius = this.size * 2.5;
    
    this.ringMesh = MeshBuilder.CreateTorus(`${this.name}_rings`, {
      diameter: (innerRadius + outerRadius),
      thickness: (outerRadius - innerRadius) / 2,
      tessellation: 64
    }, this.scene);

    // Flatten the torus to make it a ring
    this.ringMesh.scaling.y = 0.02;
    this.ringMesh.position = this.mesh.position.clone();
    this.ringMesh.rotation.x = Math.PI / 6; // Slight tilt

    // Create ring texture
    const ringTexture = new DynamicTexture(`${this.name}_ring_texture`, 256, this.scene, true);
    const ringCtx = ringTexture.getContext();
    
    // Create gradient for rings
    const gradient = ringCtx.createLinearGradient(0, 0, 256, 0);
    gradient.addColorStop(0, `rgba(${this.baseColor.r * 255 * 0.8}, ${this.baseColor.g * 255 * 0.8}, ${this.baseColor.b * 255 * 0.8}, 0.3)`);
    gradient.addColorStop(0.3, `rgba(${this.baseColor.r * 255}, ${this.baseColor.g * 255}, ${this.baseColor.b * 255}, 0.6)`);
    gradient.addColorStop(0.5, `rgba(200, 200, 200, 0.4)`);
    gradient.addColorStop(0.7, `rgba(${this.baseColor.r * 255}, ${this.baseColor.g * 255}, ${this.baseColor.b * 255}, 0.5)`);
    gradient.addColorStop(1, `rgba(${this.baseColor.r * 255 * 0.7}, ${this.baseColor.g * 255 * 0.7}, ${this.baseColor.b * 255 * 0.7}, 0.2)`);
    
    ringCtx.fillStyle = gradient;
    ringCtx.fillRect(0, 0, 256, 256);
    
    // Add some gaps
    ringCtx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ringCtx.fillRect(100, 0, 3, 256);
    ringCtx.fillRect(150, 0, 2, 256);
    ringCtx.fillRect(200, 0, 4, 256);
    
    ringTexture.update();

    const ringMaterial = new StandardMaterial(`${this.name}_ring_material`, this.scene);
    ringMaterial.diffuseTexture = ringTexture;
    ringMaterial.emissiveColor = this.baseColor.scale(0.2);
    ringMaterial.alpha = 0.7;
    ringMaterial.backFaceCulling = false;
    this.ringMesh.material = ringMaterial;
  }

  private createMoons(): void {
    if (!this.mesh) return;

    const moonCount = Math.floor(1 + Math.random() * 2);
    
    for (let i = 0; i < moonCount; i++) {
      const moonSize = 0.2 + Math.random() * 0.3;
      const moonDistance = this.size + 2 + i * 1.5;
      const moonSpeed = 0.02 + Math.random() * 0.02;
      
      const moon = MeshBuilder.CreateSphere(`${this.name}_moon_${i}`, {
        diameter: moonSize,
        segments: 16
      }, this.scene);

      const moonMaterial = new StandardMaterial(`${this.name}_moon_${i}_material`, this.scene);
      moonMaterial.diffuseColor = new Color3(0.6, 0.6, 0.6);
      moonMaterial.specularColor = new Color3(0.3, 0.3, 0.3);
      moon.material = moonMaterial;

      // Store moon data for animation
      moon.metadata = {
        orbitDistance: moonDistance,
        orbitSpeed: moonSpeed,
        orbitAngle: Math.random() * Math.PI * 2,
        parentPlanet: this.mesh
      };
    }
  }

  update(): void {
    if (!this.mesh) return;

    // Update orbit position
    this.orbitAngle += this.orbitSpeed;
    this.mesh.position.x = Math.cos(this.orbitAngle) * this.orbitDistance;
    this.mesh.position.z = Math.sin(this.orbitAngle) * this.orbitDistance;

    // Rotate planet
    this.mesh.rotation.y += this.rotationSpeed;

    // Update atmosphere position
    if (this.atmosphereMesh) {
      this.atmosphereMesh.position = this.mesh.position.clone();
    }

    // Update rings position and rotation
    if (this.ringMesh) {
      this.ringMesh.position = this.mesh.position.clone();
      this.ringMesh.rotation.y += this.rotationSpeed * 0.5;
    }

    // Update moons
    this.updateMoons();

    // Update ignition particles
    if (this.ignitionParticles) {
      this.ignitionParticles.emitter = this.mesh.position.clone();
    }
  }

  private updateMoons(): void {
    if (!this.mesh) return;

    const moons = this.scene.meshes.filter(m => m.name.startsWith(`${this.name}_moon_`));
    
    for (const moon of moons) {
      if (moon.metadata) {
        moon.metadata.orbitAngle += moon.metadata.orbitSpeed;
        const angle = moon.metadata.orbitAngle;
        const distance = moon.metadata.orbitDistance;
        
        moon.position.x = this.mesh.position.x + Math.cos(angle) * distance;
        moon.position.y = this.mesh.position.y + Math.sin(angle * 0.5) * 0.5;
        moon.position.z = this.mesh.position.z + Math.sin(angle) * distance;
      }
    }
  }

  ignite(): void {
    if (this.ignited || !this.mesh) return;
    
    this.ignited = true;

    // Create ignition particle effect
    this.ignitionParticles = new ParticleSystem(`${this.name}_ignition`, 2000, this.scene);
    
    // Create particle texture
    const particleTexture = new DynamicTexture(`${this.name}_particle_texture`, 32, this.scene, true);
    const ctx = particleTexture.getContext();
    
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255, 255, 200, 1)');
    gradient.addColorStop(0.5, 'rgba(255, 200, 100, 0.5)');
    gradient.addColorStop(1, 'rgba(255, 100, 50, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);
    particleTexture.update();
    
    this.ignitionParticles.particleTexture = new Texture('data:' + (particleTexture.getContext() as CanvasRenderingContext2D).canvas.toDataURL('image/png'), this.scene);

    this.ignitionParticles.emitter = this.mesh.position.clone();
    this.ignitionParticles.minEmitBox = new Vector3(-this.size, -this.size, -this.size);
    this.ignitionParticles.maxEmitBox = new Vector3(this.size, this.size, this.size);

    this.ignitionParticles.color1 = new Color4(1, 0.9, 0.6, 1);
    this.ignitionParticles.color2 = new Color4(1, 0.6, 0.3, 1);
    this.ignitionParticles.colorDead = new Color4(1, 0.3, 0.1, 0);

    this.ignitionParticles.minSize = 0.2;
    this.ignitionParticles.maxSize = 0.8;

    this.ignitionParticles.minLifeTime = 0.5;
    this.ignitionParticles.maxLifeTime = 1.5;

    this.ignitionParticles.emitRate = 200;

    this.ignitionParticles.blendMode = ParticleSystem.BLENDMODE_ADD;

    this.ignitionParticles.gravity = new Vector3(0, 0, 0);

    this.ignitionParticles.direction1 = new Vector3(-1, -1, -1);
    this.ignitionParticles.direction2 = new Vector3(1, 1, 1);

    this.ignitionParticles.minEmitPower = 0.5;
    this.ignitionParticles.maxEmitPower = 2;
    this.ignitionParticles.updateSpeed = 0.01;

    this.ignitionParticles.start();

    // Add glow effect
    if (this.mesh) {
      this.glowLayer.addIncludedOnlyMesh(this.mesh);
    }

    // Update material to look ignited
    if (this.mesh.material instanceof StandardMaterial) {
      this.mesh.material.emissiveColor = this.baseColor.scale(0.5);
    }

    // Update atmosphere
    if (this.atmosphereMesh && this.atmosphereMesh.material instanceof StandardMaterial) {
      this.atmosphereMesh.material.emissiveColor = new Color3(1, 0.8, 0.5);
      this.atmosphereMesh.material.alpha = 0.3;
    }
  }

  isIgnited(): boolean {
    return this.ignited;
  }

  setSelected(selected: boolean): void {
    this.selected = selected;
    
    if (this.atmosphereMesh && this.atmosphereMesh.material instanceof StandardMaterial) {
      if (selected && !this.ignited) {
        this.atmosphereMesh.material.emissiveColor = new Color3(0.5, 0.7, 1);
        this.atmosphereMesh.material.alpha = 0.25;
      } else if (!this.ignited) {
        this.atmosphereMesh.material.emissiveColor = this.baseColor.scale(0.5);
        this.atmosphereMesh.material.alpha = 0.15;
      }
    }
  }

  isSelected(): boolean {
    return this.selected;
  }

  getPosition(): Vector3 {
    return this.mesh ? this.mesh.position.clone() : Vector3.Zero();
  }

  getName(): string {
    return this.name;
  }

  getInfo(): PlanetInfo {
    const types = ['Rocky', 'Gas Giant', 'Ice Giant', 'Desert', 'Ocean'];
    const atmospheres = ['Nitrogen-Oxygen', 'Carbon Dioxide', 'Hydrogen-Helium', 'Methane', 'None'];
    
    // Generate consistent random values based on name
    const seed = this.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const typeIndex = seed % types.length;
    const atmoIndex = (seed * 7) % atmospheres.length;
    
    return {
      name: this.name,
      type: types[typeIndex],
      distance: Math.round(this.orbitDistance * 10) / 10,
      size: Math.round(this.size * 100) / 100,
      atmosphere: atmospheres[atmoIndex],
      population: this.ignited ? `${Math.floor(seed * 1000 % 9000 + 1000)} Million` : 'Uninhabited',
      ignited: this.ignited
    };
  }

  setEnabled(enabled: boolean): void {
    if (this.mesh) this.mesh.setEnabled(enabled);
    if (this.ringMesh) this.ringMesh.setEnabled(enabled);
    if (this.atmosphereMesh) this.atmosphereMesh.setEnabled(enabled);
    if (this.ignitionParticles) {
      if (enabled) this.ignitionParticles.start();
      else this.ignitionParticles.stop();
    }
    
    // Also enable/disable moons
    const moons = this.scene.meshes.filter(m => m.name.startsWith(`${this.name}_moon_`));
    moons.forEach(moon => moon.setEnabled(enabled));
  }

  dispose(): void {
    if (this.mesh) this.mesh.dispose();
    if (this.ringMesh) this.ringMesh.dispose();
    if (this.atmosphereMesh) this.atmosphereMesh.dispose();
    if (this.ignitionParticles) this.ignitionParticles.dispose();
    if (this.surfaceTexture) this.surfaceTexture.dispose();
  }
}
