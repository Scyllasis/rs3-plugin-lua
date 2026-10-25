---@meta

--- Read-only access to Grand Exchange offers.
---
--- [Docs](https://developer.runescape.com/rs/game/grandexchange.html)
---@class GrandExchangeAPI
GrandExchange = {}

--- Returns the offer in the given 1-indexed slot, or nil if the slot can't be found.
---@param slot integer 1-indexed offer slot.
---@return GrandExchangeOffer?
function GrandExchange.GetOffer(slot) end

--- Returns the maximum number of offers the player can have.
---@return integer
function GrandExchange.MaxOffers() end

--- A Grand Exchange offer.
---
--- [Docs](https://developer.runescape.com/rs/game/grandexchange.html)
---@class GrandExchangeOffer
---@field stage GrandExchangeOfferStage Stage the offer has reached.
---@field type GrandExchangeOfferType Buy or sell.
---@field item ObjType Item associated with the offer.
---@field price integer Gold price per item.
---@field itemCount integer Number of items in the offer.
---@field soldCount integer Number of items traded so far.
---@field goldFromSale integer Gold available after trades.

---@enum GrandExchangeOfferType
GrandExchangeOfferType = {
    BUY = 0,
    SELL = 1,
}

---@enum GrandExchangeOfferStage
GrandExchangeOfferStage = {
    EMPTY = 0,
    ADDING = 1,
    ADDED = 2,
    VERIFYING = 3,
    ABORTING = 4,
    FINISHED = 5,
}
