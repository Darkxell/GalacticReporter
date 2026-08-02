/** List of utility functions used by the Galactic Reporter ESM */

/**
 * Predicate function to verify the integrity of arguments passed to the ``computeProfile()`` method are correct.
 * 
 * @return A status object containing an integer ``status.code`` and a string ``status.message``.
 */
export function utils_verifyInputs(ship, duration, enemiesCount, algo) {
    // Verify duration correctness
    if (duration === undefined) return { code: 1, message: "No duration parameter was given." };
    if (!Number.isInteger(duration)) return { code: 1, message: "Given duration parameter is not an integer number." };
    if (duration < 1) return { code: 1, message: "Given duration parameter needs to be at least one second." };
    if (duration > 36000) return { code: 1, message: "Given duration parameter can't go above 10 hours, or 36000 seconds." };
    // Verify enemy count correctness
    if (enemiesCount === undefined) return { code: 1, message: "No enemiesCount parameter was given." };
    if (!Number.isInteger(enemiesCount)) return { code: 1, message: "Given enemiesCount parameter is not an integer number." };
    if (enemiesCount < 1) return { code: 1, message: "Given enemiesCount parameter needs to be at least one." };
    if (enemiesCount > 1000) return { code: 1, message: "Given enemiesCount parameter can't go above 1000." };
    // Verify ship structure correctness
    // TODO
    // TODO : don't forget to verify that all items have a "type" field appended!
    // No errors fallback
    return { code: 0, message: "Inputs are complete." }
}

/**
 * Utility function to get the matching system object from a given level
 * 
 * @returns The first system object from the given system dataset where the given level would be allowed.
 * Returns null  if no system was found.
 * 
 * @throws Error If the given dataset is not a system dataset.
 * */
export function utils_getSystem(level, dataset) {
    if (!dataset.dataset || dataset.dataset !== "systems")
        throw new Error("Tried to match a level to a system, but the system dataset was malformed!");
    for (var system of dataset.data) {
        if (level >= system.minlevel && level <= system.maxlevel) return system;
    }
    return null;
}

/** 
 * Predicate that returns true if the given item is a combat useful, damage enhancing buff. 
 * 
 *  * @param itemName the name of the item type to check
*/
export function utils_isBuff(itemName) {
    var listOfBuffs = [
        "aim",
        "taunt",
        "speedbuff",
        "attackbuff",
        "attackturret"
    ];
    return listOfBuffs.includes(itemName);
}

/** 
 * Predicate that returns true if the given item will deal damage upon using it against a target.
 * 
 * @param itemName the name of the item type to check
 * */
export function utils_isDamageDealer(itemName) {
    var listOfDamageItems = [
        "blaster",
        "rocket",
        "timedamage",
        "bomb",
        "aggrobeacon",
        "sniperblaster",
        "attackdroid",
        "orbitalstrike",
        "stickybomb",
        "mine",
        "lightningchain"
    ];
    return listOfDamageItems.includes(itemName);
}

/** 
 * Utility function to compute how much damage an item does.
 * Note that this function does NOT factor in accuracy, buffs or crits, it is only a normalized
 * power computation function to normalise damage per cast.
 * 
 * @param item structure, must have a type attribute set
 * 
 * @return How much damage potential using this item has. For most items, this is equal to their power,
 * but it may be different for damage over time items, or items that spawns an entity.
 */
export function utils_computeUnbuffedDamage(item) {
    // TODO : add attack droid here, somehow
    switch (item.type) {
        case "blaster":
        case "rocket":
        case "bomb":
        case "sniperblaster":
        case "orbitalstrike":
        case "stickybomb":
        case "mine":
        case "lightningchain":
            return item.power;
        case "timedamage":
            return item.power * Math.ceil(item.active);
        case "aggrobeacon":
            return item.power * item.active;
        default:
            return 0;
    }
}
