# 📊 DB Schema Visualizer - Figma Plugin

A powerful Figma plugin that transforms JSON schema files and database dumps into beautiful, interactive table diagrams. Perfect for database design, documentation, and system architecture visualization.

## ✨ Features

- **🎨 Modern Design**: Dark theme with rounded corners, shadows, and beautiful typography
- **🔗 Smart Relationships**: Color-coded relationship lines connecting tables at the column level
- **📱 Responsive Layout**: Automatic 5-column grid layout that scales with your data
- **🎯 Interactive Controls**: Toggle relationships on/off, organized by table groups
- **🔄 Multiple Formats**: Supports JSON schema files, database dumps, and direct DDL parsing
- **🎨 Visual Indicators**: Primary key badges, NOT NULL indicators, and constraint displays

## 🚀 Installation & Setup

### For Development:

1. **Clone and Install Dependencies**
   ```powershell
   git clone <your-repo-url>
   cd try2
   npm install
   ```

2. **Build the Plugin**
   ```powershell
   npm run build
   # or for development with auto-compilation:
   npx tsc --watch
   ```

3. **Load in Figma**
   - Open Figma Desktop App
   - Go to `Plugins` → `Development` → `Import plugin from manifest...`
   - Select the `manifest.json` file from this directory
   - Plugin will appear in your Plugins menu

### For Users:

1. Download the plugin files
2. In Figma: `Plugins` → `Development` → `Import plugin from manifest...`
3. Select the `manifest.json` file
4. The plugin appears in your Plugins menu as "DB Schema Visualizer"

## 📖 Usage

### Basic Usage:
1. **Open the Plugin**: `Plugins` → `DB Schema Visualizer`
2. **Load Your Data**: 
   - Upload a JSON file using the file picker, OR
   - Paste JSON directly into the text area
3. **Configure Options**:
   - ✅ **Show Relationships**: Toggle to show/hide relationship connectors
4. **Generate**: Click "Draw Schema" to create your visualization

### Supported Data Formats:

#### JSON Schema Format:
```json
{
  "objects": [
    {
      "type": "table",
      "name": "users",
      "columns": [
        {
          "name": "id",
          "type": "INTEGER",
          "constraints": [{"type": "PRIMARY KEY"}]
        },
        {
          "name": "email",
          "type": "VARCHAR(255)",
          "constraints": [{"type": "NOT NULL"}]
        }
      ],
      "ddl": "CREATE TABLE users (id INTEGER PRIMARY KEY, email VARCHAR(255) NOT NULL);"
    }
  ],
  "relationships": [
    {
      "fromTable": "orders",
      "fromColumn": "user_id", 
      "toTable": "users",
      "toColumn": "id"
    }
  ]
}
```

#### Simple Schema Format:
```json
{
  "tables": [
    {
      "name": "users",
      "columns": [
        {"name": "id", "type": "INTEGER PRIMARY KEY"},
        {"name": "email", "type": "VARCHAR(255) NOT NULL"}
      ]
    }
  ],
  "relationships": [
    {
      "fromTable": "orders",
      "fromColumn": "user_id",
      "toTable": "users", 
      "toColumn": "id"
    }
  ]
}
```

## 🎨 Layer Organization

The plugin creates a well-organized layer structure:

```
📊 All Relationships (3 total)
  └── 🔗 users Relations (2)
      ├── user_id → orders.user_id
      └── user_id → profiles.user_id
  └── 🔗 orders Relations (1)
      └── product_id → products.product_id

📋 Tables
  ├── users
  ├── orders  
  └── products
```

**Layer Controls:**
- **👁️ All Relationships**: Toggle all relationship lines
- **👁️ Table Groups**: Toggle relationships for specific tables
- **👁️ Individual Relations**: Toggle specific connections

## 🎯 Features in Detail

### Table Visualization:
- **Header**: Dark background with table name and database icon
- **Columns**: Clean two-column layout (name | type)
- **Constraints**: Visual badges for PRIMARY KEY, NOT NULL, etc.
- **Alternating Rows**: Better readability with subtle color changes

### Relationship Lines:
- **Color Coding**: Each source table gets a unique color
- **Column-Level**: Lines connect specific columns, not just tables
- **Connection Points**: Small colored dots show exact connection points
- **Smart Positioning**: Automatic calculation to avoid overlaps

### Layout System:
- **5-Column Grid**: Responsive layout that adapts to your data
- **Smart Spacing**: Automatic spacing based on table heights
- **No Overlaps**: Intelligent positioning prevents table collisions

## 🛠️ Development

### File Structure:
```
├── code.ts           # Main plugin logic (TypeScript)
├── ui.html           # Plugin interface
├── manifest.json     # Figma plugin configuration
├── types.ts          # TypeScript type definitions
├── tsconfig.json     # TypeScript compiler config
├── package.json      # Dependencies and scripts
├── dist/             # Compiled JavaScript (auto-generated)
└── *.json           # Sample data files for testing
```

### Build Commands:
```powershell
# Install dependencies
npm install

# Compile TypeScript
npx tsc

# Watch mode for development
npx tsc --watch

# Clean build
Remove-Item dist -Recurse -Force; npx tsc
```

### Adding New Features:
1. Edit `code.ts` for plugin logic
2. Edit `ui.html` for interface changes  
3. Run `npx tsc` to compile
4. Reload plugin in Figma to test

## 🐛 Troubleshooting

### Common Issues:

**"No tables found in the schema"**
- Check your JSON format matches one of the supported schemas
- Ensure `objects` array contains items with `type: "table"`

**Relationships not showing**
- Verify the "Show Relationships" checkbox is checked
- Check that column names in relationships match exactly
- Look for typos in table/column names

**TypeScript compilation errors**
- Run `npm install` to ensure dependencies are installed
- Check `tsconfig.json` configuration
- Verify all imports and types are correct

**Plugin not loading in Figma**
- Ensure `manifest.json` is valid
- Check that `dist/code.js` exists after compilation
- Try restarting Figma Desktop App

## 📝 License

This project is open source. Feel free to modify and distribute.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly with sample data
5. Submit a pull request

---

**Made with ❤️ for database designers and system architects**
