import { Scene, MeshBuilder, StandardMaterial, Color3, Vector3, Mesh, InstancedMesh } from '@babylonjs/core';

export class AsteroidBelt {
  private scene: Scene;
  private asteroids: InstancedMesh[] = [];
  private baseMesh: Mesh | null = null;
  private innerRadius: number;
  private outerRadius: number;
  private asteroidCount: number;
  private orbitSpeeds: number[] = [];

  constructor(scene: Scene, innerRadius: number = 30, outerRadius: number = 35, asteroidCount: number = 200) {
    this.scene = scene;
    this.innerRadius = innerRadius;
    this.outerRadius = outerRadius;
    this.asteroidCount = asteroidCount;
  }

  async create(): Promise<void> {
    // Create base asteroid mesh (low poly rock)
    this.baseMesh = MeshBuilder.CreatePolyhedron('asteroidBase', {
      type: 1, // Octahedron
      size: 0.3
    }, this.scene);

    const material = new StandardMaterial('asteroidMaterial', this.scene);
    material.diffuseColor = new Color3(0.4, 0.35, 0.3);
    material.specularColor = new Color3(0.1, 0.1, 0.1);
    this.baseMesh.material = material;
    this.baseMesh.isVisible = false; // Hide base mesh

    // Create asteroid instances
    for (let i = 0; i < this.asteroidCount; i++) {
      const asteroid = this.baseMesh.createInstance(`asteroid_${i}`);
      
      // Random position in the belt
      const angle = Math.random() * Math.PI * 2;
      const distance = this.innerRadius + Math.random() * (this.outerRadius - this.innerRadius);
      const heightVariation = (Math.random() - 0.5) * 2; // Slight vertical spread
      
      asteroid.position = new Vector3(
        Math.cos(angle) * distance,
        heightVariation,
        Math.sin(angle) * distance
      );

      // Random rotation
      asteroid.rotation = new Vector3(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      );

      // Random scale for variety
      const scale = 0.5 + Math.random() * 1.5;
      asteroid.scaling = new Vector3(scale, scale * (0.7 + Math.random() * 0.6), scale);

      // Store orbit speed for animation
      this.orbitSpeeds.push(0.0001 + Math.random() * 0.0003);
      
      // Store initial angle in metadata
      asteroid.metadata = { angle, distance, heightVariation };
      
      this.asteroids.push(asteroid);
    }
  }

  update(): void {
    for (let i = 0; i < this.asteroids.length; i++) {
      const asteroid = this.asteroids[i];
      if (asteroid.metadata) {
        asteroid.metadata.angle += this.orbitSpeeds[i];
        const angle = asteroid.metadata.angle;
        const distance = asteroid.metadata.distance;
        
        asteroid.position.x = Math.cos(angle) * distance;
        asteroid.position.z = Math.sin(angle) * distance;
        
        // Slow rotation on axis
        asteroid.rotation.y += 0.002;
      }
    }
  }

  dispose(): void {
    for (const asteroid of this.asteroids) {
      asteroid.dispose();
    }
    if (this.baseMesh) {
      this.baseMesh.dispose();
    }
  }
}
