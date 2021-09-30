## Enterprise policy descriptions and templates for Thunderbird 68

Policies can be specified using the [Group Policy templates on Windows](windows), [Intune on Windows](https://support.mozilla.org/kb/managing-firefox-intune), [configuration profiles on macOS](mac), or by creating a file called `policies.json`. On Windows, create a directory called `distribution` where the EXE is located and place the file there. On Mac, the file goes into `Thunderbird.app/Contents/Resources/distribution`.  On Linux, the file goes into `thunderbird/distribution`, where `thunderbird` is the installation directory for Thunderbird, which varies by distribution.

| Policy Name | Description
| --- | --- |
| **[`AppUpdateURL`](#appupdateurl)** | Change the URL for application update.
| **[`BlockAboutAddons`](#blockaboutaddons)** | Block access to the Add-ons Manager (about:addons).
| **[`BlockAboutConfig`](#blockaboutconfig)** | Block access to about:config.
| **[`BlockAboutProfiles`](#blockaboutprofiles)** | Block access to About Profiles (about:profiles).
| **[`BlockAboutSupport`](#blockaboutsupport)** | Block access to Troubleshooting Information (about:support).
| **[`Certificates`](#certificates)** |
| **[`Certificates -> ImportEnterpriseRoots`](#certificates--importenterpriseroots)** | Trust certificates that have been added to the operating system certificate store by a user or administrator.
| **[`Certificates -> Install`](#certificates--install)** | Install certificates into the Thunderbird certificate store.
| **[`DisableAppUpdate`](#disableappupdate)** | Turn off application updates.
| **[`DisableDeveloperTools`](#disabledevelopertools)** | Remove access to all developer tools.
| **[`DisableMasterPasswordCreation`](#disablemasterpasswordcreation)** | Remove the master password functionality.
| **[`DisableSecurityBypass`](#disablesecuritybypass)** | Prevent the user from bypassing security in certain cases.
| **[`Extensions`](#extensions)** | Control the installation, uninstallation and locking of extensions.
| **[`ExtensionSettings`](#extensionsettings)** | Manage all aspects of extensions.
| **[`ExtensionUpdate`](#extensionupdate)** | Control extension updates.
| **[`InstallAddonsPermission`](#installaddonspermission)** | Configure the default extension install policy as well as origins for extension installs are allowed.
| **[`Preferences`](#preferences)** | Set and lock some preferences.
| **[`Proxy`](#proxy)** | Configure proxy settings.
| **[`RequestedLocales`](#requestedlocales)** | Set the the list of requested locales for the application in order of preference.
| **[`SSLVersionMax`](#sslversionmax)** | Set and lock the maximum version of TLS.
| **[`SSLVersionMin`](#sslversionmin)** | Set and lock the minimum version of TLS.

## AppUpdateURL

Change the URL for application update.

**CCK2 Equivalent:** N/A\
**Preferences Affected:** `app.update.url`

#### Windows (GPO)
```
Software\Policies\Mozilla\Thunderbird\AppUpdateURL = "https://yoursite.com"
```
#### Windows (Intune)
OMA-URI:
```
./Device/Vendor/MSFT/Policy/Config/Thunderbird~Policy~thunderbird/AppUpdateURL
```
Value (string):
```
<enabled/>
<data id="AppUpdateURL" value="https://yoursite.com"/>
```
#### macOS
```
<dict>
  <key>AppUpdateURL</key>
  <string>https://yoursite.com</string>
</dict>
```
#### policies.json
```
{
  "policies": {
    "AppUpdateURL": "https://yoursite.com"
  }
}
```
#### Compatibility

| Policy/Property Name | Compatibility Information |
| --- | --- |
| AppUpdateURL | {"esr68":"68.0a1"} |

  
## BlockAboutAddons

Block access to the Add-ons Manager (about:addons).

**CCK2 Equivalent:** `disableAddonsManager`\
**Preferences Affected:** N/A

#### Windows (GPO)
```
Software\Policies\Mozilla\Thunderbird\BlockAboutAddons = 0x1 | 0x0
```
#### Windows (Intune)
OMA-URI:
```
./Device/Vendor/MSFT/Policy/Config/Thunderbird~Policy~thunderbird/BlockAboutAddons
```
Value (string):
```
<enabled/> or <disabled/>
```
#### macOS
```
<dict>
  <key>BlockAboutAddons</key>
  <true/> | <false/>
</dict>
```
#### policies.json
```
{
  "policies": {
    "BlockAboutAddons": true | false
  }
}
```
#### Compatibility

| Policy/Property Name | Compatibility Information |
| --- | --- |
| BlockAboutAddons | {"esr68":"68.0a1"} |

  
## BlockAboutConfig

Block access to about:config.

**CCK2 Equivalent:** `disableAboutConfig`\
**Preferences Affected:** N/A

#### Windows (GPO)
```
Software\Policies\Mozilla\Thunderbird\BlockAboutConfig = 0x1 | 0x0
```
#### Windows (Intune)
OMA-URI:
```
./Device/Vendor/MSFT/Policy/Config/Thunderbird~Policy~thunderbird/BlockAboutConfig
```
Value (string):
```
<enabled/> or <disabled/>
```
#### macOS
```
<dict>
  <key>BlockAboutConfig</key>
  <true/> | <false/>
</dict>
```
#### policies.json
```
{
  "policies": {
    "BlockAboutConfig": true | false
  }
}
```
#### Compatibility

| Policy/Property Name | Compatibility Information |
| --- | --- |
| BlockAboutConfig | {"esr68":"68.0a1"} |

  
## BlockAboutProfiles

Block access to About Profiles (about:profiles).

**CCK2 Equivalent:** `disableAboutProfiles`\
**Preferences Affected:** N/A

#### Windows (GPO)
```
Software\Policies\Mozilla\Thunderbird\BlockAboutProfiles = 0x1 | 0x0
```
#### Windows (Intune)
OMA-URI:
```
./Device/Vendor/MSFT/Policy/Config/Thunderbird~Policy~thunderbird/BlockAboutProfiles
```
Value (string):
```
<enabled/> or <disabled/>
```
#### macOS
```
<dict>
  <key>BlockAboutProfiles</key>
  <true/> | <false/>
</dict>
```
#### policies.json
```
{
  "policies": {
    "BlockAboutProfiles": true | false
  }
}
```
#### Compatibility

| Policy/Property Name | Compatibility Information |
| --- | --- |
| BlockAboutProfiles | {"esr68":"68.0a1"} |

  
## BlockAboutSupport

Block access to Troubleshooting Information (about:support).

**CCK2 Equivalent:** `disableAboutSupport`\
**Preferences Affected:** N/A

#### Windows (GPO)
```
Software\Policies\Mozilla\Thunderbird\BlockAboutSupport = 0x1 | 0x0
```
#### Windows (Intune)
OMA-URI:
```
./Device/Vendor/MSFT/Policy/Config/Thunderbird~Policy~thunderbird/BlockAboutSupport
```
Value (string):
```
<enabled/> or <disabled/>
```
#### macOS
```
<dict>
  <key>BlockAboutSupport</key>
  <true/> | <false/>
</dict>
```
#### policies.json
```
{
  "policies": {
    "BlockAboutSupport": true | false
  }
}
```
#### Compatibility

| Policy/Property Name | Compatibility Information |
| --- | --- |
| BlockAboutSupport | {"esr68":"68.0a1"} |

  
## Certificates

#### Compatibility

| Policy/Property Name | Compatibility Information |
| --- | --- |
| Certificates<br>Certificates_ImportEnterpriseRoots<br>Certificates_Install | {"esr68":"68.0a1"} |

  
## Certificates | ImportEnterpriseRoots

Trust certificates that have been added to the operating system certificate store by a user or administrator.

See https://support.mozilla.org/kb/setting-certificate-authorities-firefox for more detail.

**CCK2 Equivalent:** N/A\
**Preferences Affected:** `security.enterprise_roots.enabled`

#### Windows (GPO)
```
Software\Policies\Mozilla\Thunderbird\Certificates\ImportEnterpriseRoots = 0x1 | 0x0
```
#### Windows (Intune)
OMA-URI:
```
./Device/Vendor/MSFT/Policy/Config/Thunderbird~Policy~thunderbird~Certificates/Certificates_ImportEnterpriseRoots
```
Value (string):
```
<enabled/> or <disabled/>
```
#### macOS
```
<dict>
  <key>Certificates</key>
  <dict>
    <key>ImportEnterpriseRoots</key>
    <true/> | <false/>
  </dict>
</dict>
```
#### policies.json
```
{
  "policies": {
    "Certificates": {
      "ImportEnterpriseRoots": true | false
    }
  }
}
```
#### Compatibility

| Policy/Property Name | Compatibility Information |
| --- | --- |
| Certificates_ImportEnterpriseRoots | {"esr68":"68.0a1"} |

  
## Certificates | Install

Install certificates into the Thunderbird certificate store. If only a filename is specified, Thunderbird searches for the file in the following locations:

- Windows
  - %USERPROFILE%\AppData\Local\Mozilla\Certificates
  - %USERPROFILE%\AppData\Roaming\Mozilla\Certificates
- macOS
  - /Library/Application Support/Mozilla/Certificates
  - ~/Library/Application Support/Mozilla/Certificates
- Linux
  - /usr/lib/mozilla/certificates
  - /usr/lib64/mozilla/certificates
  - ~/.mozilla/certificates

Starting with Thunderbird 65, Thunderbird 60.5 ESR, a fully qualified path can be used, including UNC paths. You should use the native path style for your operating system. We do not support using %USERPROFILE% or other environment variables on Windows.

If you are specifying the path in the policies.json file on Windows, you need to escape your backslashes (`\\`) which means that for UNC paths, you need to escape both (`\\\\`). If you use group policy, you only need one backslash.

Certificates are installed using the trust string `CT,CT,`.

Binary (DER) and ASCII (PEM) certificates are both supported.

**CCK2 Equivalent:** `certs.ca`\
**Preferences Affected:** N/A

#### Windows (GPO)
```
Software\Policies\Mozilla\Thunderbird\Certificates\Install\1 = "cert1.der"
Software\Policies\Mozilla\Thunderbird\Certificates\Install\2 = "C:\Users\username\cert2.pem"
```
#### Windows (Intune)
OMA-URI:
```
./Device/Vendor/MSFT/Policy/Config/Thunderbird~Policy~thunderbird~Certificates/Certificates_Install
```
Value (string):
```
<enabled/>
<data id="Certificates_Install" value="1&#xF000;cert1.der&#xF000;2&#xF000;C:\Users\username\cert2.pem"/>
```
#### macOS
```
<dict>
  <key>Certificates</key>
  <dict>
    <key>Install</key>
    <array>
      <string>cert1.der</string>
      <string>/Users/username/cert2.pem</string>
    </array>
  </dict>
</dict>
```
#### policies.json
```
{
  "policies": {
    "Certificates": {
      "Install": ["cert1.der", "/home/username/cert2.pem"]
    }
  }
}
```
#### Compatibility

| Policy/Property Name | Compatibility Information |
| --- | --- |
| Certificates_Install | {"esr68":"68.0a1"} |

  
## DisableAppUpdate
Turn off application updates.

**CCK2 Equivalent:** `disableFirefoxUpdates`\
**Preferences Affected:** N/A

#### Windows (GPO)
```
Software\Policies\Mozilla\Thunderbird\DisableAppUpdate = 0x1 | 0x0
```
#### Windows (Intune)
OMA-URI:
```
./Device/Vendor/MSFT/Policy/Config/Thunderbird~Policy~thunderbird/DisableAppUpdate
```
Value (string):
```
<enabled/> or <disabled/>
```
#### macOS
```
<dict>
  <key>DisableAppUpdate</key>
  <true/> | <false/>
</dict>
```
#### policies.json
```
{
  "policies": {
    "DisableAppUpdate": true | false
  }
}
```
#### Compatibility

| Policy/Property Name | Compatibility Information |
| --- | --- |
| DisableAppUpdate | {"esr68":"68.0a1"} |

  
## DisableDeveloperTools
Remove access to all developer tools.

**CCK2 Equivalent:** `removeDeveloperTools`\
**Preferences Affected:** `devtools.policy.disabled`

#### Windows (GPO)
```
Software\Policies\Mozilla\Thunderbird\DisableDeveloperTools = 0x1 | 0x0`
```
#### Windows (Intune)
OMA-URI:
```
./Device/Vendor/MSFT/Policy/Config/Thunderbird~Policy~thunderbird/DisableDeveloperTools
```
Value (string):
```
<enabled/> or <disabled/>
```
#### macOS
```
<dict>
  <key>DisableDeveloperTools</key>
  <true/> | <false/>
</dict>
```
#### policies.json
```
{
  "policies": {
    "DisableDeveloperTools": true | false
  }
}
```
#### Compatibility

| Policy/Property Name | Compatibility Information |
| --- | --- |
| DisableDeveloperTools | {"esr68":"68.0a1"} |

  
## DisableMasterPasswordCreation
Remove the master password functionality.

**CCK2 Equivalent:** `noMasterPassword`\
**Preferences Affected:** N/A

#### Windows (GPO)
```
Software\Policies\Mozilla\Thunderbird\DisableMasterPasswordCreation = 0x1 | 0x0
```
#### Windows (Intune)
OMA-URI:
```
./Device/Vendor/MSFT/Policy/Config/Thunderbird~Policy~thunderbird/DisableMasterPasswordCreation
```
Value (string):
```
<enabled/> or <disabled/>
```
#### macOS
```
<dict>
  <key>DisableMasterPasswordCreation</key>
  <true/> | <false/>
</dict>
```
#### policies.json
```
{
  "policies": {
    "DisableMasterPasswordCreation": true | false
  }
}
```
#### Compatibility

| Policy/Property Name | Compatibility Information |
| --- | --- |
| DisableMasterPasswordCreation | {"esr68":"68.0a1"} |

  
## DisableSecurityBypass
Prevent the user from bypassing security in certain cases.

`InvalidCertificate` prevents adding an exception when an invalid certificate is shown.

`SafeBrowsing` prevents selecting "ignore the risk" and visiting a harmful site anyway.

**CCK2 Equivalent:** N/A\
**Preferences Affected:** `security.certerror.hideAddException`,`browser.safebrowsing.allowOverride`

#### Windows (GPO)
```
Software\Policies\Mozilla\Thunderbird\DisableSecurityBypass\InvalidCertificate = 0x1 | 0x0
Software\Policies\Mozilla\Thunderbird\DisableSecurityBypass\SafeBrowsing = 0x1 | 0x0
```
#### Windows (Intune)
OMA-URI:
```
./Device/Vendor/MSFT/Policy/Config/Thunderbird~Policy~thunderbird/P_DisableSecurityBypass_InvalidCertificate
```
Value (string):
```
<enabled/> or <disabled/>
```
OMA-URI:
```
./Device/Vendor/MSFT/Policy/Config/Thunderbird~Policy~thunderbird/P_DisableSecurityBypass_SafeBrowsing
```
Value (string):
```
<enabled/> or <disabled/>
```

#### macOS
```
<dict>
  <key>DisableSecurityBypass</key>
  <dict>
    <key>InvalidCertificate</key>
    <true/> | <false/>
    <key><SafeBrowsing/key>
    <true/> | <false/>
  </dict>
</dict>
```
#### policies.json
```
{
  "policies": {
    "DisableSecurityBypass": {
      "InvalidCertificate": true | false,
      "SafeBrowsing": true | false
    }
  }
}
```
#### Compatibility

| Policy/Property Name | Compatibility Information |
| --- | --- |
| DisableSecurityBypass<br>DisableSecurityBypass_InvalidCertificate<br>DisableSecurityBypass_SafeBrowsing | {"esr68":"68.0a1"} |

  
## Extensions
Control the installation, uninstallation and locking of extensions.

`Install` is a list of URLs or native paths for extensions to be installed. 

`Uninstall` is a list of extension IDs that should be uninstalled if found.

`Locked` is a list of extension IDs that the user cannot disable or uninstall.

**CCK2 Equivalent:** `addons`\
**Preferences Affected:** N/A

#### Windows (GPO)
```
Software\Policies\Mozilla\Thunderbird\Extensions\Install\1 = "https://addons.thunderbird.net/thunderbird/downloads/somefile.xpi"
Software\Policies\Mozilla\Thunderbird\Extensions\Install\2 = "//path/to/xpi"
Software\Policies\Mozilla\Thunderbird\Extensions\Uninstall\1 = "bad_addon_id@mozilla.org"
Software\Policies\Mozilla\Thunderbird\Extensions\Locked\1 = "addon_id@mozilla.org"
```
#### macOS
```
<dict>
  <key>Extensions</key>
  <dict>
    <key>Install</key>
    <array>
      <string>https://addons.thunderbird.net/thunderbird/downloads/somefile.xpi</string>
      <string>//path/to/xpi</string>
    </array>
    <key>Uninstall</key>
    <array>
      <string>bad_addon_id@mozilla.org</string>
    </array>
    <key>Locked</key>
    <array>
      <string>addon_id@mozilla.org</string>
    </array>
  </dict>
</dict>
```
#### policies.json
```
{
  "policies": {
    "Extensions": {
      "Install": ["https://addons.thunderbird.net/thunderbird/downloads/somefile.xpi", "//path/to/xpi"],
      "Uninstall": ["bad_addon_id@mozilla.org"],
      "Locked":  ["addon_id@mozilla.org"]
    }
  }
}
```
#### Compatibility

| Policy/Property Name | Compatibility Information |
| --- | --- |
| Extensions<br>Extensions_Install<br>Extensions_Uninstall<br>Extensions_Locked | {"esr68":"68.0a1"} |

  
## ExtensionSettings
Manage all aspects of extensions. This policy is based heavily on the [Chrome policy](https://dev.chromium.org/administrators/policy-list-3/extension-settings-full) of the same name.

This policy maps an extension ID to its configuration. With an extension ID, the configuration will be applied to the specified extension only. A default configuration can be set for the special ID "*", which will apply to all extensions that don't have a custom configuration set in this policy.

To obtain an extension ID, install the extension and go to about:support. You will see the ID in the Extensions section.

The configuration for each extension is another dictionary that can contain the fields documented below.

| Name | Description |
| --- | --- |
| `installation_mode` | Maps to a string indicating the installation mode for the extension. The valid strings are `allowed`,`blocked`,`force_installed`, and `normal_installed`.
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`allowed` | Allows the extension to be installed by the user. This is the default behavior.
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`blocked`| Blocks installation of the extension and removes it from the device if already installed.
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`force_installed`| The extension is automatically installed and can't be removed by the user. This option is not valid for the default configuration and requires an install_url.
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`normal_installed`| The extension is automatically installed but can be disabled by the user. This option is not valid for the default configuration and requires an install_url.
| `install_url`| Maps to a URL indicating where Thunderbird can download a force_installed or normal_installed extension. If installing from the addons.thunderbird.net, use the following URL (substituting SHORT_NAME from the URL on ATN), https://addons.thunderbird.net/thunderbird/downloads/latest/SHORT_NAME/latest.xpi. If installing from the local file system, use a file:/// URL. Languages packs are available from https://releases.mozilla.org/pub/thunderbird/releases/VERSION/PLATFORM/xpi/LANGUAGE.xpi.
| `install_sources` | Each item in this list is an extension-style match pattern. Users will be able to easily install items from any URL that matches an item in this list. Both the location of the *.xpi file and the page where the download is started from (i.e.  the referrer) must be allowed by these patterns. This setting can be used only for the default configuration.
| `allowed_types` | This setting whitelists the allowed types of extension/apps that can be installed in Thunderbird. The value is a list of strings, each of which should be one of the following: "extension", "theme", "dictionary", "langpack" This setting can be used only for the default configuration.
| `blocked_install_message` | This maps to a string specifying the error message to display to users if they're blocked from installing an extension. This setting allows you to append text to the generic error message displayed when the extension is blocked. This could be be used to direct users to your help desk, explain why a particular extension is blocked, or something else.

**CCK2 Equivalent:** N/A\
**Preferences Affected:** N/A

#### Windows (GPO)
```
Software\Policies\Mozilla\Thunderbird\ExtensionSettings (REG_MULTI_SZ) =
{
  "*": {
    "blocked_install_message": "Custom error message.",
    "install_sources": ["https://addons.thunderbird.net/"],
    "installation_mode": "blocked",
    "allowed_types": ["extension"]
  },
  "uBlock0@raymondhill.net": {
    "installation_mode": "force_installed",
    "install_url": "https://addons.thunderbird.net/thunderbird/downloads/latest/ublock-origin/latest.xpi"
  }
}
```
#### Windows (Intune)
OMA-URI:
```
./Device/Vendor/MSFT/Policy/Config/Thunderbird~Policy~thunderbird~Extensions/ExtensionSettings
```
Value (string):
```
<enabled/>
<data id="ExtensionSettings" value='
  "*": {
      "blocked_install_message": "Custom error message.",
      "install_sources": ["https://addons.thunderbird.net/"],
      "installation_mode": "blocked",
      "allowed_types": ["extension"]
    },
    "uBlock0@raymondhill.net": {
      "installation_mode": "force_installed",
      "install_url": "https://addons.thunderbird.net/thunderbird/downloads/latest/ublock-origin/latest.xpi"
    }'/>
```
#### macOS
```
<dict>
  <key>ExtensionSettings</key>
  <dict>
    <key>*</key>
    <dict>
      <key>blocked_install_message</key>
      <string>Custom error message.</string>
      <key>install_sources</key>
      <array>
        <string>https://addons.thunderbird.net/</string>
      </array>
      <key>installation_mode</key>
      <string>blocked</string>
      <key>allowed_types</key>
      <array>
        <string>extension</string>
      </array>
    </dict>
    <key>uBlock0@raymondhill.net</key>
    <dict>
      <key>installation_mode</key>
       <string>force_installed</string>
      <key>install_url</key>
      <string>https://addons.thunderbird.net/thunderbird/downloads/latest/ublock-origin/latest.xpi</string>
    </dict>
  </dict>
</dict>
```
#### policies.json
```
{
  "policies": {
    "ExtensionSettings": {
      "*": {
        "blocked_install_message": "Custom error message.",
        "install_sources": ["https://addons.thunderbird.net/"],
        "installation_mode": "blocked",
        "allowed_types": ["extension"]
      },
      "uBlock0@raymondhill.net": {
        "installation_mode": "force_installed",
        "install_url": "https://addons.thunderbird.net/thunderbird/downloads/latest/ublock-origin/latest.xpi"
      }
    }
  }
}
```
#### Compatibility

| Policy/Property Name | Compatibility Information |
| --- | --- |
| ExtensionSettings | {"esr68":"68.0a1"} |

  
## ExtensionUpdate
Control extension updates.

**CCK2 Equivalent:** N/A\
**Preferences Affected:** `extensions.update.enabled`

#### Windows (GPO)
```
Software\Policies\Mozilla\Thunderbird\ExtensionUpdate = 0x1 | 0x0
```
#### Windows (Intune)
OMA-URI:
```
./Device/Vendor/MSFT/Policy/Config/Thunderbird~Policy~thunderbird/ExtensionUpdate
```
Value (string):
```
<enabled/> or <disabled/>
```
#### macOS
```
<dict>
  <key>ExtensionUpdate</key>
  <true/> | <false/>
</dict>
```
#### policies.json
```
{
  "policies": {
    "ExtensionUpdate": true | false
  }
}
```
#### Compatibility

| Policy/Property Name | Compatibility Information |
| --- | --- |
| ExtensionUpdate | {"esr68":"68.0a1"} |

  
## InstallAddonsPermission
Configure the default extension install policy as well as origins for extension installs are allowed. This policy does not override turning off all extension installs.

`Allow` is a list of origins where extension installs are allowed.

`Default` determines whether or not extension installs are allowed by default.

**CCK2 Equivalent:** `permissions.install`\
**Preferences Affected:** `xpinstall.enabled`

#### Windows (GPO)
```
Software\Policies\Mozilla\Thunderbird\InstallAddonsPermission\Allow\1 = "https://example.org"
Software\Policies\Mozilla\Thunderbird\InstallAddonsPermission\Allow\2 = "https://example.edu"
Software\Policies\Mozilla\Thunderbird\InstallAddonsPermission\Default = 0x1 | 0x0
```
#### Windows (Intune)
OMA-URI:
```
./Device/Vendor/MSFT/Policy/Config/Thunderbird~Policy~thunderbird~Addons/InstallAddonsPermission_Allow
```
Value (string):
```
<enabled/>
<data id="Permissions" value="1&#xF000;https://example.org&#xF000;2&#xF000;https://example.edu"/>
```
OMA-URI:
```
./Device/Vendor/MSFT/Policy/Config/Thunderbird~Policy~thunderbird~Addons/InstallAddonsPermission_Default
```
Value (string):
```
<enabled/>
```
#### macOS
```
<dict>
  <key>InstallAddonsPermission</key>
  <dict>
    <key>Allow</key>
    <array>
      <string>http://example.org</string>
      <string>http://example.edu</string>
    </array>
    <key>Default</key>
    <true/> | <false/>
  </dict>
</dict>
```
#### policies.json
```
{
  "policies": {
    "InstallAddonsPermission": {
      "Allow": ["http://example.org/",
                "http://example.edu/"],
      "Default": true | false
    }
  }
}
```
#### Compatibility

| Policy/Property Name | Compatibility Information |
| --- | --- |
| InstallAddonsPermission<br>InstallAddonsPermission_Allow<br>InstallAddonsPermission_Default | {"esr68":"68.0a1"} |

  
## Preferences
Set and lock certain preferences.

**CCK2 Equivalent:** `preferences`\
**Preferences Affected:** See below

| Preference | Type | Compatibility | Default
| --- | --- | --- | ---
| accessibility.force_disabled | integer | Thunderbird 70, Thunderbird ESR 68.2 | 0
| &nbsp;&nbsp;&nbsp;&nbsp;If set to 1, platform accessibility is disabled.
| app.update.auto (Deprecated - Switch to AppAutoUpdate policy) | boolean | Thunderbird 68, Thunderbird ESR 68 | true
| &nbsp;&nbsp;&nbsp;&nbsp;If false, Thunderbird doesn't automatically install update.
| browser.bookmarks.autoExportHTML | boolean | Thunderbird 70, Thunderbird ESR 68.2 | false
| &nbsp;&nbsp;&nbsp;&nbsp;If true, bookmarks are exported on shutdown.
| browser.bookmarks.file | string | Thunderbird 70, Thunderbird ESR 68.2 | N/A
| &nbsp;&nbsp;&nbsp;&nbsp;If set, the name of the file where bookmarks are exported and imported.
| browser.bookmarks.restore_default_bookmarks | boolean | Thunderbird 70, Thunderbird ESR 68.2 | N/A
| &nbsp;&nbsp;&nbsp;&nbsp;If true, bookmarks are restored to their defaults.
| browser.cache.disk.enable | boolean | Thunderbird 68, Thunderbird ESR 68 | true
| &nbsp;&nbsp;&nbsp;&nbsp;If false, don't store cache on the hard drive.
| ~browser.cache.disk.parent_directory~ | string | Thunderbird 68, Thunderbird ESR 68 | Profile temporary directory
| &nbsp;&nbsp;&nbsp;&nbsp;~If set, changes the location of the disk cache.~ This policy doesn't work. It's being worked on.
| browser.fixup.dns_first_for_single_words | boolean | Thunderbird 68, Thunderbird ESR 68 | false
| &nbsp;&nbsp;&nbsp;&nbsp;If true, single words are sent to DNS, not directly to search.
| browser.newtabpage.activity-stream.default.sites | string | Thunderbird 72, ESR 68.4 | Locale dependent
| &nbsp;&nbsp;&nbsp;&nbsp;If set, a list of URLs to use as the default top sites on the new tab page.
| browser.places.importBookmarksHTML | boolean | Thunderbird 70, Thunderbird ESR 68.2
| &nbsp;&nbsp;&nbsp;&nbsp;If true, bookmarks are always imported on startup.
| browser.safebrowsing.phishing.enabled | boolean | Thunderbird 70, Thunderbird ESR 68.2 | true
| &nbsp;&nbsp;&nbsp;&nbsp;If false, phishing protection is not enabled (Not recommended)
| browser.safebrowsing.malware.enabled | boolean | Thunderbird 70, Thunderbird ESR 68.2 | true
| &nbsp;&nbsp;&nbsp;&nbsp;If false, malware protection is not enabled (Not recommended)
| browser.search.update | boolean | Thunderbird 68, Thunderbird ESR 68 | true
| &nbsp;&nbsp;&nbsp;&nbsp;If false, updates for search engines are not checked.
| browser.slowStartup.notificationDisabled | boolean | Thunderbird 70, Thunderbird ESR 68.2 | false
| &nbsp;&nbsp;&nbsp;&nbsp;If true, a notification isn't shown if startup is slow.
| browser.tabs.warnOnClose | boolean | Thunderbird 68, Thunderbird ESR 68 | true
| &nbsp;&nbsp;&nbsp;&nbsp;If false, there is no warning when the browser is closed.
| browser.taskbar.previews.enable | boolean | Thunderbird 70, Thunderbird ESR 68.2 (Windows only) | false
| &nbsp;&nbsp;&nbsp;&nbsp;If true, tab previews are shown in the Windows taskbar.
| browser.urlbar.suggest.bookmark | boolean | Thunderbird 68, Thunderbird ESR 68 | true
| &nbsp;&nbsp;&nbsp;&nbsp;If false, bookmarks aren't suggested when typing in the URL bar.
| browser.urlbar.suggest.history | boolean | Thunderbird 68, Thunderbird ESR 68 | true
| &nbsp;&nbsp;&nbsp;&nbsp;If false, history isn't suggested when typing in the URL bar.
| browser.urlbar.suggest.openpage | boolean | Thunderbird 68, Thunderbird ESR 68 | true
| &nbsp;&nbsp;&nbsp;&nbsp;If false, open tabs aren't suggested when typing in the URL bar.
| datareporting.policy.dataSubmissionPolicyBypassNotification | boolean | Thunderbird 68, Thunderbird ESR 68 | false
| &nbsp;&nbsp;&nbsp;&nbsp;If true, don't show the privacy policy tab on first run.
| dom.allow_scripts_to_close_windows | boolean | Thunderbird 70, Thunderbird ESR 68.2 | false
| &nbsp;&nbsp;&nbsp;&nbsp;If false, web page can close windows.
| dom.disable_window_flip | boolean | Thunderbird 68, Thunderbird ESR 68 | true
| &nbsp;&nbsp;&nbsp;&nbsp;If false, web pages can focus and activate windows.
| dom.disable_window_move_resize | boolean | Thunderbird 68, Thunderbird ESR 68 | false
| &nbsp;&nbsp;&nbsp;&nbsp;If true, web pages can't move or resize windows.
| dom.event.contextmenu.enabled | boolean | Thunderbird 68, Thunderbird ESR 68 | true
| &nbsp;&nbsp;&nbsp;&nbsp;If false, web pages can't override context menus.
| dom.keyboardevent.keypress.hack.dispatch_non_printable_keys.addl | string | Thunderbird 68, Thunderbird ESR 68 | N/A
| &nbsp;&nbsp;&nbsp;&nbsp;See https://support.mozilla.org/en-US/kb/dom-events-changes-introduced-firefox-66
| dom.keyboardevent.keypress.hack.use_legacy_keycode_and_charcode.addl | string | Thunderbird 68, Thunderbird ESR 68 | N/A
| &nbsp;&nbsp;&nbsp;&nbsp;See https://support.mozilla.org/en-US/kb/dom-events-changes-introduced-firefox-66
| dom.xmldocument.load.enabled | boolean | Thunderbird ESR 68.5 | true.
| &nbsp;&nbsp;&nbsp;&nbsp;If false, XMLDocument.load is not available.
| dom.xmldocument.async.enabled | boolean | Thunderbird ESR 68.5 | true
| &nbsp;&nbsp;&nbsp;&nbsp;If false, XMLDocument.async is not available.
| extensions.blocklist.enabled | boolean | Thunderbird 70, Thunderbird ESR 68.2 | true
| &nbsp;&nbsp;&nbsp;&nbsp;If false, the extensions blocklist is not used (Not recommended)
| extensions.getAddons.showPane | boolean | Thunderbird 68, Thunderbird ESR 68 | N/A
| &nbsp;&nbsp;&nbsp;&nbsp;If false, the Recommendations tab is not displayed in the Add-ons Manager.
| extensions.htmlaboutaddons.recommendations.enabled | boolean | Thunderbird 72, Thunderbird ESR 68.4 | true
| &nbsp;&nbsp;&nbsp;&nbsp;If false, recommendations are not shown on the Extensions tab in the Add-ons Manager.
| geo.enabled | boolean | Thunderbird 70, Thunderbird ESR 68.2 | true
| &nbsp;&nbsp;&nbsp;&nbsp;If false, the geolocation API is disabled. | Language dependent
| intl.accept_languages | string | Thunderbird 70, Thunderbird ESR 68.2
| &nbsp;&nbsp;&nbsp;&nbsp;If set, preferred language for web pages.
| media.eme.enabled (Deprecated - Switch to EncryptedMediaExtensions policy) | boolean | Thunderbird 70, Thunderbird ESR 68.2 | true
| &nbsp;&nbsp;&nbsp;&nbsp;If false, Encrypted Media Extensions are not enabled.
| media.gmp-gmpopenh264.enabled | boolean | Thunderbird 68, Thunderbird ESR 68 | true
| &nbsp;&nbsp;&nbsp;&nbsp;If false, the OpenH264  plugin is not downloaded.
| media.gmp-widevinecdm.enabled | boolean | Thunderbird 68, Thunderbird ESR 68 | true
| &nbsp;&nbsp;&nbsp;&nbsp;If false, the Widevine plugin is not downloaded.
| media.peerconnection.enabled | boolean | Thunderbird 72, Thunderbird ESR 68.4 | true
| &nbsp;&nbsp;&nbsp;&nbsp;If false, WebRTC is disabled
| media.peerconnection.ice.obfuscate_host_addresses.whitelist | string | Thunderbird 72, Thunderbird ESR 68.4 | N/A
| &nbsp;&nbsp;&nbsp;&nbsp;If set, a list of domains for which mDNS hostname obfuscation is
disabled
| network.dns.disableIPv6 | boolean | Thunderbird 68, Thunderbird ESR 68 | false
| &nbsp;&nbsp;&nbsp;&nbsp;If true, IPv6 DNS lokoups are disabled.
| network.IDN_show_punycode | boolean | Thunderbird 68, Thunderbird ESR 68 | false
| &nbsp;&nbsp;&nbsp;&nbsp;If true, display the punycode version of internationalized domain names. 
| places.history.enabled | boolean | Thunderbird 68, Thunderbird ESR 68 | true
| &nbsp;&nbsp;&nbsp;&nbsp;If false, history is not enabled.
| print.save_print_settings | boolean | Thunderbird 70, Thunderbird ESR 68.2 | true
| &nbsp;&nbsp;&nbsp;&nbsp;If false, print settings are not saved between jobs.
| security.default_personal_cert | string | Thunderbird 68, Thunderbird ESR 68 | Ask Every Time
| &nbsp;&nbsp;&nbsp;&nbsp;If set to Select Automatically, Thunderbird automatically chooses the default personal certificate.
| security.mixed_content.block_active_content | boolean | Thunderbird 70, Thunderbird ESR 68.2 | true
| &nbsp;&nbsp;&nbsp;&nbsp;If false, mixed active content (HTTP and HTTPS) is not blocked.
| security.osclientcerts.autoload | boolean | Thunderbird 72 (Windows), Thunderbird 75 (macOS)  | false
| &nbsp;&nbsp;&nbsp;&nbsp;If true, client certificates are loaded from the operating system certificate store.
| security.ssl.errorReporting.enabled | boolean | Thunderbird 68, Thunderbird ESR 68 | true
| &nbsp;&nbsp;&nbsp;&nbsp;If false, SSL errors cannot be sent to Mozilla.
| security.tls.hello_downgrade_check | boolean | Thunderbird 72, Thunderbird ESR 68.4 | true
| &nbsp;&nbsp;&nbsp;&nbsp;If false, the TLS 1.3 downgrade check is disabled.
| ui.key.menuAccessKeyFocuses | boolean | Thunderbird 68, Thunderbird ESR 68 | true
| &nbsp;&nbsp;&nbsp;&nbsp;If false, the Alt key doesn't show the menubar on Windows.
| widget.content.gtk-theme-override | string | Thunderbird 72, Thunderbird ESR 68.4 (Linux only) | N/A
| &nbsp;&nbsp;&nbsp;&nbsp;If set, overrides the GTK theme for widgets.
#### Windows (GPO)
```
Software\Policies\Mozilla\Thunderbird\Preferences\boolean_preference_name = 0x1 | 0x0
Software\Policies\Mozilla\Thunderbird\Preferences\string_preference_name = "string_value"
```
#### Windows (Intune)
OMA-URI: (periods are replaced by underscores)
```
./Device/Vendor/MSFT/Policy/Config/Thunderbird~Policy~thunderbird~Preferences/boolean_preference_name
```
Value (string):
```
<enabled/> or <disabled/>
```
#### macOS
```
<dict>
  <key>Preferences</key>
  <dict>
    <key>boolean_preference_name</key>
    <true/> | <false/>
    <key>string_preference_name</key>
    <string>string_value</string>
  </dict>
</dict>
```
#### policies.json
```
{
  "policies": {
    "Preferences": {
      "boolean_preference_name": true | false,
      "string_preference_name": "string_value"
    }
  }
}
```
#### Compatibility

| Policy/Property Name | Compatibility Information |
| --- | --- |
| Preferences<br>Preferences_network.IDN_show_punycode<br>Preferences_browser.fixup.dns_first_for_single_words<br>Preferences_browser.cache.disk.parent_directory<br>Preferences_browser.urlbar.suggest.openpage<br>Preferences_browser.urlbar.suggest.history<br>Preferences_browser.urlbar.suggest.bookmark | {"esr68":"68.0a1"} |

  
## Proxy
Configure proxy settings. These settings correspond to the connection settings in Thunderbird preferences.
To specify ports, append them to the hostnames with a colon (:).

`Mode` is the proxy method being used.

`Locked` is whether or not proxy settings can be changed.

`HTTPProxy` is the HTTP proxy server.

`UseHTTPProxyForAllProtocols` is whether or not the HTTP proxy should be used for all other proxies.

`SSLProxy` is the SSL proxy server.

`FTPProxy` is the FTP proxy server.

`SOCKSProxy` is the SOCKS proxy server

`SOCKSVersion` is the SOCKS version (4 or 5)

`Passthrough` is list of hostnames or IP addresses that will not be proxied. Use `<local>` to bypass proxying for all hostnames which do not contain periods.

`AutoConfigURL` is a  URL for proxy configuration (only used if Mode is autoConfig).

`AutoLogin` means do not prompt for authentication if password is saved.

`UseProxyForDNS` to use proxy DNS when using SOCKS v5.

**CCK2 Equivalent:** `networkProxy*`\
**Preferences Affected:** `network.proxy.type`,`network.proxy.autoconfig_url`,`network.proxy.socks_remote_dns`,`signon.autologin.proxy`,`network.proxy.socks_version`,`network.proxy.no_proxies_on`,`network.proxy.share_proxy_settings`,`network.proxy.http`,`network.proxy.http_port`,`network.proxy.ftp`,`network.proxy.ftp_port`,`network.proxy.ssl`,`network.proxy.ssl_port`,`network.proxy.socks`,`network.proxy.socks_port`

#### Windows (GPO)
```
Software\Policies\Mozilla\Thunderbird\Proxy\Mode = "none", "system", "manual", "autoDetect", "autoConfig"
Software\Policies\Mozilla\Thunderbird\Proxy\Locked = 0x1 | 0x0
Software\Policies\Mozilla\Thunderbird\=Proxy\HTTPProxy = https://httpproxy.example.com
Software\Policies\Mozilla\Thunderbird\Proxy\UseHTTPProxyForAllProtocols = 0x1 | 0x0
Software\Policies\Mozilla\Thunderbird\Proxy\SSLProxy = https://sslproxy.example.com
Software\Policies\Mozilla\Thunderbird\Proxy\FTPProxy = https://ftpproxy.example.com
Software\Policies\Mozilla\Thunderbird\Proxy\SOCKSProxy = https://socksproxy.example.com
Software\Policies\Mozilla\Thunderbird\Proxy\SOCKSVersion = 0x4 | 0x5
Software\Policies\Mozilla\Thunderbird\Proxy\Passthrough = <local>
Software\Policies\Mozilla\Thunderbird\Proxy\AutoConfigURL = URL_TO_AUTOCONFIG
Software\Policies\Mozilla\Thunderbird\Proxy\AutoLogin = 0x1 | 0x0
Software\Policies\Mozilla\Thunderbird\Proxy\UseProxyForDNS = 0x1 | 0x0
```
#### Windows (Intune)
OMA-URI:
```
./Device/Vendor/MSFT/Policy/Config/Thunderbird~Policy~thunderbird/Proxy
```
Value (string):
```
<enabled/>
<data id="ProxyLocked" value="true | false"/>
<data id="ConnectionType" value="none | system | manual | autoDetect | autoConfig"/>
<data id="HTTPProxy" value="https://httpproxy.example.com"/>
<data id="UseHTTPProxyForAllProtocols" value="true | false"/>
<data id="SSLProxy" value="https://sslproxy.example.com"/>
<data id="FTPProxy" value="https://ftpproxy.example.com"/>
<data id="SOCKSProxy" value="https://socksproxy.example.com"/>
<data id="SOCKSVersion" value="4 | 5"/>
<data id="AutoConfigURL" value="URL_TO_AUTOCONFIG"/>
<data id="Passthrough" value="<local>"/>
<data id="AutoLogin" value="true | false"/>
<data id="UseProxyForDNS" value="true | false"/>
```
#### macOS
```
<dict>
  <key>Proxy</key>
  <dict>
    <key>Mode</key>
    <string>none | system | manual | autoDetect | autoConfig</string>
    <key>Locked</key>
    <true> | </false>
    <key>HTTPProxy</key>
    <string>https://httpproxy.example.com</string>
    <key>UseHTTPProxyForAllProtocols</key>
    <true> | </false>
    <key>SSLProxy</key>
    <string>https://sslproxy.example.com</string>
    <key>FTPProxy</key>
    <string>https://ftpproxy.example.com</string>
    <key>SOCKSProxy</key>
    <string>https://socksproxy.example.com</string>
    <key>SOCKSVersion</key>
    <string>4 | 5</string>
    <key>Passthrough</key>
    <string>&lt;local>&gt;</string>
    <key>AutoConfigURL</key>
    <string>URL_TO_AUTOCONFIG</string>
    <key>AutoLogin</key>
    <true> | </false>
    <key>UseProxyForDNS</key>
    <true> | </false>
  </dict>
</dict>
```
#### policies.json
```
{
  "policies": {
    "Proxy": {
      "Mode": "none", "system", "manual", "autoDetect", "autoConfig",
      "Locked": true | false,
      "HTTPProxy": "hostname",
      "UseHTTPProxyForAllProtocols": true | false,
      "SSLProxy": "hostname",
      "FTPProxy": "hostname",
      "SOCKSProxy": "hostname",
      "SOCKSVersion": 4 | 5
      "Passthrough": "<local>",
      "AutoConfigURL": "URL_TO_AUTOCONFIG",
      "AutoLogin": true | false,
      "UseProxyForDNS": true | false
    }
  }
}
```
#### Compatibility

| Policy/Property Name | Compatibility Information |
| --- | --- |
| Proxy<br>Proxy_Mode<br>Proxy_Locked<br>Proxy_AutoConfigURL<br>Proxy_FTPProxy<br>Proxy_HTTPProxy<br>Proxy_SSLProxy<br>Proxy_SOCKSProxy<br>Proxy_SOCKSVersion<br>Proxy_UseHTTPProxyForAllProtocols<br>Proxy_Passthrough<br>Proxy_UseProxyForDNS<br>Proxy_AutoLogin | {"esr68":"68.0a1"} |

  
## RequestedLocales
Set the the list of requested locales for the application in order of preference. It will cause the corresponding language pack to become active.

Note: For Thunderbird 68, this can now be a string so that you can specify an empty value.

**CCK2 Equivalent:** N/A\
**Preferences Affected:** N/A
#### Windows (GPO)
```
Software\Policies\Mozilla\Thunderbird\RequestedLocales\1 = "de"
Software\Policies\Mozilla\Thunderbird\RequestedLocales\2 = "en-US"

or

Software\Policies\Mozilla\Thunderbird\RequestedLocales = "de,en-US"
```
#### Windows (Intune)
OMA-URI:
```
./Device/Vendor/MSFT/Policy/Config/Thunderbird~Policy~thunderbird/RequestedLocalesString
```
Value (string):
```
<enabled/>
<data id="Preferences_String" value="de,en-US"/>
```
#### macOS
```
<dict>
  <key>RequestedLocales</key>
  <array>
    <string>de</string>
    <string>en-US</string>
  </array>
</dict>

or

<dict>
  <key>RequestedLocales</key>
  <string>de,en-US</string>
</dict>

```
#### policies.json
```
{
  "policies": {
    "RequestedLocales": ["de", "en-US"]
  }
}

or

{
  "policies": {
    "RequestedLocales": "de,en-US"
  }
}
```
<a name="SanitizeOnShutdown"></a>

#### Compatibility

| Policy/Property Name | Compatibility Information |
| --- | --- |
| RequestedLocales | {"esr68":"68.0a1"} |

  
## SSLVersionMax

Set and lock the maximum version of TLS.

**CCK2 Equivalent:** N/A\
**Preferences Affected:** `security.tls.version.max`

#### Windows (GPO)
```
Software\Policies\Mozilla\Thunderbird\SSLVersionMax = "tls1" | "tls1.1" | "tls1.2" | "tls1.3"
```
#### Windows (Intune)
OMA-URI:
```
./Device/Vendor/MSFT/Policy/Config/Thunderbird~Policy~thunderbird/SSLVersionMax
```
Value (string):
```
<enabled/>
<data id="SSLVersion" value="tls1 | tls1.2 | tls1.3"/>
```
#### macOS
```
<dict>
  <key>SSLVersionMax</key>
  <string>tls1 | tls1.1 | tls1.2 | tls1.3</string>
</dict>
```

#### policies.json
```
{
  "policies": {
    "SSLVersionMax": "tls1" | "tls1.1" | "tls1.2" | "tls1.3"
  }
}
```
#### Compatibility

| Policy/Property Name | Compatibility Information |
| --- | --- |
| SSLVersionMax | {"esr68":"68.0a1"} |

  
## SSLVersionMin

Set and lock the minimum version of TLS.

**CCK2 Equivalent:** N/A\
**Preferences Affected:** `security.tls.version.min`

#### Windows (GPO)
```
Software\Policies\Mozilla\Thunderbird\SSLVersionMin = "tls1" | "tls1.1" | "tls1.2" | "tls1.3"
```
#### Windows (Intune)
OMA-URI:
```
./Device/Vendor/MSFT/Policy/Config/Thunderbird~Policy~thunderbird/SSLVersionMin
```
Value (string):
```
<enabled/>
<data id="SSLVersion" value="tls1 | tls1.2 | tls1.3"/>
```
#### macOS
```
<dict>
  <key>SSLVersionMin</key>
  <string>tls1 | tls1.1 | tls1.2 | tls1.3</string>
</dict>
```

#### policies.json
```
{
  "policies": {
    "SSLVersionMin": "tls1" | "tls1.1" | "tls1.2" | "tls1.3"
  }
}
```
#### Compatibility

| Policy/Property Name | Compatibility Information |
| --- | --- |
| SSLVersionMin | {"esr68":"68.0a1"} |

  

