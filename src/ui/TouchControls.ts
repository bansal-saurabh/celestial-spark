import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';

export interface TouchControlsCallbacks {
  onIgnite: () => void;
  onReset: () => void;
  onHelp: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export class TouchControls {
  private app: Application;
  private container: Container;
  private callbacks: TouchControlsCallbacks;
  private isVisible: boolean = false;
  private isMobile: boolean = false;

  // UI Elements
  private igniteButton: Container | null = null;
  private resetButton: Container | null = null;
  private helpButton: Container | null = null;
  private zoomInButton: Container | null = null;
  private zoomOutButton: Container | null = null;

  constructor(app: Application, callbacks: TouchControlsCallbacks) {
    this.app = app;
    this.container = new Container();
    this.callbacks = callbacks;
    this.isMobile = this.detectMobile();
  }

  private detectMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           ('ontouchstart' in window) ||
           (navigator.maxTouchPoints > 0);
  }

  async init(): Promise<void> {
    if (!this.isMobile) {
      return; // Don't show touch controls on desktop
    }

    this.isVisible = true;
    this.container.visible = true;
    this.container.eventMode = 'static';

    // Create action buttons on the right side
    this.createActionButtons();

    // Create zoom controls
    this.createZoomControls();

    this.app.stage.addChild(this.container);
  }

  private createActionButtons(): void {
    const buttonSize = 60;
    const padding = 20;
    const rightMargin = 20;
    const bottomMargin = 150;

    // Ignite button (primary action)
    this.igniteButton = this.createCircleButton(
      'IGNITE',
      0xff6600,
      buttonSize,
      () => this.callbacks.onIgnite()
    );
    this.igniteButton.x = window.innerWidth - rightMargin - buttonSize;
    this.igniteButton.y = window.innerHeight - bottomMargin;
    this.container.addChild(this.igniteButton);

    // Reset button
    this.resetButton = this.createCircleButton(
      'R',
      0x4080ff,
      buttonSize * 0.7,
      () => this.callbacks.onReset()
    );
    this.resetButton.x = window.innerWidth - rightMargin - buttonSize * 0.7;
    this.resetButton.y = window.innerHeight - bottomMargin - buttonSize - padding;
    this.container.addChild(this.resetButton);

    // Help button
    this.helpButton = this.createCircleButton(
      '?',
      0x4080ff,
      buttonSize * 0.7,
      () => this.callbacks.onHelp()
    );
    this.helpButton.x = window.innerWidth - rightMargin - buttonSize * 0.7;
    this.helpButton.y = window.innerHeight - bottomMargin - (buttonSize + padding) * 2;
    this.container.addChild(this.helpButton);
  }

  private createZoomControls(): void {
    const buttonSize = 50;
    const padding = 10;
    const leftMargin = 20;
    const bottomMargin = 150;

    // Zoom in button
    this.zoomInButton = this.createCircleButton(
      '+',
      0x4080ff,
      buttonSize,
      () => this.callbacks.onZoomIn()
    );
    this.zoomInButton.x = leftMargin + buttonSize;
    this.zoomInButton.y = window.innerHeight - bottomMargin - buttonSize - padding;
    this.container.addChild(this.zoomInButton);

    // Zoom out button
    this.zoomOutButton = this.createCircleButton(
      '−',
      0x4080ff,
      buttonSize,
      () => this.callbacks.onZoomOut()
    );
    this.zoomOutButton.x = leftMargin + buttonSize;
    this.zoomOutButton.y = window.innerHeight - bottomMargin;
    this.container.addChild(this.zoomOutButton);
  }

  private createCircleButton(
    label: string,
    color: number,
    size: number,
    onClick: () => void
  ): Container {
    const button = new Container();
    button.eventMode = 'static';
    button.cursor = 'pointer';

    // Background circle
    const bg = new Graphics();
    bg.circle(0, 0, size / 2);
    bg.fill({ color: 0x001428, alpha: 0.8 });
    bg.stroke({ width: 2, color, alpha: 0.8 });
    button.addChild(bg);

    // Glow effect on press
    const glow = new Graphics();
    glow.circle(0, 0, size / 2 + 5);
    glow.fill({ color, alpha: 0 });
    button.addChildAt(glow, 0);

    // Label
    const textStyle = new TextStyle({
      fontFamily: 'Segoe UI, system-ui, sans-serif',
      fontSize: label.length > 2 ? 10 : 20,
      fill: 0xffffff,
      fontWeight: 'bold',
    });
    const text = new Text({ text: label, style: textStyle });
    text.anchor.set(0.5, 0.5);
    button.addChild(text);

    // Touch events
    button.on('pointerdown', () => {
      bg.clear();
      bg.circle(0, 0, size / 2);
      bg.fill({ color: color, alpha: 0.5 });
      bg.stroke({ width: 2, color, alpha: 1 });
      
      glow.clear();
      glow.circle(0, 0, size / 2 + 5);
      glow.fill({ color, alpha: 0.3 });
    });

    button.on('pointerup', () => {
      bg.clear();
      bg.circle(0, 0, size / 2);
      bg.fill({ color: 0x001428, alpha: 0.8 });
      bg.stroke({ width: 2, color, alpha: 0.8 });
      
      glow.clear();
      glow.circle(0, 0, size / 2 + 5);
      glow.fill({ color, alpha: 0 });
      
      onClick();
    });

    button.on('pointerupoutside', () => {
      bg.clear();
      bg.circle(0, 0, size / 2);
      bg.fill({ color: 0x001428, alpha: 0.8 });
      bg.stroke({ width: 2, color, alpha: 0.8 });
      
      glow.clear();
      glow.circle(0, 0, size / 2 + 5);
      glow.fill({ color, alpha: 0 });
    });

    return button;
  }

  resize(): void {
    if (!this.isVisible) return;

    const buttonSize = 60;
    const padding = 20;
    const rightMargin = 20;
    const bottomMargin = 150;
    const leftMargin = 20;
    const zoomButtonSize = 50;

    // Reposition action buttons
    if (this.igniteButton) {
      this.igniteButton.x = window.innerWidth - rightMargin - buttonSize;
      this.igniteButton.y = window.innerHeight - bottomMargin;
    }
    if (this.resetButton) {
      this.resetButton.x = window.innerWidth - rightMargin - buttonSize * 0.7;
      this.resetButton.y = window.innerHeight - bottomMargin - buttonSize - padding;
    }
    if (this.helpButton) {
      this.helpButton.x = window.innerWidth - rightMargin - buttonSize * 0.7;
      this.helpButton.y = window.innerHeight - bottomMargin - (buttonSize + padding) * 2;
    }

    // Reposition zoom controls
    if (this.zoomInButton) {
      this.zoomInButton.x = leftMargin + zoomButtonSize;
      this.zoomInButton.y = window.innerHeight - bottomMargin - zoomButtonSize - 10;
    }
    if (this.zoomOutButton) {
      this.zoomOutButton.x = leftMargin + zoomButtonSize;
      this.zoomOutButton.y = window.innerHeight - bottomMargin;
    }
  }

  setIgniteEnabled(enabled: boolean): void {
    if (this.igniteButton) {
      this.igniteButton.alpha = enabled ? 1 : 0.5;
      this.igniteButton.eventMode = enabled ? 'static' : 'none';
    }
  }

  isMobileDevice(): boolean {
    return this.isMobile;
  }

  dispose(): void {
    this.container.destroy({ children: true });
  }
}
