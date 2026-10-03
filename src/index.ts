import { add } from './math.js';

const x = 5;
const y = 10;
const result = add(x, y);

console.log(`System initialized! Result: ${result}`);

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
