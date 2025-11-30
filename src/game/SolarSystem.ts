import { Scene, Vector3, MeshBuilder, StandardMaterial, Color3, PointLight, ParticleSystem, Color4, Texture, GlowLayer, Mesh } from '@babylonjs/core';
import { ProceduralPlanet } from './ProceduralPlanet';
import type { PlanetType } from './ProceduralPlanet';
import { AsteroidBelt } from './AsteroidBelt';
import { Comet } from './Comet';

export type StarType = 'yellow_dwarf' | 'red_dwarf' | 'blue_giant' | 'orange_giant' | 'white_dwarf' | 'red_giant' | 'deep_orange';

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

// Habitable zone configuration for each star type
export interface HabitableZone {
  inner: number; // Inner edge of habitable zone (AU equivalent)
  outer: number; // Outer edge of habitable zone (AU equivalent)
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
    size: 18,
    color: new Color3(1, 0.35, 0.2),
    emissiveColor: new Color3(1, 0.3, 0.15),
    lightIntensity: 3.5,
    coronaColor1: new Color4(1, 0.4, 0.15, 1),
    coronaColor2: new Color4(0.95, 0.25, 0.08, 1),
  },
  deep_orange: {
    type: 'deep_orange',
    size: 10,
    color: new Color3(1, 0.55, 0.15),
    emissiveColor: new Color3(1, 0.5, 0.1),
    lightIntensity: 2.2,
    coronaColor1: new Color4(1, 0.6, 0.2, 1),
    coronaColor2: new Color4(1, 0.35, 0.05, 1),
  },
};

// Habitable zone distances for each star type
export const HABITABLE_ZONES: Record<StarType, HabitableZone> = {
  yellow_dwarf: { inner: 25, outer: 45 },
  red_dwarf: { inner: 12, outer: 22 },
  blue_giant: { inner: 60, outer: 100 },
  orange_giant: { inner: 35, outer: 60 },
  white_dwarf: { inner: 8, outer: 15 },
  red_giant: { inner: 50, outer: 80 },
  deep_orange: { inner: 30, outer: 50 },
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
        this.glowLayer,
        planetConfig.planetType,
        planetConfig.isHabitable
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
      case 'red_giant': return 22;
      case 'orange_giant': return 15;
      case 'white_dwarf': return 6;
      case 'deep_orange': return 14;
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
    planetType: PlanetType;
    isHabitable: boolean;
  } {
    // Use system ID and index for consistent random generation
    const seed = this.hashString(`${this.config.id}_planet_${index}`);
    const random = this.seededRandom(seed);

    // Generate unique name
    const prefixIndex = Math.floor(random() * PLANET_PREFIXES.length);
    const suffixIndex = Math.floor(random() * PLANET_SUFFIXES.length);
    const name = `${PLANET_PREFIXES[prefixIndex]} ${PLANET_SUFFIXES[suffixIndex]}`;

    // Determine planet type based on distance and star type
    const planetType = this.determinePlanetType(distance, random);
    
    // Size based on planet type
    const size = this.getSizeForPlanetType(planetType, random);

    // Color based on planet type
    const color = this.getColorForPlanetType(planetType, random);

    // Check if in habitable zone
    const habitableZone = HABITABLE_ZONES[this.config.star.type];
    const isInHabitableZone = distance >= habitableZone.inner && distance <= habitableZone.outer;
    
    // Habitable only if in zone AND suitable planet type
    const habitablePlanetTypes: PlanetType[] = ['earth_like', 'mars_like', 'ocean'];
    const isHabitable = isInHabitableZone && habitablePlanetTypes.includes(planetType);

    // Rings more likely on gas giants and ice giants
    const hasRings = (planetType === 'gas_giant' || planetType === 'ice_giant') && random() > 0.4;

    // Orbital speed inversely proportional to distance
    const orbitSpeed = 0.003 / Math.sqrt(distance / 15);

    return { name, distance, size, color, hasRings, orbitSpeed, planetType, isHabitable };
  }

  private determinePlanetType(distance: number, random: () => number): PlanetType {
    const habitableZone = HABITABLE_ZONES[this.config.star.type];
    
    // Very close to star - red hot
    if (distance < habitableZone.inner * 0.5) {
      return 'red_hot';
    }
    
    // Close to star but not too close - rocky or desert
    if (distance < habitableZone.inner) {
      const roll = random();
      if (roll < 0.5) return 'rocky';
      if (roll < 0.8) return 'desert';
      return 'mars_like';
    }
    
    // In habitable zone - variety of habitable types
    if (distance <= habitableZone.outer) {
      const roll = random();
      if (roll < 0.35) return 'earth_like';
      if (roll < 0.55) return 'ocean';
      if (roll < 0.75) return 'mars_like';
      if (roll < 0.9) return 'desert';
      return 'rocky';
    }
    
    // Just outside habitable zone - could be mars-like or icy
    if (distance <= habitableZone.outer * 1.5) {
      const roll = random();
      if (roll < 0.4) return 'mars_like';
      if (roll < 0.7) return 'icy_cold';
      return 'rocky';
    }
    
    // Far from star - gas giants, ice giants, or icy
    const roll = random();
    if (roll < 0.4) return 'gas_giant';
    if (roll < 0.7) return 'ice_giant';
    return 'icy_cold';
  }

  private getSizeForPlanetType(planetType: PlanetType, random: () => number): number {
    switch (planetType) {
      case 'gas_giant':
        return 2.5 + random() * 2; // 2.5 - 4.5
      case 'ice_giant':
        return 2 + random() * 1.5; // 2 - 3.5
      case 'earth_like':
        return 0.9 + random() * 0.4; // 0.9 - 1.3
      case 'ocean':
        return 0.8 + random() * 0.5; // 0.8 - 1.3
      case 'mars_like':
        return 0.5 + random() * 0.4; // 0.5 - 0.9
      case 'red_hot':
        return 0.4 + random() * 0.5; // 0.4 - 0.9
      case 'icy_cold':
        return 0.6 + random() * 0.8; // 0.6 - 1.4
      case 'desert':
        return 0.7 + random() * 0.5; // 0.7 - 1.2
      case 'rocky':
      default:
        return 0.5 + random() * 0.7; // 0.5 - 1.2
    }
  }

  private getColorForPlanetType(planetType: PlanetType, random: () => number): Color3 {
    switch (planetType) {
      case 'earth_like':
        // Blue and green tones
        return new Color3(0.2 + random() * 0.2, 0.5 + random() * 0.2, 0.7 + random() * 0.2);
      case 'mars_like':
        // Rusty red/orange
        return new Color3(0.8 + random() * 0.15, 0.35 + random() * 0.15, 0.2 + random() * 0.1);
      case 'gas_giant':
        // Jupiter-like bands (orange/brown/yellow)
        const gasRoll = random();
        if (gasRoll < 0.5) {
          return new Color3(0.85 + random() * 0.1, 0.6 + random() * 0.2, 0.4 + random() * 0.15);
        }
        // Saturn-like (golden/beige)
        return new Color3(0.9 + random() * 0.1, 0.8 + random() * 0.15, 0.5 + random() * 0.15);
      case 'ice_giant':
        // Neptune/Uranus blue-green
        return new Color3(0.2 + random() * 0.15, 0.5 + random() * 0.2, 0.8 + random() * 0.15);
      case 'icy_cold':
        // White/light blue
        return new Color3(0.8 + random() * 0.15, 0.85 + random() * 0.1, 0.95);
      case 'red_hot':
        // Bright red/orange volcanic
        return new Color3(0.95, 0.25 + random() * 0.2, 0.1 + random() * 0.1);
      case 'ocean':
        // Deep blue
        return new Color3(0.15 + random() * 0.1, 0.4 + random() * 0.2, 0.85 + random() * 0.1);
      case 'desert':
        // Sandy tan/brown
        return new Color3(0.85 + random() * 0.1, 0.7 + random() * 0.15, 0.45 + random() * 0.15);
      case 'rocky':
      default:
        // Gray/brown rocky
        return new Color3(0.5 + random() * 0.2, 0.45 + random() * 0.15, 0.4 + random() * 0.15);
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

  getHabitablePlanets(): ProceduralPlanet[] {
    return this.planets.filter(planet => planet.getIsHabitable());
  }

  getEvolvablePlanets(): ProceduralPlanet[] {
    return this.planets.filter(planet => planet.canEvolve());
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
