import { Engine, Scene, Vector3, HemisphericLight, ArcRotateCamera, Color4, Color3, GlowLayer } from '@babylonjs/core';
import { StarField } from './StarField';
import { ProceduralPlanet } from './ProceduralPlanet';
import { Galaxy } from './Galaxy';
import { UIOverlay } from '../ui/UIOverlay';
import { GameState } from './GameState';
import { isMobileDevice } from '../utils/deviceUtils';

export class Game {
  private canvas: HTMLCanvasElement;
  private engine: Engine;
  private scene: Scene;
  private camera: ArcRotateCamera;
  private starField: StarField;
  private galaxy: Galaxy | null = null;
  private uiOverlay: UIOverlay;
  private gameState: GameState;
  private glowLayer: GlowLayer;
  private isRunning: boolean = false;
  private isMobile: boolean = false;

  constructor() {
    this.canvas = document.getElementById('babylon-canvas') as HTMLCanvasElement;
    this.engine = new Engine(this.canvas, true, { preserveDrawingBuffer: true, stencil: true });
    this.scene = new Scene(this.engine);
    this.gameState = new GameState();
    this.isMobile = isMobileDevice();
    this.camera = this.createCamera();
    this.starField = new StarField(this.scene);
    this.uiOverlay = new UIOverlay(this.gameState, {
      onIgnite: () => this.igniteSelectedPlanet(),
      onReset: () => this.resetCamera(),
      onHelp: () => this.uiOverlay.toggleHelp(),
      onZoomIn: () => this.zoomCamera(-10),
      onZoomOut: () => this.zoomCamera(10),
      onNextSystem: () => this.travelToNextSystem(),
      onPrevSystem: () => this.travelToPreviousSystem(),
    });
    this.glowLayer = new GlowLayer('glow', this.scene);
    this.glowLayer.intensity = 0.8;
  }

  private zoomCamera(delta: number): void {
    const newRadius = Math.max(
      this.camera.lowerRadiusLimit || 5,
      Math.min(this.camera.upperRadiusLimit || 200, this.camera.radius + delta)
    );
    this.camera.radius = newRadius;
  }

  async init(): Promise<void> {
    // Set scene background to deep space black
    this.scene.clearColor = new Color4(0, 0, 0.02, 1);

    // Setup lighting
    this.setupLighting();

    // Create star field background
    await this.starField.create();

    this.updateLoadingProgress(20);

    // Create the galaxy with multiple solar systems
    this.galaxy = new Galaxy(this.scene, this.glowLayer, {
      systemCount: 5, // Start with 5 solar systems
      seed: 42
    });
    await this.galaxy.create();

    // Register planets from current system with game state
    this.registerCurrentSystemPlanets();

    // Listen for system changes
    this.galaxy.onSystemChange((system) => {
      this.handleSystemChange(system);
    });

    this.updateLoadingProgress(80);

    // Initialize UI overlay
    await this.uiOverlay.init();

    // Update UI with current system info
    this.updateSystemInfo();

    // Setup window resize handler
    window.addEventListener('resize', () => {
      this.engine.resize();
      this.uiOverlay.resize();
    });

    // Setup keyboard controls
    this.setupControls();

    // Update loading progress
    this.updateLoadingProgress(100);

    // Hide loading screen after a short delay
    setTimeout(() => {
      const loadingScreen = document.getElementById('loading-screen');
      if (loadingScreen) {
        loadingScreen.classList.add('hidden');
        setTimeout(() => {
          loadingScreen.style.display = 'none';
        }, 1000);
      }
    }, 500);
  }

  private registerCurrentSystemPlanets(): void {
    if (!this.galaxy) return;
    
    const currentSystem = this.galaxy.getCurrentSystem();
    const planets = currentSystem.getPlanets();
    
    planets.forEach(planet => {
      const info = planet.getInfo();
      this.gameState.addDiscoveredBody(planet.getName(), {
        type: 'planet',
        distance: info.distance,
        size: info.size,
        ignited: info.ignited
      });
    });
  }

  private handleSystemChange(system: import('./SolarSystem').SolarSystem): void {
    // Reset camera
    this.resetCamera();
    
    // Update UI with new system info
    this.updateSystemInfo();
    
    // Register new system's planets
    const planets = system.getPlanets();
    planets.forEach(planet => {
      const info = planet.getInfo();
      this.gameState.addDiscoveredBody(planet.getName(), {
        type: 'planet',
        distance: info.distance,
        size: info.size,
        ignited: info.ignited
      });
    });

    // Show notification
    this.uiOverlay.showNotification(`Arrived at ${system.getConfig().name}!`);
  }

  private updateSystemInfo(): void {
    if (!this.galaxy) return;
    
    const currentSystem = this.galaxy.getCurrentSystem();
    const systemIndex = this.galaxy.getCurrentSystemIndex();
    const totalSystems = this.galaxy.getSystemCount();
    
    this.uiOverlay.setSystemInfo(
      currentSystem.getConfig().name,
      systemIndex + 1,
      totalSystems
    );
  }

  private async travelToNextSystem(): Promise<void> {
    if (!this.galaxy || this.galaxy.isInTransit()) return;
    await this.galaxy.travelToNextSystem();
  }

  private async travelToPreviousSystem(): Promise<void> {
    if (!this.galaxy || this.galaxy.isInTransit()) return;
    await this.galaxy.travelToPreviousSystem();
  }

  private createCamera(): ArcRotateCamera {
    const camera = new ArcRotateCamera(
      'camera',
      Math.PI / 2,
      Math.PI / 3,
      50,
      Vector3.Zero(),
      this.scene
    );
    camera.attachControl(this.canvas, true);
    camera.lowerRadiusLimit = 5;
    camera.upperRadiusLimit = 200;
    camera.wheelPrecision = 20;
    camera.panningSensibility = 100;
    camera.inertia = 0.9;
    camera.angularSensibilityX = 500;
    camera.angularSensibilityY = 500;
    
    // Limit vertical rotation to prevent rendering issues at extreme angles
    camera.lowerBetaLimit = 0.1;
    camera.upperBetaLimit = Math.PI - 0.1;
    
    // Improved touch controls for mobile
    if (this.isMobile) {
      // Better pinch-to-zoom sensitivity
      camera.pinchPrecision = 50;
      // Smoother touch rotation
      camera.angularSensibilityX = 1000;
      camera.angularSensibilityY = 1000;
      // Higher inertia for smoother mobile experience
      camera.inertia = 0.92;
      // Enable multi-touch gestures
      camera.panningSensibility = 200;
      // Use two-finger pan for panning (not rotation)
      camera.pinchToPanMaxDistance = 50;
    }
    
    return camera;
  }

  private setupLighting(): void {
    // Ambient light for general illumination
    const ambientLight = new HemisphericLight(
      'ambientLight',
      new Vector3(0, 1, 0),
      this.scene
    );
    ambientLight.intensity = 0.1;
    ambientLight.groundColor = new Color3(0.05, 0.05, 0.1);
  }

  private getCurrentPlanets(): ProceduralPlanet[] {
    if (!this.galaxy) return [];
    return this.galaxy.getCurrentSystem().getPlanets();
  }

  private setupControls(): void {
    document.addEventListener('keydown', (event) => {
      switch (event.code) {
        case 'Space':
          this.igniteSelectedPlanet();
          break;
        case 'KeyR':
          this.resetCamera();
          break;
        case 'KeyH':
          this.uiOverlay.toggleHelp();
          break;
        case 'KeyN':
        case 'ArrowRight':
          this.travelToNextSystem();
          break;
        case 'KeyP':
        case 'ArrowLeft':
          this.travelToPreviousSystem();
          break;
        case 'Digit1':
        case 'Digit2':
        case 'Digit3':
        case 'Digit4':
        case 'Digit5':
        case 'Digit6':
        case 'Digit7':
        case 'Digit8':
        case 'Digit9':
          const index = parseInt(event.code.replace('Digit', '')) - 1;
          const planets = this.getCurrentPlanets();
          if (index < planets.length) {
            this.focusPlanet(planets[index]);
          }
          break;
      }
    });

    // Click to select planet
    this.scene.onPointerDown = (_evt, pickResult) => {
      if (pickResult.hit && pickResult.pickedMesh) {
        const meshName = pickResult.pickedMesh.name;
        const planets = this.getCurrentPlanets();
        const planet = planets.find(p => p.getName() === meshName || meshName.startsWith(p.getName()));
        if (planet) {
          this.focusPlanet(planet);
        }
      }
    };
  }

  private igniteSelectedPlanet(): void {
    const planets = this.getCurrentPlanets();
    const selectedPlanet = planets.find(p => p.isSelected());
    if (selectedPlanet && !selectedPlanet.isIgnited()) {
      selectedPlanet.ignite();
      this.gameState.ignitePlanet(selectedPlanet.getName());
      this.uiOverlay.showNotification(`${selectedPlanet.getName()} has been ignited!`);
    }
  }

  private focusPlanet(planet: ProceduralPlanet): void {
    // Deselect all planets in current system
    const planets = this.getCurrentPlanets();
    planets.forEach(p => p.setSelected(false));
    
    // Select this planet
    planet.setSelected(true);
    
    // Move camera to focus on planet
    const position = planet.getPosition();
    this.camera.setTarget(position);
    
    // Update UI
    this.uiOverlay.setSelectedPlanet(planet.getName(), planet.getInfo());
  }

  private resetCamera(): void {
    this.camera.setTarget(Vector3.Zero());
    this.camera.alpha = Math.PI / 2;
    this.camera.beta = Math.PI / 3;
    this.camera.radius = 50;
    
    // Deselect all planets in current system
    const planets = this.getCurrentPlanets();
    planets.forEach(p => p.setSelected(false));
    this.uiOverlay.clearSelection();
  }

  private updateLoadingProgress(progress: number): void {
    const progressBar = document.querySelector('.loading-progress') as HTMLElement;
    if (progressBar) {
      progressBar.style.width = `${progress}%`;
      progressBar.style.animation = 'none';
    }
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    this.engine.runRenderLoop(() => {
      // Update galaxy (which updates current solar system)
      if (this.galaxy) {
        this.galaxy.update();
      }
      
      // Update UI
      this.uiOverlay.update();
      
      // Render the scene
      this.scene.render();
    });
  }

  stop(): void {
    this.isRunning = false;
    this.engine.stopRenderLoop();
  }

  dispose(): void {
    this.stop();
    this.uiOverlay.dispose();
    if (this.galaxy) {
      this.galaxy.dispose();
    }
    this.scene.dispose();
    this.engine.dispose();
  }
}
