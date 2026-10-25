---@meta

--- An HTTP request. Requires the `httpAccess` permission (check with
--- `Plugin.HasPermission(PluginPermissions.httpAccess)`); base URLs come from the manifest `urls` via `Plugin.urls`.
---
--- ```lua
--- local req = HTTPRequest.new(Plugin.urls.rswiki, "/w/Hans")
--- req:Get(function(r) if r.successful then log(r.data) end end)
--- ```
---
--- [Docs](https://developer.runescape.com/rs/core/http.html)
---@class HTTPRequest
---@field data string Server response, or empty if pending or failed.
---@field header string Server response header, or empty if pending or failed.
---@field cancelled boolean True if the user cancelled the request.
---@field finished boolean True once the request completes, successful or not.
---@field successful boolean True if the request completed successfully.
---@field failed boolean True if the request failed due to an error.
---@field timedOut boolean True if no response was received from the target.
---@field responseCode integer HTTP response code from the target.
---@field errorCode integer HTTP error code from the target.
---@field errorInfo string Additional error cause when `failed` is true.
---@field progress number? Download progress 0..1, or nil if the server gives no size information.
---@field url string Address the request targets.
---@field downloadedBytes integer Bytes downloaded so far.
---@field downloadTotalBytes integer Expected total bytes; may be 0 if the server omits it.
HTTPRequest = {}

--- Creates a new request.
-- found by probe: `path` is appended to the base URL exactly as given, with no "/" added in between.
-- `HTTPRequest.new(Plugin.urls.probe, "report")` with base "http://127.0.0.1:47321" fails with
-- errorInfo "Port number ended with 'r'".
---@param baseURL PluginURL Base URL from the manifest, via `Plugin.urls`.
---@param path? string Appended to the base URL as-is; start it with `/` unless the base URL ends with one.
---@return HTTPRequest
function HTTPRequest.new(baseURL, path) end

--- Sends a GET request. Errors if the request is already active.
---@param completionCallback? fun(self: HTTPRequest) Called when the request finishes, successful or not.
---@param progressCallback? fun(self: HTTPRequest) Called when download progress changes.
function HTTPRequest:Get(completionCallback, progressCallback) end

--- Sends a POST request with `data` as the body. Errors if the request is already active.
---@param data string Request body.
---@param completionCallback? fun(self: HTTPRequest) Called when the request finishes, successful or not.
---@param progressCallback? fun(self: HTTPRequest) Called when download progress changes.
function HTTPRequest:Post(data, completionCallback, progressCallback) end

--- Cancels the request.
function HTTPRequest:Cancel() end

--- Adds a request header. Errors if the request is already active.
---@param key string
---@param value string
function HTTPRequest:AddHeader(key, value) end
