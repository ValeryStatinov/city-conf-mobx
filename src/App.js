import React, { useRef, useState } from 'react'
// import { observable, autorun } from 'mobx'

let accessedVariables = []
let derivationGraph = {}

function observable(targetObject) {
  return new Proxy(targetObject, {
    get(target, key) {
      accessedVariables.push(key)

      return target[key]
    },
    set(target, key, value) {
      target[key] = value

      if (derivationGraph[key]) {
        derivationGraph[key].forEach(runner => runner())
      }

      return true
    }
  })
}

function createReaction(onChange) {
  return {
    track: (trackFunc) => {
      accessedVariables = []

      trackFunc()

      accessedVariables.forEach(key => {
        derivationGraph[key] = derivationGraph[key] || []
        derivationGraph[key].push(onChange)
      })
    }
  }
}

function autorun(runner) {
  const reaction = createReaction(runner)
  reaction.track(runner)
}

const album = observable({
  title: 'My favorite album',
  playCount: 0,
})

autorun(() => console.log(album.playCount))

setTimeout(() => album.playCount += 1, 1000)
setTimeout(() => album.playCount += 1, 2000)
setTimeout(() => album.playCount += 1, 3000)

const useForceUpdate = () => {
  const [, set] = useState(false)

  const forceUpdate = () => set(current => !current)

  return forceUpdate
}

function observer(baseComponent) {
  function Wrapper() {
    const forceUpdate = useForceUpdate()
    const reaction = useRef(null)

    if (!reaction.current) {
      reaction.current = createReaction(forceUpdate)
    }

    let output
    reaction.current.track(() => {
      output = baseComponent()
    })

    return output
  }

  return Wrapper
}


const AppBase = () => {
  return (
    <div style={{ marginLeft: 30 }}>
      <h1>Hello city-mobil!</h1>
      <h3>{album.title}</h3>
      <h3>{album.playCount}</h3>
    </div>
  )
}

const App = observer(AppBase)

export default App
