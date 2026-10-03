import { delay } from './async.js';

export interface PeerNode {
    address: string;
    latencyMs: number;
    isOnline: boolean;
}

export type SyncResult = 
    | { status: "success", address: string, syncedBytes: number }
    | { status: "failed", address: string, reason: string };

// Simulating a non-blocking network handshake and data transfer to a single peer
export async function syncWithPeer(peer: PeerNode): Promise<SyncResult> {
    console.log(`[Network] Initiating connection to ${peer.address}...`);
    
    // Offload network I/O simulation to libuv (like epoll waiting for socket readiness)
    await delay(peer.latencyMs);

    if (!peer.isOnline) {
        throw new Error(`Connection timeout or peer offline.`);
    }

    const bytes = Math.floor(Math.random() * 1024) + 512;
    console.log(`[Network] Handshake successful. Transferred ${bytes} bytes from ${peer.address}.`);
    
    return { status: "success", address: peer.address, syncedBytes: bytes };
}
