---@meta

--- The 90-degree rotation a LocEntity is using.
---
--- [Docs](https://developer.runescape.com/rs/game/entity/locentity.html)
---@enum RotationType
RotationType = { -- unverified: docs list the enum but not its global access path
    ZERO = 0,
    NINETY = 1,
    ONEEIGHTY = 2,
    TWOSEVENTY = 3,
}

--- An active instance of a LocType in the game world. Proxy usertype: safe to copy and store, not usable
--- with persistent storage. No constructor; obtain via `LocList`. Check `isValid` before reading properties.
---
--- [Docs](https://developer.runescape.com/rs/game/entity/locentity.html)
---@class LocEntity
---@field isValid boolean Whether the entity still exists. Read-only.
---@field displayName string Display name. Read-only.
---@field config LocType Config used by the entity. Read-only.
---@field parentConfig LocType Parent config, if a MultiLoc. Read-only.
---@field configID integer ID of the config. Read-only.
---@field parentConfigID integer ID of the parent config, if a MultiLoc. Read-only.
---@field isMultiLoc boolean Whether this is a MultiLoc. Read-only.
---@field position Vector3 World position. Read-only.
---@field coordGrid CoordGrid Tile the entity is on. Read-only.
---@field shapeType LocShapeType Shape type in use. Read-only.
---@field rotationType RotationType Current 90-degree rotation. Read-only.
---@field width integer X-axis size in grid units, after rotation. Read-only.
---@field length integer Z-axis size in grid units, after rotation. Read-only.
---@field isHidden boolean Hidden by game logic. Read-only.
---@field isRoofRemoved boolean Hidden by the Remove Roof system. Read-only.
---@field currentAnimation SeqType? Current animation, or nil if none. Read-only.
