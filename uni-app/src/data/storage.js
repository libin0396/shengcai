export function getSaved(){try{const v=uni.getStorageSync('ainpe:saved');const a=typeof v==='string'?JSON.parse(v||'[]'):v;return Array.isArray(a)?a:[]}catch{return []}}
export function setSaved(items){uni.setStorageSync('ainpe:saved',items)}
export function getNotes(){try{const v=uni.getStorageSync('ainpe:notes');return (typeof v==='string'?JSON.parse(v||'{}'):v)||{}}catch{return {}}}
