import { Scene, Vector3, MeshBuilder, StandardMaterial, Color3, PointLight, ParticleSystem, Color4, Texture, GlowLayer, Mesh } from '@babylonjs/core';
import { ProceduralPlanet } from './ProceduralPlanet';
import { AsteroidBelt } from './AsteroidBelt';
import { Comet } from './Comet';

export type StarType = 'yellow_dwarf' | 'red_dwarf' | 'blue_giant' | 'orange_giant' | 'white_dwarf' | 'red_giant';

export interface StarConfig {
  type: StarType;
  name: string;
  size: number;
  color: Color3;
  emissiveColor: Color3;
  lightIntensity: number;
  coronaColor1: Color4;
  coronaColor2: Color4;
}

export interface SolarSystemConfig {
  id: string;
  name: string;
  position: Vector3; // Position in the galaxy
  star: StarConfig;
  planetCount: number;
}

// Predefined star configurations
export const STAR_TEMPLATES: Record<StarType, Omit<StarConfig, 'name'>> = {
  yellow_dwarf: {
    type: 'yellow_dwarf',
    size: 8,
    color: new Color3(1, 0.95, 0.8),
    emissiveColor: new Color3(1, 0.8, 0.3),
    lightIntensity: 2,
    coronaColor1: new Color4(1, 0.8, 0.3, 1),
    coronaColor2: new Color4(1, 0.5, 0.1, 1),
  },
  red_dwarf: {
    type: 'red_dwarf',
    size: 5,
    color: new Color3(1, 0.4, 0.3),
    emissiveColor: new Color3(1, 0.3, 0.2),
    lightIntensity: 1.2,
    coronaColor1: new Color4(1, 0.4, 0.2, 1),
    coronaColor2: new Color4(0.8, 0.2, 0.1, 1),
  },
  blue_giant: {
    type: 'blue_giant',
    size: 14,
    color: new Color3(0.7, 0.85, 1),
    emissiveColor: new Color3(0.5, 0.7, 1),
    lightIntensity: 4,
    coronaColor1: new Color4(0.6, 0.8, 1, 1),
    coronaColor2: new Color4(0.3, 0.5, 1, 1),
  },
  orange_giant: {
    type: 'orange_giant',
    size: 12,
    color: new Color3(1, 0.7, 0.4),
    emissiveColor: new Color3(1, 0.6, 0.3),
    lightIntensity: 2.5,
    coronaColor1: new Color4(1, 0.7, 0.3, 1),
    coronaColor2: new Color4(1, 0.4, 0.1, 1),
  },
  white_dwarf: {
    type: 'white_dwarf',
    size: 3,
    color: new Color3(1, 1, 1),
    emissiveColor: new Color3(0.9, 0.95, 1),
    lightIntensity: 1.5,
    coronaColor1: new Color4(1, 1, 1, 1),
    coronaColor2: new Color4(0.8, 0.9, 1, 1),
  },
  red_giant: {
    type: 'red_giant',
    size: 16,
    color: new Color3(1, 0.5, 0.3),
    emissiveColor: new Color3(1, 0.4, 0.2),
    lightIntensity: 3,
    coronaColor1: new Color4(1, 0.5, 0.2, 1),
    coronaColor2: new Color4(0.9, 0.3, 0.1, 1),
  },
};

// Planet name prefixes for generation
const PLANET_PREFIXES = [
  'Nova', 'Astra', 'Zephyr', 'Crimson', 'Azure', 'Jade', 'Frost', 'Terra', 
  'Helios', 'Luna', 'Orion', 'Vega', 'Polaris', 'Sirius', 'Rigel', 'Altair',
  'Lyra', 'Draco', 'Phoenix', 'Hydra', 'Cygnus', 'Aquila', 'Serpens', 'Corvus'
];

const PLANET_SUFFIXES = [
  'Prime', 'Major', 'Minor', 'Alpha', 'Beta', 'Gamma', 'Haven', 'Forge',
  'Titan', 'Giant', 'World', 'Sphere', 'Core', 'Realm', 'Domain', 'Expanse'
];

export class SolarSystem {
  private scene: Scene;
  private glowLayer: GlowLayer;
  private config: SolarSystemConfig;
  
  private starMesh: Mesh | null = null;
  private starLight: PointLight | null = null;
  private coronaParticles: ParticleSystem | null = null;
  private planets: ProceduralPlanet[] = [];
  private asteroidBelt: AsteroidBelt | null = null;
  private comets: Comet[] = [];
  private orbitLines: Mesh[] = [];
  private isActive: boolean = false;

  constructor(scene: Scene, glowLayer: GlowLayer, config: SolarSystemConfig) {
    this.scene = scene;
    this.glowLayer = glowLayer;
    this.config = config;
  }

  async create(): Promise<void> {
    // Create the star
    await this.createStar();

    // Generate planets procedurally based on star type
    await this.generatePlanets();

    // Create asteroid belt (50% chance)
    if (Math.random() > 0.5 && this.planets.length >= 3) {
      await this.createAsteroidBelt();
    }

    // Create comets (1-3 comets per system)
    await this.createComets();

    // Create orbit lines
    this.createOrbitLines();
  }

  private async createStar(): Promise<void> {
    const starConfig = this.config.star;
    
    this.starMesh = MeshBuilder.CreateSphere(`${this.config.id}_star`, { 
      diameter: starConfig.size, 
      segments: 32 
    }, this.scene);

    const starMaterial = new StandardMaterial(`${this.config.id}_star_material`, this.scene);
    starMaterial.emissiveColor = starConfig.emissiveColor;
    starMaterial.disableLighting = true;
    this.starMesh.material = starMaterial;

    // Add glow to star
    this.glowLayer.addIncludedOnlyMesh(this.starMesh);

    // Create point light from star
    this.starLight = new PointLight(`${this.config.id}_star_light`, Vector3.Zero(), this.scene);
    this.starLight.intensity = starConfig.lightIntensity;
    this.starLight.diffuse = starConfig.color;
    this.starLight.specular = starConfig.color;

    // Create corona particle effect
    this.createStarCorona(starConfig);
  }

  private createStarCorona(starConfig: StarConfig): void {
    this.coronaParticles = new ParticleSystem(`${this.config.id}_corona`, 2000, this.scene);

    // Create particle texture
    const size = 32;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, `rgba(255, 255, 255, 1)`);
    gradient.addColorStop(0.5, `rgba(255, 200, 150, 0.5)`);
    gradient.addColorStop(1, `rgba(255, 100, 50, 0)`);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    const texture = new Texture('data:' + canvas.toDataURL(), this.scene);
    this.coronaParticles.particleTexture = texture;

    this.coronaParticles.emitter = Vector3.Zero();
    const emitBox = starConfig.size / 4;
    this.coronaParticles.minEmitBox = new Vector3(-emitBox, -emitBox, -emitBox);
    this.coronaParticles.maxEmitBox = new Vector3(emitBox, emitBox, emitBox);

    this.coronaParticles.color1 = starConfig.coronaColor1;
    this.coronaParticles.color2 = starConfig.coronaColor2;
    this.coronaParticles.colorDead = new Color4(
      starConfig.coronaColor2.r * 0.5,
      starConfig.coronaColor2.g * 0.3,
      0,
      0
    );

    this.coronaParticles.minSize = 0.3 * (starConfig.size / 8);
    this.coronaParticles.maxSize = 1.5 * (starConfig.size / 8);

    this.coronaParticles.minLifeTime = 0.5;
    this.coronaParticles.maxLifeTime = 1.5;

    this.coronaParticles.emitRate = 300 * (starConfig.size / 8);

    this.coronaParticles.blendMode = ParticleSystem.BLENDMODE_ADD;
    this.coronaParticles.gravity = new Vector3(0, 0, 0);

    this.coronaParticles.direction1 = new Vector3(-1, -1, -1);
    this.coronaParticles.direction2 = new Vector3(1, 1, 1);

    this.coronaParticles.minAngularSpeed = 0;
    this.coronaParticles.maxAngularSpeed = Math.PI;

    this.coronaParticles.minEmitPower = 0.5;
    this.coronaParticles.maxEmitPower = 2;
    this.coronaParticles.updateSpeed = 0.01;

    this.coronaParticles.start();
  }

  private async generatePlanets(): Promise<void> {
    const starSize = this.config.star.size;
    const planetCount = this.config.planetCount;
    
    // Generate planet configurations based on star type
    const baseDistance = starSize * 1.5 + 5;
    const distanceIncrement = this.getDistanceIncrement();

    for (let i = 0; i < planetCount; i++) {
      const distance = baseDistance + (i + 1) * distanceIncrement + Math.random() * 5;
      const planetConfig = this.generatePlanetConfig(i, distance);
      
      const planet = new ProceduralPlanet(
        planetConfig.name,
        planetConfig.distance,
        planetConfig.size,
        planetConfig.color,
        planetConfig.hasRings,
        planetConfig.orbitSpeed,
        this.scene,
        this.glowLayer
      );

      await planet.create();
      this.planets.push(planet);
    }
  }

  private getDistanceIncrement(): number {
    // Different star types have different habitable zones
    switch (this.config.star.type) {
      case 'red_dwarf': return 8;
      case 'blue_giant': return 18;
      case 'red_giant': return 20;
      case 'orange_giant': return 15;
      case 'white_dwarf': return 6;
      default: return 12;
    }
  }

  private generatePlanetConfig(index: number, distance: number): {
    name: string;
    distance: number;
    size: number;
    color: Color3;
    hasRings: boolean;
    orbitSpeed: number;
  } {
    // Use system ID and index for consistent random generation
    const seed = this.hashString(`${this.config.id}_planet_${index}`);
    const random = this.seededRandom(seed);

    // Generate unique name
    const prefixIndex = Math.floor(random() * PLANET_PREFIXES.length);
    const suffixIndex = Math.floor(random() * PLANET_SUFFIXES.length);
    const name = `${PLANET_PREFIXES[prefixIndex]} ${PLANET_SUFFIXES[suffixIndex]}`;

    // Size based on distance (inner planets tend to be smaller)
    const sizeBase = index < 2 ? 0.8 : 1.5;
    const size = sizeBase + random() * 2;

    // Color based on distance from star
    const color = this.generatePlanetColor(distance, random);

    // Rings more likely on larger, outer planets
    const hasRings = size > 2 && random() > 0.6;

    // Orbital speed inversely proportional to distance
    const orbitSpeed = 0.003 / Math.sqrt(distance / 15);

    return { name, distance, size, color, hasRings, orbitSpeed };
  }

  private generatePlanetColor(distance: number, random: () => number): Color3 {
    // Inner planets: more red/brown (hot)
    // Middle planets: varied colors
    // Outer planets: more blue/white (cold)
    
    if (distance < 25) {
      // Inner - rocky, hot planets
      return new Color3(
        0.5 + random() * 0.4,
        0.3 + random() * 0.3,
        0.2 + random() * 0.2
      );
    } else if (distance < 50) {
      // Middle - varied
      const type = Math.floor(random() * 4);
      switch (type) {
        case 0: return new Color3(0.3 + random() * 0.2, 0.5 + random() * 0.3, 0.8); // Ocean
        case 1: return new Color3(0.4 + random() * 0.2, 0.6 + random() * 0.2, 0.4); // Forest
        case 2: return new Color3(0.8 + random() * 0.2, 0.6 + random() * 0.2, 0.3); // Desert
        default: return new Color3(0.6 + random() * 0.2, 0.5 + random() * 0.2, 0.5); // Rocky
      }
    } else {
      // Outer - cold, gas giants
      const type = Math.floor(random() * 3);
      switch (type) {
        case 0: return new Color3(0.2, 0.4 + random() * 0.3, 0.7 + random() * 0.3); // Ice blue
        case 1: return new Color3(0.7 + random() * 0.2, 0.75 + random() * 0.2, 0.8 + random() * 0.2); // Ice white
        default: return new Color3(0.3, 0.4 + random() * 0.2, 0.6 + random() * 0.2); // Gas blue
      }
    }
  }

  private async createAsteroidBelt(): Promise<void> {
    // Place asteroid belt between 2nd and 3rd planet if possible
    if (this.planets.length >= 3) {
      const innerDistance = 25 + this.config.star.size;
      const outerDistance = 35 + this.config.star.size;
      
      this.asteroidBelt = new AsteroidBelt(this.scene, innerDistance, outerDistance, 100);
      await this.asteroidBelt.create();
    }
  }

  private async createComets(): Promise<void> {
    const cometCount = 1 + Math.floor(Math.random() * 3);
    
    for (let i = 0; i < cometCount; i++) {
      const semiMajorAxis = 80 + Math.random() * 40;
      const eccentricity = 0.6 + Math.random() * 0.25;
      const inclination = (Math.random() - 0.5) * 0.6;
      const orbitSpeed = 0.0001 + Math.random() * 0.0002;

      const comet = new Comet(
        this.scene,
        `${this.config.id}_comet_${i}`,
        semiMajorAxis,
        eccentricity,
        inclination,
        orbitSpeed
      );

      await comet.create();
      this.comets.push(comet);
    }
  }

  private createOrbitLines(): void {
    for (const planet of this.planets) {
      const distance = planet.getInfo().distance;
      const points: Vector3[] = [];
      const segments = 128;

      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        points.push(new Vector3(
          Math.cos(angle) * distance,
          0,
          Math.sin(angle) * distance
        ));
      }

      const orbitLine = MeshBuilder.CreateLines(
        `${this.config.id}_orbit_${distance}`,
        { points, updatable: false },
        this.scene
      );

      orbitLine.color = new Color3(0.2, 0.3, 0.5);
      orbitLine.alpha = 0.3;
      this.orbitLines.push(orbitLine);
    }
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  private seededRandom(seed: number): () => number {
    let state = seed;
    return () => {
      state = (state * 1103515245 + 12345) & 0x7fffffff;
      return state / 0x7fffffff;
    };
  }

  update(): void {
    if (!this.isActive) return;

    // Update all planets
    this.planets.forEach(planet => planet.update());

    // Update asteroid belt
    if (this.asteroidBelt) {
      this.asteroidBelt.update();
    }

    // Update comets
    this.comets.forEach(comet => comet.update());
  }

  setActive(active: boolean): void {
    this.isActive = active;
    
    // Show/hide all elements
    if (this.starMesh) this.starMesh.setEnabled(active);
    if (this.starLight) this.starLight.setEnabled(active);
    if (this.coronaParticles) {
      if (active) this.coronaParticles.start();
      else this.coronaParticles.stop();
    }

    // Enable/disable planets
    this.planets.forEach(planet => planet.setEnabled(active));

    // Enable/disable comets
    this.comets.forEach(comet => comet.setEnabled(active));

    // Enable/disable asteroid belt
    if (this.asteroidBelt) {
      this.asteroidBelt.setEnabled(active);
    }

    this.orbitLines.forEach(line => line.setEnabled(active));
  }

  getConfig(): SolarSystemConfig {
    return this.config;
  }

  getPlanets(): ProceduralPlanet[] {
    return this.planets;
  }

  getStarPosition(): Vector3 {
    return this.starMesh ? this.starMesh.position.clone() : Vector3.Zero();
  }

  dispose(): void {
    if (this.starMesh) this.starMesh.dispose();
    if (this.starLight) this.starLight.dispose();
    if (this.coronaParticles) this.coronaParticles.dispose();
    
    this.planets.forEach(planet => planet.dispose());
    this.comets.forEach(comet => comet.dispose());
    this.orbitLines.forEach(line => line.dispose());
    
    if (this.asteroidBelt) this.asteroidBelt.dispose();
  }
}
