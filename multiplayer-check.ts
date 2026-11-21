/**
 * Custom blocks for Multiplayer Sync with Unique ID & P# Mapping
 */
//% color="#2695b5" icon="\uf234"
//% groups=['Events', 'Status', 'Settings', 'Multiplayer Compactible']
namespace Multiplayer_Check {
    let everyoneHere = false
    let id = randint(100000, 999999) + control.millis()
    let idList: number[] = [id]
    let lastSeen: { [key: number]: number } = {}
    let maxPlayers = 3
    let currentPollInterval = 500
    let lastHeartbeat = 0

    let disconnectCallback: () => void = null
    let joinCallback: () => void = null
    let everyoneHereCallback: () => void = null

    radio.setGroup(1)
    lastSeen[id] = control.millis()

    function sortIds() {
        idList.sort((a, b) => a - b)
    }

    function handleIncomingId(receivedNumber: number) {
        // Ignore self-packets or unknown players when the room is at max capacity
        if (receivedNumber === id) return
        if (idList.indexOf(receivedNumber) === -1 && idList.length >= maxPlayers) {
            return
        }

        lastSeen[receivedNumber] = control.millis()

        // Check if this is a brand new player ID
        if (idList.indexOf(receivedNumber) === -1) {
            idList.push(receivedNumber)
            sortIds()

            // Fire the "on player join" block when count goes up
            if (joinCallback) {
                joinCallback()
            }
        }

        if (idList.length >= maxPlayers && !everyoneHere) {
            everyoneHere = true
            if (everyoneHereCallback) {
                everyoneHereCallback()
            }
        }
    }

    // ==========================================
    // BACKGROUND SYNC & HEARTBEAT
    // ==========================================

    radio.onReceivedNumber(function (receivedNumber: number) {
        handleIncomingId(receivedNumber)
    })

    game.onUpdate(function () {
        let currentTime = control.millis()
        if (currentTime - lastHeartbeat >= currentPollInterval) {
            lastHeartbeat = currentTime
            let timeout = currentPollInterval * 3

            for (let i = idList.length - 1; i >= 0; i--) {
                let checkId = idList[i]
                if (checkId !== id && (currentTime - lastSeen[checkId] > timeout)) {
                    idList.removeAt(i)
                    delete lastSeen[checkId]
                    sortIds()
                    everyoneHere = false

                    if (disconnectCallback) {
                        disconnectCallback()
                    }
                }
            }

            radio.sendNumber(id)
        }
    })

    // ==========================================
    // EVENTS SECTION
    // ==========================================

    /**
     * Checks for a specific number of players at a set interval and runs code once everyone has joined.
     * @param numP number of players to wait for
     * @param pollInterval time in milliseconds between checks
     */
    //% block="on $numP players join || check every $pollInterval ms"
    //% group="Events"
    //% weight=100
    //% numP.defl=2
    //% pollInterval.defl=500
    export function on__PHere(numP: number, pollInterval: number = 500, callback: () => void): void {
        maxPlayers = Math.max(2, numP)
        currentPollInterval = Math.max(50, pollInterval)
        everyoneHereCallback = callback

        if (idList.length >= maxPlayers && !everyoneHere) {
            everyoneHere = true
            control.runInParallel(callback)
        }
    }

    /**
     * Runs code whenever a new player joins the session (player count increases).
     */
    //% block="on player join"
    //% group="Events"
    //% weight=95
    export function onJoin(callback: () => void): void {
        joinCallback = callback
    }

    /**
     * Runs code when a player times out and disconnects from the group.
     */
    //% block="on player disconnect"
    //% group="Events"
    //% weight=90
    export function onDisconnect(callback: () => void): void {
        disconnectCallback = callback
    }

    // ==========================================
    // STATUS SECTION
    // ==========================================

    /**
     * Returns the current number of active players detected.
     */
    //% block="current player count"
    //% group="Status"
    //% weight=100
    export function playerCount(): number {
        return idList.length
    }

    /**
     * Returns true if the target number of players are currently connected.
     */
    //% block="everyone here"
    //% group="Status"
    //% weight=90
    export function checkEveryoneHere(): boolean {
        return everyoneHere
    }

    /**
     * Returns the unique ID generated for this specific device.
     */
    //% block="my ID"
    //% group="Status"
    //% weight=80
    export function yourId(): number {
        return id
    }

    /**
     * Returns an array containing the IDs of all currently connected devices.
     */
    //% block="array of all devices"
    //% group="Status"
    //% weight=70
    export function arrayOfAllDevices(): number[] {
        return idList.slice()
    }

    // ==========================================
    // SETTINGS SECTION
    // ==========================================

    /**
     * Sets the maximum number of players allowed in the session.
     */
    //% block="set max number of players $maxNum"
    //% group="Settings"
    //% weight=100
    //% maxNum.defl=4
    export function setMax(maxNum: number): void {
        maxPlayers = Math.max(2, maxNum)
        if (idList.length >= maxPlayers && !everyoneHere) {
            everyoneHere = true
            if (everyoneHereCallback) {
                control.runInParallel(everyoneHereCallback)
            }
        }
    }

    /**
     * Sets the radio channel/lobby group and resets the connected device list.
     */
    //% block="set lobby channel $group"
    //% group="Settings"
    //% weight=90
    //% group.min=0 group.max=255 group.defl=1
    export function setLobby(group: number): void {
        radio.setGroup(group)
        idList = [id]
        lastSeen = {}
        lastSeen[id] = control.millis()
        everyoneHere = false
    }

    // ==========================================
    // MORE SUBSECTION (MULTIPLAYER COMPACTIBLE)
    // ==========================================

    /**
     * Returns your assigned player number (1-4) based on sorted ID order.
     */
    //% block="my player number (P1-P4)"
    //% group="Multiplayer Compactible"
    //% subcategory="More"
    //% weight=100
    export function pNum(): number {
        return idList.indexOf(id) + 1
    }

    /**
     * Returns the player number (1-4) for any given device ID. Returns 0 if not found.
     */
    //% block="player number for ID $targetId"
    //% group="Multiplayer Compactible"
    //% subcategory="More"
    //% weight=90
    export function pNumForId(targetId: number): number {
        let index = idList.indexOf(targetId)
        return index === -1 ? 0 : index + 1
    }

    // ==========================================
    // INTERNAL DEBUG / TEST HELPER (HIDDEN FROM BLOCKS)
    // ==========================================

    export function _simulateReceive(fakeId: number): void {
        handleIncomingId(fakeId)
    }
}
