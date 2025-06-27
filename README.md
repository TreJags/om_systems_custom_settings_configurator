# OM-System Custom Settings Configurator

A desktop application built with Electron that allows users to view and manage multiple Custom Settings configurations for OM-System cameras.

## Features

- Display four side-by-side Custom Settings columns for comparison
- Nested settings table with expandable rows
- Expandable rows reveal sub-items like "Custom Mode," "Button Settings," etc., under grouped Menus
- Automatic highlighting of rows where values differ across the four columns
- Local storage of configuration data using JSON files
- Consistent baseline structure across all configurations
- **Edit settings** directly in the table and save changes persistently
- **Auto-save** functionality for edited settings
- **Windows executable** packaging available

## Installation

1. Clone this repository:
```
git clone https://github.com/TreJags/om_systems_custom_settings_configurator.git
```

2. Navigate to the project directory:
```
cd om_systems_custom_settings_configurator
```

3. Install dependencies:
```
npm install
```

4. Start the application:
```
npm start
```

## Usage

### Managing Configurations

- **New Configuration**: Creates a new configuration with default settings in the selected column
- **Load Configuration**: Loads a configuration from a JSON file into the selected column
- **Save Configuration**: Saves the configuration from the selected column to a JSON file

### Working with the UI

1. **Select a column** by clicking on it (it will be highlighted with a blue border)
2. **Expand/collapse menu sections** by clicking on the menu row (+ to expand, - to collapse)
3. **Compare settings** across configurations - differences are highlighted in light red
4. **Load/save individual columns** using the buttons in each column header
5. **Edit settings** by clicking on any value cell and typing the new value
   - Press Enter to save and move to the next cell
   - Click outside the cell to save
   - Changes are automatically saved if the configuration has been previously saved to a file

## Configuration Structure

### Menu Structure

The menu structure is controlled by the `menu_structure.json` file, which defines the menus and their settings:

```json
{
  "Menu 1": ["Custom Mode", "Button Settings"],
  "Menu 2": ["Focus BKT", "ART BKT", "ISO BKT", "Drive", "C-AF Sensitivity"],
  "Menu 3": ["Live ND Shooting", "Focus Stacking", "Flicker Scan", "Face& Eye Detection"],
  "Menu 4": ["Interval Shooting", "Sequential Shooting Settings", "Subject Detection"],
  "Menu 5": ["Starry Sky AF Setting", "Noise Reduction", "Card Formatting", "AF Focus Adjustment"]
}
```

Any changes to this file will automatically update the list of settings displayed in the application.

### Configuration Data

The configuration data follows this structure:

```json
{
  "Menu 1": {
    "Custom Mode": { ... },
    "Button Settings": { ... }
  },
  "Menu 2": {
    "Focus BKT": { ... },
    "ART BKT": { ... },
    "ISO BKT": { ... },
    "Drive": { ... },
    "C-AF Sensitivity": { ... }
  },
  "Menu 3": {
    "Live ND Shooting": { ... },
    "Focus Stacking": { ... },
    "Flicker Scan": { ... },
    "Face& Eye Detection": { ... }
  },
  "Menu 4": {
    "Interval Shooting": { ... },
    "Sequential Shooting Settings": { ... },
    "Subject Detection": { ... }
  },
  "Menu 5": {
    "Starry Sky AF Setting": { ... },
    "Noise Reduction": { ... },
    "Card Formatting": { ... },
    "AF Focus Adjustment": { ... }
  }
}
```

See the `sample_config.json` file for a complete example.

## Development

- Main process: `main.js`
- Renderer process: `renderer.js`
- HTML UI: `index.html`
- Preload script: `preload.js`
- Sample configuration: `sample_config.json`

## Building the Executable

To build a standalone Windows executable (.exe) of the application:

1. Install development dependencies:
```
npm install
```

2. Create a Windows executable:
```
npm run build-win
```

3. The executable will be created in the `dist` folder.

You can also create an unpacked version of the application:
```
npm run pack
```

Or create a distributable package for the current platform:
```
npm run dist
```

## Author

This application was developed by Trevor Jager.

## License and Copyright

© 2024 JTK Labs and Trevor Jager Photography. All rights reserved.
This software is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited. See the [LICENSE](LICENSE) file for details.

## End User License Agreement

This software is distributed under an End User License Agreement (EULA). By using this software, you agree to the terms and conditions outlined in the [EULA](EULA.md) file.
