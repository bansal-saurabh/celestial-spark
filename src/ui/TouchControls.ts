import { isMobileDevice } from '../utils/deviceUtils';

export interface TouchControlsCallbacks {
  onIgnite: () => void;
  onReset: () => void;
  onHelp: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export class TouchControls {
  private callbacks: TouchControlsCallbacks;
  private isVisible: boolean = false;
  private isMobile: boolean = false;
  private container: HTMLDivElement | null = null;

  // UI Elements (now HTML elements)
  private igniteButton: HTMLButtonElement | null = null;
  private resetButton: HTMLButtonElement | null = null;
  private helpButton: HTMLButtonElement | null = null;
  private zoomInButton: HTMLButtonElement | null = null;
  private zoomOutButton: HTMLButtonElement | null = null;

  constructor(callbacks: TouchControlsCallbacks) {
    this.callbacks = callbacks;
    this.isMobile = isMobileDevice();
  }

  async init(): Promise<void> {
    if (!this.isMobile) {
      return; // Don't show touch controls on desktop
    }

    this.isVisible = true;
    
    // Create container div for touch controls
    this.container = document.createElement('div');
    this.container.id = 'touch-controls';
    this.container.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 20;
      pointer-events: none;
    `;
    document.getElementById('app')?.appendChild(this.container);

    // Create action buttons on the right side
    this.createActionButtons();

    // Create zoom controls
    this.createZoomControls();
  }

  private createActionButtons(): void {
    if (!this.container) return;

    const buttonSize = 60;
    const padding = 20;
    const rightMargin = 20;
    const bottomMargin = 150;

    // Ignite button (primary action)
    this.igniteButton = this.createCircleButton(
      'IGNITE',
      '#ff6600',
      buttonSize,
      () => this.callbacks.onIgnite()
    );
    this.igniteButton.style.right = `${rightMargin}px`;
    this.igniteButton.style.bottom = `${bottomMargin}px`;
    this.container.appendChild(this.igniteButton);

    // Reset button
    this.resetButton = this.createCircleButton(
      'R',
      '#4080ff',
      buttonSize * 0.7,
      () => this.callbacks.onReset()
    );
    this.resetButton.style.right = `${rightMargin + (buttonSize - buttonSize * 0.7) / 2}px`;
    this.resetButton.style.bottom = `${bottomMargin + buttonSize + padding}px`;
    this.container.appendChild(this.resetButton);

    // Help button
    this.helpButton = this.createCircleButton(
      '?',
      '#4080ff',
      buttonSize * 0.7,
      () => this.callbacks.onHelp()
    );
    this.helpButton.style.right = `${rightMargin + (buttonSize - buttonSize * 0.7) / 2}px`;
    this.helpButton.style.bottom = `${bottomMargin + (buttonSize + padding) * 2}px`;
    this.container.appendChild(this.helpButton);
  }

  private createZoomControls(): void {
    if (!this.container) return;

    const buttonSize = 50;
    const padding = 10;
    const leftMargin = 20;
    const bottomMargin = 150;

    // Zoom in button
    this.zoomInButton = this.createCircleButton(
      '+',
      '#4080ff',
      buttonSize,
      () => this.callbacks.onZoomIn()
    );
    this.zoomInButton.style.left = `${leftMargin}px`;
    this.zoomInButton.style.bottom = `${bottomMargin + buttonSize + padding}px`;
    this.container.appendChild(this.zoomInButton);

    // Zoom out button
    this.zoomOutButton = this.createCircleButton(
      '−',
      '#4080ff',
      buttonSize,
      () => this.callbacks.onZoomOut()
    );
    this.zoomOutButton.style.left = `${leftMargin}px`;
    this.zoomOutButton.style.bottom = `${bottomMargin}px`;
    this.container.appendChild(this.zoomOutButton);
  }

  private createCircleButton(
    label: string,
    color: string,
    size: number,
    onClick: () => void
  ): HTMLButtonElement {
    const button = document.createElement('button');
    button.textContent = label;
    button.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background: rgba(0, 20, 40, 0.8);
      border: 2px solid ${color};
      color: white;
      font-family: 'Segoe UI', system-ui, sans-serif;
      font-size: ${label.length > 2 ? 10 : 20}px;
      font-weight: bold;
      cursor: pointer;
      pointer-events: auto;
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
      transition: box-shadow 0.2s ease, background 0.2s ease;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
    `;

    // Touch/pointer events
    button.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      button.style.background = `${color}80`;
      button.style.boxShadow = `0 0 20px ${color}60`;
    });

    button.addEventListener('pointerup', (e) => {
      e.preventDefault();
      button.style.background = 'rgba(0, 20, 40, 0.8)';
      button.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
      onClick();
    });

    button.addEventListener('pointerleave', () => {
      button.style.background = 'rgba(0, 20, 40, 0.8)';
      button.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
    });

    button.addEventListener('pointercancel', () => {
      button.style.background = 'rgba(0, 20, 40, 0.8)';
      button.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
    });

    return button;
  }

  resize(): void {
    if (!this.isVisible || !this.container) return;

    const buttonSize = 60;
    const padding = 20;
    const rightMargin = 20;
    const bottomMargin = 150;
    const leftMargin = 20;
    const zoomButtonSize = 50;

    // Reposition action buttons
    if (this.igniteButton) {
      this.igniteButton.style.right = `${rightMargin}px`;
      this.igniteButton.style.bottom = `${bottomMargin}px`;
    }
    if (this.resetButton) {
      this.resetButton.style.right = `${rightMargin + (buttonSize - buttonSize * 0.7) / 2}px`;
      this.resetButton.style.bottom = `${bottomMargin + buttonSize + padding}px`;
    }
    if (this.helpButton) {
      this.helpButton.style.right = `${rightMargin + (buttonSize - buttonSize * 0.7) / 2}px`;
      this.helpButton.style.bottom = `${bottomMargin + (buttonSize + padding) * 2}px`;
    }

    // Reposition zoom controls
    if (this.zoomInButton) {
      this.zoomInButton.style.left = `${leftMargin}px`;
      this.zoomInButton.style.bottom = `${bottomMargin + zoomButtonSize + 10}px`;
    }
    if (this.zoomOutButton) {
      this.zoomOutButton.style.left = `${leftMargin}px`;
      this.zoomOutButton.style.bottom = `${bottomMargin}px`;
    }
  }

  setIgniteEnabled(enabled: boolean): void {
    if (this.igniteButton) {
      this.igniteButton.style.opacity = enabled ? '1' : '0.5';
      this.igniteButton.style.pointerEvents = enabled ? 'auto' : 'none';
    }
  }

  isMobileDevice(): boolean {
    return this.isMobile;
  }

  dispose(): void {
    if (this.container) {
      this.container.remove();
    }
  }
}
