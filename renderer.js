/**
 * OM-System Custom Settings Configurator
 * 
 * @author Trevor Jager
 * @copyright (c) 2024 JTK Labs and Trevor Jager Photography. All rights reserved.
 * @license All Rights Reserved
 */

// Global state to store configurations
let configurations = [null, null, null, null];
let configFilePaths = ['', '', '', ''];
let menuStructure = null; // Store the menu structure from the configuration file
let aboutContent = null; // Store the about content
let licenseContent = null; // Store the license content
let showCopyIcons = true; // Default to showing row copy icons
let showMenuCopyIcons = true; // Default to showing menu copy icons
let showConfigSection = true; // Default to showing configuration selection boxes

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

    // About modal functionality
    const aboutModal = document.getElementById('about-modal');
    const aboutCloseButton = aboutModal.querySelector('.close');

    // Close the modal when the close button is clicked
    aboutCloseButton.addEventListener('click', () => {
        aboutModal.style.display = 'none';
    });

    // Close the modal when clicking outside of it
    window.addEventListener('click', (event) => {
        if (event.target === aboutModal) {
            aboutModal.style.display = 'none';
        }
    });

    // License modal functionality
    const licenseModal = document.getElementById('license-modal');
    const licenseCloseButton = licenseModal.querySelector('.close');

    // Close the modal when the close button is clicked
    licenseCloseButton.addEventListener('click', () => {
        licenseModal.style.display = 'none';
    });

    // Close the modal when clicking outside of it
    window.addEventListener('click', (event) => {
        if (event.target === licenseModal) {
            licenseModal.style.display = 'none';
        }
    });

    // Listen for show-about event from main process
    window.api.onShowAbout(() => {
        showAboutModal();
    });

    // Listen for show-license event from main process
    window.api.onShowLicense(() => {
        showLicenseModal();
    });

    // Add a button to show the Settings modal
    const settingsButton = document.createElement('button');
    settingsButton.textContent = 'Settings';
    settingsButton.addEventListener('click', showSettingsModal);
    document.querySelector('.actions').appendChild(settingsButton);

    // Add a button to show the About modal
    const aboutButton = document.createElement('button');
    aboutButton.textContent = 'About';
    aboutButton.addEventListener('click', showAboutModal);
    document.querySelector('.actions').appendChild(aboutButton);

    // Add a button to show the License modal
    const licenseButton = document.createElement('button');
    licenseButton.textContent = 'License';
    licenseButton.addEventListener('click', showLicenseModal);
    document.querySelector('.actions').appendChild(licenseButton);

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

        // Add tooltip to send-to-icon
        setupTooltip(sendToIcons[i], 'Copy settings from this column to the selected destination');
    }

    // Initialize with default configurations
    initializeConfigurations();

    // Initialize tooltips for all copy icons after the table is rendered
    document.addEventListener('tableRendered', initializeTooltips);

    // Initialize copy icons visibility
    window.api.getShowCopyIcons().then(value => {
        showCopyIcons = value;
        updateCopyIconsVisibility();
    });

    // Initialize menu copy icons visibility
    window.api.getShowMenuCopyIcons().then(value => {
        showMenuCopyIcons = value;
        updateCopyIconsVisibility();
    });

    // Initialize config section visibility
    window.api.getShowConfigSection().then(value => {
        showConfigSection = value;
        updateCopyIconsVisibility();
    });

    // Listen for changes to the copy icons visibility setting
    window.api.onToggleCopyIcons(value => {
        showCopyIcons = value;
        updateCopyIconsVisibility();
    });

    // Listen for changes to the menu copy icons visibility setting
    window.api.onToggleMenuCopyIcons(value => {
        showMenuCopyIcons = value;
        updateCopyIconsVisibility();
    });

    // Listen for changes to the config section visibility setting
    window.api.onToggleConfigSection(value => {
        showConfigSection = value;
        updateCopyIconsVisibility();
    });

    // Listen for show-settings event from main process
    window.api.onShowSettings(() => {
        showSettingsModal();
    });
});

// Function to update the visibility of copy icons and configuration section based on the settings
function updateCopyIconsVisibility() {
    // Update the visibility of setting copy icons (row icons)
    document.querySelectorAll('.copy-setting-icon').forEach(icon => {
        icon.style.display = showCopyIcons ? 'inline-block' : 'none';
    });

    // Update the visibility of menu copy icons (expandable title row icons)
    document.querySelectorAll('.copy-menu-icon').forEach(icon => {
        icon.style.display = showMenuCopyIcons ? 'inline-block' : 'none';
    });

    // Update the visibility of the configuration selection boxes section
    const columnsContainer = document.querySelector('.columns-container');
    const toggleIcon = document.querySelector('.toggle-config-section');
    const configSectionHeader = document.getElementById('config-section-toggle');

    if (showConfigSection) {
        // Show the section
        columnsContainer.classList.remove('collapsed');
        toggleIcon.textContent = '-';
        configSectionHeader.style.display = 'flex'; // Show the header
    } else {
        // Hide the section
        columnsContainer.classList.add('collapsed');
        toggleIcon.textContent = '+';
        configSectionHeader.style.display = 'none'; // Hide the header
    }
}

// Function to initialize tooltips for all copy icons
function initializeTooltips() {
    // Setup tooltips for menu copy icons
    document.querySelectorAll('.copy-menu-icon').forEach(icon => {
        setupTooltip(icon, icon.title || 'Copy all settings in this section from column 1 to columns 2-4');
    });

    // Setup tooltips for setting copy icons
    document.querySelectorAll('.copy-setting-icon').forEach(icon => {
        setupTooltip(icon, icon.title || 'Copy this setting from column 1 to columns 2-4');
    });

    // Setup tooltips for send-to icons
    document.querySelectorAll('.send-to-icon').forEach(icon => {
        setupTooltip(icon, icon.title || 'Copy settings from this column to the selected destination');
    });

    // Setup tooltips for load icons
    document.querySelectorAll('.load-icon').forEach(icon => {
        const columnIndex = parseInt(icon.dataset.column);
        setupTooltip(icon, icon.title || `Load configuration for Custom ${columnIndex + 1}`);
    });

    // Setup tooltips for save icons
    document.querySelectorAll('.save-icon').forEach(icon => {
        const columnIndex = parseInt(icon.dataset.column);
        setupTooltip(icon, icon.title || `Save configuration for Custom ${columnIndex + 1}`);
    });

    // Setup tooltips for load-all and save-all icons
    const loadAllIcon = document.querySelector('.load-all-icon');
    if (loadAllIcon) {
        setupTooltip(loadAllIcon, loadAllIcon.title || 'Load all configurations from a single file');
    }

    const saveAllIcon = document.querySelector('.save-all-icon');
    if (saveAllIcon) {
        setupTooltip(saveAllIcon, saveAllIcon.title || 'Save all configurations to a single file');
    }
}

// Function to setup a tooltip for an element
function setupTooltip(element, text) {
    // Remove any existing tooltip
    const existingTooltip = element.querySelector('.custom-tooltip');
    if (existingTooltip) {
        existingTooltip.remove();
    }

    // Create tooltip element
    const tooltip = document.createElement('div');
    tooltip.className = 'custom-tooltip';
    tooltip.textContent = text;
    element.appendChild(tooltip);

    let tooltipTimer;

    // Show tooltip after 2 seconds of hovering
    element.addEventListener('mouseenter', () => {
        tooltipTimer = setTimeout(() => {
            tooltip.classList.add('show');
        }, 2000); // 2 seconds delay
    });

    // Hide tooltip when mouse leaves
    element.addEventListener('mouseleave', () => {
        clearTimeout(tooltipTimer);
        tooltip.classList.remove('show');
    });

    // Hide tooltip when clicked
    element.addEventListener('click', () => {
        clearTimeout(tooltipTimer);
        tooltip.classList.remove('show');
    });
}

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

        // Create a container for the menu name and copy icon
        const menuContainer = document.createElement('div');
        menuContainer.className = 'menu-container';

        // Add the expand icon and menu name
        const menuContent = document.createElement('div');
        menuContent.innerHTML = `<span class="expand-icon">+</span>${menuName}`;
        menuContainer.appendChild(menuContent);

        // Add a different colored arrow icon for copying all settings in this menu from column 1 to columns 2-4
        const menuCopyIcon = document.createElement('span');
        menuCopyIcon.className = 'copy-menu-icon';
        menuCopyIcon.innerHTML = '🔄';
        menuCopyIcon.title = 'Copy all settings in this section from column 1 to columns 2-4';
        menuCopyIcon.dataset.menu = menuName;

        // Add event listener to copy all settings in this menu from column 1 to columns 2-4
        menuCopyIcon.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent event bubbling
            copyMenuSettingsFromColumn1(menuName);
        });

        // Setup tooltip for menu copy icon
        setupTooltip(menuCopyIcon, menuCopyIcon.title);

        menuContainer.appendChild(menuCopyIcon);
        menuCell.appendChild(menuContainer);
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

            // If this setting has radio button options, add an arrow icon to copy from column 1 to others
            if (hasOptions) {
                const settingContainer = document.createElement('div');
                settingContainer.className = 'setting-container';

                const settingText = document.createElement('span');
                settingText.textContent = settingName;
                settingContainer.appendChild(settingText);

                const arrowIcon = document.createElement('span');
                arrowIcon.className = 'copy-setting-icon';
                arrowIcon.innerHTML = '➡️';
                arrowIcon.title = 'Copy this setting from column 1 to columns 2-4';
                arrowIcon.dataset.menu = menuName;
                arrowIcon.dataset.setting = settingName;

                // Add event listener to copy this setting from column 1 to columns 2-4
                arrowIcon.addEventListener('click', (event) => {
                    event.stopPropagation(); // Prevent event bubbling
                    copySettingFromColumn1(menuName, settingName);
                });

                // Setup tooltip for setting copy icon
                setupTooltip(arrowIcon, arrowIcon.title);

                settingContainer.appendChild(arrowIcon);
                settingCell.appendChild(settingContainer);
            } else {
                settingCell.textContent = settingName;
            }

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

    // Dispatch an event to indicate that the table has been rendered
    document.dispatchEvent(new CustomEvent('tableRendered'));

    // Update the visibility of copy icons based on the setting
    updateCopyIconsVisibility();
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

    // Update the global variable
    showConfigSection = !isExpanded;

    // Update the UI
    if (isExpanded) {
        // Collapse the section
        columnsContainer.classList.add('collapsed');
        toggleIcon.textContent = '+';
    } else {
        // Expand the section
        columnsContainer.classList.remove('collapsed');
        toggleIcon.textContent = '-';
    }

    // Save the state to electron-store for persistence
    saveSettings({ showConfigSection: !isExpanded });
}

// Initialize configuration section state
function initConfigSectionState() {
    // Note: The actual state will be initialized from electron-store via the getShowConfigSection() call
    // This function is now just a placeholder that will be called before the state is loaded
    // The updateCopyIconsVisibility function will handle the actual UI update once the state is loaded
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

// Function to copy a specific setting from column 1 to columns 2-4
function copySettingFromColumn1(menuName, settingName) {
    // Get the value from column 1
    const sourceConfig = configurations[0];

    if (!sourceConfig || !sourceConfig[menuName] || !sourceConfig[menuName][settingName]) {
        alert('Source setting is not available in column 1.');
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

    // Get the value to copy
    const settingValue = sourceConfig[menuName][settingName];

    // Copy to columns 2-4
    for (let i = 1; i < 4; i++) {
        // Ensure the menu exists in the target configuration
        if (!configurations[i][menuName]) {
            configurations[i][menuName] = {};
        }

        // Copy the setting value
        configurations[i][menuName][settingName] = settingValue;

        // Auto-save if the configuration has a file path
        if (configFilePaths[i]) {
            autoSaveConfiguration(i);
        }
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

    // Show a confirmation message
    alert(`Setting "${settingName}" copied from column 1 to columns 2-4.`);
}

// Function to copy all settings from a specific menu in column 1 to columns 2-4
function copyMenuSettingsFromColumn1(menuName) {
    // Get the source configuration
    const sourceConfig = configurations[0];

    if (!sourceConfig || !sourceConfig[menuName]) {
        alert(`Menu "${menuName}" is not available in column 1.`);
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

    // Get all settings in this menu from column 1
    const menuSettings = sourceConfig[menuName];

    // Copy to columns 2-4
    for (let i = 1; i < 4; i++) {
        // Ensure the menu exists in the target configuration
        if (!configurations[i][menuName]) {
            configurations[i][menuName] = {};
        }

        // Copy all settings in this menu
        for (const settingName in menuSettings) {
            configurations[i][menuName][settingName] = JSON.parse(JSON.stringify(menuSettings[settingName]));
        }

        // Auto-save if the configuration has a file path
        if (configFilePaths[i]) {
            autoSaveConfiguration(i);
        }
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

    // Show a confirmation message
    alert(`All settings in "${menuName}" copied from column 1 to columns 2-4.`);
}

// Settings modal event handlers
let settingsModalEventHandlersAttached = false;
const settingsModalHandlers = {
    closeButton: null,
    windowClick: null,
    rowCopyIconsSwitch: null,
    menuCopyIconsSwitch: null,
    configSectionSwitch: null
};

// Function to show the Settings modal
function showSettingsModal() {
    const settingsModal = document.getElementById('settings-modal');
    const closeButton = settingsModal.querySelector('.close');
    const rowCopyIconsSwitch = document.getElementById('show-row-copy-icons');
    const menuCopyIconsSwitch = document.getElementById('show-menu-copy-icons');
    const configSectionSwitch = document.getElementById('show-config-section');

    // Initialize the switches with the current settings
    rowCopyIconsSwitch.checked = showCopyIcons;
    menuCopyIconsSwitch.checked = showMenuCopyIcons;
    configSectionSwitch.checked = showConfigSection;

    // Show the modal
    settingsModal.style.display = 'block';

    // Attach event handlers if not already attached
    if (!settingsModalEventHandlersAttached) {
        // Define event handlers
        settingsModalHandlers.closeButton = () => {
            settingsModal.style.display = 'none';
        };

        settingsModalHandlers.windowClick = (event) => {
            if (event.target === settingsModal) {
                settingsModal.style.display = 'none';
            }
        };

        settingsModalHandlers.rowCopyIconsSwitch = () => {
            const newValue = rowCopyIconsSwitch.checked;
            saveSettings({ showCopyIcons: newValue });
        };

        settingsModalHandlers.menuCopyIconsSwitch = () => {
            const newValue = menuCopyIconsSwitch.checked;
            saveSettings({ showMenuCopyIcons: newValue });
        };

        settingsModalHandlers.configSectionSwitch = () => {
            const newValue = configSectionSwitch.checked;
            saveSettings({ showConfigSection: newValue });
        };

        // Attach event handlers
        closeButton.addEventListener('click', settingsModalHandlers.closeButton);
        window.addEventListener('click', settingsModalHandlers.windowClick);
        rowCopyIconsSwitch.addEventListener('change', settingsModalHandlers.rowCopyIconsSwitch);
        menuCopyIconsSwitch.addEventListener('change', settingsModalHandlers.menuCopyIconsSwitch);
        configSectionSwitch.addEventListener('change', settingsModalHandlers.configSectionSwitch);

        settingsModalEventHandlersAttached = true;
    }
}

// Function to save settings
async function saveSettings(settings) {
    try {
        const result = await window.api.saveSettings(settings);
        if (!result.success) {
            console.error('Failed to save settings:', result.message);
        }
    } catch (error) {
        console.error('Error saving settings:', error);
    }
}

// Function to show the About modal
async function showAboutModal() {
    const aboutModal = document.getElementById('about-modal');
    const aboutContentElement = document.getElementById('about-content');

    // Show the modal
    aboutModal.style.display = 'block';

    // Load the content if it hasn't been loaded yet
    if (!aboutContent) {
        try {
            const result = await window.api.getAboutContent();
            if (result.success) {
                aboutContent = result.data;
            } else {
                aboutContent = 'Failed to load about content: ' + result.message;
            }
        } catch (error) {
            aboutContent = 'Error loading about content: ' + error.message;
        }
    }

    // Convert markdown to HTML (simple conversion for basic markdown)
    let htmlContent = convertMarkdownToHtml(aboutContent);

    // Set the content
    aboutContentElement.innerHTML = htmlContent;
}

// Function to show the License modal
async function showLicenseModal() {
    const licenseModal = document.getElementById('license-modal');
    const licenseContentElement = document.getElementById('license-content');

    // Show the modal
    licenseModal.style.display = 'block';

    // Load the content if it hasn't been loaded yet
    if (!licenseContent) {
        try {
            const result = await window.api.getLicenseContent();
            if (result.success) {
                licenseContent = result.data;
            } else {
                licenseContent = 'Failed to load license content: ' + result.message;
            }
        } catch (error) {
            licenseContent = 'Error loading license content: ' + error.message;
        }
    }

    // Convert markdown to HTML (simple conversion for basic markdown)
    let htmlContent = convertMarkdownToHtml(licenseContent);

    // Set the content
    licenseContentElement.innerHTML = htmlContent;
}

// Simple function to convert markdown to HTML
function convertMarkdownToHtml(markdown) {
    // Replace headers
    let html = markdown
        .replace(/^# (.*$)/gm, '<h1>$1</h1>')
        .replace(/^## (.*$)/gm, '<h2>$1</h2>')
        .replace(/^### (.*$)/gm, '<h3>$1</h3>')
        .replace(/^#### (.*$)/gm, '<h4>$1</h4>');

    // Replace bold text
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Replace bullet points
    html = html.replace(/^\* (.*$)/gm, '<li>$1</li>');

    // Wrap lists in <ul> tags
    html = html.replace(/<li>.*?<\/li>/gs, function(match) {
        return '<ul>' + match + '</ul>';
    });

    // Replace multiple <ul></ul> with a single pair
    html = html.replace(/<\/ul>\s*<ul>/g, '');

    // Replace newlines with <br> tags
    html = html.replace(/\n/g, '<br>');

    return html;
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

    /* Menu container with copy icon */
    .menu-container {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .copy-menu-icon {
        cursor: pointer;
        margin-left: 8px;
        opacity: 0.7;
        transition: opacity 0.2s;
        color: #e74c3c; /* Red color to distinguish from setting copy icon */
        font-size: 16px;
        position: relative;
    }

    .copy-menu-icon:hover {
        opacity: 1;
        transform: scale(1.1);
    }

    /* Setting container with arrow icon */
    .setting-container {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .copy-setting-icon {
        cursor: pointer;
        margin-left: 8px;
        opacity: 0.7;
        transition: opacity 0.2s;
        position: relative;
    }

    .copy-setting-icon:hover {
        opacity: 1;
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

    /* Custom tooltip styles */
    .custom-tooltip {
        position: absolute;
        background-color: #333;
        color: #fff;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 14px;
        z-index: 1000;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s, visibility 0.3s;
        white-space: nowrap;
        pointer-events: none;
        bottom: 125%;
        left: 50%;
        transform: translateX(-50%);
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
    }

    .custom-tooltip::after {
        content: '';
        position: absolute;
        top: 100%;
        left: 50%;
        margin-left: -5px;
        border-width: 5px;
        border-style: solid;
        border-color: #333 transparent transparent transparent;
    }

    .custom-tooltip.show {
        opacity: 1;
        visibility: visible;
    }

    /* Position the tooltip for send-to-icon */
    .send-to-icon {
        position: relative;
    }
</style>
`);
