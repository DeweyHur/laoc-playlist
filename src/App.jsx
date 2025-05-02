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
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (user) {
      console.log('App mounted, fetching links...')
      fetchLinks()
    }
  }, [user])

  const handleKakaoLogin = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: {
          redirectTo: 'http://localhost:5173/auth/callback',
          queryParams: {
            client_id: import.meta.env.VITE_KAKAO_CLIENT_ID,
            client_secret: import.meta.env.VITE_KAKAO_CLIENT_SECRET,
            scope: 'account_email profile_nickname'
          }
        }
      })
      if (error) throw error
    } catch (error) {
      console.error('Error logging in with Kakao:', error.message)
    }
  }

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      console.error('Error logging out:', error.message)
    }
  }

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

  if (loading) {
    return <div className="p-4 text-center">Loading...</div>
  }

  if (!user) {
    return (
      <div className="p-4 max-w-xl mx-auto text-center">
        <h1 className="text-2xl font-bold mb-4">🎵 밴드방 유튜브 플레이리스트</h1>
        <p className="mb-4">로그인이 필요합니다</p>
        <button 
          onClick={handleKakaoLogin}
          className="bg-[#FEE500] text-[#000000] px-6 py-3 rounded-lg flex items-center justify-center mx-auto"
        >
          <img 
            src="https://developers.kakao.com/assets/img/about/logos/kakaotalksharing/kakaotalk_sharing_btn_medium.png" 
            alt="KakaoTalk" 
            className="w-6 h-6 mr-2"
          />
          카카오톡으로 로그인
        </button>
      </div>
    )
  }

  return (
    <div className="p-4 max-w-xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">🎵 밴드방 유튜브 플레이리스트</h1>
        <button 
          onClick={handleLogout}
          className="bg-gray-500 text-white px-4 py-2 rounded"
        >
          로그아웃
        </button>
      </div>
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