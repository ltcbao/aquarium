// Tank Equipment Upgrades
const EQUIPMENT_UPGRADES = {
    filter: {
        name: 'Bio-Filtration System',
        icon: 'ph-funnel',
        levels: [
            { name: 'Basic Sponge Filter', cost: 0, reduction: 0.15 },
            { name: 'Hang-On-Back Bio Filter', cost: 80, reduction: 0.40 },
            { name: 'External Canister Pro', cost: 220, reduction: 0.70 },
            { name: 'UV Reef Sterilizer Sump', cost: 500, reduction: 0.92 }
        ]
    },
    autofeeder: {
        name: 'Smart Auto-Feeder',
        icon: 'ph-timer',
        levels: [
            { name: 'Manual Feeding Only', cost: 0, interval: 0 },
            { name: 'Standard Timer Feeder', cost: 110, interval: 22 },
            { name: 'Precision AI Dispenser', cost: 280, interval: 12 }
        ]
    },
    tankSize: {
        name: 'Aquarium Capacity',
        icon: 'ph-cube',
        levels: [
            { name: 'Nano Cube (Max 10 Fish)', cost: 0, maxPop: 10 },
            { name: 'Aquascape 90P (Max 16 Fish)', cost: 120, maxPop: 16 },
            { name: 'Grand Gallery 180G (Max 24 Fish)', cost: 320, maxPop: 24 },
            { name: 'Public Oceanarium (Max 35 Fish)', cost: 700, maxPop: 35 }
        ]
    }
};
