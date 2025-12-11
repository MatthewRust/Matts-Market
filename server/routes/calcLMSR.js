
//this is the LMSR calculatoin for the cost
const b = 185;  //tracks the liquidity rate basically how many shares you sell before a re calc. think of it as the size of the step
//this liquidity rate controls how extreme the prices swing. with the lower the rate the more extreme and so more likely the price will swing to 1 or 0 
//dont touch the b tho bad number things happen and 185 is tuned to be right for the quantity of shares probably being traded. 
//Guessing 400 shares buy on the high end and 100 on the low end. Chances are it will go higher
function costFunction(qYes, qNo) { //this is where alot of the magic happens
    return b * Math.log(Math.exp(qYes / b) + Math.exp(qNo / b));
}

//calcs the marginal share price for ues
function priceYes(qYes, qNo) {
    const eYes = Math.exp(qYes / b);
    const eNo = Math.exp(qNo / b);
    return eYes / (eYes + eNo);
}

//gets the marginal share price for no
function priceNo(qYes, qNo) {
    return 1 - priceYes(qYes, qNo);
}

//trades yes if delta >0 for buy <0 for sell
function tradeYes(currentYes, currentNo, deltaYes) {
    const oldCost = costFunction(currentYes, currentNo);
    const newCost = costFunction(currentYes + deltaYes, currentNo);
    const cost = newCost - oldCost;

    return {
        cost,
        newYesShares: currentYes + deltaYes,
        newNoShares: currentNo,
        newPriceYes: parseFloat(priceYes(currentYes + deltaYes, currentNo).toFixed(4)),
        newPriceNo: parseFloat(priceNo(currentYes + deltaYes, currentNo).toFixed(4))
    };
}

//same as the tradeyes
function tradeNo(currentYes, currentNo, deltaNo) {
    const oldCost = costFunction(currentYes, currentNo);
    const newCost = costFunction(currentYes, currentNo + deltaNo);
    const cost = newCost - oldCost;

    return {
        cost,
        newYesShares: currentYes,
        newNoShares: currentNo + deltaNo,
        newPriceYes: parseFloat(priceYes(currentYes, currentNo + deltaNo).toFixed(4)),
        newPriceNo: parseFloat(priceNo(currentYes, currentNo + deltaNo).toFixed(4))
    };
}

//main function just calls the already defined trading functions nothing super specail
export function calculateLMSRTrade(yesNo, currentYes, currentNo, quantity) {
    const quantityInt = parseInt(quantity);
    
    if (yesNo === 'YES') {
        return tradeYes(currentYes, currentNo, quantityInt);
    } else if (yesNo === 'NO') {
        return tradeNo(currentYes, currentNo, quantityInt);
    } else {
        throw new Error('Invalid yesNo parameter: must be "YES" or "NO"');
    }
}

export { costFunction, priceYes, priceNo, tradeYes, tradeNo }; //returns the data we need to calc things.
