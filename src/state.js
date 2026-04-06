// Shared State Management

export const INTERACTION_STATE = {
    totalClicks: 0,
    tearClicks: 0,
    requiredTotal: 4,
    requiredTear: 1
};

export const GREEN = "#6cc56c";

// Color State
export const state = {
    backgroundColor: GREEN,
    faceColors: ["red", "blue", "yellow"],
    colorState: ["red", "blue", "yellow"], // order only
    lockedConfiguratorColor: null
};

// Events
const listeners = [];

export function subscribe(callback) {
    listeners.push(callback);
}

export function notifyStateChange() {
    listeners.forEach(cb => cb());
}

export function incrementInteraction({ tear = false } = {}) {
    // Check if already unlocked to avoid unnecessary updates
    if (isConfiguratorUnlocked()) return;

    INTERACTION_STATE.totalClicks++;
    if (tear) INTERACTION_STATE.tearClicks++;

    notifyStateChange();
}

export function isConfiguratorUnlocked() {
    return INTERACTION_STATE.totalClicks >= INTERACTION_STATE.requiredTotal &&
        INTERACTION_STATE.tearClicks >= INTERACTION_STATE.requiredTear;
}

export function getRemainingClicksInfo() {
    const s = INTERACTION_STATE;
    const remainingTotal = Math.max(0, s.requiredTotal - s.totalClicks);
    const remainingTear = Math.max(0, s.requiredTear - s.tearClicks);

    if (remainingTear > 0) {
        return `Touch the tears (${remainingTear})`;
    }

    return `${remainingTotal} more interaction${remainingTotal === 1 ? "" : "s"}`;
}
