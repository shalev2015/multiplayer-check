// ============================================================================
// TEST SUITE FOR MULTIPLAYER_CHECK EXTENSION
// ============================================================================

// 1. Setup & Configuration Tests
Multiplayer_Check.setLobby(42)
Multiplayer_Check.setMax(3)

// Verify initial state (only local device should be present)
let myId = Multiplayer_Check.yourId()
console.log("Local Device ID: " + myId)
console.log("Initial Count (Expected 1): " + Multiplayer_Check.playerCount())
console.log("Initial P-Num (Expected 1): " + Multiplayer_Check.pNum())
console.log("Everyone Here? (Expected false): " + Multiplayer_Check.checkEveryoneHere())

// 2. Register Event Handlers
Multiplayer_Check.onJoin(function () {
    game.splash("Player Joined! Total: " + Multiplayer_Check.playerCount())
    console.log("[EVENT] Join -> Count: " + Multiplayer_Check.playerCount() + " | My P#: P" + Multiplayer_Check.pNum())
})

Multiplayer_Check.onDisconnect(function () {
    game.splash("Player Left! Total: " + Multiplayer_Check.playerCount())
    console.log("[EVENT] Disconnect -> Count: " + Multiplayer_Check.playerCount() + " | My P#: P" + Multiplayer_Check.pNum())
})

Multiplayer_Check.on__PHere(3, 500, function () {
    scene.setBackgroundColor(7) // Turns screen green when all 3 players connect
    game.splash("ALL 3 PLAYERS READY!")
    console.log("[EVENT] Everyone Here! Device Order: " + Multiplayer_Check.arrayOfAllDevices().join(", "))
})

// 3. On-Screen HUD to Monitor Real-Time Sync & P-Mapping
game.onPaint(function () {
    screen.print("My ID: " + Multiplayer_Check.yourId(), 4, 4, 1)
    screen.print("Assigned Role: P" + Multiplayer_Check.pNum(), 4, 14, 5)
    screen.print("Connected: " + Multiplayer_Check.playerCount() + " / 3", 4, 24, 1)
    screen.print("Ready: " + (Multiplayer_Check.checkEveryoneHere() ? "YES" : "NO"), 4, 34, Multiplayer_Check.checkEveryoneHere() ? 7 : 2)

    let devices = Multiplayer_Check.arrayOfAllDevices()
    screen.print("Sorted IDs & Mapping:", 4, 50, 1)
    for (let i = 0; i < devices.length; i++) {
        let devId = devices[i]
        let mappedP = Multiplayer_Check.pNumForId(devId)
        let label = (devId == myId) ? " (YOU)" : ""
        screen.print("P" + mappedP + ": " + devId + label, 8, 62 + (i * 10), 15)
    }

    screen.print("[A] Sim Join  [B] Sim Full/Overflow", 4, 108, 1)
})

// ============================================================================
// SIMULATED MULTI-DEVICE TRAFFIC (For Single-Simulator Testing)
// ============================================================================

let fakeIdLower = 100001   // Lower than any valid random ID (forces local device to shift to P2)
let fakeIdHigher = 999998  // Higher than any valid random ID (becomes P3)
let fakeIdOverflow = 555555 // Should be ignored once maxPlayers (3) is reached
let keepFakeAlive = false

// Press A to simulate 2 remote players joining
controller.A.onEvent(ControllerButtonEvent.Pressed, function () {
    keepFakeAlive = true
    radio.sendNumber(fakeIdLower)
    pause(100)
    radio.sendNumber(fakeIdHigher)
})

// Press B to test room capacity limit + unknown ID lookup
controller.B.onEvent(ControllerButtonEvent.Pressed, function () {
    // 1. Test unknown ID lookup (Expected: 0)
    let unknownP = Multiplayer_Check.pNumForId(123456)
    console.log("Unknown ID Lookup (Expected 0): " + unknownP)

    // 2. Send a 4th player when max is 3 (Should be ignored)
    radio.sendNumber(fakeIdOverflow)
    pause(100)
    console.log("Count after overflow attempt (Expected 3): " + Multiplayer_Check.playerCount())
})

// Press Menu to stop fake heartbeats and test timeout disconnect (~1.5 seconds)
controller.menu.onEvent(ControllerButtonEvent.Pressed, function () {
    keepFakeAlive = false
    console.log("Stopped fake heartbeats. Waiting for disconnect timeout...")
})

// Keep simulated devices alive via heartbeat loop
game.onUpdateInterval(400, function () {
    if (keepFakeAlive) {
        radio.sendNumber(fakeIdLower)
        radio.sendNumber(fakeIdHigher)
    }
})
