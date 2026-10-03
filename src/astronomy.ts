// Memory schema for a celestial body observation
export interface Observation {
    id: number;
    targetName: string;
    rightAscension: number; // x axe
    declination: number;    // y axe
    isComposite: boolean;
    // The question mark (?) indicates that this field can be null/undefined in memory (optional).
    equipment?: string; 
}

// Like function pointers or callbacks in C, we can define a function signature.
export type ProcessDataFunc = (obs: Observation) => void;

// Possible scenarios in network or database operations
export type QueryState = 
    | { status: "loading" }
    | { status: "success", data: Observation[] }
    | { status: "error", code: number, message: string };

export function handleQuery(state: QueryState) {
    // Here, TypeScript's static analysis reads the 'status' field
    // and safely performs a cast to the correct object in memory.
    if (state.status === "success") {
        console.log(`Data is being processed. Number of observations: ${state.data.length}`);
        // If you write state.code, the compiler will throw an error because code does not exist in the success state.
    } else if (state.status === "error") {
        console.error(`System Error [${state.code}]: ${state.message}`);
    }
}