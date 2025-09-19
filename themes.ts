
interface Theme {
    '--color-background': string;
    '--color-background-light': string;
    '--color-foreground': string;
    '--color-primary': string;
    '--color-secondary': string;
    '--color-accent': string;
    '--font-heading': string;
    '--font-body': string;
}

export const themes: Record<string, Theme> = {
    default: {
        '--color-background': '#0a0f1f', // Deep space blue
        '--color-background-light': '#1e293b', // Slate gray-blue
        '--color-foreground': '#e2e8f0', // Light slate
        '--color-primary': '#475569', // Medium slate
        '--color-secondary': '#94a3b8', // Grayish slate
        '--color-accent': '#f59e0b', // Amber/Gold
        '--font-heading': "'Cinzel', serif",
        '--font-body': "'Inter', sans-serif",
    },
    'Ancient Rome': {
        '--color-background': '#2d0d0d', // Deep maroon
        '--color-background-light': '#4a1e1e', // Dark red-brown
        '--color-foreground': '#f3e5d8', // Marble white
        '--color-primary': '#8c785d', // Aged bronze
        '--color-secondary': '#c7b299', // Lighter bronze/tan
        '--color-accent': '#ffc400', // Imperial gold
        '--font-heading': "'Cinzel', serif",
        '--font-body': "'EB Garamond', serif",
    },
    'Ancient Egypt': {
        '--color-background': '#1a140c', // Dark tomb wall
        '--color-background-light': '#3c2f1e', // Sandy brown
        '--color-foreground': '#f0e6d5', // Papyrus white
        '--color-primary': '#527d8b', // Nile blue-gray
        '--color-secondary': '#a3987c', // Faded sand
        '--color-accent': '#00a1b5', // Lapis lazuli blue/turquoise
        '--font-heading': "'Cairo', sans-serif",
        '--font-body': "'Cairo', sans-serif",
    },
    'The Aztec Empire': {
        '--color-background': '#1e2a2a', // Deep jungle green
        '--color-background-light': '#2a3b3b', // Dark teal
        '--color-foreground': '#e0f0f0', // Light stone
        '--color-primary': '#5c5c4a', // Obsidian gray
        '--color-secondary': '#a0a08c', // Lighter stone gray
        '--color-accent': '#2dd4bf', // Vibrant turquoise/jade
        '--font-heading': "'Orbitron', sans-serif",
        '--font-body': "'Inter', sans-serif",
    },
    'The Mongol Empire': {
        '--color-background': '#3d2b1f', // Dark leather
        '--color-background-light': '#5a4535', // Lighter brown
        '--color-foreground': '#e6dace', // Yurt canvas
        '--color-primary': '#7f9ab5', // Steppe sky blue
        '--color-secondary': '#b0a18f', // Dusty beige
        '--color-accent': '#cda434', // Tarnished gold
        '--font-heading': "'Cinzel', serif",
        '--font-body': "'Inter', sans-serif",
    },
    'Feudal Japan': {
        '--color-background': '#1c1c1e', // Sumi ink black
        '--color-background-light': '#333336', // Dark gray
        '--color-foreground': '#ede7e1', // Washi paper cream
        '--color-primary': '#4a4f6b', // Indigo blue
        '--color-secondary': '#9a9ca8', // Muted gray-blue
        '--color-accent': '#d87093', // Cherry blossom pink
        '--font-heading': "'Noto Serif JP', serif",
        '--font-body': "'Noto Serif JP', serif",
    },
    'The Viking Age': {
        '--color-background': '#1a222c', // Stormy sea blue
        '--color-background-light': '#2c3947', // Dark slate blue
        '--color-foreground': '#d8dde2', // Icy white
        '--color-primary': '#607d8b', // Steel gray
        '--color-secondary': '#9eabb3', // Lighter gray
        '--color-accent': '#ac4242', // Blood red
        '--font-heading': "'Orbitron', sans-serif",
        '--font-body': "'Inter', sans-serif",
    },
};
