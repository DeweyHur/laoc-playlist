import { useState, useEffect } from 'react'
import {
  Input,
  Title3,
  Text,
  makeStyles,
  tokens,
  Card,
  CardHeader,
  CardPreview,
  Button,
  Spinner,
} from '@fluentui/react-components'
import { createClient } from '@supabase/supabase-js'

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

const useStyles = makeStyles({
  root: {
    padding: tokens.spacingHorizontalL,
    maxWidth: '800px',
    margin: '0 auto',
  },
  inputGroup: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    marginBottom: tokens.spacingVerticalL,
  },
  videoCard: {
    marginBottom: tokens.spacingVerticalL,
  },
})

function HomePage() {
  const styles = useStyles()
  const [links, setLinks] = useState([])
  const [newLink, setNewLink] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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
      setLoading(false)
    } catch (err) {
      console.error('Unexpected error fetching links:', err)
      setLoading(false)
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
    return (
      <div className={styles.root}>
        <Spinner label="Loading..." />
      </div>
    )
  }

  return (
    <div className={styles.root}>
      <div className={styles.inputGroup}>
        <Input
          value={newLink}
          onChange={(e) => setNewLink(e.target.value)}
          placeholder="유튜브 링크 붙여넣기"
          style={{ flex: 1 }}
        />
        <Button appearance="primary" onClick={addLink}>
          추가
        </Button>
      </div>
      {links.map(link => (
        <Card key={link.id} className={styles.videoCard}>
          <CardHeader>
            <Text weight="semibold">{link.title}</Text>
          </CardHeader>
          <CardPreview>
            <iframe
              width="100%"
              height="200"
              src={`https://www.youtube.com/embed/${extractId(link.youtube_url)}`}
              frameBorder="0"
              allowFullScreen
            />
          </CardPreview>
        </Card>
      ))}
    </div>
  )
}

const extractId = (url) => {
  const match = url.match(/v=([^&]+)/)
  return match ? match[1] : ""
}

export default HomePage 