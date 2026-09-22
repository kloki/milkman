import { contextBridge, ipcRenderer } from 'electron'
import type { MilkmanApi } from '../shared/types'

const api: MilkmanApi = {
  sendSystemOne: (apiKey, baseUrl, request) => ipcRenderer.invoke('milkman:send', apiKey, baseUrl, request),
  listModels: (apiKey, baseUrl) => ipcRenderer.invoke('milkman:models', apiKey, baseUrl),
  getSettings: () => ipcRenderer.invoke('milkman:getSettings'),
  setSettings: (settings) => ipcRenderer.invoke('milkman:setSettings', settings),
  listHistory: () => ipcRenderer.invoke('milkman:history:list'),
  addHistory: (entry) => ipcRenderer.invoke('milkman:history:add', entry),
  removeHistory: (id) => ipcRenderer.invoke('milkman:history:remove', id),
  clearHistory: () => ipcRenderer.invoke('milkman:history:clear')
}

contextBridge.exposeInMainWorld('milkman', api)