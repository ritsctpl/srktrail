import React, { useRef } from 'react'

export interface FileUploadProps {
  accept?: string
  maxSizeMB?: number
  value?: File | null
  onChange: (file: File | null) => void
}

export default function FileUpload({ accept, maxSizeMB, value, onChange }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (maxSizeMB && file.size / 1024 / 1024 > maxSizeMB) {
      alert(`File too large. Max ${maxSizeMB}MB`)
      e.target.value = ''
      return
    }
    onChange(file)
  }

  return (
    <div>
      <input
        type="file"
        ref={inputRef}
        accept={accept}
        onChange={handleFile}
        className="text-sm"
      />
      {value && (
        <div className="mt-1 text-xs text-blue-600">
          <a href={URL.createObjectURL(value)} target="_blank" rel="noreferrer">
            {value.name}
          </a>
        </div>
      )}
    </div>
  )
}
