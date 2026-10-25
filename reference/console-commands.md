# Plugin console commands

From https://developer.runescape.com/rs/managing.html

`<plugin>` is the plugin's **folder name** (what `plist` shows, e.g. `rs3_api_probe`), not the `name` in plugin.json. If `ppe … httpAccess` doesn't take effect, run `ppr <plugin>` first.

| Command | Short | Purpose |
|---|---|---|
| `plugins_setpath <disk path>` | | Set where the client looks for plugin folders. |
| `plugins_refresh` | `prf` | Rescan the plugin path (needed after editing manifests or adding/removing plugins). |
| `plugins_list` | `plist` | List all available plugins. |
| `plugins_setenabled <plugin> <enabled?>` | | Enable/disable; enabled defaults to true. |
| `plugins_enable <plugin>` | `pon` | Enable a plugin. |
| `plugins_disable <plugin>` | `poff` | Disable a plugin. |
| `plugins_reload <plugin>` | `prl` | Disable then re-enable a plugin. |
| `plugins_permissions_request <plugin>` | `ppr` | Make a loaded plugin request its manifest permissions. |
| `plugins_permissions_enable <plugin> <permission>` | `ppe` | Grant a permission. |
| `plugins_permissions_disable <plugin> <permission>` | `ppd` | Revoke a permission. |

Also used in tutorials: `pan <ConfigType>` (e.g. `pan NPC`, `pan Obj`, `pan VarPlayer`, `pan VarClient`) lists config names.
