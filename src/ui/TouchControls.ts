import { isMobileDevice } from '../utils/deviceUtils';

export interface TouchControlsCallbacks {
  onEvolve: () => void;
  onAdvanceEvolution?: () => void;
  onPauseEvolution?: () => void;
  onReset: () => void;
  onHelp: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onNextSystem?: () => void;
  onPrevSystem?: () => void;
}

export class TouchControls {
  private callbacks: TouchControlsCallbacks;
  private isVisible: boolean = false;
  private isMobile: boolean = false;
  private container: HTMLDivElement | null = null;

  // UI Elements (now HTML elements)
  private evolveButton: HTMLButtonElement | null = null;
  private advanceButton: HTMLButtonElement | null = null;
  private pauseButton: HTMLButtonElement | null = null;
  private resetButton: HTMLButtonElement | null = null;
  private helpButton: HTMLButtonElement | null = null;
  private zoomInButton: HTMLButtonElement | null = null;
  private zoomOutButton: HTMLButtonElement | null = null;
  private nextSystemButton: HTMLButtonElement | null = null;
  private prevSystemButton: HTMLButtonElement | null = null;

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

    // Create action buttons at bottom center
    this.createActionButtons();

    // Create zoom controls on the left
    this.createZoomControls();

    // Create system navigation buttons
    this.createSystemNavButtons();
  }

  private createActionButtons(): void {
    if (!this.container) return;

    const buttonSize = 60;
    const smallButtonSize = 45;
    const bottomMargin = 30;
    const centerX = window.innerWidth / 2;

    // Evolve button (primary action) - center bottom
    this.evolveButton = this.createCircleButton(
      'EVOLVE',
      '#22cc44',
      buttonSize,
      () => this.callbacks.onEvolve()
    );
    this.evolveButton.style.left = `${centerX - buttonSize / 2}px`;
    this.evolveButton.style.bottom = `${bottomMargin}px`;
    this.container.appendChild(this.evolveButton);

    // Advance evolution button - left of evolve (hidden by default)
    this.advanceButton = this.createCircleButton(
      '▶▶',
      '#44aa66',
      smallButtonSize,
      () => this.callbacks.onAdvanceEvolution?.()
    );
    this.advanceButton.style.left = `${centerX - buttonSize / 2 - smallButtonSize - 15}px`;
    this.advanceButton.style.bottom = `${bottomMargin + (buttonSize - smallButtonSize) / 2}px`;
    this.advanceButton.style.display = 'none';
    this.container.appendChild(this.advanceButton);

    // Pause evolution button - right of evolve (hidden by default)
    this.pauseButton = this.createCircleButton(
      '❚❚',
      '#aa6644',
      smallButtonSize,
      () => this.callbacks.onPauseEvolution?.()
    );
    this.pauseButton.style.left = `${centerX + buttonSize / 2 + 15}px`;
    this.pauseButton.style.bottom = `${bottomMargin + (buttonSize - smallButtonSize) / 2}px`;
    this.pauseButton.style.display = 'none';
    this.container.appendChild(this.pauseButton);

    // Reset button - right side, bottom
    this.resetButton = this.createCircleButton(
      'R',
      '#4080ff',
      smallButtonSize,
      () => this.callbacks.onReset()
    );
    this.resetButton.style.right = `20px`;
    this.resetButton.style.bottom = `${bottomMargin}px`;
    this.container.appendChild(this.resetButton);

    // Help button - right side, above reset
    this.helpButton = this.createCircleButton(
      '?',
      '#4080ff',
      smallButtonSize,
      () => this.callbacks.onHelp()
    );
    this.helpButton.style.right = `20px`;
    this.helpButton.style.bottom = `${bottomMargin + smallButtonSize + 15}px`;
    this.container.appendChild(this.helpButton);
  }

  private createZoomControls(): void {
    if (!this.container) return;

    const buttonSize = 45;
    const padding = 10;
    const leftMargin = 20;
    const bottomMargin = 30;

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

  private createSystemNavButtons(): void {
    if (!this.container) return;

    const buttonSize = 50;
    const topMargin = 80;
    const centerX = window.innerWidth / 2;

    // Previous system button
    this.prevSystemButton = this.createCircleButton(
      '◀',
      '#8040ff',
      buttonSize,
      () => this.callbacks.onPrevSystem?.()
    );
    this.prevSystemButton.style.left = `${centerX - buttonSize - 30}px`;
    this.prevSystemButton.style.top = `${topMargin}px`;
    this.container.appendChild(this.prevSystemButton);

    // Next system button
    this.nextSystemButton = this.createCircleButton(
      '▶',
      '#8040ff',
      buttonSize,
      () => this.callbacks.onNextSystem?.()
    );
    this.nextSystemButton.style.left = `${centerX + 30}px`;
    this.nextSystemButton.style.top = `${topMargin}px`;
    this.container.appendChild(this.nextSystemButton);
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
    const smallButtonSize = 45;
    const bottomMargin = 30;
    const leftMargin = 20;
    const navButtonSize = 50;
    const topMargin = 80;
    const centerX = window.innerWidth / 2;

    // Reposition evolve button
    if (this.evolveButton) {
      this.evolveButton.style.left = `${centerX - buttonSize / 2}px`;
      this.evolveButton.style.bottom = `${bottomMargin}px`;
    }

    // Reposition advance button
    if (this.advanceButton) {
      this.advanceButton.style.left = `${centerX - buttonSize / 2 - smallButtonSize - 15}px`;
      this.advanceButton.style.bottom = `${bottomMargin + (buttonSize - smallButtonSize) / 2}px`;
    }

    // Reposition pause button
    if (this.pauseButton) {
      this.pauseButton.style.left = `${centerX + buttonSize / 2 + 15}px`;
      this.pauseButton.style.bottom = `${bottomMargin + (buttonSize - smallButtonSize) / 2}px`;
    }

    // Reposition reset button
    if (this.resetButton) {
      this.resetButton.style.right = `20px`;
      this.resetButton.style.bottom = `${bottomMargin}px`;
    }

    // Reposition help button
    if (this.helpButton) {
      this.helpButton.style.right = `20px`;
      this.helpButton.style.bottom = `${bottomMargin + smallButtonSize + 15}px`;
    }

    // Reposition zoom controls
    if (this.zoomInButton) {
      this.zoomInButton.style.left = `${leftMargin}px`;
      this.zoomInButton.style.bottom = `${bottomMargin + smallButtonSize + 10}px`;
    }
    if (this.zoomOutButton) {
      this.zoomOutButton.style.left = `${leftMargin}px`;
      this.zoomOutButton.style.bottom = `${bottomMargin}px`;
    }

    // Reposition system navigation buttons
    if (this.prevSystemButton) {
      this.prevSystemButton.style.left = `${centerX - navButtonSize - 30}px`;
      this.prevSystemButton.style.top = `${topMargin}px`;
    }
    if (this.nextSystemButton) {
      this.nextSystemButton.style.left = `${centerX + 30}px`;
      this.nextSystemButton.style.top = `${topMargin}px`;
    }
  }

  setEvolveEnabled(enabled: boolean): void {
    if (this.evolveButton) {
      this.evolveButton.style.opacity = enabled ? '1' : '0.5';
      this.evolveButton.style.pointerEvents = enabled ? 'auto' : 'none';
    }
  }

  setEvolutionControlsVisible(visible: boolean): void {
    if (this.advanceButton) {
      this.advanceButton.style.display = visible ? 'block' : 'none';
    }
    if (this.pauseButton) {
      this.pauseButton.style.display = visible ? 'block' : 'none';
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
