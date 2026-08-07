/** Classes and functions related to the game simulation */

import {
    utils_isBuff,
    utils_isDamageDealer,
    utils_computeUnbuffedDamage
} from "./GR_Utils.js";

/**
* Instance of a ship in combat.
* Contains current information of a simulated ship's state, such as current active buffs or cooldowns.
*/
export class SimulatedShip {
    // Builds a new SimulatedShip given a static image of a loadout.
    // Exemples of this structure may be returned from fetchPresets().
    constructor(ship) {
        // Structure containing all needed static data about the ship instance
        // This is a ship loadout, not a raw hull from the dataset.
        this.ship = ship;
        // Amount of time in which the ship will be able to take its next action, in seconds.
        // This may lower faster than real time if the ship is afflicted by a speed actuator
        this.gcd = 0;
        // Dictionnary of cooldowns for the different items 
        var itemcooldowns = [];
        for (var item of ship.items) {
            itemcooldowns.push({ item: item, cooldown: 0 });
        }
        this.itemcooldowns = itemcooldowns;
        // Array of buffs this ship has.
        // Each buff has the following structure : {type, strength, duration, source}
        // duration is in seconds, strength is a percentage
        this.buffs = [];
        // TODO : add drones and boosters as permanent buffs here
    }

    /** Advances time for this simulated ship by the given amount, in seconds. */
    tick(ticktime) {
        this.gcd -= ticktime;
        if (this.gcd < 0) this.gcd = 0;
        for (let item of this.itemcooldowns) {
            item.cooldown -= ticktime;
            if (item.cooldown < 0) item.cooldown = 0;
        }
        for (let buff of this.buffs) {
            // Buffs lasting more than 1hour are considered permanent
            if(buff.duration <= 3600)buff.duration -= ticktime;
        }
        this.buffs = this.buffs.filter(b => b.duration <= 0);
    }

    /** 
    * Returns the total amount a stat of this ship is buffed by. 
    *
    * @param type Name of the buff type. Should be one of the following:
    * [range, damage, accuracy, critical, speed, cooldown, healing, armor, drop, cryonite, energy, energycp]
    *
    * @returns the buff factor scalar. 1 if no buff apply, otherwise between 0 and the maximum buff amount.
    */
    getTotalBuffValue(type){
        let scalar = 1;
        for (let buff of this.buffs) {
            if(buff.type !== type) continue;
            switch (type) {
                case "range":
                case "damage":
                case "accuracy":
                case "critical":
                case "speed":
                case "healing":
                case "drop":
                case "energy":
                case "energycap":
                    // Additive buffs
                    scalar += buff.strength / 100;
                    break;
                case "cryonite":
                    // Multiplicative buffs
                    scalar *= (100 + buff.strength) / 100;
                    break;
                case "cooldown":
                case "armor":
                    // Multiplicative reductions
                    scalar *= (100 - buff.strength) / 100;
                    break;
                default:
                    console.log("Unsupported buff type " + type + ", assumed this ship is not buffed.");
                    return 1;
            }
        }
        return scalar;
    }
    
    /** 
     * Asks this SimulatedShip instance to use the given item.
     * The item must be part of the 
     * 
     * @param itemName the name of the item to use, should be part of this ship's itemset.
     * 
     * @returns How much damage using the item actually resulted in.
     * Will return 0 if the item could not be used
     * (if it is in cooldown, not found , or of gcd is up...)
    */
    useItem(itemName) {
        // Find the equipped item on this ship
        let itemLocale = this.itemcooldowns.find(e => e.item.name === itemName);
        if (!itemLocale) return 0;
        if (itemLocale.cooldown > 0) return 0;
        // GCD check and compute
        if (this.gcd > 0) return 0;
        this.gcd = 1.5;
        // If the item is a buff, apply the buff and put it on cooldown
        if (utils_isBuff(itemLocale.item.type)) {
            itemLocale.cooldown = itemLocale.item.cooldown;
            return 0;
        }
        // If the item deals damage, compute how much it deals and put it on cooldown
        if (utils_isDamageDealer(itemLocale.item.type)) {
            itemLocale.cooldown = itemLocale.item.cooldown;
            return this.computeDamageHeuristic(itemLocale.item);
        }
        // If it's a useless item, just put it on cooldown and move on
        itemLocale.cooldown = itemLocale.item.cooldown;
        return 0;
    }

    /**
     * Utility function that computes the expected damage of an item.
     * This factors in the current buffs active on this SimulatedShip instance.
     * Note that this may be slightly flawed, and items that deal damage over time like aggrobeacons,
     * thermoblasts or droids will be shown as total damage dealt for the cast.
     * 
     * @returns A number, representing the amount of damage using this item would result in.
     * */
    computeDamageHeuristic(item) {
        if (!utils_isDamageDealer(item.type)) return 0;
        let rawItemDamage = utils_computeUnbuffedDamage(item);
        // TODO : actually compute damage here!
        return rawItemDamage;
    }

    /**
     * Utility function that returns the highest damage useable item on this ship.
     * Will skip any item that is currently on cooldown.
     * Will always return a damaging item, or null if nothing is able to deal damage.
     */
    getHighestDamageItem() {
        let bestItem = null;
        let highestDamage = -Infinity;
        for (const itemLocale of this.itemcooldowns) {
            if (itemLocale.cooldown > 0) continue;
            if (!utils_isDamageDealer(itemLocale.item.type)) continue;
            const damage = this.computeDamageHeuristic(itemLocale.item);
            if (damage > highestDamage) {
                highestDamage = damage;
                bestItem = itemLocale.item;
            }
        }
        return bestItem;
    }

    /** Predicate that returns true if this SimualtedShip instance has at least 1 buffing item it can use */
    hasBuffToUse() {
        // TODO
        return false;
    }

}
