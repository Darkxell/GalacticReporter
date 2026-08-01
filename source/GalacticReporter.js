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
    var simulationResult = {
        totalDamage: 950, graph: [
            { time: 1, damage: 100, item: "$blaster.fusion32" },
            { time: 2, damage: 200, item: "$blaster.fusion32" },
            { time: 4, damage: 450, item: "$rocket.32" },
            { time: 5, damage: 550, item: "$blaster.fusion32" },
            { time: 6, damage: 650, item: "$blaster.fusion32" },
            { time: 7, damage: 750, item: "$blaster.fusion32" },
            { time: 8, damage: 850, item: "$blaster.fusion32" },
            { time: 9, damage: 950, item: "$blaster.fusion32" }]
    };
    return simulationResult;
}

function profileTankyness(ship) { // TODO
    return { effectiveHitpool: ship.health };
}

function profileMobility(ship) {// TODO
    var maxSpeed = ship.speed;
    return { totalTravel: 150000, topSpeed: maxSpeed };
}

function profileValidity(ship) { //TODO
    return "vega";
}

/* ----- Utility runtime classes ----- */

/**
* Instance of a ship in combat.
* Contains current information of a simulated ship's state, such as current active buffs or cooldowns.
*/
class SimulatedShip {
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
        for (item of ship.items) {
            itemcooldowns.append({ item: item, cooldown: 0 });
        }
        this.itemcooldowns = itemcooldowns;
    }

    /** Advances time for this simulated ship by the given amount, in seconds. */
    tick(ticktime) {
        this.gcd -= ticktime;
        if (this.gcd < 0) this.gcd = 0;
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
        if (!utils_isDamageDealer(item)) return 0;

    }

    getHighestDamageItem() {
        // TODO
    }

    /** Predicate that returns true if this SimualtedShip instance has at least 1 buffing item it can use */
    hasBuffToUse() {
        // TODO
        return false;
    }

}

/**
 * Utility function to get the matching system object from a given level
 * 
 * @returns The first system object from the given system dataset where the given level would be allowed.
 * Returns null  if no system was found.
 * 
 * @throws Error If the given dataset is not a system dataset.
 * */
function utils_getSystem(level, dataset) {
    if (!dataset.dataset || dataset.dataset !== "systems")
        throw new Error("Tried to match a level to a system, but the system dataset was malformed!");
    for (var system of dataset.data) {
        if (level >= system.minlevel && level <= system.maxlevel) return system;
    }
    return null;
}

/** Predicate that returns true if the given item is a combat useful, damage enhancing buff. */
function utils_isBuff(item) {
    var listOfBuffs = [
        "aim",
        "taunt",
        "speedbuff",
        "attackbuff",
        "attackturret"
    ];
    return listOfBuffs.includes(item.type);
}

/** Predicate that returns true if the given item will deal damage upon using it against a target. */
function utils_isDamageDealer(item) {
    var listOfBuffs = [
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
    return listOfBuffs.includes(item.type);
}

/* ----- Export functions below ----- */

/** Global static instance of the items dataset used for all computations */
let DATASET_ITEMS = null;
/** Global static instance of the ships dataset used for all computations */
let DATASET_SHIPS = null;
/** Global static instance of the systems dataset used for all computations */
let DATASET_SYSTEMS = null;

/**
 * Loads the datasets containing actual pirate galaxy game data into this library.
 * At least three datasets must be loaded: Ships, Items and Systems.
 * The javascript object (JSON notation) to give to this function may be founf in the GalacticBlueprint repository.
 * 
 * @throws Error --- If the dataset is malformed, or no dataset was given
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
 * Utility function to create a list of representative ship presets.
 * 
 * @returns An array of ship presets, ready for input in the computeProfile() fonctions.
 * 
 * @throws Error --- If the loadDataset() function has not been called, or failed to load.
 * May also throw an error if the dataset version is out of sync with this library version, as it may try to create presets with items that no longer exist.
 */
export function fetchPresets() {
    var shipPresets = [];
    if (DATASET_ITEMS == null) throw new Error(`Items dataset was not loaded properly, failed to generate and serve presets.`);
    if (DATASET_SHIPS == null) throw new Error(`Ships dataset was not loaded properly, failed to generate and serve presets.`);
    if (DATASET_SYSTEMS == null) throw new Error(`Systems dataset was not loaded properly, failed to generate and serve presets.`);

    // For each ship raw out of the dataset, creates a full loadout with specific items and drones.
    for (const rawShip of DATASET_SHIPS.data.entries) {
        // skip custom classes
        if (rawShip.class === "custom") continue;
        // Build a default ship loadout
        var shipLoadout = {
            name: rawShip.name,
            class: rawShip.class,
            speed: rawShip.speed
        };
        // Equip a default armor, usually the best available
        // TODO : smarter handling of sirius and vega here, probably.
        shipLoadout.armor = rawShip.armors.at(-1);
        delete shipLoadout.armor.price;
        // Fetch the ship's estimated system and class info
        var shipSystem = utils_getSystem(shipLoadout.armor.level, DATASET_SYSTEMS);
        if (shipSystem === undefined) continue;
        var shipclass = DATASET_SHIPS.data.classes.find(c => c.name === rawShip.class);
        if (shipclass === undefined) continue;
        shipLoadout.items = [];
        // Heuristically fetch the best item for each item slot of the ship's class
        for (var itemslot of shipclass.items) {
            var itemsCollection = DATASET_ITEMS.data[itemslot].entries;
            var selectedItem = null;
            for (var i = itemsCollection.length - 1; i >= 0; i--) {
                if (itemsCollection[i].name.includes("conquest")) continue;
                if (itemsCollection[i].level <= shipSystem.maxlevel) {
                    selectedItem = itemsCollection[i]
                    break;
                }
            }
            if (selectedItem) shipLoadout.items.push(selectedItem);
        }
        // Add the newly built loadout to the default presets
        shipPresets.push(shipLoadout);
    }
    return shipPresets;
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

    var computedDamage = profileDamage(ship, duration, enemiesCount, algo)
    var computedTankyness = profileTankyness(ship)
    var computedMobility = profileMobility(ship)
    var computedValidity = profileValidity(ship)

    return { damage: computedDamage, tankyness: computedTankyness, mobility: computedMobility, validity: computedValidity }
}
