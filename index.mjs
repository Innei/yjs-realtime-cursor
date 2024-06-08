// @ts-check
// import { IndexeddbPersistence } from 'y-indexeddb'
import { WebrtcProvider } from 'y-webrtc'
import * as Y from 'yjs'
const ydoc = new Y.Doc()
const key = 'cursor'

// const indexeddbProvider = new IndexeddbPersistence(key, ydoc)
// indexeddbProvider.whenSynced.then(() => {
//   console.log('loaded data from indexed db')
// })

const webrtcProvider = new WebrtcProvider(key, ydoc, {
  signaling: ['ws://localhost:1234'],
})

const awareness = webrtcProvider.awareness

// array of numbers which produce a sum
const yPosMap = ydoc.getMap('position')
const yColorMap = ydoc.getMap('color')

const userId = ydoc.clientID
const seedColor = '#' + Math.floor(Math.random() * 16777215).toString(16)
const handler = (e) => {
  awareness.setLocalStateField('cursor', {
    x: e.pageX,
    y: e.pageY,
    xp: e.pageX / window.innerWidth,
    yp: e.pageY / window.innerHeight,
    color: seedColor,
    id: userId.toString(),
  })
}

document.addEventListener('mousemove', handler)

awareness.on('change', (changes) => {
  // 1. id -> state[key] -> data

  const idDataMap = [...awareness.getStates().values()].reduce(
    (acc, { cursor }) => {
      if (!cursor) return acc
      acc[cursor.id] = cursor
      return acc
    },
    {},
  )
  // 2. changes -> add/update/remove
  for (const add of [...changes.added, ...changes.updated]) {
    const userId = add.toString()
    const data = idDataMap[userId]
    if (!data) continue
    yPosMap.set(userId, [data.xp, data.yp])
    yColorMap.set(userId, data.color)

    console.log('add/update', userId)
  }

  for (const remove of changes.removed) {
    const userId = remove.toString()
    yPosMap.delete(userId)
    yColorMap.delete(userId)

    const $cursor = user2$cursors.get(userId)

    console.log('remove', userId)
    if ($cursor) {
      $cursor.remove()
      user2$cursors.delete(userId)
    }
  }
})

yColorMap.set(userId.toString(), seedColor)

const user2$cursors = new Map()

yPosMap.observe((event) => {
  const userIds = event.keysChanged.values()
  for (const userId of userIds) {
    const pos = yPosMap.get(userId)
    let $cursor = user2$cursors.get(userId)
    if (!$cursor) {
      const color = yColorMap.get(userId)
      $cursor = createCursor(color)
      $cursor.id = userId

      console.log('createCursor', userId)
      user2$cursors.set(userId, $cursor)
    }
    if (pos) {
      $cursor.style.left = pos[0] * window.innerWidth + 'px'
      $cursor.style.top = pos[1] * window.innerHeight + 'px'
    }
  }
})

function createCursor(color) {
  const $cursor = document.createElement('div')
  $cursor.style.cssText = `position: absolute;
height: 20px;
width: 20px;
border-radius: 100%;
opacity: 0.5;`
  document.body.appendChild($cursor)

  $cursor.style.background = color
  return $cursor
}
