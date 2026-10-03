import { add } from './math.js';

const x = 5;
const y = 10;
const result = add(x, y);

console.log(`System initialized! Result: ${result}`);


///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
import { Observation, handleQuery } from './astronomy.js';

// Type T is a template parameter to be determined at compile time.
class DataStore<T> {
    private records: T[] = []; // A stack that will only hold type T in memory

    public insert(record: T): void {
        this.records.push(record);
    }

    public getAll(): T[] {
        return this.records;
    }
}

// Initialize the store that will hold the observation data (T = Observation)
const skyStore = new DataStore<Observation>();

skyStore.insert({
    id: 1,
    targetName: "Sun",
    rightAscension: 0,
    declination: 0,
    isComposite: true,
    equipment: "Skywatcher 200p"
});

// Let's test the union type
handleQuery({ status: "success", data: skyStore.getAll() });


///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
import { executeOfflineQuery } from './async.js';

async function bootstrapSystem() {
    console.log("1. Main thread: System initialized.");
    
    // Function block is not suspended since we don't use 'await' here. 
    // V8 engine immediately returns a Promise object in "Pending" state.
    const queryPromise = executeOfflineQuery(99);
    
    console.log("2. Main thread: Flow continues without blocking while query runs in the background.");
    
    // Suspend the rest of the function, waiting for the Promise to transition to "Fulfilled".
    const result = await queryPromise;
    
    console.log(`3. Main thread: Data processed -> ${result.targetName}`);
}

bootstrapSystem();


///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
import { PeerNode, syncWithPeer } from './p2p.js';

async function broadcastToNetwork() {
    const routingTable: PeerNode[] = [
        { address: "192.168.1.10:8333", latencyMs: 800, isOnline: true },
        { address: "192.168.1.11:8333", latencyMs: 1200, isOnline: false }, // Simulating a dead node
        { address: "192.168.1.12:8333", latencyMs: 400, isOnline: true }
    ];

    console.log("Main Thread: Broadcasting sync request to routing table.");

    // MAPPING TO C/C++: 
    // Instead of spawning 3 pthreads, we map the routing table to an array of unresolved Promises.
    // The main thread DOES NOT block. libuv opens 3 concurrent timers/sockets.
    const syncTasks = routingTable.map(peer => syncWithPeer(peer));

    // Promise.allSettled is the equivalent of thread joining (e.g., pthread_join).
    // It suspends this function context until all offloaded tasks either succeed or fail.
    const results = await Promise.allSettled(syncTasks);

    console.log("\nMain Thread: Network sync cycle completed. Processing results:");

    // Safe memory space: We are back on the single thread. No Mutex needed to parse results.
    for (const result of results) {
        if (result.status === "fulfilled") {
            console.log(` -> SUCCESS: ${result.value.address} [${result.value.syncedBytes} bytes]`);
        } else {
            console.log(` -> FAILED: Node unreachable. Reason: ${result.reason.message}`);
        }
    }
}

broadcastToNetwork();