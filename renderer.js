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

    // Column-specific load/save buttons
    const loadButtons = document.querySelectorAll('.load-column');
    const saveButtons = document.querySelectorAll('.save-column');

    for (let i = 0; i < loadButtons.length; i++) {
        loadButtons[i].addEventListener('click', () => loadConfigToColumn(i));
        saveButtons[i].addEventListener('click', () => saveColumnConfig(i));
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
        for (const settingName of settingNames) {
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

                // Make cell editable
                cell.contentEditable = 'true';
                cell.classList.add('editable');

                // Set the cell content
                cell.textContent = settingValues[i];

                // Add event listeners for editing
                cell.addEventListener('focus', onCellFocus);
                cell.addEventListener('blur', onCellBlur);
                cell.addEventListener('keydown', onCellKeyDown);

                if (hasDifferences) {
                    cell.classList.add('different');
                }
                settingRow.appendChild(cell);
            }

            tableBody.appendChild(settingRow);
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

// Update the configuration value when a cell is edited
function updateConfigurationValue(cell) {
    const menuName = cell.dataset.menu;
    const settingName = cell.dataset.setting;
    const columnIndex = parseInt(cell.dataset.column);
    let newValue = cell.textContent.trim();

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

    // Update the configuration
    if (!configurations[columnIndex][menuName]) {
        configurations[columnIndex][menuName] = {};
    }

    configurations[columnIndex][menuName][settingName] = newValue;

    // Auto-save the configuration if it has a file path
    if (configFilePaths[columnIndex]) {
        autoSaveConfiguration(columnIndex);
    }

    // Re-render the table to update highlighting for differences
    renderSettingsTable();
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

// Add some additional CSS for selected column and editable cells
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
</style>
`);
