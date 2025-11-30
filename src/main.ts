import './style.css';
import { Game } from './game/Game';

// Initialize the game when the DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const game = new Game();
    await game.init();
    game.start();
  } catch (error) {
    console.error('Failed to initialize game:', error);
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      const content = loadingScreen.querySelector('.loading-content');
      if (content) {
        content.innerHTML = `
          <h1>Celestial Spark</h1>
          <p style="color: #ff6666;">Failed to initialize</p>
          <p style="font-size: 0.9rem; margin-top: 1rem;">Please check your browser supports WebGL</p>
        `;
      }
    }
  }
});
