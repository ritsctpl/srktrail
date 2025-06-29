# MES Universal Table

This folder contains a schema-driven table component for Next.js projects.
The implementation uses **TanStack Table** for row management and rendering.

## Setup

1. Copy the `mes-universal-table/` folder into your project root.
2. Ensure `tailwindcss` is configured. Import `styles/globals.css` in your app entry.
3. Import `MESUniversalTable` and pass a schema, initial data, and handlers.
4. Optionally import `mes-universal-table/mes-universal-table.css` if you are not using Tailwind or want to override styles.

## Usage

```tsx
import MESUniversalTable from '../mes-universal-table/MESUniversalTable'

const schema = {/*...*/}
const data = []

<MESUniversalTable
  schema={schema}
  data={data}
  onDataChange={setData}
  lookupOptions={{}}
  userRole="operator"
/>
```

See `DemoApp.tsx` for a working example. The demo loads its schema from
`demo-schema.json` to avoid hard coded configuration in the source code.

## Features

* Dynamic headers from schema
* Support for multiple field types (text, number, boolean, enum, lookup, formula, image, file, signature)
* Row add/remove controls with optional left/right placement
* Dynamically add or remove columns at runtime
* Merge or split rows and columns
* Validation and conditional visibility
* Formula columns and API-driven fields
* Pagination and sticky headers
* Role-based edit restrictions
* Schema-driven styling using Tailwind CSS classes
* Enterprise-ready look with rounded corners, shadows and striping

Customize styles by editing `mes-universal-table.css` or extending Tailwind.
