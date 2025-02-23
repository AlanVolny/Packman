import { Scene } from 'phaser';

export class Preloader extends Scene
{
 	constructor ()
 	{
 	 	super('Preloader');
 	}
	public packmanGreen = '#3d732e';

 	preload ()
 	{
 	 	//  Load the assets for the game - Replace with your own assets
 	 	this.load.setPath('assets');
 	 	this.load.image('logo', 'PACKMAN3.png');
 	 	this.load.image('thaWalls', 'walls_med.png');
 	 	this.load.image('foodPellet', 'packet_med.png');
 	 	// this.load.image('cheese', 'Food.png');

 	 	this.load.spritesheet('cheese', 
 	 	 	'Food.png',
 	 	 	{ frameWidth: 16, frameHeight: 16 }
 	 	);


 	 	this.load.spritesheet('ratChef', 
 	 	 	'chara/ratfolk-0.3/PNG/24x32/ratfolk-m-chef-001.png',
 	 	 	{ frameWidth: 24, frameHeight: 32 }
 	 	);

 	 	this.load.spritesheet('ratking', 
 	 	 	'chara/ratfolk-0.3/PNG/32x48/rat_king.png',
 	 	 	{ frameWidth: 48, frameHeight: 64 }
 	 	);

 	 	this.load.spritesheet('skele', 
 	 	 	'chara/skeleton-1.4/PNG/24x32/skeleton-SWEN.png',
 	 	 	{ frameWidth: 24, frameHeight: 32 }
 	 	);

 	 	this.load.audio('playerEat', 'audio/eat_03.ogg');
 	 	this.load.audio('squeek', 'audio/mouse-2.ogg');
 	 	this.load.audio('skeleEat', 'audio/crunch.3.ogg');
 	 	this.load.audio('winSound', 'audio/winfretless.ogg');


 	 	this.load.audio('fromMenu', 'audio/UISoundEffects/MenuSFXPreview.mp3');
 	 	this.load.audio('respawnSound', 'audio/UISoundEffects/Menu Error.mp3');
 	 	// this.load.audio('chorus', 'audio/UISoundEffects/Ability Learn.mp3');
 	 	
 	}

 	init ()
 	{
 	 	//  We loaded this image in our Boot Scene, so we can display it here
 	 	this.add.image(512, 384, 'background');

 	 	//  A simple progress bar. This is the outline of the bar.
 	 	this.add.rectangle(512, 384, 468, 32).setStrokeStyle(1, 0xffffff);

 	 	//  This is the progress bar itself. It will increase in size from the left based on the % of progress.
 	 	const bar = this.add.rectangle(512-230, 384, 4, 28, 0xffffff);

 	 	//  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
 	 	this.load.on('progress', (progress) => {

 	 	 	//  Update the progress bar (our bar is 464px wide, so 100% = 464px)
 	 	 	bar.width = 4 + (460 * progress);


 	 	 	this.add.text(512, 420, 'Loading ...', {
 	 	 	 	fontFamily: 'sparkyStones', fontSize: 42, color: this.packmanGreen,
 	 	 	 	stroke: '#000000', strokeThickness: 8,
 	 	 	 	align: 'center'
 	 	 	}).setOrigin(0.5);
 	 	});



 	}

 	create ()
 	{
 	 	//  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
 	 	//  For example, you can define global animations here, so we can use them in other scenes.


		/** Player anims */

		// this.anims.create({
		// 	 key: 'static',
		// 	 frames: this.anims.generateFrameNumbers('ratChef', { start: 1, end: 1 }),
		// 	 frameRate: 10,
		// 	 repeat: -1
		// });
		this.anims.create({
			key: 'rat_up',
			frames: this.anims.generateFrameNumbers('ratChef', { start: 0, end: 2 }),
			frameRate: 10,
			repeat: -1
		});
		this.anims.create({
			key: 'rat_right',
			frames: this.anims.generateFrameNumbers('ratChef', { start: 3, end: 5 }),
			frameRate: 10,
			repeat: -1
		});
		this.anims.create({
			key: 'rat_down',
			frames: this.anims.generateFrameNumbers('ratChef', { start: 6, end: 8 }),
			frameRate: 10,
			repeat: -1
		});
		this.anims.create({
			key: 'rat_left',
			frames: this.anims.generateFrameNumbers('ratChef', { start: 9, end: 11 }),
			frameRate: 10,
			repeat: -1
		});

		/** Enemiy anims */

		this.anims.create({
			key: 'skele_up',
			frames: this.anims.generateFrameNumbers('skele', { start: 9, end: 11 }),
			frameRate: 10,
			repeat: -1
		});
		this.anims.create({
			key: 'skele_right',
			frames: this.anims.generateFrameNumbers('skele', { start: 6, end: 8 }),
			frameRate: 10,
			repeat: -1
		});
		this.anims.create({
			key: 'skele_down',
			frames: this.anims.generateFrameNumbers('skele', { start: 0, end: 2 }),
			frameRate: 10,
			repeat: -1
		});
		this.anims.create({
			key: 'skele_left',
			frames: this.anims.generateFrameNumbers('skele', { start: 3, end: 5 }),
			frameRate: 10,
			repeat: -1
		});

 	 	//  Move to the MainMenu. You could also swap this for a Scene Transition, such as a camera fade.
		this.scene.start('MainMenu');

 	 	// setTimeout(
 	 	//  	() => this.scene.start('MainMenu'), 1000
 	 	// );
 	}
}
