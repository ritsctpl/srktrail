'use client'
import { useState } from 'react'
import MESUniversalTable from './MESUniversalTable'
import schema from './enterprise-schema.json'

export default function EnterpriseDemoApp() {
  const [data, setData] = useState<any[]>([])
  return (
    <div className="p-4">
      <h1 className="text-xl mb-4">Enterprise Table Demo</h1>
      <MESUniversalTable
        schema={schema as any}
        data={data}
        onDataChange={setData}
        userRole="QA"
        lookupOptions={{}}
      />
    </div>
  )
}
