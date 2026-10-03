Node.js ve TypeScript'in asenkron modeli, C/C++'taki pthreads veya std::thread gibi manuel çoklu iş parçacığı (multi-threading) mimarisinin aksine, tek bir ana iş parçacığı (single-thread) ve `libuv` kütüphanesinin yönettiği bir "Event Loop" (olay döngüsü) üzerinden çalışır.

Bu mimari üç ana bileşenden oluşur:

* **I/O Offloading (libuv):** Ağ istekleri, dosya sistemi veya DuckDB gibi çevrimdışı veritabanı okumaları V8 motoru tarafından doğrudan işletim sistemine veya C ile yazılmış `libuv` iş parçacığı havuzuna devredilir. Ana iş parçacığı döngüsü asla bloke olmaz.
* **Promise (Durum Makinesi):** I/O işlemi devredildiğinde, bellekte sana anında boş bir `Promise` nesnesi döndürülür. Bu, sonucu gelecekte belli olacak bir durum makinesidir (statik olarak `Pending`, `Fulfilled` veya `Rejected` durumlarını alır).
* **Async / Await (Coroutine):** C++20 coroutine'lerine tamamen eşdeğerdir. `await` kelimesi, Event Loop'u kitlemeden sadece bulunduğu fonksiyon bağlamının yürütülmesini askıya alır. İşlem tamamlandığında `libuv`, sonucu `Microtask Queue` (öncelikli kuyruk) üzerinden ana iş parçacığına geri iletir.

Sistemin bellek yığınında (call stack) nasıl sıçramalar yaptığını görmek için `src/async.ts` adında bir dosya oluştur ve şu yapıyı kur:

```typescript
import { Observation } from './astronomy.js';

// The asynchronous (non-blocking) version of the thread-blocking sleep() function in C.
// The timer operation is offloaded to the operating system, freeing up the main thread.
export function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// The async keyword guarantees that the function always returns a Promise in the background.
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

```

Şimdi `src/index.ts` dosyasını bu yapıyı test edecek şekilde güncelle:

```typescript
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

```

`src/index.ts` dosyasına odaklan ve **F5** ile çalıştır. Kodun `await queryPromise` satırına kadar senkron bir şekilde aktığını, ardından ana thread'in Event Loop'a dönüp 2 saniye sonra `delay` çözüldüğünde kaldığı yerden belleğe nasıl geri döndüğünü (callback) debugger üzerinden net olarak göreceksin.

Breakpoint'leri `executeOfflineQuery` içindeki `await delay(2000);` satırına ve hemen altına koyduğunda V8 motorunun call stack (çağrı yığını) izolasyonunu doğrudan inceleyebilirsin. Event Loop'un bu askıya alma (yield) mantığı üzerine kendi geçmişinde geliştirdiğin p2p ağ mimarilerinden bir veri sekronizasyon senaryosu modelleyelim mi?