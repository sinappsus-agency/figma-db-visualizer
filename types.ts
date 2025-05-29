// Types for parsed table and relationship
export interface TableColumn {
  name: string;
  type: string;
}

export interface Table {
  name: string;
  columns: TableColumn[];
  // Optionally, add more metadata as needed
}

export interface Relationship {
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
}

export interface DBSchema {
  tables: Table[];
  relationships: Relationship[];
}
