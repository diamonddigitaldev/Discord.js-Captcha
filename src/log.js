const DISCORD_URL = "https://diamonddigital.dev/discord";

function logError(message) {
    throw new Error(`Discord.js Captcha Error: ${message}\nNeed Help? Join our Discord Server at '${DISCORD_URL}'`);
}

function logWarning(message, error) {
    if (error) {
        console.warn(`Discord.js Captcha Warning: ${message}`, error);
    } else {
        console.warn(`Discord.js Captcha Warning: ${message}\nNeed Help? Join our Discord Server at '${DISCORD_URL}'`);
    }
}

module.exports = { logError, logWarning };
