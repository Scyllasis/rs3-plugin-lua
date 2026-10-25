---@meta

--- How a ShapeEntity aligns with the ground.
---
--- [Docs](https://developer.runescape.com/rs/game/list/shapelist.html)
---@enum ShapeEntityAlignType
ShapeEntityAlignType = { -- unverified: docs list the enum but not its global access path
    NONE = 0,
    OBJECT = 1,
    MODEL = 2,
}

--- Geometry data (positions, colours, triangles, lines) that can be drawn or registered by name.
---
--- [Docs](https://developer.runescape.com/rs/game/list/shapelist.html)
---@class ShapeData
---@field positions Vector3[] 3D positions.
---@field rgba integer[] 32-bit colours; must match position count or be empty (default 0xFFFFFFFF).
---@field tris integer[] 0-indexed position index triplets forming triangles.
---@field lines integer[] 0-indexed position index pairs forming lines.
ShapeData = {}

--- Creates an empty ShapeData.
---@return ShapeData
function ShapeData.new() end

--- Returns the names of all ShapeData registered for this plugin.
---@return string[]
function ShapeData.GetAllRegistered() end

--- Whether a ShapeData is registered under `name` (case-sensitive).
---@param name string
---@return boolean
function ShapeData.IsRegistered(name) end

--- Registers a copy of `shapeData` under `name`.
---@param name string
---@param shapeData ShapeData
---@return boolean
function ShapeData.Register(name, shapeData) end

--- Unregisters a ShapeData; instances/entities using it are destroyed (case-sensitive).
---@param name string
---@return boolean
function ShapeData.Unregister(name) end

--- Settings for `ShapeList.Draw`. Data source priority: `shapeDataName`, `shapeData`, then raw buffers.
---@class ShapeDrawSettings
---@field shapeDataName? string Name of a registered ShapeData.
---@field shapeData? ShapeData ShapeData to draw directly.
---@field shapePositions? Vector3[] Raw positions.
---@field shapeRGBA? integer[] Raw colours.
---@field shapeTris? integer[] Raw triangle indices.
---@field shapeLines? integer[] Raw line indices.
---@field translation? Vector3 Positional offset. Default 0,0,0.
---@field rotation? Vector3 Rotation (X = yaw, Y = pitch, Z = roll). Default 0,0,0.
---@field scale? Vector3 Scale. Default 1,1,1.
---@field ignoreDepth? boolean Draw over world geometry. Default false.
---@field colour? integer Multiplied with the shape's RGBA. Default 0xFFFFFFFF.
---@field lineWidth? number Line thickness, max 10.0. Default 2.0.
---@field asBillboard? boolean Rotate to face the camera. Default false.

--- Settings for `ShapeList.DrawLine`.
---@class ShapeDrawLineSettings
---@field positions? Vector3[] Positions to join with lines.
---@field translation? Vector3 Positional offset. Default 0,0,0.
---@field rotation? Vector3 Rotation (X = yaw, Y = pitch, Z = roll). Default 0,0,0.
---@field scale? Vector3 Scale. Default 1,1,1.
---@field ignoreDepth? boolean Draw over world geometry. Default false.
---@field colour? integer Line colour. Default 0xFFFFFFFF.
---@field lineWidth? number Line thickness, max 10.0. Default 2.0.

--- Draws shapes for a frame and manages ShapeInstances and ShapeEntities. No constructor.
---
--- [Docs](https://developer.runescape.com/rs/game/list/shapelist.html)
---@class ShapeListAPI
ShapeList = {}

--- Draws a shape for one frame. Only valid inside draw events.
---@param settings ShapeDrawSettings
function ShapeList.Draw(settings) end

--- Draws a segmented line through the given positions for one frame. Only valid inside draw events.
---@param settings ShapeDrawLineSettings
function ShapeList.DrawLine(settings) end

--- Creates a ShapeInstance; nil if the name already exists in this plugin.
---@param name string
---@return ShapeInstance?
function ShapeList.CreateInstance(name) end

--- Returns the ShapeInstance with `name`, or nil.
---@param name string
---@return ShapeInstance?
function ShapeList.GetInstance(name) end

--- Returns all ShapeInstances created by this plugin.
---@return ShapeInstance[]
function ShapeList.GetAllInstances() end

--- Destroys a ShapeInstance by object or name.
---@param instance ShapeInstance|string
---@return boolean
function ShapeList.DestroyInstance(instance) end

--- Creates a ShapeEntity; nil if the name already exists in this plugin.
---@param name string
---@return ShapeEntity?
function ShapeList.CreateEntity(name) end

--- Returns the ShapeEntity with `name`, or nil.
---@param name string
---@return ShapeEntity? -- unverified: docs signature says ShapeInstance?, description says entity
function ShapeList.GetEntity(name) end

--- Returns all ShapeEntities created by this plugin.
---@return ShapeEntity[]
function ShapeList.GetAllEntities() end

--- Destroys a ShapeEntity by object or name.
---@param entity ShapeEntity|string
---@return boolean
function ShapeList.DestroyEntity(entity) end

--- A dynamic object holding ShapeData that draws itself in the world. Create with `ShapeList.CreateInstance`.
---
--- [Docs](https://developer.runescape.com/rs/game/list/shapelist.html)
---@class ShapeInstance
---@field isValid boolean Whether the instance still exists.
---@field name string Name it was created with.
---@field hasData boolean Whether valid ShapeData or a registered name is assigned.
---@field translation Vector3 Positional offset. Default 0,0,0.
---@field rotation Vector3 Rotation (X = yaw, Y = pitch, Z = roll). Default 0,0,0.
---@field scale Vector3 Scale. Default 1,1,1.
---@field visible boolean Whether drawn. Default true.
---@field ignoreDepth boolean Draw over world geometry. Default false.
---@field colour integer 32-bit colour multiplied with the data's RGBA. Default 0xFFFFFFFF.
---@field lineWidth number Line thickness, max 10.0. Default 2.0.
---@field asBillboard boolean Rotate to face the camera. Default false.
local ShapeInstance = {}

--- Assigns a copy of the ShapeData; clears any name set by `SetShapeDataName`.
---@param shapeData ShapeData
---@return boolean
function ShapeInstance:SetShapeData(shapeData) end

--- Assigns a registered ShapeData by name; clears any data set by `SetShapeData`.
---@param shapeName string
---@return boolean
function ShapeInstance:SetShapeDataName(shapeName) end

--- Destroys the instance. False if it does not exist.
---@return boolean
function ShapeInstance:Destroy() end

--- An object holding ShapeData placed at a world coordinate. Create with `ShapeList.CreateEntity`.
---
--- [Docs](https://developer.runescape.com/rs/game/list/shapelist.html)
---@class ShapeEntity
---@field isValid boolean Whether the entity still exists.
---@field name string Name it was created with.
---@field hasData boolean Whether valid ShapeData or a registered name is assigned.
---@field drawDistances integer[] Near and far draw distances (default 10240, 12288); set via `SetDrawDistance`. -- unverified: docs type is "Integer,Integer"
---@field coordGrid CoordGrid Placement coordinate; replaces `coordFine`.
---@field coordFine CoordFine Placement coordinate; replaces `coordGrid`.
---@field visible boolean Whether drawn. Default true.
---@field ignoreDepth boolean Draw over world geometry. Default false.
---@field colour integer 32-bit colour multiplied with the data's RGBA. Default 0xFFFFFFFF.
---@field lineWidth number Line thickness, max 10.0. Default 2.0.
---@field alignType ShapeEntityAlignType Ground alignment. Default NONE.
---@field heightOffset number Height above ground. Default 0.0.
---@field rotation number Starting Y-axis rotation in degrees. Default 0.0.
---@field rotationSpeed number Clockwise Y-axis rotation speed in degrees/second. Default 0.0.
---@field asBillboard boolean Rotate to face the camera (use alignType NONE). Default false.
local ShapeEntity = {}

--- Assigns a copy of the ShapeData; clears any name set by `SetShapeDataName`.
---@param shapeData ShapeData
---@return boolean
function ShapeEntity:SetShapeData(shapeData) end

--- Assigns a registered ShapeData by name; clears any data set by `SetShapeData`.
---@param shapeName string
---@return boolean
function ShapeEntity:SetShapeDataName(shapeName) end

--- Sets the cull distance (fine units), or a near/far fade range if two values are given.
--- Measured horizontally from the player to the nearest point of the bounding box.
---@param nearOrDistance number Draw distance, or fade start when `farDistance` is given.
---@param farDistance? number Fully transparent / not drawn beyond this.
function ShapeEntity:SetDrawDistance(nearOrDistance, farDistance) end

--- Destroys the entity. False if it does not exist.
---@return boolean
function ShapeEntity:Destroy() end
