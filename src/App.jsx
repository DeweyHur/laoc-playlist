import { createClient } from '@supabase/supabase-js'
import { useState, useEffect } from 'react'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
)

function App() {
  const [links, setLinks] = useState([])
  const [newLink, setNewLink] = useState("")

  useEffect(() => {
    console.log('App mounted, fetching links...')
    fetchLinks()
  }, [])

  const fetchLinks = async () => {
    console.log('Fetching links from Supabase...')
    try {
      const { data, error } = await supabase.from('playlists').select('*').order('created_at', { ascending: false })
      if (error) {
        console.error('Error fetching links:', error)
        return
      }
      console.log('Links fetched successfully:', data)
      setLinks(data)
    } catch (err) {
      console.error('Unexpected error fetching links:', err)
    }
  }

  const addLink = async () => {
    if (!newLink) {
      console.log('No link provided, skipping add')
      return
    }
    console.log('Adding new link:', newLink)
    try {
      const { error } = await supabase.from('playlists').insert({ youtube_url: newLink, title: '곡 제목 (옵션)' })
      if (error) {
        console.error('Error adding link:', error)
        return
      }
      console.log('Link added successfully')
      setNewLink("")
      fetchLinks()
    } catch (err) {
      console.error('Unexpected error adding link:', err)
    }
  }

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">🎵 밴드방 유튜브 플레이리스트</h1>
      <div className="flex mb-4">
        <input value={newLink} onChange={e => setNewLink(e.target.value)} className="flex-1 border p-2 rounded" placeholder="유튜브 링크 붙여넣기" />
        <button onClick={addLink} className="ml-2 bg-blue-500 text-white px-4 py-2 rounded">추가</button>
      </div>
      {links.map(link => (
        <div key={link.id} className="mb-4">
          <iframe width="100%" height="200" src={`https://www.youtube.com/embed/${extractId(link.youtube_url)}`} frameBorder="0" allowFullScreen></iframe>
        </div>
      ))}
    </div>
  )
}

const extractId = (url) => {
  const match = url.match(/v=([^&]+)/)
  return match ? match[1] : ""
}

export default App