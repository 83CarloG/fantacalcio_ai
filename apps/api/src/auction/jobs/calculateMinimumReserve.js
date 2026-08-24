"use strict";
module.exports = async function calculateMinimumReserve({remainingSlots = 0, minimumPlayerPrice = 1}) {
    return Math.max(0, Number(remainingSlots)) * Math.max(1, Number(minimumPlayerPrice));
};
