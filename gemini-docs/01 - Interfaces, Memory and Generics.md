Altyapı stabil çalıştığına göre, C/C++'taki bellek düzeni (memory layout), `struct` yapıları ve `template` mimarisinin TypeScript motoru (V8) üzerindeki karşılıklarına iniyoruz. TypeScript, çalışma zamanında (runtime) belleğe doğrudan müdahale etmene izin vermese de, derleme zamanında (compile-time) kusursuz bir statik analiz ve tip güvenliği kalkanı sunar.

Sistem programlama geçmişinle en hızlı bağ kuracağın üç temel yapı taşı şunlardır:

### 1. Veri Şekillendirme: Interfaces (C'deki Struct Karşılığı)

C'de bellek bloklarını `struct` ile nasıl haritalıyorsan, TypeScript'te nesnelerin hafızada tutacağı özellikleri `interface` veya `type` ile tanımlarsın. Gökyüzü gözlemlerini tutacağımız bir veri yapısı inşa edelim.

`src/astronomy.ts` adında bir dosya oluşturup şu yapıyı kur:

```typescript
// Bir gök cismi gözleminin bellek şeması
export interface Observation {
    id: number;
    targetName: string;
    rightAscension: number; // x ekseni
    declination: number;    // y ekseni
    isComposite: boolean;
    // Soru işareti (?), bu alanın bellekte null/undefined olabileceğini (optional) belirtir.
    equipment?: string; 
}

// C'deki fonksiyon pointer'ları veya callback'ler gibi, bir fonksiyonun imzasını tanımlayabiliriz
export type ProcessDataFunc = (obs: Observation) => void;

```

### 2. Güvenli Bellek Yönetimi: Discriminated Unions (Etiketli Birleşimler)

C/C++'ta farklı veri tiplerini aynı bellek alanında tutmak için `union` kullanırız ancak bu, tip güvenliği açısından risklidir (type punning). TypeScript, veri analizi veya ağ mimarilerindeki (p2p) durum yönetimini (state machine) hatasız kurmak için etiketli birleşimleri kullanır.

Aynı dosyaya şu blokları ekle:

```typescript
// Ağ veya veritabanı işlemlerindeki olası durumlar
export type QueryState = 
    | { status: "loading" }
    | { status: "success", data: Observation[] }
    | { status: "error", code: number, message: string };

export function handleQuery(state: QueryState) {
    // TypeScript'in statik analizi burada 'status' alanını okuyarak 
    // bellekteki doğru objeye güvenle cast işlemi (daraltma) yapar.
    if (state.status === "success") {
        console.log(`Veri işleniyor. Gözlem sayısı: ${state.data.length}`);
        // state.code yazarsan derleyici hata verir, çünkü success durumunda code yoktur.
    } else if (state.status === "error") {
        console.error(`Sistem Hatası [${state.code}]: ${state.message}`);
    }
}

```

### 3. Mimari Soyutlama: Generics (C++ Templates)

Python'da DuckDB ile çevrimdışı veri araçları geliştirirken farklı veri tipleriyle çalışan jenerik sarmalayıcılar (wrappers) yazarsın. C++'taki `template <typename T>` mantığı, TypeScript'te `<T>` olarak geçer. Bu, algoritmayı veri tipinden bağımsız hale getirir.

`src/index.ts` dosyasına geçip bu yapıları birleştirelim:

```typescript
import { Observation, handleQuery } from './astronomy.js';

// T tipi, derleme zamanında belirlenecek bir şablon parametresidir.
class DataStore<T> {
    private records: T[] = []; // Bellekte sadece T tipini tutacak bir yığın

    public insert(record: T): void {
        this.records.push(record);
    }

    public getAll(): T[] {
        return this.records;
    }
}

// Gözlem verilerini tutacak store'u başlatıyoruz (T = Observation)
const skyStore = new DataStore<Observation>();

skyStore.insert({
    id: 1,
    targetName: "Sun",
    rightAscension: 0,
    declination: 0,
    isComposite: true,
    equipment: "Skywatcher 200p"
});

// Union tipi test edelim
handleQuery({ status: "success", data: skyStore.getAll() });

```

Bu kodları yapıştırıp **F5** ile debugger'ı tetiklediğinde, V8 motorunun arkaplanda hiçbir tip hatasına izin vermeden bellek haritasını nasıl yönettiğini göreceksin. Bu üç temel kolon, TS üzerinde inşa edeceğin karmaşık istemcilerin (offline-first araçların) iskeletini oluşturur. Statik tiplerin derleme zamanındaki davranışlarını mı incelemek istersin, yoksa asenkron (Event Loop, Promises) mimarinin kaputunun altına mı inelim?