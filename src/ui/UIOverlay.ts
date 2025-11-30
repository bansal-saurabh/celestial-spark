import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import { GameState } from '../game/GameState';
import type { PlanetInfo, ProceduralPlanet } from '../game/ProceduralPlanet';
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
  private dialogContainer: Container;
  private touchControls: TouchControls | null = null;
  private isHelpVisible: boolean = false;
  private currentNotification: Container | null = null;
  private notificationTimeout: number | null = null;
  private callbacks: TouchControlsCallbacks;
  private isMobile: boolean = false;
  private currentSystemName: string = '';
  private currentSystemIndex: number = 1;
  private totalSystems: number = 1;
  private activeDialog: Container | null = null;

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
    this.dialogContainer = new Container();
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
    this.hudContainer.addChild(this.dialogContainer);

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
    // On mobile, position stats panel below the system info panel to avoid overlap
    this.statsPanel.y = this.isMobile ? 90 : 20;
  }

  private createControlsPanel(): void {
    // Background
    const bg = new Graphics();
    bg.roundRect(0, 0, 180, 140, 8);
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
      'Space: Evolve planet',
      'E: Advance evolution',
      'N/→: Next system',
      'P/←: Prev system',
      'R: Reset view',
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
    bg.roundRect(0, 0, 400, 400, 8);
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
      ? `Welcome to Celestial Spark, a cosmic adventure where you explore and evolve life on habitable worlds!

Your mission is to find habitable planets in the habitable zones of various star systems and guide the evolution of life from microbial to intelligent civilizations.

Planet Types: Earth-like, Mars-like, Gas Giants, Ice Giants, Icy Cold, Red Hot, Ocean, Desert, Rocky

Touch Controls:
• One finger drag: Rotate camera
• Two finger pinch: Zoom in/out
• Tap on a planet: Select it
• EVOLVE button: Start evolution on habitable planet
• ▶▶ button: Advance evolution stage
• ❚❚ button: Pause/resume evolution
• ◀/▶ buttons: Travel between systems
• +/- buttons: Zoom controls

Tip: Look for Earth-like, Ocean, and Mars-like planets in the habitable zone!`
      : `Welcome to Celestial Spark, a cosmic adventure where you explore and evolve life on habitable worlds!

Your mission is to find habitable planets in the habitable zones of various star systems and guide the evolution of life from microbial to intelligent civilizations.

Planet Types: Earth-like, Mars-like, Gas Giants, Ice Giants, Icy Cold, Red Hot, Ocean, Desert, Rocky

Controls:
• Left-click + drag: Rotate camera
• Right-click + drag: Pan camera
• Scroll wheel: Zoom in/out
• Click on a planet: Select it
• Space: Evolve selected habitable planet
• E: Advance evolution stage
• N or →: Travel to next system
• P or ←: Travel to previous system
• 1-9: Quick select planets
• R: Reset camera view
• H: Toggle this help panel

Tip: Look for Earth-like, Ocean, and Mars-like planets in the habitable zone!`;

    const description = new Text({ 
      text: helpText,
      style: descStyle 
    });
    description.x = 20;
    description.y = 50;
    this.helpPanel.addChild(description);

    // Position centered
    this.helpPanel.x = (window.innerWidth - 400) / 2;
    this.helpPanel.y = (window.innerHeight - 400) / 2;
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

    // Determine border color based on state
    let borderColor = 0x4080ff;
    if (info.ignited) {
      borderColor = info.evolutionStage === 'intelligent' ? 0x80ff80 : 0xffaa40;
    } else if (info.isHabitable) {
      borderColor = 0x22cc44;
    }

    // Background - taller to fit more info
    const bg = new Graphics();
    bg.roundRect(0, 0, 230, 200, 8);
    bg.fill({ color: 0x001428, alpha: 0.7 });
    bg.stroke({ width: 1, color: borderColor, alpha: 0.5 });
    this.planetInfoPanel.addChild(bg);

    // Title
    const titleStyle = new TextStyle({
      fontFamily: 'Segoe UI, system-ui, sans-serif',
      fontSize: 16,
      fill: info.ignited ? 0xffcc80 : (info.isHabitable ? 0x80ffaa : 0x80c0ff),
      fontWeight: 'bold',
    });
    const title = new Text({ text: name, style: titleStyle });
    title.x = 15;
    title.y = 10;
    this.planetInfoPanel.addChild(title);

    // Status badge - show evolution stage or habitability
    const statusStyle = new TextStyle({
      fontFamily: 'Segoe UI, system-ui, sans-serif',
      fontSize: 9,
      fill: info.ignited ? 0x80ff80 : (info.isHabitable ? 0x44dd66 : 0xff8080),
      fontWeight: 'bold',
    });
    let statusText = 'DORMANT';
    if (info.ignited) {
      const stageNames: Record<string, string> = {
        'dormant': 'STARTING',
        'microbial': 'MICROBIAL',
        'plant_life': 'PLANT LIFE',
        'animal_life': 'ANIMAL LIFE',
        'intelligent': 'INTELLIGENT'
      };
      statusText = stageNames[info.evolutionStage] || info.evolutionStage.toUpperCase();
    } else if (info.isHabitable) {
      statusText = 'HABITABLE';
    }
    const status = new Text({ text: statusText, style: statusStyle });
    status.x = 215;
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
      { label: 'Habitable:', value: info.isHabitable ? 'Yes' : 'No' },
      { label: 'Status:', value: info.population },
    ];

    infoItems.forEach((item, i) => {
      const labelText = new Text({ text: item.label, style: labelStyle });
      labelText.x = 15;
      labelText.y = 38 + i * 18;
      this.planetInfoPanel.addChild(labelText);

      const valueText = new Text({ text: item.value, style: valueStyle });
      valueText.x = 215;
      valueText.y = 38 + i * 18;
      valueText.anchor.set(1, 0);
      this.planetInfoPanel.addChild(valueText);
    });

    // Action hint
    if (!info.ignited && info.isHabitable) {
      const hintStyle = new TextStyle({
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: 11,
        fill: 0x44dd66,
        fontStyle: 'italic',
      });
      const hintText = this.isMobile ? 'Tap EVOLVE button' : 'Press SPACE to evolve';
      const hint = new Text({ text: hintText, style: hintStyle });
      hint.x = 115;
      hint.y = 180;
      hint.anchor.set(0.5, 0);
      this.planetInfoPanel.addChild(hint);
    } else if (!info.ignited && !info.isHabitable) {
      const hintStyle = new TextStyle({
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: 10,
        fill: 0x808080,
        fontStyle: 'italic',
      });
      const hint = new Text({ text: 'Not in habitable zone', style: hintStyle });
      hint.x = 115;
      hint.y = 180;
      hint.anchor.set(0.5, 0);
      this.planetInfoPanel.addChild(hint);
    } else if (info.ignited && info.evolutionStage !== 'intelligent') {
      const hintStyle = new TextStyle({
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: 11,
        fill: 0x80c0ff,
        fontStyle: 'italic',
      });
      const hintText = this.isMobile ? 'Tap ▶▶ to advance' : 'Press E to advance';
      const hint = new Text({ text: hintText, style: hintStyle });
      hint.x = 115;
      hint.y = 180;
      hint.anchor.set(0.5, 0);
      this.planetInfoPanel.addChild(hint);
    }

    // Position panel
    this.planetInfoPanel.x = window.innerWidth - 250;
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
    
    // On mobile, reposition stats panel below system info
    this.statsPanel.y = this.isMobile ? 90 : 20;
    
    if (this.planetInfoPanel.children.length > 0) {
      this.planetInfoPanel.x = window.innerWidth - 250;
    }

    this.helpPanel.x = (window.innerWidth - 400) / 2;
    this.helpPanel.y = (window.innerHeight - 400) / 2;

    // Reposition system info panel
    this.systemInfoPanel.x = window.innerWidth / 2;

    // Resize touch controls
    if (this.touchControls) {
      this.touchControls.resize();
    }
  }

  // Dialog methods for evolution feature
  showNoHabitablePlanetsDialog(onConfirm: () => void): void {
    this.closeActiveDialog();

    const dialog = new Container();

    // Background overlay
    const overlay = new Graphics();
    overlay.rect(0, 0, window.innerWidth, window.innerHeight);
    overlay.fill({ color: 0x000000, alpha: 0.6 });
    dialog.addChild(overlay);

    // Dialog box
    const dialogWidth = 350;
    const dialogHeight = 180;
    const dialogBg = new Graphics();
    dialogBg.roundRect(0, 0, dialogWidth, dialogHeight, 12);
    dialogBg.fill({ color: 0x001428, alpha: 0.95 });
    dialogBg.stroke({ width: 2, color: 0xff6644, alpha: 0.7 });
    dialogBg.x = (window.innerWidth - dialogWidth) / 2;
    dialogBg.y = (window.innerHeight - dialogHeight) / 2;
    dialog.addChild(dialogBg);

    // Title
    const titleStyle = new TextStyle({
      fontFamily: 'Segoe UI, system-ui, sans-serif',
      fontSize: 18,
      fill: 0xff8866,
      fontWeight: 'bold',
    });
    const title = new Text({ text: 'No Habitable Planets', style: titleStyle });
    title.x = dialogBg.x + dialogWidth / 2;
    title.y = dialogBg.y + 25;
    title.anchor.set(0.5, 0);
    dialog.addChild(title);

    // Message
    const msgStyle = new TextStyle({
      fontFamily: 'Segoe UI, system-ui, sans-serif',
      fontSize: 14,
      fill: 0xc8dcff,
      wordWrap: true,
      wordWrapWidth: dialogWidth - 40,
      align: 'center',
    });
    const message = new Text({ 
      text: 'This solar system has no habitable planets in its habitable zone.\n\nWould you like to travel to another system?', 
      style: msgStyle 
    });
    message.x = dialogBg.x + dialogWidth / 2;
    message.y = dialogBg.y + 55;
    message.anchor.set(0.5, 0);
    dialog.addChild(message);

    // Buttons
    const buttonWidth = 100;
    const buttonHeight = 35;
    const buttonY = dialogBg.y + dialogHeight - 50;

    // Yes button
    const yesButton = this.createDialogButton('Travel', dialogBg.x + dialogWidth / 2 - buttonWidth - 15, buttonY, buttonWidth, buttonHeight, 0x22aa44, () => {
      this.closeActiveDialog();
      onConfirm();
    });
    dialog.addChild(yesButton);

    // Cancel button
    const cancelButton = this.createDialogButton('Cancel', dialogBg.x + dialogWidth / 2 + 15, buttonY, buttonWidth, buttonHeight, 0x666688, () => {
      this.closeActiveDialog();
    });
    dialog.addChild(cancelButton);

    this.dialogContainer.addChild(dialog);
    this.activeDialog = dialog;
  }

  showPlanetSelectionDialog(planets: ProceduralPlanet[], onSelect: (planet: ProceduralPlanet) => void): void {
    this.closeActiveDialog();

    const dialog = new Container();

    // Background overlay
    const overlay = new Graphics();
    overlay.rect(0, 0, window.innerWidth, window.innerHeight);
    overlay.fill({ color: 0x000000, alpha: 0.6 });
    dialog.addChild(overlay);

    // Dialog box
    const dialogWidth = 320;
    const buttonHeight = 40;
    const dialogHeight = 100 + planets.length * (buttonHeight + 10) + 50;
    const dialogBg = new Graphics();
    dialogBg.roundRect(0, 0, dialogWidth, dialogHeight, 12);
    dialogBg.fill({ color: 0x001428, alpha: 0.95 });
    dialogBg.stroke({ width: 2, color: 0x22cc44, alpha: 0.7 });
    dialogBg.x = (window.innerWidth - dialogWidth) / 2;
    dialogBg.y = (window.innerHeight - dialogHeight) / 2;
    dialog.addChild(dialogBg);

    // Title
    const titleStyle = new TextStyle({
      fontFamily: 'Segoe UI, system-ui, sans-serif',
      fontSize: 18,
      fill: 0x44dd66,
      fontWeight: 'bold',
    });
    const title = new Text({ text: 'Choose Planet to Evolve', style: titleStyle });
    title.x = dialogBg.x + dialogWidth / 2;
    title.y = dialogBg.y + 20;
    title.anchor.set(0.5, 0);
    dialog.addChild(title);

    // Subtitle
    const subtitleStyle = new TextStyle({
      fontFamily: 'Segoe UI, system-ui, sans-serif',
      fontSize: 12,
      fill: 0x96b4dc,
    });
    const subtitle = new Text({ text: `${planets.length} habitable planets found`, style: subtitleStyle });
    subtitle.x = dialogBg.x + dialogWidth / 2;
    subtitle.y = dialogBg.y + 48;
    subtitle.anchor.set(0.5, 0);
    dialog.addChild(subtitle);

    // Planet buttons
    planets.forEach((planet, i) => {
      const info = planet.getInfo();
      const buttonY = dialogBg.y + 75 + i * (buttonHeight + 10);
      const planetButton = this.createDialogButton(
        `${planet.getName()} (${info.type})`,
        dialogBg.x + 20,
        buttonY,
        dialogWidth - 40,
        buttonHeight,
        0x2288aa,
        () => {
          this.closeActiveDialog();
          onSelect(planet);
        }
      );
      dialog.addChild(planetButton);
    });

    // Cancel button
    const cancelY = dialogBg.y + dialogHeight - 45;
    const cancelButton = this.createDialogButton('Cancel', dialogBg.x + dialogWidth / 2 - 50, cancelY, 100, 30, 0x666688, () => {
      this.closeActiveDialog();
    });
    dialog.addChild(cancelButton);

    this.dialogContainer.addChild(dialog);
    this.activeDialog = dialog;
  }

  private createDialogButton(text: string, x: number, y: number, width: number, height: number, color: number, onClick: () => void): Container {
    const button = new Container();
    button.x = x;
    button.y = y;
    button.eventMode = 'static';
    button.cursor = 'pointer';

    const bg = new Graphics();
    bg.roundRect(0, 0, width, height, 6);
    bg.fill({ color: color, alpha: 0.8 });
    bg.stroke({ width: 1, color: 0xffffff, alpha: 0.3 });
    button.addChild(bg);

    const textStyle = new TextStyle({
      fontFamily: 'Segoe UI, system-ui, sans-serif',
      fontSize: text.length > 20 ? 11 : 14,
      fill: 0xffffff,
      fontWeight: 'bold',
    });
    const label = new Text({ text, style: textStyle });
    label.x = width / 2;
    label.y = height / 2;
    label.anchor.set(0.5, 0.5);
    button.addChild(label);

    button.on('pointerdown', () => {
      bg.clear();
      bg.roundRect(0, 0, width, height, 6);
      bg.fill({ color: color, alpha: 1 });
      bg.stroke({ width: 1, color: 0xffffff, alpha: 0.5 });
    });

    button.on('pointerup', () => {
      onClick();
    });

    button.on('pointerupoutside', () => {
      bg.clear();
      bg.roundRect(0, 0, width, height, 6);
      bg.fill({ color: color, alpha: 0.8 });
      bg.stroke({ width: 1, color: 0xffffff, alpha: 0.3 });
    });

    return button;
  }

  private closeActiveDialog(): void {
    if (this.activeDialog) {
      this.dialogContainer.removeChild(this.activeDialog);
      this.activeDialog = null;
    }
  }

  setEvolutionControlsVisible(visible: boolean): void {
    if (this.touchControls) {
      this.touchControls.setEvolutionControlsVisible(visible);
    }
  }

  dispose(): void {
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
    }
    if (this.touchControls) {
      this.touchControls.dispose();
    }
    this.closeActiveDialog();
    this.app.destroy(true);
  }
}
