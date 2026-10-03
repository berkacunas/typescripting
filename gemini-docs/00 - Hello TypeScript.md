Profesyonellerin (ve özellikle performans/sistem odaklı çalışanların) modern TypeScript projelerini kurarken `ts-node` gibi eski ve ESM/CommonJS çatışması yaratan köprüler yerine Go tabanlı (esbuild) çok daha hızlı ve pürüzsüz çalışan `tsx` aracını tercih ettiğini bilmelisin. Bu araç, TypeScript'i doğrudan yerel ESM (ECMAScript Module) olarak yürütür ve "debug sembollerini" (source maps) VSCode'a kusursuz aktarır.

Hiçbir gürültü olmadan, saf bir mimariyle adım adım inşa ediyoruz:

### Adım 1: Temel İskelet ve Bağımlılıklar (Sistem Kurulumu)

Terminali aç, temiz bir klasör yarat ve içine gir. Node.js'in paket yöneticisi ile projeyi başlatıp gerekli derleyici ve tip tanımlarını (header dosyaları gibi düşünebilirsin) kuracağız.

```bash
mkdir ts-pro-setup
cd ts-pro-setup
npm init -y
npm i -D typescript @types/node tsx

```

*Not: `tsx` bizim on-the-fly (çalışma zamanlı) derleyicimiz olacak.*

### Adım 2: Ortam Değişkenleri (package.json)

Oluşan `package.json` dosyasını aç ve projenin modern bir modül sistemi kullandığını Node.js'e belirtmek için ana bloğa şu satırı ekle:

```json
"type": "module",

```

### Adım 3: Derleyici Kuralları (tsconfig.json)

TypeScript'in statik analiz kurallarını ve derleme hedefini belirlemeliyiz. Proje kök dizininde `tsconfig.json` adında bir dosya oluştur ve içine şu konfigürasyonu yapıştır:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "rootDir": "./src",
    "outDir": "./dist",
    "sourceMap": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"]
}

```

*Sistem Notu:* Buradaki en kritik ayar `"sourceMap": true`'dur. Bu, C/C++'taki `.pdb` veya DWARF debug sembolleri gibidir. Derlenmiş kod çalışırken, debugger'ın senin orijinal TS kodundaki satırları (pointer'ları) doğru eşleştirmesini sağlar.

### Adım 4: Kaynak Kodların İnşası (src dizini)

Proje kök dizininde bir `src` klasörü oluştur. Hata izolasyonu sağlamak için mantığı bölüyoruz.

**1. `src/math.ts**`

```typescript
export function add(a: number, b: number): number {
    return a + b;
}

```

**2. `src/index.ts**`

```typescript
// Modern ESM'de TypeScript yazarken, dosya .ts olsa bile 
// import ederken .js uzantısı belirtilir. Bu modern Node.js standartıdır.
import { add } from './math.js';

const x = 5;
const y = 10;
const result = add(x, y);

console.log(`Sistem başlatıldı. Sonuç: ${result}`);

```

### Adım 5: VSCode Debugger Entegrasyonu (launch.json)

Şimdi VSCode'un bu sistemi bellek sızıntısı veya derleme hatası olmadan doğrudan okuyabilmesi için hata ayıklayıcıyı yapılandıracağız. Proje kökünde `.vscode` klasörü oluştur, içine `launch.json` dosyası aç ve şunu yapıştır:

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Debug TS (Modern)",
            "type": "node",
            "request": "launch",
            "runtimeExecutable": "npx",
            "runtimeArgs": ["tsx"],
            "args": ["${workspaceFolder}/src/index.ts"],
            "cwd": "${workspaceFolder}",
            "console": "integratedTerminal",
            "skipFiles": ["<node_internals>/**"]
        }
    ]
}

```

*Mimari Not:* Burada `ts-node` yerine `npx tsx` komutunu verdik. Bu sayede hiçbir ek derleme adımına veya CJS/ESM çatışmasına girmeden dosya belleğe alınacak.

### Son Aşama: Akışı Test Etmek

1. `src/index.ts` dosyasını aç.
2. `const result = add(x, y);` satırına ve altındaki `console.log` satırına tıklayarak kırmızı breakpoint noktalarını koy.
3. Soldaki "Run and Debug" sekmesine geç (Ctrl+Shift+D).
4. Üstten **"Debug TS (Modern)"** profilini seç ve **F5**'e bas.

Program sorunsuz bir şekilde `const result = ...` satırında çalışmayı durduracak. Artık **F5** ile bir sonraki breakpoint'e atlayabilir, **F11** (Step Into) ile doğrudan bellek yığınının içindeki `math.ts` dosyasındaki `add` fonksiyonunun içine dallanabilirsin.

Sistem temiz, bağımlılıklar izole, hata ayıklama köprüsü (debugger bridge) aktif. Bu yapıda "step-by-step" ilerlemeyi onayla, ardından kaputun altındaki diğer TypeScript yapılarına inebiliriz.