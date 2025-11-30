import { Scene, MeshBuilder, StandardMaterial, Color3, Vector3, Mesh, VertexData } from '@babylonjs/core';

export class StarField {
  private scene: Scene;
  private starMesh: Mesh | null = null;
  private starCount: number = 5000;
  private skyboxRadius: number = 500;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  async create(): Promise<void> {
    // Create a custom point cloud for stars
    this.createStarPoints();
    
    // Create some brighter distant stars as small spheres
    this.createBrightStars();
    
    // Create nebula effect
    this.createNebula();
  }

  private createStarPoints(): void {
    const positions: number[] = [];
    const colors: number[] = [];

    for (let i = 0; i < this.starCount; i++) {
      // Random position on a sphere
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = this.skyboxRadius * (0.8 + Math.random() * 0.2);

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      positions.push(x, y, z);

      // Random star color (white to blue to yellow)
      const colorType = Math.random();
      let r: number, g: number, b: number;
      
      if (colorType < 0.6) {
        // White stars
        const brightness = 0.7 + Math.random() * 0.3;
        r = brightness;
        g = brightness;
        b = brightness;
      } else if (colorType < 0.8) {
        // Blue stars
        r = 0.6 + Math.random() * 0.2;
        g = 0.7 + Math.random() * 0.2;
        b = 0.9 + Math.random() * 0.1;
      } else if (colorType < 0.95) {
        // Yellow/orange stars
        r = 1;
        g = 0.8 + Math.random() * 0.2;
        b = 0.5 + Math.random() * 0.3;
      } else {
        // Red stars
        r = 1;
        g = 0.4 + Math.random() * 0.2;
        b = 0.3 + Math.random() * 0.2;
      }

      // Random alpha for twinkling effect base
      const alpha = 0.5 + Math.random() * 0.5;
      colors.push(r, g, b, alpha);
    }

    // Create custom mesh
    const customMesh = new Mesh('starField', this.scene);
    
    const vertexData = new VertexData();
    vertexData.positions = positions;
    vertexData.colors = colors;
    
    // Create indices for point cloud
    const indices: number[] = [];
    for (let i = 0; i < this.starCount; i++) {
      indices.push(i);
    }
    vertexData.indices = indices;
    
    vertexData.applyToMesh(customMesh);

    // Create material
    const material = new StandardMaterial('starMaterial', this.scene);
    material.emissiveColor = new Color3(1, 1, 1);
    material.disableLighting = true;
    material.pointsCloud = true;
    material.pointSize = 2;
    customMesh.material = material;

    this.starMesh = customMesh;
  }

  private createBrightStars(): void {
    const brightStarCount = 50;

    for (let i = 0; i < brightStarCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = this.skyboxRadius * 0.95;

      const position = new Vector3(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi)
      );

      const size = 0.5 + Math.random() * 1.5;
      const star = MeshBuilder.CreateSphere(`brightStar_${i}`, { diameter: size, segments: 8 }, this.scene);
      star.position = position;

      const material = new StandardMaterial(`brightStarMat_${i}`, this.scene);
      
      // Random color
      const colorType = Math.random();
      if (colorType < 0.5) {
        material.emissiveColor = new Color3(1, 1, 1);
      } else if (colorType < 0.7) {
        material.emissiveColor = new Color3(0.8, 0.9, 1);
      } else if (colorType < 0.9) {
        material.emissiveColor = new Color3(1, 0.95, 0.8);
      } else {
        material.emissiveColor = new Color3(1, 0.7, 0.5);
      }
      
      material.disableLighting = true;
      star.material = material;
    }
  }

  private createNebula(): void {
    // Create several nebula clouds using transparent spheres
    const nebulaConfigs = [
      { position: new Vector3(200, 100, -300), color: new Color3(0.3, 0.1, 0.5), size: 150 },
      { position: new Vector3(-250, -50, 200), color: new Color3(0.1, 0.3, 0.5), size: 120 },
      { position: new Vector3(100, 200, 250), color: new Color3(0.5, 0.2, 0.3), size: 100 },
      { position: new Vector3(-180, 150, -180), color: new Color3(0.2, 0.4, 0.5), size: 130 },
    ];

    for (let i = 0; i < nebulaConfigs.length; i++) {
      const config = nebulaConfigs[i];
      
      // Create main nebula sphere
      const nebula = MeshBuilder.CreateSphere(`nebula_${i}`, { diameter: config.size, segments: 16 }, this.scene);
      nebula.position = config.position;
      
      const material = new StandardMaterial(`nebulaMat_${i}`, this.scene);
      material.emissiveColor = config.color;
      material.alpha = 0.05;
      material.disableLighting = true;
      material.backFaceCulling = false;
      nebula.material = material;

      // Add some variation with smaller spheres
      for (let j = 0; j < 5; j++) {
        const offset = new Vector3(
          (Math.random() - 0.5) * config.size * 0.5,
          (Math.random() - 0.5) * config.size * 0.5,
          (Math.random() - 0.5) * config.size * 0.5
        );
        
        const subNebula = MeshBuilder.CreateSphere(`nebula_${i}_${j}`, { diameter: config.size * (0.3 + Math.random() * 0.3), segments: 12 }, this.scene);
        subNebula.position = config.position.add(offset);
        
        const subMaterial = new StandardMaterial(`nebulaMat_${i}_${j}`, this.scene);
        subMaterial.emissiveColor = config.color;
        subMaterial.alpha = 0.03 + Math.random() * 0.03;
        subMaterial.disableLighting = true;
        subMaterial.backFaceCulling = false;
        subNebula.material = subMaterial;
      }
    }
  }

  dispose(): void {
    if (this.starMesh) {
      this.starMesh.dispose();
    }
  }
}
