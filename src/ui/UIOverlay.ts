import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import { GameState } from '../game/GameState';
import type { PlanetInfo } from '../game/ProceduralPlanet';
import { TouchControls } from './TouchControls';
import type { TouchControlsCallbacks } from './TouchControls';
import { isMobileDevice } from '../utils/deviceUtils';

export class UIOverlay {
  private app: Application;
  private gameState: GameState;
  private hudContainer: Container;
  private statsPanel: Container;
  private planetInfoPanel: Container;
  private controlsPanel: Container;
  private notificationContainer: Container;
  private helpPanel: Container;
  private systemInfoPanel: Container;
  private touchControls: TouchControls | null = null;
  private isHelpVisible: boolean = false;
  private currentNotification: Container | null = null;
  private notificationTimeout: number | null = null;
  private callbacks: TouchControlsCallbacks;
  private isMobile: boolean = false;
  private currentSystemName: string = '';
  private currentSystemIndex: number = 1;
  private totalSystems: number = 1;

  constructor(gameState: GameState, callbacks: TouchControlsCallbacks) {
    this.gameState = gameState;
    this.callbacks = callbacks;
    this.app = new Application();
    this.hudContainer = new Container();
    this.statsPanel = new Container();
    this.planetInfoPanel = new Container();
    this.controlsPanel = new Container();
    this.notificationContainer = new Container();
    this.helpPanel = new Container();
    this.systemInfoPanel = new Container();
    this.isMobile = isMobileDevice();
  }

  async init(): Promise<void> {
    const canvas = document.getElementById('pixi-canvas') as HTMLCanvasElement;
    
    await this.app.init({
      canvas,
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundAlpha: 0,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    this.app.stage.addChild(this.hudContainer);
    
    this.createStatsPanel();
    this.createControlsPanel();
    this.createHelpPanel();
    this.createSystemInfoPanel();
    
    this.hudContainer.addChild(this.statsPanel);
    this.hudContainer.addChild(this.planetInfoPanel);
    this.hudContainer.addChild(this.controlsPanel);
    this.hudContainer.addChild(this.notificationContainer);
    this.hudContainer.addChild(this.helpPanel);
    this.hudContainer.addChild(this.systemInfoPanel);

    // Initialize touch controls for mobile
    if (this.isMobile) {
      this.touchControls = new TouchControls(this.callbacks);
      await this.touchControls.init();
      // Hide desktop controls panel on mobile
      this.controlsPanel.visible = false;
    }
  }

  private createSystemInfoPanel(): void {
    // Position at top center
    this.systemInfoPanel.x = window.innerWidth / 2;
    this.systemInfoPanel.y = 20;
  }

  private updateSystemInfoPanel(): void {
    // Clear existing content
    this.systemInfoPanel.removeChildren();

    // Background
    const bg = new Graphics();
    bg.roundRect(-120, 0, 240, 50, 8);
    bg.fill({ color: 0x001428, alpha: 0.7 });
    bg.stroke({ width: 1, color: 0x8040ff, alpha: 0.5 });
    this.systemInfoPanel.addChild(bg);

    // System name
    const nameStyle = new TextStyle({
      fontFamily: 'Segoe UI, system-ui, sans-serif',
      fontSize: 16,
      fill: 0x80c0ff,
      fontWeight: 'bold',
    });
    const nameText = new Text({ text: this.currentSystemName, style: nameStyle });
    nameText.anchor.set(0.5, 0);
    nameText.x = 0;
    nameText.y = 8;
    this.systemInfoPanel.addChild(nameText);

    // System counter
    const counterStyle = new TextStyle({
      fontFamily: 'Segoe UI, system-ui, sans-serif',
      fontSize: 12,
      fill: 0x96b4dc,
    });
    const counterText = new Text({ 
      text: `System ${this.currentSystemIndex} of ${this.totalSystems}`, 
      style: counterStyle 
    });
    counterText.anchor.set(0.5, 0);
    counterText.x = 0;
    counterText.y = 30;
    this.systemInfoPanel.addChild(counterText);
  }

  setSystemInfo(systemName: string, currentIndex: number, totalSystems: number): void {
    this.currentSystemName = systemName;
    this.currentSystemIndex = currentIndex;
    this.totalSystems = totalSystems;
    this.updateSystemInfoPanel();
  }

  private createStatsPanel(): void {
    // Background
    const bg = new Graphics();
    bg.roundRect(0, 0, 200, 120, 8);
    bg.fill({ color: 0x001428, alpha: 0.7 });
    bg.stroke({ width: 1, color: 0x4080ff, alpha: 0.3 });
    this.statsPanel.addChild(bg);

    // Title
    const titleStyle = new TextStyle({
      fontFamily: 'Segoe UI, system-ui, sans-serif',
      fontSize: 12,
      fill: 0x80c0ff,
      fontWeight: 'bold',
      letterSpacing: 1,
    });
    const title = new Text({ text: 'MISSION STATUS', style: titleStyle });
    title.x = 15;
    title.y = 10;
    this.statsPanel.addChild(title);

    this.statsPanel.x = 20;
    this.statsPanel.y = 20;
  }

  private createControlsPanel(): void {
    // Background
    const bg = new Graphics();
    bg.roundRect(0, 0, 180, 130, 8);
    bg.fill({ color: 0x001428, alpha: 0.7 });
    bg.stroke({ width: 1, color: 0x4080ff, alpha: 0.3 });
    this.controlsPanel.addChild(bg);

    // Title
    const titleStyle = new TextStyle({
      fontFamily: 'Segoe UI, system-ui, sans-serif',
      fontSize: 12,
      fill: 0x80c0ff,
      fontWeight: 'bold',
      letterSpacing: 1,
    });
    const title = new Text({ text: 'CONTROLS', style: titleStyle });
    title.x = 15;
    title.y = 10;
    this.controlsPanel.addChild(title);

    // Control instructions
    const controlStyle = new TextStyle({
      fontFamily: 'Segoe UI, system-ui, sans-serif',
      fontSize: 11,
      fill: 0x96b4dc,
    });

    const controls = [
      'Mouse: Rotate view',
      'Scroll: Zoom in/out',
      'Space: Ignite planet',
      'N/→: Next system',
      'P/←: Prev system',
      'R: Reset view',
      'H: Toggle help',
    ];

    controls.forEach((text, i) => {
      const controlText = new Text({ text, style: controlStyle });
      controlText.x = 15;
      controlText.y = 30 + i * 14;
      this.controlsPanel.addChild(controlText);
    });

    this.controlsPanel.x = 20;
    this.controlsPanel.y = window.innerHeight - 150;
  }

  private createHelpPanel(): void {
    // Background
    const bg = new Graphics();
    bg.roundRect(0, 0, 400, 360, 8);
    bg.fill({ color: 0x001428, alpha: 0.9 });
    bg.stroke({ width: 1, color: 0x4080ff, alpha: 0.5 });
    this.helpPanel.addChild(bg);

    // Title
    const titleStyle = new TextStyle({
      fontFamily: 'Segoe UI, system-ui, sans-serif',
      fontSize: 20,
      fill: 0x80c0ff,
      fontWeight: 'bold',
    });
    const title = new Text({ text: 'Celestial Spark - Help', style: titleStyle });
    title.x = 20;
    title.y = 15;
    this.helpPanel.addChild(title);

    // Description
    const descStyle = new TextStyle({
      fontFamily: 'Segoe UI, system-ui, sans-serif',
      fontSize: 13,
      fill: 0xc8dcff,
      wordWrap: true,
      wordWrapWidth: 360,
      lineHeight: 20,
    });

    // Different help text for mobile vs desktop
    const helpText = this.isMobile 
      ? `Welcome to Celestial Spark, a cosmic adventure where you explore and ignite new worlds across the galaxy!

Your mission is to discover and ignite all planets across multiple solar systems, bringing life and civilization to the cosmos.

Touch Controls:
• One finger drag: Rotate camera
• Two finger pinch: Zoom in/out
• Tap on a planet: Select it
• IGNITE button: Ignite selected planet
• ◀/▶ buttons: Travel between systems
• +/- buttons: Zoom controls
• R button: Reset camera view
• ? button: Toggle this help panel

Tip: Different star systems have unique stars and planets to discover!`
      : `Welcome to Celestial Spark, a cosmic adventure where you explore and ignite new worlds across the galaxy!

Your mission is to discover and ignite all planets across multiple solar systems, bringing life and civilization to the cosmos.

Controls:
• Left-click + drag: Rotate camera
• Right-click + drag: Pan camera
• Scroll wheel: Zoom in/out
• Click on a planet: Select it
• Space: Ignite selected planet
• N or →: Travel to next system
• P or ←: Travel to previous system
• 1-9: Quick select planets
• R: Reset camera view
• H: Toggle this help panel

Tip: Different star systems have unique stars and planets to discover!`;

    const description = new Text({ 
      text: helpText,
      style: descStyle 
    });
    description.x = 20;
    description.y = 50;
    this.helpPanel.addChild(description);

    // Position centered
    this.helpPanel.x = (window.innerWidth - 400) / 2;
    this.helpPanel.y = (window.innerHeight - 360) / 2;
    this.helpPanel.visible = false;
  }

  update(): void {
    // Update stats display
    this.updateStatsPanel();
  }

  private updateStatsPanel(): void {
    // Remove old stats (keep background and title)
    while (this.statsPanel.children.length > 2) {
      this.statsPanel.removeChildAt(2);
    }

    const statStyle = new TextStyle({
      fontFamily: 'Segoe UI, system-ui, sans-serif',
      fontSize: 12,
      fill: 0xc8dcff,
    });

    const valueStyle = new TextStyle({
      fontFamily: 'Segoe UI, system-ui, sans-serif',
      fontSize: 12,
      fill: 0xffffff,
      fontWeight: '500',
    });

    const stats = [
      { label: 'Ignited:', value: `${this.gameState.getIgnitedCount()}/${this.gameState.getTotalPlanets()}` },
      { label: 'Progress:', value: `${this.gameState.getProgress()}%` },
      { label: 'Score:', value: this.gameState.getScore().toLocaleString() },
      { label: 'Time:', value: this.gameState.getFormattedPlayTime() },
    ];

    stats.forEach((stat, i) => {
      const labelText = new Text({ text: stat.label, style: statStyle });
      labelText.x = 15;
      labelText.y = 35 + i * 20;
      this.statsPanel.addChild(labelText);

      const valueText = new Text({ text: stat.value, style: valueStyle });
      valueText.x = 185;
      valueText.y = 35 + i * 20;
      valueText.anchor.set(1, 0);
      this.statsPanel.addChild(valueText);
    });
  }

  setSelectedPlanet(name: string, info: PlanetInfo): void {
    // Clear existing planet info
    this.planetInfoPanel.removeChildren();

    // Background
    const bg = new Graphics();
    bg.roundRect(0, 0, 220, 160, 8);
    bg.fill({ color: 0x001428, alpha: 0.7 });
    bg.stroke({ width: 1, color: info.ignited ? 0xffaa40 : 0x4080ff, alpha: 0.5 });
    this.planetInfoPanel.addChild(bg);

    // Title
    const titleStyle = new TextStyle({
      fontFamily: 'Segoe UI, system-ui, sans-serif',
      fontSize: 16,
      fill: info.ignited ? 0xffcc80 : 0x80c0ff,
      fontWeight: 'bold',
    });
    const title = new Text({ text: name, style: titleStyle });
    title.x = 15;
    title.y = 10;
    this.planetInfoPanel.addChild(title);

    // Status badge
    const statusStyle = new TextStyle({
      fontFamily: 'Segoe UI, system-ui, sans-serif',
      fontSize: 10,
      fill: info.ignited ? 0x80ff80 : 0xff8080,
      fontWeight: 'bold',
    });
    const status = new Text({ text: info.ignited ? 'IGNITED' : 'DORMANT', style: statusStyle });
    status.x = 205;
    status.y = 14;
    status.anchor.set(1, 0);
    this.planetInfoPanel.addChild(status);

    // Planet info
    const labelStyle = new TextStyle({
      fontFamily: 'Segoe UI, system-ui, sans-serif',
      fontSize: 11,
      fill: 0x96b4dc,
    });

    const valueStyle = new TextStyle({
      fontFamily: 'Segoe UI, system-ui, sans-serif',
      fontSize: 11,
      fill: 0xffffff,
    });

    const infoItems = [
      { label: 'Type:', value: info.type },
      { label: 'Distance:', value: `${info.distance} AU` },
      { label: 'Size:', value: `${info.size} Earth radii` },
      { label: 'Atmosphere:', value: info.atmosphere },
      { label: 'Population:', value: info.population },
    ];

    infoItems.forEach((item, i) => {
      const labelText = new Text({ text: item.label, style: labelStyle });
      labelText.x = 15;
      labelText.y = 40 + i * 18;
      this.planetInfoPanel.addChild(labelText);

      const valueText = new Text({ text: item.value, style: valueStyle });
      valueText.x = 205;
      valueText.y = 40 + i * 18;
      valueText.anchor.set(1, 0);
      this.planetInfoPanel.addChild(valueText);
    });

    // Action hint
    if (!info.ignited) {
      const hintStyle = new TextStyle({
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: 11,
        fill: 0x80c0ff,
        fontStyle: 'italic',
      });
      const hintText = this.isMobile ? 'Tap IGNITE button' : 'Press SPACE to ignite';
      const hint = new Text({ text: hintText, style: hintStyle });
      hint.x = 110;
      hint.y = 140;
      hint.anchor.set(0.5, 0);
      this.planetInfoPanel.addChild(hint);
    }

    // Position panel
    this.planetInfoPanel.x = window.innerWidth - 240;
    this.planetInfoPanel.y = 20;
  }

  clearSelection(): void {
    this.planetInfoPanel.removeChildren();
  }

  showNotification(message: string): void {
    // Remove existing notification
    if (this.currentNotification) {
      this.notificationContainer.removeChild(this.currentNotification);
      if (this.notificationTimeout) {
        clearTimeout(this.notificationTimeout);
      }
    }

    // Create new notification
    const notification = new Container();

    // Background
    const bg = new Graphics();
    const padding = 20;
    // Estimate text width based on character count
    const estimatedWidth = message.length * 9;
    const width = Math.max(200, estimatedWidth + padding * 2);
    
    bg.roundRect(0, 0, width, 50, 8);
    bg.fill({ color: 0x002850, alpha: 0.9 });
    bg.stroke({ width: 1, color: 0x64c8ff, alpha: 0.5 });
    notification.addChild(bg);

    // Text
    const textStyle = new TextStyle({
      fontFamily: 'Segoe UI, system-ui, sans-serif',
      fontSize: 16,
      fill: 0xffffff,
    });
    const text = new Text({ text: message, style: textStyle });
    text.x = width / 2;
    text.y = 25;
    text.anchor.set(0.5, 0.5);
    notification.addChild(text);

    // Position
    notification.x = (window.innerWidth - width) / 2;
    notification.y = 20;

    this.notificationContainer.addChild(notification);
    this.currentNotification = notification;

    // Auto-hide after 3 seconds
    this.notificationTimeout = window.setTimeout(() => {
      if (this.currentNotification) {
        this.notificationContainer.removeChild(this.currentNotification);
        this.currentNotification = null;
      }
    }, 3000);
  }

  toggleHelp(): void {
    this.isHelpVisible = !this.isHelpVisible;
    this.helpPanel.visible = this.isHelpVisible;
  }

  resize(): void {
    this.app.renderer.resize(window.innerWidth, window.innerHeight);
    
    // Reposition elements
    this.controlsPanel.y = window.innerHeight - 150;
    
    if (this.planetInfoPanel.children.length > 0) {
      this.planetInfoPanel.x = window.innerWidth - 240;
    }

    this.helpPanel.x = (window.innerWidth - 400) / 2;
    this.helpPanel.y = (window.innerHeight - 360) / 2;

    // Reposition system info panel
    this.systemInfoPanel.x = window.innerWidth / 2;

    // Resize touch controls
    if (this.touchControls) {
      this.touchControls.resize();
    }
  }

  dispose(): void {
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
    }
    if (this.touchControls) {
      this.touchControls.dispose();
    }
    this.app.destroy(true);
  }
}
