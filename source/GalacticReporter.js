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
    if (duration === undefined) return { code: 1, message: "No duration parameter was given" };
    if (!Number.isInteger(duration)) return { code: 1, message: "Given duration parameter is not an integer number" };
    if (duration < 1) return { code: 1, message: "Given duration parameter needs to be at least one second" };
    if (duration > 36000) return { code: 1, message: "Given duration parameter can't go above 10 hours, or 36000 seconds" };
    // Verify enemy count correctness
    if (enemiesCount === undefined) return { code: 1, message: "No enemiesCount parameter was given" };
    if (!Number.isInteger(enemiesCount)) return { code: 1, message: "Given enemiesCount parameter is not an integer number" };
    if (enemiesCount < 1) return { code: 1, message: "Given enemiesCount parameter needs to be at least one" };
    if (enemiesCount > 36000) return { code: 1, message: "Given enemiesCount parameter can't go above 1000" };
}

function profileDamage(ship, duration, enemiesCount, algo) {

}

function profileTankyness(ship) {

}

function profileMobility(ship) {

}

function profileValidity(ship) {

}

/* ----- Export functions below ----- */

/**
 * 
 */
export function loadDataset() {

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

    // TODO : throw an error is some datasets are incomplete (Missing item data, spaceship data or systems data)
}
