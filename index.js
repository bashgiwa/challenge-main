/* The maximum number of minutes in a period (a day) */

const MAX_IN_PERIOD = 1440;
const EVENT_STATES = {
  ON: 'on',
  OFF: 'off',
  AUTO_OFF: 'auto-off',
};

/**
 * PART 1
 *
 * You have an appliance that uses energy, and you want to calculate how
 * much energy it uses over a period of time.
 *
 * As an input to your calculations, you have a series of events that contain
 * a timestamp and the new state (on or off). You are also given the initial
 * state of the appliance. From this information, you will need to calculate
 * the energy use of the appliance i.e. the amount of time it is switched on.
 *
 * The amount of energy it uses is measured in 1-minute intervals over the
 * period of a day. Given there is 1440 minutes in a day (24 * 60), if the
 * appliance was switched on the entire time, its energy usage would be 1440.
 * To simplify calculations, timestamps range from 0 (beginning of the day)
 * to 1439 (last minute of the day).
 *
 * HINT: there is an additional complication with the last two tests that
 * introduce spurious state change events (duplicates at different time periods).
 * Focus on getting these tests working after satisfying the first tests.
 *
 * The structure for `profile` looks like this (as an example):
 * ```
 * {
 *    initial: 'on',
 *    events: [
 *      { state: 'off', timestamp: 50 },
 *      { state: 'on', timestamp: 304 },
 *      { state: 'off', timestamp: 600 },
 *    ]
 * }
 * ```
 */

/** Helper method to get number of available events for a given state
 * @param {events[]} events
 * @param {string} state
 * @returns Number, number of events matching given state
 */
const getNoOfEventsForState = (events, state) => {
  return events.filter((event) => event.state === state).length;
};

/** Helper method to get energy usage for a given period
 * @param {events[]} events for period
 * @param {number} lower bound of period
 * @param {number} upper bound of period
 * @returns Number, amount of energy used
 */
const calculateEnergyUsage = (profile, lowerBound, upperBound) => {
  const { initial, events } = profile;

  //Validations
  if (initial === EVENT_STATES.ON && (events.length === 0 || getNoOfEventsForState(events, EVENT_STATES.ON) === events.length))
    return MAX_IN_PERIOD;
  if (initial === EVENT_STATES.OFF && (events.length === 0 || getNoOfEventsForState(events, EVENT_STATES.OFF) === events.length))
    return 0;

  let totalEnergyUsage = 0;

  if (events.length === 1) {
    if (events[0].state === EVENT_STATES.ON) totalEnergyUsage += upperBound - events[0].timestamp;
  } else {
    for (let i = 0; i <= events.length - 1; i++) {
      let currentEvent = events[i];
      if (i === 0) {
        // handle lower boundary difference
        if (initial === EVENT_STATES.ON) totalEnergyUsage += currentEvent.timestamp - lowerBound;
      } else if (i === events.length - 1 && currentEvent.state === EVENT_STATES.ON) {
        // handle upper boundary difference
        totalEnergyUsage += upperBound - currentEvent.timestamp;
      } else {
        let previousEvent = events[i - 1];
        if (previousEvent.state === EVENT_STATES.ON) {
          totalEnergyUsage += currentEvent.timestamp - previousEvent.timestamp;
        }
      }
    }
  }

  return totalEnergyUsage;
};

/**
 * Returns energy usage for a day
 * @param {object} profile
 * @returns Number, amount of energy used
 */
const calculateEnergyUsageSimple = (profile) => {
  return calculateEnergyUsage(profile, 0, MAX_IN_PERIOD);
};

/**
 * PART 2
 *
 * You purchase an energy-saving device for your appliance in order
 * to cut back on its energy usage. The device is smart enough to shut
 * off the appliance after it detects some period of disuse, but you
 * can still switch on or off the appliance as needed.
 *
 * You are keen to find out if your shiny new device was a worthwhile
 * purchase. Its success is measured by calculating the amount of
 * energy *saved* by device.
 *
 * To assist you, you now have a new event type that indicates
 * when the appliance was switched off by the device (as opposed to switched
 * off manually). Your new states are:
 * * 'on'
 * * 'off' (manual switch off)
 * * 'auto-off' (device automatic switch off)
 *
 * (The `profile` structure is the same, except for the new possible
 * value for `initial` and `state`.)
 *
 * Write a function that calculates the *energy savings* due to the
 * periods of time when the device switched off your appliance. You
 * should not include energy saved due to manual switch offs.
 *
 * You will need to account for redundant/non-sensical events e.g.
 * an off event after an auto-off event, which should still count as
 * an energy savings because the original trigger was the device
 * and not manual intervention.
 */

/**
 * Returns energy saved for a given day
 * @param {object} profile
 * @returns int
 */
const calculateEnergySavings = (profile) => {
  const { initial, events } = profile;
  //Validations
  if (initial === EVENT_STATES.ON && (events.length === 0 || getNoOfEventsForState(events, EVENT_STATES.ON) === events.length))
    return 0;
  if (initial === EVENT_STATES.OFF && (events.length === 0 || getNoOfEventsForState(events, EVENT_STATES.OFF) === events.length))
    return 0;
  if (
    initial === EVENT_STATES.AUTO_OFF &&
    (events.length === 0 || getNoOfEventsForState(events, EVENT_STATES.AUTO_OFF) === events.length)
  )
    return MAX_IN_PERIOD;

  let totalEnergySavings = 0;
  let filteredMap = {};
  let filteredEvents = events.filter((event) => event.state === EVENT_STATES.ON || event.state === EVENT_STATES.AUTO_OFF);

  filteredEvents.forEach((event, index) => {
    filteredMap[index] = event;
  });

  const getPrevInFilteredMap = (index) => {
    let output = undefined;
    while (index > 0) {
      if (filteredMap[index] && filteredMap[index].state === EVENT_STATES.AUTO_OFF) {
        output = filteredMap[index];
        delete filteredMap[index];
        break;
      }
      index--;
    }
    return output;
  };

  for (let i = 0; i <= filteredEvents.length - 1; i++) {
    let currentEvent = filteredEvents[i];
    if (i === 0) {
      if (initial === EVENT_STATES.AUTO_OFF) totalEnergySavings += currentEvent.timestamp;
    } else if (i === filteredEvents.length - 1 && currentEvent.state === EVENT_STATES.AUTO_OFF) {
      totalEnergySavings += MAX_IN_PERIOD - currentEvent.timestamp;
    } else {
      if (currentEvent.state === EVENT_STATES.ON) {
        let previousEvent = getPrevInFilteredMap(i);
        if (previousEvent) {
          totalEnergySavings += currentEvent.timestamp - previousEvent.timestamp;
        }
      }
    }
  }
  return totalEnergySavings;
};

/**
 * PART 3
 *
 * The process of producing metrics usually requires handling multiple days of data. The
 * examples so far have produced a calculation assuming the day starts at '0' for a single day.
 *
 * In this exercise, the timestamp field contains the number of minutes since a
 * arbitrary point in time (the "Epoch"). To simplify calculations, assume:
 *  - the Epoch starts at the beginning of the month (i.e. midnight on day 1 is timestamp 0)
 *  - our calendar simply has uniform length 'days' - the first day is '1' and the last day is '365'
 *  - the usage profile data will not extend more than one month
 *
 * Your function should calculate the energy usage over a particular day, given that
 * day's number. It will have access to the usage profile over the month.
 *
 * It should also throw an error if the day value is invalid i.e. if it is out of range
 * or not an integer. Specific error messages are expected - see the tests for details.
 *
 * (The `profile` structure is the same as part 1, but remember that timestamps now extend
 * over multiple days)
 *
 * HINT: You are encouraged to re-use `calculateEnergyUsageSimple` from PART 1 by
 * constructing a usage profile for that day by slicing up and rewriting up the usage profile you have
 * been given for the month.
 */

const isInteger = (number) => Number.isInteger(number);

const showErrorMessage = (msg) => {
  throw new Error(msg);
};

const isInRange = (value) => {
  return value > 0 && value <= 365;
};

const getTimestampRangeForDay = (day) => {
  return [MAX_IN_PERIOD * (day - 1), MAX_IN_PERIOD * day];
};

/**
 * Returns daily energy usage
 * @param {object} monthUsageProfile
 * @param {number} day
 * @returns
 */
const calculateEnergyUsageForDay = (monthUsageProfile, day) => {
  let startState;
  let usageEventsForDay = [];

  const { initial, events } = monthUsageProfile;

  //Validations
  if (!isInteger(day)) showErrorMessage('must be an integer');
  if (!isInRange(day)) showErrorMessage('day out of range');

  const timestampRangeForDay = getTimestampRangeForDay(day);

  //Edge-cases, when requested day is out of range of data
  if (events.length > 0 && timestampRangeForDay[0] > events[events.length - 1].timestamp) {
    let lastEvent = events[events.length - 1];
    if (lastEvent.state === EVENT_STATES.ON) return MAX_IN_PERIOD;
  }

  //populate events array for given day
  for (let i = 0; i <= events.length - 1; i++) {
    let event = events[i];
    if (event.timestamp >= timestampRangeForDay[0] && event.timestamp <= timestampRangeForDay[1]) {
      if (usageEventsForDay.length === 0) {
        //first event found, store previous state here if available.
        if (events[i - 1]) startState = events[i - 1].state;
      }
      usageEventsForDay.push(event);
    }
  }

  let energyUsageInRange = calculateEnergyUsage(
    {
      initial: startState || initial,
      events: usageEventsForDay,
    },
    timestampRangeForDay[0],
    timestampRangeForDay[1]
  );

  return energyUsageInRange;
};

module.exports = {
  calculateEnergyUsageSimple,
  calculateEnergySavings,
  calculateEnergyUsageForDay,
  MAX_IN_PERIOD,
};
