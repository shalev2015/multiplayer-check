> Open this page at [https://shalev2015.github.io/multiplayer-check/](https://shalev2015.github.io/multiplayer-check/)

# Multiplayer Check

A MakeCode Arcade extension for syncing radio multiplayer lobbies, detecting player joins and disconnects, assigning consistent player numbers (`P1`–`P4`) across devices, and sending player-tagged radio messages.

## Use as Extension

This repository can be added as an **extension** in MakeCode:

1. Open [MakeCode Arcade](https://makecode.com)
2. Click **New Project**
3. Click **Extensions** under the gearwheel menu
4. Search for `https://github.com/shalev2015/multiplayer-check` and import

## Edit this Project

To edit this repository in MakeCode:

1. Open [MakeCode Arcade](https://makecode.com)
2. Click **Import**, then **Import URL**
3. Paste `https://github.com/shalev2015/multiplayer-check` and click **Import**

---

## Quick Start Example

Set your radio channel, wait for players to join, assign each device its player number, and send player-tagged game values:

```blocks
Multiplayer_Check.setLobby(1)
Multiplayer_Check.setMax(2)

Multiplayer_Check.onJoin(function () {
    game.splash("Player joined! Total: " + Multiplayer_Check.playerCount())
})

Multiplayer_Check.on__PHere(2, 500, function () {
    game.splash("Lobby full! I am Player " + Multiplayer_Check.pNum())
    Multiplayer_Check.sendPlayerValue("score", 10)
})

Multiplayer_Check.onReceivedPlayerValue(function (playerNum, name, value) {
    game.splash("P" + playerNum + " sent " + name + ": " + value)
})

Multiplayer_Check.onDisconnect(function () {
    game.splash("A player disconnected!")
})
```

---

## Block Reference

### Events

* **`on $numP players join || check every $pollInterval ms`**  
  Sets the target player count and heartbeat interval (in milliseconds), then runs code once that number of players has connected.
* **`on player join`**  
  Runs code whenever a new player connects to the session.
* **`on player disconnect`**  
  Runs code when a connected player stops sending heartbeats and times out (`3 × interval`).

### Status

* **`current player count`**  
  Returns the number of active players currently connected (including your device).
* **`everyone here`**  
  Returns `true` when the connected player count reaches the target maximum; otherwise returns `false`.
* **`my ID`**  
  Returns the unique ID generated for your device (automatically rerolls if an ID collision is detected).
* **`array of all devices`**  
  Returns a sorted array containing the IDs of all currently connected devices.

### Messaging

* **`send player value $name = $value`**  
  Sends a named number value tagged with your current player number (`P1`–`P4`) without interfering with multiplayer sync (`name` max 6 characters).
* **`on received from player $playerNum value $name $value`**  
  Runs code whenever a player-tagged value is received, providing the sender's `playerNum`, `name`, and `value`.
* **`send game value $name = $value`**  
  Sends an untagged named number value to other players without interfering with multiplayer sync (`name` max 8 characters).
* **`on received game value $name $value`**  
  Runs code whenever a game value is received from another device.

### Settings

* **`set max number of players $maxNum`**  
  Sets the maximum number of players allowed in the session (minimum `2`).
* **`set lobby channel $group`**  
  Sets the radio channel (`0`–`255`) and resets the current list of connected devices.

### More (Multiplayer Compatible)

* **`my player number (P1-P4)`**  
  Returns your assigned player number (`1`–`4`) based on sorted device ID order so every device agrees on who is Player 1, Player 2, etc.
* **`player number for ID $targetId`**  
  Returns the player number (`1`–`4`) for a specific device ID, or `0` if that ID is not in the session.

---

#### Metadata (used for search, rendering)

* for PXT/arcade
<script src="https://makecode.com"></script><script>makeCodeRender("{{ site.makecode.home_url }}", "{{ site.github.owner_name }}/{{ site.github.repository_name }}");</script>
