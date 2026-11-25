// ============================================================================
// TEST SUITE FOR MULTIPLAYER_CHECK EXTENSION (test.ts)
// ============================================================================

let statusBanner = "Waiting for players..."
let lastMsgBanner = "Msg: None yet"

// 1. Setup & Configuration Tests
Multiplayer_Check.setLobby(42)
Multiplayer_Check.setMax(3)

let initialId = Multiplayer_Check.yourId()
console.log("Local Device ID: " + initialId)
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

// 3. New Messaging Event Handlers
Multiplayer_Check.onReceivedPlayerValue(function (playerNum, name, value) {
    lastMsgBanner = "P" + playerNum + " " + name + "=" + value
    console.log("[MSG-PLAYER] From P" + playerNum + " | " + name + " = " + value)
})

Multiplayer_Check.onReceivedGameValue(function (name, value) {
    lastMsgBanner = "Game " + name + "=" + value
    console.log("[MSG-GAME] " + name + " = " + value)
})

// 4. On-Screen HUD
game.onPaint(function () {
    let currentId = Multiplayer_Check.yourId()
    screen.print("My ID: " + currentId, 4, 4, 1)
    screen.print("Role: P" + Multiplayer_Check.pNum() + " | Count: " + Multiplayer_Check.playerCount() + "/3", 4, 14, 5)
    screen.print("Ready: " + (Multiplayer_Check.checkEveryoneHere() ? "YES" : "NO"), 4, 24, Multiplayer_Check.checkEveryoneHere() ? 7 : 2)
    screen.print(statusBanner, 4, 34, 14)
    screen.print(lastMsgBanner, 4, 44, 9)

    let devices = Multiplayer_Check.arrayOfAllDevices()
    screen.print("Sorted IDs & Mapping:", 4, 56, 1)
    for (let i = 0; i < devices.length; i++) {
        let devId = devices[i]
        let mappedP = Multiplayer_Check.pNumForId(devId)
        let label = (devId == currentId) ? " (YOU)" : ""
        screen.print("P" + mappedP + ": " + devId + label, 8, 66 + (i * 9), 15)
    }

    screen.print("[A]Join [B]Full [Up]Msg [Dn]Clash", 2, 102, 1)
    screen.print("[Menu] Drop Peers", 2, 111, 1)
})

// ============================================================================
// SIMULATED MULTI-DEVICE TRAFFIC (Single-Simulator Testing)
// ============================================================================
let fakeIdLower = 100001
let fakeIdHigher = 9999999
let fakeIdOverflow = 555555
let keepFakeAlive = false
let testScore = 10

// [A] Simulate 2 peers joining & staying alive
controller.A.onEvent(ControllerButtonEvent.Pressed, function () {
    keepFakeAlive = true
    Multiplayer_Check._simulateReceive(fakeIdLower)
    Multiplayer_Check._simulateReceive(fakeIdHigher)
})

// [B] Test unknown ID lookup & max-player overflow rejection
controller.B.onEvent(ControllerButtonEvent.Pressed, function () {
    let unknownP = Multiplayer_Check.pNumForId(123456)
    console.log("Unknown ID Lookup (Expected 0): " + unknownP)

    Multiplayer_Check._simulateReceive(fakeIdOverflow)
    console.log("Count after overflow attempt (Expected 3): " + Multiplayer_Check.playerCount())
    statusBanner = "Overflow test -> Count: " + Multiplayer_Check.playerCount()
})

// [Up] Test sending both player-tagged and untagged game values
controller.up.onEvent(ControllerButtonEvent.Pressed, function () {
    testScore += 5
    Multiplayer_Check.sendPlayerValue("score", testScore)
    Multiplayer_Check.sendGameValue("round", 2)
    lastMsgBanner = "Sent P" + Multiplayer_Check.pNum() + " score=" + testScore
    console.log("[SENT] Player score=" + testScore + " & Game round=2")
})

// [Down] Test ID collision reroll (simulates another device broadcasting our ID)
controller.down.onEvent(ControllerButtonEvent.Pressed, function () {
    let beforeId = Multiplayer_Check.yourId()
    Multiplayer_Check._simulateReceive(beforeId)
    let afterId = Multiplayer_Check.yourId()
    console.log("[COLLISION TEST] Old ID: " + beforeId + " -> New ID: " + afterId)
    statusBanner = "Rerolled ID! Changed: " + (beforeId != afterId)
})

// [Menu] Stop simulated heartbeats to test timeout disconnect
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
