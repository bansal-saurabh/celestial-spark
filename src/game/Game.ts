import { Engine, Scene, Vector3, HemisphericLight, ArcRotateCamera, Color4, MeshBuilder, StandardMaterial, Color3, Texture, PointLight, ParticleSystem, GlowLayer } from '@babylonjs/core';
import { StarField } from './StarField';
import { CelestialBody } from './CelestialBody';
import { ProceduralPlanet } from './ProceduralPlanet';
import { UIOverlay } from '../ui/UIOverlay';
import { GameState } from './GameState';

export class Game {
  private canvas: HTMLCanvasElement;
  private engine: Engine;
  private scene: Scene;
  private camera: ArcRotateCamera;
  private starField: StarField;
  private celestialBodies: CelestialBody[] = [];
  private proceduralPlanets: ProceduralPlanet[] = [];
  private uiOverlay: UIOverlay;
  private gameState: GameState;
  private glowLayer: GlowLayer;
  private isRunning: boolean = false;

  constructor() {
    this.canvas = document.getElementById('babylon-canvas') as HTMLCanvasElement;
    this.engine = new Engine(this.canvas, true, { preserveDrawingBuffer: true, stencil: true });
    this.scene = new Scene(this.engine);
    this.gameState = new GameState();
    this.camera = this.createCamera();
    this.starField = new StarField(this.scene);
    this.uiOverlay = new UIOverlay(this.gameState);
    this.glowLayer = new GlowLayer('glow', this.scene);
    this.glowLayer.intensity = 0.8;
  }

  async init(): Promise<void> {
    // Set scene background to deep space black
    this.scene.clearColor = new Color4(0, 0, 0.02, 1);

    // Setup lighting
    this.setupLighting();

    // Create star field background
    await this.starField.create();

    // Create the solar system
    await this.createSolarSystem();

    // Initialize UI overlay
    await this.uiOverlay.init();

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

    // Main sun light
    const sunLight = new PointLight(
      'sunLight',
      Vector3.Zero(),
      this.scene
    );
    sunLight.intensity = 2;
    sunLight.diffuse = new Color3(1, 0.95, 0.8);
    sunLight.specular = new Color3(1, 0.95, 0.8);
  }

  private async createSolarSystem(): Promise<void> {
    this.updateLoadingProgress(20);

    // Create the Sun
    const sun = this.createSun();
    this.celestialBodies.push(sun);

    this.updateLoadingProgress(40);

    // Create procedurally generated planets
    const planetConfigs = [
      { name: 'Terra Nova', distance: 15, size: 1.5, color: new Color3(0.3, 0.5, 0.8), hasRings: false, orbitSpeed: 0.002 },
      { name: 'Crimson Forge', distance: 25, size: 1.2, color: new Color3(0.8, 0.3, 0.2), hasRings: false, orbitSpeed: 0.0015 },
      { name: 'Jade Titan', distance: 38, size: 3.5, color: new Color3(0.4, 0.6, 0.4), hasRings: true, orbitSpeed: 0.001 },
      { name: 'Azure Giant', distance: 55, size: 2.8, color: new Color3(0.2, 0.4, 0.7), hasRings: true, orbitSpeed: 0.0008 },
      { name: 'Frost Haven', distance: 70, size: 1.8, color: new Color3(0.7, 0.8, 0.9), hasRings: false, orbitSpeed: 0.0006 },
    ];

    for (let i = 0; i < planetConfigs.length; i++) {
      const config = planetConfigs[i];
      const planet = new ProceduralPlanet(
        config.name,
        config.distance,
        config.size,
        config.color,
        config.hasRings,
        config.orbitSpeed,
        this.scene,
        this.glowLayer
      );
      await planet.create();
      this.proceduralPlanets.push(planet);
      
      // Add to game state
      this.gameState.addDiscoveredBody(config.name, {
        type: 'planet',
        distance: config.distance,
        size: config.size,
        ignited: false
      });

      this.updateLoadingProgress(40 + ((i + 1) / planetConfigs.length) * 40);
    }

    this.updateLoadingProgress(80);

    // Create orbit lines
    this.createOrbitLines(planetConfigs.map(p => p.distance));

    this.updateLoadingProgress(90);
  }

  private createSun(): CelestialBody {
    const sunMesh = MeshBuilder.CreateSphere('sun', { diameter: 8, segments: 32 }, this.scene);
    
    const sunMaterial = new StandardMaterial('sunMaterial', this.scene);
    sunMaterial.emissiveColor = new Color3(1, 0.8, 0.3);
    sunMaterial.disableLighting = true;
    sunMesh.material = sunMaterial;

    // Add glow to sun
    this.glowLayer.addIncludedOnlyMesh(sunMesh);
    this.glowLayer.customEmissiveColorSelector = (mesh, _subMesh, _material, result) => {
      if (mesh.name === 'sun') {
        result.set(1, 0.7, 0.2, 1);
      }
    };

    // Create sun corona particle effect
    this.createSunCorona();

    // Add to game state
    this.gameState.addDiscoveredBody('Sol Prime', {
      type: 'star',
      distance: 0,
      size: 8,
      ignited: true
    });

    return new CelestialBody('Sol Prime', sunMesh, 0, 0);
  }

  private createSunCorona(): void {
    const particleSystem = new ParticleSystem('sunCorona', 2000, this.scene);
    
    // Create a simple particle texture
    const size = 32;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    
    const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    gradient.addColorStop(0, 'rgba(255, 200, 100, 1)');
    gradient.addColorStop(0.5, 'rgba(255, 150, 50, 0.5)');
    gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    
    const texture = new Texture('data:' + canvas.toDataURL(), this.scene);
    particleSystem.particleTexture = texture;

    particleSystem.emitter = Vector3.Zero();
    particleSystem.minEmitBox = new Vector3(-2, -2, -2);
    particleSystem.maxEmitBox = new Vector3(2, 2, 2);

    particleSystem.color1 = new Color4(1, 0.8, 0.3, 1);
    particleSystem.color2 = new Color4(1, 0.5, 0.1, 1);
    particleSystem.colorDead = new Color4(1, 0.2, 0, 0);

    particleSystem.minSize = 0.5;
    particleSystem.maxSize = 2;

    particleSystem.minLifeTime = 0.5;
    particleSystem.maxLifeTime = 1.5;

    particleSystem.emitRate = 500;

    particleSystem.blendMode = ParticleSystem.BLENDMODE_ADD;

    particleSystem.gravity = new Vector3(0, 0, 0);

    particleSystem.direction1 = new Vector3(-1, -1, -1);
    particleSystem.direction2 = new Vector3(1, 1, 1);

    particleSystem.minAngularSpeed = 0;
    particleSystem.maxAngularSpeed = Math.PI;

    particleSystem.minEmitPower = 1;
    particleSystem.maxEmitPower = 3;
    particleSystem.updateSpeed = 0.01;

    particleSystem.start();
  }

  private createOrbitLines(distances: number[]): void {
    for (const distance of distances) {
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
        `orbit_${distance}`,
        { points, updatable: false },
        this.scene
      );
      
      orbitLine.color = new Color3(0.2, 0.3, 0.5);
      orbitLine.alpha = 0.3;
    }
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
        case 'Digit1':
        case 'Digit2':
        case 'Digit3':
        case 'Digit4':
        case 'Digit5':
          const index = parseInt(event.code.replace('Digit', '')) - 1;
          if (index < this.proceduralPlanets.length) {
            this.focusPlanet(this.proceduralPlanets[index]);
          }
          break;
      }
    });

    // Click to select planet
    this.scene.onPointerDown = (_evt, pickResult) => {
      if (pickResult.hit && pickResult.pickedMesh) {
        const meshName = pickResult.pickedMesh.name;
        const planet = this.proceduralPlanets.find(p => p.getName() === meshName || meshName.startsWith(p.getName()));
        if (planet) {
          this.focusPlanet(planet);
        }
      }
    };
  }

  private igniteSelectedPlanet(): void {
    const selectedPlanet = this.proceduralPlanets.find(p => p.isSelected());
    if (selectedPlanet && !selectedPlanet.isIgnited()) {
      selectedPlanet.ignite();
      this.gameState.ignitePlanet(selectedPlanet.getName());
      this.uiOverlay.showNotification(`${selectedPlanet.getName()} has been ignited!`);
    }
  }

  private focusPlanet(planet: ProceduralPlanet): void {
    // Deselect all planets
    this.proceduralPlanets.forEach(p => p.setSelected(false));
    
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
    
    // Deselect all planets
    this.proceduralPlanets.forEach(p => p.setSelected(false));
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
      // Update all celestial bodies
      this.proceduralPlanets.forEach(planet => planet.update());
      
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
    this.scene.dispose();
    this.engine.dispose();
  }
}
