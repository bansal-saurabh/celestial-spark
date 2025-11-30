import { Scene, Vector3, GlowLayer } from '@babylonjs/core';
import { SolarSystem, STAR_TEMPLATES } from './SolarSystem';
import type { SolarSystemConfig, StarType } from './SolarSystem';
import { WarpEffect } from './WarpEffect';

// Predefined solar system names
const SYSTEM_NAMES = [
  'Sol Prime', 'Alpha Centauri', 'Kepler Haven', 'Proxima', 'Tau Ceti',
  'Epsilon Eridani', 'Sirius Major', 'Vega Prime', 'Altair System', 'Polaris',
  'Rigel Sector', 'Betelgeuse', 'Antares', 'Aldebaran', 'Arcturus'
];

// Prime numbers used for seed hashing to ensure good distribution
const HASH_PRIME_1 = 7919;
const HASH_PRIME_2 = 104729;
const HASH_GOLDEN_RATIO = 2654435769; // 2^32 / golden ratio
const HASH_PRIME_3 = 65537;

export interface GalaxyConfig {
  systemCount: number;
  seed?: number;
}

export class Galaxy {
  private scene: Scene;
  private glowLayer: GlowLayer;
  private config: GalaxyConfig;
  
  private solarSystems: SolarSystem[] = [];
  private currentSystemIndex: number = 0;
  private warpEffect: WarpEffect;
  private isTransitioning: boolean = false;
  private onSystemChangeCallbacks: ((system: SolarSystem) => void)[] = [];

  constructor(scene: Scene, glowLayer: GlowLayer, config: GalaxyConfig) {
    this.scene = scene;
    this.glowLayer = glowLayer;
    this.config = config;
    this.warpEffect = new WarpEffect(scene);
  }

  async create(): Promise<void> {
    // Create warp effect
    await this.warpEffect.create();

    // Generate solar systems
    for (let i = 0; i < this.config.systemCount; i++) {
      const systemConfig = this.generateSystemConfig(i);
      const system = new SolarSystem(this.scene, this.glowLayer, systemConfig);
      await system.create();
      
      // Only first system is active initially
      system.setActive(i === 0);
      
      this.solarSystems.push(system);
    }
  }

  private generateSystemConfig(index: number): SolarSystemConfig {
    // Use a more varied seed calculation to ensure diverse star types
    // Mixing the index with a prime multiplier creates better distribution
    const baseSeed = this.config.seed || 12345;
    const seed = this.hashSeed(baseSeed, index);
    const random = this.seededRandom(seed);

    // Select star type with weighted probability
    const starType = this.selectStarType(random);
    const starTemplate = STAR_TEMPLATES[starType];
    
    // Generate system name
    const nameIndex = index % SYSTEM_NAMES.length;
    const nameSuffix = index >= SYSTEM_NAMES.length ? ` ${Math.floor(index / SYSTEM_NAMES.length) + 1}` : '';
    const systemName = SYSTEM_NAMES[nameIndex] + nameSuffix;

    // Generate position in galaxy (for visualization purposes)
    const angle = random() * Math.PI * 2;
    const radius = 50 + random() * 200;
    const height = (random() - 0.5) * 50;
    const position = new Vector3(
      Math.cos(angle) * radius,
      height,
      Math.sin(angle) * radius
    );

    // Planet count based on star type
    const basePlanets = this.getBasePlanetCount(starType);
    const planetCount = basePlanets + Math.floor(random() * 3);

    return {
      id: `system_${index}`,
      name: systemName,
      position,
      star: {
        ...starTemplate,
        name: `${systemName} Star`,
      },
      planetCount,
    };
  }

  private selectStarType(random: () => number): StarType {
    const roll = random();
    
    // Weighted probability for star types
    // Red dwarfs are most common, blue giants are rare
    if (roll < 0.45) return 'red_dwarf';
    if (roll < 0.70) return 'yellow_dwarf';
    if (roll < 0.82) return 'orange_giant';
    if (roll < 0.90) return 'white_dwarf';
    if (roll < 0.96) return 'red_giant';
    return 'blue_giant';
  }

  private getBasePlanetCount(starType: StarType): number {
    switch (starType) {
      case 'red_dwarf': return 2;
      case 'yellow_dwarf': return 4;
      case 'orange_giant': return 3;
      case 'white_dwarf': return 1;
      case 'red_giant': return 2;
      case 'blue_giant': return 5;
      default: return 3;
    }
  }

  private seededRandom(seed: number): () => number {
    let state = seed;
    return () => {
      state = (state * 1103515245 + 12345) & 0x7fffffff;
      return state / 0x7fffffff;
    };
  }

  // Hash function to create better seed distribution for each system
  private hashSeed(baseSeed: number, index: number): number {
    // Mix the base seed with the index using prime multipliers for better distribution
    let hash = baseSeed;
    hash = ((hash << 5) - hash + index * HASH_PRIME_1) | 0;
    hash = ((hash << 7) - hash + index * HASH_PRIME_2) | 0;
    hash = ((hash * HASH_GOLDEN_RATIO) >>> 0) ^ (index * HASH_PRIME_3);
    return Math.abs(hash);
  }

  async travelToSystem(index: number): Promise<void> {
    if (index < 0 || index >= this.solarSystems.length) return;
    if (index === this.currentSystemIndex) return;
    if (this.isTransitioning) return;

    this.isTransitioning = true;
    const previousSystem = this.solarSystems[this.currentSystemIndex];
    const nextSystem = this.solarSystems[index];

    // Start warp effect
    this.warpEffect.startWarp(() => {
      // Deactivate previous system
      previousSystem.setActive(false);
      
      // Activate new system
      nextSystem.setActive(true);
      
      this.currentSystemIndex = index;
      this.isTransitioning = false;

      // Notify callbacks
      this.onSystemChangeCallbacks.forEach(cb => cb(nextSystem));
    });
  }

  travelToNextSystem(): Promise<void> {
    const nextIndex = (this.currentSystemIndex + 1) % this.solarSystems.length;
    return this.travelToSystem(nextIndex);
  }

  travelToPreviousSystem(): Promise<void> {
    const prevIndex = (this.currentSystemIndex - 1 + this.solarSystems.length) % this.solarSystems.length;
    return this.travelToSystem(prevIndex);
  }

  getCurrentSystem(): SolarSystem {
    return this.solarSystems[this.currentSystemIndex];
  }

  getCurrentSystemIndex(): number {
    return this.currentSystemIndex;
  }

  getSystemCount(): number {
    return this.solarSystems.length;
  }

  getAllSystems(): SolarSystem[] {
    return this.solarSystems;
  }

  getSystemNames(): string[] {
    return this.solarSystems.map(s => s.getConfig().name);
  }

  isInTransit(): boolean {
    return this.isTransitioning;
  }

  onSystemChange(callback: (system: SolarSystem) => void): void {
    this.onSystemChangeCallbacks.push(callback);
  }

  update(): void {
    // Update current system
    const currentSystem = this.solarSystems[this.currentSystemIndex];
    if (currentSystem) {
      currentSystem.update();
    }
  }

  dispose(): void {
    this.solarSystems.forEach(system => system.dispose());
    this.warpEffect.dispose();
  }
}
