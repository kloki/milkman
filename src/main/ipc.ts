import { ipcMain } from 'electron'
import { randomUUID } from 'crypto'
import { listModels, sendSystemOne } from './api'
import { addHistory, clearHistory, getSettings, listHistory, removeHistory, setSettings } from './store'
import type { HistoryEntry, Settings, SystemOneRequest } from '../shared/types'

export function registerIpc(): void {
  ipcMain.handle('milkman:send', (_e, apiKey: string, baseUrl: string, request: SystemOneRequest) =>
    sendSystemOne(apiKey, baseUrl, request)
  )

  ipcMain.handle('milkman:models', (_e, apiKey: string, baseUrl: string) => listModels(apiKey, baseUrl))

  ipcMain.handle('milkman:getSettings', (): Settings => getSettings())
  ipcMain.handle('milkman:setSettings', (_e, settings: Settings) => {
    setSettings(settings)
  })

  ipcMain.handle('milkman:history:list', () => listHistory())
  ipcMain.handle('milkman:history:add', (_e, entry: HistoryEntry) =>
    addHistory({ ...entry, id: randomUUID() })
  )
  ipcMain.handle('milkman:history:remove', (_e, id: string) => removeHistory(id))
  ipcMain.handle('milkman:history:clear', () => clearHistory())
}