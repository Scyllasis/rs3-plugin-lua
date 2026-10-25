# Developer cheat commands

Source: https://developer.runescape.com/rs/cheats.html and tutorial/6cheats.html.

Entered in the client console (or from Lua via `ExecuteConsoleCommand("!tele 0,50,52,12,53")`). Work only on development (beta) servers, not Live; cheat use is logged on the server. Config names are case-insensitive (`!give Logs` == `!give LOGS`); use the config name, which may differ from the display name (find with `pan Obj`, `pan VarPlayer`, `pan VarClient`). Dev-only mouse shortcut: CTRL+SHIFT+click teleports to the clicked location.

| Command | Syntax | Description |
|---|---|---|
| tele | `!tele <coord>` / `!tele <named_teleport>` | Teleport to a coordinate or named destination. |
| getcoord | `!getcoord` | Print the player's current coordinate. |
| give | `!give <obj> [count] [inv]` | Add an ObjType to the backpack or a named inventory. |
| objadd | `!objadd <obj> [count]` | Drop an ObjType on the ground at the player's feet. |
| listinv | `!listinv <inv>` | Print a named inventory's contents. |
| listlocs | `!listlocs <radius>` | Print nearby locs (radius max 32). |
| listnpcs | `!listnpcs <radius>` | Print nearby NPCs (radius max 32). |
| listobjs | `!listobjs <radius> <obj_filter>` | Print nearby ground objects (radius max 32), optional ObjType filter; `null` for all. |
| skillsetlevel | `!skillsetlevel <skill> <level>` | Set a skill level without server level-up checks. |
| skilladdlevel | `!skilladdlevel <skill> <count>` | Add levels, triggering level-up checks. |
| skillsetxp | `!skillsetxp <skill> <xp>` | Set skill XP without level-up checks. |
| skilladdxp | `!skilladdxp <skill> <count>` | Add XP, triggering level-up checks. |
| getvar | `!getvar <name>` | Print a VarPlayer (or VarBit based on one). |
| setvar | `!setvar <name> <value>` | Set a VarPlayer (or VarBit based on one), e.g. `!setvar itemlog_item_dragon_harpoon 100`. |
| getvarc | `!getvarc <name>` | Print a VarClient. |
| setvarc | `!setvarc <name> <value>` | Set a VarClient. |
| resetsave | `!resetsave` | Flag the account to reset to a fresh start on next logout. |
| unresetsave | `!unresetsave` | Cancel a pending reset. |
| godmode | `!godmode` | Toggle combat invulnerability. |
| maxhp | `!maxhp` | Toggle constant health renewal to max. |
| hitall | `!hitall` | Deal 5000 damage to NPCs within 50 tiles. |
| allinone | `!allinone` | Complete all quests/tasks and max skills (unlocks progression VarPlayers). |
| bank | `!bank` | Open the bank. |
| clearworn | `!clearworn` | Destroy all worn (equipped) items. |
| clearinv | `!clearinv` | Destroy all backpack items. |
| coordsave | `!coordsave` | Save the current coordinate. |
| coordtele | `!coordtele` | Teleport to the coordinate saved by `coordsave`. |
| setgroupironman | `!setgroupironman <state>` | Group ironman status (0 off, 1 on). |
| sethardcore | `!sethardcore <state>` | Hardcore status (0 off, 1 on). |
| setironman | `!setironman <state>` | Ironman status (0 off, 1 on). |
| archcompletetutorial | `!archcompletetutorial` | Complete the Archaeology tutorial and grant its items. |
| archgivemats | `!archgivemats <count> <inv>` | Add `count` of every Archaeology material to an inventory. |
| inventgivemats | `!inventgivemats` | Give max storage of every Invention material. |
| inventwipemats | `!inventwipemats` | Remove all Invention materials. |
| inventmachinerun | `!inventmachinerun` | Advance Invention machines by one simulated hour. |
| inventsetperks | `!inventsetperks <inventory_slot> <perk_id_1> <perk_rank_1> <perk_id_2> <perk_rank_2> <gizmo_slot>` | Set perks/ranks on gizmo slot 1 or 2 of an augmented item in `inv`. |
| tlihide | `!tlihide` | Hide all top-level interface windows. |
| tlishow | `!tlishow` | Show all top-level interface windows. |
| pouchadd | `!pouchadd <currency_id> <count> <ignore_overflow>` | Add currency to the pouch; ignore_overflow 1 clamps to max, 0 adds nothing on overflow. |
| pouchdel | `!pouchdel <currency_id> <count>` | Remove currency; nothing removed if it would go negative. |
| pouchdeposit | `!pouchdeposit <currency_id> <inv>` | Move all of a currency from an inventory into the pouch. |
| pouchwithdraw | `!pouchwithdraw <currency_id>` | Move currency from pouch to `inv` (prompts for amount). |
| pouchspace | `!pouchspace <currency_id>` | Print how much more the pouch can hold. |
| pouchtotal | `!pouchtotal <currency_id>` | Print the pouch total. |
| testpouchadd | `!testpouchadd <currency_id> <count>` | Add exact amount only if it fits. |
| testpouchdel | `!testpouchdel <currency_id> <count>` | Remove exact amount only if possible. |

## Argument formats

- `<coord>`: full `level,mapSquareX,mapSquareZ,localX,localZ` (5 values, field names not labelled in docs) e.g. `2,50,50,8,19` or `2_50_50_8_19`; or mapsquare shorthand `0,50,50` / `0_50_50` (centre of that mapsquare).
- Named teleports: `grandexchange` (0,49,54,29,40 = `CoordGrid._0_49_54_29_40`).
- Named inventories: `inv` (`config.Inv.INV`, backpack), `bank` (`config.Inv.BANK`, main bank).
- Invention perk IDs (id: name, max rank): 1 blunted 5, 2 inaccurate 5, 3 biting (n/a), 4 eruptive 4, 5 honed_tool 6, 6 lucky_armour 6, 7 undead_slayer 1, 8 dragon_slayer 1, 9 demon_slayer 1, 10 undead_bait 1, 11 dragon_bait 1, 12 demon_bait 1, 13 looting 1, 14 enlightened_xp 4, 15 glowworm 1, 16 atheist 1, 17 hoarding 1, 18 taunting 1, 19 committed 1, 20 mobile 1, 21 cautious 1, 22 hallucinogenic 1, 23 talking 1, 24 scavenging 4, 25 turtling 4, 26 brief_respite 4, 27 wise 4, 28 efficient 4, 29 absorbative 4, 30 precise 6, 31 profane 1, 32 brassican 1, 33 fatiguing 3, 34 genocidal 1, 35 crackling 4, 36 impatient 4, 37 invigorating 4, 38 venomblood 1, 39 devoted 4, 40 spendthrift 6, 41 shield_bashing 4, 42 ultimatums 4, 43 junk_food 3, 44 energising 4, 45 trophy_takers 6, 46 clear_headed 4, 47 reflexes 1, 48 bulwark 4, 49 preparation 4, 50 mediocrity 3, 51 mysterious 6, 52 furnace 4, 53 polishing 4, 54 cheapskate 3, 55 imp_souled 6, 56 butterfingers 5, 57 refined 4, 58 charitable 4, 59 confused 3, 60 caroming 4, 61 aftershock 4, 62 lunging 4, 63 plantedfeet 1, 64 enhanced_efficiency 4, 65 flanking 4, 66 enhanced_devotion 4, 67 crystal_shield 4, 68 rapid 4, 69 tinker 4, 70 pyromaniac 6, 71 autodisassemble 6, 72 prosper 1, 73 relentless 5, 74 ruthless 3, 75 fortune 3, 76 equilibrium 4, 77 scraps 1, 78 careless 5, 79 explosive 1, 80 oblivious 1, 81 wild_runes 5, 82 preservationist 5, 83 hasty 5, 84 naturalist 5.
- Currency IDs: 1 thaler, 2 tokkul, 3 pieces_of_eight, 4 arc_chimes, 5 arc_taijitu, 6 brim_agil_ticket, 7 cw_gold_ticket, 8 cw_silver_ticket, 9 ectotoken, 10 rc_guild_token, 11 mazcab_teci, 12 reaper_points, 13 penguin_points, 14 ba_attack, 15 ba_defence, 16 ba_collector, 17 ba_healer, 18 fishing_tokens, 19 brian_points, 20 mob_invest, 21 mob_reward, 22 mage_tele, 23 mage_alch, 24 mage_enchant, 25 mage_grave, 26 livid_points, 27 sc_points, 28 vine_points, 29 void_points, 30 soulwars_points, 31 slayer_points, 32 ss_points, 33 runespan, 34 warguild_str, 35 warguild_def, 36 warguild_att, 37 warguild_com, 38 warguild_bal, 39 pilfer_points, 40 hanky_points, 41 jadinko_favour, 42 tuska, 43 fog_token, 44 dungeoneering_tokens, 45 cfb_points, 46 heist_points, 47 clan_orts, 48 deathmatch, (49 not listed), 50 arc_supplies, 51 fragments_gemstone, 52 fragments_ethereal, 53 fragments_shark, 54 fragments_camouflage, 55 hog_mote, 56 sworlds, 57 slayer_vip, 58 fragments_divination, 59 trail_points, 60 fragments_dungeoneering, 61 fragments_farming, 62 pof, 63 fragments_sentinel, 64 fragments_trapper, 65 dino_herblore_dnd, 66 marks_of_war, 67 chronotes, 68 con_contracts, 69 dsf_merchant_coupon, 70 challenge, 71 scarabs_caught, 72 desert_farm, 73 christmas_spirit, 74 dmbh_ancientgeardropbuff, 75 spring_tokens, 76 egg_points, 77 spooky_tokens, 78 stardust.
