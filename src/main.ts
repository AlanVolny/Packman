import { Boot } from './scenes/Boot.ts';
import { Game } from './scenes/Game.ts';
import { GameOver } from './scenes/GameOver.ts';
import { MainMenu } from './scenes/MainMenu.ts';
import { Preloader } from './scenes/Preloader.ts';



//  Find out more information about the Game Config at:
//  https://newdocs.phaser.io/docs/3.70.0/Phaser.Types.Core.GameConfig
const config = {
    type: Phaser.AUTO,
    width: 1024,
    height: 768,
    parent: 'game-container',
    backgroundColor: '#028af8',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            // gravity: { x: 0, y: 300 },
            debug: false
        }
    },
    scene: [
        Boot,
        Preloader,
        MainMenu,
        Game,
        GameOver
    ]
};


// const config = {
//     type: Phaser.AUTO,
//     width: 800,
//     height: 600,
//     scene: Example,
//     physics: {
//         default: 'arcade',
//         arcade: {
//             gravity: { y: 200 }
//         }
//     }
// };


// window.addEventListener('load', () => new Phaser.Game(config));



export default new Phaser.Game(config);

