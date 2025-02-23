// import level0 from '../levels/level0.json';
import level0 from './../../levels/level0.json';
import level1 from './../../levels/level1.json';
import level2 from './../../levels/level2.json';
import level3 from './../../levels/level3.json';
import level4 from './../../levels/level4.json';

export interface Entity {
    type: 'player' | 'enemy',
    toTile: { x: number, y: number },
    fromTile: { x: number, y: number },

    id: number
}


export interface Tile {
    passable: boolean,
    neighbors: {left: Tile | null, right: Tile | null, up: Tile | null, down: Tile | null}
    sprite: number

    pellet: boolean,

    curEntityId?: number, // the entity on the tile

    /** for pathfinding */
    heat?: number
    curHeat?: number
    checkedEnt?: number

    x: number,
    y: number,
}

export interface WfcTile {
    neighbors: WfcTile[],
    passable: boolean,
    type: Array<'ground' | 'water' | 'wall' | 'prop' | 'void'>
}


export function loadLevel(level: number): { tiles: Tile[][], entities: Entity[] } {

    const tiles: Tile[][] = [];
    const entities: Entity[] = [];

    console.log('loadlevel', level);

    // const templateTiles = level === 1 ? level0.tiles : level1.tiles;
    let templateTiles: string[] = [];
    if (level===1) { templateTiles=level0.tiles; }
    if (level===2) { templateTiles=level1.tiles; }
    if (level===3) { templateTiles=level2.tiles; }
    if (level===4) { templateTiles=level3.tiles; }
    if (level===5) { templateTiles=level4.tiles; }

    /** First, construct the tiles and entities */
    for (const row of templateTiles) {
        const tileRow: Tile[] = [];

        for (const tileStr of row) {
            const { tile, entity } = createUninitializedFromTileString(tileStr);
            if (entity) { entity.id = entities.length; tile.curEntityId = entity.id; entities.push(entity) }
            tileRow.push(tile); 
        }

        tiles.push(tileRow);        
    }

    /** Initialize the tiles and entities */
    for (let rowInd=0; rowInd<tiles.length; rowInd++) {
        const tileRow = tiles[rowInd]
        for (let tileInd=0; tileInd < tileRow.length; tileInd++) {
            const tile = tileRow[tileInd];
            tile.x = tileInd;
            tile.y = rowInd;

            /** Calc the neighbors */
            tile.neighbors = {
                left: tiles[rowInd]?.[tileInd-1] || null,
                right: tiles[rowInd]?.[tileInd+1] || null,
                up: tiles[rowInd-1]?.[tileInd] || null,
                down: tiles[rowInd+1]?.[tileInd] || null,
            }

            /** Tell the entity which tile it's at  */
            if (tile.curEntityId !== undefined) {
                entities[tile.curEntityId].fromTile = { x: tileInd, y: rowInd }
                entities[tile.curEntityId].toTile = { x: tileInd, y: rowInd }
            }

            /** Calc the sprite to use */
            const connectTo = (t: Tile | null) => { if (!t || t.passable) { return false; } return true; }
            if (!tile.passable) {
                tile.sprite = (connectTo(tile.neighbors.up) ? 1 : 0)
                    + (connectTo(tile.neighbors.left) ? 2 : 0)
                    + (connectTo(tile.neighbors.right) ? 4 : 0)
                    + (connectTo(tile.neighbors.down) ? 8 : 0)
            } else {
                tile.sprite = -1;
            }
        }
    }

    return {
        tiles,
        entities
    };
}

/** Create an uninitialized tile and any entity on it */
function createUninitializedFromTileString(strTile: string): { tile: any, entity?: any } {
    if (strTile === '#') {
        return {
            tile: {
                pellet: false,
                passable: false,
            }
        }
    } else if (strTile === ' ') {
        return {
            tile: {
                pellet: false,
                passable: true,
            }
        }
    } else if (strTile === 'E') {
        return {
            tile: {
                pellet: true,
                passable: true,
            },
            entity: {
                type: 'enemy',
            }
        }
    } else if (strTile === 'o') {
        return {
            tile: {
                pellet: true,
                passable: true,
            }
        }
    } else if (strTile === 'P') {
        return {
            tile: {
                pellet: false,
                passable: true,
            },
            entity: {
                type: 'player',
            }
        }
    }

    /** default */
    return {
        tile: {
            pellet: false,
            passable: false,
        }
    }
}

export function updateEntityPositions(tiles: Tile[][], entities: Entity[]) {
    for (const tile of tiles.flatMap(t => t)) { tile.curEntityId=-1; }
    for (let entInd=0; entInd<entities.length; entInd++) {
        const ent = entities[entInd];
        const [x, y] = [ent.toTile.x, ent.toTile.y];
        const t = tiles[y][x];
        t.curEntityId = ent.id;
    }
}


/** Mutates the tilemap to have heat, calculated from the entities */
/**    Expects entitiy positions to be correct. */
export function calcPathfindingField(tiles: Tile[][], entities: Entity[]) {
    /** reset vals */
    for (const tile of tiles.flatMap(t => t)) { tile.heat=0; }
    for (const tile of tiles.flatMap(t => t)) { tile.checkedEnt=-1; }


    /** For each entity, calc pathfinding values */
    for (let entInd=0; entInd<entities.length; entInd++) {
        const ent = entities[entInd];

        // if (ent.type !== 'player') { continue; }
        for (const tile of tiles.flatMap(t => t)) { tile.curHeat=0; }

        const curTile = tiles[ent.toTile!.y][ent.toTile!.x];
        curTile.checkedEnt = entInd;


        let heat = ent.type === 'player' ? 100 : -30
        let tilesToCheck = [{tile: curTile, heat}];
        // let tilesToCheck: Record<string, {tile: Tile, heat: number}> = {
        //     [`${curTile.x}_${curTile.y}`]: {tile: curTile, heat}
        // };

        while (tilesToCheck.length) {
            const newTilesToCheck: {tile: Tile, heat: number}[] = [];
            // const newTilesToCheck: Record<string, {tile: Tile, heat: number}> = {};
            for (const t of tilesToCheck) {
                const tile = t.tile;
                if (Math.abs(tile.curHeat!) > Math.abs(t.heat)) { continue; }
                tile.curHeat! = t.heat;
                const validNeighbors: Tile[] = Object.values(tile.neighbors!).filter(n => n!==null && n.passable && n.curEntityId===-1) as Tile[];
                // let newHeat;
                // if (ent.type === 'player') {
                //     newHeat = t.heat - 2; 
                // } else {
                //     newHeat = t.heat * 0.9;
                // }
                // const newHeat = (t.heat / validNeighbors.length) * 0.95;
                // const newHeat = (t.heat / ((validNeighbors.length - 1 ) || 1)) * (ent.type === 'player' ? 0.95 : 0.80);;


                const newHeat = t.heat * (ent.type === 'player' ? 0.95 : 0.80);
                const neighbors = validNeighbors.map(v => { return {tile: v, heat: newHeat}});
                // for (const n of validNeighbors) {
                //     const key = `${n.x}_${n.y}`;
                //     if (newTilesToCheck[key]) { newTilesToCheck[key].heat = Math.max(newTilesToCheck[key].heat, newHeat) }
                //     else {newTilesToCheck[key] = {tile: n, heat:newHeat}}
                // }
                newTilesToCheck.push(...neighbors);
            }
            // tilesToCheck = Object.values(newTilesToCheck);
            tilesToCheck = newTilesToCheck;
        }


        for (const tile of tiles.flatMap(t => t)) { tile.heat! += tile.curHeat!; }
    }
}









