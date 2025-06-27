// Global state to store configurations
let configurations = [null, null, null, null];
let configFilePaths = ['', '', '', ''];
let menuStructure = null; // Store the menu structure from the configuration file

// DOM elements
document.addEventListener('DOMContentLoaded', () => {
    // Initialize event listeners
    document.getElementById('new-config').addEventListener('click', createNewConfig);
    document.getElementById('load-config').addEventListener('click', loadConfigToSelected);
    document.getElementById('save-config').addEventListener('click', saveSelectedConfig);

    // Expand/Collapse All buttons
    document.getElementById('expand-all').addEventListener('click', expandAllMenus);
    document.getElementById('collapse-all').addEventListener('click', collapseAllMenus);

    // Configuration section toggle
    document.getElementById('config-section-toggle').addEventListener('click', toggleConfigSection);

    // Initialize configuration section state from localStorage
    initConfigSectionState();

    // Column-specific load/save buttons
    const loadButtons = document.querySelectorAll('.load-column');
    const saveButtons = document.querySelectorAll('.save-column');

    for (let i = 0; i < loadButtons.length; i++) {
        loadButtons[i].addEventListener('click', () => loadConfigToColumn(i));
        saveButtons[i].addEventListener('click', () => saveColumnConfig(i));
    }

    // Column header icons for load/save
    const loadIcons = document.querySelectorAll('.load-icon');
    const saveIcons = document.querySelectorAll('.save-icon');

    for (let i = 0; i < loadIcons.length; i++) {
        loadIcons[i].addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent event bubbling
            const columnIndex = parseInt(event.target.dataset.column);
            loadConfigToColumn(columnIndex);
        });
    }

    for (let i = 0; i < saveIcons.length; i++) {
        saveIcons[i].addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent event bubbling
            const columnIndex = parseInt(event.target.dataset.column);
            saveColumnConfig(columnIndex);
        });
    }

    // Load All and Save All icons
    const loadAllIcon = document.querySelector('.load-all-icon');
    const saveAllIcon = document.querySelector('.save-all-icon');

    if (loadAllIcon) {
        loadAllIcon.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent event bubbling
            loadAllConfigs();
        });
    }

    if (saveAllIcon) {
        saveAllIcon.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent event bubbling
            saveAllConfigs();
        });
    }

    // Copy To functionality
    const sendToIcons = document.querySelectorAll('.send-to-icon');

    for (let i = 0; i < sendToIcons.length; i++) {
        sendToIcons[i].addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent event bubbling
            const sourceColumnIndex = parseInt(event.target.dataset.column);
            const selectElement = document.querySelector(`.copy-to-select[data-column="${sourceColumnIndex}"]`);
            const targetValue = selectElement.value;

            if (targetValue) {
                copyColumnSettings(sourceColumnIndex, targetValue);
                // Reset the dropdown to the default option
                selectElement.selectedIndex = 0;
            } else {
                alert('Please select a destination column first.');
            }
        });
    }

    // Initialize with default configurations
    initializeConfigurations();
});

// Initialize all configurations with default structure
async function initializeConfigurations() {
    try {
        // Load menu structure first
        const menuStructureResult = await window.api.getMenuStructure();
        if (menuStructureResult.success) {
            menuStructure = menuStructureResult.data;
        } else {
            console.error('Failed to load menu structure:', menuStructureResult.message);
            alert('Failed to load menu structure: ' + menuStructureResult.message);
            return;
        }

        // Then load default configuration
        const defaultConfig = await window.api.getDefaultConfig();

        for (let i = 0; i < 4; i++) {
            configurations[i] = JSON.parse(JSON.stringify(defaultConfig)); // Deep clone
        }

        renderSettingsTable();
    } catch (error) {
        console.error('Failed to initialize configurations:', error);
        alert('Failed to initialize configurations: ' + error.message);
    }
}

// Create a new configuration in the selected column
function createNewConfig() {
    const columnIndex = getSelectedColumnIndex();
    if (columnIndex === -1) {
        alert('Please select a configuration column first.');
        return;
    }

    window.api.getDefaultConfig().then(defaultConfig => {
        configurations[columnIndex] = JSON.parse(JSON.stringify(defaultConfig));
        configFilePaths[columnIndex] = '';
        renderSettingsTable();
    });
}

// Load a configuration from file to the selected column
function loadConfigToSelected() {
    const columnIndex = getSelectedColumnIndex();
    if (columnIndex === -1) {
        alert('Please select a configuration column first.');
        return;
    }

    loadConfigToColumn(columnIndex);
}

// Load a configuration to a specific column
function loadConfigToColumn(columnIndex) {
    window.api.loadConfig().then(result => {
        if (result.success) {
            configurations[columnIndex] = result.data;
            configFilePaths[columnIndex] = result.filePath;
            renderSettingsTable();
        } else if (result.message !== 'Load cancelled') {
            alert('Failed to load configuration: ' + result.message);
        }
    });
}

// Save the selected configuration
function saveSelectedConfig() {
    const columnIndex = getSelectedColumnIndex();
    if (columnIndex === -1) {
        alert('Please select a configuration column first.');
        return;
    }

    saveColumnConfig(columnIndex);
}

// Save a specific column's configuration
function saveColumnConfig(columnIndex) {
    const config = configurations[columnIndex];
    const fileName = configFilePaths[columnIndex] || `config_${columnIndex + 1}.json`;

    window.api.saveConfig(config, fileName).then(result => {
        if (result.success) {
            configFilePaths[columnIndex] = result.filePath;
            alert('Configuration saved successfully!');
        } else if (result.message !== 'Save cancelled') {
            alert('Failed to save configuration: ' + result.message);
        }
    });
}

// Get the currently selected column index
function getSelectedColumnIndex() {
    const columns = document.querySelectorAll('.column');
    for (let i = 0; i < columns.length; i++) {
        if (columns[i].classList.contains('selected')) {
            return i;
        }
    }
    return -1;
}

// Render the settings table with all configurations
function renderSettingsTable() {
    const tableBody = document.getElementById('settings-body');
    tableBody.innerHTML = '';

    // Only proceed if we have configurations and menu structure
    if (!configurations[0] || !menuStructure) return;

    // Create rows for each menu in the menu structure
    for (const menuName in menuStructure) {
        // Create menu row
        const menuRow = document.createElement('tr');
        menuRow.className = 'menu-row';
        menuRow.dataset.menu = menuName;

        const menuCell = document.createElement('td');
        menuCell.innerHTML = `<span class="expand-icon">+</span>${menuName}`;
        menuRow.appendChild(menuCell);

        // Add empty cells for each configuration
        for (let i = 0; i < 4; i++) {
            const cell = document.createElement('td');
            menuRow.appendChild(cell);
        }

        tableBody.appendChild(menuRow);

        // Create setting rows for this menu based on menu structure
        const settingNames = menuStructure[menuName];

        // Function to process a setting and create a row for it
        const processSettingName = (settingName) => {
            // Check if this setting has selectable options (array of strings/numbers)
            const settingOptions = getSettingOptions(menuName, settingName);
            const hasOptions = settingOptions && settingOptions.length > 0;

            // Skip creating rows for settings that don't have radio buttons
            // This will clean up the rendered settings area
            if (!hasOptions && settingName.includes(' - ')) {
                return;
            }

            const settingRow = document.createElement('tr');
            settingRow.className = 'setting-row';
            settingRow.dataset.menu = menuName;

            const settingCell = document.createElement('td');
            settingCell.textContent = settingName;
            settingRow.appendChild(settingCell);

            // Add cells for each configuration's setting value
            let hasDifferences = false;
            const settingValues = [];
            const rawValues = [];

            for (let i = 0; i < 4; i++) {
                const config = configurations[i];
                const rawValue = config && config[menuName] && config[menuName][settingName] 
                    ? config[menuName][settingName]
                    : '';
                const value = rawValue !== '' ? JSON.stringify(rawValue) : '';
                settingValues.push(value);
                rawValues.push(rawValue);
            }

            // Check for differences
            for (let i = 1; i < settingValues.length; i++) {
                if (settingValues[i] !== settingValues[0] && settingValues[i] !== '') {
                    hasDifferences = true;
                    break;
                }
            }

            // Add value cells
            for (let i = 0; i < 4; i++) {
                const cell = document.createElement('td');
                cell.dataset.menu = menuName;
                cell.dataset.setting = settingName;
                cell.dataset.column = i;

                if (hasOptions) {
                    // Create radio buttons for each option
                    const selectedValue = rawValues[i] || '';

                    // Create a container for the radio buttons
                    const radioContainer = document.createElement('div');
                    radioContainer.className = 'radio-container';

                    settingOptions.forEach(option => {
                        const radioId = `radio-${menuName}-${settingName}-${i}-${option}`.replace(/\s+/g, '-');

                        const radioLabel = document.createElement('label');
                        radioLabel.className = 'radio-label';
                        radioLabel.htmlFor = radioId;

                        const radioInput = document.createElement('input');
                        radioInput.type = 'radio';
                        radioInput.name = `radio-${menuName}-${settingName}-${i}`;
                        radioInput.id = radioId;
                        radioInput.value = option;
                        radioInput.checked = selectedValue === option;

                        radioInput.addEventListener('change', () => {
                            if (radioInput.checked) {
                                // Update the configuration when a radio button is selected
                                updateConfigurationValue(cell, option);
                            }
                        });

                        // Prevent click event from propagating to parent elements (like menu row)
                        radioLabel.addEventListener('click', (event) => {
                            event.stopPropagation();
                        });

                        // Also prevent propagation on the radio input itself
                        radioInput.addEventListener('click', (event) => {
                            event.stopPropagation();
                        });

                        const optionText = document.createElement('span');
                        optionText.textContent = option;

                        radioLabel.appendChild(radioInput);
                        radioLabel.appendChild(optionText);
                        radioContainer.appendChild(radioLabel);
                    });

                    cell.appendChild(radioContainer);
                } else {
                    // Make cell editable for non-option settings
                    cell.contentEditable = 'true';
                    cell.classList.add('editable');

                    // Set the cell content
                    cell.textContent = settingValues[i];

                    // Add event listeners for editing
                    cell.addEventListener('focus', onCellFocus);
                    cell.addEventListener('blur', onCellBlur);
                    cell.addEventListener('keydown', onCellKeyDown);
                }

                if (hasDifferences) {
                    cell.classList.add('different');
                }
                settingRow.appendChild(cell);
            }

            tableBody.appendChild(settingRow);
        };

        // Handle different types of menu structures
        if (Array.isArray(settingNames)) {
            // If it's an array, process each setting name directly
            for (const settingName of settingNames) {
                processSettingName(settingName);
            }
        } else if (typeof settingNames === 'object') {
            // If it's an object, process each key as a setting name
            for (const settingName in settingNames) {
                processSettingName(settingName);

                // If the setting is itself an object or array, process its children recursively
                if (typeof settingNames[settingName] === 'object' && settingNames[settingName] !== null) {
                    if (Array.isArray(settingNames[settingName])) {
                        // Skip creating rows for array items that don't have radio buttons
                        // These are typically just informational items, not selectable options
                        // For example: "Photo Quality Detailed Settings - Settings One L-SF"
                    } else {
                        // Handle object of sub-settings
                        for (const subSettingName in settingNames[settingName]) {
                            // Check if this sub-setting has selectable options
                            const subSettingOptions = getSettingOptions(menuName, `${settingName} - ${subSettingName}`);
                            const hasSubOptions = subSettingOptions && subSettingOptions.length > 0;

                            // Only create a row if it has selectable options
                            if (hasSubOptions) {
                                processSettingName(`${settingName} - ${subSettingName}`);
                            }

                            // Handle deeper nesting (e.g., Custom Mode -> C1 -> Recall)
                            if (typeof settingNames[settingName][subSettingName] === 'object' && 
                                settingNames[settingName][subSettingName] !== null) {
                                if (Array.isArray(settingNames[settingName][subSettingName])) {
                                    // Skip if it's an array of options, as these will be handled by radio buttons
                                    continue;
                                } else {
                                    // Process third-level nested objects
                                    for (const subSubSettingName in settingNames[settingName][subSettingName]) {
                                        // Check if this sub-sub-setting has selectable options
                                        const subSubSettingOptions = getSettingOptions(menuName, `${settingName} - ${subSettingName} - ${subSubSettingName}`);
                                        const hasSubSubOptions = subSubSettingOptions && subSubSettingOptions.length > 0;

                                        // Only create a row if it has selectable options
                                        if (hasSubSubOptions) {
                                            processSettingName(`${settingName} - ${subSettingName} - ${subSubSettingName}`);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Add event listeners for expanding/collapsing menu rows
    document.querySelectorAll('.menu-row').forEach(row => {
        row.addEventListener('click', toggleMenuExpansion);
    });

    // Add click event to columns for selection
    document.querySelectorAll('.column').forEach((column, index) => {
        column.addEventListener('click', () => {
            document.querySelectorAll('.column').forEach(col => col.classList.remove('selected'));
            column.classList.add('selected');
        });
    });
}

// Toggle expansion of menu rows
function toggleMenuExpansion(event) {
    const menuName = this.dataset.menu;
    const settingRows = document.querySelectorAll(`.setting-row[data-menu="${menuName}"]`);
    const expandIcon = this.querySelector('.expand-icon');

    const isExpanded = expandIcon.textContent === '-';

    expandIcon.textContent = isExpanded ? '+' : '-';

    settingRows.forEach(row => {
        if (isExpanded) {
            row.classList.remove('expanded');
        } else {
            row.classList.add('expanded');
        }
    });
}

// Expand all menus
function expandAllMenus() {
    const menuRows = document.querySelectorAll('.menu-row');

    menuRows.forEach(menuRow => {
        const menuName = menuRow.dataset.menu;
        const settingRows = document.querySelectorAll(`.setting-row[data-menu="${menuName}"]`);
        const expandIcon = menuRow.querySelector('.expand-icon');

        // Set icon to expanded state
        expandIcon.textContent = '-';

        // Show all setting rows
        settingRows.forEach(row => {
            row.classList.add('expanded');
        });
    });
}

// Collapse all menus
function collapseAllMenus() {
    const menuRows = document.querySelectorAll('.menu-row');

    menuRows.forEach(menuRow => {
        const menuName = menuRow.dataset.menu;
        const settingRows = document.querySelectorAll(`.setting-row[data-menu="${menuName}"]`);
        const expandIcon = menuRow.querySelector('.expand-icon');

        // Set icon to collapsed state
        expandIcon.textContent = '+';

        // Hide all setting rows
        settingRows.forEach(row => {
            row.classList.remove('expanded');
        });
    });
}

// Toggle configuration section expansion
function toggleConfigSection() {
    const columnsContainer = document.querySelector('.columns-container');
    const toggleIcon = this.querySelector('.toggle-config-section');

    // Check if the section is currently expanded
    const isExpanded = !columnsContainer.classList.contains('collapsed');

    if (isExpanded) {
        // Collapse the section
        columnsContainer.classList.add('collapsed');
        toggleIcon.textContent = '+';
    } else {
        // Expand the section
        columnsContainer.classList.remove('collapsed');
        toggleIcon.textContent = '-';
    }

    // Save the state to localStorage for persistence
    localStorage.setItem('configSectionExpanded', !isExpanded);
}

// Initialize configuration section state from localStorage
function initConfigSectionState() {
    const columnsContainer = document.querySelector('.columns-container');
    const toggleIcon = document.querySelector('.toggle-config-section');

    // Get saved state from localStorage (default to expanded if not set)
    const isExpanded = localStorage.getItem('configSectionExpanded') !== 'false';

    if (!isExpanded) {
        // Collapse the section
        columnsContainer.classList.add('collapsed');
        toggleIcon.textContent = '+';
    } else {
        // Expand the section (default)
        columnsContainer.classList.remove('collapsed');
        toggleIcon.textContent = '-';
    }
}

// Event handlers for editable cells
function onCellFocus(event) {
    // Store the original value to check if it changed on blur
    this.dataset.originalValue = this.textContent;
}

function onCellBlur(event) {
    // If the value changed, update the configuration
    if (this.dataset.originalValue !== this.textContent) {
        updateConfigurationValue(this);
    }
}

function onCellKeyDown(event) {
    // Handle Enter key to save and move to next cell
    if (event.key === 'Enter') {
        event.preventDefault();
        this.blur();

        // Find the next editable cell and focus it
        const allCells = Array.from(document.querySelectorAll('.editable'));
        const currentIndex = allCells.indexOf(this);
        if (currentIndex < allCells.length - 1) {
            allCells[currentIndex + 1].focus();
        }
    }
}

// Get selectable options for a setting
function getSettingOptions(menuName, settingName) {
    // Check if the setting name contains a parent-child relationship (e.g., "Parent - Child")
    if (settingName.includes(' - ')) {
        const parts = settingName.split(' - ');

        // Handle different levels of nesting
        if (parts.length === 2) {
            const parentSetting = parts[0];
            const childSetting = parts[1];

            // Check if the parent setting exists in the menu structure
            if (menuStructure[menuName] && menuStructure[menuName][parentSetting]) {
                // If the child setting is an array, return it as options
                if (Array.isArray(menuStructure[menuName][parentSetting][childSetting])) {
                    return menuStructure[menuName][parentSetting][childSetting];
                }
            }
        } else if (parts.length === 3) {
            // Handle deeper nesting (e.g., "Custom Mode - C1 - Recall")
            const grandparentSetting = parts[0];
            const parentSetting = parts[1];
            const childSetting = parts[2];

            // Check if the grandparent and parent settings exist in the menu structure
            if (menuStructure[menuName] && 
                menuStructure[menuName][grandparentSetting] && 
                menuStructure[menuName][grandparentSetting][parentSetting]) {
                // If the child setting is an array, return it as options
                if (Array.isArray(menuStructure[menuName][grandparentSetting][parentSetting][childSetting])) {
                    return menuStructure[menuName][grandparentSetting][parentSetting][childSetting];
                }
            }
        }
    } else {
        // Check if the setting exists directly in the menu structure
        if (menuStructure[menuName] && Array.isArray(menuStructure[menuName][settingName])) {
            return menuStructure[menuName][settingName];
        }
    }

    return null;
}

// Update the configuration value when a cell is edited
function updateConfigurationValue(cell, radioValue) {
    const menuName = cell.dataset.menu;
    const settingName = cell.dataset.setting;
    const columnIndex = parseInt(cell.dataset.column);
    let newValue;

    if (radioValue !== undefined) {
        // If a radio value is provided, use it directly
        newValue = radioValue;
    } else {
        // Otherwise, get the value from the cell's text content
        newValue = cell.textContent.trim();

        // Try to parse the value as JSON if it looks like a JSON string
        try {
            if (newValue.startsWith('"') && newValue.endsWith('"')) {
                // It's a string, remove the quotes
                newValue = newValue.substring(1, newValue.length - 1);
            } else if (newValue === 'true' || newValue === 'false') {
                // It's a boolean
                newValue = newValue === 'true';
            } else if (!isNaN(Number(newValue))) {
                // It's a number
                newValue = Number(newValue);
            } else if (newValue.startsWith('{') || newValue.startsWith('[')) {
                // It's a complex object or array
                newValue = JSON.parse(newValue);
            }
        } catch (error) {
            console.warn('Failed to parse value, using as string:', error);
            // If parsing fails, keep it as a string
        }
    }

    // Update the configuration
    if (!configurations[columnIndex][menuName]) {
        configurations[columnIndex][menuName] = {};
    }

    configurations[columnIndex][menuName][settingName] = newValue;

    // Auto-save the configuration if it has a file path
    if (configFilePaths[columnIndex]) {
        autoSaveConfiguration(columnIndex);
    }

    // If this is a radio button selection (radioValue is defined), don't re-render the table
    // This prevents losing the radio button selection state
    if (radioValue === undefined) {
        // Only re-render the table for text edits, not radio selections
        renderSettingsTable();
    }
}

// Auto-save configuration after a delay
let autoSaveTimers = [null, null, null, null];
function autoSaveConfiguration(columnIndex) {
    // Clear any existing timer for this column
    if (autoSaveTimers[columnIndex]) {
        clearTimeout(autoSaveTimers[columnIndex]);
    }

    // Set a new timer to save after 2 seconds of inactivity
    autoSaveTimers[columnIndex] = setTimeout(() => {
        saveColumnConfig(columnIndex);
        autoSaveTimers[columnIndex] = null;
    }, 2000);
}

// Load all configurations from a single file
function loadAllConfigs() {
    window.api.loadConfig().then(result => {
        if (result.success) {
            try {
                const allSettings = result.data;

                // Check if the loaded file contains all configurations
                if (Array.isArray(allSettings) && allSettings.length === 4) {
                    // Update all configurations
                    for (let i = 0; i < 4; i++) {
                        configurations[i] = allSettings[i];
                    }

                    // Update file paths (all pointing to the same file)
                    configFilePaths = Array(4).fill(result.filePath);

                    // Render the updated settings
                    renderSettingsTable();

                    alert('All configurations loaded successfully!');
                } else {
                    alert('Invalid all_settings.json format. Expected an array of 4 configurations.');
                }
            } catch (error) {
                alert('Failed to parse all_settings.json: ' + error.message);
            }
        } else if (result.message !== 'Load cancelled') {
            alert('Failed to load configurations: ' + result.message);
        }
    });
}

// Save all configurations to a single file
function saveAllConfigs() {
    // Create a copy of all configurations
    const allSettings = JSON.parse(JSON.stringify(configurations));

    // Save to all_settings.json
    window.api.saveConfig(allSettings, 'all_settings.json').then(result => {
        if (result.success) {
            alert('All configurations saved successfully!');
        } else if (result.message !== 'Save cancelled') {
            alert('Failed to save configurations: ' + result.message);
        }
    });
}

// Copy settings from one column to another or to all columns
function copyColumnSettings(sourceColumnIndex, targetValue) {
    // Get the source configuration
    const sourceConfig = configurations[sourceColumnIndex];

    if (!sourceConfig) {
        alert('Source configuration is not available.');
        return;
    }

    // Store the expansion state of menus before re-rendering
    const expandedMenus = [];
    document.querySelectorAll('.menu-row').forEach(menuRow => {
        const expandIcon = menuRow.querySelector('.expand-icon');
        if (expandIcon && expandIcon.textContent === '-') {
            expandedMenus.push(menuRow.dataset.menu);
        }
    });

    // Create a deep copy of the source configuration
    const sourceConfigCopy = JSON.parse(JSON.stringify(sourceConfig));

    if (targetValue === 'all') {
        // Copy to all columns except the source
        for (let i = 0; i < configurations.length; i++) {
            if (i !== sourceColumnIndex) {
                configurations[i] = JSON.parse(JSON.stringify(sourceConfigCopy));
            }
        }
        alert(`Settings from Custom ${sourceColumnIndex + 1} copied to all other columns.`);
    } else {
        // Copy to the specific target column
        const targetColumnIndex = parseInt(targetValue);
        configurations[targetColumnIndex] = JSON.parse(JSON.stringify(sourceConfigCopy));
        alert(`Settings from Custom ${sourceColumnIndex + 1} copied to Custom ${targetColumnIndex + 1}.`);
    }

    // Re-render the settings table to reflect the changes
    renderSettingsTable();

    // Restore the expansion state of menus after re-rendering
    expandedMenus.forEach(menuName => {
        const menuRow = document.querySelector(`.menu-row[data-menu="${menuName}"]`);
        if (menuRow) {
            const expandIcon = menuRow.querySelector('.expand-icon');
            const settingRows = document.querySelectorAll(`.setting-row[data-menu="${menuName}"]`);

            // Set icon to expanded state
            if (expandIcon) {
                expandIcon.textContent = '-';
            }

            // Show all setting rows for this menu
            settingRows.forEach(row => {
                row.classList.add('expanded');
            });
        }
    });
}

// Add some additional CSS for selected column, editable cells, and radio buttons
document.head.insertAdjacentHTML('beforeend', `
<style>
    .column.selected {
        border: 2px solid #0078d7;
    }

    .editable {
        cursor: pointer;
        padding: 4px;
        border: 1px solid transparent;
    }

    .editable:hover {
        background-color: #f9f9f9;
        border: 1px solid #ddd;
    }

    .editable:focus {
        outline: none;
        background-color: #f0f0f0;
        border: 1px solid #0078d7;
    }

    /* Radio button styles */
    .radio-container {
        display: flex;
        flex-direction: column;
        gap: 5px;
        padding: 4px;
    }

    .radio-label {
        display: flex;
        align-items: center;
        cursor: pointer;
        font-size: 14px;
        margin-bottom: 2px;
    }

    .radio-label input[type="radio"] {
        margin-right: 5px;
    }

    /* Highlight selected radio option */
    .radio-label input[type="radio"]:checked + span {
        font-weight: bold;
        color: #0078d7;
    }
</style>
`);
