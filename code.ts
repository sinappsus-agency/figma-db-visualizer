/// <reference types="@figma/plugin-typings" />

// Type definitions
interface TableColumn {
  name: string;
  type: string;
}

interface Table {
  name: string;
  columns: TableColumn[];
}

interface Relationship {
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
}

interface DBSchema {
  tables: Table[];
  relationships: Relationship[];
}

// Figma plugin entry point
figma.showUI(__html__, { width: 420, height: 600 });

function parseSchema(raw: string): DBSchema {
  try {
    const data = JSON.parse(raw);
    console.log('Parsed data:', data);
    
    if (data.objects && Array.isArray(data.objects)) {
      const tables: Table[] = [];
      const relationships: Relationship[] = [];
      
      console.log('Found', data.objects.length, 'objects');
      
      // Parse tables from the JSON structure
      for (const obj of data.objects) {
        console.log('Processing object:', obj.type, obj.name);
        
        if (obj.type === 'table' && obj.name && obj.columns) {
          const table: Table = {
            name: obj.name,
            columns: []
          };
          
          console.log('Processing table:', obj.name, 'with', obj.columns.length, 'columns');
          
          // Parse columns
          for (const col of obj.columns) {
            if (col.name && col.type) {
              const constraints = col.constraints 
                ? col.constraints
                    .filter((c: any) => c.type)
                    .map((c: any) => c.type)
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
      
      console.log('Final result:', tables.length, 'tables,', relationships.length, 'relationships');
      return { tables, relationships };
    }  } catch (e: any) {
    console.error('Error parsing schema:', e);
    figma.notify('Error parsing JSON: ' + e.message);
  }
  return { tables: [], relationships: [] };
}

figma.ui.onmessage = async (msg: { type: string; schema: string }) => {
  if (msg.type === 'draw-schema') {
    try {
      const schema = parseSchema(msg.schema);
      console.log('Parsed schema:', schema);
      
      if (schema.tables.length === 0) {
        figma.notify('No tables found in the schema');
        return;
      }
        // Load fonts first
      await figma.loadFontAsync({ family: "Inter", style: "Bold" });
      await figma.loadFontAsync({ family: "Inter", style: "Medium" });
      await figma.loadFontAsync({ family: "Inter", style: "Regular" });
      
      let x = 0, y = 0;
      const createdFrames = [];
        for (const table of schema.tables) {
        console.log('Creating frame for table:', table.name);
          // Calculate dimensions
        const tableWidth = 450;
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
        }];
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
          typeBg.resize(220, 24);
          typeBg.fills = [{ 
            type: 'SOLID', 
            color: { r: 0.94, g: 0.95, b: 0.97 }
          }];
          typeBg.cornerRadius = 4;
          typeBg.x = 175;
          typeBg.y = currentY + 8;
          frame.insertChild(frame.children.length - 1, typeBg); // Insert before the text
            // Primary key indicator
          if (col.type.includes('PRIMARY KEY')) {
            const keyIcon = figma.createFrame();
            keyIcon.resize(20, 20);
            keyIcon.fills = [{ type: 'SOLID', color: { r: 1, g: 0.8, b: 0.2 } }];
            keyIcon.cornerRadius = 4;
            keyIcon.x = tableWidth - 45;
            keyIcon.y = currentY + 10;
            
            const keyText = figma.createText();
            keyText.characters = 'PK';
            keyText.fontSize = 9;
            keyText.fontName = { family: "Inter", style: "Bold" };
            keyText.fills = [{ type: 'SOLID', color: { r: 0.15, g: 0.16, b: 0.21 } }];
            keyText.x = tableWidth - 40;
            keyText.y = currentY + 15;
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
          // Move to next position with better spacing
        x += tableWidth + 50;
        if (x > 1400) { 
          x = 0; 
          y += frameHeight + 60; 
        }
      }
      
      // Select and focus on created frames
      figma.currentPage.selection = createdFrames;
      figma.viewport.scrollAndZoomIntoView(createdFrames);
      figma.ui.postMessage({ type: 'drawn', count: schema.tables.length });
      figma.notify(`Created ${schema.tables.length} table(s)`);
      
    } catch (error: any) {
      console.error('Error creating frames:', error);
      figma.notify('Error creating diagrams: ' + error.message);
    }
  }
};
