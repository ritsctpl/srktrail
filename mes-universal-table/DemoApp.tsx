'use client'
import { useState } from 'react'
import MESUniversalTable from './MESUniversalTable'
import demoSchema from './demo-schema.json'

export default function DemoApp() {
  const [data, setData] = useState<any[]>([])
  return (
    <div className="p-4">
      <h1 className="text-xl mb-4">MES Universal Table Demo</h1>
      <MESUniversalTable
        schema={demoSchema as any}
        data={data}
        onDataChange={setData}
        userRole="operator"
        lookupOptions={{}}
      />
    </div>
  )
}
