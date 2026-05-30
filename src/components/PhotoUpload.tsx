'use client'

import { useState, useEffect } from 'react'
import { Camera, Image as ImageIcon, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Props {
  projectId: string
  onUploadComplete?: (url: string) => void
}

export default function PhotoUpload({ projectId, onUploadComplete }: Props) {
  const [uploading, setUploading] = useState(false)
  const [photos, setPhotos] = useState<string[]>([])
  const [lightbox, setLightbox] = useState<string | null>(null)

  useEffect(() => {
    loadPhotos()
  }, [projectId])

  const loadPhotos = async () => {
    const { data } = await supabase.storage
      .from('project-photos')
      .list(projectId, { sortBy: { column: 'created_at', order: 'desc' } })

    if (data) {
      const urls = data.map(file => {
        const { data: { publicUrl } } = supabase.storage
          .from('project-photos')
          .getPublicUrl(`${projectId}/${file.name}`)
        return publicUrl
      })
      setPhotos(urls)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const fileName = `${projectId}/${Date.now()}.${ext}`

      const { error } = await supabase.storage
        .from('project-photos')
        .upload(fileName, file, { upsert: false })

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('project-photos')
        .getPublicUrl(fileName)

      setPhotos(prev => [publicUrl, ...prev])
      onUploadComplete?.(publicUrl)
    } catch (err) {
      console.error('Upload error:', err)
      alert('アップロードに失敗しました')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div className="bg-[#1A1D26] rounded-xl border border-[#2E3347] p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[#F0F2F8] font-semibold text-sm flex items-center gap-2">
          <span>📸</span> 現場写真
          {photos.length > 0 && (
            <span className="text-[#8B92A9] text-xs font-normal">({photos.length}枚)</span>
          )}
        </h3>
        <div className="flex gap-2">
          <label className={`flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-gray-900 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
            <Camera className="w-3.5 h-3.5" />
            撮影
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading}
            />
          </label>
          <label className={`flex items-center gap-1.5 bg-[#222639] hover:bg-[#2E3347] text-[#F0F2F8] px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border border-[#2E3347] transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
            <ImageIcon className="w-3.5 h-3.5" />
            ライブラリ
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      {uploading && (
        <div className="text-amber-400 text-xs mb-3 flex items-center gap-2">
          <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          アップロード中...
        </div>
      )}

      {photos.length > 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {photos.map((url, i) => (
            <button
              key={i}
              onClick={() => setLightbox(url)}
              className="aspect-square rounded-lg overflow-hidden border border-[#2E3347] hover:border-amber-500/50 transition-colors"
            >
              <img
                src={url}
                alt={`現場写真${i + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      ) : (
        !uploading && (
          <div className="text-center text-[#8B92A9] text-xs py-6">
            写真がありません
          </div>
        )
      )}

      {/* ライトボックス */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-amber-400 transition-colors"
            onClick={() => setLightbox(null)}
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={lightbox}
            alt="拡大表示"
            className="max-w-full max-h-full rounded-xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
