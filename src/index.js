import _ from 'lodash'
import {mapEvents} from 'sigh-core/lib/stream'


function riotTask(opts) {
    const compile = require('riot').compile
    
    return event => {
        const data = `;var riot = require('riot/riot');${compile(event.data, opts)};`
        
        return {data, sourceMap: undefined}
    }
}

function adaptEvent(compiler) {
  return event => {
    if (event.type !== 'add' && event.type !== 'change')
        return event

    if (event.fileType !== 'tag')
        return event

    return compiler(_.pick(event, 'data')).then(result => {
      event.data = result.data

      if (result.sourceMap)
        event.applySourceMap(JSON.parse(result.sourceMap))

      event.changeFileSuffix('js')
      return event
    })
  }
}

var pooledProc

export default function(op, opts = {}) {
  if (! pooledProc)
    pooledProc = op.procPool.prepare(riotTask, opts, {module})

  return mapEvents(op.stream, adaptEvent(pooledProc))
}
