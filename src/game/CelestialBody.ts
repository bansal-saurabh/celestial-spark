import { Mesh, Vector3 } from '@babylonjs/core';

export class CelestialBody {
  protected name: string;
  protected mesh: Mesh;
  protected orbitDistance: number;
  protected orbitSpeed: number;
  protected orbitAngle: number = 0;
  protected rotationSpeed: number = 0.01;

  constructor(name: string, mesh: Mesh, orbitDistance: number, orbitSpeed: number) {
    this.name = name;
    this.mesh = mesh;
    this.orbitDistance = orbitDistance;
    this.orbitSpeed = orbitSpeed;
    this.orbitAngle = Math.random() * Math.PI * 2;
  }

  update(): void {
    // Update orbit position
    if (this.orbitDistance > 0) {
      this.orbitAngle += this.orbitSpeed;
      this.mesh.position.x = Math.cos(this.orbitAngle) * this.orbitDistance;
      this.mesh.position.z = Math.sin(this.orbitAngle) * this.orbitDistance;
    }

    // Rotate on axis
    this.mesh.rotation.y += this.rotationSpeed;
  }

  getPosition(): Vector3 {
    return this.mesh.position.clone();
  }

  getName(): string {
    return this.name;
  }

  getMesh(): Mesh {
    return this.mesh;
  }

  setRotationSpeed(speed: number): void {
    this.rotationSpeed = speed;
  }

  dispose(): void {
    this.mesh.dispose();
  }
}
