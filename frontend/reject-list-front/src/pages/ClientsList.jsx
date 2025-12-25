// src/pages/ClientsList.jsx
import { useEffect, useState } from 'react'
import { apiGet } from '../lib/api'
import { useNavigate } from 'react-router-dom'

export default function ClientsList() {
  const [items, setItems] = useState([])
  const [err, setErr] = useState(null)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const navigate = useNavigate()

  useEffect(() => {
    (async () => {
      try { setItems(await apiGet('/clients/')) } 
      catch (e) { setErr(String(e)) }
    })()
  }, [])

  const toggleSelect = (id) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(items.map(c => c.id)))
    }
  }

  const handleEditSelected = () => {
    if (selectedIds.size === 0) return
    
    // Get selected clients
    const selectedClients = items.filter(c => selectedIds.has(c.id))
    
    // Navigate to edit page with selected clients data
    navigate('/clients/add', { 
      state: { 
        editMode: true,
        clients: selectedClients,
        selectedIds: Array.from(selectedIds)
      } 
    })
  }

  if (err) return <div style={{color: 'red'}}>{err}</div>
  
  return (
    <div>
      <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          onClick={handleEditSelected}
          disabled={selectedIds.size === 0}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: selectedIds.size > 0 ? '#10b981' : '#9ca3af',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: selectedIds.size > 0 ? 'pointer' : 'not-allowed'
          }}
        >
          Edit Selected ({selectedIds.size})
        </button>
        
        <button
          onClick={toggleSelectAll}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer'
          }}
        >
          {selectedIds.size === items.length ? 'Deselect All' : 'Select All'}
        </button>
      </div>
      
      <ul>
        {items.map(c => (
          <li 
            key={c.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '0.5rem',
              backgroundColor: selectedIds.has(c.id) ? '#e0f2fe' : 'transparent',
              cursor: 'pointer'
            }}
            onClick={() => toggleSelect(c.id)}
          >
            <input
              type="checkbox"
              checked={selectedIds.has(c.id)}
              onChange={() => toggleSelect(c.id)}
              onClick={(e) => e.stopPropagation()}
            />
            <span>{c.name}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}