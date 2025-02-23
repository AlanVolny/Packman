import { Scene } from 'phaser';
import { setScore, store } from '../ReduxStore';
import { increment } from '../ReduxStore'

export class MainMenu extends Scene
{
	public levelButtons: Phaser.GameObjects.Text[] = [];

	public packmanGreen = '#3d732e';

	// public scores: Record<number, number> = {};
	public scores: Record<number, number> = {};

	constructor ()
	{
		super('MainMenu');
	}

	create ()
	{
		this.add.image(512, 384, 'background');

		this.add.image(512, 300, 'logo');

		const levelTextsTop = 440

		this.add.text(512, 420, 'Main Menu', {
			fontFamily: 'sparkyStones', fontSize: 42, color: this.packmanGreen,
			stroke: '#000000', strokeThickness: 8,
			align: 'center'
		}).setOrigin(0.5);

		this.scores = store.getState().scores;

		for (let lvl=1; lvl<=5; lvl++) {
			let btnText = `Level ${lvl}`;
			if (this.scores[lvl]) btnText = `${btnText}  -  ${this.scores[lvl]}s`;
			const lvlbutton = this.add.text(512, levelTextsTop + lvl*50, btnText, {
				fontFamily: 'sparkyStones', fontSize: 24, color: '#ffffff',
				stroke: '#000000', strokeThickness: 8,
				align: 'center'
			}).setOrigin(0.5);
			lvlbutton.setInteractive();
			lvlbutton.on('pointerover', () => {	lvlbutton.style.setColor(this.packmanGreen); });
			lvlbutton.on('pointerout', () => {lvlbutton.style.setColor('#ffffff'); });
			lvlbutton.on('pointerup', () => { this.scene.start('Game', {level: lvl}); });
			this.levelButtons.push(lvlbutton);
		}
	}
}
