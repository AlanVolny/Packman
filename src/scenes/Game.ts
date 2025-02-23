import { Scene } from 'phaser';
import { calcPathfindingField, Entity, loadLevel, Tile, updateEntityPositions } from '../levels/LevelUtil';
import { setScore, store } from '../ReduxStore';


export class Game extends Scene
{
	// public player: Phaser.GameObjects.Sprite;
	public player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
	public entityMap: Record<string, Phaser.Types.Physics.Arcade.SpriteWithDynamicBody> = {};

	public tiles: Tile[][];
	public entities: Entity[];
	public playerId: number;
	public pellets: {x: number, y: number, sprite: Phaser.GameObjects.Sprite}[] = [];
	public hasWon = false;
	public hasLost = false;
	constructor () { super('Game'); }

	public playerEatSound: Phaser.Sound.NoAudioSound | Phaser.Sound.HTML5AudioSound | Phaser.Sound.WebAudioSound;
	public squeek: Phaser.Sound.NoAudioSound | Phaser.Sound.HTML5AudioSound | Phaser.Sound.WebAudioSound;
	public crunch: Phaser.Sound.NoAudioSound | Phaser.Sound.HTML5AudioSound | Phaser.Sound.WebAudioSound;
	public winSound: Phaser.Sound.NoAudioSound | Phaser.Sound.HTML5AudioSound | Phaser.Sound.WebAudioSound;
	public respawnSound: Phaser.Sound.NoAudioSound | Phaser.Sound.HTML5AudioSound | Phaser.Sound.WebAudioSound;
	public chorus: Phaser.Sound.NoAudioSound | Phaser.Sound.HTML5AudioSound | Phaser.Sound.WebAudioSound;

	public tileSize: number = 32;
	public mapStart = {x:160, y:50};

	public timerText: Phaser.GameObjects.Text;
	public timeSpentAlive: number = 0;
	public deaths: number = 0;

	public intialPositions: Record<number, {x, y}> = {};

	public speeds = {
		skele: 70,
		player: 140
	};

	public levelId = 5;

	public tPos(x: number, y: number): {x: number, y: number} {
		return {
			x: this.mapStart.x + (x * this.tileSize) + (this.tileSize/2),
			y: this.mapStart.y + (y * this.tileSize) + (this.tileSize/2)
		}
	}

	public score(timeMs: number, deaths: number) {
		return timeMs/1000 + deaths*20;
	}

	init(data: {level: number}) {
		this.levelId = data.level;

		/** Reset values, as these don't get reset between scene switches */
		this.hasWon = false;
		this.hasLost = false;

		this.pellets = [];
		this.hasWon = false;
		this.hasLost = false;

		this.timeSpentAlive = 0;
		this.deaths = 0;
	}

	create ()
	{
		/** ***************************** */
		/** Background */

		this.add.image(512, 384, 'background');


		/** ***************************** */
		/** Tilemap */

		const loadedLvl = loadLevel(this.levelId);
		this.tiles = loadedLvl.tiles;
		this.entities = loadedLvl.entities;

		// Load a map from a 2D array of tile indices
		const level = this.tiles.map(tileRow => tileRow.map(t => t.sprite!));
		console.log('level sprites:', level)

		// When loading from an array, make sure to specify the tileWidth and tileHeight
		const map = this.make.tilemap({ data: level, tileWidth: 32, tileHeight: 32 });
		const tileMapImage = map.addTilesetImage("thaWalls")!;

		
		const layer = map.createLayer(0, tileMapImage, this.mapStart.x, this.mapStart.y);

		/** Load pellets */
		for (const tile of this.tiles.flatMap(t => t)) {
			if (tile.pellet) {
				const pos = this.tPos(tile.x!, tile.y!);
				const sprite = this.add.sprite( pos.x, pos.y, 'cheese', 24 );
				this.pellets.push({x: tile.x, y: tile.y, sprite});
			}
		}

		/** ***************************** */
		/** Entities */

		/** Instantiate entity sprites */
		for (const entity of this.entities) {
			let spriteName = '';
			if (entity.type === 'player') { spriteName = 'ratChef'; }
			if (entity.type === 'enemy') { spriteName = 'skele'; }
			const pos = this.tPos(entity.toTile!.x, entity.toTile!.y);
			const physObj = this.physics.add.sprite(pos.x, pos.y, spriteName);
			if (entity.type === 'player') { this.player = physObj; }
			this.entityMap[entity.id!] = physObj;
			// if (entity.type === 'enemy') { this.enemies[entity.id!] = physObj; }

			if (entity.type === 'player') { this.playerId = entity.id; }

			this.intialPositions[entity.id] = {...entity.fromTile};
		}

		// this.player = this.physics.add.sprite(100, 450, 'ratChef');


		/** ***************************** */
		/** UI */

		this.add.text(60, 60, `Level ${this.levelId}`, {
			fontFamily: 'sparkyStones', fontSize: 24, color: '#ffffff',
			stroke: '#000000', strokeThickness: 8,
			align: 'center'
		}).setOrigin(0.5);

		this.timerText = this.add.text(60, 110, `0 s`, {
			fontFamily: 'sparkyStones', fontSize: 24, color: '#ffffff',
			stroke: '#000000', strokeThickness: 8,
			align: 'center'
		}).setOrigin(0.5);


		/** ***************************** */
		/** Audio */

		this.playerEatSound = this.sound.add('playerEat', { volume: 0.13 });
		this.squeek = this.sound.add('squeek', { volume: 0.2 });
		this.crunch = this.sound.add('skeleEat', { volume: 0.5 });
		this.winSound = this.sound.add('winSound', { volume: 0.7 });
		this.respawnSound = this.sound.add('respawnSound', { volume: 1.0 });
		// this.chorus = this.sound.add('chorus', { volume: 1.0 });



		calcPathfindingField(this.tiles, this.entities); 


		/** Check if user wants to exit to menu */
		const escapeKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

		escapeKey?.on('down', () => {
			console.log('Escape clicked');
		    this.scene.start('MainMenu');
		});

		this.input.keyboard?.on('keydown-P', () => {
			console.log('Peeee clicked');
			this.timeSpentAlive = 200000;
			this.manualWin = true;
		});


	}

	public manualWin = false;

	update(time: number, delta: number): void {
		const cursors = this.input.keyboard!.createCursorKeys();

		/** Check if we've won */
		if (this.manualWin || (!this.hasLost && !this.hasWon && this.pellets.length === 0)) {
			this.manualWin = false;
		// if (!this.hasLost && !this.hasWon && this.pellets.length === 30) {
			this.winSound.play();
			this.hasWon = true;
			this.timerText = this.add.text(450, 30, 'Press ESC to exit', {
				fontFamily: 'sparkyStones', fontSize: 24, color: '#ffffff',
				stroke: '#000000', strokeThickness: 8,
				align: 'center'
			}).setOrigin(0.5);
			const newScore = Math.floor(this.score(this.timeSpentAlive, this.deaths));
			store.dispatch(setScore({ level: this.levelId, score: newScore }))
		}

		/** Check if we've lost */
		const player = this.entities.find(e => e.type === 'player')!
		for (const ent of this.entities) {
			if (ent.type==='enemy' && ent.toTile.x === player.toTile.x && ent.toTile.y === player.toTile.y) {
				if (!this.hasWon && !this.hasLost) {
					this.deaths += 1;
					this.hasLost = true;
					this.squeek.play();
					setTimeout(() => { this.crunch.play() }, 600);

					setTimeout(() => {
						this.resetPositions();
						this.hasLost = false;
						this.respawnSound.play();
					}, 3000);
					
				}
			}
		}

		/** Update the score */
		if (!this.hasWon && !this.hasLost) {
			this.timeSpentAlive += delta;
			this.timerText.setText(`${Math.floor(this.score(this.timeSpentAlive, this.deaths))} s`);
		}

		const skele_x_adj = 12;
		const skele_y_adj = 16;
		

		/* For each entity - if they've reached their destination tile, decide a new one */
		const hasReachedDest = (entity: Entity) => {
			const entBody = this.entityMap[entity.id];

			const fromPos = this.tPos(entity.fromTile.x, entity.fromTile.y)
			const atPos = {x: entBody.body.position.x + skele_x_adj, y: entBody.body.position.y + skele_y_adj};
			const toPos = this.tPos(entity.toTile.x, entity.toTile.y)

			if (this.isInbetween(toPos.x, atPos.x, fromPos.x) || this.isInbetween(toPos.y, atPos.y, fromPos.y) || (atPos.x === toPos.x && atPos.y === toPos.y)) {
				return true;
			}
			return false;
		}
		let pathfindingWasRecalced = false;
		for (const ent of this.entities) {
			if (!hasReachedDest(ent)) { continue; }

			if (ent.type === 'enemy') {
				updateEntityPositions(this.tiles, this.entities);
				if (!pathfindingWasRecalced) {
					calcPathfindingField(this.tiles, this.entities); pathfindingWasRecalced = true;
				}

				const entBody = this.entityMap[ent.id];

				const curTile = this.tiles[ent.toTile.y][ent.toTile.x];
				let validTilesToMoveTo = Object.values(curTile.neighbors).filter(t => t!==null && t.passable) as  Tile[];
				let goodTilesToMoveTo = validTilesToMoveTo.filter(t => 
					!(t.x===ent.fromTile.x && t.y===ent.fromTile.y) && // don't go backwards
					(t.curEntityId === -1 || t.curEntityId ===this.playerId) // don't go onto an occupied tile
				);
				if (goodTilesToMoveTo.length === 0) {
					console.log('Nothing matching NO BACKWARD and NO OCCUPIED');
					goodTilesToMoveTo = validTilesToMoveTo.filter(t =>
						(t.curEntityId === -1 || t.curEntityId ===this.playerId) // don't go onto an occupied tile
					);
					if (goodTilesToMoveTo.length === 0) {
						console.log('Nothing matching NO OCCUPIED');
						goodTilesToMoveTo = validTilesToMoveTo;
					}
				}
				/** of the tiles we can move to, choose which the AI would prefer to go to */
				let newToTile = goodTilesToMoveTo[0];
				for (const t of goodTilesToMoveTo) { if (t.heat! > newToTile.heat!) { newToTile = t; }}

				// validTilesToMoveTo = validTilesToMoveTo.sort((a,b) => a.heat! > b.heat! ? 1 : -1)

				ent.toTile = {x: newToTile.x, y: newToTile.y};
				ent.fromTile = {x: curTile.x, y: curTile.y};


				let animToPlay = '';
				if (newToTile === curTile.neighbors.up) {
					entBody.setVelocityX(0);
					entBody.setVelocityY(-this.speeds.skele);
					animToPlay = 'skele_up';
				} else if (newToTile === curTile.neighbors.down) {
					entBody.setVelocityX(0);
					entBody.setVelocityY(this.speeds.skele);
					animToPlay = 'skele_down';
				} else if (newToTile === curTile.neighbors.left) {
					entBody.setVelocityX(-this.speeds.skele);
					entBody.setVelocityY(0);
					animToPlay = 'skele_left';
				} else if (newToTile === curTile.neighbors.right) {
					entBody.setVelocityX(this.speeds.skele);
					entBody.setVelocityY(0);
					animToPlay = 'skele_right';
				}
				if (this.hasWon || this.hasLost) { entBody.setVelocityX(0); entBody.setVelocityY(0); }

				const curPos = this.tPos(curTile.x, curTile.y);
				// entBody.body.position.set(curPos.x, curPos.y);
				entBody.anims.play(animToPlay, true);


			} else if (ent.type === 'player') {
				let animToPlay = '';

				const curTile = this.tiles[ent.toTile.y][ent.toTile.x];

				if (curTile.pellet) {
					curTile.pellet = false;
					this.pellets = this.pellets.filter(p => {
						if (p.x===curTile.x && p.y===curTile.y) {
							p.sprite.destroy();
							return false;
						}
						return true;
					});
				}

				let newToTile: Tile | null = null;
		
				if (cursors.left.isDown && curTile.neighbors.left?.passable) {
					this.player.setVelocityX(-this.speeds.player);
					this.player.setVelocityY(0);
					animToPlay = 'rat_left';
					newToTile = curTile.neighbors.left;
				} else if (cursors.right.isDown && curTile.neighbors.right?.passable) {
					this.player.setVelocityX(this.speeds.player);
					this.player.setVelocityY(0);
					animToPlay = 'rat_right';
					newToTile = curTile.neighbors.right;
				}
				
				if (cursors.up.isDown && curTile.neighbors.up?.passable) {
					this.player.setVelocityY(-this.speeds.player);
					this.player.setVelocityX(0);
					animToPlay = 'rat_up';
					newToTile = curTile.neighbors.up;
				} else if (cursors.down.isDown && curTile.neighbors.down?.passable) {
					this.player.setVelocityY(this.speeds.player);
					this.player.setVelocityX(0);
					animToPlay = 'rat_down';
					newToTile = curTile.neighbors.down;
				}
		
				if (newToTile && !(this.hasWon || this.hasLost)) {
					ent.toTile = {x: newToTile.x, y: newToTile.y};
					ent.fromTile = {x: curTile.x, y: curTile.y};
					this.player.anims.play(animToPlay, true);
					if (newToTile.pellet) {
						this.playerEatSound.play();
					}
				} else {
					this.player.setVelocityX(0);
					this.player.setVelocityY(0);
					this.player.anims.stop();
				}
			}

		}
		

		const debug: boolean = false;
		if (debug) {
			let [min, max] = [200, 50];
			for (const tile of this.tiles.flatMap(t=>t)) {
				if (!tile.passable) { continue }
				if (tile.heat! < min) { min = tile.heat!; }
				if (tile.heat! > max) { max = tile.heat!; }
			}
			const range = max - min;
			const rgb = (heat: number) => {
				const h = heat - min;
				const r = Math.floor((h / range) * 255)
				const b = Math.floor(255 - r)
				const out = `#${r.toString(16).padStart(2, '0')}33${b.toString(16).padStart(2, '0')}`;
				return out;
			}

			for (const tile of this.tiles.flatMap(t=>t)) {
				if (!tile.passable) { continue; }
				if ((tile as any).text) {
					(tile as any).text.destroy();
				}
				const tPos = this.tPos(tile.x, tile.y);
				(tile as any).text = this.add.text(tPos.x, tPos.y, `${Math.floor(tile.heat!*10 || 0)/10}`, {
				fontFamily: 'Arial Black', fontSize: 14, color: rgb(tile.heat!),
				stroke: '#000000', strokeThickness: 1,
				align: 'center'
				}).setOrigin(0.5);
			}
		}	
	}

	/** Upon death, reset all position */
	public resetPositions() {
		console.log('resetPositions');
		for (const entity of this.entities) {
			entity.toTile = this.intialPositions[entity.id];
			entity.fromTile = this.intialPositions[entity.id];
			const pos = this.tPos(this.intialPositions[entity.id].x, this.intialPositions[entity.id].y);
			const sprite = this.entityMap[entity.id!];
			sprite.setPosition(pos.x, pos.y);
		}
		this.hasLost = false;
	}

	public isInbetween(num: number, limitA: number, limitB: number) {
		const {lower, upper} = {lower: Math.min(limitA, limitB), upper: Math.max(limitA, limitB) };
		if (num > lower && num < upper) { return true; }
		return false
	}
}
