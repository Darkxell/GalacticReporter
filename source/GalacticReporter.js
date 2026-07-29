/** Galactic reporter library
 * @author Darkxell
 * @license MIT
 * A ESM to compute damage profiles for spaceships in the game Pirate Galaxy
 * https://github.com/Darkxell/GalacticReporter
 * 
 * This software is in no way related to Splitscreen Studios GMBH
 */

/**
 * Predicate function to verify the integrity of arguments passed to the ``computeProfile()`` method are correct.
 * 
 * @return A status object containing an integer ``status.code`` and a string ``status.message``.
 */
function verifyInputs(ship, duration, enemiesCount, algo) {
    // Verify duration correctness
    if (duration === undefined) return { code: 1, message: "No duration parameter was given." };
    if (!Number.isInteger(duration)) return { code: 1, message: "Given duration parameter is not an integer number." };
    if (duration < 1) return { code: 1, message: "Given duration parameter needs to be at least one second." };
    if (duration > 36000) return { code: 1, message: "Given duration parameter can't go above 10 hours, or 36000 seconds." };
    // Verify enemy count correctness
    if (enemiesCount === undefined) return { code: 1, message: "No enemiesCount parameter was given." };
    if (!Number.isInteger(enemiesCount)) return { code: 1, message: "Given enemiesCount parameter is not an integer number." };
    if (enemiesCount < 1) return { code: 1, message: "Given enemiesCount parameter needs to be at least one." };
    if (enemiesCount > 36000) return { code: 1, message: "Given enemiesCount parameter can't go above 1000." };
    // Verify ship structure correctness
    // TODO
    // No errors fallback
    return { code: 0, message: "Inputs are complete." }
}

function profileDamage(ship, duration, enemiesCount, algo) { //TODO
    // Exemple of a simulation on for 10 seconds, dealing a total of 950 dmg
    simulationResult = {
        totalDamage: 950, graph: [
            { time: 1, damage: 100, item: "$blaster.fusion32" },
            { time: 2, damage: 200, item: "$blaster.fusion32" },
            { time: 4, damage: 450, item: "$rocket.32" },
            { time: 5, damage: 550, item: "$blaster.fusion32" },
            { time: 6, damage: 650, item: "$blaster.fusion32" },
            { time: 7, damage: 750, item: "$blaster.fusion32" },
            { time: 8, damage: 850, item: "$blaster.fusion32" },
            { time: 9, damage: 950, item: "$blaster.fusion32" }]
    }
    return simulationResult
}

function profileTankyness(ship) { // TODO
    return { effectiveHitpool: ship.health }
}

function profileMobility(ship) {// TODO
    maxSpeed = ship.speed
    return { totalTravel: 150000, topSpeed: maxSpeed }
}

function profileValidity(ship) { //TODO
    return "vega"
}

/* ----- Utility runtime classes ----- */

/**
* Instance of a ship in combat.
* Contains current information of a simulated ship's state, such as current active buffs or cooldowns.
*/
class SimulatedShip{
    // Builds a new SimulatedShip given a static image of a loadout.
    // Exemples of this structure may be returned from fetchPresets().
    constructor(ship){
        // Structure containing all needed static data about the ship
        this.ship = ship;
        // Amount of time in which the ship will be able to take its next action, in seconds.
        // This may lower faster than real time if the ship is afflicted by a speed actuator
        this.gcd = 0;
        // Dictionnary of cooldowns for the different items 
        itemcooldowns = [];
        for(item in ship.items){
             itemcooldowns.append({item : item, cooldown : 0});
        }
        this.itemcooldowns = itemcooldowns;
    }

    /** Advances time for this simulated ship by the given amount, in seconds. */
    tick(ticktime){
        this.gcd -= ticktime;
        if (this.gcd < 0) this.gcd = 0;
    }
    
    getHighestDamageItem(){}

    /** Predicate that returns true if this SimualtedShip instance has at least 1 buffing item it can use */
    hasBuffToUse(){
        return false;
    }
    
    /** Predicate that returns true if the given item is a combat useful buff. */
    static isBuff(item){
        return false;
    }

    /** Predicate that returns true if the given item will deal damage upon using it against a target. */
    static isDamageDealer(item){
        return false;
    }
}

/* ----- Export functions below ----- */

/** Global static instance of the items dataset used for all computations */
let DATASET_ITEMS = null
/** Global static instance of the ships dataset used for all computations */
let DATASET_SHIPS = null
/** Global static instance of the systems dataset used for all computations */
let DATASET_SYSTEMS = null

/**
 * 
 */
export function loadDataset(dataset) {
    if (!dataset) throw new Error("No dataset was given, ignored the load attempt.");
    if (!dataset.dataset) throw new Error("Given dataset has no dataset property, hence its type could not be determined to be loaded.");
    if (!dataset.data) throw new Error(`Given dataset for ${dataset.dataset} has no data attribute, and was not loaded.`);
    switch (dataset.dataset) {
        case "items":
            DATASET_ITEMS = dataset;
            break;
        case "ships":
            DATASET_SHIPS = dataset;
            break;
        case "systems":
            DATASET_SYSTEMS = dataset;
            break;
        default:
            break;
    }
}

/**
 * 
 */
export function fetchPresets() {

}

/**
 * Simulates combat with the given spaceship for the given amount of time against the given amount of enemies.
 * This will create a detailed scoring profile for that spaceship configuration, allowing ranking among many different setups.
 * 
 * Warning : This method may take a while to return a value, an asynchronous call is recommended.
 * 
 * @param {*} ship The spaceship to compute data for.
 * This should have the same structure as one of the entries from the ``fetchPresets()`` function.
 * @param {*} duration The duration to compute damage for. Integer time, in seconds. One minute is 60, one hour is 3600.
 * Accepted values are any positive integer value between 1 and 36000 included.
 * @param {*} enemiesCount How many enemies are in front of the theorical spaceship for calculations.
 * This affects greatly how much damage AoE items like rockets or chains deal.
 * Accepted values are any positive integer value between 1 and 1000 included.
 * @param {*} algo (optional) String identifier of the algorithm to use.
 * 
 * @returns A profile containing data about how the simulated combat went, including how much damage was dealt or could be taken.
 * Exact return structure documentation is available on github.
 * 
 * @throws Error --- If the given input is malformed, with a description of the element in error.
 * Note that this library needs to be initialized with data from the game, this function will also throw an error if a dataset is missing.
 */
export function computeProfile(ship, duration, enemiesCount, algo) {
    var status = verifyInputs(ship, duration, enemiesCount, algo);
    if (status.code !== 0) throw new Error(status.message);

    if (!DATASET_ITEMS) throw new Error("Item dataset is not loaded.");
    if (!DATASET_SHIPS) throw new Error("Ships dataset is not loaded.");
    if (!DATASET_SYSTEMS) throw new Error("System dataset is not loaded.");

    computedDamage = profileDamage(ship, duration, enemiesCount, algo)
    computedTankyness = profileTankyness(ship)
    computedMobility = profileMobility(ship)
    computedValidity = profileValidity(ship)

    return { damage: computedDamage, tankyness: computedTankyness, mobility: computedMobility, validity: computedValidity }
}
