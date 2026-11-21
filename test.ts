// ============================================================================
// TEST SUITE FOR MULTIPLAYER_CHECK EXTENSION (test.ts)
// ============================================================================

let statusBanner = "Waiting for players..."

// 1. Setup & Configuration Tests
Multiplayer_Check.setLobby(42)
Multiplayer_Check.setMax(3)

let myId = Multiplayer_Check.yourId()
console.log("Local Device ID: " + myId)
console.log("Initial Count (Expected 1): " + Multiplayer_Check.playerCount())
console.log("Initial P-Num (Expected 1): " + Multiplayer_Check.pNum())
console.log("Everyone Here? (Expected false): " + Multiplayer_Check.checkEveryoneHere())

// 2. Non-Blocking Event Handlers (NO game.splash)
Multiplayer_Check.onJoin(function () {
    statusBanner = "Joined! Count: " + Multiplayer_Check.playerCount()
    console.log("[EVENT] Join -> Count: " + Multiplayer_Check.playerCount() + " | My P#: P" + Multiplayer_Check.pNum())
})

Multiplayer_Check.onDisconnect(function () {
    scene.setBackgroundColor(0)
    statusBanner = "Left! Count: " + Multiplayer_Check.playerCount()
    console.log("[EVENT] Disconnect -> Count: " + Multiplayer_Check.playerCount() + " | My P#: P" + Multiplayer_Check.pNum())
})

Multiplayer_Check.on__PHere(3, 500, function () {
    scene.setBackgroundColor(7)
    statusBanner = "ALL 3 PLAYERS READY!"
    console.log("[EVENT] Everyone Here! Device Order: " + Multiplayer_Check.arrayOfAllDevices().join(", "))
})

// 3. On-Screen HUD
game.onPaint(function () {
    screen.print("My ID: " + Multiplayer_Check.yourId(), 4, 4, 1)
    screen.print("Role: P" + Multiplayer_Check.pNum() + " | Count: " + Multiplayer_Check.playerCount() + "/3", 4, 14, 5)
    screen.print("Ready: " + (Multiplayer_Check.checkEveryoneHere() ? "YES" : "NO"), 4, 24, Multiplayer_Check.checkEveryoneHere() ? 7 : 2)
    screen.print(statusBanner, 4, 34, 14)

    let devices = Multiplayer_Check.arrayOfAllDevices()
    screen.print("Sorted IDs & Mapping:", 4, 48, 1)
    for (let i = 0; i < devices.length; i++) {
        let devId = devices[i]
        let mappedP = Multiplayer_Check.pNumForId(devId)
        let label = (devId == myId) ? " (YOU)" : ""
        screen.print("P" + mappedP + ": " + devId + label, 8, 58 + (i * 10), 15)
    }

    screen.print("[A] Join  [B] Full  [Menu] Drop", 4, 108, 1)
})

// ============================================================================
// SIMULATED MULTI-DEVICE TRAFFIC (Single-Simulator Testing)
// ============================================================================
let fakeIdLower = 100001
let fakeIdHigher = 9999999
let fakeIdOverflow = 555555
let keepFakeAlive = false

controller.A.onEvent(ControllerButtonEvent.Pressed, function () {
    keepFakeAlive = true
    Multiplayer_Check._simulateReceive(fakeIdLower)
    Multiplayer_Check._simulateReceive(fakeIdHigher)
})

controller.B.onEvent(ControllerButtonEvent.Pressed, function () {
    let unknownP = Multiplayer_Check.pNumForId(123456)
    console.log("Unknown ID Lookup (Expected 0): " + unknownP)

    Multiplayer_Check._simulateReceive(fakeIdOverflow)
    console.log("Count after overflow attempt (Expected 3): " + Multiplayer_Check.playerCount())
    statusBanner = "Overflow test -> Count: " + Multiplayer_Check.playerCount()
})

controller.menu.onEvent(ControllerButtonEvent.Pressed, function () {
    keepFakeAlive = false
    statusBanner = "Stopped heartbeats (~1.5s drop)..."
    console.log("Stopped fake heartbeats. Waiting for disconnect timeout...")
})

game.onUpdateInterval(400, function () {
    if (keepFakeAlive) {
        Multiplayer_Check._simulateReceive(fakeIdLower)
        Multiplayer_Check._simulateReceive(fakeIdHigher)
    }
})
