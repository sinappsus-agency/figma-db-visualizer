"use strict";
/// <reference types="@figma/plugin-typings" />
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// Figma plugin entry point
figma.showUI(__html__, { width: 420, height: 600 });
// Generate distinct colors for table relationships
function generateTableColor(index) {
    const colors = [
        { r: 0.2, g: 0.6, b: 1.0 }, // Blue
        { r: 1.0, g: 0.4, b: 0.4 }, // Red
        { r: 0.4, g: 0.8, b: 0.4 }, // Green
        { r: 1.0, g: 0.6, b: 0.2 }, // Orange
        { r: 0.8, g: 0.4, b: 1.0 }, // Purple
        { r: 0.2, g: 0.8, b: 0.8 }, // Cyan
        { r: 1.0, g: 0.8, b: 0.2 }, // Yellow
        { r: 1.0, g: 0.4, b: 0.8 }, // Pink
        { r: 0.6, g: 0.8, b: 0.2 }, // Lime
        { r: 0.8, g: 0.6, b: 0.4 } // Brown
    ];
    return colors[index % colors.length];
}
function parseSchema(raw) {
    try {
        const data = JSON.parse(raw);
        console.log('Parsed data:', data);
        if (data.objects && Array.isArray(data.objects)) {
            const tables = [];
            const relationships = [];
            console.log('Found', data.objects.length, 'objects');
            // Parse tables from the JSON structure
            for (const obj of data.objects) {
                console.log('Processing object:', obj.type, obj.name);
                if (obj.type === 'table' && obj.name && obj.columns) {
                    const table = {
                        name: obj.name,
                        columns: []
                    };
                    console.log('Processing table:', obj.name, 'with', obj.columns.length, 'columns');
                    // Parse columns
                    for (const col of obj.columns) {
                        if (col.name && col.type) {
                            const constraints = col.constraints
                                ? col.constraints
                                    .filter((c) => c.type)
                                    .map((c) => c.type)
                                    .join(', ')
                                : '';
                            table.columns.push({
                                name: col.name,
                                type: constraints ? `${col.type} (${constraints})` : col.type
                            });
                        }
                    }
                    console.log('Added table:', table.name, 'with', table.columns.length, 'columns');
                    tables.push(table);
                    // Extract relationships from DDL if available
                    if (obj.ddl) {
                        const foreignKeyMatches = obj.ddl.match(/REFERENCES\s+"([^"]+)"\s*\("([^"]+)"\)/g);
                        if (foreignKeyMatches) {
                            for (const match of foreignKeyMatches) {
                                const refMatch = match.match(/REFERENCES\s+"([^"]+)"\s*\("([^"]+)"\)/);
                                if (refMatch) {
                                    // Find the column that has this reference by looking backwards in the DDL
                                    const beforeRef = obj.ddl.substring(0, obj.ddl.indexOf(match));
                                    const columnMatch = beforeRef.match(/"([^"]+)"\s+[^,]*$/);
                                    if (columnMatch) {
                                        relationships.push({
                                            fromTable: obj.name,
                                            fromColumn: columnMatch[1],
                                            toTable: refMatch[1],
                                            toColumn: refMatch[2]
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
            }
            // Also check for direct relationships array in the data
            if (data.relationships && Array.isArray(data.relationships)) {
                console.log('Found direct relationships array with', data.relationships.length, 'relationships');
                for (const rel of data.relationships) {
                    if (rel.fromTable && rel.fromColumn && rel.toTable && rel.toColumn) {
                        relationships.push({
                            fromTable: rel.fromTable,
                            fromColumn: rel.fromColumn,
                            toTable: rel.toTable,
                            toColumn: rel.toColumn
                        });
                    }
                }
            }
            console.log('Final result:', tables.length, 'tables,', relationships.length, 'relationships');
            return { tables, relationships };
        }
    }
    catch (e) {
        console.error('Error parsing schema:', e);
        figma.notify('Error parsing JSON: ' + e.message);
    }
    return { tables: [], relationships: [] };
}
figma.ui.onmessage = (msg) => __awaiter(void 0, void 0, void 0, function* () {
    if (msg.type === 'draw-schema') {
        try {
            const schema = parseSchema(msg.schema);
            console.log('Parsed schema:', schema);
            if (schema.tables.length === 0) {
                figma.notify('No tables found in the schema');
                return;
            }
            // Load fonts first
            yield figma.loadFontAsync({ family: "Inter", style: "Bold" });
            yield figma.loadFontAsync({ family: "Inter", style: "Medium" });
            yield figma.loadFontAsync({ family: "Inter", style: "Regular" });
            let x = 50, y = 50; // Start with some margin from edges
            const createdFrames = [];
            const tablePositions = new Map(); // Store table positions for connector drawing      // Calculate layout grid to prevent overlaps
            const tableWidth = 400; // Smaller tables to fit more
            const minHorizontalSpacing = 80; // Reduced spacing for more columns
            const minVerticalSpacing = 100; // Vertical spacing between rows
            const maxTablesPerRow = 5; // Force 5 columns for better readability
            console.log(`Layout: ${maxTablesPerRow} tables per row, ${schema.tables.length} total tables`);
            let currentRow = 0;
            let currentCol = 0;
            let rowHeights = [0]; // Track height of each row
            for (const table of schema.tables) {
                console.log('Creating frame for table:', table.name);
                // Calculate dimensions
                const headerHeight = 48;
                const rowHeight = 40;
                const frameHeight = headerHeight + Math.max(1, table.columns.length) * rowHeight;
                // Main table frame with rounded corners and shadow
                const frame = figma.createFrame();
                frame.name = table.name;
                frame.resize(tableWidth, frameHeight);
                frame.fills = [{ type: 'SOLID', color: { r: 0.98, g: 0.98, b: 0.99 } }];
                frame.cornerRadius = 12;
                frame.effects = [{
                        type: 'DROP_SHADOW',
                        color: { r: 0, g: 0, b: 0, a: 0.1 },
                        offset: { x: 0, y: 4 },
                        radius: 16,
                        spread: 0,
                        visible: true,
                        blendMode: 'NORMAL'
                    }]; // Calculate position using proper grid system
                x = 50 + currentCol * (tableWidth + minHorizontalSpacing);
                // Calculate Y position based on previous row heights
                let totalPreviousRowsHeight = 0;
                for (let i = 0; i < currentRow; i++) {
                    totalPreviousRowsHeight += rowHeights[i] + minVerticalSpacing;
                }
                y = 50 + totalPreviousRowsHeight;
                console.log(`Table ${table.name}: pos(${x}, ${y}), row ${currentRow}, col ${currentCol}, height ${frameHeight}`);
                frame.x = x;
                frame.y = y;
                // Header background
                const header = figma.createFrame();
                header.name = 'header';
                header.resize(tableWidth, headerHeight);
                header.fills = [{ type: 'SOLID', color: { r: 0.15, g: 0.16, b: 0.21 } }];
                header.cornerRadius = 12;
                header.x = 0;
                header.y = 0;
                // Header bottom corners should be square for seamless connection
                header.topLeftRadius = 12;
                header.topRightRadius = 12;
                header.bottomLeftRadius = 0;
                header.bottomRightRadius = 0;
                frame.appendChild(header);
                // Table title
                const title = figma.createText();
                title.characters = table.name;
                title.fontSize = 18;
                title.fontName = { family: "Inter", style: "Bold" };
                title.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
                title.x = 20;
                title.y = 12;
                frame.appendChild(title);
                // Table icon (optional database icon)
                const icon = figma.createEllipse();
                icon.resize(8, 8);
                icon.fills = [{ type: 'SOLID', color: { r: 0.4, g: 0.7, b: 1 } }];
                icon.x = tableWidth - 28;
                icon.y = 20;
                frame.appendChild(icon);
                // Column rows
                let currentY = headerHeight;
                for (let i = 0; i < table.columns.length; i++) {
                    const col = table.columns[i];
                    // Row background (alternating colors)
                    const rowBg = figma.createFrame();
                    rowBg.name = `row-${i}`;
                    rowBg.resize(tableWidth, rowHeight);
                    rowBg.fills = [{
                            type: 'SOLID',
                            color: i % 2 === 0
                                ? { r: 0.98, g: 0.98, b: 0.99 }
                                : { r: 0.96, g: 0.97, b: 0.98 }
                        }];
                    rowBg.x = 0;
                    rowBg.y = currentY;
                    // Last row should have bottom rounded corners
                    if (i === table.columns.length - 1) {
                        rowBg.bottomLeftRadius = 12;
                        rowBg.bottomRightRadius = 12;
                    }
                    frame.appendChild(rowBg);
                    // Column name (left side)
                    const colName = figma.createText();
                    colName.characters = col.name;
                    colName.fontSize = 14;
                    colName.fontName = { family: "Inter", style: "Medium" };
                    colName.fills = [{ type: 'SOLID', color: { r: 0.15, g: 0.16, b: 0.21 } }];
                    colName.x = 20;
                    colName.y = currentY + 12;
                    frame.appendChild(colName);
                    // Column type (right side, with background)
                    const colType = figma.createText();
                    const typeText = col.type.length > 35 ? col.type.substring(0, 35) + '...' : col.type;
                    colType.characters = typeText;
                    colType.fontSize = 12;
                    colType.fontName = { family: "Inter", style: "Regular" };
                    colType.fills = [{ type: 'SOLID', color: { r: 0.5, g: 0.55, b: 0.65 } }];
                    colType.x = 180;
                    colType.y = currentY + 13;
                    frame.appendChild(colType);
                    // Type background for better separation
                    const typeBg = figma.createFrame();
                    typeBg.resize(180, 24); // Adjusted for smaller table width
                    typeBg.fills = [{
                            type: 'SOLID',
                            color: { r: 0.94, g: 0.95, b: 0.97 }
                        }];
                    typeBg.cornerRadius = 4;
                    typeBg.x = 175;
                    typeBg.y = currentY + 8;
                    frame.insertChild(frame.children.length - 1, typeBg); // Insert before the text          // Primary key indicator
                    if (col.type.includes('PRIMARY KEY')) {
                        const keyIcon = figma.createFrame();
                        keyIcon.resize(20, 20);
                        keyIcon.fills = [{ type: 'SOLID', color: { r: 1, g: 0.8, b: 0.2 } }];
                        keyIcon.cornerRadius = 4;
                        keyIcon.x = tableWidth - 45; // Relative to frame
                        keyIcon.y = currentY + 10; // Relative to frame
                        const keyText = figma.createText();
                        keyText.characters = 'PK';
                        keyText.fontSize = 9;
                        keyText.fontName = { family: "Inter", style: "Bold" };
                        keyText.fills = [{ type: 'SOLID', color: { r: 0.15, g: 0.16, b: 0.21 } }];
                        keyText.x = tableWidth - 40; // Relative to frame
                        keyText.y = currentY + 15; // Relative to frame
                        frame.appendChild(keyIcon);
                        frame.appendChild(keyText);
                    }
                    // Not null indicator
                    else if (col.type.includes('NOT NULL')) {
                        const nnIcon = figma.createFrame();
                        nnIcon.resize(14, 14);
                        nnIcon.fills = [{ type: 'SOLID', color: { r: 0.9, g: 0.3, b: 0.3 } }];
                        nnIcon.cornerRadius = 7;
                        nnIcon.x = tableWidth - 35;
                        nnIcon.y = currentY + 13;
                        frame.appendChild(nnIcon);
                    }
                    // Row separator line (except for last row)
                    if (i < table.columns.length - 1) {
                        const separator = figma.createLine();
                        separator.resize(tableWidth - 40, 0);
                        separator.strokes = [{ type: 'SOLID', color: { r: 0.9, g: 0.91, b: 0.93 } }];
                        separator.strokeWeight = 1;
                        separator.x = 20;
                        separator.y = currentY + rowHeight;
                        frame.appendChild(separator);
                    }
                    currentY += rowHeight;
                }
                figma.currentPage.appendChild(frame);
                createdFrames.push(frame);
                // Store table position and info for relationship drawing
                tablePositions.set(table.name, {
                    frame: frame,
                    x: x,
                    y: y,
                    width: tableWidth,
                    height: frameHeight,
                    columns: table.columns
                }); // Track the maximum height in current row
                rowHeights[currentRow] = Math.max(rowHeights[currentRow] || 0, frameHeight);
                // Advance to next position in grid
                currentCol++;
                if (currentCol >= maxTablesPerRow) {
                    currentCol = 0;
                    currentRow++;
                    rowHeights[currentRow] = 0; // Initialize next row height
                }
            }
            // Optimize layout for relationships - move related tables closer together
            console.log('Optimizing layout for relationships...');
            for (const rel of schema.relationships) {
                const fromTable = tablePositions.get(rel.fromTable);
                const toTable = tablePositions.get(rel.toTable);
                if (fromTable && toTable) {
                    // Try to minimize distance between related tables
                    const distance = Math.sqrt(Math.pow(fromTable.frame.x - toTable.frame.x, 2) +
                        Math.pow(fromTable.frame.y - toTable.frame.y, 2));
                    console.log(`Distance between ${rel.fromTable} and ${rel.toTable}: ${Math.round(distance)}px`);
                }
            } // Draw relationship connectors only if requested
            const connectors = [];
            if (msg.showRelationships !== false) { // Default to true if not specified
                console.log('Drawing', schema.relationships.length, 'relationships');
                // Create a map of table names to color indices for consistent coloring
                const tableNames = Array.from(new Set(schema.relationships.map(r => r.fromTable)));
                const tableColorMap = new Map();
                tableNames.forEach((tableName, index) => {
                    tableColorMap.set(tableName, generateTableColor(index));
                });
                // Group relationships by source table for better organization
                const relationshipsByTable = new Map();
                for (const rel of schema.relationships) {
                    const fromTable = tablePositions.get(rel.fromTable);
                    const toTable = tablePositions.get(rel.toTable);
                    if (fromTable && toTable) {
                        console.log(`Drawing relationship: ${rel.fromTable}.${rel.fromColumn} -> ${rel.toTable}.${rel.toColumn}`);
                        // Find the column positions within the tables
                        const fromColumnIndex = fromTable.columns.findIndex((col) => col.name === rel.fromColumn);
                        const toColumnIndex = toTable.columns.findIndex((col) => col.name === rel.toColumn);
                        if (fromColumnIndex >= 0 && toColumnIndex >= 0) {
                            // Calculate connection points - connect to the actual column rows
                            const headerHeight = 48;
                            const rowHeight = 40;
                            // Calculate the connection points at the column level
                            const fromColumnY = fromTable.frame.y + headerHeight + (fromColumnIndex * rowHeight) + (rowHeight / 2);
                            const toColumnY = toTable.frame.y + headerHeight + (toColumnIndex * rowHeight) + (rowHeight / 2);
                            // Connect from right edge of from-table to left edge of to-table
                            const fromX = fromTable.frame.x + fromTable.width;
                            const fromY = fromColumnY;
                            const toX = toTable.frame.x;
                            const toY = toColumnY;
                            console.log(`Connection points: (${fromX}, ${fromY}) -> (${toX}, ${toY})`);
                            // Get the color for this table's relationships
                            const relationshipColor = tableColorMap.get(rel.fromTable) || { r: 0.4, g: 0.6, b: 0.9 };
                            // Create a vector node with a line path
                            const connector = figma.createVector();
                            connector.name = `${rel.fromColumn} → ${rel.toTable}.${rel.toColumn}`;
                            // Create the line path from start to end point
                            const vectorPaths = [{
                                    windingRule: 'NONZERO',
                                    data: `M ${fromX} ${fromY} L ${toX} ${toY}`
                                }];
                            connector.vectorPaths = vectorPaths;
                            // Style the connector line with the table's unique color
                            connector.strokes = [{
                                    type: 'SOLID',
                                    color: relationshipColor
                                }];
                            connector.strokeWeight = 3; // Slightly thicker for better visibility
                            connector.strokeCap = 'ROUND';
                            // Set the vector bounds to encompass the line
                            const minX = Math.min(fromX, toX);
                            const minY = Math.min(fromY, toY);
                            const maxX = Math.max(fromX, toX);
                            const maxY = Math.max(fromY, toY);
                            connector.x = minX;
                            connector.y = minY;
                            connector.resize(maxX - minX || 1, maxY - minY || 1);
                            console.log(`Vector line: bounds=(${minX}, ${minY}, ${maxX - minX}, ${maxY - minY})`);
                            // Create connection point markers for visual clarity (smaller and colored)
                            const fromPoint = figma.createEllipse();
                            fromPoint.name = 'from_point';
                            fromPoint.resize(6, 6);
                            fromPoint.fills = [{ type: 'SOLID', color: relationshipColor }];
                            fromPoint.x = fromX - 3;
                            fromPoint.y = fromY - 3;
                            const toPoint = figma.createEllipse();
                            toPoint.name = 'to_point';
                            toPoint.resize(6, 6);
                            toPoint.fills = [{ type: 'SOLID', color: relationshipColor }];
                            toPoint.x = toX - 3;
                            toPoint.y = toY - 3;
                            // Add elements to page first
                            figma.currentPage.appendChild(connector);
                            figma.currentPage.appendChild(fromPoint);
                            figma.currentPage.appendChild(toPoint);
                            // Group the connector elements
                            const connectorElements = [connector, fromPoint, toPoint];
                            const connectorGroup = figma.group(connectorElements, figma.currentPage);
                            connectorGroup.name = `${rel.fromColumn} → ${rel.toTable}.${rel.toColumn}`;
                            connectorGroup.locked = false;
                            // Store for table-specific grouping
                            if (!relationshipsByTable.has(rel.fromTable)) {
                                relationshipsByTable.set(rel.fromTable, []);
                            }
                            relationshipsByTable.get(rel.fromTable).push(connectorGroup);
                        }
                    }
                }
                // Create organized layer structure
                const tableRelationshipGroups = [];
                for (const [tableName, relationships] of relationshipsByTable) {
                    if (relationships.length > 0) {
                        console.log(`Creating group for ${tableName} with ${relationships.length} relationships`);
                        // Create a group for this table's relationships
                        const tableGroup = figma.group(relationships, figma.currentPage);
                        tableGroup.name = `🔗 ${tableName} Relations (${relationships.length})`;
                        tableGroup.locked = false;
                        // Get the table's color for the group
                        const tableColor = tableColorMap.get(tableName);
                        if (tableColor) {
                            // Add a subtle background indicator (optional - can be removed if too cluttered)
                            const groupBackground = figma.createRectangle();
                            groupBackground.name = 'group_indicator';
                            groupBackground.resize(4, 4);
                            groupBackground.fills = [{ type: 'SOLID', color: tableColor }];
                            groupBackground.visible = false; // Hidden by default
                            tableGroup.appendChild(groupBackground);
                        }
                        tableRelationshipGroups.push(tableGroup);
                    }
                }
                // Create main relationships container group
                if (tableRelationshipGroups.length > 0) {
                    const mainRelationshipsGroup = figma.group(tableRelationshipGroups, figma.currentPage);
                    mainRelationshipsGroup.name = `📊 All Relationships (${schema.relationships.length} total)`;
                    mainRelationshipsGroup.locked = false;
                    connectors.push(mainRelationshipsGroup);
                    console.log(`Created main relationships group with ${tableRelationshipGroups.length} table groups`);
                }
            }
            else {
                console.log('Skipping relationships as requested by user');
            }
            // Select and focus on created frames (include connectors in selection)
            const allElements = [...createdFrames, ...connectors];
            figma.currentPage.selection = allElements;
            figma.viewport.scrollAndZoomIntoView(allElements);
            figma.ui.postMessage({
                type: 'drawn',
                count: schema.tables.length,
                relationships: schema.relationships.length
            });
            figma.notify(`Created ${schema.tables.length} table(s) with ${schema.relationships.length} relationship(s)`);
        }
        catch (error) {
            console.error('Error creating frames:', error);
            figma.notify('Error creating diagrams: ' + error.message);
        }
    }
});
