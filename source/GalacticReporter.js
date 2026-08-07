/** Galactic reporter library
 * @author Darkxell
 * @license MIT
 * A ESM to compute damage profiles for spaceships in the game Pirate Galaxy
 * https://github.com/Darkxell/GalacticReporter
 * 
 * This software is in no way related to Splitscreen Studios GMBH
 */

import {
    utils_verifyInputs,
    utils_getSystem
} from "./GR_Utils.js";
import {
    SimulatedShip
} from "./GR_Simulation.js";
import {
    TICKTIME
} from "./GR_Constants.js";

function profileDamage(ship, duration, enemiesCount, algo) {
    let simulationResult = { totalDamage: 0, graph: [] };
    let simulation = new SimulatedShip(ship);
    for (let i = 0; i <= duration; i += TICKTIME) {
        // Advance the game tick and compute cooldowns
        simulation.tick(TICKTIME);
        if (simulation.gcd > 0) continue;
        // GCD is down, choose an item to use
        let itemToUse = simulation.getHighestDamageItem();
        if (!itemToUse) continue;
        let dealtDamageThisTick = simulation.useItem(itemToUse.name);
        simulationResult.totalDamage += dealtDamageThisTick;
        simulationResult.graph.push({ time: Math.trunc(i * 100) / 100, damage: simulationResult.totalDamage, item: itemToUse.name });
    }



    return simulationResult;
}

function profileTankyness(ship) { // TODO
    return { effectiveHitpool: ship.health };
}

function profileMobility(ship) {// TODO
    let maxSpeed = ship.speed;
    return { totalTravel: 150000, topSpeed: maxSpeed };
}

function profileValidity(ship) { //TODO
    return "vega";
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
    let shipPresets = [];
    if (DATASET_ITEMS === null) throw new Error(`Items dataset was not loaded properly, failed to generate and serve presets.`);
    if (DATASET_SHIPS === null) throw new Error(`Ships dataset was not loaded properly, failed to generate and serve presets.`);
    if (DATASET_SYSTEMS === null) throw new Error(`Systems dataset was not loaded properly, failed to generate and serve presets.`);

    // For each ship raw out of the dataset, creates a full loadout with specific items and drones.
    for (const rawShip of DATASET_SHIPS.data.entries) {
        // skip custom classes
        if (rawShip.class === "custom") continue;
        // Build a default ship loadout
        let shipLoadout = {
            name: rawShip.name,
            class: rawShip.class,
            speed: rawShip.speed
        };
        // Equip a default armor, usually the best available
        // TODO : smarter handling of sirius and vega here, probably.
        shipLoadout.armor = rawShip.armors.at(-1);
        delete shipLoadout.armor.price;
        // Fetch the ship's estimated system and list of items
        let shipSystem = utils_getSystem(shipLoadout.armor.level, DATASET_SYSTEMS);
        if (shipSystem === undefined) continue;
        let shipclass = DATASET_SHIPS.data.classes.find(c => c.name === rawShip.class);
        if (shipclass === undefined) continue;
        shipLoadout.items = [];
        let expectedItemset = shipclass.items.slice(0, -rawShip.itempenalty);
        // Heuristically fetch the best item for each item slot of the ship's class
        for (let itemslot of expectedItemset) {
            let itemsCollection = DATASET_ITEMS.data[itemslot].entries;
            let selectedItem = null;
            for (let i = itemsCollection.length - 1; i >= 0; i--) {
                if (itemsCollection[i].name.includes("conquest")) continue;
                if (itemsCollection[i].level <= shipSystem.maxlevel) {
                    selectedItem = itemsCollection[i]
                    break;
                }
            }
            if (selectedItem) {
                selectedItem.type = itemslot;
                shipLoadout.items.push(selectedItem);
            }
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
    let status = utils_verifyInputs(ship, duration, enemiesCount, algo);
    if (status.code !== 0) throw new Error(status.message);

    if (!DATASET_ITEMS) throw new Error("Item dataset is not loaded.");
    if (!DATASET_SHIPS) throw new Error("Ships dataset is not loaded.");
    if (!DATASET_SYSTEMS) throw new Error("System dataset is not loaded.");

    let computedDamage = profileDamage(ship, duration, enemiesCount, algo)
    let computedTankyness = profileTankyness(ship)
    let computedMobility = profileMobility(ship)
    let computedValidity = profileValidity(ship)

    return { damage: computedDamage, tankyness: computedTankyness, mobility: computedMobility, validity: computedValidity }
}
