'use strict'

let gMemeSettings
let gLastStrokeColor

function initMemeSettings(ctx) {
  gMemeSettings = {
    strokeColor: '#000000',
    lineWidth: 2,
    lineCap: 'round',
    lineJoin: 'round',
    backgroundColor: 'white',
  }
  gLastStrokeColor = gMemeSettings.strokeColor
  applyDrawSettings(ctx)
}

function applyDrawSettings(ctx) {
  if (!gMemeSettings || !ctx) return
  ctx.strokeStyle = gMemeSettings.strokeColor
  ctx.lineWidth = gMemeSettings.lineWidth
  ctx.lineCap = gMemeSettings.lineCap
  ctx.lineJoin = gMemeSettings.lineJoin
}

function setDrawSetting(key, value, ctx) {
  if (!gMemeSettings) gMemeSettings = {}
  gMemeSettings[key] = value
  // Update last color when strokeColor changes (unless eraser)
  if (key === 'strokeColor' && value !== gMemeSettings.backgroundColor) {
    gLastStrokeColor = value
  }
  if (ctx) applyDrawSettings(ctx)
}


function getDrawSettings() {
  return { ...gMemeSettings }
}



