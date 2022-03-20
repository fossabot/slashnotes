import { action } from 'libs/action'
import {
  useCallback, useEffect, useState
} from 'react'

type Mode = 'view' | 'rename'

function RenameMode ({
  item,
  setMode,
  loadAllItems,
} : {
  item: Item
  setMode: React.Dispatch<React.SetStateAction<Mode>>
  loadAllItems(): void
}) {
  const [path, setPath] = useState(item.path)
  const submit = useCallback(() => {
    action('rename', {
      from: item.path,
      to: path
    })
      .then(() => {
        loadAllItems()
        setMode('view')
      })
  }, [])

  useEffect(() => {
    setPath(item.path)
  }, [item])

  return <div className='rename'>
    <input
      value={ path }
      onChange={ e => setPath(e.target.value) }
      onKeyUp={ e => {
        switch (e.code) {
          case 'Enter':
            submit()
            break
          case 'Escape':
            setMode('view')
            break
        }
      } }
    />
    <div
      className='button cancel-button'
      onClick={ () => setMode('view') }
      title='Cancel'
    >X</div>
    <div
      className='button save-button'
      onClick={ submit }
      title='Save'
    >Y</div>
  </div>
}

export function FileNode ({
  name,
  item,
  depth,
  currentItem,
  setItems,
  setCurrentItem,
  loadAllItems,
} : {
  name: string
  item: Item
  depth: number
  currentItem?: Item
  setItems: React.Dispatch<React.SetStateAction<Item[]>>
  setCurrentItem: React.Dispatch<React.SetStateAction<Item | undefined>>
  loadAllItems(): void
}) {
  const [mode, setMode] = useState<Mode>('view')

  return <div className={ `node file ${item === currentItem ? 'current' : ''}` }>
    {mode === 'view' && <div
      className='view'
      style={ { paddingLeft: (depth * 20) + 'px' } }
      onClick={ () => {
        setItems(prev => (prev.includes(item) ? prev : [...prev, item]))
        setCurrentItem(item)
      } }>
      {name}
      <div
        className="rename-button"
        title="Rename"
        onClick={ () => {
          setMode('rename')
        } }
      >R</div>
    </div>}
    {mode === 'rename' && <RenameMode
      item={ item }
      setMode={ setMode }
      loadAllItems={ loadAllItems }
    />}
  </div>
}
