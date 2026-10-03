import { Observation } from './astronomy.js';

// Non-blocking version of a thread-blocking sleep() function.
// Timer operation is offloaded to the OS, main thread is freed.
export function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function executeOfflineQuery(queryId: number): Promise<Observation> {
    console.log(`[Pointer: ${queryId}] Database read initiated. (Offloaded to I/O)`);
    
    // Suspend function context, free the Event Loop while libuv handles the timer.
    await delay(2000); 
    
    console.log(`[Pointer: ${queryId}] I/O completed. Returning to main thread via Microtask Queue.`);
    
    return {
        id: queryId,
        targetName: "Orion Nebula",
        rightAscension: 5.58,
        declination: -5.38,
        isComposite: true,
        equipment: "Skywatcher 200p"
    };
}