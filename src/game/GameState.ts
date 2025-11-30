export interface CelestialBodyData {
  type: string;
  distance: number;
  size: number;
  ignited: boolean;
}

export interface GameStateData {
  discoveredBodies: Map<string, CelestialBodyData>;
  ignitedCount: number;
  totalPlanets: number;
  playTime: number;
  score: number;
}

export class GameState {
  private discoveredBodies: Map<string, CelestialBodyData> = new Map();
  private ignitedCount: number = 0;
  private totalPlanets: number = 0;
  private startTime: number = Date.now();
  private score: number = 0;

  constructor() {
    this.loadState();
  }

  addDiscoveredBody(name: string, data: CelestialBodyData): void {
    if (!this.discoveredBodies.has(name)) {
      this.discoveredBodies.set(name, data);
      if (data.type === 'planet') {
        this.totalPlanets++;
      }
    }
  }

  ignitePlanet(name: string): void {
    const body = this.discoveredBodies.get(name);
    if (body && !body.ignited) {
      body.ignited = true;
      this.ignitedCount++;
      this.score += Math.floor(body.distance * 100 + body.size * 500);
      this.saveState();
    }
  }

  getDiscoveredBodies(): Map<string, CelestialBodyData> {
    return this.discoveredBodies;
  }

  getIgitedCount(): number {
    return this.ignitedCount;
  }

  getTotalPlanets(): number {
    return this.totalPlanets;
  }

  getScore(): number {
    return this.score;
  }

  getPlayTime(): number {
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  getFormattedPlayTime(): string {
    const seconds = this.getPlayTime();
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m ${seconds % 60}s`;
  }

  getProgress(): number {
    if (this.totalPlanets === 0) return 0;
    return Math.floor((this.ignitedCount / this.totalPlanets) * 100);
  }

  saveState(): void {
    try {
      const stateData: GameStateData = {
        discoveredBodies: this.discoveredBodies,
        ignitedCount: this.ignitedCount,
        totalPlanets: this.totalPlanets,
        playTime: this.getPlayTime(),
        score: this.score
      };
      
      // Convert Map to array for JSON serialization
      const serializable = {
        ...stateData,
        discoveredBodies: Array.from(this.discoveredBodies.entries())
      };
      
      localStorage.setItem('celestialSparkState', JSON.stringify(serializable));
    } catch (e) {
      console.warn('Failed to save game state:', e);
    }
  }

  loadState(): void {
    try {
      const saved = localStorage.getItem('celestialSparkState');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.discoveredBodies = new Map(parsed.discoveredBodies);
        this.ignitedCount = parsed.ignitedCount || 0;
        this.totalPlanets = parsed.totalPlanets || 0;
        this.score = parsed.score || 0;
      }
    } catch (e) {
      console.warn('Failed to load game state:', e);
    }
  }

  resetState(): void {
    this.discoveredBodies.clear();
    this.ignitedCount = 0;
    this.totalPlanets = 0;
    this.score = 0;
    this.startTime = Date.now();
    localStorage.removeItem('celestialSparkState');
  }
}
